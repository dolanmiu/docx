/**
 * Table cell module for WordprocessingML documents.
 *
 * Reference: http://officeopenxml.com/WPtableCell.php
 *
 * @module
 */
import { Paragraph } from "@file/paragraph";
import { IContext, IXmlableObject, XmlComponent } from "@file/xml-components";

import { Table } from "../table";
import { ITableCellPropertiesOptions, TableCellProperties } from "./table-cell-properties";

/**
 * Options for creating a TableCell element.
 *
 * @see {@link TableCell}
 */
export type ITableCellOptions = {
    /** Array of Paragraph or nested Table elements that make up the cell content */
    readonly children: readonly (Paragraph | Table)[];
} & ITableCellPropertiesOptions;

/**
 * Represents a table cell in a WordprocessingML document.
 *
 * A table cell is the basic unit of content within a table. Each cell can contain
 * paragraphs, nested tables, or other block-level content. Cells must always end
 * with a paragraph element.
 *
 * Reference: http://officeopenxml.com/WPtableCell.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Tc">
 *   <xsd:sequence>
 *     <xsd:element name="tcPr" type="CT_TcPr" minOccurs="0" maxOccurs="1"/>
 *     <xsd:group ref="EG_BlockLevelElts" minOccurs="1" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="id" type="s:ST_String" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new TableCell({
 *   children: [new Paragraph("Cell content")],
 *   width: { size: 3000, type: WidthType.DXA },
 * });
 * ```
 */
export class TableCell extends XmlComponent {
    public constructor(public readonly options: ITableCellOptions) {
        super("w:tc");

        this.root.push(new TableCellProperties(options));

        for (const child of options.children) {
            this.root.push(child);
        }
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        // Cells must end with a paragraph
        if (!(this.root[this.root.length - 1] instanceof Paragraph)) {
            this.root.push(new Paragraph({}));
        }
        return super.prepForXml(context);
    }
}
