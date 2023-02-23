import { Element } from "xml-js";
import * as xml from "xml";

import { Formatter } from "@export/formatter";
import { Text } from "@file/paragraph/run/run-components/text";

import { toJson } from "./util";
import { IRenderedParagraphNode } from "./run-renderer";

enum ReplaceMode {
    START,
    MIDDLE,
    END,
}

const formatter = new Formatter();

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
    const textJson = toJson(xml(formatter.format(new Text({ text }))));

    // eslint-disable-next-line functional/immutable-data
    element.elements = textJson.elements;

    return element;
};
