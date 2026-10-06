import { beforeEach, describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { Paragraph, TextRun } from "@file/paragraph";
import { Table, TableCell, TableRow } from "@file/table";

import { Body } from "./body";
import { sectionMarginDefaults } from "./section-properties";

describe("Body", () => {
    let body: Body;

    beforeEach(() => {
        body = new Body();
    });

    describe("#addSection", () => {
        it("should add section with default parameters", () => {
            body.addSection({
                page: {
                    size: {
                        width: 10000,
                        height: 10000,
                    },
                },
            });

            const tree = new Formatter().format(body);

            expect(tree).to.deep.equal({
                "w:body": [
                    {
                        "w:sectPr": [
                            { "w:pgSz": { _attr: { "w:w": 10000, "w:h": 10000, "w:orient": "portrait" } } },
                            {
                                "w:pgMar": {
                                    _attr: {
                                        "w:top": sectionMarginDefaults.TOP,
                                        "w:right": sectionMarginDefaults.RIGHT,
                                        "w:bottom": sectionMarginDefaults.BOTTOM,
                                        "w:left": sectionMarginDefaults.LEFT,
                                        "w:header": sectionMarginDefaults.HEADER,
                                        "w:footer": sectionMarginDefaults.FOOTER,
                                        "w:gutter": sectionMarginDefaults.GUTTER,
                                    },
                                },
                            },
                            {
                                "w:pgNumType": {
                                    _attr: {},
                                },
                            },
                            // { "w:cols": { _attr: { "w:space": 708, "w:sep": false, "w:num": 1 } } },
                            { "w:docGrid": { _attr: { "w:linePitch": 360 } } },
                        ],
                    },
                ],
            });
        });

        describe("section breaks", () => {
            type Element = Record<string, unknown>;

            /** The name of an element of the formatted tree */
            const nameOf = (element: unknown): string => Object.keys(element as Element)[0];

            /** The children of an element of the formatted tree */
            const childrenOf = (element: unknown): readonly unknown[] => {
                const content = (element as Element)[nameOf(element)];
                return Array.isArray(content) ? content : [];
            };

            /** The names of the paragraph's properties (`w:pPr`) */
            const propertyNamesOf = (paragraph: unknown): readonly string[] => {
                const properties = childrenOf(paragraph).find((child) => nameOf(child) === "w:pPr");
                return properties === undefined ? [] : childrenOf(properties).map(nameOf);
            };

            const formatBody = (): readonly unknown[] => childrenOf(new Formatter().format(body));

            const countSectionProperties = (elements: readonly unknown[]): number =>
                elements.filter((element) => nameOf(element) === "w:sectPr").length +
                elements
                    .filter((element) => nameOf(element) === "w:p")
                    .flatMap(propertyNamesOf)
                    .filter((name) => name === "w:sectPr").length;

            it("puts the section properties into the last paragraph of the section", () => {
                body.addSection({});
                body.push(new Paragraph("first section"));
                body.addSection({});
                body.push(new Paragraph("second section"));

                const elements = formatBody();

                expect(elements.map(nameOf)).to.deep.equal(["w:p", "w:p", "w:sectPr"]);
                expect(propertyNamesOf(elements[0])).to.deep.equal(["w:sectPr"]);
                expect(childrenOf(elements[0]).map(nameOf)).to.deep.equal(["w:pPr", "w:r"]);
                expect(propertyNamesOf(elements[1])).to.deep.equal([]);
            });

            it("keeps a separate paragraph for the section properties when the section ends with a table", () => {
                body.addSection({});
                body.push(
                    new Table({
                        rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph("cell")] })] })],
                    }),
                );
                body.addSection({});
                body.push(new Paragraph("second section"));

                const elements = formatBody();

                expect(elements.map(nameOf)).to.deep.equal(["w:tbl", "w:p", "w:p", "w:sectPr"]);
                expect(childrenOf(elements[1]).map(nameOf)).to.deep.equal(["w:pPr"]);
                expect(propertyNamesOf(elements[1])).to.deep.equal(["w:sectPr"]);
            });

            it("keeps a separate paragraph for the section properties of an empty first section", () => {
                body.addSection({});
                body.addSection({});
                body.push(new Paragraph("second section"));

                const elements = formatBody();

                expect(elements.map(nameOf)).to.deep.equal(["w:p", "w:p", "w:sectPr"]);
                expect(childrenOf(elements[0]).map(nameOf)).to.deep.equal(["w:pPr"]);
                expect(propertyNamesOf(elements[0])).to.deep.equal(["w:sectPr"]);
                expect(propertyNamesOf(elements[1])).to.deep.equal([]);
            });

            it("keeps a separate paragraph for the section properties of an empty section in the middle", () => {
                body.addSection({});
                body.push(new Paragraph("first section"));
                body.addSection({});
                body.addSection({});
                body.push(new Paragraph("third section"));

                const elements = formatBody();

                expect(elements.map(nameOf)).to.deep.equal(["w:p", "w:p", "w:p", "w:sectPr"]);
                expect(propertyNamesOf(elements[0])).to.deep.equal(["w:sectPr"]);
                expect(childrenOf(elements[1]).map(nameOf)).to.deep.equal(["w:pPr"]);
                expect(propertyNamesOf(elements[1])).to.deep.equal(["w:sectPr"]);
                expect(countSectionProperties(elements)).to.equal(3);
            });

            it("keeps the paragraph's own properties and writes the section properties after its run properties and before its revision", () => {
                body.addSection({});
                body.push(
                    new Paragraph({
                        bullet: { level: 0 },
                        run: { bold: true },
                        revision: { id: 1, author: "Firstname Lastname", date: "123" },
                        children: [new TextRun("first section")],
                    }),
                );
                body.addSection({});
                body.push(new Paragraph("second section"));

                const elements = formatBody();

                expect(propertyNamesOf(elements[0])).to.deep.equal(["w:pStyle", "w:numPr", "w:rPr", "w:sectPr", "w:pPrChange"]);
            });

            it("leaves the paragraph that ends a section as it was, so it can end a section of another body too", () => {
                const shared = new Paragraph("shared");
                const other = new Body();
                for (const target of [body, other]) {
                    target.addSection({});
                    target.push(shared);
                    target.addSection({});
                    target.push(new Paragraph("second section"));
                }

                for (const target of [body, other, body]) {
                    const elements = childrenOf(new Formatter().format(target));

                    expect(elements.map(nameOf)).to.deep.equal(["w:p", "w:p", "w:sectPr"]);
                    expect(propertyNamesOf(elements[0])).to.deep.equal(["w:sectPr"]);
                }
                expect(new Formatter().format(shared)).to.deep.equal(new Formatter().format(new Paragraph("shared")));
            });

            it("keeps a separate paragraph for the section properties when the paragraph that ends the section is used again later", () => {
                const repeated = new Paragraph("repeated");
                body.addSection({});
                body.push(repeated);
                body.addSection({});
                body.push(repeated);

                const elements = formatBody();

                expect(elements.map(nameOf)).to.deep.equal(["w:p", "w:p", "w:p", "w:sectPr"]);
                expect(propertyNamesOf(elements[0])).to.deep.equal([]);
                expect(childrenOf(elements[1]).map(nameOf)).to.deep.equal(["w:pPr"]);
                expect(propertyNamesOf(elements[1])).to.deep.equal(["w:sectPr"]);
                expect(propertyNamesOf(elements[2])).to.deep.equal([]);
                expect(countSectionProperties(elements)).to.equal(2);
            });

            it("keeps a separate paragraph for the section properties when the paragraph that ends the section was used earlier", () => {
                const repeated = new Paragraph("repeated");
                body.addSection({});
                body.push(repeated);
                body.push(repeated);
                body.addSection({});
                body.push(new Paragraph("second section"));

                const elements = formatBody();

                expect(elements.map(nameOf)).to.deep.equal(["w:p", "w:p", "w:p", "w:p", "w:sectPr"]);
                expect(propertyNamesOf(elements[0])).to.deep.equal([]);
                expect(propertyNamesOf(elements[1])).to.deep.equal([]);
                expect(propertyNamesOf(elements[2])).to.deep.equal(["w:sectPr"]);
                expect(countSectionProperties(elements)).to.equal(2);
            });

            it("writes the same XML when the body is formatted twice", () => {
                body.addSection({});
                body.push(new Paragraph("first section"));
                body.addSection({});
                body.push(new Paragraph("second section"));

                const first = new Formatter().format(body);
                const second = new Formatter().format(body);

                expect(second).to.deep.equal(first);
                expect(countSectionProperties(childrenOf(second))).to.equal(2);
            });
        });
    });

    describe("#getSectionPropertiesFor", () => {
        // Sections are told apart by their page width (text width = page width - 2880 twips of margins)
        const FIRST_PAGE_WIDTH = 10000;
        const SECOND_PAGE_WIDTH = 20000;

        it("returns undefined when the body has no sections", () => {
            expect(body.getSectionPropertiesFor()).to.be.undefined;
            expect(body.getSectionPropertiesFor(new Paragraph("orphan"))).to.be.undefined;
        });

        it("returns the only section for its children, before and after formatting", () => {
            body.addSection({ page: { size: { width: FIRST_PAGE_WIDTH, height: 10000 } } });
            const paragraph = new Paragraph("hello");
            body.push(paragraph);

            expect(body.getSectionPropertiesFor(paragraph)?.AvailableTextWidth).to.equal(FIRST_PAGE_WIDTH - 2880);

            new Formatter().format(body);

            expect(body.getSectionPropertiesFor(paragraph)?.AvailableTextWidth).to.equal(FIRST_PAGE_WIDTH - 2880);
        });

        it("returns the section that each child belongs to when there are several sections", () => {
            body.addSection({ page: { size: { width: FIRST_PAGE_WIDTH, height: 10000 } } });
            const first = new Paragraph("first section");
            body.push(first);
            body.addSection({ page: { size: { width: SECOND_PAGE_WIDTH, height: 10000 } } });
            const second = new Paragraph("second section");
            body.push(second);

            expect(body.getSectionPropertiesFor(first)?.AvailableTextWidth).to.equal(FIRST_PAGE_WIDTH - 2880);
            expect(body.getSectionPropertiesFor(second)?.AvailableTextWidth).to.equal(SECOND_PAGE_WIDTH - 2880);

            new Formatter().format(body);

            expect(body.getSectionPropertiesFor(first)?.AvailableTextWidth).to.equal(FIRST_PAGE_WIDTH - 2880);
            expect(body.getSectionPropertiesFor(second)?.AvailableTextWidth).to.equal(SECOND_PAGE_WIDTH - 2880);
        });

        it("returns its own section for the paragraph that ends a section", () => {
            body.addSection({ page: { size: { width: FIRST_PAGE_WIDTH, height: 10000 } } });
            const last = new Paragraph("end of first section");
            body.push(last);
            body.addSection({ page: { size: { width: SECOND_PAGE_WIDTH, height: 10000 } } });
            body.push(new Paragraph("second section"));

            expect(body.getSectionPropertiesFor(last)?.AvailableTextWidth).to.equal(FIRST_PAGE_WIDTH - 2880);
        });

        it("returns the first section when no child is given or the child is not in the body", () => {
            body.addSection({ page: { size: { width: FIRST_PAGE_WIDTH, height: 10000 } } });
            body.push(new Paragraph("first section"));
            body.addSection({ page: { size: { width: SECOND_PAGE_WIDTH, height: 10000 } } });
            body.push(new Paragraph("second section"));

            expect(body.getSectionPropertiesFor()?.AvailableTextWidth).to.equal(FIRST_PAGE_WIDTH - 2880);
            expect(body.getSectionPropertiesFor(new Paragraph("orphan"))?.AvailableTextWidth).to.equal(FIRST_PAGE_WIDTH - 2880);
        });
    });
});
