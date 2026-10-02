/**
 * Writes estimated page numbers into the fields of a tree of elements that show them: those docx formats to write a
 * document, and those `patchDocument` parses from a template. Not part of the public API.
 *
 * A page reference is a PAGEREF field, and the numbers of pages of the document and of a section are NUMPAGES and
 * SECTIONPAGES fields. Each field's result is written just after its `separate` field character, and any result it had
 * is taken out.
 *
 * @module
 */
import {
    CASE_FORMATS,
    PLAIN_FORMATS,
    type TextCapitals,
    inCapitals,
    inNumberPicture,
    isNumberPicture,
    numberWriterOf,
} from "./field-number-formats";
import type { EstimatedPageNumbers } from "./page-numbers";
import type { SequencePlace } from "./sequence-numbers";

/**
 * How the elements of a tree are read and changed.
 */
export type ElementTree<E> = {
    /** The element's name, such as "w:r", or undefined for text, and for a formatted element's attributes */
    readonly nameOf: (element: E) => string | undefined;
    /** The element's content, which can be changed in place, or undefined when it has none */
    // eslint-disable-next-line functional/prefer-readonly-type
    readonly contentOf: (element: E) => E[] | undefined;
    readonly attributeOf: (element: E, attribute: string) => unknown;
    /** The text directly in the element, such as an instruction's */
    readonly textOf: (element: E) => string;
    /** A `w:t` element of the text */
    readonly textElement: (text: string) => E;
    /**
     * Writes clean the beginning (`w:fldChar` of type `begin`) of a field whose result is a page number, once its
     * instruction is read, when the field would otherwise make Word ask to update the fields
     */
    readonly writeClean: (begin: E, instruction: string) => void;
    /** Makes a simple field's result (`w:fldSimple`) a run of the text, keeping the field's attributes */
    readonly setSimpleFieldResult: (element: E, text: string) => void;
};

/** A complex field being read: its beginning, its instruction, and whether its result has been reached */
type OpenField<E> = {
    readonly begin: E;
    // eslint-disable-next-line functional/prefer-readonly-type
    instruction: string;
    // eslint-disable-next-line functional/prefer-readonly-type
    inResult: boolean;
    /** The result it is written with */
    // eslint-disable-next-line functional/prefer-readonly-type
    result?: string;
};

/** Where a field is */
type FieldPlace = {
    /** Whether it is in the text Word counts SEQ fields in, or in deleted text or `mc:Fallback`, which it doesn't */
    readonly within: SequencePlace;
    /** The instructions of the fields whose results it is in, outermost first */
    readonly enclosing: readonly string[];
    /** Whether it is in a text box (`w:txbxContent`), whose text `docx/layout` doesn't lay out with the page's */
    readonly inTextBox: boolean;
};

/** How the fields of a part of a document are filled in */
type FieldFilling<E> = {
    /** The result of a field, from its instruction and where it is, or undefined to leave the field as it is */
    readonly resultOf: (instruction: string, place: FieldPlace) => string | undefined;
    /** Called before the fields of each paragraph */
    readonly beforeParagraph?: (paragraph: E) => void;
    /** Called after each paragraph, whose properties can end a section */
    readonly afterParagraph: (paragraph: E) => void;
};

/**
 * A field that shows a page's number or a number of pages: a PAGEREF field, with the bookmark it refers to and whether it
 * writes where the bookmark is from it (`\p`), or a NUMPAGES or SECTIONPAGES field. Its number's format of its own (the
 * name of its `\*` switch, such as `roman`), or picture (its `\#` switch, such as `00`), and its text's capitals (a `\*`
 * switch such as `Upper`), and whether it is written: not with a format or picture whose text in Word isn't known, such as
 * `\* CardText`, with `\* Caps`, or with two of a kind or a format and a picture, as `docx/layout` reads them.
 */
type NumberField = (
    | { readonly type: "pageReference"; readonly bookmark: string; readonly relative: boolean }
    | { readonly type: "pageCount"; readonly scope: "document" | "section" }
) & {
    readonly numberFormat?: string;
    readonly picture?: string;
    readonly capitals?: TextCapitals;
    readonly written: boolean;
};

