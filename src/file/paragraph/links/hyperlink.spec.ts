import JSZip from "jszip";
import { beforeEach, describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { Packer } from "@export/packer/packer";
import { File } from "@file/file";
import { Footer, Header } from "@file/header";

import { Paragraph } from "../paragraph";
import { TextRun } from "../run";
import { ConcreteHyperlink, ExternalHyperlink, InternalHyperlink } from "./hyperlink";

describe("ConcreteHyperlink", () => {
    let hyperlink: ConcreteHyperlink;

    beforeEach(() => {
        hyperlink = new ConcreteHyperlink(
            [
                new TextRun({
                    text: "https://example.com",
                    style: "Hyperlink",
                }),
            ],
            "superid",
        );
    });

    describe("#constructor()", () => {
        it("should create a hyperlink with correct root key", () => {
            const tree = new Formatter().format(hyperlink);
            expect(tree).to.deep.equal({
                "w:hyperlink": [
                    {
                        _attr: {
                            "w:history": 1,
                            "r:id": "rIdsuperid",
                        },
                    },
                    {
                        "w:r": [
                            { "w:rPr": [{ "w:rStyle": { _attr: { "w:val": "Hyperlink" } } }] },
                            { "w:t": [{ _attr: { "xml:space": "preserve" } }, "https://example.com"] },
                        ],
                    },
                ],
            });
        });

        describe("with optional anchor parameter", () => {
            beforeEach(() => {
                hyperlink = new ConcreteHyperlink(
                    [
                        new TextRun({
                            text: "Anchor Text",
                            style: "Hyperlink",
                        }),
                    ],
                    "superid2",
                    "anchor",
                );
            });

            it("should create an internal link with anchor tag", () => {
                const tree = new Formatter().format(hyperlink);
                expect(tree).to.deep.equal({
                    "w:hyperlink": [
                        {
                            _attr: {
                                "w:history": 1,
                                "w:anchor": "anchor",
                            },
                        },
                        {
                            "w:r": [
                                { "w:rPr": [{ "w:rStyle": { _attr: { "w:val": "Hyperlink" } } }] },
                                { "w:t": [{ _attr: { "xml:space": "preserve" } }, "Anchor Text"] },
                            ],
                        },
                    ],
                });
            });
        });
    });
});

describe("ExternalHyperlink", () => {
    it.each([
        ["255 literal characters", "a".repeat(255), true],
        ["256 literal characters", "a".repeat(256), false],
        ["255 characters including another hash", `${"a".repeat(127)}#${"b".repeat(127)}`, true],
        ["256 characters including another hash", `${"a".repeat(127)}#${"b".repeat(128)}`, false],
        ["255 characters of percent-encoded hashes", "%23".repeat(85), true],
        ["256 characters of percent-encoded hashes", `${"%23".repeat(85)}x`, false],
        ["255 UTF-16 units including astral characters", `${"😀".repeat(127)}a`, true],
        ["256 UTF-16 units including astral characters", "😀".repeat(128), false],
    ] as const)("should preserve the full URL when packing a fragment with %s", async (_description, fragment, useAnchor) => {
        const target = "https://example.com/?a=1&b=2";
        const link = `${target}#${fragment}`;
        const document = new File({
            sections: [{ children: [new Paragraph({ children: [new ExternalHyperlink({ link, children: [new TextRun("Link")] })] })] }],
        });
        const zip = await JSZip.loadAsync(await Packer.toBuffer(document));
        const xml = new DOMParser().parseFromString(await zip.file("word/document.xml")!.async("text"), "text/xml");
        const hyperlink = xml.getElementsByTagName("w:hyperlink")[0];
        expect(hyperlink.hasAttribute("w:anchor")).to.equal(useAnchor);
        if (useAnchor) {
            expect(hyperlink.getAttribute("w:anchor")).to.equal(fragment);
        }
        const relationships = new DOMParser().parseFromString(await zip.file("word/_rels/document.xml.rels")!.async("text"), "text/xml");
        const matches = [...relationships.getElementsByTagName("Relationship")].filter(
            (relationship) => relationship.getAttribute("Id") === hyperlink.getAttribute("r:id"),
        );
        expect(matches).to.have.length(1);
        expect(matches[0].getAttribute("Target")).to.equal(useAnchor ? target : link);
        expect(matches[0].getAttribute("TargetMode")).to.equal("External");
    });

    it("should keep complete external fragments and matching relationships when a document is packed again", async () => {
        const paragraph = (): Paragraph =>
            new Paragraph({
                children: [
                    new ExternalHyperlink({
                        link: 'https://example.com/?a=1&b=2#foo#bar&"quoted"',
                        children: [new TextRun("Link")],
                    }),
                ],
            });
        const document = new File({
            sections: [
                {
                    children: [paragraph()],
                    headers: { default: new Header({ children: [paragraph()] }) },
                    footers: { default: new Footer({ children: [paragraph()] }) },
                },
            ],
        });

        for (let pack = 0; pack < 2; pack++) {
            const zip = await JSZip.loadAsync(await Packer.toBuffer(document));
            for (const part of ["document", "header1", "footer1"]) {
                const xml = new DOMParser().parseFromString(await zip.file(`word/${part}.xml`)!.async("text"), "text/xml");
                const hyperlink = xml.getElementsByTagName("w:hyperlink")[0];
                expect(hyperlink.getAttribute("w:anchor")).to.equal('foo#bar&"quoted"');
                const relationships = new DOMParser().parseFromString(
                    await zip.file(`word/_rels/${part}.xml.rels`)!.async("text"),
                    "text/xml",
                );
                const matches = [...relationships.getElementsByTagName("Relationship")].filter(
                    (relationship) => relationship.getAttribute("Id") === hyperlink.getAttribute("r:id"),
                );
                expect(matches).to.have.length(1);
                expect(matches[0].getAttribute("Target")).to.equal("https://example.com/?a=1&b=2");
                expect(matches[0].getAttribute("TargetMode")).to.equal("External");
            }
        }
    });

    describe("#constructor()", () => {
        it("should create", () => {
            const externalHyperlink = new ExternalHyperlink({
                children: [new TextRun("test")],
                link: "http://www.google.com",
            });

            expect(externalHyperlink.options.link).to.equal("http://www.google.com");
        });
    });
});

describe("InternalHyperlink", () => {
    describe("#constructor()", () => {
        it("should create", () => {
            const internalHyperlink = new InternalHyperlink({
                children: [new TextRun("test")],
                anchor: "test-id",
            });

            const tree = new Formatter().format(internalHyperlink);

            expect(tree).to.deep.equal({
                "w:hyperlink": [
                    {
                        _attr: {
                            "w:anchor": "test-id",
                            "w:history": 1,
                        },
                    },
                    {
                        "w:r": [
                            {
                                "w:t": [
                                    {
                                        _attr: {
                                            "xml:space": "preserve",
                                        },
                                    },
                                    "test",
                                ],
                            },
                        ],
                    },
                ],
            });
        });
    });
});
