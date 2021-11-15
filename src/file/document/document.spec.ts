import { expect } from "chai";

import { Formatter } from "export/formatter";

import { Document } from "./document";

describe("Document", () => {
    let document: Document;

    beforeEach(() => {
        document = new Document({ background: {} });
    });

    describe("#constructor()", () => {
        it("should create valid JSON", () => {
            const tree = new Formatter().format(document);

            expect(tree).to.deep.equal({
                "w:document": [
                    {
                        _attr: {
                            "xmlns:wpc": "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas",
                            "xmlns:mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
                            "xmlns:o": "urn:schemas-microsoft-com:office:office",
                            "xmlns:r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
                            "xmlns:m": "http://schemas.openxmlformats.org/officeDocument/2006/math",
                            "xmlns:v": "urn:schemas-microsoft-com:vml",
                            "xmlns:wp14": "http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing",
                            "xmlns:wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
                            "xmlns:w10": "urn:schemas-microsoft-com:office:word",
                            "xmlns:w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
                            "xmlns:w14": "http://schemas.microsoft.com/office/word/2010/wordml",
                            "xmlns:w15": "http://schemas.microsoft.com/office/word/2012/wordml",
                            "xmlns:wpg": "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup",
                            "xmlns:wpi": "http://schemas.microsoft.com/office/word/2010/wordprocessingInk",
                            "xmlns:wne": "http://schemas.microsoft.com/office/word/2006/wordml",
                            "xmlns:wps": "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
                            "mc:Ignorable": "w14 w15 wp14",
                        },
                    },
                    {
                        "w:background": {
                            _attr: {},
                        },
                    },
                    { "w:body": {} },
                ],
            });
        });
    });
});
