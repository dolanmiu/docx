import { Writable } from "stream";

export class BufferStream extends Writable {
    private data: Buffer[];

    constructor() {
        super();

        this.data = [];
    }

    // tslint:disable-next-line:no-any
    public _write(chunk: any, encoding: string, next: (err?: Error) => void): void {
        this.data.push(Buffer.from(chunk));
        next();
    }

    // tslint:disable-next-line:ban-types
    public end(cb?: Function): void {
        super.end(cb);

        this.emit("close");
    }

    public get Buffer(): Buffer {
        return Buffer.concat(this.data);
    }
}
