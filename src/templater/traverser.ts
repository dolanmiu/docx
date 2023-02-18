import { Element } from "xml-js";

import { IRenderedParagraphNode, renderParagraphNode } from "./run-renderer";

export interface ElementWrapper {
    readonly element: Element;
    readonly index: number;
    readonly parent: ElementWrapper | undefined;
}

export interface ILocationOfText {
    readonly parent: Element;
    readonly startIndex: number;
    readonly endIndex: number;
    readonly currentText: string;
    // This is optional because the text could start in the middle of a tag
    readonly startElement?: Element;
    // This is optional because the text could end in the middle of a tag
    readonly endElement?: Element;
}

const elementsToWrapper = (wrapper: ElementWrapper): readonly ElementWrapper[] =>
    wrapper.element.elements?.map((e, i) => ({
        element: e,
        index: i,
        parent: wrapper,
    })) ?? [];

export const findLocationOfText = (node: Element, text: string): readonly IRenderedParagraphNode[] => {
    let renderedParagraphs: readonly IRenderedParagraphNode[] = [];

    // eslint-disable-next-line functional/prefer-readonly-type
    const queue: ElementWrapper[] = [
        ...(elementsToWrapper({
            element: node,
            index: 0,
            parent: undefined,
        }) ?? []),
    ];

    // eslint-disable-next-line functional/immutable-data
    let currentNode: ElementWrapper | undefined;
    while (queue.length > 0) {
        // eslint-disable-next-line functional/immutable-data
        currentNode = queue.shift();

        if (!currentNode) {
            break;
        }

        if (currentNode.element.name === "w:p") {
            renderedParagraphs = [...renderedParagraphs, renderParagraphNode(currentNode)];
        } else {
            // eslint-disable-next-line functional/immutable-data
            queue.push(...(elementsToWrapper(currentNode) ?? []));
        }
    }

    const filteredParagraphs = renderedParagraphs.filter((p) => p.text.includes(text));

    return filteredParagraphs;
};
