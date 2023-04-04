// Patch a document with patches
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { IPatch, patchDocument, PatchType, TextRun } from "../build";

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
    salutation: "Mr.",
    "first-name": "John",
});

patchDocument(fs.readFileSync("demo/assets/simple-template-3.docx"), {
    patches,
}).then((doc) => {
    fs.writeFileSync("My Document.docx", doc);
});
