// Lists that bring their own definitions: a paragraph's numbering can give its list's definition, its reference and
// its levels, rather than the reference of one in the document's numbering option, so content can be made before the
// document it goes in. Each list is numbered on its own. See docs/usage/numbering.md.

import * as fs from "fs";
import { AlignmentType, Document, LevelFormat, Packer, Paragraph, TextRun, convertInchesToTwip } from "docx";

const steps = {
    reference: "steps",
    levels: [
        {
            level: 0,
            format: LevelFormat.UPPER_ROMAN,
            text: "Step %1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: convertInchesToTwip(0.75), hanging: convertInchesToTwip(0.75) } } },
        },
    ],
};

const step = (text: string): Paragraph => new Paragraph({ numbering: { reference: steps, level: 0 }, children: [new TextRun(text)] });

const doc = new Document({
    sections: [{ children: [step("Measure the flour"), step("Mix in the water"), step("Bake for an hour")] }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
