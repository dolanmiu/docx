# Bookmarks

!> Bookmarks require an understanding of [Paragraphs](usage/paragraph.md) and [Hyperlinks](usage/hyperlinks.md).

Bookmarks allow you to create anchors within a document that can be referenced by internal hyperlinks, enabling navigation within the same document.

## Creating Bookmarks

A bookmark is an anchor point in your document with a unique identifier. Create one using the `Bookmark` component:

```ts
import { Bookmark, Paragraph, TextRun, HeadingLevel } from "docx";

const bookmarkedHeading = new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [
        new Bookmark({
            id: "chapter1",
            children: [new TextRun("Chapter 1: Introduction")],
        }),
    ],
});
```

### Bookmark Options

| Property | Type        | Notes    | Description                        |
| -------- | ----------- | -------- | ---------------------------------- |
| id       | `string`    | Required | Unique identifier for the anchor   |
| children | `TextRun[]` | Required | Content to display at the bookmark |

## Internal Hyperlinks

Use `InternalHyperlink` to create clickable links that navigate to bookmarks:

```ts
import { InternalHyperlink, Paragraph, TextRun } from "docx";

const linkToChapter = new Paragraph({
    children: [
        new InternalHyperlink({
            children: [
                new TextRun({
                    text: "Go to Chapter 1",
                    style: "Hyperlink",
                }),
            ],
            anchor: "chapter1",
        }),
    ],
});
```

?> Use `style: "Hyperlink"` on your TextRun to apply the default hyperlink styling (blue text, underlined).

## Page References

Get the page number where a bookmark appears using `PageReference`:

```ts
import { PageReference, Paragraph, TextRun } from "docx";

const pageRef = new Paragraph({
    children: [new TextRun("See Chapter 1 on page "), new PageReference("chapter1")],
});
```

This creates dynamic text like "See Chapter 1 on page 5" that updates automatically.

## Complete Example

Here's a full example with a table of contents linking to bookmarked sections:

```ts
import { Bookmark, Document, HeadingLevel, InternalHyperlink, Packer, PageBreak, PageReference, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                // Table of Contents
                new Paragraph({
                    text: "Table of Contents",
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                    children: [
                        new InternalHyperlink({
                            children: [new TextRun({ text: "Chapter 1", style: "Hyperlink" })],
                            anchor: "chapter1",
                        }),
                        new TextRun(" - page "),
                        new PageReference("chapter1"),
                    ],
                }),
                new Paragraph({
                    children: [
                        new InternalHyperlink({
                            children: [new TextRun({ text: "Chapter 2", style: "Hyperlink" })],
                            anchor: "chapter2",
                        }),
                        new TextRun(" - page "),
                        new PageReference("chapter2"),
                    ],
                }),

                // Page break to Chapter 1
                new Paragraph({ children: [new PageBreak()] }),

                // Chapter 1
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    children: [
                        new Bookmark({
                            id: "chapter1",
                            children: [new TextRun("Chapter 1: Getting Started")],
                        }),
                    ],
                }),
                new Paragraph("Content of chapter 1..."),

                // Page break to Chapter 2
                new Paragraph({ children: [new PageBreak()] }),

                // Chapter 2
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    children: [
                        new Bookmark({
                            id: "chapter2",
                            children: [new TextRun("Chapter 2: Advanced Topics")],
                        }),
                    ],
                }),
                new Paragraph("Content of chapter 2..."),
            ],
        },
    ],
});
```

## Using in Headers and Footers

Bookmarks and internal hyperlinks work in headers and footers too:

```ts
import { Footer, InternalHyperlink, Paragraph, TextRun } from "docx";

const footer = new Footer({
    children: [
        new Paragraph({
            children: [
                new InternalHyperlink({
                    children: [new TextRun({ text: "Back to Top", style: "Hyperlink" })],
                    anchor: "documentStart",
                }),
            ],
        }),
    ],
});
```

## Styling Internal Hyperlinks

You can apply custom formatting to internal hyperlinks:

```ts
new InternalHyperlink({
    children: [
        new TextRun({
            text: "Bold ",
            bold: true,
            style: "Hyperlink",
        }),
        new TextRun({
            text: "Link",
            style: "Hyperlink",
        }),
    ],
    anchor: "myBookmark",
});
```

## Demo

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/21-bookmarks.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/21-bookmarks.ts_
