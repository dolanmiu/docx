// Simple example to add text to a document

import * as fs from "fs";
import { Document, FileChild, HeadingLevel, IParagraphOptions, Packer, Paragraph, ShadingType, Tab, TextRun, UnderlineType } from "docx";
import { Element as SlateElement, Node as SlateNode } from "slate";
import { Alignment, ElementKinds } from "./types/node-types";
import { ColorTranslator } from "colortranslator";

const font = fs.readFileSync("./demo/assets/Pacifico.ttf");

const getHeadingLevel = (element: SlateElement) => {
    switch (element.type) {
        case ElementKinds.heading_1:
            return HeadingLevel.HEADING_1;
        case ElementKinds.heading_2:
            return HeadingLevel.HEADING_2;
        case ElementKinds.heading_3:
            return HeadingLevel.HEADING_3;
        case ElementKinds.heading_4:
            return HeadingLevel.HEADING_4;
        case ElementKinds.heading_5:
            return HeadingLevel.HEADING_5;
        case ElementKinds.heading_6:
            return HeadingLevel.HEADING_6;
        default:
            break;
    }
};

const children: SlateElement[] = [
    {
        type: ElementKinds.heading_1,
        children: [
            {
                text: "以下为数据演示: JSON",
            },
        ],
    },
    {
        type: ElementKinds.heading_2,
        children: [
            {
                text: "文本Marks",
            },
        ],
    },
    {
        type: ElementKinds.paragraph,
        children: [
            {
                text: "这是一段文本，包含了",
            },
            {
                text: "加粗文本",
                bold: true,
            },
            {
                text: "、",
            },
            {
                text: "斜体文本",
                italic: true,
            },
            {
                text: "、",
            },
            {
                text: "删除线",
                strike: true,
            },
            {
                text: "、",
            },
            {
                text: "下划线",
                underlined: true,
            },
            {
                text: "、",
            },
            {
                text: "文本颜色",
                color: "rgb(255, 1, 0)",
            },
            {
                text: "、",
            },
            {
                text: "文本背景色",
                "background-color": "rgb(255, 218, 0)",
            },
            {
                text: "和",
            },
            {
                text: "综合",
                bold: true,
                italic: true,
                "background-color": "rgb(255, 218, 0)",
                color: "rgb(255, 1, 0)",
            },
        ],
    },
    {
        type: ElementKinds.heading_2,
        children: [
            {
                text: "align",
            },
        ],
    },
    {
        type: ElementKinds.paragraph,
        children: [
            {
                text: "居左文本",
            },
        ],
    },
    {
        type: ElementKinds.paragraph,
        align: Alignment.center,
        children: [
            {
                text: "居中文本",
            },
        ],
    },
    {
        type: ElementKinds.paragraph,
        align: Alignment.right,
        children: [
            {
                text: "居右文本",
            },
        ],
    },
];

const docxChildren = children
    .map((element: SlateElement): FileChild | undefined => {
        const textRuns: TextRun[] = [];
        const texts = SlateNode.texts(element);
        for (const [text] of texts) {
            let color = undefined;
            let shading = undefined;
            if (text.color) {
                const textColorTranslator = new ColorTranslator(text.color);
                color = textColorTranslator.HEX;
            }
            if (text["background-color"]) {
                const backgroundColorTranslator = new ColorTranslator(text["background-color"]);
                shading = {
                    fill: backgroundColorTranslator.HEX,
                    color: "auto",
                    type: ShadingType.CLEAR,
                };
            }
            const textRun = new TextRun({
                text: text.text,
                bold: text.bold,
                italics: text.italic,
                underline: text.underlined ? { type: UnderlineType.SINGLE } : undefined,
                strike: text.strike,
                color,
                shading,
            });
            textRuns.push(textRun);
        }
        const heading = getHeadingLevel(element);
        let paragraph: FileChild | undefined = undefined;
        switch (element.type) {
            case ElementKinds.paragraph:
            case ElementKinds.heading_1:
            case ElementKinds.heading_2:
            case ElementKinds.heading_3:
            case ElementKinds.heading_4:
            case ElementKinds.heading_5:
            case ElementKinds.heading_6:
                paragraph = new Paragraph({ heading, children: textRuns });
                break;
            default:
                break;
        }
        return paragraph || undefined;
    })
    .filter((e) => !!e) as FileChild[];
console.log(docxChildren);
const doc = new Document({
    styles: {
        default: {
            heading1: {
                run: {
                    size: 28,
                },
            },
            heading2: {
                run: {
                    size: 24,
                },
            },
        },
    },
    sections: [
        {
            properties: {},
            children: docxChildren,
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
