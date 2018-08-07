import * as express from "express";

import { File } from "file";
import { Compiler } from "./compiler";
import { IPacker } from "./packer";

/**
 * @deprecated ExpressPacker is now deprecated. Please use the StreamPacker instead and pipe that to `express`' `res` object
 */
export class ExpressPacker implements IPacker {
    private readonly packer: Compiler;

    constructor(file: File, private readonly res: express.Response) {
        this.packer = new Compiler(file);

        this.res = res;

        this.res.on("close", () => {
            return res
                .status(200)
                .send("OK")
                .end();
        });
    }

    public async pack(name: string): Promise<void> {
        name = name.replace(/.docx$/, "");

        this.res.attachment(`${name}.docx`);
        await this.packer.compile(this.res);
    }
}
