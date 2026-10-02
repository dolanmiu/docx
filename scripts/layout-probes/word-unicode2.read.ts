// cspell:disable
// Reads the probes of word-unicode2.ts from pdftotext -bbox-layout's HTML of a PDF of it, and prints what each shows.
//
// Usage: pdftotext -bbox-layout scripts/layout-probes/word-unicode2.pdf build/word-probes/word-unicode2.html
//        npm run run-ts -- scripts/layout-probes/word-unicode2.read.ts build/word-probes/word-unicode2.html
import * as fs from "fs";

type Line = {
    readonly page: number;
    readonly xMin: number;
    readonly yMin: number;
    readonly xMax: number;
    readonly yMax: number;
    readonly text: string;
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
        ([, xMin, yMin, xMax, yMax, content]) => ({
            page: index + 1,
            xMin: Number(xMin),
            yMin: Number(yMin),
            xMax: Number(xMax),
            yMax: Number(yMax),
            text: [...content.matchAll(/<word[^>]*>([^<]*)<\/word>/g)].map(([, text]) => unescape(text)).join(" "),
        }),
    ),
);

const characterOf = (code: string): string => String.fromCodePoint(Number.parseInt(code.slice(2), 16));
const characters = (text: string): readonly string[] => [...text.replace(/ /g, "")];
const twips = (points: number): string => (points * 20).toFixed(1);

// S and E: the lines below each label in its column, up to the next label
console.log("== S and E: whether each character can start (S) or end (E) a line, by language");
console.log("   . it can, X the ideograph before it moves to the next line with it, H it hangs past the end of the line\n");
const SE_LABEL = /^([SE]) (\S+) (U\+[0-9A-F]+)$/;
const labels = LINES.filter((line) => SE_LABEL.test(line.text));
const verdicts = new Map<string, Map<string, string>>();
const languages: string[] = [];
for (const label of labels) {
    const [, kind, language, code] = SE_LABEL.exec(label.text)!;
    const character = characterOf(code);
    const below = LINES.filter(
        (line) => line.page === label.page && Math.abs(line.xMin - label.xMin) < 3 && line.yMin > label.yMax - 1 && line !== label,
    ).sort((a, b) => a.yMin - b.yMin);
    const next = below.findIndex((line) => SE_LABEL.test(line.text));
    const [first, second] = next === -1 ? below : below.slice(0, next);
    let verdict = "?";
    if (first && second) {
        const one = characters(first.text);
        const two = characters(second.text);
        const width = (first.xMax - first.xMin) / 6;
        if (kind === "S") {
            verdict = two[0] === character ? "." : one[one.length - 1] === character ? "H" : width < 39.5 ? "X" : width > 40.1 ? "H" : ".";
        } else {
            verdict = one[one.length - 1] === character ? "." : two[0] === character ? "X" : width < 39.05 ? "X" : ".";
        }
    }
    const key = `${kind} ${character} ${code}`;
    if (!verdicts.has(key)) {
        verdicts.set(key, new Map());
    }
    verdicts.get(key)!.set(language, verdict);
    if (!languages.includes(language)) {
        languages.push(language);
    }
}
console.log(`   ${"".padEnd(12)} ${languages.map((language) => language.padEnd(6)).join(" ")}`);
const order = (key: string): string => `${key[0]}${key.split(" ")[2].slice(2).padStart(5, "0")}`;
for (const [key, byLanguage] of [...verdicts].sort(([a], [b]) => order(a).localeCompare(order(b)))) {
    console.log(`   ${key.padEnd(12)} ${languages.map((language) => (byLanguage.get(language) ?? "-").padEnd(6)).join(" ")}`);
}

// The other probes, in the order of the document, with a label before each
const isLabel = (line: Line): boolean => line.yMax - line.yMin < 9.5 && /^([A-Z]+\d+|end)\b/.test(line.text);
const rest = LINES.filter((line) => !SE_LABEL.test(line.text) && line.page > (labels[labels.length - 1]?.page ?? 0));
const starts = rest.flatMap((line, index) => (isLabel(line) ? [index] : []));
const PROBES = new Map(starts.map((start, i) => [rest[start].text, rest.slice(start + 1, starts[i + 1] ?? rest.length)] as const));
const probes = (pattern: RegExp): readonly (readonly [string, readonly Line[]])[] => [...PROBES].filter(([name]) => pattern.test(name));
const named = (label: string): string => label.replace(/U\+([0-9A-F]{4,5})/g, (code) => characterOf(code));

