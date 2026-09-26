// cspell:ignore Haut Clôture
import { describe, expect, it } from "vitest";

import { stockSeriesOf } from "./chart-stock";

describe("stockSeriesOf", () => {
    it("should give the volumes, opens, highs, lows and closes in Word's order, whatever order they are given in", () => {
        expect(
            stockSeriesOf({ type: "stock", categories: ["A"], close: [4], low: [1], high: [5], open: [2], volume: [100] }).map(
                ({ role, name, values }) => [role, name, values],
            ),
        ).to.deep.equal([
            ["volume", "Volume", [100]],
            ["open", "Open", [2]],
            ["high", "High", [5]],
            ["low", "Low", [1]],
            ["close", "Close", [4]],
        ]);
    });

    it("should leave out the opens and volumes not given, and name each series its own name", () => {
        expect(
            stockSeriesOf({
                type: "stock",
                categories: ["A"],
                high: [5],
                low: [1],
                close: [4],
                names: { high: "Haut", low: "Bas", close: "Clôture", open: "Unused" },
            }).map(({ role, name }) => `${role} ${name}`),
        ).to.deep.equal(["high Haut", "low Bas", "close Clôture"]);
    });
});
