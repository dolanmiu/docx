import { describe, expect, it } from "vitest";

import { categoryRowsOf, groupedCategoryLabelsOf, isCategoryGroups, leafCategoriesOf } from "./chart-categories";
import type { ChartCategoryGroup } from "./chart-options";

const years: readonly ChartCategoryGroup[] = [
    { name: "2024", categories: ["Q1", "Q2", "Q3"] },
    { name: "2025", categories: ["Q1", 2] },
];

const regions: readonly ChartCategoryGroup[] = [
    {
        name: "Europe",
        categories: [
            { name: "UK", categories: ["London", "Leeds"] },
            { name: "France", categories: ["Paris"] },
        ],
    },
    { name: "Asia", categories: [{ name: "Japan", categories: ["Tokyo"] }] },
];

describe("chart-categories", () => {
    describe("isCategoryGroups", () => {
        it("should tell groups from categories, including dates and numbers", () => {
            expect(isCategoryGroups(years)).to.equal(true);
            expect(isCategoryGroups(["Q1", "Q2"])).to.equal(false);
            expect(isCategoryGroups([1, 2])).to.equal(false);
            expect(isCategoryGroups([new Date("2025-01-01")])).to.equal(false);
            expect(isCategoryGroups([])).to.equal(false);
        });
    });

    describe("categoryRowsOf", () => {
        it("should give a row for each category, with its groups' names in the row of their first category only", () => {
            expect(categoryRowsOf(years)).to.deep.equal([
                ["2024", "Q1"],
                [undefined, "Q2"],
                [undefined, "Q3"],
                ["2025", "Q1"],
                [undefined, 2],
            ]);
        });

        it("should give groups of groups a column for each level, from the outermost in", () => {
            expect(categoryRowsOf(regions)).to.deep.equal([
                ["Europe", "UK", "London"],
                [undefined, undefined, "Leeds"],
                [undefined, "France", "Paris"],
                ["Asia", "Japan", "Tokyo"],
            ]);
        });
    });

    describe("leafCategoriesOf", () => {
        it("should give the categories along the axis, without their groups", () => {
            expect(leafCategoriesOf(years)).to.deep.equal(["Q1", "Q2", "Q3", "Q1", 2]);
            expect(leafCategoriesOf(regions)).to.deep.equal(["London", "Leeds", "Paris", "Tokyo"]);
        });

        it("should give categories that aren't in groups as they are", () => {
            const categories = ["A", 1, new Date("2025-01-01")];
            expect(leafCategoriesOf(categories)).to.equal(categories);
        });

        it("should keep a category of 0", () => {
            expect(leafCategoriesOf([{ name: "G", categories: [0] }])).to.deep.equal([0]);
        });
    });

    describe("groupedCategoryLabelsOf", () => {
        it("should read each category with its groups, from the outermost in", () => {
            expect(groupedCategoryLabelsOf(years)).to.deep.equal(["2024 Q1", "2024 Q2", "2024 Q3", "2025 Q1", "2025 2"]);
            expect(groupedCategoryLabelsOf(regions)).to.deep.equal([
                "Europe UK London",
                "Europe UK Leeds",
                "Europe France Paris",
                "Asia Japan Tokyo",
            ]);
        });
    });
});
