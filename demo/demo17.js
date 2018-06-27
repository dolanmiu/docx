const docx = require('../build');

var doc = new docx.Document();

var paragraph = new docx.Paragraph("Hello World").referenceFootnote(1);

doc.addParagraph(paragraph);

doc.createFootnote(new docx.Paragraph("Test"));

var exporter = new docx.LocalPacker(doc);
exporter.pack('My Document');

console.log('Document created successfully at project root!');
