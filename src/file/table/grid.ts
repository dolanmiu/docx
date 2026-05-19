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
 * <xsd:complexType name="CT_TblGridChange">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_Markup">
 *       <xsd:sequence>
 *         <xsd:element name="tblGrid" type="CT_TblGridBase"/>
 *       </xsd:sequence>
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 * ```
 *
 * @module
 */
import { BuilderElement, XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { type PositiveUniversalMeasure, twipsMeasureValue } from "@util/values";

export type ITableGridChangeOptions = {
    readonly id: number;
    readonly columnWidths: readonly number[] | readonly PositiveUniversalMeasure[];
};

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
export class TableGrid extends XmlComponent {
    public constructor(widths: readonly number[] | readonly PositiveUniversalMeasure[], revision?: ITableGridChangeOptions) {
        super("w:tblGrid");
        for (const width of widths) {
            this.root.push(createGridCol(width));
        }
        if (revision) {
            this.root.push(new TableGridChange(revision));
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
