// Numbering and bullet points example
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Numbering, Packer, Paragraph } from "../build";

const doc = new Document();

const numbering = new Numbering();

const abstractNum = numbering.createAbstractNumbering();
abstractNum.createLevel(0, "upperRoman", "%1", "start").indent({ left: 720, hanging: 260 });
abstractNum.createLevel(1, "decimal", "%2.", "start").indent({ left: 1440, hanging: 980 });
abstractNum.createLevel(2, "lowerLetter", "%3)", "start").indent({ left: 14402160, hanging: 1700 });

const concrete = numbering.createConcreteNumbering(abstractNum);

doc.addSection({
    children: [
        new Paragraph({
            text: "Hey you",
            numbering: {
                num: concrete,
                level: 0,
            },
        }),
        new Paragraph({
            text: "What's up fam",
            numbering: {
                num: concrete,
                level: 1,
            },
        }),
        new Paragraph({
            text: "Hello World 2",
            numbering: {
                num: concrete,
                level: 1,
            },
        }),
        new Paragraph({
            text: "Yeah boi",
            numbering: {
                num: concrete,
                level: 2,
            },
        }),
        new Paragraph({
            text: "Hey you",
            bullet: {
                level: 0,
            },
        }),
        new Paragraph({
            text: "What's up fam",
            bullet: {
                level: 1,
            },
        }),
        new Paragraph({
            text: "Hello World 2",
            bullet: {
                level: 2,
            },
        }),
        new Paragraph({
            text: "Yeah boi",
            bullet: {
                level: 3,
            },
        }),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
