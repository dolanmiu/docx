import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { Body } from "@file/document";
import { Paragraph, TextRun } from "@file/paragraph";

import { Textbox } from "./textbox";

const createTextbox = (): Textbox =>
    new Textbox({
        alignment: "center",
        style: {
            width: "10pt",
        },
        children: [new Paragraph("test-content")],
    });

// The run the textbox's picture is in
const TEXTBOX_RUN = {
    "w:r": [
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
                                            "w:p": [{ "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "test-content"] }] }],
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
};

describe("VmlTextbox", () => {
    it("should be a paragraph with its picture in a run", () => {
        const tree = new Formatter().format(createTextbox());

        expect(tree).toStrictEqual({
            "w:p": [{ "w:pPr": [{ "w:jc": { _attr: { "w:val": "center" } } }] }, TEXTBOX_RUN],
        });
    });

    it("should be only a run in a paragraph's children, rather than a paragraph in a paragraph", () => {
        const alone = new Formatter().format(new Paragraph({ children: [createTextbox()] }));
        expect(alone).toStrictEqual({ "w:p": [TEXTBOX_RUN] });

        const afterText = new Formatter().format(new Paragraph({ children: [new TextRun("Hello"), createTextbox()] }));
        expect(afterText).toStrictEqual({
            "w:p": [{ "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "Hello"] }] }, TEXTBOX_RUN],
        });
    });

    it("should be a paragraph of its own in a section's children", () => {
        const body = new Body();
        body.push(createTextbox());

        expect(new Formatter().format(body)).toStrictEqual({
            "w:body": [{ "w:p": [{ "w:pPr": [{ "w:jc": { _attr: { "w:val": "center" } } }] }, TEXTBOX_RUN] }],
        });
    });
});
