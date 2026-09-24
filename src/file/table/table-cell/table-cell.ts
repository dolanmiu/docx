/**
 * Table cell module for WordprocessingML documents.
 *
 * Reference: http://officeopenxml.com/WPtableCell.php
 *
 * @module
 */
import type { IBorderOptions } from "@file/border";
import { Paragraph } from "@file/paragraph";
import type { IShadingAttributesProperties } from "@file/shading";
import { type IContext, type IXmlableObject, XmlComponent } from "@file/xml-components";

import type { Table } from "../table";
import type { ITableCellBorders } from "./table-cell-components";
import { type ITableCellPropertiesOptions, TableCellProperties } from "./table-cell-properties";

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
 * Borders and shading with hex colors, as a cell's options had them before they took colors of the document's theme.
 *
 * @inline
 */
type WithHexColors<T> = Omit<T, "borders" | "shading"> & {
    readonly borders?: { readonly [Side in keyof ITableCellBorders]: Omit<IBorderOptions, "color"> & { readonly color?: string } };
    readonly shading?: Omit<IShadingAttributesProperties, "color" | "fill"> & { readonly fill?: string; readonly color?: string };
};

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
    /**
     * The options the cell was created with.
     *
     * Its borders and shading are declared with hex colors, as they were before they took colors of the document's
     * theme, so that code reading them still compiles. A cell given a theme color has it here as it was given.
     */
    public readonly options: WithHexColors<Omit<ITableCellOptions, "revision">> & {
        readonly revision?: WithHexColors<NonNullable<ITableCellOptions["revision"]>>;
    };

    public constructor(options: ITableCellOptions) {
        super("w:tc");
        // Declared with the types it had before theme colors, which a minor release can't change
        this.options = options as TableCell["options"];

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
