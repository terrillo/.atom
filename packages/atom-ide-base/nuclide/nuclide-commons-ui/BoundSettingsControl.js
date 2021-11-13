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

import SettingsControl from './SettingsControl';
import * as React from 'react';
import {track} from '@atom-ide-community/nuclide-commons/analytics';

type Props = {|
  keyPath: string,
  hideDetails?: boolean,
  onChangeCallback?: () => void,
|};

type State = {|
  value: any,
|};

export default class BoundSettingsControl extends React.Component<
  Props,
  State,
> {
  _observeConfigDisposable: ?IDisposable;

  constructor(props: Props) {
    super(props);
    this.state = {
      value: atom.config.get(props.keyPath),
    };
  }

  _updateSubscription(): void {
    if (this._observeConfigDisposable != null) {
      this._observeConfigDisposable.dispose();
    }
    this._observeConfigDisposable = atom.config.onDidChange(
      this.props.keyPath,
      ({newValue}) => {
        this.setState({value: newValue});
      },
    );
  }

  componentDidMount(): void {
    this._updateSubscription();
  }

  componentDidUpdate(prevProps: Props): void {
    if (prevProps.keyPath !== this.props.keyPath) {
      this.setState({value: atom.config.get(this.props.keyPath)});
      this._updateSubscription();
    }
  }

  componentWillUnmount(): void {
    if (this._observeConfigDisposable != null) {
      this._observeConfigDisposable.dispose();
    }
  }

  render(): React.Element<any> {
    const schema = atom.config.getSchema(this.props.keyPath);
    return (
      <SettingsControl
        keyPath={this.props.keyPath}
        title={schema.title}
        value={this.state.value}
        onChange={this._onChange}
        schema={schema}
        hideDetails={this.props.hideDetails}
      />
    );
  }

  _onChange = (value: any): void => {
    track('bound-settings-control-change', {
      keyPath: this.props.keyPath,
      value,
    });
    if (this.props.onChangeCallback != null) {
      this.props.onChangeCallback();
    }
    atom.config.set(this.props.keyPath, value);
  };
}
