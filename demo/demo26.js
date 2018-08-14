const docx = require('../build');
const fs = require('fs');

var doc = new docx.Document();

var paragraph = new docx.Paragraph("Hello World");
var institutionText = new docx.TextRun("University College London").bold();
var dateText = new docx.TextRun("5th Dec 2015").tab().bold();
paragraph.addRun(institutionText);
paragraph.addRun(dateText);

doc.addParagraph(paragraph);

var packer = new docx.PdfPacker();

packer.toBuffer(doc).then((buffer) => {
    console.log(buffer);
    fs.writeFileSync('My Document.pdf', buffer);
});

console.log('Document created successfully at project root!');
