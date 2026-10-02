# Layout

<!-- cspell:ignore Aptos chenglou Carlito GPOS -->

!> Layout requires an understanding of [Table of Contents](usage/table-of-contents.md) and [Bookmarks](usage/bookmarks.md).

`docx/layout` lays out a document's pages as Word would, when the document is written, to work out the page each heading and bookmark is on. `docx` then writes those page numbers into the document's tables of contents and page references.

Without it, their page numbers are blank until Word updates the fields, because they depend on how the document is laid out. Word only updates them when the document asks it to (`updateFields`) and the reader says yes, or when the reader updates the table. LibreOffice never fills in a table of contents' page numbers, so documents it converts to PDF have none.

It is opt-in. The page numbers are estimates: Word still works them out again when it updates the fields, such as when the reader updates the table.

It can also give what is on each page, with [`layoutDocument`](#what-is-on-each-page): the lines of each paragraph, with their text and where they are, the rows of tables, the footnotes and endnotes, and which header and footer each page shows.

## Importing

Layout comes with the `docx` package. Import it from `docx/layout`, and everything else from `docx`:

```ts
import { Document, TableOfContents } from "docx";
import { estimatePageNumbers, layoutDocument } from "docx/layout";
```

In a page without a bundler, load `dist/layout.umd.cjs` after `dist/index.umd.cjs` (or `dist/layout.iife.js` after `dist/index.iife.js`). It adds a `docxLayout` global, such as `docxLayout.estimatePageNumbers` and `docxLayout.layoutDocument`.

## Example

Give the document `estimatePageNumbers` as its `pageNumbers`:

```ts live
import { Bookmark, Document, HeadingLevel, PageReference, Paragraph, TableOfContents, TextRun } from "docx";
import { estimatePageNumbers } from "docx/layout";

const text = "The harbour was rebuilt after the storm, and this report sets out what it cost and what is left to do. ".repeat(12);

const doc = new Document({
    // Without updateFields, Word shows the page numbers as they are written, and doesn't ask to update them
    pageNumbers: estimatePageNumbers,
    sections: [
        {
            children: [
                new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-3" }),
                new Paragraph({ children: [new TextRun("The costs are on page "), new PageReference("costs"), new TextRun(".")] }),
                ...[1, 2, 3, 4].flatMap((chapter) => [
                    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(`Chapter ${chapter}`)] }),
                    new Paragraph(text),
                    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`Section ${chapter}.1`)] }),
                    new Paragraph(text),
                ]),
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    children: [new Bookmark({ id: "costs", children: [new TextRun("Costs")] })],
                }),
                new Paragraph(text),
            ],
        },
    ],
});
```

The page numbers are written into:

- the entries of each [Table of Contents](usage/table-of-contents.md) filled in from the headings
- each [`PageReference`](usage/bookmarks.md#page-references). One that shows its position relative to the bookmark (`useRelativePosition`) writes "above" or "below" when it is on the bookmark's page, by whether the bookmark is before or after it in the text, even in another column or table cell, and "on page" and the page as it shows it when it isn't, such as "on page 4", "on page iv" or "on page 1-2", as Word writes it. A bookmark in a footnote or endnote is on the page of the note's reference, as Word has it, even in the part of a footnote that goes on to the next page or in an endnote at the end of the document, and one that shows its position relative to it writes "on page" and that page, even on the same page
- the [number of pages](usage/page-numbers.md#total-number-of-pages) of the document (`PageNumber.TOTAL_PAGES`) and of [each section](usage/page-numbers.md#total-number-of-pages-in-a-section) (`PageNumber.TOTAL_PAGES_IN_SECTION`), in the text, headers and footers. A section's is left blank when it shares a page with another section, or has a blank page before or after it

A page reference or number of pages in a format of its own, such as a template's `PAGEREF Results \* roman` or Word's `NUMPAGES \* Arabic \* MERGEFORMAT`, or a `SimpleField` such as `new SimpleField("PAGEREF Results \\* roman")`, is written in that format, as Word writes it: `\* Arabic`, `\* Roman` (IV), `\* roman` (iv), `\* ALPHABETIC` (D), `\* alphabetic` (d), `\* Ordinal` (4th) or `\* ArabicDash` (- 4 -), or a picture of digits, such as `\# "00"` (04) or `\# "#,##0"` (1,234), in capitals with `\* Upper` (IV, 4TH or ON PAGE 4), `\* Lower` or `\* FirstCap`. A page reference in a format of its own writes the number of its bookmark's page without its chapter number, such as ii for page 1-2, and one that shows its position relative to the bookmark writes the number too.

Word writes the numbers of the page and section a PAGE or SECTION field is on itself (`PageNumber.CURRENT`, `PageNumber.CURRENT_SECTION`, and a `PageNumberElement`), so `docx` leaves them empty, but the lines they are in are laid out with the numbers Word writes: the page's number as the page shows it, such as `iv` or `2-5`, or in one of the formats above, and the section's, counted from 1. In a footnote or endnote, they are those of the page and section of its reference, as Word has them.

The numbers of captions, such as the 2 of "Figure 2", are written too. Each `SequentialIdentifier` is a SEQ field, which counts the SEQ fields of its identifier, such as `"Figure"`, up to it, so its number doesn't depend on the layout. It is counted as Word counts it: the SEQ fields of the text, in text boxes and hidden text too, in order, with an identifier in any capitals, or in quotes, counted as the same one. The switches written after the identifier, such as `new SequentialIdentifier("Figure \\r 5")`, are followed: `\r 5` starts the count again from 5, `\c` repeats the number before, or writes 0 before the first, `\n` is the next number, `\s 1` starts the count again after each Heading 1, or heading of a higher level, and `\h` hides the number, unless it is given a format. A `\* ARABIC`, `\* ROMAN`, `\* ALPHABETIC`, `\* Ordinal` (4th) or `\* ArabicDash` (- 4 -) writes it in that format, and `\* roman` and `\* alphabetic` in small letters. A heading's caption number is left out of its entry in the table of contents, as Word leaves it out.

## Opening the document in Word

Without `pageNumbers`, `docx` writes page references, tables of contents and SEQ fields as fields for Word to update, so Word asks "This document contains fields that may refer to other files. Do you want to update the fields in this document?" when it opens the document. With `pageNumbers`, they are written as they are, so Word shows them as they are written, and doesn't update them or ask. Leave `updateFields` off, and Word opens the document without asking.

A page number `docx/layout` couldn't work out, after it stopped (see [What it leaves blank](#what-it-leaves-blank)), is left blank, and stays blank in Word until the fields are updated: by the reader, such as by updating the table of contents, or by turning `updateFields` on. A wrong page number is worse than a blank one. The same goes for what `docx/layout` doesn't write at all:

- a page reference that shows its position relative to the bookmark (`useRelativePosition`) in a header, footer, footnote or endnote
- a page reference or number of pages in a format other than those above, such as `\* CardText` or `\* Caps`, or with a picture Word's text isn't known for, such as one with text in it, or more `#`s than the number has digits, which Word writes as spaces
- a table of contents that lists no heading, or of captions or TC fields, which is left empty, and the entries of one given `cachedEntries` or `contentChildren`, which are left as they were given
- the page numbers of a table of contents that writes a SEQ field's number before each of them (`seqFieldIdentifierForPrefix`), such as 2-5 for page 5 of chapter 2
- a SEQ field in a format other than those above, such as `\* CardText` or `\# 00`, or past what the format writes, such as 781 in letters, for which Word writes an error
- a SEQ field with a bookmark after its identifier, which shows the number of the SEQ field at the bookmark
- a SEQ field with a switch not followed, such as `\c` with `\r`, or in deleted text, and the SEQ fields of its identifier after it, until one starts the count again with `\r`. So is a field with `\s` after a paragraph with an outline level but no heading style (`outlineLevel`), or another than its heading style's
- the SEQ fields in headers, footers, footnotes and endnotes, which Word writes as an error, "Error! Main Document Only.", and every SEQ field of an identifier that has one in a comment

Word still asks when:

- the document has `updateFields` on, which asks Word to update all of its fields
- a table of contents is given `beginDirty: true`

## Templates

[`patchDocument`](usage/templates.md) writes the page numbers of a template it fills in too, when it is given `estimatePageNumbers` as its `pageNumbers`. The pages are laid out once the patches are in, so the numbers are those of the filled-in document:

```ts
import * as fs from "fs";
import { Paragraph, patchDocument, PatchType } from "docx";
import { estimatePageNumbers } from "docx/layout";

const doc = await patchDocument({
    outputType: "nodebuffer",
    data: fs.readFileSync("Report template.docx"),
    patches: {
        summary: { type: PatchType.DOCUMENT, children: [new Paragraph("The harbour was rebuilt after the storm.")] },
    },
    pageNumbers: estimatePageNumbers,
});
```

The template is read as Word saved it, with its styles, theme, lists, settings, headers, footers and notes, and the numbers are written into its tables of contents, page references and numbers of pages, in its text, headers and footers. The numbers a template was saved with are those of the template before it was filled in, so one that `docx/layout` can't work out, after something it can't lay out, is left blank rather than kept. Its page references and tables of contents are written clean, as a document's are, so Word shows them as they are (see [Opening the document in Word](#opening-the-document-in-word)). What `estimatePageNumbersWith` returns works the same way.

`patchDocument` doesn't add entries to a table of contents for the headings patches add. Word adds them when it updates the table.

## What is on each page

`layoutDocument` lays out a document's pages as `estimatePageNumbers` does, and gives what is on each of them:

```ts
import { Document, Paragraph } from "docx";
import { layoutDocument } from "docx/layout";

const doc = new Document({ sections: [{ children: [new Paragraph("The harbour was rebuilt after the storm.")] }] });

const { pages, stoppedAt } = layoutDocument(doc);
for (const page of pages) {
    for (const block of page.body) {
        if (block.type === "paragraph") {
            for (const line of block.lines) {
                console.log(`Page ${page.pageNumber}: "${line.text}", ${line.y} pixels down`);
            }
        }
    }
}
if (stoppedAt) {
    console.log(`Laid out up to ${stoppedAt}`);
}
```

Lengths are in pixels, 96 to the inch, from the top left corner of the page. The page numbers of tables of contents and page references are laid out as `estimatePageNumbers` writes them, whether or not the document is given it.

The layout of the document, `DocumentLayout`:

| Property    | Type                    | What it is                                                                                                                                                  |
| ----------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pages`     | `readonly PageLayout[]` | The pages, in order                                                                                                                                         |
| `stoppedAt` | `string` or `undefined` | What the layout [stopped at](#what-it-leaves-blank), such as `"a text box"`. The pages are those up to there, the last of them with what was laid out on it |

Each page, `PageLayout`:

| Property     | Type                                          | What it is                                                                                                                                                                                                           |
| ------------ | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pageNumber` | `string` or none                              | The page's number, as the page shows it, such as `"3"` or `"iv"`. None when Word's isn't known: when the section's page numbers start with a chapter number                                                          |
| `section`    | `number`                                      | The section the page starts in, counted from 0                                                                                                                                                                       |
| `width`      | `number`                                      | The width of the page                                                                                                                                                                                                |
| `height`     | `number`                                      | The height of the page                                                                                                                                                                                               |
| `header`     | `"default"`, `"first"`, `"even"` or none      | Which of the section's [headers](usage/headers-and-footers.md) the page shows, by the name the section's `headers` give it. A section without one of them shows the one of the section before. None when it has none |
| `footer`     | `"default"`, `"first"`, `"even"` or none      | Which of the section's footers the page shows, in the same way                                                                                                                                                       |
| `body`       | `readonly (ParagraphLayout \| TableLayout)[]` | The paragraphs and tables of the body on the page, or the parts of them on it, in order                                                                                                                              |
| `footnotes`  | `readonly NoteLayout[]`                       | The footnotes at the bottom of the page, in order. The rest of one that goes on from the page before comes first                                                                                                     |
| `endnotes`   | `readonly NoteLayout[]`                       | The endnotes on the page, which follow the body                                                                                                                                                                      |

A paragraph, `ParagraphLayout`, is `{ type: "paragraph", index, lines }`, and a table, `TableLayout`, is `{ type: "table", index, rows }`. `index` is where it is among the paragraphs and tables of the body, or of its footnote or endnote, counted from 0, so a paragraph on two pages has the same `index` on both. It counts each paragraph docx writes, such as the entries of a table of contents, and the empty paragraph it writes at the end of each section but the last, which takes no room, so it isn't on any page.

Each line, `LineLayout`:

| Property    | Type     | What it is                                                                                                                                  |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `text`      | `string` | The text on the line, with the spaces where it wraps and a tab as `\t`. The texts of a paragraph's lines, one after the other, are its text |
| `x`         | `number` | Where the room for the line starts across the page: the left of its column, or of the page's text, and the paragraph's indent               |
| `y`         | `number` | Where the top of the line is down the page                                                                                                  |
| `width`     | `number` | How wide the room for the line is, between the paragraph's indents                                                                          |
| `height`    | `number` | How tall the line is, with the paragraph's line spacing                                                                                     |
| `textWidth` | `number` | How far its text goes from `x`, without the spaces at its end                                                                               |

The text is lined up in the line's room as the paragraph's alignment says, so it starts at `x` when it is aligned to the left, `(width - textWidth) / 2` further on when it is centred, and `width - textWidth` further on when it is aligned to the right. Justified lines but the last fill it.

Each row of a table, or the part of a row on the page when it breaks across pages, `RowLayout`, is `{ index, y, height }`: which of the table's rows it is, counted from 0, the top of the row, and its height, with its borders. A table's header rows are repeated at the top of each page it goes on to.

A footnote or endnote, `NoteLayout`, is `{ noteNumber, content }`: its number, as its reference shows it, such as `"1"` or `"iv"`, and its paragraphs and tables on the page.

A blank page that Word adds so a section starts on an odd or even page has nothing on it, and no header or footer, as Word prints it.

`layoutDocument` doesn't give the lines in table cells, in headers and footers, or where tables are across the page, yet. Each line is where Word puts it, to within a few twentieths of a point.

## What it follows

The pages are laid out with the widths and heights of the characters of the fonts Word documents use most: Calibri, Cambria, Arial, Times New Roman and Courier New, and the heights of the lines of the Chinese, Japanese and Korean fonts Office has, and how far each goes below its baseline, such as MS Mincho, Yu Gothic, SimSun, Microsoft YaHei, PMingLiU and Malgun Gothic. The widths are those of the letters of Western and Central European languages, Turkish, Vietnamese, Greek and Cyrillic, of punctuation and the spaces other than U+0020, and of currency signs, arrows and mathematical symbols, as Word draws them in each font, plain, bold, italic and bold italic. It follows:

- the document's styles, and each paragraph's and run's own formatting: fonts, sizes, bold, italics, kerning, which is measured with fonts' files (see [Measuring fonts from their files](#measuring-fonts-from-their-files)), capitals, and hidden text. Chinese, Japanese and Korean are in the run's East Asian font (`font: { eastAsia }`), or in MS Mincho when that font has none of their characters, as Word draws them. A right-to-left run (`rightToLeft`) is in the run's font, size, bold and italics for complex scripts (`font: { cs }`, `sizeComplexScript`, `boldComplexScript`, `italicsComplexScript`), as Word draws it
- lengths given with units, such as `margin: { top: "1in" }`, `size: "12pt"` or a table's `width: { size: "6in", type: WidthType.DXA }`, as well as those given in numbers. Word reads each as a whole number of twips: rounded down from inches, points and picas, and to the nearest from centimeters and millimeters, and a size in points rounded down to a half-point, so `size: "10.75pt"` is 10.5 points. It reads the minus sign of a negative length as the whole number's only, and adds the fraction: `"-10.7pt"` is -9.3 points
- where lines break, as Word breaks them: at spaces, and at en, em, four-per-em and ideographic spaces, which go past the end of a line as spaces do, after hyphens, en and em dashes and zero-width spaces, and between Chinese and Japanese characters. Word doesn't break lines at the other spaces, such as the thin space, so neither does the layout. In text in Japanese or Chinese (`language: { eastAsia: "ja-JP" }`), Word's lists keep characters such as closing brackets and `、` from starting a line, and opening brackets from ending one, so the character before moves to the next line with it. Text with no East Asian language, or in Korean or English, has no such rules in Word. Korean, Thai and the other scripts without spaces between words break at their spaces, as Word breaks them, and a word wider than the line breaks after the last character that fits. A paragraph's `wordWrap`, which writes Word's "Allow Latin text to wrap in the middle of a word", lets the words of runs in an East Asian font or language break anywhere, as Word breaks them. Right-to-left paragraphs (`bidirectional`) break where left-to-right ones do
- spacing before and after paragraphs, line spacing, indents and tab stops. A line in one font is as tall as Word makes it, to a fraction of a twip (a twentieth of a point): 268.55 twips for Calibri 11. A line in several fonts is as tall as Word makes it from the tallest of them above the baseline and the deepest below it, so a word of Courier New in a line of Calibri 11 makes it 275.53 twips, taller than either font's own line. Multiple line spacing (`line` with `LineRuleType.AUTO`) adds its share of the tallest font's own line below the text, and the last line on a page, or in a column, can have that space below the bottom of the page, as Word lays it out, but for the cases it stops at (see below) Contextual spacing (`contextualSpacing`) leaves out only its paragraph's own share of the space between it and a paragraph of the same style, as Word does: all of its space after, or as much of its space before as is more than the space after the paragraph above it
- justified paragraphs (`AlignmentType.JUSTIFIED`), whose spaces Word squeezes to fit one more word on a line, so they can have more words to a line than left-aligned ones. It squeezes them, in proportion to their widths, when that takes less of their width than a quarter, and than half of what they would stretch by with the word on the next line. Spaces at the start of a line, those before a tab, and no-break spaces aren't squeezed. Distributed paragraphs (`AlignmentType.DISTRIBUTE`) are squeezed less often, as their letters can stretch too, and Latin text justified for Thai (`THAI_DISTRIBUTE`) or with a low kashida (`LOW_KASHIDA`) as justified text is
- paragraph borders (`border`, and `thematicBreak`), with the room Word gives them: a border above or below a paragraph takes its width and the space between it and the text, also at the top of a page, and at its foot, where the last line goes to the next page when its border doesn't fit below it. The space before and after goes outside the borders. Paragraphs next to each other with the same borders and the same left and right indents are one box, as Word draws them: the top border above the first, the bottom border below the last, a border between them (`between`) between each two, and no border where a page breaks the box. Borders at the sides take no room, and leave the lines as wide as they are. Each style takes the room Word gives it: a double line three times its width, a triple line five times, and a wave 3 points whatever its width
- Word's automatic spacing (`beforeAutoSpacing`, `afterAutoSpacing`), as documents made from HTML have it: 14 points, the larger of two between paragraphs, in place of the space given. Word puts none above the first paragraph of the document, a table cell or a header, below the last of a cell, or between the paragraphs of a list, and contextual spacing leaves it out as it does the space given
- indents in characters (`firstLineChars`, and the left, right and hanging indents in characters of documents Word made), and space before and after in lines, which Word takes in place of those in twips. A character of a first line or hanging indent is as wide as the paragraph's first character is tall, and one of a left or right indent as its mark, and a hanging indent in characters puts the first line at the left indent and the other lines further in. A line is 12 points, whatever the font
- keeping a paragraph with the next, keeping its lines together, widow and orphan control, and page breaks
- numbered and bulleted lists, including those a paragraph's style numbers it in
- footnotes, which take room at the bottom of the page their reference is on, and endnotes, which follow the text. A footnote that doesn't fit below its reference continues at the bottom of the next page, as Word continues it: it breaks between its paragraphs and table rows, and inside a paragraph keeping to its widow and orphan control, and its reference's line moves to the next page with it when too little of it would stay. A first paragraph kept together, or kept with the next, stays with its reference whole, with the first lines of what it is kept with, and a table row whose lines widow control keeps together goes on the next page whole. A table's header rows aren't repeated above the rest of a footnote on the next page. The footnote of a line kept with a longer paragraph goes below the first lines of it that the line is kept with, and the rest of the paragraph goes on the next page. One longer than a page fills the pages after it, and the text goes on above its end. Before a section that starts on a new page, the rest of a footnote goes on pages of its own, which belong to the section its reference is in, and the new section starts after them. A line at the top of a page whose footnote can't go on a page with it, such as one that starts with a paragraph kept together that is taller than a page, stays there, and the footnote starts on the next page. A table row refers to footnotes as a line does: it moves to the next page with a footnote that doesn't fit below it, and one that breaks across pages has each line's footnote on the page the line is on, and breaks after a line whose footnote continues. In columns, the footnotes of a page are laid out in the columns too, as Word lays them out: one after the other from the first column, evened out, each part broken at the width of the column it is in, and every column ends above them. Footnotes from another section of the same columns on the page go on in them. A line or table row in columns whose footnotes don't fit below it moves to the next column, or the next page, with all of them, as Word moves it, rather than continue one. The separator above the endnotes goes on the page of their first line, and on each page after the first they are on, the continuation separator is above them, as Word puts them. Footnotes and endnotes are numbered as Word numbers them, 1, 2, 3 and i, ii, iii, or in the format and from the number a document or its sections give, afresh in each section when they say so
- run formatting that changes how much room text takes, as Word lays it out. Superscript and subscript (`superScript`, `subScript`) are drawn at 65% of the text's size, to the nearest half-point and down from a quarter, so 7 points at 11 and 9.5 at 15, and small capitals (`smallCaps`) at 80%, so 9 points at 11; both take up the line of their run's own size, so they never make a line taller. Raised and lowered text (`position`) raises the line's top or lowers its bottom by as much as it goes past the rest of the line: a word raised 6 points makes a line of Calibri 11 120 twips taller, and a smaller word raised a little none. Emphasis marks (`emphasisMark`) take a quarter of their line, over it, or under it for dots below; line spacing that gives a line a little more room adds it below the marks' room, and spacing that gives it enough, such as 1.5 lines, holds the marks. A border around text (`border` on a `TextRun`) takes its space and its width on each side of the text, and above and below it, as wide as a paragraph's border of its style: two runs next to each other with the same border are in one box, a box that goes on to the next line starts again there, and a line keeps room for its box to end after its last word
- pictures in the line, which stand on the baseline, so a line with text in it is as tall as the picture and the text below the baseline, as Word makes it. A line with a picture is at least as tall as a line of the picture's run's font, and its multiple line spacing adds a share of that, as Word's does
- tracked changes, as Word lays them out with its markup in balloons beside the page, or in Simple Markup. Deleted text (`DeletedTextRun`), and deleted pictures, tabs and breaks, take no room, nor does text moved elsewhere, and inserted text (`InsertedTextRun`) does. A paragraph whose mark is deleted (`run: { deletion }`) is joined to the next, all in the next one's formatting, style and list, and a section whose break is deleted goes on into the next, on its pages. A paragraph with no paragraph after it to join, before a table or at the end of a table cell or of the document, stays as it is. A footnote whose reference is deleted isn't laid out, but Word still counts it, so the footnotes after it keep their numbers. A deleted table row (`TableRow`'s `deletion`) takes no room in a table without borders between its rows (`borders: TableBorders.NONE`), nor does a table all of whose rows are deleted, but Word still sizes the columns of a table to their text, or widens them for long words, by its deleted rows and deleted text. Deleted and inserted cells, comments and changes of formatting don't move the lines. A document that asks Word to hide its insertions and deletions, or its markup (`w:revisionView`), is laid out the same, as Word for Mac opens it in its own view
- tables, with their columns' widths (`columnWidths`, or their cells' widths), their rows' heights, cell margins and borders. The columns of a table given no widths are sized to their text, as Word sizes them: each as wide as its longest line, or narrower when they don't all fit, but never narrower than its longest word, and a column whose cells give it a width keeps it. A cell merged across columns (`columnSpan`) widens them where its longest line needs more room, each in proportion to how wide it is, and a table in a cell counts as wide as its columns. In a table whose cells all have widths, a column with a word longer than its cells give it is widened to fit the word, and the other columns are narrowed to make room, as Word does, unless the table's layout is fixed. Rows break across pages between the lines of their cells, as Word breaks them, keeping to widow and orphan control and lines kept together, and with room on the page for the space after a cell's paragraph that ends there. They move to the next page whole when a cell would have none of its lines on the page, when they are kept whole (`cantSplit`), and when the page hasn't room for the height they are set to. A row kept whole, or whose paragraph is kept together, that is taller than a page moves to a new page and breaks there as other rows do, and a row set to a height taller than a page takes a page of its own, cut off at its bottom, as Word lays them out. Where a table breaks across pages, Word draws its bottom border below the last of it on the page, which takes room there too, or its cells' own bottom borders. Header rows are repeated at the top of each page and column a table is on. The text of a cell merged down rows (`verticalMerge`) goes down from the top of its first row across the others, and makes the last of them taller when it needs the room. Where one of its rows breaks across pages, its text breaks with the row, as far down the page as its lines go, keeping to widow control, as Word breaks it, and the rest of it goes on from the top of its rows on the next page
- table formatting, as Word lays it out. Borders come from the table's style and the table (`borders`), side by side, from its cells (`TableCell`'s `borders`), and from the parts of its style for some of its cells. Where two cells meet, Word draws the wider of their borders, and each row is as much taller as the widest border above its cells. Double, triple and the other styles of border take the room Word gives them, such as three times their width for a double border, and a border's `space` adds to it. A cell's text is as far in from a border beside it as its margin, or half the border when that is more. A row is as tall as its tallest cell's text, with the largest margins above and below of its cells, which needn't be the same cell's. Space between cells (`cellSpacing`) goes around each cell and inside the table's edges, and the table keeps its width, its columns narrowed for the space as Word narrows them. A row whose first cell's first paragraph is kept with the next (`keepNext`) is kept on the page with the next row, or, for the last row, with the paragraph after the table, and rows kept together that don't fit on a page of their own start a new page and break where it ends. Text that runs up or down a cell (`textDirection`) makes its row only as tall as a line of its paragraph mark, as Word breaks it into lines as long as the row is tall. A table sized to its text that is indented (`indent`) is sized in the room the indent leaves. The parts of a table style for some cells, such as its first row, its last column or its bands of rows, apply where the table turns them on (`tableLook`), and where it doesn't say, as Word turns them on: its first row and column and its bands of rows. In [templates](#templates), an empty last paragraph of a cell whose mark is hidden (`w:hideMark`) takes no room
- sections, with their page sizes, margins, columns, headers and footers, how they start, and their page numbering. Page numbers are written in Word's number formats as Word writes them, such as roman numerals, letters, words ("twenty-one") and the numbers of other languages, but for those it leaves blank (see below), and with chapter numbers in front of them (`chapterHeadingLevel`), such as 2-5 for page 5 of chapter 2. Each column's lines are broken at its own width, so a paragraph that goes on into a column of another width is broken again there, as Word breaks it. Widow control counts the lines left for the next column as they are broken in the column before, as Word counts them, and a table sized to its text keeps the widths it was sized to in each column it goes on into, as Word keeps them, going past the edge of a narrower one. Columns before a continuous section break are evened out, as Word evens them out, unless a column break is in them or a section in them started in the next column, and the next section starts below the longest. A section that starts in the next column (`SectionType.NEXT_COLUMN`) starts in the next column of the page when the section before has as many columns and one is left, as Word starts it, and on a new page otherwise. When its own columns are of other widths, it is laid out in the page's, where they are and as wide as they are, as Word lays it out, and in its own on the pages after. Its footnotes are laid out in its own columns. A continuous section numbered afresh (`pageNumbers: { start }`) leaves the page it starts on its number, and numbers the next on from its own first number, as Word does: 8 after a section numbered from 7 starts on page 12. When none of it fits on the page before, the page it starts at the top of is its first, numbered 7. One that starts in the next column of a page numbers on through the document, as Word numbers it. A gutter is beside the page's text, or above it in a document that puts it at the top (`w:gutterAtTop`), as Word takes it from the page's height. A paragraph kept together that is taller than a column goes down only the first column of each page, as Word lays it out, from the top of a new page unless it is at the top of this one, and what follows it goes on below it. In columns of different widths it does when it is taller than each of them. One taller than some of them but not others goes in the first column, from where it is, that it fits in, as Word moves it: from the top of a narrow first column to a wide second, and past a narrow second column to a new page. Paragraphs kept with the next before it go to the new page with it, unless they are at the top of the page already, and it moves on to the next page, as Word moves them, so they are alone on theirs. A section that ends with a table has a line below it for the empty paragraph that ends the section, as Word has it

## What it leaves blank

It stops at the first thing it can't lay out yet, and the page numbers of the headings and bookmarks after it are left blank, until the fields are updated in Word (see [Opening the document in Word](#opening-the-document-in-word)):

- a picture, shape or table that text wraps around (a table's `float`), a text box, or a text frame
- an equation
- a footnote that continues on the next page where it would break in a paragraph kept together or with the next after its first, in a table row whose lines could go on both pages, or right after a table's header rows; one that continues from a paragraph kept with a table, or with a paragraph that starts a new page, or onto a page of its own after a continuous section break; a footnote line, or a line and the start of its footnote, taller than a page; and a footnote that can't go on a page with its line, from a line below the top of a page, or with text after it that goes on to the next page, or another footnote below it
- a paragraph kept together that is taller than some of 3 or more columns of different widths but not others, and a paragraph kept with the next before one taller than some of the columns but not others
- endnotes that fill a page after the first they are on, below which Word puts a line more than the page has room for by the heights of the lines, in a way not yet followed, and endnotes in a section of columns that go on into the next column or page, where Word may put the continuation separator in a way not yet followed
- a footnote in columns that is too long for the columns of a page, or that moves its reference to the next page when the columns are laid out above it, footnotes referred to from two sections of different columns on one page, the first of them in columns, and a footnote in a section that starts in the next column when a column of the section before goes down further than it leaves room for
- a line in a table cell taller than a page, a table row kept whole or kept together that is taller than a column, a row whose text and set height are both taller than a page, and one set to a height taller than a page with a footnote or merged cells, or as a header row, and a row that breaks across pages with a table in it
- the text of a cell merged down table rows that goes on across a page break between its rows, or across more than two pages, and one that goes on across pages from a table's header rows, or with a footnote in it
- a line whose multiple line spacing would go below the bottom of the page in a table row that breaks across pages, into the footnotes at the bottom of the page, above its paragraph's border below, or below columns evened out before a continuous section break, and a line of only pictures in a paragraph whose mark is in a larger font than the pictures' runs
- a footnote in a table row that holds back lines of a cell beside it, which would fit on the page above the footnote, and a table row that fits on an empty page, but not with its footnote
- a table border in a style Word's PDFs haven't shown, such as a picture border, or a wave or 3D border of another width than half a point, 1.5 or 3 points, and two cells' borders of different styles where they meet
- space between a table's cells beside borders left or right of them, with a long word in a cell, or in a table wider than its cells, a row of a table with space between its cells and borders where the table breaks across pages, and a row of one that breaks across pages
- text that runs up or down a table cell in a row that breaks across pages, in a table sized to its text, with a word longer than its cell, or with paragraph marks of different sizes, a picture or a table in it
- a table row kept with the next before a row that then moves to the next page whole, such as one of a height that doesn't fit
- a table whose rows give a column different widths, a table given no widths of more than 63 columns, more than Word allows, and, in a table whose cells all have widths, a word longer than the table can make room for, a long word in a table wider than its cells, or one in a table with cells merged across its columns
- a long word in a cell merged across the columns of a table given no widths, which Word makes room for in a way not yet followed: a word longer than those columns' longest words together, when the table is narrowed to fit, or than their longest lines together, when more than one of them has anything in it
- text in a font that isn't in the width tables, isn't given as a file (see [Measuring fonts from their files](#measuring-fonts-from-their-files)) and isn't embedded in the document, such as Aptos, Georgia or Calibri Light, so its lines may not be where Word puts them: Word draws it with the font's own widths, or in another font when it doesn't have it, such as Cambria on the Mac. Bold text in a font given or embedded without a bold face stops too, as Word makes the bold face itself
- a character whose width in its font isn't known, so its line may not be where Word puts it: a letter or symbol its font doesn't have, or its font's file has no glyph for, which Word draws in another font, such as most mathematical symbols in Calibri, Arial and Courier New, which Word draws in Cambria Math; a few that Word drew in a way their widths can't be read from, such as Ž and Ё in Courier New; and a symbol font's own symbol, such as Wingdings' tick (`SymbolRun`), or a symbol whose character isn't four hexadecimal digits
- a document that hyphenates its words, compresses its punctuation, or uses Word's strict rules for the characters that can't start a line
- borders Word hasn't been seen to draw, or to lay out in a box: a style such as thin and thick lines with a medium gap or an art border, thin and thick lines narrower than half a point or wider than 2¼, a shadow on a style other than single, or a frame; two paragraphs with the same borders but for a border between them; a box of borders that goes on across a section break, or past a page break before a paragraph in it; and a border in a footnote, or on the empty paragraph that ends a section
- automatic spacing in a footnote, on the empty paragraph that ends a section, and between the paragraphs of other levels of a list, or of lists made from the same definition
- indents in characters where the size Word measures them in isn't known: a left or right indent of a paragraph whose mark is another size than its style, a right indent of text of another size than its mark, a first line indent of a list's paragraph whose number is another size than its text, and a hanging indent in characters with a left indent of 0 characters and one in twips, or a left indent in characters with a first line indent in twips
- a size given in a unit other than points, such as `size: "1cm"`, which Word ignores where no style gives a size, a negative length of a fraction of a centimeter or millimeter, and text lowered by a fraction of its unit, such as `position: "-2.5pt"`
- emphasis marks on a line with a picture, with marks both over and under text, at line spacing of less than a line, or between the spacing Word adds below the marks' room and the spacing that holds them, such as 1.25 lines, and with line spacing on a line taller than its fonts' own lines, such as one with raised text
- a border around text of a style or width Word hasn't been seen to draw, as for paragraphs above, or with a shadow or a frame, a tab or picture in text with a border, text with a border lined up with a right or centered tab stop, and a word with a border that is longer than its line
- a paragraph justified for Arabic with a medium or high kashida (`MEDIUM_KASHIDA` and `HIGH_KASHIDA`), and Thai or Arabic text in one justified for Thai or with a low kashida, whose lines Word hasn't been seen breaking, and a justified or distributed line that only fits with its spaces squeezed when it has an en, em or ideographic space, which Word hasn't been seen squeezing
- page numbers in Thai and Hindi words (`thaiCounting` and `hindiCounting`), and page numbers Word writes as an error: any in `none`, 0 in Hebrew, Arabic, Thai and Hindi digits and Chicago's symbols, and those past where a format's letters run out, such as 781 in letters. Page numbers in Hebrew past 100, and in Hindi letters past 75 (`hindiVowels`) and 37 (`hindiConsonants`), haven't been checked in Word yet
- a chapter number from a heading in a table
- tracked changes Word hasn't been seen laying out: a field only part of which is deleted, a paragraph mark moved elsewhere, a deleted paragraph mark at the edge of a content control, a deleted section break before a table, or between sections that start, number their pages or have headers and footers differently, a deleted endnote reference and a moved note reference, a list or a note in a deleted table row, a cell merged down from a deleted row with something in it, and a deleted row in a table with borders or space between its rows, as docx's tables have unless they are given none, or whose style formats some of its rows by where they are, such as its first row or its bands. So are a deleted picture, tab, break or note reference, and a deleted paragraph mark between paragraphs of text, in a table whose columns Word sizes to their text or widens for long words, as it does docx's tables unless their `layout` is `TableLayoutType.FIXED`
- a date or time (a `DATE` or `TIME` field, or a `DayLong`, `MonthLong`, `YearLong` and the like) in the text, a footnote or an endnote, as Word writes the date and time it opens the document, whose width changes with them. One in a header or footer is laid out as it is written
- a page reference that shows its position relative to the bookmark (`useRelativePosition`) in a footnote or endnote, which Word writes, but `docx` doesn't yet
- a page reference, number of pages or page number in a format other than those above, or with a picture Word's text isn't known for, as above, or past what its format writes, such as 781 in letters
- a document in compatibility mode, which Word lays out as an older version of Word did: one saved by Word 2010 or earlier, or by an application that writes an older mode, such as LibreOffice, or given an older `compatibility` `version`
- in [templates](#templates), what `docx` doesn't write and Word lays out in ways not yet followed: space between table cells as a share of the table's width or of a row's own, a table indented by a share of the width, a row with table properties of its own, a table style with formatting of its rows or cells, or a part of one for some cells with properties other than borders and margins, text in a table cell in a direction with East Asian characters upright, text with a phonetic guide, text fitted to a width or to its cell, two lines in one and horizontal in vertical text, ink and other content parts, a subdocument, a paragraph or table row in an HTML division, a table cell whose text doesn't wrap, cells merged across columns as old versions of Word wrote them, footnotes in columns of their own, footnotes or endnotes numbered afresh on each page, from a number of their own in a section after the first though they number on through the document, or in a format not yet written, footnotes anywhere but at the bottom of the page, endnotes at the end of each section, a footnote or endnote with a mark of its own in place of its number, a gutter at the top with mirrored margins or below a negative top margin, a content control Word fills in from custom XML when it opens the document, pages printed as a folded booklet or two to a sheet, and styles Word updates from the document's template when it opens it

When laying out the pages again with the page numbers it worked out still changes them after three passes, as when a table of contents wraps one way with a number and the other way without it, all of them are left blank, and `layoutDocument` lays out the pages without them.

A wrong page number is worse than a blank one, so it doesn't guess.

## How close it is

Text in fonts made with the same widths as those five is measured exactly as them: Carlito as Calibri, Caladea as Cambria, Liberation Sans, Arimo and Helvetica as Arial, Liberation Serif and Tinos as Times New Roman, and Liberation Mono and Cousine as Courier New. Text in the fonts the document embeds (`fonts`) is measured from their files, as Word draws it in them. Text in other fonts, such as Aptos, Office's default font since 2023, stops the layout (see [What it leaves blank](#what-it-leaves-blank)), unless their files are given (see [Measuring fonts from their files](#measuring-fonts-from-their-files)). Characters the width tables don't have, such as Hebrew, Arabic and Thai letters, box drawing, shapes such as the bullets ● and ■, and emoji, are measured as an average letter of the font, or an em for emoji. The Latin letters of the East Asian fonts that aren't monospaced, such as Yu Gothic, and East Asian fonts Office doesn't have stop the layout too.

Each change to `docx/layout` is checked against LibreOffice's layout of a set of documents, and against the pages Word marked in documents it saved. Word lays out some things differently from LibreOffice, so turn `updateFields` on if the page numbers must be Word's own once the document is opened in Word: Word then asks to update the fields, and works them out again. LibreOffice rounds the height of each line to whole twips, 269 for Calibri 11, so where a line only just fits on a page, it can be on the next page in LibreOffice and on this one in Word, and in `docx/layout`, which follows Word.

Laying out a document takes about 0.3 seconds per 100 pages in Node.

## Measuring with a page's fonts

By default, text is measured with tables of the widths of the characters of those five fonts, which `docx/layout` has with it, so it lays out the same pages in Node and in every browser. In a browser, it can measure text in the fonts the page has instead, with [Pretext](https://github.com/chenglou/pretext), which measures text with a canvas.

`docx` doesn't come with Pretext. Install it (`npm install @chenglou/pretext`), give its module to `measureWithPretext`, and give what that returns to `estimatePageNumbersWith`, as `measureWidth`:

```ts live
import * as pretext from "@chenglou/pretext";
import { Document, HeadingLevel, Paragraph, TableOfContents, TextRun } from "docx";
import { estimatePageNumbersWith, measureWithPretext } from "docx/layout";

// Until a font has loaded, the browser measures text in another one
await document.fonts.ready;

const text = "The harbour was rebuilt after the storm, and this report sets out what it cost and what is left to do. ".repeat(14);

const doc = new Document({
    features: { updateFields: true },
    pageNumbers: estimatePageNumbersWith({
        // Carlito is as wide as Calibri, for a page that has it and not Calibri
        measureWidth: measureWithPretext(pretext, { fontFamilies: { Calibri: "Calibri, Carlito, sans-serif" } }),
    }),
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [
        {
            children: [
                new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-3" }),
                ...[1, 2, 3, 4].flatMap((chapter) => [
                    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(`Chapter ${chapter}`)] }),
                    new Paragraph(text),
                ]),
            ],
        },
    ],
});
```

Pretext only measures how wide words and spaces are. The rest is laid out as Word lays it out: lines break where Word breaks them, rather than where a browser would, tabs move to the paragraph's tab stops, and lines are as tall as Word makes them. Their heights still come from the tables, so the layout stops at text in a font that isn't in them, such as Aptos, as how tall Word makes its lines isn't known, unless its file is given too (see [Measuring fonts from their files](#measuring-fonts-from-their-files)) or the document embeds it.

- Pretext needs a canvas to measure with: an `OffscreenCanvas`, or a page's. Node has neither, so use `estimatePageNumbers` there.
- Load the fonts before the document is written, such as with `document.fonts.load('11pt "Calibri"')`. A font that hasn't loaded is measured as the browser's default font, and Pretext keeps the widths it measured.
- A font the page has under another name, such as a web font, is measured in the CSS font family `fontFamilies` gives it. Fonts not in it are measured in the font of their own name, or the browser's default font when the page doesn't have one.
- The page numbers are only as close to Word's as the page's fonts are to the fonts Word has. Laid out in Chrome with Word's own fonts, the headings of the documents `docx/layout` is checked against were all on Word's page.

`measureWidth` can be any function that measures how wide text is, in points, in a font with a name, size in points, and whether it is bold or italic:

```ts
import { estimatePageNumbersWith } from "docx/layout";

const canvas = new OffscreenCanvas(1, 1).getContext("2d")!;

const estimatePageNumbers = estimatePageNumbersWith({
    measureWidth: (text, { name, size, bold, italic }) => {
        canvas.font = `${italic ? "italic " : ""}${bold ? "bold " : ""}${size}pt "${name}"`;
        return canvas.measureText(text).width * 0.75;
    },
});
```

Space between characters, and text scaled wider or narrower, are added to what it measures, as the document's formatting gives them.

## Measuring fonts from their files

To measure text in other fonts as Word does, in Node or in a browser, give `estimatePageNumbersWith` their font files, as `fonts`:

```ts
import { readFile } from "node:fs/promises";
import { Document } from "docx";
import { estimatePageNumbersWith } from "docx/layout";

const doc = new Document({
    pageNumbers: estimatePageNumbersWith({
        fonts: [
            { data: await readFile("Aptos.ttf") },
            { data: await readFile("Aptos-Bold.ttf") },
            { data: await readFile("Aptos-Italic.ttf") },
        ],
    }),
    styles: { default: { document: { run: { font: "Aptos", size: 24 } } } },
    sections: [...],
});
```

In a browser, give it the bytes of a file the page fetched, such as `await (await fetch("Aptos.ttf")).arrayBuffer()`. `docx` doesn't come with any font files.

- **The files** are TrueType or OpenType fonts (`.ttf` or `.otf`), or collections of them (`.ttc`), as bytes: a `Uint8Array`, such as a Node `Buffer`, or an `ArrayBuffer`. Web fonts (`.woff` and `.woff2`) are compressed, and can't be read.
- **Each file is one face of a font,** such as Aptos Bold, **or a collection of faces,** such as Cambria and Cambria Math in `cambria.ttc`, each of which is measured. The name of each face and whether it is bold or italic are read from it. Give a file for each face the document uses. Bold text in a font without a bold file is measured as it would be without the files, so it stops the layout when the font isn't in the width tables, as Word makes the bold face itself, and italic text without an italic file is measured with the upright one. To measure a font with a file of another name, give the name the document uses, such as `{ data: carlito, name: "Calibri" }`, which every face in the file is given.
- **Widths** are the font's own. The layout stops at a character the file has no glyph for, as Word draws it in another font (see [What it leaves blank](#what-it-leaves-blank)).
- **Kerning** is applied as Word applies it: only to text that asks for it, with `kern` on a run or a style (`w:kern`), and only to text of that size or larger. `kern: 2` kerns text from 1 point, as Word's own Normal template does. The pairs are the font's, from its `GPOS` table, or its `kern` table when it has no `GPOS` table, and pairs across runs in the same font are kerned too.
- **The height of a line** is the font's, as Word works it out: its ascent and descent for Windows and the gap between lines it adds to them, or its typographic ascent, descent and line gap when the font says to use them, as Aptos does. The line goes that descent below its baseline, with the gap above the text, which is what a line of it and another font, or a picture, is made from.

Text in fonts without files is measured as it is without them: with the width tables, or as `measureWidth` measures it when it is given too.

### Fonts the document embeds

Text in the fonts a document embeds is measured from the files it embeds, with nothing more given to the estimator: the fonts `docx` embeds with the `fonts` option, each as the regular face of the font of the name it is given, and those a template Word saved embeds ("Embed fonts in the file"), each as the face Word embedded it as. Bold text in a font embedded without a bold face stops the layout, as it does with a file given without one. A file the document embeds that isn't a font, or is damaged, is left out, so text in its font stops the layout. When a font the document embeds is given as a file too, the document's own file is measured.

```ts
import { readFile } from "node:fs/promises";
import { Document } from "docx";
import { estimatePageNumbers } from "docx/layout";

const doc = new Document({
    pageNumbers: estimatePageNumbers,
    fonts: [{ name: "Pacifico", data: await readFile("Pacifico.ttf") }],
    styles: { default: { document: { run: { font: "Pacifico", size: 22 } } } },
    sections: [...],
});
```
