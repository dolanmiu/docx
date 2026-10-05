/**
 * Probes of kerning, ligatures and OpenType features docx/layout stops at, after `word-kerning.docx` (I, K, L, LK, A, P,
 * R, SP), and of the line heights of Office's fonts that the width tables don't have.
 *
 * word-stops-kerning.docx, Calibri 11 kerned from 1 point (w:kern 2) unless it says, each line "KEna ..." between a line
 * above and below, so where each word ends shows its width:
 * KE1a to KE1c: kerned Greek (a), Cyrillic (b) and Latin Extended-A (c) pairs in Calibri, ten capital pairs each, such as
 *   "ΤΑ ΥΑ ΓΑ" ("kerned text with a character whose kerning isn't known")
 * KE2a to KE2l: "official affluent fifty attitude fjord Th ct st" with each ligature setting the Font dialog doesn't
 *   write: none, contextual, historical, discretional, standardHistorical, contextualHistorical, standardDiscretional,
 *   contextualDiscretional, standardContextualHistorical, standardContextualDiscretional, standardHistoricalDiscretional
 *   and contextualHistoricalDiscretional ("ligatures of a setting not yet followed")
 * KE3: Normal's ligatures (standardContextual) before accented letters, digits and punctuation: "fié ffé fi1 fi. fi, ffl'"
 *   ("ligatures beside a character not yet followed")
 * KE4a to KE4j: "A-V A–V A V A™V A\V" in Cambria kerned, after 0 to 9 words, so it is at ten places along the line
 *   ("kerning of a pair of characters not yet followed": #3661 found Word moves these by where they are in the line)
 * KE4k to KE4t: the same not kerned
 * KE5: kerning beside joined letters in Cambria: "Tfi Yffi Vffl fiT ffiV" kerned with Normal's ligatures ("kerning beside a ligature
 *   not yet followed")
 * KE6a, KE6b: a word longer than its line, kerned: "AVAV..." of 120 letters (a), and with ligatures: "officeoffice..." of
 *   20 times (b) ("a word longer than its line, kerned or with ligatures")
 * KE7a to KE7l: digits "0123456789 1111111111 0000000000" in Calibri, Cambria and Aptos, with each of lining and old-style
 *   figures (w14:numForm) and proportional and tabular spacing (w14:numSpacing) ("OpenType number forms or spacing")
 * KE8a to KE8c: stylistic set 1 (w14:stylisticSets) in Calibri and Gabriola, and contextual alternates (w14:cntxtAlts) in
 *   Gabriola ("OpenType stylistic sets or contextual alternates")
 *
 * word-stops-font-heights.docx: FH1 to FH16, each of the fonts of word-stops-font-widths: 30 lines of 11 points, then
 *   20 of 20 points, single spaced, between a line above and below, for each font's line height
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-kerning.ts [folder]
 */
// cspell:ignore Yffi Vffl AVAV Aptos
import { Paragraph, TextRun } from "docx";

import { type Child, PAGE, group, line, marker, newPage, prose, write } from "./kit";

const KERNED = { kern: 2 } as const;
const kerned = (text: string, run: object = {}): Paragraph => new Paragraph({ children: [new TextRun({ text, ...KERNED, ...run })] });

const LIGATURE_SETTINGS = [
    "none",
    "contextual",
    "historical",
    "discretional",
    "standardHistorical",
    "contextualHistorical",
    "standardDiscretional",
    "contextualDiscretional",
    "standardContextualHistorical",
    "standardContextualDiscretional",
    "standardHistoricalDiscretional",
    "contextualHistoricalDiscretional",
] as const;
const LIGATURE_WORDS = "official affluent fifty attitude fjord Th ct st office ffl";

const FIGURES = "0123456789 1111111111 0000000000 1.5 10,000";
const FONTS = ["Calibri", "Cambria", "Aptos"] as const;
const FORMS = [
    ["lining", "proportional"],
    ["lining", "tabular"],
    ["oldStyle", "proportional"],
    ["oldStyle", "tabular"],
] as const;

