import { CompositeDisposable, Disposable, Range, Point, TextEditor, TextEditorElement } from "atom"
import { ProviderRegistry } from "atom-ide-base/src-commons-atom/ProviderRegistry"
import { ViewContainer } from "atom-ide-base/src-commons-ui/float-pane/ViewContainer"
import { render } from "solid-js/web"
import { makeOverlaySelectable } from "atom-ide-base/src-commons-ui/float-pane/selectable-overlay"
import type { SignatureHelpRegistry, SignatureHelpProvider } from "atom-ide-base"

export class SignatureHelpManager {
  /** Holds a reference to disposable items from this data tip manager */
  subscriptions = new CompositeDisposable()
  /** Holds a list of registered data tip providers */
  providerRegistry = new ProviderRegistry<SignatureHelpProvider>()
  /** Holds a weak reference to all watched Atom text editors */
  watchedEditors = new WeakSet<TextEditor>()
  /** Holds a reference to the current watched Atom text editor */
  editor: TextEditor | null = null
  /** Holds a reference to the current watched Atom text editor viewbuffer */
  editorView: TextEditorElement | null = null
  /** Holds a reference to all disposable items for the current watched Atom text editor */
  editorSubscriptions: CompositeDisposable = new CompositeDisposable()
  /** Holds a reference to all disposable items for the current signature help */
  signatureHelpDisposables: CompositeDisposable = new CompositeDisposable()
  /** Config flag denoting if the signature help should be shown during typing automatically */
  showSignatureHelpOnTyping = true

  /** Initialization routine */
  initialize() {
    this.subscriptions.add(
      atom.workspace.observeTextEditors((editor) => {
        const disposable = this.watchEditor(editor)
        editor.onDidDestroy(() => disposable?.dispose())
      }),
      atom.commands.add("atom-text-editor", {
        "signature-help:show": async (evt) => {
          const editor = evt.currentTarget.getModel()
          if (atom.workspace.isTextEditor(editor)) {
            const provider = this.providerRegistry.getProviderForEditor(editor)
            const position = editor.getLastCursor().getBufferPosition()
            if (provider) {
              await this.showSignatureHelp(provider, editor, position)
            }
          }
        },
      }),
      atom.config.observe("atom-ide-signature-help.showSignatureHelpOnTyping", (toggleSwitch) => {
        this.showSignatureHelpOnTyping = toggleSwitch
        // forces update of internal editor tracking
        const editor = this.editor
        this.editor = null
        this.updateCurrentEditor(editor)
      })
    )
  }

  /** Dispose function to clean up any disposable references used */
  dispose() {
    this.signatureHelpDisposables.dispose()

    this.editorSubscriptions.dispose()

    this.subscriptions.dispose()
  }

  /** Returns the provider registry as a consumable service */
  get signatureHelpRegistry(): SignatureHelpRegistry {
    return (provider) => {
      return this.providerRegistry.addProvider(provider)
    }
  }

  /**
   * Checks and setups an Atom Text editor instance for tracking cursor/mouse movements
   *
   * @param editor A valid Atom Text editor instance
   */
  watchEditor(editor: TextEditor) {
    if (this.watchedEditors.has(editor)) {
      return
    }
    const editorView = atom.views.getView(editor)
    if (editorView.hasFocus()) {
      this.updateCurrentEditor(editor)
    }
    const focusListener = () => this.updateCurrentEditor(editor)
    editorView.addEventListener("focus", focusListener)
    const blurListener = () => this.unmountDataTip()
    editorView.addEventListener("blur", blurListener)

    const disposable = new Disposable(() => {
      editorView.removeEventListener("focus", focusListener)
      editorView.removeEventListener("blur", blurListener)
      if (this.editor === editor) {
        this.updateCurrentEditor(null)
      }
    })

    this.watchedEditors.add(editor)
    this.subscriptions.add(disposable)

    return new Disposable(() => {
      disposable.dispose()
      this.subscriptions.remove(disposable)
      this.watchedEditors.delete(editor)
    })
  }

  /**
   * Updates the internal references to a specific Atom Text editor instance in case it has been decided to track this instance
   *
   * @param editor The Atom Text editor instance to be tracked
   */
  updateCurrentEditor(editor: TextEditor | null) {
    if (editor === this.editor) {
      return
    }
    this.editorSubscriptions.dispose()

    // Stop tracking editor + buffer
    this.unmountDataTip()
    this.editor = null
    this.editorView = null

    if (!editor || !atom.workspace.isTextEditor(editor)) {
      return
    }

    this.editor = editor
    this.editorView = atom.views.getView(this.editor)

    this.editorSubscriptions = new CompositeDisposable()

    if (!this.showSignatureHelpOnTyping) {
      return
    }

    // @ts-ignore
    const editorElement: TextEditorElement = this.editor.getElement()
    editorElement.addEventListener("keydown", (evt) => {
      if (evt.key === "Escape") {
        this.unmountDataTip()
      }
    })

    this.editorSubscriptions.add(
      this.editor.getBuffer().onDidChangeText(async (evt) => {
        if (evt.changes.length !== 1) {
          return
        }

        const change = evt.changes[0]
        // Use the start of the current selection as the cursor position.
        // (Autocomplete often inserts a placeholder and puts the cursor at the end.)
        const cursorPosition = editor.getSelectedBufferRange().start

        if (
          change.newText.length === 0 ||
          // Don't allow multi-line changes.
          change.newRange.start.row !== change.newRange.end.row ||
          // The change should cover the current cursor position.
          !change.newRange.containsPoint(cursorPosition)
        ) {
          return this.unmountDataTip()
        }
        // Use the character before the cursor as the 'trigger character'.
        const index = Math.max(0, cursorPosition.column - change.newRange.start.column - 1)

        const provider = this.providerRegistry.getProviderForEditor(editor)

        if (!provider) {
          return
        }

        if (provider.triggerCharacters?.has(change.newText[index]) === true) {
          await this.showSignatureHelp(provider, editor, cursorPosition)
        }
      })
    )
  }

