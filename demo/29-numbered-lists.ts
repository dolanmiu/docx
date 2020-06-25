// Numbered lists
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { AlignmentType, File, Packer, Paragraph } from "../build";

const doc = new File({});

const numbering1 = [
  {
    level: 0,
    format: "upperRoman",
    text: "%1",
    alignment: AlignmentType.START,
    style: {
      paragraph: {
        indent: { left: 720, hanging: 260 },
      },
    },
  },
];

const numbering2 = [
  {
    level: 0,
    format: "decimal",
    text: "%1",
    alignment: AlignmentType.START,
    style: {
      paragraph: {
        indent: { left: 720, hanging: 260 },
      },
    },
  },
];

const numbering = doc.Numbering;

const abstractNumbering1 = numbering.createAbstractNumbering(numbering1);
const abstractNumbering2 = numbering.createAbstractNumbering(numbering1);
const abstractNumbering3 = numbering.createAbstractNumbering(numbering2);

const concreteNumbering1 = numbering.createConcreteNumbering(abstractNumbering1, "reference", 1);
const concreteNumbering2 = numbering.createConcreteNumbering(abstractNumbering2, "reference", 2);
const concreteNumbering3 = numbering.createConcreteNumbering(abstractNumbering3, "reference", 3);

doc.addSection({
    children: [
        new Paragraph({
            text: "bananas",
            numbering: {
                reference:concreteNumbering1.reference!,
                level: 0,
                numId: 1,
            },
            contextualSpacing: true,
            spacing: {
                before: 200,
            },
        }),
        new Paragraph({
            text: "apples",
            numbering: {
                reference: concreteNumbering1.reference!,
                level: 0,
                numId: 1,
            },
            contextualSpacing: true,
            spacing: {
                before: 200,
            },
        }),
        new Paragraph({
            text: "line with contextual spacing",
            numbering: {
                reference: concreteNumbering2.reference!,
                level: 0,
                numId: 2,
            },
            contextualSpacing: true,
            spacing: {
                before: 200,
            },
        }),
        new Paragraph({
            text: "line with contextual spacing",
            numbering: {
                reference: concreteNumbering2.reference!,
                level: 0,
                numId: 2,
            },
            contextualSpacing: true,
            spacing: {
                before: 200,
            },
        }),
        new Paragraph({
            text: "line without contextual spacing",
            numbering: {
                reference: concreteNumbering2.reference!,
                level: 0,
                numId: 2,
            },
            contextualSpacing: false,
            spacing: {
                before: 200,
            },
        }),
        new Paragraph({
            text: "line without contextual spacing",
            numbering: {
                reference: concreteNumbering2.reference!,
                level: 0,
                numId: 2,
            },
            contextualSpacing: false,
            spacing: {
                before: 200,
            },
        }),
        new Paragraph({
            text: "Step 1 - Add sugar",
            numbering: {
                reference: concreteNumbering3.reference!,
                level: 0,
                numId: 3,
            },
        }),
        new Paragraph({
            text: "Step 2 - Add wheat",
            numbering: {
                reference: concreteNumbering3.reference!,
                level: 0,
                numId: 3,
            },
        }),
        new Paragraph({
            text: "Step 3 - Put in oven",
            numbering: {
                reference: concreteNumbering3.reference!,
                level: 0,
                numId: 3,
            },
        }),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
