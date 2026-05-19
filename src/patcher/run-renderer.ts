/**
 * Run renderer for extracting text content from OOXML paragraph structures.
 *
 * @module
 */
import type { Element } from "xml-js";

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
 * @property index - Position index of the run within the paragraph
 * @property start - Starting character index in the paragraph
 * @property end - Ending character index in the paragraph
 */
export type IRenderedRunNode = {
    readonly text: string;
    readonly parts: readonly IParts[];
    readonly index: number;
} & StartAndEnd;

/**
 * Renders a paragraph element into a structured representation with text content.
 *
 * Extracts all text content from a paragraph (w:p) element by processing its
 * run (w:r) children. Calculates character positions for each text fragment
 * to enable precise text replacement operations.
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

    const runs = node.element.elements
        .map((element, i) => ({ element, i }))
        .filter(({ element }) => element.name === "w:r")
        .map(({ element, i }) => {
            const renderedRunNode = renderRunNode(element, i, currentRunStringLength);
            currentRunStringLength += renderedRunNode.text.length;

            return renderedRunNode;
        })
        .filter((e) => !!e);

    const text = runs.reduce((acc, curr) => acc + curr.text, "");

    return {
        text,
        runs,
        index: node.index,
        pathToParagraph: buildNodePath(node),
    };
};

const renderRunNode = (node: Element, index: number, currentRunStringIndex: number): IRenderedRunNode => {
    if (!node.elements) {
        return {
            text: "",
            parts: [],
            index: -1,
            start: currentRunStringIndex,
            end: currentRunStringIndex,
        };
    }

    let currentTextStringIndex = currentRunStringIndex;

    const parts = node.elements
        .map((element, i: number) =>
            element.name === "w:t" && element.elements && element.elements.length > 0
                ? {
                      text: element.elements[0].text?.toString() ?? "",
                      index: i,
                      start: currentTextStringIndex,
                      end: (() => {
                          // Side effect
                          currentTextStringIndex += (element.elements[0].text?.toString() ?? "").length - 1;
                          return currentTextStringIndex;
                      })(),
                  }
                : undefined,
        )
        .filter((e) => !!e)
        .map((e) => e as IParts);

    const text = parts.reduce((acc, curr) => acc + curr.text, "");

    return {
        text,
        parts,
        index,
        start: currentRunStringIndex,
        end: currentTextStringIndex,
    };
};

const buildNodePath = (node: ElementWrapper): readonly number[] =>
    node.parent ? [...buildNodePath(node.parent), node.index] : [node.index];
