# Change Tracking

> Instead of adding a `TextRun` into a `Paragraph`, you can also add an `InsertedTextRun` or `DeletedTextRun` where you need to supply an `id`, `author` and `date` for the change.

```ts
import { Paragraph, TextRun, InsertedTextRun, DeletedTextRun } from "docx";

const paragraph = new Paragraph({
    children: [
        new TextRun("This is a simple demo "),
        new TextRun({
            text: "on how to "
        }),
        new InsertedTextRun({
            text: "mark a text as an insertion ",
            id: 0,
            author: "Firstname Lastname",
            date: "2020-10-06T09:00:00Z",
        }),
        new DeletedTextRun({
            text: "or a deletion.",
            id: 1,
            author: "Firstname Lastname",
            date: "2020-10-06T09:00:00Z",
        })
    ],
});
```

Note that for a `InsertedTextRun` and `DeletedTextRun`, it is not possible to simply call it with only a text as in `new TextRun("some text")`, since the additonal fields for change tracking need to be provided. Similar to a normal `TextRun` you can add additional text properties.

```ts
import { Paragraph, TextRun, InsertedTextRun, DeletedTextRun } from "docx";

const paragraph = new Paragraph({
    children: [
        new TextRun("This is a simple demo"),
        new DeletedTextRun({
            text: "with a deletion.",
            color: "red",
            bold: true,
            size: 24,
            id: 0,
            author: "Firstname Lastname",
            date: "2020-10-06T09:00:00Z",
        })
    ],
});
```

In addtion to marking text as inserted or deleted, change tracking can also be added via the document settings. This will enable new changes to be tracked as well.

```ts
import { Document } from "docx";

const doc = new Document({
    features: {
        trackRevisions: true,
    },
});
```
