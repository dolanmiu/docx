/**
 * Demo 101: Comment replies (threading) and resolved comments.
 *
 * Shows two comment threads: one active with replies, one resolved.
 * See docs/usage/comments.md for full documentation.
 */

import * as fs from "fs";
import { CommentRangeEnd, CommentRangeStart, CommentReference, Document, Packer, Paragraph, TextRun } from "docx";

const doc = new Document({
    comments: {
        children: [
            {
                id: 0,
                author: "Alice",
                date: new Date("2026-04-14"),
                children: [new Paragraph("Active comment")],
            },
            {
                id: 1,
                author: "Robert",
                date: new Date("2026-04-14"),
                parentId: 0,
                children: [new Paragraph("Reply 1")],
            },
            {
                id: 2,
                author: "Alice",
                date: new Date("2026-04-14"),
                parentId: 0,
                children: [new Paragraph("Reply 2")],
            },
            {
                id: 3,
                author: "Charlie",
                date: new Date("2026-04-14"),
                resolved: true,
                children: [new Paragraph("Resolved comment")],
            },
            {
                id: 4,
                author: "Diana",
                date: new Date("2026-04-14"),
                parentId: 3,
                children: [new Paragraph("Reply 1")],
            },
        ],
    },
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun("This "),
                        new CommentRangeStart(0),
                        new CommentRangeStart(1),
                        new CommentRangeStart(2),
                        new TextRun({ text: "text", bold: true }),
                        new CommentRangeEnd(0),
                        new TextRun({ children: [new CommentReference(0)] }),
                        new CommentRangeEnd(1),
                        new TextRun({ children: [new CommentReference(1)] }),
                        new CommentRangeEnd(2),
                        new TextRun({ children: [new CommentReference(2)] }),
                        new TextRun(" has active comments"),
                    ],
                }),
                new Paragraph({ children: [new TextRun("")] }),
                new Paragraph({
                    children: [
                        new TextRun("This "),
                        new CommentRangeStart(3),
                        new CommentRangeStart(4),
                        new TextRun({ text: "text", bold: true }),
                        new CommentRangeEnd(3),
                        new TextRun({ children: [new CommentReference(3)] }),
                        new CommentRangeEnd(4),
                        new TextRun({ children: [new CommentReference(4)] }),
                        new TextRun(" has resolved comments"),
                    ],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
