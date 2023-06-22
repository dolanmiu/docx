import { describe, expect, it } from "vitest";
import { Formatter } from "@export/formatter";
import { CheckBox } from ".";

describe("CheckBox", () => {
    describe("#constructor()", () => {
        it("should create a CheckBoxUtil with proper root and default values", () => {
            const checkBox = new CheckBox();

            const tree = new Formatter().format(checkBox);

            expect(tree).to.deep.equal({
                "w:sdt": [
                    {
                        "w:sdtPr": [
                            {
                                "w14:checkbox": [
                                    {
                                        "w14:checked": {
                                            _attr: {
                                                "w14:val": "0",
                                            },
                                        },
                                    },
                                    {
                                        "w14:checkedState": {
                                            _attr: {
                                                "w14:font": "MS Gothic",
                                                "w14:val": "2612",
                                            },
                                        },
                                    },
                                    {
                                        "w14:uncheckedState": {
                                            _attr: {
                                                "w14:font": "MS Gothic",
                                                "w14:val": "2610",
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        "w:sdtContent": [
                            {
                                "w:r": [
                                    {
                                        "w:sym": {
                                            _attr: {
                                                "w:char": "2610",
                                                "w:font": "MS Gothic",
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });

        it.each([
            ["2713", "Segoe UI Symbol", "2713", "Segoe UI Symbol"],
            [undefined, undefined, "2612", "MS Gothic"],
        ])("should create a CheckBoxUtil with proper root and custom values", (inputChar, inputFont, actualChar, actualFont) => {
            const checkBox = new CheckBox({
                checked: true,
                checkedState: {
                    value: inputChar,
                    font: inputFont,
                },
                uncheckedState: {
                    value: "2705",
                    font: "Segoe UI Symbol",
                },
            });

            const tree = new Formatter().format(checkBox);

            expect(tree).to.deep.equal({
                "w:sdt": [
                    {
                        "w:sdtPr": [
                            {
                                "w14:checkbox": [
                                    {
                                        "w14:checked": {
                                            _attr: {
                                                "w14:val": "1",
                                            },
                                        },
                                    },
                                    {
                                        "w14:checkedState": {
                                            _attr: {
                                                "w14:font": actualFont,
                                                "w14:val": actualChar,
                                            },
                                        },
                                    },
                                    {
                                        "w14:uncheckedState": {
                                            _attr: {
                                                "w14:font": "Segoe UI Symbol",
                                                "w14:val": "2705",
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        "w:sdtContent": [
                            {
                                "w:r": [
                                    {
                                        "w:sym": {
                                            _attr: {
                                                "w:char": actualChar,
                                                "w:font": actualFont,
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });

        it("should create a CheckBoxUtil with proper root and custom values", () => {
            const checkBox = new CheckBox({
                checked: false,
                checkedState: {
                    value: "2713",
                    font: "Segoe UI Symbol",
                },
                uncheckedState: {
                    value: "2705",
                    font: "Segoe UI Symbol",
                },
            });

            const tree = new Formatter().format(checkBox);

            expect(tree).to.deep.equal({
                "w:sdt": [
                    {
                        "w:sdtPr": [
                            {
                                "w14:checkbox": [
                                    {
                                        "w14:checked": {
                                            _attr: {
                                                "w14:val": "0",
                                            },
                                        },
                                    },
                                    {
                                        "w14:checkedState": {
                                            _attr: {
                                                "w14:font": "Segoe UI Symbol",
                                                "w14:val": "2713",
                                            },
                                        },
                                    },
                                    {
                                        "w14:uncheckedState": {
                                            _attr: {
                                                "w14:font": "Segoe UI Symbol",
                                                "w14:val": "2705",
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        "w:sdtContent": [
                            {
                                "w:r": [
                                    {
                                        "w:sym": {
                                            _attr: {
                                                "w:char": "2705",
                                                "w:font": "Segoe UI Symbol",
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });
    });
});
