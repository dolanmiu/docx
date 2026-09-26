/* eslint-disable @typescript-eslint/naming-convention -- The keys of objects here are paths of parts in a package */
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import type { Element } from "xml-js";

import { PackagePart } from "@file/package-part";
import { ExternalHyperlink, ImageRun, TextRun } from "@file/paragraph";
import { BuilderElement } from "@file/xml-components";

import {
    DrawingPatch,
    type TemplateDrawing,
    type TemplatePackage,
    altTextOf,
    findDrawings,
    relationshipsPathOf,
    relativeTarget,
    resolveTarget,
    sourceOfRelationships,
} from "./drawing-patch";
import { type IPatch, PatchType, patchDocument } from "./from-docx";
import { patchDetector } from "./patch-detector";
import { toJson } from "./util";

// cspell:ignore wpc wpg wps docPr cNvPr descr graphicData chartex

const NAMESPACES = [
    'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"',
    'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"',
    'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"',
    'xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"',
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"',
    'xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"',
    'xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"',
    'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"',
].join(" ");

const CHART_RELATIONSHIP = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart";
const PACKAGE_RELATIONSHIP = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/package";
const WORKBOOK_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// A chart in a paragraph, whose alt text is its description and title
const chartDrawing = ({
    descr,
    title,
    id = "rId5",
    name = "Chart 1",
}: {
    readonly descr?: string;
    readonly title?: string;
    readonly id?: string;
    readonly name?: string;
}): string =>
    `<w:p><w:r><w:drawing><wp:inline><wp:extent cx="100" cy="100"/>` +
    `<wp:docPr id="1" name="${name}"${descr === undefined ? "" : ` descr="${descr}"`}${title === undefined ? "" : ` title="${title}"`}/>` +
    `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart r:id="${id}"/></a:graphicData></a:graphic>` +
    `</wp:inline></w:drawing></w:r></w:p>`;

const documentOf = (body: string): string =>
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NAMESPACES}><w:body>${body}</w:body></w:document>`;

const relationshipsOf = (...relationships: readonly string[]): string =>
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships.join("")}</Relationships>`;

const relationship = (id: string, type: string, target: string, mode?: string): string =>
    `<Relationship Id="${id}" Type="${type}" Target="${target}"${mode === undefined ? "" : ` TargetMode="${mode}"`}/>`;

const CONTENT_TYPES =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
    `<Override PartName="/word/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>` +
    `<Override PartName="/word/embeddings/Microsoft_Excel_Worksheet1.xlsx" ContentType="${WORKBOOK_TYPE}"/>` +
    `</Types>`;

