// HTML as a document's content (issue #2632): a rich-text editor's HTML, with its headings, formatting, lists, a
// table, an image, links, math and a page break, in a document's body, and some inline HTML in its header and a
// paragraph of its own. See docs/usage/html.md.

// cspell:ignore EMEA
import * as fs from "fs";
import { Document, Header, Packer, Paragraph, TextRun } from "docx";
import { htmlToContent, htmlToRuns } from "docx/html";

const html = `
<h1>Quarterly report</h1>
<p>Sales were <strong>up 12%</strong>, led by <a href="https://example.com/emea">EMEA</a>. <em>Returns</em> were
<u>flat</u>, and costs <s>rose</s> <span style="color: #c00">fell</span>.</p>
<h2>Highlights</h2>
<ol>
    <li>New customers: <b>48</b>
        <ul>
            <li>31 in EMEA</li>
            <li>17 in APAC</li>
        </ul>
    </li>
    <li>Renewals: <mark>97%</mark></li>
</ol>
<ul data-type="taskList">
    <li data-type="taskItem"><label><input type="checkbox" checked></label><div><p>Close the quarter</p></div></li>
    <li data-type="taskItem"><label><input type="checkbox"></label><div><p>Plan the next one</p></div></li>
</ul>
<table border="1" style="border-collapse: collapse; width: 100%">
    <thead><tr><th>Region</th><th>Q2</th><th>Q3</th></tr></thead>
    <tbody>
        <tr><td>EMEA</td><td style="text-align: right">1,050</td><td style="text-align: right; background: #e2f0d9">1,200</td></tr>
        <tr><td>APAC</td><td style="text-align: right">880</td><td style="text-align: right">900</td></tr>
        <tr><td colspan="2"><b>Total</b></td><td style="text-align: right"><b>2,100</b></td></tr>
    </tbody>
</table>
<p style="text-align: center"><img src="logo.png" alt="The company's logo" width="240"></p>
<blockquote style="border-left: 4px solid #ccc; padding-left: 12pt; margin-left: 0">
    <p>The best quarter since the company started.</p>
</blockquote>
<p>Growth, compounded: <span data-latex="(1 + r)^n"></span>.</p>
<div style="page-break-before: always"></div>
<h2 id="appendix">Appendix</h2>
<pre><code>total = sum(sales)</code></pre>
<p>Back to <a href="#appendix">the appendix</a>.</p>
`;

const doc = new Document({
    sections: [
        {
            headers: {
                default: new Header({
                    children: [new Paragraph({ children: [...htmlToRuns("<i>Quarterly report</i> &middot; <b>Draft</b>")] })],
                }),
            },
            children: [
                ...htmlToContent(html, { images: { "logo.png": fs.readFileSync("./demo/assets/html/logo.png") } }),
                new Paragraph({
                    children: [new TextRun("Written by docx: "), ...htmlToRuns("<b>bold</b> and <i>italic</i> in a paragraph of its own.")],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
