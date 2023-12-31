import { Element } from "xml-js";
import xml from "xml";

import { Formatter } from "@export/formatter";
import { IContext, XmlComponent } from "@file/xml-components";

import { IPatch, PatchType } from "./from-docx";
import { toJson } from "./util";
import { replaceTokenInParagraphElement } from "./paragraph-token-replacer";
import { findRunElementIndexWithToken, splitRunElement } from "./paragraph-split-inject";
import { findLocationOfText } from "./traverser";

const formatter = new Formatter();

const SPLIT_TOKEN = "ɵ";

export const replacer = ({
    json,
    patch,
    patchText,
    context,
    keepOriginalStyles = true,
}: {
    readonly json: Element;
    readonly patch: IPatch;
    readonly patchText: string;
    readonly context: IContext;
    readonly keepOriginalStyles?: boolean;
}): Element => {
    const renderedParagraphs = findLocationOfText(json, patchText);

    if (renderedParagraphs.length === 0) {
        throw new Error(`Could not find text ${patchText}`);
    }

    for (const renderedParagraph of renderedParagraphs) {
        const textJson = patch.children
            // eslint-disable-next-line no-loop-func
            .map((c) => toJson(xml(formatter.format(c as XmlComponent, context))))
            .map((c) => c.elements![0]);

        switch (patch.type) {
            case PatchType.DOCUMENT: {
                const parentElement = goToParentElementFromPath(json, renderedParagraph.pathToParagraph);
                const elementIndex = getLastElementIndexFromPath(renderedParagraph.pathToParagraph);
                // eslint-disable-next-line functional/immutable-data, prefer-destructuring
                parentElement.elements!.splice(elementIndex, 1, ...textJson);
                break;
            }
            case PatchType.PARAGRAPH:
            default: {
                const paragraphElement = goToElementFromPath(json, renderedParagraph.pathToParagraph);
                replaceTokenInParagraphElement({
                    paragraphElement,
                    renderedParagraph,
                    originalText: patchText,
                    replacementText: SPLIT_TOKEN,
                });

                const index = findRunElementIndexWithToken(paragraphElement, SPLIT_TOKEN);

                const runElementToBeReplaced = paragraphElement.elements![index];
                const { left, right } = splitRunElement(runElementToBeReplaced, SPLIT_TOKEN);

                let newRunElements = textJson;
                let patchedRightElement = right;

                if (keepOriginalStyles) {
                    const runElementNonTextualElements = runElementToBeReplaced.elements!.filter(
                        (e) => e.type === "element" && e.name !== "w:t",
                    );

                    newRunElements = textJson.map((e) => ({
                        ...e,
                        elements: [...runElementNonTextualElements, ...e.elements!],
                    }));

                    patchedRightElement = {
                        ...right,
                        elements: [...runElementNonTextualElements, ...right.elements!],
                    };
                }

                // eslint-disable-next-line functional/immutable-data
                paragraphElement.elements!.splice(index, 1, left, ...newRunElements, patchedRightElement);
                break;
            }
        }
    }

    return json;
};

const goToElementFromPath = (json: Element, path: readonly number[]): Element => {
    let element = json;

    // We start from 1 because the first element is the root element
    // Which we do not want to double count
    for (let i = 1; i < path.length; i++) {
        const index = path[i];
        const nextElements = element.elements;

        if (!nextElements) {
            throw new Error("Could not find element");
        }

        element = nextElements[index];
    }

    return element;
};

const goToParentElementFromPath = (json: Element, path: readonly number[]): Element =>
    goToElementFromPath(json, path.slice(0, path.length - 1));

const getLastElementIndexFromPath = (path: readonly number[]): number => path[path.length - 1];
