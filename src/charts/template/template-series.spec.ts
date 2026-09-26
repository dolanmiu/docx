import { describe, expect, it } from "vitest";
import { type Element, js2xml, xml2js } from "xml-js";

import { CHART_SPACE_ORDER } from "./patch-chart";
import {
    POINT_ORDER,
    SERIES_ORDER,
    copySeries,
    mainColorOf,
    recolor,
    withData,
    withIndex,
    withPointsUpTo,
    withoutPointsPast,
    withoutUniqueId,
} from "./template-series";

// cspell:ignore srgbClr schemeClr lumMod lumOff dLbls dLbl dPt extLst errBars trendline uniqueId spPr gradFill gsLst prstClr sysClr

const parse = (text: string): Element => (xml2js(text, { compact: false, captureSpacesBetweenElements: true }) as Element).elements![0];

const write = (element: Element | undefined): string => (element === undefined ? "" : js2xml({ elements: [element] }));

// The children of each type in ooxml-schemas/ISO-IEC29500-4_2016/dml-chart.xsd, in order, with the children of the
// groups it refers to (EG_SerShared) in their places
/* eslint-disable @typescript-eslint/naming-convention -- The schema's names for its types */
const SCHEMA_ORDERS: Readonly<Record<string, readonly string[]>> = {
    CT_BarSer: [
        "c:idx",
        "c:order",
        "c:tx",
        "c:spPr",
        "c:invertIfNegative",
        "c:pictureOptions",
        "c:dPt",
        "c:dLbls",
        "c:trendline",
        "c:errBars",
        "c:cat",
        "c:val",
        "c:shape",
        "c:extLst",
    ],
    CT_LineSer: [
        "c:idx",
        "c:order",
        "c:tx",
        "c:spPr",
        "c:marker",
        "c:dPt",
        "c:dLbls",
        "c:trendline",
        "c:errBars",
        "c:cat",
        "c:val",
        "c:smooth",
        "c:extLst",
    ],
    CT_AreaSer: [
        "c:idx",
        "c:order",
        "c:tx",
        "c:spPr",
        "c:pictureOptions",
        "c:dPt",
        "c:dLbls",
        "c:trendline",
        "c:errBars",
        "c:cat",
        "c:val",
        "c:extLst",
    ],
    CT_PieSer: ["c:idx", "c:order", "c:tx", "c:spPr", "c:explosion", "c:dPt", "c:dLbls", "c:cat", "c:val", "c:extLst"],
    CT_RadarSer: ["c:idx", "c:order", "c:tx", "c:spPr", "c:marker", "c:dPt", "c:dLbls", "c:cat", "c:val", "c:extLst"],
    CT_ScatterSer: [
        "c:idx",
        "c:order",
        "c:tx",
        "c:spPr",
        "c:marker",
        "c:dPt",
        "c:dLbls",
        "c:trendline",
        "c:errBars",
        "c:xVal",
        "c:yVal",
        "c:smooth",
        "c:extLst",
    ],
    CT_BubbleSer: [
        "c:idx",
        "c:order",
        "c:tx",
        "c:spPr",
        "c:invertIfNegative",
        "c:dPt",
        "c:dLbls",
        "c:trendline",
        "c:errBars",
        "c:xVal",
        "c:yVal",
        "c:bubbleSize",
        "c:bubble3D",
        "c:extLst",
    ],
    CT_DPt: ["c:idx", "c:invertIfNegative", "c:marker", "c:bubble3D", "c:explosion", "c:spPr", "c:pictureOptions", "c:extLst"],
    CT_ChartSpace: [
        "c:date1904",
        "c:lang",
        "c:roundedCorners",
        "c:style",
        "c:clrMapOvr",
        "c:pivotSource",
        "c:protection",
        "c:chart",
        "c:spPr",
        "c:txPr",
        "c:externalData",
        "c:printSettings",
        "c:userShapes",
        "c:extLst",
    ],
};
/* eslint-enable @typescript-eslint/naming-convention */

const ACCENT2 = '<a:schemeClr val="accent2"/>';

