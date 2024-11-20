import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { Paragraph } from "@file/paragraph";

import { createVmlTextbox } from "./vml-texbox";

describe("VmlTextbox", () => {
    it("should create with default effect extent", () => {
        const tree = new Formatter().format(
            createVmlTextbox({
                style: "test-style",
                children: [new Paragraph("test-content")],
            }),
        );

        expect(tree).toStrictEqual({
            "v:textbox": [
                { _attr: { style: "test-style" } },
                { "w:txbxContent": [{ "w:p": [{ "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "test-content"] }] }] }] },
            ],
        });
    });
});
