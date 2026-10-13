// HTML in a document's own styles (issue #2632): the styleMap option gives the elements its CSS selectors match the
// document's paragraph, character and table styles, and the stylesheet option gives the HTML the CSS of the editor it
// comes from. See docs/usage/html.md.

import * as fs from "fs";
import { Document, Packer } from "docx";
import { htmlToContent } from "docx/html";

const html = `
<h1>Release notes</h1>
<p class="lead">This release reads HTML into documents.</p>
<p>Press <kbd>Ctrl</kbd> + <kbd>S</kbd> to save, and see <span class="term">styleMap</span> for styles.</p>
<blockquote>Each element is written in the document's own style.</blockquote>
<p class="note">Notes are blue, from the stylesheet option's CSS.</p>
`;

const doc = new Document({
    styles: {
        paragraphStyles: [
            { id: "Lead", name: "Lead", basedOn: "Normal", run: { size: 30, color: "404040" }, paragraph: { spacing: { after: 240 } } },
            {
                id: "Quote",
                name: "Quote",
                basedOn: "Normal",
                run: { italics: true, color: "595959" },
                paragraph: { indent: { left: 864, right: 864 } },
            },
        ],
        characterStyles: [
            { id: "Keyboard", name: "Keyboard", run: { font: "Consolas", size: 20, shading: { fill: "EEEEEE" } } },
            { id: "Term", name: "Term", run: { bold: true, color: "2F5496" } },
        ],
    },
    sections: [
        {
            children: [
                ...htmlToContent(html, {
                    styleMap: { h1: "Title", "p.lead": "Lead", kbd: "Keyboard", ".term": "Term", blockquote: "Quote" },
                    stylesheet: ".note { color: #1f4e79; border-left: 3px solid #1f4e79; padding-left: 6pt }",
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
