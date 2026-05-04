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
                id: 0,
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
                        new CommentRangeStart(0),
                        new TextRun("This text has a comment."),
                        new CommentRangeEnd(0),
                        new CommentReference(0),
                    ],
                }),
            ],
        },
    ],
});
```

## Comment Options

| Property | Type          | Notes    | Description                                      |
| -------- | ------------- | -------- | ------------------------------------------------ |
| id       | `number`      | Required | Unique identifier                                |
| author   | `string`      | Optional | Comment author name                              |
| date     | `Date`        | Optional | Comment timestamp                                |
| initials | `string`      | Optional | Author initials                                  |
| children | `Paragraph[]` | Required | Comment content                                  |
| parentId | `number`      | Optional | ID of parent comment for reply threading         |
| resolved | `boolean`     | Optional | Whether the comment thread is marked as resolved |

## Point Comment

Add a comment at a specific point (not a range):

```ts
new Paragraph({
    children: [
        new TextRun("Check this point"),
        new CommentReference(0), // Comment appears here
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
                id: 0,
                author: "Alice",
                date: new Date("2024-01-15"),
                children: [new Paragraph("First comment")],
            }),
            new Comment({
                id: 1,
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
                        new CommentRangeStart(0),
                        new TextRun("Text with first comment."),
                        new CommentRangeEnd(0),
                        new CommentReference(0),
                        new TextRun(" "),
                        new CommentRangeStart(1),
                        new TextRun("Text with second comment."),
                        new CommentRangeEnd(1),
                        new CommentReference(1),
                    ],
                }),
            ],
        },
    ],
});
```

## Reply Threads

Create comment replies using the `parentId` property to build a thread. Reply comments must also have `CommentRangeStart`, `CommentRangeEnd`, and `CommentReference` wrapping the same text as their parent:

```ts
const doc = new Document({
    comments: {
        children: [
            {
                id: 0,
                author: "Alice",
                date: new Date("2024-01-15"),
                children: [new Paragraph("Is this correct?")],
            },
            {
                id: 1,
                author: "Bob",
                date: new Date("2024-01-16"),
                parentId: 0, // This is a reply to comment 0
                children: [new Paragraph("Yes, I verified it.")],
            },
            {
                id: 2,
                author: "Alice",
                date: new Date("2024-01-17"),
                parentId: 0, // Another reply to comment 0
                children: [new Paragraph("Thanks for checking!")],
            },
        ],
    },
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new CommentRangeStart(0),
                        new CommentRangeStart(1),
                        new CommentRangeStart(2),
                        new TextRun("Text with a comment thread."),
                        new CommentRangeEnd(0),
                        new TextRun({ children: [new CommentReference(0)] }),
                        new CommentRangeEnd(1),
                        new TextRun({ children: [new CommentReference(1)] }),
                        new CommentRangeEnd(2),
                        new TextRun({ children: [new CommentReference(2)] }),
                    ],
                }),
            ],
        },
    ],
});
```

## Resolved Comments

Mark a comment thread as resolved using the `resolved` property.

```ts
comments: {
    children: [
        {
            id: 0,
            author: "Charlie",
            date: new Date("2024-01-15"),
            children: [new Paragraph("This timeline needs updating.")],
        },
        {
            id: 1,
            author: "Diana",
            date: new Date("2024-01-16"),
            parentId: 0,
            resolved: true, // Marks this thread as resolved
            children: [new Paragraph("Done - updated the dates.")],
        },
    ],
}
```

## Rich Text Comments

Comments can contain formatted text:

```ts
new Comment({
    id: 0,
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
                id: 0,
                author: "Editor",
                date: new Date(),
                children: [new Paragraph("Consider rephrasing this for clarity.")],
            }),
            new Comment({
                id: 1,
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
                        new CommentRangeStart(0),
                        new TextRun("company achieved remarkable growth"),
                        new CommentRangeEnd(0),
                        new CommentReference(0),
                        new TextRun(" this quarter. "),
                        new CommentRangeStart(1),
                        new TextRun("Revenue increased by 25%"),
                        new CommentRangeEnd(1),
                        new CommentReference(1),
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

### Basic usage

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/73-comments.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/73-comments.ts_

### Comment Replies and Resolved state

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/101-comment-replies.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/101-comment-replies.ts_
