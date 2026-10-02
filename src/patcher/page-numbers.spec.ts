import JSZip from "jszip";
import { describe, expect, it, vi } from "vitest";
import { type Element, js2xml } from "xml-js";

import { type PatchedTemplate, fillTemplatePageNumbers } from "./page-numbers";
import { toJson } from "./util";

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const R = 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
const RELATIONSHIPS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

/** A complex field, with the result Word wrote, and dirty if it is to be updated */
const field = (instruction: string, result: string, dirty = false): string =>
    `<w:r><w:fldChar w:fldCharType="begin"${dirty ? ' w:dirty="true"' : ""}/></w:r>` +
    `<w:r><w:instrText xml:space="preserve">${instruction}</w:instrText></w:r>` +
    '<w:r><w:fldChar w:fldCharType="separate"/></w:r>' +
    `<w:r><w:t>${result}</w:t></w:r>` +
    '<w:r><w:fldChar w:fldCharType="end"/></w:r>';

const paragraph = (...runs: readonly string[]): string => `<w:p>${runs.join("")}</w:p>`;

const sectionEnd = (references: string): string => `<w:p><w:pPr><w:sectPr>${references}</w:sectPr></w:pPr></w:p>`;

/** The text of a part, with each field's result where it is */
const textOf = (part: Element): string =>
    js2xml(part)
        .replace(/<w:instrText[^>]*>[^<]*<\/w:instrText>/g, "")
        .replace(/<w:t[^>]*>([^<]*)<\/w:t>|<w:t[^>]*\/>|<[^>]+>/g, "$1");

