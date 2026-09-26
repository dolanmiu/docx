/**
 * Axes: a category axis (`c:catAx`) and a value axis (`c:valAx`), as Office writes them.
 *
 * @module
 */
import type { XmlComponent } from "docx";

import { createElement, createValue } from "../chart-elements";
import type { ChartAxis, ChartValueAxis } from "../chart-options";
import { createAxisLine, createAxisProperties, createGridlines, createTextProperties } from "../chart-style";
import { createAxisTitle } from "../chart-text";
import { formatNumber } from "./series";

/** The id of the category axis, or of a scatter chart's x axis. Ids are unique within a chart */
export const CATEGORY_AXIS_ID = 1;
/** The id of the value axis, or of a scatter chart's y axis */
export const VALUE_AXIS_ID = 2;

/**
 * An axis' id, the id of the axis it crosses, and its side of the plot: bottom (`b`) or left (`l`).
 */
type AxisPlacement = {
    readonly id: number;
    readonly crossAxisId: number;
    readonly position: "b" | "l";
};

type ValueAxisPlacement = AxisPlacement & {
    /** Whether the axis crosses between categories (`between`), or at them (`midCat`), as for area and scatter charts */
    readonly crossBetween: "between" | "midCat";
    /** A 100% stacked chart's axis, whose values are fractions of 1, labelled as percentages */
    readonly percent?: boolean;
    /** A scatter chart's axis, which has a line of its own */
    readonly scatter?: boolean;
};

/**
 * The start of every axis (`EG_AxShared`), up to its title.
 */
const createAxisStart = (
    { id, position }: AxisPlacement,
    { title, visible = true }: ChartAxis,
    scaling: readonly XmlComponent[],
    gridlines: boolean,
): readonly XmlComponent[] => [
    createValue("c:axId", id),
    createElement("c:scaling", {}, [createValue("c:orientation", "minMax"), ...scaling]),
    createValue("c:delete", !visible),
    createValue("c:axPos", position),
    ...(gridlines ? [createGridlines()] : []),
    ...(title === undefined ? [] : [createAxisTitle(title, position === "l")]),
];

/**
 * The end of every axis (`EG_AxShared`), after its number format: no tick marks, labels next to the axis in 9 point
 * text, and where it crosses the other axis.
 */
const createAxisEnd = ({ crossAxisId }: AxisPlacement, line: XmlComponent | undefined): readonly XmlComponent[] => [
    createValue("c:majorTickMark", "none"),
    createValue("c:minorTickMark", "none"),
    createValue("c:tickLblPos", "nextTo"),
    createAxisProperties(line),
    createTextProperties({ size: 9 }),
    createValue("c:crossAx", crossAxisId),
    createValue("c:crosses", "autoZero"),
];

const createNumberFormat = (formatCode: string, sourceLinked: boolean): XmlComponent =>
    createElement("c:numFmt", { formatCode, sourceLinked: Number(sourceLinked) });

/**
 * A category axis, with a line, and gridlines if asked for.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_CatAx">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_AxShared" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="auto" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="lblAlgn" type="CT_LblAlgn" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="lblOffset" type="CT_LblOffset" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tickLblSkip" type="CT_Skip" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tickMarkSkip" type="CT_Skip" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="noMultiLvlLbl" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createCategoryAxis = (placement: AxisPlacement, axis: ChartAxis = {}): XmlComponent =>
    createElement("c:catAx", {}, [
        ...createAxisStart(placement, axis, [], axis.gridlines ?? false),
        createNumberFormat("General", true),
        ...createAxisEnd(placement, createAxisLine()),
        createValue("c:auto", true),
        createValue("c:lblAlgn", "ctr"),
        createValue("c:lblOffset", 100),
        createValue("c:noMultiLvlLbl", false),
    ]);

/**
 * A value axis, with gridlines unless asked not to. Its range and interval are written as given, or for a 100% stacked
 * chart, as fractions of 1.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_ValAx">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_AxShared" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="crossBetween" type="CT_CrossBetween" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="majorUnit" type="CT_AxisUnit" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="minorUnit" type="CT_AxisUnit" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="dispUnits" type="CT_DispUnits" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createValueAxis = (placement: ValueAxisPlacement, axis: ChartValueAxis = {}): XmlComponent => {
    const { crossBetween, percent, scatter } = placement;
    const { minimum, maximum, interval, numberFormat } = axis;
    const scale = (value: number): string => formatNumber(percent ? value / 100 : value);
    return createElement("c:valAx", {}, [
        // The schema puts the maximum before the minimum
        ...createAxisStart(
            placement,
            axis,
            [
                ...(maximum === undefined ? [] : [createValue("c:max", scale(maximum))]),
                ...(minimum === undefined ? [] : [createValue("c:min", scale(minimum))]),
            ],
            axis.gridlines ?? true,
        ),
        // A 100% stacked chart's values are fractions of 1, which Office labels as percentages
        numberFormat === undefined ? createNumberFormat(percent ? "0%" : "General", true) : createNumberFormat(numberFormat, false),
        ...createAxisEnd(placement, scatter ? createAxisLine(25) : undefined),
        createValue("c:crossBetween", crossBetween),
        ...(interval === undefined ? [] : [createValue("c:majorUnit", scale(interval))]),
    ]);
};
