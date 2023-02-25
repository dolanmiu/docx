import { Element } from "xml-js";
import * as xml from "xml";

import { Formatter } from "@export/formatter";
import { XmlComponent } from "@file/xml-components";

import { IPatch, PatchType } from "./from-docx";
import { toJson } from "./util";
import { IRenderedParagraphNode } from "./run-renderer";
import { replaceTokenInParagraphElement } from "./paragraph-token-replacer";
import { findRunElementIndexWithToken, splitRunElement } from "./paragraph-split-inject";

const formatter = new Formatter();

const SPLIT_TOKEN = "ɵ";

export const replacer = (json: Element, options: IPatch, renderedParagraphs: readonly IRenderedParagraphNode[]): Element => {
    for (const renderedParagraph of renderedParagraphs) {
        const textJson = options.children.map((c) => toJson(xml(formatter.format(c as XmlComponent)))).map((c) => c.elements![0]);

        if (options.type === PatchType.DOCUMENT) {
            const parentElement = goToParentElementFromPath(json, renderedParagraph.path);
            const elementIndex = getLastElementIndexFromPath(renderedParagraph.path);
            // Easy case where the text is the entire paragraph
            // We can assume that the Paragraph/Table only has one element
            // eslint-disable-next-line functional/immutable-data, prefer-destructuring
            parentElement.elements?.splice(elementIndex, 1, ...textJson);
            // console.log(JSON.stringify(renderedParagraphs, null, 2));
            // console.log(JSON.stringify(textJson, null, 2));
            // console.log("paragraphElement after", JSON.stringify(parentElement.elements![elementIndex], null, 2));
        } else if (options.type === PatchType.PARAGRAPH) {
            const paragraphElement = goToElementFromPath(json, renderedParagraph.path);
            const startIndex = renderedParagraph.text.indexOf(options.text);
            const endIndex = startIndex + options.text.length - 1;

            if (startIndex === 0 && endIndex === renderedParagraph.text.length - 1) {
                // Easy case where the text is the entire paragraph
                // eslint-disable-next-line functional/immutable-data
                paragraphElement.elements = textJson;
                console.log(JSON.stringify(paragraphElement, null, 2));
            } else {
                // Hard case where the text is only part of the paragraph

                replaceTokenInParagraphElement({
                    paragraphElement,
                    renderedParagraph,
                    originalText: options.text,
                    replacementText: SPLIT_TOKEN,
                });

                const index = findRunElementIndexWithToken(paragraphElement, SPLIT_TOKEN);

                const { left, right } = splitRunElement(paragraphElement.elements![index], SPLIT_TOKEN);
                // eslint-disable-next-line functional/immutable-data
                paragraphElement.elements!.splice(index, 1, left, ...textJson, right);
                // console.log(index, JSON.stringify(paragraphElement.elements![index], null, 2));
                // console.log("paragraphElement after", JSON.stringify(paragraphElement, null, 2));
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
