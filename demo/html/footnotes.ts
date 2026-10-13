// The notes of HTML as Word's footnotes and endnotes (issue #2632): the footnotes that Markdown becomes, here GitHub's,
// and the endnotes Word puts on the clipboard. The links back to the references and the list of notes are left out.
// See docs/usage/html.md.
// cspell:ignore EMEA ednref

import * as fs from "fs";
import { Document, Packer } from "docx";
import { htmlToContent } from "docx/html";

const markdown = `
<h2>Quarterly report</h2>
<p>Sales were up 12%<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref>1</a></sup>, led by EMEA<sup><a href="#user-content-fn-emea" id="user-content-fnref-emea" data-footnote-ref>2</a></sup>.</p>
<section data-footnotes class="footnotes"><h2 class="sr-only" id="footnote-label">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>Compared with the same quarter last year. <a href="#user-content-fnref-1" data-footnote-backref class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-emea">
<p>Europe, the Middle East and Africa, with:</p>
<ul><li>Germany</li><li>Kenya</li></ul>
<p><a href="#user-content-fnref-emea" data-footnote-backref class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>
`;

const word = `
<p class=MsoNormal>The method is described elsewhere<a style='mso-endnote-id:edn1' href="#_edn1" name="_ednref1" title=""><span class=MsoEndnoteReference><span style='mso-special-character:footnote'><![if !supportFootnotes]><span class=MsoEndnoteReference>[i]</span><![endif]></span></span></a>.</p>
<div style='mso-element:endnote-list'><![if !supportEndnotes]><br clear=all><hr align=left size=1 width="33%"><![endif]>
<div style='mso-element:endnote' id=edn1>
<p class=MsoEndnoteText><a style='mso-endnote-id:edn1' href="#_ednref1" name="_edn1" title=""><span class=MsoEndnoteReference><span style='mso-special-character:footnote'><![if !supportFootnotes]><span class=MsoEndnoteReference>[i]</span><![endif]></span></span></a> Smith, <i>A Book</i>, 2001, page 12.</p>
</div>
</div>
`;

const doc = new Document({
    sections: [{ children: [...htmlToContent(markdown), ...htmlToContent(word)] }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
