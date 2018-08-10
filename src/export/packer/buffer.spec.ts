/* tslint:disable:typedef space-before-function-paren */
import { assert } from "chai";
import { stub } from "sinon";

import { BufferPacker } from "../../export/packer/buffer";
import { File, Paragraph } from "../../file";

describe("BufferPacker", () => {
    let packer: BufferPacker;

    beforeEach(() => {
        const file = new File({
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

        packer = new BufferPacker(file);
    });

    describe("#pack()", () => {
        it("should create a standard docx file", async function() {
            this.timeout(99999999);
            const buffer = await packer.pack();
            assert.isDefined(buffer);
            assert.isTrue(buffer.byteLength > 0);
        });

        it("should handle exception if it throws any", () => {
            // tslint:disable-next-line:no-any
            const compiler = stub((packer as any).packer, "compile");
            compiler.throwsException();
            return packer.pack().catch((error) => {
                assert.isDefined(error);
            });
        });
    });
});
