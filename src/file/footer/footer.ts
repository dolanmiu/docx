// http://officeopenxml.com/WPfooters.php
import { InitializableXmlComponent, XmlComponent } from "@file/xml-components";
import { Paragraph } from "../paragraph";
import { Table } from "../table";
import { FooterAttributes } from "./footer-attributes";

export class Footer extends InitializableXmlComponent {
    private readonly refId: number;

    public constructor(referenceNumber: number, initContent?: XmlComponent) {
        super("w:ftr", initContent);
        this.refId = referenceNumber;
        if (!initContent) {
            this.root.push(
                new FooterAttributes({
                    wpc: "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas",
                    mc: "http://schemas.openxmlformats.org/markup-compatibility/2006",
                    o: "urn:schemas-microsoft-com:office:office",
                    r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
                    m: "http://schemas.openxmlformats.org/officeDocument/2006/math",
                    v: "urn:schemas-microsoft-com:vml",
                    wp14: "http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing",
                    wp: "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
                    w10: "urn:schemas-microsoft-com:office:word",
                    w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
                    w14: "http://schemas.microsoft.com/office/word/2010/wordml",
                    w15: "http://schemas.microsoft.com/office/word/2012/wordml",
                    wpg: "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup",
                    wpi: "http://schemas.microsoft.com/office/word/2010/wordprocessingInk",
                    wne: "http://schemas.microsoft.com/office/word/2006/wordml",
                    wps: "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
                }),
            );
        }
    }

    public get ReferenceId(): number {
        return this.refId;
    }

    public add(item: Paragraph | Table): void {
        this.root.push(item);
    }
}
