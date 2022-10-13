// http://officeopenxml.com/WPtableGrid.php

// <xsd:complexType name="CT_TblGridCol">
//     <xsd:attribute name="w" type="s:ST_TwipsMeasure"/>
// </xsd:complexType>
// <xsd:complexType name="CT_TblGridBase">
//     <xsd:sequence>
//         <xsd:element name="gridCol" type="CT_TblGridCol" minOccurs="0" maxOccurs="unbounded"/>
//     </xsd:sequence>
// </xsd:complexType>

import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { twipsMeasureValue } from "@util/values";

export class TableGrid extends XmlComponent {
    public constructor(widths: readonly number[] | readonly string[]) {
        super("w:tblGrid");
        for (const width of widths) {
            this.root.push(new GridCol(width));
        }
    }
}

class GridColAttributes extends XmlAttributeComponent<{ readonly w: number | string }> {
    protected readonly xmlKeys = { w: "w:w" };
}

export class GridCol extends XmlComponent {
    public constructor(width?: number | string) {
        super("w:gridCol");
        if (width !== undefined) {
            this.root.push(new GridColAttributes({ w: twipsMeasureValue(width) }));
        }
    }
}
