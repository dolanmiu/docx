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
                { _attr: { id: "test-id", type: "#_x0000_t202", style: "width:10pt" } },
                {
                    "v:textbox": [
                        { _attr: { insetmode: "auto", style: "mso-fit-shape-to-text:t;" } },
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

    it("should create default styles", () => {
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
                        { _attr: { insetmode: "auto", style: "mso-fit-shape-to-text:t;" } },
                        {
                            "w:txbxContent": {},
                        },
                    ],
                },
            ],
        });
    });
});
