const docx = require('../build');

var doc = new docx.Document();

var paragraph = new docx.Paragraph("Hello World");
var institutionText = new docx.TextRun("University College London").bold();
var dateText = new docx.TextRun("5th Dec 2015").tab().bold();
paragraph.addRun(institutionText);
paragraph.addRun(dateText);

doc.addParagraph(paragraph);

var exporter = new docx.LocalPacker(doc);
exporter.packPdf('My Document');

console.log('Document created successfully at project root!');
