/**
 * Titles of charts and axes (`c:title`), and the fonts of a chart's text.
 *
 * @module
 */
import type { XmlComponent } from "docx";

import { createElement, createText, createValue } from "./chart-elements";
import type { ChartFont, ChartTitle } from "./chart-options";
import { createBodyProperties, createNoShapeProperties, createParagraphProperties, createTextProperties } from "./chart-style";

/**
 * The font of a piece of the chart's text: its own, over the chart's.
 */
export const fontOf = (chartFont: ChartFont | undefined, font: ChartFont | undefined): ChartFont | undefined =>
    chartFont === undefined ? font : { ...chartFont, ...font };

/**
 * A title given as text, or as text with a font.
 */
export const titleOf = (title: string | ChartTitle): ChartTitle => (typeof title === "string" ? { text: title } : title);

type TitleOptions = {
    /** Size in points */
    readonly size: number;
    /** Rotation in 60,000ths of a degree */
    readonly rotation?: number;
    /** Letter spacing of 0, which Office writes on a chart's title */
    readonly spacing?: boolean;
    /** The chart's font */
    readonly font?: ChartFont;
};

/**
 * A title, as Office writes a chart's or an axis' title: its text, not over the plot, with no fill or line. Each line of
 * the text is a paragraph.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Title">
 *   <xsd:sequence>
 *     <xsd:element name="tx" type="CT_Tx" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="layout" type="CT_Layout" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="overlay" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="txPr" type="a:CT_TextBody" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
const createTitle = (title: string | ChartTitle, options: TitleOptions): XmlComponent => {
    const { text, font } = titleOf(title);
    const textOptions = { ...options, rotation: options.rotation ?? 0, font: fontOf(options.font, font) };
    return createElement("c:title", {}, [
        createElement("c:tx", {}, [
            createElement("c:rich", {}, [
                createBodyProperties(textOptions),
                createElement("a:lstStyle"),
                ...text
                    .split("\n")
                    .map((line) =>
                        createElement("a:p", {}, [
                            createParagraphProperties(textOptions),
                            createElement("a:r", {}, [createElement("a:rPr", { lang: "en-US" }), createText("a:t", line)]),
                        ]),
                    ),
            ]),
        ]),
        createValue("c:overlay", false),
        createNoShapeProperties(),
        createTextProperties(textOptions),
    ]);
};

/**
 * A chart's title, in 14 point text above the plot.
 */
export const createChartTitle = (title: string | ChartTitle, font?: ChartFont): XmlComponent =>
    createTitle(title, { size: 14, spacing: true, font });

/**
 * An axis' title, in 10 point text. A vertical axis' title reads from bottom to top.
 */
export const createAxisTitle = (title: string | ChartTitle, vertical: boolean, font?: ChartFont): XmlComponent =>
    createTitle(title, { size: 10, rotation: vertical ? -5400000 : 0, font });
