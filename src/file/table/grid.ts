// http://officeopenxml.com/WPtableGrid.php

// <xsd:complexType name="CT_TblGridCol">
//     <xsd:attribute name="w" type="s:ST_TwipsMeasure"/>
// </xsd:complexType>
// <xsd:complexType name="CT_TblGridBase">
//     <xsd:sequence>
//         <xsd:element name="gridCol" type="CT_TblGridCol" minOccurs="0" maxOccurs="unbounded"/>
//     </xsd:sequence>
// </xsd:complexType>

import { BuilderElement, XmlComponent } from "@file/xml-components";
import { PositiveUniversalMeasure, twipsMeasureValue } from "@util/values";

export const createGridCol = (width?: number | PositiveUniversalMeasure): XmlComponent =>
    new BuilderElement<{ readonly width?: number | PositiveUniversalMeasure }>({
        name: "w:gridCol",
        attributes:
            width !== undefined
                ? {
                      width: { key: "w:w", value: twipsMeasureValue(width) },
                  }
                : undefined,
    });

export const createTableGrid = (widths: readonly number[] | readonly PositiveUniversalMeasure[]): XmlComponent =>
    new BuilderElement({
        name: "w:tblGrid",
        children: widths.map((width) => createGridCol(width)),
    });
