import { File } from "../../file";
import { BufferStream } from "./buffer-stream";
import { Compiler } from "./compiler";
import { IPacker } from "./packer";

export class BufferPacker implements IPacker {
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
