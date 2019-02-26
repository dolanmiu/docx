// Numbered lists
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Indent, Numbering, Packer, Paragraph } from "../build";

const doc = new Document();

const numbering = new Numbering();

const abstractNum = numbering.createAbstractNumbering();
abstractNum.createLevel(0, "upperRoman", "%1", "start").addParagraphProperty(new Indent({ left: 720, hanging: 260 }));

const concrete = numbering.createConcreteNumbering(abstractNum);

const item1 = new Paragraph("line with contextual spacing");
const item2 = new Paragraph("line with contextual spacing");
const item3 = new Paragraph("line without contextual spacing");
const item4 = new Paragraph("line without contextual spacing");

item1
    .setNumbering(concrete, 0)
    .spacing({ before: 200 })
    .contextualSpacing(true);
item2
    .setNumbering(concrete, 0)
    .spacing({ before: 200 })
    .contextualSpacing(true);
item3
    .setNumbering(concrete, 0)
    .spacing({ before: 200 })
    .contextualSpacing(false);
item4
    .setNumbering(concrete, 0)
    .spacing({ before: 200 })
    .contextualSpacing(false);

doc.addParagraph(item1);
doc.addParagraph(item2);
doc.addParagraph(item3);
doc.addParagraph(item4);

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
