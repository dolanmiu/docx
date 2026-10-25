import { Buffer as PlatformBuffer } from "buffer";
import { Stream as PlatformStream } from "stream";

import type { File } from "@file/file";

import type { IXmlifyedFile } from "./next-compiler";
import { EventPacker, type PackerPlatform, type PrettifyType } from "./packer-core";

export { PrettifyType } from "./packer-core";

/** Buffer and event-stream output for browser and legacy bundles. @publicApi */
export class Packer extends EventPacker {
    protected static override readonly platform: PackerPlatform = {
        createStream: () => new PlatformStream(),
        bufferFrom: (bytes) =>
            (typeof Buffer === "undefined" ? PlatformBuffer : Buffer).from(bytes.buffer, bytes.byteOffset, bytes.byteLength),
    };

    // Bind output helpers to this public class, including when callers detach them.
    public static override toString(
        file: File,
        prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType],
        overrides: readonly IXmlifyedFile[] = [],
    ): Promise<string> {
        return Packer.pack(file, "string", prettify, overrides);
    }

    public static override toBase64String(
        file: File,
        prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType],
        overrides: readonly IXmlifyedFile[] = [],
    ): Promise<string> {
        return Packer.pack(file, "base64", prettify, overrides);
    }

    public static override toBlob(
        file: File,
        prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType],
        overrides: readonly IXmlifyedFile[] = [],
    ): Promise<Blob> {
        return Packer.pack(file, "blob", prettify, overrides);
    }

    public static override toArrayBuffer(
        file: File,
        prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType],
        overrides: readonly IXmlifyedFile[] = [],
    ): Promise<ArrayBuffer> {
        return Packer.pack(file, "arraybuffer", prettify, overrides);
    }

    /** Exports a document as a Buffer. */
    public static toBuffer(
        file: File,
        prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType],
        overrides: readonly IXmlifyedFile[] = [],
    ): Promise<Buffer> {
        return Packer.pack(file, "nodebuffer", prettify, overrides);
    }
}