  /**
   * @param provider
   * @param editor
   * @param position
   */
  async showSignatureHelp(provider: SignatureHelpProvider, editor: TextEditor, position: Point) {
    try {
      const signatureHelp = await provider.getSignatureHelp(editor, position)

      if (!signatureHelp || signatureHelp.signatures.length === 0) {
        this.unmountDataTip()
      } else {
        const index = signatureHelp.activeSignature ?? 0
        const signature = signatureHelp.signatures[index]
        const paramIndex = signatureHelp.activeParameter ?? 0
        const parameter = signature.parameters !== undefined ? signature.parameters[paramIndex] : null

        // clear last data tip
        this.unmountDataTip()

        let doc = ""
        if (parameter) {
          let parameterDocumentation = ""
          // TODO documentation can be null. Update the types!
          if (parameter.documentation === undefined || parameter.documentation === null) {
            // parameterDocumentation = ""
          } else if (typeof parameter.documentation === "string") {
            parameterDocumentation = parameter.documentation
          } else if (typeof (parameter.documentation as { value: string }).value === "string") {
            // TODO undocumented type?
            parameterDocumentation = (parameter.documentation as { value: string }).value
          }
          doc = `<b>${parameter.label}</b> ${parameterDocumentation}`
        } else if (signature.documentation !== null && signature.documentation !== undefined) {
          let signatureDocumentation = ""
          if (typeof signature.documentation === "string") {
            signatureDocumentation = signature.documentation
          } else if (typeof (signature.documentation as { value: string }).value === "string") {
            // TODO undocumented type?
            signatureDocumentation = (signature.documentation as { value: string }).value
          }
          doc = signatureDocumentation
        }

        const grammar = editor.getGrammar().scopeName.toLowerCase()
        const element = document.createElement("div")
        element.className = "signature-element"
        render(
          () => (
            <ViewContainer
              snippet={{
                snippet: signature.label,
                grammarName: grammar,
                containerClassName: "signature-snippet-container",
                contentClassName: "signature-snippet",
              }}
              markdown={{
                markdown: doc,
                grammarName: grammar,
                containerClassName: "signature-markdown-container",
                contentClassName: "signature-markdown",
              }}
            />
          ),
          element
        )
        this.signatureHelpDisposables = mountSignatureHelp(editor, position, element)
      }
    } catch (err) {
      console.error(err)
    }
  }

  /** Unmounts / hides the most recent data tip view component */
  unmountDataTip() {
    this.signatureHelpDisposables.dispose()
  }
}

/**
 * Mounts displays a signature help view component at a specific position in a given Atom Text editor
 *
 * @param editor The Atom Text editor instance to host the data tip view
 * @param position The position on which to show the signature help view
 * @param view The signature help component to display
 * @returns A composite object to release references at a later stage
 */
function mountSignatureHelp(editor: TextEditor, position: Point, element: HTMLElement) {
  const disposables = new CompositeDisposable()
  const overlayMarker = editor.markBufferRange(new Range(position, position), {
    invalidate: "overlap", // TODO It was never. Shouldn't be surround?
  })

  makeOverlaySelectable(editor, element)

  const marker = editor.decorateMarker(overlayMarker, {
    type: "overlay",
    class: "signature-overlay",
    position: "head", // follows the cursor
    item: element,
  })

  //  TODO do this for some valid range
  // editor.onDidChangeCursorPosition(
  //   () => marker.destroy() // destroy the marker if user clicks somewhere else
  // )

  // move box above the current editing line
  // HACK: patch the decoration's style so it is shown above the current line
  setTimeout(() => {
    const overlay = element.parentElement
    if (!overlay) {
      return
    }
    const hight = element.getBoundingClientRect().height
    const lineHight = editor.getLineHeightInPixels()
    //@ts-ignore internal type
    const availableHight = (position.row - editor.getFirstVisibleScreenRow()) * lineHight
    if (hight < availableHight + 80) {
      overlay.style.transform = `translateY(-${lineHight + hight}px)`
    } else {
      // move right so it does not overlap with auto-complete-list
      // @ts-ignore
      const autoCompleteList = (editor.getElement() as TextEditorElement).querySelector("autocomplete-suggestion-list")
      if (autoCompleteList) {
        overlay.style.transform = `translateX(${autoCompleteList.clientWidth}px)`
      } else {
        overlay.style.transform = "translateX(300px)"
      }
    }
    element.style.visibility = "visible"
  }, 100)

  disposables.add(new Disposable(() => overlayMarker.destroy()), new Disposable(() => marker.destroy()))

  return disposables
}
