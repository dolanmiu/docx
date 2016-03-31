import {Packer} from "./packer";
import * as fs from "fs";
import * as express from "express";

export class ExpressPacker extends Packer {
    private res: express.Response;

    constructor(res: express.Response) {
        super();
        this.res = res;

        this.res.on('close', () => {
            return res.status(200).send('OK').end();
        });
    }

    pack() {
        this.res.attachment(name + ".docx");
        super.pack(this.res);
    }
}