/**
 * Caption numbers written into the SEQ fields of a document, such as the 2 of "Figure 2", when the document is given page
 * numbers.
 *
 * A SEQ field (`SequentialIdentifier`) shows how many SEQ fields of its identifier, such as "Figure", there are up to and
 * including it, so the number doesn't depend on how the pages are laid out. Its switches change the count: `\r 5` starts
 * it again from 5, `\c` repeats the number of the one before, `\s 1` starts it again after each Heading 1, `\h` hides the
 * number, and `\* ROMAN` writes it in roman numerals. `docx` writes SEQ fields dirty, for Word to number when it opens the
 * document, which makes Word ask to update the fields. When the document is given page numbers, each is written clean
 * with its number, counted as Word counts it. What Word does was read from its PDF of `scripts/layout-probes/word-seq.ts`.
 *
 * Word counts the SEQ fields of the body, those in text boxes and hidden text too, in order, and counts an identifier in
 * any capitals, or in quotes, as the same one. It writes the SEQ fields of headers, footers, footnotes and endnotes as an
 * error, "Error! Main Document Only.", and doesn't count them with the body's.
 *
 * Where Word's count isn't known, the field is left blank rather than given a number that could be wrong: a switch it
 * doesn't follow, a SEQ field in deleted text, and every SEQ field of an identifier that also has SEQ fields in a comment.
 * The fields of its identifier after one whose number isn't known are left blank too, until one starts the count again
 * with `\r`. A number in a format not followed is left blank, but the count goes on.
 *
 * @module
 */
import { headingLevels } from "@file/table-of-contents/heading-entries";
import type { IContext } from "@file/xml-components";

import { CASE_FORMATS, PLAIN_FORMATS, numberWriterOf } from "./field-number-formats";

/**
 * How a SEQ field's number follows from the one before: the next number, the same number, a number of its own, the next
 * number unless a heading of the level given or a higher one came after the one before, or the number at a bookmark,
 * which doesn't change the count
 */
type Step =
    | { readonly type: "next" }
    | { readonly type: "repeat" }
    | { readonly type: "reset"; readonly to: number }
    | { readonly type: "heading"; readonly level: number }
    | { readonly type: "bookmark" };

/**
 * A SEQ field Word's count is known for: how its number follows, whether it is hidden, and its format. A format of `""` is
 * one not followed, and leaves the number blank
 */
type Sequence = { readonly step: Step; readonly hidden: boolean; readonly format: string };

/** A SEQ field: its identifier, if it has one, and how it is counted, or undefined when Word's count of it isn't known */
type SequenceField = { readonly identifier?: string; readonly sequence?: Sequence };

// An identifier is a letter followed by letters, digits and underscores, as Word's captions write them
const IDENTIFIER = /^\p{L}[\p{L}\p{N}_]*$/u;

/** Reads the switches of a SEQ field, and a bookmark before them, or undefined when one of them isn't followed */
const sequenceOf = (switches: readonly string[]): Sequence | undefined => {
    let step: Step | undefined;
    let hidden = false;
    let format: string | undefined;
    let caseFormat = false;
    let picture = false;
    for (let index = 0; index < switches.length; index++) {
        const name = switches[index];
        const argument = switches[index + 1] ?? "";
        let next: Step | undefined;
        if (index === 0 && !name.startsWith("\\")) {
            next = { type: "bookmark" };
        } else if (name === "\\c" || name === "\\n") {
            next = { type: name === "\\c" ? "repeat" : "next" };
        } else if ((name === "\\r" || name === "\\s") && /^\d+$/.test(argument)) {
            index++;
            next = name === "\\r" ? { type: "reset", to: Number(argument) } : { type: "heading", level: Number(argument) };
        } else if (name === "\\h") {
            hidden = true;
        } else if (name === "\\#" && index + 1 < switches.length) {
            index++;
            picture = true;
        } else if (name === "\\*" && index + 1 < switches.length) {
            const value = switches[++index];
            if (CASE_FORMATS.has(value.toLowerCase())) {
                caseFormat = true;
            } else if (!PLAIN_FORMATS.has(value.toLowerCase())) {
                if (format !== undefined) {
                    return undefined;
                }
                format = value;
            }
        } else {
            // A switch Word doesn't have, or one without its argument
            return undefined;
        }
        // Two switches that change the count, such as \c with \r, or a bookmark with any
        if (next && step) {
            return undefined;
        }
        step = next ?? step;
    }
    if (step?.type === "bookmark" && switches.length > 1) {
        return undefined;
    }
    // A number written with a picture (\#), or in capitals (\* Upper) and a format other than arabic, isn't written
    const written = !picture && !(caseFormat && format !== undefined && format.toLowerCase() !== "arabic");
    // Word shows a hidden number when it is given a format
    return { step: step ?? { type: "next" }, hidden: hidden && format === undefined, format: written ? (format ?? "ARABIC") : "" };
};

/** Reads a SEQ field's instruction, or undefined when the field isn't a SEQ field */
const sequenceFieldOf = (instruction: string): SequenceField | undefined => {
    const match = /^\s*SEQ\b(.*)$/is.exec(instruction);
    if (!match) {
        return undefined;
    }
    const [written, ...switches] = match[1].match(/"[^"]*"|\S+/g) ?? [];
    if (written === undefined) {
        return {};
    }
    // Word counts an identifier in quotes as the identifier
    const identifier = written.replace(/^"(.*)"$/, "$1");
    return IDENTIFIER.test(identifier) ? { identifier, sequence: sequenceOf(switches) } : { identifier };
};

