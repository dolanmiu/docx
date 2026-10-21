/**
 * Checks a style of citation of docx/bibliography against what Word writes: the citations and bibliographies of the
 * corpora in src/bibliography/styles/fixtures, as markup.
 *
 * The fixtures of corpora a to d are what Word for Mac wrote for them. Corpus s is sources of every type with each of
 * their fields in turn left out, and its fixtures are what Word's own style, its XSL, writes for them when it is run with
 * libxslt and Word's English wording. That gives the same as Word for corpora a to d.
 */
import { describe, expect, it } from "vitest";

import { type CitedSourceOptions, citationOrderOf, formatBibliography, formatCitation } from "../bibliography/format";
import type { Source } from "../bibliography/source";
import corpora from "../bibliography/styles/fixtures/corpora.json";
import type { FormattedText } from "../bibliography/styles/formatted-text";
import type { StyleDefinition } from "../bibliography/styles/style";
import { wordSourceOf } from "../bibliography/word-source";

/** A corpus: its sources, as docx's options, and its citations, each the sources it cites */
type Corpus = { readonly sources: readonly Source[]; readonly citations: readonly (readonly CitedSourceOptions[])[] };

/** What a style writes for a corpus, as markup: each citation, and the bibliography, if it is checked */
export type CorpusOutput = {
    readonly citations: readonly string[];
    readonly bibliography?:
        { readonly hangingIndent: boolean; readonly paragraphs: readonly string[] } | { readonly rows: readonly (readonly string[])[] };
};

const escape = (text: string): string => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Text as markup: <b>, <i> and <u> around the text with that formatting, and <br> for a line break */
export const markupOf = (text: FormattedText): string =>
    text
        .map((run) => {
            if (run.lineBreak) {
                return "<br>";
            }
            const marks = [run.bold && "b", run.italics && "i", run.underline && "u"].filter((mark): mark is string => !!mark);
            return (
                marks.map((mark) => `<${mark}>`).join("") +
                escape(run.text) +
                [...marks]
                    .reverse()
                    .map((mark) => `</${mark}>`)
                    .join("")
            );
        })
        .join("");

/** What the style writes for a corpus, as markup */
export const outputOf = (style: StyleDefinition, corpus: Corpus): Required<CorpusOutput> => {
    const tags = corpus.sources.map(({ tag }) => tag);
    const order = citationOrderOf(
        tags,
        corpus.citations.flatMap((citation) => citation.map(({ source }) => source)),
    );
    const sources = corpus.sources.map((source) => wordSourceOf(source, order.get(source.tag)!));
    const bibliography = formatBibliography(style, sources);
    return {
        citations: corpus.citations.map((citation) => markupOf(formatCitation(style, sources, citation))),
        bibliography:
            "rows" in bibliography
                ? { rows: bibliography.rows.map((row) => row.map(markupOf)) }
                : { hangingIndent: bibliography.hangingIndent, paragraphs: bibliography.paragraphs.map(markupOf) },
    };
};

/**
 * Describes the style's tests against what Word writes: a test of each corpus's citations, and of its bibliography where
 * the fixture has it.
 *
 * @param expected - The style's fixture, with what Word writes for each corpus
 */
export const describeWordOutput = (style: StyleDefinition, expected: Readonly<Record<string, CorpusOutput | string>>): void => {
    for (const [name, corpus] of Object.entries(corpora as unknown as Readonly<Record<string, Corpus>>)) {
        const output = expected[name];
        if (typeof output !== "object") {
            continue;
        }
        describe(`corpus ${name}`, () => {
            it("writes the citations as Word does", () => {
                expect(outputOf(style, corpus).citations).toEqual(output.citations);
            });
            if (output.bibliography) {
                it("writes the bibliography as Word does", () => {
                    expect(outputOf(style, corpus).bibliography).toEqual(output.bibliography);
                });
            }
        });
    }
};
