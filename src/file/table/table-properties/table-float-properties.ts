import { StringEnumValueElement, XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { signedTwipsMeasureValue, twipsMeasureValue } from "@util/values";

export enum TableAnchorType {
    MARGIN = "margin",
    PAGE = "page",
    TEXT = "text",
}

export enum RelativeHorizontalPosition {
    CENTER = "center",
    INSIDE = "inside",
    LEFT = "left",
    OUTSIDE = "outside",
    RIGHT = "right",
}

export enum RelativeVerticalPosition {
    CENTER = "center",
    INSIDE = "inside",
    BOTTOM = "bottom",
    OUTSIDE = "outside",
    INLINE = "inline",
    TOP = "top",
}

// <xsd:simpleType name="ST_TblOverlap">
//     <xsd:restriction base="xsd:string">
//         <xsd:enumeration value="never"/>
//         <xsd:enumeration value="overlap"/>
//     </xsd:restriction>
// </xsd:simpleType>
export enum OverlapType {
    NEVER = "never",
    OVERLAP = "overlap",
}

export interface ITableFloatOptions {
    /* cSpell:disable */
    /**
     * Specifies the horizontal anchor or the base object from which the horizontal positioning in the
     * tblpX or tblpXSpec attribute should be determined.
     * margin - relative to the vertical edge of the text margin before any text runs (left edge for left-to-right paragraphs)
     * page - relative to the vertical edge of the page before any text runs (left edge for left-to-right paragraphs)
     * text - relative to the vertical edge of the text margin for the column in which the anchor paragraph is located
     * If omitted, the value is assumed to be page.
     */
    /* cSpell:enable */
    readonly horizontalAnchor?: TableAnchorType;

    /**
     * Specifies an absolute horizontal position for the table, relative to the horizontalAnchor.
     * The value is in twentieths of a point. Note that the value can be negative, in which case the
     * table is positioned before the anchor object in the direction of horizontal text flow.
     * If relativeHorizontalPosition is also specified, then the absoluteHorizontalPosition attribute is ignored.
     * If the attribute is omitted, the value is assumed to be zero.
     */
    readonly absoluteHorizontalPosition?: number | string;

    /**
     * Specifies a relative horizontal position for the table, relative to the horizontalAnchor attribute.
     * This will supersede the absoluteHorizontalPosition attribute.
     * Possible values are:
     * center - the table should be horizontally centered with respect to the anchor
     * inside - the table should be inside of the anchor
     * left - the table should be left aligned with respect to the anchor
     * outside - the table should be outside of the anchor
     * right - the table should be right aligned with respect to the anchor
     */
    readonly relativeHorizontalPosition?: RelativeHorizontalPosition;

    /**
     * Specifies the vertical anchor or the base object from which the vertical positioning
     * in the absoluteVerticalPosition attribute should be determined. Possible values are:
     * margin - relative to the horizontal edge of the text margin before any text runs (top edge for top-to-bottom paragraphs)
     * page - relative to the horizontal edge of the page before any text runs (top edge for top-to-bottom paragraphs)
     * text - relative to the horizontal edge of the text margin for the column in which the anchor paragraph is located
     * If omitted, the value is assumed to be page.
     */
    readonly verticalAnchor?: TableAnchorType;

    /**
     * Specifies an absolute vertical position for the table, relative to the verticalAnchor anchor.
     * The value is in twentieths of a point. Note that the value can be negative, in which case the table is
     * positioned before the anchor object in the direction of vertical text flow.
     * If relativeVerticalPosition is also specified, then the absoluteVerticalPosition attribute is ignored.
     * If the attribute is omitted, the value is assumed to be zero.
     */
    readonly absoluteVerticalPosition?: number | string;

    /**
     * Specifies a relative vertical position for the table, relative to the verticalAnchor attribute.
     * This will supersede the absoluteVerticalPosition attribute. Possible values are:
     * center - the table should be vertically centered with respect to the anchor
     * inside - the table should be vertically aligned to the edge of the anchor and inside the anchor
     * bottom - the table should be vertically aligned to the bottom edge of the anchor
     * outside - the table should be vertically aligned to the edge of the anchor and outside the anchor
     * inline - the table should be vertically aligned in line with the surrounding text (so as to not allow any text wrapping around it)
     * top - the table should be vertically aligned to the top edge of the anchor
     */
    readonly relativeVerticalPosition?: RelativeVerticalPosition;

    /**
     * Specifies the minimum distance to be maintained between the table and the top of text in the paragraph
     * below the table. The value is in twentieths of a point. If omitted, the value is assumed to be zero.
     */
    readonly bottomFromText?: number | string;

    /**
     * Specifies the minimum distance to be maintained between the table and the bottom edge of text in the paragraph
     * above the table. The value is in twentieths of a point. If omitted, the value is assumed to be zero.
     */
    readonly topFromText?: number | string;

    /**
     * Specifies the minimum distance to be maintained between the table and the edge of text in the paragraph
     * to the left of the table. The value is in twentieths of a point. If omitted, the value is assumed to be zero.
     */
    readonly leftFromText?: number | string;

    /**
     * Specifies the minimum distance to be maintained between the table and the edge of text in the paragraph
     * to the right of the table. The value is in twentieths of a point. If omitted, the value is assumed to be zero.
     */
    readonly rightFromText?: number | string;
    readonly overlap?: OverlapType;
}

// <xsd:complexType name="CT_TblPPr">
//     <xsd:attribute name="leftFromText" type="s:ST_TwipsMeasure"/>
//     <xsd:attribute name="rightFromText" type="s:ST_TwipsMeasure"/>
//     <xsd:attribute name="topFromText" type="s:ST_TwipsMeasure"/>
//     <xsd:attribute name="bottomFromText" type="s:ST_TwipsMeasure"/>
//     <xsd:attribute name="vertAnchor" type="ST_VAnchor"/>
//     <xsd:attribute name="horzAnchor" type="ST_HAnchor"/>
//     <xsd:attribute name="tblpXSpec" type="s:ST_XAlign"/>
//     <xsd:attribute name="tblpX" type="ST_SignedTwipsMeasure"/>
//     <xsd:attribute name="tblpYSpec" type="s:ST_YAlign"/>
//     <xsd:attribute name="tblpY" type="ST_SignedTwipsMeasure"/>
// </xsd:complexType>

export class TableFloatOptionsAttributes extends XmlAttributeComponent<ITableFloatOptions> {
    protected readonly xmlKeys = {
        horizontalAnchor: "w:horzAnchor",
        verticalAnchor: "w:vertAnchor",
        absoluteHorizontalPosition: "w:tblpX",
        relativeHorizontalPosition: "w:tblpXSpec",
        absoluteVerticalPosition: "w:tblpY",
        relativeVerticalPosition: "w:tblpYSpec",
        bottomFromText: "w:bottomFromText",
        topFromText: "w:topFromText",
        leftFromText: "w:leftFromText",
        rightFromText: "w:rightFromText",
    };
}

export class TableFloatProperties extends XmlComponent {
    public constructor({
        leftFromText,
        rightFromText,
        topFromText,
        bottomFromText,
        absoluteHorizontalPosition,
        absoluteVerticalPosition,
        ...options
    }: ITableFloatOptions) {
        super("w:tblpPr");
        this.root.push(
            new TableFloatOptionsAttributes({
                leftFromText: leftFromText === undefined ? undefined : twipsMeasureValue(leftFromText),
                rightFromText: rightFromText === undefined ? undefined : twipsMeasureValue(rightFromText),
                topFromText: topFromText === undefined ? undefined : twipsMeasureValue(topFromText),
                bottomFromText: bottomFromText === undefined ? undefined : twipsMeasureValue(bottomFromText),
                absoluteHorizontalPosition:
                    absoluteHorizontalPosition === undefined ? undefined : signedTwipsMeasureValue(absoluteHorizontalPosition),
                absoluteVerticalPosition:
                    absoluteVerticalPosition === undefined ? undefined : signedTwipsMeasureValue(absoluteVerticalPosition),
                ...options,
            }),
        );

        if (options.overlap) {
            // <xsd:complexType name="CT_TblOverlap">
            //     <xsd:attribute name="val" type="ST_TblOverlap" use="required"/>
            // </xsd:complexType>
            this.root.push(new StringEnumValueElement<OverlapType>("w:tblOverlap", options.overlap));
        }
    }
}
