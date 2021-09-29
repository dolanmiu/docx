import * as fs from "fs";
import * as unzipper from "unzipper";
import { validateXMLWithXSD } from "validate-with-xmllint";

const main = async () => {
    fs.copyFileSync("My Document.docx", "scripts/schema-validator/work-area/doc.zip");

    const zip = await unzipper.Open.file("scripts/schema-validator/work-area/doc.zip");
    await zip.extract({
        path: "scripts/schema-validator/work-area/doc",
    });

    const xml = fs.readFileSync("scripts/schema-validator/work-area/doc/word/document.xml", "ascii");

    await validateXMLWithXSD(xml, "scripts/schema-validator/schemas/microsoft/wml-2010.xsd");
};

main();
