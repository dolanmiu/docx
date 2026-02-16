/**
 * Page margin module for WordprocessingML section properties.
 *
 * Defines page margins for document sections.
 *
 * Reference: http://officeopenxml.com/WPsectionPr.php
 *
 * @module
 */
import { NextAttributeComponent, XmlComponent } from "@file/xml-components";
import { PositiveUniversalMeasure, UniversalMeasure, signedTwipsMeasureValue, twipsMeasureValue } from "@util/values";

/**
 * Options for configuring page margins.
 *
 * All measurements are in twips (1/20th of a point) or universal measure.
 *
 * @property top - Top margin
 * @property right - Right margin
 * @property bottom - Bottom margin
 * @property left - Left margin
 * @property header - Header margin (distance from top of page to header)
 * @property footer - Footer margin (distance from bottom of page to footer)
 * @property gutter - Gutter margin for binding
 */
export type IPageMarginAttributes = {
    /** Top margin in twips or universal measure */
    readonly top?: number | UniversalMeasure;
    /** Right margin in twips or universal measure */
    readonly right?: number | PositiveUniversalMeasure;
    /** Bottom margin in twips or universal measure */
    readonly bottom?: number | UniversalMeasure;
    /** Left margin in twips or universal measure */
    readonly left?: number | PositiveUniversalMeasure;
    /** Header margin (distance from top of page to header) in twips or universal measure */
    readonly header?: number | PositiveUniversalMeasure;
    /** Footer margin (distance from bottom of page to footer) in twips or universal measure */
    readonly footer?: number | PositiveUniversalMeasure;
    /** Gutter margin for binding in twips or universal measure */
    readonly gutter?: number | PositiveUniversalMeasure;
};

/**
 * Represents page margins (pgMar) for a document section.
 *
 * This element specifies the page margins for all pages in a section,
 * including top, bottom, left, right, header, footer, and gutter margins.
 *
 * Reference: http://officeopenxml.com/WPsectionPr.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PageMar">
 *   <xsd:attribute name="top" type="ST_SignedTwipsMeasure" use="required"/>
 *   <xsd:attribute name="right" type="s:ST_TwipsMeasure" use="required"/>
 *   <xsd:attribute name="bottom" type="ST_SignedTwipsMeasure" use="required"/>
 *   <xsd:attribute name="left" type="s:ST_TwipsMeasure" use="required"/>
 *   <xsd:attribute name="header" type="s:ST_TwipsMeasure" use="required"/>
 *   <xsd:attribute name="footer" type="s:ST_TwipsMeasure" use="required"/>
 *   <xsd:attribute name="gutter" type="s:ST_TwipsMeasure" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create page margins with 1 inch margins (1440 twips = 1 inch)
 * new PageMargin(1440, 1440, 1440, 1440, 720, 720, 0);
 * ```
 */
export class PageMargin extends XmlComponent {
    public constructor(
        top: number | UniversalMeasure,
        right: number | PositiveUniversalMeasure,
        bottom: number | UniversalMeasure,
        left: number | PositiveUniversalMeasure,
        header: number | PositiveUniversalMeasure,
        footer: number | PositiveUniversalMeasure,
        gutter: number | PositiveUniversalMeasure,
    ) {
        super("w:pgMar");
        this.root.push(
            new NextAttributeComponent<IPageMarginAttributes>({
                top: { key: "w:top", value: signedTwipsMeasureValue(top) },
                right: { key: "w:right", value: twipsMeasureValue(right) },
                bottom: { key: "w:bottom", value: signedTwipsMeasureValue(bottom) },
                left: { key: "w:left", value: twipsMeasureValue(left) },
                header: { key: "w:header", value: twipsMeasureValue(header) },
                footer: { key: "w:footer", value: twipsMeasureValue(footer) },
                gutter: { key: "w:gutter", value: twipsMeasureValue(gutter) },
            }),
        );
    }
}
