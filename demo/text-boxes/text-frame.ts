// Text Frame (Text Box) example

import * as fs from "fs";
import {
    AlignmentType,
    BorderStyle,
    Document,
    FrameAnchorType,
    HorizontalPositionAlign,
    Packer,
    Paragraph,
    Tab,
    TextRun,
    VerticalPositionAlign,
} from "docx";

const doc = new Document({
    sections: [
        {
            properties: {},
            children: [
                new Paragraph({
                    frame: {
                        type: "absolute",
                        position: {
                            x: 1000,
                            y: 3000,
                        },
                        width: 4000,
                        height: 1000,
                        anchor: {
                            horizontal: FrameAnchorType.MARGIN,
                            vertical: FrameAnchorType.MARGIN,
                        },
                    },
                    border: {
                        top: {
                            color: "auto",
                            space: 1,
                            style: BorderStyle.SINGLE,
                            size: 6,
                        },
                        bottom: {
                            color: "auto",
                            space: 1,
                            style: BorderStyle.SINGLE,
                            size: 6,
                        },
                        left: {
                            color: "auto",
                            space: 1,
                            style: BorderStyle.SINGLE,
                            size: 6,
                        },
                        right: {
                            color: "auto",
                            space: 1,
                            style: BorderStyle.SINGLE,
                            size: 6,
                        },
                    },
                    children: [
                        new TextRun("Hello World"),
                        new TextRun({
                            text: "Foo Bar",
                            bold: true,
                        }),
                        new TextRun({
                            children: [new Tab(), "Github is the best"],
                            bold: true,
                        }),
                    ],
                }),
                new Paragraph({
                    frame: {
                        type: "alignment",
                        width: 4000,
                        height: 1000,
                        anchor: {
                            horizontal: FrameAnchorType.MARGIN,
                            vertical: FrameAnchorType.MARGIN,
                        },
                        alignment: {
                            x: HorizontalPositionAlign.CENTER,
                            y: VerticalPositionAlign.TOP,
                        },
                    },
                    border: {
                        top: {
                            color: "auto",
                            space: 1,
                            style: BorderStyle.SINGLE,
                            size: 6,
                        },
                        bottom: {
                            color: "auto",
                            space: 1,
                            style: BorderStyle.SINGLE,
                            size: 6,
                        },
                        left: {
                            color: "auto",
                            space: 1,
                            style: BorderStyle.SINGLE,
                            size: 6,
                        },
                        right: {
                            color: "auto",
                            space: 1,
                            style: BorderStyle.SINGLE,
                            size: 6,
                        },
                    },
                    children: [
                        new TextRun("Hello World"),
                        new TextRun({
                            text: "Foo Bar",
                            bold: true,
                        }),
                        new TextRun({
                            children: [new Tab(), "Github is the best"],
                            bold: true,
                        }),
                    ],
                }),
                new Paragraph({
                    frame: {
                        type: "alignment",
                        width: 4000,
                        height: 1000,
                        anchor: {
                            horizontal: FrameAnchorType.MARGIN,
                            vertical: FrameAnchorType.MARGIN,
                        },
                        alignment: {
                            x: HorizontalPositionAlign.CENTER,
                            y: VerticalPositionAlign.BOTTOM,
                        },
                    },
                    border: {
                        top: {
                            color: "auto",
                            space: 1,
                            style: BorderStyle.SINGLE,
                            size: 6,
                        },
                        bottom: {
                            color: "auto",
                            space: 1,
                            style: BorderStyle.SINGLE,
                            size: 6,
                        },
                        left: {
                            color: "auto",
                            space: 1,
                            style: BorderStyle.SINGLE,
                            size: 6,
                        },
                        right: {
                            color: "auto",
                            space: 1,
                            style: BorderStyle.SINGLE,
                            size: 6,
                        },
                    },
                    alignment: AlignmentType.RIGHT,
                    children: [
                        new TextRun("Hello World"),
                        new TextRun({
                            text: "Foo Bar",
                            bold: true,
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
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
