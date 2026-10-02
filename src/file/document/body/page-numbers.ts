/**
 * Page numbers written into the fields of a document that show them, when it is written, from an estimate of its pages.
 *
 * A page reference is a PAGEREF field, such as the page number of an entry in a table of contents, and the numbers of
 * pages of the document and of a section are NUMPAGES and SECTIONPAGES fields. Word works their results out when it
 * updates the fields, or lays the pages out, and until then, and in applications that don't, the fields show the results
 * they were written with. `docx` doesn't lay out pages, so it writes the results empty, unless the document is given a
 * {@link PageNumberEstimator}, such as `estimatePageNumbers` from `docx/layout`. Then, once the body is written, each of
 * those fields in the body, and then in the headers and footers, is given the number the estimator worked out.
 *
 * Page references and tables of contents are written dirty, so Word updates them when it opens the document, and asks
 * "This document contains fields that may refer to other files. Do you want to update the fields in this document?".
 * When the document is given page numbers, they are written clean, so Word shows them as they are and doesn't ask. A
 * page number the estimator didn't work out is left blank, until the fields are updated.
 *
 * @module
 */
import { isDirtyWithoutPageNumbers } from "@file/paragraph/run/field";
import type { IContext, IXmlableObject } from "@file/xml-components";

/**
 * The page each bookmark of a document starts on, and the number of pages of the document and of each of its sections,
 * as a {@link PageNumberEstimator} works them out.
 *
 * @publicApi
 */
export type EstimatedPageNumbers = {
    /**
     * The number of the page each bookmark starts on, as the page shows it, such as `"3"` or `"iv"`, by the bookmark's
     * name. The page references to a bookmark that isn't in it are left blank.
     */
    readonly bookmarks: ReadonlyMap<string, string>;
    /** The number of pages of the document, which its NUMPAGES fields show. They are left blank without it */
    readonly pageCount?: number;
    /**
     * The number of pages of each of the document's sections, in order, which the SECTIONPAGES fields in the section, and
     * in headers and footers only on its pages, show. Those of a section whose number is undefined are left blank.
     */
    readonly sectionPageCounts?: readonly (number | undefined)[];
};

/**
 * Works out which page each bookmark of a document starts on, and how many pages the document and its sections have,
 * from the body of the document as it is written, so the page numbers of its tables of contents, page references and
 * page counts can be written with it.
 *
 * `estimatePageNumbers`, from `docx/layout`, is one. Give it to a document as its `pageNumbers`.
 *
 * @param body - The document's body, formatted to be written as XML
 * @param context - The context the body was formatted in, with the document it is in
 *
 * @publicApi
 */
export type PageNumberEstimator = (body: IXmlableObject, context: IContext) => EstimatedPageNumbers;

/** A formatted element, such as `{ "w:r": [...] }` */
type Element = Record<string, unknown>;

/** A complex field being read: its instruction, and whether its result has been reached */
type OpenField = {
    // eslint-disable-next-line functional/prefer-readonly-type
    instruction: string;
    // eslint-disable-next-line functional/prefer-readonly-type
    inResult: boolean;
    /** The result it is written with */
    // eslint-disable-next-line functional/prefer-readonly-type
    result?: string;
};

