import { xml2js, Element } from "xml-js";
import * as xml from "xml";

import { Formatter } from "@export/formatter";
import { Text } from "@file/paragraph/run/run-components/text";

const formatter = new Formatter();

export const toJson = (xmlData: string): Element => {
    const xmlObj = xml2js(xmlData, { compact: false }) as Element;
    return xmlObj;
};

// eslint-disable-next-line functional/prefer-readonly-type
export const createTextElementContents = (text: string): Element[] => {
    const textJson = toJson(xml(formatter.format(new Text({ text }))));

    return textJson.elements![0].elements ?? [];
};
