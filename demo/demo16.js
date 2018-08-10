const docx = require("../build");

var doc = new docx.Document();

var paragraph = new docx.Paragraph("Hello World").pageBreak();

doc.addParagraph(paragraph);

var header = doc.createHeader();
header.createParagraph("Header on another page");
var footer = doc.createFooter();
footer.createParagraph("Footer on another page");

doc.addSection({
    headerId: header.Header.ReferenceId,
    footerId: footer.Footer.ReferenceId,
    pageNumberStart: 1,
    pageNumberFormatType: docx.PageNumberFormat.DECIMAL,
});

doc.createParagraph("hello");

doc.addSection({
    headerId: header.Header.ReferenceId,
    footerId: footer.Footer.ReferenceId,
    pageNumberStart: 1,
    pageNumberFormatType: docx.PageNumberFormat.DECIMAL,
    orientation: docx.PageOrientation.LANDSCAPE,
});

doc.createParagraph("hello in landscape");

var exporter = new docx.LocalPacker(doc);
exporter.pack("My Document");

console.log("Document created successfully at project root!");