/** Reads a field that shows a page's number or a number of pages, or undefined for another field */
const numberFieldOf = (instruction: string): NumberField | undefined => {
    const field = /^\s*(PAGEREF|NUMPAGES|SECTIONPAGES)\b(.*)$/is.exec(instruction);
    const reference = field?.[1].toUpperCase() === "PAGEREF" ? /^\s*("?)([^\s"\\]+)\1(.*)$/s.exec(field[2]) : undefined;
    if (!field || (field[1].toUpperCase() === "PAGEREF" && !reference)) {
        return undefined;
    }
    const parts = (reference ? reference[3] : field[2]).match(/"[^"]*"|\S+/g) ?? [];
    let numberFormat: string | undefined;
    let picture: string | undefined;
    // eslint-disable-next-line functional/prefer-readonly-type
    const capitals: string[] = [];
    let relative = false;
    let written = true;
    for (let index = 0; index < parts.length; index++) {
        const part = parts[index];
        // A switch's argument is after it, or, without a space, in it, as `\*roman`
        const argument = (): string => (part.length > 2 ? part.slice(2) : (parts[++index] ?? "")).replace(/^"(.*)"$/, "$1");
        if (/^\\p$/i.test(part)) {
            relative = true;
        } else if (part.startsWith("\\#")) {
            const value = argument();
            written &&= picture === undefined && isNumberPicture(value);
            picture ??= value;
        } else if (part.startsWith("\\*")) {
            const name = argument();
            const lower = name.toLowerCase();
            if (CASE_FORMATS.has(lower)) {
                // eslint-disable-next-line functional/immutable-data
                capitals.push(lower);
            } else if (name !== "" && !PLAIN_FORMATS.has(lower)) {
                written &&= numberFormat === undefined && numberWriterOf(name) !== undefined;
                numberFormat ??= name;
            }
        }
    }
    const own = {
        ...(numberFormat === undefined ? {} : { numberFormat }),
        ...(picture === undefined ? {} : { picture }),
        ...(capitals.length === 0 ? {} : { capitals: capitals[0] as TextCapitals }),
        written: written && capitals.length <= 1 && capitals[0] !== "caps" && (numberFormat === undefined || picture === undefined),
    };
    return reference
        ? { type: "pageReference", bookmark: reference[2], relative, ...own }
        : { type: "pageCount", scope: field[1].toUpperCase() === "NUMPAGES" ? "document" : "section", ...own };
};

/**
 * Whether a field is a table of contents that writes the number of a SEQ field before each page number (`\s`), such as
 * 2-5 for page 5 of chapter 2, which isn't written
 */
const prefixesPageNumbers = (instruction: string): boolean => /^\s*TOC\b.*\\s\b/is.test(instruction);

/** How the numbers of the fields of a part of a document are written */
type Numbers = UnknownNumbers & {
    readonly estimate: EstimatedPageNumbers;
    /** The number of pages its SECTIONPAGES fields show, if it is known */
    readonly sectionPageCount?: number;
    /**
     * What the next page reference with `\p` to a bookmark writes, in the body, whose page references with `\p` are each
     * counted once, in order. Those of other parts aren't written
     */
    readonly relativeTo?: (bookmark: string) => string | undefined;
};

/**
 * The result of a field that shows a page's number or a number of pages, or undefined to leave it as it is. A field
 * the estimate has no number for is left as it is, or made blank, and so is a page number in a table of contents that
 * writes a SEQ field's number before it.
 */
const resultFrom = (
    instruction: string,
    { enclosing, within, inTextBox }: FieldPlace,
    { estimate, sectionPageCount, blank, relativeTo }: Numbers,
): string | undefined => {
    const field = numberFieldOf(instruction);
    if (field === undefined) {
        return undefined;
    }
    const { bookmarks, pageCount, bookmarkPageNumbers } = estimate;
    const { numberFormat, picture, capitals, written } = field;
    // With a number format or picture, a page reference with \p writes its bookmark's page's number, as Word does
    // (word-page-fields.docx PF3c)
    const writesNumber = numberFormat !== undefined || picture !== undefined;
    /** A number in the field's format of its own, or as it is */
    const inFormat = (value: number | undefined): string | undefined =>
        value === undefined
            ? undefined
            : picture === undefined
              ? numberWriterOf(numberFormat ?? "arabic")!(value)
              : inNumberPicture(value, picture);
    // Each page reference with \p is counted where docx/layout reads it, in the body's text, whatever it writes
    const position =
        field.type === "pageReference" && field.relative && within === "counted" && !inTextBox ? relativeTo?.(field.bookmark) : undefined;
    let result: string | undefined;
    if (!written) {
        result = undefined;
    } else if (field.type === "pageCount") {
        result = inFormat(field.scope === "document" ? pageCount : sectionPageCount);
    } else if (enclosing.some(prefixesPageNumbers)) {
        result = undefined;
    } else if (writesNumber) {
        result = inFormat(bookmarkPageNumbers?.get(field.bookmark));
    } else {
        result = field.relative ? position : bookmarks.get(field.bookmark);
    }
    return result === undefined ? (blank ? "" : undefined) : inCapitals(result, capitals);
};

