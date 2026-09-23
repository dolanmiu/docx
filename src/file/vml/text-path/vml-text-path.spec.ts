import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createVmlTextPath, formatVmlTextPathStyle } from "./vml-text-path";

describe("formatVmlTextPathStyle", () => {
    it("should return undefined when no style is given", () => {
        expect(formatVmlTextPathStyle()).toBeUndefined();
    });

    it("should return undefined when every property is undefined", () => {
        expect(formatVmlTextPathStyle({ fontFamily: undefined })).toBeUndefined();
    });

    it("should quote the font family and suffix the font size with pt", () => {
        expect(formatVmlTextPathStyle({ fontFamily: "Calibri", fontSize: 1 })).toBe('font-family:"Calibri";font-size:1pt');
    });

    it("should format every property", () => {
        expect(
            formatVmlTextPathStyle({
                fontFamily: "Times New Roman",
                fontSize: 72,
                fontWeight: "bold",
                fontStyle: "italic",
                textAlign: "center",
                sameLetterHeights: true,
            }),
        ).toBe(
            'font-family:"Times New Roman";font-size:72pt;font-weight:bold;font-style:italic;v-text-align:center;v-same-letter-heights:t',
        );
    });
});

describe("createVmlTextPath", () => {
    it("should create an empty text path when no options are given", () => {
        const tree = new Formatter().format(createVmlTextPath());

        expect(tree).toStrictEqual({ "v:textpath": { _attr: {} } });
    });

    it("should declare a shape type text path with on and fitshape", () => {
        const tree = new Formatter().format(createVmlTextPath({ on: true, fitShape: true }));

        expect(tree).toStrictEqual({ "v:textpath": { _attr: { on: "t", fitshape: "t" } } });
    });

    it("should emit the text in the string attribute along with its style", () => {
        const tree = new Formatter().format(
            createVmlTextPath({ fitPath: false, trim: true, xScale: false, text: "DRAFT", style: { fontFamily: "Calibri", fontSize: 1 } }),
        );

        expect(tree).toStrictEqual({
            "v:textpath": {
                _attr: { fitpath: "f", trim: "t", xscale: "f", style: 'font-family:"Calibri";font-size:1pt', ["string"]: "DRAFT" },
            },
        });
    });
});
