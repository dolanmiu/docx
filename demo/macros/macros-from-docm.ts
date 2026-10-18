// A macro-enabled document with the macros of a .docm Word saved: its word/vbaProject.bin

import * as fs from "fs";
import { Document, Packer, Paragraph } from "docx";

const doc = new Document({
    macros: {
        project: fs.readFileSync("./demo/assets/vbaProject.bin"),
        // The events its ThisDocument handles, which its .docm lists in word/vbaData.xml: Document_Open
        events: ["open"],
    },
    sections: [
        {
            children: [
                new Paragraph("Enable macros when Word asks, and the document says where its macros came from below."),
                new Paragraph("Run SayHello from View > Macros to say hello."),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docm", buffer);
});
