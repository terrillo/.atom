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

import type {MessageProcessor} from './types';
import * as DebugProtocol from 'vscode-debugprotocol';

const TWO_CRLF = '\r\n\r\n';

/**
 * JSON-RPC protocol implementation over a read and write buffers.
 */
export default class V8Protocol {
  _id: string;
  _output: (input: string) => mixed;
  _sequence: number;
  _pendingRequests: Map<number, (e: DebugProtocol.Response) => void>;
  _rawData: Buffer;
  _contentLength: number;
  _logger: log4js$Logger;
  _sendPreprocessors: MessageProcessor[];
  _receivePreprocessors: MessageProcessor[];

  constructor(
    id: string,
    logger: log4js$Logger,
    sendPreprocessors: MessageProcessor[],
    receivePreprocessors: MessageProcessor[],
  ) {
    this._id = id;
    this._logger = logger;
    this._sendPreprocessors = sendPreprocessors;
    this._receivePreprocessors = receivePreprocessors;
    this._sequence = 1;
    this._contentLength = -1;
    this._pendingRequests = new Map();
    this._rawData = new Buffer(0);
  }

  getId(): string {
    return this._id;
  }

  onServerError(error: Error): void {
    throw new Error('No implementation found!');
  }

  onEvent(event: DebugProtocol.Event): void {
    throw new Error('No implementation found!');
  }

  async dispatchRequest(
    request: DebugProtocol.Request,
    response: DebugProtocol.Response,
  ): Promise<void> {
    throw new Error('No implementation found!');
  }

  setOutput(output: (input: string) => mixed): void {
    this._output = output;
  }

  send(command: string, args: any): Promise<DebugProtocol.Response> {
    return new Promise((resolve, reject) => {
      this._doSend(command, args, result => {
        if (result.success) {
          resolve(result);
        } else {
          reject(result);
        }
      });
    });
  }

  sendResponse(response: DebugProtocol.Response): void {
    if (response.seq > 0) {
      this._logger.error(
        `attempt to send more than one response for command ${
          response.command
        }`,
      );
    } else {
      this._sendMessage('response', response);
    }
  }

  _doSend(
    command: string,
    args: any,
    clb: (result: DebugProtocol.Response) => void,
  ): void {
    const request: any = {
      command,
    };
    if (args && Object.keys(args).length > 0) {
      request.arguments = args;
    }

    this._sendMessage('request', request);

    if (clb) {
      // store callback for this request
      this._pendingRequests.set(request.seq, clb);
    }
  }

  _sendMessage(
    typ: 'request' | 'response' | 'event',
    message: DebugProtocol.ProtocolMessage,
  ): void {
    message.type = (typ: any);
    message.seq = this._sequence++;

    this._sendPreprocessors.forEach(processor => processor(message));
    const json = JSON.stringify(message);
    const length = Buffer.byteLength(json, 'utf8');

    const packet = `Content-Length: ${length.toString()}${TWO_CRLF}${json}`;

    this._logger.info(`Sending: ${packet}`);

    this._output(packet);
  }

  handleData(data: Buffer): void {
    this._rawData = Buffer.concat([this._rawData, data]);
    while (true) {
      if (this._contentLength >= 0) {
        if (this._rawData.length >= this._contentLength) {
          const message = this._rawData.toString(
            'utf8',
            0,
            this._contentLength,
          );
          this._rawData = this._rawData.slice(this._contentLength);
          this._contentLength = -1;
          if (message.length > 0) {
            this._logger.info(`Received message: ${message}`);
            this._dispatch(message);
          }
          continue; // there may be more complete messages to process
        }
      } else {
        const s = this._rawData.toString('utf8', 0, this._rawData.length);
        const idx = s.indexOf(TWO_CRLF);
        if (idx !== -1) {
          const match = /Content-Length: (\d+)/.exec(s);
          if (match && match[1]) {
            this._contentLength = Number(match[1]);
            this._rawData = this._rawData.slice(idx + TWO_CRLF.length);
            continue; // try to handle a complete message
          }
        }
      }
      break;
    }
  }

  _dispatch(body: string): void {
    try {
      const rawData = JSON.parse(body);
      this._receivePreprocessors.forEach(processor => processor(rawData));

      switch (rawData.type) {
        case 'event':
          this.onEvent((rawData: DebugProtocol.Event));
          break;
        case 'response':
          const response: DebugProtocol.Response = rawData;
          const clb = this._pendingRequests.get(response.request_seq);
          if (clb) {
            this._pendingRequests.delete(response.request_seq);
            clb(response);
          }
          break;
        case 'request':
          const request: DebugProtocol.Request = rawData;
          const resp: DebugProtocol.Response = {
            type: 'response',
            seq: 0,
            command: request.command,
            request_seq: request.seq,
            success: true,
          };
          this.dispatchRequest(request, resp);
          break;
      }
    } catch (e) {
      this.onServerError(new Error(e.message || e));
    }
  }
}
