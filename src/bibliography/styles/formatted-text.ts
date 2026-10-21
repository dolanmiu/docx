/**
 * Text with formatting, as a style of citation writes a citation or a bibliography's entries: runs of text, each bold,
 * italic or underlined, or a line break.
 *
 * Word's styles write HTML, which Word reads into runs. The styles here write runs, which are read the same way by
 * {@link readAsWord}: spaces collapse, as they do in HTML.
 *
 * @module
 */

/** A run of text with its formatting, or a line break */
export type FormattedRun = {
    readonly text: string;
    readonly bold?: boolean;
    readonly italics?: boolean;
    readonly underline?: boolean;
    /** A line break, in place of text, as an HTML `<br>` */
    readonly lineBreak?: boolean;
};

/** Text with formatting: its runs, in order */
export type FormattedText = readonly FormattedRun[];

/** Plain text, or text with formatting */
export type TextLike = string | FormattedText;

/** Text with formatting, from plain text or text with formatting */
export const formatted = (text: TextLike): FormattedText => (typeof text === "string" ? (text ? [{ text }] : []) : text);

/** The parts, one after another */
export const join = (...parts: readonly TextLike[]): FormattedText => parts.flatMap(formatted);

/** The text, in italics, as HTML's `<i>` */
export const italic = (...parts: readonly TextLike[]): FormattedText => join(...parts).map((run) => ({ ...run, italics: true }));

/** The text, in bold, as HTML's `<b>` */
export const bold = (...parts: readonly TextLike[]): FormattedText => join(...parts).map((run) => ({ ...run, bold: true }));

/** The text, underlined, as HTML's `<u>` */
export const underline = (...parts: readonly TextLike[]): FormattedText => join(...parts).map((run) => ({ ...run, underline: true }));

/** A line break, as HTML's `<br>` */
export const LINE_BREAK: FormattedText = [{ text: "", lineBreak: true }];

/** The text without its formatting, as an XSL style reads the string value of what it has written */
export const textOf = (text: TextLike): string => (typeof text === "string" ? text : text.map((run) => run.text).join(""));

const sameFormat = (a: FormattedRun, b: FormattedRun): boolean =>
    !a.lineBreak && !b.lineBreak && !!a.bold === !!b.bold && !!a.italics === !!b.italics && !!a.underline === !!b.underline;

/**
 * The runs as Word reads a style's HTML into a paragraph: each run of spaces, tabs and line feeds becomes one space, and
 * there is none at the start of the paragraph or after a line break, as in HTML. Runs with the same formatting are
 * joined, and empty ones dropped.
 */
export const readAsWord = (text: TextLike): FormattedText => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const runs: FormattedRun[] = [];
    // Whether the text so far ends with a space, or is at the start of the paragraph or of a line
    let atSpace = true;
    for (const run of formatted(text)) {
        if (run.lineBreak) {
            // eslint-disable-next-line functional/immutable-data
            runs.push(run);
            atSpace = true;
            continue;
        }
        let collapsed = run.text.replace(/[ \t\r\n]+/g, " ");
        if (atSpace && collapsed.startsWith(" ")) {
            collapsed = collapsed.slice(1);
        }
        if (!collapsed) {
            continue;
        }
        atSpace = collapsed.endsWith(" ");
        const last = runs[runs.length - 1];
        if (last && sameFormat(last, run)) {
            // eslint-disable-next-line functional/immutable-data
            runs[runs.length - 1] = { ...last, text: last.text + collapsed };
        } else {
            // eslint-disable-next-line functional/immutable-data
            runs.push({ ...run, text: collapsed });
        }
    }
    return runs;
};

/** The runs, with runs next to each other that have the same formatting joined, as Word joins a citation's sources */
export const mergeRuns = (text: TextLike): FormattedText =>
    formatted(text).reduce<readonly FormattedRun[]>((runs, run) => {
        const last = runs[runs.length - 1];
        return last && sameFormat(last, run) ? [...runs.slice(0, -1), { ...last, text: last.text + run.text }] : [...runs, run];
    }, []);
