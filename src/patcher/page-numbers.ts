/**
 * Page numbers written into a template's fields once `patchDocument` has patched it, from an estimate of its pages, as
 * a document's are when it is written with `pageNumbers`.
 *
 * @module
 */
import type { Element } from "xml-js";

import { type ElementTree, fillBodyFields, fillPartFields } from "@file/document/body/page-number-fields";
import type { EstimatedPageNumbers } from "@file/document/body/page-numbers";

import { relationshipsPathOf, resolveTarget } from "./drawing-patch";

/**
 * A template once `patchDocument` has patched it, as a {@link TemplatePageNumberEstimator} reads it.
 *
 * @publicApi
 */
export type PatchedTemplate = {
    /**
     * Each XML part of the template's package, by its path in the package, such as "word/document.xml". Each is parsed as
     * `patchDocument` parses it, with xml-js's `xml2js`, not compact, and keeping the spaces between elements
     * (`captureSpacesBetweenElements`), as the spaces in a text element are its text
     */
    readonly parts: ReadonlyMap<string, Element>;
    /** Each of its other parts, such as its pictures and the fonts it embeds, by its path in the package, as bytes */
    readonly binaryParts?: ReadonlyMap<string, Uint8Array>;
};

/**
 * Works out which page each bookmark of a template starts on, and how many pages it and each of its sections have, once
 * `patchDocument` has patched it, so the page numbers of its tables of contents and page references, and its numbers of
 * pages, are written with it.
 *
 * `estimatePageNumbers`, from `docx/layout`, is one. Give it to `patchDocument` as its `pageNumbers`.
 *
 * @publicApi
 */
export type TemplatePageNumberEstimator = (template: PatchedTemplate) => EstimatedPageNumbers;

/** The elements of a template, as xml-js parses them */
const PARSED: ElementTree<Element> = {
    nameOf: (element) => (element.type === "element" ? element.name : undefined),
    contentOf: (element) => element.elements,
    attributeOf: (element, attribute) => element.attributes?.[attribute],
    textOf: (element) =>
        (element.elements ?? [])
            .filter(({ type }) => type === "text")
            .map(({ text }) => String(text))
            .join(""),
    textElement: (text) => ({ type: "element", name: "w:t", attributes: { "xml:space": "preserve" }, elements: [{ type: "text", text }] }),
    // A page reference or table of contents is written clean, as docx writes them with page numbers, so Word shows its
    // numbers as they are and doesn't ask to update the fields
    writeClean: (begin, instruction) => {
        if (/^\s*(PAGEREF|TOC)\b/i.test(instruction) && begin.attributes?.["w:dirty"] !== undefined) {
            // eslint-disable-next-line functional/immutable-data
            begin.attributes = Object.fromEntries(Object.entries(begin.attributes).filter(([key]) => key !== "w:dirty"));
        }
    },
    setSimpleFieldResult: (element, text) => {
        // eslint-disable-next-line functional/immutable-data
        element.elements = [{ type: "element", name: "w:r", elements: [PARSED.textElement(text)] }];
    },
};

// The part patchDocument patches as the document's body
const DOCUMENT = "word/document.xml";

/** The root element of a part, such as `w:document` */
const rootOf = (part: Element | undefined): Element | undefined => part?.elements?.find(({ type }) => type === "element");

/**
 * Writes the page numbers the estimator works out for a patched template into the fields of its body, headers and
 * footers that show them: its PAGEREF fields, in its tables of contents and elsewhere, and its NUMPAGES and SECTIONPAGES
 * fields. The results a field was written with are those of the template before it was patched, so a field whose number
 * the estimator doesn't work out is left blank, as it is in a document written with `pageNumbers`. Page references and
 * tables of contents are written clean, as they are in a document written with `pageNumbers`, so Word shows their numbers
 * as they are and doesn't ask to update the fields.
 *
 * @param parts - The template's XML parts, parsed, by their paths, which are changed in place
 * @param binaryParts - Its other parts, by their paths, for the estimator to read the fonts it embeds
 */
export const fillTemplatePageNumbers = (
    parts: ReadonlyMap<string, Element>,
    estimator: TemplatePageNumberEstimator,
    binaryParts: ReadonlyMap<string, Uint8Array> = new Map(),
): void => {
    const document = rootOf(parts.get(DOCUMENT));
    if (!document) {
        return;
    }
    const estimate = estimator({ parts, binaryParts });
    const partPageCounts = fillBodyFields(PARSED, document, estimate, { blank: true });
    // The headers and footers the document refers to
    const relationships = rootOf(parts.get(relationshipsPathOf(DOCUMENT)))?.elements ?? [];
    for (const { attributes = {} } of relationships) {
        const part = /\/(header|footer)$/.test(String(attributes.Type))
            ? rootOf(parts.get(resolveTarget(DOCUMENT, String(attributes.Target))))
            : undefined;
        if (part) {
            fillPartFields(PARSED, part, estimate, { blank: true, sectionPageCount: partPageCounts.get(String(attributes.Id)) });
        }
    }
};
