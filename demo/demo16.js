const docx = require('../build');

var doc = new docx.Document();

var paragraph = new docx.Paragraph("Hello World");
var paragraph2 = new docx.Paragraph("Hello World on another page").pageBreak();

doc.addParagraph(paragraph);
doc.addParagraph(paragraph2);

doc.createParagraph("hello").pageBreak();

var header = doc.createHeader();
header.createParagraph("Header on another page");
var footer = doc.createFooter();
footer.createParagraph("Footer on another page");

doc.addSection({
  headerId: header.Header.referenceId,
  footerId: footer.Footer.referenceId,
  pageNumberStart: 1,
  pageNumberFormatType: docx.PageNumberFormat.DECIMAL,
});

var exporter = new docx.LocalPacker(doc);
exporter.pack('My Document');

console.log('Document created successfully at project root!');
