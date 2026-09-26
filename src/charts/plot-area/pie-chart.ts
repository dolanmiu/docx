/**
 * Pie, doughnut, pie of pie and bar of pie charts (`c:pieChart`, `c:doughnutChart` and `c:ofPieChart`).
 *
 * @module
 */
// cspell:ignore cust
import type { XmlComponent } from "docx";

import type { ChartData } from "../chart-data";
import { createElement, createValue } from "../chart-elements";
import type {
    BarOfPieChartOptions,
    ChartFont,
    DoughnutChartOptions,
    PieChartOptions,
    PieChartSeries,
    PieChartSplit,
    PieOfPieChartOptions,
} from "../chart-options";
import { createChartLinesProperties, createSeriesColor, createSliceProperties } from "../chart-style";
import { type ChartGroups, labelsOf } from "./chart-group";
import { createGroupDataLabels, createSeriesDataLabels } from "./data-labels";
import { createCategoriesAndValues, createSeriesStart, formatNumber } from "./series";

type PieOptions = PieChartOptions | DoughnutChartOptions | PieOfPieChartOptions | BarOfPieChartOptions;

// Each split mapped to its OOXML name (`ST_SplitType`)
const SPLIT_TYPES: Readonly<Record<PieChartSplit["by"], string>> = {
    position: "pos",
    value: "val",
    percentage: "percent",
    categories: "cust",
};

/**
 * How a pie of pie or bar of pie chart splits its pie, written out, so every application splits it the same way: as
 * given, or by default, the last third of the categories, rounded up, go to the second plot.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_OfPieChart">
 *   <xsd:sequence>
 *     <xsd:element name="ofPieType" type="CT_OfPieType" minOccurs="1" maxOccurs="1"/>
 *     <xsd:group ref="EG_PieChartShared" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="gapWidth" type="CT_GapAmount" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="splitType" type="CT_SplitType" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="splitPos" type="CT_Double" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="custSplit" type="CT_CustSplit" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="secondPieSize" type="CT_SecondPieSize" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="serLines" type="CT_ChartLines" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
const createSplit = (options: PieOfPieChartOptions | BarOfPieChartOptions): readonly XmlComponent[] => {
    const split = options.split ?? { by: "position", count: Math.max(1, Math.ceil(options.categories.length / 3)) };
    const position = ((): readonly XmlComponent[] => {
        switch (split.by) {
            case "categories": {
                const chosen = split.categories.map(String);
                const points = options.categories.flatMap((category, index) => (chosen.includes(String(category)) ? [index] : []));
                return [
                    createElement(
                        "c:custSplit",
                        {},
                        points.map((point) => createValue("c:secondPiePt", point)),
                    ),
                ];
            }
            case "position":
                return [createValue("c:splitPos", split.count)];
            default:
                return [createValue("c:splitPos", formatNumber(split.lessThan))];
        }
    })();
    return [
        createValue("c:gapWidth", Math.round(options.gapWidth ?? 100)),
        createValue("c:splitType", SPLIT_TYPES[split.by]),
        ...position,
        createValue("c:secondPieSize", Math.round(options.secondPlotSize ?? 75)),
        createElement("c:serLines", {}, [createChartLinesProperties(options.seriesLines, 35)]),
    ];
};

/**
 * How far a slice is pulled out, if it is on its own: an amount for each slice.
 */
const explosionOf = ({ explosion }: PieChartSeries, slice: number): readonly XmlComponent[] => {
    const amount = Array.isArray(explosion) ? explosion[slice] : undefined;
    return amount === undefined ? [] : [createValue("c:explosion", Math.round(amount))];
};

/**
 * A pie, doughnut, pie of pie or bar of pie chart, which has no axes. Each slice takes the next colour, or its own, with a border between it and
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
 * <xsd:complexType name="CT_DPt">
 *   <xsd:sequence>
 *     <xsd:element name="idx" type="CT_UnsignedInt" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="invertIfNegative" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="marker" type="CT_Marker" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="bubble3D" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="explosion" type="CT_UnsignedInt" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
 *     ...
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
export const createPieChart = (options: PieOptions, data: ChartData, font: ChartFont | undefined): ChartGroups => {
    const { type } = options;
    const split = type === "pieOfPie" || type === "barOfPie";
    const groupName = split ? "c:ofPieChart" : type === "doughnut" ? "c:doughnutChart" : "c:pieChart";

    return {
        groups: [
            createElement(groupName, {}, [
                ...(split ? [createValue("c:ofPieType", type === "pieOfPie" ? "pie" : "bar")] : []),
                createValue("c:varyColors", true),
                ...data.series.map((series, index) => {
                    const own: PieChartSeries = options.series[index];
                    return createElement("c:ser", {}, [
                        ...createSeriesStart(index, series),
                        ...(typeof own.explosion === "number" ? [createValue("c:explosion", Math.round(own.explosion))] : []),
                        ...options.categories.map((_, slice) =>
                            createElement("c:dPt", {}, [
                                createValue("c:idx", slice),
                                createValue("c:bubble3D", false),
                                ...explosionOf(own, slice),
                                createSliceProperties(createSeriesColor(slice, own.colors?.[slice])),
                            ]),
                        ),
                        // Office puts a pie's labels where they fit best, and gives a doughnut's no position
                        ...createSeriesDataLabels(labelsOf(own.dataLabels, options.dataLabels), {
                            shape: type === "doughnut" ? "doughnut" : "pie",
                            series: own.name,
                            leaderLines: true,
                            font,
                            pointLabels: own.pointLabels,
                        }),
                        ...createCategoriesAndValues(series),
                    ]);
                }),
                createGroupDataLabels(true),
                ...(options.type === "pie" || options.type === "doughnut"
                    ? [createValue("c:firstSliceAng", Math.round(options.firstSliceAngle ?? 0))]
                    : createSplit(options)),
                ...(options.type === "doughnut" ? [createValue("c:holeSize", Math.round(options.holeSize ?? 50))] : []),
            ]),
        ],
        axes: [],
    };
};
