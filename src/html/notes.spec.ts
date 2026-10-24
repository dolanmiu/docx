// cspell:ignore cmark fnref ftnt ftnref ednref reflist reversefootnote rearnote noteref backref backlink kramdown docutils
import { describe, expect, it } from "vitest";

// docx's own entry is loaded before its parts that the helpers import, as its modules refer to each other
import { Document, Packer, Paragraph } from "docx";
import { formattedWithNotes, pngDataUrl } from "tests/html";
import { textOf, unzip } from "tests/zip";

import { htmlToContent, htmlToRuns } from "./html-to-content";
import type { HtmlOptions, HtmlWarningCode } from "./options";

// The entities XML's text has
const ENTITIES: Readonly<Record<string, string>> = { amp: "&", gt: ">", lt: "<" };

/** A paragraph as a line: its style, and its content, with what isn't text as words in brackets */
const linesOf = (written: string): readonly string[] =>
    [...written.matchAll(/<w:p>(.*?)<\/w:p>|<w:p\/>/g)].map(([, paragraph = ""]) => {
        const style = /<w:pStyle w:val="([^"]*)"/.exec(paragraph)?.[1];
        const list = /<w:ilvl w:val="(\d+)"\/>/.exec(paragraph);
        const content = [
            ...paragraph.matchAll(
                /<w:t[^>]*>([^<]*)<\/w:t>|<w:(foot|end)noteReference [^>]*\/>|<w:(?:foot|end)noteRef\/>|<w:bookmarkStart [^>]*w:name="([^"]*)"[^>]*\/>|<w:hyperlink([^>]*)>|<wp:inline/g,
            ),
        ]
            .map(([part, text, reference, bookmark, link]) => {
                if (text !== undefined) {
                    // Each entity once, so &amp;lt; is &lt;
                    return text.replace(/&(amp|gt|lt);/g, (_, name: string) => ENTITIES[name]);
                }
                if (reference !== undefined) {
                    return `[${reference}note]`;
                }
                if (bookmark !== undefined) {
                    return `{${bookmark}}`;
                }
                if (link !== undefined) {
                    const anchor = /w:anchor="([^"]*)"/.exec(link)?.[1];
                    return anchor === undefined ? "[link]" : `[link to ${anchor}]`;
                }
                return part === "<wp:inline" ? "[image]" : "#";
            })
            .join("");
        return `${style ?? "p"}${list ? ` (list ${list[1]})` : ""}: ${content}`;
    });

/** Each note, as its paragraphs' lines */
const notesIn = (written: string, kind: "footnote" | "endnote"): readonly string[] =>
    [...written.matchAll(new RegExp(`<w:${kind} w:id="\\d+">(.*?)</w:${kind}>`, "g"))].map(([, note]) => linesOf(note).join(" / "));

/** HTML as a document's content: its body's paragraphs, its footnotes and endnotes, and the warnings */
const convert = (
    html: string,
    options: HtmlOptions = {},
): {
    readonly body: readonly string[];
    readonly footnotes: readonly string[];
    readonly endnotes: readonly string[];
    readonly warnings: readonly HtmlWarningCode[];
} => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const warnings: HtmlWarningCode[] = [];
    // eslint-disable-next-line functional/immutable-data
    const written = formattedWithNotes(htmlToContent(html, { ...options, onWarning: (warning) => warnings.push(warning.code) }));
    return {
        body: linesOf(written.body),
        footnotes: notesIn(written.footnotes, "footnote"),
        endnotes: notesIn(written.endnotes, "endnote"),
        warnings,
    };
};

