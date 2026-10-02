// cspell:disable
// Reads the probes of word-unicode.ts from pdftotext -bbox-layout's HTML of a PDF of it, and prints what each shows.
//
// Usage: pdftotext -bbox-layout scripts/layout-probes/word-unicode.pdf build/word-probes/word-unicode.html
//        npm run run-ts -- scripts/layout-probes/word-unicode.read.ts build/word-probes/word-unicode.html
import * as fs from "fs";

type Word = { readonly xMin: number; readonly xMax: number; readonly text: string };
type Line = {
    readonly page: number;
    readonly xMin: number;
    readonly yMin: number;
    readonly xMax: number;
    readonly yMax: number;
    readonly text: string;
    readonly words: readonly Word[];
};

const unescape = (text: string): string =>
    text
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&");

const html = fs.readFileSync(process.argv[2], "utf8");
const LINES: readonly Line[] = [...html.matchAll(/<page[\s\S]*?<\/page>/g)].flatMap(([page], index) =>
    [...page.matchAll(/<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([\s\S]*?)<\/line>/g)].map(
        ([, xMin, yMin, xMax, yMax, content]) => {
            const words = [...content.matchAll(/<word xMin="([\d.]+)" yMin="[\d.]+" xMax="([\d.]+)" yMax="[\d.]+">([^<]*)<\/word>/g)].map(
                ([, left, right, text]) => ({ xMin: Number(left), xMax: Number(right), text: unescape(text) }),
            );
            return {
                page: index + 1,
                xMin: Number(xMin),
                yMin: Number(yMin),
                xMax: Number(xMax),
                yMax: Number(yMax),
                text: words.map((word) => word.text).join(" "),
                words,
            };
        },
    ),
);

