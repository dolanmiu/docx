const docx = require('../build');

var doc = new docx.Document();

var paragraph = new docx.Paragraph("Hello World");
var paragraph2 = new docx.Paragraph("Hello World on another page").pageBreakBefore();

doc.addParagraph(paragraph);
doc.addParagraph(paragraph2);

var exporter = new docx.LocalPacker(doc);
exporter.pack('My Document');

console.log('Document created successfully at project root!');
