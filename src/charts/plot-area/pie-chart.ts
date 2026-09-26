/**
 * Pie and doughnut charts (`c:pieChart` and `c:doughnutChart`).
 *
 * @module
 */
import type { ChartData } from "../chart-data";
import { createElement, createValue } from "../chart-elements";
import type { DoughnutChartOptions, PieChartOptions } from "../chart-options";
import { createSeriesColor, createSliceProperties } from "../chart-style";
import type { ChartGroup } from "./chart-group";
import { createGroupDataLabels, createSeriesDataLabels } from "./data-labels";
import { createCategoriesAndValues, createSeriesStart } from "./series";

/**
 * A pie or doughnut chart, which has no axes. Each slice takes the next colour, or its own, with a border between it and
 * the next, and a slice has the same colour in each ring of a doughnut, as the legend shows the categories.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PieChart">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_PieChartShared" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="firstSliceAng" type="CT_FirstSliceAng" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 *
 * <xsd:complexType name="CT_DoughnutChart">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_PieChartShared" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="firstSliceAng" type="CT_FirstSliceAng" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="holeSize" type="CT_HoleSize" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 *
 * <xsd:complexType name="CT_PieSer">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_SerShared" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="explosion" type="CT_UnsignedInt" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="dPt" type="CT_DPt" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="dLbls" type="CT_DLbls" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="cat" type="CT_AxDataSource" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="val" type="CT_NumDataSource" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createPieChart = (options: PieChartOptions | DoughnutChartOptions, data: ChartData): ChartGroup => {
    const doughnut = options.type === "doughnut";

    return {
        group: createElement(doughnut ? "c:doughnutChart" : "c:pieChart", {}, [
            createValue("c:varyColors", true),
            ...data.series.map((series, index) =>
                createElement("c:ser", {}, [
                    ...createSeriesStart(index, series),
                    ...options.categories.map((_, slice) =>
                        createElement("c:dPt", {}, [
                            createValue("c:idx", slice),
                            createValue("c:bubble3D", false),
                            createSliceProperties(createSeriesColor(slice, options.series[index].colors?.[slice])),
                        ]),
                    ),
                    // Office puts a pie's labels where they fit best, and gives a doughnut's no position
                    ...createSeriesDataLabels(options.dataLabels, { position: doughnut ? undefined : "bestFit", leaderLines: true }),
                    ...createCategoriesAndValues(series),
                ]),
            ),
            createGroupDataLabels(true),
            createValue("c:firstSliceAng", Math.round(options.firstSliceAngle ?? 0)),
            ...(options.type === "doughnut" ? [createValue("c:holeSize", Math.round(options.holeSize ?? 50))] : []),
        ]),
        axes: [],
    };
};
