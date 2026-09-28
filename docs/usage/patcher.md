# Patcher

The patcher allows you to modify existing documents, and add new content to them.

!> The Patcher requires an understanding of [Paragraphs](usage/paragraph.md).

---

## Usage

```ts
import * as fs from "fs";
import { patchDocument } from "docx";

patchDocument({
    outputType: "nodebuffer",
    data: fs.readFileSync("My Document.docx"),
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

A patch can also be for a drawing whose alt text holds the placeholder, rather than for text: `ChartDataPatch` from `docx/charts` gives a chart made in Word new data, keeping its look. See [Charts in Templates](usage/chart-templates.md).

### How to patch existing document

1. Open your existing word document in your favorite Word Processor
2. Write tags in the document where you want to patch in a mustache style notation. For example, `{{my_patch}}` and `{{my_second_patch}}`.
3. Run the patcher with the patches as a key value pair.

## Example

### Word Document

![Word Document screenshot](https://i.imgur.com/ybkvw6Z.png)

### Patcher

?> Notice how there is no handlebar notation in the key.

The patch can be as simple as a string, or as complex as a table. Images, hyperlinks, charts from `docx/charts` (see [Charts in Templates](usage/chart-size-and-position.md#in-templates)), and other complex elements within the `docx` library are also supported.

This example patches `{{name}}` and `{{paragraph_replace}}` in [simple-template.docx](https://github.com/dolanmiu/docx/blob/master/demo/assets/simple-template.docx):

```ts live
import * as fs from "fs";
import { ExternalHyperlink, ImageRun, Paragraph, patchDocument, PatchType, TextRun } from "docx";

const doc = await patchDocument({
    outputType: "nodebuffer",
    data: fs.readFileSync("./demo/assets/simple-template.docx"),
    patches: {
        name: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun("Sir. "), new TextRun("John Doe"), new TextRun("(The Conqueror)")],
        },
        paragraph_replace: {
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
                        new ImageRun({
                            type: "png",
                            data: fs.readFileSync("./demo/assets/images/dog.png"),
                            transformation: { width: 100, height: 100 },
                        }),
                    ],
                }),
            ],
        },
    },
});

fs.writeFileSync("My Document.docx", doc);
```

---

## Demo

_Source: https://github.com/dolanmiu/docx/blob/master/demo/templates/patch-document.ts_

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/templates/patch-document.ts ":include :type=code typescript")
