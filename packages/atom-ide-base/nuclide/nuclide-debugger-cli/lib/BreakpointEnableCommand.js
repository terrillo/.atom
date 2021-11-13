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
 */

import type Breakpoint from './Breakpoint';
import type {Command} from './Command';
import type {ConsoleIO} from './ConsoleIO';
import type {DebuggerInterface} from './DebuggerInterface';

import {breakpointFromArgList} from './BreakpointCommandUtils';
import TokenizedLine from './TokenizedLine';

export default class BreakpointEnableCommand implements Command {
  name = 'enable';
  helpText =
    "[index | 'all']: enables a breakpoint, or all breakpoints. With no arguments, enables the current breakpoint.";

  _console: ConsoleIO;
  _debugger: DebuggerInterface;

  constructor(con: ConsoleIO, debug: DebuggerInterface) {
    this._debugger = debug;
  }

  async execute(line: TokenizedLine): Promise<void> {
    const bpt: ?Breakpoint = breakpointFromArgList(
      this._debugger,
      line.stringTokens().slice(1),
      this.name,
    );

    if (bpt == null) {
      await this._debugger.setAllBreakpointsEnabled(true);
      this._console.outputLine('All breakpoins enabled.');
      return;
    }

    await this._debugger.setBreakpointEnabled(bpt, true);
    this._console.outputLine(`Breakpoint #${bpt.index} enabled.`);
  }
}
