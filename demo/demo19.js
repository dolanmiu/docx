const fs = require("fs");
const docx = require("../build");

var doc = new docx.Document();

var paragraph = new docx.Paragraph("Hello World");
var institutionText = new docx.TextRun("Foo").bold();
var dateText = new docx.TextRun("Bar").tab().bold();
paragraph.addRun(institutionText);
paragraph.addRun(dateText);

doc.addParagraph(paragraph);

var exporter = new docx.BufferPacker(doc);
exporter.pack("My Document").then((buffer) => {
    // At this point, you can do anything with the buffer, including casting it to a string etc.
    console.log(buffer);
    fs.writeFileSync('My Document.docx', buffer);
    console.log("Document created successfully at project root!");
});
