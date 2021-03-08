# Packers

> Packers are the way in which `docx` turns your code into `.docx` format. It is completely decoupled from the `docx.Document`.

Packers works in both a node and browser environment (Angular etc). Now, the packer returns a `Buffer`, `Blob` or `base64 string`. It is up to you to take that and persist it with node's `fs`, send it down as a downloadable file, or anything else you wish. As of `version 4+`, this library will not have options to export to PDF.

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
