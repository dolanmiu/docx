/* eslint-disable @typescript-eslint/naming-convention -- The keys of objects here are paths of parts in a package */
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { type Element, xml2js } from "xml-js";

import {
    Document,
    DrawingPatch,
    Footer,
    FootnoteReferenceRun,
    Header,
    Packer,
    Paragraph,
    PatchType,
    Table,
    TableCell,
    TableRow,
    type TemplatePackage,
    TextRun,
    patchDetector,
    patchDocument,
} from "docx";

import {
    type CategoryChartDataPatchOptions,
    ChartDataPatch,
    type ChartDataPatchOptions,
    ChartRun,
    type ChartRunOptions,
    type PointChartDataPatchOptions,
} from ".";
import { SERIES_ORDER } from "./template/template-series";
import { attributeOf, childOf, childrenOf, descendantsOf, elementsOf, textOf, valueOf } from "./template/template-xml";

// cspell:ignore docPr descr strRef numRef strCache numCache ptCount formatCode externalData barChart lineChart pieChart doughnutChart
// cspell:ignore scatterChart bubbleChart radarChart areaChart dPt dLbls dLbl srgbClr schemeClr numFmts numFmt cellXfs sharedStrings
// cspell:ignore bubbleSize xVal yVal dateAx catAx valAx legendEntry adec

// ---------------------------------------------------------------------------------------------------------------------
// Reading a package
// ---------------------------------------------------------------------------------------------------------------------

// Parsed with the spaces in text, such as a category that is a space
const parse = (text: string): Element => xml2js(text, { compact: false, captureSpacesBetweenElements: true }) as Element;

const readText = async (zip: JSZip, path: string): Promise<string> => (await zip.file(path)?.async("text")) ?? "";

const readXml = async (zip: JSZip, path: string): Promise<Element> => parse(await readText(zip, path));

const folderOf = (path: string): string => path.slice(0, path.lastIndexOf("/") + 1);

// The path a relationship's target refers to, from the part it belongs to
const resolve = (from: string, target: string): string =>
    (target.startsWith("/") ? target : `${folderOf(from)}${target}`)
        .split("/")
        .reduce<readonly string[]>((segments, segment) => {
            if (segment === "" || segment === ".") {
                return segments;
            }
            return segment === ".." ? segments.slice(0, -1) : [...segments, segment];
        }, [])
        .join("/");

const relationshipsPathOf = (path: string): string => `${folderOf(path)}_rels/${path.slice(path.lastIndexOf("/") + 1)}.rels`;

type Relationship = {
    readonly id: string;
    readonly type: string;
    readonly path: string;
    readonly external: boolean;
};

