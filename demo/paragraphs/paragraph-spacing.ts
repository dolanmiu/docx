// Simple example to add text to a document

import * as fs from "fs";
import { Document, LineRuleType, Packer, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            properties: {},
            children: [
                new Paragraph({
                    spacing: {
                        after: 5000,
                        before: 5000,
                    },
                    children: [new TextRun("Hello World")],
                }),
                new Paragraph({
                    spacing: {
                        line: 2000,
                        lineRule: LineRuleType.AUTO,
                    },
                    children: [
                        new TextRun(
                            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed turpis ex, aliquet et faucibus quis, euismod in odio. Fusce gravida tempor nunc sed lacinia. Nulla sed dolor fringilla, fermentum libero ut, egestas ex. Donec pellentesque metus non orci lacinia bibendum. Cras porta ex et mollis hendrerit. Suspendisse id lectus suscipit, elementum lacus eu, convallis felis. Fusce sed bibendum dolor, id posuere ligula. Aliquam eu elit ut urna eleifend vestibulum. Praesent condimentum at turpis sed scelerisque. Suspendisse porttitor metus nec vestibulum egestas. Sed in eros sapien. Morbi efficitur placerat est a consequat. Nunc bibendum porttitor mi nec tempus. Morbi dictum augue porttitor nisi sodales sodales.",
                        ),
                    ],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
