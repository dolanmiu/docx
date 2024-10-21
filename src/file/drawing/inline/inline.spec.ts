import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createInline } from "./inline";

describe("Inline", () => {
    it("should create with default effect extent", () => {
        const tree = new Formatter().format(
            createInline({
                mediaData: {
                    type: "png",
                    fileName: "test.png",
                    data: Buffer.from(""),
                    transformation: {
                        pixels: {
                            x: 0,
                            y: 0,
                        },
                        emus: {
                            x: 0,
                            y: 0,
                        },
                    },
                },
                transform: {
                    pixels: {
                        x: 100,
                        y: 100,
                    },
                    emus: {
                        x: 100,
                        y: 100,
                    },
                },
                docProperties: {
                    name: "test",
                    description: "test",
                    title: "test",
                },
                outline: { type: "solidFill", solidFillType: "rgb", value: "FFFFFF" },
            }),
        );

        expect(tree).toStrictEqual({
            "wp:inline": expect.arrayContaining([
                {
                    "wp:effectExtent": {
                        _attr: {
                            b: 19050,
                            l: 19050,
                            r: 19050,
                            t: 19050,
                        },
                    },
                },
            ]),
        });
    });
});
