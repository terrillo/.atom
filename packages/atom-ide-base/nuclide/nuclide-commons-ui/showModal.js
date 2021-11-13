/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @format
 */

/* global Node */
/* global HTMLElement */

import invariant from 'assert';
import * as React from 'react';
import ReactDOM from 'react-dom';
import {Observable} from 'rxjs-compat/bundles/rxjs-compat.umd.min.js';
import UniversalDisposable from '@atom-ide-community/nuclide-commons/UniversalDisposable';

import TabbableContainer from './TabbableContainer';

/**
 * Given a function to dismiss the modal, return a React element for the content.
 * Call the function when e.g. the user clicks a Cancel or Submit button.
 */
type ContentFactory = ({
  dismiss(): void,
  element: Element,
}) => React.Node;

/** Wrap options in an object so we can add new ones later without an explosion of params */
type Options = {|
  /** Called when the modal is dismissed (just before it is destroyed). */
  onDismiss?: () => mixed,
  onOpen?: () => mixed,
  /**
   * Called when the user clicks outside the modal, return false to prevent dismissal.
   * If unspecified the modal will be dismissed if the user clicks outside the modal.
   */
  shouldDismissOnClickOutsideModal?: () => boolean,
  /**
   * Called when the user presses the escape key, return false to prevent dismissal.
   * If unspecified the modal will be dismissed if the user presses escape.
   */
  shouldDismissOnPressEscape?: () => boolean,
  /** Passed to atom's underlying addModalPanel function. */
  priority?: number,
  /** Passed to atom's underlying addModalPanel function. */
  className?: string,
|};

/**
 * Shows a modal dialog that renders a React element as its content.
 * The modal is automatically hidden when the user clicks outside of it, and on core:cancel (esc).
 * The modal panel unmounts its React component and destroys the panel as soon as it is hidden;
 * you may not hide the panel and then re-show it later.
 * Returns a disposable that you may use to hide and destroy the modal.
 */
export default function showModal(
  contentFactory: ContentFactory,
  options: Options = defaults,
): IDisposable {
  const hostElement = document.createElement('div');
  const atomPanel = atom.workspace.addModalPanel({
    item: hostElement,
    priority: options.priority,
    className: options.className,
  });
  const shouldDismissOnClickOutsideModal =
    options.shouldDismissOnClickOutsideModal || (() => true);
  const shouldDismissOnPressEscape =
    options.shouldDismissOnPressEscape || (() => true);

  const element = atomPanel.getElement();
  const previouslyFocusedElement = document.activeElement;
  const disposable = new UniversalDisposable(
    Observable.fromEvent(document, 'mousedown').subscribe(({target}) => {
      if (!shouldDismissOnClickOutsideModal()) {
        return;
      }
      invariant(target instanceof Node);
      if (
        !atomPanel.getItem().contains(target) &&
        // don't count clicks on notifications or tooltips as clicks 'outside'
        target.closest('atom-notifications, .tooltip') == null
      ) {
        atomPanel.hide();
      }
    }),
    atomPanel.onDidChangeVisible(visible => {
      if (!visible) {
        disposable.dispose();
      }
    }),
    atom.commands.add('body', 'core:cancel', () => {
      if (shouldDismissOnPressEscape()) {
        disposable.dispose();
      }
    }),
    () => {
      // Call onDismiss before unmounting the component and destroying the panel:
      if (options.onDismiss) {
        options.onDismiss();
      }
      ReactDOM.unmountComponentAtNode(hostElement);
      atomPanel.destroy();
      if (previouslyFocusedElement != null) {
        previouslyFocusedElement.focus();
      }
    },
  );

  ReactDOM.render(
    <ModalContainer>
      {contentFactory({dismiss: disposable.dispose.bind(disposable), element})}
    </ModalContainer>,
    hostElement,
    () => {
      if (options.onOpen) {
        options.onOpen();
      }
    },
  );

  return disposable;
}

/** Flow makes {} an unsealed object (eyeroll) */
const defaults: Options = Object.freeze({});

type Props = {
  children?: any,
};

/**
 * Just exists to provide a div that we can focus on mount. This ensures we steal focus from any
 * editors or other panes while the modal is present.
 */
class ModalContainer extends React.Component<Props> {
  render(): React.Node {
    return (
      <div tabIndex="-1">
        <TabbableContainer contained={true}>
          {this.props.children}
        </TabbableContainer>
      </div>
    );
  }

  componentDidMount(): void {
    const node = ReactDOM.findDOMNode(this);
    invariant(node instanceof HTMLElement);
    // Steal the focus away from any active editor or pane, setting it on the modal;
    // but don't steal focus away from a descendant. This can happen if a React element focuses
    // during its componentDidMount. For example, <AtomInput> does this since the underlying
    // <atom-text-editor> does not support the autofocus attribute.
    if (!node.contains(document.activeElement)) {
      node.focus();
    }
  }
}
