// Numbered lists
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Indent, Numbering, Packer, Paragraph } from "../build";

const doc = new Document();

const numbering = new Numbering();

const abstractNum = numbering.createAbstractNumbering();
abstractNum.createLevel(0, "upperRoman", "%1", "start").addParagraphProperty(new Indent({ left: 720, hanging: 260 }));

const concrete = numbering.createConcreteNumbering(abstractNum);

const item1 = new Paragraph({
    text: "line with contextual spacing",
    numbering: {
        num: concrete,
        level: 0,
    },
    contextualSpacing: true,
    spacing: {
        before: 200,
    },
});
const item2 = new Paragraph({
    text: "line with contextual spacing",
    numbering: {
        num: concrete,
        level: 0,
    },
    contextualSpacing: true,
    spacing: {
        before: 200,
    },
});
const item3 = new Paragraph({
    text: "line without contextual spacing",
    numbering: {
        num: concrete,
        level: 0,
    },
    contextualSpacing: false,
    spacing: {
        before: 200,
    },
});
const item4 = new Paragraph({
    text: "line without contextual spacing",
    numbering: {
        num: concrete,
        level: 0,
    },
    contextualSpacing: false,
    spacing: {
        before: 200,
    },
});

doc.addParagraph(item1);
doc.addParagraph(item2);
doc.addParagraph(item3);
doc.addParagraph(item4);

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
