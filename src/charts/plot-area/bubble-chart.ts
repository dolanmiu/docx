/**
 * Bubble charts (`c:bubbleChart`).
 *
 * @module
 */
import type { ChartData } from "../chart-data";
import { createElement, createValue } from "../chart-elements";
import type { BubbleChartOptions, ChartFont } from "../chart-options";
import { createBubbleSeriesProperties } from "../chart-style";
import { PRIMARY_AXES, createPointAxes } from "./axes";
import { type ChartGroups, labelsOf } from "./chart-group";
import { createGroupDataLabels, createSeriesDataLabels } from "./data-labels";
import { createDataSource, createSeriesStart } from "./series";

/**
 * A bubble chart, with two value axes. Each bubble is filled with its series' colour at 75% opacity, as Office draws
 * them, so the bubbles behind show through.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_BubbleChart">
 *   <xsd:sequence>
 *     <xsd:element name="varyColors" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="ser" type="CT_BubbleSer" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="dLbls" type="CT_DLbls" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="bubble3D" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="bubbleScale" type="CT_BubbleScale" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="showNegBubbles" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="sizeRepresents" type="CT_SizeRepresents" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="axId" type="CT_UnsignedInt" minOccurs="2" maxOccurs="2"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 *
 * <xsd:complexType name="CT_BubbleSer">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_SerShared" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="invertIfNegative" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="dPt" type="CT_DPt" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="dLbls" type="CT_DLbls" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="trendline" type="CT_Trendline" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="errBars" type="CT_ErrBars" minOccurs="0" maxOccurs="2"/>
 *     <xsd:element name="xVal" type="CT_AxDataSource" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="yVal" type="CT_NumDataSource" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="bubbleSize" type="CT_NumDataSource" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="bubble3D" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createBubbleChart = (options: BubbleChartOptions, data: ChartData, font: ChartFont | undefined): ChartGroups => ({
    groups: [
        createElement("c:bubbleChart", {}, [
            createValue("c:varyColors", false),
            ...data.series.map((series, index) => {
                const own = options.series[index];
                return createElement("c:ser", {}, [
                    ...createSeriesStart(index, series),
                    createBubbleSeriesProperties(index, own.color),
                    createValue("c:invertIfNegative", false),
                    ...createSeriesDataLabels(labelsOf(own.dataLabels, options.dataLabels), { shape: "points", series: own.name, font }),
                    createDataSource("c:xVal", series.categories),
                    createDataSource("c:yVal", series.values),
                    // Every bubble series has sizes
                    createDataSource("c:bubbleSize", series.sizes!),
                    createValue("c:bubble3D", false),
                ]);
            }),
            createGroupDataLabels(),
            createValue("c:bubbleScale", Math.round(options.bubbleScale ?? 100)),
            createValue("c:showNegBubbles", false),
            createValue("c:sizeRepresents", options.sizeRepresents === "width" ? "w" : "area"),
            createValue("c:axId", PRIMARY_AXES.category),
            createValue("c:axId", PRIMARY_AXES.value),
        ]),
    ],
    axes: createPointAxes(options, font),
});
