import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { Paragraph } from "docx";

import { TextWatermark } from "./text-watermark";

type ShapeAttributes = Readonly<Record<string, string | number>>;

// Digs the v:shape attributes and children out of the formatted run.
const getShape = (watermark: TextWatermark): { readonly attributes: ShapeAttributes; readonly children: readonly unknown[] } => {
    const tree = new Formatter().format(watermark);
    const [, shape] = tree["w:r"][0]["w:pict"];
    const [attributes, ...children] = shape["v:shape"];

    return { attributes: attributes._attr, children };
};

describe("TextWatermark", () => {
    describe("#constructor()", () => {
        it("should produce the same markup as Word for a default diagonal watermark", () => {
            const tree = new Formatter().format(new TextWatermark({ text: "DRAFT" }));

            expect(tree).toStrictEqual({
                "w:r": [
                    {
                        "w:pict": [
                            {
                                "v:shapetype": expect.arrayContaining([
                                    { _attr: expect.objectContaining({ id: "_x0000_t136", "o:spt": 136 }) },
                                ]),
                            },
                            {
                                "v:shape": [
                                    {
                                        _attr: {
                                            id: expect.stringMatching(/^PowerPlusWaterMarkObject/),
                                            type: "#_x0000_t136",
                                            style: "position:absolute;margin-left:0;margin-top:0;width:527.85pt;height:131.96pt;rotation:315;z-index:-251657216;mso-position-horizontal:center;mso-position-horizontal-relative:margin;mso-position-vertical:center;mso-position-vertical-relative:margin",
                                            "o:allowincell": "f",
                                            fillcolor: "silver",
                                            stroked: "f",
                                        },
                                    },
                                    { "v:fill": { _attr: { opacity: 0.5 } } },
                                    { "v:textpath": { _attr: { style: 'font-family:"Calibri";font-size:1pt', ["string"]: "DRAFT" } } },
                                ],
                            },
                        ],
                    },
                ],
            });
        });

        it("should give each watermark a unique id", () => {
            const first = getShape(new TextWatermark({ text: "DRAFT" }));
            const second = getShape(new TextWatermark({ text: "DRAFT" }));

            expect(first.attributes.id).not.toBe(second.attributes.id);
        });

        it("should not rotate a horizontal watermark", () => {
            const { attributes } = getShape(new TextWatermark({ text: "DRAFT", layout: "horizontal" }));

            expect(attributes.style).not.toContain("rotation");
        });

        it("should let an explicit rotation override the layout", () => {
            const { attributes } = getShape(new TextWatermark({ text: "DRAFT", layout: "horizontal", rotation: 45 }));

            expect(attributes.style).toContain("rotation:45;");
        });

        it("should use the given width and height", () => {
            const { attributes } = getShape(new TextWatermark({ text: "DRAFT", width: 400, height: 100 }));

            expect(attributes.style).toContain("width:400pt;height:100pt;");
        });

        it("should keep long text in proportion by lowering the default height", () => {
            const { attributes } = getShape(new TextWatermark({ text: "CONFIDENTIAL" }));

            // 527.85pt / (12 characters x 0.8)
            expect(attributes.style).toContain("width:527.85pt;height:54.98pt;");
        });

        it("should count spaces as narrower than letters when estimating the height", () => {
            const { attributes } = getShape(new TextWatermark({ text: "TOP SECRET" }));

            // 527.85pt / (9 letters x 0.8 + 1 space x 0.35)
            expect(attributes.style).toContain("width:527.85pt;height:69.91pt;");
        });

        it("should never make the default height larger than the width", () => {
            const { attributes } = getShape(new TextWatermark({ text: "A" }));

            expect(attributes.style).toContain("width:527.85pt;height:527.85pt;");
        });

        it("should normalize a hex colour for VML", () => {
            const { attributes } = getShape(new TextWatermark({ text: "DRAFT", color: "FF0000" }));

            expect(attributes.fillcolor).toBe("#FF0000");
        });

        it("should pass a named colour through", () => {
            const { attributes } = getShape(new TextWatermark({ text: "DRAFT", color: "red" }));

            expect(attributes.fillcolor).toBe("red");
        });

        it("should write the opacity into the fill", () => {
            const { children } = getShape(new TextWatermark({ text: "DRAFT", opacity: 0.25 }));

            expect(children[0]).toStrictEqual({ "v:fill": { _attr: { opacity: 0.25 } } });
        });

        it("should write the font, font size, bold and italics into the text path", () => {
            const { children } = getShape(new TextWatermark({ text: "DRAFT", font: "Arial", fontSize: 72, bold: true, italics: true }));

            expect(children[1]).toStrictEqual({
                "v:textpath": {
                    _attr: { style: 'font-family:"Arial";font-size:72pt;font-weight:bold;font-style:italic', ["string"]: "DRAFT" },
                },
            });
        });

        it("should keep special characters in the text for the serializer to escape", () => {
            const { children } = getShape(new TextWatermark({ text: "A & B <C>" }));

            expect(children[1]).toStrictEqual({
                "v:textpath": { _attr: { style: 'font-family:"Calibri";font-size:1pt', ["string"]: "A & B <C>" } },
            });
        });

        it("should be usable as a paragraph child", () => {
            const tree = new Formatter().format(new Paragraph({ children: [new TextWatermark({ text: "DRAFT" })] }));

            expect(tree["w:p"]).toHaveLength(1);
            expect(tree["w:p"][0]).toHaveProperty("w:r");
        });
    });
});
