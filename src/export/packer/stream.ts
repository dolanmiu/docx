// cspell:ignore Halliday ondrain
/**
 * @license MIT
 * Adapted from stream-browserify 3.0.0's base Stream and pipe implementation (MIT).
 * Copyright Joyent, Inc. and other Node contributors.
 * Copyright (c) James Halliday
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to permit
 * persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
 * NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/* eslint-disable prefer-arrow/prefer-arrow-functions -- Keep stream-browserify's hoisted pipe handlers. */
import { EventEmitter } from "events";

/** The legacy event stream used by Packer, without unused Readable/Writable implementations. */
export class Stream extends EventEmitter {
    public pipe<T extends NodeJS.WritableStream>(destination: T, options?: { readonly end?: boolean }): T {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const source: Stream & { readonly readable?: boolean; readonly pause?: () => void; readonly resume?: () => void } = this;
        const dest: T & { readonly _isStdio?: boolean; readonly destroy?: () => void } = destination;

        const ondata = (chunk: Uint8Array): void => {
            if (dest.writable) {
                if (false === dest.write(chunk) && source.pause) {
                    source.pause();
                }
            }
        };
        source.on("data", ondata);

        const ondrain = (): void => {
            if (source.readable && source.resume) {
                source.resume();
            }
        };
        dest.on("drain", ondrain);

        // eslint-disable-next-line no-underscore-dangle
        if (!dest._isStdio && (!options || options.end !== false)) {
            source.on("end", onend);
            source.on("close", onclose);
        }

        let didOnEnd = false;
        function onend(): void {
            if (didOnEnd) {
                return;
            }
            didOnEnd = true;
            dest.end();
        }

        function onclose(): void {
            if (didOnEnd) {
                return;
            }
            didOnEnd = true;
            if (typeof dest.destroy === "function") {
                dest.destroy();
            }
        }

        function onerror(this: EventEmitter, error: Error): void {
            cleanup();
            if (EventEmitter.listenerCount(this, "error") === 0) {
                throw error;
            }
        }
        source.on("error", onerror);
        dest.on("error", onerror);

        function cleanup(): void {
            source.removeListener("data", ondata);
            dest.removeListener("drain", ondrain);
            source.removeListener("end", onend);
            source.removeListener("close", onclose);
            source.removeListener("error", onerror);
            dest.removeListener("error", onerror);
            source.removeListener("end", cleanup);
            source.removeListener("close", cleanup);
            dest.removeListener("close", cleanup);
        }
        source.on("end", cleanup);
        source.on("close", cleanup);
        dest.on("close", cleanup);

        dest.emit("pipe", source);
        return dest;
    }
}
