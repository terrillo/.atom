/** @babel */

import { isItemVisible, getItemElement } from "../commons-ui/items.js"
import type { TextEditor, WorkspaceOpenOptions, Dock } from "atom"
import { open, track, cleanup } from "temp"
import { Chance } from "chance"
const chance = new Chance()

async function openTempTextEditor(options: WorkspaceOpenOptions = {}) {
  const textEditor: TextEditor = await atom.workspace.open((await open()).path, {
    pending: true,
    ...options,
  })
  textEditor.setText(chance.sentence({ words: 20 }))
  await textEditor.save()
  spyOnProperty(textEditor.getElement(), "offsetHeight", "get").and.returnValue(1000)
  return textEditor
}

async function getGitDock() {
  const rightDock: Dock = atom.workspace.getRightDock()
  let gitItems = rightDock.getPaneItems()
  if (gitItems.length === 0) {
    await atom.workspace.getCenter().activate()
    const workspaceElement = atom.views.getView(atom.workspace)
    jasmine.attachToDOM(workspaceElement)
    if (!atom.packages.isPackageActive("github")) {
      atom.packages.enablePackage("github")
      await atom.packages.activatePackage("github")
    }
    await openTempTextEditor({ location: "center" })
    await atom.commands.dispatch(workspaceElement, "github:toggle-git-tab")
  }
  gitItems = rightDock.getPaneItems()
  expect(gitItems.length).toBe(2)
  return rightDock
}

describe("items", () => {
  beforeAll(() => {
    track()
  })

  describe("getItemElement", () => {
    it("gets the element of TextEditor", async () => {
      const textEditor = await openTempTextEditor()
      const textEditorElement = getItemElement(textEditor)
      expect(textEditorElement instanceof HTMLElement).toBeTrue()
      expect(textEditorElement.tagName).toBe("ATOM-TEXT-EDITOR")
    })
    it("gets the element of Git panes", async () => {
      const rightDock: Dock = await getGitDock()
      const rightDockItems: Array<object> = rightDock.getPaneItems()

      const gitElement = getItemElement(rightDockItems[0])
      expect(gitElement instanceof HTMLElement).toBeTrue()
      expect(gitElement.className).toBe("github-Git-root")

      const githubElement = getItemElement(rightDockItems[1])
      expect(githubElement instanceof HTMLElement).toBeTrue()
      expect(githubElement.className).toBe("github-GitHub-root")
    })
  })

  describe("isItemVisible", () => {
    describe("detects if the text editor is visible", () => {
      beforeEach(() => {
        atom.workspace.getTextEditors().forEach((editor) => editor.destroy())
      })

      it("if two text editors are opened in the center", async () => {
        // open first editor
        const textEditor1 = await openTempTextEditor()
        expect(atom.workspace.getActiveTextEditor()).toBe(textEditor1)

        expect(textEditor1.getElement().style.display).toBe("")
        expect(textEditor1.getElement().offsetHeight).toBe(1000)
        expect(isItemVisible(textEditor1)).toBe(true)

        // open second editor
        const textEditor2 = await openTempTextEditor()
        expect(atom.workspace.getActiveTextEditor()).toBe(textEditor2)

        // expect(textEditor1.getElement().style.display).toBe("none") // doesn't work in the test env, but works in reality
        expect(atom.workspace.paneContainerForItem(textEditor1)).toBe(undefined)
        expect(isItemVisible(textEditor1)).toBe(false)

        expect(textEditor2.getElement().style.display).toBe("")
        expect(textEditor2.getElement().offsetHeight).toBe(1000)
        expect(isItemVisible(textEditor2)).toBe(true)
      })

      it("if text editors are split", async () => {
        // open first editor
        const textEditor1 = await openTempTextEditor()
        expect(atom.workspace.getActiveTextEditor()).toBe(textEditor1)
        expect(textEditor1.getElement().style.display).toBe("")
        expect(isItemVisible(textEditor1)).toBe(true)

        // open second editor in the right
        const textEditor2 = await openTempTextEditor({ split: "right" })
        expect(atom.workspace.getActiveTextEditor()).toBe(textEditor2)

        expect(textEditor1.getElement().style.display).toBe("")
        expect(isItemVisible(textEditor1)).toBe(true)

        expect(textEditor2.getElement().style.display).toBe("")
        expect(isItemVisible(textEditor2)).toBe(true)
      })
    })

    describe("detects if the dock item is visible", () => {
      it("finds the visible tab among all the tabs in a dock pane", async () => {
        const rightDock: Dock = await getGitDock()
        const rightDockItems: Array<object> = rightDock.getPaneItems()

        const item1OffsetHeightSpy = spyOnProperty(rightDockItems[0].getElement(), "offsetHeight", "get")
        const item2OffsetHeightSpy = spyOnProperty(rightDockItems[1].getElement(), "offsetHeight", "get")

        // "detects hidden if the dock is closed"
        // hide the dock
        rightDock.hide()
        expect(atom.workspace.paneContainerForItem(rightDockItems[0]).isVisible()).toBe(false)
        expect(atom.workspace.paneContainerForItem(rightDockItems[1]).isVisible()).toBe(false)

        // despite having offsetHeight it is detected as hidden using `dock.isVisible`
        item1OffsetHeightSpy.and.returnValue(682)
        item2OffsetHeightSpy.and.returnValue(682)
        expect(isItemVisible(rightDockItems[0])).toBe(false)
        expect(isItemVisible(rightDockItems[1])).toBe(false)

        // "can detect using offsetHeight"
        // show the dock
        rightDock.show()
        expect(atom.workspace.paneContainerForItem(rightDockItems[0]).isVisible()).toBe(true)
        expect(atom.workspace.paneContainerForItem(rightDockItems[1]).isVisible()).toBe(true)

        // can detect using offsetHeight
        item1OffsetHeightSpy.and.returnValue(682)
        item2OffsetHeightSpy.and.returnValue(0) // hidden pane
        const visibleItems1 = rightDockItems.filter((item) => isItemVisible(item))
        expect(visibleItems1.length).toBe(1)
        expect(isItemVisible(rightDockItems[0])).toBe(true)
        expect(isItemVisible(rightDockItems[1])).toBe(false)

        // "can detect using display none"
        item1OffsetHeightSpy.and.returnValue(682)
        item2OffsetHeightSpy.and.returnValue(682)
        rightDockItems[1].getElement().style.display = "none" // hidden pane
        const visibleItems2 = rightDockItems.filter((item) => isItemVisible(item))
        expect(visibleItems2.length).toBe(1)
        expect(isItemVisible(rightDockItems[0])).toBe(true)
        expect(isItemVisible(rightDockItems[1])).toBe(false)
      })
    })
  })

  afterAll(async () => {
    await cleanup()
  })
})
