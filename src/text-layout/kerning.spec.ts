import { describe, expect, it } from "vitest";

import type { FaceKerning } from "./font-kerning";
import { WINDOWS_1252, decodeFace, hasLigatures, indexRules, joinLetters, kerningBetween, rulesOf, shapingOf } from "./kerning";

// cspell:ignore ffio offo stoffi Tfio

const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/";
/** A number in two of the tables' digits */
const twoDigits = (value: number): string => DIGITS[Math.floor(value / 64)] + DIGITS[value % 64];

// A face of four characters: T and o kerned 90 thousandths of an em nearer, with standard ligatures of ff, fi and ffi,
// an f drawn another way before o, and a discretional ligature of st, whose kerning after a T isn't known
const FACE: FaceKerning = {
    characters: "Tfio",
    // T is in first class 1, o in second class 1; o is in first class 2, T in second class 2; st is in second class 3
    first: "01000002",
    second: "02000001",
    pairs: `0101${twoDigits(2048 - 90)}0103${twoDigits(4095)}`,
    glyphs: [
        ["ff", 550, 0, 0],
        ["fi", 450, 0, 0],
        ["ffi", 700, 0, 0],
        ["f", 290, 0, 0],
        ["st", 600, 0, 3],
    ],
    ligatures: {
        standard: [
            // A rule of three characters that leaves the first as it is
            ["Tfi", ["T", 1]],
            ["ffi", [2]],
            ["ff", [0]],
            ["fi", [1]],
            ["f", [3], "o"],
        ],
        all: [
            ["ffi", [2]],
            ["st", [4]],
        ],
    },
};

describe("WINDOWS_1252", () => {
    it("should have the characters of Windows-1252, in order, with the space and no-break space but not the soft hyphen", () => {
        expect([...WINDOWS_1252]).to.have.length(217);
        expect(WINDOWS_1252.startsWith(" !")).to.equal(true);
        expect(WINDOWS_1252).to.include("€").and.include(" ").and.include("ÿ").and.not.include("­");
    });
});

describe("hasLigatures", () => {
    it("should be whether text joins letters", () => {
        expect(hasLigatures({})).to.equal(false);
        expect(hasLigatures({ ligatures: "none" })).to.equal(false);
        expect(hasLigatures({ ligatures: "standardContextual" })).to.equal(true);
    });
});

describe("joinLetters", () => {
    const shaping = decodeFace(FACE);
    const glyphsOf = (text: string, ligatures: "standard" | "all" = "standard"): readonly string[] =>
        joinLetters([...text], rulesOf(shaping, ligatures)!, shaping.glyphs).map(({ text: letters, glyph }) =>
            glyph === undefined ? letters : `⟨${letters}⟩`,
        );

    it("should join letters with the longest rule that starts with each, from the start of the text", () => {
        expect(glyphsOf("offio")).to.deep.equal(["o", "⟨ffi⟩", "o"]);
        expect(glyphsOf("offo")).to.deep.equal(["o", "⟨ff⟩", "o"]);
        expect(glyphsOf("fifi")).to.deep.equal(["⟨fi⟩", "⟨fi⟩"]);
        expect(glyphsOf("Tfi")).to.deep.equal(["T", "⟨fi⟩"]);
    });

    it("should put a glyph in place of a character before the one a rule looks at, which can start a rule of its own", () => {
        expect(glyphsOf("fo")).to.deep.equal(["⟨f⟩", "o"]);
        expect(glyphsOf("fT")).to.deep.equal(["f", "T"]);
    });

    it("should join the letters of each setting's rules", () => {
        expect(glyphsOf("stoffi", "all")).to.deep.equal(["⟨st⟩", "o", "⟨ffi⟩"]);
        expect(glyphsOf("offo", "all")).to.deep.equal(["o", "f", "f", "o"]);
    });

    it("should index rules by their first character, the longest first, and those that look at the next one last", () => {
        const index = indexRules([
            ["f", [3], "o"],
            ["ff", [0]],
            ["ffi", [2]],
        ]);
        expect(index.get("f")!.map(([letters]) => letters)).to.deep.equal(["ffi", "ff", "f"]);
    });
});

describe("decodeFace", () => {
    it("should read each character's classes and the kerning of pairs of classes, once for each face", () => {
        const shaping = decodeFace(FACE);
        expect(decodeFace(FACE)).to.equal(shaping);
        expect(shaping.classes.get("T")).to.deep.equal({ first: 1, second: 2 });
        expect(shaping.classes.get("o")).to.deep.equal({ first: 2, second: 1 });
        expect(shaping.pairs.get(1 * 4096 + 1)).to.equal(-90);
        expect(shaping.pairs.get(1 * 4096 + 3)).to.be.NaN;
        expect([...shaping.characters].join("")).to.equal("Tfio");
    });

    it("should have the rules of the settings Word showed, none for others, and none at all for a face that joins nothing", () => {
        const shaping = decodeFace(FACE);
        expect(rulesOf(shaping, "standard")).to.not.equal(undefined);
        expect(rulesOf(shaping, "standard")).to.equal(rulesOf(shaping, "standard"));
        expect(rulesOf(shaping, "contextual")).to.equal(undefined);
        const plain = decodeFace({
            ...FACE,
            characters: undefined,
            first: "00".repeat(217),
            second: "00".repeat(217),
            ligatures: { all: [] },
        });
        expect(rulesOf(plain, "contextual")!.size).to.equal(0);
        expect(plain.characters.size).to.equal(217);
    });
});

describe("kerningBetween", () => {
    const shaping = decodeFace(FACE);

    it("should kern pairs of characters by their classes, and others not at all", () => {
        expect(kerningBetween(shaping, { text: "T" }, { text: "o" })).to.equal(-90);
        expect(kerningBetween(shaping, { text: "o" }, { text: "T" })).to.equal(0);
        expect(kerningBetween(shaping, { text: "f" }, { text: "i" })).to.equal(0);
    });

    it("should kern a ligature by its own classes, and not know its kerning where it isn't known", () => {
        const [st] = joinLetters(["s", "t"], rulesOf(shaping, "all")!, shaping.glyphs);
        expect(st).to.deep.equal({ text: "st", width: 600, glyph: 4, first: 0, second: 3 });
        expect(kerningBetween(shaping, st, { text: "T" })).to.equal(0);
        // Its kerning with what is before it isn't known, nor that of a character the face's kerning doesn't have
        expect(kerningBetween(shaping, { text: "T" }, st)).to.be.NaN;
        expect(kerningBetween(shaping, { text: "T" }, { text: "Ж" })).to.be.NaN;
    });
});

describe("shapingOf", () => {
    it("should be the kerning and ligatures of the fonts of the tables, by their name and face, and none for others", () => {
        expect(shapingOf("Calibri", false, false)).to.not.equal(undefined);
        expect(shapingOf("Calibri", true, true)).to.not.equal(undefined);
        expect(shapingOf("Calibri", false, true)).to.not.equal(shapingOf("Calibri", true, true));
        expect(shapingOf("Carlito", false, false)).to.equal(undefined);
    });
});
