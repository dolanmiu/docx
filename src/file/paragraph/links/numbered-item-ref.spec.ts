import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { NumberedItemReference, NumberedItemReferenceFormat } from "./numbered-item-ref";

describe("NumberedItemReference", () => {
    describe("#constructor()", () => {
        it("should create a numbered item ref without options", () => {
            const ref = new NumberedItemReference("some_bookmark");
            const tree = new Formatter().format(ref);
            expect(tree).to.deep.equal({
                "w:fldSimple": {
                    _attr: {
                        "w:instr": "REF some_bookmark \\h \\w",
                    },
                },
            });
        });

        it("should create a numbered item ref with hyperlink option disabled", () => {
            const ref = new NumberedItemReference("some_bookmark", "1", { hyperlink: false });
            const tree = new Formatter().format(ref);
            expect(tree).to.deep.equal({
                "w:fldSimple": [
                    {
                        _attr: {
                            "w:instr": "REF some_bookmark \\w",
                        },
                    },
                    {
                        "w:r": [
                            {
                                "w:t": [
                                    {
                                        _attr: {
                                            "xml:space": "preserve",
                                        },
                                    },
                                    "1",
                                ],
                            },
                        ],
                    },
                ],
            });
        });

        it("should create a numbered item ref with referenceFormat option", () => {
            const ref = new NumberedItemReference("some_bookmark", "1", { referenceFormat: NumberedItemReferenceFormat.RELATIVE });
            const tree = new Formatter().format(ref);
            expect(tree).to.deep.equal({
                "w:fldSimple": [
                    {
                        _attr: {
                            "w:instr": "REF some_bookmark \\h \\r",
                        },
                    },
                    {
                        "w:r": [
                            {
                                "w:t": [
                                    {
                                        _attr: {
                                            "xml:space": "preserve",
                                        },
                                    },
                                    "1",
                                ],
                            },
                        ],
                    },
                ],
            });
        });

        it("should be possible to use the none referenceFormat option", () => {
            const ref = new NumberedItemReference("some_bookmark", "1", { referenceFormat: NumberedItemReferenceFormat.NONE });
            const tree = new Formatter().format(ref);
            expect(tree).to.deep.equal({
                "w:fldSimple": [
                    {
                        _attr: {
                            "w:instr": "REF some_bookmark \\h",
                        },
                    },
                    {
                        "w:r": [
                            {
                                "w:t": [
                                    {
                                        _attr: {
                                            "xml:space": "preserve",
                                        },
                                    },
                                    "1",
                                ],
                            },
                        ],
                    },
                ],
            });
        });

        it("should be possible to use the NO_CONTEXT referenceFormat option", () => {
            const ref = new NumberedItemReference("some_bookmark", "1", { referenceFormat: NumberedItemReferenceFormat.NO_CONTEXT });
            const tree = new Formatter().format(ref);
            expect(tree).to.deep.equal({
                "w:fldSimple": [
                    {
                        _attr: {
                            "w:instr": "REF some_bookmark \\h \\n",
                        },
                    },
                    {
                        "w:r": [
                            {
                                "w:t": [
                                    {
                                        _attr: {
                                            "xml:space": "preserve",
                                        },
                                    },
                                    "1",
                                ],
                            },
                        ],
                    },
                ],
            });
        });
    });
});
