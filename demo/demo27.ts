import * as fs from "fs";
import { Document, ImportDocx, Packer, Paragraph } from "../build";

const importDocx = new ImportDocx();
const filePath = "./demo/dotx/template.dotx";

fs.readFile(filePath, (err, data) => {
    if (err) {
        throw new Error(`Failed to read file ${filePath}.`);
    }

    importDocx.extract(data).then((templateDocument) => {
        // This any needs fixing
        const options = {
            templateDocument,
        } as any;

        const doc = new Document(options);
        const paragraph = new Paragraph("Hello World");
        doc.addParagraph(paragraph);

        const packer = new Packer();
        packer.toBuffer(doc).then((buffer) => {
            fs.writeFileSync("My Document.docx", buffer);
        });
    });
});
