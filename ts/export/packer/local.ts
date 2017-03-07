import {Packer} from "./packer";
import * as fs from "fs";
import {Document} from "../../docx/document";
import {Properties} from "../../properties";
import {Numbering} from "../../numbering";

export class LocalPacker extends Packer {
    private stream: fs.WriteStream;

    constructor(document: Document, styles?: any, properties?: Properties, numbering?: Numbering) {
        super(document, styles, properties, numbering);
    }

    pack(path: string): void {
        this.stream = fs.createWriteStream(path);
        super.pack(this.stream);
    }
}