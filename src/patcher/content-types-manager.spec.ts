import { describe, expect, it } from "vitest";

import { appendContentType } from "./content-types-manager";

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
});
