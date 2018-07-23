/// <reference types="node" />
import { File } from "../../file";
export declare class BufferPacker {
    private readonly packer;
    constructor(file: File);
    pack(): Promise<Buffer>;
}
