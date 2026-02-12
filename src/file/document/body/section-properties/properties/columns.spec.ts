import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createColumns } from "./columns";

describe("createColumns", () => {
    it("should create columns of equal width if equalWidth is true", () => {
        const columns = createColumns({ count: 3, space: 720 });
        const tree = new Formatter().format(columns);

        expect(tree["w:cols"]).to.deep.equal({ _attr: { "w:num": 3, "w:space": 720 } });
    });

    it("should create set space and count to undefined if they are undefined", () => {
        const columns = createColumns({});
        const tree = new Formatter().format(columns);

        expect(tree["w:cols"]).to.deep.equal({ _attr: {} });
    });

    it("should ignore individual column attributes if equalWidth is true", () => {
        const unequalColumns = [{ width: 1000, space: 400 }, { width: 2000 }];
        const columns = createColumns({ count: 3, space: 720, equalWidth: true, children: unequalColumns });
        const tree = new Formatter().format(columns);

        expect(tree).to.deep.equal({ "w:cols": { _attr: { "w:num": 3, "w:space": 720, "w:equalWidth": true } } });
    });

    it("should have column children if equalWidth is false and individual columns are provided", () => {
        const unequalColumns = [{ width: 1000, space: 400 }, { width: 2000 }];
        const columns = createColumns({ count: 3, space: 720, equalWidth: false, children: unequalColumns });
        const tree = new Formatter().format(columns);

        expect(tree).to.deep.equal({
            "w:cols": [
                { _attr: { "w:num": 3, "w:space": 720, "w:equalWidth": false } },
                { "w:col": { _attr: { "w:space": 400, "w:w": 1000 } } },
                { "w:col": { _attr: { "w:w": 2000 } } },
            ],
        });
    });
});
