// Patch a document with patches
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { patchDocument, PatchType, TextRun } from "../build";

patchDocument(fs.readFileSync("demo/assets/simple-template-2.docx"), {
    patches: {
        name: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun("Max")],
        },
    },
}).then((doc) => {
    fs.writeFileSync("My Document.docx", doc);
});
