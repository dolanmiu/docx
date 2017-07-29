const docx = require('../build');

var doc = new docx.Document();

const table = doc.createTable(4, 4);
table.getCell(2, 2).addContent(new docx.Paragraph('Hello'));


var exporter = new docx.LocalPacker(doc);
exporter.pack('My Document');

console.log('Document created succesfully at project root!');