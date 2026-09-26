/**
 * Changes to a template chart's series: their data, their points' own colours and labels, and new series, which copy
 * the look of the template's last.
 *
 * @module
 */
import type { Element } from "xml-js";

import {
    childOf,
    childrenOf,
    copyOf,
    createXmlElement,
    descendantsOf,
    elementsOf,
    mapChildren,
    nameOf,
    numberOf,
    valueOf,
    withChild,
    withoutChildren,
} from "./template-xml";

/**
 * The children of every type of series, in the schema's order (`CT_BarSer`, `CT_LineSer`, `CT_AreaSer`, `CT_PieSer`,
 * `CT_RadarSer`, `CT_ScatterSer` and `CT_BubbleSer`), as one order all of them keep.
 */
export const SERIES_ORDER: readonly string[] = [
    "c:idx",
    "c:order",
    "c:tx",
    "c:spPr",
    "c:invertIfNegative",
    "c:pictureOptions",
    "c:marker",
    "c:explosion",
    "c:dPt",
    "c:dLbls",
    "c:trendline",
    "c:errBars",
    "c:cat",
    "c:xVal",
    "c:val",
    "c:yVal",
    "c:shape",
    "c:smooth",
    "c:bubbleSize",
    "c:bubble3D",
    "c:extLst",
];

/**
 * The children of a point's own look (`CT_DPt`), in the schema's order.
 */
export const POINT_ORDER: readonly string[] = [
    "c:idx",
    "c:invertIfNegative",
    "c:marker",
    "c:bubble3D",
    "c:explosion",
    "c:spPr",
    "c:pictureOptions",
    "c:extLst",
];

// The elements a colour is given with in DrawingML (`EG_ColorChoice`)
const COLORS: ReadonlySet<string> = new Set(["a:srgbClr", "a:schemeClr", "a:scrgbClr", "a:hslClr", "a:sysClr", "a:prstClr"]);

// The same colour, whichever way its XML is laid out
const colorKey = (color: Element): string =>
    JSON.stringify(color, (key, value: unknown) =>
        key === "elements" && Array.isArray(value)
            ? (value as readonly Element[]).filter((child) => !(child.type === "text" && String(child.text).trim() === ""))
            : value,
    );

const firstColorIn = (element: Element | undefined): Element | undefined =>
    elementsOf(element).reduce<Element | undefined>(
        (found, child) => found ?? (COLORS.has(nameOf(child)) ? child : firstColorIn(child)),
        undefined,
    );

/**
 * The main colour of a series or a point: the first colour of its shape properties' fill or line, or else of its
 * marker's.
 */
export const mainColorOf = (element: Element): Element | undefined =>
    firstColorIn(childOf(element, "c:spPr")) ?? firstColorIn(childOf(childOf(element, "c:marker"), "c:spPr"));

/**
 * Replaces a colour, wherever it is in an element, with another. The old colour's transparency (`a:alpha`) is kept,
 * unless the new one has its own.
 */
export const recolor = (element: Element, from: Element, to: Element): Element => {
    const key = colorKey(from);
    const alpha = childOf(from, "a:alpha");
    const replacement =
        alpha !== undefined && childOf(to, "a:alpha") === undefined ? { ...to, elements: [...(to.elements ?? []), alpha] } : to;
    const change = (current: Element): Element =>
        mapChildren(current, (child) => [COLORS.has(nameOf(child)) && colorKey(child) === key ? copyOf(replacement) : change(child)]);
    return change(element);
};

/**
 * A series or point in another colour: its main colour, in its shape properties and its marker's, replaced with another.
 */
const withColor = (element: Element, color: Element): Element => {
    const main = mainColorOf(element);
    if (main === undefined) {
        return element;
    }
    return mapChildren(element, (child) => {
        if (child.name === "c:spPr") {
            return [recolor(child, main, color)];
        }
        return [
            child.name === "c:marker"
                ? mapChildren(child, (inner) => [inner.name === "c:spPr" ? recolor(inner, main, color) : inner])
                : child,
        ];
    });
};

/**
 * An element without Office's unique id of it (`c16:uniqueId`), which a copy can't share, and its extension list if
 * that leaves it empty.
 */
