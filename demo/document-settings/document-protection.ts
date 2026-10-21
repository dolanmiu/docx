// Protect a document so that it is read-only in Word, except for the parts anyone can still change
// See docs/usage/document-protection.md for full documentation.

import * as fs from "fs";
import { Document, DocumentProtectionType, EditableRangeEnd, EditableRangeStart, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

const doc = new Document({
    protection: {
        type: DocumentProtectionType.READ_ONLY,
        password: "docx",
    },
    sections: [
        {
            children: [
                new Paragraph({ text: "Leave request", heading: HeadingLevel.HEADING_1 }),
                new Paragraph("This form is protected: only the highlighted parts can be changed. The password is docx."),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Name: ", bold: true }),
                        new EditableRangeStart(1),
                        new TextRun("Type your name"),
                        new EditableRangeEnd(1),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Dates: ", bold: true }),
                        new EditableRangeStart(2),
                        new TextRun("From and to"),
                        new EditableRangeEnd(2),
                    ],
                }),
                new Paragraph({ children: [new TextRun({ text: "Reason", bold: true })] }),
                new Paragraph({ children: [new EditableRangeStart(3), new TextRun("Anything you write here,")] }),
                new Paragraph({ children: [new TextRun("over as many paragraphs as you need."), new EditableRangeEnd(3)] }),
                new Paragraph("Requests are answered within five working days."),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
