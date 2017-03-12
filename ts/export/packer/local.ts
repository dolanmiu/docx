import * as fs from "fs";
import { Document } from "../../docx/document";
import { Numbering } from "../../numbering";
import { Properties } from "../../properties";
import { Styles } from "../../styles";
import { Packer } from "./packer";

export class LocalPacker extends Packer {
    private stream: fs.WriteStream;

    constructor(document: Document, styles?: Styles, properties?: Properties, numbering?: Numbering) {
        super(document, styles, properties, numbering);
    }

    public pack(path: string): void {
        path = path.replace(/.docx$/, "");
        this.stream = fs.createWriteStream(`${path}.docx`);
        super.pack(this.stream);
    }
}
