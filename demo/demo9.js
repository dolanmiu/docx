const docx = require('../build');
const fs = require('fs');

var doc = new docx.Document();

doc.createParagraph("Hello World");

doc.Header.createImage(fs.readFileSync("./demo/images/pizza.gif"));
doc.Footer.createImage(fs.readFileSync("./demo/images/pizza.gif"));

var exporter = new docx.LocalPacker(doc);
exporter.pack('My Document');

console.log('Document created successfully at project root!');
