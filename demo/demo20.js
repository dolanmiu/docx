const docx = require("../build");

var doc = new docx.Document();

const table = doc.createTable(4, 4);
table
    .getCell(2, 2)
    .addContent(new docx.Paragraph("Hello"))
    .cellProperties.borders.addTopBorder(docx.BorderStyle.DASH_DOT_STROKED, 3, "red")
    .addBottomBorder(docx.BorderStyle.DOUBLE, 3, "blue")
    .addStartBorder(docx.BorderStyle.DOT_DOT_DASH, 3, "green")
    .addEndBorder(docx.BorderStyle.DOT_DOT_DASH, 3, "#ff8000");

var exporter = new docx.LocalPacker(doc);
exporter.pack("My Document");

console.log("Document created successfully at project root!");
