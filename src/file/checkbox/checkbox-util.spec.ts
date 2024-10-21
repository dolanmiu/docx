import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { CheckBoxUtil } from ".";

describe("CheckBoxUtil", () => {
    describe("#constructor()", () => {
        it("should create a CheckBoxUtil with proper root and default values", () => {
            const checkBoxUtil = new CheckBoxUtil();

            const tree = new Formatter().format(checkBoxUtil);

            expect(tree).to.deep.equal({
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
            });
        });

        it("should create a CheckBoxUtil with proper structure and custom values", () => {
            const checkBoxUtil = new CheckBoxUtil({
                checked: true,
                checkedState: {
                    value: "2713",
                    font: "Segoe UI Symbol",
                },
                uncheckedState: {
                    value: "2705",
                    font: "Segoe UI Symbol",
                },
            });

            const tree = new Formatter().format(checkBoxUtil);

            expect(tree).to.deep.equal({
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
            });
        });
    });
});
