// Simple example to add text to a document
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph, TextRun, CommentRangeStart, CommentRangeEnd, Comments, Comment, CommentReference, PrettityType } from "../build";

const doc = new Document({
  comments: new Comments([new Comment({ id: '0', author: 'Ray Chen', date: new Date().toISOString() }, 'comment text content')]),
  sections: [
    {
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun("Hello World"),
            new CommentRangeStart({ id: "0" }),
            new TextRun({
              text: "Foo Bar",
              bold: true,
            }),
            new CommentRangeEnd({ id: "0" }),
            new TextRun({
              children: [
                new CommentReference({ id: "0" })
              ],
              bold: true,
            }),
          ],
        }),
      ],
    },
  ],
},
);
Packer.toBuffer(doc, PrettityType.WITH_2_BLANKS).then((buffer) => {
  fs.writeFileSync("document-comments.docx", buffer);
});
