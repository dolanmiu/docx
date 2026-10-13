// HTML in a template (issue #2632): patchDocument replaces a placeholder's paragraph with HTML's paragraphs, lists and
// tables, and a placeholder in a paragraph with inline HTML. See docs/usage/html.md.

import * as fs from "fs";
import { patchDocument, PatchType } from "docx";
import { htmlToContent, htmlToRuns } from "docx/html";

patchDocument({
    outputType: "nodebuffer",
    data: fs.readFileSync("./demo/assets/simple-template.docx"),
    patches: {
        name: { type: PatchType.PARAGRAPH, children: [...htmlToRuns("<b>Ada</b> <i>Lovelace</i>")] },
        paragraph_replace: {
            type: PatchType.DOCUMENT,
            children: [
                ...htmlToContent(`
                    <p>The report, written in an editor:</p>
                    <ol><li>Sales were <b>up 12%</b></li><li>Costs <s>rose</s> fell</li></ol>
                    <table border="1"><tr><th>Region</th><th>Sales</th></tr><tr><td>EMEA</td><td>1,200</td></tr></table>
                `),
            ],
        },
    },
}).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
