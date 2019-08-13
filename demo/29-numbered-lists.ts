// Numbered lists
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Numbering, Packer, Paragraph } from "../build";

const doc = new Document();

const numbering = new Numbering();

const abstractNum = numbering.createAbstractNumbering();
abstractNum.createLevel(0, "upperRoman", "%1", "start").indent({ left: 720, hanging: 260 });

const concrete = numbering.createConcreteNumbering(abstractNum);

doc.addSection({
    children: [
        new Paragraph({
            text: "line with contextual spacing",
            numbering: {
                num: concrete,
                level: 0,
            },
            contextualSpacing: true,
            spacing: {
                before: 200,
            },
        }),
        new Paragraph({
            text: "line with contextual spacing",
            numbering: {
                num: concrete,
                level: 0,
            },
            contextualSpacing: true,
            spacing: {
                before: 200,
            },
        }),
        new Paragraph({
            text: "line without contextual spacing",
            numbering: {
                num: concrete,
                level: 0,
            },
            contextualSpacing: false,
            spacing: {
                before: 200,
            },
        }),
        new Paragraph({
            text: "line without contextual spacing",
            numbering: {
                num: concrete,
                level: 0,
            },
            contextualSpacing: false,
            spacing: {
                before: 200,
            },
        }),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
