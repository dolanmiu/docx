import { describe, expect, it } from "vitest";

import { isSamePart, relationshipsPathOf, relativeTarget, resolveTarget, sourceOfRelationships } from "./package-paths";

describe("relationshipsPathOf", () => {
    it("should give the relationships part of a part in word/", () => {
        expect(relationshipsPathOf("word/document.xml")).to.equal("word/_rels/document.xml.rels");
        expect(relationshipsPathOf("word/header1.xml")).to.equal("word/_rels/header1.xml.rels");
    });

    it("should give the relationships part of a part in a folder of its own", () => {
        expect(relationshipsPathOf("word/charts/chart1.xml")).to.equal("word/charts/_rels/chart1.xml.rels");
        expect(relationshipsPathOf("word/glossary/document.xml")).to.equal("word/glossary/_rels/document.xml.rels");
    });

    it("should give the relationships part of a part at the package's root", () => {
        expect(relationshipsPathOf("chart.xml")).to.equal("_rels/chart.xml.rels");
    });
});

describe("sourceOfRelationships", () => {
    it("should give the part a relationships part belongs to", () => {
        expect(sourceOfRelationships("word/_rels/document.xml.rels")).to.equal("word/document.xml");
        expect(sourceOfRelationships("word/charts/_rels/chart1.xml.rels")).to.equal("word/charts/chart1.xml");
        expect(sourceOfRelationships("_rels/chart.xml.rels")).to.equal("chart.xml");
    });

    it("should give the package's root for the package's own relationships", () => {
        expect(sourceOfRelationships("_rels/.rels")).to.equal("");
    });

    it("should be the opposite of relationshipsPathOf", () => {
        for (const path of ["word/document.xml", "word/charts/chart10.xml", "a/b/c/d.xml", "x.xml"]) {
            expect(sourceOfRelationships(relationshipsPathOf(path))).to.equal(path);
        }
    });
});

describe("resolveTarget", () => {
    it("should resolve a target relative to the folder of the part it is from", () => {
        expect(resolveTarget("word/document.xml", "charts/chart1.xml")).to.equal("word/charts/chart1.xml");
        expect(resolveTarget("word/charts/chart1.xml", "../embeddings/Microsoft_Excel_Worksheet1.xlsx")).to.equal(
            "word/embeddings/Microsoft_Excel_Worksheet1.xlsx",
        );
        expect(resolveTarget("word/charts/chart1.xml", "style1.xml")).to.equal("word/charts/style1.xml");
    });

    it("should resolve a target from the package's root when it starts with a slash", () => {
        expect(resolveTarget("word/charts/chart1.xml", "/word/embeddings/book.xlsx")).to.equal("word/embeddings/book.xlsx");
        expect(resolveTarget("", "/word/document.xml")).to.equal("word/document.xml");
    });

    it("should resolve the package's own relationships from its root", () => {
        expect(resolveTarget("", "word/document.xml")).to.equal("word/document.xml");
    });

    it("should read backslashes as slashes", () => {
        expect(resolveTarget("word/document.xml", "charts\\chart1.xml")).to.equal("word/charts/chart1.xml");
        expect(resolveTarget("word/charts/chart1.xml", "..\\embeddings\\book.xlsx")).to.equal("word/embeddings/book.xlsx");
    });

    it("should leave out empty and current folders, and never go above the root", () => {
        expect(resolveTarget("word/document.xml", "./charts//./chart1.xml")).to.equal("word/charts/chart1.xml");
        expect(resolveTarget("word/document.xml", "../../../../x.xml")).to.equal("x.xml");
        expect(resolveTarget("word/a/b/c.xml", "../../d.xml")).to.equal("word/d.xml");
    });
});

describe("relativeTarget", () => {
    it("should give a target in the same folder", () => {
        expect(relativeTarget("word/document.xml", "word/styles.xml")).to.equal("styles.xml");
    });

    it("should give a target in a folder below", () => {
        expect(relativeTarget("word/document.xml", "word/charts/chart1.xml")).to.equal("charts/chart1.xml");
    });

    it("should give a target in a folder beside", () => {
        expect(relativeTarget("word/charts/chart1.xml", "word/embeddings/Microsoft_Excel_Worksheet2.xlsx")).to.equal(
            "../embeddings/Microsoft_Excel_Worksheet2.xlsx",
        );
    });

    it("should give a target in a folder above, and from the root", () => {
        expect(relativeTarget("word/a/b/c.xml", "word/d.xml")).to.equal("../../d.xml");
        expect(relativeTarget("word/a/b/c.xml", "x.xml")).to.equal("../../../x.xml");
        expect(relativeTarget("chart.xml", "word/embeddings/book.xlsx")).to.equal("word/embeddings/book.xlsx");
    });

    it("should give a target that resolves to the part", () => {
        const paths = ["word/document.xml", "word/charts/chart1.xml", "word/embeddings/book.xlsx", "a.xml", "word/a/b/c/d.xml", "x/y.xml"];
        for (const from of paths) {
            for (const to of paths) {
                expect(resolveTarget(from, relativeTarget(from, to)), `${from} to ${to}`).to.equal(to);
            }
        }
    });
});

describe("isSamePart", () => {
    it("should be the same part for paths that differ only in case", () => {
        expect(isSamePart("word/theme/theme1.xml", "word/theme/theme1.xml")).to.equal(true);
        expect(isSamePart("word/Theme/THEME1.xml", "word/theme/theme1.xml")).to.equal(true);
    });

    it("should be another part for another path", () => {
        expect(isSamePart("word/theme/theme1.xml", "word/theme/theme2.xml")).to.equal(false);
        expect(isSamePart("word/theme1.xml", "word/theme/theme1.xml")).to.equal(false);
    });
});
