import { describe, expect, it } from "vitest";
import xml from "xml";
import { type Element, xml2js } from "xml-js";

import { Formatter } from "@export/formatter";
import { File } from "@file/file";
import { Relationships } from "@file/relationships";
import { type IContext, PackagePart } from "docx";

import { createChartData } from "./chart-data";
import type { ChartRunOptions, ChartSeries } from "./chart-options";
import { createChartSpace } from "./chart-space";
// @ts-expect-error -- Vite reads the schema as text, which TypeScript has no type for
import chartSchema from "../../ooxml-schemas/ISO-IEC29500-4_2016/dml-chart.xsd?raw";

// The chart schema, which every chart part's elements are checked against: each element's children are ones its type
// has, in its type's order. The Open XML SDK validator checks this too, for the demos only
const schema = xml2js(chartSchema as string) as Element;

const definitions = new Map(
    schema
        .elements![0].elements!.filter(({ name }) => name === "xsd:complexType" || name === "xsd:group")
        .map((definition) => [`${definition.name}:${definition.attributes!.name}`, definition]),
);

type Child = {
    /** Its type, such as CT_BarSer, or a type of another schema, such as a:CT_ShapeProperties */
    readonly type: string;
    /** Where it comes in its parent: children of one rank come before those of the next, and a choice's are all one rank */
    readonly rank: number;
};

/**
 * The children a complex type or group has, by name, with their types and ranks, from the rank given.
 */
const childrenOf = (definition: Element, first = 0): { readonly children: ReadonlyMap<string, Child>; readonly next: number } =>
    (definition.elements ?? []).reduce<{ readonly children: ReadonlyMap<string, Child>; readonly next: number }>(
        ({ children, next }, part) => {
            switch (part.name) {
                case "xsd:element":
                    return {
                        children: new Map([
                            ...children,
                            [String(part.attributes!.name), { type: String(part.attributes!.type), rank: next }],
                        ]),
                        next: next + 1,
                    };
                case "xsd:group": {
                    const group = childrenOf(definitions.get(`xsd:group:${part.attributes!.ref}`)!, next);
                    return { children: new Map([...children, ...group.children]), next: group.next };
                }
                case "xsd:sequence": {
                    const sequence = childrenOf(part, next);
                    return { children: new Map([...children, ...sequence.children]), next: sequence.next };
                }
                case "xsd:choice": {
                    // Each of a choice's options takes the same place
                    const options = (part.elements ?? []).map((option) => childrenOf({ elements: [option] }, next));
                    return {
                        children: new Map([...children, ...options.flatMap((option) => [...option.children])]),
                        next: Math.max(next + 1, ...options.map((option) => option.next)),
                    };
                }
                default:
                    return { children, next };
            }
        },
        { children: new Map(), next: first },
    );

/**
 * The problems with an element's children and theirs: children its type doesn't have, or children out of order.
 */
const problemsIn = (element: Element, type: string, path: string): readonly string[] => {
    const definition = definitions.get(`xsd:complexType:${type}`);
    if (definition === undefined) {
        return [`${path}: unknown type ${type}`];
    }
    const { children } = childrenOf(definition);
    const elements = (element.elements ?? []).filter((child) => child.type === "element");
    return elements.flatMap((child, index) => {
        const local = child.name!.replace(/^c:/, "");
        const declared = child.name!.startsWith("c:") ? children.get(local) : undefined;
        const at = `${path} > ${child.name}`;
        if (declared === undefined) {
            return [`${at}: not a child of ${type}`];
        }
        const before = elements.slice(0, index).map((one) => children.get(one.name!.replace(/^c:/, ""))?.rank ?? -1);
        const order = before.some((rank) => rank > declared.rank) ? [`${at}: out of the order of ${type}`] : [];
        // Types of other schemas, such as DrawingML's shape properties, aren't checked
        return [...order, ...(declared.type.includes(":") ? [] : problemsIn(child, declared.type, at))];
    });
};

