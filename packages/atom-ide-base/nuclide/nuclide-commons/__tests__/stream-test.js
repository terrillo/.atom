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
import {observeStream, observeRawStream, writeToStream} from '../stream';
import fsPromise from '../fsPromise';
import Stream from 'stream';
import fs from 'fs';
import path from 'path';

describe('commons-node/stream', () => {
  it('observeStream', async () => {
    const input = ['foo\nbar', '\n', '\nba', 'z', '\nblar'];
    const stream = new Stream.PassThrough();
    const promise = observeStream(stream)
      .toArray()
      .toPromise();
    input.forEach(value => {
      stream.write(value, 'utf8');
    });
    stream.end();
    const output = await promise;
    expect(output.join('')).toEqual(input.join(''));
  });

  it('observeStream - error', async () => {
    const stream = new Stream.PassThrough();
    const input = ['foo\nbar', '\n', '\nba', 'z', '\nblar'];
    const output = [];
    const promise = new Promise((resolve, reject) => {
      observeStream(stream).subscribe(
        v => output.push(v),
        e => resolve(e),
        () => {},
      );
    });
    const error = new Error('Had an error');

    input.forEach(value => {
      stream.write(value, 'utf8');
    });
    stream.emit('error', error);

    const result = await promise;
    expect(output).toEqual(input);
    expect(result).toBe(error);
  });

  it('writeToStream', async () => {
    const tempPath = await fsPromise.tempfile();
    const fixturePath = path.resolve(__dirname, '../__mocks__/fixtures/lyrics');
    const stream = fs.createWriteStream(tempPath, {highWaterMark: 10});
    // Read faster than we write to test buffering
    const observable = observeRawStream(
      fs.createReadStream(fixturePath, {highWaterMark: 100}),
    );

    await writeToStream(observable, stream).toPromise();

    const writtenFile = await fsPromise.readFile(tempPath);
    const fixtureFile = await fsPromise.readFile(fixturePath);
    expect(writtenFile).toEqual(fixtureFile);
  });
});
