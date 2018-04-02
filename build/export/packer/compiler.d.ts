/// <reference types="archiver" />
/// <reference types="node" />
/// <reference types="express" />
import * as archiver from "archiver";
import * as express from "express";
import { Writable } from "stream";
import { File } from "../../file";
export declare class Compiler {
    private file;
    protected archive: archiver.Archiver;
    private formatter;
    constructor(file: File);
    compile(output: Writable | express.Response): Promise<void>;
}
