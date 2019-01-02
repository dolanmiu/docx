<p align="center">
    <img alt="clippy the assistant" src="https://i.imgur.com/pwCV6L8.png">
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

```js
let docx = require("docx");
```

```js
import * as docx from "docx";
```

## Basic Usage

```js
var fs = require("fs");
var docx = require("docx");

// Create document
var doc = new docx.Document();

// Add some content in the document
var paragraph = new docx.Paragraph("Some cool text here.");
// Add more text into the paragraph if you wish
paragraph.addRun(new docx.TextRun("Lorem Ipsum Foo Bar"));
doc.addParagraph(paragraph);

// Used to export the file into a .docx file
var packer = new docx.Packer();
packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My First Document.docx", buffer);
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
