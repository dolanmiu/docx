import { File } from "../../file";
import { IPacker } from "./packer";
export declare class LocalPacker implements IPacker {
    private stream;
    private readonly pdfConverter;
    private readonly packer;
    constructor(file: File);
    pack(filePath: string): Promise<void>;
    packPdf(filePath: string): Promise<void>;
}
