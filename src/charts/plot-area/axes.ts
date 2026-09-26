/**
 * Axes: category axes (`c:catAx`), date axes (`c:dateAx`) and value axes (`c:valAx`), as Office writes them.
 *
 * @module
 */
import type { XmlComponent } from "docx";

import { type TimeUnit, serialDate } from "../chart-dates";
import { createElement, createValue } from "../chart-elements";
import type {
    BubbleChartOptions,
    ChartAxis,
    ChartAxisCrossing,
    ChartDisplayUnits,
    ChartFont,
    ChartValueAxis,
    ScatterChartOptions,
} from "../chart-options";
import { createAxisLine, createAxisProperties, createGridlines, createNoShapeProperties, createTextProperties } from "../chart-style";
import { createAxisTitle, fontOf } from "../chart-text";
import { formatNumber } from "./series";

/**
 * The ids of a category axis, or a scatter chart's x axis, and of the value axis it crosses. Ids are unique within a
 * chart.
 */
export type AxisIds = {
    readonly category: number;
    readonly value: number;
};

/** The primary axes, which every chart with axes has */
export const PRIMARY_AXES: AxisIds = { category: 1, value: 2 };
/** The secondary axes: a value axis on the right, and a hidden category axis for it to cross */
export const SECONDARY_AXES: AxisIds = { category: 3, value: 4 };

/**
 * An axis' id, the id of the axis it crosses, and its side of the plot: bottom (`b`), left (`l`), right (`r`) or top
 * (`t`).
 */
export type AxisPlacement = {
    readonly id: number;
    readonly crossAxisId: number;
    readonly position: "b" | "l" | "r" | "t";
    /** Where it crosses the other axis unless the axis' options say otherwise. Default is `"auto"` */
    readonly crosses?: ChartAxisCrossing;
    /** Whether the other axis is a 100% stacked chart's, whose values are percentages written as fractions of 1 */
    readonly crossesPercent?: boolean;
    /** The chart's font */
    readonly font?: ChartFont;
    /** A radar chart's axis, which has tick marks and a line */
    readonly radar?: boolean;
};

/**
 * Categories that are dates: the unit a date axis spaces them by, and how they are written.
 */
export type DateCategories = {
    readonly unit: TimeUnit;
    readonly format: string;
};

// Each crossing mapped to its OOXML name (`ST_Crosses`)
const CROSSINGS: Readonly<Record<Exclude<ChartAxisCrossing, number | Date>, string>> = { auto: "autoZero", minimum: "min", maximum: "max" };

type Scaling = {
    readonly logarithmicBase?: number;
    readonly maximum?: string;
    readonly minimum?: string;
};

const isVertical = (position: AxisPlacement["position"]): boolean => position === "l" || position === "r";

/**
 * The start of every axis (`EG_AxShared`), up to its title. The schema puts the logarithmic base first, and the maximum
 * before the minimum.
 */
const createAxisStart = (
    { id, position, font }: AxisPlacement,
    { title, visible = true, reverseOrder = false }: ChartAxis,
    { logarithmicBase, maximum, minimum }: Scaling,
    gridlines: boolean,
): readonly XmlComponent[] => [
    createValue("c:axId", id),
    createElement("c:scaling", {}, [
        ...(logarithmicBase === undefined ? [] : [createValue("c:logBase", formatNumber(logarithmicBase))]),
        createValue("c:orientation", reverseOrder ? "maxMin" : "minMax"),
        ...(maximum === undefined ? [] : [createValue("c:max", maximum)]),
        ...(minimum === undefined ? [] : [createValue("c:min", minimum)]),
    ]),
    createValue("c:delete", !visible),
    createValue("c:axPos", position),
    ...(gridlines ? [createGridlines()] : []),
    ...(title === undefined ? [] : [createAxisTitle(title, isVertical(position), font)]),
];

/**
 * Where an axis crosses the other: a place on it (`c:crosses`), or a value (`c:crossesAt`), which for a 100% stacked
 * chart's values is a fraction of 1, and for a date axis, a date's serial number.
 */
const createCrossing = (crossesAt: ChartAxisCrossing, percent: boolean): XmlComponent => {
    if (crossesAt instanceof Date) {
        return createValue("c:crossesAt", formatNumber(serialDate(crossesAt)));
    }
    return typeof crossesAt === "number"
        ? createValue("c:crossesAt", formatNumber(percent ? crossesAt / 100 : crossesAt))
        : createValue("c:crosses", CROSSINGS[crossesAt]);
};

/**
 * The end of every axis (`EG_AxShared`), after its number format: no tick marks, labels next to the axis in 9 point
 * text, turned as asked or as Office chooses, and where it crosses the other axis.
 */
const createAxisEnd = (placement: AxisPlacement, axis: ChartAxis, line: XmlComponent | undefined): readonly XmlComponent[] => [
    createValue("c:majorTickMark", placement.radar ? "cross" : "none"),
    createValue("c:minorTickMark", "none"),
    createValue("c:tickLblPos", "nextTo"),
    createAxisProperties(line),
    createTextProperties({
        size: 9,
        rotation: axis.labelRotation === undefined ? undefined : Math.round(axis.labelRotation * 60000),
        font: fontOf(placement.font, axis.font),
    }),
    createValue("c:crossAx", placement.crossAxisId),
    createCrossing(axis.crossesAt ?? placement.crosses ?? "auto", placement.crossesPercent ?? false),
];

