/**
 * The styles docx/html gives HTML's elements before the document's own, as a browser's style sheet does.
 *
 * It gives elements what they mean, such as `<b>`'s bold and `<p>`'s being a block, but not a browser's sizes and
 * margins: paragraphs, headings and links are written in the Word document's own styles instead, so they look like the
 * rest of the document. Elements that are never shown, such as `<script>`, aren't shown.
 *
 * It also has the styles of the classes rich-text editors write, which are in their own style sheets rather than in
 * the HTML they give, so their content looks as it did in the editor: CKEditor 5's markers, pens, text sizes and
 * image styles, Quill's alignment, sizes, fonts and indents, and the lists of to-dos that TipTap, Lexical and GitHub
 * write, which have checkboxes rather than bullets. The line break that browsers add to what they copy is left out.
 *
 * @module
 */
// cspell:ignore xmp noembed
export const USER_AGENT_STYLES = `
html, body, address, blockquote, center, dialog, div, figure, figcaption, footer, form, header, hr, legend, listing,
main, p, plaintext, pre, search, xmp, article, aside, h1, h2, h3, h4, h5, h6, hgroup, nav, section, dir, dd, dl, dt,
menu, ol, ul, details, summary, fieldset, optgroup {
    display: block;
}
li { display: list-item; }
table { display: table; }
caption { display: table-caption; }
colgroup, col { display: none; }
thead, tbody, tfoot { display: table-row-group; }
tr { display: table-row; }
td, th { display: table-cell; }
area, base, basefont, datalist, head, link, meta, noembed, noframes, param, script, style, template, title,
noscript, [hidden], dialog:not([open]) {
    display: none;
}

b, strong { font-weight: bold; }
i, em, cite, dfn, var, address { font-style: italic; }
u, ins { text-decoration: underline; }
s, strike, del { text-decoration: line-through; }
sub { vertical-align: sub; }
sup { vertical-align: super; }
small { font-size: smaller; }
big { font-size: larger; }
code, kbd, samp, tt, pre, listing, xmp, plaintext { font-family: monospace; }
pre, listing, xmp, plaintext { white-space: pre; }
textarea { white-space: pre-wrap; }
nobr { white-space: nowrap; }
center { text-align: center; }
th { font-weight: bold; text-align: center; }
caption { text-align: center; }
blockquote { margin-left: 0.5in; margin-right: 0.5in; }
dd { margin-left: 0.5in; }
ul { list-style-type: disc; }
ol { list-style-type: decimal; }
ul ul, ol ul, menu ul, ul menu, ol menu { list-style-type: circle; }
ul ul ul, ul ol ul, ol ul ul, ol ol ul, ul ul menu { list-style-type: square; }
menu, dir { list-style-type: disc; }
[dir="rtl" i] { direction: rtl; }
[dir="ltr" i] { direction: ltr; }
mark { background-color: yellow; }

.marker-yellow { background-color: #fdfd77; }
.marker-green { background-color: #62f962; }
.marker-pink { background-color: #fc7899; }
.marker-blue { background-color: #72ccfd; }
.pen-red { color: #e71313; background-color: transparent; }
.pen-green { color: #128a00; background-color: transparent; }
.text-tiny { font-size: 0.7em; }
.text-small { font-size: 0.85em; }
.text-big { font-size: 1.4em; }
.text-huge { font-size: 1.8em; }
img.image-style-side, img.image-style-align-right, .image-style-side img, .image-style-align-right img { float: right; }
img.image-style-align-left, .image-style-align-left img { float: left; }
figure.image { text-align: center; }
.image-style-block-align-left { text-align: left; }
.image-style-block-align-right { text-align: right; }
figure.table > table { margin-left: auto; margin-right: auto; }

.ql-direction-rtl { direction: rtl; text-align: inherit; }
.ql-align-center { text-align: center; }
.ql-align-right { text-align: right; }
.ql-align-justify { text-align: justify; }
.ql-size-small { font-size: 0.75em; }
.ql-size-large { font-size: 1.5em; }
.ql-size-huge { font-size: 2.5em; }
.ql-font-serif { font-family: Georgia, "Times New Roman", serif; }
.ql-font-monospace { font-family: Monaco, "Courier New", monospace; }
.ql-indent-1:not(li) { padding-left: 3em; }
.ql-indent-2:not(li) { padding-left: 6em; }
.ql-indent-3:not(li) { padding-left: 9em; }
.ql-indent-4:not(li) { padding-left: 12em; }
.ql-indent-5:not(li) { padding-left: 15em; }
.ql-indent-6:not(li) { padding-left: 18em; }
.ql-indent-7:not(li) { padding-left: 21em; }
.ql-indent-8:not(li) { padding-left: 24em; }
.ql-ui { display: none; }
br.Apple-interchange-newline { display: none; }
.ql-code-block-container { font-family: monospace; white-space: pre-wrap; }

ul[data-type="taskList"], ul.contains-task-list, ul.todo-list, ul:has(> li[role="checkbox"]), ul[data-checked] {
    list-style-type: none;
}
li[data-type="taskItem"] > label, li[data-type="taskItem"] > div, li[data-type="taskItem"] > div > p:first-child {
    display: inline;
}
`;
