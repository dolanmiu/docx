import { expect } from "chai";

import { Formatter } from "@export/formatter";
import { Form } from "./form/form";

describe("Form", () => {
    describe("#constructor()", () => {
        it("should create", () => {
            const tree = new Formatter().format(
                new Form({
                    pixels: {
                        x: 100,
                        y: 100,
                    },
                    emus: {
                        x: 100,
                        y: 100,
                    },
                }),
            );

            expect(tree).to.deep.equal({
                "a:xfrm": [
                    {
                        _attr: {},
                    },
                    {
                        "a:off": {
                            _attr: {
                                x: 0,
                                y: 0,
                            },
                        },
                    },
                    {
                        "a:ext": {
                            _attr: {
                                cx: 100,
                                cy: 100,
                            },
                        },
                    },
                ],
            });
        });

        it("should create with flip", () => {
            const tree = new Formatter().format(
                new Form({
                    pixels: {
                        x: 100,
                        y: 100,
                    },
                    emus: {
                        x: 100,
                        y: 100,
                    },
                    flip: {
                        vertical: true,
                        horizontal: true,
                    },
                }),
            );

            expect(tree).to.deep.equal({
                "a:xfrm": [
                    {
                        _attr: {
                            flipH: true,
                            flipV: true,
                        },
                    },
                    {
                        "a:off": {
                            _attr: {
                                x: 0,
                                y: 0,
                            },
                        },
                    },
                    {
                        "a:ext": {
                            _attr: {
                                cx: 100,
                                cy: 100,
                            },
                        },
                    },
                ],
            });
        });
    });
});
