import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { createHyperlinkClick, createHyperlinkHover } from "./doc-properties-children";

describe("Document Properties Children", () => {
    describe("#createHyperlinkClick", () => {
        it("should create a Hyperlink Click component", () => {
            const tree = new Formatter().format(createHyperlinkClick("1", false));

            expect(tree).to.deep.equal({
                "a:hlinkClick": {
                    _attr: {
                        "r:id": "rId1",
                    },
                },
            });
        });

        it("should create a Hyperlink Click component with xmlns:a", () => {
            const tree = new Formatter().format(createHyperlinkClick("1", true));

            expect(tree).to.deep.equal({
                "a:hlinkClick": {
                    _attr: {
                        "r:id": "rId1",
                        "xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main",
                    },
                },
            });
        });
    });

    describe("#createHyperlinkHover", () => {
        it("should create a Hyperlink Hover component", () => {
            const tree = new Formatter().format(createHyperlinkHover("1", false));

            expect(tree).to.deep.equal({
                "a:hlinkHover": {
                    _attr: {
                        "r:id": "rId1",
                    },
                },
            });
        });

        it("should create a Hyperlink Hover component with xmlns:a", () => {
            const tree = new Formatter().format(createHyperlinkHover("1", true));

            expect(tree).to.deep.equal({
                "a:hlinkHover": {
                    _attr: {
                        "r:id": "rId1",
                        "xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main",
                    },
                },
            });
        });
    });
});
