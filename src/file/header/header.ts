// http://officeopenxml.com/WPheaders.php
import { InitializableXmlComponent, XmlComponent } from "@file/xml-components";
import { Paragraph } from "../paragraph";
import { Table } from "../table";
import { HeaderAttributes } from "./header-attributes";

export class Header extends InitializableXmlComponent {
    private readonly refId: number;

    public constructor(referenceNumber: number, initContent?: XmlComponent) {
        super("w:hdr", initContent);

        this.refId = referenceNumber;
        if (!initContent) {
            this.root.push(
                new HeaderAttributes({
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
                    cx: "http://schemas.microsoft.com/office/drawing/2014/chartex",
                    cx1: "http://schemas.microsoft.com/office/drawing/2015/9/8/chartex",
                    cx2: "http://schemas.microsoft.com/office/drawing/2015/10/21/chartex",
                    cx3: "http://schemas.microsoft.com/office/drawing/2016/5/9/chartex",
                    cx4: "http://schemas.microsoft.com/office/drawing/2016/5/10/chartex",
                    cx5: "http://schemas.microsoft.com/office/drawing/2016/5/11/chartex",
                    cx6: "http://schemas.microsoft.com/office/drawing/2016/5/12/chartex",
                    cx7: "http://schemas.microsoft.com/office/drawing/2016/5/13/chartex",
                    cx8: "http://schemas.microsoft.com/office/drawing/2016/5/14/chartex",
                    w16cid: "http://schemas.microsoft.com/office/word/2016/wordml/cid",
                    w16se: "http://schemas.microsoft.com/office/word/2015/wordml/symex",
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
