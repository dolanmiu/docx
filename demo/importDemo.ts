import { Document, Packer, Paragraph, ImportDocx } from "../build";
import * as fs from "fs";

console.log(process.cwd());

let importDocx = new ImportDocx();
fs.readFile("./src/importDocx/simple.dotx", (err, data) => {
    if (err) {
        console.log(err);
    }
    else {
        importDocx.read(data).then(xmlComp => {
            console.log(xmlComp);
            const doc = new Document({templateHeader : xmlComp});
            // const doc = new Document();
            const paragraph = new Paragraph("Hello World");
            doc.addParagraph(paragraph);

            // console.log(JSON.stringify(xmlComp, null, 2));
            const packer = new Packer();

            packer.toBuffer(doc).then((buffer) => {
                fs.writeFileSync("MyDocument.docx", buffer);
            });
        
        });
    }
});