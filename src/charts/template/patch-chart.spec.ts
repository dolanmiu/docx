import { describe, expect, it, vi } from "vitest";
import xml from "xml";
import { type Element, js2xml, xml2js } from "xml-js";

import { Formatter } from "@export/formatter";
import type { XmlComponent } from "docx";

import { createChartData } from "../chart-data";
import { type ChartRunOptions } from "../chart-options";
import {
    type TemplateChartData,
    describeWorkbookReference,
    findWorkbookReference,
    patchChartSpace,
    relationshipIdAttributeOf,
    withWorkbook,
} from "./patch-chart";
import { readTemplateChart } from "./template-chart";
import { childOf, childrenOf, descendantsOf, textOf } from "./template-xml";

// cspell:ignore dLbls dLbl dPt varyColors barDir axId crossAx valAx catAx dateAx baseTimeUnit majorTimeUnit legendEntry schemeClr srgbClr lumMod
// cspell:ignore numCache strCache ptCount strRef numRef formatCode datalabelsRange trendlineLbl errBars sqref externalData autoUpdate userShapes

const parse = (text: string): Element => (xml2js(text, { compact: false, captureSpacesBetweenElements: true }) as Element).elements![0];

const write = (element: Element | undefined): string => (element === undefined ? "" : js2xml({ elements: [element] }));

const formatter = new Formatter();
const format = (content: XmlComponent): Element => parse(xml(formatter.format(content)));

const NAMESPACES =
    'xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';

const color = (value: string): string => `<c:spPr><a:solidFill><a:srgbClr val="${value}"/></a:solidFill></c:spPr>`;

const series = (index: number, extra = ""): string =>
    `<c:ser><c:idx val="${index}"/><c:order val="${index}"/><c:tx><c:v>Old ${index}</c:v></c:tx>${extra}` +
    `<c:cat><c:strRef><c:f>Sheet1!$A$2:$A$4</c:f></c:strRef></c:cat>` +
    `<c:val><c:numRef><c:f>Sheet1!$B$2:$B$4</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="3"/></c:numCache></c:numRef></c:val></c:ser>`;

const AXES = (category: number, value: number, date = false): string =>
    `<c:${date ? "dateAx" : "catAx"}><c:axId val="${category}"/><c:crossAx val="${value}"/>${date ? '<c:auto val="1"/><c:baseTimeUnit val="months"/><c:majorUnit val="1"/><c:majorTimeUnit val="months"/>' : ""}</c:${date ? "dateAx" : "catAx"}>` +
    `<c:valAx><c:axId val="${value}"/><c:crossAx val="${category}"/></c:valAx>`;

const chartSpaceOf = (plotArea: string, { chart = "", root = "", namespaces = NAMESPACES } = {}): Element =>
    parse(`<c:chartSpace ${namespaces}>${root}<c:chart>${chart}<c:plotArea><c:layout/>${plotArea}</c:plotArea></c:chart></c:chartSpace>`);

const dataOf = (options: ChartRunOptions, dates?: TemplateChartData["dates"]): TemplateChartData => ({
    ...createChartData(options),
    dates,
});

const categories = ["A", "B", "C"];
const column = (count: number, points = 3): ChartRunOptions => ({
    type: "column",
    categories: categories.concat(Array.from({ length: Math.max(0, points - 3) }, (_, index) => `X${index}`)).slice(0, points),
    series: Array.from({ length: count }, (_, index) => ({ name: `New ${index}`, values: Array.from({ length: points }, () => index) })),
});

const patch = (
    chartSpace: Element,
    options: ChartRunOptions,
    createSeries: () => readonly Element[] = () => [],
    dates?: TemplateChartData["dates"],
): { readonly chartSpace: Element; readonly references: ReadonlySet<Element> } =>
    patchChartSpace(readTemplateChart(chartSpace), dataOf(options, dates), format, createSeries);

const seriesOf = (chartSpace: Element): readonly Element[] => descendantsOf(chartSpace, "c:ser");
const valuesOf = (element: Element, name: string): readonly string[] =>
    childrenOf(element, name).map((child) => String(child.attributes?.val));
const nameOf = (one: Element): string => textOf(descendantsOf(childOf(one, "c:tx"), "c:v")[0]);

// The names of an element's child elements, in order
const elementNames = (element: Element | undefined): readonly string[] =>
    (element?.elements ?? []).filter(({ type }) => type === "element").map(({ name }) => name ?? "");

// Every element in an element
const elementsIn = (element: Element): readonly Element[] => (element.elements ?? []).flatMap((child) => [child, ...elementsIn(child)]);

