// Patch a document, and set its properties, such as its title, tags and comments

import * as fs from "fs";
import { patchDocument, PatchType, TextRun } from "docx";

patchDocument({
    outputType: "nodebuffer",
    data: fs.readFileSync("demo/assets/simple-template.docx"),
    patches: {
        name: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun("John Doe")],
        },
    },
    properties: {
        title: "Letter to John Doe",
        creator: "Dolan Miu",
        // Word's tags
        keywords: "letter, customer",
        // Word's comments
        description: "Made from simple-template.docx",
    },
}).then((doc) => {
    fs.writeFileSync("My Document.docx", doc);
});
