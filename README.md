<p align="center">
    <img alt="clippy the assistant" src="https://i.imgur.com/37uBGhO.gif">
</p>

<p align="center">
    Easily generate .docx files with JS/TS. Works for Node and on the Browser. :100:
</p>

---

# Welcome

## Installation

```sh
npm install --save docx
```

Then you can `require` or `import` as usual:

```ts
const docx = require("docx");
```

```ts
import * as docx from "docx";
// or
import { ... } from "docx";
```

## Basic Usage

```ts
import * as fs from "fs";
import { Document, Packer, Paragraph, TextRun } from "docx";

// Create document
const doc = new Document();

// Documents contain sections, you can have multiple sections per document, go here to learn more about sections
// This simple example will only contain one section
doc.addSection({
    properties: {},
    children: [
        new Paragraph({
            children: [
                new TextRun("Hello World"),
                new TextRun({
                    text: "Foo Bar",
                    bold: true,
                }),
                new TextRun({
                    text: "\tGithub is the best",
                    bold: true,
                }),
            ],
        }),
    ],
});

// Used to export the file into a .docx file
Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});

// Done! A file called 'My First Document.docx' will be in your file system.
```

## Honoured Mentions

[@felipeochoa](https://github.com/felipeochoa)

[@h4buli](https://github.com/h4buli)

<p align="center">
    <img alt="clippy the assistant" src="http://i60.tinypic.com/339pvtt.png">
</p>

---

Made with 💖
