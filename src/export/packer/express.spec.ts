// tslint:disable:typedef space-before-function-paren
// tslint:disable:no-empty
// tslint:disable:no-any
import { assert } from "chai";
import { stub } from "sinon";

import { ExpressPacker } from "../../export/packer/express";
import { File, Paragraph } from "../../file";

describe("LocalPacker", () => {
    let packer: ExpressPacker;

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

        const expressResMock = {
            on: () => {},
            attachment: () => {},
        };

        packer = new ExpressPacker(file, expressResMock as any);
    });

    describe("#pack()", () => {
        it("should handle exception if it throws any", () => {
            const compiler = stub((packer as any).packer, "compile");
            compiler.throwsException();
            return packer.pack("build/tests/test").catch((error) => {
                assert.isDefined(error);
            });
        });
    });
});
