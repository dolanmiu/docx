// http://officeopenxml.com/WPtableGrid.php

// <xsd:complexType name="CT_TblGridCol">
//     <xsd:attribute name="w" type="s:ST_TwipsMeasure"/>
// </xsd:complexType>
// <xsd:complexType name="CT_TblGridBase">
//     <xsd:sequence>
//         <xsd:element name="gridCol" type="CT_TblGridCol" minOccurs="0" maxOccurs="unbounded"/>
//     </xsd:sequence>
// </xsd:complexType>
// <xsd:complexType name="CT_TblGridChange">
//     <xsd:complexContent>
//         <xsd:extension base="CT_Markup">
//             <xsd:sequence>
//                 <xsd:element name="tblGrid" type="CT_TblGridBase"/>
//             </xsd:sequence>
//         </xsd:extension>
//     </xsd:complexContent>
// </xsd:complexType>

import { NextAttributeComponent, XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { PositiveUniversalMeasure, twipsMeasureValue } from "@util/values";

export type ITableGridChangeOptions = {
    readonly id: number;
    readonly columnWidths: readonly number[] | readonly PositiveUniversalMeasure[];
};

export class TableGrid extends XmlComponent {
    public constructor(widths: readonly number[] | readonly PositiveUniversalMeasure[], revision?: ITableGridChangeOptions) {
        super("w:tblGrid");
        for (const width of widths) {
            this.root.push(new GridCol(width));
        }
        if (revision) {
            this.root.push(new TableGridChange(revision));
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

class TableGridChangeAttributes extends XmlAttributeComponent<{ readonly id: number }> {
    protected readonly xmlKeys = { id: "w:id" };
}

export class TableGridChange extends XmlComponent {
    public constructor(options: ITableGridChangeOptions) {
        super("w:tblGridChange");
        this.root.push(
            new TableGridChangeAttributes({
                id: options.id,
            }),
        );
        this.root.push(new TableGrid(options.columnWidths));
    }
}
