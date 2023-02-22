// Simple example apply positional tabs to a document
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import {
    Document,
    Packer,
    Paragraph,
    PositionalTab,
    Tab,
    TextRun,
    PositionalTabAlignment,
    PositionalTabRelativeTo,
    PositionalTabLeader,
} from "../build";

const doc = new Document({
    sections: [
        {
            properties: {},
            children: [
                new Paragraph({
                    children: [
                        new TextRun("Full name"),
                        new TextRun({
                            children: [
                                new PositionalTab({
                                    alignment: PositionalTabAlignment.RIGHT,
                                    relativeTo: PositionalTabRelativeTo.MARGIN,
                                    leader: PositionalTabLeader.DOT,
                                }),
                                "John Doe",
                            ],
                            bold: true,
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun("Hello World"),
                        new TextRun({
                            children: [
                                new PositionalTab({
                                    alignment: PositionalTabAlignment.CENTER,
                                    relativeTo: PositionalTabRelativeTo.INDENT,
                                    leader: PositionalTabLeader.HYPHEN,
                                }),
                                "Foo bar",
                            ],
                            bold: true,
                        }),
                    ],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
