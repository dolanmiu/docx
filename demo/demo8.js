const docx = require('../build');

var doc = new docx.File();

doc.createParagraph("Hello World");

doc.Header.createParagraph("Header text");
doc.Footer.createParagraph("Footer text");

var exporter = new docx.LocalPacker(doc);
exporter.pack('My Document');

console.log('Document created succesfully at project root!');
