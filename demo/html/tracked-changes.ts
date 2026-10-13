// HTML's <ins> and <del> as Word's tracked changes (issue #2632): an HTML diff, such as htmldiff writes, written with
// the trackChanges option, so Word shows each change for its reader to accept or reject. See docs/usage/html.md.

import * as fs from "fs";
import { Document, Packer } from "docx";
import { htmlToContent } from "docx/html";

const diff = `
<h2>Payment terms</h2>
<p>Invoices are due within <del>30</del><ins>45</ins> days of receipt.</p>
<p>Late payments carry interest of <del datetime="2026-09-01T10:00:00Z">2%</del><ins datetime="2026-09-01T10:00:00Z">1.5%</ins> a month.</p>
<ins><p>Either party may end this agreement with 30 days' notice.</p></ins>
`;

const doc = new Document({
    sections: [{ children: [...htmlToContent(diff, { trackChanges: { author: "Legal", date: "2026-10-13T09:00:00Z" } })] }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
