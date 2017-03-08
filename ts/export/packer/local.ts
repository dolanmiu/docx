import * as fs from "fs";
import { Document } from "../../docx/document";
import { Numbering } from "../../numbering";
import { Properties } from "../../properties";
import { Packer } from "./packer";


export class LocalPacker extends Packer {
    private stream: fs.WriteStream;

    constructor(document: Document, styles?: any, properties?: Properties, numbering?: Numbering) {
        super(document, styles, properties, numbering);
    }

    public pack(path: string): void {
        this.stream = fs.createWriteStream(path);
        super.pack(this.stream);
    }
}
