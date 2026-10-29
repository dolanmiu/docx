/**
 * Replacer module for performing placeholder substitution in XML structures.
 *
 * @module
 */

import type { IContext, XmlComponent } from "@file/xml-components";
import { type XmlElement as Element, stringifyXmlable } from "@util/xml";

import { type IPatch, PatchType } from "./from-docx";
import { findRunElementPathWithToken, splitRunElement } from "./paragraph-split-inject";
import { replaceTokenInParagraphElement } from "./paragraph-token-replacer";
import { type IRenderedParagraphNode, elementAtPath, renderParagraphNode } from "./run-renderer";
import { findLocationOfText } from "./traverser";
import { toJson } from "./util";

/**
 * Renumbers the ids in content that is about to be inserted, such as its bookmarks', so they are unique in the document,
 * and records the styles it uses, so those the document doesn't have are added to it.
 */
type RenumberIds = (elements: readonly Element[]) => readonly Element[];

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
 * @param renumberIds - Renumbers the bookmarks and note references the patch inserts, so they don't take an id the
 * document uses, and records the styles it uses
 * @returns Result containing the modified element and whether a replacement occurred
 */
export const replacer = ({
    json,
    patch,
    patchText,
    context,
    keepOriginalStyles = true,
    recursive = true,
    renumberIds = (elements) => elements,
}: {
    readonly json: Element;
    readonly patch: IPatch;
    readonly patchText: string;
    readonly context: IContext;
    readonly keepOriginalStyles?: boolean;
    readonly recursive?: boolean;
    readonly renumberIds?: RenumberIds;
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

    // A tracked change split around a link is given ids for its new pieces that nothing in the part has
    let highestId: number | undefined;
    const newTrackedChangeId = (): string => {
        highestId = (highestId ?? highestIdIn(json)) + 1;
        return String(highestId);
    };

    for (const renderedParagraph of paragraphsToPatch) {
        switch (patch.type) {
            case PatchType.DOCUMENT: {
                const parentElement = goToParentElementFromPath(json, renderedParagraph.pathToParagraph);
                const elementIndex = getLastElementIndexFromPath(renderedParagraph.pathToParagraph);
                const children = formatChildren(patch, context, renumberIds);
                // A cell must end with a paragraph. Word finds a cell that ends with a table, or is empty, unreadable
                const endsCell = parentElement.name === "w:tc" && elementIndex === parentElement.elements!.length - 1;
                const endParagraph = endsCell && children[children.length - 1]?.name !== "w:p" ? [{ type: "element", name: "w:p" }] : [];
                // eslint-disable-next-line functional/immutable-data
                parentElement.elements!.splice(elementIndex, 1, ...children, ...endParagraph);
                break;
            }
            case PatchType.PARAGRAPH:
            default: {
                const paragraphElement = goToElementFromPath(json, renderedParagraph.pathToParagraph);
                let paragraph = renderedParagraph;
                let fromIndex = 0;

                do {
                    // Look for the next occurrence after the inserted content, so a placeholder in the patch is never patched
                    fromIndex = replaceOccurrenceInParagraph({
                        paragraphElement,
                        renderedParagraph: paragraph,
                        patchText,
                        fromIndex,
                        children: formatChildren(patch, context, renumberIds),
                        keepOriginalStyles,
                        newTrackedChangeId,
                    });

                    paragraph = renderParagraphNode({ element: paragraphElement, index: renderedParagraph.index, parent: undefined });
                } while (recursive && paragraph.text.includes(patchText, fromIndex));
                break;
            }
        }
    }

    return { element: json, didFindOccurrence: true };
};

const formatChildren = (patch: IPatch, context: IContext, renumberIds: RenumberIds): readonly Element[] =>
    renumberIds(
        patch.children
            .flatMap((c) => (c as XmlComponent).writtenAs ?? (c as XmlComponent))
            // A child written as nothing in this part, such as a footnote's reference in a header, is left out
            .flatMap((c) => {
                const formatted = c.prepForXml(context);
                return formatted ? [toJson(stringifyXmlable(formatted)).elements![0]] : [];
            }),
    );

/**
 * Replaces the first occurrence of the placeholder from `fromIndex` on, splitting the run it starts in. The content goes
 * where that run is, in the paragraph or in what holds the run in it, such as a link or a content control, unless that
 * can't hold it.
 *
 * @returns Where the text after the inserted content starts in the paragraph's text
 */
const replaceOccurrenceInParagraph = ({
    paragraphElement,
    renderedParagraph,
    patchText,
    fromIndex,
    children,
    keepOriginalStyles,
    newTrackedChangeId,
}: {
    readonly paragraphElement: Element;
    readonly renderedParagraph: IRenderedParagraphNode;
    readonly patchText: string;
    readonly fromIndex: number;
    readonly children: readonly Element[];
    readonly keepOriginalStyles: boolean;
    readonly newTrackedChangeId: () => string;
}): number => {
    const start = renderedParagraph.text.indexOf(patchText, fromIndex);

    replaceTokenInParagraphElement({
        paragraphElement,
        renderedParagraph,
        originalText: patchText,
        replacementText: SPLIT_TOKEN,
        fromIndex,
    });

    const runPath = findRunElementPathWithToken(paragraphElement, SPLIT_TOKEN);
    const containerPath = runPath.slice(0, -1);
    const container = elementAtPath(paragraphElement, containerPath);
    const index = runPath[runPath.length - 1];
    // The content controls the placeholder is in, the innermost last
    const contentControls = containerPath
        .map((_, depth) => elementAtPath(paragraphElement, containerPath.slice(0, depth + 1)))
        .filter((e) => e.name === "w:sdt");
    const controlShowingPlaceholder = [...contentControls].reverse().find(isShowingPlaceholder);

    const runElementToBeReplaced = container.elements![index];
    const { left, right } = splitRunElement(runElementToBeReplaced, SPLIT_TOKEN);
    const runProperties = runElementToBeReplaced.elements!.find((e) => e.type === "element" && e.name === "w:rPr");
    // A content control's placeholder text has a look of its own, such as Word's grey Placeholder Text, and what
    // replaces it takes the control's run properties instead, as text typed in it does
    const contentRunProperties = controlShowingPlaceholder ? runPropertiesOfContentControl(controlShowingPlaceholder) : runProperties;

    const newRunElements =
        keepOriginalStyles && contentRunProperties ? children.map((e) => withRunPropertiesOnRuns(e, contentRunProperties)) : children;
    // The text after the placeholder is the document's own, so it keeps its formatting either way
    const patchedRightElement = runProperties ? { ...right, elements: [runProperties, ...right.elements!] } : right;

    // eslint-disable-next-line functional/immutable-data
    container.elements!.splice(index, 1, left, ...newRunElements, patchedRightElement);
    contentControls.forEach((contentControl) => fillContentControl(contentControl, newRunElements));
    liftOutOfContainers(paragraphElement, containerPath, newTrackedChangeId);

    return (
        start + renderParagraphNode({ element: { name: "w:p", elements: [...newRunElements] }, index: 0, parent: undefined }).text.length
    );
};

const propertiesOfContentControl = (contentControl: Element): Element | undefined =>
    contentControl.elements?.find((e) => e.name === "w:sdtPr");

const isShowingPlaceholder = (contentControl: Element): boolean =>
    !!propertiesOfContentControl(contentControl)?.elements?.some((e) => e.name === "w:showingPlcHdr");

const runPropertiesOfContentControl = (contentControl: Element): Element | undefined =>
    propertiesOfContentControl(contentControl)?.elements?.find((e) => e.name === "w:rPr");

// What Word opens in a plain text content control: runs of text, tabs and breaks, and bookmarks. A link, a picture, a
// field or a symbol in one makes Word find the document unreadable
const PLAIN_TEXT_RUN_CONTENT: ReadonlySet<string | undefined> = new Set(["w:rPr", "w:t", "w:tab", "w:br"]);

const isPlainText = (element: Element): boolean =>
    element.name === "w:bookmarkStart" ||
    element.name === "w:bookmarkEnd" ||
    (element.name === "w:r" && childElementsOf(element).every((e) => PLAIN_TEXT_RUN_CONTENT.has(e.name)));

/**
 * Makes a content control show the content a patch put in it as its own. It no longer shows its placeholder text, as
 * when text is typed in it, and a plain text control given more than text, such as a link or a picture, becomes a rich
 * text control, as Word won't open a plain text one with it.
 */
const fillContentControl = (contentControl: Element, insertedElements: readonly Element[]): void => {
    const properties = propertiesOfContentControl(contentControl);
    if (!properties?.elements) {
        return;
    }

    const isPlainTextControl = properties.elements.some((e) => e.name === "w:text");
    const needsRichText = isPlainTextControl && !insertedElements.every(isPlainText);
    properties.elements = properties.elements.filter((e) => e.name !== "w:showingPlcHdr" && !(needsRichText && e.name === "w:text"));
};

// What a tracked insertion or move can't hold, though a paragraph can: a link, a field or a subdocument
const NOT_IN_TRACKED_CHANGES: ReadonlySet<string | undefined> = new Set(["w:hyperlink", "w:fldSimple", "w:subDoc"]);

/**
 * The elements each container of runs can't hold. Word reads a link in a link as two links over the same text, so a
 * patch's link in place of a placeholder in a link takes the place of that link there.
 */
const NOT_IN_CONTAINER: ReadonlyMap<string | undefined, ReadonlySet<string | undefined>> = new Map([
    ["w:ins", NOT_IN_TRACKED_CHANGES],
    ["w:moveTo", NOT_IN_TRACKED_CHANGES],
    ["w:hyperlink", new Set(["w:hyperlink"])],
]);

/**
 * Splits each container of runs, from the placeholder's run up to the paragraph, around the content in it that it can't
 * hold, such as a link a patch put in place of a placeholder typed with Track Changes on. That content then isn't
 * tracked, as when Word inserts a link with Track Changes off, and the text before and after it still is. Each tracked
 * change must have an id of its own, so the pieces after the first are given new ones.
 */
const liftOutOfContainers = (paragraphElement: Element, containerPath: readonly number[], newTrackedChangeId: () => string): void => {
    for (let depth = containerPath.length; depth > 0; depth--) {
        const parent = elementAtPath(paragraphElement, containerPath.slice(0, depth - 1));
        const index = containerPath[depth - 1];
        const container = parent.elements![index];
        const cantHold = NOT_IN_CONTAINER.get(container.name);
        const isLifted = (element: Element): boolean => !!cantHold?.has(element.name);

        if (!container.elements?.some(isLifted)) {
            continue;
        }

        // Each stretch of what it can hold stays in a copy of it
        const stretches = container.elements.reduce<readonly (readonly Element[])[]>((all, element) => {
            const previous = all[all.length - 1];
            return isLifted(element) || !previous || isLifted(previous[0])
                ? [...all, [element]]
                : [...all.slice(0, -1), [...previous, element]];
        }, []);
        const isTrackedChange = cantHold === NOT_IN_TRACKED_CHANGES;
        let isFirstCopy = true;
        const pieces = stretches.map((stretch) => {
            if (isLifted(stretch[0])) {
                return stretch[0];
            }
            const attributes =
                isTrackedChange && !isFirstCopy ? { ...container.attributes, "w:id": newTrackedChangeId() } : container.attributes;
            isFirstCopy = false;
            return { ...container, attributes, elements: [...stretch] };
        });

        // eslint-disable-next-line functional/immutable-data
        parent.elements!.splice(index, 1, ...pieces);
    }
};

/**
 * Gives the runs of inserted content the placeholder's run properties. Content such as a hyperlink can't take run
 * properties itself, so its runs take them, and its text is formatted as the text around it is. Runs inside a run, such
 * as in its text box, are that content's own, and are left alone.
 */
const withRunPropertiesOnRuns = (element: Element, originalRunProperties: Element): Element => {
    if (element.name === "w:r") {
        return withRunProperties(element, originalRunProperties);
    }

    return element.elements
        ? { ...element, elements: element.elements.map((e) => withRunPropertiesOnRuns(e, originalRunProperties)) }
        : element;
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

/**
 * The highest whole number id (w:id) of an element or anything in it.
 */
const highestIdIn = (element: Element): number => {
    const id = Number(element.attributes?.["w:id"]);
    return (element.elements ?? []).reduce((highest, child) => Math.max(highest, highestIdIn(child)), Number.isInteger(id) ? id : 0);
};

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
