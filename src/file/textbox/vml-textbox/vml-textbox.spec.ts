import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { Paragraph } from "@file/paragraph";

import { createVmlTextbox } from "./vml-texbox";

describe("VmlTextbox", () => {
    it("should work", () => {
        const tree = new Formatter().format(
            createVmlTextbox({
                style: "test-style",
                children: [new Paragraph("test-content")],
            }),
        );

        expect(tree).toStrictEqual({
            "v:textbox": [
                { _attr: { insetmode: "auto", style: "test-style" } },
                { "w:txbxContent": [{ "w:p": [{ "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "test-content"] }] }] }] },
            ],
        });
    });

    it("should work with inset", () => {
        const tree = new Formatter().format(
            createVmlTextbox({
                style: "test-style",
                children: [new Paragraph("test-content")],
                inset: {
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                },
            }),
        );

        expect(tree).toStrictEqual({
            "v:textbox": [
                { _attr: { insetmode: "custom", style: "test-style", inset: "0, 0, 0, 0" } },
                { "w:txbxContent": [{ "w:p": [{ "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "test-content"] }] }] }] },
            ],
        });
    });
});
