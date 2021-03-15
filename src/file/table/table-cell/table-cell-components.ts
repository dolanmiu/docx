import { BorderStyle } from "file/styles";
import { IgnoreIfEmptyXmlComponent, XmlAttributeComponent, XmlComponent } from "file/xml-components";

class CellBorderAttributes extends XmlAttributeComponent<{
    readonly style: BorderStyle;
    readonly size: number;
    readonly color: string;
}> {
    protected readonly xmlKeys = { style: "w:val", size: "w:sz", color: "w:color" };
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

export class TableCellBorders extends IgnoreIfEmptyXmlComponent {
    constructor() {
        super("w:tcBorders");
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

    public addLeftBorder(style: BorderStyle, size: number, color: string): TableCellBorders {
        const left = new BaseTableCellBorder("w:left");
        left.setProperties(style, size, color);
        this.root.push(left);

        return this;
    }

    public addRightBorder(style: BorderStyle, size: number, color: string): TableCellBorders {
        const right = new BaseTableCellBorder("w:right");
        right.setProperties(style, size, color);
        this.root.push(right);

        return this;
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
