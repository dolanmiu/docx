import { File } from "../../file";
import { BufferStream } from "./buffer-stream";
import { Compiler } from "./compiler";

export class BufferPacker {
    private readonly packer: Compiler;

    constructor(file: File) {
        this.packer = new Compiler(file);
    }

    public async pack(): Promise<Buffer> {
        const stream = new BufferStream();

        await this.packer.compile(stream);

        return stream.Buffer;
    }
}
