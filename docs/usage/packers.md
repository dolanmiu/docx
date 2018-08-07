# Packers

> Packers are the way in which `docx` turns your code into `.docx` format. It is completely decoupled from the `docx.Document`.

## File System Packer

```js
const docx = require("docx");

const doc = new docx.Document();
const exporter = new docx.LocalPacker(doc);
exporter.pack("My Document");
// Word Document is in file system
```

## Buffer Packer

```js
const docx = require("docx");

const doc = new docx.Document();
const exporter = new docx.BufferPacker(doc);
const buffer = exporter.pack();
```

## Stream Packer

Creates a `node` `Readable` stream

```js
const docx = require("docx");

const doc = new docx.Document();
const exporter = new docx.StreamPacker(doc);
const stream = exporter.pack();
```

## Express Packer

The old express packer is now deprecated and may disappear soon, so you should upgrade.

The reason for this is because it means this project needs to know about and use `express`, which for a Word document generator, does not sound right. Seperation of concerns.

It will still be usable (for now), but it is ill advised.

I used the express exporter in my [website](http://www.dolan.bio).

The recommended way is to use the `StreamPacker` and handle the `express` magic outside of the library:

```js
const docx = require("docx");

const doc = new docx.Document();
const exporter = new docx.StreamPacker(doc);

const stream = exporter.pack();

// Express' response object
res.attachment('yourfile.xlsx');
stream.pipe(res);
```

where `res` is the response object obtained through the Express router. It is that simple. The file will begin downloading in the browser.

## PDF Exporting

You can export your word document as a PDF file like so:

```js
const exporter = new docx.LocalPacker(doc);
exporter.packPdf("My Document");

// Express
const exporter = new docx.ExpressPacker(doc, res);
exporter.packPdf("My Document");
```

## Browser based docx exporting

It is on the bucket list. It has been requested by a few, and work is already on it