/** How the fields of a part of a document are filled in */
type FieldFilling = {
    /** The result of a field, from its instruction, or undefined to leave the field as it is */
    readonly resultOf: (instruction: string) => string | undefined;
    /** Called after each paragraph, whose properties can end a section */
    readonly afterParagraph: (paragraph: Element) => void;
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

/** The result of a field that shows a page's number or a number of pages, or undefined to leave it as it is */
const resultFrom = (instruction: string, { bookmarks, pageCount }: EstimatedPageNumbers, sectionPageCount?: number): string | undefined => {
    const bookmark = bookmarkOf(instruction);
    if (bookmark !== undefined) {
        return bookmarks.get(bookmark);
    }
    const count = pageCountOf(instruction);
    const value = count === "document" ? pageCount : count === "section" ? sectionPageCount : undefined;
    return value === undefined ? undefined : String(value);
};

const nameOf = (element: unknown): string | undefined =>
    typeof element === "object" && element !== null && !Array.isArray(element) ? Object.keys(element)[0] : undefined;

const contentOf = (element: Element): readonly unknown[] => {
    const content = element[nameOf(element)!];
    return Array.isArray(content) ? content : [];
};

const attributeOf = (element: Element, name: string, attribute: string): unknown => {
    const content = element[name];
    const holder = Array.isArray(content) ? content.find((child) => nameOf(child) === "_attr") : content;
    return (holder as { readonly _attr?: Record<string, unknown> } | undefined)?._attr?.[attribute];
};

const textElement = (text: string): Element => ({ "w:t": [{ _attr: { "xml:space": "preserve" } }, text] });

/**
 * Writes clean the beginning of a field that is dirty only without page numbers, such as a page reference, so Word
 * shows its result as it is written and doesn't ask to update the fields
 */
const writeClean = (begin: Element): void => {
    const attributes = (begin["w:fldChar"] as { readonly _attr: Record<string, unknown> })._attr;
    // eslint-disable-next-line functional/immutable-data
    begin["w:fldChar"] = { _attr: Object.fromEntries(Object.entries(attributes).filter(([key]) => key !== "w:dirty")) };
};

/**
 * Writes the results the filling works out into the fields in the elements, in order. A field's result is written just
 * after its `separate` field character, and any result it had is taken out.
 */
// eslint-disable-next-line functional/prefer-readonly-type
const fillFields = (elements: unknown[], open: OpenField[], filling: FieldFilling): void => {
    for (let index = 0; index < elements.length; index++) {
        const element = elements[index];
        const name = nameOf(element);
        if (name === undefined || name === "_attr") {
            continue;
        }
        const current = open[open.length - 1];
        if (name === "w:fldChar") {
            const type = attributeOf(element as Element, name, "w:fldCharType");
            if (type === "begin") {
                // eslint-disable-next-line functional/immutable-data
                open.push({ instruction: "", inResult: false });
                if (isDirtyWithoutPageNumbers(element)) {
                    writeClean(element as Element);
                }
            } else if (type === "separate" && current) {
                // eslint-disable-next-line functional/immutable-data
                current.inResult = true;
                // eslint-disable-next-line functional/immutable-data
                current.result = filling.resultOf(current.instruction);
                if (current.result !== undefined) {
                    // eslint-disable-next-line functional/immutable-data
                    elements.splice(index + 1, 0, textElement(current.result));
                    index++;
                }
            } else if (type === "end") {
                // eslint-disable-next-line functional/immutable-data
                open.pop();
            }
        } else if (name === "w:instrText" && current && !current.inResult) {
            // An instruction is written as its attributes and its text
            // eslint-disable-next-line functional/immutable-data
            current.instruction += contentOf(element as Element)
                .filter((part) => typeof part === "string")
                .join("");
        } else if ((name === "w:t" || name === "w:tab" || name === "w:br" || name === "w:cr") && current?.result !== undefined) {
            // The result it was written with
            // eslint-disable-next-line functional/immutable-data
            elements.splice(index, 1);
            index--;
        } else if (name === "w:fldSimple") {
            fillSimpleField(element as Element, filling);
        } else {
            const content = (element as Element)[name];
            if (Array.isArray(content)) {
                fillFields(content, open, filling);
            }
            if (name === "w:p") {
                filling.afterParagraph(element as Element);
            }
        }
    }
};

/**
 * Writes the result into a simple field (`w:fldSimple`) whose result the filling works out: its runs are its result.
 */
const fillSimpleField = (element: Element, filling: FieldFilling): void => {
    const result = filling.resultOf(String(attributeOf(element, "w:fldSimple", "w:instr")));
    const content = element["w:fldSimple"] as readonly unknown[];
    if (result === undefined) {
        // eslint-disable-next-line functional/prefer-readonly-type
        fillFields(content as unknown[], [], filling);
        return;
    }
    const attributes = content.filter((child) => nameOf(child) === "_attr");
    // eslint-disable-next-line functional/immutable-data
    element["w:fldSimple"] = [...attributes, { "w:r": [textElement(result)] }];
};

/** The section properties (`w:sectPr`) in the elements, in order: those of the paragraphs that end sections, and the last */
const sectionPropertiesIn = (elements: readonly unknown[]): readonly Element[] =>
    elements.flatMap((element): readonly Element[] => {
        const name = nameOf(element);
        if (name === undefined || name === "_attr") {
            return [];
        }
        return name === "w:sectPr" ? [element as Element] : sectionPropertiesIn(contentOf(element as Element));
    });

/** Whether a paragraph ends a section: whether its properties have the section's */
const endsSection = (paragraph: Element): boolean =>
    contentOf(paragraph).some(
        (child) => nameOf(child) === "w:pPr" && contentOf(child as Element).some((part) => nameOf(part) === "w:sectPr"),
    );

/**
 * The number of pages each header and footer shows in its SECTIONPAGES fields, by the id of the relationship to it:
 * that of the sections whose pages it is on, when they all have the same. A section without a header or footer of a kind
 * has the one of the section before, as Word lays them out.
 */
const partPageCountsOf = (body: IXmlableObject, sectionPageCounts: readonly (number | undefined)[]): ReadonlyMap<string, number> => {
    const partsOfSections = sectionPropertiesIn([body]).reduce<readonly ReadonlyMap<string, string>[]>((all, properties) => {
        const references = contentOf(properties).flatMap((child) => {
            const name = nameOf(child);
            return name === "w:headerReference" || name === "w:footerReference"
                ? [
                      [
                          `${name} ${String(attributeOf(child as Element, name, "w:type"))}`,
                          String(attributeOf(child as Element, name, "r:id")),
                      ] as const,
                  ]
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

/** The estimate of each document's pages, and the numbers of pages its headers and footers show, once its body is written */
const estimates = new WeakMap<object, { readonly estimate: EstimatedPageNumbers; readonly partPageCounts: ReadonlyMap<string, number> }>();

/**
 * Writes the page numbers the estimator works out into the fields of a formatted body that show them: the PAGEREF fields
 * in its tables of contents and elsewhere, and its NUMPAGES and SECTIONPAGES fields. A field whose number the estimator
 * didn't work out is left as it is. Page references and tables of contents are written clean, whether or not their
 * numbers were worked out. The estimate is kept for the document's headers and footers.
 */
export const fillPageNumbers = (body: IXmlableObject, context: IContext, estimator: PageNumberEstimator): void => {
    const estimate = estimator(body, context);
    const { sectionPageCounts = [] } = estimate;
    let section = 0;
    fillFields([body], [], {
        resultOf: (instruction) => resultFrom(instruction, estimate, sectionPageCounts[section]),
        afterParagraph: (paragraph) => {
            section += endsSection(paragraph) ? 1 : 0;
        },
    });
    if (context.file) {
        estimates.set(context.file, { estimate, partPageCounts: partPageCountsOf(body, sectionPageCounts) });
    }
};

/**
 * Writes the page numbers worked out for the document a header or footer is in into the fields of the formatted header or
 * footer that show them, once the document's body is written.
 *
 * @param part - The formatted header or footer, if it has anything to write
 * @param context - The context it was formatted in, with the document it is in
 * @param referenceId - The number of the relationship to it
 */
export const fillPartPageNumbers = (part: IXmlableObject | undefined, context: IContext, referenceId: number): void => {
    const written = context.file && estimates.get(context.file);
    if (!part || !written) {
        return;
    }
    const sectionPageCount = written.partPageCounts.get(`rId${referenceId}`);
    fillFields([part], [], {
        resultOf: (instruction) => resultFrom(instruction, written.estimate, sectionPageCount),
        afterParagraph: () => undefined,
    });
};
