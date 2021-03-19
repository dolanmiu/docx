import { expect } from "chai";

import { Formatter } from "export/formatter";

import { Body } from "./body";

describe("Body", () => {
    let body: Body;

    beforeEach(() => {
        body = new Body();
    });

    describe("#addSection", () => {
        it("should add section with default parameters", () => {
            body.addSection({
                page: {
                    size: {
                        width: 10000,
                        height: 10000,
                    },
                },
            });

            const tree = new Formatter().format(body);

            expect(tree).to.deep.equal({
                "w:body": [
                    {
                        "w:sectPr": [
                            { "w:pgSz": { _attr: { "w:w": 10000, "w:h": 10000, "w:orient": "portrait" } } },
                            {
                                "w:pgMar": {
                                    _attr: {
                                        "w:top": 1440,
                                        "w:right": 1440,
                                        "w:bottom": 1440,
                                        "w:left": 1440,
                                        "w:header": 708,
                                        "w:footer": 708,
                                        "w:gutter": 0,
                                        "w:mirrorMargins": false,
                                    },
                                },
                            },
                            { "w:cols": { _attr: { "w:space": 708, "w:sep": false, "w:num": 1 } } },
                            { "w:docGrid": { _attr: { "w:linePitch": 360 } } },
                            {
                                "w:pgNumType": {
                                    _attr: {},
                                },
                            },
                        ],
                    },
                ],
            });
        });
    });
});