describe("fillTemplatePageNumbers", () => {
    it("should write the estimate into the fields of the body, headers and footers, and leave those it has no number for blank", async () => {
        const parts = new Map([
            [
                "word/document.xml",
                toJson(
                    `<w:document ${W} ${R}><w:body>${paragraph(
                        field(" PAGEREF _Toc1 \\h ", "2"),
                        "<w:r><w:t>|</w:t></w:r>",
                        field(" PAGEREF _Toc2 \\h ", "5"),
                    )}${
                        paragraph(field("NUMPAGES", "9"), "<w:r><w:t>|</w:t></w:r>", field("SECTIONPAGES", "8"))
                        // A field that doesn't show a page's number, and one whose instruction has no text, are left as they
                        // are, and a page reference with \p the estimate has nothing for is left blank
                    }${
                        paragraph(field("PAGE", "7"), field(" PAGEREF _Toc1 \\p ", "above"), field("", "empty"))
                        // A simple field's runs are its result
                    }${paragraph('<w:fldSimple w:instr="NUMPAGES"><w:r><w:t>9</w:t></w:r></w:fldSimple>')}${paragraph(
                        '<w:fldSimple w:instr="PAGE"><w:r><w:t>7</w:t></w:r></w:fldSimple>',
                        '<w:fldSimple w:instr="PAGE"/>',
                    )}<w:p/><w:p><w:pPr/></w:p>${sectionEnd('<w:headerReference w:type="default" r:id="rId1"/>')}${paragraph(
                        field("SECTIONPAGES", "1"),
                    )}<w:sectPr><w:footerReference w:type="default" r:id="rId2"/></w:sectPr>` + `</w:body></w:document>`,
                ),
            ],
            [
                "word/_rels/document.xml.rels",
                toJson(
                    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
                        `<Relationship Id="rId1" Type="${RELATIONSHIPS}/header" Target="header1.xml"/>` +
                        `<Relationship Id="rId2" Type="${RELATIONSHIPS}/footer" Target="/word/footer1.xml"/>` +
                        `<Relationship Id="rId3" Type="${RELATIONSHIPS}/footer" Target="missing.xml"/>` +
                        `<Relationship Id="rId4" Type="${RELATIONSHIPS}/styles" Target="styles.xml"/>` +
                        "</Relationships>",
                ),
            ],
            ["word/header1.xml", toJson(`<w:hdr ${W}>${paragraph(field("SECTIONPAGES", "1"), field("NUMPAGES", "1"))}</w:hdr>`)],
            ["word/footer1.xml", toJson(`<w:ftr ${W}>${paragraph(field("SECTIONPAGES", "1"))}</w:ftr>`)],
        ]);
        const estimator = vi.fn(() => ({ bookmarks: new Map([["_Toc1", "3"]]), pageCount: 4, sectionPageCounts: [3, 5] }));

        const binaryParts = new Map([["word/fonts/font1.odttf", new Uint8Array(4)]]);

        await fillTemplatePageNumbers(parts, estimator, binaryParts);

        expect(estimator).toHaveBeenCalledWith({ parts, binaryParts });
        expect(textOf(parts.get("word/document.xml")!)).to.equal("3|" + "4|3" + "7empty" + "4" + "7" + "5");
        // The header is on the pages of both sections, which have different numbers of pages, and the footer on the second's
        expect(textOf(parts.get("word/header1.xml")!)).to.equal("4");
        expect(textOf(parts.get("word/footer1.xml")!)).to.equal("5");
    });

    it("should write the numbers of a document without headers and footers", async () => {
        const parts = new Map([
            ["word/document.xml", toJson(`<w:document ${W}><w:body>${paragraph(field("NUMPAGES", "1"))}<w:sectPr/></w:body></w:document>`)],
        ]);
        await fillTemplatePageNumbers(parts, () => ({ bookmarks: new Map(), pageCount: 2 }));
        expect(textOf(parts.get("word/document.xml")!)).to.equal("2");
    });

    it("should write page references and tables of contents clean, as a document's are with page numbers, and leave other fields dirty", async () => {
        const parts = new Map([
            [
                "word/document.xml",
                toJson(
                    `<w:document ${W}><w:body>${paragraph(
                        field(' TOC \\o "1-3" \\h ', "", true),
                        field(" PAGEREF _Toc1 \\h ", "2", true),
                        field(" DATE ", "today", true),
                    )}</w:body></w:document>`,
                ),
            ],
        ]);
        await fillTemplatePageNumbers(parts, () => ({ bookmarks: new Map([["_Toc1", "3"]]) }));
        const document = js2xml(parts.get("word/document.xml")!);
        expect(document.match(/<w:fldChar [^>]*w:fldCharType="begin"[^>]*\/>/g)).to.deep.equal([
            '<w:fldChar w:fldCharType="begin"/>',
            '<w:fldChar w:fldCharType="begin"/>',
            '<w:fldChar w:fldCharType="begin" w:dirty="true"/>',
        ]);
        expect(textOf(parts.get("word/document.xml")!)).to.equal("3today");
    });

    it("should leave a package without its main document as it is", async () => {
        const estimator = vi.fn(() => ({ bookmarks: new Map() }));
        await fillTemplatePageNumbers(new Map(), estimator);
        expect(estimator).not.toHaveBeenCalled();
    });

    describe("documents the template imports", () => {
        /** A zip file of these files */
        const zipOf = (files: ReadonlyMap<string, string>): Promise<Uint8Array> => {
            const zip = new JSZip();
            for (const [path, text] of files) {
                zip.file(path, text);
            }
            return zip.generateAsync({ type: "uint8array" });
        };
        const relationships = (...targets: readonly (readonly [string, string, string?])[]): Element =>
            toJson(
                `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${targets
                    .map(
                        ([id, target, mode]) =>
                            `<Relationship Id="${id}" Type="${RELATIONSHIPS}/aFChunk" Target="${target}"${mode ? ` TargetMode="${mode}"` : ""}/>`,
                    )
                    .join("")}</Relationships>`,
            );

        it("should give the estimator each .docx the template imports, unzipped, with those they import in turn", async () => {
            const inner = await zipOf(new Map([["word/document.xml", `<w:document ${W}><w:body><w:p/></w:body></w:document>`]]));
            const outer = await zipOf(
                new Map([
                    ["word/document.xml", `<w:document ${W}><w:body><w:altChunk/></w:body></w:document>`],
                    ["word/_rels/document.xml.rels", js2xml(relationships(["rId1", "inner.docx"]))],
                    ["word/inner.docx", ""],
                    ["word/media/image1.png", "png"],
                    ["word/folder/", ""],
                ]),
            );
            // A zip file docx can't read, though it starts as one
            const damaged = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3]);
            const parts = new Map([
                ["word/document.xml", toJson(`<w:document ${W}><w:body/></w:document>`)],
                [
                    "word/_rels/document.xml.rels",
                    relationships(
                        ["rId1", "outer.docx"],
                        ["rId2", "page.html"],
                        ["rId3", "missing.docx"],
                        ["rId4", "https://example.com/a.docx", "External"],
                        ["rId5", "damaged.docx"],
                    ),
                ],
                ["word/_rels/header1.xml.rels", relationships(["rId1", "/word/header.docx"])],
            ]);
            const binaryParts = new Map([
                ["word/outer.docx", outer],
                ["word/header.docx", inner],
                ["word/page.html", new TextEncoder().encode("<p>Imported</p>")],
                ["word/damaged.docx", damaged],
            ]);
            const estimator = vi.fn((_: PatchedTemplate) => ({ bookmarks: new Map() }));

            await fillTemplatePageNumbers(parts, estimator, binaryParts);

            const { importedDocuments } = estimator.mock.calls[0][0];
            expect([...importedDocuments!.keys()]).to.deep.equal(["word/outer.docx", "word/header.docx"]);
            const read = importedDocuments!.get("word/outer.docx")!;
            expect([...read.parts.keys()]).to.deep.equal(["word/document.xml", "word/_rels/document.xml.rels"]);
            expect(new TextDecoder().decode(read.binaryParts!.get("word/media/image1.png"))).to.equal("png");
            // The .docx it imports, which is empty, so can't be read
            expect(read.importedDocuments).to.equal(undefined);
            expect([...importedDocuments!.get("word/header.docx")!.parts.keys()]).to.deep.equal(["word/document.xml"]);
        });

        it("should read a .docx a .docx the template imports imports", async () => {
            const inner = await zipOf(new Map([["word/document.xml", `<w:document ${W}><w:body><w:p/></w:body></w:document>`]]));
            const outer = new JSZip();
            outer.file("word/document.xml", `<w:document ${W}><w:body><w:altChunk/></w:body></w:document>`);
            outer.file("word/_rels/document.xml.rels", js2xml(relationships(["rId1", "inner.docx"])));
            outer.file("word/inner.docx", inner);
            const parts = new Map([
                ["word/document.xml", toJson(`<w:document ${W}><w:body/></w:document>`)],
                ["word/_rels/document.xml.rels", relationships(["rId1", "outer.docx"])],
            ]);
            const estimator = vi.fn((_: PatchedTemplate) => ({ bookmarks: new Map() }));

            await fillTemplatePageNumbers(
                parts,
                estimator,
                new Map([["word/outer.docx", await outer.generateAsync({ type: "uint8array" })]]),
            );

            const read = estimator.mock.calls[0][0].importedDocuments!.get("word/outer.docx")!;
            expect([...read.importedDocuments!.keys()]).to.deep.equal(["word/inner.docx"]);
        });
    });
});
