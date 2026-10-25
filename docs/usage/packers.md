# Packers

> Packers are the way in which `docx` turns your code into `.docx` format. It is completely decoupled from the `docx.Document`.

Packers works in both a node and browser environment (Angular etc). Now, the packer returns a `Buffer`, `Blob`, `string`, `base64 string`, `ArrayBuffer`, or `Stream`. It is up to you to take that and persist it with node's `fs`, send it down as a downloadable file, or anything else you wish. As of `version 4+`, this library will not have options to export to PDF.

### Export as Buffer

This will return a NodeJS `Buffer`. If this is used in the browser, it will return a `UInt8Array` instead.

```ts live
import * as fs from "fs";
import { Document, Packer, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            children: [new Paragraph("Hello World")],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
```

### Export as string

```ts live
import { Document, Packer, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            children: [new Paragraph("Hello World")],
        },
    ],
});

Packer.toString(doc).then((string) => {
    console.log(string);
});
```

### Export as a `base64` string

```ts live
import { Document, Packer, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            children: [new Paragraph("Hello World")],
        },
    ],
});

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

### Export as ArrayBuffer

This may be useful when working in a Node.js worker.

```ts
Packer.toArrayBuffer(doc).then((arrayBuffer) => {
    port.postMessage(arrayBuffer, [arrayBuffer]);
});
```

### Export as a Stream

```ts live
import { Document, Packer, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            children: [new Paragraph("Hello World")],
        },
    ],
});

const stream = Packer.toStream(doc);
// read from stream
```

### Export using optional arguments

The `Packer` methods support 2 optional arguments.

The first is for controlling the indentation of the xml and should be a `boolean` or `keyof typeof PrettifyType`.

The second is an array of subfile overrides (`{path: string, data: string}[]`). These overrides can be used to write additional subfiles to the result or even override default subfiles in the case that the default handling of these subfiles does not meet your needs.

```ts live
import { Document, Packer, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            children: [new Paragraph("Hello World")],
        },
    ],
});

const overrides = [{ path: "word/commentsExtended.xml", data: "string_data" }];
Packer.toString(doc, true, overrides).then((string) => {
    console.log(string);
});
```

### Export to arbitrary formats

You can also use the lower-level `Packer.pack` method to export to any specified type.

```ts live
import { Document, Packer, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            children: [new Paragraph("Hello World")],
        },
    ],
});

Packer.pack(doc, "string").then((string) => {
    console.log(string);
});
```

## Demos

[Export to Base64 Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/exporting/base64-string.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/exporting/base64-string.ts_

[Node.js Stream Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/exporting/node-stream.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/exporting/node-stream.ts_
