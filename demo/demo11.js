const docx = require("../build");

const doc = new docx.Document(undefined, {
    top: 700,
    right: 700,
    bottom: 700,
    left: 700,
});

doc.Styles.createParagraphStyle("Heading1", "Heading 1")
    .basedOn("Normal")
    .next("Normal")
    .quickFormat()
    .font("Calibri")
    .size(52)
    .center()
    .bold()
    .color(000000)
    .spacing({ line: 340 })
    .underline("single", "000000");

doc.Styles.createParagraphStyle("Heading2", "Heading 2")
    .basedOn("Normal")
    .next("Normal")
    .font("Calibri")
    .quickFormat()
    .size(26)
    .bold()
    .spacing({ line: 340 });

doc.Styles.createParagraphStyle("Heading3", "Heading 3")
    .basedOn("Normal")
    .next("Normal")
    .font("Calibri")
    .quickFormat()
    .size(26)
    .bold()
    .spacing({ line: 276 });

doc.Styles.createParagraphStyle("Heading4", "Heading 4")
    .basedOn("Normal")
    .next("Normal")
    .justified()
    .font("Calibri")
    .size(26)
    .bold();

doc.Styles.createParagraphStyle("normalPara", "Normal Para")
    .basedOn("Normal")
    .next("Normal")
    .font("Calibri")
    .quickFormat()
    .leftTabStop(453.543307087)
    .maxRightTabStop(453.543307087)
    .size(26)
    .spacing({ line: 276, before: 20 * 72 * 0.1, after: 20 * 72 * 0.05 });

doc.Styles.createParagraphStyle("normalPara2", "Normal Para2")
    .basedOn("Normal")
    .next("Normal")
    .quickFormat()
    .font("Calibri")
    .size(26)
    .justified()
    .spacing({ line: 276, before: 20 * 72 * 0.1, after: 20 * 72 * 0.05 });

doc.Styles.createParagraphStyle("aside", "Aside")
    .basedOn("Normal")
    .next("Normal")
    .color("999999")
    .italics()
    .indent(720)
    .spacing({ line: 276 });

doc.Styles.createParagraphStyle("wellSpaced", "Well Spaced")
    .basedOn("Normal")
    .spacing({ line: 276, before: 20 * 72 * 0.1, after: 20 * 72 * 0.05 });

doc.Styles.createParagraphStyle("ListParagraph", "List Paragraph")
    .quickFormat()
    .basedOn("Normal");

doc.createImage("./demo/images/pizza.gif");
doc
    .createParagraph("HEADING")
    .heading1()
    .center();

doc.Footer.createParagraph("1")
    .style("normalPara")
    .right();

doc.createParagraph("Ref. :").style("normalPara");
doc.createParagraph("Date :").style("normalPara");

doc.createParagraph("To,").style("normalPara");
doc.createParagraph("The Superindenting Engineer,(O &M)").style("normalPara");

doc.createParagraph("Sub : ").style("normalPara");

doc.createParagraph("Ref. : ").style("normalPara");

doc.createParagraph("Sir,").style("normalPara");

doc.createParagraph("BRIEF DESCRIPTION").style("normalPara");

var table = new docx.Table(4, 4);
var contentParagraph = table
    .getRow(0)
    .getCell(0)
    .addContent(new docx.Paragraph("Pole No."));
table.properties.width = 10000;
doc.addTable(table);

var arrboth = [{
    image: "./demo/images/pizza.gif",
    comment: "Test"
}, {
    image: "./demo/images/pizza.gif",
    comment: "Test 2"
}];

arrboth.forEach(function(item) {
    const para = doc.createParagraph();
    para.createTextRun(doc.createImage(item.image));
    para.properties.width = 60;
    para.properties.height = 90;
    doc.createParagraph(item.comment).style("normalPara2");
});

var exporter = new docx.LocalPacker(doc);
exporter.pack("My Document");
