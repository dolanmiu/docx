import { describe, expect, it } from "vitest";

import { type TestFontOptions, buildTestFont, buildTestFontCollection } from "tests/font-file";

import { createFontFileMeasurer, readFontFile } from "./font-file";
import { DEFAULT_MEASURER } from "./line-breaking";

// cspell:ignore hhea hmtx cmap Aptos aptos GPOS DFLT

// A font of 1000 units to the em, whose letters are as wide as their place in the alphabet, in hundreds of units
const LETTERS: TestFontOptions["advances"] = Object.fromEntries([
    ["A", 100],
    ["B", 200],
    ["C", 300],
    ["V", 400],
    [" ", 250],
]);

const faceOf = (options: TestFontOptions): ReturnType<typeof readFontFile>[number] => {
    const faces = readFontFile(buildTestFont(options));
    expect(faces).to.have.length(1);
    return faces[0];
};

describe("readFontFile", () => {
    it("should read a font's name and widths in ems, and no width for characters it has no glyph for", () => {
        const face = faceOf({ advances: LETTERS, unitsPerEm: 2000 });
        expect(face.name).to.equal("Probe Sans");
        expect(face.bold).to.equal(false);
        expect(face.italic).to.equal(false);
        expect(face.advanceOf("A".codePointAt(0)!)).to.equal(0.05);
        expect(face.advanceOf("B".codePointAt(0)!)).to.equal(0.1);
        // Read again, from what was read the first time
        expect(face.advanceOf("B".codePointAt(0)!)).to.equal(0.1);
        expect(face.advanceOf(" ".codePointAt(0)!)).to.equal(0.125);
        expect(face.advanceOf("Z".codePointAt(0)!)).to.equal(undefined);
    });

    it("should read the characters past U+FFFF of a font with a map of the whole of Unicode", () => {
        const face = faceOf({
            advances: Object.fromEntries([
                ["A", 100],
                ["\u{1f600}", 900],
            ]),
            characterMap: "full",
        });
        expect(face.advanceOf(0x1f600)).to.equal(0.9);
        expect(face.advanceOf("A".codePointAt(0)!)).to.equal(0.1);
        expect(face.advanceOf(0x1f601)).to.equal(undefined);
        expect(face.advanceOf(0x20)).to.equal(undefined);
    });

    it("should prefer the map of the whole of Unicode to the map of the characters up to U+FFFF", () => {
        expect(faceOf({ advances: LETTERS, characterMap: "both" }).advanceOf("C".codePointAt(0)!)).to.equal(0.3);
    });

    it("should leave out characters a map in format 4 gives no glyph", () => {
        const face = faceOf({ advances: LETTERS });
        expect(face.advanceOf(0xfffe)).to.equal(undefined);
        expect(face.advanceOf(0xffff)).to.equal(undefined);
        expect(face.advanceOf(0x10000)).to.equal(undefined);
    });

    it("should make glyphs past those with widths of their own as wide as the last of them", () => {
        const face = faceOf({ advances: { A: 600, B: 0, C: 0 }, metricCount: 2 });
        expect(face.advanceOf("C".codePointAt(0)!)).to.equal(0.6);
    });

    it("should work out the line height as Word does: Windows' ascent and descent, and the gap the hhea table adds", () => {
        // Times New Roman: Windows' 1825 and 443, and an hhea table of the same with a gap of 87, which Windows adds
        const times = { unitsPerEm: 2048, windows: { ascent: 1825, descent: 443 }, hhea: { ascender: 1825, descender: -443, lineGap: 87 } };
        expect(faceOf({ advances: LETTERS, ...times }).lineHeight).to.be.closeTo(1.1499, 0.0001);
        // Calibri: Windows' 1950 and 550 are already taller than the hhea table's 1536, 512 and 452 together
        const calibri = {
            unitsPerEm: 2048,
            windows: { ascent: 1950, descent: 550 },
            hhea: { ascender: 1536, descender: -512, lineGap: 452 },
        };
        expect(faceOf({ advances: LETTERS, ...calibri }).lineHeight).to.be.closeTo(1.2207, 0.0001);
        // Its lines go Windows' descent below the baseline, as a picture beside Calibri 11 shows in Word
        // (word-watertight-text.docx TX8b), and the hhea table's gap is above the text
        expect(faceOf({ advances: LETTERS, ...calibri }).descent).to.be.closeTo(550 / 2048, 1e-9);
        expect(faceOf({ advances: LETTERS, ...times }).descent).to.be.closeTo(443 / 2048, 1e-9);
    });

    it("should make a line as tall as the typographic ascent, descent and line gap of a font that asks for them, as Aptos does", () => {
        // Aptos: 1923 and 577 for its typographic ascent and descent, and 2068 and 563 for Windows'
        const aptos = {
            unitsPerEm: 2048,
            windows: { ascent: 2068, descent: 563 },
            typographic: { ascent: 1923, descent: 577, lineGap: 0 },
        };
        expect(faceOf({ advances: LETTERS, ...aptos }).lineHeight).to.be.closeTo(1.2207, 0.0001);
        expect(faceOf({ advances: LETTERS, typographic: { ascent: 700, descent: 200, lineGap: 100 } }).lineHeight).to.equal(1);
        // And go its typographic descent below the baseline
        expect(faceOf({ advances: LETTERS, ...aptos }).descent).to.be.closeTo(577 / 2048, 1e-9);
    });

    it("should read whether a face is bold or italic from its OS/2 table", () => {
        const face = faceOf({ advances: LETTERS, bold: true, italic: true });
        expect(face.bold).to.equal(true);
        expect(face.italic).to.equal(true);
    });

    it("should read a font without an OS/2 table from its head and hhea tables", () => {
        const face = faceOf({
            advances: LETTERS,
            windows: false,
            bold: true,
            hhea: { ascender: 900, descender: -300, lineGap: 100 },
        });
        expect(face.lineHeight).to.equal(1.3);
        expect(face.descent).to.equal(0.3);
        expect(face.bold).to.equal(true);
        expect(face.italic).to.equal(false);
        expect(faceOf({ advances: LETTERS, windows: false, italic: true }).italic).to.equal(true);
    });

    it("should read the family name in English for Windows, then in any language, then for Unicode, then for the Mac", () => {
        const record = (platform: number, encoding: number, language: number, text: string) => ({ platform, encoding, language, text });
        const name = (records: readonly ReturnType<typeof record>[]): string => faceOf({ advances: LETTERS, name: records }).name;
        expect(name([record(3, 1, 0x407, "Deutsch"), record(3, 1, 0x409, "English")])).to.equal("English");
        expect(name([record(1, 0, 0, "Mac"), record(3, 1, 0x407, "Deutsch")])).to.equal("Deutsch");
        expect(name([record(1, 0, 0, "Mac"), record(0, 3, 0, "Unicode")])).to.equal("Unicode");
        expect(name([record(1, 0, 0, "Mac")])).to.equal("Mac");
        expect(name([record(1, 1, 0, "Japanese")])).to.equal("");
        expect(faceOf({ advances: LETTERS, without: ["name"] }).name).to.equal("");
    });

    it("should kern pairs of characters from the kern table's subtables of pairs", () => {
        const face = faceOf({ advances: LETTERS, kerning: { AV: -80, VA: -60, BC: 20 } });
        const kerning = (pair: string): number => face.kerningOf(pair.codePointAt(0)!, pair.codePointAt(1)!);
        expect(kerning("AV")).to.equal(-0.08);
        expect(kerning("VA")).to.equal(-0.06);
        expect(kerning("BC")).to.equal(0.02);
        expect(kerning("AB")).to.equal(0);
    });

    it("should add up the kerning of a pair in several subtables", () => {
        const face = faceOf({ advances: LETTERS, kerning: { AV: -80 }, kernTable: "twice" });
        expect(face.kerningOf("A".codePointAt(0)!, "V".codePointAt(0)!)).to.equal(-0.16);
    });

    it("should leave out Apple's kern tables, and fonts without a kern table aren't kerned", () => {
        const apple = faceOf({ advances: LETTERS, kerning: { AV: -80 }, kernTable: "apple" });
        expect(apple.kerningOf("A".codePointAt(0)!, "V".codePointAt(0)!)).to.equal(0);
        const none = faceOf({ advances: LETTERS, without: ["kern"] });
        expect(none.kerningOf("A".codePointAt(0)!, "V".codePointAt(0)!)).to.equal(0);
    });

    describe("kerning from the GPOS table", () => {
        const kerningOf = (options: Omit<TestFontOptions, "advances">, pair: string): number =>
            faceOf({ advances: LETTERS, ...options }).kerningOf(pair.codePointAt(0)!, pair.codePointAt(1)!);
        const pairs = (values: Readonly<Record<string, number>>, extra: object = {}) => ({ format: 1 as const, pairs: values, ...extra });

        it("should kern pairs with the pair adjustments of the kern feature, rather than the kern table", () => {
            const glyphPositioning = { lookups: [{ subtables: [pairs({ AV: -50, AB: 30 })] }] };
            expect(kerningOf({ glyphPositioning, kerning: { AV: -80, VA: -60 } }, "AV")).to.equal(-0.05);
            expect(kerningOf({ glyphPositioning, kerning: { AV: -80, VA: -60 } }, "VA")).to.equal(0);
            expect(kerningOf({ glyphPositioning }, "AB")).to.equal(0.03);
            expect(kerningOf({ glyphPositioning }, "BA")).to.equal(0);
        });

        it("should read coverage in ranges, and value records with a placement before the change to the advance", () => {
            const subtable = pairs({ AV: -50, BV: -20, CV: -10 }, { coverage: 2, valueFormats: { first: 5, second: 0 } });
            const glyphPositioning = { lookups: [{ subtables: [subtable] }] };
            expect(["AV", "BV", "CV", "VA"].map((pair) => kerningOf({ glyphPositioning }, pair))).to.deep.equal([-0.05, -0.02, -0.01, 0]);
        });

        it("should add the change to the second glyph's advance, and leave out a first value record without one", () => {
            const glyphPositioning = { lookups: [{ subtables: [pairs({ AV: -40 }, { valueFormats: { first: 1, second: 4 } })] }] };
            expect(kerningOf({ glyphPositioning }, "AV")).to.equal(-0.04);
        });

        it("should kern classes of glyphs, with glyphs in no class in class 0", () => {
            // B is in no class, between A and C
            const subtable = (format: 1 | 2) => ({
                format: 2 as const,
                covered: "ABC",
                firstClasses: { A: 1, C: 1 },
                secondClasses: { V: 1, C: 2 },
                values: [
                    [0, -10, 0],
                    [5, -70, -30],
                ],
                coverage: format,
                classes: format,
            });
            for (const format of [1, 2] as const) {
                const glyphPositioning = { lookups: [{ subtables: [subtable(format)] }] };
                expect(["AV", "CC", "AA", "BV", "BB", "VA"].map((pair) => kerningOf({ glyphPositioning }, pair))).to.deep.equal([
                    -0.07, -0.03, 0.005, -0.01, 0, 0,
                ]);
            }
        });

        it("should kern a pair with the first subtable of a lookup that has it, and add up the lookups", () => {
            const classes = {
                format: 2 as const,
                covered: "AB",
                firstClasses: { A: 1 },
                secondClasses: { V: 1 },
                values: [
                    [0, 0],
                    [3, -70],
                ],
            };
            const glyphPositioning = {
                lookups: [{ subtables: [pairs({ AV: -50 }), classes] }, { subtables: [pairs({ AV: -5, BV: -6 })], extension: true }],
            };
            // AV is in the first subtable of the first lookup, so its classes aren't, and the second lookup adds to it
            expect(kerningOf({ glyphPositioning }, "AV")).to.equal(-0.055);
            // BV isn't, so it is kerned by the classes, which have it in class 0, and by the second lookup
            expect(kerningOf({ glyphPositioning }, "BV")).to.equal(-0.006);
            // A is in the first subtable, but not with B, so AB is kerned by the classes
            expect(kerningOf({ glyphPositioning }, "AB")).to.equal(0.003);
            // Read again, from what was read the first time
            expect(kerningOf({ glyphPositioning }, "AV")).to.equal(-0.055);
        });

        it("should leave out lookups that aren't pair adjustments", () => {
            const glyphPositioning = {
                lookups: [{ subtables: [pairs({ AV: -50 })] }, { subtables: [], type: 8 }, { subtables: [], type: 8, extension: true }],
            };
            expect(kerningOf({ glyphPositioning }, "AV")).to.equal(-0.05);
        });

        it("should use the default script, then the first, and the first language's features when a script has no default", () => {
            const lookups = [{ subtables: [pairs({ AV: -50 })] }];
            expect(kerningOf({ glyphPositioning: { script: "DFLT", lookups } }, "AV")).to.equal(-0.05);
            expect(kerningOf({ glyphPositioning: { script: "cyrl", lookups } }, "AV")).to.equal(-0.05);
            expect(kerningOf({ glyphPositioning: { defaultLanguage: false, lookups } }, "AV")).to.equal(-0.05);
        });

        it("should kern with the kern table when the GPOS table has no script or no kern lookups", () => {
            expect(kerningOf({ glyphPositioning: { script: null, lookups: [] }, kerning: { AV: -80 } }, "AV")).to.equal(-0.08);
            expect(kerningOf({ glyphPositioning: { lookups: [] }, kerning: { AV: -80 } }, "AV")).to.equal(-0.08);
        });
    });

    it("should read each font of a collection", () => {
        const faces = readFontFile(
            buildTestFontCollection([
                { advances: LETTERS, name: "Probe Serif" },
                { advances: { A: 900 }, name: "Probe Serif", bold: true },
            ]),
        );
        expect(faces.map(({ name, bold }) => [name, bold])).to.deep.equal([
            ["Probe Serif", false],
            ["Probe Serif", true],
        ]);
        expect(faces[1].advanceOf("A".codePointAt(0)!)).to.equal(0.9);
    });

    it("should read an ArrayBuffer, and a part of a larger buffer", () => {
        const font = buildTestFont({ advances: LETTERS });
        expect(readFontFile(font.slice().buffer)[0].name).to.equal("Probe Sans");
        const larger = new Uint8Array(font.length + 8);
        larger.set(font, 8);
        expect(readFontFile(larger.subarray(8))[0].advanceOf("A".codePointAt(0)!)).to.equal(0.1);
    });

    it("should throw for web fonts and data that isn't a font", () => {
        const start = (tag: string): Uint8Array => Uint8Array.from([...tag.padEnd(12, " ")].map((character) => character.charCodeAt(0)));
        expect(() => readFontFile(start("wOFF"))).to.throw("web font");
        expect(() => readFontFile(start("wOF2"))).to.throw("web font");
        expect(() => readFontFile(start("%PDF"))).to.throw("isn't a TrueType or OpenType font");
        expect(() => readFontFile(new Uint8Array(4))).to.throw("isn't a TrueType or OpenType font");
    });

    it("should throw when a font file is read for one cut short or damaged, rather than when text is laid out in it", () => {
        // The kern table is the last of a font without an OS/2 table, and its kerning is read when the font is
        const font = buildTestFont({ advances: LETTERS, kerning: { AV: -50 }, windows: false });
        expect(() => readFontFile(font.slice(0, font.length - 10))).to.throw(
            "The font file is cut short: its kern table goes past its end",
        );
        // A character map whose subtable is past the end of the file
        const damaged = font.slice();
        const view = new DataView(damaged.buffer);
        const record = Array.from({ length: view.getUint16(4) }, (_, index) => 12 + index * 16).find(
            (offset) => String.fromCharCode(...damaged.slice(offset, offset + 4)) === "cmap",
        )!;
        view.setUint32(view.getUint32(record + 8) + 8, 0xfffff);
        expect(() => readFontFile(damaged)).to.throw("The font file is damaged: it points past its end");
        expect(() => readFontFile(buildTestFontCollection([{ advances: LETTERS }]).slice(0, 40))).to.throw("The font file is damaged");
    });

    it("should throw for a font without the tables it needs", () => {
        expect(() => readFontFile(buildTestFont({ advances: LETTERS, without: ["hmtx"] }))).to.throw("The font has no hmtx table");
        expect(() => readFontFile(buildTestFont({ advances: LETTERS, characterMap: "mac" }))).to.throw("no Unicode character map");
    });
});