describe("template-series", () => {
    describe("the orders of children", () => {
        it("should keep the schema's order of every type of series", () => {
            for (const type of ["CT_BarSer", "CT_LineSer", "CT_AreaSer", "CT_PieSer", "CT_RadarSer", "CT_ScatterSer", "CT_BubbleSer"]) {
                const order = SCHEMA_ORDERS[type];
                expect(order.length, type).to.be.greaterThan(4);
                expect(
                    order.every((name) => SERIES_ORDER.includes(name)),
                    `${type} has ${order.filter((name) => !SERIES_ORDER.includes(name)).join(", ")}`,
                ).to.equal(true);
                const ranks = order.map((name) => SERIES_ORDER.indexOf(name));
                expect(
                    ranks.every((rank, index) => index === 0 || rank > ranks[index - 1]),
                    type,
                ).to.equal(true);
            }
        });

        it("should be the schema's order of a point and of a chart part's root", () => {
            expect(POINT_ORDER).to.deep.equal(SCHEMA_ORDERS.CT_DPt);
            expect(CHART_SPACE_ORDER).to.deep.equal(SCHEMA_ORDERS.CT_ChartSpace);
        });
    });

    describe("mainColorOf", () => {
        it("should give the colour of the fill first", () => {
            const series = parse(
                '<c:ser><c:spPr><a:solidFill><a:srgbClr val="C00000"/></a:solidFill><a:ln><a:solidFill><a:schemeClr val="accent1"/></a:solidFill></a:ln></c:spPr></c:ser>',
            );
            expect(write(mainColorOf(series))).to.equal('<a:srgbClr val="C00000"/>');
        });

        it("should give the colour of the line when there is no fill", () => {
            const series = parse(
                '<c:ser><c:spPr><a:noFill/><a:ln w="28575"><a:solidFill><a:schemeClr val="accent3"/></a:solidFill></a:ln></c:spPr></c:ser>',
            );
            expect(write(mainColorOf(series))).to.equal('<a:schemeClr val="accent3"/>');
        });

        it("should give the colour of the marker when the series' shape has none", () => {
            const series = parse(
                '<c:ser><c:spPr><a:ln><a:noFill/></a:ln></c:spPr><c:marker><c:spPr><a:solidFill><a:prstClr val="red"/></a:solidFill></c:spPr></c:marker></c:ser>',
            );
            expect(write(mainColorOf(series))).to.equal('<a:prstClr val="red"/>');
        });

        it("should give each kind of colour, with its changes", () => {
            for (const color of [
                '<a:scrgbClr r="1" g="2" b="3"/>',
                '<a:hslClr hue="1" sat="2" lum="3"/>',
                '<a:sysClr val="windowText" lastClr="000000"/>',
                '<a:schemeClr val="accent1"><a:lumMod val="60000"/><a:lumOff val="40000"/></a:schemeClr>',
            ]) {
                expect(write(mainColorOf(parse(`<c:ser><c:spPr><a:solidFill>${color}</a:solidFill></c:spPr></c:ser>`)))).to.equal(color);
            }
        });

        it("should give the first colour of a gradient", () => {
            const series = parse(
                '<c:ser><c:spPr><a:gradFill><a:gsLst><a:gs pos="0"><a:srgbClr val="111111"/></a:gs><a:gs pos="100000"><a:srgbClr val="222222"/></a:gs></a:gsLst></a:gradFill></c:spPr></c:ser>',
            );
            expect(write(mainColorOf(series))).to.equal('<a:srgbClr val="111111"/>');
        });

        it("should give no colour for a series without one of its own", () => {
            expect(mainColorOf(parse("<c:ser/>"))).to.equal(undefined);
            expect(mainColorOf(parse("<c:ser><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr></c:ser>"))).to.equal(undefined);
            expect(
                mainColorOf(
                    parse('<c:ser><c:dLbls><c:txPr><a:solidFill><a:srgbClr val="000000"/></a:solidFill></c:txPr></c:dLbls></c:ser>'),
                ),
            ).to.equal(undefined);
        });
    });

    describe("recolor", () => {
        it("should replace each of a colour, at any depth, and leave the other colours", () => {
            const properties = parse(
                '<c:spPr><a:solidFill><a:srgbClr val="C00000"/></a:solidFill><a:ln><a:solidFill><a:srgbClr val="C00000"/></a:solidFill></a:ln>' +
                    '<a:effectLst><a:outerShdw><a:srgbClr val="000000"/></a:outerShdw></a:effectLst></c:spPr>',
            );
            expect(write(recolor(properties, parse('<a:srgbClr val="C00000"/>'), parse(ACCENT2)))).to.equal(
                `<c:spPr><a:solidFill>${ACCENT2}</a:solidFill><a:ln><a:solidFill>${ACCENT2}</a:solidFill></a:ln>` +
                    '<a:effectLst><a:outerShdw><a:srgbClr val="000000"/></a:outerShdw></a:effectLst></c:spPr>',
            );
        });

        it("should only replace a colour with the same changes", () => {
            const properties = parse(
                '<c:spPr><a:solidFill><a:schemeClr val="accent1"/></a:solidFill><a:ln><a:solidFill><a:schemeClr val="accent1"><a:lumMod val="75000"/></a:schemeClr></a:solidFill></a:ln></c:spPr>',
            );
            expect(write(recolor(properties, parse('<a:schemeClr val="accent1"/>'), parse(ACCENT2)))).to.equal(
                `<c:spPr><a:solidFill>${ACCENT2}</a:solidFill><a:ln><a:solidFill><a:schemeClr val="accent1"><a:lumMod val="75000"/></a:schemeClr></a:solidFill></a:ln></c:spPr>`,
            );
        });

        it("should find the same colour however its XML is laid out", () => {
            const properties = parse(
                '<c:spPr>\n  <a:solidFill>\n    <a:schemeClr val="accent1">\n      <a:lumMod val="60000"/>\n    </a:schemeClr>\n  </a:solidFill>\n</c:spPr>',
            );
            const from = parse('<a:schemeClr val="accent1"><a:lumMod val="60000"/></a:schemeClr>');
            expect(write(recolor(properties, from, parse(ACCENT2)))).to.contain(`<a:solidFill>\n    ${ACCENT2}\n  </a:solidFill>`);
        });

        it("should keep the old colour's transparency", () => {
            const from = parse('<a:schemeClr val="accent1"><a:alpha val="75000"/></a:schemeClr>');
            const properties = parse(`<c:spPr><a:solidFill>${write(from)}</a:solidFill></c:spPr>`);
            expect(write(recolor(properties, from, parse(ACCENT2)))).to.equal(
                '<c:spPr><a:solidFill><a:schemeClr val="accent2"><a:alpha val="75000"/></a:schemeClr></a:solidFill></c:spPr>',
            );
        });

        it("should keep the new colour's own transparency", () => {
            const from = parse('<a:schemeClr val="accent1"><a:alpha val="75000"/></a:schemeClr>');
            const to = parse('<a:schemeClr val="accent2"><a:alpha val="10000"/></a:schemeClr>');
            expect(write(recolor(parse(`<c:spPr><a:solidFill>${write(from)}</a:solidFill></c:spPr>`), from, to))).to.equal(
                `<c:spPr><a:solidFill>${write(to)}</a:solidFill></c:spPr>`,
            );
        });

        it("should give each replacement its own copy, and leave the element as it was", () => {
            const properties = parse(
                '<c:spPr><a:solidFill><a:srgbClr val="C00000"/></a:solidFill><a:ln><a:solidFill><a:srgbClr val="C00000"/></a:solidFill></a:ln></c:spPr>',
            );
            const to = parse(ACCENT2);
            const changed = recolor(properties, parse('<a:srgbClr val="C00000"/>'), to);
            const [first, second] = [changed.elements![0].elements![0], changed.elements![1].elements![0].elements![0]];

            expect(first).to.not.equal(second);
            expect(first).to.not.equal(to);
            expect(write(properties)).to.contain("C00000");
        });
    });

    describe("withoutUniqueId", () => {
        const UNIQUE_ID =
            '<c:ext uri="{C3380CC4-5D6E-409C-BE32-E72D297353CC}" xmlns:c16="http://schemas.microsoft.com/office/drawing/2014/chart"><c16:uniqueId val="{00000000-0001}"/></c:ext>';

        it("should remove Office's unique id, and its extension list if that leaves it empty", () => {
            expect(write(withoutUniqueId(parse(`<c:ser><c:idx val="0"/><c:extLst>${UNIQUE_ID}</c:extLst></c:ser>`)))).to.equal(
                '<c:ser><c:idx val="0"/></c:ser>',
            );
        });

        it("should keep the other extensions", () => {
            expect(write(withoutUniqueId(parse(`<c:ser><c:extLst>${UNIQUE_ID}<c:ext uri="{other}"/></c:extLst></c:ser>`)))).to.equal(
                '<c:ser><c:extLst><c:ext uri="{other}"/></c:extLst></c:ser>',
            );
        });

        it("should leave an element without a unique id as it is", () => {
            expect(write(withoutUniqueId(parse('<c:ser><c:extLst><c:ext uri="{other}"/></c:extLst></c:ser>')))).to.equal(
                '<c:ser><c:extLst><c:ext uri="{other}"/></c:extLst></c:ser>',
            );
            expect(write(withoutUniqueId(parse("<c:ser/>")))).to.equal("<c:ser/>");
        });

        it("should only remove the element's own extensions", () => {
            const point = `<c:ser><c:dPt><c:extLst>${UNIQUE_ID}</c:extLst></c:dPt></c:ser>`;
            expect(write(withoutUniqueId(parse(point)))).to.equal(point);
        });
    });

    describe("withIndex", () => {
        it("should replace the series' index and order", () => {
            expect(write(withIndex(parse('<c:ser><c:idx val="0"/><c:order val="0"/><c:tx/></c:ser>'), 5, 3))).to.equal(
                '<c:ser><c:idx val="5"/><c:order val="3"/><c:tx/></c:ser>',
            );
        });

        it("should add an index and order the series doesn't have, first", () => {
            expect(write(withIndex(parse("<c:ser><c:tx/><c:val/></c:ser>"), 1, 2))).to.equal(
                '<c:ser><c:idx val="1"/><c:order val="2"/><c:tx/><c:val/></c:ser>',
            );
        });
    });

    describe("withData", () => {
        const data = [parse("<c:tx>new name</c:tx>"), parse("<c:cat>new categories</c:cat>"), parse("<c:val>new values</c:val>")];

        it("should replace a series' name, categories and values in their places", () => {
            const series = parse(
                '<c:ser><c:idx val="0"/><c:order val="0"/><c:tx>name</c:tx><c:spPr/><c:invertIfNegative val="0"/><c:cat>categories</c:cat><c:val>values</c:val><c:extLst/></c:ser>',
            );
            expect(write(withData(series, data))).to.equal(
                '<c:ser><c:idx val="0"/><c:order val="0"/><c:tx>new name</c:tx><c:spPr/><c:invertIfNegative val="0"/><c:cat>new categories</c:cat><c:val>new values</c:val><c:extLst/></c:ser>',
            );
        });

        it("should add a name, categories and values the series doesn't have, in the schema's order", () => {
            const series = parse(
                '<c:ser><c:idx val="0"/><c:order val="0"/><c:spPr/><c:marker/><c:dLbls/><c:smooth val="0"/><c:extLst/></c:ser>',
            );
            expect(write(withData(series, data))).to.equal(
                '<c:ser><c:idx val="0"/><c:order val="0"/><c:tx>new name</c:tx><c:spPr/><c:marker/><c:dLbls/><c:cat>new categories</c:cat><c:val>new values</c:val><c:smooth val="0"/><c:extLst/></c:ser>',
            );
        });

        it("should put a pie's categories and values after its points and labels", () => {
            const series = parse('<c:ser><c:idx val="0"/><c:order val="0"/><c:explosion val="5"/><c:dPt/><c:dPt/><c:dLbls/></c:ser>');
            expect(write(withData(series, data))).to.equal(
                '<c:ser><c:idx val="0"/><c:order val="0"/><c:tx>new name</c:tx><c:explosion val="5"/><c:dPt/><c:dPt/><c:dLbls/><c:cat>new categories</c:cat><c:val>new values</c:val></c:ser>',
            );
        });

        it("should put a bar series' categories and values before its shape", () => {
            const series = parse('<c:ser><c:idx val="0"/><c:order val="0"/><c:trendline/><c:errBars/><c:shape val="box"/></c:ser>');
            expect(write(withData(series, data))).to.equal(
                '<c:ser><c:idx val="0"/><c:order val="0"/><c:tx>new name</c:tx><c:trendline/><c:errBars/><c:cat>new categories</c:cat><c:val>new values</c:val><c:shape val="box"/></c:ser>',
            );
        });

        it("should put a bubble series' x values, y values and sizes before its 3-D effect", () => {
            const series = parse('<c:ser><c:idx val="0"/><c:order val="0"/><c:invertIfNegative val="0"/><c:bubble3D val="0"/></c:ser>');
            const points = [parse("<c:tx/>"), parse("<c:xVal/>"), parse("<c:yVal/>"), parse("<c:bubbleSize/>")];
            expect(write(withData(series, points))).to.equal(
                '<c:ser><c:idx val="0"/><c:order val="0"/><c:tx/><c:invertIfNegative val="0"/><c:xVal/><c:yVal/><c:bubbleSize/><c:bubble3D val="0"/></c:ser>',
            );
        });

        it("should put a scatter series' x and y values before whether it is smooth", () => {
            const series = parse('<c:ser><c:idx val="0"/><c:order val="0"/><c:tx/><c:marker/><c:smooth val="1"/></c:ser>');
            expect(write(withData(series, [parse("<c:xVal>x</c:xVal>"), parse("<c:yVal>y</c:yVal>")]))).to.equal(
                '<c:ser><c:idx val="0"/><c:order val="0"/><c:tx/><c:marker/><c:xVal>x</c:xVal><c:yVal>y</c:yVal><c:smooth val="1"/></c:ser>',
            );
        });

        it("should add data to an empty series", () => {
            expect(write(withData(parse("<c:ser/>"), data))).to.equal(
                "<c:ser><c:tx>new name</c:tx><c:cat>new categories</c:cat><c:val>new values</c:val></c:ser>",
            );
        });

        it("should keep the data's own elements, so they can be found", () => {
            const patched = withData(parse("<c:ser><c:tx/></c:ser>"), data);
            expect(patched.elements).to.include(data[0]);
            expect(patched.elements).to.include(data[2]);
        });
    });

    describe("withoutPointsPast", () => {
        const series = parse(
            '<c:ser><c:dPt><c:idx val="0"/></c:dPt><c:dPt><c:idx val="2"/></c:dPt><c:dPt><c:idx val="5"/></c:dPt>' +
                '<c:dLbls><c:dLbl><c:idx val="1"/></c:dLbl><c:dLbl><c:idx val="4"/></c:dLbl><c:showVal val="1"/></c:dLbls></c:ser>',
        );

        it("should remove the points' own looks and labels past the last point", () => {
            expect(write(withoutPointsPast(series, 3))).to.equal(
                '<c:ser><c:dPt><c:idx val="0"/></c:dPt><c:dPt><c:idx val="2"/></c:dPt><c:dLbls><c:dLbl><c:idx val="1"/></c:dLbl><c:showVal val="1"/></c:dLbls></c:ser>',
            );
        });

        it("should keep them all when there are as many points or more", () => {
            expect(write(withoutPointsPast(series, 6))).to.equal(write(series));
            expect(write(withoutPointsPast(series, 1000))).to.equal(write(series));
        });

        it("should remove them all past the first point", () => {
            expect(write(withoutPointsPast(series, 1))).to.equal(
                '<c:ser><c:dPt><c:idx val="0"/></c:dPt><c:dLbls><c:showVal val="1"/></c:dLbls></c:ser>',
            );
        });

        it("should read a point without an index as the first", () => {
            expect(write(withoutPointsPast(parse("<c:ser><c:dPt/></c:ser>"), 1))).to.equal("<c:ser><c:dPt/></c:ser>");
        });
    });

    describe("withPointsUpTo", () => {
        const slice = (index: number, color: string, extra = ""): string =>
            `<c:dPt><c:idx val="${index}"/><c:bubble3D val="0"/><c:spPr><a:solidFill>${color}</a:solidFill><a:ln w="19050"><a:solidFill><a:schemeClr val="lt1"/></a:solidFill></a:ln></c:spPr>${extra}</c:dPt>`;
        const pie = parse(
            `<c:ser><c:idx val="0"/>${slice(0, '<a:schemeClr val="accent1"/>')}${slice(1, '<a:srgbClr val="FF0000"/>')}<c:dLbls/><c:cat/><c:val/></c:ser>`,
        );
        const colorOf = (point: number): Element => parse(`<a:schemeClr val="accent${point + 1}"/>`);

        it("should give each new point a copy of the last point's look, in its own colour", () => {
            expect(write(withPointsUpTo(pie, 4, 2, colorOf))).to.equal(
                `<c:ser><c:idx val="0"/>${slice(0, '<a:schemeClr val="accent1"/>')}${slice(1, '<a:srgbClr val="FF0000"/>')}` +
                    `${slice(2, '<a:schemeClr val="accent3"/>')}${slice(3, '<a:schemeClr val="accent4"/>')}<c:dLbls/><c:cat/><c:val/></c:ser>`,
            );
        });

        it("should leave a series with as many points or fewer as it is", () => {
            expect(write(withPointsUpTo(pie, 2, 2, colorOf))).to.equal(write(pie));
            expect(write(withPointsUpTo(pie, 1, 2, colorOf))).to.equal(write(pie));
        });

        it("should leave a series whose points don't all have their own look as it is", () => {
            const partial = parse(`<c:ser>${slice(1, '<a:srgbClr val="FF0000"/>')}</c:ser>`);
            expect(write(withPointsUpTo(partial, 5, 2, colorOf))).to.equal(write(partial));
            const gap = parse(`<c:ser>${slice(0, ACCENT2)}${slice(2, ACCENT2)}</c:ser>`);
            expect(write(withPointsUpTo(gap, 5, 3, colorOf))).to.equal(write(gap));
        });

        it("should leave a series that had no points, or whose points have no look, as it is", () => {
            expect(write(withPointsUpTo(pie, 5, 0, colorOf))).to.equal(write(pie));
            expect(write(withPointsUpTo(parse("<c:ser><c:val/></c:ser>"), 5, 2, colorOf))).to.equal("<c:ser><c:val/></c:ser>");
        });

        it("should copy the look of the point with the last index, and add after the last point written", () => {
            const unordered = parse(`<c:ser>${slice(1, '<a:srgbClr val="111111"/>')}${slice(0, '<a:srgbClr val="000000"/>')}</c:ser>`);
            expect(write(withPointsUpTo(unordered, 3, 2, colorOf))).to.equal(
                `<c:ser>${slice(1, '<a:srgbClr val="111111"/>')}${slice(0, '<a:srgbClr val="000000"/>')}${slice(2, '<a:schemeClr val="accent3"/>')}</c:ser>`,
            );
        });

        it("should leave out the copied point's unique id, and keep its explosion", () => {
            const withId = parse(
                `<c:ser>${slice(0, ACCENT2, '<c:extLst><c:ext uri="{C3380CC4}"><c16:uniqueId val="{1}"/></c:ext></c:extLst>').replace('<c:bubble3D val="0"/>', '<c:bubble3D val="0"/><c:explosion val="12"/>')}</c:ser>`,
            );
            const extended = write(withPointsUpTo(withId, 2, 1, colorOf));
            expect(extended.match(/uniqueId/g)).to.have.length(1);
            expect(extended.match(/<c:explosion val="12"\/>/g)).to.have.length(2);
        });

        it("should give a point without a colour of its own none", () => {
            const plain = parse('<c:ser><c:dPt><c:idx val="0"/><c:bubble3D val="0"/></c:dPt></c:ser>');
            expect(write(withPointsUpTo(plain, 2, 1, colorOf))).to.equal(
                '<c:ser><c:dPt><c:idx val="0"/><c:bubble3D val="0"/></c:dPt><c:dPt><c:idx val="1"/><c:bubble3D val="0"/></c:dPt></c:ser>',
            );
        });

        it("should add a point's index where the schema has it, if the point had none", () => {
            const noIndex = parse(`<c:ser><c:dPt><c:bubble3D val="0"/></c:dPt></c:ser>`);
            expect(write(withPointsUpTo(noIndex, 2, 1, colorOf))).to.equal(
                '<c:ser><c:dPt><c:bubble3D val="0"/></c:dPt><c:dPt><c:idx val="1"/><c:bubble3D val="0"/></c:dPt></c:ser>',
            );
        });
    });

    describe("copySeries", () => {
        const model = parse(
            '<c:ser><c:idx val="1"/><c:order val="1"/><c:tx/>' +
                '<c:spPr><a:ln w="28575"><a:solidFill><a:srgbClr val="C00000"/></a:solidFill><a:prstDash val="dash"/></a:ln></c:spPr>' +
                '<c:marker><c:symbol val="diamond"/><c:size val="8"/><c:spPr><a:solidFill><a:srgbClr val="C00000"/></a:solidFill><a:ln><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:ln></c:spPr></c:marker>' +
                '<c:dPt><c:idx val="2"/><c:spPr><a:solidFill><a:srgbClr val="00FF00"/></a:solidFill></c:spPr></c:dPt>' +
                '<c:dLbls><c:dLbl><c:idx val="0"/><c:showVal val="1"/></c:dLbl><c:showVal val="1"/><c:showSerName val="0"/></c:dLbls>' +
                '<c:trendline><c:trendlineType val="linear"/></c:trendline><c:errBars><c:errValType val="percentage"/></c:errBars>' +
                '<c:cat/><c:val/><c:smooth val="0"/>' +
                '<c:extLst><c:ext uri="{C3380CC4}"><c16:uniqueId val="{1}"/></c:ext></c:extLst></c:ser>',
        );

        it("should copy the look, in its own colour, without what was the last series' own", () => {
            expect(write(copySeries(model, false, parse(ACCENT2)))).to.equal(
                '<c:ser><c:idx val="1"/><c:order val="1"/><c:tx/>' +
                    `<c:spPr><a:ln w="28575"><a:solidFill>${ACCENT2}</a:solidFill><a:prstDash val="dash"/></a:ln></c:spPr>` +
                    `<c:marker><c:symbol val="diamond"/><c:size val="8"/><c:spPr><a:solidFill>${ACCENT2}</a:solidFill><a:ln><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:ln></c:spPr></c:marker>` +
                    '<c:dLbls><c:showVal val="1"/><c:showSerName val="0"/></c:dLbls>' +
                    '<c:cat/><c:val/><c:smooth val="0"/></c:ser>',
            );
        });

        it("should keep the points' own looks and colour when they are the categories' colours", () => {
            const copy = write(copySeries(model, true, parse(ACCENT2)));
            expect(copy).to.contain('<c:dPt><c:idx val="2"/><c:spPr><a:solidFill><a:srgbClr val="00FF00"/></a:solidFill></c:spPr></c:dPt>');
            expect(copy).to.contain("C00000");
            expect(copy).to.not.contain("accent2");
            expect(copy).to.not.contain("trendline");
            expect(copy).to.not.contain("uniqueId");
        });

        it("should leave out the points' unique ids when it keeps their looks", () => {
            const pie = parse(
                '<c:ser><c:dPt><c:idx val="0"/><c:extLst><c:ext uri="{C3380CC4}"><c16:uniqueId val="{2}"/></c:ext></c:extLst></c:dPt></c:ser>',
            );
            expect(write(copySeries(pie, true, parse(ACCENT2)))).to.equal('<c:ser><c:dPt><c:idx val="0"/></c:dPt></c:ser>');
        });

        it("should copy a series without a colour of its own as it is, for Office to colour by its index", () => {
            expect(write(copySeries(parse('<c:ser><c:idx val="0"/><c:val/></c:ser>'), false, parse(ACCENT2)))).to.equal(
                '<c:ser><c:idx val="0"/><c:val/></c:ser>',
            );
        });

        it("should leave the last series as it was", () => {
            const before = write(model);
            copySeries(model, false, parse(ACCENT2));
            expect(write(model)).to.equal(before);
        });
    });
});
