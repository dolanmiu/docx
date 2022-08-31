import { OnOffElement, StringValueElement, XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { Name, UiPriority } from "./components";

// <xsd:complexType name="CT_Style">
//     <xsd:sequence>
//         <xsd:element name="name" type="CT_String" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="aliases" type="CT_String" minOccurs="0"/>
//         <xsd:element name="basedOn" type="CT_String" minOccurs="0"/>
//         <xsd:element name="next" type="CT_String" minOccurs="0"/>
//         <xsd:element name="link" type="CT_String" minOccurs="0"/>
//         <xsd:element name="autoRedefine" type="CT_OnOff" minOccurs="0"/>
//         <xsd:element name="hidden" type="CT_OnOff" minOccurs="0"/>
//         <xsd:element name="uiPriority" type="CT_DecimalNumber" minOccurs="0"/>
//         <xsd:element name="semiHidden" type="CT_OnOff" minOccurs="0"/>
//         <xsd:element name="unhideWhenUsed" type="CT_OnOff" minOccurs="0"/>
//         <xsd:element name="qFormat" type="CT_OnOff" minOccurs="0"/>
//         <xsd:element name="locked" type="CT_OnOff" minOccurs="0"/>
//         <xsd:element name="personal" type="CT_OnOff" minOccurs="0"/>
//         <xsd:element name="personalCompose" type="CT_OnOff" minOccurs="0"/>
//         <xsd:element name="personalReply" type="CT_OnOff" minOccurs="0"/>
//         <xsd:element name="rsid" type="CT_LongHexNumber" minOccurs="0"/>
//         <xsd:element name="pPr" type="CT_PPrGeneral" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="rPr" type="CT_RPr" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="tblPr" type="CT_TblPrBase" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="trPr" type="CT_TrPr" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="tcPr" type="CT_TcPr" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="tblStylePr" type="CT_TblStylePr" minOccurs="0" maxOccurs="unbounded"/>
//     </xsd:sequence>
//     <xsd:attribute name="type" type="ST_StyleType" use="optional"/>
//     <xsd:attribute name="styleId" type="s:ST_String" use="optional"/>
//     <xsd:attribute name="default" type="s:ST_OnOff" use="optional"/>
//     <xsd:attribute name="customStyle" type="s:ST_OnOff" use="optional"/>
// </xsd:complexType>

export interface IStyleAttributes {
    readonly type?: string;
    readonly styleId?: string;
    readonly default?: boolean;
    readonly customStyle?: string;
}

export interface IStyleOptions {
    readonly name?: string;
    readonly basedOn?: string;
    readonly next?: string;
    readonly link?: string;
    readonly uiPriority?: number;
    readonly semiHidden?: boolean;
    readonly unhideWhenUsed?: boolean;
    readonly quickFormat?: boolean;
}

class StyleAttributes extends XmlAttributeComponent<IStyleAttributes> {
    protected readonly xmlKeys = {
        type: "w:type",
        styleId: "w:styleId",
        default: "w:default",
        customStyle: "w:customStyle",
    };
}

export class Style extends XmlComponent {
    public constructor(attributes: IStyleAttributes, options: IStyleOptions) {
        super("w:style");
        this.root.push(new StyleAttributes(attributes));
        if (options.name) {
            this.root.push(new Name(options.name));
        }

        if (options.basedOn) {
            this.root.push(new StringValueElement("w:basedOn", options.basedOn));
        }

        if (options.next) {
            this.root.push(new StringValueElement("w:next", options.next));
        }

        if (options.link) {
            this.root.push(new StringValueElement("w:link", options.link));
        }

        if (options.uiPriority !== undefined) {
            this.root.push(new UiPriority(options.uiPriority));
        }

        if (options.semiHidden !== undefined) {
            this.root.push(new OnOffElement("w:semiHidden", options.semiHidden));
        }

        if (options.unhideWhenUsed !== undefined) {
            this.root.push(new OnOffElement("w:unhideWhenUsed", options.unhideWhenUsed));
        }

        if (options.quickFormat !== undefined) {
            this.root.push(new OnOffElement("w:qFormat", options.quickFormat));
        }
    }
}
