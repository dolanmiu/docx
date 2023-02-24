import { Element } from "xml-js";
import * as xml from "xml";

import { Formatter } from "@export/formatter";
import { Paragraph, TextRun } from "@file/paragraph";

import { IPatch } from "./from-docx";
import { toJson } from "./util";
import { IRenderedParagraphNode } from "./run-renderer";
import { replaceTokenInParagraphElement } from "./paragraph-token-replacer";
import { findRunElementIndexWithToken, splitRunElement } from "./paragraph-split-inject";

const formatter = new Formatter();

const SPLIT_TOKEN = "ɵ";

export const replacer = (json: Element, options: IPatch, renderedParagraphs: readonly IRenderedParagraphNode[]): Element => {
    for (const child of options.children) {
        if (child instanceof Paragraph) {
            console.log("is para");
        } else if (child instanceof TextRun) {
            for (const renderedParagraph of renderedParagraphs) {
                const textJson = toJson(xml(formatter.format(child)));
                const paragraphElement = goToElementFromPath(json, renderedParagraph.path);

                const startIndex = renderedParagraph.text.indexOf(options.text);
                const endIndex = startIndex + options.text.length - 1;

                if (startIndex === 0 && endIndex === renderedParagraph.text.length - 1) {
                    // Easy case where the text is the entire paragraph
                    // eslint-disable-next-line functional/immutable-data
                    paragraphElement.elements = textJson.elements;
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
                    paragraphElement.elements!.splice(index, 1, left, ...textJson.elements!, right);
                    console.log(index, JSON.stringify(paragraphElement.elements![index], null, 2));
                    console.log("paragraphElement after", JSON.stringify(paragraphElement, null, 2));
                }
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
