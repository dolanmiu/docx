/**
 * Replacer module for performing placeholder substitution in XML structures.
 *
 * @module
 */
import xml from "xml";
import type { Element } from "xml-js";

import { Formatter } from "@export/formatter";
import type { IContext, XmlComponent } from "@file/xml-components";

import { type IPatch, PatchType } from "./from-docx";
import { findRunElementIndexWithToken, splitRunElement } from "./paragraph-split-inject";
import { replaceTokenInParagraphElement } from "./paragraph-token-replacer";
import { type IRenderedParagraphNode, renderParagraphNode } from "./run-renderer";
import { findLocationOfText } from "./traverser";
import { toJson } from "./util";

const formatter = new Formatter();

// Marks where to split the run. U+FFFF is not allowed in XML, so it can never be in the document's own text.
const SPLIT_TOKEN = "\uFFFF";

/**
 * Result of a replacement operation.
 *
 * @property element - The modified XML element
 * @property didFindOccurrence - Whether a placeholder occurrence was found and replaced
 */
type IReplacerResult = {
    readonly element: Element;
    readonly didFindOccurrence: boolean;
};

/**
 * Replaces placeholder text in XML with new content from a patch.
 *
 * This function locates placeholder text within the XML structure and performs
 * the appropriate replacement based on the patch type (document or paragraph level).
 * It handles splitting runs, preserving styles, and injecting the new content.
 * Content the patch inserts is never searched, so it can contain its own placeholder.
 *
 * @param json - The XML element structure to search
 * @param patch - The patch definition containing replacement content
 * @param patchText - The placeholder text to find (e.g., "{{name}}")
 * @param context - The document context for formatting
 * @param keepOriginalStyles - Whether to preserve original text formatting
 * @param recursive - Whether to replace every occurrence in a paragraph, rather than only the first
 * @returns Result containing the modified element and whether a replacement occurred
 */
export const replacer = ({
    json,
    patch,
    patchText,
    context,
    keepOriginalStyles = true,
    recursive = true,
}: {
    readonly json: Element;
    readonly patch: IPatch;
    readonly patchText: string;
    readonly context: IContext;
    readonly keepOriginalStyles?: boolean;
    readonly recursive?: boolean;
}): IReplacerResult => {
    const renderedParagraphs = findLocationOfText(json, patchText);

    if (renderedParagraphs.length === 0) {
        return { element: json, didFindOccurrence: false };
    }

    // The paths to the paragraphs are found before anything is patched, and every patch moves the elements after it:
    // a document patch moves the paragraph's later siblings, and a paragraph patch moves the runs after the placeholder,
    // such as a run holding a text box. traverse() is breadth-first, so in reverse the deepest paragraphs come first,
    // and later siblings come before earlier ones. Each patch then only moves paragraphs that are already patched.
    const paragraphsInPatchOrder = [...renderedParagraphs].reverse();
    // A document patch replaces the whole paragraph, so a match inside another match, such as in its text box, would be thrown away
    const paragraphsToPatch = patch.type === PatchType.DOCUMENT ? withoutNestedParagraphs(paragraphsInPatchOrder) : paragraphsInPatchOrder;

    for (const renderedParagraph of paragraphsToPatch) {
        switch (patch.type) {
            case PatchType.DOCUMENT: {
                const parentElement = goToParentElementFromPath(json, renderedParagraph.pathToParagraph);
                const elementIndex = getLastElementIndexFromPath(renderedParagraph.pathToParagraph);
                // eslint-disable-next-line functional/immutable-data
                parentElement.elements!.splice(elementIndex, 1, ...formatChildren(patch, context));
                break;
            }
            case PatchType.PARAGRAPH:
            default: {
                const paragraphElement = goToElementFromPath(json, renderedParagraph.pathToParagraph);
                let paragraph = renderedParagraph;
                let fromIndex = 0;

                do {
                    const nextRunIndex = replaceOccurrenceInParagraph({
                        paragraphElement,
                        renderedParagraph: paragraph,
                        patchText,
                        fromIndex,
                        children: formatChildren(patch, context),
                        keepOriginalStyles,
                    });

                    paragraph = renderParagraphNode({ element: paragraphElement, index: renderedParagraph.index, parent: undefined });
                    // Look for the next occurrence after the inserted content, so a placeholder in the patch is never patched
                    fromIndex = paragraph.runs
                        .filter((run) => run.index < nextRunIndex)
                        .reduce((length, run) => length + run.text.length, 0);
                } while (recursive && paragraph.text.includes(patchText, fromIndex));
                break;
            }
        }
    }

    return { element: json, didFindOccurrence: true };
};

const formatChildren = (patch: IPatch, context: IContext): readonly Element[] =>
    patch.children
        .flatMap((c) => (c as XmlComponent).writtenAs ?? (c as XmlComponent))
        .map((c) => toJson(xml(formatter.format(c, context))))
        .map((c) => c.elements![0]);

/**
 * Replaces the first occurrence of the placeholder from `fromIndex` on, splitting the run it starts in.
 *
 * @returns The index of the run after the inserted content
 */
