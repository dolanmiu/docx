import { Element } from "xml-js";

import { createTextElementContents, patchSpaceAttribute } from "./util";
import { IRenderedParagraphNode } from "./run-renderer";

enum ReplaceMode {
    START,
    MIDDLE,
    END,
}

export const replaceTokenInParagraphElement = ({
    paragraphElement,
    renderedParagraph,
    originalText,
    replacementText,
}: {
    readonly paragraphElement: Element;
    readonly renderedParagraph: IRenderedParagraphNode;
    readonly originalText: string;
    readonly replacementText: string;
}): Element => {
    const startIndex = renderedParagraph.text.indexOf(originalText);
    const endIndex = startIndex + originalText.length - 1;

    let replaceMode = ReplaceMode.START;

    for (const run of renderedParagraph.runs) {
        for (const { text, index, start, end } of run.parts) {
            switch (replaceMode) {
                case ReplaceMode.START:
                    if (startIndex >= start) {
                        const partToReplace = run.text.substring(Math.max(startIndex, start), Math.min(endIndex, end) + 1);
                        // We use a token to split the text if the replacement is within the same run
                        // If not, we just add text to the middle of the run later
                        const firstPart = text.replace(partToReplace, replacementText);
                        patchTextElement(paragraphElement.elements![run.index].elements![index], firstPart);
                        replaceMode = ReplaceMode.MIDDLE;
                        continue;
                    }
                    break;
                case ReplaceMode.MIDDLE:
                    if (endIndex <= end) {
                        const lastPart = text.substring(endIndex - start + 1);
                        patchTextElement(paragraphElement.elements![run.index].elements![index], lastPart);
                        const currentElement = paragraphElement.elements![run.index].elements![index];
                        // We need to add xml:space="preserve" to the last element to preserve the whitespace
                        // Otherwise, the text will be merged with the next element
                        // eslint-disable-next-line functional/immutable-data
                        paragraphElement.elements![run.index].elements![index] = patchSpaceAttribute(currentElement);
                        replaceMode = ReplaceMode.END;
                    } else {
                        patchTextElement(paragraphElement.elements![run.index].elements![index], "");
                    }
                    break;
                default:
            }
        }
    }

    return paragraphElement;
};

const patchTextElement = (element: Element, text: string): Element => {
    // eslint-disable-next-line functional/immutable-data
    element.elements = createTextElementContents(text);

    return element;
};
