# Table of Contents

You can generate table of contents with `docx`. More information can be found [here](http://officeopenxml.com/WPtableOfContents.php).

A Table of Contents is a field. `docx` writes it with an entry for each heading it includes, linked to the heading, so it isn't empty when the document is opened, whether or not the application updates fields.

The page numbers depend on how the document is laid out on the page, so `docx` leaves them for Word to fill in when it updates the field. With `updateFields` on, Word asks "This document contains fields that may refer to other files. Do you want to update the fields in this document?" when the document is opened. Say yes, and Word fills in the page numbers. Applications that don't update fields, such as LibreOffice, show the entries without page numbers until the table is updated there.

To write the page numbers with the document, give it `pageNumbers: estimatePageNumbers` from `docx/layout`, which lays out its pages as Word would. Word then shows them as they are written. With `updateFields` off, and every page number written, Word opens the document without asking to update the fields. See [Layout](usage/layout.md#opening-the-document-in-word) for what still makes it ask.

The complete documentation can be found [here](https://www.ecma-international.org/publications/standards/Ecma-376.htm) (at Part 1, Page 1251).

## How to

All you need to do is create a `TableOfContents` object and assign it to the document.

**Note**: turn on the `updateFields` feature, so Word fills in the page numbers when the document is opened.

```ts live
import { Document, HeadingLevel, Paragraph, TableOfContents } from "docx";

const doc = new Document({
    features: {
        updateFields: true,
    },
    sections: [
        {
            children: [
                new TableOfContents("Summary", {
                    hyperlink: true,
                    headingStyleRange: "1-5",
                }),
                new Paragraph({
                    text: "Header #1",
                    heading: HeadingLevel.HEADING_1,
                    pageBreakBefore: true,
                }),
            ],
        },
    ],
});
```

## Entries from the headings

The entries are written for the paragraphs the options include, as Word includes them:

- `headingStyleRange` (`\o`): paragraphs with the built-in heading styles in the range, such as `HeadingLevel.HEADING_1` to `HeadingLevel.HEADING_3` for `"1-3"`
- `stylesWithLevels` (`\t`): paragraphs with the styles listed, by id or name, at their levels
- `useAppliedParagraphOutlineLevel` (`\u`): paragraphs by their outline level, or their style's
- `entriesFromBookmark` (`\b`): only the paragraphs in the bookmark

With none of these, the headings Heading 1 to Heading 9 are included. Each entry uses the `TOC1` to `TOC9` paragraph style for its level. When the document doesn't define that style, the entry is indented as Word's is. A Table of Contents of captions or of TC fields (`captionLabel`, `captionLabelIncludingNumbers`, `tcFieldIdentifier` or `tcFieldLevelRange` alone) is left empty for Word to fill in.

## Table of Contents Options

Here is the list of all options that you can use to generate your tables of contents:

| Option                          | Type         | TOC Field Switch | Description                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------- | ------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| captionLabel                    | string       | `\a`             | Includes captioned items, but omits caption labels and numbers. The identifier designated by `text` in this switch's field-argument corresponds to the caption label. Use `\c` to build a table of captions with labels and numbers.                                                                                                                                                                             |
| entriesFromBookmark             | string       | `\b`             | Includes entries only from the portion of the document marked by the bookmark named by `text` in this switch's field-argument.                                                                                                                                                                                                                                                                                   |
| captionLabelIncludingNumbers    | string       | `\c`             | Includes figures, tables, charts, and other items that are numbered by a SEQ field (§17.16.5.56). The sequence identifier designated by `text` in this switch's field-argument, which corresponds to the caption label, shall match the identifier in the corresponding SEQ field.                                                                                                                               |
| sequenceAndPageNumbersSeparator | string       | `\d`             | When used with `\s`, the `text` in this switch's field-argument defines the separator between sequence and page numbers. The default separator is a hyphen (-).                                                                                                                                                                                                                                                  |
| tcFieldIdentifier               | string       | `\f`             | Includes only those TC fields whose identifier exactly matches the `text` in this switch's field-argument (which is typically a letter).                                                                                                                                                                                                                                                                         |
| hyperlink                       | boolean      | `\h`             | Makes the table of contents entries hyperlinks.                                                                                                                                                                                                                                                                                                                                                                  |
| tcFieldLevelRange               | string       | `\l`             | Includes TC fields that assign entries to one of the levels specified by `text` in this switch's field-argument as a range having the form startLevel-endLevel, where startLevel and endLevel are integers, and startLevel has a value equal-to or less-than endLevel. TC fields that assign entries to lower levels are skipped.                                                                                |
| pageNumbersEntryLevelsRange     | string       | `\n`             | Without field-argument, omits page numbers from the table of contents. Page numbers are omitted from all levels unless a range of entry levels is specified by `text` in this switch's field-argument. A range is specified as for `\l`.                                                                                                                                                                         |
| headingStyleRange               | string       | `\o`             | Uses paragraphs formatted with all or the specified range of builtin heading styles. Headings in a style range are specified by `text` in this switch's field-argument using the notation specified as for `\l`, where each integer corresponds to the style with a style ID of HeadingX (e.g. 1 corresponds to Heading1). If no heading range is specified, all heading levels used in the document are listed. |
| entryAndPageNumberSeparator     | string       | `\p`             | `text` in this switch's field-argument specifies a sequence of characters that separate an entry and its page number. The default is a tab with leader dots.                                                                                                                                                                                                                                                     |
| seqFieldIdentifierForPrefix     | string       | `\s`             | For entries numbered with a SEQ field (§17.16.5.56), adds a prefix to the page number. The prefix depends on the type of entry. `text` in this switch's field-argument shall match the identifier in the SEQ field.                                                                                                                                                                                              |
| stylesWithLevels                | StyleLevel[] | `\t`             | Uses paragraphs formatted with styles other than the built-in heading styles. `text` in this switch's field-argument specifies those styles as a set of comma-separated doublets, with each doublet being a comma-separated set of style name and table of content level. `\t` can be combined with `\o`.                                                                                                        |
| useAppliedParagraphOutlineLevel | boolean      | `\u`             | Uses the applied paragraph outline level.                                                                                                                                                                                                                                                                                                                                                                        |
| preserveTabInEntries            | boolean      | `\w`             | Preserves tab entries within table entries.                                                                                                                                                                                                                                                                                                                                                                      |
| preserveNewLineInEntries        | boolean      | `\x`             | Preserves newline characters within table entries.                                                                                                                                                                                                                                                                                                                                                               |
| hideTabAndPageNumbersInWebView  | boolean      | `\z`             | Hides tab leader and page numbers in web page view (§17.18.102).                                                                                                                                                                                                                                                                                                                                                 |

## Cached entries

By default, the entries are written from the headings, without page numbers. If you want to write the entries yourself, such as with page numbers you know, you can provide them via the `cachedEntries` option instead. Word will still prompt to update the field, but the cached content is visible before that happens.

Each entry is a `ToCEntry` object with the following properties:

| Property | Type   | Required | Description                                                                      |
| -------- | ------ | -------- | -------------------------------------------------------------------------------- |
| `title`  | string | Yes      | The display text of the TOC entry                                                |
| `level`  | number | Yes      | The heading level (1-based, maps to `TOC1`, `TOC2`, … paragraph styles)          |
| `page`   | number | No       | The page number to display                                                       |
| `href`   | string | No       | Bookmark anchor ID for an internal hyperlink (requires `hyperlink: true` on TOC) |

Entry indentation comes from paragraph styles applied to each level. The defaults are `TOC1`, `TOC2`, etc. You can override these with the `stylesWithLevels` (`\t`) option — entries will use the style whose `level` matches the entry's `level`.

```ts live
import { Bookmark, Document, HeadingLevel, Paragraph, TableOfContents } from "docx";

const doc = new Document({
    features: {
        updateFields: true,
    },
    sections: [
        {
            children: [
                new TableOfContents("Summary", {
                    hyperlink: true,
                    headingStyleRange: "1-5",
                    cachedEntries: [
                        {
                            title: "Header #1",
                            level: 1,
                            page: 1,
                            href: "anchorForHeader1",
                        },
                        {
                            title: "Header #2",
                            level: 1,
                            page: 2,
                        },
                        {
                            title: "Header #2.1",
                            level: 2,
                        },
                    ],
                }),
                new Paragraph({
                    text: "Header #1",
                    heading: HeadingLevel.HEADING_1,
                    pageBreakBefore: true,
                    children: [
                        new Bookmark({
                            id: "anchorForHeader1",
                            children: [],
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

## Additional Options

These options control the TOC structure rather than field switches:

| Option          | Type                         | Default | Description                                                                                                                                                                                                                                                                                                                  |
| --------------- | ---------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| contentChildren | `(XmlComponent \| string)[]` | `[]`    | Additional content to include inside the TOC between the field begin and end markers. Useful for placeholder entries.                                                                                                                                                                                                        |
| beginDirty      | `boolean`                    | `true`  | When `true`, marks the field as needing update, prompting Word to regenerate the TOC on open. When it isn't given, a table filled in from the headings isn't marked once the document's `pageNumbers` has written all of its page numbers, so Word doesn't ask (see [Layout](usage/layout.md#opening-the-document-in-word)). |

### Example with contentChildren

You can provide placeholder content that will be displayed until the TOC is updated:

```ts live
import { Document, HeadingLevel, Paragraph, TableOfContents } from "docx";

const doc = new Document({
    features: {
        updateFields: true,
    },
    sections: [
        {
            children: [
                new TableOfContents("Summary", {
                    hyperlink: true,
                    headingStyleRange: "1-5",
                    contentChildren: [new Paragraph({ text: "Chapter 1..........1" }), new Paragraph({ text: "Chapter 2..........5" })],
                }),
                new Paragraph({ text: "Chapter 1", heading: HeadingLevel.HEADING_1, pageBreakBefore: true }),
                new Paragraph({ text: "Chapter 2", heading: HeadingLevel.HEADING_1, pageBreakBefore: true }),
            ],
        },
    ],
});
```

## Examples

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/fields/table-of-contents.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/fields/table-of-contents.ts_
