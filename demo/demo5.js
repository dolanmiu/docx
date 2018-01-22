const docx = require('../build');

var doc = new docx.File();

var paragraph = new docx.Paragraph("Hello World");
doc.addParagraph(paragraph);

const image = doc.createImage("./demo/images/image1.jpeg");
const image2 = doc.createImage("./demo/images/dog.png");

var exporter = new docx.LocalPacker(doc);
exporter.pack('My Document');

console.log('Document created successfully at project root!');
