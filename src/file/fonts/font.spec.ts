import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createFont } from "./font";

describe("font", () => {
    it("should work", () => {
        const tree = new Formatter().format(
            createFont({
                name: "Times New Roman",
                altName: "Times New Roman",
                family: "roman",
                charset: "00",
                panose1: "02020603050405020304",
                pitch: "variable",
                embedRegular: {
                    id: "rId0",
                    fontKey: "00000000-0000-0000-0000-000000000000",
                },
            }),
        );

        expect(tree).to.deep.equal({
            "w:font": [
                {
                    _attr: {
                        "w:name": "Times New Roman",
                    },
                },
                {
                    "w:altName": {
                        _attr: {
                            "w:val": "Times New Roman",
                        },
                    },
                },
                {
                    "w:panose1": {
                        _attr: {
                            "w:val": "02020603050405020304",
                        },
                    },
                },
                {
                    "w:charset": {
                        _attr: {
                            "w:val": "00",
                        },
                    },
                },
                {
                    "w:family": {
                        _attr: {
                            "w:val": "roman",
                        },
                    },
                },
                {
                    "w:pitch": {
                        _attr: {
                            "w:val": "variable",
                        },
                    },
                },
                {
                    "w:embedRegular": {
                        _attr: {
                            "r:id": "rId0",
                            "w:fontKey": "{00000000-0000-0000-0000-000000000000}",
                        },
                    },
                },
            ],
        });
    });

    it("should work for embedBold", () => {
        const tree = new Formatter().format(
            createFont({
                name: "Times New Roman",
                embedBold: {
                    id: "rId0",
                    fontKey: "00000000-0000-0000-0000-000000000000",
                },
            }),
        );

        expect(tree).toStrictEqual({
            "w:font": expect.arrayContaining([
                {
                    "w:embedBold": {
                        _attr: {
                            "r:id": "rId0",
                            "w:fontKey": "{00000000-0000-0000-0000-000000000000}",
                        },
                    },
                },
            ]),
        });
    });

    it("should work for embedBoldItalic", () => {
        const tree = new Formatter().format(
            createFont({
                name: "Times New Roman",
                embedBoldItalic: {
                    id: "rId0",
                    fontKey: "00000000-0000-0000-0000-000000000000",
                },
            }),
        );

        expect(tree).toStrictEqual({
            "w:font": expect.arrayContaining([
                {
                    "w:embedBoldItalic": {
                        _attr: {
                            "r:id": "rId0",
                            "w:fontKey": "{00000000-0000-0000-0000-000000000000}",
                        },
                    },
                },
            ]),
        });
    });

    it("should work for embedItalic", () => {
        const tree = new Formatter().format(
            createFont({
                name: "Times New Roman",
                embedItalic: {
                    id: "rId0",
                    fontKey: "00000000-0000-0000-0000-000000000000",
                },
            }),
        );

        expect(tree).toStrictEqual({
            "w:font": expect.arrayContaining([
                {
                    "w:embedItalic": {
                        _attr: {
                            "r:id": "rId0",
                            "w:fontKey": "{00000000-0000-0000-0000-000000000000}",
                        },
                    },
                },
            ]),
        });
    });

    it("should work for notTrueType", () => {
        const tree = new Formatter().format(
            createFont({
                name: "Times New Roman",
                embedRegular: {
                    id: "rId0",
                    fontKey: "00000000-0000-0000-0000-000000000000",
                    subsetted: true,
                },
            }),
        );

        expect(tree).toStrictEqual({
            "w:font": expect.arrayContaining([
                {
                    "w:embedRegular": [
                        {
                            _attr: {
                                "r:id": "rId0",
                                "w:fontKey": "{00000000-0000-0000-0000-000000000000}",
                            },
                        },
                        {
                            "w:subsetted": {},
                        },
                    ],
                },
            ]),
        });
    });

    it("should work for subsetted", () => {
        const tree = new Formatter().format(
            createFont({
                name: "Times New Roman",
                notTrueType: true,
            }),
        );

        expect(tree).toStrictEqual({
            "w:font": expect.arrayContaining([
                {
                    "w:notTrueType": {},
                },
            ]),
        });
    });

    it("should work without fontKey", () => {
        const tree = new Formatter().format(
            createFont({
                name: "Times New Roman",
                embedItalic: {
                    id: "rId0",
                },
            }),
        );

        expect(tree).toStrictEqual({
            "w:font": expect.arrayContaining([
                {
                    "w:embedItalic": {
                        _attr: {
                            "r:id": "rId0",
                        },
                    },
                },
            ]),
        });
    });
});