describe("patch-chart", () => {
    describe("patchChartSpace", () => {
        describe("the series' data", () => {
            it("should replace each series' name, categories and values with references to the new workbook, with their caches", () => {
                const { chartSpace } = patch(
                    chartSpaceOf(`<c:barChart><c:barDir val="col"/>${series(0)}${series(1)}</c:barChart>${AXES(1, 2)}`),
                    column(2),
                );

                const [first, second] = seriesOf(chartSpace);
                expect(nameOf(first)).to.equal("New 0");
                expect(nameOf(second)).to.equal("New 1");
                expect(textOf(descendantsOf(childOf(second, "c:tx"), "c:f")[0])).to.equal("Sheet1!$C$1");
                expect(textOf(descendantsOf(childOf(second, "c:cat"), "c:f")[0])).to.equal("Sheet1!$A$2:$A$4");
                expect(textOf(descendantsOf(childOf(second, "c:val"), "c:f")[0])).to.equal("Sheet1!$C$2:$C$4");
                expect(descendantsOf(childOf(second, "c:val"), "c:v").map(textOf)).to.deep.equal(["1", "1", "1"]);
            });

            it("should give each new data element as a reference to the new workbook", () => {
                const { chartSpace, references } = patch(chartSpaceOf(`<c:barChart>${series(0)}</c:barChart>${AXES(1, 2)}`), column(1));

                const [one] = seriesOf(chartSpace);
                expect([...references]).to.have.members(["c:tx", "c:cat", "c:val"].map((name) => childOf(one, name)));
            });

            it("should write a scatter chart's x and y values, and a bubble chart's sizes", () => {
                const scatter = patch(
                    chartSpaceOf(`<c:scatterChart><c:ser><c:idx val="0"/><c:order val="0"/><c:xVal/><c:yVal/></c:ser></c:scatterChart>`),
                    {
                        type: "scatter",
                        series: [{ name: "P", points: [{ x: 1, y: 2 }] }],
                    },
                );
                expect(elementNames(seriesOf(scatter.chartSpace)[0])).to.deep.equal(["c:idx", "c:order", "c:tx", "c:xVal", "c:yVal"]);

                const bubble = patch(
                    chartSpaceOf(`<c:bubbleChart><c:ser><c:idx val="0"/><c:order val="0"/><c:bubble3D val="0"/></c:ser></c:bubbleChart>`),
                    {
                        type: "bubble",
                        series: [{ name: "B", points: [{ x: 1, y: 2, size: 3 }] }],
                    },
                );
                expect(elementNames(seriesOf(bubble.chartSpace)[0])).to.deep.equal([
                    "c:idx",
                    "c:order",
                    "c:tx",
                    "c:xVal",
                    "c:yVal",
                    "c:bubbleSize",
                    "c:bubble3D",
                ]);
                expect(textOf(descendantsOf(childOf(seriesOf(bubble.chartSpace)[0], "c:bubbleSize"), "c:v")[0])).to.equal("3");
            });

            it("should leave the template's chart as it was", () => {
                const template = chartSpaceOf(`<c:barChart>${series(0)}${series(1)}</c:barChart>${AXES(1, 2)}`);
                const before = write(template);
                patch(template, column(3, 5));
                patch(template, column(1, 1));
                expect(write(template)).to.equal(before);
            });

            it("should keep everything else in the template's series", () => {
                const template = chartSpaceOf(
                    `<c:lineChart>${series(0, `${color("C00000")}<c:marker><c:symbol val="diamond"/></c:marker><c:dLbls><c:showVal val="1"/></c:dLbls><c:trendline/>`)}</c:lineChart>${AXES(1, 2)}`,
                );
                const [one] = seriesOf(patch(template, column(1)).chartSpace);
                expect(elementNames(one)).to.deep.equal([
                    "c:idx",
                    "c:order",
                    "c:tx",
                    "c:spPr",
                    "c:marker",
                    "c:dLbls",
                    "c:trendline",
                    "c:cat",
                    "c:val",
                ]);
                expect(write(one)).to.contain("C00000");
            });
        });

        describe("more or fewer series", () => {
            it("should remove the template's series past the new data's, in the order they are plotted", () => {
                const template = chartSpaceOf(
                    `<c:barChart>${series(2).replace('<c:order val="2"/>', '<c:order val="0"/>')}${series(0).replace('<c:order val="0"/>', '<c:order val="1"/>')}${series(1).replace('<c:order val="1"/>', '<c:order val="2"/>')}</c:barChart>${AXES(1, 2)}`,
                );
                const kept = seriesOf(patch(template, column(2)).chartSpace);
                expect(kept.map((one) => valuesOf(one, "c:idx")[0])).to.deep.equal(["2", "0"]);
                expect(kept.map(nameOf)).to.deep.equal(["New 0", "New 1"]);
            });

            it("should add new series after the last series plotted, with the next index and order, in its own colour", () => {
                const template = chartSpaceOf(
                    `<c:barChart>${series(0, color("111111"))}${series(4, color("C00000"))}<c:gapWidth val="150"/></c:barChart>${AXES(1, 2)}`,
                );
                const { chartSpace } = patch(template, column(4));
                const group = descendantsOf(chartSpace, "c:barChart")[0];

                expect(elementNames(group)).to.deep.equal(["c:ser", "c:ser", "c:ser", "c:ser", "c:gapWidth"]);
                const all = seriesOf(chartSpace);
                expect(all.map((one) => valuesOf(one, "c:idx")[0])).to.deep.equal(["0", "4", "5", "6"]);
                expect(all.map((one) => valuesOf(one, "c:order")[0])).to.deep.equal(["0", "4", "5", "6"]);
                expect(all.map(nameOf)).to.deep.equal(["New 0", "New 1", "New 2", "New 3"]);
                expect(write(childOf(all[2], "c:spPr"))).to.equal(
                    '<c:spPr><a:solidFill><a:schemeClr val="accent3"/></a:solidFill></c:spPr>',
                );
                expect(write(childOf(all[3], "c:spPr"))).to.equal(
                    '<c:spPr><a:solidFill><a:schemeClr val="accent4"/></a:solidFill></c:spPr>',
                );
            });

            it("should colour the seventh series on with the accents' variations, as docx/charts does", () => {
                const { chartSpace } = patch(
                    chartSpaceOf(`<c:barChart>${series(0, color("111111"))}</c:barChart>${AXES(1, 2)}`),
                    column(8),
                );
                expect(write(childOf(seriesOf(chartSpace)[7], "c:spPr"))).to.equal(
                    '<c:spPr><a:solidFill><a:schemeClr val="accent2"><a:lumMod val="60000"/></a:schemeClr></a:solidFill></c:spPr>',
                );
            });

            it("should add a combo chart's new series to the group of its last series", () => {
                const template = chartSpaceOf(`<c:barChart>${series(0)}</c:barChart><c:lineChart>${series(1)}</c:lineChart>${AXES(1, 2)}`);
                const { chartSpace } = patch(template, column(3));
                expect(childrenOf(descendantsOf(chartSpace, "c:barChart")[0], "c:ser")).to.have.length(1);
                expect(childrenOf(descendantsOf(chartSpace, "c:lineChart")[0], "c:ser")).to.have.length(2);
            });

            it("should add a doughnut's new rings with the slices' colours", () => {
                const slice = (index: number): string => `<c:dPt><c:idx val="${index}"/>${color(`00000${index}`)}</c:dPt>`;
                const template = chartSpaceOf(
                    `<c:doughnutChart><c:varyColors val="1"/>${series(0, `${slice(0)}${slice(1)}${slice(2)}`)}<c:holeSize val="50"/></c:doughnutChart>`,
                );
                const { chartSpace } = patch(template, {
                    type: "doughnut",
                    categories,
                    series: [0, 1].map((index) => ({ name: `R${index}`, values: [1, 2, 3] })),
                });

                const [, ring] = seriesOf(chartSpace);
                expect(childrenOf(ring, "c:dPt").map((point) => write(point))).to.deep.equal([slice(0), slice(1), slice(2)]);
            });

            it("should remove a group left without series, and the axes only it used", () => {
                const template = chartSpaceOf(
                    `<c:barChart>${series(0)}<c:axId val="1"/><c:axId val="2"/></c:barChart>` +
                        `<c:lineChart>${series(1)}<c:axId val="3"/><c:axId val="4"/></c:lineChart>` +
                        `${AXES(1, 2)}${AXES(3, 4)}<c:spPr/>`,
                );
                const plotArea = descendantsOf(patch(template, column(1)).chartSpace, "c:plotArea")[0];
                expect(elementNames(plotArea)).to.deep.equal(["c:layout", "c:barChart", "c:catAx", "c:valAx", "c:spPr"]);
                expect(descendantsOf(plotArea, "c:axId").map((axis) => axis.attributes?.val)).to.deep.equal(["1", "2", "1", "2"]);
            });

            it("should keep the axes a removed group shares with the others", () => {
                const template = chartSpaceOf(
                    `<c:barChart>${series(0)}<c:axId val="1"/><c:axId val="2"/></c:barChart>` +
                        `<c:lineChart>${series(1)}<c:axId val="1"/><c:axId val="2"/></c:lineChart>${AXES(1, 2)}`,
                );
                const plotArea = descendantsOf(patch(template, column(1)).chartSpace, "c:plotArea")[0];
                expect(elementNames(plotArea)).to.deep.equal(["c:layout", "c:barChart", "c:catAx", "c:valAx"]);
            });

            it("should keep an empty group, and one with only text, and put new series in them after their settings", () => {
                const template = chartSpaceOf(`<c:barChart>${series(0)}</c:barChart><c:areaChart/>${AXES(1, 2)}`);
                expect(elementNames(descendantsOf(patch(template, column(1)).chartSpace, "c:plotArea")[0])).to.include("c:areaChart");

                const created = [parse('<c:ser><c:idx val="0"/><c:order val="0"/></c:ser>')];
                const spaced = patch(
                    chartSpaceOf(`<c:lineChart>\n  <c:grouping val="standard"/>\n</c:lineChart>${AXES(1, 2)}`),
                    column(1),
                    () => created,
                );
                expect(elementNames(descendantsOf(spaced.chartSpace, "c:lineChart")[0])).to.deep.equal(["c:grouping", "c:ser"]);
                const empty = patch(chartSpaceOf(`<c:lineChart/>${AXES(1, 2)}`), column(1), () => created);
                expect(elementNames(descendantsOf(empty.chartSpace, "c:lineChart")[0])).to.deep.equal(["c:ser"]);
            });

            it("should number new series after series without an index or order", () => {
                const template = chartSpaceOf(`<c:barChart><c:ser><c:tx/><c:val/></c:ser>${series(3)}</c:barChart>${AXES(1, 2)}`);
                const all = seriesOf(patch(template, column(3)).chartSpace);
                expect(all.map((one) => valuesOf(one, "c:idx")[0])).to.deep.equal([undefined, "3", "4"]);
                expect(all.map((one) => valuesOf(one, "c:order")[0])).to.deep.equal([undefined, "3", "4"]);
            });

            it("should keep axes without an id, and remove the unused axes of a group with an axis without an id", () => {
                const template = chartSpaceOf(
                    `<c:barChart>${series(0)}<c:axId val="1"/><c:axId val="2"/></c:barChart>` +
                        `<c:lineChart>${series(1)}<c:axId/><c:axId val="4"/></c:lineChart>` +
                        `${AXES(1, 2)}<c:valAx><c:axId val="4"/></c:valAx><c:catAx/>`,
                );
                expect(elementNames(descendantsOf(patch(template, column(1)).chartSpace, "c:plotArea")[0])).to.deep.equal([
                    "c:layout",
                    "c:barChart",
                    "c:catAx",
                    "c:valAx",
                    "c:catAx",
                ]);
            });

            it("should keep a group that had no series in the template", () => {
                const template = chartSpaceOf(
                    `<c:barChart>${series(0)}</c:barChart><c:lineChart><c:axId val="9"/></c:lineChart>${AXES(1, 2)}`,
                );
                expect(elementNames(descendantsOf(patch(template, column(1)).chartSpace, "c:plotArea")[0])).to.include("c:lineChart");
            });

            it("should give a chart without series the series docx/charts writes, after its group's settings", () => {
                const created = [
                    parse('<c:ser><c:idx val="0"/><c:order val="0"/></c:ser>'),
                    parse('<c:ser><c:idx val="1"/><c:order val="1"/></c:ser>'),
                ];
                const createSeries = vi.fn(() => created);
                const template = chartSpaceOf(
                    `<c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/><c:gapWidth val="219"/></c:barChart>${AXES(1, 2)}`,
                );
                const { chartSpace } = patch(template, column(2), createSeries);

                expect(createSeries).toHaveBeenCalledTimes(1);
                const group = descendantsOf(chartSpace, "c:barChart")[0];
                expect(elementNames(group)).to.deep.equal(["c:barDir", "c:grouping", "c:varyColors", "c:ser", "c:ser", "c:gapWidth"]);
                expect(seriesOf(chartSpace).map(nameOf)).to.deep.equal(["New 0", "New 1"]);
            });

            it("should put the new series first in a group without settings", () => {
                const created = [parse('<c:ser><c:idx val="0"/><c:order val="0"/></c:ser>')];
                const { chartSpace } = patch(
                    chartSpaceOf(`<c:barChart><c:axId val="1"/></c:barChart>${AXES(1, 2)}`),
                    column(1),
                    () => created,
                );
                expect(elementNames(descendantsOf(chartSpace, "c:barChart")[0])).to.deep.equal(["c:ser", "c:axId"]);
            });

            it("should only create docx/charts' series for a chart without any", () => {
                const createSeries = vi.fn(() => []);
                patch(chartSpaceOf(`<c:barChart>${series(0)}</c:barChart>${AXES(1, 2)}`), column(3), createSeries);
                expect(createSeries).not.toHaveBeenCalled();
            });
        });

        describe("more or fewer points", () => {
            const points = (count: number): string =>
                Array.from({ length: count }, (_, index) => `<c:dPt><c:idx val="${index}"/>${color(`AA000${index}`)}</c:dPt>`).join("");
            const labels = (count: number): string =>
                `<c:dLbls>${Array.from({ length: count }, (_, index) => `<c:dLbl><c:idx val="${index}"/></c:dLbl>`).join("")}<c:showVal val="1"/></c:dLbls>`;

            it("should remove the points' own looks and labels past the new data's last point", () => {
                const { chartSpace } = patch(
                    chartSpaceOf(`<c:barChart>${series(0, `${points(3)}${labels(3)}`)}</c:barChart>${AXES(1, 2)}`),
                    column(1, 2),
                );
                const [one] = seriesOf(chartSpace);
                expect(childrenOf(one, "c:dPt")).to.have.length(2);
                expect(descendantsOf(one, "c:dLbl")).to.have.length(2);
            });

            it("should give a pie's new slices their own looks, in the next colours", () => {
                const template = chartSpaceOf(`<c:pieChart><c:varyColors val="1"/>${series(0, points(3))}</c:pieChart>`);
                const { chartSpace } = patch(template, {
                    type: "pie",
                    categories: ["A", "B", "C", "D", "E"],
                    series: [{ name: "Pie", values: [1, 2, 3, 4, 5] }],
                });
                const slices = childrenOf(seriesOf(chartSpace)[0], "c:dPt");

                expect(slices.map((slice) => valuesOf(slice, "c:idx")[0])).to.deep.equal(["0", "1", "2", "3", "4"]);
                expect(write(childOf(slices[3], "c:spPr"))).to.equal(
                    '<c:spPr><a:solidFill><a:schemeClr val="accent4"/></a:solidFill></c:spPr>',
                );
                expect(write(childOf(slices[4], "c:spPr"))).to.equal(
                    '<c:spPr><a:solidFill><a:schemeClr val="accent5"/></a:solidFill></c:spPr>',
                );
            });

            it("should not give new points their own looks when the points' colours don't vary", () => {
                const { chartSpace } = patch(
                    chartSpaceOf(`<c:barChart><c:varyColors val="0"/>${series(0, points(3))}</c:barChart>${AXES(1, 2)}`),
                    column(1, 5),
                );
                expect(childrenOf(seriesOf(chartSpace)[0], "c:dPt")).to.have.length(3);
            });

            it("should give a single series' bars that vary their colours their own looks", () => {
                const { chartSpace } = patch(
                    chartSpaceOf(`<c:barChart><c:varyColors val="1"/>${series(0, points(3))}</c:barChart>${AXES(1, 2)}`),
                    column(1, 5),
                );
                expect(childrenOf(seriesOf(chartSpace)[0], "c:dPt")).to.have.length(5);
            });
        });

        describe("the axes", () => {
            const dated = chartSpaceOf(`<c:lineChart>${series(0)}</c:lineChart>${AXES(1, 2, true)}`);

            it("should make a date axis a category axis for categories that aren't dates", () => {
                const plotArea = descendantsOf(patch(dated, column(1)).chartSpace, "c:plotArea")[0];
                expect(write(childOf(plotArea, "c:catAx"))).to.equal(
                    '<c:catAx><c:axId val="1"/><c:crossAx val="2"/><c:auto val="1"/></c:catAx>',
                );
                expect(childOf(plotArea, "c:dateAx")).to.equal(undefined);
            });

            it("should space dates by a shorter unit than the template's, and not a longer one", () => {
                const dates = {
                    type: "line",
                    categories: [new Date("2025-01-01"), new Date("2025-01-02")],
                    series: [{ name: "D", values: [1, 2] }],
                } as const;
                const unitOf = (chartSpace: Element): string | undefined =>
                    valuesOf(descendantsOf(chartSpace, "c:dateAx")[0], "c:baseTimeUnit")[0];

                expect(unitOf(patch(dated, dates, undefined, "days").chartSpace)).to.equal("days");
                expect(unitOf(patch(dated, dates, undefined, "years").chartSpace)).to.equal("months");
                expect(unitOf(patch(dated, dates, undefined, "months").chartSpace)).to.equal("months");
                expect(write(descendantsOf(patch(dated, dates, undefined, "days").chartSpace, "c:dateAx")[0])).to.contain(
                    '<c:majorTimeUnit val="months"/>',
                );
            });

            it("should space dates by days when the date axis' unit has no value", () => {
                const plain = chartSpaceOf(
                    `<c:lineChart>${series(0)}</c:lineChart><c:dateAx><c:axId val="1"/><c:baseTimeUnit/></c:dateAx>`,
                );
                const dates = { type: "line", categories: [new Date("2025-01-01")], series: [{ name: "D", values: [1] }] } as const;
                expect(write(descendantsOf(patch(plain, dates, undefined, "months").chartSpace, "c:dateAx")[0])).to.equal(
                    '<c:dateAx><c:axId val="1"/><c:baseTimeUnit/></c:dateAx>',
                );
            });

            it("should leave a date axis without a time unit as it is", () => {
                const plain = chartSpaceOf(`<c:lineChart>${series(0)}</c:lineChart><c:dateAx><c:axId val="1"/></c:dateAx>`);
                expect(write(descendantsOf(patch(plain, column(1), undefined, "days").chartSpace, "c:dateAx")[0])).to.equal(
                    '<c:dateAx><c:axId val="1"/></c:dateAx>',
                );
            });

            it("should leave a category axis for dates as it is, for Office to read the dates", () => {
                const plain = chartSpaceOf(`<c:lineChart>${series(0)}</c:lineChart>${AXES(1, 2)}`);
                expect(write(descendantsOf(patch(plain, column(1), undefined, "days").chartSpace, "c:catAx")[0])).to.equal(
                    '<c:catAx><c:axId val="1"/><c:crossAx val="2"/></c:catAx>',
                );
            });
        });

        describe("the legend", () => {
            const entries = (count: number): string =>
                Array.from(
                    { length: count },
                    (_, index) => `<c:legendEntry><c:idx val="${index}"/><c:delete val="1"/></c:legendEntry>`,
                ).join("");

            it("should remove the legend's own entries for series that are gone", () => {
                const template = chartSpaceOf(`<c:barChart>${series(0)}${series(1)}${series(2)}</c:barChart>${AXES(1, 2)}`, {
                    chart: "",
                });
                const withLegend = parse(
                    write(template).replace("</c:plotArea>", `</c:plotArea><c:legend><c:legendPos val="b"/>${entries(3)}</c:legend>`),
                );
                const legend = descendantsOf(patch(withLegend, column(2)).chartSpace, "c:legend")[0];
                expect(childrenOf(legend, "c:legendEntry")).to.have.length(2);
                expect(childOf(legend, "c:legendPos")).to.not.equal(undefined);
            });

            it("should keep a single series' entries for its points, when each has its own colour", () => {
                const withLegend = parse(
                    write(chartSpaceOf(`<c:pieChart>${series(0)}</c:pieChart>`)).replace(
                        "</c:plotArea>",
                        `</c:plotArea><c:legend>${entries(4)}</c:legend>`,
                    ),
                );
                const pie = (count: number): ChartRunOptions => ({
                    type: "pie",
                    categories: categories.slice(0, count),
                    series: [{ name: "Pie", values: Array.from({ length: count }, () => 1) }],
                });

                expect(childrenOf(descendantsOf(patch(withLegend, pie(3)).chartSpace, "c:legend")[0], "c:legendEntry")).to.have.length(3);
                expect(childrenOf(descendantsOf(patch(withLegend, pie(1)).chartSpace, "c:legend")[0], "c:legendEntry")).to.have.length(1);
            });

            it("should read an entry without an index as the first", () => {
                const withLegend = parse(
                    write(chartSpaceOf(`<c:barChart>${series(0)}</c:barChart>${AXES(1, 2)}`)).replace(
                        "</c:plotArea>",
                        "</c:plotArea><c:legend><c:legendEntry/></c:legend>",
                    ),
                );
                expect(childrenOf(descendantsOf(patch(withLegend, column(1)).chartSpace, "c:legend")[0], "c:legendEntry")).to.have.length(
                    1,
                );
            });
        });

        describe("the chart part's root", () => {
            it("should count the new data's dates from 1900", () => {
                const { chartSpace } = patch(
                    chartSpaceOf(`<c:barChart>${series(0)}</c:barChart>${AXES(1, 2)}`, {
                        root: '<c:date1904 val="1"/><c:lang val="en-GB"/>',
                    }),
                    column(1),
                );
                expect(write(childOf(chartSpace, "c:date1904"))).to.equal('<c:date1904 val="0"/>');
                expect(write(childOf(chartSpace, "c:lang"))).to.equal('<c:lang val="en-GB"/>');
            });

            it("should declare the namespaces the new data is written with, if the template doesn't", () => {
                const { chartSpace } = patch(
                    chartSpaceOf(`<c:barChart>${series(0)}</c:barChart>${AXES(1, 2)}`, {
                        namespaces: 'xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"',
                    }),
                    column(1),
                );
                expect(chartSpace.attributes).to.deep.equal({
                    "xmlns:c": "http://schemas.openxmlformats.org/drawingml/2006/chart",
                    "xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main",
                    "xmlns:r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
                });
            });

            it("should keep the template's own namespaces", () => {
                const namespaces = `${NAMESPACES} xmlns:c16r2="http://schemas.microsoft.com/office/drawing/2015/06/chart"`;
                const { chartSpace } = patch(chartSpaceOf(`<c:barChart>${series(0)}</c:barChart>${AXES(1, 2)}`, { namespaces }), column(1));
                expect(Object.keys(chartSpace.attributes ?? {})).to.deep.equal(["xmlns:c", "xmlns:a", "xmlns:r", "xmlns:c16r2"]);
            });

            it("should keep everything else, including what it doesn't know", () => {
                const root =
                    '<c:roundedCorners val="0"/><mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"><mc:Choice Requires="c14"><c14:style val="102"/></mc:Choice><mc:Fallback><c:style val="2"/></mc:Fallback></mc:AlternateContent>';
                const template = chartSpaceOf(`<c:barChart>${series(0)}</c:barChart>${AXES(1, 2)}`, {
                    root,
                    chart: "<c:autoTitleDeleted val='1'/>",
                });
                const patched = write(patch(template, column(1)).chartSpace);
                expect(patched).to.contain(root);
                expect(patched).to.contain('<c:autoTitleDeleted val="1"/>');
            });
        });
    });

    describe("withWorkbook", () => {
        it("should refer to the workbook by its relationship id", () => {
            const chartSpace = parse(
                '<c:chartSpace><c:chart/><c:externalData r:id="rId1"><c:autoUpdate val="1"/></c:externalData></c:chartSpace>',
            );
            expect(write(withWorkbook(chartSpace, "rId9"))).to.equal(
                '<c:chartSpace><c:chart/><c:externalData r:id="rId9"><c:autoUpdate val="1"/></c:externalData></c:chartSpace>',
            );
        });

        it("should keep the relationships namespace's prefix", () => {
            const chartSpace = parse('<c:chartSpace><c:externalData xmlns:rel="x" rel:id="rId1"/></c:chartSpace>');
            expect(write(withWorkbook(chartSpace, "rId9"))).to.equal(
                '<c:chartSpace><c:externalData xmlns:rel="x" rel:id="rId9"/></c:chartSpace>',
            );
        });

        it("should add a reference to the workbook where the schema has it, if there was none", () => {
            for (const [before, after] of [
                ["<c:chart/><c:spPr/><c:txPr/>", ""],
                ["<c:chart/>", "<c:printSettings/>"],
                ["<c:chart/>", "<c:userShapes/><c:extLst/>"],
                ["<c:chart/>", "<c:extLst/>"],
            ]) {
                expect(write(withWorkbook(parse(`<c:chartSpace>${before}${after}</c:chartSpace>`), "rId3"))).to.equal(
                    `<c:chartSpace>${before}<c:externalData r:id="rId3"><c:autoUpdate val="0"/></c:externalData>${after}</c:chartSpace>`,
                );
            }
        });

        it("should add a reference with the relationships prefix when the element has no id", () => {
            expect(write(withWorkbook(parse("<c:chartSpace><c:externalData/></c:chartSpace>"), "rId2"))).to.equal(
                '<c:chartSpace><c:externalData r:id="rId2"/></c:chartSpace>',
            );
        });
    });

    describe("relationshipIdAttributeOf", () => {
        it("should find the relationship id, whatever its prefix", () => {
            expect(relationshipIdAttributeOf(parse('<c:chart xmlns:r="x" r:id="rId1"/>'))).to.equal("r:id");
            expect(relationshipIdAttributeOf(parse('<c:chart xmlns:rel="x" rel:id="rId1"/>'))).to.equal("rel:id");
        });

        it("should find none on an element without one, or no element", () => {
            expect(relationshipIdAttributeOf(parse('<c:chart id="1"/>'))).to.equal(undefined);
            expect(relationshipIdAttributeOf(parse('<c:chart xmlns:id="x"/>'))).to.equal(undefined);
            expect(relationshipIdAttributeOf(parse("<c:chart/>"))).to.equal(undefined);
            expect(relationshipIdAttributeOf(undefined)).to.equal(undefined);
        });
    });

    describe("findWorkbookReference and describeWorkbookReference", () => {
        const find = (text: string, skip: ReadonlySet<Element> = new Set()): readonly string[] | undefined =>
            findWorkbookReference(parse(text), skip)?.map(({ name }) => name ?? "");

        it("should find the first formula, with the elements it is in", () => {
            expect(
                find(
                    "<c:chartSpace><c:chart><c:title><c:tx><c:strRef><c:f>Sheet1!$A$1</c:f></c:strRef></c:tx></c:title></c:chart></c:chartSpace>",
                ),
            ).to.deep.equal(["c:chart", "c:title", "c:tx", "c:strRef", "c:f"]);
        });

        it("should find formulas and ranges in extensions, whatever their prefix", () => {
            expect(find("<a><c:ext><c15:datalabelsRange><c15:f>Sheet1!$C$2:$C$5</c15:f></c15:datalabelsRange></c:ext></a>")).to.deep.equal([
                "c:ext",
                "c15:datalabelsRange",
                "c15:f",
            ]);
            expect(
                find(
                    "<a><c15:categoryFilterExceptions><c15:categoryFilterException><c15:sqref>Sheet1!$A$3</c15:sqref></c15:categoryFilterException></c15:categoryFilterExceptions></a>",
                ),
            ).to.deep.equal(["c15:categoryFilterExceptions", "c15:categoryFilterException", "c15:sqref"]);
            expect(find("<a><f>1</f></a>")).to.deep.equal(["f"]);
        });

        it("should find nothing where nothing refers to cells", () => {
            expect(
                find("<c:chartSpace><c:chart><c:formatCode>0%</c:formatCode><c:fmtId val='0'/><c:ref/></c:chart></c:chartSpace>"),
            ).to.equal(undefined);
            expect(find("<a/>")).to.equal(undefined);
        });

        it("should skip the new data", () => {
            const chartSpace = parse(
                "<a><c:val><c:numRef><c:f>new</c:f></c:numRef></c:val><c:errBars><c:plus><c:numRef><c:f>old</c:f></c:numRef></c:plus></c:errBars></a>",
            );
            const reference = findWorkbookReference(chartSpace, new Set([childOf(chartSpace, "c:val")!]));
            expect(reference?.map(({ name }) => name)).to.deep.equal(["c:errBars", "c:plus", "c:numRef", "c:f"]);
            expect(findWorkbookReference(chartSpace, new Set(elementsIn(chartSpace)))).to.equal(undefined);
        });

        it("should say what refers to cells, and what to do in Word", () => {
            const reasonOf = (text: string): string => describeWorkbookReference(findWorkbookReference(parse(text), new Set())!);

            expect(reasonOf("<a><c:ext><c15:datalabelsRange><c15:f>x</c15:f></c15:datalabelsRange></c:ext></a>")).to.equal(
                'Its data labels show text from cells of its workbook (Word\'s "Value From Cells"). Turn that off in Word: the new data replaces the workbook',
            );
            expect(
                reasonOf(
                    "<a><c15:filteredBarSeries><c15:ser><c:tx><c:strRef><c:f>x</c:f></c:strRef></c:tx></c15:ser></c15:filteredBarSeries></a>",
                ),
            ).to.contain("It has series or categories hidden with Word's chart filters. Show them, or remove them in Word's Select Data");
            expect(reasonOf("<a><c15:categoryFilterException><c15:sqref>x</c15:sqref></c15:categoryFilterException></a>")).to.contain(
                "chart filters",
            );
            expect(
                reasonOf("<a><c:ser><c:errBars><c:minus><c:numRef><c:f>x</c:f></c:numRef></c:minus></c:errBars></c:ser></a>"),
            ).to.contain("Its error bars' custom values are cells of its workbook. Give them fixed values in Word, or remove them");
            expect(reasonOf("<a><c:valAx><c:title><c:tx><c:strRef><c:f>x</c:f></c:strRef></c:tx></c:title></c:valAx></a>")).to.contain(
                "A title is linked to a cell of its workbook. Type the title in Word instead",
            );
            for (const label of [
                "<c:dLbls><c:dLbl><c:tx><c:strRef><c:f>x</c:f></c:strRef></c:tx></c:dLbl></c:dLbls>",
                "<c:trendlineLbl><c:tx><c:strRef><c:f>x</c:f></c:strRef></c:tx></c:trendlineLbl>",
            ]) {
                expect(reasonOf(`<a>${label}</a>`)).to.contain(
                    "A label is linked to a cell of its workbook. Type the label in Word instead",
                );
            }
            expect(reasonOf("<a><c:unknown><c:f>x</c:f></c:unknown></a>")).to.equal(
                "Something in it refers to cells of its workbook (c:unknown > c:f): the new data replaces the workbook",
            );
        });
    });
});
