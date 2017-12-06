import * as express from "express";

import { Document } from "../../docx/document";
import { Media } from "../../media";
import { Numbering } from "../../numbering";
import { Properties } from "../../properties";
import { Styles } from "../../styles";
import { Compiler } from "./compiler";
import { IPacker } from "./packer";

export class ExpressPacker implements IPacker {
    private res: express.Response;
    private packer: Compiler;

    constructor(document: Document, res: express.Response, styles?: Styles, properties?: Properties, numbering?: Numbering, media?: Media) {
        this.packer = new Compiler(document, styles, properties, numbering, media);

        this.res = res;

        this.res.on("close", () => {
            return res.status(200).send("OK").end();
        });
    }

    public pack(name: string): void {
        name = name.replace(/.docx$/, "");

        this.res.attachment(`${name}.docx`);
        this.packer.compile(this.res);
    }
}
