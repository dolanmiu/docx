// Patch a document with patches

import * as fs from "fs";
import { IPatch, patchDocument, PatchType, TextRun } from "docx";

export const font = "Trebuchet MS";
export const getPatches = (fields: { [key: string]: string }) => {
    const patches: { [key: string]: IPatch } = {};

    for (const field in fields) {
        patches[field] = {
            type: PatchType.PARAGRAPH,
            children: [new TextRun({ text: fields[field], font })],
        };
    }

    return patches;
};

const patches = getPatches({
    name: "Mr",
    table_heading_1: "John",
    item_1: "Doe",
    paragraph_replace: "Lorem ipsum paragraph",
});

patchDocument({
    outputType: "nodebuffer",
    data: fs.readFileSync("demo/assets/simple-template.docx"),
    patches,
}).then((doc) => {
    fs.writeFileSync("My Document.docx", doc);
});