// Labels are in 7-point Calibri, and start with the probe's name
const isLabel = (line: Line): boolean => line.yMax - line.yMin < 9.5 && /^([A-Z]+\d+|end)\b/.test(line.text);
/** A label's name, with the character it tests in place of its code point */
const named = (label: string): string =>
    label.replace(/U\+([0-9A-F]{4,5})/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
const LABELS = LINES.flatMap((line, index) => (isLabel(line) ? [index] : []));
const PROBES = new Map(LABELS.map((start, i) => [LINES[start].text, LINES.slice(start + 1, LABELS[i + 1] ?? LINES.length)] as const));

const EM = 12;
const LEFT = 63.5;
const RIGHT = LEFT + 485;
const em = (line: Line): string => ((line.xMax - line.xMin) / EM).toFixed(2);
const characters = (text: string): readonly string[] => [...text.replace(/ /g, "")];
const twips = (points: number): string => (points * 20).toFixed(1);

const probesStarting = (prefix: string): readonly (readonly [string, readonly Line[]])[] =>
    [...PROBES].filter(([name]) => name.startsWith(prefix));

/** Where the character tested falls: at the start of the second line, or the end of the first */
const placement = (name: string, lines: readonly Line[]): string => {
    const [first, second] = lines;
    if (!first || !second) {
        return `${lines.length} line(s): ${lines.map((line) => line.text).join(" / ")}`;
    }
    const character = String.fromCodePoint(Number.parseInt(name.split(" ").pop()!.slice(2), 16));
    const one = characters(first.text);
    const two = characters(second.text);
    const at =
        one[one.length - 1] === character ? "ends line 1" : two[0] === character ? "starts line 2" : `before ${two.slice(0, 2).join("")}`;
    const overhang = first.xMax > RIGHT + 0.5 ? `, ${(first.xMax - RIGHT).toFixed(1)}pt past the margin` : "";
    return `line 1: ${one.length} characters, ${em(first)} em${overhang}; line 2 starts ${two.slice(0, 2).join("")}: ${at}`;
};

const section = (title: string): void => console.log(`\n== ${title}`);

section("K, E, L, H, N: where a character falls at the end of a line of 40 ideographs");
for (const [name, lines] of [...PROBES].filter(([probe]) => /^[KELHN]\d/.test(probe))) {
    console.log(`  ${named(name).padEnd(22)} ${placement(name, lines)}`);
}

section("W: Latin words with wordWrap off, and after ideographs");
for (const [name, lines] of probesStarting("W")) {
    console.log(`  ${name}`);
    for (const line of lines) {
        console.log(`      ${em(line).padStart(6)} em  ${line.text.slice(0, 90)}`);
    }
}

section("A: the space between ideographs and Calibri letters and numbers");
for (const [name, lines] of probesStarting("A")) {
    console.log(`  ${name}: ${lines.length} line(s), the first ${em(lines[0])} em`);
    if (!name.includes("fit")) {
        for (const word of lines[0].words) {
            console.log(`      ${word.xMin.toFixed(2)} to ${word.xMax.toFixed(2)}  ${word.text}`);
        }
    }
}

section("P: pairs of punctuation, 3 lines uncompressed");
for (const [name, lines] of probesStarting("P")) {
    console.log(`  ${named(name)}: ${lines.length} lines of ${lines.map((line) => characters(line.text).length).join(", ")} characters`);
}

section("KR: Korean words of 7 syllables. A line ending inside one breaks inside words");
for (const [name, lines] of probesStarting("KR")) {
    const inside = lines.slice(0, -1).filter((line) => characters(line.text.split(" ").pop()!).length !== 7).length;
    console.log(`  ${name}: ${lines.length} lines, ${inside} of them ending inside a word`);
    for (const line of lines) {
        console.log(`      ${em(line).padStart(6)} em  ...${line.text.slice(-24)}`);
    }
}

section("T: Thai. Whether each line ends where Intl.Segmenter finds a word boundary");
const segmenter = new Intl.Segmenter("th", { granularity: "word" });
for (const [name, lines] of probesStarting("T")) {
    const texts = lines.map((line) => line.text);
    const joined = texts.join("");
    const boundaries = new Set([...segmenter.segment(joined)].map(({ index }) => index));
    let offset = 0;
    console.log(`  ${name}: ${lines.length} lines`);
    for (const text of texts.slice(0, -1)) {
        offset += text.length;
        const before = [...segmenter.segment(joined.slice(0, offset))].pop()!.segment;
        const after = [...segmenter.segment(joined.slice(offset))][0]?.segment ?? "";
        console.log(`      ${boundaries.has(offset) ? "at a boundary   " : "INSIDE A WORD   "} ...${before} | ${after}...`);
    }
}

section("R1 to R3: Latin in left-to-right and right-to-left paragraphs. Words on each line");
for (const [name, lines] of probesStarting("R").filter(([probe]) => /^R[123]\b/.test(probe))) {
    console.log(`  ${name}: ${lines.map((line) => line.text.split(" ").length).join(", ")}`);
}

/** The pitch of lines, from the tops of those after each other on a page, and their height */
const pitchOf = (parts: readonly Line[]): string => {
    // Text in two scripts on one line can be two lines of pdftotext's, and not one after the other
    const sorted = [...parts].sort((a, b) => a.page - b.page || a.yMin - b.yMin);
    const lines = sorted.filter((line, i) => i === 0 || line.page !== sorted[i - 1].page || Math.abs(line.yMin - sorted[i - 1].yMin) > 1);
    const steps = lines.slice(1).flatMap((line, i) => (line.page === lines[i].page ? [line.yMin - lines[i].yMin] : []));
    const pitch = steps.reduce((total, step) => total + step, 0) / steps.length;
    return `pitch ${twips(pitch)} twips over ${steps.length} lines, glyphs ${twips(lines[0].yMax - lines[0].yMin)} twips tall`;
};

section("R4, R5 and G: the height of lines");
for (const [name, lines] of [...PROBES].filter(([probe]) => /^(R4|R5|G\d+)\b/.test(probe))) {
    console.log(`  ${name.padEnd(36)} ${pitchOf(lines)}`);
}

section("R6 and R7: the width of an rtl run bold for complex scripts, and of one not bold");
for (const [name, lines] of probesStarting("R").filter(([probe]) => /^R[67]\b/.test(probe))) {
    console.log(`  ${name}: ${(lines[0].xMax - lines[0].xMin).toFixed(2)}pt`);
}

section("R8 and R9: Hebrew and Arabic paragraphs");
for (const [name, lines] of probesStarting("R").filter(([probe]) => /^R[89]\b/.test(probe))) {
    console.log(`  ${name}: ${lines.length} lines`);
    for (const line of lines) {
        console.log(`      ${line.xMin.toFixed(2)} to ${line.xMax.toFixed(2)}  ${line.text.slice(0, 60)}`);
    }
}
