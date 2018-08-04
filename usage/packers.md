# Packers

I used the express exporter in my [website](http://www.dolan.bio). It's very useful, and is the preferred way if you want to make a downloadable file for a visitor. it is much better than generating a physical file on the server, and then passing a download link to that file.

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
const buffer = exporter.pack();
```

## Express Packer

Simply use the exporter, and pass in the necessary parameters:

```js
const docx = require("docx");

const doc = new docx.Document();
const exporter = new docx.ExpressPacker(doc, res);
exporter.pack("My Document");
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
