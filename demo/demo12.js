const docx = require("../build");

var doc = new docx.Document();

var paragraph = new docx.Paragraph("Hello World");
doc.addParagraph(paragraph);

const image = doc.createImage("./demo/images/pizza.gif");
const image2 = doc.createImage("./demo/images/pizza.gif");
const image3 = doc.createImage("./demo/images/pizza.gif");
const image4 = doc.createImage("./demo/images/pizza.gif");

image.scale(0.5);
image2.scale(1)
image3.scale(2.5);
image4.scale(4);

var exporter = new docx.LocalPacker(doc);
exporter.pack("My Document");

console.log("Document created successfully at project root!");