export const withoutUniqueId = (element: Element): Element =>
    mapChildren(element, (child) => {
        if (child.name !== "c:extLst") {
            return [child];
        }
        const extensions = withoutChildren(child, (extension) => descendantsOf(extension, "c16:uniqueId").length > 0);
        return elementsOf(extensions).length === 0 ? [] : [extensions];
    });

const indexOf = (element: Element): number => numberOf(childOf(element, "c:idx")) ?? 0;

/**
 * A series with its index (`c:idx`) and plot order (`c:order`).
 */
export const withIndex = (series: Element, index: number, order: number): Element =>
    withChild(
        withChild(series, createXmlElement("c:idx", { val: index }), SERIES_ORDER),
        createXmlElement("c:order", { val: order }),
        SERIES_ORDER,
    );

/**
 * A series with new data: its name (`c:tx`), categories (`c:cat` or `c:xVal`), values (`c:val` or `c:yVal`) and sizes
 * (`c:bubbleSize`), each in place of the series' own or, if it has none, in its place in the schema's order.
 */
export const withData = (series: Element, data: readonly Element[]): Element =>
    data.reduce((current, element) => withChild(current, element, SERIES_ORDER), series);

/**
 * A series without the points' own looks and labels (`c:dPt` and `c:dLbl`) past its last point.
 */
export const withoutPointsPast = (series: Element, count: number): Element =>
    mapChildren(series, (child) => {
        if (child.name === "c:dPt") {
            return indexOf(child) < count ? [child] : [];
        }
        return [child.name === "c:dLbls" ? withoutChildren(child, (label) => label.name === "c:dLbl" && indexOf(label) >= count) : child];
    });

/**
 * A series whose points each have a look of their own, such as the slices of a pie, with a look for each new point: a
 * copy of the last point's, in the next colour, and pulled out of the pie only if every point is, as far. A series whose points don't all have one is left as it is, as the
 * points without one take the series' look.
 *
 * @param count - The number of points it has now
 * @param templateCount - The number it had in the template
 * @param colorOf - The colour of a point, by its index
 */
export const withPointsUpTo = (series: Element, count: number, templateCount: number, colorOf: (point: number) => Element): Element => {
    const points = childrenOf(series, "c:dPt");
    const indexes = new Set(points.map(indexOf));
    const last = points.find((point) => indexOf(point) === templateCount - 1);
    if (
        count <= templateCount ||
        last === undefined ||
        !Array.from({ length: templateCount }, (_, index) => index).every((index) => indexes.has(index))
    ) {
        return series;
    }
    // A slice pulled out of a pie on its own is that slice's, not a look for new slices. Slices all pulled out as far
    // are the pie's look
    const explosions = new Set(points.map((point) => valueOf(childOf(point, "c:explosion"))));
    const model =
        explosions.size === 1 ? withoutUniqueId(last) : withoutChildren(withoutUniqueId(last), (child) => child.name === "c:explosion");
    const added = Array.from({ length: count - templateCount }, (_, offset) => {
        const point = templateCount + offset;
        return withColor(withChild(copyOf(model), createXmlElement("c:idx", { val: point }), POINT_ORDER), colorOf(point));
    });
    const lastPoint = points[points.length - 1];
    return mapChildren(series, (child) => (child === lastPoint ? [child, ...added] : [child]));
};

/**
 * A new series with the look of the template's last series: a copy of it with its own colour, and without what was the
 * last series' own, which are its unique id, trendlines, error bars and its points' own labels, and unless its points
 * are the categories' colours, as in a pie or doughnut chart, its points' own looks.
 *
 * @param keepPointColors - Whether its points' own looks are the categories' colours, and are kept
 * @param color - The new series' colour
 */
export const copySeries = (model: Element, keepPointColors: boolean, color: Element): Element => {
    const copy = mapChildren(withoutUniqueId(model), (child) => {
        switch (child.name) {
            case "c:trendline":
            case "c:errBars":
                return [];
            case "c:dPt":
                return keepPointColors ? [withoutUniqueId(child)] : [];
            case "c:dLbls":
                return [withoutChildren(child, (label) => label.name === "c:dLbl")];
            default:
                return [child];
        }
    });
    return keepPointColors ? copy : withColor(copy, color);
};
