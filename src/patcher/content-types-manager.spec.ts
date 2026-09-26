import { describe, expect, it } from "vitest";

import { appendContentType, appendContentTypeOverride, removeContentTypeOverride } from "./content-types-manager";
import { toJson } from "./util";

describe("content-types-manager", () => {
    describe("appendContentType", () => {
        it("should append a content type", () => {
            const element = {
                type: "element",
                name: "xml",
                elements: [
                    {
                        type: "element",
                        name: "Types",
                        elements: [
                            {
                                type: "element",
                                name: "Default",
                            },
                        ],
                    },
                ],
            };
            appendContentType(element, "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml", "docx");

            expect(element).to.deep.equal({
                elements: [
                    {
                        elements: [
                            {
                                name: "Default",
                                type: "element",
                            },
                            {
                                attributes: {
                                    ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
                                    Extension: "docx",
                                },
                                name: "Default",
                                type: "element",
                            },
                        ],
                        name: "Types",
                        type: "element",
                    },
                ],
                name: "xml",
                type: "element",
            });
        });

        it("should not append duplicate content type", () => {
            const element = {
                type: "element",
                name: "xml",
                elements: [
                    {
                        type: "element",
                        name: "Types",
                        elements: [
                            {
                                type: "element",
                                name: "Default",
                                attributes: {
                                    ContentType: "image/png",
                                    Extension: "png",
                                },
                            },
                        ],
                    },
                ],
            };
            appendContentType(element, "image/png", "png");

            expect(element.elements.length).toBe(1);
        });
    });

    describe("appendContentTypeOverride", () => {
        const CHART_TYPE = "application/vnd.openxmlformats-officedocument.drawingml.chart+xml";

        it("should append a content type for a part, once", () => {
            const element = toJson(`<Types><Default Extension="xml" ContentType="application/xml"/></Types>`);
            appendContentTypeOverride(element, CHART_TYPE, "/word/charts/chart1.xml");
            appendContentTypeOverride(element, CHART_TYPE, "/word/charts/chart2.xml");
            appendContentTypeOverride(element, CHART_TYPE, "/word/charts/chart1.xml");

            expect(element.elements?.[0].elements).to.deep.equal([
                { type: "element", name: "Default", attributes: { Extension: "xml", ContentType: "application/xml" } },
                { type: "element", name: "Override", attributes: { ContentType: CHART_TYPE, PartName: "/word/charts/chart1.xml" } },
                { type: "element", name: "Override", attributes: { ContentType: CHART_TYPE, PartName: "/word/charts/chart2.xml" } },
            ]);
        });
    });

    describe("removeContentTypeOverride", () => {
        const types = (): ReturnType<typeof toJson> =>
            toJson(
                '<Types><Default Extension="xlsx" ContentType="a"/><Override PartName="/word/embeddings/Book1.xlsx" ContentType="a"/>' +
                    '<Override PartName="/word/charts/chart1.xml" ContentType="b"/><Override ContentType="c"/></Types>',
            );

        it("should remove a part's content type, whatever its capitals, and keep the others", () => {
            const element = types();
            removeContentTypeOverride(element, "/WORD/embeddings/book1.XLSX");
            expect(element.elements![0].elements!.map((el) => el.attributes)).to.deep.equal([
                { Extension: "xlsx", ContentType: "a" },
                { PartName: "/word/charts/chart1.xml", ContentType: "b" },
                { ContentType: "c" },
            ]);
        });

        it("should leave content types without the part as they are", () => {
            const element = types();
            removeContentTypeOverride(element, "/word/other.xml");
            expect(element).to.deep.equal(types());
        });

        it("should leave content types without a Types element, or an empty one, as they are", () => {
            for (const text of ["<Other/>", "<Types/>"]) {
                const element = toJson(text);
                removeContentTypeOverride(element, "/word/document.xml");
                expect(element).to.deep.equal(toJson(text));
            }
        });
    });
});
