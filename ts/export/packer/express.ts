import * as express from "express";
import { Document } from "../../docx/document";
import { Media } from "../../media";
import { Numbering } from "../../numbering";
import { Properties } from "../../properties";
import { Styles } from "../../styles";
import { Packer } from "./packer";

export class ExpressPacker extends Packer {
    private res: express.Response;

    constructor(document: Document, res: express.Response, styles?: Styles, properties?: Properties, numbering?: Numbering, media?: Media) {
        super(document, styles, properties, numbering, media);
        this.res = res;

        this.res.on("close", () => {
            return res.status(200).send("OK").end();
        });
    }

    public pack(name: string): void {
        this.res.attachment(`${name}.docx`);
        super.pack(this.res);
    }
}
