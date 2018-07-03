import { XmlComponent, XmlAttributeComponent, IXmlableObject } from "file/xml-components";
import { BorderStyle } from "../styles";

interface ICellBorder {
    style: BorderStyle;
    size: number;
    color: string;
}

class CellBorderAttributes extends XmlAttributeComponent<ICellBorder> {
    protected xmlKeys = { style: "w:val", size: "w:sz", color: "w:color" };
}

class BaseTableCellBorder extends XmlComponent {
    setProperties(style: BorderStyle, size: number, color: string) {
        let attrs = new CellBorderAttributes({
            style: style,
            size: size,
            color: color,
        });
        this.root.push(attrs);
    }
}

export class TableCellBorders extends XmlComponent {
    constructor() {
        super("w:tcBorders");
    }

    public prepForXml(): IXmlableObject {
        return this.root.length > 0 ? super.prepForXml() : "";
    }

    addTopBorder(style: BorderStyle, size: number, color: string) {
        const top = new BaseTableCellBorder("w:top");
        top.setProperties(style, size, color);
        this.root.push(top);
    }

    addStartBorder(style: BorderStyle, size: number, color: string) {
        const start = new BaseTableCellBorder("w:start");
        start.setProperties(style, size, color);
        this.root.push(start);
    }

    addBottomBorder(style: BorderStyle, size: number, color: string) {
        const bottom = new BaseTableCellBorder("w:bottom");
        bottom.setProperties(style, size, color);
        this.root.push(bottom);
    }

    addEndBorder(style: BorderStyle, size: number, color: string) {
        const end = new BaseTableCellBorder("w:end");
        end.setProperties(style, size, color);
        this.root.push(end);
    }
}

/**
 * Attributes fot the GridSpan element.
 */
class GridSpanAttributes extends XmlAttributeComponent<{ val: number }> {
    protected xmlKeys = { val: "w:val" };
}

/**
 * GridSpan element. Should be used in a table cell. Pass the number of columns that this cell need to span.
 */
export class GridSpan extends XmlComponent {
    constructor(value: number) {
        super("w:gridSpan");

        this.root.push(
            new GridSpanAttributes({
                val: value,
            }),
        );
    }
}

/**
 * Vertical merge types.
 */
export enum VMergeType {
    /**
     * Cell that is merged with upper one.
     */
    CONTINUE = "continue",
    /**
     * Cell that is starting the vertical merge.
     */
    RESTART = "restart",
}

class VMergeAttributes extends XmlAttributeComponent<{ val: VMergeType }> {
    protected xmlKeys = { val: "w:val" };
}

/**
 * Vertical merge element. Should be used in a table cell.
 */
export class VMerge extends XmlComponent {
    constructor(value: VMergeType) {
        super("w:vMerge");

        this.root.push(
            new VMergeAttributes({
                val: value,
            }),
        );
    }
}

export enum VerticalAlign {
    BOTTOM = "bottom",
    CENTER = "center",
    TOP = "top",
}

class VAlignAttributes extends XmlAttributeComponent<{ val: VerticalAlign }> {
    protected xmlKeys = { val: "w:val" };
}

/**
 * Vertical align element.
 */
export class VAlign extends XmlComponent {
    constructor(value: VerticalAlign) {
        super("w:vAlign");

        this.root.push(
            new VAlignAttributes({
                val: value,
            }),
        );
    }
}

export enum WidthType {
    /** Auto. */
    AUTO = "auto",
    /** Value is in twentieths of a point */
    DXA = "dxa",
    /** No (empty) value. */
    NIL = "nil",
    /** Value is in percentage. */
    PERCENTAGE = "pct",
}

class TableCellWidthAttributes extends XmlAttributeComponent<{ type: WidthType; width: string | number }> {
    protected xmlKeys = { width: "w:w", type: "w:type" };
}

/**
 * Table cell width element.
 */
export class TableCellWidth extends XmlComponent {
    constructor(value: string | number, type: WidthType) {
        super("w:tcW");

        this.root.push(
            new TableCellWidthAttributes({
                width: value,
                type: type,
            }),
        );
    }
}