const relationshipsOf = async (zip: JSZip, part: string): Promise<readonly Relationship[]> =>
    descendantsOf(await readXml(zip, relationshipsPathOf(part)), "Relationship").map((relationship) => {
        const external = attributeOf(relationship, "TargetMode") === "External";
        const target = attributeOf(relationship, "Target") ?? "";
        return {
            id: attributeOf(relationship, "Id") ?? "",
            type: (attributeOf(relationship, "Type") ?? "").replace(/.*\//, ""),
            path: external ? target : resolve(part, target),
            external,
        };
    });

const filesOf = (zip: JSZip): readonly string[] => Object.keys(zip.files).filter((path) => !zip.files[path].dir);

type Cell = {
    readonly value: string;
    readonly format: string;
};

// A workbook's cells, by their names, with their number formats
const readCells = async (zip: JSZip, path: string): Promise<ReadonlyMap<string, Cell>> => {
    const workbook = await JSZip.loadAsync((await zip.file(path)!.async("uint8array"))!);
    const strings = descendantsOf(await readXml(workbook, "xl/sharedStrings.xml"), "si").map((si) => textOf(descendantsOf(si, "t")[0]));
    const styles = await readXml(workbook, "xl/styles.xml");
    const formats = new Map(
        descendantsOf(styles, "numFmt").map((format) => [attributeOf(format, "numFmtId"), attributeOf(format, "formatCode") ?? ""]),
    );
    const styleFormats = childrenOf(descendantsOf(styles, "cellXfs")[0], "xf").map(
        (xf) => formats.get(attributeOf(xf, "numFmtId")) ?? "General",
    );
    return new Map(
        descendantsOf(await readXml(workbook, "xl/worksheets/sheet1.xml"), "c").map((cell) => {
            const value = textOf(descendantsOf(cell, "v")[0]);
            return [
                attributeOf(cell, "r") ?? "",
                {
                    value: attributeOf(cell, "t") === "s" ? strings[Number(value)] : value,
                    format: styleFormats[Number(attributeOf(cell, "s") ?? 0)],
                },
            ];
        }),
    );
};

// The cells a formula such as Sheet1!$B$2:$B$4 refers to
const cellNamesOf = (formula: string): readonly string[] => {
    const [, column, first, last] = /^Sheet1!\$([A-Z]+)\$(\d+)(?::\$[A-Z]+\$(\d+))?$/.exec(formula) ?? [];
    expect(column, `the formula ${formula}`).to.not.equal(undefined);
    return Array.from({ length: Number(last ?? first) - Number(first) + 1 }, (_, index) => `${column}${Number(first) + index}`);
};

// A reference's cache, point by point, with undefined for a gap
const cacheOf = (reference: Element): readonly (string | undefined)[] => {
    const count = Number(valueOf(descendantsOf(reference, "c:ptCount")[0]));
    const points = new Map(
        descendantsOf(reference, "c:pt").map((point) => [Number(attributeOf(point, "idx")), textOf(childOf(point, "c:v"))]),
    );
    return Array.from({ length: count }, (_, index) => points.get(index));
};

type Chart = {
    /** The part the chart's drawing is in */
    readonly part: string;
    /** The drawing's non-visual properties, with its alt text */
    readonly properties: Element;
    readonly path: string;
    readonly chartSpace: Element;
    /** The path of its workbook, if it has one */
    readonly workbook: string | undefined;
};

// Each chart a part shows, in order
const chartsIn = async (zip: JSZip, part = "word/document.xml"): Promise<readonly Chart[]> => {
    const relationships = await relationshipsOf(zip, part);
    const drawings = [
        ...descendantsOf(await readXml(zip, part), "wp:inline"),
        ...descendantsOf(await readXml(zip, part), "wp:anchor"),
    ].filter((drawing) => descendantsOf(drawing, "c:chart").length > 0);
    return Promise.all(
        drawings.map(async (drawing) => {
            const id = attributeOf(descendantsOf(drawing, "c:chart")[0], "r:id");
            const path = relationships.find((relationship) => relationship.id === id)!.path;
            const chartSpace = childOf(await readXml(zip, path), "c:chartSpace")!;
            const workbookId = attributeOf(childOf(chartSpace, "c:externalData"), "r:id");
            const workbook = (await relationshipsOf(zip, path)).find((relationship) => relationship.id === workbookId)?.path;
            return { part, properties: descendantsOf(drawing, "wp:docPr")[0], path, chartSpace, workbook };
        }),
    );
};

type Series = {
    readonly name: string;
    /** The categories, or a scatter or bubble series' x values */
    readonly categories: readonly (string | undefined)[];
    /** The values, or a scatter or bubble series' y values */
    readonly values: readonly (string | undefined)[];
    readonly sizes?: readonly (string | undefined)[];
    readonly group: string;
    readonly index: string;
    readonly order: string;
};

// A chart's series, in the order they are plotted, from their caches
const seriesIn = (chart: Chart): readonly Series[] =>
    descendantsOf(childOf(childOf(chart.chartSpace, "c:chart"), "c:plotArea"), "c:ser")
        .filter((series) => !descendantsOf(chart.chartSpace, "c:extLst").some((list) => descendantsOf(list, "c:ser").includes(series)))
        .map((series) => {
            const group = elementsOf(childOf(childOf(chart.chartSpace, "c:chart"), "c:plotArea")).find((element) =>
                childrenOf(element, "c:ser").includes(series),
            );
            const data = (...names: readonly string[]): readonly (string | undefined)[] =>
                names.flatMap((name) => (childOf(series, name) === undefined ? [] : [cacheOf(childOf(series, name)!)]))[0] ?? [];
            const sizes = childOf(series, "c:bubbleSize");
            return {
                name: textOf(descendantsOf(childOf(series, "c:tx"), "c:v")[0]),
                categories: data("c:cat", "c:xVal"),
                values: data("c:val", "c:yVal"),
                ...(sizes === undefined ? {} : { sizes: cacheOf(sizes) }),
                group: group?.name ?? "",
                index: valueOf(childOf(series, "c:idx")) ?? "",
                order: valueOf(childOf(series, "c:order")) ?? "",
            };
        })
        .sort((a, b) => Number(a.order) - Number(b.order));

// ---------------------------------------------------------------------------------------------------------------------
// What every patched package keeps to
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Checks what every patched document keeps to:
 *
 * - every part has a content type, and every content type of a part is of one the package has;
 * - every relationship inside the package refers to a part it has, and every chart and workbook is referred to;
 * - each chart's references hold what its workbook's cells hold, and refer to nothing else;
 * - each chart's series have unique indexes and orders, and their children are in the schema's order.
 */
const checkPackage = async (zip: JSZip): Promise<void> => {
    const files = filesOf(zip);
    const lowerFiles = new Set(files.map((path) => path.toLowerCase()));
    const contentTypes = await readXml(zip, "[Content_Types].xml");
    const defaults = new Set(
        descendantsOf(contentTypes, "Default").map((element) => (attributeOf(element, "Extension") ?? "").toLowerCase()),
    );
    const overrides = descendantsOf(contentTypes, "Override").map((element) => (attributeOf(element, "PartName") ?? "").toLowerCase());
    for (const path of files.filter((file) => file !== "[Content_Types].xml")) {
        expect(
            overrides.includes(`/${path.toLowerCase()}`) || defaults.has(path.slice(path.lastIndexOf(".") + 1).toLowerCase()),
            `the content type of ${path}`,
        ).to.equal(true);
    }
    for (const override of overrides) {
        expect(lowerFiles.has(override.slice(1)), `the part of the content type ${override}`).to.equal(true);
    }

    const referenced = new Set<string>();
    for (const relationshipsPath of files.filter((path) => path.endsWith(".rels"))) {
        const source = relationshipsPath.replace(/(^|\/)_rels\/([^/]*)\.rels$/, "$1$2");
        for (const { path, external } of await relationshipsOf(zip, source)) {
            if (!external) {
                expect(lowerFiles.has(path.toLowerCase()), `${path}, which ${relationshipsPath} refers to`).to.equal(true);
                // eslint-disable-next-line functional/immutable-data
                referenced.add(path);
            }
        }
    }
    for (const path of files.filter((file) => /^word\/(charts|embeddings)\/[^/]+$/.test(file))) {
        expect(referenced.has(path), `something referring to ${path}`).to.equal(true);
    }

    for (const path of files.filter((file) => /^word\/charts\/[^/]+\.xml$/.test(file) && !/(style|colors)\d*\.xml$/.test(file))) {
        const chartSpace = childOf(await readXml(zip, path), "c:chartSpace")!;
        const workbookId = attributeOf(childOf(chartSpace, "c:externalData"), "r:id");
        const workbook = (await relationshipsOf(zip, path)).find(({ id }) => id === workbookId);
        const references = [...descendantsOf(chartSpace, "c:strRef"), ...descendantsOf(chartSpace, "c:numRef")];
        if (references.length > 0) {
            expect(workbook, `the workbook of ${path}`).to.not.equal(undefined);
            const cells = await readCells(zip, workbook!.path);
            for (const reference of references) {
                const names = cellNamesOf(textOf(childOf(reference, "c:f")));
                expect(cacheOf(reference), `${path}: ${textOf(childOf(reference, "c:f"))}`).to.deep.equal(
                    names.map((name) => cells.get(name)?.value),
                );
            }
        }

        const series = descendantsOf(childOf(chartSpace, "c:chart"), "c:ser").filter((one) =>
            elementsOf(one).some(({ name }) => name === "c:idx"),
        );
        const indexes = series.map((one) => valueOf(childOf(one, "c:idx")));
        const orders = series.map((one) => valueOf(childOf(one, "c:order")));
        expect(new Set(indexes).size, `the series indexes of ${path}: ${indexes.join(", ")}`).to.equal(indexes.length);
        expect(new Set(orders).size, `the series orders of ${path}: ${orders.join(", ")}`).to.equal(orders.length);
        for (const one of series) {
            const ranks = elementsOf(one).map(({ name }) => SERIES_ORDER.indexOf(name ?? ""));
            expect(
                ranks.every((rank, index) => rank !== -1 && (index === 0 || rank >= ranks[index - 1])),
                `the order of ${elementsOf(one)
                    .map(({ name }) => name)
                    .join(", ")} in ${path}`,
            ).to.equal(true);
        }
    }
};

// ---------------------------------------------------------------------------------------------------------------------
// Templates and data
// ---------------------------------------------------------------------------------------------------------------------

const QUARTERS = ["Q1", "Q2", "Q3"];
const TWO_SERIES = [
    { name: "2024", values: [1, 2, 3] },
    { name: "2025", values: [4, 5, 6] },
];

// A chart of each type, as a template has it, with a look of its own
const TEMPLATES = {
    column: {
        type: "column",
        title: "Sales",
        categories: QUARTERS,
        series: [{ ...TWO_SERIES[0], color: "C00000" }, TWO_SERIES[1]],
        dataLabels: { value: true },
        valueAxis: { numberFormat: "#,##0", minimum: 0 },
        gapWidth: 80,
    },
    bar: { type: "bar", categories: QUARTERS, series: TWO_SERIES, stacking: "stacked" },
    line: { type: "line", categories: QUARTERS, series: TWO_SERIES, markers: { shape: "diamond", size: 8 }, smooth: true },
    area: { type: "area", categories: QUARTERS, series: TWO_SERIES, stacking: "percent" },
    pie: {
        type: "pie",
        categories: QUARTERS,
        series: [{ name: "Share", values: [5, 3, 2], colors: ["1F4E79", undefined, "9DC3E6"] }],
        dataLabels: { percentage: true },
    },
    doughnut: { type: "doughnut", categories: QUARTERS, series: TWO_SERIES, holeSize: 60 },
    radar: { type: "radar", categories: QUARTERS, series: TWO_SERIES, filled: true },
    scatter: {
        type: "scatter",
        series: [
            {
                name: "P",
                points: [
                    { x: 1, y: 2 },
                    { x: 2, y: 3 },
                ],
            },
            { name: "Q", points: [{ x: 3, y: 1 }] },
        ],
        lines: "straight",
    },
    bubble: {
        type: "bubble",
        series: [
            {
                name: "B",
                points: [
                    { x: 1, y: 2, size: 3 },
                    { x: 2, y: 1, size: 5 },
                ],
            },
        ],
        bubbleScale: 50,
    },
    combo: {
        type: "column",
        categories: QUARTERS,
        series: [TWO_SERIES[0], { ...TWO_SERIES[1], type: "line", axis: "secondary" }],
    },
    dates: {
        type: "line",
        categories: [new Date("2025-01-01"), new Date("2025-02-01"), new Date("2025-03-01")],
        series: [TWO_SERIES[0]],
    },
} as const satisfies Readonly<Record<string, ChartRunOptions>>;

type TemplateName = keyof typeof TEMPLATES;

const POINT_TEMPLATES: readonly TemplateName[] = ["scatter", "bubble"];

// A document with each chart given, in a paragraph of its own, whose alt text's description is its key's placeholder
const templateOf = (charts: Readonly<Record<string, ChartRunOptions>>): Promise<Buffer> =>
    Packer.toBuffer(
        new Document({
            sections: [
                {
                    children: Object.entries(charts).map(
                        ([key, options]) =>
                            new Paragraph({ children: [new ChartRun({ ...options, altText: { name: key, description: `{{${key}}}` } })] }),
                    ),
                },
            ],
        }),
    );

const patch = async (data: Buffer | Uint8Array, patches: Readonly<Record<string, ChartDataPatch | DrawingPatch>>): Promise<JSZip> =>
    JSZip.loadAsync(await patchDocument({ outputType: "uint8array", data, patches }));

// New data with categories: each series' values are its number times ten, plus each point's
const categoryData = (series: number, points: number): CategoryChartDataPatchOptions => ({
    categories: Array.from({ length: points }, (_, index) => `C${index + 1}`),
    series: Array.from({ length: series }, (_, one) => ({
        name: `S${one + 1}`,
        values: Array.from({ length: points }, (__, point) => (one + 1) * 10 + point),
    })),
});

// New data with points, with sizes for a bubble chart
const pointData = (series: number, points: number, sizes: boolean): PointChartDataPatchOptions => ({
    series: Array.from({ length: series }, (_, one) => ({
        name: `S${one + 1}`,
        points: Array.from({ length: points }, (__, point) => ({
            x: point + 1,
            y: (one + 1) * 10 + point,
            ...(sizes ? { size: point + 1 } : {}),
        })),
    })),
});

const dataFor = (template: TemplateName, series: number, points: number): ChartDataPatchOptions =>
    POINT_TEMPLATES.includes(template) ? pointData(series, points, template === "bubble") : categoryData(series, points);

// What a chart's series should hold for the data
const expectedSeries = (data: ChartDataPatchOptions): readonly Pick<Series, "name" | "categories" | "values">[] =>
    "categories" in data
        ? data.series.map(({ name, values }) => ({
              name,
              categories: data.categories.map(String),
              values: data.categories.map((_, index) =>
                  values[index] === null || values[index] === undefined ? undefined : String(values[index]),
              ),
          }))
        : data.series.map(({ name, points }) => ({
              name,
              categories: points.map(({ x }) => String(x)),
              values: points.map(({ y }) => String(y)),
          }));

const patchOne = async (template: TemplateName, data: ChartDataPatchOptions): Promise<{ readonly zip: JSZip; readonly chart: Chart }> => {
    const zip = await patch(await templateOf({ chart: TEMPLATES[template] }), { chart: new ChartDataPatch(data) });
    await checkPackage(zip);
    const [chart] = await chartsIn(zip);
    return { zip, chart };
};

// =====================================================================================================================

describe("ChartDataPatch", () => {
    describe("its options", () => {
        const create = (options: unknown) => (): ChartDataPatch => new ChartDataPatch(options as ChartDataPatchOptions);

        it("should be a drawing patch", () => {
            const chartPatch = new ChartDataPatch(categoryData(1, 1));
            expect(chartPatch).to.be.instanceOf(DrawingPatch);
            expect(chartPatch.type).to.equal(PatchType.DRAWING);
        });

        it("should take data with categories, with gaps, fewer values than categories, numbers and dates", () => {
            expect(create({ categories: ["A"], series: [{ name: "One", values: [1] }] })).to.not.throw();
            expect(create({ categories: ["A", "B", "C"], series: [{ name: "Gaps", values: [null, 2] }] })).to.not.throw();
            expect(create({ categories: [2024, 2025], series: [{ name: "Years", values: [-1.5, 1e300] }] })).to.not.throw();
            expect(create({ categories: [new Date("2025-01-01")], series: [{ name: "Dates", values: [] }] })).to.not.throw();
            expect(create({ categories: ["A"], series: [{ name: "", values: [0] }], description: "" })).to.not.throw();
        });

        it("should take data with points, with or without sizes", () => {
            expect(create({ series: [{ name: "P", points: [{ x: 1, y: 2 }] }] })).to.not.throw();
            expect(create({ series: [{ name: "B", points: [{ x: 1, y: 2, size: 0 }] }] })).to.not.throw();
            expect(create({ series: [{ name: "B", points: [{ x: -1e10, y: 1e-10, size: 1e10 }] }] })).to.not.throw();
        });

        it("should throw for options that aren't an object", () => {
            for (const options of [undefined, null, "data", 42, true]) {
                expect(create(options), String(options)).to.throw("Invalid chart data");
            }
            expect(create("data")).to.throw(
                'Invalid chart data "data". Expected { categories, series }, or for a scatter or bubble chart, { series }',
            );
        });

        it("should throw without series", () => {
            for (const series of [undefined, null, [], {}, "series", 3]) {
                expect(create({ categories: ["A"], series }), JSON.stringify(series)).to.throw("A chart needs at least one series");
            }
            expect(create({})).to.throw("A chart needs at least one series");
        });

        it("should throw for a series without a name that is text", () => {
            for (const series of [null, undefined, "S", 1, {}, { values: [1] }, { name: 1, values: [1] }, { name: null, values: [1] }]) {
                expect(create({ categories: ["A"], series: [series] }), JSON.stringify(series)).to.throw("of series 1. Expected text");
            }
            expect(
                create({
                    categories: ["A"],
                    series: [
                        { name: "A", values: [1] },
                        { name: 2, values: [1] },
                    ],
                }),
            ).to.throw("Invalid name 2 of series 2. Expected text");
            expect(create({ categories: ["A"], series: [{ name: undefined, values: [1] }] })).to.throw(
                "Invalid name undefined of series 1",
            );
        });

        it("should throw for a series with both values and points, or neither", () => {
            expect(create({ categories: ["A"], series: [{ name: "Both", values: [1], points: [{ x: 1, y: 1 }] }] })).to.throw(
                'Series "Both" needs values, for a chart with categories, or points, for a scatter or bubble chart',
            );
            expect(create({ categories: ["A"], series: [{ name: "Neither" }] })).to.throw('Series "Neither" needs values');
            expect(create({ categories: ["A"], series: [{ name: "Not lists", values: "1", points: 1 }] })).to.throw(
                'Series "Not lists" needs values',
            );
        });

        it("should throw when some series have values and others points", () => {
            expect(
                create({
                    categories: ["A"],
                    series: [
                        { name: "Points", points: [{ x: 1, y: 1 }] },
                        { name: "Values", values: [1] },
                    ],
                }),
            ).to.throw('Series "Values" has values, and series "Points" has points. A chart\'s series all have values, or all have points');
        });

        it("should throw for series with values without categories", () => {
            for (const categories of [undefined, null, "A,B", 3, { 0: "A" }]) {
                expect(create({ categories, series: [{ name: "S", values: [1] }] }), String(categories)).to.throw(
                    "Invalid option categories. Series with values need categories, one for each value",
                );
            }
        });

        it("should throw for series with points and categories", () => {
            expect(create({ categories: ["A"], series: [{ name: "S", points: [{ x: 1, y: 1 }] }] })).to.throw(
                "Invalid option categories. The series have points, which have their own x values",
            );
        });

        it("should throw for categories ChartRun can't have", () => {
            expect(create({ categories: [], series: [{ name: "S", values: [] }] })).to.throw("A chart needs at least one category");
            expect(create({ categories: [NaN], series: [{ name: "S", values: [1] }] })).to.throw("Invalid category NaN");
            expect(create({ categories: [Infinity], series: [{ name: "S", values: [1] }] })).to.throw("Invalid category Infinity");
            expect(create({ categories: [null], series: [{ name: "S", values: [1] }] })).to.throw("Invalid category null");
            expect(create({ categories: [{}], series: [{ name: "S", values: [1] }] })).to.throw("Invalid category");
            expect(create({ categories: [new Date("2025-01-01"), "B"], series: [{ name: "S", values: [1] }] })).to.throw(
                "Expected all of them to be dates, or none",
            );
            expect(create({ categories: [new Date("not a date")], series: [{ name: "S", values: [1] }] })).to.throw();
        });

        it("should throw for values ChartRun can't have", () => {
            for (const value of [NaN, Infinity, -Infinity, undefined, "12", {}, true]) {
                expect(create({ categories: ["A"], series: [{ name: "S", values: [value] }] }), String(value)).to.throw(
                    'in series "S". Expected a finite number or null',
                );
            }
            expect(create({ categories: ["A"], series: [{ name: "S", values: ["12"] }] })).to.throw('Invalid value "12" in series "S"');
            // A missing value in the list is a mistake rather than a gap, which is null
            // eslint-disable-next-line no-sparse-arrays
            expect(create({ categories: ["A", "B", "C"], series: [{ name: "S", values: [1, , 3] }] })).to.throw("Invalid value undefined");
        });

        it("should throw for more values than categories", () => {
            expect(create({ categories: ["A"], series: [{ name: "S", values: [1, 2] }] })).to.throw(
                'Series "S" has 2 values, but there are 1 categories',
            );
        });

        it("should throw for points ChartRun can't have", () => {
            expect(create({ series: [{ name: "S", points: [] }] })).to.throw('Series "S" has no points');
            expect(create({ series: [{ name: "S", points: [{ x: NaN, y: 1 }] }] })).to.throw('Invalid point (NaN, 1) in series "S"');
            expect(create({ series: [{ name: "S", points: [{ x: 1 }] }] })).to.throw("Invalid point (1, undefined)");
            expect(create({ series: [{ name: "S", points: [{ x: "1", y: 2 }] }] })).to.throw("Invalid point");
        });

        it("should throw for sizes a bubble can't have", () => {
            for (const size of [-1, NaN, Infinity, "5", null]) {
                expect(create({ series: [{ name: "S", points: [{ x: 1, y: 2, size }] }] }), String(size)).to.throw(
                    'of the point at (1, 2) in series "S". Expected a finite number of 0 or more',
                );
            }
            expect(create({ series: [{ name: "S", points: [{ x: 1, y: 2, size: "5" }] }] })).to.throw('Invalid size "5"');
        });

        it("should throw for a description that isn't text", () => {
            expect(create({ ...categoryData(1, 1), description: 5 })).to.throw("Invalid description 5. Expected text");
            expect(create({ ...categoryData(1, 1), description: null })).to.throw("Invalid description null");
        });

        it("should keep its own copy of the data, so changing the options afterwards changes nothing", async () => {
            const categories = ["A", "B"];
            const date = new Date("2025-01-01");
            // eslint-disable-next-line functional/prefer-readonly-type
            const values: (number | null)[] = [1, 2];
            const data = { categories, series: [{ name: "S", values }] };
            const chartPatch = new ChartDataPatch(data);
            const points = [{ x: 1, y: 2 }];
            const pointPatch = new ChartDataPatch({ series: [{ name: "P", points }] });
            const datePatch = new ChartDataPatch({ categories: [date], series: [{ name: "D", values: [1] }] });

            /* eslint-disable functional/immutable-data */
            categories.push("C");
            values[0] = 100;
            data.series.push({ name: "Added", values: [3] });
            points[0].x = 50;
            date.setUTCFullYear(1990);
            /* eslint-enable functional/immutable-data */

            const zip = await patch(await templateOf({ a: TEMPLATES.column, b: TEMPLATES.scatter, c: TEMPLATES.dates }), {
                a: chartPatch,
                b: pointPatch,
                c: datePatch,
            });
            const [column, scatter, dated] = await chartsIn(zip);
            expect(seriesIn(column).map(({ name, categories: all, values: numbers }) => ({ name, all, numbers }))).to.deep.equal([
                { name: "S", all: ["A", "B"], numbers: ["1", "2"] },
            ]);
            expect(seriesIn(scatter)[0].categories).to.deep.equal(["1"]);
            expect(seriesIn(dated)[0].categories).to.deep.equal(["45658"]);
        });
    });

    describe("each type of chart", () => {
        const TYPES = Object.keys(TEMPLATES) as readonly TemplateName[];

        for (const template of TYPES) {
            describe(`a ${template} chart`, () => {
                const templateSeries = TEMPLATES[template].series.length;
                const cases = [
                    { title: "the same number of series and points", series: templateSeries, points: 3 },
                    { title: "more series and points", series: templateSeries + 3, points: 7 },
                    { title: "fewer points", series: templateSeries, points: 1 },
                    { title: "fewer series", series: 1, points: 3 },
                    { title: "many series and points", series: 12, points: 40 },
                ].filter(({ series }) => template !== "pie" || series === 1);

                for (const { title, series, points } of cases) {
                    it(`should take new data with ${title}`, async () => {
                        const data = dataFor(template, series, points);
                        const { chart } = await patchOne(template, data);

                        const patched = seriesIn(chart);
                        expect(patched.map(({ name, categories, values }) => ({ name, categories, values }))).to.deep.equal(
                            expectedSeries(data),
                        );
                        if (template === "bubble") {
                            expect(patched.map(({ sizes }) => sizes)).to.deep.equal(
                                Array.from({ length: series }, () => Array.from({ length: points }, (_, index) => String(index + 1))),
                            );
                        }
                    });
                }

                it("should describe the new data in its alt text", async () => {
                    const { chart } = await patchOne(template, dataFor(template, 1, 2));
                    const description = attributeOf(chart.properties, "descr");
                    expect(description).to.not.contain("{{");
                    expect(description).to.match(/^\w+ chart/);
                    expect(description).to.contain("S1");
                });
            });
        }

        it("should keep a pie chart's single series, and throw for more", async () => {
            const template = await templateOf({ chart: TEMPLATES.pie });
            await expect(patch(template, { chart: new ChartDataPatch(categoryData(2, 3)) })).rejects.toThrow(
                "Can't patch the chart {{chart}}. A pie chart has one series, but 2 were given. A doughnut chart can have more",
            );
        });
    });

    describe("the template's look", () => {
        it("should keep the chart's title, type, axes, labels and legend", async () => {
            const template = await templateOf({ chart: TEMPLATES.column });
            const [before] = await chartsIn(await JSZip.loadAsync(template));
            const { chart } = await patchOne("column", categoryData(2, 3));

            for (const name of ["c:title", "c:autoTitleDeleted", "c:legend", "c:plotVisOnly", "c:dispBlanksAs"]) {
                expect(childOf(childOf(chart.chartSpace, "c:chart"), name), name).to.deep.equal(
                    childOf(childOf(before.chartSpace, "c:chart"), name),
                );
            }
            const plotArea = (one: Chart): Element => childOf(childOf(one.chartSpace, "c:chart"), "c:plotArea")!;
            for (const name of ["c:catAx", "c:valAx", "c:spPr", "c:layout"]) {
                expect(childOf(plotArea(chart), name), name).to.deep.equal(childOf(plotArea(before), name));
            }
            const group = (one: Chart): Element => childOf(plotArea(one), "c:barChart")!;
            for (const name of ["c:barDir", "c:grouping", "c:varyColors", "c:gapWidth", "c:overlap", "c:axId"]) {
                expect(childrenOf(group(chart), name), name).to.deep.equal(childrenOf(group(before), name));
            }
            expect(childOf(chart.chartSpace, "c:spPr")).to.deep.equal(childOf(before.chartSpace, "c:spPr"));
            expect(childOf(chart.chartSpace, "c:txPr")).to.deep.equal(childOf(before.chartSpace, "c:txPr"));
        });

        it("should keep each series' own look: its colour, labels and markers", async () => {
            const [red, blue] = descendantsOf((await patchOne("column", categoryData(2, 3))).chart.chartSpace, "c:ser");
            expect(descendantsOf(childOf(red, "c:spPr"), "a:srgbClr").map(valueOf)).to.deep.equal(["C00000"]);
            expect(descendantsOf(childOf(blue, "c:spPr"), "a:schemeClr").map(valueOf)).to.deep.equal(["accent2"]);
            expect(childOf(red, "c:dLbls")).to.not.equal(undefined);

            const [line] = descendantsOf((await patchOne("line", categoryData(1, 3))).chart.chartSpace, "c:ser");
            expect(valueOf(descendantsOf(line, "c:symbol")[0])).to.equal("diamond");
            expect(valueOf(childOf(line, "c:smooth"))).to.equal("1");
        });

        it("should give new series the last series' look in their own colour, the next of the theme's accents", async () => {
            const series = descendantsOf((await patchOne("line", categoryData(4, 3))).chart.chartSpace, "c:ser");
            const colorsOf = (one: Element): readonly (string | undefined)[] =>
                descendantsOf(one, "a:schemeClr")
                    .filter((color) => color.attributes?.val?.toString().startsWith("accent"))
                    .map(valueOf);

            expect(series.map(colorsOf)).to.deep.equal([
                ["accent1", "accent1", "accent1"],
                ["accent2", "accent2", "accent2"],
                ["accent3", "accent3", "accent3"],
                ["accent4", "accent4", "accent4"],
            ]);
            expect(series.map((one) => valueOf(descendantsOf(one, "c:symbol")[0]))).to.deep.equal([
                "diamond",
                "diamond",
                "diamond",
                "diamond",
            ]);
        });

        it("should give a new series its own colour when the last series' colour is a hex colour", async () => {
            const template = await templateOf({
                chart: { type: "column", categories: QUARTERS, series: [{ name: "Red", values: [1, 2, 3], color: "C00000" }] },
            });
            const [chart] = await chartsIn(await patch(template, { chart: new ChartDataPatch(categoryData(3, 3)) }));
            const series = descendantsOf(chart.chartSpace, "c:ser");
            expect(descendantsOf(childOf(series[0], "c:spPr"), "a:srgbClr").map(valueOf)).to.deep.equal(["C00000"]);
            expect(descendantsOf(childOf(series[1], "c:spPr"), "a:schemeClr").map(valueOf)).to.deep.equal(["accent2"]);
            expect(descendantsOf(childOf(series[2], "c:spPr"), "a:schemeClr").map(valueOf)).to.deep.equal(["accent3"]);
            expect(descendantsOf(childOf(series[2], "c:spPr"), "a:srgbClr")).to.deep.equal([]);
        });

        it("should keep a bubble's transparency in a new series' colour", async () => {
            const series = descendantsOf((await patchOne("bubble", pointData(2, 2, true))).chart.chartSpace, "c:ser");
            expect(descendantsOf(childOf(series[1], "c:spPr"), "a:alpha").map(valueOf)).to.deep.equal(["75000"]);
        });

        it("should give a pie's new slices the next colours, and remove the looks of slices that are gone", async () => {
            const five = (await patchOne("pie", categoryData(1, 5))).chart;
            const colorsOf = (chart: Chart): readonly string[] =>
                childrenOf(descendantsOf(chart.chartSpace, "c:ser")[0], "c:dPt").map((point) => {
                    const color = descendantsOf(childOf(point, "c:spPr"), "a:solidFill")[0];
                    return `${elementsOf(color)[0].name}=${valueOf(elementsOf(color)[0])}`;
                });
            expect(colorsOf(five)).to.deep.equal([
                "a:srgbClr=1F4E79",
                "a:schemeClr=accent2",
                "a:srgbClr=9DC3E6",
                "a:schemeClr=accent4",
                "a:schemeClr=accent5",
            ]);

            const two = (await patchOne("pie", categoryData(1, 2))).chart;
            expect(colorsOf(two)).to.deep.equal(["a:srgbClr=1F4E79", "a:schemeClr=accent2"]);
        });

        it("should keep the template's number formats in the caches and the workbook's cells", async () => {
            const template = await templateOf({ chart: TEMPLATES.column });
            // A template whose values are percentages and categories numbers, as a chart made in Word may have
            const zip = await JSZip.loadAsync(template);
            const path = "word/charts/chart1.xml";
            zip.file(
                path,
                (await readText(zip, path)).replace(/<c:formatCode>General<\/c:formatCode>/g, "<c:formatCode>0.0%</c:formatCode>"),
            );
            const patched = await patch(await zip.generateAsync({ type: "uint8array" }), {
                chart: new ChartDataPatch({ categories: [2024, 2025], series: [{ name: "Share", values: [0.25, 0.5] }] }),
            });
            await checkPackage(patched);

            const [chart] = await chartsIn(patched);
            const [series] = descendantsOf(chart.chartSpace, "c:ser");
            expect(textOf(descendantsOf(childOf(series, "c:val"), "c:formatCode")[0])).to.equal("0.0%");
            const cells = await readCells(patched, chart.workbook!);
            expect(cells.get("B2")).to.deep.equal({ value: "0.25", format: "0.0%" });
            expect(cells.get("B3")).to.deep.equal({ value: "0.5", format: "0.0%" });
            expect(cells.get("B1")).to.deep.equal({ value: "Share", format: "General" });
        });

        it("should keep a template's date format for new dates, and its number format for new numbers, but not the other way", async () => {
            const withFormat = async (format: string, categories: ChartDataPatchOptions): Promise<readonly string[]> => {
                const zip = await JSZip.loadAsync(
                    await templateOf({ chart: { type: "line", categories: [1, 2], series: [{ name: "A", values: [1, 2] }] } }),
                );
                zip.file(
                    "word/charts/chart1.xml",
                    (await readText(zip, "word/charts/chart1.xml")).replace(
                        /(<c:cat><c:numRef><c:f>[^<]*<\/c:f><c:numCache><c:formatCode>)General/,
                        `$1${format}`,
                    ),
                );
                const [chart] = await chartsIn(
                    await patch(await zip.generateAsync({ type: "uint8array" }), { chart: new ChartDataPatch(categories) }),
                );
                return descendantsOf(childOf(descendantsOf(chart.chartSpace, "c:ser")[0], "c:cat"), "c:formatCode").map(textOf);
            };
            const dates = { categories: [new Date("2025-01-01"), new Date("2025-01-02")], series: [{ name: "D", values: [1, 2] }] };
            const numbers = { categories: [2024, 2025], series: [{ name: "N", values: [1, 2] }] };
            const texts = { categories: ["A", "B"], series: [{ name: "T", values: [1, 2] }] };

            expect(await withFormat("dd/mm/yyyy", dates)).to.deep.equal(["dd/mm/yyyy"]);
            expect(await withFormat("#,##0", dates)).to.deep.equal(["d mmm yyyy"]);
            expect(await withFormat("#,##0", numbers)).to.deep.equal(["#,##0"]);
            expect(await withFormat("dd/mm/yyyy", numbers)).to.deep.equal(["General"]);
            expect(await withFormat("#,##0", texts)).to.deep.equal([]);
        });

        it("should keep a new series' number formats from the last series", async () => {
            const zip = await JSZip.loadAsync(await templateOf({ chart: TEMPLATES.column }));
            zip.file(
                "word/charts/chart1.xml",
                (await readText(zip, "word/charts/chart1.xml")).replace(
                    /(.*)<c:formatCode>General<\/c:formatCode>/s,
                    "$1<c:formatCode>0%</c:formatCode>",
                ),
            );
            const [chart] = await chartsIn(
                await patch(await zip.generateAsync({ type: "uint8array" }), { chart: new ChartDataPatch(categoryData(3, 2)) }),
            );
            expect(
                descendantsOf(chart.chartSpace, "c:ser").map((one) => textOf(descendantsOf(childOf(one, "c:val"), "c:formatCode")[0])),
            ).to.deep.equal(["General", "0%", "0%"]);
        });

        it("should remove a combo chart's line series, its group and its secondary axes, when the new data has one series", async () => {
            const { chart } = await patchOne("combo", categoryData(1, 3));
            const plotArea = childOf(childOf(chart.chartSpace, "c:chart"), "c:plotArea")!;
            expect(elementsOf(plotArea).map(({ name }) => name)).to.deep.equal(["c:layout", "c:barChart", "c:catAx", "c:valAx", "c:spPr"]);
        });

        it("should add a combo chart's new series to its last series' group", async () => {
            const { chart } = await patchOne("combo", categoryData(4, 3));
            expect(seriesIn(chart).map(({ group }) => group)).to.deep.equal(["c:barChart", "c:lineChart", "c:lineChart", "c:lineChart"]);
        });

        it("should keep a date axis for new dates, and make it a category axis for text", async () => {
            const dates = await patchOne("dates", {
                categories: [new Date("2025-01-01"), new Date("2025-01-02")],
                series: [{ name: "D", values: [1, 2] }],
            });
            const plotArea = (chart: Chart): Element => childOf(childOf(chart.chartSpace, "c:chart"), "c:plotArea")!;
            expect(valueOf(descendantsOf(childOf(plotArea(dates.chart), "c:dateAx"), "c:baseTimeUnit")[0])).to.equal("days");

            const text = await patchOne("dates", categoryData(1, 3));
            expect(childOf(plotArea(text.chart), "c:dateAx")).to.equal(undefined);
            expect(childOf(plotArea(text.chart), "c:catAx")).to.not.equal(undefined);
        });
    });

    describe("the workbook", () => {
        it("should replace the workbook with one holding the new data, and remove the template's", async () => {
            const { zip, chart } = await patchOne("column", categoryData(2, 3));
            expect(chart.workbook).to.equal("word/embeddings/Microsoft_Excel_Worksheet2.xlsx");
            expect(zip.file("word/embeddings/Microsoft_Excel_Worksheet1.xlsx")).to.equal(null);

            const cells = await readCells(zip, chart.workbook!);
            expect([...cells].map(([name, { value }]) => `${name}=${value}`)).to.deep.equal([
                "B1=S1",
                "C1=S2",
                "A2=C1",
                "B2=10",
                "C2=20",
                "A3=C2",
                "B3=11",
                "C3=21",
                "A4=C3",
                "B4=12",
                "C4=22",
            ]);
        });

        it("should keep the old data out of the document, however many charts it had", async () => {
            const template = await templateOf({ a: TEMPLATES.column, b: TEMPLATES.line, c: TEMPLATES.pie });
            const zip = await patch(template, {
                a: new ChartDataPatch(categoryData(1, 1)),
                b: new ChartDataPatch(categoryData(1, 1)),
                c: new ChartDataPatch(categoryData(1, 1)),
            });
            await checkPackage(zip);
            const workbooks = filesOf(zip).filter((path) => path.includes("embeddings"));
            expect(workbooks).to.deep.equal([
                "word/embeddings/Microsoft_Excel_Worksheet4.xlsx",
                "word/embeddings/Microsoft_Excel_Worksheet5.xlsx",
                "word/embeddings/Microsoft_Excel_Worksheet6.xlsx",
            ]);
            for (const path of workbooks) {
                const values = [...(await readCells(zip, path)).values()].map(({ value }) => value);
                expect(values).to.not.include("2024");
                expect(values).to.not.include("Q1");
            }
        });
    });

    describe("the alt text", () => {
        const altTextAfter = async (
            altText: { readonly name: string; readonly description?: string; readonly title?: string },
            data: ChartDataPatchOptions = categoryData(1, 2),
            decorative = false,
        ): Promise<Readonly<Record<string, string | undefined>>> => {
            const template = await Packer.toBuffer(
                new Document({
                    sections: [{ children: [new Paragraph({ children: [new ChartRun({ ...TEMPLATES.column, altText, decorative })] })] }],
                }),
            );
            const [chart] = await chartsIn(await patch(template, { chart: new ChartDataPatch(data) }));
            return {
                descr: attributeOf(chart.properties, "descr"),
                title: attributeOf(chart.properties, "title"),
                name: attributeOf(chart.properties, "name"),
            };
        };

        it("should replace the placeholder with a description of the new data, with the template's title", async () => {
            expect(await altTextAfter({ name: "Sales chart", description: "{{chart}}" })).to.deep.equal({
                descr: "Column chart, Sales. S1: C1 10, C2 11.",
                title: undefined,
                name: "Sales chart",
            });
        });

        it("should replace the whole description, whatever else it has", async () => {
            expect((await altTextAfter({ name: "A", description: "Chart, bar chart\n\n{{chart}} and more" })).descr).to.equal(
                "Column chart, Sales. S1: C1 10, C2 11.",
            );
        });

        it("should give the description the patch gives", async () => {
            expect(
                (
                    await altTextAfter(
                        { name: "A", description: "{{chart}}" },
                        { ...categoryData(1, 2), description: 'Sales & "profit" <2025>' },
                    )
                ).descr,
            ).to.equal('Sales & "profit" <2025>');
        });

        it("should remove the description when the patch gives an empty one", async () => {
            expect(
                (await altTextAfter({ name: "A", description: "{{chart}}" }, { ...categoryData(1, 2), description: "" })).descr,
            ).to.equal(undefined);
        });

        it("should take the placeholder out of the title, and keep the rest", async () => {
            expect(await altTextAfter({ name: "A", title: "Sales {{chart}}" })).to.deep.equal({
                descr: "Column chart, Sales. S1: C1 10, C2 11.",
                title: "Sales",
                name: "A",
            });
            expect((await altTextAfter({ name: "A", title: " {{chart}} " })).title).to.equal(undefined);
        });

        it("should replace a description of the template's data when the placeholder is in the title", async () => {
            expect(await altTextAfter({ name: "A", description: "Quarterly sales", title: "{{chart}}" })).to.deep.equal({
                descr: "Column chart, Sales. S1: C1 10, C2 11.",
                title: undefined,
                name: "A",
            });
            expect(
                (
                    await altTextAfter(
                        { name: "A", description: "Quarterly sales", title: "{{chart}}" },
                        { ...categoryData(1, 1), description: "Given" },
                    )
                ).descr,
            ).to.equal("Given");
        });

        it("should give a description to a chart whose description was empty", async () => {
            expect((await altTextAfter({ name: "A", description: " ", title: "{{chart}}" })).descr).to.equal(
                "Column chart, Sales. S1: C1 10, C2 11.",
            );
        });

        it("should not describe a decorative chart, unless the patch gives a description", async () => {
            expect((await altTextAfter({ name: "A", description: "{{chart}}" }, categoryData(1, 2), true)).descr).to.equal(undefined);
            expect(
                (await altTextAfter({ name: "A", description: "{{chart}}" }, { ...categoryData(1, 2), description: "Given" }, true)).descr,
            ).to.equal("Given");
        });

        it("should read a decorative mark without a value as decorative, and one that is off as not", async () => {
            const descriptionWith = async (decorative: string): Promise<string | undefined> => {
                const template = await templateWith({
                    changes: {
                        "word/document.xml": (document) =>
                            document.replace(
                                /(<wp:docPr [^>]*)\/>/,
                                (_, properties: string) =>
                                    `${properties}><a:extLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:ext uri="{C183D7F6-B498-43B3-948B-1728B52AA6E4}">` +
                                    `<adec:decorative xmlns:adec="http://schemas.microsoft.com/office/drawing/2017/decorative"${decorative}/></a:ext></a:extLst></wp:docPr>`,
                            ),
                    },
                });
                return attributeOf((await chartsIn(await patchChart(template, categoryData(1, 1))))[0].properties, "descr");
            };
            expect(await descriptionWith("")).to.equal(undefined);
            expect(await descriptionWith(' val="1"')).to.equal(undefined);
            expect(await descriptionWith(' val="true"')).to.equal(undefined);
            expect(await descriptionWith(' val="0"')).to.equal("Column chart, Sales. S1: C1 10.");
            expect(await descriptionWith(' val="false"')).to.equal("Column chart, Sales. S1: C1 10.");
        });

        it("should write text that needs escaping in the description", async () => {
            const data = { categories: ['<a & "b">'], series: [{ name: "It's & <that>", values: [1] }] };
            expect((await altTextAfter({ name: "A", description: "{{chart}}" }, data)).descr).to.equal(
                `Column chart, Sales. It's & <that>: <a & "b"> 1.`,
            );
        });

        it("should cut a long description", async () => {
            const descr = (await altTextAfter({ name: "A", description: "{{chart}}" }, categoryData(20, 40))).descr ?? "";
            expect(descr.length).to.be.at.most(1000);
            expect(descr.endsWith("…")).to.equal(true);
        });

        it("should describe dates and points as ChartRun does", async () => {
            const dates = await patchOne("dates", {
                categories: [new Date("2025-01-01"), new Date("2025-02-01")],
                series: [{ name: "D", values: [1, 2] }],
            });
            expect(attributeOf(dates.chart.properties, "descr")).to.equal("Line chart. D: Jan 2025 1, Feb 2025 2.");
            const bubble = await patchOne("bubble", pointData(1, 1, true));
            expect(attributeOf(bubble.chart.properties, "descr")).to.equal("Bubble chart. S1: (1, 10) size 1.");
        });
    });

    describe("where the chart is", () => {
        it("should patch charts in headers, footers, footnotes and tables", async () => {
            const chartWith = (key: string): Paragraph =>
                new Paragraph({ children: [new ChartRun({ ...TEMPLATES.line, altText: { name: key, description: `{{${key}}}` } })] });
            const template = await Packer.toBuffer(
                new Document({
                    sections: [
                        {
                            headers: { default: new Header({ children: [chartWith("header")] }) },
                            footers: { default: new Footer({ children: [chartWith("footer")] }) },
                            children: [
                                new Table({ rows: [new TableRow({ children: [new TableCell({ children: [chartWith("table")] })] })] }),
                                new Paragraph({ children: [new TextRun("Note"), new FootnoteReferenceRun(1)] }),
                            ],
                        },
                    ],
                    footnotes: { 1: { children: [chartWith("footnote")] } },
                }),
            );
            const zip = await patch(template, {
                header: new ChartDataPatch(categoryData(1, 1)),
                footer: new ChartDataPatch(categoryData(2, 1)),
                table: new ChartDataPatch(categoryData(3, 1)),
                footnote: new ChartDataPatch(categoryData(4, 1)),
            });
            await checkPackage(zip);

            const counts = await Promise.all(
                ["word/header1.xml", "word/footer1.xml", "word/document.xml", "word/footnotes.xml"].map(
                    async (part) => seriesIn((await chartsIn(zip, part))[0]).length,
                ),
            );
            expect(counts).to.deep.equal([1, 2, 3, 4]);
        });

        it("should patch a floating chart", async () => {
            const template = await templateOf({
                chart: { ...TEMPLATES.column, floating: { horizontalPosition: { offset: 10 }, verticalPosition: { offset: 10 } } },
            });
            const zip = await patch(template, { chart: new ChartDataPatch(categoryData(3, 3)) });
            await checkPackage(zip);
            expect(await readText(zip, "word/document.xml")).to.contain("<wp:anchor");
            expect(seriesIn((await chartsIn(zip))[0])).to.have.length(3);
        });

        it("should patch each chart with the placeholder, each with a workbook of its own", async () => {
            const template = await Packer.toBuffer(
                new Document({
                    sections: [
                        {
                            children: [TEMPLATES.column, TEMPLATES.line, TEMPLATES.area].map(
                                (options, index) =>
                                    new Paragraph({
                                        children: [
                                            new ChartRun({ ...options, altText: { name: `Chart ${index}`, description: "{{sales}}" } }),
                                        ],
                                    }),
                            ),
                        },
                    ],
                }),
            );
            const zip = await patch(template, { sales: new ChartDataPatch(categoryData(1, 4)) });
            await checkPackage(zip);

            const charts = await chartsIn(zip);
            expect(new Set(charts.map(({ workbook }) => workbook)).size).to.equal(3);
            expect(charts.map((chart) => seriesIn(chart)[0].values)).to.deep.equal([
                ["10", "11", "12", "13"],
                ["10", "11", "12", "13"],
                ["10", "11", "12", "13"],
            ]);
        });

        it("should patch only the charts whose placeholders are given, and leave the others as they are", async () => {
            const template = await templateOf({ a: TEMPLATES.column, b: TEMPLATES.line });
            const before = await chartsIn(await JSZip.loadAsync(template));
            const zip = await patch(template, {
                a: new ChartDataPatch(categoryData(1, 1)),
                missing: new ChartDataPatch(categoryData(1, 1)),
            });
            await checkPackage(zip);

            const [a, b] = await chartsIn(zip);
            expect(seriesIn(a)).to.have.length(1);
            expect(b.chartSpace).to.deep.equal(before[1].chartSpace);
            expect(attributeOf(b.properties, "descr")).to.equal("{{b}}");
            expect(b.workbook).to.equal(before[1].workbook);
        });

        it("should leave a template without charts as it is", async () => {
            const template = await Packer.toBuffer(new Document({ sections: [{ children: [new Paragraph("{{chart}}")] }] }));
            const zip = await patch(template, { chart: new ChartDataPatch(categoryData(1, 1)) });
            expect(await readText(zip, "word/document.xml")).to.contain("{{chart}}");
            expect(filesOf(zip).filter((path) => path.includes("charts"))).to.deep.equal([]);
        });

        it("should patch with custom placeholder delimiters", async () => {
            const template = await Packer.toBuffer(
                new Document({
                    sections: [
                        {
                            children: [
                                new Paragraph({
                                    children: [new ChartRun({ ...TEMPLATES.column, altText: { name: "A", description: "<<sales>>" } })],
                                }),
                            ],
                        },
                    ],
                }),
            );
            const zip = await JSZip.loadAsync(
                await patchDocument({
                    outputType: "uint8array",
                    data: template,
                    patches: { sales: new ChartDataPatch(categoryData(3, 3)) },
                    placeholderDelimiters: { start: "<<", end: ">>" },
                }),
            );
            expect(seriesIn((await chartsIn(zip))[0])).to.have.length(3);
        });

        it("should patch with text patches and new charts at the same time, numbering the new parts after each other", async () => {
            const template = await Packer.toBuffer(
                new Document({
                    sections: [
                        {
                            children: [
                                new Paragraph("Hello {{name}}"),
                                new Paragraph({
                                    children: [new ChartRun({ ...TEMPLATES.column, altText: { name: "A", description: "{{sales}}" } })],
                                }),
                                new Paragraph("{{new}}"),
                            ],
                        },
                    ],
                }),
            );
            const zip = await JSZip.loadAsync(
                await patchDocument({
                    outputType: "uint8array",
                    data: template,
                    patches: {
                        name: { type: PatchType.PARAGRAPH, children: [new TextRun("Ada")] },
                        sales: new ChartDataPatch(categoryData(2, 2)),
                        // A new chart whose alt text is the other placeholder isn't patched by its patch
                        new: {
                            type: PatchType.PARAGRAPH,
                            children: [new ChartRun({ ...TEMPLATES.line, altText: { name: "B", description: "{{sales}}" } })],
                        },
                    },
                }),
            );
            await checkPackage(zip);

            expect(await readText(zip, "word/document.xml")).to.contain("Ada");
            const [patched, added] = await chartsIn(zip);
            expect(seriesIn(patched).map(({ name }) => name)).to.deep.equal(["S1", "S2"]);
            expect(seriesIn(added).map(({ name }) => name)).to.deep.equal(["2024", "2025"]);
            expect(attributeOf(added.properties, "descr")).to.equal("{{sales}}");
            expect(filesOf(zip).filter((path) => /^word\/(charts|embeddings)\/[^/]+$/.test(path))).to.have.members([
                "word/charts/chart1.xml",
                "word/charts/chart2.xml",
                "word/embeddings/Microsoft_Excel_Worksheet2.xlsx",
                "word/embeddings/Microsoft_Excel_Worksheet3.xlsx",
            ]);
        });

        it("should find the charts patchDetector lists", async () => {
            expect(await patchDetector({ data: await templateOf({ sales: TEMPLATES.column, share: TEMPLATES.pie }) })).to.have.members([
                "sales",
                "share",
            ]);
        });
    });

    describe("using a patch again", () => {
        it("should patch two charts, and two documents, with one patch", async () => {
            const chartPatch = new ChartDataPatch(categoryData(2, 2));
            const first = await patch(await templateOf({ a: TEMPLATES.column, b: TEMPLATES.line }), { a: chartPatch, b: chartPatch });
            const second = await patch(await templateOf({ a: TEMPLATES.area }), { a: chartPatch });
            await checkPackage(first);
            await checkPackage(second);

            for (const chart of [...(await chartsIn(first)), ...(await chartsIn(second))]) {
                expect(seriesIn(chart).map(({ values }) => values)).to.deep.equal([
                    ["10", "11"],
                    ["20", "21"],
                ]);
            }
        });

        it("should patch a patched document again, when the description keeps the placeholder", async () => {
            const once = await patchDocument({
                outputType: "uint8array",
                data: await templateOf({ chart: TEMPLATES.line }),
                patches: { chart: new ChartDataPatch({ ...categoryData(5, 5), description: "{{chart}}" }) },
            });
            const twice = await patch(once, { chart: new ChartDataPatch(categoryData(2, 3)) });
            await checkPackage(twice);

            const [chart] = await chartsIn(twice);
            expect(seriesIn(chart).map(({ name, categories, values }) => ({ name, categories, values }))).to.deep.equal(
                expectedSeries(categoryData(2, 3)),
            );
            // The first patch removed the template's workbook, so the new one takes its number
            expect(filesOf(twice).filter((path) => path.includes("embeddings"))).to.deep.equal([
                "word/embeddings/Microsoft_Excel_Worksheet1.xlsx",
            ]);
        });

        it("should give the same document for the same template and data", async () => {
            const template = await templateOf({ chart: TEMPLATES.column });
            const chartPatch = new ChartDataPatch(categoryData(3, 3));
            const [first, second] = await Promise.all([patch(template, { chart: chartPatch }), patch(template, { chart: chartPatch })]);
            for (const path of filesOf(first).filter((file) => file.endsWith(".xml") || file.endsWith(".rels"))) {
                expect(await readText(second, path), path).to.equal(await readText(first, path));
            }
        });
    });
});

// ---------------------------------------------------------------------------------------------------------------------
// Templates from other applications, and broken ones
// ---------------------------------------------------------------------------------------------------------------------

const CHART_NAMESPACES =
    'xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';

// A series as Word writes it: a reference to its cells, with their cache, and Office's unique id
const wordSeries = (index: number, name: string, values: readonly number[]): string =>
    `<c:ser><c:idx val="${index}"/><c:order val="${index}"/>` +
    `<c:tx><c:strRef><c:f>Sheet1!$${"BCDE"[index]}$1</c:f><c:strCache><c:ptCount val="1"/><c:pt idx="0"><c:v>${name}</c:v></c:pt></c:strCache></c:strRef></c:tx>` +
    `<c:spPr><a:solidFill><a:schemeClr val="accent${index + 1}"/></a:solidFill><a:ln><a:noFill/></a:ln><a:effectLst/></c:spPr>` +
    `<c:invertIfNegative val="0"/>` +
    `<c:cat><c:strRef><c:f>Sheet1!$A$2:$A$5</c:f><c:strCache><c:ptCount val="4"/>${["Category 1", "Category 2", "Category 3", "Category 4"]
        .map((category, point) => `<c:pt idx="${point}"><c:v>${category}</c:v></c:pt>`)
        .join("")}</c:strCache></c:strRef></c:cat>` +
    `<c:val><c:numRef><c:f>Sheet1!$${"BCDE"[index]}$2:$${"BCDE"[index]}$5</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="4"/>${values
        .map((value, point) => `<c:pt idx="${point}"><c:v>${value}</c:v></c:pt>`)
        .join("")}</c:numCache></c:numRef></c:val>` +
    `<c:extLst><c:ext uri="{C3380CC4-5D6E-409C-BE32-E72D297353CC}" xmlns:c16="http://schemas.microsoft.com/office/drawing/2014/chart">` +
    `<c16:uniqueId val="{0000000${index}-6F3E-4E1C-9D9A-3C0E4B3A1C01}"/></c:ext></c:extLst></c:ser>`;

const TEXT_PROPERTIES =
    '<c:txPr><a:bodyPr rot="-60000000" spcFirstLastPara="1" vertOverflow="ellipsis" vert="horz" wrap="square" anchor="ctr" anchorCtr="1"/><a:lstStyle/>' +
    '<a:p><a:pPr><a:defRPr sz="900" b="0" i="0" u="none" strike="noStrike" kern="1200" baseline="0"><a:solidFill><a:schemeClr val="tx1"><a:lumMod val="65000"/><a:lumOff val="35000"/></a:schemeClr></a:solidFill>' +
    '<a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:pPr><a:endParaRPr lang="en-US"/></a:p></c:txPr>';

// A clustered column chart as Word 2016 and later write one from Insert Chart, with its chart style and colours, and a
// workbook named as Word names the first one
const WORD_CHART =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n` +
    `<c:chartSpace ${CHART_NAMESPACES} xmlns:c16r2="http://schemas.microsoft.com/office/drawing/2015/06/chart">` +
    `<c:date1904 val="0"/><c:lang val="en-US"/><c:roundedCorners val="0"/>` +
    `<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"><mc:Choice Requires="c14" xmlns:c14="http://schemas.microsoft.com/office/drawing/2007/8/2/chart"><c14:style val="102"/></mc:Choice><mc:Fallback><c:style val="2"/></mc:Fallback></mc:AlternateContent>` +
    `<c:chart><c:autoTitleDeleted val="1"/><c:plotArea><c:layout/>` +
    `<c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/>${wordSeries(
        0,
        "Series 1",
        [4.3, 2.5, 3.5, 4.5],
    )}${wordSeries(1, "Series 2", [2.4, 4.4, 1.8, 2.8])}${wordSeries(
        2,
        "Series 3",
        [2, 2, 3, 5],
    )}<c:dLbls><c:showLegendKey val="0"/><c:showVal val="0"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>` +
    `<c:gapWidth val="219"/><c:overlap val="-27"/><c:axId val="1178734223"/><c:axId val="1178731823"/></c:barChart>` +
    `<c:catAx><c:axId val="1178734223"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:numFmt formatCode="General" sourceLinked="1"/>` +
    `<c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>${TEXT_PROPERTIES}<c:crossAx val="1178731823"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>` +
    `<c:valAx><c:axId val="1178731823"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:majorGridlines><c:spPr><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="tx1"><a:lumMod val="15000"/><a:lumOff val="85000"/></a:schemeClr></a:solidFill><a:round/></a:ln><a:effectLst/></c:spPr></c:majorGridlines>` +
    `<c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>${TEXT_PROPERTIES}<c:crossAx val="1178734223"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx>` +
    `<c:spPr><a:noFill/><a:ln><a:noFill/></a:ln><a:effectLst/></c:spPr></c:plotArea>` +
    `<c:legend><c:legendPos val="b"/><c:overlay val="0"/>${TEXT_PROPERTIES}</c:legend><c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/>` +
    `<c:extLst><c:ext uri="{56B9EC1D-385E-4148-901F-78D8002777C0}" xmlns:c16r3="http://schemas.microsoft.com/office/drawing/2017/03/chart"><c16r3:dataDisplayOptions16><c16r3:dispNaAsBlank val="1"/></c16r3:dataDisplayOptions16></c:ext></c:extLst>` +
    `</c:chart><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln><a:effectLst/></c:spPr>${TEXT_PROPERTIES}` +
    `<c:externalData r:id="rId3"><c:autoUpdate val="0"/></c:externalData></c:chartSpace>`;

const WORD_CHART_RELATIONSHIPS =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/package" Target="../embeddings/Microsoft_Excel_Worksheet.xlsx"/>` +
    `<Relationship Id="rId2" Type="http://schemas.microsoft.com/office/2011/relationships/chartColorStyle" Target="colors1.xml"/>` +
    `<Relationship Id="rId1" Type="http://schemas.microsoft.com/office/2011/relationships/chartStyle" Target="style1.xml"/></Relationships>`;

// A column chart as LibreOffice writes one: colours in hex, labels with its own extension, and formulas that aren't
// cells, which it writes for charts whose data isn't in a workbook it knows
const LIBREOFFICE_CHART =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<c:chartSpace ${CHART_NAMESPACES}><c:date1904 val="0"/><c:lang val="en-US"/><c:roundedCorners val="0"/>` +
    `<c:chart><c:title><c:tx><c:rich><a:bodyPr rot="0"/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1300" b="0" u="none" strike="noStrike"><a:uFillTx/><a:latin typeface="Arial"/></a:defRPr></a:pPr>` +
    `<a:r><a:rPr lang="en-US" sz="1400" b="0" u="none" strike="noStrike"><a:uFillTx/><a:latin typeface="Calibri"/></a:rPr><a:t>Sales</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>` +
    `<c:autoTitleDeleted val="0"/><c:plotArea><c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/>${[
        ["label 0", "2024", "4472C4", "0", [1, 2, 3]],
        ["label 1", "2025", "ED7D31", "1", [2, 3, 4]],
    ]
        .map(
            ([label, name, color, formula, values], index) =>
                `<c:ser><c:idx val="${index}"/><c:order val="${index}"/><c:tx><c:strRef><c:f>${String(label)}</c:f><c:strCache><c:ptCount val="1"/><c:pt idx="0"><c:v>${String(name)}</c:v></c:pt></c:strCache></c:strRef></c:tx>` +
                `<c:spPr><a:solidFill><a:srgbClr val="${String(color)}"/></a:solidFill><a:ln w="12600"><a:noFill/></a:ln></c:spPr><c:invertIfNegative val="0"/>` +
                `<c:dLbls><c:numFmt formatCode="General" sourceLinked="0"/><c:dLblPos val="outEnd"/><c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:separator>; </c:separator>` +
                `<c:extLst><c:ext uri="{CE6537A1-D6FC-4f65-9D91-7224C49458BB}" xmlns:c15="http://schemas.microsoft.com/office/drawing/2012/chart"><c15:showLeaderLines val="1"/></c:ext></c:extLst></c:dLbls>` +
                `<c:cat><c:strRef><c:f>categories</c:f><c:strCache><c:ptCount val="3"/><c:pt idx="0"><c:v>Q1</c:v></c:pt><c:pt idx="1"><c:v>Q2</c:v></c:pt><c:pt idx="2"><c:v>Q3</c:v></c:pt></c:strCache></c:strRef></c:cat>` +
                `<c:val><c:numRef><c:f>${String(formula)}</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="3"/>${(
                    values as readonly number[]
                )
                    .map((value, point) => `<c:pt idx="${point}"><c:v>${value}</c:v></c:pt>`)
                    .join("")}</c:numCache></c:numRef></c:val></c:ser>`,
        )
        .join("")}<c:gapWidth val="219"/><c:overlap val="-27"/><c:axId val="68214609"/><c:axId val="12162793"/></c:barChart>` +
    `<c:catAx><c:axId val="68214609"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:crossAx val="12162793"/><c:crosses val="autoZero"/><c:auto val="1"/></c:catAx>` +
    `<c:valAx><c:axId val="12162793"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:crossAx val="68214609"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx>` +
    `</c:plotArea><c:legend><c:legendPos val="b"/><c:overlay val="0"/></c:legend><c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>` +
    `<c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></c:spPr><c:externalData r:id="rId1"/></c:chartSpace>`;

const LIBREOFFICE_CHART_RELATIONSHIPS = `<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/package" Target="../embeddings/Microsoft_Excel_Worksheet1.xlsx"/>\n</Relationships>`;

const PACKAGE_TYPE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/package";

type TemplateChanges = {
    /** The template's chart */
    readonly chart?: ChartRunOptions;
    /** Files replaced or added, or for null, removed */
    readonly files?: Readonly<Record<string, string | Uint8Array | null>>;
    /** Files' text changed, after the files are replaced */
    readonly changes?: Readonly<Record<string, (text: string) => string>>;
};

/**
 * A template with one chart, `{{chart}}`, made by docx and then changed, such as with a chart part written as another
 * application writes it.
 */
const templateWith = async ({ chart = TEMPLATES.column, files = {}, changes = {} }: TemplateChanges): Promise<Uint8Array> => {
    const zip = await JSZip.loadAsync(await templateOf({ chart }));
    for (const [path, content] of Object.entries(files)) {
        if (content === null) {
            zip.remove(path);
        } else {
            zip.file(path, content);
        }
    }
    for (const [path, change] of Object.entries(changes)) {
        zip.file(path, change(await readText(zip, path)));
    }
    return zip.generateAsync({ type: "uint8array" });
};

const templateWithFiles = (files: Readonly<Record<string, string | Uint8Array | null>>, chart?: ChartRunOptions): Promise<Uint8Array> =>
    templateWith({ files, chart });

// The template's chart part, changed
const templateWithChart = (change: (chart: string) => string, chart?: ChartRunOptions): Promise<Uint8Array> =>
    templateWith({ chart, changes: { "word/charts/chart1.xml": change } });

// A template whose chart part and its relationships are another application's
const templateWithForeignChart = (
    chart: string,
    relationships: string,
    files: Readonly<Record<string, string | Uint8Array | null>> = {},
): Promise<Uint8Array> =>
    templateWithFiles({ "word/charts/chart1.xml": chart, "word/charts/_rels/chart1.xml.rels": relationships, ...files });

// The template's document, with the chart's drawing changed
const templateWithDrawing = (change: (document: string) => string): Promise<Uint8Array> =>
    templateWith({ changes: { "word/document.xml": change } });

// The changes that take the template's workbook out, for a template whose chart doesn't refer to it
const WITHOUT_WORKBOOK: TemplateChanges = {
    files: { "word/embeddings/Microsoft_Excel_Worksheet1.xlsx": null },
    changes: { "[Content_Types].xml": (text) => text.replace(/<Override[^>]*Microsoft_Excel_Worksheet1\.xlsx"\/>/, "") },
};

const patchChart = (template: Uint8Array | Buffer, data: ChartDataPatchOptions = categoryData(2, 3)): Promise<JSZip> =>
    patch(template, { chart: new ChartDataPatch(data) });

describe("ChartDataPatch with templates from other applications", () => {
    describe("a chart made in Word", () => {
        const wordTemplate = (): Promise<Uint8Array> =>
            templateWithForeignChart(WORD_CHART, WORD_CHART_RELATIONSHIPS, {
                "word/charts/style1.xml":
                    '<cs:chartStyle xmlns:cs="http://schemas.microsoft.com/office/drawing/2012/chartStyle" id="201"/>',
                "word/charts/colors1.xml":
                    '<cs:colorStyle xmlns:cs="http://schemas.microsoft.com/office/drawing/2012/chartStyle" meth="cycle" id="10"/>',
                "word/embeddings/Microsoft_Excel_Worksheet.xlsx": new Uint8Array([80, 75, 3, 4]),
                "word/embeddings/Microsoft_Excel_Worksheet1.xlsx": null,
            }).then(async (template) => {
                // Word gives workbooks a content type by their extension, and charts' styles and colours their own
                const zip = await JSZip.loadAsync(template);
                zip.file(
                    "[Content_Types].xml",
                    (await readText(zip, "[Content_Types].xml"))
                        .replace(/<Override[^>]*Microsoft_Excel_Worksheet1\.xlsx"\/>/, "")
                        .replace(
                            "</Types>",
                            '<Default Extension="xlsx" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"/>' +
                                '<Override PartName="/word/charts/style1.xml" ContentType="application/vnd.ms-office.chartstyle+xml"/>' +
                                '<Override PartName="/word/charts/colors1.xml" ContentType="application/vnd.ms-office.chartcolorstyle+xml"/></Types>',
                        ),
                );
                return zip.generateAsync({ type: "uint8array" });
            });

        it("should replace its data, keeping its style, colours, extensions and Office's ids of the series it keeps", async () => {
            const zip = await patchChart(await wordTemplate(), categoryData(2, 5));
            await checkPackage(zip);

            const [chart] = await chartsIn(zip);
            expect(seriesIn(chart).map(({ name, categories, values }) => ({ name, categories, values }))).to.deep.equal(
                expectedSeries(categoryData(2, 5)),
            );
            expect(descendantsOf(chart.chartSpace, "c16:uniqueId").map(valueOf)).to.deep.equal([
                "{00000000-6F3E-4E1C-9D9A-3C0E4B3A1C01}",
                "{00000001-6F3E-4E1C-9D9A-3C0E4B3A1C01}",
            ]);
            const text = await readText(zip, chart.path);
            expect(text).to.contain('<c14:style val="102"/>');
            expect(text).to.contain('<c16r3:dispNaAsBlank val="1"/>');
            expect(text).to.contain('<c:externalData r:id="rId3"><c:autoUpdate val="0"/></c:externalData>');

            const relationships = await relationshipsOf(zip, chart.path);
            expect(relationships.map(({ id, path }) => `${id} ${path}`)).to.deep.equal([
                "rId3 word/embeddings/Microsoft_Excel_Worksheet1.xlsx",
                "rId2 word/charts/colors1.xml",
                "rId1 word/charts/style1.xml",
            ]);
            expect(zip.file("word/embeddings/Microsoft_Excel_Worksheet.xlsx")).to.equal(null);
            expect(await readText(zip, "word/charts/style1.xml")).to.contain('id="201"');
        });

        it("should give new series no ids of Office's, and the next colours", async () => {
            const [chart] = await chartsIn(await patchChart(await wordTemplate(), categoryData(5, 2)));
            const series = descendantsOf(chart.chartSpace, "c:ser");
            expect(series.map((one) => descendantsOf(one, "c16:uniqueId").length)).to.deep.equal([1, 1, 1, 0, 0]);
            expect(series.map((one) => valueOf(descendantsOf(childOf(one, "c:spPr"), "a:schemeClr")[0]))).to.deep.equal([
                "accent1",
                "accent2",
                "accent3",
                "accent4",
                "accent5",
            ]);
        });

        it("should describe it without a title, as Word's chart has none of its own", async () => {
            const [chart] = await chartsIn(await patchChart(await wordTemplate(), categoryData(1, 1)));
            expect(attributeOf(chart.properties, "descr")).to.equal("Column chart. S1: C1 10.");
        });
    });

    describe("a chart made in LibreOffice", () => {
        it("should replace its data, whose formulas weren't cells, with references to the new workbook's", async () => {
            const zip = await patchChart(
                await templateWithForeignChart(LIBREOFFICE_CHART, LIBREOFFICE_CHART_RELATIONSHIPS),
                categoryData(3, 4),
            );
            await checkPackage(zip);

            const [chart] = await chartsIn(zip);
            expect(seriesIn(chart).map(({ name, values }) => ({ name, values }))).to.deep.equal(
                expectedSeries(categoryData(3, 4)).map(({ name, values }) => ({ name, values })),
            );
            const formulas = descendantsOf(chart.chartSpace, "c:f").map(textOf);
            expect(formulas.every((formula) => formula.startsWith("Sheet1!$"))).to.equal(true);
        });

        it("should keep its hex colours, and give a new series the next of the theme's accents", async () => {
            const [chart] = await chartsIn(
                await patchChart(await templateWithForeignChart(LIBREOFFICE_CHART, LIBREOFFICE_CHART_RELATIONSHIPS), categoryData(3, 2)),
            );
            const colors = descendantsOf(chart.chartSpace, "c:ser").map((one) => {
                const [color] = elementsOf(descendantsOf(childOf(one, "c:spPr"), "a:solidFill")[0]);
                return `${color.name}=${valueOf(color)}`;
            });
            expect(colors).to.deep.equal(["a:srgbClr=4472C4", "a:srgbClr=ED7D31", "a:schemeClr=accent3"]);
        });

        it("should describe it with its title", async () => {
            const [chart] = await chartsIn(
                await patchChart(await templateWithForeignChart(LIBREOFFICE_CHART, LIBREOFFICE_CHART_RELATIONSHIPS), categoryData(1, 1)),
            );
            expect(attributeOf(chart.properties, "descr")).to.equal("Column chart, Sales. S1: C1 10.");
        });
    });

    describe("other ways charts are written", () => {
        const plotAreaOf = (groups: string, axes = ""): string =>
            `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><c:chartSpace ${CHART_NAMESPACES}><c:chart><c:plotArea><c:layout/>${groups}${axes}</c:plotArea></c:chart><c:externalData r:id="rId1"/></c:chartSpace>`;
        const relationships = `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${PACKAGE_TYPE}" Target="../embeddings/Microsoft_Excel_Worksheet1.xlsx"/></Relationships>`;
        const AXES = '<c:catAx><c:axId val="1"/><c:crossAx val="2"/></c:catAx><c:valAx><c:axId val="2"/><c:crossAx val="1"/></c:valAx>';
        const literalSeries = (index: number): string =>
            `<c:ser><c:idx val="${index}"/><c:order val="${index}"/><c:tx><c:v>Literal ${index}</c:v></c:tx>` +
            `<c:cat><c:strLit><c:ptCount val="2"/><c:pt idx="0"><c:v>A</c:v></c:pt><c:pt idx="1"><c:v>B</c:v></c:pt></c:strLit></c:cat>` +
            `<c:val><c:numLit><c:formatCode>0.0</c:formatCode><c:ptCount val="2"/><c:pt idx="0"><c:v>1</c:v></c:pt><c:pt idx="1"><c:v>2</c:v></c:pt></c:numLit></c:val></c:ser>`;

        const patchPlotArea = async (groups: string, data: ChartDataPatchOptions = categoryData(2, 3), axes = AXES): Promise<Chart> => {
            const zip = await patchChart(await templateWithForeignChart(plotAreaOf(groups, axes), relationships), data);
            await checkPackage(zip);
            return (await chartsIn(zip))[0];
        };

        it("should replace literal data, which isn't in a workbook, keeping its number format", async () => {
            const chart = await patchPlotArea(`<c:barChart><c:barDir val="col"/>${literalSeries(0)}${literalSeries(1)}</c:barChart>`);
            expect(seriesIn(chart).map(({ name }) => name)).to.deep.equal(["S1", "S2"]);
            expect(descendantsOf(chart.chartSpace, "c:strLit")).to.deep.equal([]);
            expect(descendantsOf(chart.chartSpace, "c:numLit")).to.deep.equal([]);
            expect(descendantsOf(chart.chartSpace, "c:formatCode").map(textOf)).to.deep.equal(["0.0", "0.0"]);
        });

        it("should replace multi-level categories with the new ones", async () => {
            const multi =
                `<c:ser><c:idx val="0"/><c:order val="0"/><c:cat><c:multiLvlStrRef><c:f>Sheet1!$A$2:$B$5</c:f><c:multiLvlStrCache><c:ptCount val="4"/>` +
                `<c:lvl><c:pt idx="0"><c:v>Q1</c:v></c:pt></c:lvl><c:lvl><c:pt idx="0"><c:v>2024</c:v></c:pt></c:lvl></c:multiLvlStrCache></c:multiLvlStrRef></c:cat><c:val/></c:ser>`;
            const chart = await patchPlotArea(`<c:lineChart>${multi}</c:lineChart>`, categoryData(1, 3));
            expect(descendantsOf(chart.chartSpace, "c:multiLvlStrRef")).to.deep.equal([]);
            expect(seriesIn(chart)[0].categories).to.deep.equal(["C1", "C2", "C3"]);
        });

        it("should give data to series without any, in the schema's order", async () => {
            const chart = await patchPlotArea(
                `<c:lineChart><c:grouping val="standard"/><c:ser><c:idx val="0"/><c:order val="0"/><c:marker><c:symbol val="none"/></c:marker><c:smooth val="0"/></c:ser></c:lineChart>`,
                categoryData(1, 2),
            );
            expect(elementsOf(descendantsOf(chart.chartSpace, "c:ser")[0]).map(({ name }) => name)).to.deep.equal([
                "c:idx",
                "c:order",
                "c:tx",
                "c:marker",
                "c:cat",
                "c:val",
                "c:smooth",
            ]);
        });

        it("should patch 3-D charts and a pie of a pie", async () => {
            const series = (index: number): string => `<c:ser><c:idx val="${index}"/><c:order val="${index}"/><c:shape val="box"/></c:ser>`;
            const column3D = await patchPlotArea(
                `<c:bar3DChart><c:barDir val="col"/><c:grouping val="clustered"/>${series(0)}</c:bar3DChart>`,
                categoryData(3, 2),
            );
            expect(seriesIn(column3D)).to.have.length(3);
            expect(elementsOf(descendantsOf(column3D.chartSpace, "c:ser")[2]).map(({ name }) => name)).to.deep.equal([
                "c:idx",
                "c:order",
                "c:tx",
                "c:cat",
                "c:val",
                "c:shape",
            ]);
            expect(attributeOf(column3D.properties, "descr")).to.match(/^Column chart/);

            for (const group of ["line3DChart", "area3DChart"]) {
                expect(
                    seriesIn(
                        await patchPlotArea(
                            `<c:${group}><c:ser><c:idx val="0"/><c:order val="0"/></c:ser></c:${group}>`,
                            categoryData(2, 2),
                        ),
                    ),
                    group,
                ).to.have.length(2);
            }
            for (const group of ["pie3DChart", "ofPieChart"]) {
                const chart = await patchPlotArea(
                    `<c:${group}><c:varyColors val="1"/><c:ser><c:idx val="0"/><c:order val="0"/></c:ser></c:${group}>`,
                    categoryData(1, 4),
                    "",
                );
                expect(seriesIn(chart)[0].values, group).to.deep.equal(["10", "11", "12", "13"]);
                expect(attributeOf(chart.properties, "descr"), group).to.match(/^Pie chart/);
            }
        });

        it("should give a chart without series the series docx/charts writes", async () => {
            const chart = await patchPlotArea(
                `<c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/><c:gapWidth val="100"/><c:axId val="1"/><c:axId val="2"/></c:barChart>`,
            );
            expect(seriesIn(chart).map(({ name }) => name)).to.deep.equal(["S1", "S2"]);
            const series = descendantsOf(chart.chartSpace, "c:ser");
            expect(series.map((one) => valueOf(descendantsOf(childOf(one, "c:spPr"), "a:schemeClr")[0]))).to.deep.equal([
                "accent1",
                "accent2",
            ]);
            expect(elementsOf(descendantsOf(chart.chartSpace, "c:barChart")[0]).map(({ name }) => name)).to.deep.equal([
                "c:barDir",
                "c:grouping",
                "c:varyColors",
                "c:ser",
                "c:ser",
                "c:gapWidth",
                "c:axId",
                "c:axId",
            ]);
        });

        it("should give a scatter or bubble chart without series docx/charts' series", async () => {
            const scatter = await patchPlotArea(
                `<c:scatterChart><c:scatterStyle val="lineMarker"/><c:varyColors val="0"/></c:scatterChart>`,
                pointData(2, 2, false),
                "",
            );
            expect(seriesIn(scatter).map(({ categories }) => categories)).to.deep.equal([
                ["1", "2"],
                ["1", "2"],
            ]);
            const bubble = await patchPlotArea(`<c:bubbleChart><c:varyColors val="0"/></c:bubbleChart>`, pointData(1, 2, true), "");
            expect(seriesIn(bubble)[0].sizes).to.deep.equal(["1", "2"]);
        });

        it("should patch series plotted in another order than they are written", async () => {
            const series = (index: number, order: number): string =>
                `<c:ser><c:idx val="${index}"/><c:order val="${order}"/><c:tx><c:v>Old ${index}</c:v></c:tx></c:ser>`;
            const chart = await patchPlotArea(`<c:barChart>${series(0, 2)}${series(1, 0)}${series(2, 1)}</c:barChart>`, categoryData(3, 1));
            const written = descendantsOf(chart.chartSpace, "c:ser").map((one) => ({
                index: valueOf(childOf(one, "c:idx")),
                name: textOf(descendantsOf(childOf(one, "c:tx"), "c:v")[0]),
            }));
            expect(written).to.deep.equal([
                { index: "0", name: "S3" },
                { index: "1", name: "S1" },
                { index: "2", name: "S2" },
            ]);
        });

        it("should patch a chart whose XML is laid out with spaces and line breaks", async () => {
            const template = await JSZip.loadAsync(await templateOf({ chart: TEMPLATES.pie }));
            const pretty = (await readText(template, "word/charts/chart1.xml")).replace(/></g, ">\n    <");
            const zip = await patchChart(await templateWithFiles({ "word/charts/chart1.xml": pretty }, TEMPLATES.pie), categoryData(1, 5));
            await checkPackage(zip);
            expect(seriesIn((await chartsIn(zip))[0])[0].values).to.deep.equal(["10", "11", "12", "13", "14"]);
        });

        it("should count dates from 1900 in a chart counting them from 1904", async () => {
            const template = await templateWithChart(
                (part) => part.replace('<c:date1904 val="0"/>', '<c:date1904 val="1"/>'),
                TEMPLATES.dates,
            );
            const zip = await patchChart(template, { categories: [new Date("2025-01-01")], series: [{ name: "D", values: [1] }] });
            const [chart] = await chartsIn(zip);
            expect(valueOf(childOf(chart.chartSpace, "c:date1904"))).to.equal("0");
            expect(seriesIn(chart)[0].categories).to.deep.equal(["45658"]);
        });

        it("should keep a chart's own drawing, which its relationships refer to", async () => {
            const template = await templateWithChart((part) =>
                part.replace("</c:chartSpace>", '<c:userShapes r:id="rIdShapes"/></c:chartSpace>'),
            );
            const zip0 = await JSZip.loadAsync(template);
            const relationshipsPath = "word/charts/_rels/chart1.xml.rels";
            zip0.file(
                relationshipsPath,
                (await readText(zip0, relationshipsPath)).replace(
                    "</Relationships>",
                    '<Relationship Id="rIdShapes" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chartUserShapes" Target="../drawings/drawing1.xml"/></Relationships>',
                ),
            );
            zip0.file("word/drawings/drawing1.xml", '<c:userShapes xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"/>');
            const zip = await patchChart(await zip0.generateAsync({ type: "uint8array" }));

            const [chart] = await chartsIn(zip);
            expect(await readText(zip, chart.path)).to.contain('<c:userShapes r:id="rIdShapes"/>');
            expect((await relationshipsOf(zip, chart.path)).map(({ path }) => path)).to.include("word/drawings/drawing1.xml");
            expect(zip.file("word/drawings/drawing1.xml")).to.not.equal(null);
        });
    });

    describe("charts' workbooks", () => {
        const chartRelationships = (relationship: string): string =>
            `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationship}</Relationships>`;
        // The id of the relationship the chart refers to its workbook by
        const workbookIdOf = (text: string): string => /<c:externalData r:id="([^"]+)"/.exec(text)![1];

        it("should add a workbook to a chart without one", async () => {
            const template = await templateWith({
                files: { ...WITHOUT_WORKBOOK.files, "word/charts/_rels/chart1.xml.rels": null },
                changes: {
                    ...WITHOUT_WORKBOOK.changes,
                    "word/charts/chart1.xml": (part) => part.replace(/<c:externalData[^>]*>.*<\/c:externalData>/, ""),
                },
            });
            const zip = await patchChart(template);
            await checkPackage(zip);

            const [chart] = await chartsIn(zip);
            expect(await readText(zip, chart.path)).to.match(
                /<c:txPr>.*<\/c:txPr><c:externalData r:id="rId1"><c:autoUpdate val="0"\/><\/c:externalData><\/c:chartSpace>$/,
            );
            expect(chart.workbook).to.equal("word/embeddings/Microsoft_Excel_Worksheet1.xlsx");
        });

        it("should add a workbook after the chart's shape and text, and before its print settings", async () => {
            const template = await templateWith({
                files: { ...WITHOUT_WORKBOOK.files, "word/charts/_rels/chart1.xml.rels": null },
                changes: {
                    ...WITHOUT_WORKBOOK.changes,
                    "word/charts/chart1.xml": (part) =>
                        part
                            .replace(/<c:externalData[^>]*>.*<\/c:externalData>/, "")
                            .replace("</c:chartSpace>", "<c:printSettings/></c:chartSpace>"),
                },
            });
            const zip = await patchChart(template);
            await checkPackage(zip);
            expect(await readText(zip, "word/charts/chart1.xml")).to.match(
                /<\/c:txPr><c:externalData r:id="rId1"><c:autoUpdate val="0"\/><\/c:externalData><c:printSettings\/><\/c:chartSpace>$/,
            );
        });

        it("should add the relationship a chart's workbook reference has no relationship for, with its id", async () => {
            const template = await templateWith({
                ...WITHOUT_WORKBOOK,
                files: { ...WITHOUT_WORKBOOK.files, "word/charts/_rels/chart1.xml.rels": chartRelationships("") },
            });
            const id = workbookIdOf(await readText(await JSZip.loadAsync(template), "word/charts/chart1.xml"));
            const zip = await patchChart(template);
            await checkPackage(zip);

            expect((await relationshipsOf(zip, "word/charts/chart1.xml")).map(({ id: own, path }) => `${own} ${path}`)).to.deep.equal([
                `${id} word/embeddings/Microsoft_Excel_Worksheet1.xlsx`,
            ]);
        });

        it("should point a reference to a workbook the package doesn't have to the new one", async () => {
            const zip = await patchChart(await templateWith(WITHOUT_WORKBOOK));
            await checkPackage(zip);
            expect((await chartsIn(zip))[0].workbook).to.equal("word/embeddings/Microsoft_Excel_Worksheet1.xlsx");
        });

        it("should embed the new data in place of a workbook linked from outside the document", async () => {
            const template = await templateWith(WITHOUT_WORKBOOK);
            const id = workbookIdOf(await readText(await JSZip.loadAsync(template), "word/charts/chart1.xml"));
            const relationshipsPath = "word/charts/_rels/chart1.xml.rels";
            const linked = await JSZip.loadAsync(template);
            linked.file(
                relationshipsPath,
                chartRelationships(
                    `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject" Target="file:///C:\\Reports\\Sales.xlsx" TargetMode="External"/>`,
                ),
            );
            const zip = await patchChart(await linked.generateAsync({ type: "uint8array" }));
            await checkPackage(zip);

            expect(await readText(zip, relationshipsPath)).to.equal(
                chartRelationships(
                    `<Relationship Id="${id}" Type="${PACKAGE_TYPE}" Target="../embeddings/Microsoft_Excel_Worksheet1.xlsx"/>`,
                ),
            );
        });

        it("should keep a workbook the chart doesn't refer to", async () => {
            const template = await templateWith({ files: { "word/embeddings/Other.xlsx": new Uint8Array([1]) } });
            const zip = await patchChart(template);
            expect(zip.file("word/embeddings/Other.xlsx")).to.not.equal(null);
            expect(zip.file("word/embeddings/Microsoft_Excel_Worksheet1.xlsx")).to.equal(null);
        });

        it("should replace an old Excel workbook, and its content type", async () => {
            const template = await templateWith(WITHOUT_WORKBOOK);
            const id = workbookIdOf(await readText(await JSZip.loadAsync(template), "word/charts/chart1.xml"));
            const old = await templateWith({
                ...WITHOUT_WORKBOOK,
                files: {
                    ...WITHOUT_WORKBOOK.files,
                    "word/embeddings/Microsoft_Excel_97-2003_Worksheet1.xls": new Uint8Array([208, 207, 17, 224]),
                },
                changes: {
                    ...WITHOUT_WORKBOOK.changes,
                    "word/charts/chart1.xml": (part) => part.replace(/(<c:externalData r:id=")[^"]+"/, `$1${id}"`),
                    "word/charts/_rels/chart1.xml.rels": () =>
                        chartRelationships(
                            `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject" Target="../embeddings/Microsoft_Excel_97-2003_Worksheet1.xls"/>`,
                        ),
                    "[Content_Types].xml": (text) =>
                        WITHOUT_WORKBOOK.changes!["[Content_Types].xml"](text).replace(
                            "</Types>",
                            '<Override PartName="/word/embeddings/Microsoft_Excel_97-2003_Worksheet1.xls" ContentType="application/vnd.ms-excel"/></Types>',
                        ),
                },
            });
            const zip = await patchChart(old);
            await checkPackage(zip);
            expect(zip.file("word/embeddings/Microsoft_Excel_97-2003_Worksheet1.xls")).to.equal(null);
            expect(await readText(zip, "[Content_Types].xml")).to.not.contain("97-2003");
        });

        it("should keep a workbook two charts share when only one is patched, and remove it when both are", async () => {
            const template = await JSZip.loadAsync(await templateOf({ a: TEMPLATES.column, b: TEMPLATES.line }));
            // Chart 2 refers to chart 1's workbook, and its own is removed
            const second = "word/charts/_rels/chart2.xml.rels";
            template.file(second, (await readText(template, second)).replace("Worksheet2", "Worksheet1"));
            template.remove("word/embeddings/Microsoft_Excel_Worksheet2.xlsx");
            template.file(
                "[Content_Types].xml",
                (await readText(template, "[Content_Types].xml")).replace(/<Override[^>]*Worksheet2\.xlsx"\/>/, ""),
            );
            const shared = await template.generateAsync({ type: "uint8array" });

            const one = await patch(shared, { a: new ChartDataPatch(categoryData(1, 1)) });
            await checkPackage(one);
            const [a, b] = await chartsIn(one);
            expect(b.workbook).to.equal("word/embeddings/Microsoft_Excel_Worksheet1.xlsx");
            expect(a.workbook).to.equal("word/embeddings/Microsoft_Excel_Worksheet2.xlsx");

            const both = await patch(shared, { a: new ChartDataPatch(categoryData(1, 1)), b: new ChartDataPatch(categoryData(1, 1)) });
            await checkPackage(both);
            expect(filesOf(both).filter((path) => path.includes("embeddings"))).to.deep.equal([
                "word/embeddings/Microsoft_Excel_Worksheet2.xlsx",
                "word/embeddings/Microsoft_Excel_Worksheet3.xlsx",
            ]);
        });

        it("should patch a chart two drawings show once, and describe both", async () => {
            const template = await templateWithDrawing((document) => {
                const paragraph = /<w:p>(?:(?!<w:p>).)*?<c:chart.*?<\/w:p>/s.exec(document)![0];
                return document.replace(paragraph, paragraph + paragraph.replace(/name="chart"/, 'name="copy"'));
            });
            const zip = await patchChart(template, categoryData(4, 2));
            await checkPackage(zip);

            const charts = await chartsIn(zip);
            expect(charts).to.have.length(2);
            expect(charts[0].path).to.equal(charts[1].path);
            expect(seriesIn(charts[0])).to.have.length(4);
            expect(attributeOf(charts[0].properties, "descr")).to.match(/^Column chart, Sales. S1/);
            expect(attributeOf(charts[1].properties, "descr")).to.equal(attributeOf(charts[0].properties, "descr"));
            expect(filesOf(zip).filter((path) => path.includes("embeddings"))).to.have.length(1);
        });
    });

    describe("what can't be patched", () => {
        const expectError = async (
            template: Uint8Array | Buffer,
            message: string,
            data: ChartDataPatchOptions = categoryData(2, 3),
        ): Promise<void> => {
            await expect(patchChart(template, data)).rejects.toThrow(`Can't patch the chart {{chart}}. ${message}`);
        };

        it("should throw for a picture, a shape or a drawing that isn't a chart", async () => {
            const picture = await templateWithDrawing((document) =>
                document.replace(
                    /<a:graphicData uri="[^"]*chart">.*?<\/a:graphicData>/s,
                    '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic/></a:graphicData>',
                ),
            );
            await expectError(picture, "It is a picture, not a chart");

            const shape = await templateWithDrawing((document) =>
                document.replace(/<a:graphicData uri="[^"]*chart">.*?<\/a:graphicData>/s, "<a:graphicData><wps:wsp/></a:graphicData>"),
            );
            await expectError(shape, "It is a shape, not a chart");

            const empty = await templateWithDrawing((document) => document.replace(/<a:graphic\b.*?<\/a:graphic>/s, ""));
            await expectError(empty, "It isn't a chart");
        });

        it("should throw for a chart of a type Office 2016 added", async () => {
            const chartex = await templateWithDrawing((document) =>
                document.replace(
                    /<c:chart [^>]*\/>/,
                    '<cx:chart xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" r:id="rId9"/>',
                ),
            );
            await expectError(
                chartex,
                "It is a chart of a type Office 2016 added, such as a waterfall, histogram or treemap chart, which ChartDataPatch can't patch",
            );
        });

        it("should patch a group's one chart, and throw for a group of charts", async () => {
            const oneChart = await templateWithDrawing((document) =>
                document.replace(
                    /(<a:graphicData)[^>]*>(<c:chart [^>]*\/>)(<\/a:graphicData>)/,
                    '$1><wpg:wgp><wpg:graphicFrame><wpg:cNvPr id="9" name="Inner"/>$2</wpg:graphicFrame></wpg:wgp>$3',
                ),
            );
            const zip = await patchChart(oneChart, categoryData(3, 3));
            expect(await readText(zip, "word/document.xml")).to.contain("Column chart, Sales. S1");

            const twoCharts = await templateWithDrawing((document) => document.replace(/(<c:chart [^>]*\/>)/, "$1$1"));
            await expectError(twoCharts, "It is a group of 2 charts. Put the placeholder in the alt text of one of them");
        });

        it("should throw for a chart without a relationship id, or whose relationship or part is missing", async () => {
            await expectError(
                await templateWithDrawing((document) => document.replace(/<c:chart ([^>]*) r:id="[^"]*"/, "<c:chart $1")),
                "Its c:chart has no relationship id (r:id)",
            );
            await expectError(
                await templateWithDrawing((document) => document.replace(/(<c:chart [^>]*r:id=")[^"]*"/, '$1rIdMissing"')),
                "It refers to a chart part the template doesn't have",
            );
            await expectError(
                await templateWithFiles({ "word/charts/chart1.xml": null }),
                "It refers to a chart part the template doesn't have",
            );
        });

        it("should throw for a part that isn't a chart", async () => {
            await expectError(
                await templateWithFiles({ "word/charts/chart1.xml": "<notAChart/>" }),
                "Its part word/charts/chart1.xml isn't a chart: it has no c:chartSpace",
            );
        });

        it("should throw for stock, surface and pivot charts", async () => {
            await expectError(
                await templateWithChart((part) => part.replace(/c:barChart/g, "c:stockChart")),
                "It is a stock chart, whose series are its prices, which ChartDataPatch can't patch",
            );
            await expectError(
                await templateWithChart((part) => part.replace(/c:barChart/g, "c:surfaceChart")),
                "It is a surface chart, which ChartDataPatch can't patch",
            );
            await expectError(
                await templateWithChart((part) =>
                    part.replace(
                        "<c:chart>",
                        '<c:pivotSource><c:name>[Book1]Sheet1!PivotTable1</c:name><c:fmtId val="0"/></c:pivotSource><c:chart>',
                    ),
                ),
                "It is a pivot chart, whose data is a pivot table in its workbook",
            );
        });

        it("should throw for what refers to cells of the template's workbook, and say what to do in Word", async () => {
            const labelsFromCells = await templateWithChart((part) =>
                part.replace(
                    /(<c:ser>.*?)(<\/c:ser>)/,
                    (_, series: string, end: string) =>
                        `${series}<c:extLst><c:ext uri="{02D57815-91ED-43cb-92C2-25804820EDAC}" xmlns:c15="http://schemas.microsoft.com/office/drawing/2012/chart"><c15:datalabelsRange><c15:f>Sheet1!$D$2:$D$4</c15:f></c15:datalabelsRange></c:ext></c:extLst>${end}`,
                ),
            );
            await expectError(
                labelsFromCells,
                'Its data labels show text from cells of its workbook (Word\'s "Value From Cells"). Turn that off in Word: the new data replaces the workbook',
            );

            const filtered = await templateWithChart((part) =>
                part.replace(
                    "<c:gapWidth",
                    () =>
                        '<c:extLst><c:ext uri="{02D57815-91ED-43cb-92C2-25804820EDAC}" xmlns:c15="http://schemas.microsoft.com/office/drawing/2012/chart"><c15:filteredBarSeries><c15:ser><c:idx val="9"/><c:order val="9"/><c:tx><c:strRef><c:f>Sheet1!$E$1</c:f></c:strRef></c:tx></c15:ser></c15:filteredBarSeries></c:ext></c:extLst><c:gapWidth',
                ),
            );
            await expectError(
                filtered,
                "It has series or categories hidden with Word's chart filters. Show them, or remove them in Word's Select Data",
            );

            const errorBars = await templateWithChart((part) =>
                part.replace(
                    /(<c:ser>.*?)(<c:cat>)/,
                    (_, series: string, categories: string) =>
                        `${series}<c:errBars><c:errBarType val="both"/><c:errValType val="cust"/><c:plus><c:numRef><c:f>Sheet1!$F$2:$F$4</c:f></c:numRef></c:plus></c:errBars>${categories}`,
                ),
            );
            await expectError(errorBars, "Its error bars' custom values are cells of its workbook");

            const linkedTitle = await templateWithChart((part) =>
                part.replace(/<c:tx><c:rich>.*?<\/c:rich><\/c:tx>/, () => "<c:tx><c:strRef><c:f>Sheet1!$A$1</c:f></c:strRef></c:tx>"),
            );
            await expectError(linkedTitle, "A title is linked to a cell of its workbook. Type the title in Word instead");
        });

        it("should keep what refers to cells in the series the new data removes", async () => {
            const template = await templateWithChart((part) =>
                part.replace(
                    /(<c:ser>.*?<c:ser>.*?)(<c:cat>)/,
                    (_, series: string, categories: string) =>
                        `${series}<c:errBars><c:errValType val="cust"/><c:plus><c:numRef><c:f>Sheet1!$F$2:$F$4</c:f></c:numRef></c:plus></c:errBars>${categories}`,
                ),
            );
            const zip = await patchChart(template, categoryData(1, 3));
            await checkPackage(zip);
            expect(await readText(zip, "word/charts/chart1.xml")).to.not.contain("errBars");
        });

        it("should throw for data of the wrong kind for the chart's type", async () => {
            await expectError(
                await templateOf({ chart: TEMPLATES.scatter }),
                "It is a scatter chart, whose series have points. Give each series points, with an x and y",
                categoryData(1, 1),
            );
            await expectError(
                await templateOf({ chart: TEMPLATES.bubble }),
                "It is a bubble chart, whose series have points. Give each series points, with an x and y and a size",
                categoryData(1, 1),
            );
            await expectError(
                await templateOf({ chart: TEMPLATES.column }),
                "It is a column chart, whose series have a value for each category. Give categories, and each series values",
                pointData(1, 1, false),
            );
            await expectError(await templateOf({ chart: TEMPLATES.area }), "It is an area chart, whose series", pointData(1, 1, false));
            await expectError(
                await templateOf({ chart: TEMPLATES.bubble }),
                'The point at (1, 10) in series "S1" has no size, and a bubble chart\'s points each need one',
                pointData(1, 1, false),
            );
        });

        it("should take a scatter chart's points with sizes, leaving the sizes out", async () => {
            const { chart } = await patchOne("scatter", pointData(1, 2, true));
            expect(descendantsOf(chart.chartSpace, "c:bubbleSize")).to.deep.equal([]);
        });

        it("should throw for data the chart's type can't have", async () => {
            await expectError(
                await templateOf({ chart: TEMPLATES.pie }),
                "A pie chart has one series, but 3 were given",
                categoryData(3, 1),
            );
            await expectError(
                await templateOf({ chart: TEMPLATES.pie }),
                "Invalid value -1 in series \"S\". A pie chart's values can't be negative",
                { categories: ["A"], series: [{ name: "S", values: [-1] }] },
            );
            await expectError(
                await templateOf({ chart: TEMPLATES.doughnut }),
                "Invalid value -1 in series \"S\". A doughnut chart's values can't be negative",
                {
                    categories: ["A"],
                    series: [{ name: "S", values: [-1] }],
                },
            );
            for (const template of ["pie", "doughnut", "radar"] as const) {
                await expectError(await templateOf({ chart: TEMPLATES[template] }), "Invalid category", {
                    categories: [new Date("2025-01-01")],
                    series: [{ name: "S", values: [1] }],
                });
            }
        });

        it("should throw when a chart's alt text holds the placeholders of two charts' data", async () => {
            const template = await Packer.toBuffer(
                new Document({
                    sections: [
                        {
                            children: [
                                new Paragraph({
                                    children: [
                                        new ChartRun({ ...TEMPLATES.column, altText: { name: "Both", description: "{{a}} {{b}}" } }),
                                    ],
                                }),
                            ],
                        },
                    ],
                }),
            );
            await expect(
                patch(template, { a: new ChartDataPatch(categoryData(1, 1)), b: new ChartDataPatch(categoryData(1, 1)) }),
            ).rejects.toThrow(
                'The drawing "Both" in word/document.xml has the placeholders {{a}} and {{b}} in its alt text. A drawing can only be patched once',
            );
        });

        it("should say what was thrown when it isn't an error", () => {
            const drawing = { placeholder: "{{chart}}", element: {}, properties: {}, part: { path: "word/document.xml", xml: undefined } };
            const throwing = (thrown: unknown): TemplatePackage => ({
                getRelatedPart: () => {
                    throw thrown;
                },
                replaceRelatedPart: () => "",
                format: () => ({}),
            });
            const chartDrawing = {
                ...drawing,
                element: {
                    type: "element",
                    name: "wp:inline",
                    elements: [{ type: "element", name: "c:chart", attributes: { "r:id": "rId1" } }],
                },
            };

            expect(() => new ChartDataPatch(categoryData(1, 1)).patch(chartDrawing, throwing("Something odd"))).to.throw(
                "Can't patch the chart {{chart}}. Something odd",
            );
            expect(() => new ChartDataPatch(categoryData(1, 1)).patch(chartDrawing, throwing(new TypeError("A bug")))).to.throw(
                "Can't patch the chart {{chart}}. A bug",
            );
        });

        it("should keep the error it was thrown for", async () => {
            const error = await patchChart(await templateOf({ chart: TEMPLATES.pie }), categoryData(3, 1)).catch(
                (thrown: unknown) => thrown as Error,
            );
            expect(error).to.be.instanceOf(Error);
            expect((error as Error).cause).to.be.instanceOf(Error);
            expect(((error as Error).cause as Error).message).to.equal(
                "A pie chart has one series, but 3 were given. A doughnut chart can have more",
            );
        });

        it("should throw for charts it can't patch only when they have a placeholder", async () => {
            const template = await templateWithChart((part) => part.replace(/c:barChart/g, "c:stockChart"));
            const zip = await patch(template, { other: new ChartDataPatch(categoryData(1, 1)) });
            expect(await readText(zip, "word/charts/chart1.xml")).to.contain("c:stockChart");
        });
    });
});

// ---------------------------------------------------------------------------------------------------------------------
// Extreme data
// ---------------------------------------------------------------------------------------------------------------------

describe("ChartDataPatch with extreme data", () => {
    const roundTrip = async (template: TemplateName, data: ChartDataPatchOptions): Promise<readonly Series[]> => {
        const { chart } = await patchOne(template, data);
        const series = seriesIn(chart);
        expect(series.map(({ name, categories, values }) => ({ name, categories, values }))).to.deep.equal(expectedSeries(data));
        return series;
    };

    it("should take one category and one series", async () => {
        await roundTrip("column", categoryData(1, 1));
        await roundTrip("pie", categoryData(1, 1));
        await roundTrip("scatter", pointData(1, 1, false));
    });

    it("should take series in columns past Z, AZ and ZZ", async () => {
        const series = await roundTrip("line", categoryData(60, 2));
        expect(series).to.have.length(60);

        // 250 bubble series fill 750 columns, three each: their x values, y values and sizes
        const { chart } = await patchOne("bubble", pointData(250, 1, true));
        const columns = new Set(descendantsOf(chart.chartSpace, "c:f").map((formula) => /^Sheet1!\$([A-Z]+)\$/.exec(textOf(formula))![1]));
        expect(columns.size).to.equal(750);
        for (const column of ["A", "Z", "AA", "AZ", "BA", "ZZ", "AAA", "ABV"]) {
            expect(columns.has(column), column).to.equal(true);
        }
        expect(columns.has("ABW")).to.equal(false);
    });

    it("should take thousands of categories", async () => {
        const series = await roundTrip("area", categoryData(5, 3000));
        expect(series[4].values[2999]).to.equal("3049");
    });

    it("should keep text that needs escaping, and text from every script, in the caches and the workbook", async () => {
        const names = [
            "A & B",
            "<tag>",
            '"quoted"',
            "it's",
            "📈 growth",
            "مبيعات",
            "売上高",
            "Ünïcödé",
            "e\u0301",
            "  spaces  ",
            "line\nbreak",
            "tab\there",
            "&amp;",
            "]]>",
        ];
        await roundTrip("column", { categories: names, series: names.map((name, index) => ({ name, values: names.map(() => index) })) });
    });

    it("should keep very long text", async () => {
        const long = "x".repeat(20000);
        await roundTrip("bar", { categories: [long, `${long}y`], series: [{ name: long, values: [1, 2] }] });
    });

    it("should keep numbers of every size", async () => {
        const values = [0, -0, -1, 0.1 + 0.2, 1e-300, 1e300, Number.MAX_VALUE, Number.MIN_VALUE, Number.MAX_SAFE_INTEGER + 2, -123456.789];
        const series = await roundTrip("line", {
            categories: values.map((_, index) => `V${index}`),
            series: [{ name: "Numbers", values }],
        });
        expect(series[0].values).to.deep.equal([
            "0",
            "0",
            "-1",
            "0.30000000000000004",
            "1e-300",
            "1e+300",
            "1.7976931348623157e+308",
            "5e-324",
            "9007199254740992",
            "-123456.789",
        ]);
    });

    it("should keep gaps, series with fewer values, and series with none", async () => {
        const series = await roundTrip("column", {
            categories: ["A", "B", "C", "D"],
            series: [
                { name: "Gaps", values: [null, 1, null, 2] },
                { name: "Short", values: [1] },
                { name: "Empty", values: [] },
                { name: "All gaps", values: [null, null, null, null] },
            ],
        });
        expect(series.map(({ values }) => values)).to.deep.equal([
            [undefined, "1", undefined, "2"],
            ["1", undefined, undefined, undefined],
            [undefined, undefined, undefined, undefined],
            [undefined, undefined, undefined, undefined],
        ]);
    });

    it("should keep duplicate and empty names and categories", async () => {
        await roundTrip("column", {
            categories: ["Same", "Same", "", " "],
            series: [
                { name: "Twin", values: [1, 2, 3, 4] },
                { name: "Twin", values: [4, 3, 2, 1] },
                { name: "", values: [0, 0, 0, 0] },
            ],
        });
    });

    it("should keep numbers as categories", async () => {
        const series = await roundTrip("line", { categories: [-1.5, 0, 2024, 1e21], series: [{ name: "N", values: [1, 2, 3, 4] }] });
        expect(series[0].categories).to.deep.equal(["-1.5", "0", "2024", "1e+21"]);
    });

    it("should keep dates spaced by days, months and years, and from Excel's first to its last", async () => {
        const dates = async (categories: readonly Date[]): Promise<readonly (string | undefined)[]> => {
            const { chart } = await patchOne("dates", { categories, series: [{ name: "D", values: categories.map((_, index) => index) }] });
            return seriesIn(chart)[0].categories;
        };
        expect(await dates([new Date("2025-01-01"), new Date("2025-01-02")])).to.deep.equal(["45658", "45659"]);
        expect(await dates([new Date("2025-01-01"), new Date("2025-06-01")])).to.deep.equal(["45658", "45809"]);
        expect(await dates([new Date("1900-03-01"), new Date("9999-12-31")])).to.deep.equal(["61", "2958465"]);
    });

    it("should keep points in any order, repeated, and far apart", async () => {
        const points = [
            { x: 5, y: 1 },
            { x: -5, y: 1 },
            { x: 5, y: 1 },
            { x: 1e-9, y: -1e9 },
        ];
        await roundTrip("scatter", { series: [{ name: "Points", points }] });
    });

    it("should keep bubbles of no size and of every size", async () => {
        const { chart } = await patchOne("bubble", {
            series: [
                {
                    name: "Sizes",
                    points: [
                        { x: 1, y: 1, size: 0 },
                        { x: 2, y: 2, size: 1e-9 },
                        { x: 3, y: 3, size: 1e9 },
                    ],
                },
            ],
        });
        expect(seriesIn(chart)[0].sizes).to.deep.equal(["0", "1e-9", "1000000000"]);
    });

    describe("random data", () => {
        // A random number generator that gives the same numbers from the same seed (mulberry32), so a failure can be run again
        /* eslint-disable no-bitwise */
        const randomFrom = (seed: number): (() => number) => {
            let state = seed;
            return () => {
                state = (state + 0x6d2b79f5) | 0;
                let value = Math.imul(state ^ (state >>> 15), 1 | state);
                value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
                return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
            };
        };
        /* eslint-enable no-bitwise */
        const CHARACTERS = ["a", "Z", "0", " ", "&", "<", ">", '"', "'", "é", "日", "📊", "\n", "-", "."];

        for (let seed = 1; seed <= 40; seed++) {
            it(`should patch random data into a random chart, seed ${seed}`, async () => {
                const random = randomFrom(seed);
                const pick = <Value>(values: readonly Value[]): Value => values[Math.floor(random() * values.length)];
                const whole = (maximum: number): number => 1 + Math.floor(random() * maximum);
                const text = (): string => Array.from({ length: whole(8) - 1 }, () => pick(CHARACTERS)).join("");
                const randomNumber = (canBeNegative: boolean): number =>
                    Math.round((random() * 2000 - (canBeNegative ? 1000 : 0)) * 100) / 100;

                const template = pick(Object.keys(TEMPLATES) as readonly TemplateName[]);
                const seriesCount = template === "pie" ? 1 : whole(9);
                const points = whole(30);
                const negative = !["pie", "doughnut"].includes(template);
                const data: ChartDataPatchOptions = POINT_TEMPLATES.includes(template)
                    ? {
                          series: Array.from({ length: seriesCount }, () => ({
                              name: text(),
                              points: Array.from({ length: whole(points) }, () => ({
                                  x: randomNumber(true),
                                  y: randomNumber(true),
                                  ...(template === "bubble" ? { size: randomNumber(false) } : {}),
                              })),
                          })),
                      }
                    : {
                          categories: Array.from({ length: points }, text),
                          series: Array.from({ length: seriesCount }, () => ({
                              name: text(),
                              values: Array.from({ length: whole(points) }, () => (random() < 0.15 ? null : randomNumber(negative))),
                          })),
                      };

                const { chart } = await patchOne(template, data);
                expect(seriesIn(chart).map(({ name, categories, values }) => ({ name, categories, values }))).to.deep.equal(
                    expectedSeries(data),
                );

                // The same data again, keeping the placeholder, and then other data into the patched document
                const once = await patch(await templateOf({ chart: TEMPLATES[template] }), {
                    chart: new ChartDataPatch({ ...data, description: "{{chart}}" }),
                });
                await checkPackage(once);
                const other = dataFor(template, template === "pie" ? 1 : whole(4), whole(5));
                const twice = await patch(await once.generateAsync({ type: "uint8array" }), { chart: new ChartDataPatch(other) });
                await checkPackage(twice);
                expect(
                    seriesIn((await chartsIn(twice))[0]).map(({ name, categories, values }) => ({ name, categories, values })),
                ).to.deep.equal(expectedSeries(other));
            });
        }
    });
});
