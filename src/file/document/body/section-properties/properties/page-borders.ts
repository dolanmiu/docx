// http://officeopenxml.com/WPsectionBorders.php
import { BorderElement, IBorderOptions } from "@file/border";
import { IgnoreIfEmptyXmlComponent, XmlAttributeComponent } from "@file/xml-components";

// <xsd:simpleType name="ST_PageBorderDisplay">
// <xsd:restriction base="xsd:string">
//   <xsd:enumeration value="allPages"/>
//   <xsd:enumeration value="firstPage"/>
//   <xsd:enumeration value="notFirstPage"/>
// </xsd:restriction>
// </xsd:simpleType>
export enum PageBorderDisplay {
    ALL_PAGES = "allPages",
    FIRST_PAGE = "firstPage",
    NOT_FIRST_PAGE = "notFirstPage",
}

// <xsd:simpleType name="ST_PageBorderOffset">
// <xsd:restriction base="xsd:string">
//   <xsd:enumeration value="page"/>
//   <xsd:enumeration value="text"/>
// </xsd:restriction>
// </xsd:simpleType>
export enum PageBorderOffsetFrom {
    PAGE = "page",
    TEXT = "text",
}

// <xsd:simpleType name="ST_PageBorderZOrder">
// <xsd:restriction base="xsd:string">
//   <xsd:enumeration value="front"/>
//   <xsd:enumeration value="back"/>
// </xsd:restriction>
// </xsd:simpleType>
export enum PageBorderZOrder {
    BACK = "back",
    FRONT = "front",
}

export interface IPageBorderAttributes {
    readonly display?: PageBorderDisplay;
    readonly offsetFrom?: PageBorderOffsetFrom;
    readonly zOrder?: PageBorderZOrder;
}

export interface IPageBordersOptions {
    readonly pageBorders?: IPageBorderAttributes;
    readonly pageBorderTop?: IBorderOptions;
    readonly pageBorderRight?: IBorderOptions;
    readonly pageBorderBottom?: IBorderOptions;
    readonly pageBorderLeft?: IBorderOptions;
}

class PageBordersAttributes extends XmlAttributeComponent<IPageBorderAttributes> {
    protected readonly xmlKeys = {
        display: "w:display",
        offsetFrom: "w:offsetFrom",
        zOrder: "w:zOrder",
    };
}

// <xsd:complexType name="CT_PageBorders">
// <xsd:sequence>
//   <xsd:element name="top" type="CT_TopPageBorder" minOccurs="0"/>
//   <xsd:element name="left" type="CT_PageBorder" minOccurs="0"/>
//   <xsd:element name="bottom" type="CT_BottomPageBorder" minOccurs="0"/>
//   <xsd:element name="right" type="CT_PageBorder" minOccurs="0"/>
// </xsd:sequence>
// <xsd:attribute name="zOrder" type="ST_PageBorderZOrder" use="optional" default="front"/>
// <xsd:attribute name="display" type="ST_PageBorderDisplay" use="optional"/>
// <xsd:attribute name="offsetFrom" type="ST_PageBorderOffset" use="optional" default="text"/>
// </xsd:complexType>
export class PageBorders extends IgnoreIfEmptyXmlComponent {
    public constructor(options?: IPageBordersOptions) {
        super("w:pgBorders");

        if (!options) {
            return this;
        }

        if (options.pageBorders) {
            this.root.push(
                new PageBordersAttributes({
                    display: options.pageBorders.display,
                    offsetFrom: options.pageBorders.offsetFrom,
                    zOrder: options.pageBorders.zOrder,
                }),
            );
        } else {
            this.root.push(new PageBordersAttributes({}));
        }

        if (options.pageBorderTop) {
            this.root.push(new BorderElement("w:top", options.pageBorderTop));
        }
        if (options.pageBorderLeft) {
            this.root.push(new BorderElement("w:left", options.pageBorderLeft));
        }
        if (options.pageBorderBottom) {
            this.root.push(new BorderElement("w:bottom", options.pageBorderBottom));
        }
        if (options.pageBorderRight) {
            this.root.push(new BorderElement("w:right", options.pageBorderRight));
        }
    }
}