describe("htmlToContent: notes", () => {
    describe("what writes them", () => {
        it("reads markdown-it's footnotes, without the rule and the list of notes", () => {
            expect(
                convert(`<p>Text<sup class="footnote-ref"><a href="#fn1" id="fnref1">[1]</a></sup> after.</p>
<hr class="footnotes-sep">
<section class="footnotes">
<ol class="footnotes-list">
<li id="fn1" class="footnote-item"><p>A footnote. <a href="#fnref1" class="footnote-backref">↩︎</a></p>
</li>
</ol>
</section>`),
            ).toEqual({ body: ["p: Text[footnote] after."], footnotes: ["FootnoteText: # A footnote."], endnotes: [], warnings: [] });
        });

        it("reads GitHub's footnotes, with a footnote for each reference to a note, without the heading above them", () => {
            expect(
                convert(`<p>A footnote<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref aria-describedby="footnote-label">1</a></sup>, another<sup><a href="#user-content-fn-note" id="user-content-fnref-note" data-footnote-ref aria-describedby="footnote-label">2</a></sup> and the first again<sup><a href="#user-content-fn-1" id="user-content-fnref-1-2" data-footnote-ref aria-describedby="footnote-label">1</a></sup>.</p>
<section data-footnotes class="footnotes"><h2 class="sr-only" id="footnote-label">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>My reference. <a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a> <a href="#user-content-fnref-1-2" data-footnote-backref="" aria-label="Back to reference 1-2" class="data-footnote-backref">↩<sup>2</sup></a></p>
</li>
<li id="user-content-fn-note">
<p>A note with
a second line. <a href="#user-content-fnref-note" data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>`),
            ).toEqual({
                body: ["p: A footnote[footnote], another[footnote] and the first again[footnote]."],
                footnotes: ["FootnoteText: # My reference.", "FootnoteText: # A note with a second line.", "FootnoteText: # My reference."],
                endnotes: [],
                warnings: [],
            });
        });

        it("reads cmark-gfm's footnotes", () => {
            expect(
                convert(`<p>Text<sup class="footnote-ref"><a href="#fn-1" id="fnref-1" data-footnote-ref>1</a></sup></p>
<section class="footnotes" data-footnotes>
<ol>
<li id="fn-1">
<p>The note <a href="#fnref-1" class="footnote-backref" data-footnote-backref data-footnote-backref-idx="1" aria-label="Back to reference 1">↩</a></p>
</li>
</ol>
</section>`).footnotes,
            ).toEqual(["FootnoteText: # The note"]);
        });

        it("reads Pandoc's footnotes, with their paragraphs and formatting", () => {
            const { body, footnotes } =
                convert(`<p>Text<a href="#fn1" class="footnote-ref" id="fnref1" role="doc-noteref"><sup>1</sup></a> more.</p>
<section id="footnotes" class="footnotes footnotes-end-of-document" role="doc-endnotes">
<hr />
<ol>
<li id="fn1"><p>The note, with <em>emphasis</em>.</p><p>A second paragraph.<a href="#fnref1" class="footnote-back" role="doc-backlink">↩︎</a></p></li>
</ol>
</section>`);
            expect(body).toEqual(["p: Text[footnote] more."]);
            expect(footnotes).toEqual(["FootnoteText: # The note, with emphasis. / FootnoteText: A second paragraph."]);
            expect(
                formattedWithNotes(
                    htmlToContent(
                        `<p>A<a href="#n" role="doc-noteref">1</a></p><aside id="n" role="doc-footnote"><p><em>Em</em></p></aside>`,
                    ),
                ).footnotes,
            ).toContain('<w:r><w:rPr><w:i/><w:iCs/></w:rPr><w:t xml:space="preserve">Em</w:t></w:r>');
        });

        it("reads Python-Markdown's footnotes, without the space before the link back", () => {
            expect(
                convert(`<p>Footnotes<sup id="fnref:1"><a class="footnote-ref" href="#fn:1">1</a></sup> have a label.</p>
<div class="footnote">
<hr />
<ol>
<li id="fn:1">
<p>Footnote text.&#160;<a class="footnote-backref" href="#fnref:1" title="Jump back to footnote 1 in the text">&#8617;</a></p>
</li>
</ol>
</div>`),
            ).toEqual({
                body: ["p: Footnotes[footnote] have a label."],
                footnotes: ["FootnoteText: # Footnote text."],
                endnotes: [],
                warnings: [],
            });
        });

        it("reads kramdown's and Hugo's footnotes", () => {
            expect(
                convert(`<p>Jekyll<sup id="fnref:1" role="doc-noteref"><a href="#fn:1" class="footnote" rel="footnote">1</a></sup></p>
<div class="footnotes" role="doc-endnotes"><ol><li id="fn:1" role="doc-endnote"><p>Note.&nbsp;<a href="#fnref:1" class="reversefootnote" role="doc-backlink">&#8617;</a></p></li></ol></div>`),
            ).toEqual({ body: ["p: Jekyll[footnote]"], footnotes: ["FootnoteText: # Note."], endnotes: [], warnings: [] });
            expect(
                convert(`<p>Hugo<sup id="fnref:1"><a href="#fn:1" class="footnote-ref" role="doc-noteref">1</a></sup></p>
<div class="footnotes" role="doc-endnotes"><hr><ol><li id="fn:1"><p>Note.&#160;<a href="#fnref:1" class="footnote-backref" role="doc-backlink">&#x21a9;&#xfe0e;</a></p></li></ol></div>`),
            ).toEqual({ body: ["p: Hugo[footnote]"], footnotes: ["FootnoteText: # Note."], endnotes: [], warnings: [] });
        });

        it("reads reStructuredText's footnotes, without the brackets around their links back", () => {
            expect(
                convert(`<p>Sphinx<a class="footnote-reference brackets" href="#footnote-1" id="footnote-reference-1" role="doc-noteref"><span class="fn-bracket">[</span>1<span class="fn-bracket">]</span></a></p>
<aside class="footnote-list brackets">
<aside class="footnote brackets" id="footnote-1" role="doc-footnote">
<span class="label"><span class="fn-bracket">[</span><a role="doc-backlink" href="#footnote-reference-1">1</a><span class="fn-bracket">]</span></span>
<p>The note.</p>
</aside>
</aside>`),
            ).toEqual({ body: ["p: Sphinx[footnote]"], footnotes: ["FootnoteText: # The note."], endnotes: [], warnings: [] });
        });

        it("reads Google Docs' footnotes, with their paragraphs, without the rule above them", () => {
            expect(
                convert(
                    `<p class="c2"><span class="c1">Body text</span><sup><a href="#ftnt1" id="ftnt_ref1">[1]</a></sup><span> and more.</span></p>` +
                        `<hr class="c4"><div><p class="c3"><a href="#ftnt_ref1" id="ftnt1">[1]</a><span class="c5">&nbsp;Footnote text.</span></p><p>Second paragraph.</p></div>` +
                        `<div><p class="c3"><a href="#ftnt_ref2" id="ftnt2">[2]</a><span>&nbsp;Another.</span></p></div>`,
                ).footnotes,
            ).toEqual(["FootnoteText: # Footnote text. / FootnoteText: Second paragraph."]);
            expect(
                convert(
                    `<p>A<sup><a href="#ftnt1" id="ftnt_ref1">[1]</a></sup> and b<sup><a href="#ftnt2" id="ftnt_ref2">[2]</a></sup></p>` +
                        `<hr class="c4"><div><p class="c3"><a href="#ftnt_ref1" id="ftnt1">[1]</a><span>&nbsp;One.</span></p></div>` +
                        `<div><p class="c3"><a href="#ftnt_ref2" id="ftnt2">[2]</a><span>&nbsp;Two.</span></p></div>`,
                ),
            ).toEqual({
                body: ["p: A[footnote] and b[footnote]"],
                footnotes: ["FootnoteText: # One.", "FootnoteText: # Two."],
                endnotes: [],
                warnings: [],
            });
        });

        it("reads Word's footnotes and endnotes, which stay so", () => {
            const html = `<p class=MsoNormal>Body<a style='mso-footnote-id:ftn1' href="#_ftn1" name="_ftnref1" title=""><span class=MsoFootnoteReference><span style='mso-special-character:footnote'><![if !supportFootnotes]><span class=MsoFootnoteReference>[1]</span><![endif]></span></span></a> and an endnote<a style='mso-endnote-id:edn1' href="#_edn1" name="_ednref1" title=""><span class=MsoEndnoteReference><span style='mso-special-character:footnote'><![if !supportFootnotes]><span class=MsoEndnoteReference>[i]</span><![endif]></span></span></a>.</p>
<div style='mso-element:footnote-list'><![if !supportFootnotes]><br clear=all><hr align=left size=1 width="33%"><![endif]>
<div style='mso-element:footnote' id=ftn1>
<p class=MsoFootnoteText><a style='mso-footnote-id:ftn1' href="#_ftnref1" name="_ftn1" title=""><span class=MsoFootnoteReference><span style='mso-special-character:footnote'><![if !supportFootnotes]><span class=MsoFootnoteReference>[1]</span><![endif]></span></span></a> A Word footnote.</p>
</div>
</div>
<div style='mso-element:endnote-list'><![if !supportEndnotes]><br clear=all><hr align=left size=1 width="33%"><![endif]>
<div style='mso-element:endnote' id=edn1>
<p class=MsoEndnoteText><a style='mso-endnote-id:edn1' href="#_ednref1" name="_edn1" title=""><span class=MsoEndnoteReference><span style='mso-special-character:footnote'><![if !supportFootnotes]><span class=MsoEndnoteReference>[i]</span><![endif]></span></span></a> A Word endnote.</p>
</div>
</div>`;
            const expected = {
                body: ["p: Body[footnote] and an endnote[endnote]."],
                footnotes: ["FootnoteText: # A Word footnote."],
                endnotes: ["EndnoteText: # A Word endnote."],
                warnings: [],
            };
            expect(convert(html)).toEqual(expected);
            expect(convert(html, { notes: "endnotes" })).toEqual(expected);
        });

        it("reads Wikipedia's references, without the marks around their links back", () => {
            expect(
                convert(
                    `<p>Claim.<sup id="cite_ref-a_1-0" class="reference"><a href="#cite_note-a-1"><span class="cite-bracket">[</span>1<span class="cite-bracket">]</span></a></sup> Again.<sup id="cite_ref-a_1-1" class="reference"><a href="#cite_note-a-1">[1]</a></sup></p>` +
                        `<div class="reflist"><div class="mw-references-wrap"><ol class="references"><li id="cite_note-a-1"><span class="mw-cite-backlink">^ <a href="#cite_ref-a_1-0"><sup><i><b>a</b></i></sup></a> <a href="#cite_ref-a_1-1"><sup><i><b>b</b></i></sup></a></span> <span class="reference-text">Smith, <i>A Book</i>, 2001.</span></li></ol></div></div>`,
                ),
            ).toEqual({
                body: ["p: Claim.[footnote] Again.[footnote]"],
                footnotes: ["FootnoteText: # Smith, A Book, 2001.", "FootnoteText: # Smith, A Book, 2001."],
                endnotes: [],
                warnings: [],
            });
        });

        it("reads EPUB's notes, which have no links back", () => {
            expect(
                convert(
                    `<p>Text<a epub:type="noteref" href="#n1">1</a> more.</p><aside epub:type="footnote" id="n1"><p>An EPUB note.</p></aside>`,
                ),
            ).toEqual({ body: ["p: Text[footnote] more."], footnotes: ["FootnoteText: # An EPUB note."], endnotes: [], warnings: [] });
            expect(convert(`<p>Text<a href="#n1">*</a></p><aside role="doc-footnote" id="n1">A note.</aside>`).footnotes).toEqual([
                "FootnoteText: # A note.",
            ]);
        });

        it("reads a note whose reference says it is one, whatever its text", () => {
            expect(convert(`<p>See <a href="#n1" role="doc-noteref">the note about this</a>.</p><div id="n1">The note.</div>`)).toEqual({
                body: ["p: See [footnote]."],
                footnotes: ["FootnoteText: # The note."],
                endnotes: [],
                warnings: [],
            });
        });

        it("reads a link whose fragment is percent-encoded", () => {
            expect(
                convert(`<p>A<sup id="r:1"><a href="#fn%3A1">1</a></sup></p><ol><li id="fn:1">Note <a href="#r%3A1">↩</a></li></ol>`)
                    .footnotes,
            ).toEqual(["FootnoteText: # Note"]);
        });
    });

    describe("what aren't notes", () => {
        it("leaves a table of contents, its headings' links back to it, and a link to the top as they are", () => {
            expect(
                convert(
                    `<ul><li><a href="#intro" id="toc-intro">Introduction</a></li></ul><h2 id="intro"><a href="#toc-intro">Introduction</a></h2><p>Text <a href="#top">↑</a></p>`,
                ),
            ).toEqual({
                body: [
                    "ListParagraph (list 0): {toc_intro}[link to intro]Introduction",
                    "Heading2: {intro}[link to toc_intro]Introduction",
                    "p: Text [link to _top]↑",
                ],
                footnotes: [],
                endnotes: [],
                warnings: [],
            });
        });

        it("leaves a mark that links to a paragraph without a link back, or to a list of citations, as a link", () => {
            const { body, footnotes } = convert(
                `<p>See<sup><a href="#x">1</a></sup></p><p id="x">Target</p><ol><li id="c1">A citation</li></ol><p>Cited<sup><a href="#c1">1</a></sup></p>`,
            );
            expect(footnotes).toEqual([]);
            expect(body).toEqual(["p: See[link to x]1", "p: {x}Target", "ListParagraph (list 0): {c1}A citation", "p: Cited[link to c1]1"]);
        });

        it("leaves a note before its reference as it is, as notes come after their references", () => {
            const { body, footnotes } = convert(
                `<ol><li id="n1">Note <a href="#r1">↩</a></li></ol><p>Text<sup id="r1"><a href="#n1">1</a></sup></p>`,
            );
            expect(footnotes).toEqual([]);
            expect(body).toEqual(["ListParagraph (list 0): {n1}Note [link to r1]↩", "p: Text{r1}[link to n1]1"]);
        });

        it("leaves a link to a note it is in as it is", () => {
            expect(
                convert(`<ol><li id="n1">A note that links to itself<a href="#n1">1</a> <a href="#n1">↩</a></li></ol>`).footnotes,
            ).toEqual([]);
            expect(convert(`<p><a href="#n1"><span id="n1">1</span></a></p>`).footnotes).toEqual([]);
        });

        it("leaves a link to an element that isn't in the HTML, or isn't in a block, as it is", () => {
            expect(convert(`<p>Text<sup><a href="#missing">1</a></sup></p>`).body).toEqual(["p: Text[link to missing]1"]);
            expect(convert(`Text<a href="#n">1</a> and <a id="n" href="#r">n</a>`).footnotes).toEqual([]);
        });
    });

    describe("what's around them", () => {
        it("leaves out a section of notes with its heading and empty elements, but keeps one with an image", () => {
            expect(
                convert(
                    `<p>A<sup id="r1"><a href="#n1">1</a></sup></p><section role="doc-endnotes"><div role="heading">Notes</div><div class="clear"></div><ol><li id="n1">Note <a href="#r1">↩</a></li></ol></section>`,
                ).body,
            ).toEqual(["p: A[footnote]"]);
            expect(
                convert(
                    `<p>A<sup id="r1"><a href="#n1">1</a></sup></p><div><span><img src="${pngDataUrl(2, 2)}" alt=""></span><ol><li id="n1">Note <a href="#r1">↩</a></li></ol></div>`,
                ).body,
            ).toEqual(["p: A[footnote]", "p: [image]"]);
        });

        it("keeps the other items of a list that some notes are in, and a rule with other content after it", () => {
            const { body, footnotes } = convert(
                `<p>A<sup id="r1"><a href="#n1">1</a></sup></p><hr><p>After the rule</p><ol><li id="n1">Note <a href="#r1">↩</a></li><li>Not a note</li></ol>`,
            );
            expect(footnotes).toEqual(["FootnoteText: # Note"]);
            expect(body).toEqual(["p: A[footnote]", "p: ", "p: After the rule", "ListParagraph (list 0): Not a note"]);
        });

        it("writes a reference in a note as its text, as Word has no notes in notes, and keeps the note it refers to", () => {
            const { body, footnotes } = convert(
                `<p>A<sup id="r1"><a href="#n1">1</a></sup></p><ol><li id="n1">Note<sup id="r2"><a href="#n2">2</a></sup> <a href="#r1">↩</a></li><li id="n2">Inner <a href="#r2">↩</a></li></ol>`,
            );
            // The other note links back to the reference in this one, which has a bookmark for it
            expect(footnotes).toEqual(["FootnoteText: # Note{r2}[link to n2]2"]);
            expect(body).toEqual(["p: A[footnote]", "ListParagraph (list 0): {n2}Inner [link to r2]↩"]);
        });

        it("writes a hidden note's reference as its text", () => {
            const { body, footnotes } = convert(
                `<p>A<sup id="r1"><a href="#n1">1</a></sup></p><section class="footnotes" style="display: none"><ol><li id="n1">Note <a href="#r1">↩</a></li></ol></section>`,
            );
            expect(footnotes).toEqual([]);
            expect(body).toEqual(["p: A1"]);
        });

        it("puts a bookmark at the start of a footnote that another link goes to", () => {
            const { body, footnotes } = convert(
                `<p>A<sup id="r1"><a href="#n1">1</a></sup> and <a href="#n1">the note</a></p><ol><li id="n1">Note <a href="#r1">↩</a></li></ol>`,
            );
            expect(body).toEqual(["p: A[footnote] and [link to n1]the note"]);
            expect(footnotes).toEqual(["FootnoteText: # {n1}Note"]);
        });

        it("writes a note's references in a table's cells and in a list", () => {
            expect(
                convert(
                    `<table><tr><td>Cell<sup id="r1"><a href="#n1">1</a></sup></td></tr></table><ul><li>Item<sup id="r2"><a href="#n2">2</a></sup></li></ul>` +
                        `<ol><li id="n1">One <a href="#r1">↩</a></li><li id="n2">Two <a href="#r2">↩</a></li></ol>`,
                ),
            ).toEqual({
                body: ["p: Cell[footnote]", "ListParagraph (list 0): Item[footnote]"],
                footnotes: ["FootnoteText: # One", "FootnoteText: # Two"],
                endnotes: [],
                warnings: [],
            });
        });
    });

    describe("their content", () => {
        it("keeps a note's headings, lists, links and images, in the footnote", () => {
            const { footnotes, warnings } = convert(
                `<p>A<sup id="r1"><a href="#n1">1</a></sup></p><ol><li id="n1"><h3>Heading</h3><ul><li>Item</li></ul><p><a href="https://example.com">Link</a> <img src="${pngDataUrl(2, 2)}" alt=""> <a href="#r1">↩</a></p></li></ol>`,
            );
            expect(warnings).toEqual([]);
            expect(footnotes).toEqual(["Heading3: # Heading / FootnoteText (list 0): Item / FootnoteText: [link]Link [image]"]);
        });

        it("keeps the paragraphs of a note's table, with a warning", () => {
            expect(
                convert(
                    `<p>A<sup id="r1"><a href="#n1">1</a></sup></p><ol><li id="n1"><table><tr><td>One</td><td>Two</td></tr></table><p>After <a href="#r1">↩</a></p></li></ol>`,
                ),
            ).toEqual({
                body: ["p: A[footnote]"],
                footnotes: ["FootnoteText: # One / FootnoteText: Two / FootnoteText: After"],
                endnotes: [],
                warnings: ["table-in-note"],
            });
        });

        it("leaves out a note's page breaks, and starts a note with nothing but spaces or a link back with its number", () => {
            expect(
                convert(
                    `<p>A<sup id="r1"><a href="#n1">1</a></sup>B<sup id="r2"><a href="#n2">2</a></sup>C<sup id="r3"><a href="#n3">3</a></sup></p>` +
                        `<ol><li id="n1"><p style="break-before: page">Text <a href="#r1">↩</a></p></li>` +
                        `<li id="n2"><span style="white-space: pre">  </span><a href="#r2">↩</a></li><li id="n3"><a href="#r3">↩</a></li></ol>`,
                ).footnotes,
            ).toEqual(["FootnoteText: # Text", "FootnoteText: # ", "FootnoteText: # "]);
        });

        it("keeps a style the style map gives a note's paragraphs, and Word's own note style", () => {
            expect(
                convert(
                    `<p>A<sup id="r1"><a href="#n1">1</a></sup></p><ol><li id="n1"><p class="small">Note <a href="#r1">↩</a></p></li></ol>`,
                    {
                        // eslint-disable-next-line @typescript-eslint/naming-convention -- a selector, as the option is given
                        styleMap: { "p.small": "SmallNote" },
                    },
                ).footnotes,
            ).toEqual(["SmallNote: # Note"]);
        });

        it("starts a note with a space after its number, as Word does, without the spaces around its mark", () => {
            const { footnotes } = formattedWithNotes(
                htmlToContent(
                    `<p>A<sup id="r1"><a href="#n1">1</a></sup></p><ol><li id="n1"><b>  Bold</b> <a href="#r1">↩</a>&#160;</li></ol>`,
                ),
            );
            expect(footnotes).toContain(
                '<w:footnoteRef/></w:r><w:r><w:t xml:space="preserve"> </w:t></w:r><w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">Bold</w:t></w:r></w:p>',
            );
        });
    });

    describe("options", () => {
        it("makes notes endnotes, in Word's endnote style", () => {
            expect(
                convert(`<p>Text<sup><a href="#n1" id="r1">1</a></sup></p><ol><li id="n1">Note <a href="#r1">↩</a></li></ol>`, {
                    notes: "endnotes",
                }),
            ).toEqual({
                body: ["p: Text[endnote]"],
                footnotes: [],
                endnotes: ["EndnoteText: # Note"],
                warnings: [],
            });
        });
    });

    describe("htmlToRuns", () => {
        it("writes a note's reference in the runs, with the note in the footnote", () => {
            const { body, footnotes } = formattedWithNotes([
                new Paragraph({
                    children: [
                        ...htmlToRuns(`Text<sup><a href="#n1" id="r1">1</a></sup><ol><li id="n1">Note <a href="#r1">↩</a></li></ol>`),
                    ],
                }),
            ]);
            expect(linesOf(body)).toEqual(["p: Text[footnote]"]);
            expect(notesIn(footnotes, "footnote")).toEqual(["FootnoteText: # Note"]);
        });
    });

    describe("in a document", () => {
        const partsOf = async (document: Document): Promise<(path: string) => string> => {
            const files = unzip(await Packer.toBuffer(document));
            return (path) => textOf(files, path)!;
        };

        it("numbers the notes after the document's own, and keeps them when it's packed again", async () => {
            const document = new Document({
                footnotes: { 1: { children: [new Paragraph("The document's own")] } },
                sections: [
                    {
                        children: htmlToContent(
                            `<p>A<sup><a href="#n1" id="r1">1</a></sup> b<sup><a href="#n2" id="r2">2</a></sup></p><ol><li id="n1">One <a href="#r1">↩</a></li><li id="n2">Two <a href="#r2">↩</a></li></ol>`,
                        ),
                    },
                ],
            });
            await Packer.toBuffer(document);
            const read = await partsOf(document);

            expect([...read("word/document.xml").matchAll(/<w:footnoteReference w:id="(\d+)"\/>/g)].map(([, id]) => id)).toEqual([
                "2",
                "3",
            ]);
            expect([...read("word/footnotes.xml").matchAll(/<w:footnote w:id="(\d+)">/g)].map(([, id]) => id)).toEqual(["1", "2", "3"]);
        });
    });

    describe("robustness", () => {
        it("reads a thousand notes", () => {
            const count = 1000;
            const references = Array.from(
                { length: count },
                (_, index) => `<sup id="r${index}"><a href="#n${index}">${index}</a></sup>`,
            ).join(" ");
            const notes = Array.from(
                { length: count },
                (_, index) => `<li id="n${index}">Note ${index} <a href="#r${index}">↩</a></li>`,
            ).join("");
            const { footnotes } = convert(`<p>${references}</p><section class="footnotes"><ol>${notes}</ol></section>`);
            expect(footnotes).toHaveLength(count);
            expect(footnotes[count - 1]).toBe(`FootnoteText: # Note ${count - 1}`);
        });

        it("reads a note deep in elements, and a reference to an id many elements have", () => {
            const deep = `${"<div>".repeat(2000)}Deep${"</div>".repeat(2000)}`;
            expect(() =>
                convert(`<p>A<sup id="r1"><a href="#n1">1</a></sup></p><ol><li id="n1">${deep} <a href="#r1">↩</a></li></ol>`),
            ).not.toThrow();
            expect(
                convert(
                    `<p>A<sup id="r"><a href="#n">1</a></sup></p><ol><li id="n">First <a href="#r">↩</a></li><li id="n">Second</li></ol>`,
                ).footnotes,
            ).toEqual(["FootnoteText: # First"]);
        });
    });
});
