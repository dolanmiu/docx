/**
 * Run renderer for extracting text content from OOXML paragraph structures.
 *
 * @module
 */

import type { XmlElement as Element } from "@util/xml";

import type { ElementWrapper } from "./traverser";

/**
 * Rendered representation of a paragraph with its text content and structure.
 *
 * @property text - Complete text content of the paragraph
 * @property runs - Array of run elements within the paragraph
 * @property index - Position index of the paragraph among siblings
 * @property pathToParagraph - Path indices from root to this paragraph
 */
export type IRenderedParagraphNode = {
    readonly text: string;
    readonly runs: readonly IRenderedRunNode[];
    readonly index: number;
    readonly pathToParagraph: readonly number[];
};

/**
 * Character position range within a paragraph.
 */
type StartAndEnd = {
    /** Starting character index */
    readonly start: number;
    /** Ending character index */
    readonly end: number;
};

/**
 * Text fragment within a run element.
 */
type IParts = {
    /** Text content of this fragment */
    readonly text: string;
    /** Position index within the run */
    readonly index: number;
} & StartAndEnd;

/**
 * Rendered representation of a run element (w:r) with its text content.
 *
 * @property text - Complete text content of the run
 * @property parts - Array of text fragments (w:t elements) within the run
 * @property path - Position indices from the paragraph to the run, through the element holding it, such as a link
 * @property start - Starting character index in the paragraph
 * @property end - Ending character index in the paragraph
 */
export type IRenderedRunNode = {
    readonly text: string;
    readonly parts: readonly IParts[];
    readonly path: readonly number[];
} & StartAndEnd;

/**
 * The elements in a paragraph that hold runs of its text, so a placeholder can be in a link, a content control, a
 * tracked insertion, a smart tag or a field's result. A content control holds them in its w:sdtContent. Deleted text, in
 * w:del or w:moveFrom, isn't the paragraph's text, and a run's own content, such as a text box, has paragraphs of its own.
 */
const RUN_CONTAINERS: ReadonlySet<string> = new Set([
    "w:hyperlink",
    "w:sdt",
    "w:sdtContent",
    "w:ins",
    "w:moveTo",
    "w:smartTag",
    "w:customXml",
    "w:fldSimple",
    "w:dir",
    "w:bdo",
]);

/**
 * The runs in an element of a paragraph, in the order they are read, with the indices from the paragraph to each.
 */
const runsIn = (element: Element, path: readonly number[]): readonly { readonly element: Element; readonly path: readonly number[] }[] =>
    (element.elements ?? []).flatMap((child, i) => {
        if (child.name === "w:r") {
            return [{ element: child, path: [...path, i] }];
        }
        return RUN_CONTAINERS.has(child.name ?? "") ? runsIn(child, [...path, i]) : [];
    });

/**
 * The element at the end of a path of position indices from an element, such as a run from its paragraph.
 */
export const elementAtPath = (element: Element, path: readonly number[]): Element =>
    path.reduce((parent, index) => parent.elements![index], element);

/**
 * Renders a paragraph element into a structured representation with text content.
 *
 * Extracts all text content from a paragraph (w:p) element by processing its
 * runs (w:r), including those in a link, content control or tracked insertion.
 * Calculates character positions for each text fragment to enable precise text
 * replacement operations.
 *
 * @param node - The paragraph element wrapper to render
 * @returns Rendered paragraph with text content, runs, and position information
 * @throws Error if the node is not a paragraph element
 *
 * @example
 * ```typescript
 * const rendered = renderParagraphNode(paragraphWrapper);
 * console.log(rendered.text); // "Hello World"
 * console.log(rendered.runs.length); // 2 (if text is in separate runs)
 * ```
 */
export const renderParagraphNode = (node: ElementWrapper): IRenderedParagraphNode => {
    if (node.element.name !== "w:p") {
        throw new Error(`Invalid node type: ${node.element.name}`);
    }

    if (!node.element.elements) {
        return {
            text: "",
            runs: [],
            index: -1,
            pathToParagraph: [],
        };
    }

    let currentRunStringLength = 0;

    const runs = runsIn(node.element, []).map(({ element, path }) => {
        const renderedRunNode = renderRunNode(element, path, currentRunStringLength);
        currentRunStringLength += renderedRunNode.text.length;

        return renderedRunNode;
    });

    const text = runs.reduce((acc, curr) => acc + curr.text, "");

    return {
        text,
        runs,
        index: node.index,
        pathToParagraph: buildNodePath(node),
    };
};

const renderRunNode = (node: Element, path: readonly number[], currentRunStringIndex: number): IRenderedRunNode => {
    if (!node.elements) {
        return {
            text: "",
            parts: [],
            path,
            start: currentRunStringIndex,
            end: currentRunStringIndex,
        };
    }

    let currentTextStringIndex = currentRunStringIndex;

    const parts = node.elements
        .map((element, i: number) => {
            if (element.name !== "w:t" || !element.elements || element.elements.length === 0) {
                return undefined;
            }

            const partText = element.elements[0].text?.toString() ?? "";
            const start = currentTextStringIndex;
            // Side effect: the next part starts straight after this one
            currentTextStringIndex += partText.length;

            return { text: partText, index: i, start, end: start + partText.length - 1 };
        })
        .filter((e) => !!e)
        .map((e) => e as IParts);

    const text = parts.reduce((acc, curr) => acc + curr.text, "");

    return {
        text,
        parts,
        path,
        start: currentRunStringIndex,
        end: parts.length > 0 ? parts[parts.length - 1].end : currentRunStringIndex,
    };
};

const buildNodePath = (node: ElementWrapper): readonly number[] =>
    node.parent ? [...buildNodePath(node.parent), node.index] : [node.index];
