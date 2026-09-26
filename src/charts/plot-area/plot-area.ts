/**
 * The plot area (`c:plotArea`): the chart group and its axes.
 *
 * @module
 */
import type { XmlComponent } from "docx";

import type { ChartData } from "../chart-data";
import { createElement } from "../chart-elements";
import type { ChartRunOptions } from "../chart-options";
import { createNoShapeProperties } from "../chart-style";
import { createAreaChart } from "./area-chart";
import { createBarChart } from "./bar-chart";
import type { ChartGroup } from "./chart-group";
import { createLineChart } from "./line-chart";
import { createPieChart } from "./pie-chart";
import { createScatterChart } from "./scatter-chart";

const createChartGroup = (options: ChartRunOptions, data: ChartData): ChartGroup => {
    switch (options.type) {
        case "column":
        case "bar":
            return createBarChart(options, data);
        case "line":
            return createLineChart(options, data);
        case "area":
            return createAreaChart(options, data);
        case "pie":
        case "doughnut":
            return createPieChart(options, data);
        default:
            return createScatterChart(options, data);
    }
};

/**
 * The plot area, laid out automatically, with no fill.
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
    const { group, axes } = createChartGroup(options, data);
    return createElement("c:plotArea", {}, [createElement("c:layout"), group, ...axes, createNoShapeProperties()]);
};
