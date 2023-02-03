import { BorderElement, IBorderOptions } from "@file/border";
import { IgnoreIfEmptyXmlComponent, XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { decimalNumber } from "@util/values";

// <xsd:complexType name="CT_TcBorders">
// <xsd:sequence>
//   <xsd:element name="top" type="CT_Border" minOccurs="0"/>
//   <xsd:element name="start" type="CT_Border" minOccurs="0"/>
//   <xsd:element name="left" type="CT_Border" minOccurs="0"/>
//   <xsd:element name="bottom" type="CT_Border" minOccurs="0"/>
//   <xsd:element name="end" type="CT_Border" minOccurs="0"/>
//   <xsd:element name="right" type="CT_Border" minOccurs="0"/>
//   <xsd:element name="insideH" type="CT_Border" minOccurs="0"/>
//   <xsd:element name="insideV" type="CT_Border" minOccurs="0"/>
//   <xsd:element name="tl2br" type="CT_Border" minOccurs="0"/>
//   <xsd:element name="tr2bl" type="CT_Border" minOccurs="0"/>
// </xsd:sequence>
// </xsd:complexType>

export interface ITableCellBorders {
    readonly top?: IBorderOptions;
    readonly start?: IBorderOptions;
    readonly left?: IBorderOptions;
    readonly bottom?: IBorderOptions;
    readonly end?: IBorderOptions;
    readonly right?: IBorderOptions;
}

export class TableCellBorders extends IgnoreIfEmptyXmlComponent {
    public constructor(options: ITableCellBorders) {
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

// <xsd:complexType name="CT_TcPrBase">
//   ...
//   <xsd:element name="gridSpan" type="CT_DecimalNumber" minOccurs="0"/>
// </xsd>
/**
 * GridSpan element. Should be used in a table cell. Pass the number of columns that this cell need to span.
 */
export class GridSpan extends XmlComponent {
    public constructor(value: number) {
        super("w:gridSpan");

        this.root.push(
            new GridSpanAttributes({
                val: decimalNumber(value),
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
    public constructor(value: VerticalMergeType) {
        super("w:vMerge");

        this.root.push(
            new VerticalMergeAttributes({
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
    public constructor(value: TextDirection) {
        super("w:textDirection");

        this.root.push(
            new TDirectionAttributes({
                val: value,
            }),
        );
    }
}
