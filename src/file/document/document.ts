// http://officeopenxml.com/WPdocument.php
import { XmlComponent } from "@file/xml-components";
import { ConcreteHyperlink, Paragraph } from "../paragraph";
import { Table } from "../table";
import { TableOfContents } from "../table-of-contents";
import { Body } from "./body";
import { DocumentAttributes } from "./document-attributes";
import { DocumentBackground, IDocumentBackgroundOptions } from "./document-background";

export interface IDocumentOptions {
    readonly background?: IDocumentBackgroundOptions;
}

// <xsd:element name="document" type="CT_Document"/>
//
// <xsd:complexType name="CT_Document">
//     <xsd:complexContent>
//         <xsd:extension base="CT_DocumentBase">
//             <xsd:sequence>
//                 <xsd:element name="body" type="CT_Body" minOccurs="0" maxOccurs="1"/>
//             </xsd:sequence>
//             <xsd:attribute name="conformance" type="s:ST_ConformanceClass"/>
//             <xsd:attribute ref="mc:Ignorable" use="optional" />
//         </xsd:extension>
//     </xsd:complexContent>
// </xsd:complexType>
//
// <xsd:complexType name="CT_DocumentBase">
//     <xsd:sequence>
//         <xsd:element name="background" type="CT_Background" minOccurs="0"/>
//     </xsd:sequence>
// </xsd:complexType>
export class Document extends XmlComponent {
    private readonly body: Body;

    public constructor(options: IDocumentOptions) {
        super("w:document");
        this.root.push(
            new DocumentAttributes({
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
                aink: "http://schemas.microsoft.com/office/drawing/2016/ink",
                am3d: "http://schemas.microsoft.com/office/drawing/2017/model3d",
                w16cex: "http://schemas.microsoft.com/office/word/2018/wordml/cex",
                w16cid: "http://schemas.microsoft.com/office/word/2016/wordml/cid",
                w16: "http://schemas.microsoft.com/office/word/2018/wordml",
                w16sdtdh: "http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash",
                w16se: "http://schemas.microsoft.com/office/word/2015/wordml/symex",
                Ignorable: "w14 w15 wp14",
            }),
        );
        this.body = new Body();
        if (options.background) {
            this.root.push(new DocumentBackground(options.background));
        }
        this.root.push(this.body);
    }

    public add(item: Paragraph | Table | TableOfContents | ConcreteHyperlink): Document {
        this.body.push(item);
        return this;
    }

    public get Body(): Body {
        return this.body;
    }
}
