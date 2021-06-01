# Table of Contents

You can generate table of contents with `docx`. More information can be found [here](http://officeopenxml.com/WPtableOfContents.php).

> Tables of Contents are fields and, by design, it's content is only generated or updated by Word. We can't do it programmatically.
> This is why, when you open a the file, Word you will prompt the message "This document contains fields that may refer to other files. Do you want to update the fields in this document?".
> You have say yes to Word generate the content of all table of contents.

The complete documentation can be found [here](https://www.ecma-international.org/publications/standards/Ecma-376.htm) (at Part 1, Page 1251).

## How to

All you need to do is create a `TableOfContents` object and assign it to the document.

**Note**: updateFields feature must be enabled for TableOfContents to update correctly.

```ts
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
            ]
        }
    ]
});
```

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

## Examples

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/28-table-of-contents.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/28-table-of-contents.ts_
