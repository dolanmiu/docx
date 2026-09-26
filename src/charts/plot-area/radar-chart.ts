/**
 * Radar charts (`c:radarChart`).
 *
 * @module
 */
import type { XmlComponent } from "docx";

import type { ChartData } from "../chart-data";
import { createElement, createValue } from "../chart-elements";
import type { ChartFont, RadarChartOptions } from "../chart-options";
import { createFilledSeriesProperties, createLineSeriesProperties, createSeriesColor } from "../chart-style";
import { PRIMARY_AXES, createCategoryAxis, createValueAxis } from "./axes";
import { type ChartGroups, labelsOf } from "./chart-group";
import { createGroupDataLabels, createSeriesDataLabels } from "./data-labels";
import { createSeriesMarker } from "./line-chart";
import { createCategoriesAndValues, createSeriesStart } from "./series";

/**
 * A radar chart: a spoke for each category, the category axis' gridlines, and rings at each value, the value axis'
 * gridlines. Each series is a line around the spokes, 2.25 points wide, or a filled area.
 *
 * Excel writes `c:radarStyle` `marker` for its "Radar" and "Radar with Markers" charts alike, and gives the plain radar's
 * series markers of `none`, so this does too.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_RadarChart">
 *   <xsd:sequence>
 *     <xsd:element name="radarStyle" type="CT_RadarStyle" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="varyColors" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="ser" type="CT_RadarSer" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="dLbls" type="CT_DLbls" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="axId" type="CT_UnsignedInt" minOccurs="2" maxOccurs="2"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 *
 * <xsd:complexType name="CT_RadarSer">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_SerShared" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="marker" type="CT_Marker" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="dPt" type="CT_DPt" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="dLbls" type="CT_DLbls" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="cat" type="CT_AxDataSource" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="val" type="CT_NumDataSource" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createRadarChart = (options: RadarChartOptions, data: ChartData, font: ChartFont | undefined): ChartGroups => {
    const filled = options.filled ?? false;

    return {
        groups: [
            createElement("c:radarChart", {}, [
                createValue("c:radarStyle", filled ? "filled" : "marker"),
                createValue("c:varyColors", false),
                ...data.series.map((series, index) => {
                    const own = options.series[index];
                    const seriesColor = (): XmlComponent => createSeriesColor(index, own.color);
                    return createElement("c:ser", {}, [
                        ...createSeriesStart(index, series),
                        ...(filled
                            ? [createFilledSeriesProperties(seriesColor())]
                            : [
                                  createLineSeriesProperties(seriesColor(), own.line),
                                  createSeriesMarker(own.markers ?? options.markers, seriesColor),
                              ]),
                        ...createSeriesDataLabels(labelsOf(own.dataLabels, options.dataLabels), { shape: "radar", series: own.name, font }),
                        ...createCategoriesAndValues(series),
                    ]);
                }),
                createGroupDataLabels(),
                createValue("c:axId", PRIMARY_AXES.category),
                createValue("c:axId", PRIMARY_AXES.value),
            ]),
        ],
        axes: [
            createCategoryAxis(
                { id: PRIMARY_AXES.category, crossAxisId: PRIMARY_AXES.value, position: "b", radar: true, font },
                options.categoryAxis,
            ),
            createValueAxis(
                { id: PRIMARY_AXES.value, crossAxisId: PRIMARY_AXES.category, position: "l", crossBetween: "between", radar: true, font },
                options.valueAxis,
            ),
        ],
    };
};
