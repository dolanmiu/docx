import * as fs from "fs";
import { Document, ImportDotx, Packer, Paragraph } from "../build";

const importDotx = new ImportDotx();
const filePath = "./demo/dotx/template.dotx";

fs.readFile(filePath, (err, data) => {
    if (err) {
        throw new Error(`Failed to read file ${filePath}.`);
    }

    importDotx.extract(data).then((templateDocument) => {
        // This any needs fixing
        const sectionProps = {
            titlePage: templateDocument.titlePageIsDefined,
        } as any;

        const doc = new Document(undefined, sectionProps, {
            template: templateDocument
        });
        const paragraph = new Paragraph("Hello World");
        doc.addParagraph(paragraph);

        const packer = new Packer();
        packer.toBuffer(doc).then((buffer) => {
            fs.writeFileSync("My Document.docx", buffer);
        });
    });

});
