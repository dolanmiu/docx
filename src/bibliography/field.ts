/**
 * The fields of citations and bibliographies, written with the result `docx` works out for them, as Word writes them.
 *
 * @module
 */
import { BuilderElement, NextAttributeComponent, TextRun, XmlComponent } from "docx";

import type { FormattedText } from "./styles/formatted-text";

/** Formatted text as runs, each kept out of spelling and grammar checks, as Word writes a citation's or a bibliography's */
export const runsOf = (text: FormattedText): readonly XmlComponent[] =>
    text.map(
        (run) =>
            new TextRun({
                ...(run.lineBreak ? { break: 1 } : { text: run.text }),
                bold: run.bold,
                italics: run.italics,
                underline: run.underline ? {} : undefined,
                noProof: true,
            }),
    );

/** A field's instruction, with its spaces kept */
class FieldInstruction extends XmlComponent {
    public constructor(instruction: string) {
        super("w:instrText");
        this.root.push(new NextAttributeComponent({ space: { key: "xml:space", value: "preserve" } }));
        this.root.push(instruction);
    }
}

const fieldChar = (type: "begin" | "separate" | "end"): XmlComponent =>
    new BuilderElement({
        name: "w:r",
        children: [
            new BuilderElement<{ readonly type: string }>({
                name: "w:fldChar",
                attributes: { type: { key: "w:fldCharType", value: type } },
            }),
        ],
    });

/**
 * A field whose result has been worked out, as runs: its start, its instruction, the result, and its end.
 *
 * @param result - The result's runs, between the field's separator and its end
 */
export const createFieldRuns = (instruction: string, result: readonly XmlComponent[]): readonly XmlComponent[] => [
    fieldChar("begin"),
    new BuilderElement({ name: "w:r", children: [new FieldInstruction(instruction)] }),
    fieldChar("separate"),
    ...result,
    fieldChar("end"),
];
