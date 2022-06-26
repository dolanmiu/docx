import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { Paragraph } from "../paragraph";
import { Footer } from "./footer";

describe("Footer", () => {
    it("should create", () => {
        const footer = new Footer(1);

        const tree = new Formatter().format(footer);

        expect(tree).to.deep.equal({
            "w:ftr": {
                _attr: {
                    "xmlns:m": "http://schemas.openxmlformats.org/officeDocument/2006/math",
                    "xmlns:mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
                    "xmlns:o": "urn:schemas-microsoft-com:office:office",
                    "xmlns:r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
                    "xmlns:v": "urn:schemas-microsoft-com:vml",
                    "xmlns:w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
                    "xmlns:w10": "urn:schemas-microsoft-com:office:word",
                    "xmlns:w14": "http://schemas.microsoft.com/office/word/2010/wordml",
                    "xmlns:w15": "http://schemas.microsoft.com/office/word/2012/wordml",
                    "xmlns:wne": "http://schemas.microsoft.com/office/word/2006/wordml",
                    "xmlns:wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
                    "xmlns:wp14": "http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing",
                    "xmlns:wpc": "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas",
                    "xmlns:wpg": "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup",
                    "xmlns:wpi": "http://schemas.microsoft.com/office/word/2010/wordprocessingInk",
                    "xmlns:wps": "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
                },
            },
        });
    });

    it("should create with initContent", () => {
        const header = new Footer(1, new Paragraph({}));

        const tree = new Formatter().format(header);

        expect(tree).to.deep.equal({
            "w:ftr": {},
        });
    });
});
