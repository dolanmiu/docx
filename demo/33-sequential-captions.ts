// Sequential Captions
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph, TextRun } from "../build";

const doc = new Document();

doc.addSection({
    children: [
        new Paragraph("Hello World 1->")
            .addSequentialIdentifier("Caption")
            .addRun(new TextRun(" text after sequencial caption 2->"))
            .addSequentialIdentifier("Caption"),
        new Paragraph("Hello World 1->")
            .addSequentialIdentifier("Label")
            .addRun(new TextRun(" text after sequencial caption 2->"))
            .addSequentialIdentifier("Label"),
        new Paragraph("Hello World 1->")
            .addSequentialIdentifier("Another")
            .addRun(new TextRun(" text after sequencial caption 3->"))
            .addSequentialIdentifier("Label"),
        new Paragraph("Hello World 2->")
            .addSequentialIdentifier("Another")
            .addRun(new TextRun(" text after sequencial caption 4->"))
            .addSequentialIdentifier("Label"),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