const CHART = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><c:chartSpace ${NAMESPACES}><c:chart/><c:externalData r:id="rId1"/></c:chartSpace>`;

// A document with a chart, whose workbook is a part of its own, and the files given
const templateWith = (files: Readonly<Record<string, string | Uint8Array | undefined>> = {}): Promise<Buffer> => {
    const all: Readonly<Record<string, string | Uint8Array | undefined>> = {
        "[Content_Types].xml": CONTENT_TYPES,
        "_rels/.rels": relationshipsOf(
            relationship("rId1", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument", "word/document.xml"),
        ),
        "word/document.xml": documentOf(chartDrawing({ descr: "{{chart}}" })),
        "word/_rels/document.xml.rels": relationshipsOf(relationship("rId5", CHART_RELATIONSHIP, "charts/chart1.xml")),
        "word/charts/chart1.xml": CHART,
        "word/charts/_rels/chart1.xml.rels": relationshipsOf(
            relationship("rId1", PACKAGE_RELATIONSHIP, "../embeddings/Microsoft_Excel_Worksheet1.xlsx"),
        ),
        "word/embeddings/Microsoft_Excel_Worksheet1.xlsx": new Uint8Array([1, 2, 3]),
        ...files,
    };
    const zip = new JSZip();
    for (const [path, content] of Object.entries(all)) {
        if (content !== undefined) {
            zip.file(path, content);
        }
    }
    return zip.generateAsync({ type: "nodebuffer" });
};

type Call = {
    readonly drawing: TemplateDrawing;
    readonly template: TemplatePackage;
};

// A drawing patch that records each call, and does what it is given to
class RecordingPatch extends DrawingPatch {
    // eslint-disable-next-line functional/prefer-readonly-type
    public readonly calls: Call[] = [];

    public constructor(private readonly onPatch: (drawing: TemplateDrawing, template: TemplatePackage) => void = () => undefined) {
        super();
    }

    public patch(drawing: TemplateDrawing, template: TemplatePackage): void {
        // eslint-disable-next-line functional/immutable-data
        this.calls.push({ drawing, template });
        this.onPatch(drawing, template);
    }
}

const patch = async (
    data: Buffer,
    patches: Readonly<Record<string, IPatch | DrawingPatch>>,
    placeholderDelimiters?: { readonly start: string; readonly end: string },
): Promise<JSZip> => JSZip.loadAsync(await patchDocument({ outputType: "nodebuffer", data, patches, placeholderDelimiters }));

const read = async (zip: JSZip, path: string): Promise<string | undefined> => {
    const text = await zip.file(path)?.async("text");
    return text;
};

// A workbook part, as docx/charts' ChartRun adds
const createWorkbook = (content: Uint8Array = new Uint8Array([9, 9])): PackagePart =>
    new PackagePart({
        folder: "embeddings",
        name: "Microsoft_Excel_Worksheet",
        extension: "xlsx",
        contentType: WORKBOOK_TYPE,
        relationshipType: PACKAGE_RELATIONSHIP,
        content,
    });

describe("drawing-patch", () => {
    describe("findDrawings", () => {
        it("should find inline and floating drawings, with their non-visual properties", () => {
            const json = toJson(
                documentOf(
                    `<w:p><w:r><w:drawing><wp:inline><wp:docPr id="1" name="A"/></wp:inline></w:drawing></w:r>` +
                        `<w:r><w:drawing><wp:anchor><wp:docPr id="2" name="B"/></wp:anchor></w:drawing></w:r></w:p>`,
                ),
            );

            const drawings = findDrawings(json);
            expect(drawings.map(({ element }) => element.name)).to.deep.equal(["wp:inline", "wp:anchor"]);
            expect(drawings.map(({ properties }) => properties.attributes?.name)).to.deep.equal(["A", "B"]);
        });

        it("should find the graphic frames of groups and drawing canvases, and the group itself", () => {
            const json = toJson(
                documentOf(
                    `<w:p><w:r><w:drawing><wp:inline><wp:docPr id="1" name="Group"/><a:graphic><a:graphicData><wpg:wgp>` +
                        `<wpg:graphicFrame><wpg:cNvPr id="2" name="In a group"/></wpg:graphicFrame>` +
                        `</wpg:wgp></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>` +
                        `<w:r><w:drawing><wp:inline><wp:docPr id="3" name="Canvas"/><a:graphic><a:graphicData><wpc:wpc>` +
                        `<wpc:graphicFrame><wpg:cNvPr id="4" name="In a canvas"/></wpc:graphicFrame>` +
                        `</wpc:wpc></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`,
                ),
            );

            expect(findDrawings(json).map(({ properties }) => properties.attributes?.name)).to.deep.equal([
                "Group",
                "In a group",
                "Canvas",
                "In a canvas",
            ]);
        });

        it("should find drawings in tables, text boxes, and both a choice and its fallback, in document order", () => {
            const inline = (name: string): string => `<w:drawing><wp:inline><wp:docPr id="1" name="${name}"/></wp:inline></w:drawing>`;
            const json = toJson(
                documentOf(
                    `<w:tbl><w:tr><w:tc><w:p><w:r>${inline("In a cell")}</w:r></w:p></w:tc></w:tr></w:tbl>` +
                        `<w:p><w:r><mc:AlternateContent><mc:Choice Requires="wps">${inline("Choice")}</mc:Choice>` +
                        `<mc:Fallback>${inline("Fallback")}</mc:Fallback></mc:AlternateContent></w:r></w:p>` +
                        `<w:p><w:r><w:drawing><wp:anchor><wp:docPr id="1" name="Text box"/><a:graphic><a:graphicData><wps:wsp><wps:txbx>` +
                        `<w:txbxContent><w:p><w:r>${inline("In a text box")}</w:r></w:p></w:txbxContent>` +
                        `</wps:txbx></wps:wsp></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r></w:p>`,
                ),
            );

            expect(findDrawings(json).map(({ properties }) => properties.attributes?.name)).to.deep.equal([
                "In a cell",
                "Choice",
                "Fallback",
                "Text box",
                "In a text box",
            ]);
        });

        it("should leave out drawings without non-visual properties, and elements that aren't drawings", () => {
            const json = toJson(
                documentOf(
                    `<w:p><w:r><w:drawing><wp:inline><wp:extent cx="1" cy="1"/></wp:inline></w:drawing></w:r>` +
                        `<w:r><wp:docPr id="1" name="Loose"/></w:r>` +
                        `<w:r><wpg:graphicFrame><wp:docPr id="2" name="The wrong properties"/></wpg:graphicFrame></w:r></w:p>`,
                ),
            );

            expect(findDrawings(json)).to.deep.equal([]);
        });

        it("should not take names on Object's prototype for drawings", () => {
            const json = toJson(
                `<constructor><toString><wp:docPr id="1"/></toString><__proto__><hasOwnProperty><wp:docPr id="2"/></hasOwnProperty></__proto__></constructor>`,
            );

            expect(findDrawings(json)).to.deep.equal([]);
        });

        it("should find nothing in an element without children", () => {
            expect(findDrawings({})).to.deep.equal([]);
            expect(findDrawings({ type: "element", name: "w:p" })).to.deep.equal([]);
        });
    });

    describe("altTextOf", () => {
        it("should give the description, then the title", () => {
            expect(altTextOf({ attributes: { descr: "A description", title: "A title" } })).to.deep.equal(["A description", "A title"]);
        });

        it("should leave out what the drawing doesn't have", () => {
            expect(altTextOf({ attributes: { title: "Only a title" } })).to.deep.equal(["Only a title"]);
            expect(altTextOf({ attributes: { descr: "Only a description" } })).to.deep.equal(["Only a description"]);
            expect(altTextOf({ attributes: { name: "Chart 1" } })).to.deep.equal([]);
            expect(altTextOf({})).to.deep.equal([]);
        });

        it("should give an empty description, and a number, as text", () => {
            expect(altTextOf({ attributes: { descr: "", title: 42 } })).to.deep.equal(["", "42"]);
        });

        it("should give the text with its entities decoded, as the patcher parses it", () => {
            const [drawing] = findDrawings(toJson(documentOf(chartDrawing({ descr: "&lt;&lt;sales&gt;&gt; &amp; &quot;more&quot;" }))));
            expect(altTextOf(drawing.properties)).to.deep.equal(['<<sales>> & "more"']);
        });
    });

    describe("relationshipsPathOf", () => {
        it("should give the relationships part of a part in word/", () => {
            expect(relationshipsPathOf("word/document.xml")).to.equal("word/_rels/document.xml.rels");
            expect(relationshipsPathOf("word/header1.xml")).to.equal("word/_rels/header1.xml.rels");
        });

        it("should give the relationships part of a part in a folder of its own", () => {
            expect(relationshipsPathOf("word/charts/chart1.xml")).to.equal("word/charts/_rels/chart1.xml.rels");
            expect(relationshipsPathOf("word/glossary/document.xml")).to.equal("word/glossary/_rels/document.xml.rels");
        });

        it("should give the relationships part of a part at the package's root", () => {
            expect(relationshipsPathOf("chart.xml")).to.equal("_rels/chart.xml.rels");
        });
    });

    describe("sourceOfRelationships", () => {
        it("should give the part a relationships part belongs to", () => {
            expect(sourceOfRelationships("word/_rels/document.xml.rels")).to.equal("word/document.xml");
            expect(sourceOfRelationships("word/charts/_rels/chart1.xml.rels")).to.equal("word/charts/chart1.xml");
            expect(sourceOfRelationships("_rels/chart.xml.rels")).to.equal("chart.xml");
        });

        it("should give the package's root for the package's own relationships", () => {
            expect(sourceOfRelationships("_rels/.rels")).to.equal("");
        });

        it("should be the opposite of relationshipsPathOf", () => {
            for (const path of ["word/document.xml", "word/charts/chart10.xml", "a/b/c/d.xml", "x.xml"]) {
                expect(sourceOfRelationships(relationshipsPathOf(path))).to.equal(path);
            }
        });
    });

    describe("resolveTarget", () => {
        it("should resolve a target relative to the folder of the part it is from", () => {
            expect(resolveTarget("word/document.xml", "charts/chart1.xml")).to.equal("word/charts/chart1.xml");
            expect(resolveTarget("word/charts/chart1.xml", "../embeddings/Microsoft_Excel_Worksheet1.xlsx")).to.equal(
                "word/embeddings/Microsoft_Excel_Worksheet1.xlsx",
            );
            expect(resolveTarget("word/charts/chart1.xml", "style1.xml")).to.equal("word/charts/style1.xml");
        });

        it("should resolve a target from the package's root when it starts with a slash", () => {
            expect(resolveTarget("word/charts/chart1.xml", "/word/embeddings/book.xlsx")).to.equal("word/embeddings/book.xlsx");
            expect(resolveTarget("", "/word/document.xml")).to.equal("word/document.xml");
        });

        it("should resolve the package's own relationships from its root", () => {
            expect(resolveTarget("", "word/document.xml")).to.equal("word/document.xml");
        });

        it("should read backslashes as slashes", () => {
            expect(resolveTarget("word/document.xml", "charts\\chart1.xml")).to.equal("word/charts/chart1.xml");
            expect(resolveTarget("word/charts/chart1.xml", "..\\embeddings\\book.xlsx")).to.equal("word/embeddings/book.xlsx");
        });

        it("should leave out empty and current folders, and never go above the root", () => {
            expect(resolveTarget("word/document.xml", "./charts//./chart1.xml")).to.equal("word/charts/chart1.xml");
            expect(resolveTarget("word/document.xml", "../../../../x.xml")).to.equal("x.xml");
            expect(resolveTarget("word/a/b/c.xml", "../../d.xml")).to.equal("word/d.xml");
        });
    });

    describe("relativeTarget", () => {
        it("should give a target in the same folder", () => {
            expect(relativeTarget("word/document.xml", "word/styles.xml")).to.equal("styles.xml");
        });

        it("should give a target in a folder below", () => {
            expect(relativeTarget("word/document.xml", "word/charts/chart1.xml")).to.equal("charts/chart1.xml");
        });

        it("should give a target in a folder beside", () => {
            expect(relativeTarget("word/charts/chart1.xml", "word/embeddings/Microsoft_Excel_Worksheet2.xlsx")).to.equal(
                "../embeddings/Microsoft_Excel_Worksheet2.xlsx",
            );
        });

        it("should give a target in a folder above, and from the root", () => {
            expect(relativeTarget("word/a/b/c.xml", "word/d.xml")).to.equal("../../d.xml");
            expect(relativeTarget("word/a/b/c.xml", "x.xml")).to.equal("../../../x.xml");
            expect(relativeTarget("chart.xml", "word/embeddings/book.xlsx")).to.equal("word/embeddings/book.xlsx");
        });

        it("should give a target that resolves to the part", () => {
            const paths = [
                "word/document.xml",
                "word/charts/chart1.xml",
                "word/embeddings/book.xlsx",
                "a.xml",
                "word/a/b/c/d.xml",
                "x/y.xml",
            ];
            for (const from of paths) {
                for (const to of paths) {
                    expect(resolveTarget(from, relativeTarget(from, to)), `${from} to ${to}`).to.equal(to);
                }
            }
        });
    });

    describe("DrawingPatch", () => {
        it("should be a patch of the drawing type", () => {
            expect(new RecordingPatch().type).to.equal(PatchType.DRAWING);
            expect(PatchType.DRAWING).to.equal("drawing");
        });
    });

    describe("patchDocument with a drawing patch", () => {
        describe("finding the drawings", () => {
            it("should patch a drawing whose description is the placeholder", async () => {
                const recording = new RecordingPatch();
                await patch(await templateWith(), { chart: recording });

                expect(recording.calls).to.have.length(1);
                const [{ drawing }] = recording.calls;
                expect(drawing.placeholder).to.equal("{{chart}}");
                expect(drawing.element.name).to.equal("wp:inline");
                expect(drawing.properties.name).to.equal("wp:docPr");
                expect(drawing.part.path).to.equal("word/document.xml");
                expect(drawing.part.xml?.elements?.[0].name).to.equal("w:document");
            });

            it("should patch a drawing whose title is the placeholder", async () => {
                const recording = new RecordingPatch();
                await patch(await templateWith({ "word/document.xml": documentOf(chartDrawing({ title: "{{chart}}" })) }), {
                    chart: recording,
                });

                expect(recording.calls).to.have.length(1);
            });

            it("should patch a drawing whose alt text holds the placeholder among other text", async () => {
                const recording = new RecordingPatch();
                const descr = "Chart, bar chart&#10;&#10;  {{chart}}  and more";
                await patch(await templateWith({ "word/document.xml": documentOf(chartDrawing({ descr })) }), { chart: recording });

                expect(recording.calls).to.have.length(1);
            });

            it("should not patch a drawing whose alt text doesn't hold the placeholder exactly", async () => {
                const recording = new RecordingPatch();
                const body = ["{{Chart}}", "{{ chart }}", "{chart}", "{{chart}", "chart", "{{charts}}", "{{chart2}}", ""]
                    .map((descr) => chartDrawing({ descr }))
                    .join("");
                await patch(await templateWith({ "word/document.xml": documentOf(body) }), { chart: recording });

                expect(recording.calls).to.deep.equal([]);
            });

            it("should not patch the placeholder in text, nor a drawing without alt text", async () => {
                const recording = new RecordingPatch();
                const body = `<w:p><w:r><w:t>{{chart}}</w:t></w:r></w:p>${chartDrawing({})}`;
                const zip = await patch(await templateWith({ "word/document.xml": documentOf(body) }), { chart: recording });

                expect(recording.calls).to.deep.equal([]);
                expect(await read(zip, "word/document.xml")).to.contain("<w:t>{{chart}}</w:t>");
            });

            it("should not patch a drawing whose placeholder is only in its name", async () => {
                const recording = new RecordingPatch();
                await patch(await templateWith({ "word/document.xml": documentOf(chartDrawing({ name: "{{chart}}" })) }), {
                    chart: recording,
                });

                expect(recording.calls).to.deep.equal([]);
            });

            it("should patch each drawing whose alt text holds the placeholder, in each part", async () => {
                const recording = new RecordingPatch();
                const header = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ${NAMESPACES}>${chartDrawing({ descr: "{{chart}}" })}</w:hdr>`;
                await patch(
                    await templateWith({
                        "word/document.xml": documentOf(
                            `${chartDrawing({ descr: "{{chart}}", name: "One" })}${chartDrawing({ title: "{{chart}}", name: "Two" })}`,
                        ),
                        "word/header1.xml": header,
                        "word/footnotes.xml": header.replace(/w:hdr/g, "w:footnotes"),
                    }),
                    { chart: recording },
                );

                expect(
                    recording.calls.map(({ drawing }) => `${drawing.part.path} ${String(drawing.properties.attributes?.name)}`),
                ).to.have.members([
                    "word/document.xml One",
                    "word/document.xml Two",
                    "word/header1.xml Chart 1",
                    "word/footnotes.xml Chart 1",
                ]);
            });

            it("should only look for drawings in word/, and not in relationships parts", async () => {
                const recording = new RecordingPatch();
                await patch(
                    await templateWith({
                        "word/document.xml": documentOf(""),
                        "customXml/item1.xml": documentOf(chartDrawing({ descr: "{{chart}}" })),
                        "word/_rels/document.xml.rels": documentOf(chartDrawing({ descr: "{{chart}}" })),
                    }),
                    { chart: recording },
                );

                expect(recording.calls).to.deep.equal([]);
            });

            it("should use the placeholder delimiters, whatever characters they are", async () => {
                const recording = new RecordingPatch();
                await patch(
                    await templateWith({ "word/document.xml": documentOf(chartDrawing({ descr: "&lt;&amp;chart&quot;&gt;" })) }),
                    { chart: recording },
                    { start: "<&", end: '">' },
                );

                expect(recording.calls).to.have.length(1);
                expect(recording.calls[0].drawing.placeholder).to.equal('<&chart">');
            });

            it("should throw when a drawing's alt text holds the placeholders of two drawing patches", async () => {
                const body = chartDrawing({ descr: "{{first}}", title: "{{second}}", name: "Both" });
                await expect(
                    patch(await templateWith({ "word/document.xml": documentOf(body) }), {
                        first: new RecordingPatch(),
                        second: new RecordingPatch(),
                    }),
                ).rejects.toThrow('The drawing "Both" in word/document.xml has the placeholders {{first}} and {{second}} in its alt text');
            });

            it("should throw for two placeholders in the alt text of a drawing without a name", async () => {
                const body = chartDrawing({ descr: "{{first}} {{second}}" }).replace(' name="Chart 1"', "");
                await expect(
                    patch(await templateWith({ "word/document.xml": documentOf(body) }), {
                        first: new RecordingPatch(),
                        second: new RecordingPatch(),
                    }),
                ).rejects.toThrow('The drawing "" in word/document.xml has the placeholders {{first}} and {{second}} in its alt text');
            });

            it("should not count a text patch's placeholder in a drawing's alt text", async () => {
                const recording = new RecordingPatch();
                const body = chartDrawing({ descr: "{{chart}} {{text}}" });
                await patch(await templateWith({ "word/document.xml": documentOf(body) }), {
                    chart: recording,
                    text: { type: PatchType.PARAGRAPH, children: [new TextRun("Text")] },
                });

                expect(recording.calls).to.have.length(1);
            });

            it("should find every drawing before it patches any, so a patch's own alt text isn't patched", async () => {
                const second = new RecordingPatch();
                const first = new RecordingPatch(() => {
                    // A patch that writes another patch's placeholder into a drawing's alt text
                    const [other] = findDrawings(first.calls[0].drawing.part.xml!).filter(
                        ({ properties }) => properties.attributes?.name === "Other",
                    );

                    other.properties.attributes!.descr = "{{second}}";
                });
                const body = chartDrawing({ descr: "{{first}}" }) + chartDrawing({ descr: "Nothing", name: "Other" });
                const zip = await patch(await templateWith({ "word/document.xml": documentOf(body) }), { first, second });

                expect(first.calls).to.have.length(1);
                expect(second.calls).to.deep.equal([]);
                expect(await read(zip, "word/document.xml")).to.contain('descr="{{second}}"');
            });

            it("should patch drawings before text, so drawings the text patches add aren't patched", async () => {
                const recording = new RecordingPatch();
                const zip = await patch(
                    await templateWith({ "word/document.xml": documentOf("<w:p><w:r><w:t>{{image}}</w:t></w:r></w:p>") }),
                    {
                        chart: recording,
                        image: {
                            type: PatchType.PARAGRAPH,
                            children: [
                                new ImageRun({
                                    type: "png",
                                    data: new Uint8Array([137, 80, 78, 71]),
                                    transformation: { width: 10, height: 10 },
                                    altText: { name: "Image", description: "{{chart}}", title: "" },
                                }),
                            ],
                        },
                    },
                );

                expect(recording.calls).to.deep.equal([]);
                expect(await read(zip, "word/document.xml")).to.contain('descr="{{chart}}"');
            });

            it("should keep the changes a patch makes to the drawing and its part", async () => {
                const zip = await patch(await templateWith(), {
                    chart: new RecordingPatch(({ properties, element }) => {
                        properties.attributes = { ...properties.attributes, descr: "Patched & done" };
                        // eslint-disable-next-line functional/immutable-data
                        element.attributes = { distT: "1" };
                    }),
                });

                const document = await read(zip, "word/document.xml");
                expect(document).to.contain('descr="Patched &amp; done"');
                expect(document).to.contain('<wp:inline distT="1">');
            });

            it("should stop patching, with the patch's error, when a patch throws", async () => {
                await expect(
                    patch(await templateWith(), {
                        chart: new RecordingPatch(() => {
                            throw new Error("Not this one");
                        }),
                    }),
                ).rejects.toThrow("Not this one");
            });

            it("should patch with text patches and drawing patches together", async () => {
                const recording = new RecordingPatch();
                const zip = await patch(
                    await templateWith({
                        "word/document.xml": documentOf(
                            `<w:p><w:r><w:t>Hello {{name}}</w:t></w:r></w:p>${chartDrawing({ descr: "{{chart}}" })}`,
                        ),
                    }),
                    { name: { type: PatchType.PARAGRAPH, children: [new TextRun("Ada")] }, chart: recording },
                );

                expect(recording.calls).to.have.length(1);
                expect(await read(zip, "word/document.xml")).to.contain("Ada");
            });
        });

        describe("the template's package", () => {
            const relatedPart = async (files: Readonly<Record<string, string | Uint8Array | undefined>>, id = "rId5") => {
                // eslint-disable-next-line functional/prefer-readonly-type
                const parts: (ReturnType<TemplatePackage["getRelatedPart"]> | "none")[] = [];
                await patch(await templateWith(files), {
                    chart: new RecordingPatch(({ part }, template) => {
                        // eslint-disable-next-line functional/immutable-data
                        parts.push(template.getRelatedPart(part, id) ?? "none");
                    }),
                });
                return parts[0];
            };

            it("should give the part a drawing's relationship refers to, parsed", async () => {
                const part = await relatedPart({});
                expect(part).to.not.equal("none");
                if (part !== "none" && part !== undefined) {
                    expect(part.path).to.equal("word/charts/chart1.xml");
                    expect(part.xml?.elements?.[0].name).to.equal("c:chartSpace");
                }
            });

            it("should give a part that isn't XML without its XML", async () => {
                const part = await relatedPart({
                    "word/_rels/document.xml.rels": relationshipsOf(
                        relationship("rId5", PACKAGE_RELATIONSHIP, "embeddings/Microsoft_Excel_Worksheet1.xlsx"),
                    ),
                });
                expect(part).to.deep.equal({ path: "word/embeddings/Microsoft_Excel_Worksheet1.xlsx", xml: undefined });
            });

            it("should give a part the relationships of another part refer to, from its folder", async () => {
                let workbook: ReturnType<TemplatePackage["getRelatedPart"]>;
                await patch(await templateWith(), {
                    chart: new RecordingPatch(({ part }, template) => {
                        const chart = template.getRelatedPart(part, "rId5")!;
                        workbook = template.getRelatedPart(chart, "rId1");
                    }),
                });
                expect(workbook!).to.deep.equal({ path: "word/embeddings/Microsoft_Excel_Worksheet1.xlsx", xml: undefined });
            });

            it("should give nothing for a relationship the part doesn't have", async () => {
                expect(await relatedPart({}, "rId404")).to.equal("none");
            });

            it("should give nothing when the part has no relationships part", async () => {
                expect(await relatedPart({ "word/_rels/document.xml.rels": undefined })).to.equal("none");
            });

            it("should give nothing for a relationship to something outside the package", async () => {
                expect(
                    await relatedPart({
                        "word/_rels/document.xml.rels": relationshipsOf(
                            relationship("rId5", CHART_RELATIONSHIP, "charts/chart1.xml", "External"),
                        ),
                    }),
                ).to.equal("none");
            });

            it("should give nothing for a relationship without a target", async () => {
                expect(
                    await relatedPart({
                        "word/_rels/document.xml.rels": relationshipsOf(`<Relationship Id="rId5" Type="${CHART_RELATIONSHIP}"/>`),
                    }),
                ).to.equal("none");
            });

            it("should give nothing for a part the package doesn't have", async () => {
                expect(await relatedPart({ "word/charts/chart1.xml": undefined })).to.equal("none");
            });

            it("should find a part whose target is from the root, has backslashes, escapes or other capitals", async () => {
                for (const target of [
                    "/word/charts/chart1.xml",
                    "charts\\chart1.xml",
                    "charts/chart%31.xml",
                    "Charts/CHART1.XML",
                    "./charts/../charts/chart1.xml",
                ]) {
                    const part = await relatedPart({
                        "word/_rels/document.xml.rels": relationshipsOf(relationship("rId5", CHART_RELATIONSHIP, target)),
                    });
                    expect(part !== "none" && part?.path, target).to.equal("word/charts/chart1.xml");
                }
            });

            it("should give nothing for a target whose escapes are broken, rather than throw", async () => {
                expect(
                    await relatedPart({
                        "word/_rels/document.xml.rels": relationshipsOf(
                            relationship("rId5", CHART_RELATIONSHIP, "charts/chart%E0%A4%A.xml"),
                        ),
                    }),
                ).to.equal("none");
            });

            it("should format XML as the template's parts are parsed", async () => {
                let formatted: Element | undefined;
                await patch(await templateWith(), {
                    chart: new RecordingPatch((_, template) => {
                        formatted = template.format(
                            new BuilderElement({ name: "c:v", attributes: { a: { key: "a", value: "1 & 2" } } }).addChildElement("<text>"),
                        );
                    }),
                });
                expect(formatted).to.deep.equal({
                    type: "element",
                    name: "c:v",
                    attributes: { a: "1 & 2" },
                    elements: [{ type: "text", text: "<text>" }],
                });
            });

            describe("replaceRelatedPart", () => {
                // The id of the relationship to replace, or null for none
                const replaceWith = async (
                    files: Readonly<Record<string, string | Uint8Array | undefined>>,
                    id: string | null = "rId1",
                    workbook: PackagePart = createWorkbook(),
                ): Promise<{ readonly zip: JSZip; readonly returned: string }> => {
                    let returned = "";
                    const zip = await patch(await templateWith(files), {
                        chart: new RecordingPatch(({ part }, template) => {
                            returned = template.replaceRelatedPart(template.getRelatedPart(part, "rId5")!, id ?? undefined, workbook);
                        }),
                    });
                    return { zip, returned };
                };

                it("should point the relationship to the new part, and remove the part it pointed to", async () => {
                    const { zip, returned } = await replaceWith({});

                    expect(returned).to.equal("rId1");
                    expect(await read(zip, "word/charts/_rels/chart1.xml.rels")).to.contain(
                        relationship("rId1", PACKAGE_RELATIONSHIP, "../embeddings/Microsoft_Excel_Worksheet2.xlsx"),
                    );
                    expect(await zip.file("word/embeddings/Microsoft_Excel_Worksheet2.xlsx")?.async("uint8array")).to.deep.equal(
                        new Uint8Array([9, 9]),
                    );
                    expect(zip.file("word/embeddings/Microsoft_Excel_Worksheet1.xlsx")).to.equal(null);

                    const contentTypes = await read(zip, "[Content_Types].xml");
                    expect(contentTypes).to.not.contain("/word/embeddings/Microsoft_Excel_Worksheet1.xlsx");
                    expect(contentTypes).to.contain(
                        `<Override ContentType="${WORKBOOK_TYPE}" PartName="/word/embeddings/Microsoft_Excel_Worksheet2.xlsx"/>`,
                    );
                });

                it("should keep the relationship's other attributes, and its place", async () => {
                    const { zip } = await replaceWith({
                        "word/charts/_rels/chart1.xml.rels": relationshipsOf(
                            relationship("rId0", "http://schemas.microsoft.com/office/2011/relationships/chartStyle", "style1.xml"),
                            `<Relationship Id="rId1" Type="${PACKAGE_RELATIONSHIP}" Target="../embeddings/Microsoft_Excel_Worksheet1.xlsx" Extra="kept"/>`,
                            relationship("rId2", "http://schemas.microsoft.com/office/2011/relationships/chartColorStyle", "colors1.xml"),
                        ),
                        "word/charts/style1.xml": "<cs:chartStyle/>",
                        "word/charts/colors1.xml": "<cs:colorStyle/>",
                    });

                    const relationships = await read(zip, "word/charts/_rels/chart1.xml.rels");
                    expect(relationships).to.match(
                        /Id="rId0".*Id="rId1" Type="[^"]+\/package" Target="[^"]+Worksheet2\.xlsx" Extra="kept".*Id="rId2"/,
                    );
                    expect(await read(zip, "word/charts/style1.xml")).to.equal("<cs:chartStyle/>");
                    expect(await read(zip, "word/charts/colors1.xml")).to.equal("<cs:colorStyle/>");
                });

                it("should point a relationship to outside the package to the new part, which is inside it", async () => {
                    const { zip } = await replaceWith({
                        "word/charts/_rels/chart1.xml.rels": relationshipsOf(
                            relationship(
                                "rId1",
                                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject",
                                "file:///C:/Book.xlsx",
                                "External",
                            ),
                        ),
                    });

                    const relationships = await read(zip, "word/charts/_rels/chart1.xml.rels");
                    expect(relationships).to.contain(
                        relationship("rId1", PACKAGE_RELATIONSHIP, "../embeddings/Microsoft_Excel_Worksheet2.xlsx"),
                    );
                    expect(relationships).to.not.contain("TargetMode");
                    // The template's own workbook part, which nothing referred to, is left as it is
                    expect(zip.file("word/embeddings/Microsoft_Excel_Worksheet1.xlsx")).to.not.equal(null);
                });

                it("should add the relationship with the id given, when the part has none with it", async () => {
                    const { zip, returned } = await replaceWith({}, "rId7");

                    expect(returned).to.equal("rId7");
                    const relationships = await read(zip, "word/charts/_rels/chart1.xml.rels");
                    expect(relationships).to.contain(
                        relationship("rId1", PACKAGE_RELATIONSHIP, "../embeddings/Microsoft_Excel_Worksheet1.xlsx"),
                    );
                    expect(relationships).to.contain(
                        relationship("rId7", PACKAGE_RELATIONSHIP, "../embeddings/Microsoft_Excel_Worksheet2.xlsx"),
                    );
                    expect(zip.file("word/embeddings/Microsoft_Excel_Worksheet1.xlsx")).to.not.equal(null);
                });

                it("should add a relationship with the next id, when no id is given", async () => {
                    const { zip, returned } = await replaceWith({}, null);

                    expect(returned).to.equal("rId2");
                    expect(await read(zip, "word/charts/_rels/chart1.xml.rels")).to.contain(
                        relationship("rId2", PACKAGE_RELATIONSHIP, "../embeddings/Microsoft_Excel_Worksheet2.xlsx"),
                    );
                });

                it("should create the relationships part of a part that has none", async () => {
                    const { zip, returned } = await replaceWith({ "word/charts/_rels/chart1.xml.rels": undefined }, "rId3");

                    expect(returned).to.equal("rId3");
                    expect(await read(zip, "word/charts/_rels/chart1.xml.rels")).to.equal(
                        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
                            `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
                            `${relationship("rId3", PACKAGE_RELATIONSHIP, "../embeddings/Microsoft_Excel_Worksheet2.xlsx")}</Relationships>`,
                    );
                });

                it("should give an empty relationships part a root element", async () => {
                    const { zip } = await replaceWith({ "word/charts/_rels/chart1.xml.rels": "" }, null);

                    expect(await read(zip, "word/charts/_rels/chart1.xml.rels")).to.contain(
                        relationship("rId1", PACKAGE_RELATIONSHIP, "../embeddings/Microsoft_Excel_Worksheet2.xlsx"),
                    );
                });

                it("should give a relationships part without its root element one", async () => {
                    const { zip } = await replaceWith({ "word/charts/_rels/chart1.xml.rels": `<?xml version="1.0"?><!-- empty -->` }, null);

                    expect(await read(zip, "word/charts/_rels/chart1.xml.rels")).to.contain(
                        relationship("rId1", PACKAGE_RELATIONSHIP, "../embeddings/Microsoft_Excel_Worksheet2.xlsx"),
                    );
                });

                it("should keep the part it pointed to when another relationship refers to it", async () => {
                    const { zip } = await replaceWith({
                        "word/_rels/document.xml.rels": relationshipsOf(
                            relationship("rId5", CHART_RELATIONSHIP, "charts/chart1.xml"),
                            relationship("rId6", PACKAGE_RELATIONSHIP, "embeddings/Microsoft_Excel_Worksheet1.xlsx"),
                        ),
                    });

                    expect(zip.file("word/embeddings/Microsoft_Excel_Worksheet1.xlsx")).to.not.equal(null);
                    expect(await read(zip, "[Content_Types].xml")).to.contain("/word/embeddings/Microsoft_Excel_Worksheet1.xlsx");
                });

                it("should keep the part it pointed to when another chart's relationship refers to it, by another path", async () => {
                    const { zip } = await replaceWith({
                        "word/charts/_rels/chart2.xml.rels": relationshipsOf(
                            relationship("rId1", PACKAGE_RELATIONSHIP, "/word/embeddings/Microsoft_Excel_Worksheet1.xlsx"),
                        ),
                    });

                    expect(zip.file("word/embeddings/Microsoft_Excel_Worksheet1.xlsx")).to.not.equal(null);
                });

                it("should remove the part when only a relationship to outside the package has its path", async () => {
                    const { zip } = await replaceWith({
                        "word/_rels/document.xml.rels": relationshipsOf(
                            relationship("rId5", CHART_RELATIONSHIP, "charts/chart1.xml"),
                            relationship(
                                "rId6",
                                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
                                "embeddings/Microsoft_Excel_Worksheet1.xlsx",
                                "External",
                            ),
                        ),
                    });

                    expect(zip.file("word/embeddings/Microsoft_Excel_Worksheet1.xlsx")).to.equal(null);
                });

                it("should remove the old part's own relationships part", async () => {
                    const { zip } = await replaceWith({
                        "word/embeddings/_rels/Microsoft_Excel_Worksheet1.xlsx.rels": relationshipsOf(),
                    });

                    expect(zip.file("word/embeddings/_rels/Microsoft_Excel_Worksheet1.xlsx.rels")).to.equal(null);
                });

                it("should remove an old part that is XML", async () => {
                    const { zip } = await replaceWith({
                        "word/charts/_rels/chart1.xml.rels": relationshipsOf(
                            relationship("rId1", PACKAGE_RELATIONSHIP, "../embeddings/old.xml"),
                        ),
                        "word/embeddings/old.xml": "<old/>",
                    });

                    expect(zip.file("word/embeddings/old.xml")).to.equal(null);
                });

                it("should remove an old part found by other capitals, and its content type whatever its capitals", async () => {
                    const { zip } = await replaceWith({
                        "[Content_Types].xml": CONTENT_TYPES.replace(
                            "/word/embeddings/Microsoft_Excel_Worksheet1.xlsx",
                            "/WORD/embeddings/microsoft_excel_worksheet1.XLSX",
                        ),
                        "word/charts/_rels/chart1.xml.rels": relationshipsOf(
                            relationship("rId1", PACKAGE_RELATIONSHIP, "../Embeddings/MICROSOFT_EXCEL_WORKSHEET1.xlsx"),
                        ),
                    });

                    expect(zip.file("word/embeddings/Microsoft_Excel_Worksheet1.xlsx")).to.equal(null);
                    expect(await read(zip, "[Content_Types].xml")).to.not.match(/worksheet1/i);
                });

                it("should never remove the content types, a relationships part, or the part itself", async () => {
                    for (const target of ["../../[Content_Types].xml", "../_rels/document.xml.rels", "chart1.xml"]) {
                        const { zip } = await replaceWith({
                            "word/charts/_rels/chart1.xml.rels": relationshipsOf(relationship("rId1", PACKAGE_RELATIONSHIP, target)),
                        });

                        expect(zip.file("[Content_Types].xml"), target).to.not.equal(null);
                        expect(zip.file("word/_rels/document.xml.rels"), target).to.not.equal(null);
                        expect(zip.file("word/charts/chart1.xml"), target).to.not.equal(null);
                    }
                });

                it("should throw, as for other patches that add parts, when the package has no content types", async () => {
                    await expect(replaceWith({ "[Content_Types].xml": undefined })).rejects.toThrow("Could not find content types file");
                });

                it("should number the new part after the template's parts, and those other patches add", async () => {
                    let returned = "";
                    const zip = await patch(
                        await templateWith({ "word/embeddings/Microsoft_Excel_Worksheet2.xlsx": new Uint8Array([2]) }),
                        {
                            chart: new RecordingPatch(({ part }, template) => {
                                const chart = template.getRelatedPart(part, "rId5")!;
                                template.replaceRelatedPart(chart, "rId1", createWorkbook(new Uint8Array([3])));
                                returned = template.replaceRelatedPart(chart, undefined, createWorkbook(new Uint8Array([4])));
                            }),
                        },
                    );

                    expect(returned).to.equal("rId2");
                    expect(await zip.file("word/embeddings/Microsoft_Excel_Worksheet3.xlsx")?.async("uint8array")).to.deep.equal(
                        new Uint8Array([3]),
                    );
                    expect(await zip.file("word/embeddings/Microsoft_Excel_Worksheet4.xlsx")?.async("uint8array")).to.deep.equal(
                        new Uint8Array([4]),
                    );
                    expect(await zip.file("word/embeddings/Microsoft_Excel_Worksheet2.xlsx")?.async("uint8array")).to.deep.equal(
                        new Uint8Array([2]),
                    );
                });

                it("should write a new part whose content is XML or a package's files", async () => {
                    const xmlPart = new PackagePart({
                        folder: "things",
                        name: "thing",
                        extension: "xml",
                        contentType: "application/xml",
                        relationshipType: PACKAGE_RELATIONSHIP,
                        content: new BuilderElement({ name: "thing" }),
                    });
                    const { zip } = await replaceWith({}, "rId1", xmlPart);

                    expect(await read(zip, "word/things/thing1.xml")).to.equal(
                        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><thing/>',
                    );
                    expect(await read(zip, "word/charts/_rels/chart1.xml.rels")).to.contain('Target="../things/thing1.xml"');
                });
            });
        });

        describe("invalid patches", () => {
            it("should throw for a patch without children", async () => {
                await expect(patch(await templateWith(), { chart: { type: PatchType.PARAGRAPH } as unknown as IPatch })).rejects.toThrow(
                    'Invalid patch "chart". Expected { type: PatchType.PARAGRAPH or PatchType.DOCUMENT, children: [...] }',
                );
            });

            it("should throw for a drawing patch without a patch function", async () => {
                await expect(
                    patch(await templateWith(), { chart: { type: PatchType.DRAWING } as unknown as DrawingPatch }),
                ).rejects.toThrow('Invalid patch "chart"');
            });

            it("should throw for a patch that isn't an object", async () => {
                for (const value of [undefined, null, "text", 1, new TextRun("A run")]) {
                    await expect(patch(await templateWith(), { chart: value as unknown as IPatch }), String(value)).rejects.toThrow(
                        'Invalid patch "chart"',
                    );
                }
            });

            it("should accept a drawing patch whose class docx doesn't know, by its type", async () => {
                // eslint-disable-next-line functional/prefer-readonly-type
                const calls: string[] = [];
                await patch(await templateWith(), {
                    chart: {
                        type: PatchType.DRAWING,
                        // eslint-disable-next-line functional/immutable-data
                        patch: ({ placeholder }: TemplateDrawing) => calls.push(placeholder),
                    } as unknown as DrawingPatch,
                });
                expect(calls).to.deep.equal(["{{chart}}"]);
            });
        });

        describe("text patches in a part in a folder of its own", () => {
            it("should add their relationships to the part's own relationships part", async () => {
                const glossary = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:glossaryDocument ${NAMESPACES}><w:docParts><w:docPart><w:docPartBody><w:p><w:r><w:t>{{link}}</w:t></w:r></w:p></w:docPartBody></w:docPart></w:docParts></w:glossaryDocument>`;
                const zip = await patch(await templateWith({ "word/glossary/document.xml": glossary }), {
                    link: {
                        type: PatchType.PARAGRAPH,
                        children: [new ExternalHyperlink({ link: "https://example.com", children: [new TextRun("Example")] })],
                    },
                });

                expect(await read(zip, "word/glossary/_rels/document.xml.rels")).to.contain(
                    'Target="https://example.com" TargetMode="External"',
                );
                // The document has its own relationship to the address, as every part does, but not the glossary's
                expect((await read(zip, "word/_rels/document.xml.rels"))?.match(/example\.com/g)).to.have.length(1);
            });
        });
    });

    describe("patchDetector", () => {
        it("should find placeholders in drawings' alt text, as well as in text", async () => {
            const body = `<w:p><w:r><w:t>{{name}} and {{chart}}</w:t></w:r></w:p>${chartDrawing({ descr: "{{chart}}" })}${chartDrawing({
                descr: "Sales: {{sales}}",
                title: "{{title}} {{other}}",
            })}${chartDrawing({ name: "{{not in the name}}" })}`;
            const placeholders = await patchDetector({ data: await templateWith({ "word/document.xml": documentOf(body) }) });

            expect(placeholders).to.have.members(["name", "chart", "sales", "title", "other"]);
        });

        it("should find placeholders in drawings in headers and footers", async () => {
            const header = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ${NAMESPACES}>${chartDrawing({ descr: "{{header chart}}" })}</w:hdr>`;
            const placeholders = await patchDetector({ data: await templateWith({ "word/header1.xml": header }) });

            expect(placeholders).to.have.members(["chart", "header chart"]);
        });
    });
});
