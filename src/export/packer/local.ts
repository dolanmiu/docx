import * as fs from "fs";

import { File } from "../../file";
import { Compiler } from "./compiler";
import { IPacker } from "./packer";

export class LocalPacker implements IPacker {
    private stream: fs.WriteStream;
    private readonly packer: Compiler;

    constructor(file: File) {
        this.packer = new Compiler(file);
    }

    public async pack(filePath: string): Promise<void> {
        filePath = filePath.replace(/.docx$/, "");

        this.stream = fs.createWriteStream(`${filePath}.docx`);
        await this.packer.compile(this.stream);
    }
}
