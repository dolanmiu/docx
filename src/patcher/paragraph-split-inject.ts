/**
 * Paragraph split and inject utilities for run-level text replacement.
 *
 * @module
 */
import { Element } from "xml-js";

import { createTextElementContents, patchSpaceAttribute } from "./util";

export class TokenNotFoundError extends Error {
    public constructor(token: string) {
        super(`Token ${token} not found`);
        this.name = "TokenNotFoundError";
    }
}

/**
 * Finds the index of the run element containing a specific token.
 *
 * Searches through all run (w:r) elements in a paragraph to find which one
 * contains the specified token text. This is used to locate where new content
 * should be injected during replacement operations.
 *
 * @param paragraphElement - The paragraph element to search
 * @param token - The token text to find
 * @returns The index of the run element containing the token
 * @throws Error if the token is not found in any run
 *
 * @example
 * ```typescript
 * const index = findRunElementIndexWithToken(paragraph, "ɵ");
 * // Returns the index of the run containing the split token
 * ```
 */
export const findRunElementIndexWithToken = (paragraphElement: Element, token: string): number => {
    for (let i = 0; i < (paragraphElement.elements ?? []).length; i++) {
        const element = paragraphElement.elements![i];
        if (element.type === "element" && element.name === "w:r") {
            const textElement = (element.elements ?? []).filter((e) => e.type === "element" && e.name === "w:t");

            for (const text of textElement) {
                if (!text.elements?.[0]) {
                    continue;
                }

                if ((text.elements[0].text as string)?.includes(token)) {
                    return i;
                }
            }
        }
    }

    throw new TokenNotFoundError(token);
};

/**
 * Splits a run element at a token position into left and right parts.
 *
 * Divides a run element at the location of a token, creating two separate
 * runs. This allows new content to be injected between the split parts while
 * preserving the original run's formatting properties.
 *
 * @param runElement - The run element to split
 * @param token - The token text marking the split point
 * @returns Object containing the left and right run elements
 *
 * @example
 * ```typescript
 * const { left, right } = splitRunElement(run, "ɵ");
 * // If run contains "Helloɵworld", left contains "Hello" and right contains "world"
 * ```
 */
export const splitRunElement = (runElement: Element, token: string): { readonly left: Element; readonly right: Element } => {
    let splitIndex = 0;

    const splitElements =
        runElement.elements
            ?.map((e, i) => {
                if (e.type === "element" && e.name === "w:t") {
                    const text = (e.elements?.[0]?.text as string) ?? "";
                    const splitText = text.split(token);
                    const newElements = splitText.map((t) => ({
                        ...e,
                        ...patchSpaceAttribute(e),
                        elements: createTextElementContents(t),
                    }));
                    splitIndex = i;
                    return newElements;
                } else {
                    return e;
                }
            })
            .flat() ?? [];

    const leftRunElement: Element = {
        ...JSON.parse(JSON.stringify(runElement)),
        elements: splitElements.slice(0, splitIndex + 1),
    };

    const rightRunElement: Element = {
        ...JSON.parse(JSON.stringify(runElement)),
        elements: splitElements.slice(splitIndex + 1),
    };

    return { left: leftRunElement, right: rightRunElement };
};
