const docx = require('../build');

var doc = new docx.Document();

doc.createParagraph("First Page").pageBreak()
doc.createParagraph("Second Page");

var pageNumber = new docx.TextRun().pageNumber()

var pageoneheader = new docx.Paragraph("First Page Header ").right();

pageoneheader.addRun(pageNumber);
var firstPageHeader = doc.createFirstPageHeader();
firstPageHeader.addParagraph(pageoneheader);

var pagetwoheader = new docx.Paragraph("My Title ").right();

pagetwoheader.addRun(pageNumber)
doc.Header.addParagraph(pagetwoheader)

var exporter = new docx.LocalPacker(doc);
exporter.pack('My Document');

console.log('Document created successfully at project root!');
