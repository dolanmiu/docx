import { Element } from "xml-js";

import { IRenderedParagraphNode, renderParagraphNode } from "./run-renderer";

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

export const findLocationOfText = (node: Element, text: string): readonly IRenderedParagraphNode[] =>
    traverse(node).filter((p) => p.text.includes(text));
