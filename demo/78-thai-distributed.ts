// Simple example to add text to a document
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { AlignmentType, Document, Packer, Paragraph, TextRun } from "../build";

const doc = new Document({
    sections: [
        {
            properties: {},
            children: [
                new Paragraph({
                    alignment: AlignmentType.THAI_DISTRIBUTE,
                    children: [
                        new TextRun({
                            text: "บริษัท บิสกิด จำกัด (บริษัทฯ) ได้จดทะเบียนจัดตั้งขึ้นเป็นบริษัทจำกัดตามประมวลกฎหมายแพ่งและพาณิชย์ของประเทศไทย เมื่อวันที่ 30 พฤษภาคม 2561 ทะเบียนนิติบุคคลเลขที่ 0845561005665",
                            size: 36,
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
