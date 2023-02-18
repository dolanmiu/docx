import { Formatter } from "@export/formatter";
import { Paragraph, TextRun } from "@file/paragraph";
import { Element } from "xml-js";
import * as xml from "xml";

import { IPatch } from "./from-docx";
import { toJson } from "./util";
import { IRenderedParagraphNode } from "./run-renderer";

const formatter = new Formatter();

export const replacer = (json: Element, options: IPatch, renderedParagraphs: readonly IRenderedParagraphNode[]): Element => {
    for (const child of options.children) {
        if (child instanceof Paragraph) {
            console.log("is para");
        } else if (child instanceof TextRun) {
            const text = formatter.format(child);
            const textJson = toJson(xml(text));
            console.log("paragrapghs", JSON.stringify(renderedParagraphs, null, 2));
            const paragraphElement = goToElementFromPath(json, renderedParagraphs[0].path);
            console.log(paragraphElement);
            // eslint-disable-next-line functional/immutable-data
            paragraphElement.elements = textJson.elements;
            console.log("is text", text);
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
