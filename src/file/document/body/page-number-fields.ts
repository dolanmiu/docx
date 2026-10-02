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

// Formatting switches that don't change how a number is written
// cspell:ignore mergeformatinet
const PLAIN_FORMATS = new Set(["mergeformat", "charformat", "mergeformatinet"]);

/** Whether a field's switches give its number a format of its own, such as `\* roman`, or a picture, such as `\# "00"` */
const hasOwnFormat = (switches: string): boolean => {
    const formats = [...switches.matchAll(/\\\*\s*"?([^\s"\\]+)/g)].map(([, format]) => format.toLowerCase());
    return /\\#/.test(switches) || formats.some((format) => !PLAIN_FORMATS.has(format));
};

/**
 * The bookmark a PAGEREF field refers to, unless the field shows something other than the page's number: its
 * position relative to the bookmark (`\p`), or the number in a format of its own (`\* roman`).
 */
const bookmarkOf = (instruction: string): string | undefined => {
    const match = /^\s*PAGEREF\s+("?)([^\s"\\]+)\1(.*)$/i.exec(instruction);
    if (!match) {
        return undefined;
    }
    const [, , bookmark, switches] = match;
    return /\\p\b/i.test(switches) || hasOwnFormat(switches) ? undefined : bookmark;
};

/** The number of pages a NUMPAGES or SECTIONPAGES field shows, unless it writes it in a format of its own */
const pageCountOf = (instruction: string): "document" | "section" | undefined => {
    const match = /^\s*(NUMPAGES|SECTIONPAGES)\b(.*)$/i.exec(instruction);
    if (!match || hasOwnFormat(match[2])) {
        return undefined;
    }
    return match[1].toUpperCase() === "NUMPAGES" ? "document" : "section";
};

/**
 * Whether a field is a table of contents that writes the number of a SEQ field before each page number (`\s`), such as
 * 2-5 for page 5 of chapter 2, which isn't written
 */
const prefixesPageNumbers = (instruction: string): boolean => /^\s*TOC\b.*\\s\b/is.test(instruction);

/**
 * The result of a field that shows a page's number or a number of pages, or undefined to leave it as it is. A field
 * the estimate has no number for is left as it is, or made blank, and so is a page number in a table of contents that
 * writes a SEQ field's number before it.
 */
const resultFrom = (
    instruction: string,
    { enclosing }: FieldPlace,
    { bookmarks, pageCount }: EstimatedPageNumbers,
    { sectionPageCount, blank }: { readonly sectionPageCount?: number; readonly blank: boolean },
): string | undefined => {
    const bookmark = bookmarkOf(instruction);
    const count = bookmark === undefined ? pageCountOf(instruction) : undefined;
    if (bookmark === undefined && count === undefined) {
        return undefined;
    }
    const value =
        bookmark !== undefined
            ? enclosing.some(prefixesPageNumbers)
                ? undefined
                : bookmarks.get(bookmark)
            : count === "document"
              ? pageCount
              : sectionPageCount;
    return value === undefined ? (blank ? "" : undefined) : String(value);
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
            });
            if (result === undefined) {
                fillFields(tree, tree.contentOf(element) ?? [], [], filling, within);
            } else {
                tree.setSimpleFieldResult(element, result);
            }
        } else {
            if (name === "w:p") {
                filling.beforeParagraph?.(element);
            }
            fillFields(tree, tree.contentOf(element) ?? [], open, filling, placeIn(name, within));
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
    const { sectionPageCounts = [] } = estimate;
    let section = 0;
    fillFields(tree, [body], [], {
        resultOf: (instruction, place) => resultFrom(instruction, place, estimate, { sectionPageCount: sectionPageCounts[section], blank }),
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
        resultOf: (instruction, place) => resultFrom(instruction, place, estimate, { sectionPageCount, blank }),
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
