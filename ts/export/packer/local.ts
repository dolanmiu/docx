import * as fs from "fs";

import { Document } from "../../docx/document";
import { Media } from "../../media";
import { Numbering } from "../../numbering";
import { Properties } from "../../properties";
import { Styles } from "../../styles";
import { IPackOptions } from "./pack-options";
import { Packer } from "./packer";

export class LocalPacker extends Packer {
    private stream: fs.WriteStream;

    constructor(document: Document, styles?: Styles, properties?: Properties, numbering?: Numbering, media?: Media) {
        super(document, styles, properties, numbering, media);
    }

    public pack(path: string, options?: IPackOptions): void {
        path = path.replace(/.docx$/, "");
        this.stream = fs.createWriteStream(`${path}.docx`);
        super.compile(this.stream);
    }
}
