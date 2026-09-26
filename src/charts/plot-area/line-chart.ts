/**
 * Line charts (`c:lineChart`).
 *
 * @module
 */
import type { XmlComponent } from "docx";

import { createElement, createValue } from "../chart-elements";
import type { ChartMarker, ChartSeries } from "../chart-options";
import { createLineSeriesProperties, createMarker, createSeriesColor } from "../chart-style";
import { type CategoryGroup, GROUPINGS, labelsOf } from "./chart-group";
import { createGroupDataLabels, createSeriesDataLabels } from "./data-labels";
import { createCategoriesAndValues, createSeriesStart } from "./series";

type LineGroup = CategoryGroup<ChartSeries> & {
    /** The chart's markers, which a series' own replace */
    readonly markers?: boolean | ChartMarker;
    /** The chart's smooth lines, which a series' own replace */
    readonly smooth?: boolean;
};

/**
 * A marker for each point of a series, or none: the series' own markers, or the chart's.
 *
 * @param seriesColor - Creates the series' colour
 */
export const createSeriesMarker = (markers: boolean | ChartMarker | undefined, seriesColor: () => XmlComponent): XmlComponent =>
    createMarker(markers ? seriesColor : undefined, typeof markers === "object" ? markers : undefined);

/**
 * A group of lines. Its lines are 2.25 points wide, with a circle at each point when they have markers, unless asked
 * otherwise.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_LineChart">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_LineChartShared" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="hiLowLines" type="CT_ChartLines" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="upDownBars" type="CT_UpDownBars" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="marker" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="smooth" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="axId" type="CT_UnsignedInt" minOccurs="2" maxOccurs="2"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 *
 * <xsd:complexType name="CT_LineSer">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_SerShared" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="marker" type="CT_Marker" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="dPt" type="CT_DPt" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="dLbls" type="CT_DLbls" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="trendline" type="CT_Trendline" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="errBars" type="CT_ErrBars" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="cat" type="CT_AxDataSource" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="val" type="CT_NumDataSource" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="smooth" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createLineChart = ({ series, stacking, axes, dataLabels, font, markers, smooth }: LineGroup): XmlComponent => {
    const markersOf = (options: ChartSeries): boolean | ChartMarker | undefined => options.markers ?? markers;

    return createElement("c:lineChart", {}, [
        createValue("c:grouping", GROUPINGS[stacking]),
        createValue("c:varyColors", false),
        ...series.map(({ index, options, data }) => {
            const seriesColor = (): XmlComponent => createSeriesColor(index, options.color);
            return createElement("c:ser", {}, [
                ...createSeriesStart(index, data),
                createLineSeriesProperties(seriesColor(), options.line),
                createSeriesMarker(markersOf(options), seriesColor),
                ...createSeriesDataLabels(labelsOf(options.dataLabels, dataLabels), { shape: "line", series: options.name, font }),
                ...createCategoriesAndValues(data),
                createValue("c:smooth", options.smooth ?? smooth ?? false),
            ]);
        }),
        createGroupDataLabels(),
        // Word's "Line with Markers" writes this, and its plain "Line" doesn't
        ...(series.some(({ options }) => markersOf(options)) ? [createValue("c:marker", true)] : []),
        createValue("c:axId", axes.category),
        createValue("c:axId", axes.value),
    ]);
};
