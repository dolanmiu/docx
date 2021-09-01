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

// Documents contain sections, you can have multiple sections per document, go here to learn more about sections
// This simple example will only contain one section
const doc = new Document({
    sections: [{
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
    }],
});

// Used to export the file into a .docx file
Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});

// Done! A file called 'My Document.docx' will be in your file system.
```

<p align="center">
    <img alt="clippy the assistant" src="./clippy.png">
</p>

---

Made with 💖
