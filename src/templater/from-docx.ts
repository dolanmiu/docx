import * as JSZip from "jszip";
import { xml2js, ElementCompact, js2xml } from "xml-js";
import { replacer } from "./replacer";

// eslint-disable-next-line functional/prefer-readonly-type
type InputDataType = Buffer | string | number[] | Uint8Array | ArrayBuffer | Blob | NodeJS.ReadableStream;

export interface PatchDocumentOptions {
    readonly children: any[];
}

export const patchDocument = async (data: InputDataType, options: PatchDocumentOptions): Promise<Buffer> => {
    const zipContent = await JSZip.loadAsync(data);

    const map = new Map<string, ElementCompact>();
    console.log(options);

    for (const [key, value] of Object.entries(zipContent.files)) {
        const json = toJson(await value.async("text"));
        if (key === "word/document.xml") {
            console.log(json);
            replacer(json, options);
        }

        map.set(key, json);
    }

    const zip = new JSZip();

    for (const [key, value] of map) {
        const output = toXml(value);

        zip.file(key, output);
    }

    const zipData = await zip.generateAsync({
        type: "nodebuffer",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        compression: "DEFLATE",
    });

    return zipData;
};

const toJson = (xmlData: string): ElementCompact => {
    const xmlObj = xml2js(xmlData, { compact: false }) as ElementCompact;
    return xmlObj;
};

const toXml = (jsonObj: ElementCompact): string => {
    const output = js2xml(jsonObj);
    return output;
};
