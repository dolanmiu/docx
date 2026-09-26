/**
 * Column and bar charts (`c:barChart`).
 *
 * @module
 */
import type { XmlComponent } from "docx";

import { createChartColor } from "../chart-color";
import { createElement, createValue } from "../chart-elements";
import type { ChartSeries } from "../chart-options";
import { createFilledSeriesProperties, createSeriesColor } from "../chart-style";
import { type CategoryGroup, GROUPINGS, labelsOf } from "./chart-group";
import { createGroupDataLabels, createSeriesDataLabels } from "./data-labels";
import { createCategoriesAndValues, createSeriesStart } from "./series";

type BarGroup = CategoryGroup<ChartSeries> & {
    /** Horizontal bars, of a bar chart */
    readonly horizontal: boolean;
    readonly gapWidth?: number;
    readonly overlap?: number;
};

/**
 * A bar's own colour (`c:dPt`), as Word writes it when one bar of a series is given a colour of its own.
 */
const createBarColors = (colors: ChartSeries["colors"] = []): readonly XmlComponent[] =>
    colors.flatMap((color, point) =>
        color === undefined
            ? []
            : [
                  createElement("c:dPt", {}, [
                      createValue("c:idx", point),
                      createValue("c:invertIfNegative", false),
                      createValue("c:bubble3D", false),
                      createFilledSeriesProperties(createChartColor(color)),
                  ]),
              ],
    );

/**
 * A group of columns or bars. A bar chart's categories are on the left and its values along the bottom.
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
 *
 * <xsd:complexType name="CT_BarSer">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_SerShared" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="invertIfNegative" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="pictureOptions" type="CT_PictureOptions" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="dPt" type="CT_DPt" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="dLbls" type="CT_DLbls" minOccurs="0" maxOccurs="1"/>
 *     ...
 *     <xsd:element name="cat" type="CT_AxDataSource" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="val" type="CT_NumDataSource" minOccurs="0" maxOccurs="1"/>
 *     ...
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createBarChart = ({ series, stacking, axes, dataLabels, font, horizontal, gapWidth, overlap }: BarGroup): XmlComponent => {
    const stacked = stacking !== "none";
    // Office's gaps: stacked bars always overlap fully, or the stacks are drawn apart
    const gap = gapWidth ?? (stacked ? 150 : horizontal ? 182 : 219);
    const overlapping = stacked ? 100 : (overlap ?? (horizontal ? 0 : -27));

    return createElement("c:barChart", {}, [
        createValue("c:barDir", horizontal ? "bar" : "col"),
        createValue("c:grouping", stacked ? GROUPINGS[stacking] : "clustered"),
        createValue("c:varyColors", false),
        ...series.map(({ index, options, data }) =>
            createElement("c:ser", {}, [
                ...createSeriesStart(index, data),
                createFilledSeriesProperties(createSeriesColor(index, options.color)),
                createValue("c:invertIfNegative", false),
                ...createBarColors(options.colors),
                ...createSeriesDataLabels(labelsOf(options.dataLabels, dataLabels), {
                    shape: stacked ? "stackedBars" : "bars",
                    series: options.name,
                    font,
                }),
                ...createCategoriesAndValues(data),
            ]),
        ),
        createGroupDataLabels(),
        createValue("c:gapWidth", Math.round(gap)),
        createValue("c:overlap", Math.round(overlapping)),
        createValue("c:axId", axes.category),
        createValue("c:axId", axes.value),
    ]);
};
