// Simple example to add text to a document
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { AlignmentType, convertMillimetersToTwip, Document, Packer, Paragraph, TextRun } from "../build";

const doc = new Document({
    styles: {
        paragraphStyles: [
            {
                id: "test",
                name: "Test",
                basedOn: "Normal",
                next: "Normal",
                paragraph: {
                    indent: { left: convertMillimetersToTwip(6.4) },
                },
            },
        ],
    },
    sections: [
        {
            properties: {
                page: {
                    margin: {
                        top: 0,
                        right: convertMillimetersToTwip(24),
                        bottom: convertMillimetersToTwip(24),
                        left: convertMillimetersToTwip(24),
                    },
                },
            },
            children: [
                new Paragraph({
                    alignment: AlignmentType.THAI_DISTRIBUTE,
                    children: [
                        new TextRun({
                            text: "บริษัทฯ มีเงินสด 41,985.00 บาท และ 25,855.66 บาทตามลำดับ เงินสดทั้งจำนวนอยู่ในความดูแลและรับผิดชอบของกรรมการ บริษัทฯบันทึกการรับชำระเงินและการจ่ายชำระเงินผ่านบัญชีเงินสดเพียงเท่านั้น ซึ่งอาจกระทบต่อความถูกต้องครบถ้วนของการบันทึกบัญชี ทั้งนี้ขึ้นอยู่กับระบบการควบคุมภายในของบริษัท",
                            size: 28,
                        }),
                    ],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
