# Embedded Files

<!-- cspell:ignore docm xlsm pptm -->

A document can have files embedded in it: a workbook, another document, a presentation, or any other file, such as a sound, a video or a PDF. Each is an OLE object, which the document shows as a picture, and which opens when it is double-clicked, as a file embedded with Word's **Insert > Object > Create from File** does.

`EmbeddedFileRun` embeds a file. It comes with the `docx` package, from `docx/embedded-files` (in Node, Node.js 16.9 or later), and goes in a paragraph, as an `ImageRun` does:

```ts
import { Document, Packer, Paragraph } from "docx";
import { EmbeddedFileRun } from "docx/embedded-files";
```

In a page without a bundler, load `dist/embedded-files.umd.cjs` after `dist/index.umd.cjs` (or `dist/embedded-files.iife.js` after `dist/index.iife.js`). It adds a `docxEmbeddedFiles` global, such as `new docxEmbeddedFiles.EmbeddedFileRun({ ... })`.

## Example

```ts live
import * as fs from "fs";
import { Document, Packer, Paragraph } from "docx";
import { EmbeddedFileRun } from "docx/embedded-files";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph("The budget, which opens in Excel when it is double-clicked:"),
                new Paragraph({
                    children: [
                        new EmbeddedFileRun({
                            fileName: "budget.xlsx",
                            data: fs.readFileSync("./demo/assets/embedded-files/budget.xlsx"),
                            preview: { type: "png", data: fs.readFileSync("./demo/assets/embedded-files/budget.png") },
                            transformation: { width: 241, height: 111 },
                        }),
                    ],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
```

## Options

| Property         | Type                                            | Notes    | Description                                                                                                                        |
| ---------------- | ----------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `fileName`       | `string`                                        | Required | The file's name, such as `budget.xlsx`. Its extension says how the file is embedded, below                                         |
| `data`           | `Buffer \| string \| Uint8Array \| ArrayBuffer` | Required | The file, or a base64 data URI of it                                                                                               |
| `preview`        | `{ type, data }`                                | Required | The picture the document shows for the file: a `"png"`, `"jpg"`, `"gif"` or `"bmp"`, as `type`, and its `data`, as an `ImageRun`'s |
| `transformation` | `{ width, height }`                             | Required | The size the picture is drawn at, in pixels, as an `ImageRun`'s                                                                    |
| `displayAsIcon`  | `boolean`                                       | Optional | Shows the file as an icon, as Word's **Display as icon** does, rather than as its content. Default is `false`                      |
| `altText`        | `string`                                        | Optional | A description of the file for screen readers, as Word's **Alt Text**                                                               |

## How each file is embedded

An Excel workbook, a Word document or a PowerPoint presentation is embedded as itself, as Word embeds it, so Office opens it from the document, and changes made to it are saved in the document:

| Extension        | Opens in   | Its OLE ProgID                                         |
| ---------------- | ---------- | ------------------------------------------------------ |
| `.xlsx`, `.xlsm` | Excel      | `Excel.Sheet.12`, `Excel.SheetMacroEnabled.12`         |
| `.docx`, `.docm` | Word       | `Word.Document.12`, `Word.DocumentMacroEnabled.12`     |
| `.pptx`, `.pptm` | PowerPoint | `PowerPoint.Show.12`, `PowerPoint.ShowMacroEnabled.12` |

`EmbeddedFileRun` throws for one of these that isn't a zip file, as Office's files are, such as an older Excel workbook (`.xls`) named `.xlsx`, as Office couldn't open it.

Any other file, such as a sound (`.mp3`, `.wav`), a video (`.mp4`), a PDF, or an older Office file (`.xls`, `.doc`, `.ppt`), is embedded in an OLE package (the `Package` ProgID), as Word for Windows embeds a file no application on the computer embeds itself. Word for Windows opens it with the application Windows opens its type with, after asking whether to. Word for Mac and LibreOffice show its picture and keep it in the document, but Word for Mac can't open it: it says the application can't be found. A packaged file is always shown as an icon.

```ts live
import * as fs from "fs";
import { Document, Packer, Paragraph } from "docx";
import { EmbeddedFileRun } from "docx/embedded-files";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph("A sound, which Word for Windows plays when it is double-clicked:"),
                new Paragraph({
                    children: [
                        new EmbeddedFileRun({
                            fileName: "tone.wav",
                            data: fs.readFileSync("./demo/assets/embedded-files/tone.wav"),
                            preview: { type: "png", data: fs.readFileSync("./demo/assets/embedded-files/tone-icon.png") },
                            transformation: { width: 96, height: 96 },
                            altText: "A one-second chime",
                        }),
                    ],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
```

## The picture

docx doesn't draw a file's picture: give it one in `preview`, such as a screenshot of a workbook's table, or an icon with the file's name, as Word shows a file with **Display as icon**. Word shows the picture until the file is opened and changed in its application, which then draws the file again: its content, or, with `displayAsIcon`, its application's icon.

```ts live
import * as fs from "fs";
import { Document, Packer, Paragraph } from "docx";
import { EmbeddedFileRun } from "docx/embedded-files";

// A Word document to embed, made with docx too
const letter = new Document({ sections: [{ children: [new Paragraph("Dear reader, this letter is in the report.")] }] });
const letterData = await Packer.toBuffer(letter);

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph("A letter, which opens in Word when it is double-clicked:"),
                new Paragraph({
                    children: [
                        new EmbeddedFileRun({
                            fileName: "letter.docx",
                            data: letterData,
                            preview: { type: "png", data: fs.readFileSync("./demo/assets/embedded-files/letter-icon.png") },
                            transformation: { width: 96, height: 96 },
                            displayAsIcon: true,
                        }),
                    ],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
```

An embedded file goes anywhere a run does: in a table, a header, a footer, a footnote or a comment, and in a document `patchDocument` fills in.

## Examples

### A workbook, a document and a sound

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/embedded-files/embedded-files.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/embedded-files/embedded-files.ts_
