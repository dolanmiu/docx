<p align="center">
    <img alt="clippy the assistant" src="http://i60.tinypic.com/339pvtt.png">
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
var docx = require("docx");

// Create document
var doc = new docx.Document();

// Add some content in the document
var paragraph = new docx.Paragraph("Some cool text here.");
// Add more text into the paragraph if you wish
paragraph.addRun(new docx.TextRun("Lorem Ipsum Foo Bar"));
doc.addParagraph(paragraph);

// Used to export the file into a .docx file
var exporter = new docx.LocalPacker(doc);

exporter.pack("My First Document");

// Done! A file called 'My First Document.docx' will be in your file system if you used LocalPacker
```

## Honoured Mentions

[@felipeochoa](https://github.com/felipeochoa)

[@h4buli](https://github.com/h4buli)

---

Made with 💖
