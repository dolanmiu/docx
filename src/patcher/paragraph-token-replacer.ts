/**
 * Paragraph token replacer for substituting text within paragraph runs.
 *
 * @module
 */
import type { Element } from "xml-js";

import type { IRenderedParagraphNode } from "./run-renderer";
import { createTextElementContents, patchSpaceAttribute } from "./util";

/**
 * Replacement modes for multi-run text replacement.
 */
const ReplaceMode = {
    /** Looking for the start of the replacement text */
    START: 0,
    /** Processing runs in the middle of the replacement text */
    MIDDLE: 1,
    /** Reached the end of the replacement text */
    END: 2,
} as const;

/**
 * Replaces a token with replacement text within a paragraph's run elements.
 *
 * Handles the complex case where placeholder text may span multiple runs
 * (text fragments) within a paragraph. Processes each run to replace the
 * appropriate portion of the token, handling start, middle, and end sections.
 *
 * @param paragraphElement - The paragraph XML element to modify
 * @param renderedParagraph - Pre-rendered paragraph structure with text positions
 * @param originalText - The token text to replace (e.g., "{{name}}")
 * @param replacementText - The text to replace it with (often a split token)
 * @param fromIndex - Where in the paragraph's text to start looking for the token (default: 0)
 * @returns The modified paragraph element
 *
 * @example
 * ```typescript
 * replaceTokenInParagraphElement({
 *   paragraphElement,
 *   renderedParagraph,
 *   originalText: "{{placeholder}}",
 *   replacementText: "ɵ",
 * });
 * ```
 */
export const replaceTokenInParagraphElement = ({
    paragraphElement,
    renderedParagraph,
    originalText,
    replacementText,
    fromIndex = 0,
}: {
    readonly paragraphElement: Element;
    readonly renderedParagraph: IRenderedParagraphNode;
    readonly originalText: string;
    readonly replacementText: string;
    readonly fromIndex?: number;
}): Element => {
    const startIndex = renderedParagraph.text.indexOf(originalText, fromIndex);
    const endIndex = startIndex + originalText.length - 1;

    let replaceMode: (typeof ReplaceMode)[keyof typeof ReplaceMode] = ReplaceMode.START;

    for (const run of renderedParagraph.runs) {
        for (const { text, index, start, end } of run.parts) {
            switch (replaceMode) {
                case ReplaceMode.START:
                    if (startIndex >= start && startIndex <= end) {
                        const offsetStartIndex = startIndex - start;
                        const offsetEndIndex = Math.min(endIndex, end) - start;
                        // The offsets are relative to this part, so they index into its text, not the whole run's
                        const partToReplace = text.substring(offsetStartIndex, offsetEndIndex + 1);
                        // We use a token to split the text if the replacement is within the same run
                        // If not, we just add text to the middle of the run later
                        if (partToReplace === "") {
                            continue;
                        }

                        // Replace by position, as the same text can come earlier in the part
                        const firstPart = text.substring(0, offsetStartIndex) + replacementText + text.substring(offsetEndIndex + 1);
                        patchTextElement(paragraphElement.elements![run.index].elements![index], firstPart);
                        replaceMode = ReplaceMode.MIDDLE;
                        continue;
                        /* c8 ignore next 2 */
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
