/**
 * Page numbers written into the page references of a document when it is written, from an estimate of its pages.
 *
 * A page reference is a PAGEREF field, such as the page number of an entry in a table of contents. Word works out its
 * page when it updates the field, and until then, and in applications that don't update it, the field shows the result
 * it was written with. `docx` doesn't lay out pages, so it writes the result empty, unless the document is given a
 * {@link PageNumberEstimator}, such as `estimatePageNumbers` from `docx/layout`. Then, once the body is written, each
 * PAGEREF field whose bookmark the estimator placed is given that page's number.
 *
 * @module
 */
import type { IContext, IXmlableObject } from "@file/xml-components";

/**
 * The page each bookmark of a document starts on, as a {@link PageNumberEstimator} works it out.
 *
 * @publicApi
 */
export type EstimatedPageNumbers = {
    /**
     * The number of the page each bookmark starts on, as the page shows it, such as `"3"` or `"iv"`, by the bookmark's
     * name. The page references to a bookmark that isn't in it are left blank.
     */
    readonly bookmarks: ReadonlyMap<string, string>;
};

/**
 * Works out which page each bookmark of a document starts on, from the body of the document as it is written, so the
 * page numbers of its tables of contents and page references can be written with it.
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
    /** The page number its result is replaced with */
    // eslint-disable-next-line functional/prefer-readonly-type
    page?: string;
};

// Formatting switches that don't change how a number is written
// cspell:ignore mergeformatinet
const PLAIN_FORMATS = new Set(["mergeformat", "charformat", "mergeformatinet"]);

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
    const formats = [...switches.matchAll(/\\\*\s*"?([^\s"\\]+)/g)].map(([, format]) => format.toLowerCase());
    return /\\p\b/i.test(switches) || formats.some((format) => !PLAIN_FORMATS.has(format)) ? undefined : bookmark;
};

const nameOf = (element: unknown): string | undefined =>
    typeof element === "object" && element !== null && !Array.isArray(element) ? Object.keys(element)[0] : undefined;

const attributeOf = (element: Element, name: string, attribute: string): unknown => {
    const content = element[name];
    const holder = Array.isArray(content) ? content.find((child) => nameOf(child) === "_attr") : content;
    return (holder as { readonly _attr?: Record<string, unknown> } | undefined)?._attr?.[attribute];
};

const textElement = (text: string): Element => ({ "w:t": [{ _attr: { "xml:space": "preserve" } }, text] });

/**
 * Writes the estimated page numbers into the results of the PAGEREF fields in the elements, in order. A field's result
 * is written just after its `separate` field character, and any result it had is taken out.
 */
// eslint-disable-next-line functional/prefer-readonly-type
const fillFields = (elements: unknown[], open: OpenField[], pages: ReadonlyMap<string, string>): void => {
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
            } else if (type === "separate" && current) {
                const bookmark = bookmarkOf(current.instruction);
                // eslint-disable-next-line functional/immutable-data
                current.inResult = true;
                // eslint-disable-next-line functional/immutable-data
                current.page = bookmark === undefined ? undefined : pages.get(bookmark);
                if (current.page !== undefined) {
                    // eslint-disable-next-line functional/immutable-data
                    elements.splice(index + 1, 0, textElement(current.page));
                    index++;
                }
            } else if (type === "end") {
                // eslint-disable-next-line functional/immutable-data
                open.pop();
            }
        } else if (name === "w:instrText" && current && !current.inResult) {
            // An instruction is written as its attributes and its text
            const content = (element as Element)[name] as readonly unknown[];
            // eslint-disable-next-line functional/immutable-data
            current.instruction += content.filter((part) => typeof part === "string").join("");
        } else if ((name === "w:t" || name === "w:tab" || name === "w:br" || name === "w:cr") && current?.page !== undefined) {
            // The result it was written with
            // eslint-disable-next-line functional/immutable-data
            elements.splice(index, 1);
            index--;
        } else if (name === "w:fldSimple") {
            fillSimpleField(element as Element, pages);
        } else {
            const content = (element as Element)[name];
            if (Array.isArray(content)) {
                fillFields(content, open, pages);
            }
        }
    }
};

/**
 * Writes the page number into a simple field (`w:fldSimple`) that is a PAGEREF field: its runs are its result.
 */
const fillSimpleField = (element: Element, pages: ReadonlyMap<string, string>): void => {
    const bookmark = bookmarkOf(String(attributeOf(element, "w:fldSimple", "w:instr")));
    const page = bookmark === undefined ? undefined : pages.get(bookmark);
    const content = element["w:fldSimple"] as readonly unknown[];
    if (page === undefined) {
        // eslint-disable-next-line functional/prefer-readonly-type
        fillFields(content as unknown[], [], pages);
        return;
    }
    const attributes = content.filter((child) => nameOf(child) === "_attr");
    // eslint-disable-next-line functional/immutable-data
    element["w:fldSimple"] = [...attributes, { "w:r": [textElement(page)] }];
};

/**
 * Writes the page numbers the estimator works out into the page references of a formatted body: the PAGEREF fields in
 * its tables of contents and elsewhere. A field whose bookmark the estimator didn't place is left as it is.
 */
export const fillPageNumbers = (body: IXmlableObject, context: IContext, estimate: PageNumberEstimator): void => {
    const { bookmarks } = estimate(body, context);
    if (bookmarks.size === 0) {
        return;
    }
    fillFields([body], [], bookmarks);
};
