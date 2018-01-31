const docx = require("../build");

var doc = new docx.Document(undefined, {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
});

var paragraph = new docx.Paragraph("Hello World");
var institutionText = new docx.TextRun("University College London").bold();
var dateText = new docx.TextRun("5th Dec 2015").tab().bold();
paragraph.addRun(institutionText);
paragraph.addRun(dateText);

doc.addParagraph(paragraph);

doc.createParagraph("Hello World").heading1();
doc.createParagraph("University College London");
doc.createParagraph("5th Dec 2015");

var exporter = new docx.LocalPacker(doc);
exporter.pack("My Document");

console.log("Document created successfully at project root!");
