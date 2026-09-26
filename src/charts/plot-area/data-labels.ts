/**
 * Data labels (`c:dLbls`): the labels on a series' bars, points or slices.
 *
 * @module
 */
import type { XmlComponent } from "docx";

import { createElement, createValue } from "../chart-elements";
import type { PieChartDataLabels } from "../chart-options";
import { createNoShapeProperties, createTextProperties } from "../chart-style";

/**
 * Where labels are, as Office puts them: outside the end of a bar (`outEnd`), in the middle of a stacked bar (`ctr`),
 * to the right of a point (`r`), or where they fit best on a pie (`bestFit`). Area and doughnut charts have no position.
 */
export type DataLabelPosition = "outEnd" | "ctr" | "r" | "bestFit";

type DataLabelOptions = {
    readonly position?: DataLabelPosition;
    /** Lines from labels moved away from their slices, which Office writes for pie and doughnut charts */
    readonly leaderLines?: boolean;
};

// What the labels show (`EG_DLblShared`), in the schema's order
const createShown = ({ value, category, seriesName, percentage }: PieChartDataLabels, leaderLines?: boolean): readonly XmlComponent[] => [
    createValue("c:showLegendKey", false),
    createValue("c:showVal", value ?? false),
    createValue("c:showCatName", category ?? false),
    createValue("c:showSerName", seriesName ?? false),
    createValue("c:showPercent", percentage ?? false),
    createValue("c:showBubbleSize", false),
    ...(leaderLines ? [createValue("c:showLeaderLines", true)] : []),
];

/**
 * A series' labels, in 9 point text, or none when the labels show nothing.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:group name="EG_DLblShared">
 *   <xsd:sequence>
 *     <xsd:element name="numFmt" type="CT_NumFmt" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="txPr" type="a:CT_TextBody" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="dLblPos" type="CT_DLblPos" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="showLegendKey" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="showVal" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="showCatName" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="showSerName" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="showPercent" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="showBubbleSize" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="separator" type="xsd:string" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:group>
 * ```
 */
export const createSeriesDataLabels = (
    labels: PieChartDataLabels | undefined,
    { position, leaderLines }: DataLabelOptions,
): readonly XmlComponent[] =>
    labels && (labels.value || labels.category || labels.seriesName || labels.percentage)
        ? [
              createElement("c:dLbls", {}, [
                  createNoShapeProperties(),
                  createTextProperties({ size: 9, color: 75, rotation: 0, labelMargins: true }),
                  ...(position ? [createValue("c:dLblPos", position)] : []),
                  ...createShown(labels, leaderLines),
              ]),
          ]
        : [];

/**
 * A chart group's labels, which show nothing, as Word writes them. Each series' own labels come first.
 */
export const createGroupDataLabels = (leaderLines?: boolean): XmlComponent => createElement("c:dLbls", {}, createShown({}, leaderLines));
