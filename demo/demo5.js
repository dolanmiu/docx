const docx = require('../build');

var doc = new docx.File();

const image = doc.createImage("./demo/penguins.jpg");


var exporter = new docx.LocalPacker(doc);
exporter.pack('My Document');

console.log('Document created successfully at project root!');