const workbook = new PackagePart({
    folder: "embeddings",
    name: "Microsoft_Excel_Worksheet",
    extension: "xlsx",
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    relationshipType: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/package",
    content: new Uint8Array(),
});

const chartSpaceOf = (options: ChartRunOptions): Element => {
    const component = createChartSpace(options, createChartData(options), workbook);
    const written = xml(
        new Formatter().format(component, {
            file: new File({ sections: [] }),
            viewWrapper: { View: component, Relationships: new Relationships() },
            stack: [],
        } as IContext),
    );
    return (xml2js(written) as Element).elements![0];
};

const problemsOf = (options: ChartRunOptions): readonly string[] => problemsIn(chartSpaceOf(options), "CT_ChartSpace", "c:chartSpace");

const categories = ["Jan", "Feb", "Mar", "Apr"];
const values = [10, 20, null, 40];

// A series with everything a series drawn as its type can have
const everything = (name: string, drawnAs: "column" | "bar" | "line" | "area", stacked: boolean): ChartSeries => ({
    name,
    values,
    dataLabels: { value: true, numberFormat: "0", position: drawnAs === "area" ? undefined : "center" },
    pointLabels: [{ text: "One" }, false, undefined, { category: true, font: { bold: true } }],
    errorBars: { type: "custom", plus: [1, 2], minus: [1] },
    ...(stacked
        ? {}
        : {
              trendlines: [{ type: "linear", equation: true, rSquared: true, intercept: 1, forecastForward: 1 }, { type: "movingAverage" }],
          }),
    ...(drawnAs === "line" ? { markers: true, smooth: true, line: { dash: "dash" } } : {}),
    ...(drawnAs === "column" || drawnAs === "bar" ? { colors: ["FF0000"] } : {}),
});

