import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { FontWrapper } from "./font-wrapper";

describe("FontWrapper", () => {
    it("emits sequential `fonts/font<N>.odttf` relationship Targets for each embedded font", () => {
        // Regression for https://github.com/dolanmiu/docx/issues/3019 —
        // relationship Targets used to embed the user-facing family name
        // (e.g. `fonts/EB Garamond.odttf`), which Word rejected when the
        // name contained spaces or non-ASCII chars. Sequential filenames
        // decouple the package path from the family name.
        const wrapper = new FontWrapper([
            { name: "EB Garamond", data: Buffer.from("") },
            { name: "Source Serif 4", data: Buffer.from("") },
            { name: "Crimson Pro", data: Buffer.from("") },
        ]);

        const tree = new Formatter().format(wrapper.Relationships);
        const targets = JSON.stringify(tree).match(/fonts\/font\d+\.odttf/g) ?? [];

        expect(targets).to.deep.equal(["fonts/font1.odttf", "fonts/font2.odttf", "fonts/font3.odttf"]);
        expect(JSON.stringify(tree)).to.not.include("EB Garamond.odttf");
        expect(JSON.stringify(tree)).to.not.include("Source Serif 4.odttf");
    });
});
