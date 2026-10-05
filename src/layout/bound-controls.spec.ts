import { describe, expect, it } from "vitest";

import { boundText, withBoundTextWritten } from "./bound-controls";

const DC = "http://purl.org/dc/elements/1.1/";
const CP = "http://schemas.openxmlformats.org/package/2006/metadata/core-properties";
const CORE = "{6C3C8BC8-F283-45AE-878A-BAB7291924A1}";
// The core properties, and a custom XML part in a namespace of its own, and one in none
const STORES = new Map([
    [CORE, { "cp:coreProperties": [{ _attr: { "xmlns:cp": CP, "xmlns:dc": DC } }, { "dc:title": ["Annual ", { "w:x": ["report"] }] }] }],
    ["{A1}", { data: [{ _attr: { xmlns: "urn:probe" } }, { name: ["Ann"] }, { name: [{ _attr: { id: "2" } }, "Bob"] }] }],
    ["{A2}", { data: [{ item: ["plain"] }] }],
]);
const CORE_MAPPINGS = `xmlns:ns0='${DC}' xmlns:ns1="${CP}"`;

describe("boundText", () => {
    it("should give the text of the element a binding's path leads to, as Word fills a control in with it", () => {
        expect(
            boundText(
                {
                    "w:xpath": "/ns1:coreProperties[1]/ns0:title[1]",
                    "w:prefixMappings": CORE_MAPPINGS,
                    "w:storeItemID": CORE.toLowerCase(),
                },
                STORES,
            ),
        ).to.equal("Annual report");
        expect(
            boundText(
                { "w:xpath": "/ns0:data[1]/ns0:name[2]", "w:prefixMappings": "xmlns:ns0='urn:probe'", "w:storeItemID": "{a1}" },
                STORES,
            ),
        ).to.equal("Bob");
        expect(boundText({ "w:xpath": "/data/item", "w:storeItemID": "{A2}" }, STORES)).to.equal("plain");
    });

    it("should give nothing where the path can't be followed: a store the package hasn't, or a path other than of elements from the root", () => {
        const mapped = { "w:prefixMappings": "xmlns:ns0='urn:probe'", "w:storeItemID": "{A1}" };
        for (const xpath of [
            "data/name",
            "/ns0:data[1]/@id",
            "/ns0:data[1]/ns0:name[3]",
            "/ns1:data[1]",
            "/data[1]",
            "/ns0:data[1]/ns0:other",
        ]) {
            expect(boundText({ ...mapped, "w:xpath": xpath }, STORES)).to.equal(undefined);
        }
        expect(boundText({ "w:xpath": "/data/item", "w:storeItemID": "{B}" }, STORES)).to.equal(undefined);
        expect(boundText({ "w:xpath": "/data/item" }, STORES)).to.equal(undefined);
        expect(boundText({ "w:storeItemID": "{A2}" }, STORES)).to.equal(undefined);
    });
});

describe("withBoundTextWritten", () => {
    const control = (...content: readonly unknown[]): object => ({
        "w:sdt": [
            { "w:sdtPr": [{ "w:alias": {} }, { "w:dataBinding": { _attr: { "w:xpath": "/data/item", "w:storeItemID": "{A2}" } } }] },
            { "w:sdtContent": content },
        ],
    });
    const run = (...content: readonly unknown[]): object => ({ "w:r": content });
    const text = (value: string): object => ({ "w:t": [{ _attr: { "xml:space": "preserve" } }, value] });

    it("should take the binding out of a control whose text is what Word fills it in with, wherever it is", () => {
        // A run with attributes and properties of its own
        const formatted = { "w:r": [{ _attr: { "w:rsidR": "00A1" } }, { "w:rPr": [] }, text("in")] };
        const written = [
            { "w:tbl": [{ "w:tr": [{ "w:tc": [{ "w:p": [control(run(text("pla")), { "w:proofErr": {} }, formatted)] }] }] }] },
        ];
        expect(JSON.stringify(withBoundTextWritten(written, STORES))).not.to.contain("w:dataBinding");
        expect(JSON.stringify(withBoundTextWritten(written, STORES))).to.contain("w:alias");
    });

    it("should keep the binding of one with other text, or more than text, and leave the XML alone without stores", () => {
        for (const content of [run(text("other")), run({ "w:tab": {} }, text("plain")), { "w:p": [run({ "w:drawing": [] })] }]) {
            expect(JSON.stringify(withBoundTextWritten([control(content)], STORES))).to.contain("w:dataBinding");
        }
        const unbound = [{ "w:sdt": [{ "w:sdtPr": [] }, { "w:sdtContent": [run(text("plain"))] }] }];
        expect(withBoundTextWritten(unbound, STORES)).to.deep.equal(unbound);
        const xml = [control(run(text("plain")))];
        expect(withBoundTextWritten(xml, new Map())).to.equal(xml);
    });
});
