import { xml2js, Element } from "xml-js";

export const toJson = (xmlData: string): Element => {
    const xmlObj = xml2js(xmlData, { compact: false }) as Element;
    return xmlObj;
};
