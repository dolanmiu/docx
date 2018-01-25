const docx = require("../build");

var doc = new docx.File(undefined, {
    orientation: "landscape",
});

var paragraph = new docx.Paragraph("Hello World");

doc.addParagraph(paragraph);

var exporter = new docx.LocalPacker(doc);
exporter.pack("My Document");

console.log("Document created succesfully at project root!");
