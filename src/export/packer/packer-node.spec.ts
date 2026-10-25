import { Buffer } from "node:buffer";
import { Stream } from "node:stream";
import { afterEach, describe, expect, it, vi } from "vitest";

import { File } from "@file/file";
import { Paragraph } from "@file/paragraph";

import { Compiler } from "./next-compiler";
import { Packer as NativePacker } from "./packer";
import { Packer as CompatiblePacker } from "./packer-compat";
import { textOf, unzip } from "../../tests/zip";

describe.each([
    { name: "native", Packer: NativePacker, native: true },
    { name: "compatible", Packer: CompatiblePacker, native: false },
])("$name event Packer", ({ name, Packer, native }) => {
    const document = (): File => new File({ sections: [{ children: [new Paragraph(`${name} 世界 😀`)] }] });

    afterEach(() => {
        vi.restoreAllMocks();
        // cspell:ignore unstub
        vi.unstubAllGlobals();
    });

    it.each([
        ["toString", "string"],
        ["toBase64String", "base64"],
        ["toBlob", "blob"],
        ["toArrayBuffer", "arraybuffer"],
        ["toBuffer", "nodebuffer"],
    ] as const)("delegates detached %s calls to the public pack method", (method, type) => {
        const file = document();
        const overrides = [{ path: "custom.xml", data: "<custom/>" }];
        const output = Promise.resolve("custom output");
        const pack = vi.spyOn(Packer, "pack").mockReturnValue(output);
        const detached = Packer[method];
        expect(detached(file, true, overrides)).toBe(output);
        expect(pack).toHaveBeenLastCalledWith(file, type, true, overrides);
        expect(pack.mock.contexts[0]).toBe(Packer);
        expect(detached(file)).toBe(output);
        expect(pack).toHaveBeenLastCalledWith(file, type, undefined, []);
    });

    it("exports Buffer and byte output without installing a global shim", async () => {
        const file = document();
        vi.stubGlobal("Buffer", undefined);
        const bytes = await Packer.toBuffer(file);
        if (native) {
            expect(Buffer.isBuffer(bytes)).toBe(true);
        }
        expect(typeof bytes.toString).toBe("function");
        expect(textOf(unzip(bytes), "word/document.xml")).toContain(`${name} 世界 😀`);
        expect(await Packer.pack(file, "uint8array")).toBeInstanceOf(Uint8Array);
        expect(globalThis.Buffer).toBeUndefined();
    });

    it("returns a full event stream and keeps the microtask listener window", async () => {
        const stream = Packer.toStream(document());
        if (native) {
            expect(stream).toBeInstanceOf(Stream);
        }
        expect(typeof stream.pipe).toBe("function");
        expect(typeof stream.on).toBe("function");
        await Promise.resolve();
        // eslint-disable-next-line functional/prefer-readonly-type
        const chunks: Buffer[] = [];
        await new Promise<void>((resolve, reject) => {
            stream.on("data", (bytes: Buffer) => {
                expect(Buffer.isBuffer(bytes)).toBe(true);
                // eslint-disable-next-line functional/immutable-data
                chunks.push(bytes);
            });
            stream.on("error", reject);
            stream.on("end", resolve);
        });
        expect(textOf(unzip(Buffer.concat(chunks)), "word/document.xml")).toContain(`${name} 世界 😀`);
    });

    it("keeps stream compilation throws synchronous and Buffer failures rejected", async () => {
        const error = new Error("Compilation failed");
        vi.spyOn(Compiler.prototype, "compile").mockImplementation(() => {
            throw error;
        });
        expect(() => Packer.toStream(document())).toThrow(error);
        await expect(Packer.toBuffer(document())).rejects.toBe(error);
    });
});
