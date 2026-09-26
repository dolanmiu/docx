/**
 * Line charts (`c:lineChart`).
 *
 * @module
 */
import type { XmlComponent } from "docx";

import type { ChartData } from "../chart-data";
import { createElement, createValue } from "../chart-elements";
import type { LineChartOptions } from "../chart-options";
import { createLineSeriesProperties, createMarker, createSeriesColor } from "../chart-style";
import { CATEGORY_AXIS_ID, VALUE_AXIS_ID, createCategoryAxis, createValueAxis } from "./axes";
import { type ChartGroup, GROUPINGS } from "./chart-group";
import { createGroupDataLabels, createSeriesDataLabels } from "./data-labels";
import { createCategoriesAndValues, createSeriesStart } from "./series";

/**
 * A line chart, with its category and value axes. Its lines are 2.25 points wide, with a circle at each point when it
 * has markers.
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
export const createLineChart = (options: LineChartOptions, data: ChartData): ChartGroup => {
    const stacking = options.stacking ?? "none";
    const markers = options.markers ?? false;

    return {
        group: createElement("c:lineChart", {}, [
            createValue("c:grouping", GROUPINGS[stacking]),
            createValue("c:varyColors", false),
            ...data.series.map((series, index) => {
                const seriesColor = (): XmlComponent => createSeriesColor(index, options.series[index].color);
                return createElement("c:ser", {}, [
                    ...createSeriesStart(index, series),
                    createLineSeriesProperties(seriesColor()),
                    createMarker(markers ? seriesColor : undefined),
                    ...createSeriesDataLabels(options.dataLabels, { position: "r" }),
                    ...createCategoriesAndValues(series),
                    createValue("c:smooth", options.smooth ?? false),
                ]);
            }),
            createGroupDataLabels(),
            // Word's "Line with Markers" writes this, and its plain "Line" doesn't
            ...(markers ? [createValue("c:marker", true)] : []),
            createValue("c:axId", CATEGORY_AXIS_ID),
            createValue("c:axId", VALUE_AXIS_ID),
        ]),
        axes: [
            createCategoryAxis({ id: CATEGORY_AXIS_ID, crossAxisId: VALUE_AXIS_ID, position: "b" }, options.categoryAxis),
            createValueAxis(
                {
                    id: VALUE_AXIS_ID,
                    crossAxisId: CATEGORY_AXIS_ID,
                    position: "l",
                    crossBetween: "between",
                    percent: stacking === "percent",
                },
                options.valueAxis,
            ),
        ],
    };
};
