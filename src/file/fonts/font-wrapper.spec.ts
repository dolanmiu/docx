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

    it("embeds each face a font gives as a file of its own, with a relationship and a key of its own", () => {
        const wrapper = new FontWrapper([
            {
                name: "Probe",
                data: Buffer.from("regular"),
                bold: Buffer.from("bold"),
                italic: Buffer.from("italic"),
                boldItalic: Buffer.from("bold italic"),
            },
            { name: "Other", data: Buffer.from("other") },
        ]);

        expect(wrapper.files.map(({ name, data, bold, italic }) => [name, data.toString(), bold, italic])).to.deep.equal([
            ["Probe", "regular", false, false],
            ["Probe", "bold", true, false],
            ["Probe", "italic", false, true],
            ["Probe", "bold italic", true, true],
            ["Other", "other", false, false],
        ]);
        expect(new Set(wrapper.files.map(({ fontKey }) => fontKey)).size).to.equal(5);
        expect(wrapper.fontOptionsWithKey.map(({ fontKey }) => fontKey)).to.deep.equal([
            wrapper.files[0].fontKey,
            wrapper.files[4].fontKey,
        ]);

        const targets = JSON.stringify(new Formatter().format(wrapper.Relationships)).match(/fonts\/font\d+\.odttf/g);
        expect(targets).to.deep.equal([
            "fonts/font1.odttf",
            "fonts/font2.odttf",
            "fonts/font3.odttf",
            "fonts/font4.odttf",
            "fonts/font5.odttf",
        ]);

        const table = new Formatter().format(wrapper.View) as { readonly "w:fonts": readonly Record<string, unknown>[] };
        const embeds = table["w:fonts"]
            .filter((child) => "w:font" in child)
            .map((child) =>
                (child["w:font"] as readonly Record<string, { readonly _attr: Record<string, string> }>[]).flatMap((element) =>
                    Object.entries(element)
                        .filter(([name]) => name.startsWith("w:embed"))
                        .map(([name, { _attr }]) => [name, _attr["r:id"], _attr["w:fontKey"]]),
                ),
            );
        const key = (index: number): string => `{${wrapper.files[index].fontKey.toUpperCase()}}`;
        expect(embeds).to.deep.equal([
            [
                ["w:embedRegular", "rId1", key(0)],
                ["w:embedBold", "rId2", key(1)],
                ["w:embedItalic", "rId3", key(2)],
                ["w:embedBoldItalic", "rId4", key(3)],
            ],
            [["w:embedRegular", "rId5", key(4)]],
        ]);
    });
});
