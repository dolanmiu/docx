// cspell:words apos
import { describe, expect, it } from "vitest";

import { stringifyElement, stringifyXmlable } from "./stringify";
import type { XmlElement } from "./types";

describe("stringifyXmlable", () => {
    it("should write elements with attributes, children and text", () => {
        expect(
            stringifyXmlable({
                "w:p": [
                    { _attr: { "w14:paraId": "1A" } },
                    { "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "Hi"] }] },
                    { "w:r": {} },
                ],
            }),
        ).to.equal('<w:p w14:paraId="1A"><w:r><w:t xml:space="preserve">Hi</w:t></w:r><w:r/></w:p>');
    });

    it("should write an element's value, whatever its type", () => {
        expect(stringifyXmlable({ a: "text" })).to.equal("<a>text</a>");
        expect(stringifyXmlable({ a: 5 })).to.equal("<a>5</a>");
        expect(stringifyXmlable({ a: true })).to.equal("<a>true</a>");
        expect(stringifyXmlable({ a: "" })).to.equal("<a></a>");
        expect(stringifyXmlable({ a: undefined })).to.equal("<a></a>");
        expect(stringifyXmlable({ a: null })).to.equal("<a/>");
        expect(stringifyXmlable({ a: [] })).to.equal("<a></a>");
        expect(stringifyXmlable({ a: [5] })).to.equal("<a>5</a>");
        expect(stringifyXmlable({ a: { _attr: { b: 1, c: false, d: "x" } } })).to.equal('<a b="1" c="false" d="x"/>');
        expect(stringifyXmlable({})).to.equal("");
    });

    it("should escape text and attributes", () => {
        expect(stringifyXmlable({ a: [{ _attr: { b: `&"'<>` } }, `&"'<>`] })).to.equal(
            '<a b="&amp;&quot;&apos;&lt;&gt;">&amp;&quot;&apos;&lt;&gt;</a>',
        );
    });

    it("should leave out the characters that XML 1.0 does not allow", () => {
        expect(stringifyXmlable({ "w:t": "a\x01b\x0Bc\x1Fd" })).to.equal("<w:t>abcd</w:t>");
        expect(stringifyXmlable({ a: { _attr: { b: "x\x00y\x08z" } } })).to.equal('<a b="xyz"/>');
        expect(stringifyXmlable({ "w:t": "tab\tline\nreturn\r" })).to.equal("<w:t>tab\tline\nreturn\r</w:t>");
    });

    it("should write CDATA, splitting it at each ]]>", () => {
        expect(stringifyXmlable({ a: { _cdata: "x]]>y" } })).to.equal("<a><![CDATA[x]]]]><![CDATA[>y]]></a>");
    });

    it("should let text take the place of what came before it, as the xml package did", () => {
        expect(stringifyXmlable({ a: [{ b: {} }, "text"] })).to.equal("<a>text</a>");
        expect(stringifyXmlable({ a: ["one", "two"] })).to.equal("<a>two</a>");
    });

    it("should write a declaration first", () => {
        expect(stringifyXmlable({ a: {} }, { declaration: { standalone: "yes", encoding: "UTF-8" } })).to.equal(
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a/>',
        );
        expect(stringifyXmlable({ a: {} }, { declaration: {} })).to.equal('<?xml version="1.0" encoding="UTF-8"?><a/>');
    });

    it("should write several objects one after another", () => {
        expect(stringifyXmlable([{ a: {} }, { b: "x" }])).to.equal("<a/><b>x</b>");
    });

    it("should indent each level, as the xml package did", () => {
        expect(
            stringifyXmlable(
                { a: [{ _attr: { x: 1 } }, { b: [{ c: "text" }, { d: {} }] }, { e: [] }] },
                { indent: "  ", declaration: { standalone: "yes" } },
            ),
        ).to.equal(
            [
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
                '<a x="1">',
                "  <b>",
                "    <c>text</c>",
                "    <d/>",
                "  </b>",
                "  <e>",
                "  </e>",
                "</a>",
            ].join("\n"),
        );
        expect(stringifyXmlable([{ a: {} }, { b: "x" }], { indent: "  " })).to.equal("<a/>\n<b>x</b>");
    });
});

describe("stringifyElement", () => {
    it("should write a document's declaration and nodes", () => {
        const document: XmlElement = {
            declaration: { attributes: { version: "1.0", standalone: "yes" } },
            elements: [
                { type: "instruction", name: "mso-application", instruction: 'progid="Word.Document"' },
                { type: "doctype", doctype: "a" },
                {
                    type: "element",
                    name: "a",
                    attributes: { b: "1", c: 2, d: undefined },
                    elements: [
                        { type: "element", name: "empty" },
                        { type: "element", name: "w:t", attributes: { "xml:space": "preserve" } },
                        { type: "text", text: 5 },
                        { type: "comment", comment: " c " },
                        { type: "cdata", cdata: "x]]>y" },
                        { type: "instruction", name: "pi" },
                        { type: "element", name: "children", elements: [{ type: "text", text: "t" }] },
                        { type: "unknown" },
                    ],
                },
            ],
        };
        expect(stringifyElement(document)).to.equal(
            '<?xml version="1.0" standalone="yes"?><?mso-application progid="Word.Document"?><!DOCTYPE a><a b="1" c="2">' +
                '<empty/><w:t xml:space="preserve"></w:t>5<!-- c --><![CDATA[x]]]]><![CDATA[>y]]><?pi?><children>t</children></a>',
        );
    });

    it("should escape text and attributes, so that what is read is written back as it was", () => {
        expect(
            stringifyElement({
                elements: [
                    {
                        type: "element",
                        name: "a",
                        attributes: { b: `&amp; &"'<>` },
                        elements: [{ type: "text", text: `&amp; &"'<>` }],
                    },
                ],
            }),
        ).to.equal(`<a b="&amp;amp; &amp;&quot;&apos;&lt;&gt;">&amp;amp; &amp;"'&lt;&gt;</a>`);
    });

    it("should leave out the characters that XML 1.0 does not allow", () => {
        const element: XmlElement = {
            type: "element",
            name: "w:t",
            attributes: { b: "x\x1Fy" },
            elements: [{ type: "text", text: "a\x01b\x0Cc" }],
        };
        expect(stringifyElement({ elements: [element] })).to.equal('<w:t b="xy">abc</w:t>');
    });

    it("should leave out attributes without a value", () => {
        expect(stringifyElement({ elements: [{ type: "element", name: "a", attributes: { b: null as unknown as string } }] })).to.equal(
            "<a/>",
        );
    });

    it("should write nothing for an empty document", () => {
        expect(stringifyElement({})).to.equal("");
    });
});
