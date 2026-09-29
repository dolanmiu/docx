// Patch a document with footnotes and endnotes

import * as fs from "fs";
import { EndnoteReferenceRun, FootnoteReferenceRun, Paragraph, patchDocument, PatchType, TextRun } from "docx";

patchDocument({
    outputType: "nodebuffer",
    data: fs.readFileSync("demo/assets/simple-template.docx"),
    patches: {
        name: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun("John Doe"), new FootnoteReferenceRun(1)],
        },
        paragraph_replace: {
            type: PatchType.DOCUMENT,
            children: [
                new Paragraph({
                    children: [new TextRun("The report is due on Friday."), new EndnoteReferenceRun(1)],
                }),
            ],
        },
    },
    footnotes: {
        1: { children: [new Paragraph("Our new head of sales.")] },
    },
    endnotes: {
        1: { children: [new Paragraph("Send it to the whole team.")] },
    },
}).then((doc) => {
    fs.writeFileSync("My Document.docx", doc);
});
