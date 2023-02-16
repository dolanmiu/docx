import { Paragraph, TextRun } from "@file/paragraph";
import { ElementCompact } from "xml-js";
import { PatchDocumentOptions } from "./from-docx";

export const replacer = (json: ElementCompact, options: PatchDocumentOptions): ElementCompact => {
    for (const child of options.children) {
        if (child instanceof Paragraph) {
            console.log("is para");
        } else if (child instanceof TextRun) {
            console.log("is text");
        }
    }

    return json;
};
