# Document Protection

Protect a document so that people can't change it in Word, or can only add comments, make tracked changes or fill in forms. This is what Word's **Review > Restrict Editing** does. Parts of a protected document can stay editable for everyone, so the rest of it is read-only.

!> Protection stops changes in Word. The document isn't encrypted: anyone can still read it, and someone who edits the file's XML can take the protection out.

## Read-only Documents

Set the document's `protection` option:

```ts live
import { Document, DocumentProtectionType, Paragraph } from "docx";

const doc = new Document({
    protection: {
        type: DocumentProtectionType.READ_ONLY,
    },
    sections: [
        {
            children: [new Paragraph("This document is read-only in Word.")],
        },
    ],
});
```

Without a password, anyone can turn the protection off in Word, with **Stop Protection** in the Restrict Editing pane.

## Passwords

Give a `password` so that only people who know it can turn the protection off:

```ts live
import { Document, DocumentProtectionType, Paragraph } from "docx";

const doc = new Document({
    protection: {
        type: DocumentProtectionType.READ_ONLY,
        password: "secret",
    },
    sections: [
        {
            children: [new Paragraph("Only people who know the password can change this document.")],
        },
    ],
});
```

The document keeps a hash of the password, never the password. It is hashed as Word hashes it, 100,000 times with a random salt, though with SHA-256 rather than the SHA-512 Word uses, as SHA-256 is much faster in JavaScript. Word reads either. Word only reads the first 15 characters of a password, and an empty password is no password.

## Protection Options

| Property | Type                     | Notes    | Description                                        |
| -------- | ------------------------ | -------- | -------------------------------------------------- |
| type     | `DocumentProtectionType` | Required | What people can change in the document             |
| password | `string`                 | Optional | The password that turns the protection off in Word |

## Protection Types

| Type                                     | Word's name      | What people can change                                            |
| ---------------------------------------- | ---------------- | ----------------------------------------------------------------- |
| `DocumentProtectionType.READ_ONLY`       | No changes       | Nothing, except the [editable ranges](#editable-ranges)           |
| `DocumentProtectionType.COMMENTS`        | Comments         | They can only add comments, and change the editable ranges        |
| `DocumentProtectionType.TRACKED_CHANGES` | Tracked changes  | Anything, but every change is [tracked](usage/change-tracking.md) |
| `DocumentProtectionType.FORMS`           | Filling in forms | They can only fill in the form fields                             |

```ts live
import { Document, DocumentProtectionType, Paragraph } from "docx";

const doc = new Document({
    protection: {
        type: DocumentProtectionType.TRACKED_CHANGES,
    },
    sections: [
        {
            children: [new Paragraph("Every change made to this document in Word is tracked.")],
        },
    ],
});
```

## Editable Ranges

To keep parts of a protected document editable, put them between an `EditableRangeStart` and an `EditableRangeEnd` with the same id. Anyone can change what is between them, and Word highlights it. The ids only have to be different from each other's.

A range can be part of a paragraph, or start in one paragraph and end in a later one:

```ts live
import { Document, DocumentProtectionType, EditableRangeEnd, EditableRangeStart, Paragraph, TextRun } from "docx";

const doc = new Document({
    protection: {
        type: DocumentProtectionType.READ_ONLY,
        password: "secret",
    },
    sections: [
        {
            children: [
                new Paragraph("Only the highlighted parts of this document can be changed."),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Name: ", bold: true }),
                        new EditableRangeStart(1),
                        new TextRun("Type your name"),
                        new EditableRangeEnd(1),
                    ],
                }),
                new Paragraph({ children: [new EditableRangeStart(2), new TextRun("Anything you write here,")] }),
                new Paragraph({ children: [new TextRun("over as many paragraphs as you need."), new EditableRangeEnd(2)] }),
            ],
        },
    ],
});
```

Editable ranges are for read-only and comments protection: with tracked changes everything can be changed, and with forms only the form fields can.

## Demos

### Read-only Form

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/document-settings/document-protection.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/document-settings/document-protection.ts_
