import { describe, expect, it } from "vitest";
import { type Element, xml2js } from "xml-js";

import { formatCodeOf, isDateFormat, pointCountOf, readTemplateChart } from "./template-chart";

// cspell:ignore varyColors barDir radarStyle scatterStyle ofPieType ofPie dLbls strRef numRef numCache formatCode ptCount pivotSource

const parse = (text: string): Element => (xml2js(text, { compact: false, captureSpacesBetweenElements: true }) as Element).elements![0];

// A series, with its order, or null for none
const series = (index: number, order: number | null = index): string =>
    `<c:ser><c:idx val="${index}"/>${order === null ? "" : `<c:order val="${order}"/>`}<c:tx><c:v>S${index}</c:v></c:tx></c:ser>`;

const chartSpaceOf = (plotArea: string, chart = ""): Element =>
    parse(
        `<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
            `<c:chart>${chart}<c:plotArea><c:layout/>${plotArea}</c:plotArea></c:chart></c:chartSpace>`,
    );

// Each series' name, in the order they are given
const names = (chartSpace: Element): readonly string[] =>
    readTemplateChart(chartSpace).series.map((one) =>
        String(one.element.elements?.find(({ name }) => name === "c:tx")?.elements?.[0]?.elements?.[0]?.text),
    );

describe("template-chart", () => {
    describe("readTemplateChart", () => {
        describe("the type of chart", () => {
            const typeOf = (group: string): string => readTemplateChart(chartSpaceOf(group)).type;

            it("should read each type of chart docx/charts writes", () => {
                expect(typeOf(`<c:barChart><c:barDir val="col"/>${series(0)}</c:barChart>`)).to.equal("column");
                expect(typeOf(`<c:barChart><c:barDir val="bar"/>${series(0)}</c:barChart>`)).to.equal("bar");
                expect(typeOf(`<c:lineChart>${series(0)}</c:lineChart>`)).to.equal("line");
                expect(typeOf(`<c:areaChart>${series(0)}</c:areaChart>`)).to.equal("area");
                expect(typeOf(`<c:pieChart>${series(0)}</c:pieChart>`)).to.equal("pie");
                expect(typeOf(`<c:doughnutChart>${series(0)}</c:doughnutChart>`)).to.equal("doughnut");
                expect(typeOf(`<c:radarChart>${series(0)}</c:radarChart>`)).to.equal("radar");
                expect(typeOf(`<c:scatterChart>${series(0)}</c:scatterChart>`)).to.equal("scatter");
                expect(typeOf(`<c:bubbleChart>${series(0)}</c:bubbleChart>`)).to.equal("bubble");
            });

            it("should read a 3-D chart as its flat type, and a pie of a pie as a pie", () => {
                expect(typeOf(`<c:bar3DChart><c:barDir val="col"/>${series(0)}</c:bar3DChart>`)).to.equal("column");
                expect(typeOf(`<c:bar3DChart><c:barDir val="bar"/>${series(0)}</c:bar3DChart>`)).to.equal("bar");
                expect(typeOf(`<c:line3DChart>${series(0)}</c:line3DChart>`)).to.equal("line");
                expect(typeOf(`<c:area3DChart>${series(0)}</c:area3DChart>`)).to.equal("area");
                expect(typeOf(`<c:pie3DChart>${series(0)}</c:pie3DChart>`)).to.equal("pie");
                expect(typeOf(`<c:ofPieChart><c:ofPieType val="bar"/>${series(0)}</c:ofPieChart>`)).to.equal("pie");
            });

            it("should read a bar chart without a direction as a column chart", () => {
                expect(typeOf(`<c:barChart>${series(0)}</c:barChart>`)).to.equal("column");
            });

            it("should read a combo chart as the type of its first group", () => {
                expect(typeOf(`<c:barChart>${series(0)}</c:barChart><c:lineChart>${series(1)}</c:lineChart>`)).to.equal("column");
                expect(typeOf(`<c:areaChart>${series(0)}</c:areaChart><c:barChart>${series(1)}</c:barChart>`)).to.equal("area");
            });

            it("should read a pie, doughnut or radar group as the chart's type wherever it is", () => {
                expect(typeOf(`<c:barChart>${series(0)}</c:barChart><c:pieChart>${series(1)}</c:pieChart>`)).to.equal("pie");
                expect(typeOf(`<c:lineChart>${series(0)}</c:lineChart><c:radarChart>${series(1)}</c:radarChart>`)).to.equal("radar");
            });

            it("should read how each group's series hold their data", () => {
                expect(readTemplateChart(chartSpaceOf(`<c:barChart>${series(0)}</c:barChart>`)).kind).to.equal("category");
                expect(readTemplateChart(chartSpaceOf(`<c:scatterChart>${series(0)}</c:scatterChart>`)).kind).to.equal("scatter");
                expect(readTemplateChart(chartSpaceOf(`<c:bubbleChart>${series(0)}</c:bubbleChart>`)).kind).to.equal("bubble");
            });
        });

        describe("charts it can't patch", () => {
            it("should throw for a stock chart", () => {
                expect(() => readTemplateChart(chartSpaceOf(`<c:stockChart>${series(0)}</c:stockChart>`))).to.throw(
                    "It is a stock chart, whose series are its prices, which ChartDataPatch can't patch",
                );
            });

            it("should throw for a surface chart", () => {
                expect(() => readTemplateChart(chartSpaceOf(`<c:surfaceChart>${series(0)}</c:surfaceChart>`))).to.throw(
                    "It is a surface chart",
                );
                expect(() => readTemplateChart(chartSpaceOf(`<c:surface3DChart>${series(0)}</c:surface3DChart>`))).to.throw(
                    "It is a 3-D surface chart",
                );
            });

            it("should throw for a group it doesn't know", () => {
                expect(() => readTemplateChart(chartSpaceOf(`<c:funnelChart>${series(0)}</c:funnelChart>`))).to.throw(
                    "It has a group of series of a type ChartDataPatch doesn't know (c:funnelChart)",
                );
            });

            it("should not take names on Object's prototype for groups", () => {
                expect(() => readTemplateChart(chartSpaceOf(`<constructorChart>${series(0)}</constructorChart>`))).to.throw(
                    "doesn't know (constructorChart)",
                );
            });

            it("should throw for a stock chart combined with another", () => {
                expect(() =>
                    readTemplateChart(chartSpaceOf(`<c:barChart>${series(0)}</c:barChart><c:stockChart>${series(1)}</c:stockChart>`)),
                ).to.throw("stock chart");
            });

            it("should throw for a pivot chart", () => {
                const chartSpace = parse(
                    `<c:chartSpace><c:pivotSource><c:name>[Book.xlsx]Sheet1!PivotTable1</c:name></c:pivotSource><c:chart><c:plotArea><c:barChart>${series(0)}</c:barChart></c:plotArea></c:chart></c:chartSpace>`,
                );
                expect(() => readTemplateChart(chartSpace)).to.throw("It is a pivot chart, whose data is a pivot table in its workbook");
            });

            it("should throw for a chart part without a chart or plot area", () => {
                expect(() => readTemplateChart(parse("<c:chartSpace/>"))).to.throw("Its chart part has no plot area");
                expect(() => readTemplateChart(parse("<c:chartSpace><c:chart/></c:chartSpace>"))).to.throw(
                    "Its chart part has no plot area",
                );
            });

            it("should throw for a plot area without series groups", () => {
                expect(() => readTemplateChart(chartSpaceOf("<c:valAx/>"))).to.throw("Its plot area has no series groups");
            });

            it("should throw for a scatter or bubble chart combined with a chart with categories", () => {
                expect(() =>
                    readTemplateChart(chartSpaceOf(`<c:lineChart>${series(0)}</c:lineChart><c:scatterChart>${series(1)}</c:scatterChart>`)),
                ).to.throw("It combines a scatter or bubble chart, whose series have points, with another type");
            });

            it("should throw for a scatter chart combined with a bubble chart", () => {
                expect(() =>
                    readTemplateChart(
                        chartSpaceOf(`<c:scatterChart>${series(0)}</c:scatterChart><c:bubbleChart>${series(1)}</c:bubbleChart>`),
                    ),
                ).to.throw("It combines");
            });
        });

        describe("the series", () => {
            it("should give the series in the order they are plotted", () => {
                expect(names(chartSpaceOf(`<c:barChart>${series(0, 2)}${series(1, 0)}${series(2, 1)}</c:barChart>`))).to.deep.equal([
                    "S1",
                    "S2",
                    "S0",
                ]);
            });

            it("should give a combo chart's series in the order they are plotted, across its groups", () => {
                expect(
                    names(
                        chartSpaceOf(`<c:barChart>${series(0, 0)}${series(2, 2)}</c:barChart><c:lineChart>${series(1, 1)}</c:lineChart>`),
                    ),
                ).to.deep.equal(["S0", "S1", "S2"]);
            });

            it("should give series with the same order in the order they are written", () => {
                expect(names(chartSpaceOf(`<c:barChart>${series(0, 1)}${series(1, 1)}${series(2, 0)}</c:barChart>`))).to.deep.equal([
                    "S2",
                    "S0",
                    "S1",
                ]);
            });

            it("should give series without an order last, in the order they are written", () => {
                expect(names(chartSpaceOf(`<c:barChart>${series(0, null)}${series(1, 5)}${series(2, null)}</c:barChart>`))).to.deep.equal([
                    "S1",
                    "S0",
                    "S2",
                ]);
            });

            it("should give each series' index, order and group", () => {
                const chart = readTemplateChart(
                    chartSpaceOf(`<c:barChart>${series(3, 1)}</c:barChart><c:lineChart>${series(7, 0)}</c:lineChart>`),
                );
                expect(chart.series.map(({ index, order, group }) => [index, order, group.type])).to.deep.equal([
                    [7, 0, "line"],
                    [3, 1, "column"],
                ]);
            });

            it("should give a series without an index or order undefined for them", () => {
                const chart = readTemplateChart(chartSpaceOf("<c:barChart><c:ser/></c:barChart>"));
                expect(chart.series.map(({ index, order }) => [index, order])).to.deep.equal([[undefined, undefined]]);
            });

            it("should give a chart without series no series, and its groups", () => {
                const chart = readTemplateChart(chartSpaceOf(`<c:barChart><c:barDir val="col"/></c:barChart>`));
                expect(chart.series).to.deep.equal([]);
                expect(chart.groups).to.have.length(1);
            });

            it("should only count a group's own series, not those in its extensions", () => {
                const chart = readTemplateChart(
                    chartSpaceOf(
                        `<c:barChart>${series(0)}<c:extLst><c:ext><c15:filteredBarSeries><c15:ser>${series(1)}</c15:ser></c15:filteredBarSeries></c:ext></c:extLst></c:barChart>`,
                    ),
                );
                expect(chart.series).to.have.length(1);
            });
        });

        describe("varying colours", () => {
            const variesOf = (group: string): boolean => readTemplateChart(chartSpaceOf(group)).groups[0].varyColors;

            it("should read c:varyColors", () => {
                expect(variesOf(`<c:barChart><c:varyColors val="1"/></c:barChart>`)).to.equal(true);
                expect(variesOf(`<c:barChart><c:varyColors val="true"/></c:barChart>`)).to.equal(true);
                expect(variesOf(`<c:pieChart><c:varyColors val="0"/></c:pieChart>`)).to.equal(false);
                expect(variesOf(`<c:pieChart><c:varyColors val="false"/></c:pieChart>`)).to.equal(false);
            });

            it("should read a c:varyColors without a value as true, as the schema does", () => {
                expect(variesOf(`<c:barChart><c:varyColors/></c:barChart>`)).to.equal(true);
            });

            it("should vary a pie's or doughnut's colours without c:varyColors, and not the others'", () => {
                expect(variesOf("<c:pieChart/>")).to.equal(true);
                expect(variesOf("<c:pie3DChart/>")).to.equal(true);
                expect(variesOf("<c:ofPieChart/>")).to.equal(true);
                expect(variesOf("<c:doughnutChart/>")).to.equal(true);
                expect(variesOf("<c:barChart/>")).to.equal(false);
                expect(variesOf("<c:lineChart/>")).to.equal(false);
                expect(variesOf("<c:scatterChart/>")).to.equal(false);
            });
        });

        describe("the title", () => {
            const titleOf = (title: string): string | undefined => readTemplateChart(chartSpaceOf(`<c:barChart/>`, title)).title;

            it("should read the title's text, a line for each paragraph", () => {
                expect(
                    titleOf(
                        "<c:title><c:tx><c:rich><a:bodyPr/><a:p><a:r><a:t>Sales</a:t></a:r><a:r><a:t> by month</a:t></a:r></a:p>" +
                            "<a:p><a:r><a:t>2025</a:t></a:r></a:p></c:rich></c:tx></c:title>",
                    ),
                ).to.equal("Sales by month\n2025");
            });

            it("should read the text of fields", () => {
                expect(
                    titleOf('<c:title><c:tx><c:rich><a:p><a:fld id="1" type="x"><a:t>Field</a:t></a:fld></a:p></c:rich></c:tx></c:title>'),
                ).to.equal("Field");
            });

            it("should give no title for a chart without one, one Office writes, or one linked to a cell", () => {
                expect(titleOf("")).to.equal(undefined);
                expect(titleOf("<c:title><c:overlay val='0'/></c:title>")).to.equal(undefined);
                expect(titleOf("<c:title><c:tx><c:strRef><c:f>Sheet1!$A$1</c:f></c:strRef></c:tx></c:title>")).to.equal(undefined);
            });

            it("should give an empty title for one without text", () => {
                expect(titleOf("<c:title><c:tx><c:rich><a:bodyPr/></c:rich></c:tx></c:title>")).to.equal("");
            });
        });

        it("should give the chart's parts", () => {
            const chartSpace = chartSpaceOf(`<c:barChart>${series(0)}</c:barChart>`);
            const chart = readTemplateChart(chartSpace);
            expect(chart.chartSpace).to.equal(chartSpace);
            expect(chart.chart.name).to.equal("c:chart");
            expect(chart.plotArea.name).to.equal("c:plotArea");
        });
    });

    describe("pointCountOf", () => {
        it("should give the number of points in the values' cache", () => {
            expect(
                pointCountOf(parse('<c:ser><c:val><c:numRef><c:numCache><c:ptCount val="7"/></c:numCache></c:numRef></c:val></c:ser>')),
            ).to.equal(7);
            expect(pointCountOf(parse('<c:ser><c:yVal><c:numLit><c:ptCount val="3"/></c:numLit></c:yVal></c:ser>'))).to.equal(3);
        });

        it("should give none for a series without values, or a count", () => {
            expect(pointCountOf(parse("<c:ser/>"))).to.equal(0);
            expect(pointCountOf(parse("<c:ser><c:val><c:numRef/></c:val></c:ser>"))).to.equal(0);
            expect(
                pointCountOf(parse('<c:ser><c:val><c:numRef><c:numCache><c:ptCount val="x"/></c:numCache></c:numRef></c:val></c:ser>')),
            ).to.equal(0);
        });
    });

    describe("formatCodeOf", () => {
        const withFormat = (format: string): Element =>
            parse(`<c:ser><c:val><c:numRef><c:f>A</c:f><c:numCache>${format}</c:numCache></c:numRef></c:val></c:ser>`);

        it("should give the number format of a series' data", () => {
            expect(formatCodeOf(withFormat("<c:formatCode>0%</c:formatCode>"), "c:val")).to.equal("0%");
            expect(formatCodeOf(withFormat("<c:formatCode> #,##0.00 </c:formatCode>"), "c:val")).to.equal("#,##0.00");
        });

        it("should give the number format of literal data", () => {
            expect(
                formatCodeOf(parse("<c:ser><c:cat><c:numLit><c:formatCode>d mmm</c:formatCode></c:numLit></c:cat></c:ser>"), "c:cat"),
            ).to.equal("d mmm");
        });

        it("should give none for General, whatever its capitals, or an empty format", () => {
            expect(formatCodeOf(withFormat("<c:formatCode>General</c:formatCode>"), "c:val")).to.equal(undefined);
            expect(formatCodeOf(withFormat("<c:formatCode>GENERAL</c:formatCode>"), "c:val")).to.equal(undefined);
            expect(formatCodeOf(withFormat("<c:formatCode></c:formatCode>"), "c:val")).to.equal(undefined);
            expect(formatCodeOf(withFormat("<c:formatCode>  </c:formatCode>"), "c:val")).to.equal(undefined);
        });

        it("should give none for text, data without a format, or no data", () => {
            expect(formatCodeOf(parse("<c:ser><c:cat><c:strRef><c:f>A</c:f></c:strRef></c:cat></c:ser>"), "c:cat")).to.equal(undefined);
            expect(formatCodeOf(withFormat(""), "c:val")).to.equal(undefined);
            expect(formatCodeOf(withFormat("<c:formatCode>0%</c:formatCode>"), "c:cat")).to.equal(undefined);
            expect(formatCodeOf(undefined, "c:val")).to.equal(undefined);
        });
    });

    describe("isDateFormat", () => {
        it("should find dates and times", () => {
            for (const format of [
                "d mmm yyyy",
                "mmm yyyy",
                "yyyy",
                "m/d/yy",
                "dd/mm/yyyy",
                "h:mm",
                "hh:mm:ss",
                "[h]:mm",
                "[mm]:ss",
                "[ss]",
                "mmm-yy",
                "AM/PM",
                "D MMM",
            ]) {
                expect(isDateFormat(format), format).to.equal(true);
            }
        });

        it("should find dates with a locale, colour or condition", () => {
            expect(isDateFormat("[$-409]mmmm d, yyyy")).to.equal(true);
            expect(isDateFormat("[Red]d mmm")).to.equal(true);
        });

        it("should not find dates in number formats", () => {
            for (const format of [
                "0",
                "0.00",
                "#,##0",
                "0%",
                "0.0%",
                "$#,##0.00",
                "0.00E+00",
                "# ?/?",
                "@",
                "General",
                "[Red]0.0",
                "#,##0;[Red]-#,##0",
            ]) {
                expect(isDateFormat(format), format).to.equal(false);
            }
        });

        it("should not find dates in quoted or escaped text, or in padding", () => {
            expect(isDateFormat('0 "days"')).to.equal(false);
            expect(isDateFormat('#,##0 "hrs" "ms"')).to.equal(false);
            expect(isDateFormat("0\\d")).to.equal(false);
            expect(isDateFormat("0_m")).to.equal(false);
            expect(isDateFormat("0*s")).to.equal(false);
            expect(isDateFormat("[$USD] #,##0")).to.equal(false);
        });
    });
});