const CHARTS: readonly (readonly [string, ChartRunOptions])[] = [
    ...(["column", "bar", "line", "area"] as const).flatMap((type) =>
        (["none", "stacked", "percent"] as const).map(
            (stacking) =>
                [
                    `${type}, ${stacking}`,
                    {
                        type,
                        categories,
                        stacking,
                        series: [everything("A", type, stacking !== "none"), everything("B", type, stacking !== "none")],
                        dataTable: { legendKeys: false },
                        emptyValues: "connect",
                        legend: { hiddenEntries: ["B"] },
                    } as ChartRunOptions,
                ] as const,
        ),
    ),
    [
        "a combo chart with every way of drawing a series, on both axes, with categories in groups",
        {
            type: "column",
            categories: [
                { name: "2024", categories: ["H1", "H2"] },
                { name: "2025", categories: ["H1", "H2"] },
            ],
            series: [
                everything("Columns", "column", false),
                { ...everything("Line", "line", false), type: "line", axis: "secondary" },
                { ...everything("Area", "area", false), type: "area", dataLabels: { value: true } },
            ],
            dataTable: true,
        },
    ],
    [
        "a line chart with dates",
        {
            type: "line",
            categories: [new Date("2025-01-01"), new Date("2025-02-01")],
            series: [
                { name: "S", values: [1, 2], trendlines: [{ type: "polynomial", order: 2, label: { numberFormat: "0" }, equation: true }] },
            ],
        },
    ],
    ...(["pie", "doughnut", "pieOfPie", "barOfPie"] as const).map(
        (type) =>
            [
                type,
                {
                    type,
                    categories,
                    series: [
                        {
                            name: "S",
                            values: [4, 3, 2, 1],
                            colors: ["FF0000"],
                            explosion: [undefined, 10],
                            dataLabels: { percentage: true, position: type === "doughnut" ? undefined : "bestFit" },
                            pointLabels: [{ text: "Most" }, false, { value: true }],
                        },
                    ],
                    legend: { hiddenEntries: ["Apr"] },
                } as ChartRunOptions,
            ] as const,
    ),
    ...(
        [
            { by: "position", count: 2 },
            { by: "value", lessThan: 2 },
            { by: "percentage", lessThan: 20 },
            { by: "categories", categories: ["Mar"] },
        ] as const
    ).map(
        (split) =>
            [
                `a bar of pie split by ${split.by}`,
                {
                    type: "barOfPie",
                    categories,
                    series: [{ name: "S", values: [4, 3, 2, 1], explosion: 5 }],
                    split,
                    secondPlotSize: 50,
                    gapWidth: 20,
                    seriesLines: { color: "FF0000" },
                } as ChartRunOptions,
            ] as const,
    ),
    [
        "a radar chart",
        {
            type: "radar",
            categories,
            series: [{ name: "S", values, markers: true, pointLabels: [{ text: "Top" }] }],
            emptyValues: "zero",
        },
    ],
    [
        "a filled radar chart",
        {
            type: "radar",
            categories,
            filled: true,
            series: [{ name: "S", values: [1, 2, 3, 4], pointLabels: [undefined, { value: true }] }],
        },
    ],
    ...(["scatter", "bubble"] as const).map(
        (type) =>
            [
                type,
                {
                    type,
                    series: [
                        {
                            name: "S",
                            points: [
                                { x: 1, y: 2, size: 3 },
                                { x: 2, y: 4, size: 1 },
                                { x: 3, y: 5, size: 2 },
                            ],
                            dataLabels: { value: true },
                            pointLabels: [{ text: "First" }, false],
                            trendlines: [
                                { type: "power", equation: true },
                                { type: "exponential", name: "E" },
                                { type: "movingAverage", period: 2 },
                            ],
                            xErrorBars: { type: "custom", plus: [1, 1, 1], minus: [0.5] },
                            yErrorBars: { type: "standardDeviation", value: 2, direction: "minus", endCaps: false },
                        },
                    ],
                    legend: { hiddenEntries: ["E"] },
                } as ChartRunOptions,
            ] as const,
    ),
    ...[false, true].flatMap((opens) =>
        [false, true].map(
            (volumes) =>
                [
                    `a stock chart${opens ? " with opening prices" : ""}${volumes ? " and volumes" : ""}`,
                    {
                        type: "stock",
                        categories: [new Date("2025-01-06"), new Date("2025-01-07")],
                        high: [12, 13],
                        low: [10, 11],
                        close: [11, 12],
                        ...(opens ? { open: [10.5, 12.5], upBars: { fill: "00FF00" }, downBars: { border: "none" } } : {}),
                        ...(volumes ? { volume: [100, 200], volumeAxis: { displayUnits: "hundreds" } } : {}),
                        highLowLines: { width: 1 },
                        dataTable: true,
                        emptyValues: "zero",
                        legend: { hiddenEntries: ["High"] },
                    } as ChartRunOptions,
                ] as const,
        ),
    ),
];

describe("chart parts against the chart schema", () => {
    it("should find children out of order, or that a type doesn't have", () => {
        const good = chartSpaceOf({ type: "column", categories: ["A"], series: [{ name: "S", values: [1] }] });
        expect(problemsIn(good, "CT_ChartSpace", "c:chartSpace")).to.deep.equal([]);

        const swapped = { ...good, elements: [...good.elements!].reverse() };
        expect(problemsIn(swapped, "CT_ChartSpace", "c:chartSpace")).to.include(
            "c:chartSpace > c:date1904: out of the order of CT_ChartSpace",
        );
        const unknown = { ...good, elements: [...good.elements!, { type: "element", name: "c:barDir" }] };
        expect(problemsIn(unknown, "CT_ChartSpace", "c:chartSpace")).to.deep.equal([
            "c:chartSpace > c:barDir: not a child of CT_ChartSpace",
        ]);
        expect(problemsIn(good, "CT_Missing", "c:chartSpace")).to.deep.equal(["c:chartSpace: unknown type CT_Missing"]);
    });

    for (const [name, options] of CHARTS) {
        it(`should write ${name} in the schema's order`, () => {
            expect(problemsOf(options)).to.deep.equal([]);
        });
    }
});
