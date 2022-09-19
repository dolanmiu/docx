import { Stream } from "stream";
import { File } from "@file/file";

import { Compiler } from "./next-compiler";

/**
 * Use blanks to prettify
 */
export enum PrettifyType {
    NONE = "",
    WITH_2_BLANKS = "  ",
    WITH_4_BLANKS = "    ",
    WITH_TAB = "\t",
}

export class Packer {
    public static async toString(file: File, prettify?: boolean | PrettifyType): Promise<string> {
        const zip = this.compiler.compile(file, prettify);
        const zipData = await zip.generateAsync({
            type: "string",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            compression: "DEFLATE",
        });

        return zipData;
    }

    public static async toBuffer(file: File, prettify?: boolean | PrettifyType): Promise<Buffer> {
        const zip = this.compiler.compile(file, prettify);
        const zipData = await zip.generateAsync({
            type: "nodebuffer",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            compression: "DEFLATE",
        });

        return zipData;
    }

    public static async toBase64String(file: File, prettify?: boolean | PrettifyType): Promise<string> {
        const zip = this.compiler.compile(file, prettify);
        const zipData = await zip.generateAsync({
            type: "base64",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            compression: "DEFLATE",
        });

        return zipData;
    }

    public static async toBlob(file: File, prettify?: boolean | PrettifyType): Promise<Blob> {
        const zip = this.compiler.compile(file, prettify);
        const zipData = await zip.generateAsync({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            compression: "DEFLATE",
        });

        return zipData;
    }

    public static toStream(file: File, prettify?: boolean | PrettifyType): Stream {
        const zip = this.compiler.compile(file, prettify);
        const zipData = zip.generateNodeStream({
            type: "nodebuffer",
            streamFiles: true,
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            compression: "DEFLATE",
        });

        return zipData;
    }

    private static readonly compiler = new Compiler();
}
