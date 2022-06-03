import { File } from "file";
import { Compiler } from "./next-compiler";

export class Packer {
    public static async toBuffer(file: File, prettify?: boolean): Promise<Buffer> {
        const zip = this.compiler.compile(file, prettify);
        const zipData = await zip.generateAsync({
            type: "nodebuffer",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            compression: "DEFLATE",
        });

        return zipData;
    }

    public static async toBase64String(file: File, prettify?: boolean): Promise<string> {
        const zip = this.compiler.compile(file, prettify);
        const zipData = await zip.generateAsync({
            type: "base64",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            compression: "DEFLATE",
        });

        return zipData;
    }

    public static async toBlob(file: File, prettify?: boolean): Promise<Blob> {
        const zip = this.compiler.compile(file, prettify);
        const zipData = await zip.generateAsync({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            compression: "DEFLATE",
        });

        return zipData;
    }

    public static toStream(file: File, prettify?: boolean): NodeJS.ReadableStream {
        const zip = this.compiler.compile(file, prettify);
        const zipData = zip.generateNodeStream({
            type: "nodebuffer",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            compression: "DEFLATE",
            streamFiles: true,
        });

        return zipData;
    }

    private static readonly compiler = new Compiler();
}
