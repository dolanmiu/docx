const docx = require('../build');

var doc = new docx.File();

doc.createParagraph("Hello World");

doc.Header.createImage("./demo/images/pizza.gif");
// doc.Footer.createImage("./demo/images/pizza.gif");

var exporter = new docx.LocalPacker(doc);
exporter.pack('My Document');

console.log('Document created successfully at project root!');
