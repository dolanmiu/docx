/// <reference types="node" />
import { Writable } from "stream";
export declare class BufferStream extends Writable {
    private data;
    constructor();
    _write(chunk: any, encoding: string, next: (err?: Error) => void): void;
    end(cb?: Function): void;
    readonly Buffer: Buffer;
}
