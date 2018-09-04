import { Document, Packer, Paragraph, ImportDocx } from "../build";
import * as fs from "fs";

let importDocx = new ImportDocx();
const filePath = "./demo/dotx/template.dotx";
fs.readFile(filePath, (err, data) => {
    if (err) {
        console.error(`failed to read file ${filePath}.`);
    }
    else {
        importDocx.extract(data).then(templateDocument => {
            let options = {};
            options['templateDocument'] = templateDocument;
            
            const doc = new Document(options);
            const paragraph = new Paragraph("Hello World");
            doc.addParagraph(paragraph);

            const packer = new Packer();
            packer.toBuffer(doc).then((buffer) => {
                fs.writeFileSync("MyDocument.docx", buffer);
                console.log('done. open MyDocument.docx');
            });
        
        });
    }
});