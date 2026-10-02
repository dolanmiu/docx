// Page numbers worked out by docx/layout for text in Central European languages, Turkish, Vietnamese, Greek and
// Cyrillic, with mathematical symbols and arrows, words joined by en, em and thin spaces, and no-break hyphens. It is one of the
// documents scripts/compare-layout.sh checks against LibreOffice. See docs/usage/layout.md.

/* cspell:disable */
import * as fs from "fs";
import { Document, HeadingLevel, LineRuleType, NoBreakHyphen, Packer, Paragraph, TableOfContents, TextRun } from "docx";
import { estimatePageNumbers } from "docx/layout";

const LANGUAGES: readonly (readonly [string, string])[] = [
    ["Polish", "Pchnąć w tę łódź jeża lub ośm skrzyń fig. Zażółć gęślą jaźń. Mężny bądź, chroń pułk twój i sześć flag."],
    [
        "Czech",
        "Příliš žluťoučký kůň úpěl ďábelské ódy. Nechť již hříšné saxofony ďáblů rozezvučí síň úděsnými tóny waltzu, tanga a quickstepu.",
    ],
    ["Hungarian", "Árvíztűrő tükörfúrógép. Egy hűtlen vejét fülöncsípő, dühös mexikói úr Wesselényinél mázol Quitóban."],
    ["Turkish", "Pijamalı hasta yağız şoföre çabucak güvendi. Fahiş bluz güvencesi yağdırma projesi çöktü."],
    ["Vietnamese", "Tiếng Việt là ngôn ngữ của người Việt. Trăm năm trong cõi người ta, chữ tài chữ mệnh khéo là ghét nhau."],
    ["Greek", "Ξεσκεπάζω την ψυχοφθόρα βδελυγμία. Τάχιστη αλώπηξ βαφής ψημένη γη, δρασκελίζει υπέρ νωθρού κυνός."],
    ["Russian", "Съешь же ещё этих мягких французских булок, да выпей чаю. В чащах юга жил бы цитрус? Да, но фальшивый экземпляр!"],
    ["Ukrainian", "Чуєш їх, доцю, га? Кумедна ж ти, прощайся без ґольфів! Жебракують філософи при ґанку церкви в Гадячі."],
];

// Each language in Calibri, Times New Roman and Arial, and the Latin ones in Cambria too
const FONTS = ["Calibri", "Times New Roman", "Arial"];
const LATIN_FONTS = [...FONTS, "Cambria"];

const SYMBOLS = "Für x ≤ 10 und y ≥ 2 gilt x ≠ y ± 1, √2 ≈ 1,414, ∑ a → ∞ und ∫ f(x) dx − 5 ‰. Siehe † und ‡, „so“ und ‹so›, ← ↑ → ↓.";

const heading = (title: string): Paragraph => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(title)] });
const repeat = (text: string, times: number): string => Array.from({ length: times }, () => text).join(" ");

const doc = new Document({
    pageNumbers: estimatePageNumbers,
    styles: {
        default: {
            document: {
                run: { font: "Calibri", size: 22 },
                paragraph: { spacing: { after: 160, line: 259, lineRule: LineRuleType.AUTO } },
            },
            heading1: {
                run: { font: "Calibri Light", size: 32, color: "2F5496" },
                paragraph: { spacing: { before: 240, after: 0 }, keepNext: true },
            },
        },
    },
    sections: [
        {
            children: [
                new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-1" }),
                ...LANGUAGES.flatMap(([language, text], index) => [
                    heading(language),
                    ...(index < 4 ? LATIN_FONTS : FONTS).map(
                        (font, fontIndex) =>
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: repeat(text, 3 + ((index + fontIndex) % 3)),
                                        font,
                                        size: [22, 20, 24, 22][fontIndex],
                                    }),
                                ],
                            }),
                    ),
                    new Paragraph({ children: [new TextRun({ text: repeat(text, 2), bold: true })] }),
                ]),
                heading("Symbols and arrows"),
                ...FONTS.map((font) => new Paragraph({ children: [new TextRun({ text: repeat(SYMBOLS, 4), font })] })),
                heading("Words joined by en spaces"),
                new Paragraph({
                    children: [new TextRun(repeat(LANGUAGES[0][1], 4).split(" ").join("\u2002"))],
                }),
                new Paragraph({
                    children: [new TextRun(repeat(LANGUAGES[6][1], 4).split(" ").join("\u2002"))],
                }),
                heading("Words joined by em and thin spaces"),
                new Paragraph({
                    children: [new TextRun(repeat(LANGUAGES[3][1], 4).split(" ").join("\u2003"))],
                }),
                new Paragraph({
                    children: [new TextRun(repeat(LANGUAGES[5][1], 4).split(" ").join("\u2009"))],
                }),
                heading("No-break hyphens"),
                new Paragraph({
                    children: [
                        new TextRun({
                            children: Array.from({ length: 30 }, () => [
                                "a state",
                                new NoBreakHyphen(),
                                "of",
                                new NoBreakHyphen(),
                                "the",
                                new NoBreakHyphen(),
                                "art plan ",
                            ]).flat(),
                        }),
                    ],
                }),
                heading("The end"),
                new Paragraph({ children: [new TextRun(repeat(LANGUAGES[1][1], 3))] }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
