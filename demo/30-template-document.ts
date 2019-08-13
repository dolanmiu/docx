// Example on how to use a template document
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, ImportDotx, Packer, Paragraph } from "../build";

const importDotx = new ImportDotx();
const filePath = "./demo/dotx/template.dotx";

fs.readFile(filePath, (err, data) => {
    if (err) {
        throw new Error(`Failed to read file ${filePath}.`);
    }

    importDotx.extract(data).then((templateDocument) => {
        const doc = new Document(undefined, {
            template: templateDocument,
        });

        doc.addSection({
            properties: {
                titlePage: templateDocument.titlePageIsDefined,
            },
            children: [new Paragraph("Hello World")],
        });

        Packer.toBuffer(doc).then((buffer) => {
            fs.writeFileSync("My Document.docx", buffer);
        });
    });
});
