import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { Paragraph } from "../paragraph";
import { Header } from "./header";

describe("Header", () => {
    it("should create", () => {
        const header = new Header(1);

        const tree = new Formatter().format(header);

        expect(tree).to.deep.equal({
            "w:hdr": {
                _attr: {
                    "xmlns:cx": "http://schemas.microsoft.com/office/drawing/2014/chartex",
                    "xmlns:cx1": "http://schemas.microsoft.com/office/drawing/2015/9/8/chartex",
                    "xmlns:cx2": "http://schemas.microsoft.com/office/drawing/2015/10/21/chartex",
                    "xmlns:cx3": "http://schemas.microsoft.com/office/drawing/2016/5/9/chartex",
                    "xmlns:cx4": "http://schemas.microsoft.com/office/drawing/2016/5/10/chartex",
                    "xmlns:cx5": "http://schemas.microsoft.com/office/drawing/2016/5/11/chartex",
                    "xmlns:cx6": "http://schemas.microsoft.com/office/drawing/2016/5/12/chartex",
                    "xmlns:cx7": "http://schemas.microsoft.com/office/drawing/2016/5/13/chartex",
                    "xmlns:cx8": "http://schemas.microsoft.com/office/drawing/2016/5/14/chartex",
                    "xmlns:m": "http://schemas.openxmlformats.org/officeDocument/2006/math",
                    "xmlns:mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
                    "xmlns:o": "urn:schemas-microsoft-com:office:office",
                    "xmlns:r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
                    "xmlns:v": "urn:schemas-microsoft-com:vml",
                    "xmlns:w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
                    "xmlns:w10": "urn:schemas-microsoft-com:office:word",
                    "xmlns:w14": "http://schemas.microsoft.com/office/word/2010/wordml",
                    "xmlns:w15": "http://schemas.microsoft.com/office/word/2012/wordml",
                    "xmlns:w16cid": "http://schemas.microsoft.com/office/word/2016/wordml/cid",
                    "xmlns:w16se": "http://schemas.microsoft.com/office/word/2015/wordml/symex",
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
        const header = new Header(1, new Paragraph({}));

        const tree = new Formatter().format(header);

        expect(tree).to.deep.equal({
            "w:hdr": {},
        });
    });
});
