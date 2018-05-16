import { IXmlableObject, XmlAttributeComponent, XmlComponent } from "file/xml-components";

export enum BorderStyle {
    SINGLE = "single",
    DASH_DOT_STROKED = "dashDotStroked",
    DASHED = "dashed",
    DASH_SMALL_GAP = "dashSmallGap",
    DOT_DASH = "dotDash",
    DOT_DOT_DASH = "dotDotDash",
    DOTTED = "dotted",
    DOUBLE = "double",
    DOUBLE_WAVE = "doubleWave",
    INSET = "inset",
    NIL = "nil",
    NONE = "none",
    OUTSET = "outset",
    THICK = "thick",
    THICK_THIN_LARGE_GAP = "thickThinLargeGap",
    THICK_THIN_MEDIUM_GAP = "thickThinMediumGap",
    THICK_THIN_SMALL_GAP = "thickThinSmallGap",
    THIN_THICK_LARGE_GAP = "thinThickLargeGap",
    THIN_THICK_MEDIUM_GAP = "thinThickMediumGap",
    THIN_THICK_SMALL_GAP = "thinThickSmallGap",
    THIN_THICK_THIN_LARGE_GAP = "thinThickThinLargeGap",
    THIN_THICK_THIN_MEDIUM_GAP = "thinThickThinMediumGap",
    THIN_THICK_THIN_SMALL_GAP = "thinThickThinSmallGap",
    THREE_D_EMBOSS = "threeDEmboss",
    THREE_D_ENGRAVE = "threeDEngrave",
    TRIPLE = "triple",
    WAVE = "wave",
}

interface ICellBorder {
    style: BorderStyle;
    size: number;
    color: string;
}

class CellBorderAttributes extends XmlAttributeComponent<ICellBorder> {
    protected xmlKeys = { style: "w:val", size: "w:sz", color: "w:color" };
}

class BaseTableCellBorder extends XmlComponent {
    public setProperties(style: BorderStyle, size: number, color: string): BaseTableCellBorder {
        const attrs = new CellBorderAttributes({
            style: style,
            size: size,
            color: color,
        });
        this.root.push(attrs);

        return this;
    }
}

export class TableCellBorders extends XmlComponent {
    constructor() {
        super("w:tcBorders");
    }

    public prepForXml(): IXmlableObject {
        return this.root.length > 0 ? super.prepForXml() : "";
    }

    public addTopBorder(style: BorderStyle, size: number, color: string): TableCellBorders {
        const top = new BaseTableCellBorder("w:top");
        top.setProperties(style, size, color);
        this.root.push(top);

        return this;
    }

    public addStartBorder(style: BorderStyle, size: number, color: string): TableCellBorders {
        const start = new BaseTableCellBorder("w:start");
        start.setProperties(style, size, color);
        this.root.push(start);

        return this;
    }

    public addBottomBorder(style: BorderStyle, size: number, color: string): TableCellBorders {
        const bottom = new BaseTableCellBorder("w:bottom");
        bottom.setProperties(style, size, color);
        this.root.push(bottom);

        return this;
    }

    public addEndBorder(style: BorderStyle, size: number, color: string): TableCellBorders {
        const end = new BaseTableCellBorder("w:end");
        end.setProperties(style, size, color);
        this.root.push(end);

        return this;
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
