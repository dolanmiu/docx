import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { Paragraph } from "@file/paragraph";

import { createShape } from "./shape";

describe("createShape", () => {
    it("should work", () => {
        const tree = new Formatter().format(
            createShape({
                id: "test-id",
                style: {
                    width: "10pt",
                },
                children: [new Paragraph("test-content")],
            }),
        );

        expect(tree).toStrictEqual({
            "v:shape": [
                { _attr: { id: "test-id", type: "#_x0000_t202", style: "width:10pt;height:1in" } },
                {
                    "v:textbox": [
                        { _attr: { style: "mso-fit-shape-to-text:t;" } },
                        {
                            "w:txbxContent": [
                                { "w:p": [{ "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "test-content"] }] }] },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    it("should write no style when given none, as a height alone doesn't change how the box is drawn", () => {
        const tree = new Formatter().format(
            createShape({
                id: "test-id",
            }),
        );

        expect(tree).toStrictEqual({
            "v:shape": [
                { _attr: { id: "test-id", type: "#_x0000_t202" } },
                {
                    "v:textbox": [
                        { _attr: { style: "mso-fit-shape-to-text:t;" } },
                        {
                            "w:txbxContent": {},
                        },
                    ],
                },
            ],
        });
    });

    it("should write a height of auto as 1in, which Word, WPS Office, LibreOffice and Pages resize to fit the text", () => {
        const tree = new Formatter().format(createShape({ id: "test-id", style: { width: "200pt", height: "auto", zIndex: "auto" } }));

        expect(tree["v:shape"][0]).toStrictEqual({
            _attr: { id: "test-id", type: "#_x0000_t202", style: "width:200pt;height:1in;z-index:auto" },
        });
    });

    it("should keep a height that is given", () => {
        const tree = new Formatter().format(createShape({ id: "test-id", style: { width: "200pt", height: "50pt" } }));

        expect(tree["v:shape"][0]).toStrictEqual({ _attr: { id: "test-id", type: "#_x0000_t202", style: "width:200pt;height:50pt" } });
    });
});
