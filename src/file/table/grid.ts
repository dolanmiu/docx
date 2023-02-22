// http://officeopenxml.com/WPtableGrid.php

// <xsd:complexType name="CT_TblGridCol">
//     <xsd:attribute name="w" type="s:ST_TwipsMeasure"/>
// </xsd:complexType>
// <xsd:complexType name="CT_TblGridBase">
//     <xsd:sequence>
//         <xsd:element name="gridCol" type="CT_TblGridCol" minOccurs="0" maxOccurs="unbounded"/>
//     </xsd:sequence>
// </xsd:complexType>

import { NextAttributeComponent, XmlComponent } from "@file/xml-components";
import { PositiveUniversalMeasure, twipsMeasureValue } from "@util/values";

export class TableGrid extends XmlComponent {
    public constructor(widths: readonly number[] | readonly PositiveUniversalMeasure[]) {
        super("w:tblGrid");
        for (const width of widths) {
            this.root.push(new GridCol(width));
        }
    }
}

export class GridCol extends XmlComponent {
    public constructor(width?: number | PositiveUniversalMeasure) {
        super("w:gridCol");
        if (width !== undefined) {
            this.root.push(
                new NextAttributeComponent<{ readonly width: number | PositiveUniversalMeasure }>({
                    width: { key: "w:w", value: twipsMeasureValue(width) },
                }),
            );
        }
    }
}
