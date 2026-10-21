/**
 * What a style of citation is: how it writes a citation of a source, and a bibliography of sources. Each is written from
 * one of Word's styles, which are XSL, so that a citation or a bibliography `docx` writes is the one Word writes when it
 * updates the document's fields.
 *
 * @module
 */
import type { FormattedText } from "./formatted-text";
import type { WordSource } from "../word-source";

/**
 * A source a citation cites, as Word gives it to a style (`b:Citation`): the source, where it is in the citation, how
 * the citation shows it, and what Word works out from the document's other sources.
 *
 * A citation of several sources, such as "(Baker, 2010; Evans, 2019)", is written one source at a time, and each style
 * writes the bracket before the first and after the last, and the separator after the others.
 */
export type CitedSource = {
    readonly source: WordSource;
    /** Whether it is the first source of the citation (`b:FirstAuthor`) */
    readonly first: boolean;
    /** Whether it is the last source of the citation (`b:LastAuthor`) */
    readonly last: boolean;
    /**
     * Whether another source has the same first author, or the same first three when it has more than three, so a
     * citation can't tell them apart by their authors and some styles add the title (`b:RepeatedAuthor`)
     */
    readonly repeatedAuthor: boolean;
    /**
     * Whether another source's first author has the same last name, but isn't the same person, so some styles add their
     * initials (`b:NonUniqueLastName`)
     */
    readonly nonUniqueLastName: boolean;
    /** How many of its authors tell it apart from the other sources, which Chicago and Turabian show (`b:MinAuthors`) */
    readonly minAuthors: number;
    /** Whether the citation leaves out the author (`b:NoAuthor`, the field's `\n`) */
    readonly hideAuthor: boolean;
    /** Whether the citation leaves out the year (`b:NoYear`, `\y`) */
    readonly hideYear: boolean;
    /** Whether the citation leaves out the title (`b:NoTitle`, `\t`) */
    readonly hideTitle: boolean;
    /** The pages cited (`b:Pages`, `\p`), or "" */
    readonly pages: string;
    /** The volume cited (`b:Volume`, `\v`), or "" */
    readonly volume: string;
    /** Text before the citation of the source (`b:PagePrefix`, `\f`), if it has any */
    readonly prefix?: string;
    /** Text after the citation of the source (`b:PageSuffix`, `\s`), if it has any */
    readonly suffix?: string;
};

/** A bibliography, as a style writes it: a paragraph for each source, or a table of each source's number and entry */
export type FormattedBibliography =
    | {
          readonly paragraphs: readonly FormattedText[];
          /** Whether each paragraph's lines after the first are indented half an inch, as APA's are */
          readonly hangingIndent: boolean;
      }
    | {
          /** Each source's number, such as "[1] ", and its entry */
          readonly rows: readonly (readonly [FormattedText, FormattedText])[];
      };

/** A style of citation, written from one of Word's */
// eslint-disable-next-line functional/no-mixed-types -- its names, which the document records, and how it writes
export type StyleDefinition = {
    /** The style's name, as Word lists it and records it in the document (`StyleName`), such as "APA" */
    readonly name: string;
    /** The file of Word's style, which Word records in the document (`SelectedStyle`), such as "APASixthEditionOfficeOnline.xsl" */
    readonly file: string;
    /** The version of the style Word records in the document (`Version`), such as "6" */
    readonly version: string;
    /**
     * A source of a citation, as the style writes it. The text is read as Word reads a style's HTML, with
     * {@link readAsWord}, after the citation's sources are joined
     */
    readonly citation: (cited: CitedSource) => FormattedText;
    /**
     * A bibliography of the sources, in the order of the document's list of sources, each numbered with the order the
     * document cites it in. The style sorts them. Each paragraph or cell is read as Word reads a style's HTML
     */
    readonly bibliography: (sources: readonly WordSource[]) => FormattedBibliography;
};
