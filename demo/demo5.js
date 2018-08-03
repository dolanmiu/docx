const docx = require("../build");

var doc = new docx.Document();

var paragraph = new docx.Paragraph("Hello World");
doc.addParagraph(paragraph);

doc.createImage("./demo/images/image1.jpeg");
doc.createImage("./demo/images/dog.png");
doc.createImage("./demo/images/cat.jpg");
doc.createImage("./demo/images/parrots.bmp");
doc.createImage("./demo/images/pizza.gif");

var exporter = new docx.LocalPacker(doc);
exporter.pack("My Document");

console.log("Document created successfully at project root!");