const replaceOccurrenceInParagraph = ({
    paragraphElement,
    renderedParagraph,
    patchText,
    fromIndex,
    children,
    keepOriginalStyles,
}: {
    readonly paragraphElement: Element;
    readonly renderedParagraph: IRenderedParagraphNode;
    readonly patchText: string;
    readonly fromIndex: number;
    readonly children: readonly Element[];
    readonly keepOriginalStyles: boolean;
}): number => {
    replaceTokenInParagraphElement({
        paragraphElement,
        renderedParagraph,
        originalText: patchText,
        replacementText: SPLIT_TOKEN,
        fromIndex,
    });

    const index = findRunElementIndexWithToken(paragraphElement, SPLIT_TOKEN);

    const runElementToBeReplaced = paragraphElement.elements![index];
    const { left, right } = splitRunElement(runElementToBeReplaced, SPLIT_TOKEN);
    const runProperties = runElementToBeReplaced.elements!.find((e) => e.type === "element" && e.name === "w:rPr");

    // Only runs take run properties. Other content, such as a hyperlink, would not be valid with them.
    const newRunElements =
        keepOriginalStyles && runProperties ? children.map((e) => (e.name === "w:r" ? withRunProperties(e, runProperties) : e)) : children;
    // The text after the placeholder is the document's own, so it keeps its formatting either way
    const patchedRightElement = runProperties ? { ...right, elements: [runProperties, ...right.elements!] } : right;

    // eslint-disable-next-line functional/immutable-data
    paragraphElement.elements!.splice(index, 1, left, ...newRunElements, patchedRightElement);

    return index + 1 + newRunElements.length;
};

/**
 * Gives a run the placeholder's run properties. A run can only have one w:rPr, so properties the run
 * sets itself are kept, and the placeholder's fill in the rest.
 */
const withRunProperties = (runElement: Element, originalRunProperties: Element): Element => {
    const ownRunProperties = childElementsOf(runElement).find((e) => e.type === "element" && e.name === "w:rPr");

    if (!ownRunProperties) {
        return { ...runElement, elements: [originalRunProperties, ...childElementsOf(runElement)] };
    }

    const ownPropertyNames = new Set(childElementsOf(ownRunProperties).map((e) => e.name));
    const properties = [
        ...childElementsOf(originalRunProperties).filter((e) => !ownPropertyNames.has(e.name)),
        ...childElementsOf(ownRunProperties),
    ];
    const mergedRunProperties = {
        ...ownRunProperties,
        elements: [...properties].sort((a, b) => runPropertyRank(a) - runPropertyRank(b)),
    };

    return { ...runElement, elements: childElementsOf(runElement).map((e) => (e === ownRunProperties ? mergedRunProperties : e)) };
};

/**
 * The order Office's schema puts a run's properties in: CT_RPr's elements, then Word 2010's text effects and
 * OpenType features. ISO 29500 allows any order, but Office and the Open XML SDK validator don't.
 */
const RUN_PROPERTY_ORDER = [
    "w:rStyle",
    "w:rFonts",
    "w:b",
    "w:bCs",
    "w:i",
    "w:iCs",
    "w:caps",
    "w:smallCaps",
    "w:strike",
    "w:dstrike",
    "w:outline",
    "w:shadow",
    "w:emboss",
    "w:imprint",
    "w:noProof",
    "w:snapToGrid",
    "w:vanish",
    "w:webHidden",
    "w:color",
    "w:spacing",
    "w:w",
    "w:kern",
    "w:position",
    "w:sz",
    "w:szCs",
    "w:highlight",
    "w:u",
    "w:effect",
    "w:bdr",
    "w:shd",
    "w:fitText",
    "w:vertAlign",
    "w:rtl",
    "w:cs",
    "w:em",
    "w:lang",
    "w:eastAsianLayout",
    "w:specVanish",
    "w:oMath",
    "w14:glow",
    "w14:shadow",
    "w14:reflection",
    "w14:textOutline",
    "w14:textFill",
    "w14:scene3d",
    "w14:props3d",
    "w14:ligatures",
    "w14:numForm",
    "w14:numSpacing",
    "w14:stylisticSets",
    "w14:cntxtAlts",
];

// A property that isn't listed keeps its place after the listed ones. w:rPrChange has to come after every other property
const runPropertyRank = (element: Element): number => {
    if (element.name === "w:rPrChange") {
        return RUN_PROPERTY_ORDER.length + 1;
    }
    const index = RUN_PROPERTY_ORDER.indexOf(element.name ?? "");
    return index === -1 ? RUN_PROPERTY_ORDER.length : index;
};

const childElementsOf = (element: Element): readonly Element[] => element.elements ?? [];

const isInsideElementAtPath = (path: readonly number[], ancestorPath: readonly number[]): boolean =>
    path.length > ancestorPath.length && ancestorPath.every((index, i) => path[i] === index);

const withoutNestedParagraphs = (paragraphs: readonly IRenderedParagraphNode[]): readonly IRenderedParagraphNode[] =>
    paragraphs.filter((paragraph) => !paragraphs.some((other) => isInsideElementAtPath(paragraph.pathToParagraph, other.pathToParagraph)));

const goToElementFromPath = (json: Element, path: readonly number[]): Element => {
    let element = json;

    // We start from 1 because the first element is the root element
    // Which we do not want to double count
    for (let i = 1; i < path.length; i++) {
        const index = path[i];
        const nextElements = element.elements!;

        element = nextElements[index];
    }

    return element;
};

const goToParentElementFromPath = (json: Element, path: readonly number[]): Element =>
    goToElementFromPath(json, path.slice(0, path.length - 1));

const getLastElementIndexFromPath = (path: readonly number[]): number => path[path.length - 1];
