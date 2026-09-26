/**
 * Column and bar charts (`c:barChart`).
 *
 * @module
 */
import type { ChartData } from "../chart-data";
import { createElement, createValue } from "../chart-elements";
import type { BarChartOptions, ColumnChartOptions } from "../chart-options";
import { createFilledSeriesProperties, createSeriesColor } from "../chart-style";
import { CATEGORY_AXIS_ID, VALUE_AXIS_ID, createCategoryAxis, createValueAxis } from "./axes";
import { type ChartGroup, GROUPINGS } from "./chart-group";
import { createGroupDataLabels, createSeriesDataLabels } from "./data-labels";
import { createCategoriesAndValues, createSeriesStart } from "./series";

/**
 * A column or bar chart, with its category and value axes. A bar chart's categories are on the left and its values
 * along the bottom.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_BarChart">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_BarChartShared" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="gapWidth" type="CT_GapAmount" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="overlap" type="CT_Overlap" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="serLines" type="CT_ChartLines" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="axId" type="CT_UnsignedInt" minOccurs="2" maxOccurs="2"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 *
 * <xsd:group name="EG_BarChartShared">
 *   <xsd:sequence>
 *     <xsd:element name="barDir" type="CT_BarDir" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="grouping" type="CT_BarGrouping" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="varyColors" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="ser" type="CT_BarSer" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="dLbls" type="CT_DLbls" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:group>
 * ```
 */
export const createBarChart = (options: ColumnChartOptions | BarChartOptions, data: ChartData): ChartGroup => {
    const stacking = options.stacking ?? "none";
    const stacked = stacking !== "none";
    const horizontal = options.type === "bar";
    // Office's gaps: stacked bars always overlap fully, or the stacks are drawn apart
    const gapWidth = options.gapWidth ?? (stacked ? 150 : horizontal ? 182 : 219);
    const overlap = stacked ? 100 : (options.overlap ?? (horizontal ? 0 : -27));

    return {
        group: createElement("c:barChart", {}, [
            createValue("c:barDir", horizontal ? "bar" : "col"),
            createValue("c:grouping", stacked ? GROUPINGS[stacking] : "clustered"),
            createValue("c:varyColors", false),
            ...data.series.map((series, index) =>
                createElement("c:ser", {}, [
                    ...createSeriesStart(index, series),
                    createFilledSeriesProperties(createSeriesColor(index, options.series[index].color)),
                    createValue("c:invertIfNegative", false),
                    // Labels go outside the end of a bar, or in the middle of a stacked one
                    ...createSeriesDataLabels(options.dataLabels, { position: stacked ? "ctr" : "outEnd" }),
                    ...createCategoriesAndValues(series),
                ]),
            ),
            createGroupDataLabels(),
            createValue("c:gapWidth", Math.round(gapWidth)),
            createValue("c:overlap", Math.round(overlap)),
            createValue("c:axId", CATEGORY_AXIS_ID),
            createValue("c:axId", VALUE_AXIS_ID),
        ]),
        axes: [
            createCategoryAxis(
                { id: CATEGORY_AXIS_ID, crossAxisId: VALUE_AXIS_ID, position: horizontal ? "l" : "b" },
                options.categoryAxis,
            ),
            createValueAxis(
                {
                    id: VALUE_AXIS_ID,
                    crossAxisId: CATEGORY_AXIS_ID,
                    position: horizontal ? "b" : "l",
                    crossBetween: "between",
                    percent: stacking === "percent",
                },
                options.valueAxis,
            ),
        ],
    };
};
