// cspell:ignore descr
import { describe, expect, it } from "vitest";

import type { XmlElement as Element } from "@util/xml";

import { traverse } from "./traverser";
import { trimPlaceholders } from "./trim-placeholders";
import { toJson } from "./util";

// Trims the placeholders in a document with this body, and returns it
const trim = (
    body: string,
    {
        textKeys = [],
        tableRowsKeys = [],
        drawingKeys = [],
        delimiters = { start: "{{", end: "}}" },
    }: {
        readonly textKeys?: readonly string[];
        readonly tableRowsKeys?: readonly string[];
        readonly drawingKeys?: readonly string[];
        readonly delimiters?: { readonly start: string; readonly end: string };
    },
): Element => {
    const json = toJson(`<w:document><w:body>${body}</w:body></w:document>`);
    trimPlaceholders(json, { delimiters, textKeys: new Set(textKeys), tableRowsKeys, drawingKeys: new Set(drawingKeys) });
    return json;
};

const paragraph = (...texts: readonly string[]): string =>
    `<w:p>${texts.map((text) => `<w:r><w:t xml:space="preserve">${text}</w:t></w:r>`).join("")}</w:p>`;
const textsOf = (json: Element): readonly string[] => traverse(json).map((p) => p.text);
const runTextsOf = (json: Element): readonly string[] => traverse(json).flatMap((p) => p.runs.map((run) => run.text));

describe("trimPlaceholders", () => {
    it("should take the spaces inside the delimiters out of a patch's placeholder, on either side", () => {
        const json = trim(paragraph("{{ name }}, {{name }}, {{ name}}, {{   name   }} and {{name}}"), { textKeys: ["name"] });

        expect(textsOf(json)).to.deep.equal(["{{name}}, {{name}}, {{name}}, {{name}} and {{name}}"]);
    });

    it("should take out any whitespace, such as tabs and non-breaking spaces", () => {
        const json = trim(paragraph("{{\tname }}"), { textKeys: ["name"] });

        expect(textsOf(json)).to.deep.equal(["{{name}}"]);
    });

    it("should leave the placeholder in its first run when it is split across runs, keeping the text around it", () => {
        const json = trim(paragraph("Dear {{ ", "name", " }}, hello"), { textKeys: ["name"] });

        expect(runTextsOf(json)).to.deep.equal(["Dear {{name}}", "", ", hello"]);
    });

    it("should keep the spaces inside a key", () => {
        const json = trim(paragraph("{{ first name }} {{first name}}"), { textKeys: ["first name"] });

        expect(textsOf(json)).to.deep.equal(["{{first name}} {{first name}}"]);
    });

    it("should leave text that isn't the placeholder of a patch, even if it looks like one", () => {
        const json = trim(paragraph("{{ other }} {{ }} {{ name"), { textKeys: ["name"] });

        expect(textsOf(json)).to.deep.equal(["{{ other }} {{ }} {{ name"]);
    });

    it("should find a placeholder after a delimiter that isn't part of it", () => {
        const json = trim(paragraph("{{{ name }}} {{ a {{ name }}"), { textKeys: ["name"] });

        expect(textsOf(json)).to.deep.equal(["{{{name}}} {{ a {{name}}"]);
    });

    it("should trim the fields of a patch that repeats the rows of a table, in every paragraph", () => {
        const json = trim(
            `<w:tbl><w:tr><w:tc>${paragraph("{{ items.name }}")}${paragraph("{{items.price }}")}</w:tc></w:tr></w:tbl>${paragraph("{{ itemsCount }}")}`,
            { tableRowsKeys: ["items"] },
        );

        expect(textsOf(json)).to.deep.equal(["{{ itemsCount }}", "{{items.name}}", "{{items.price}}"]);
    });

    it("should use the placeholder delimiters", () => {
        const json = trim(paragraph("&lt;&lt; name &gt;&gt; {{ name }}"), { textKeys: ["name"], delimiters: { start: "<<", end: ">>" } });

        expect(textsOf(json)).to.deep.equal(["<<name>> {{ name }}"]);
    });

    describe("alt text", () => {
        const drawing = (attributes: string): string =>
            `<w:p><w:r><w:drawing><wp:inline><wp:docPr id="1" name="Logo" ${attributes}/></wp:inline></w:drawing></w:r></w:p>`;
        const docPrOf = (json: Element): Element["attributes"] =>
            json.elements![0].elements![0].elements![0].elements![0].elements![0].elements![0].elements![0].attributes;

        it("should trim a drawing patch's placeholder in a drawing's description and title", () => {
            const json = trim(drawing(`descr="Our logo {{ logo }}" title="{{logo }}"`), { drawingKeys: ["logo"] });

            expect(docPrOf(json)).to.deep.equal({ id: "1", name: "Logo", descr: "Our logo {{logo}}", title: "{{logo}}" });
        });

        it("should leave a drawing without alt text as it is", () => {
            const json = trim(drawing(""), { drawingKeys: ["logo"] });

            expect(docPrOf(json)).to.deep.equal({ id: "1", name: "Logo" });
        });

        it("should leave a text patch's placeholder in alt text, and a drawing patch's in the text, as the patches don't look there", () => {
            const json = trim(`${drawing(`descr="{{ name }}"`)}${paragraph("{{ logo }}")}`, { textKeys: ["name"], drawingKeys: ["logo"] });

            expect(docPrOf(json)).to.deep.equal({ id: "1", name: "Logo", descr: "{{ name }}" });
            expect(textsOf(json)).to.deep.equal(["", "{{ logo }}"]);
        });
    });
});
