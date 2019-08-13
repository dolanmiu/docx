# Packers

> Packers are the way in which `docx` turns your code into `.docx` format. It is completely decoupled from the `docx.Document`.

Packers in `version 4` and above are now one single `Packer`. It works in both a node and browser environment (Angular etc). Now, the packer returns a `Buffer`, `Blob` or `base64 string`. It is up to you to take that and persist it with node's `fs`, send it down as a downloadable file, or anything else you wish. As of version 4, this library will not have options to export to PDF.

## Version 5

Packers in `version 5` and above are now static methods on `Packer`.

### Export as Buffer

This will return a NodeJS `Buffer`. If this is used in the browser, it will return a `UInt8Array` instead.

```ts
Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
```

### Export as a `base64` string

```ts
Packer.toBase64String(doc).then((string) => {
    console.log(string);
});
```

### Export as Blob

This is useful if you want to send it as an downloadable in a browser environment.

```ts
Packer.toBlob(doc).then((blob) => {
    // saveAs from FileSaver will download the file
    saveAs(blob, "example.docx");
});
```

## Version 4

The `Packer` in `version 4` requires an instance of `Packer`, so be sure to `new` it.

### Export as Buffer

This will return a NodeJS `Buffer`. If this is used in the browser, it will return a `UInt8Array` instead.

```ts
const packer = new docx.Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
```

### Export as a `base64` string

```ts
const packer = new docx.Packer();

packer.toBase64String(doc).then((string) => {
    console.log(string);
});
```

### Export as Blob

This is useful if you want to send it as an downloadable in a browser environment.

```ts
const packer = new docx.Packer();

packer.toBlob(doc).then((blob) => {
    // saveAs from FileSaver will download the file
    saveAs(blob, "example.docx");
});
```

## Version 3 and below

### File System Packer

```ts
const docx = require("docx");

const doc = new docx.Document();
const exporter = new docx.LocalPacker(doc);
exporter.pack("My Document");
// Word Document is in file system
```

### Buffer Packer

```ts
const docx = require("docx");

const doc = new docx.Document();
const exporter = new docx.BufferPacker(doc);
const buffer = exporter.pack();
```

### Stream Packer

Creates a `node` `Readable` stream

```ts
const docx = require("docx");

const doc = new docx.Document();
const exporter = new docx.StreamPacker(doc);
const stream = exporter.pack();
```

### Express Packer

The old express packer is now deprecated and may disappear soon, so you should upgrade.

The reason for this is because it means this project needs to know about and use `express`, which for a Word document generator, does not sound right. Seperation of concerns.

It will still be usable (for now), but it is ill advised.

I used the express exporter in my [website](http://www.dolan.bio).

The recommended way is to use the `StreamPacker` and handle the `express` magic outside of the library:

```ts
const docx = require("docx");

const doc = new docx.Document();
const exporter = new docx.StreamPacker(doc);

const stream = exporter.pack();

// Express' response object
res.attachment("yourfile.xlsx");
stream.pipe(res);
```

where `res` is the response object obtained through the Express router. It is that simple. The file will begin downloading in the browser.

### PDF Exporting

You can export your word document as a PDF file like so:

```ts
const exporter = new docx.LocalPacker(doc);
exporter.packPdf("My Document");

// Express
const exporter = new docx.ExpressPacker(doc, res);
exporter.packPdf("My Document");
```
