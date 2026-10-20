# HTML

<!-- cspell:ignore EMEA htmldiff katex taskList taskItem fnref -->

`htmlToContent` turns HTML into paragraphs and tables, and `htmlToRuns` turns it into the content of a paragraph. They go in a document as any others do: in its sections, headers, footers, table cells and text boxes, or in a template that `patchDocument` fills.

They are for HTML that comes from somewhere else, such as what people write in a rich-text editor and an app keeps, a page of a content management system, or the answer of a language model. For a document you write yourself, docx's own components say what you mean more clearly.

They come with the `docx` package, from `docx/html`. In Node, they need Node.js 16.9 or later.

## Example

```ts live
import { Document } from "docx";
import { htmlToContent } from "docx/html";

const doc = new Document({
    sections: [
        {
            children: htmlToContent(`
                <h1>Quarterly report</h1>
                <p>Sales were <b>up 12%</b>, led by <a href="https://example.com/emea">EMEA</a>.</p>
                <ul>
                    <li>New customers: 48</li>
                    <li>Renewals: <mark>97%</mark></li>
                </ul>
            `),
        },
    ],
});
```

## What it reads

It reads HTML as a browser does: HTML that isn't valid is read as a browser reads it, and elements are blocks or inline as their `display` says. Their formatting comes from their tags, their `style` attributes, the HTML's `<style>` elements and the attributes HTML used before CSS, such as `align` and `<font color>`.

| HTML                                                        | Word                                                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `<p>`, `<div>` and other blocks                             | Paragraphs, with text next to blocks in a paragraph of its own                             |
| `<h1>` to `<h6>`                                            | Paragraphs in the Heading 1 to Heading 6 styles                                            |
| `<b>`, `<i>`, `<u>`, `<s>`, `<sup>`, `<sub>`, `<code>`, ... | Bold, italic, underlined, struck through, superscript and subscript text, and a fixed font |
| `<br>`                                                      | A line break                                                                               |
| `<ul>`, `<ol>`, `<li>`                                      | Lists, bulleted or numbered, in lists, with their `start`, `type` and `list-style-type`    |
| `<table>`                                                   | Tables, with merged cells, header rows, widths, borders, backgrounds and alignment         |
| `<img>`, `<svg>`                                            | Images, with their sizes and alt text, floating when they float                            |
| `<a href>`                                                  | Hyperlinks in the Hyperlink style, and links to elements in the HTML as links to bookmarks |
| Notes, such as Markdown's footnotes                         | Word's footnotes, or endnotes                                                              |
| `<blockquote>`, `<pre>`, `<hr>`                             | Indented paragraphs, paragraphs that keep their spaces, and a line across the page         |
| `<input type="checkbox">`, editors' lists of to-dos         | Checkboxes                                                                                 |
| `<math>`, LaTeX that editors and KaTeX keep                 | Equations, as Word's own                                                                   |
| `<ins>` and `<del>`                                         | Underlined and struck through, or Word's tracked changes with `trackChanges`               |
| `page-break-before`, `<!-- pagebreak -->`                   | Page breaks                                                                                |
| `<script>`, `<style>`, `<template>`, hidden elements        | Nothing                                                                                    |

Paragraphs, headings, lists and links are written in the Word document's own styles, such as Normal, Heading 1, List Paragraph and Hyperlink. Only what the HTML says, such as a colour or a font size, is written as direct formatting, so the content looks like the rest of the document, and changes with its styles. A browser's own sizes and margins, such as a heading's size, aren't copied.

## Formatting

Text has the CSS of the elements it is in: its colour, background, font, size, weight, style, decorations, letter spacing, capitals and position. Paragraphs have their blocks' alignment, indents, spacing, line height, backgrounds and borders, and those of the blocks they are in. Lengths can be in any of CSS's units, colours in any of its forms, and custom properties with `var()` work.

