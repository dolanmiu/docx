/**
 * Table row module for WordprocessingML documents.
 *
 * Reference: http://officeopenxml.com/WPtableRow.php
 *
 * @module
 */
import { type IContext, type IXmlableObject, OnOffElement, XmlComponent, elementOf } from "@file/xml-components";

import type { TableCell } from "../table-cell";
import { type ITableRowPropertiesOptions, TableRowProperties } from "./table-row-properties";

/**
 * Options for creating a TableRow element.
 *
 * @see {@link TableRow}
 */
export type ITableRowOptions = {
    /** Array of TableCell elements that make up the row */
    readonly children: readonly TableCell[];
    /**
     * Keeps the row on the same page as the next row (keep with next), by setting `keepNext` on each paragraph in
     * its cells that doesn't set its own. That includes the cells docx adds below a cell merged down several rows
     * (`rowSpan`), which have no paragraphs of yours to set it on. Word keeps a row with the next when the
     * paragraphs of its first cell are kept with the next, so set it on every row of a group but the last to keep
     * the group on one page.
     */
    readonly keepNext?: boolean;
} & ITableRowPropertiesOptions;

// Rows, cells, paragraphs and their properties have no attributes, so their content is their children, or empty
const childrenOf = (element: IXmlableObject, name: string): readonly unknown[] => {
    const content = element[name];
    return Array.isArray(content) ? content : [];
};

const nameOf = (element: unknown): string | undefined => Object.keys(element as object)[0];

/**
 * The paragraph with `keepNext` in its properties, unless it has its own. It goes after the paragraph's style, as
 * the schema orders them.
 */
const withKeepNext = (paragraph: IXmlableObject, keepNext: IXmlableObject): IXmlableObject => {
    const children = childrenOf(paragraph, "w:p");
    const properties = children.find((child) => nameOf(child) === "w:pPr") as IXmlableObject | undefined;
    if (!properties) {
        return { "w:p": [{ "w:pPr": [keepNext] }, ...children] };
    }

    const settings = childrenOf(properties, "w:pPr");
    if (settings.some((setting) => nameOf(setting) === "w:keepNext")) {
        return paragraph;
    }
    const before = settings.filter((setting) => nameOf(setting) === "w:pStyle").length;
    const newProperties = { "w:pPr": [...settings.slice(0, before), keepNext, ...settings.slice(before)] };
    return { "w:p": children.map((child) => (child === properties ? newProperties : child)) };
};

/**
 * Represents a table row in a WordprocessingML document.
 *
 * A table row is a single row of cells within a table. Each row contains
 * one or more table cells that hold the actual content.
 *
 * Reference: http://officeopenxml.com/WPtableRow.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Row">
 *   <xsd:sequence>
 *     <xsd:element name="tblPrEx" type="CT_TblPrEx" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="trPr" type="CT_TrPr" minOccurs="0" maxOccurs="1"/>
 *     <xsd:group ref="EG_ContentCellContent" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="rsidRPr" type="ST_LongHexNumber"/>
 *   <xsd:attribute name="rsidR" type="ST_LongHexNumber"/>
 *   <xsd:attribute name="rsidDel" type="ST_LongHexNumber"/>
 *   <xsd:attribute name="rsidTr" type="ST_LongHexNumber"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new TableRow({
 *   children: [
 *     new TableCell({ children: [new Paragraph("Cell 1")] }),
 *     new TableCell({ children: [new Paragraph("Cell 2")] }),
 *   ],
 * });
 * ```
 */
export class TableRow extends XmlComponent {
    public constructor(private readonly options: ITableRowOptions) {
        super("w:tr");
        this.root.push(new TableRowProperties(options));

        for (const child of options.children) {
            this.root.push(child);
        }
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        const xml = super.prepForXml(context);
        if (!xml || this.options.keepNext === undefined) {
            return xml;
        }

        const keepNext = new OnOffElement("w:keepNext", this.options.keepNext).prepForXml(context) as IXmlableObject;
        // Only the paragraphs right in the cells, not those of tables nested in them, which have rows of their own
        return {
            "w:tr": childrenOf(xml, "w:tr").map((child) =>
                nameOf(child) === "w:tc"
                    ? {
                          "w:tc": childrenOf(child as IXmlableObject, "w:tc").map((content) =>
                              nameOf(content) === "w:p" ? withKeepNext(content as IXmlableObject, keepNext) : content,
                          ),
                      }
                    : child,
            ),
        };
    }

    public get CellCount(): number {
        return this.options.children.length;
    }

    public get cells(): readonly TableCell[] {
        // Including cells from another copy of docx
        return this.root.filter((xmlComponent) => elementOf(xmlComponent) === "w:tc");
    }

    public addCellToIndex(cell: TableCell, index: number): void {
        // Offset because properties is also in root.
        this.root.splice(index + 1, 0, cell);
    }

    public addCellToColumnIndex(cell: TableCell, columnIndex: number): void {
        const rootIndex = this.columnIndexToRootIndex(columnIndex, true);
        this.addCellToIndex(cell, rootIndex - 1);
    }

    public rootIndexToColumnIndex(rootIndex: number): number {
        // convert the root index to the virtual column index
        if (rootIndex < 1 || rootIndex >= this.root.length) {
            throw new Error(`cell 'rootIndex' should between 1 to ${this.root.length - 1}`);
        }
        let colIdx = 0;
        // Offset because properties is also in root.
        for (let rootIdx = 1; rootIdx < rootIndex; rootIdx++) {
            const cell = this.root[rootIdx] as TableCell;
            colIdx += cell.options.columnSpan || 1;
        }
        return colIdx;
    }

    public columnIndexToRootIndex(columnIndex: number, allowEndNewCell: boolean = false): number {
        // convert the virtual column index to the root index
        // `allowEndNewCell` for get index to inert new cell
        if (columnIndex < 0) {
            throw new Error(`cell 'columnIndex' should not less than zero`);
        }
        let colIdx = 0;
        // Offset because properties is also in root.
        let rootIdx = 1;
        while (colIdx <= columnIndex) {
            if (rootIdx >= this.root.length) {
                if (allowEndNewCell) {
                    // for inserting verticalMerge CONTINUE cell at end of row
                    return this.root.length;
                } else {
                    throw new Error(`cell 'columnIndex' should not great than ${colIdx - 1}`);
                }
            }
            const cell = this.root[rootIdx] as TableCell;
            rootIdx += 1;
            colIdx += (cell && cell.options.columnSpan) || 1;
        }
        return rootIdx - 1;
    }
}