describe("createFontFileMeasurer", () => {
    const fonts = (...options: readonly TestFontOptions[]): ReturnType<typeof readFontFile> =>
        options.flatMap((font) => readFontFile(buildTestFont(font)));

    it("should measure text in a font from its widths, at its size, scale and spacing", () => {
        const measurer = createFontFileMeasurer(fonts({ advances: LETTERS }));
        expect(measurer.measureWidth("ABC", { font: "Probe Sans", size: 10 })).to.be.closeTo(6, 1e-9);
        expect(measurer.measureWidth("ABC", { font: "probe sans", size: 20, scale: 50 })).to.be.closeTo(6, 1e-9);
        expect(measurer.measureWidth("ABC", { font: "Probe Sans", size: 10, characterSpacing: 1 })).to.be.closeTo(9, 1e-9);
        // 10 points when no size is given
        expect(measurer.measureWidth("A", { font: "Probe Sans" })).to.be.closeTo(1, 1e-9);
    });

    it("should measure a line as tall as the font's line height at its size", () => {
        const measurer = createFontFileMeasurer(fonts({ advances: LETTERS, windows: { ascent: 900, descent: 300 } }));
        expect(measurer.measureLineHeight({ font: "Probe Sans", size: 10 })).to.be.closeTo(12, 1e-9);
        expect(measurer.measureLineHeight({ font: "Probe Sans" })).to.be.closeTo(12, 1e-9);
        // And as far below the baseline as its descent, and other fonts as the fallback measures them
        expect(measurer.measureDescent({ font: "Probe Sans", size: 10 })).to.be.closeTo(3, 1e-9);
        expect(measurer.measureDescent({ font: "Probe Sans" })).to.be.closeTo(3, 1e-9);
        expect(measurer.measureDescent({ font: "Calibri", size: 11 })).to.equal(
            DEFAULT_MEASURER.measureDescent({ font: "Calibri", size: 11 }),
        );
        // Superscript takes up the line of its run's size (word-run-formatting.ts RF3)
        expect(measurer.measureLineHeight({ font: "Probe Sans", size: 6.5, lineSize: 10 })).to.be.closeTo(12, 1e-9);
        expect(measurer.measureDescent({ font: "Probe Sans", size: 6.5, lineSize: 10 })).to.be.closeTo(3, 1e-9);
    });

    it("should kern text from the size its kerning starts at", () => {
        const measurer = createFontFileMeasurer(fonts({ advances: LETTERS, kerning: { AV: -50, VA: -50 } }));
        const width = (size: number, kerning?: number): number => measurer.measureWidth("AVA", { font: "Probe Sans", size, kerning });
        // A, V and A are 600 thousandths of an em, and kerning takes 100 off
        expect(width(10)).to.be.closeTo(6, 1e-9);
        expect(width(10, 1)).to.be.closeTo(5, 1e-9);
        expect(width(10, 10)).to.be.closeTo(5, 1e-9);
        expect(width(10, 0)).to.be.closeTo(5, 1e-9);
        expect(width(10, 12)).to.be.closeTo(6, 1e-9);
    });

    it("should measure text in other fonts, and characters the font has no glyph for, with the fallback", () => {
        const measurer = createFontFileMeasurer(fonts({ advances: LETTERS, kerning: { AV: -50 } }));
        expect(measurer.measureWidth("Hello", { font: "Arial", size: 11 })).to.equal(
            DEFAULT_MEASURER.measureWidth("Hello", { font: "Arial", size: 11 }),
        );
        expect(measurer.measureLineHeight({ font: "Arial", size: 11 })).to.equal(
            DEFAULT_MEASURER.measureLineHeight({ font: "Arial", size: 11 }),
        );
        const font = { font: "Probe Sans", size: 10, kerning: 1 };
        // Z isn't in the font, and A isn't kerned with it
        expect(measurer.measureWidth("ZA", font)).to.be.closeTo(DEFAULT_MEASURER.measureWidth("Z", font) + 1, 1e-9);
        expect(measurer.measureWidth("ZV", font)).to.be.closeTo(DEFAULT_MEASURER.measureWidth("Z", font) + 4, 1e-9);
    });

    it("should know the width of the characters a font has, and of those that take no room, as Word draws the rest in another font", () => {
        const measurer = createFontFileMeasurer(fonts({ advances: LETTERS }));
        const font = { font: "Probe Sans", size: 10 };
        expect(measurer.unknownCharacter!("ABC A", font)).to.equal(undefined);
        expect(measurer.unknownCharacter!("AZB", font)).to.equal("Z");
        // A soft hyphen and a zero-width joiner take no room, and a typed tab moves to the next stop
        expect(measurer.unknownCharacter!("A\u00adB\u200dC\tA", font)).to.equal(undefined);
        expect(measurer.measureWidth("A\u00adB", font)).to.be.closeTo(3, 1e-9);
    });

    it("should leave whether a character's width is known in other fonts to the fallback", () => {
        const measurer = createFontFileMeasurer(fonts({ advances: LETTERS }));
        const calibri = { font: "Calibri", size: 11 };
        expect(measurer.unknownCharacter!("a\u2211", calibri)).to.equal(DEFAULT_MEASURER.unknownCharacter!("a\u2211", calibri));
        const withoutUnknown = createFontFileMeasurer(fonts({ advances: LETTERS }), {
            measureWidth: () => 0,
            measureLineHeight: () => 0,
            measureDescent: () => 0,
        });
        expect(withoutUnknown.unknownCharacter!("a\u2211", calibri)).to.equal(undefined);
    });

    it("should move a tab typed in the text to the next half inch from the start of the text", () => {
        const measurer = createFontFileMeasurer(fonts({ advances: LETTERS }));
        // A is a point wide at 10 points, so the tab moves to 36, and B is 2 more
        expect(measurer.measureWidth("A\tB", { font: "Probe Sans", size: 10 })).to.be.closeTo(38, 1e-9);
        expect(measurer.measureWidth("\t\tA", { font: "Probe Sans", size: 10 })).to.be.closeTo(73, 1e-9);
    });

    it("should measure text with no font as Times New Roman, from its file when it is given", () => {
        const measurer = createFontFileMeasurer(fonts({ advances: LETTERS, name: "Times New Roman" }));
        expect(measurer.measureWidth("A", {})).to.be.closeTo(1, 1e-9);
    });

    it("should measure bold and italic text with the face that is bold and italic as it is", () => {
        const measurer = createFontFileMeasurer(
            fonts(
                { advances: { A: 100 } },
                { advances: { A: 200 }, bold: true },
                { advances: { A: 300 }, italic: true },
                { advances: { A: 400 }, bold: true, italic: true },
            ),
        );
        const width = (bold?: boolean, italic?: boolean): number =>
            measurer.measureWidth("A", { font: "Probe Sans", size: 10, bold, italic });
        expect([width(), width(true), width(false, true), width(true, true)].map((value) => Math.round(value))).to.deep.equal([1, 2, 3, 4]);
    });

    it("should measure italic text with the upright face without an italic one, and bold text as without the files", () => {
        const measurer = createFontFileMeasurer(fonts({ advances: { A: 100 } }));
        expect(measurer.measureWidth("A", { font: "Probe Sans", size: 10, italic: true })).to.be.closeTo(1, 1e-9);
        const bold = { font: "Probe Sans", size: 10, bold: true };
        expect(measurer.measureWidth("A", bold)).to.equal(DEFAULT_MEASURER.measureWidth("A", bold));
    });
});
