/**
 * Stock charts (`c:stockChart`), with their volumes as columns (`c:barChart`).
 *
 * @module
 */
import type { XmlComponent } from "docx";

import type { ChartData } from "../chart-data";
import { createElement, createValue } from "../chart-elements";
import type { ChartFont, StockChartOptions } from "../chart-options";
import { stockSeriesOf } from "../chart-stock";
import {
    createChartLinesProperties,
    createCloseMarker,
    createHiddenSeriesProperties,
    createMarker,
    createUpDownBarProperties,
} from "../chart-style";
import { PRIMARY_AXES, SECONDARY_AXES, createCategoryAxis, createValueAxis } from "./axes";
import { createBarChart } from "./bar-chart";
import { datesOf } from "./category-chart";
import type { ChartGroups } from "./chart-group";
import { createGroupDataLabels } from "./data-labels";
import { createCategoriesAndValues, createSeriesStart } from "./series";

/**
 * A stock chart: its prices, drawn by what joins them, and if it has volumes, their columns.
 *
 * - The prices' series have no line and no markers. Each category's high and low are joined by a line
 *   (`c:hiLowLines`). With opening prices, a bar goes from each open to each close (`c:upDownBars`): white where the
 *   price rose, and dark grey where it fell. Without them, the close is a short dash across the line.
 * - Volumes are columns against the primary value axis, on the left, and the prices are against the secondary value
 *   axis, on the right, as in Word's "Volume-High-Low-Close" chart. Without volumes, the prices are against the primary
 *   value axis.
 * - Dates are spaced evenly, one for each category, on a text axis rather than a date axis, so days without trading,
 *   such as weekends, leave no gaps. LibreOffice doesn't draw a stock chart's prices on a date axis either.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_StockChart">
 *   <xsd:sequence>
 *     <xsd:element name="ser" type="CT_LineSer" minOccurs="3" maxOccurs="4"/>
 *     <xsd:element name="dLbls" type="CT_DLbls" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="dropLines" type="CT_ChartLines" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="hiLowLines" type="CT_ChartLines" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="upDownBars" type="CT_UpDownBars" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="axId" type="CT_UnsignedInt" minOccurs="2" maxOccurs="2"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 *
 * <xsd:complexType name="CT_UpDownBars">
 *   <xsd:sequence>
 *     <xsd:element name="gapWidth" type="CT_GapAmount" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="upBars" type="CT_UpDownBar" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="downBars" type="CT_UpDownBar" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createStockChart = (options: StockChartOptions, data: ChartData, font: ChartFont | undefined): ChartGroups => {
    const series = stockSeriesOf(options).map((one, index) => ({ ...one, index, data: data.series[index] }));
    const volume = series.find(({ role }) => role === "volume");
    const prices = series.filter(({ role }) => role !== "volume");
    const opens = options.open !== undefined;
    const priceAxes = volume ? SECONDARY_AXES : PRIMARY_AXES;
    const dates = datesOf(options.categories);
    const reversed = options.categoryAxis?.reverseOrder;

    const stock = createElement("c:stockChart", {}, [
        ...prices.map(({ role, index, data: one }) =>
            createElement("c:ser", {}, [
                ...createSeriesStart(index, one),
                createHiddenSeriesProperties(),
                role === "close" && !opens ? createCloseMarker() : createMarker(undefined),
                ...createCategoriesAndValues(one),
                createValue("c:smooth", false),
            ]),
        ),
        createGroupDataLabels(),
        createElement("c:hiLowLines", {}, [createChartLinesProperties(options.highLowLines, 75)]),
        ...(opens
            ? [
                  createElement("c:upDownBars", {}, [
                      createValue("c:gapWidth", 150),
                      createElement("c:upBars", {}, [createUpDownBarProperties(options.upBars, true)]),
                      createElement("c:downBars", {}, [createUpDownBarProperties(options.downBars, false)]),
                  ]),
              ]
            : []),
        createValue("c:axId", priceAxes.category),
        createValue("c:axId", priceAxes.value),
    ]);

    const categoryAxis = createCategoryAxis(
        { id: PRIMARY_AXES.category, crossAxisId: PRIMARY_AXES.value, position: "b", font },
        options.categoryAxis,
        dates,
        false,
    );
    const primaryValueAxis = (axis: StockChartOptions["valueAxis"]): XmlComponent =>
        createValueAxis({ id: PRIMARY_AXES.value, crossAxisId: PRIMARY_AXES.category, position: "l", crossBetween: "between", font }, axis);

    if (volume === undefined) {
        return { groups: [stock], axes: [categoryAxis, primaryValueAxis(options.valueAxis)] };
    }
    return {
        groups: [
            createBarChart({
                series: [{ index: volume.index, options: { name: volume.name, values: volume.values }, data: volume.data }],
                stacking: "none",
                axes: PRIMARY_AXES,
                font,
                horizontal: false,
            }),
            stock,
        ],
        axes: [
            categoryAxis,
            primaryValueAxis(options.volumeAxis),
            createValueAxis(
                {
                    id: SECONDARY_AXES.value,
                    crossAxisId: SECONDARY_AXES.category,
                    position: "r",
                    // The side opposite the volumes' axis, the last category's unless they are reversed
                    crosses: reversed ? "minimum" : "maximum",
                    crossBetween: "between",
                    gridlines: false,
                    font,
                },
                options.valueAxis,
            ),
            createCategoryAxis(
                { id: SECONDARY_AXES.category, crossAxisId: SECONDARY_AXES.value, position: "b" },
                { visible: false, reverseOrder: reversed },
                dates,
                false,
            ),
        ],
    };
};
