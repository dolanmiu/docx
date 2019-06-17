// Numbering and bullet points example
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Indent, Numbering, Packer, Paragraph } from "../build";

const doc = new Document();

const numbering = new Numbering();

const abstractNum = numbering.createAbstractNumbering();
abstractNum.createLevel(0, "upperRoman", "%1", "start").addParagraphProperty(new Indent({ left: 720, hanging: 260 }));
abstractNum.createLevel(1, "decimal", "%2.", "start").addParagraphProperty(new Indent({ left: 1440, hanging: 980 }));
abstractNum.createLevel(2, "lowerLetter", "%3)", "start").addParagraphProperty(new Indent({ left: 14402160, hanging: 1700 }));

const concrete = numbering.createConcreteNumbering(abstractNum);

const topLevelP = new Paragraph({
    text: "Hey you",
    numbering: {
        num: concrete,
        level: 0,
    },
});
const subP = new Paragraph({
    text: "What's up fam",
    numbering: {
        num: concrete,
        level: 1,
    },
});
const secondSubP = new Paragraph({
    text: "Hello World 2",
    numbering: {
        num: concrete,
        level: 1,
    },
});
const subSubP = new Paragraph({
    text: "Yeah boi",
    numbering: {
        num: concrete,
        level: 2,
    },
});

doc.addParagraph(topLevelP);
doc.addParagraph(subP);
doc.addParagraph(secondSubP);
doc.addParagraph(subSubP);

const bullet1 = new Paragraph({
    text: "Hey you",
    bullet: {
        level: 0,
    },
});
const bullet2 = new Paragraph({
    text: "What's up fam",
    bullet: {
        level: 1,
    },
});
const bullet3 = new Paragraph({
    text: "Hello World 2",
    bullet: {
        level: 2,
    },
});
const bullet4 = new Paragraph({
    text: "Yeah boi",
    bullet: {
        level: 3,
    },
});

doc.addParagraph(bullet1);
doc.addParagraph(bullet2);
doc.addParagraph(bullet3);
doc.addParagraph(bullet4);

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
