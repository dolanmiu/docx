/// <reference types="express" />
import * as express from "express";
import { File } from "../../file";
import { IPacker } from "./packer";
export declare class ExpressPacker implements IPacker {
    private readonly res;
    private readonly packer;
    constructor(file: File, res: express.Response);
    pack(name: string): Promise<void>;
}