```ts live
import { Document } from "docx";
import { htmlToContent } from "docx/html";

const doc = new Document({
    sections: [
        {
            children: htmlToContent(`
                <style>
                    .note { border-left: 4px solid #4472c4; padding-left: 8pt; background: #eef3fb; color: #1f3864 }
                    .price { font-weight: 700; color: var(--accent, green) }
                </style>
                <p style="text-align: center; font-size: 18pt; letter-spacing: 1pt">Price list</p>
                <p>Apples are <span class="price">£2</span> a kilo, and <span style="text-decoration: underline wavy red">pears</span> are sold out.</p>
                <p class="note">Prices include <span style="font-variant: small-caps">vat</span>.</p>
                <p style="line-height: 1.8; text-indent: 2em">An indented paragraph with more space between its lines, which wraps onto a second line to show it.</p>
            `),
        },
    ],
});
```

A unitless `line-height`, such as `1.5`, is a multiple of the font size, as in CSS, and is written as Word's line spacing of the same height. A percentage, such as `107%`, is written as that many of Word's lines, as Word writes its line spacing in HTML.

## In the document's own styles

`styleMap` gives the elements that CSS selectors match the document's own styles, by their ids: paragraph styles for blocks, character styles for inline elements, and table styles for tables. It is how the HTML of an editor is written in a template's styles.

`stylesheet` gives the HTML CSS of its own, such as the style sheet of the editor it comes from, as if it were in a `<style>` element after the HTML's own.

```ts live
import { Document } from "docx";
import { htmlToContent } from "docx/html";

const doc = new Document({
    styles: {
        paragraphStyles: [{ id: "Lead", name: "Lead", basedOn: "Normal", run: { size: 30, color: "404040" } }],
        characterStyles: [{ id: "Keyboard", name: "Keyboard", run: { font: "Consolas", shading: { fill: "EEEEEE" } } }],
    },
    sections: [
        {
            children: htmlToContent(
                '<h1>Release notes</h1><p class="lead">This release reads HTML.</p><p>Press <kbd>Ctrl</kbd> + <kbd>S</kbd>.</p>',
                {
                    styleMap: { h1: "Title", "p.lead": "Lead", kbd: "Keyboard" },
                    stylesheet: "p { color: #333333 }",
                },
            ),
        },
    ],
});
```

## Lists

Each list is numbered on its own, from its start. A list in an item of another is the next level of the other's list, as Word's own lists are, and the paragraphs of an item after its first are indented to its text. `<ol start>`, `<ol type>`, `<ol reversed>`, `<li value>` and `list-style-type` are read, with a number format Word doesn't have, such as `lower-greek`, written as decimal numbers. Lists are no deeper than Word's nine levels.

```ts live
import { Document } from "docx";
import { htmlToContent } from "docx/html";

const doc = new Document({
    sections: [
        {
            children: htmlToContent(`
                <ol start="3">
                    <li>Mix the flour
                        <ol type="a"><li>Sift it</li><li>Weigh it</li></ol>
                    </li>
                    <li><p>Bake the bread</p><p>For about an hour.</p></li>
                </ol>
                <ul style="list-style-type: square"><li>Flour</li><li>Water</li></ul>
                <ul data-type="taskList">
                    <li data-type="taskItem"><label><input type="checkbox" checked></label><div><p>Buy flour</p></div></li>
                    <li data-type="taskItem"><label><input type="checkbox"></label><div><p>Buy yeast</p></div></li>
                </ul>
            `),
        },
    ],
});
```

The lists that editors write without nesting them are read too: Quill's, whose items' depths are in their classes, Lexical's lists in lists, and the lists of Word's and Google Docs' HTML.

## Tables

Cells are placed as HTML places them, each in the first column of its row that a cell above doesn't span, and rows with fewer cells are given empty ones. A table's head is repeated at the top of each page, and its caption is a paragraph before it. A table with no borders in its HTML or CSS has Word's, as editors' tables have borders in their style sheets, and one with `border="0"` or `border: none` has none.

```ts live
import { Document } from "docx";
import { htmlToContent } from "docx/html";

const doc = new Document({
    sections: [
        {
            children: htmlToContent(`
                <table style="width: 100%; border-collapse: collapse" border="1">
                    <caption>Sales by region</caption>
                    <thead><tr><th>Region</th><th>Q2</th><th>Q3</th></tr></thead>
                    <tbody>
                        <tr><td rowspan="2" style="vertical-align: middle">EMEA</td><td>1,050</td><td style="background: #e2f0d9">1,200</td></tr>
                        <tr><td>980</td><td>1,010</td></tr>
                        <tr><td colspan="2"><b>Total</b></td><td style="text-align: right"><b>3,260</b></td></tr>
                    </tbody>
                </table>
            `),
        },
    ],
});
```

## Images

Nothing is downloaded. Images in data URLs are read from the HTML, and others are given with `images`: an object of each image's address and its data, or a function that gives the data for an address. An address is looked for as it is written, and then resolved against `baseUrl`. The data can be bytes, base64 or a data URL.

Images are sized as a browser sizes them: by their `width` and `height` attributes and CSS, with their own aspect ratio for a side they leave out, and their own size if they say nothing. None is wider than `maxImageWidth`, 601 pixels by default, the width of the text on docx's default page. An image with `float: left` or `float: right` floats with the text around it, and one that is a block is in a paragraph of its own, centred by `margin: auto`. `alt` is an image's description, and an empty `alt` marks it as decorative.

PNG, JPEG, GIF, BMP and SVG images are written. Word shows an SVG where it can, and a PNG of it elsewhere, which `images` can give: `{ data: svg, fallback: png }`. An `<svg>` in the HTML is written as an SVG image.

```ts live
import * as fs from "fs";
import { Document } from "docx";
import { htmlToContent } from "docx/html";

const doc = new Document({
    sections: [
        {
            children: htmlToContent(
                `<p><img src="logo.png" alt="The company's logo" style="float: right; width: 150px; margin-left: 10px">
                 Text beside the logo, which floats on the right, as it does in a browser. The text flows around it.</p>`,
                { images: { "logo.png": fs.readFileSync("./demo/assets/html/logo.png") } },
            ),
        },
    ],
});
```

## Links and bookmarks

A link to a web address is a hyperlink in the Hyperlink style, resolved against `baseUrl` when it is relative. A link to an element in the HTML, such as `<a href="#results">`, is a link to a bookmark at the element, whose name is its id, made into a name Word allows. `#` and `#top` go to the top of the document. Links to addresses that could run code, such as `javascript:`, are left out, and their text kept.

## Footnotes

The HTML's notes are Word's footnotes, at the foot of the page that refers to each, with their paragraphs, formatting, lists, links and images. It reads the notes that Markdown becomes, with markdown-it, GitHub, Pandoc, Python-Markdown, kramdown, Hugo and reStructuredText, and those of Google Docs, Word, Wikipedia and EPUB.

A link is a note's reference when it goes to an element after it whose block links back to it, as all of these write them, and its text is a mark, such as `1`, `[2]` or `*`, or when it or its note says it is one, such as with the `doc-noteref` and `doc-footnote` roles. The links back to the references, the list of the notes, and the rule and heading above it, are left out. A note that two references go to is a footnote for each, as Word has one reference for each note. Links to headings, back to the top and in tables of contents stay links.

`notes: "endnotes"` makes them endnotes, at the end of the document, as a web page has them. Word's own HTML says which of its notes are footnotes and which are endnotes, which they stay.

```ts live
import { Document } from "docx";
import { htmlToContent } from "docx/html";

const doc = new Document({
    sections: [
        {
            children: htmlToContent(`
                <p>Sales were up 12%<sup><a href="#fn1" id="fnref1">1</a></sup>, led by EMEA<sup><a href="#fn2" id="fnref2">2</a></sup>.</p>
                <section class="footnotes">
                    <ol>
                        <li id="fn1"><p>Compared with the same quarter last year. <a href="#fnref1">↩</a></p></li>
                        <li id="fn2"><p>Europe, the Middle East and Africa. <a href="#fnref2">↩</a></p></li>
                    </ol>
                </section>
            `),
        },
    ],
});
```

Notes are only in a document's body, as Word has no footnotes in headers, footers or other notes, so a reference in a header, or in a note, is left out. A table in a note is written as the paragraphs of its cells, with a warning.

## Math

MathML is written as Word's equations, which Word shows and edits as it does those typed into it. The LaTeX that KaTeX keeps in its MathML, and that editors keep, such as Quill's formulas, TipTap's math and CKEditor's, is read with docx/math's `latexToMath`. A web page that loads `docx/html` with a `<script>` loads `docx/math` before it.

```ts live
import { Document } from "docx";
import { htmlToContent } from "docx/html";

const doc = new Document({
    sections: [
        {
            children: htmlToContent(`
                <p>The roots are <span data-latex="x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}"></span>.</p>
                <p><math><mrow><msup><mi>e</mi><mrow><mi>i</mi><mi>π</mi></mrow></msup><mo>+</mo><mn>1</mn><mo>=</mo><mn>0</mn></mrow></math></p>
            `),
        },
    ],
});
```

## Tracked changes

`trackChanges` turns `<ins>` and `<del>`, such as those of an HTML diff, into Word's tracked changes, by its author, and at the time of their `datetime` attribute, or its time, or now. Without it, they are underlined and struck through, as a browser shows them.

```ts live
import { Document } from "docx";
import { htmlToContent } from "docx/html";

const doc = new Document({
    sections: [
        {
            children: htmlToContent("<p>Invoices are due within <del>30</del><ins>45</ins> days.</p>", {
                trackChanges: { author: "Legal", date: "2026-10-13T09:00:00Z" },
            }),
        },
    ],
});
```

## In a paragraph

`htmlToRuns` turns HTML into the content of a paragraph: runs, hyperlinks, images and the rest. The HTML's paragraphs are lines of the paragraph, and the content of its tables and lists is kept, without them.

```ts live
import { Document, Header, Paragraph, TextRun } from "docx";
import { htmlToRuns } from "docx/html";

const doc = new Document({
    sections: [
        {
            headers: {
                default: new Header({
                    children: [new Paragraph({ children: htmlToRuns("<i>Quarterly report</i> &middot; <b>Draft</b>") })],
                }),
            },
            children: [new Paragraph({ children: [new TextRun("Total: "), ...htmlToRuns("<b>£120</b>, <s>£150</s>")] })],
        },
    ],
});
```

## In a template

The paragraphs and tables of `htmlToContent` are a `PatchType.DOCUMENT` patch's children, and the runs of `htmlToRuns` a `PatchType.PARAGRAPH` patch's. Lists are added to the template's numbering.

```ts live
import * as fs from "fs";
import { patchDocument, PatchType } from "docx";
import { htmlToContent, htmlToRuns } from "docx/html";

const doc = await patchDocument({
    outputType: "nodebuffer",
    data: fs.readFileSync("./demo/assets/simple-template.docx"),
    patches: {
        name: { type: PatchType.PARAGRAPH, children: htmlToRuns("<b>Ada</b> <i>Lovelace</i>") },
        paragraph_replace: {
            type: PatchType.DOCUMENT,
            children: htmlToContent("<p>The report:</p><ol><li>Sales were <b>up 12%</b></li><li>Costs fell</li></ol>"),
        },
    },
});

fs.writeFileSync("My Document.docx", doc);
```

## Editors and the clipboard

It reads the HTML of rich-text editors, with the styles of the classes they write, which are in their own style sheets rather than in their HTML:

- **TinyMCE**: its indents, line heights, colours and fonts, its tables' borders, and its page breaks.
- **CKEditor 5**: its markers and pens, text sizes, floating and centred images, tables, lists of to-dos, math and page breaks.
- **Quill**: its alignment, sizes, fonts and indents, its flat lists and checklists, code blocks and formulas.
- **TipTap**: its highlights, colours, lists of tasks, tables and math.
- **Lexical**: its spaces, lists in lists and checklists.

It reads what **Word** and **Google Docs** put on the clipboard: Word's style sheet, its lists of numbered paragraphs, its page breaks and its footnotes and endnotes, and Google Docs' formatting, line spacing and lists, without the bold of the `<b>` it puts around everything. It reads the HTML that **Markdown** becomes too, with its task lists, footnotes and KaTeX's math.

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/html/editors.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/html/editors.ts_

## Warnings

What the HTML has that the document leaves out, or has differently, is told to `onWarning`, with a code and a message. The HTML is never the reason for an error: the rest of it is read.

| Code                  | What it is about                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `unsupported-element` | An element a document can't have, such as `<video>` or `<iframe>`, which is left out       |
| `missing-image`       | An image whose data isn't in the HTML or the `images` option, which is left out            |
| `unsupported-image`   | An image in a format Word can't show, such as WebP, which is left out                      |
| `unsafe-link`         | A link to an address that could run code, whose text is kept                               |
| `invalid-math`        | Math that can't be read, whose text is kept                                                |
| `too-deep`            | Content in more than 512 elements in each other, whose text is kept without its formatting |
| `block-in-paragraph`  | A table or list in HTML given to `htmlToRuns`, whose content is kept                       |
| `table-in-note`       | A table in a note, whose cells' paragraphs are kept in the footnote without it             |

```ts
htmlToContent(html, {
    onWarning: ({ code, message }) => console.warn(code, message),
});
```

## What isn't read

CSS layout, such as flex and grid containers' columns, floats other than images', and positions, isn't read: their content is written in order. Neither are forms, other than checkboxes, radio buttons and the values of inputs, nor `<canvas>`, `<video>`, `<audio>` and `<iframe>`. Styles for the screen, in `@media screen`, aren't used, and those for print are.

HTML is read with [parse5](https://github.com/inikulin/parse5), as browsers read it. Nothing in it is run or downloaded, so HTML from anyone can be read, though HTML with a great many elements in each other takes longer to read.

## Examples

### HTML in a document

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/html/html-to-content.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/html/html-to-content.ts_

### In a document's own styles

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/html/style-map.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/html/style-map.ts_

### In a template

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/html/html-in-templates.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/html/html-in-templates.ts_

### Tracked changes

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/html/tracked-changes.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/html/tracked-changes.ts_

### Footnotes

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/html/footnotes.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/html/footnotes.ts_
