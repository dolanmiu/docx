import { describe, expect, it } from "vitest";

import { parseXml } from "./parse";

describe("parseXml", () => {
    describe("the document", () => {
        it("should read the declaration's attributes, in either quotes, before the nodes", () => {
            const document = parseXml(`<?xml version="1.0" encoding='UTF-8' standalone="yes"?><a/>`);
            expect(document).to.deep.equal({
                declaration: { attributes: { version: "1.0", encoding: "UTF-8", standalone: "yes" } },
                elements: [{ type: "element", name: "a" }],
            });
            expect(Object.keys(document)).to.deep.equal(["declaration", "elements"]);
        });

        it("should read a declaration without attributes", () => {
            expect(parseXml("<?xml?><a/>")).to.deep.equal({ declaration: {}, elements: [{ type: "element", name: "a" }] });
        });

        it("should read nothing from an empty string", () => {
            expect(parseXml("")).to.deep.equal({});
        });

        it("should skip a byte order mark and the whitespace before the first tag", () => {
            expect(parseXml("\uFEFF \r\n<a/>", { keepWhitespaceText: true })).to.deep.equal({ elements: [{ type: "element", name: "a" }] });
        });

        it("should read elements one after another at the top level", () => {
            expect(parseXml("<a/><b/>")).to.deep.equal({
                elements: [
                    { type: "element", name: "a" },
                    { type: "element", name: "b" },
                ],
            });
        });
    });

    describe("elements", () => {
        it("should read nested elements and their attributes", () => {
            expect(parseXml(`<w:p w14:paraId="1A"><w:r><w:t xml:space='preserve'>Hi</w:t></w:r><w:r/></w:p>`)).to.deep.equal({
                elements: [
                    {
                        type: "element",
                        name: "w:p",
                        attributes: { "w14:paraId": "1A" },
                        elements: [
                            {
                                type: "element",
                                name: "w:r",
                                elements: [
                                    {
                                        type: "element",
                                        name: "w:t",
                                        attributes: { "xml:space": "preserve" },
                                        elements: [{ type: "text", text: "Hi" }],
                                    },
                                ],
                            },
                            { type: "element", name: "w:r" },
                        ],
                    },
                ],
            });
        });

        it("should allow whitespace between attributes, around their equals signs and in tags", () => {
            expect(parseXml(`<a\n  b = "1"\tc='2'\n/><d ></d >`).elements).to.deep.equal([
                { type: "element", name: "a", attributes: { b: "1", c: "2" } },
                { type: "element", name: "d" },
            ]);
        });

        it("should keep the first of attributes with the same name", () => {
            expect(parseXml(`<a b="1" b="2"/>`).elements![0].attributes).to.deep.equal({ b: "1" });
        });

        it("should decode entities in attributes, and keep their whitespace", () => {
            expect(parseXml(`<a b="&amp;&quot;&lt;\n\t&#65;"/>`).elements![0].attributes).to.deep.equal({ b: '&"<\n\tA' });
        });

        it("should read an attribute named __proto__ as an attribute, not the prototype", () => {
            const { attributes } = parseXml(`<a __proto__="x" constructor="y"/>`).elements![0];
            expect(Object.keys(attributes!)).to.deep.equal(["__proto__", "constructor"]);
            expect(Object.getPrototypeOf(attributes)).to.equal(Object.prototype);
        });

        it("should throw for elements that aren't well formed", () => {
            expect(() => parseXml("<a>")).to.throw("<a> isn't closed");
            expect(() => parseXml("<a")).to.throw("<a> that isn't closed");
            expect(() => parseXml(`<a b="1"`)).to.throw("<a> that isn't closed");
            expect(() => parseXml("<>")).to.throw("tag without a name");
            expect(() => parseXml("<a><b></a>")).to.throw("closing tag </a> doesn't match <b>");
            expect(() => parseXml("</a>")).to.throw("closing tag </a> doesn't match <>");
            expect(() => parseXml("<a></a")).to.throw("closing tag that isn't closed");
        });

        it("should throw for attributes that aren't well formed", () => {
            expect(() => parseXml("<a b>")).to.throw("attribute of <a> without a value");
            expect(() => parseXml(`<a b c="1">`)).to.throw("attribute of <a> without a value");
            expect(() => parseXml(`<a ="1">`)).to.throw("attribute of <a> without a value");
            expect(() => parseXml("<a b=1/>")).to.throw("value of b on <a> isn't quoted");
            expect(() => parseXml(`<a b="1/>`)).to.throw("value of b on <a> isn't closed");
        });
    });

    describe("text", () => {
        it("should decode the entities XML predefines and character references", () => {
            expect(parseXml("<a>&amp;&lt;&gt;&quot;&apos;&#65;&#x42;&#X43;&#x1F600;</a>").elements![0].elements).to.deep.equal([
                { type: "text", text: `&<>"'ABC\u{1F600}` },
            ]);
        });

        it("should throw for an entity XML doesn't predefine, or a character reference to no character", () => {
            expect(() => parseXml("<a>&nbsp;</a>")).to.throw('unknown entity "&nbsp;"');
            expect(() => parseXml("<a>&#0;</a>")).to.throw('unknown entity "&#0;"');
            expect(() => parseXml("<a>&#x110000;</a>")).to.throw('unknown entity "&#x110000;"');
            expect(() => parseXml("<a>&#xZ;</a>")).to.throw('unknown entity "&#xZ;"');
        });

        it("should throw for an & that starts no entity", () => {
            expect(() => parseXml("<a>Fish & chips</a>")).to.throw('"&" that starts no entity');
        });

        it("should leave out text that is only whitespace, unless told to keep it", () => {
            const xml = `<?xml version="1.0"?>\r\n<a> <b/>\n</a>\n`;
            expect(parseXml(xml).elements).to.deep.equal([{ type: "element", name: "a", elements: [{ type: "element", name: "b" }] }]);
            expect(parseXml(xml, { keepWhitespaceText: true }).elements).to.deep.equal([
                { type: "text", text: "\r\n" },
                {
                    type: "element",
                    name: "a",
                    elements: [
                        { type: "text", text: " " },
                        { type: "element", name: "b" },
                        { type: "text", text: "\n" },
                    ],
                },
                { type: "text", text: "\n" },
            ]);
        });

        it("should throw for text outside of the root element", () => {
            expect(() => parseXml("text<a/>")).to.throw('text outside of the root element, "text"');
            expect(() => parseXml("<a/>text")).to.throw('text outside of the root element, "text"');
        });
    });

    describe("other nodes", () => {
        it("should read processing instructions, with and without a body", () => {
            expect(parseXml(`<?mso-application progid="Word.Document"?><a><?pi?></a>`).elements).to.deep.equal([
                { type: "instruction", name: "mso-application", instruction: 'progid="Word.Document"' },
                { type: "element", name: "a", elements: [{ type: "instruction", name: "pi", instruction: "" }] },
            ]);
        });

        it("should read comments and CDATA sections, leaving out empty ones", () => {
            expect(parseXml("<a><!-- c --><!----><![CDATA[x<y&]]><![CDATA[]]></a>").elements![0].elements).to.deep.equal([
                { type: "comment", comment: " c " },
                { type: "cdata", cdata: "x<y&" },
            ]);
        });

        it("should read a DOCTYPE to its end, past the > and ] in its internal subset and quotes", () => {
            expect(parseXml(`<!DOCTYPE a [ <!ENTITY x "y>"> <!ENTITY z ']'> ]><a/>`).elements).to.deep.equal([
                { type: "doctype", doctype: `a [ <!ENTITY x "y>"> <!ENTITY z ']'> ]` },
                { type: "element", name: "a" },
            ]);
        });

        it("should throw for nodes that aren't closed", () => {
            expect(() => parseXml("<?xml version")).to.throw("processing instruction that isn't closed");
            expect(() => parseXml("<a><!-- c")).to.throw("comment that isn't closed");
            expect(() => parseXml("<a><![CDATA[x")).to.throw("CDATA section that isn't closed");
            expect(() => parseXml("<!DOCTYPE a [ > ")).to.throw("DOCTYPE that isn't closed");
        });
    });
});
