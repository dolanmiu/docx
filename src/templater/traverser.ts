import { Element } from "xml-js";
import { IRenderedParagraphNode, renderParagraphNode } from "./run-renderer";

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

export const findLocationOfText = (node: Element, text: string): void => {
    let renderedParagraphs: readonly IRenderedParagraphNode[] = [];

    // eslint-disable-next-line functional/prefer-readonly-type
    const queue: Element[] = [...(node.elements ?? [])];

    // eslint-disable-next-line functional/immutable-data
    let currentNode: Element | undefined;
    while (queue.length > 0) {
        // eslint-disable-next-line functional/immutable-data
        currentNode = queue.shift();

        if (!currentNode) {
            break;
        }

        if (currentNode.name === "w:p") {
            renderedParagraphs = [...renderedParagraphs, renderParagraphNode(currentNode)];
        } else {
            // eslint-disable-next-line functional/immutable-data
            queue.push(...(currentNode.elements ?? []));
        }
    }

    const filteredParagraphs = renderedParagraphs.filter((p) => p.text.includes(text));

    console.log("paragrapghs", JSON.stringify(filteredParagraphs, null, 2));
    return undefined;
};