/** Where the content of an element is: in what an application that doesn't read Word's own shows, or in deleted text */
const placeIn = (name: string, within: SequencePlace): SequencePlace =>
    name === "mc:Fallback" || within === "fallback" ? "fallback" : name === "w:del" || name === "w:moveFrom" ? "deleted" : within;

/**
 * Writes the results the filling works out into the fields in the elements, in order.
 */
const fillFields = <E>(
    tree: ElementTree<E>,
    // eslint-disable-next-line functional/prefer-readonly-type
    elements: E[],
    // eslint-disable-next-line functional/prefer-readonly-type
    open: OpenField<E>[],
    filling: FieldFilling<E>,
    within: SequencePlace = "counted",
    inTextBox = false,
): void => {
    for (let index = 0; index < elements.length; index++) {
        const element = elements[index];
        const name = tree.nameOf(element);
        if (name === undefined) {
            continue;
        }
        const current = open[open.length - 1];
        if (name === "w:fldChar") {
            const type = tree.attributeOf(element, "w:fldCharType");
            if (type === "begin") {
                // eslint-disable-next-line functional/immutable-data
                open.push({ begin: element, instruction: "", inResult: false });
            } else if (type === "separate" && current) {
                tree.writeClean(current.begin, current.instruction);
                // eslint-disable-next-line functional/immutable-data
                current.inResult = true;
                // eslint-disable-next-line functional/immutable-data
                current.result = filling.resultOf(current.instruction, {
                    within,
                    enclosing: open.slice(0, -1).map((field) => field.instruction),
                    inTextBox,
                });
                if (current.result !== undefined) {
                    // eslint-disable-next-line functional/immutable-data
                    elements.splice(index + 1, 0, tree.textElement(current.result));
                    index++;
                }
            } else if (type === "end") {
                // eslint-disable-next-line functional/immutable-data
                open.pop();
            }
        } else if (name === "w:instrText" && current && !current.inResult) {
            // eslint-disable-next-line functional/immutable-data
            current.instruction += tree.textOf(element);
        } else if ((name === "w:t" || name === "w:tab" || name === "w:br" || name === "w:cr") && current?.result !== undefined) {
            // The result it was written with
            // eslint-disable-next-line functional/immutable-data
            elements.splice(index, 1);
            index--;
        } else if (name === "w:fldSimple") {
            // A simple field's runs are its result
            const result = filling.resultOf(String(tree.attributeOf(element, "w:instr")), {
                within,
                enclosing: open.map((field) => field.instruction),
                inTextBox,
            });
            if (result === undefined) {
                fillFields(tree, tree.contentOf(element) ?? [], [], filling, within, inTextBox);
            } else {
                tree.setSimpleFieldResult(element, result);
            }
        } else {
            if (name === "w:p") {
                filling.beforeParagraph?.(element);
            }
            fillFields(tree, tree.contentOf(element) ?? [], open, filling, placeIn(name, within), inTextBox || name === "w:txbxContent");
            if (name === "w:p") {
                filling.afterParagraph(element);
            }
        }
    }
};

/** The section properties (`w:sectPr`) in the elements, in order: those of the paragraphs that end sections, and the last */
const sectionPropertiesIn = <E>(tree: ElementTree<E>, elements: readonly E[]): readonly E[] =>
    elements.flatMap((element): readonly E[] => {
        const name = tree.nameOf(element);
        if (name === undefined) {
            return [];
        }
        return name === "w:sectPr" ? [element] : sectionPropertiesIn(tree, tree.contentOf(element) ?? []);
    });

/** Whether a paragraph ends a section: whether its properties have the section's */
const endsSection = <E>(tree: ElementTree<E>, paragraph: E): boolean =>
    (tree.contentOf(paragraph) ?? []).some(
        (child) => tree.nameOf(child) === "w:pPr" && (tree.contentOf(child) ?? []).some((part) => tree.nameOf(part) === "w:sectPr"),
    );

