// Simple template example
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { patchDocument, TextRun } from "../build";

patchDocument(fs.readFileSync("demo/assets/simple-template.docx"), {
    patches: [
        {
            children: [new TextRun("John Doe")],
            text: "{{ name }}",
        },
        {
            children: [new TextRun("Heading wow!")],
            text: "{{ table_heading_1 }}",
        },
        {
            children: [new TextRun("#657")],
            text: "{{ item_1 }}",
        },
        {
            children: [new TextRun("Lorem ipsum paragraph")],
            text: "{{ paragraph_replace }}",
        },
    ],
}).then((doc) => {
    fs.writeFileSync("My Document.docx", doc);
});
