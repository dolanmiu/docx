import { afterEach, assert, beforeEach, describe, expect, it, vi } from "vitest";

import { File } from "@file/file";
import { HeadingLevel, Paragraph } from "@file/paragraph";

import { Packer, PrettifyType } from "./packer";

// How a zip file, such as a .docx, starts
const ZIP_START = Uint8Array.of(0x50, 0x4b, 0x03, 0x04);

describe("Packer", () => {
    let file: File;

    beforeEach(() => {
        file = new File({
            creator: "Dolan Miu",
            revision: 1,
            lastModifiedBy: "Dolan Miu",
            sections: [
                {
                    children: [
                        new Paragraph({
                            text: "title",
                            heading: HeadingLevel.TITLE,
                        }),
                        new Paragraph({
                            text: "Hello world",
                            heading: HeadingLevel.HEADING_1,
                        }),
                        new Paragraph({
                            text: "heading 2",
                            heading: HeadingLevel.HEADING_2,
                        }),
                        new Paragraph("test text"),
                    ],
                },
            ],
        });
    });

    describe("prettify", () => {
        afterEach(() => {
            vi.restoreAllMocks();
        });

        it("should use a default prettify value", async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const spy = vi.spyOn((Packer as any).compiler, "compile");

            await Packer.toString(file, true);

            expect(spy).toHaveBeenCalledWith(expect.anything(), PrettifyType.WITH_2_BLANKS, expect.anything());
        });

        it("should use a prettify value", async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const spy = vi.spyOn((Packer as any).compiler, "compile");

            await Packer.toString(file, PrettifyType.WITH_4_BLANKS);

            expect(spy).toHaveBeenCalledWith(expect.anything(), PrettifyType.WITH_4_BLANKS, expect.anything());
        });

        it("should use an undefined prettify value", async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const spy = vi.spyOn((Packer as any).compiler, "compile");

            await Packer.toString(file, false);

            expect(spy).toHaveBeenCalledWith(expect.anything(), undefined, expect.anything());
        });
    });

    describe("overrides", () => {
        afterEach(() => {
            vi.restoreAllMocks();
        });

        it("should use an overrides value", async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const spy = vi.spyOn((Packer as any).compiler, "compile");
            const overrides = [{ path: "word/comments.xml", data: "comments" }];

            await Packer.toString(file, true, overrides);

            expect(spy).toHaveBeenCalledWith(expect.anything(), expect.anything(), overrides);
        });

        it("should use a default overrides value", async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const spy = vi.spyOn((Packer as any).compiler, "compile");

            await Packer.toString(file);

            expect(spy).toHaveBeenCalledWith(expect.anything(), undefined, []);
        });
    });

    describe("#toString()", () => {
        it("should return a non-empty string", async () => {
            const result = await Packer.toString(file);

            assert.isAbove(result.length, 0);
        });
    });

    describe("#toBuffer()", () => {
        it("should create a standard docx file", { timeout: 99999999 }, async () => {
            const buffer = await Packer.toBuffer(file);

            assert.isDefined(buffer);
            assert.isTrue(buffer.byteLength > 0);
        });

        it("should handle exception if it throws any", () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.spyOn((Packer as any).compiler, "compile").mockImplementation(() => {
                throw new Error();
            });

            return Packer.toBuffer(file).catch((error) => {
                assert.isDefined(error);
            });
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });
    });

    describe("#toBase64String()", () => {
        it("should create a standard docx file", { timeout: 99999999 }, async () => {
            const str = await Packer.toBase64String(file);
            expect(str).toBeDefined();
            expect(str.length).toBeGreaterThan(0);
        });

        it("should handle exception if it throws any", () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.spyOn((Packer as any).compiler, "compile").mockImplementation(() => {
                throw new Error();
            });

            return Packer.toBase64String(file).catch((error) => {
                assert.isDefined(error);
            });
        });

        afterEach(() => {
            vi.resetAllMocks();
        });
    });

    describe("#toBlob()", () => {
        it("should give a document the type of a .docx", async () => {
            expect((await Packer.toBlob(file)).type).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        });

        it("should give a document with macros the type of a .docm", async () => {
            const project = Uint8Array.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0x00]);
            const blob = await Packer.toBlob(new File({ sections: [], macros: { project } }));

            // A blob's type is in lower case
            expect(blob.type).toBe("application/vnd.ms-word.document.macroenabled.12");
        });

        it("should create a standard docx file", async () => {
            const blob = await Packer.toBlob(file);

            expect(new Uint8Array(await blob.arrayBuffer()).subarray(0, 4)).toEqual(ZIP_START);
        });

        it("should handle exception if it throws any", () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.spyOn((Packer as any).compiler, "compile").mockImplementation(() => {
                throw new Error();
            });

            return Packer.toBlob(file).catch((error) => {
                assert.isDefined(error);
            });
        });

        afterEach(() => {
            vi.resetAllMocks();
        });
    });

    describe("#toArrayBuffer()", () => {
        it("should create a standard docx file", async () => {
            const buffer = await Packer.toArrayBuffer(file);

            expect(buffer).toBeInstanceOf(ArrayBuffer);
            expect(new Uint8Array(buffer).subarray(0, 4)).toEqual(ZIP_START);
        });

        it("should handle exception if it throws any", () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.spyOn((Packer as any).compiler, "compile").mockImplementation(() => {
                throw new Error();
            });

            return Packer.toArrayBuffer(file).catch((error) => {
                assert.isDefined(error);
            });
        });

        afterEach(() => {
            vi.resetAllMocks();
        });
    });

    describe("#toStream()", () => {
        it("should create a standard docx file", async () => {
            const stream = Packer.toStream(file);

            const data = await new Promise<Buffer>((resolve, reject) => {
                stream.on("error", () => {
                    reject(new Error());
                });

                stream.on("data", resolve);
            });
            expect(Buffer.isBuffer(data)).toBe(true);
            expect(new Uint8Array(data.subarray(0, 4))).toEqual(ZIP_START);
        });

        it("should give the document after the caller has had the chance to listen, even after awaiting", async () => {
            const stream = Packer.toStream(file);
            await Promise.resolve();

            await new Promise<void>((resolve) => {
                stream.on("end", resolve);
            });
        });

        it("should throw when the document can't be written, rather than give a stream", () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.spyOn((Packer as any).compiler, "compile").mockImplementation(() => {
                throw new Error("The document can't be written");
            });

            expect(() => Packer.toStream(file)).toThrow("The document can't be written");
        });

        it("should emit an error where there's no Buffer, as in a browser, rather than reject where nothing can catch it", async () => {
            vi.stubGlobal("Buffer", undefined);
            const stream = Packer.toStream(file);
            const data = vi.fn();
            const end = vi.fn();
            stream.on("data", data);
            stream.on("end", end);

            const error = await new Promise<Error>((resolve) => {
                stream.on("error", resolve);
            });
            expect(error.message).toBe("nodebuffer is not supported by this platform");
            expect(data).not.toHaveBeenCalled();
            expect(end).not.toHaveBeenCalled();
        });

        afterEach(() => {
            vi.resetAllMocks();
            vi.unstubAllGlobals();
        });
    });
});