/**
 * The number of pages each header and footer shows in its SECTIONPAGES fields, by the id of the relationship to it:
 * that of the sections whose pages it is on, when they all have the same. A section without a header or footer of a kind
 * has the one of the section before, as Word lays them out.
 */
const partPageCountsOf = <E>(
    tree: ElementTree<E>,
    body: E,
    sectionPageCounts: readonly (number | undefined)[],
): ReadonlyMap<string, number> => {
    const partsOfSections = sectionPropertiesIn(tree, [body]).reduce<readonly ReadonlyMap<string, string>[]>((all, properties) => {
        const references = (tree.contentOf(properties) ?? []).flatMap((child) => {
            const name = tree.nameOf(child);
            return name === "w:headerReference" || name === "w:footerReference"
                ? [[`${name} ${String(tree.attributeOf(child, "w:type"))}`, String(tree.attributeOf(child, "r:id"))] as const]
                : [];
        });
        return [...all, new Map([...(all[all.length - 1] ?? []), ...references])];
    }, []);
    const countsOfParts = partsOfSections.reduce((counts, parts, section) => {
        for (const id of parts.values()) {
            // eslint-disable-next-line functional/immutable-data
            counts.set(id, [...(counts.get(id) ?? []), sectionPageCounts[section]]);
        }
        return counts;
    }, new Map<string, readonly (number | undefined)[]>());
    return new Map(
        [...countsOfParts].flatMap(([id, [first, ...rest]]) =>
            first !== undefined && rest.every((count) => count === first) ? [[id, first] as const] : [],
        ),
    );
};

/**
 * How fields whose number wasn't worked out are written: left as they are, as in a document docx writes, which writes
 * them empty, or made blank, as in a template, whose results are those of the template before it was patched.
 */
export type UnknownNumbers = { readonly blank: boolean };

/**
 * Writes the estimated page numbers into the fields of a document's body that show them: its PAGEREF fields, in its
 * tables of contents and elsewhere, and its NUMPAGES and SECTIONPAGES fields.
 *
 * @returns The number of pages each header and footer shows in its SECTIONPAGES fields, by the id of the relationship to it
 */
export const fillBodyFields = <E>(
    tree: ElementTree<E>,
    body: E,
    estimate: EstimatedPageNumbers,
    { blank }: UnknownNumbers,
): ReadonlyMap<string, number> => {
    const { sectionPageCounts = [], relativePositions } = estimate;
    let section = 0;
    // How many page references with \p to each bookmark have been written
    const relativeCounts = new Map<string, number>();
    const relativeTo = (bookmark: string): string | undefined => {
        const count = relativeCounts.get(bookmark) ?? 0;
        // eslint-disable-next-line functional/immutable-data
        relativeCounts.set(bookmark, count + 1);
        return relativePositions?.get(bookmark)?.[count];
    };
    fillFields(tree, [body], [], {
        resultOf: (instruction, place) =>
            resultFrom(instruction, place, { estimate, sectionPageCount: sectionPageCounts[section], blank, relativeTo }),
        afterParagraph: (paragraph) => {
            section += endsSection(tree, paragraph) ? 1 : 0;
        },
    });
    return partPageCountsOf(tree, body, sectionPageCounts);
};

/**
 * Writes the estimated page numbers into the fields of a header or footer that show them, with the number of pages its
 * SECTIONPAGES fields show, if it is known.
 */
export const fillPartFields = <E>(
    tree: ElementTree<E>,
    part: E,
    estimate: EstimatedPageNumbers,
    { blank, sectionPageCount }: UnknownNumbers & { readonly sectionPageCount?: number },
): void =>
    fillFields(tree, [part], [], {
        resultOf: (instruction, place) => resultFrom(instruction, place, { estimate, sectionPageCount, blank }),
        afterParagraph: () => undefined,
    });

/** How the SEQ fields of a body are numbered, in order */
export type SequenceFilling<E> = {
    /** Called at the start of each paragraph */
    readonly beforeParagraph: (paragraph: E) => void;
    /** The result of a field, from its instruction and where it is, or undefined to leave it as it is */
    readonly resultOf: (instruction: string, within: SequencePlace) => string | undefined;
};

/** Writes the numbers of the SEQ fields of a document's body into them */
export const fillSequenceFields = <E>(tree: ElementTree<E>, body: E, { beforeParagraph, resultOf }: SequenceFilling<E>): void =>
    fillFields(tree, [body], [], {
        resultOf: (instruction, { within }) => resultOf(instruction, within),
        beforeParagraph,
        afterParagraph: () => undefined,
    });
