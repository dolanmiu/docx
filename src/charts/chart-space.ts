/**
 * The chart part (`word/charts/chart1.xml`): `c:chartSpace`, with the chart, its look and its workbook.
 *
 * @module
 */
import type { PackagePart, XmlComponent } from "docx";

import type { ChartData } from "./chart-data";
import { createElement, createValue } from "./chart-elements";
import { legendEntriesOf } from "./chart-legend";
import type { ChartEmptyValues, ChartLegend, ChartLegendPosition, ChartRunOptions } from "./chart-options";
import { PartReference } from "./chart-reference";
import { createChartAreaProperties, createChartTextProperties, createNoShapeProperties, createTextProperties } from "./chart-style";
import { createChartTitle, fontOf } from "./chart-text";
import { createPlotArea } from "./plot-area/plot-area";

export const CHART_NAMESPACE = "http://schemas.openxmlformats.org/drawingml/2006/chart";
export const RELATIONSHIPS_NAMESPACE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

// Each legend position mapped to its OOXML name (`ST_LegendPos`)
const LEGEND_POSITIONS: Readonly<Record<ChartLegendPosition, string>> = {
    top: "t",
    bottom: "b",
    left: "l",
    right: "r",
    topRight: "tr",
};

// Each way of drawing empty values mapped to its OOXML name (`ST_DispBlanksAs`)
const EMPTY_VALUES: Readonly<Record<ChartEmptyValues, string>> = { gap: "gap", zero: "zero", connect: "span" };

/**
 * The legend (`c:legend`), beside the plot rather than over it, in 9 point text, without the entries it hides.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Legend">
 *   <xsd:sequence>
 *     <xsd:element name="legendPos" type="CT_LegendPos" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="legendEntry" type="CT_LegendEntry" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="layout" type="CT_Layout" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="overlay" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="txPr" type="a:CT_TextBody" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
const createLegend = (options: ChartRunOptions, { position = "bottom", font, hiddenEntries = [] }: ChartLegend): XmlComponent =>
    createElement("c:legend", {}, [
        createValue("c:legendPos", LEGEND_POSITIONS[position]),
        ...legendEntriesOf(options)
            .filter(({ text }) => hiddenEntries.some((entry) => String(entry) === text))
            .map(({ index }) => createElement("c:legendEntry", {}, [createValue("c:idx", index), createValue("c:delete", true)])),
        createValue("c:overlay", false),
        createNoShapeProperties(),
        createTextProperties({ size: 9, rotation: 0, font: fontOf(options.font, font) }),
    ]);

/**
 * The chart part's root, in the schema's order. Office's `c14:style`, `c:extLst` and `c16` extensions are left out, as
 * the look is written explicitly.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_ChartSpace">
 *   <xsd:sequence>
 *     <xsd:element name="date1904" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="lang" type="CT_TextLanguageID" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="roundedCorners" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="style" type="CT_Style" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="clrMapOvr" type="a:CT_ColorMapping" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="pivotSource" type="CT_PivotSource" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="protection" type="CT_Protection" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="chart" type="CT_Chart" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="txPr" type="a:CT_TextBody" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="externalData" type="CT_ExternalData" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="printSettings" type="CT_PrintSettings" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="userShapes" type="CT_RelId" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 *
 * <xsd:complexType name="CT_Chart">
 *   <xsd:sequence>
 *     <xsd:element name="title" type="CT_Title" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="autoTitleDeleted" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="pivotFmts" type="CT_PivotFmts" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="view3D" type="CT_View3D" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="floor" type="CT_Surface" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="sideWall" type="CT_Surface" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="backWall" type="CT_Surface" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="plotArea" type="CT_PlotArea" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="legend" type="CT_Legend" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="plotVisOnly" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="dispBlanksAs" type="CT_DispBlanksAs" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="showDLblsOverMax" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @param workbook - The embedded workbook, which the chart's data refers to
 */
export const createChartSpace = (options: ChartRunOptions, data: ChartData, workbook: PackagePart): XmlComponent =>
    createElement(
        "c:chartSpace",
        {
            "xmlns:c": CHART_NAMESPACE,
            "xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main",
            "xmlns:r": RELATIONSHIPS_NAMESPACE,
        },
        [
            createValue("c:date1904", false),
            createValue("c:lang", "en-US"),
            createValue("c:roundedCorners", false),
            createElement("c:chart", {}, [
                ...(options.title === undefined ? [] : [createChartTitle(options.title, options.font)]),
                // Without this, Office may use a single series' name as the title
                createValue("c:autoTitleDeleted", options.title === undefined),
                createPlotArea(options, data),
                ...(options.legend === false ? [] : [createLegend(options, options.legend ?? {})]),
                createValue("c:plotVisOnly", true),
                createValue("c:dispBlanksAs", EMPTY_VALUES[(options as { readonly emptyValues?: ChartEmptyValues }).emptyValues ?? "gap"]),
            ]),
            createChartAreaProperties(options.chartArea),
            createChartTextProperties(),
            // Word doesn't update the chart from the workbook when the document is opened
            new PartReference("c:externalData", workbook, { children: [createValue("c:autoUpdate", false)] }),
        ],
    );