/**
 * The labels' number format: the one given, written as it is, or the sheet's (`sourceLinked`).
 */
const createNumberFormat = (given: string | undefined, linked: string): XmlComponent =>
    given === undefined
        ? createElement("c:numFmt", { formatCode: linked, sourceLinked: 1 })
        : createElement("c:numFmt", { formatCode: given, sourceLinked: 0 });

/**
 * A category axis, with a line, and gridlines if asked for. Categories that are dates are on a date axis, which spaces
 * them by date, as Excel does when a chart's categories are dates.
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
 *
 * <xsd:complexType name="CT_DateAx">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_AxShared" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="auto" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="lblOffset" type="CT_LblOffset" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="baseTimeUnit" type="CT_TimeUnit" minOccurs="0" maxOccurs="1"/>
 *     ...
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @param dates - The categories' dates, when they are dates
 */
export const createCategoryAxis = (placement: AxisPlacement, axis: ChartAxis = {}, dates?: DateCategories): XmlComponent => {
    const start = createAxisStart(placement, axis, {}, axis.gridlines ?? placement.radar ?? false);
    const end = createAxisEnd(placement, axis, createAxisLine());
    return dates
        ? createElement("c:dateAx", {}, [
              ...start,
              createNumberFormat(axis.numberFormat, dates.format),
              ...end,
              createValue("c:auto", true),
              createValue("c:lblOffset", 100),
              createValue("c:baseTimeUnit", dates.unit),
          ])
        : createElement("c:catAx", {}, [
              ...start,
              createNumberFormat(axis.numberFormat, "General"),
              ...end,
              createValue("c:auto", true),
              createValue("c:lblAlgn", "ctr"),
              createValue("c:lblOffset", 100),
              createValue("c:noMultiLvlLbl", false),
          ]);
};

/**
 * The units a value axis' labels are in, with the label that names them ("Thousands"), which Office writes, beside the
 * axis.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_DispUnits">
 *   <xsd:sequence>
 *     <xsd:choice>
 *       <xsd:element name="custUnit" type="CT_Double" minOccurs="1" maxOccurs="1"/>
 *       <xsd:element name="builtInUnit" type="CT_BuiltInUnit" minOccurs="1" maxOccurs="1"/>
 *     </xsd:choice>
 *     <xsd:element name="dispUnitsLbl" type="CT_DispUnitsLbl" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
const createDisplayUnits = (units: ChartDisplayUnits, vertical: boolean, font: ChartFont | undefined): XmlComponent =>
    createElement("c:dispUnits", {}, [
        createValue("c:builtInUnit", units),
        createElement("c:dispUnitsLbl", {}, [
            createElement("c:layout"),
            createNoShapeProperties(),
            createTextProperties({ size: 9, rotation: vertical ? -5400000 : 0, font }),
        ]),
    ]);

type ValueAxisPlacement = AxisPlacement & {
    /** Whether the axis crosses between categories (`between`), or at them (`midCat`), as for area and scatter charts */
    readonly crossBetween: "between" | "midCat";
    /** A 100% stacked chart's axis, whose values are fractions of 1, labelled as percentages */
    readonly percent?: boolean;
    /** A scatter or bubble chart's axis, which has a line of its own */
    readonly scatter?: boolean;
    /** Whether it has gridlines unless the axis' options say otherwise. Default is `true` */
    readonly gridlines?: boolean;
};

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
    const { crossBetween, percent, scatter, radar } = placement;
    const { minimum, maximum, interval, numberFormat, logarithmicBase, displayUnits } = axis;
    const scale = (value: number): string => formatNumber(percent ? value / 100 : value);
    return createElement("c:valAx", {}, [
        ...createAxisStart(
            placement,
            axis,
            {
                logarithmicBase,
                maximum: maximum === undefined ? undefined : scale(maximum),
                minimum: minimum === undefined ? undefined : scale(minimum),
            },
            axis.gridlines ?? placement.gridlines ?? true,
        ),
        // A 100% stacked chart's values are fractions of 1, which Office labels as percentages
        createNumberFormat(numberFormat, percent ? "0%" : "General"),
        ...createAxisEnd(placement, axis, scatter ? createAxisLine(25) : radar ? createAxisLine() : undefined),
        createValue("c:crossBetween", crossBetween),
        ...(interval === undefined ? [] : [createValue("c:majorUnit", scale(interval))]),
        ...(displayUnits === undefined
            ? []
            : [createDisplayUnits(displayUnits, isVertical(placement.position), fontOf(placement.font, axis.font))]),
    ]);
};

/**
 * A scatter or bubble chart's axes: two value axes, the x axis along the bottom and the y axis on the left, each with
 * gridlines and a line of its own.
 */
export const createPointAxes = (
    options: ScatterChartOptions | BubbleChartOptions,
    font: ChartFont | undefined,
): readonly XmlComponent[] => [
    createValueAxis(
        {
            id: PRIMARY_AXES.category,
            crossAxisId: PRIMARY_AXES.value,
            position: "b",
            crossBetween: "midCat",
            scatter: true,
            font,
        },
        options.xAxis,
    ),
    createValueAxis(
        {
            id: PRIMARY_AXES.value,
            crossAxisId: PRIMARY_AXES.category,
            position: "l",
            crossBetween: "midCat",
            scatter: true,
            font,
        },
        options.yAxis,
    ),
];
