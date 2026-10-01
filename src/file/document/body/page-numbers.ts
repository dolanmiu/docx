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

import { type ElementTree, fillBodyFields, fillPartFields } from "./page-number-fields";

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

/** A formatted element, such as `{ "w:r": [...] }`, or its attributes, or text */
type Element = unknown;

const nameOf = (element: Element): string | undefined => {
    const name = typeof element === "object" && element !== null && !Array.isArray(element) ? Object.keys(element)[0] : undefined;
    return name === "_attr" ? undefined : name;
};

const textElement = (text: string): Element => ({ "w:t": [{ _attr: { "xml:space": "preserve" } }, text] });

/** The elements docx formats to write a document */
const FORMATTED: ElementTree<Element> = {
    nameOf,
    contentOf: (element) => {
        const content = (element as Record<string, unknown>)[nameOf(element)!];
        return Array.isArray(content) ? content : undefined;
    },
    attributeOf: (element, attribute) => {
        const content = (element as Record<string, unknown>)[nameOf(element)!];
        const holder = Array.isArray(content)
            ? content.find((child) => typeof child === "object" && child !== null && "_attr" in child)
            : content;
        return (holder as { readonly _attr?: Record<string, unknown> } | undefined)?._attr?.[attribute];
    },
    // An instruction is written as its attributes and its text
    textOf: (element) =>
        FORMATTED.contentOf(element)!
            .filter((part) => typeof part === "string")
            .join(""),
    textElement,
    // A field docx writes dirty only without page numbers, such as a page reference, is written clean, so Word shows
    // its result as it is written and doesn't ask to update the fields
    writeClean: (begin) => {
        if (isDirtyWithoutPageNumbers(begin)) {
            const attributes = ((begin as Record<string, unknown>)["w:fldChar"] as { readonly _attr: Record<string, unknown> })._attr;
            // eslint-disable-next-line functional/immutable-data
            (begin as Record<string, unknown>)["w:fldChar"] = {
                _attr: Object.fromEntries(Object.entries(attributes).filter(([key]) => key !== "w:dirty")),
            };
        }
    },
    setSimpleFieldResult: (element, text) => {
        const attributes = FORMATTED.contentOf(element)!.filter((child) => typeof child === "object" && child !== null && "_attr" in child);
        // eslint-disable-next-line functional/immutable-data
        (element as Record<string, unknown>)["w:fldSimple"] = [...attributes, { "w:r": [textElement(text)] }];
    },
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
    const partPageCounts = fillBodyFields(FORMATTED, body, estimate, { blank: false });
    if (context.file) {
        estimates.set(context.file, { estimate, partPageCounts });
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
    fillPartFields(FORMATTED, part, written.estimate, { blank: false, sectionPageCount: written.partPageCounts.get(`rId${referenceId}`) });
};
