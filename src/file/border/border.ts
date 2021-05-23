// Note that the border type is identical in all places,
// regardless of where it's used like paragraph/table/etc.
//
// http://officeopenxml.com/WPborders.php
// http://officeopenxml.com/WPtableBorders.php
// http://officeopenxml.com/WPtableCellProperties-Borders.php
//
// This describes the CT_Border type.
// <xsd:complexType name="CT_Border">
//     <xsd:attribute name="val" type="ST_Border" use="required"/>
//     <xsd:attribute name="color" type="ST_HexColor" use="optional" default="auto"/>
//     <xsd:attribute name="themeColor" type="ST_ThemeColor" use="optional"/>
//     <xsd:attribute name="themeTint" type="ST_UcharHexNumber" use="optional"/>
//     <xsd:attribute name="themeShade" type="ST_UcharHexNumber" use="optional"/>
//     <xsd:attribute name="sz" type="ST_EighthPointMeasure" use="optional"/>
//     <xsd:attribute name="space" type="ST_PointMeasure" use="optional" default="0"/>
//     <xsd:attribute name="shadow" type="s:ST_OnOff" use="optional"/>
//     <xsd:attribute name="frame" type="s:ST_OnOff" use="optional"/>
// </xsd:complexType>
import { BorderStyle } from "file/styles";
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export interface IBorderOptions {
    readonly style: BorderStyle;
    readonly color?: string;
    readonly size?: number;
    readonly space?: number;
}

export class BorderElement extends XmlComponent {
    constructor(elementName: string, options: IBorderOptions) {
        super(elementName);
        this.root.push(new TableBordersAttributes(options));
    }
}

class TableBordersAttributes extends XmlAttributeComponent<IBorderOptions> {
    protected readonly xmlKeys = {
        style: "w:val",
        color: "w:color",
        size: "w:sz",
        space: "w:space",
    };
}
