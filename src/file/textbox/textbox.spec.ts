import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { Paragraph } from "@file/paragraph";

import { Textbox } from "./textbox";

describe("VmlTextbox", () => {
    it("should work", () => {
        const tree = new Formatter().format(
            new Textbox({
                style: {
                    width: "10pt",
                },
                children: [new Paragraph("test-content")],
            }),
        );

        expect(tree).toStrictEqual({
            "w:p": [
                {
                    "w:pict": [
                        {
                            "v:shape": [
                                { _attr: { id: expect.any(String), type: "#_x0000_t202", style: "width:10pt" } },
                                {
                                    "v:textbox": [
                                        { _attr: { insetmode: "auto", style: "mso-fit-shape-to-text:t;" } },
                                        {
                                            "w:txbxContent": [
                                                {
                                                    "w:p": [
                                                        { "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "test-content"] }] },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });
});
