const docx = require("../build");
const fs = require('fs');

var doc = new docx.Document();

var paragraph = new docx.Paragraph("Hello World");
doc.addParagraph(paragraph);

doc.createImage(fs.readFileSync("./demo/images/image1.jpeg"));
doc.createImage(fs.readFileSync("./demo/images/dog.png"));
doc.createImage(fs.readFileSync("./demo/images/cat.jpg"));
doc.createImage(fs.readFileSync("./demo/images/parrots.bmp"));
doc.createImage(fs.readFileSync("./demo/images/pizza.gif"));

var exporter = new docx.LocalPacker(doc);
exporter.pack("My Document");

console.log("Document created successfully at project root!");
