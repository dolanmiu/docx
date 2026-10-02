import { describe, expect, it, vi } from "vitest";
import { type Element, js2xml } from "xml-js";

import { fillTemplatePageNumbers } from "./page-numbers";
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
    it("should write the estimate into the fields of the body, headers and footers, and leave those it has no number for blank", () => {
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
                        // A field that doesn't show a page's number, and one whose instruction has no text, are left as they are
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

        fillTemplatePageNumbers(parts, estimator, binaryParts);

        expect(estimator).toHaveBeenCalledWith({ parts, binaryParts });
        expect(textOf(parts.get("word/document.xml")!)).to.equal("3|" + "4|3" + "7aboveempty" + "4" + "7" + "5");
        // The header is on the pages of both sections, which have different numbers of pages, and the footer on the second's
        expect(textOf(parts.get("word/header1.xml")!)).to.equal("4");
        expect(textOf(parts.get("word/footer1.xml")!)).to.equal("5");
    });

    it("should write the numbers of a document without headers and footers", () => {
        const parts = new Map([
            ["word/document.xml", toJson(`<w:document ${W}><w:body>${paragraph(field("NUMPAGES", "1"))}<w:sectPr/></w:body></w:document>`)],
        ]);
        fillTemplatePageNumbers(parts, () => ({ bookmarks: new Map(), pageCount: 2 }));
        expect(textOf(parts.get("word/document.xml")!)).to.equal("2");
    });

    it("should write page references and tables of contents clean, as a document's are with page numbers, and leave other fields dirty", () => {
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
        fillTemplatePageNumbers(parts, () => ({ bookmarks: new Map([["_Toc1", "3"]]) }));
        const document = js2xml(parts.get("word/document.xml")!);
        expect(document.match(/<w:fldChar [^>]*w:fldCharType="begin"[^>]*\/>/g)).to.deep.equal([
            '<w:fldChar w:fldCharType="begin"/>',
            '<w:fldChar w:fldCharType="begin"/>',
            '<w:fldChar w:fldCharType="begin" w:dirty="true"/>',
        ]);
        expect(textOf(parts.get("word/document.xml")!)).to.equal("3today");
    });

    it("should leave a package without its main document as it is", () => {
        const estimator = vi.fn(() => ({ bookmarks: new Map() }));
        fillTemplatePageNumbers(new Map(), estimator);
        expect(estimator).not.toHaveBeenCalled();
    });
});
