/**
 * Area charts (`c:areaChart`).
 *
 * @module
 */
import type { ChartData } from "../chart-data";
import { createElement, createValue } from "../chart-elements";
import type { AreaChartOptions } from "../chart-options";
import { createFilledSeriesProperties, createSeriesColor } from "../chart-style";
import { CATEGORY_AXIS_ID, VALUE_AXIS_ID, createCategoryAxis, createValueAxis } from "./axes";
import { type ChartGroup, GROUPINGS } from "./chart-group";
import { createGroupDataLabels, createSeriesDataLabels } from "./data-labels";
import { createCategoriesAndValues, createSeriesStart } from "./series";

/**
 * An area chart, with its category and value axes. The value axis crosses at the first and last categories, so the
 * areas reach both sides of the plot, as in Word's and Excel's area charts.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_AreaChart">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_AreaChartShared" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="axId" type="CT_UnsignedInt" minOccurs="2" maxOccurs="2"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 *
 * <xsd:complexType name="CT_AreaSer">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_SerShared" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="pictureOptions" type="CT_PictureOptions" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="dPt" type="CT_DPt" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="dLbls" type="CT_DLbls" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="trendline" type="CT_Trendline" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="errBars" type="CT_ErrBars" minOccurs="0" maxOccurs="2"/>
 *     <xsd:element name="cat" type="CT_AxDataSource" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="val" type="CT_NumDataSource" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createAreaChart = (options: AreaChartOptions, data: ChartData): ChartGroup => {
    const stacking = options.stacking ?? "none";

    return {
        group: createElement("c:areaChart", {}, [
            createValue("c:grouping", GROUPINGS[stacking]),
            createValue("c:varyColors", false),
            ...data.series.map((series, index) =>
                createElement("c:ser", {}, [
                    ...createSeriesStart(index, series),
                    createFilledSeriesProperties(createSeriesColor(index, options.series[index].color)),
                    // Office gives an area's labels no position
                    ...createSeriesDataLabels(options.dataLabels, {}),
                    ...createCategoriesAndValues(series),
                ]),
            ),
            createGroupDataLabels(),
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
                    crossBetween: "midCat",
                    percent: stacking === "percent",
                },
                options.valueAxis,
            ),
        ],
    };
};
