/**
 * Area charts (`c:areaChart`).
 *
 * @module
 */
import type { XmlComponent } from "docx";

import { createElement, createValue } from "../chart-elements";
import type { ChartSeries } from "../chart-options";
import { createFilledSeriesProperties, createSeriesColor } from "../chart-style";
import { type CategoryGroup, GROUPINGS, labelsOf } from "./chart-group";
import { createGroupDataLabels, createSeriesDataLabels } from "./data-labels";
import { createCategoriesAndValues, createSeriesStart } from "./series";

/**
 * A group of areas.
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
export const createAreaChart = ({ series, stacking, axes, dataLabels, font }: CategoryGroup<ChartSeries>): XmlComponent =>
    createElement("c:areaChart", {}, [
        createValue("c:grouping", GROUPINGS[stacking]),
        createValue("c:varyColors", false),
        ...series.map(({ index, options, data }) =>
            createElement("c:ser", {}, [
                ...createSeriesStart(index, data),
                createFilledSeriesProperties(createSeriesColor(index, options.color)),
                // Office gives an area's labels no position
                ...createSeriesDataLabels(labelsOf(options.dataLabels, dataLabels), { shape: "area", series: options.name, font }),
                ...createCategoriesAndValues(data),
            ]),
        ),
        createGroupDataLabels(),
        createValue("c:axId", axes.category),
        createValue("c:axId", axes.value),
    ]);
