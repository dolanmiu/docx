/**
 * XML traverser for searching paragraph content in OOXML documents.
 *
 * @module
 */
import type { Element } from "xml-js";

import { type IRenderedParagraphNode, renderParagraphNode } from "./run-renderer";

/**
 * Wrapper for XML elements that tracks position in the document tree.
 *
 * @property element - The XML element
 * @property index - Position index among siblings
 * @property parent - Parent element wrapper (undefined for root)
 */
export type ElementWrapper = {
    readonly element: Element;
    readonly index: number;
    readonly parent: ElementWrapper | undefined;
};

const elementsToWrapper = (wrapper: ElementWrapper): readonly ElementWrapper[] =>
    wrapper.element.elements?.map((e, i) => ({
        element: e,
        index: i,
        parent: wrapper,
    })) ?? [];

/**
 * Traverses an XML document tree to find and render all paragraphs.
 *
 * Uses breadth-first search to walk through the XML structure, identifying
 * all paragraph elements (w:p) and rendering their text content along with
 * positional information.
 *
 * @param node - The root XML element to traverse
 * @returns Array of rendered paragraph nodes with text content and positions
 *
 * @example
 * ```typescript
 * const paragraphs = traverse(documentElement);
 * paragraphs.forEach(p => console.log(p.text));
 * ```
 */
export const traverse = (node: Element): readonly IRenderedParagraphNode[] => {
    let renderedParagraphs: readonly IRenderedParagraphNode[] = [];

    // eslint-disable-next-line functional/prefer-readonly-type
    const queue: ElementWrapper[] = [
        ...elementsToWrapper({
            element: node,
            index: 0,
            parent: undefined,
        }),
    ];

    let currentNode: ElementWrapper | undefined;
    while (queue.length > 0) {
        // eslint-disable-next-line functional/immutable-data
        currentNode = queue.shift()!; // This is safe because we check the length of the queue

        if (currentNode.element.name === "w:p") {
            renderedParagraphs = [...renderedParagraphs, renderParagraphNode(currentNode)];
        }
        // eslint-disable-next-line functional/immutable-data
        queue.push(...elementsToWrapper(currentNode));
    }

    return renderedParagraphs;
};

/**
 * Finds all paragraphs containing specific text.
 *
 * Traverses the document and filters paragraphs to find those containing
 * the specified text string. Useful for locating placeholder text that
 * needs to be replaced.
 *
 * @param node - The root XML element to search
 * @param text - The text to search for
 * @returns Array of paragraph nodes containing the text
 *
 * @example
 * ```typescript
 * const matches = findLocationOfText(documentElement, "{{name}}");
 * // Returns all paragraphs containing "{{name}}"
 * ```
 */
export const findLocationOfText = (node: Element, text: string): readonly IRenderedParagraphNode[] =>
    traverse(node).filter((p) => p.text.includes(text));
