import {Packer} from "./packer";
import * as fs from "fs";
import {Document} from "../../docx/document";
import {Properties} from "../../properties";
import {Numbering} from "../../numbering";

export class LocalPacker extends Packer {
    private stream: fs.WriteStream;

    constructor(document: Document, style: any, properties: Properties, path: string, numbering?: Numbering) {

        if (!numbering) {
            numbering = new Numbering();
        }

        super(document, style, properties, numbering);
        this.stream = fs.createWriteStream(path);
    }

    pack(): void {
        super.pack(this.stream);
    }
}