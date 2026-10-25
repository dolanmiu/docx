import { ReadableStream as WebReadableStream } from "node:stream/web";
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import { File } from "@file/file";
import { Paragraph } from "@file/paragraph";
import type { OutputType } from "@util/output-type";

import { Compiler } from "./next-compiler";
import { Packer, PrettifyType } from "./packer-browser";
import { textOf, unzip } from "../../tests/zip";

describe("browser Packer", () => {
    beforeEach(() => {
        vi.stubGlobal("ReadableStream", WebReadableStream);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        // cspell:ignore unstub
        vi.unstubAllGlobals();
    });

    const document = (): File => new File({ sections: [{ children: [new Paragraph("Browser 世界 😀")] }] });

    it("only accepts portable output formats", () => {
        expectTypeOf<Parameters<typeof Packer.pack>[1]>().toEqualTypeOf<Exclude<OutputType, "nodebuffer">>();
    });

    it.each([{ overrides: undefined }, { overrides: [{ path: "custom.xml", data: "<custom/>" }] }])(
        "exports portable document formats with $overrides",
        async ({ overrides }) => {
            const file = document();
            const outputs = [
                new Uint8Array(await (await Packer.toBlob(file, true, overrides)).arrayBuffer()),
                new Uint8Array(await Packer.toArrayBuffer(file, true, overrides)),
                Uint8Array.from(await Packer.toString(file, true, overrides), (char) => char.charCodeAt(0)),
                Uint8Array.from(atob(await Packer.toBase64String(file, true, overrides)), (char) => char.charCodeAt(0)),
            ];
            for (const bytes of outputs) {
                const archive = unzip(bytes);
                expect(textOf(archive, "word/document.xml")).toContain("Browser 世界 😀");
                if (overrides) {
                    expect(textOf(archive, "custom.xml")).toBe("<custom/>");
                }
            }
        },
    );

    it("exports a Web Stream containing a readable document", async () => {
        const reader = Packer.toStream(document()).getReader();
        const first = await reader.read();
        expect(first.done).toBe(false);
        expect(textOf(unzip(first.value!), "word/document.xml")).toContain("Browser 世界 😀");
        expect(await reader.read()).toEqual({ done: true, value: undefined });
        expect("toBuffer" in Packer).toBe(false);
    });

    it("forwards formatting and overrides", async () => {
        const file = document();
        const overrides = [{ path: "custom.xml", data: "<custom/>" }];
        const spy = vi.spyOn(Packer, "pack").mockResolvedValue(new Uint8Array());
        await Packer.toStream(file, PrettifyType.WITH_TAB, overrides).getReader().read();
        expect(spy).toHaveBeenCalledWith(file, "uint8array", PrettifyType.WITH_TAB, overrides);
    });

    it("rejects reads when compilation fails", async () => {
        const error = new Error("compilation failed");
        vi.spyOn(Compiler.prototype, "compile").mockImplementation(() => {
            throw error;
        });
        await expect(Packer.toStream(document()).getReader().read()).rejects.toBe(error);
    });

    it("does not enqueue after cancellation", async () => {
        let finish!: (bytes: Uint8Array) => void;
        const generation = new Promise<Uint8Array>((resolve) => {
            finish = resolve;
        });
        vi.spyOn(Packer, "pack").mockReturnValue(generation);
        const reader = Packer.toStream(document()).getReader();
        await reader.cancel();
        finish(new Uint8Array([1, 2, 3]));
        await generation;
        expect(await reader.read()).toEqual({ done: true, value: undefined });
    });

    it("handles generation failures after cancellation", async () => {
        let fail!: (error: Error) => void;
        const generation = new Promise<Uint8Array>((_, reject) => {
            fail = reject;
        });
        vi.spyOn(Packer, "pack").mockReturnValue(generation);
        const reader = Packer.toStream(document()).getReader();
        await reader.cancel();
        fail(new Error("generation failed"));
        await Promise.resolve();
        expect(await reader.read()).toEqual({ done: true, value: undefined });
    });
});
