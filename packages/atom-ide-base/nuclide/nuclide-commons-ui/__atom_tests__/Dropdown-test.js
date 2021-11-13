/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow strict-local
 * @format
 * @emails oncall+nuclide
 */
import {Dropdown} from '../Dropdown';
import * as React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';

const {renderIntoDocument, scryRenderedDOMComponentsWithTag} = TestUtils;

describe('Dropdown', () => {
  it('honors the value param', () => {
    const component = renderIntoDocument(
      <Dropdown
        options={[{label: 'foo', value: 'vfoo'}, {label: 'bar', value: 'vbar'}]}
        onChange={newValue => {}}
        value={'vbar'}
      />,
    );

    const button = scryRenderedDOMComponentsWithTag(component, 'button');
    // $FlowFixMe
    expect(ReactDOM.findDOMNode(button[0]).innerText).toBe('bar');
  });
});
