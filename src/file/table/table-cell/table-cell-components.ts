import { BorderElement, IBorderOptions } from "file/border";
import { IgnoreIfEmptyXmlComponent, XmlAttributeComponent, XmlComponent } from "file/xml-components";

export interface ITableCellBorders {
    readonly top?: IBorderOptions;
    readonly start?: IBorderOptions;
    readonly left?: IBorderOptions;
    readonly bottom?: IBorderOptions;
    readonly end?: IBorderOptions;
    readonly right?: IBorderOptions;
}

export class TableCellBorders extends IgnoreIfEmptyXmlComponent {
    constructor(options: ITableCellBorders) {
        super("w:tcBorders");

        if (options.top) {
            this.root.push(new BorderElement("w:top", options.top));
        }
        if (options.start) {
            this.root.push(new BorderElement("w:start", options.start));
        }
        if (options.left) {
            this.root.push(new BorderElement("w:left", options.left));
        }
        if (options.bottom) {
            this.root.push(new BorderElement("w:bottom", options.bottom));
        }
        if (options.end) {
            this.root.push(new BorderElement("w:end", options.end));
        }
        if (options.right) {
            this.root.push(new BorderElement("w:right", options.right));
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
