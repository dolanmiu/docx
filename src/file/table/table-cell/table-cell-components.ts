import { BorderStyle } from "file/styles";
import { IgnoreIfEmptyXmlComponent, XmlAttributeComponent, XmlComponent } from "file/xml-components";

interface ITableCellBorderPropertyOptions {
    readonly style: BorderStyle;
    readonly size: number;
    readonly color: string;
}

class CellBorderAttributes extends XmlAttributeComponent<{
    readonly style: BorderStyle;
    readonly size: number;
    readonly color: string;
}> {
    protected readonly xmlKeys = { style: "w:val", size: "w:sz", color: "w:color" };
}

class BaseTableCellBorder extends XmlComponent {
    constructor(key: string, options: ITableCellBorderPropertyOptions) {
        super(key);
        this.root.push(new CellBorderAttributes(options));
    }
}

export interface ITableCellBorders {
    readonly top?: ITableCellBorderPropertyOptions;
    readonly start?: ITableCellBorderPropertyOptions;
    readonly left?: ITableCellBorderPropertyOptions;
    readonly bottom?: ITableCellBorderPropertyOptions;
    readonly end?: ITableCellBorderPropertyOptions;
    readonly right?: ITableCellBorderPropertyOptions;
}

export class TableCellBorders extends IgnoreIfEmptyXmlComponent {
    constructor(options: ITableCellBorders) {
        super("w:tcBorders");

        if (options.top) {
            this.root.push(new BaseTableCellBorder("w:top", options.top));
        }
        if (options.start) {
            this.root.push(new BaseTableCellBorder("w:start", options.start));
        }
        if (options.left) {
            this.root.push(new BaseTableCellBorder("w:left", options.left));
        }
        if (options.bottom) {
            this.root.push(new BaseTableCellBorder("w:bottom", options.bottom));
        }
        if (options.end) {
            this.root.push(new BaseTableCellBorder("w:end", options.end));
        }
        if (options.right) {
            this.root.push(new BaseTableCellBorder("w:right", options.right));
        }
    }
}

/**
 * Attributes fot the GridSpan element.
 */
class GridSpanAttributes extends XmlAttributeComponent<{ readonly val: number }> {
    protected readonly xmlKeys = { val: "w:val" };
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
export enum VerticalMergeType {
    /**
     * Cell that is merged with upper one.
     */
    CONTINUE = "continue",
    /**
     * Cell that is starting the vertical merge.
     */
    RESTART = "restart",
}

class VerticalMergeAttributes extends XmlAttributeComponent<{ readonly val: VerticalMergeType }> {
    protected readonly xmlKeys = { val: "w:val" };
}

/**
 * Vertical merge element. Should be used in a table cell.
 */
export class VerticalMerge extends XmlComponent {
    constructor(value: VerticalMergeType) {
        super("w:vMerge");

        this.root.push(
            new VerticalMergeAttributes({
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

class VAlignAttributes extends XmlAttributeComponent<{ readonly val: VerticalAlign }> {
    protected readonly xmlKeys = { val: "w:val" };
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

export enum TextDirection {
    BOTTOM_TO_TOP_LEFT_TO_RIGHT = "btLr",
    LEFT_TO_RIGHT_TOP_TO_BOTTOM = "lrTb",
    TOP_TO_BOTTOM_RIGHT_TO_LEFT = "tbRl",
}

class TDirectionAttributes extends XmlAttributeComponent<{ readonly val: TextDirection }> {
    protected readonly xmlKeys = { val: "w:val" };
}

/**
 * Text Direction within a table cell
 */
export class TDirection extends XmlComponent {
    constructor(value: TextDirection) {
        super("w:textDirection");

        this.root.push(
            new TDirectionAttributes({
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

class TableCellWidthAttributes extends XmlAttributeComponent<{ readonly type: WidthType; readonly width: string | number }> {
    protected readonly xmlKeys = { width: "w:w", type: "w:type" };
}

/**
 * Table cell width element.
 */
export class TableCellWidth extends XmlComponent {
    constructor(value: string | number, type: WidthType = WidthType.AUTO) {
        super("w:tcW");

        this.root.push(
            new TableCellWidthAttributes({
                width: value,
                type: type,
            }),
        );
    }
}
