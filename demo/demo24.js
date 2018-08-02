// Add image to table cell
const docx = require('../build');

var doc = new docx.Document();

const table = doc.createTable(4, 4);
table.getCell(2, 2).addContent(new docx.Paragraph('Hello'));

const imageData = docx.Media.addImage(doc, "./demo/images/image1.jpeg");
table.getCell(1, 1).addContent(new docx.Image(imageData));

var exporter = new docx.LocalPacker(doc);
exporter.pack('My Document');

console.log('Document created successfully at project root!');
