/**
 * Lays out the layout demos with text measured by Pretext in Chrome, through measureWithPretext, rather than with the
 * width tables, and compares the page numbers it wrote with the pages LibreOffice and Word put the headings on, as
 * scripts/compare-layout.sh does.
 *
 * Usage: npm run run-ts -- scripts/compare-layout-with-pretext.ts [reference directory] [output directory]
 *
 * The reference directory (default build/layout) is the output of scripts/compare-layout.sh: the text of LibreOffice's
 * pages of each demo, and of Word's when there was a PDF of it from Word. The output directory (default
 * build/layout-pretext) gets each demo's .docx, with the page numbers worked out from Pretext's widths, beside a copy of
 * that text, and is compared with scripts/compare-layout.ts. Needs the package built (npm run build), Chrome (set CHROME
 * if it isn't at the usual place on a Mac), and the internet, for Pretext from jsDelivr.
 *
 * The fonts Chrome measures with are the ones in FONTS (default Word's own, in Word for Mac), loaded into the page, and
 * the computer's for the others. docx/layout runs in Node, which has no canvas, so each demo is run with the widths
 * measured so far, the text it measured that hadn't been is measured in Chrome, and it is run again until there is none:
 * then its pages are those docx/layout lays out in a browser with Pretext.
 */
