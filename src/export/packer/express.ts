import * as express from "express";

import { File } from "../../file";
import { Compiler } from "./compiler";
import { IPacker } from "./packer";

export class ExpressPacker implements IPacker {
    private res: express.Response;
    private packer: Compiler;

    constructor(file: File, res: express.Response) {
        this.packer = new Compiler(file);

        this.res = res;

        this.res.on("close", () => {
            return res.status(200).send("OK").end();
        });
    }

    public async pack(name: string): Promise<void> {
        name = name.replace(/.docx$/, "");

        this.res.attachment(`${name}.docx`);
        await this.packer.compile(this.res);
    }
}
