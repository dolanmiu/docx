/**
 * The plot area (`c:plotArea`): the chart's groups and their axes.
 *
 * @module
 */
import type { XmlComponent } from "docx";

import type { ChartData } from "../chart-data";
import { createElement } from "../chart-elements";
import type { ChartFont, ChartRunOptions } from "../chart-options";
import { createPlotAreaProperties } from "../chart-style";
import { createBubbleChart } from "./bubble-chart";
import { createCategoryCharts } from "./category-chart";
import type { ChartGroups } from "./chart-group";
import { createPieChart } from "./pie-chart";
import { createRadarChart } from "./radar-chart";
import { createScatterChart } from "./scatter-chart";

const createChartGroups = (options: ChartRunOptions, data: ChartData, font: ChartFont | undefined): ChartGroups => {
    switch (options.type) {
        case "pie":
        case "doughnut":
            return createPieChart(options, data, font);
        case "radar":
            return createRadarChart(options, data, font);
        case "scatter":
            return createScatterChart(options, data, font);
        case "bubble":
            return createBubbleChart(options, data, font);
        default:
            return createCategoryCharts(options, data, font);
    }
};

/**
 * The plot area, laid out automatically, with no fill or border unless asked for.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PlotArea">
 *   <xsd:sequence>
 *     <xsd:element name="layout" type="CT_Layout" minOccurs="0" maxOccurs="1"/>
 *     <xsd:choice minOccurs="1" maxOccurs="unbounded">
 *       <xsd:element name="areaChart" type="CT_AreaChart" minOccurs="1" maxOccurs="1"/>
 *       <xsd:element name="lineChart" type="CT_LineChart" minOccurs="1" maxOccurs="1"/>
 *       <xsd:element name="scatterChart" type="CT_ScatterChart" minOccurs="1" maxOccurs="1"/>
 *       <xsd:element name="pieChart" type="CT_PieChart" minOccurs="1" maxOccurs="1"/>
 *       <xsd:element name="doughnutChart" type="CT_DoughnutChart" minOccurs="1" maxOccurs="1"/>
 *       <xsd:element name="barChart" type="CT_BarChart" minOccurs="1" maxOccurs="1"/>
 *       <xsd:element name="radarChart" type="CT_RadarChart" minOccurs="1" maxOccurs="1"/>
 *       <xsd:element name="bubbleChart" type="CT_BubbleChart" minOccurs="1" maxOccurs="1"/>
 *       ...
 *     </xsd:choice>
 *     <xsd:choice minOccurs="0" maxOccurs="unbounded">
 *       <xsd:element name="valAx" type="CT_ValAx" minOccurs="1" maxOccurs="1"/>
 *       <xsd:element name="catAx" type="CT_CatAx" minOccurs="1" maxOccurs="1"/>
 *       <xsd:element name="dateAx" type="CT_DateAx" minOccurs="1" maxOccurs="1"/>
 *       <xsd:element name="serAx" type="CT_SerAx" minOccurs="1" maxOccurs="1"/>
 *     </xsd:choice>
 *     <xsd:element name="dTable" type="CT_DTable" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createPlotArea = (options: ChartRunOptions, data: ChartData): XmlComponent => {
    const { groups, axes } = createChartGroups(options, data, options.font);
    return createElement("c:plotArea", {}, [createElement("c:layout"), ...groups, ...axes, createPlotAreaProperties(options.plotArea)]);
};