console.log("\n== H: 40 ideographs and punctuation, in Japanese");
for (const [name, lines] of probes(/^H\d/)) {
    const [first, second] = lines;
    const overhang = first.xMax - (63.5 + 485);
    console.log(
        `   ${named(name).padEnd(22)} line 1: ${characters(first.text).length} characters, ${((first.xMax - first.xMin) / 12).toFixed(2)} em` +
            `${overhang > 0.5 ? `, ${overhang.toFixed(1)}pt past the margin` : ""}; line 2 starts ${characters(second?.text ?? "")
                .slice(0, 2)
                .join("")}`,
    );
}

console.log("\n== A: ideographs, Calibri letters and numbers, in Japanese. 215.37pt with no space between them");
for (const [name, lines] of probes(/^A\d/)) {
    console.log(`   ${name}: ${lines.length} line(s), ${(lines[0].xMax - lines[0].xMin).toFixed(2)}pt`);
}

console.log("\n== W: wordWrap off, and a zero-width space");
for (const [name, lines] of probes(/^W\d/)) {
    console.log(`   ${name}`);
    for (const line of lines.slice(0, 4)) {
        console.log(`      ${((line.xMax - line.xMin) / 12).toFixed(2).padStart(6)} em  ${line.text.slice(-40)}`);
    }
}

console.log("\n== T: Thai words. Whether each line ends where Intl.Segmenter finds a word boundary");
const segmenter = new Intl.Segmenter("th", { granularity: "word" });
for (const [name, lines] of probes(/^T\d/)) {
    // A line's marks can be lines of their own
    const texts = lines.filter((line) => characters(line.text).length > 1).map((line) => line.text.replace(/[ \u200B]/g, ""));
    const joined = texts.join("");
    const boundaries = new Set([...segmenter.segment(joined)].map(({ index }) => index));
    let offset = 0;
    let inside = 0;
    console.log(`   ${name}: ${texts.length} lines`);
    for (const text of texts.slice(0, -1)) {
        offset += text.length;
        const before = [...segmenter.segment(joined.slice(0, offset))].pop()!.segment;
        const after = [...segmenter.segment(joined.slice(offset))][0]?.segment ?? "";
        inside += boundaries.has(offset) ? 0 : 1;
        console.log(`      ${boundaries.has(offset) ? "at a boundary   " : "INSIDE A WORD   "} ...${before} | ${after}...`);
    }
    console.log(`      ${inside} of ${texts.length - 1} inside words`);
}

console.log("\n== F: the width of 44 Hebrew letters, and of 26 Latin ones, in 11 points and 22 for complex scripts");
console.log(
    "   Courier New is 0.6 em a letter: 290.4pt for the Hebrew at 11 points, 580.8 at 22 (past the line), 343.2 for the Latin at 22",
);
for (const [name, lines] of probes(/^F\d/)) {
    console.log(`   ${name}: ${lines.map((line) => `${(line.xMax - line.xMin).toFixed(2)}pt`).join(", ")}`);
}

/** The pitch of lines, from the tops of those after each other on a page */
const pitchOf = (parts: readonly Line[], size: number): string => {
    // Text in two scripts on one line can be two lines of pdftotext's, and not one after the other
    const sorted = [...parts].sort((a, b) => a.page - b.page || a.yMin - b.yMin);
    const lines = sorted.filter((line, i) => i === 0 || line.page !== sorted[i - 1].page || Math.abs(line.yMin - sorted[i - 1].yMin) > 1);
    const runs = lines.slice(1).flatMap((line, i) => (line.page === lines[i].page ? [line.yMin - lines[i].yMin] : []));
    const pitch = runs.reduce((total, step) => total + step, 0) / runs.length;
    return `pitch ${twips(pitch)} twips over ${runs.length} lines, ${((pitch / size) * 1000).toFixed(1)} thousandths of an em`;
};

console.log("\n== G: the height of lines");
for (const [name, lines] of probes(/^G\d/)) {
    const size = /10\.5$/.test(name) ? 10.5 : /9$/.test(name) ? 9 : 12;
    console.log(`   ${name.padEnd(40)} ${pitchOf(lines, size)}`);
}
