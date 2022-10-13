/* tslint:disable:typedef space-before-function-paren */
import { assert } from "chai";
import { mock, stub } from "sinon";

import { File } from "@file/file";
import { HeadingLevel, Paragraph } from "@file/paragraph";

import { Packer } from "./packer";

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

    describe("#toString()", () => {
        it("should return a non-empty string", async () => {
            const result = await Packer.toString(file);

            assert.isAbove(result.length, 0);
        });
    });

    describe("#toBuffer()", () => {
        it("should create a standard docx file", async function () {
            this.timeout(99999999);
            const buffer = await Packer.toBuffer(file);

            assert.isDefined(buffer);
            assert.isTrue(buffer.byteLength > 0);
        });

        it("should handle exception if it throws any", () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const compiler = stub((Packer as any).compiler, "compile");

            compiler.throwsException();
            return Packer.toBuffer(file).catch((error) => {
                assert.isDefined(error);
            });
        });

        after(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (Packer as any).compiler.compile.restore();
        });
    });

    describe("#toBase64String()", () => {
        it("should create a standard docx file", async function () {
            this.timeout(99999999);
            const str = await Packer.toBase64String(file);

            assert.isDefined(str);
            assert.isTrue(str.length > 0);
        });

        it("should handle exception if it throws any", () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const compiler = stub((Packer as any).compiler, "compile");

            compiler.throwsException();
            return Packer.toBase64String(file).catch((error) => {
                assert.isDefined(error);
            });
        });

        after(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (Packer as any).compiler.compile.restore();
        });
    });

    describe("#toBlob()", () => {
        it("should create a standard docx file", async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            stub((Packer as any).compiler, "compile").callsFake(() => ({
                // tslint:disable-next-line: no-empty
                generateAsync: () => mock({}),
            }));
            const str = await Packer.toBlob(file);

            assert.isDefined(str);
        });

        it("should handle exception if it throws any", () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const compiler = stub((Packer as any).compiler, "compile");

            compiler.throwsException();
            return Packer.toBlob(file).catch((error) => {
                assert.isDefined(error);
            });
        });

        afterEach(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (Packer as any).compiler.compile.restore();
        });
    });

    describe("#toStream()", () => {
        it("should create a standard docx file", async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            stub((Packer as any).compiler, "compile").callsFake(() => ({
                // tslint:disable-next-line: no-empty
                generateNodeStream: () => ({
                    on: (event: string, cb: () => void) => {
                        if (event === "end") {
                            cb();
                        }
                    },
                }),
            }));
            const stream = await Packer.toStream(file);
            return new Promise((resolve, reject) => {
                stream.on("error", () => {
                    reject(new Error());
                });

                stream.on("end", () => {
                    resolve();
                });
            });
        });

        it("should handle exception if it throws any", () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const compiler = stub((Packer as any).compiler, "compile").callsFake(() => ({
                // tslint:disable-next-line: no-empty
                on: (event: string, cb: () => void) => {
                    if (event === "error") {
                        cb();
                    }
                },
            }));

            compiler.throwsException();
            try {
                Packer.toStream(file);
            } catch (error) {
                assert.isDefined(error);
            }
        });

        afterEach(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (Packer as any).compiler.compile.restore();
        });
    });
});
