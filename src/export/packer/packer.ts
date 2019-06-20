import { File } from "file";
import { Compiler } from "./next-compiler";

export class Packer {
    private readonly compiler: Compiler;

    constructor(prettifyXml?: boolean) {
        this.compiler = new Compiler(prettifyXml);
    }

    public async toBuffer(file: File): Promise<Buffer> {
        const zip = this.compiler.compile(file);
        const zipData = (await zip.generateAsync({
            type: "nodebuffer",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        })) as Buffer;

        return zipData;
    }

    public async toBase64String(file: File): Promise<string> {
        const zip = this.compiler.compile(file);
        const zipData = (await zip.generateAsync({
            type: "base64",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        })) as string;

        return zipData;
    }

    public async toBlob(file: File): Promise<Blob> {
        const zip = this.compiler.compile(file);
        const zipData = (await zip.generateAsync({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        })) as Blob;

        return zipData;
    }
}
