// Track revisions for inline images (ImageRun insertion / deletion wrappers).
// See docs/usage/change-tracking.md.

import * as fs from "fs";
import { AlignmentType, Document, ImageRun, Packer, Paragraph, TextRun } from "docx";

const REVISION_DATE = "2020-10-06T09:00:00Z";
const REVISION_AUTHOR = "Firstname Lastname";

const imagePath = "./demo/images/dog.png";

const doc = new Document({
    features: {
        trackRevisions: true,
    },
    sections: [
        {
            properties: {},
            children: [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: "Track changes: images",
                            bold: true,
                            size: 32,
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun("Below: an image marked as inserted (w:ins wrapping the run), then an image marked as deleted."),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Inserted image: ", bold: true }),
                        new ImageRun({
                            type: "png",
                            data: fs.readFileSync(imagePath),
                            transformation: {
                                width: 120,
                                height: 120,
                            },
                            insertion: {
                                id: 30,
                                author: REVISION_AUTHOR,
                                date: REVISION_DATE,
                            },
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Deleted image: ", bold: true }),
                        new ImageRun({
                            type: "png",
                            data: fs.readFileSync(imagePath),
                            transformation: {
                                width: 120,
                                height: 120,
                            },
                            deletion: {
                                id: 31,
                                author: REVISION_AUTHOR,
                                date: REVISION_DATE,
                            },
                        }),
                    ],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("101-track-change-images.docx", buffer);
    console.log("Document created successfully at 101-track-change-images.docx");
});
