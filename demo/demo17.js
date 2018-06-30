const docx = require('../build');

var doc = new docx.Document();

var paragraph = new docx.Paragraph("Hello World").referenceFootnote(1);
var paragraph2 = new docx.Paragraph("Hello World").referenceFootnote(2);

doc.addParagraph(paragraph);
doc.addParagraph(paragraph2);

doc.createFootnote(new docx.Paragraph("Test"));
doc.createFootnote(new docx.Paragraph("My amazing reference"));

var exporter = new docx.LocalPacker(doc);
exporter.pack('My Document');

console.log('Document created successfully at project root!');
