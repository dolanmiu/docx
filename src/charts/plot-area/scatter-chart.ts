/**
 * Scatter charts (`c:scatterChart`).
 *
 * @module
 */
import type { XmlComponent } from "docx";

import type { ChartData } from "../chart-data";
import { createElement, createValue } from "../chart-elements";
import type { ChartFont, ScatterChartOptions } from "../chart-options";
import { createScatterSeriesProperties, createSeriesColor } from "../chart-style";
import { PRIMARY_AXES, createPointAxes } from "./axes";
import { type ChartGroups, labelsOf } from "./chart-group";
import { createGroupDataLabels, createSeriesDataLabels } from "./data-labels";
import { createSeriesMarker } from "./line-chart";
import { createDataSource, createSeriesStart } from "./series";

/**
 * A scatter chart, with two value axes. Applications draw a scatter series' line from the series' own line, whatever
 * `c:scatterStyle` says, so a series without lines has a line with no fill, as Word's "Scatter" writes it.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_ScatterChart">
 *   <xsd:sequence>
 *     <xsd:element name="scatterStyle" type="CT_ScatterStyle" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="varyColors" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="ser" type="CT_ScatterSer" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="dLbls" type="CT_DLbls" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="axId" type="CT_UnsignedInt" minOccurs="2" maxOccurs="2"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 *
 * <xsd:complexType name="CT_ScatterSer">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_SerShared" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="marker" type="CT_Marker" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="dPt" type="CT_DPt" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="dLbls" type="CT_DLbls" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="trendline" type="CT_Trendline" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="errBars" type="CT_ErrBars" minOccurs="0" maxOccurs="2"/>
 *     <xsd:element name="xVal" type="CT_AxDataSource" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="yVal" type="CT_NumDataSource" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="smooth" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createScatterChart = (options: ScatterChartOptions, data: ChartData, font: ChartFont | undefined): ChartGroups => {
    const lines = options.lines ?? "none";
    const markers = options.markers ?? true;

    return {
        groups: [
            createElement("c:scatterChart", {}, [
                createValue("c:scatterStyle", lines === "smooth" ? "smoothMarker" : "lineMarker"),
                createValue("c:varyColors", false),
                ...data.series.map((series, index) => {
                    const own = options.series[index];
                    const seriesColor = (): XmlComponent => createSeriesColor(index, own.color);
                    return createElement("c:ser", {}, [
                        ...createSeriesStart(index, series),
                        createScatterSeriesProperties(lines === "none" ? undefined : seriesColor(), own.line),
                        createSeriesMarker(own.markers ?? markers, seriesColor),
                        ...createSeriesDataLabels(labelsOf(own.dataLabels, options.dataLabels), {
                            shape: "points",
                            series: own.name,
                            font,
                        }),
                        createDataSource("c:xVal", series.categories),
                        createDataSource("c:yVal", series.values),
                        createValue("c:smooth", lines === "smooth"),
                    ]);
                }),
                createGroupDataLabels(),
                createValue("c:axId", PRIMARY_AXES.category),
                createValue("c:axId", PRIMARY_AXES.value),
            ]),
        ],
        axes: createPointAxes(options, font),
    };
};
