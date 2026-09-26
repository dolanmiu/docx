/**
 * Trendlines (`c:trendline`): lines fitted to a series' values.
 *
 * @module
 */
import type { XmlComponent } from "docx";

import { createElement, createText, createValue } from "../chart-elements";
import type { ChartFont, ChartTrendline, ChartTrendlineType } from "../chart-options";
import { createNoShapeProperties, createTextProperties, createTrendlineProperties } from "../chart-style";
import { fontOf } from "../chart-text";
import { formatNumber } from "./series";

// Each type mapped to its OOXML name (`ST_TrendlineType`)
const TRENDLINE_OOXML_NAMES: Readonly<Record<ChartTrendlineType, string>> = {
    linear: "linear",
    exponential: "exp",
    logarithmic: "log",
    polynomial: "poly",
    power: "power",
    movingAverage: "movingAvg",
};

/**
 * The label of a trendline's equation and R² value, in 9 point text, as Office writes it.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_TrendlineLbl">
 *   <xsd:sequence>
 *     <xsd:element name="layout" type="CT_Layout" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tx" type="CT_Tx" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="numFmt" type="CT_NumFmt" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="txPr" type="a:CT_TextBody" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
const createTrendlineLabel = ({ label = {} }: ChartTrendline, font: ChartFont | undefined): XmlComponent =>
    createElement("c:trendlineLbl", {}, [
        createElement("c:layout"),
        createElement("c:numFmt", { formatCode: label.numberFormat ?? "General", sourceLinked: 0 }),
        createNoShapeProperties(),
        createTextProperties({ size: 9, rotation: 0, font: fontOf(font, label.font) }),
    ]);

/**
 * A series' trendlines, each a dotted line in the series' colour, with its equation and R² value if asked for. A
 * trendline without a name of its own is named in the legend by the application, as Office names it, such as "Linear
 * (Sales)", in its own language.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Trendline">
 *   <xsd:sequence>
 *     <xsd:element name="name" type="xsd:string" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="trendlineType" type="CT_TrendlineType" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="order" type="CT_Order" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="period" type="CT_Period" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="forward" type="CT_Double" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="backward" type="CT_Double" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="intercept" type="CT_Double" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="dispRSqr" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="dispEq" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="trendlineLbl" type="CT_TrendlineLbl" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @param seriesColor - Creates the series' colour
 * @param font - The chart's font
 */
export const createTrendlines = (
    trendlines: readonly ChartTrendline[] = [],
    seriesColor: () => XmlComponent,
    font: ChartFont | undefined,
): readonly XmlComponent[] =>
    trendlines.map((trendline) => {
        const { type, name, forecastForward, forecastBackward, intercept, equation = false, rSquared = false } = trendline;
        const numbers = [
            ["c:forward", forecastForward],
            ["c:backward", forecastBackward],
            ["c:intercept", intercept],
        ] as const;
        return createElement("c:trendline", {}, [
            ...(name === undefined ? [] : [createText("c:name", name)]),
            createTrendlineProperties(seriesColor(), trendline.line),
            createValue("c:trendlineType", TRENDLINE_OOXML_NAMES[type]),
            ...(type === "polynomial" ? [createValue("c:order", trendline.order ?? 2)] : []),
            ...(type === "movingAverage" ? [createValue("c:period", trendline.period ?? 2)] : []),
            ...numbers.flatMap(([element, value]) => (value === undefined ? [] : [createValue(element, formatNumber(value))])),
            createValue("c:dispRSqr", rSquared),
            createValue("c:dispEq", equation),
            ...(equation || rSquared ? [createTrendlineLabel(trendline, font)] : []),
        ]);
    });
