# Patcher

The patcher allows you to modify existing documents, and add new content to them.

!> The Patcher requires an understanding of [Paragraphs](usage/paragraph.md).

---

## Usage

```ts
import * as fs from "fs";
import { patchDocument } from "docx";

patchDocument(fs.readFileSync("My Document.docx"), {
    patches: {
        // Patches here
    },
});
```

## Patches

The patcher takes in a `patches` object, which is a map of `string` to `Patch`:

```ts
interface Patch {
    type: PatchType;
    children: FileChild[] | ParagraphChild[];
}
```

| Property | Type                              | Notes    | Possible Values                                                                                                                      |
| -------- | --------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| type     | `PatchType`                       | Required | `DOCUMENT`, `PARAGRAPH`                                                                                                              |
| children | `FileChild[] or ParagraphChild[]` | Required | The contents to replace with. A `FileChild` is a `Paragraph` or `Table`, whereas a `ParagraphChild` is typical `Paragraph` children. |


The patcher also takes in a `keepOriginalStyles` boolean, which will preserve the styles of the patched text when set to true.

### How to patch existing document

1. Open your existing word document in your favorite Word Processor
2. Write tags in the document where you want to patch in a mustache style notation. For example, `{{my_patch}}` and `{{my_second_patch}}`.
3. Run the patcher with the patches as a key value pair.

## Example

### Word Document

![Word Document screenshot](https://i.imgur.com/ybkvw6Z.png)

### Patcher

?> Notice how there is no handlebar notation in the key.

The patch can be as simple as a string, or as complex as a table. Images, hyperlinks, and other complex elements within the `docx` library are also supported.

```ts
patchDocument(fs.readFileSync("My Document.docx"), {
    patches: {
        my_patch: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun("Sir. "), new TextRun("John Doe"), new TextRun("(The Conqueror)")],
        },
        my_second_patch: {
            type: PatchType.DOCUMENT,
            children: [
                new Paragraph("Lorem ipsum paragraph"),
                new Paragraph("Another paragraph"),
                new Paragraph({
                    children: [
                        new TextRun("This is a "),
                        new ExternalHyperlink({
                            children: [
                                new TextRun({
                                    text: "Google Link",
                                }),
                            ],
                            link: "https://www.google.co.uk",
                        }),
                        new ImageRun({ type: 'png', data: fs.readFileSync("./demo/images/dog.png"), transformation: { width: 100, height: 100 } }),
                    ],
                }),
            ],
        },
    },
});
```

---

## Demo

_Source: https://github.com/dolanmiu/docx/blob/master/demo/85-template-document.ts_

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/85-template-document.ts ":include :type=code typescript")