const letters = "abcdefghijklmnopqrstuvwxyz";
const children: Child[] = [
    ...group("KE1a", [kerned("KE1a ΤΑ ΥΑ ΓΑ ΡΑ ΤΟ ΥΟ ΑΤ ΑΥ ΑΓ ΛΑ end")]),
    ...group("KE1b", [kerned("KE1b ТА ГА РА УА ТО ГО АТ АУ ЛА ДА end")]),
    ...group("KE1c", [kerned("KE1c ŤA ŸA ŔA ĽA ŦO ŤŐ AŤ AŸ ŁA ĹA end")]),
    ...LIGATURE_SETTINGS.flatMap((setting, index) =>
        group(`KE2${letters[index]}`, [
            new Paragraph({ children: [new TextRun(`KE2${letters[index]} `), marker(`LIG_${setting}`), new TextRun(" end")] }),
        ]),
    ),
    ...group("KE3", [new Paragraph({ children: [new TextRun("KE3 "), marker("LIG_standardContextual_KE3"), new TextRun(" end")] })]),
    newPage(),
    ...Array.from({ length: 10 }, (_, index) =>
        group(`KE4${letters[index]}`, [kerned(`KE4${letters[index]} ${prose(index)} A-V A–V A V A™V A\\V end`, { font: "Cambria" })]),
    ).flat(),
    ...Array.from({ length: 10 }, (_, index) =>
        group(`KE4${letters[index + 10]}`, [
            line(`KE4${letters[index + 10]} ${prose(index)} A-V A–V A V A™V A\\V end`, {}, { font: "Cambria" }),
        ]),
    ).flat(),
    newPage(),
    ...group("KE5", [new Paragraph({ children: [new TextRun("KE5 "), marker("LIG_standardContextual_KE5"), new TextRun(" end")] })]),
    ...group("KE6a", [kerned(`KE6a ${"AV".repeat(60)} end`)]),
    ...group("KE6b", [new Paragraph({ children: [new TextRun("KE6b "), marker("LIG_standardContextual_KE6b"), new TextRun(" end")] })]),
    newPage(),
    ...FONTS.flatMap((font, fontIndex) =>
        FORMS.flatMap(([form, spacing], index) => {
            const name = `KE7${letters[fontIndex * 4 + index]}`;
            return group(name, [
                new Paragraph({
                    children: [new TextRun(`${name} `), marker(`NUM_${form}_${spacing}_${font.replace(" ", "")}`), new TextRun(" end")],
                }),
            ]);
        }),
    ),
    ...group("KE8a", [new Paragraph({ children: [new TextRun("KE8a "), marker("SS_Calibri"), new TextRun(" end")] })]),
    ...group("KE8b", [new Paragraph({ children: [new TextRun("KE8b "), marker("SS_Gabriola"), new TextRun(" end")] })]),
    ...group("KE8c", [new Paragraph({ children: [new TextRun("KE8c "), marker("CTX_Gabriola"), new TextRun(" end")] })]),
];

const ligatureRun = (setting: string, text: string, kern = false, font = ""): string =>
    `<w:r><w:rPr>${font ? `<w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>` : ""}${kern ? '<w:kern w:val="2"/>' : ""}<w14:ligatures w14:val="${setting}"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r>`;

await write({
    name: "word-stops-kerning",
    sections: [{ properties: PAGE, children }],
    injections: [
        (parts) => {
            let text = parts.get("word/document.xml")!;
            const run = (name: string, xml: string): void => {
                text = text.replace(`<w:r><w:t xml:space="preserve">@@${name}@@</w:t></w:r>`, xml);
            };
            for (const setting of LIGATURE_SETTINGS) {
                run(`LIG_${setting}`, ligatureRun(setting, LIGATURE_WORDS));
            }
            run("LIG_standardContextual_KE3", ligatureRun("standardContextual", "fié ffé fi1 fi. fi, ffl' fiā"));
            run("LIG_standardContextual_KE5", ligatureRun("standardContextual", "Tfi Yffi Vffl fiT ffiV ffT fi- ffi–", true, "Cambria"));
            run("LIG_standardContextual_KE6b", ligatureRun("standardContextual", "office".repeat(20)));
            for (const font of FONTS) {
                for (const [form, spacing] of FORMS) {
                    run(
                        `NUM_${form}_${spacing}_${font}`,
                        `<w:r><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}"/><w14:numForm w14:val="${form}"/><w14:numSpacing w14:val="${spacing}"/></w:rPr><w:t xml:space="preserve">${FIGURES}</w:t></w:r>`,
                    );
                }
            }
            run(
                "SS_Calibri",
                '<w:r><w:rPr><w14:stylisticSets><w14:styleSet w14:id="1"/></w14:stylisticSets></w:rPr><w:t xml:space="preserve">Stylistic set one: a g y 0 1 &amp; Q</w:t></w:r>',
            );
            run(
                "SS_Gabriola",
                '<w:r><w:rPr><w:rFonts w:ascii="Gabriola" w:hAnsi="Gabriola"/><w14:stylisticSets><w14:styleSet w14:id="1"/></w14:stylisticSets></w:rPr><w:t xml:space="preserve">Stylistic set one: the survey of the coast</w:t></w:r>',
            );
            run(
                "CTX_Gabriola",
                '<w:r><w:rPr><w:rFonts w:ascii="Gabriola" w:hAnsi="Gabriola"/><w14:cntxtAlts/></w:rPr><w:t xml:space="preserve">Contextual alternates: the survey of the coast</w:t></w:r>',
            );
            parts.set("word/document.xml", text);
        },
    ],
});

const HEIGHT_FONTS = [
    "Calibri Light",
    "Aptos",
    "Aptos Narrow",
    "Trebuchet MS",
    "Georgia",
    "Verdana",
    "Tahoma",
    "Century Gothic",
    "Consolas",
    "Candara",
    "Corbel",
    "Constantia",
    "Book Antiqua",
    "Franklin Gothic Book",
    "Gill Sans MT",
    "Impact",
];
const heights: Child[] = HEIGHT_FONTS.flatMap((font, index) => [
    line(`FH${index + 1} above`, { pageBreakBefore: true }),
    ...Array.from({ length: 30 }, (_, row) => line(`FH${index + 1} ${font} 11 line ${row + 1}`, {}, { font, size: 22 })),
    ...Array.from({ length: 20 }, (_, row) => line(`FH${index + 1} ${font} 20 line ${row + 1}`, {}, { font, size: 40 })),
    line(`FH${index + 1} below`),
]);
await write({ name: "word-stops-font-heights", sections: [{ properties: PAGE, children: heights }] });