// cspell:ignore chenglou jsdelivr calibril calibrili Calibrib Calibrii Calibriz Cambriab Cambriai Cambriaz arialbd ariali arialbi timesbd timesi timesbi DFonts
import { type ChildProcess, execFileSync, spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

import { measureTextWidth } from "../src/text-layout";

const reference = process.argv[2] ?? "build/layout";
const output = process.argv[3] ?? "build/layout-pretext";
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FONTS = process.env.FONTS ?? "/Applications/Microsoft Word.app/Contents/Resources/DFonts";
const PRETEXT = "https://cdn.jsdelivr.net/npm/@chenglou/pretext@0.0.9/+esm";

// Office's font files, by the family, weight and style they are
const FONT_FILES: readonly (readonly [string, string, "normal" | "bold", "normal" | "italic"])[] = [
    ["Calibri.ttf", "Calibri", "normal", "normal"],
    ["Calibrib.ttf", "Calibri", "bold", "normal"],
    ["Calibrii.ttf", "Calibri", "normal", "italic"],
    ["Calibriz.ttf", "Calibri", "bold", "italic"],
    ["calibril.ttf", "Calibri Light", "normal", "normal"],
    ["calibrili.ttf", "Calibri Light", "normal", "italic"],
    ["Cambria.ttc", "Cambria", "normal", "normal"],
    ["Cambriab.ttf", "Cambria", "bold", "normal"],
    ["Cambriai.ttf", "Cambria", "normal", "italic"],
    ["Cambriaz.ttf", "Cambria", "bold", "italic"],
    ["arial.ttf", "Arial", "normal", "normal"],
    ["arialbd.ttf", "Arial", "bold", "normal"],
    ["ariali.ttf", "Arial", "normal", "italic"],
    ["arialbi.ttf", "Arial", "bold", "italic"],
    ["times.ttf", "Times New Roman", "normal", "normal"],
    ["timesbd.ttf", "Times New Roman", "bold", "normal"],
    ["timesi.ttf", "Times New Roman", "normal", "italic"],
    ["timesbi.ttf", "Times New Roman", "bold", "italic"],
];

/** A page of Chrome, without a window, that runs JavaScript through the DevTools protocol */
const openChrome = async (): Promise<{ readonly evaluate: (expression: string) => Promise<unknown>; readonly close: () => void }> => {
    const profile = mkdtempSync(join(tmpdir(), "pretext-chrome-"));
    const chrome: ChildProcess = spawn(
        CHROME,
        ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run", "about:blank"],
        { stdio: ["ignore", "ignore", "pipe"] },
    );
    const port = await new Promise<string>((done, fail) => {
        let errors = "";
        chrome.stderr!.on("data", (data: Buffer) => {
            errors += data.toString();
            const listening = errors.match(/DevTools listening on ws:\/\/[^:]+:(\d+)\//);
            if (listening) {
                done(listening[1]);
            }
        });
        chrome.on("exit", () => fail(new Error(`Chrome stopped: ${errors}`)));
    });
    const targets = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()) as { type: string; webSocketDebuggerUrl: string }[];
    const socket = new WebSocket(targets.find(({ type }) => type === "page")!.webSocketDebuggerUrl);
    await new Promise((done) => socket.addEventListener("open", done, { once: true }));
    const waiting = new Map<number, (message: { result?: { result: { value: unknown }; exceptionDetails?: unknown } }) => void>();
    socket.addEventListener("message", ({ data }) => {
        const message = JSON.parse(String(data));
        waiting.get(message.id)?.(message);
        waiting.delete(message.id);
    });
    let id = 0;
    const evaluate = (expression: string): Promise<unknown> =>
        new Promise((done, fail) => {
            id += 1;
            waiting.set(id, ({ result }) =>
                result?.exceptionDetails ? fail(new Error(JSON.stringify(result.exceptionDetails))) : done(result?.result.value),
            );
            socket.send(
                JSON.stringify({ id, method: "Runtime.evaluate", params: { expression, awaitPromise: true, returnByValue: true } }),
            );
        });
    const close = (): void => {
        socket.close();
        // Chrome writes to its profile until it has stopped
        chrome.once("exit", () => rmSync(profile, { recursive: true, force: true }));
        chrome.kill();
    };
    return { evaluate, close };
};

/** The key of a text in a font, in the table of widths */
type Measured = readonly [text: string, name: string, size: number, bold: boolean, italic: boolean];

// The demo's docx/layout: estimatePageNumbers with the widths measured so far, which writes the text it measured that
// isn't in them yet
const measuredLayout = (widths: string, missing: string): string => `
import { readFileSync, writeFileSync } from "fs";
import { estimatePageNumbersWith } from "docx/layout";

const widths = new Map(JSON.parse(readFileSync(${JSON.stringify(widths)}, "utf8")));
const missing = new Set();
export const estimatePageNumbers = estimatePageNumbersWith({
    measureWidth: (text, { name, size, bold, italic }) => {
        const key = JSON.stringify([text, name, size, bold, italic]);
        if (!widths.has(key)) {
            missing.add(key);
        }
        return widths.get(key) ?? 0;
    },
});
process.on("exit", () => writeFileSync(${JSON.stringify(missing)}, JSON.stringify([...missing])));
`;

const main = async (): Promise<void> => {
    mkdirSync(output, { recursive: true });
    const work = resolve(output, "work");
    mkdirSync(work, { recursive: true });
    const browser = await openChrome();
    try {
        const fonts = FONT_FILES.filter(([file]) => existsSync(join(FONTS, file)));
        const loaded = await browser.evaluate(`(async () => {
            const fonts = ${JSON.stringify(
                fonts.map(([file, family, weight, style]) => ({
                    data: readFileSync(join(FONTS, file)).toString("base64"),
                    family,
                    weight,
                    style,
                })),
            )};
            for (const { data, family, weight, style } of fonts) {
                const bytes = Uint8Array.from(atob(data), (character) => character.charCodeAt(0));
                document.fonts.add(await new FontFace(family, bytes, { weight, style }).load());
            }
            ${readFileSync("dist/index.iife.js", "utf8")};
            ${readFileSync("dist/layout.iife.js", "utf8")};
            const pretext = await import(${JSON.stringify(PRETEXT)});
            window.measureWidth = docxLayout.measureWithPretext(pretext);
            return fonts.length;
        })()`);
        console.log(`Chrome measures with ${String(loaded)} of Word's fonts from ${FONTS}, and its own for the others`);

        const demos = readdirSync("demo/layout").filter((file) => file.endsWith(".ts"));
        const widths = new Map<string, number>();
        for (const demo of demos) {
            const name = basename(demo, ".ts");
            const layout = join(work, "measured-layout.ts");
            const widthsFile = join(work, "widths.json");
            const missingFile = join(work, "missing.json");
            writeFileSync(layout, measuredLayout(widthsFile, missingFile));
            // The demo, with its docx/layout measuring with the widths
            const source = readFileSync(join("demo/layout", demo), "utf8").replace('from "docx/layout"', 'from "./measured-layout"');
            writeFileSync(join(work, demo), source);
            for (let run = 1; ; run++) {
                writeFileSync(widthsFile, JSON.stringify([...widths]));
                execFileSync("npx", ["tsx", join(work, demo)], { stdio: "inherit" });
                const missing = JSON.parse(readFileSync(missingFile, "utf8")) as string[];
                if (missing.length === 0) {
                    console.log(`${name}: laid out ${run} times`);
                    break;
                }
                const measured = (await browser.evaluate(
                    `${JSON.stringify(missing)}.map((key) => { const [text, name, size, bold, italic] = JSON.parse(key); return measureWidth(text, { name, size, bold, italic }); })`,
                )) as number[];
                missing.forEach((key, index) => widths.set(key, measured[index]));
            }
            copyFileSync("My Document.docx", join(output, `${name}.docx`));
            for (const text of [`${name}.txt`, `${name}.word.txt`]) {
                if (existsSync(join(reference, text))) {
                    copyFileSync(join(reference, text), join(output, text));
                }
            }
        }
        const measured = [...widths].map(([key, width]) => {
            const [text, font, size, bold] = JSON.parse(key) as Measured;
            return { text, font, size, width, table: measureTextWidth(text, { font, size, bold }) };
        });
        const words = measured.filter(({ text }) => text.trim().length > 1);
        const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);
        const ratio = sum(words.map(({ width }) => width)) / sum(words.map(({ table }) => table));
        const furthest = words.reduce((most, word) =>
            Math.abs(word.width / word.table - 1) > Math.abs(most.width / most.table - 1) ? word : most,
        );
        console.log(
            `Measured ${widths.size} words and spaces in Chrome, in ${new Set(measured.map(({ font }) => font)).size} fonts. Its ` +
                `words are ${Math.abs((ratio - 1) * 100).toFixed(2)}% ${ratio < 1 ? "narrower" : "wider"} in all than the width tables measure them, and the furthest, ` +
                `"${furthest.text}" in ${furthest.font} at ${furthest.size} points, is ${furthest.width.toFixed(2)} points to their ${furthest.table.toFixed(2)}`,
        );
    } finally {
        browser.close();
        rmSync(work, { recursive: true, force: true });
    }
    execFileSync("npx", ["tsx", "scripts/compare-layout.ts", output], { stdio: "inherit" });
};

await main();
