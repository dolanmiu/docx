import { describe, expect, it } from "vitest";

import { appendContentType, appendContentTypeOverride } from "./content-types-manager";
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
});
