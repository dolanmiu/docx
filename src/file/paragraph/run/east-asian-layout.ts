/**
 * East Asian layout module for WordprocessingML run properties.
 *
 * This module provides Word's two lines in one, which sets a run's text in two half-size lines within one line, and
 * horizontal in vertical, which sets a run's text across the line in text that runs down the page.
 *
 * Reference: ISO/IEC 29500-1, 17.3.2.10 eastAsianLayout
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";
import { decimalNumber } from "@util/values";

/**
 * Brackets Word draws around text set as two lines in one.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_CombineBrackets">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="none"/>
 *     <xsd:enumeration value="round"/>
 *     <xsd:enumeration value="square"/>
 *     <xsd:enumeration value="angle"/>
 *     <xsd:enumeration value="curly"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export const TwoLinesInOneBrackets = {
    /** No brackets */
    NONE: "none",
    /** Round brackets: ( ) */
    ROUND: "round",
    /** Square brackets: [ ] */
    SQUARE: "square",
    /** Angle brackets: < > */
    ANGLE: "angle",
    /** Curly brackets: { } */
    CURLY: "curly",
} as const;

/**
 * Options for the East Asian layout of a run's text.
 *
 * @publicApi
 */
export type IEastAsianLayoutOptions = {
    /** Sets the run's text in two lines within one line, each at half the text's size, as Word's Two Lines in One does (`w:combine`) */
    readonly twoLinesInOne?: boolean;
    /** The brackets drawn around text set as two lines in one (`w:combineBrackets`). Without them, none are drawn. */
    readonly brackets?: (typeof TwoLinesInOneBrackets)[keyof typeof TwoLinesInOneBrackets];
    /**
     * Sets the run's text across the line in text that runs down the page, as Word's Horizontal in Vertical does (`w:vert`).
     * Word ignores it when `twoLinesInOne` is on.
     */
    readonly horizontalInVertical?: boolean;
    /**
     * Asks for text set across the line in vertical text to be squeezed so that it fits in the width of the line
     * (`w:vertCompress`). Word ignores it (MS-OI29500, 17.3.2.10), so only other applications may squeeze the text.
     */
    readonly fitToLine?: boolean;
    /**
     * Runs next to each other with the same group are laid out together, as one two lines in one or one piece of
     * horizontal in vertical text, so it can be made of runs formatted differently (`w:id`)
     */
    readonly group?: number;
};

type IEastAsianLayoutAttributes = {
    readonly id?: number;
    readonly combine?: boolean;
    readonly combineBrackets?: (typeof TwoLinesInOneBrackets)[keyof typeof TwoLinesInOneBrackets];
    readonly vert?: boolean;
    readonly vertCompress?: boolean;
};

/**
 * Creates the East Asian layout (`w:eastAsianLayout`) of a run's text.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_EastAsianLayout">
 *   <xsd:attribute name="id" type="ST_DecimalNumber" use="optional"/>
 *   <xsd:attribute name="combine" type="s:ST_OnOff" use="optional"/>
 *   <xsd:attribute name="combineBrackets" type="ST_CombineBrackets" use="optional"/>
 *   <xsd:attribute name="vert" type="s:ST_OnOff" use="optional"/>
 *   <xsd:attribute name="vertCompress" type="s:ST_OnOff" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * createEastAsianLayout({ twoLinesInOne: true, brackets: TwoLinesInOneBrackets.ROUND });
 * ```
 */
export const createEastAsianLayout = ({
    twoLinesInOne,
    brackets,
    horizontalInVertical,
    fitToLine,
    group,
}: IEastAsianLayoutOptions): XmlComponent =>
    new BuilderElement<IEastAsianLayoutAttributes>({
        name: "w:eastAsianLayout",
        attributes: {
            id: { key: "w:id", value: group === undefined ? undefined : decimalNumber(group) },
            combine: { key: "w:combine", value: twoLinesInOne },
            combineBrackets: { key: "w:combineBrackets", value: brackets },
            vert: { key: "w:vert", value: horizontalInVertical },
            vertCompress: { key: "w:vertCompress", value: fitToLine },
        },
    });
