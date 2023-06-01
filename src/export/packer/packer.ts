import { Stream } from "stream";
import { File } from "@file/file";
import { strFromU8 } from "fflate";

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
        const zip = await this.compiler.compile(
            file,
            prettify === true ? PrettifyType.WITH_2_BLANKS : prettify === false ? undefined : prettify,
        );
        return strFromU8(zip);
    }

    public static async toBuffer(file: File, prettify?: boolean | PrettifyType): Promise<Buffer> {
        const zip = await this.compiler.compile(
            file,
            prettify === true ? PrettifyType.WITH_2_BLANKS : prettify === false ? undefined : prettify,
        );
        return Buffer.from(zip.buffer);
    }

    public static async toBase64String(file: File, prettify?: boolean | PrettifyType): Promise<string> {
        const zip = await this.compiler.compile(
            file,
            prettify === true ? PrettifyType.WITH_2_BLANKS : prettify === false ? undefined : prettify,
        );

        return Promise.resolve(strFromU8(zip));
    }

    public static async toBlob(file: File, prettify?: boolean | PrettifyType): Promise<Blob> {
        const zip = await this.compiler.compile(
            file,
            prettify === true ? PrettifyType.WITH_2_BLANKS : prettify === false ? undefined : prettify,
        );

        return new Blob([zip.buffer]);
    }

    public static toStream(file: File, prettify?: boolean | PrettifyType): Stream {
        const zip = this.compiler.compile(file, prettify === true ? PrettifyType.WITH_2_BLANKS : prettify === false ? undefined : prettify);

        const stream = new Stream();
        // eslint-disable-next-line functional/immutable-data
        stream.pipe = (dest) => {
            zip.then((z) => {
                dest.write(z);
            });
            return dest;
        };

        return stream;
    }

    private static readonly compiler = new Compiler();
}
