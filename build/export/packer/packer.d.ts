/// <reference types="node" />
import { File } from "../../file";
export declare class Packer {
    static toBuffer(file: File, prettify?: boolean): Promise<Buffer>;
    static toBase64String(file: File, prettify?: boolean): Promise<string>;
    static toBlob(file: File, prettify?: boolean): Promise<Blob>;
    private static readonly compiler;
}
