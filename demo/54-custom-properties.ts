// Custom Properties
// Custom properties are incredibly useful if you want to be able to apply quick parts or custom cover pages
// to the document in Word after the document has been generated. Standard properties (such as creator, title
// and subject) cover typical use cases, but sometimes custom properties are required.

import * as fs from "fs";
import { Document, Packer } from "docx";

const doc = new Document(
    // Standard properties
    {
        creator: "Creator",
        title: "Title",
        subject: "Subject",
        description: "Description",
        customProperties: [
            { name: "Subtitle", value: "Subtitle" },
            { name: "Address", value: "Address" },
        ],
        sections: [],
    },
);

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
