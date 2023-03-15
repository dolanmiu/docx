import { expect } from "chai";
import * as sinon from "sinon";
import * as JSZip from "jszip";

import { TextRun } from "@file/paragraph";

import { patchDocument, PatchType } from "./from-docx";

describe("from-docx", () => {
    describe("patchDocument", () => {
        before(() => {
            sinon.createStubInstance(JSZip, {});
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sinon.stub(JSZip, "loadAsync").callsFake(
                () =>
                    new Promise<JSZip>((resolve) => {
                        const zip = new JSZip();

                        zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`);
                        resolve(zip);
                    }),
            );
        });

        after(() => {
            (JSZip.loadAsync as unknown as sinon.SinonStub).restore();
        });

        it("should find the index of a run element with a token", async () => {
            const output = await patchDocument(Buffer.from(""), {
                patches: {
                    name: {
                        type: PatchType.PARAGRAPH,
                        children: [new TextRun("Sir. "), new TextRun("John Doe"), new TextRun("(The Conqueror)")],
                    },
                },
            });
            expect(output).to.not.be.undefined;
        });
    });
});
