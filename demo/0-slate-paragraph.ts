// Simple example to add text to a document

import * as fs from "fs";
import { Document, Packer, Paragraph, Tab, TextRun } from "docx";
import { Element } from "slate";
import { Alignment, ElementKinds } from "./types/node-types";

const font = fs.readFileSync("./demo/assets/Pacifico.ttf");

const children: Element[] = [
    {
        type: ElementKinds.paragraph,
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

const doc = new Document({
    styles: {
        default: {
            document: {
                run: {
                    font: "Pacifico",
                },
            },
        },
    },
    sections: [
        {
            properties: {},
            children: [
                new Paragraph({
                    children: [
                        new TextRun("Hello World"),
                        new TextRun({
                            text: "Foo Bar",
                            bold: true,
                            size: 40,
                        }),
                        new TextRun({
                            children: [new Tab(), "Github is the best"],
                            bold: true,
                        }),
                    ],
                }),
            ],
        },
    ],
    fonts: [{ name: "Pacifico", data: font, characterSet: "00" }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
