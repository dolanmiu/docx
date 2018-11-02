import { expect } from "chai";

import { Formatter } from "export/formatter";

import { File } from "./file";

describe("File", () => {
    describe("#constructor", () => {
        it("should create with correct headers", () => {
            const doc = new File();
            const header = doc.createHeader();
            const footer = doc.createFooter();

            doc.addSection({
                headers: {
                    default: header,
                },
                footers: {
                    default: footer,
                },
            });

            const tree = new Formatter().format(doc.Document.Body);

            expect(tree["w:body"][1]["w:sectPr"][4]["w:headerReference"][0]._attr["w:type"]).to.equal("default");
            expect(tree["w:body"][1]["w:sectPr"][5]["w:footerReference"][0]._attr["w:type"]).to.equal("default");
        });

        it("should create with correct headers", () => {
            const doc = new File();
            const header = doc.createHeader();
            const footer = doc.createFooter();

            doc.addSection({
                headers: {
                    default: header,
                    first: header,
                    even: header,
                },
                footers: {
                    default: footer,
                    first: footer,
                    even: footer,
                },
            });

            const tree = new Formatter().format(doc.Document.Body);

            expect(tree["w:body"][1]["w:sectPr"][4]["w:headerReference"][0]._attr["w:type"]).to.equal("default");
            expect(tree["w:body"][1]["w:sectPr"][5]["w:headerReference"][0]._attr["w:type"]).to.equal("first");
            expect(tree["w:body"][1]["w:sectPr"][6]["w:headerReference"][0]._attr["w:type"]).to.equal("even");

            expect(tree["w:body"][1]["w:sectPr"][7]["w:footerReference"][0]._attr["w:type"]).to.equal("default");
            expect(tree["w:body"][1]["w:sectPr"][8]["w:footerReference"][0]._attr["w:type"]).to.equal("first");
            expect(tree["w:body"][1]["w:sectPr"][9]["w:footerReference"][0]._attr["w:type"]).to.equal("even");
        });
    });
});
