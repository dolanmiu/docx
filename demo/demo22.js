const docx = require('../build');

var doc = new docx.Document();



var paragraph1 = new docx.Paragraph().bidi();
var textRun1 = new docx.TextRun("שלום עולם").rtl();
paragraph1.addRun(textRun1);
doc.addParagraph(paragraph1);

var paragraph2 = new docx.Paragraph().bidi();
var textRun2 = new docx.TextRun("שלום עולם").bold().rtl();
paragraph2.addRun(textRun2);
doc.addParagraph(paragraph2);

var paragraph3 = new docx.Paragraph().bidi();
var textRun3 = new docx.TextRun("שלום עולם").italic().rtl();
paragraph3.addRun(textRun3);
doc.addParagraph(paragraph3);


var exporter = new docx.LocalPacker(doc);
exporter.pack('My Document');

console.log('Document created successfully at project root!');
