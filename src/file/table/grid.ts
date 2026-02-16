/**
 * Table grid module for WordprocessingML documents.
 *
 * The table grid defines the column structure of a table.
 *
 * Reference: http://officeopenxml.com/WPtableGrid.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_TblGridCol">
 *   <xsd:attribute name="w" type="s:ST_TwipsMeasure"/>
 * </xsd:complexType>
 * <xsd:complexType name="CT_TblGridBase">
 *   <xsd:sequence>
 *     <xsd:element name="gridCol" type="CT_TblGridCol" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";
import { PositiveUniversalMeasure, twipsMeasureValue } from "@util/values";

/**
 * Creates a single column in the table grid.
 *
 * The gridCol element specifies the width of a single column.
 */
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

/**
 * Creates the table grid for a WordprocessingML document.
 *
 * The tblGrid element defines the number and width of columns in the table.
 *
 * Reference: http://officeopenxml.com/WPtableGrid.php
 */
export const createTableGrid = (widths: readonly number[] | readonly PositiveUniversalMeasure[]): XmlComponent =>
    new BuilderElement({
        name: "w:tblGrid",
        children: widths.map((width) => createGridCol(width)),
    });
