import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { Indent } from "./indent";

describe("Indent", () => {
    it("should create", () => {
        const indent = new Indent({
            start: 10,
            end: 10,
            left: 10,
            right: 10,
            hanging: 10,
            firstLine: 10,
        });
        const tree = new Formatter().format(indent);
        expect(tree).to.deep.equal({
            "w:ind": {
                _attr: {
                    "w:start": 10,
                    "w:end": 10,
                    "w:firstLine": 10,
                    "w:hanging": 10,
                    "w:left": 10,
                    "w:right": 10,
                },
            },
        });
    });

    it("should create with no indent values", () => {
        const indent = new Indent({});

        const tree = new Formatter().format(indent);
        expect(tree).to.deep.equal({
            "w:ind": {
                _attr: {},
            },
        });
    });
});
