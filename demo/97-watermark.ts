import { Document, Header, Packer, WatermarkOptions, WatermarkParagraph } from "docx";
import * as fs from "fs";

const watermarkOptions: WatermarkOptions = {
    text: "CONFIDENTIAL",
    color: "#C0C0C0",
    opacity: 0.5,
    fontSize: 36,
    fontFamily: "Arial",
    rotation: 315 // -45 degrees
};

const doc = new Document({
    sections: [{
        headers: {
            default: new Header({
                children: [
                    new WatermarkParagraph(watermarkOptions)
                ]
            })
        },
        children: [

        ]
    }]
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("watermark.docx", buffer);
});