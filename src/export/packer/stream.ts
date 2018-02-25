import { Readable, Transform } from "stream";
import { File } from "../../file";
import { Compiler } from "./compiler";
import { IPacker } from "./packer";

class Pipe extends Transform {
    public _transform(chunk: Buffer | string, encoding: string, callback: () => void): void {
        this.push(chunk, encoding);
        callback();
    }
}

export class StreamPacker implements IPacker {
    private readonly compiler: Compiler;

    constructor(file: File) {
        this.compiler = new Compiler(file);
    }

    public pack(): Readable {
        const pipe = new Pipe();
        this.compiler.compile(pipe);
        return pipe;
    }
}
