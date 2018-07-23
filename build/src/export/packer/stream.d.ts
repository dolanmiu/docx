/// <reference types="node" />
import { Readable } from "stream";
import { File } from "../../file";
import { IPacker } from "./packer";
export declare class StreamPacker implements IPacker {
    private readonly compiler;
    constructor(file: File);
    pack(): Readable;
}
