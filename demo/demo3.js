const docx = require('../build');

var doc = new docx.Document();

const numbering = new docx.Numbering();

const abstractNum = numbering.createAbstractNumbering();
abstractNum.createLevel(0, "upperRoman", "%1", "start")
    .addParagraphProperty(new docx.Indent(720, 260));
abstractNum.createLevel(1, "decimal", "%2.", "start")
    .addParagraphProperty(new docx.Indent(1440, 980));
abstractNum.createLevel(2, "lowerLetter", "%3)", "start")
    .addParagraphProperty(new docx.Indent(2160, 1700));

const concrete = numbering.createConcreteNumbering(abstractNum);

var topLevelP = new docx.Paragraph("Hey you");
var subP = new docx.Paragraph("What's up fam");
var secondSubP = new docx.Paragraph("Hello World 2");
var subSubP = new docx.Paragraph("Yeah boi");

topLevelP.setNumbering(concrete, 0);
subP.setNumbering(concrete, 1);
secondSubP.setNumbering(concrete, 1);
subSubP.setNumbering(concrete, 2);

doc.addParagraph(topLevelP);
doc.addParagraph(subP);
doc.addParagraph(secondSubP);
doc.addParagraph(subSubP);

var exporter = new docx.LocalPacker(doc);
exporter.pack('My Document');

console.log('Document created succesfully at project root!');