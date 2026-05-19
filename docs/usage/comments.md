# Comments

!> Comments require an understanding of [Sections](usage/sections.md) and [Paragraphs](usage/paragraph.md).

Comments allow you to add annotations to specific parts of your document, similar to the review feature in Microsoft Word.

## Overview

To add comments in `docx`:

1. Define all comments in the `comments` block of the `Document`
2. Each comment has a unique `id`
3. Mark where comments appear using `CommentRangeStart`, `CommentRangeEnd`, and `CommentReference`

## Basic Comment

Add a comment to a range of text:

```ts
import { Comment, CommentRangeEnd, CommentRangeStart, CommentReference, Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    comments: {
        children: [
            new Comment({
                id: "0",
                author: "John Smith",
                date: new Date(),
                children: [new Paragraph("This needs to be reviewed.")],
            }),
        ],
    },
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun("This is normal text. "),
                        new CommentRangeStart("0"),
                        new TextRun("This text has a comment."),
                        new CommentRangeEnd("0"),
                        new CommentReference("0"),
                    ],
                }),
            ],
        },
    ],
});
```

## Comment Options

| Property | Type          | Notes    | Description         |
| -------- | ------------- | -------- | ------------------- |
| id       | `string`      | Required | Unique identifier   |
| author   | `string`      | Optional | Comment author name |
| date     | `Date`        | Optional | Comment timestamp   |
| initials | `string`      | Optional | Author initials     |
| children | `Paragraph[]` | Required | Comment content     |

## Point Comment

Add a comment at a specific point (not a range):

```ts
new Paragraph({
    children: [
        new TextRun("Check this point"),
        new CommentReference("0"), // Comment appears here
    ],
});
```

## Multiple Comments

Add several comments to a document:

```ts
const doc = new Document({
    comments: {
        children: [
            new Comment({
                id: "0",
                author: "Alice",
                date: new Date("2024-01-15"),
                children: [new Paragraph("First comment")],
            }),
            new Comment({
                id: "1",
                author: "Bob",
                date: new Date("2024-01-16"),
                children: [new Paragraph("Second comment")],
            }),
        ],
    },
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new CommentRangeStart("0"),
                        new TextRun("Text with first comment."),
                        new CommentRangeEnd("0"),
                        new CommentReference("0"),
                        new TextRun(" "),
                        new CommentRangeStart("1"),
                        new TextRun("Text with second comment."),
                        new CommentRangeEnd("1"),
                        new CommentReference("1"),
                    ],
                }),
            ],
        },
    ],
});
```

## Reply Threads

Create comment replies using the `parentId` property to build a thread:

```ts
comments: {
    children: [
        new Comment({
            id: "0",
            author: "Alice",
            date: new Date("2024-01-15"),
            children: [new Paragraph("Is this correct?")],
        }),
        new Comment({
            id: "1",
            author: "Bob",
            date: new Date("2024-01-16"),
            parentId: "0",  // This is a reply to comment "0"
            children: [new Paragraph("Yes, I verified it.")],
        }),
        new Comment({
            id: "2",
            author: "Alice",
            date: new Date("2024-01-17"),
            parentId: "0",  // Another reply to comment "0"
            children: [new Paragraph("Thanks for checking!")],
        }),
    ],
}
```

## Rich Text Comments

Comments can contain formatted text:

```ts
new Comment({
    id: "0",
    author: "Reviewer",
    children: [
        new Paragraph({
            children: [new TextRun({ text: "Important: ", bold: true }), new TextRun("Please verify the figures in this section.")],
        }),
        new Paragraph("See page 12 of the source document."),
    ],
});
```

## Complete Example

Document with review comments:

```ts
import { Comment, CommentRangeEnd, CommentRangeStart, CommentReference, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import * as fs from "fs";

const doc = new Document({
    comments: {
        children: [
            new Comment({
                id: "suggestion",
                author: "Editor",
                date: new Date(),
                children: [new Paragraph("Consider rephrasing this for clarity.")],
            }),
            new Comment({
                id: "fact-check",
                author: "Fact Checker",
                date: new Date(),
                children: [
                    new Paragraph({
                        children: [new TextRun({ text: "Verified ", bold: true }), new TextRun("- Source: Annual Report 2023")],
                    }),
                ],
            }),
        ],
    },
    sections: [
        {
            children: [
                new Paragraph({
                    text: "Quarterly Report",
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                    children: [
                        new TextRun("Our "),
                        new CommentRangeStart("suggestion"),
                        new TextRun("company achieved remarkable growth"),
                        new CommentRangeEnd("suggestion"),
                        new CommentReference("suggestion"),
                        new TextRun(" this quarter. "),
                        new CommentRangeStart("fact-check"),
                        new TextRun("Revenue increased by 25%"),
                        new CommentRangeEnd("fact-check"),
                        new CommentReference("fact-check"),
                        new TextRun(" compared to last year."),
                    ],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("document.docx", buffer);
});
```

## Demo

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/73-comments.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/73-comments.ts_
