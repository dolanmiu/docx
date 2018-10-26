/* tslint:disable:typedef space-before-function-paren */
import { assert } from "chai";
import { stub } from "sinon";

import { File, Paragraph } from "file";

import { Packer } from "./packer";

describe("Packer", () => {
    let packer: Packer;
    let file: File;

    beforeEach(() => {
        file = new File({
            creator: "Dolan Miu",
            revision: "1",
            lastModifiedBy: "Dolan Miu",
        });
        const paragraph = new Paragraph("test text");
        const heading = new Paragraph("Hello world").heading1();

        file.addParagraph(new Paragraph("title").title());
        file.addParagraph(heading);
        file.addParagraph(new Paragraph("heading 2").heading2());
        file.addParagraph(paragraph);

        packer = new Packer();
    });

    describe("#toBuffer()", () => {
        it("should create a standard docx file", async function() {
            this.timeout(99999999);
            const buffer = await packer.toBuffer(file);

            assert.isDefined(buffer);
            assert.isTrue(buffer.byteLength > 0);
        });

        it("should handle exception if it throws any", () => {
            // tslint:disable-next-line:no-any
            const compiler = stub((packer as any).compiler, "compile");

            compiler.throwsException();
            return packer.toBuffer(file).catch((error) => {
                assert.isDefined(error);
            });
        });
    });
});
