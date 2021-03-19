/* tslint:disable:typedef space-before-function-paren */
import { expect } from "chai";
import * as sinon from "sinon";

import { File, Footer, Header, Paragraph } from "file";

import { Compiler } from "./next-compiler";

describe("Compiler", () => {
    let compiler: Compiler;

    beforeEach(() => {
        compiler = new Compiler();
    });

    describe("#compile()", () => {
        it("should pack all the content", async function () {
            this.timeout(99999999);
            const file = new File({
                sections: [],
            });
            const zipFile = compiler.compile(file);
            const fileNames = Object.keys(zipFile.files).map((f) => zipFile.files[f].name);

            expect(fileNames).is.an.instanceof(Array);
            expect(fileNames).has.length(16);
            expect(fileNames).to.include("word/document.xml");
            expect(fileNames).to.include("word/styles.xml");
            expect(fileNames).to.include("docProps/core.xml");
            expect(fileNames).to.include("docProps/custom.xml");
            expect(fileNames).to.include("docProps/app.xml");
            expect(fileNames).to.include("word/numbering.xml");
            expect(fileNames).to.include("word/footnotes.xml");
            expect(fileNames).to.include("word/_rels/footnotes.xml.rels");
            expect(fileNames).to.include("word/settings.xml");
            expect(fileNames).to.include("word/_rels/document.xml.rels");
            expect(fileNames).to.include("[Content_Types].xml");
            expect(fileNames).to.include("_rels/.rels");
        });

        it("should pack all additional headers and footers", async function () {
            const file = new File({
                sections: [
                    {
                        headers: {
                            default: new Header(),
                        },
                        footers: {
                            default: new Footer(),
                        },
                        children: [],
                    },
                    {
                        headers: {
                            default: new Header(),
                        },
                        footers: {
                            default: new Footer(),
                        },
                        children: [],
                    },
                ],
            });

            this.timeout(99999999);

            const zipFile = compiler.compile(file);
            const fileNames = Object.keys(zipFile.files).map((f) => zipFile.files[f].name);

            expect(fileNames).is.an.instanceof(Array);
            expect(fileNames).has.length(24);

            expect(fileNames).to.include("word/header1.xml");
            expect(fileNames).to.include("word/_rels/header1.xml.rels");
            expect(fileNames).to.include("word/header2.xml");
            expect(fileNames).to.include("word/_rels/header2.xml.rels");
            expect(fileNames).to.include("word/footer1.xml");
            expect(fileNames).to.include("word/_rels/footer1.xml.rels");
            expect(fileNames).to.include("word/footer2.xml");
            expect(fileNames).to.include("word/_rels/footer2.xml.rels");
        });

        it("should call the format method X times equalling X files to be formatted", () => {
            // This test is required because before, there was a case where Document was formatted twice, which was inefficient
            // This also caused issues such as running prepForXml multiple times as format() was ran multiple times.
            const paragraph = new Paragraph("");
            const file = new File({
                sections: [
                    {
                        properties: {},
                        children: [paragraph],
                    },
                ],
            });

            // tslint:disable-next-line: no-string-literal
            const spy = sinon.spy(compiler["formatter"], "format");

            compiler.compile(file);
            expect(spy.callCount).to.equal(12);
        });
    });
});