/** Whether a field's instruction is that of a SEQ field */
export const isSequenceField = (instruction: string): boolean => sequenceFieldOf(instruction) !== undefined;

/** The identifier, in small letters, of each SEQ field in the formatted elements */
const identifiersIn = (element: unknown): readonly string[] => {
    if (typeof element !== "object" || element === null) {
        return [];
    }
    if (Array.isArray(element)) {
        return element.flatMap(identifiersIn);
    }
    return Object.entries(element).flatMap(([name, content]) => {
        // A complex field's instruction is the text of its w:instrText, and a simple field's its w:instr attribute
        const instructions =
            name === "w:instrText" && Array.isArray(content)
                ? content
                : name === "_attr"
                  ? [(content as Record<string, unknown>)["w:instr"]]
                  : [];
        const identifiers = instructions.flatMap((instruction) => {
            const field = typeof instruction === "string" ? sequenceFieldOf(instruction) : undefined;
            return field?.identifier === undefined ? [] : [field.identifier.toLowerCase()];
        });
        return [...identifiers, ...identifiersIn(content)];
    });
};

/** The identifiers, in small letters, of the SEQ fields in the document's comments, whose count in Word isn't known */
const identifiersInCommentsOf = (context: IContext): ReadonlySet<string> => {
    const comments = context.file?.Comments;
    if (!comments) {
        return new Set();
    }
    const wrapper = { View: comments, Relationships: comments.Relationships };
    return new Set(identifiersIn(comments.prepForXml({ ...context, viewWrapper: wrapper, stack: [] })));
};

/**
 * Where a SEQ field is: in the text Word counts, in deleted or moved text, whose count isn't known, or in the content an
 * application that doesn't read Word's own shows instead (`mc:Fallback`), which Word doesn't count
 */
export type SequencePlace = "counted" | "deleted" | "fallback";

/** A SEQ field counted so far: the paragraph it is in, and how its number follows, or undefined when that isn't known */
type Counted = { readonly paragraph: number; readonly step?: Step };

/** Counts the SEQ fields of a document's body, in order, as Word counts them */
export type SequenceNumbering = {
    /** Called at the start of each paragraph, whose heading level `\s` follows */
    readonly startParagraph: (paragraph: Record<string, unknown>) => void;
    /** The number of a SEQ field, or undefined to leave it blank, called once for each SEQ field of the body in order */
    readonly numberOf: (instruction: string, place: SequencePlace) => string | undefined;
};

/** Counts the SEQ fields of a document's body, in order, as Word counts them */
export const sequenceNumbering = (context: IContext): SequenceNumbering => {
    const levelOf = headingLevels(context);
    // The number of the last SEQ field of each identifier, in small letters, or undefined once it isn't known
    const numbers = new Map<string, number | undefined>();
    // The SEQ fields of each identifier counted so far
    const counted = new Map<string, readonly Counted[]>();
    // The paragraph each heading level, from 1, was last at, and the last paragraph whose heading level isn't clear
    // eslint-disable-next-line functional/prefer-readonly-type
    const headingsAt: number[] = [];
    let unclearAt = -1;
    let paragraph = -1;
    // Identifiers whose numbers aren't known in the whole document
    let unknown: ReadonlySet<string> | undefined;

    /**
     * The number of a field that starts the count again after headings of a level or a higher one (`\s`): the number of
     * fields of its identifier since the last of them, with it, as Word counts them. It isn't known when a paragraph
     * whose level isn't clear came after that heading, or a field since it whose number didn't follow as the next one's
     */
    const afterHeading = (key: string, level: number): number | undefined => {
        const headingAt = Math.max(-1, ...headingsAt.slice(1, level + 1).filter((at) => at !== undefined));
        const since = (counted.get(key) ?? []).filter((field) => field.paragraph >= headingAt);
        const followed = since.every(({ step }) => step?.type === "next" || (step?.type === "heading" && step.level === level));
        if (unclearAt > headingAt || !followed) {
            return undefined;
        }
        // Before the first heading, the fields since are all of them, each one more than the one before
        return since.length + 1;
    };

    return {
        startParagraph: (element) => {
            paragraph++;
            const level = levelOf(element);
            if (level === "unclear") {
                unclearAt = paragraph;
            } else if (level !== undefined) {
                // eslint-disable-next-line functional/immutable-data
                headingsAt[level] = paragraph;
            }
        },
        numberOf: (instruction, place) => {
            const { identifier, sequence } = sequenceFieldOf(instruction)!;
            if (identifier === undefined || place === "fallback") {
                return undefined;
            }
            unknown ??= identifiersInCommentsOf(context);
            const key = identifier.toLowerCase();
            if (sequence?.step.type === "bookmark" && place === "counted" && !unknown.has(key)) {
                // The number of the SEQ field at the bookmark, which can come after it, isn't worked out
                return undefined;
            }
            const before = numbers.has(key) ? numbers.get(key) : 0;
            const step = unknown.has(key) || place === "deleted" ? undefined : sequence?.step;
            const value =
                step?.type === "reset"
                    ? step.to
                    : step?.type === "repeat"
                      ? before
                      : step?.type === "heading"
                        ? afterHeading(key, step.level)
                        : step?.type === "next" && before !== undefined
                          ? before + 1
                          : undefined;
            // eslint-disable-next-line functional/immutable-data
            numbers.set(key, value);
            // eslint-disable-next-line functional/immutable-data
            counted.set(key, [...(counted.get(key) ?? []), { paragraph, ...(value === undefined ? {} : { step }) }]);
            return value === undefined || sequence === undefined
                ? undefined
                : sequence.hidden
                  ? ""
                  : numberWriterOf(sequence.format)?.(value);
        },
    };
};
