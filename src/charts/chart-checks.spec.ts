import { describe, expect, it } from "vitest";

import { checkChartOptions, checkRange } from "./chart-checks";
import type { ChartRunOptions } from "./chart-options";

const column = (options: Partial<Extract<ChartRunOptions, { readonly type: "column" }>> = {}): ChartRunOptions => ({
    type: "column",
    categories: ["Jan", "Feb", "Mar"],
    series: [{ name: "2025", values: [1, 2, 3] }],
    ...options,
});

describe("checkChartOptions", () => {
    it("should throw when there are no series or no categories", () => {
        expect(() => checkChartOptions(column({ series: [] }))).to.throw("A chart needs at least one series");
        expect(() => checkChartOptions({ type: "scatter", series: [] })).to.throw("A chart needs at least one series");
        expect(() => checkChartOptions(column({ categories: [] }))).to.throw("A chart needs at least one category");
        expect(() => checkChartOptions({ type: "pie", categories: [], series: [{ name: "A", values: [] }] })).to.throw(
            "A chart needs at least one category",
        );
    });

    it("should throw for a category that is a number but not a finite one", () => {
        expect(() => checkChartOptions(column({ categories: [1, Number.NaN] }))).to.throw(
            "Invalid category NaN. Expected text or a finite number",
        );
    });

    it("should throw when a series has more values than there are categories", () => {
        expect(() => checkChartOptions(column({ series: [{ name: "Long", values: [1, 2, 3, 4] }] }))).to.throw(
            'Series "Long" has 4 values, but there are 3 categories',
        );
    });

    it("should throw for a value that isn't a finite number or null", () => {
        for (const value of [Number.NaN, Infinity, "5" as unknown as number, undefined as unknown as number]) {
            expect(() => checkChartOptions(column({ series: [{ name: "Bad", values: [1, value] }] }))).to.throw(
                `Invalid value ${typeof value === "string" ? `"${value}"` : value} in series "Bad". Expected a finite number or null`,
            );
        }
    });

    it("should throw for a pie chart with more than one series, or a negative value in a pie or doughnut chart", () => {
        const categories = ["A", "B"];
        expect(() =>
            checkChartOptions({
                type: "pie",
                categories,
                series: [
                    { name: "A", values: [1, 2] },
                    { name: "B", values: [1, 2] },
                ],
            }),
        ).to.throw("A pie chart has one series, but 2 were given. A doughnut chart can have more");
        expect(() => checkChartOptions({ type: "pie", categories, series: [{ name: "Loss", values: [1, -2] }] })).to.throw(
            "Invalid value -2 in series \"Loss\". A pie chart's values can't be negative",
        );
        expect(() => checkChartOptions({ type: "doughnut", categories, series: [{ name: "Loss", values: [null, -1] }] })).to.throw(
            "Invalid value -1 in series \"Loss\". A doughnut chart's values can't be negative",
        );
        expect(() => checkChartOptions({ type: "pie", categories, series: [{ name: "Long", values: [1, 2, 3] }] })).to.throw(
            'Series "Long" has 3 values, but there are 2 categories',
        );
    });

    it("should throw when a pie's series has more colours than there are slices", () => {
        expect(() =>
            checkChartOptions({
                type: "pie",
                categories: ["A"],
                series: [{ name: "Colours", values: [1], colors: ["FF0000", "00FF00"] }],
            }),
        ).to.throw('Series "Colours" has 2 colors, but there are 1 categories');
    });

    it("should throw for a scatter series without points, or a point that isn't two finite numbers", () => {
        expect(() => checkChartOptions({ type: "scatter", series: [{ name: "Empty", points: [] }] })).to.throw(
            'Series "Empty" has no points',
        );
        expect(() => checkChartOptions({ type: "scatter", series: [{ name: "Bad", points: [{ x: 1, y: Number.NaN }] }] })).to.throw(
            'Invalid point (1, NaN) in series "Bad". Expected a finite x and y',
        );
        expect(() => checkChartOptions({ type: "scatter", series: [{ name: "Bad", points: [{ x: Infinity, y: 1 }] }] })).to.throw(
            'Invalid point (Infinity, 1) in series "Bad"',
        );
    });

    it("should throw for a size that isn't a positive number of pixels", () => {
        expect(() => checkChartOptions(column({ transformation: { width: 0, height: 100 } }))).to.throw(
            "Invalid chart width 0. Expected a positive number of pixels",
        );
        expect(() => checkChartOptions(column({ transformation: { width: 100, height: Infinity } }))).to.throw(
            "Invalid chart height Infinity. Expected a positive number of pixels",
        );
    });

    it("should throw for a value axis whose range or interval isn't one", () => {
        expect(() => checkChartOptions(column({ valueAxis: { minimum: Number.NaN } }))).to.throw(
            "Invalid value axis minimum NaN. Expected a finite number",
        );
        expect(() => checkChartOptions(column({ valueAxis: { minimum: 10, maximum: 10 } }))).to.throw(
            "Invalid value axis range from 10 to 10. Expected the minimum to be less than the maximum",
        );
        expect(() => checkChartOptions(column({ valueAxis: { interval: 0 } }))).to.throw(
            "Invalid value axis interval 0. Expected a number greater than 0",
        );
        expect(() =>
            checkChartOptions({ type: "scatter", series: [{ name: "A", points: [{ x: 1, y: 1 }] }], xAxis: { maximum: -1, minimum: 0 } }),
        ).to.throw("Invalid x axis range from 0 to -1");
        expect(() =>
            checkChartOptions({ type: "scatter", series: [{ name: "A", points: [{ x: 1, y: 1 }] }], yAxis: { interval: -2 } }),
        ).to.throw("Invalid y axis interval -2");
        // A range with only one end, and an interval, are fine
        expect(() => checkChartOptions(column({ valueAxis: { minimum: 0, interval: 5 } }))).to.not.throw();
        expect(() => checkChartOptions(column({ valueAxis: { maximum: 0 } }))).to.not.throw();
    });

    it("should throw for a gap width, overlap, first slice angle or hole size outside its range", () => {
        expect(() => checkChartOptions(column({ gapWidth: 501 }))).to.throw("Invalid gap width 501. Expected a number from 0 to 500");
        expect(() => checkChartOptions({ type: "bar", categories: ["A"], series: [{ name: "A", values: [1] }], overlap: -101 })).to.throw(
            "Invalid overlap -101. Expected a number from -100 to 100",
        );
        const pie = { categories: ["A"], series: [{ name: "A", values: [1] }] };
        expect(() => checkChartOptions({ type: "pie", ...pie, firstSliceAngle: 361 })).to.throw(
            "Invalid first slice angle 361. Expected a number from 0 to 360",
        );
        expect(() => checkChartOptions({ type: "doughnut", ...pie, holeSize: 5 })).to.throw(
            "Invalid hole size 5. Expected a number from 10 to 90",
        );
        expect(() => checkChartOptions({ type: "doughnut", ...pie, holeSize: 90, firstSliceAngle: 360 })).to.not.throw();
    });

    it("should throw for a font size, line width or marker size outside its range, wherever it is given", () => {
        const fontSize = "Invalid font size 0. Expected a number from 1 to 4000";
        expect(() => checkChartOptions(column({ title: { text: "T", font: { size: 0 } } }))).to.throw(fontSize);
        expect(() => checkChartOptions(column({ legend: { font: { size: 0 } } }))).to.throw(fontSize);
        expect(() => checkChartOptions(column({ font: { size: 0 } as { readonly name?: string } }))).to.throw(fontSize);
        expect(() => checkChartOptions(column({ dataLabels: { value: true, font: { size: 0 } } }))).to.throw(fontSize);
        expect(() => checkChartOptions(column({ series: [{ name: "A", values: [1], dataLabels: { font: { size: 0 } } }] }))).to.throw(
            fontSize,
        );
        expect(() => checkChartOptions(column({ categoryAxis: { font: { size: 0 } } }))).to.throw(fontSize);
        expect(() => checkChartOptions(column({ valueAxis: { title: { text: "T", font: { size: 0 } } } }))).to.throw(fontSize);
        expect(() => checkChartOptions(column({ title: { text: "T", font: { size: 4000 } }, legend: false }))).to.not.throw();

        const lineWidth = "Invalid line width 1585. Expected a number from 0 to 1584";
        expect(() => checkChartOptions(column({ chartArea: { border: { width: 1585 } } }))).to.throw(lineWidth);
        expect(() => checkChartOptions(column({ plotArea: { border: { width: 1585 } } }))).to.throw(lineWidth);
        expect(() => checkChartOptions(column({ chartArea: { border: "none" }, plotArea: { fill: "none" } }))).to.not.throw();
        expect(() => checkChartOptions(column({ series: [{ name: "A", values: [1], type: "line", line: { width: 1585 } }] }))).to.throw(
            lineWidth,
        );

        const markerSize = "Invalid marker size 1. Expected a number from 2 to 72";
        expect(() =>
            checkChartOptions({ type: "line", categories: ["A"], series: [{ name: "A", values: [1] }], markers: { size: 1 } }),
        ).to.throw(markerSize);
        expect(() =>
            checkChartOptions({ type: "line", categories: ["A"], series: [{ name: "A", values: [1], markers: { size: 73 } }] }),
        ).to.throw("Invalid marker size 73");
    });

    it("should throw for an axis' label rotation, crossing or logarithmic scale that isn't one", () => {
        expect(() => checkChartOptions(column({ categoryAxis: { labelRotation: -91 } }))).to.throw(
            "Invalid category axis label rotation -91. Expected a number from -90 to 90",
        );
        expect(() => checkChartOptions(column({ valueAxis: { crossesAt: Number.NaN } }))).to.throw(
            'Invalid value axis crossing NaN. Expected "auto", "minimum", "maximum" or a finite number',
        );
        expect(() => checkChartOptions(column({ valueAxis: { crossesAt: "middle" as "auto" } }))).to.throw(
            "Invalid value axis crossing middle",
        );
        expect(() => checkChartOptions(column({ valueAxis: { displayUnits: "thousand" as "thousands" } }))).to.throw(
            'Invalid value axis display units "thousand". Expected one of hundreds, thousands, tenThousands',
        );
        expect(() => checkChartOptions(column({ valueAxis: { logarithmicBase: 1 } }))).to.throw(
            "Invalid value axis logarithmic base 1. Expected a number from 2 to 1000",
        );
        expect(() => checkChartOptions(column({ secondaryValueAxis: { logarithmicBase: 10, minimum: 0 } }))).to.throw(
            "Invalid secondary value axis minimum 0. A logarithmic axis' range is above 0",
        );
        expect(() => checkChartOptions(column({ valueAxis: { logarithmicBase: 10, minimum: 1, maximum: -5 } }))).to.throw(
            "Invalid value axis range from 1 to -5",
        );
        expect(() => checkChartOptions(column({ valueAxis: { logarithmicBase: 10, maximum: -5 } }))).to.throw(
            "Invalid value axis maximum -5. A logarithmic axis' range is above 0",
        );
        expect(() =>
            checkChartOptions({
                type: "bubble",
                series: [{ name: "A", points: [{ x: 1, y: 1, size: 1 }] }],
                xAxis: { crossesAt: "minimum", labelRotation: 90 },
                yAxis: { logarithmicBase: 2, minimum: 0.5, crossesAt: 3 },
            }),
        ).to.not.throw();
    });

    it("should take a date, not a number, where a value axis crosses categories that are dates, and a date nowhere else", () => {
        const dated = column({ categories: [new Date("2025-01-01"), new Date("2025-02-01")], series: [{ name: "A", values: [1, 2] }] });

        expect(() => checkChartOptions({ ...dated, valueAxis: { crossesAt: new Date("2025-02-01") } } as ChartRunOptions)).to.not.throw();
        expect(() => checkChartOptions({ ...dated, secondaryValueAxis: { crossesAt: 2 } } as ChartRunOptions)).to.throw(
            "Invalid secondary value axis crossing 2. The categories are dates, so expected a date",
        );
        expect(() => checkChartOptions({ ...dated, valueAxis: { crossesAt: new Date("1800-01-01") } } as ChartRunOptions)).to.throw(
            "Expected a date from 1900-03-01",
        );
        expect(() => checkChartOptions(column({ valueAxis: { crossesAt: new Date("2025-01-01") } }))).to.throw(
            "A date is only for a value axis crossing categories that are dates",
        );
        expect(() => checkChartOptions({ ...dated, categoryAxis: { crossesAt: new Date("2025-01-01") } } as ChartRunOptions)).to.throw(
            "Invalid category axis crossing",
        );
        // "maximum" and the like are still fine
        expect(() => checkChartOptions({ ...dated, valueAxis: { crossesAt: "maximum" } } as ChartRunOptions)).to.not.throw();
    });

    it("should throw for categories that are only partly dates, or dates Excel can't hold", () => {
        expect(() => checkChartOptions(column({ categories: [new Date("2025-01-01"), "Feb"] }))).to.throw(
            "Invalid categories. Expected all of them to be dates, or none",
        );
        expect(() => checkChartOptions(column({ categories: [new Date("1900-02-28")] }))).to.throw(
            "Expected a date from 1900-03-01 to 9999-12-31",
        );
        expect(() => checkChartOptions(column({ categories: [new Date("invalid")] }))).to.throw("Invalid category date Invalid Date");
        expect(() =>
            checkChartOptions(
                column({ categories: [new Date("1900-03-01"), new Date("9999-12-31T23:59:59Z")], series: [{ name: "A", values: [1, 2] }] }),
            ),
        ).to.not.throw();
        // Only charts with a category axis have dates
        expect(() =>
            checkChartOptions({
                type: "pie",
                categories: [new Date("2025-01-01")] as unknown as readonly string[],
                series: [{ name: "A", values: [1] }],
            }),
        ).to.throw("Invalid category 2025-01-01T00:00:00.000Z. Expected text or a finite number");
    });

    it("should throw for a series type or axis that isn't one, or a type on a bar chart", () => {
        expect(() => checkChartOptions(column({ series: [{ name: "A", values: [1], type: "pie" as "line" }] }))).to.throw(
            'Invalid type "pie" for series "A". Expected "column", "line" or "area"',
        );
        expect(() => checkChartOptions(column({ series: [{ name: "A", values: [1], axis: "third" as "primary" }] }))).to.throw(
            'Invalid axis "third" for series "A". Expected "primary" or "secondary"',
        );
        expect(() => checkChartOptions({ type: "bar", categories: ["A"], series: [{ name: "A", values: [1], type: "line" }] })).to.throw(
            'Invalid option type for series "A". A bar chart\'s series are all bars',
        );
    });

    it("should throw for an option the way a series is drawn doesn't have", () => {
        expect(() => checkChartOptions(column({ series: [{ name: "A", values: [1], markers: true }] }))).to.throw(
            'Invalid option markers for series "A". It is drawn as columns, and only a line has it',
        );
        expect(() => checkChartOptions({ type: "bar", categories: ["A"], series: [{ name: "A", values: [1], smooth: true }] })).to.throw(
            'Invalid option smooth for series "A". It is drawn as bars',
        );
        expect(() => checkChartOptions(column({ series: [{ name: "A", values: [1], type: "area", line: {} }] }))).to.throw(
            'Invalid option line for series "A". It is drawn as an area',
        );
        expect(() =>
            checkChartOptions({ type: "line", categories: ["A"], series: [{ name: "A", values: [1], colors: ["FF0000"] }] }),
        ).to.throw('Invalid option colors for series "A". It is drawn as a line, and only bars have it');
        // A line series of a column chart has lines' options, and a column series of a line chart has bars'
        expect(() =>
            checkChartOptions(
                column({ series: [{ name: "A", values: [1], type: "line", markers: true, smooth: true, line: { dash: "dash" } }] }),
            ),
        ).to.not.throw();
        expect(() =>
            checkChartOptions({
                type: "line",
                categories: ["A"],
                series: [{ name: "A", values: [1], type: "column", colors: ["FF0000"] }],
            }),
        ).to.not.throw();
    });

    it("should throw when a series has more colours than there are bars", () => {
        expect(() =>
            checkChartOptions(column({ series: [{ name: "A", values: [1], colors: ["FF0000", "00FF00", "0000FF", "000000"] }] })),
        ).to.throw('Series "A" has 4 colors, but there are 3 categories');
    });

    it("should throw when every series is on the secondary axis", () => {
        expect(() => checkChartOptions(column({ series: [{ name: "A", values: [1], axis: "secondary" }] }))).to.throw(
            "A chart needs at least one series on the primary axis",
        );
        expect(() =>
            checkChartOptions(
                column({
                    series: [
                        { name: "A", values: [1], axis: "primary" },
                        { name: "B", values: [1], axis: "secondary" },
                    ],
                }),
            ),
        ).to.not.throw();
    });

    it("should throw for a scatter series' line when the chart has no lines, or a filled radar series' markers or line", () => {
        const points = [{ x: 1, y: 1 }];
        expect(() => checkChartOptions({ type: "scatter", series: [{ name: "A", points, line: { width: 1 } }] })).to.throw(
            'Invalid option line for series "A". The chart\'s lines are "none"',
        );
        expect(() =>
            checkChartOptions({ type: "scatter", lines: "straight", series: [{ name: "A", points, line: { width: 1 } }] }),
        ).to.not.throw();
        expect(() =>
            checkChartOptions({ type: "scatter", series: [{ name: "A", points, line: { width: 1585 } }], lines: "smooth" }),
        ).to.throw("Invalid line width 1585");
        expect(() => checkChartOptions({ type: "scatter", series: [{ name: "A", points, markers: { size: 80 } }] })).to.throw(
            "Invalid marker size 80",
        );
        expect(() => checkChartOptions({ type: "scatter", series: [{ name: "A", points }], markers: { size: 80 } })).to.throw(
            "Invalid marker size 80",
        );

        const radar = { type: "radar", categories: ["A", "B", "C"] } as const;
        expect(() => checkChartOptions({ ...radar, filled: true, series: [{ name: "A", values: [1], markers: true }] })).to.throw(
            'Invalid option markers for series "A". A filled radar chart\'s series have neither',
        );
        expect(() => checkChartOptions({ ...radar, filled: true, series: [{ name: "A", values: [1], line: {} }] })).to.throw(
            'Invalid option line for series "A"',
        );
        expect(() => checkChartOptions({ ...radar, filled: true, markers: true, series: [{ name: "A", values: [1] }] })).to.throw(
            "Invalid option markers. A filled radar chart's series have no markers",
        );
        expect(() =>
            checkChartOptions({
                ...radar,
                series: [{ name: "A", values: [1, 2, 3], markers: { shape: "x" }, line: { width: 1 } }],
                markers: true,
            }),
        ).to.not.throw();
        expect(() => checkChartOptions({ ...radar, series: [{ name: "A", values: [1, 2, 3, 4] }] })).to.throw(
            'Series "A" has 4 values, but there are 3 categories',
        );
        expect(() => checkChartOptions({ ...radar, series: [{ name: "A", values: [1] }], markers: { size: 1 } })).to.throw(
            "Invalid marker size 1",
        );
        expect(() => checkChartOptions({ ...radar, series: [{ name: "A", values: [1] }], valueAxis: { interval: 0 } })).to.throw(
            "Invalid value axis interval 0",
        );
        expect(() => checkChartOptions({ ...radar, series: [{ name: "A", values: [1] }], categoryAxis: { labelRotation: 100 } })).to.throw(
            "Invalid category axis label rotation 100",
        );
    });

    it("should throw for a bubble that isn't a point with a size of 0 or more, or a bubble scale outside its range", () => {
        const bubble = (size: number): ChartRunOptions => ({ type: "bubble", series: [{ name: "A", points: [{ x: 1, y: 2, size }] }] });
        expect(() => checkChartOptions(bubble(-1))).to.throw(
            'Invalid size -1 of the bubble at (1, 2) in series "A". Expected a finite number of 0 or more',
        );
        expect(() => checkChartOptions(bubble(Number.NaN))).to.throw("Invalid size NaN");
        expect(() => checkChartOptions(bubble(Infinity))).to.throw("Invalid size Infinity");
        expect(() => checkChartOptions(bubble(0))).to.not.throw();
        expect(() => checkChartOptions({ type: "bubble", series: [{ name: "A", points: [] }] })).to.throw('Series "A" has no points');
        expect(() => checkChartOptions({ type: "bubble", series: [{ name: "A", points: [{ x: Number.NaN, y: 2, size: 1 }] }] })).to.throw(
            'Invalid point (NaN, 2) in series "A"',
        );
        expect(() => checkChartOptions({ ...bubble(1), bubbleScale: 301 } as ChartRunOptions)).to.throw(
            "Invalid bubble scale 301. Expected a number from 0 to 300",
        );
        expect(() => checkChartOptions({ ...bubble(1), yAxis: { minimum: 5, maximum: 1 } } as ChartRunOptions)).to.throw(
            "Invalid y axis range from 5 to 1",
        );
    });
});

describe("checkRange", () => {
    it("should accept a number in the range, or nothing", () => {
        expect(() => checkRange(undefined, "size", 0, 1)).to.not.throw();
        expect(() => checkRange(0, "size", 0, 1)).to.not.throw();
        expect(() => checkRange(Number.NaN, "size", 0, 1)).to.throw("Invalid size NaN. Expected a number from 0 to 1");
    });
});

describe("checkChartOptions, for labels of single points", () => {
    const withLabels = (pointLabels: unknown): ChartRunOptions =>
        column({ series: [{ name: "A", values: [1, 2, 3], pointLabels: pointLabels as readonly undefined[] }] });

    it("should take a label, false or undefined for each point, up to one for each category", () => {
        expect(() => checkChartOptions(withLabels([{ text: "Peak" }, false, undefined]))).to.not.throw();
        expect(() => checkChartOptions(withLabels([]))).to.not.throw();
        expect(() =>
            checkChartOptions(withLabels([{ value: true, position: "insideEnd", numberFormat: "0", font: { size: 12 } }])),
        ).to.not.throw();
    });

    it("should throw for more labels than there are categories, or points", () => {
        expect(() => checkChartOptions(withLabels([undefined, undefined, undefined, { text: "Four" }]))).to.throw(
            'Series "A" has 4 point labels, but there are 3 categories',
        );
        expect(() =>
            checkChartOptions({
                type: "scatter",
                series: [{ name: "P", points: [{ x: 1, y: 1 }], pointLabels: [undefined, { text: "Two" }] }],
            }),
        ).to.throw('Series "P" has 2 point labels, but there are 1 points');
    });

    it("should throw for labels that aren't a list, or a label that isn't one", () => {
        expect(() => checkChartOptions(withLabels({ text: "Peak" }))).to.throw(
            'Invalid point labels [object Object] for series "A". Expected a label for each point, in order',
        );
        expect(() => checkChartOptions(withLabels("Peak"))).to.throw('Invalid point labels "Peak"');
        expect(() => checkChartOptions(withLabels(["Peak"]))).to.throw(
            `Invalid label "Peak" of point 1 of series "A". Expected a label's options, false or undefined`,
        );
        expect(() => checkChartOptions(withLabels([undefined, true]))).to.throw('Invalid label true of point 2 of series "A"');
        expect(() => checkChartOptions(withLabels([null]))).to.throw('Invalid label null of point 1 of series "A"');
    });

    it("should throw for text that isn't text, or a label with text that shows something else too", () => {
        expect(() => checkChartOptions(withLabels([{ text: 5 }]))).to.throw(
            'Invalid text 5 of the label of point 1 of series "A". Expected text',
        );
        for (const option of ["value", "category", "seriesName", "percentage", "bubbleSize", "numberFormat"]) {
            expect(
                () => checkChartOptions(withLabels([{ text: "Peak", [option]: option === "numberFormat" ? "0" : true }])),
                option,
            ).to.throw(`Invalid option ${option} of the label of point 1 of series "A". A label with text shows only its text`);
        }
        // Even saying it shows nothing, as the text is all it shows
        expect(() => checkChartOptions(withLabels([{ text: "Peak", value: false }]))).to.throw("Invalid option value");
    });

    it("should throw for a label's number format that isn't text, or font out of range", () => {
        expect(() => checkChartOptions(withLabels([{ value: true, numberFormat: 0 }]))).to.throw(
            'Invalid number format 0 of the label of point 1 of series "A"',
        );
        expect(() => checkChartOptions(withLabels([{ text: "T", font: { size: 0 } }]))).to.throw("Invalid font size 0");
    });

    it("should check the labels of every type of series", () => {
        const labels = [undefined, { text: "Two" }];
        expect(() =>
            checkChartOptions({ type: "pie", categories: ["A"], series: [{ name: "P", values: [1], pointLabels: labels }] }),
        ).to.throw('Series "P" has 2 point labels, but there are 1 categories');
        expect(() =>
            checkChartOptions({ type: "radar", categories: ["A"], series: [{ name: "R", values: [1], pointLabels: labels }] }),
        ).to.throw('Series "R" has 2 point labels, but there are 1 categories');
        expect(() =>
            checkChartOptions({ type: "bubble", series: [{ name: "B", points: [{ x: 1, y: 1, size: 1 }], pointLabels: labels }] }),
        ).to.throw('Series "B" has 2 point labels, but there are 1 points');
    });
});

describe("checkChartOptions, for categories in groups", () => {
    const grouped = (categories: unknown, values: readonly number[] = [1, 2, 3]): ChartRunOptions =>
        column({ categories: categories as readonly string[], series: [{ name: "A", values }] });

    it("should take groups of categories, and groups of groups, as deep as each other", () => {
        expect(() =>
            checkChartOptions(
                grouped([
                    { name: "2024", categories: ["Q1", "Q2"] },
                    { name: "2025", categories: [1] },
                ]),
            ),
        ).to.not.throw();
        expect(() =>
            checkChartOptions(
                grouped([
                    { name: "Europe", categories: [{ name: "UK", categories: ["London", "Leeds"] }] },
                    { name: "Asia", categories: [{ name: "Japan", categories: ["Tokyo"] }] },
                ]),
            ),
        ).to.not.throw();
    });

    it("should count the categories inside the groups, for the values", () => {
        expect(() => checkChartOptions(grouped([{ name: "2024", categories: ["Q1", "Q2"] }], [1, 2, 3]))).to.throw(
            'Series "A" has 3 values, but there are 2 categories',
        );
    });

    it("should throw for a group without a name or categories, or with none", () => {
        expect(() => checkChartOptions(grouped([{ name: "2024" }]))).to.throw(
            'Invalid category group {"name":"2024"}. Expected { name, categories }, as every category is a group or none is',
        );
        expect(() => checkChartOptions(grouped([{ categories: ["Q1"] }]))).to.throw('Invalid category group {"categories":["Q1"]}');
        expect(() => checkChartOptions(grouped([{ name: 2024, categories: ["Q1"] }]))).to.throw("Invalid category group");
        expect(() => checkChartOptions(grouped([{ name: "2024", categories: "Q1" }]))).to.throw("Invalid category group");
        expect(() => checkChartOptions(grouped([{ name: "2024", categories: [] }]))).to.throw('Category group "2024" has no categories');
    });

    it("should throw for groups mixed with categories, at any depth", () => {
        expect(() => checkChartOptions(grouped([{ name: "2024", categories: ["Q1"] }, "Q2"]))).to.throw('Invalid category group "Q2"');
        expect(() => checkChartOptions(grouped(["Q1", { name: "2024", categories: ["Q2"] }]))).to.throw(
            "Invalid categories. Expected all of them to be groups, or none",
        );
        expect(() => checkChartOptions(grouped([{ name: "2024", categories: ["Q1", { name: "H2", categories: ["Q3"] }] }]))).to.throw(
            'Category group "2024" holds categories and groups. A group holds one or the other',
        );
        expect(() => checkChartOptions(grouped([{ name: "2024", categories: [{ name: "H1", categories: ["Q1"] }, "Q3"] }]))).to.throw(
            'Invalid category group "Q3"',
        );
    });

    it("should throw for groups of different depths, so every category has as many groups", () => {
        expect(() =>
            checkChartOptions(
                grouped([
                    { name: "2024", categories: ["Q1"] },
                    { name: "2025", categories: [{ name: "H1", categories: ["Q1"] }] },
                ]),
            ),
        ).to.throw("Invalid category groups. Every group at the same depth holds groups as deep, so every category has as many groups");
    });

    it("should throw for a category in a group that is a date, or isn't text or a finite number", () => {
        expect(() => checkChartOptions(grouped([{ name: "2024", categories: [new Date("2024-01-01")] }]))).to.throw(
            'Invalid category 2024-01-01T00:00:00.000Z in group "2024". Categories in groups are text or numbers, not dates',
        );
        expect(() => checkChartOptions(grouped([{ name: "2024", categories: [Number.NaN] }]))).to.throw(
            'Invalid category NaN in group "2024". Expected text or a finite number',
        );
        expect(() => checkChartOptions(grouped([{ name: "2024", categories: [null] }]))).to.throw('Invalid category null in group "2024"');
    });

    it("should throw for groups on a chart whose categories can't be in groups", () => {
        const groups = [{ name: "2024", categories: ["Q1"] }] as unknown as readonly string[];
        expect(() => checkChartOptions({ type: "pie", categories: groups, series: [{ name: "A", values: [1] }] })).to.throw(
            "Invalid categories. A pie chart's categories can't be in groups",
        );
        expect(() => checkChartOptions({ type: "radar", categories: groups, series: [{ name: "A", values: [1] }] })).to.throw(
            "Invalid categories. A radar chart's categories can't be in groups",
        );
        expect(() => checkChartOptions({ type: "stock", categories: groups, high: [2], low: [1], close: [1] })).to.throw(
            "Invalid categories. A stock chart's categories can't be in groups",
        );
        expect(() => checkChartOptions({ type: "pieOfPie", categories: groups, series: [{ name: "A", values: [1] }] })).to.throw(
            "Invalid categories. A pie of pie chart's categories can't be in groups",
        );
    });

    it("should throw for categories that aren't a list", () => {
        expect(() => checkChartOptions(grouped("Q1"))).to.throw('Invalid categories "Q1". Expected a list of them');
        expect(() => checkChartOptions(grouped(undefined))).to.throw("Invalid categories undefined");
    });
});

describe("checkChartOptions, for pulled-out slices", () => {
    const pie = (explosion: unknown, type: "pie" | "doughnut" | "pieOfPie" = "pie"): ChartRunOptions =>
        ({
            type,
            categories: ["A", "B"],
            series: [{ name: "S", values: [1, 2], explosion }],
        }) as ChartRunOptions;

    it("should take one amount for every slice, or one for each, from 0 to 400", () => {
        for (const explosion of [0, 25, 400, [], [undefined, 400], [0]]) {
            expect(() => checkChartOptions(pie(explosion)), JSON.stringify(explosion)).to.not.throw();
        }
        expect(() => checkChartOptions(pie(10, "doughnut"))).to.not.throw();
        expect(() => checkChartOptions(pie([10], "pieOfPie"))).to.not.throw();
    });

    it("should throw for an amount out of range, or more amounts than there are slices", () => {
        expect(() => checkChartOptions(pie(401))).to.throw('Invalid explosion of series "S" 401. Expected a number from 0 to 400');
        expect(() => checkChartOptions(pie(-1))).to.throw('Invalid explosion of series "S" -1');
        expect(() => checkChartOptions(pie(Number.NaN))).to.throw('Invalid explosion of series "S" NaN');
        expect(() => checkChartOptions(pie([undefined, 500]))).to.throw('Invalid explosion of series "S" 500');
        expect(() => checkChartOptions(pie([1, 2, 3]))).to.throw('Series "S" has 3 explosions, but there are 2 categories');
    });

    it("should throw for an amount that isn't a number or a list", () => {
        expect(() => checkChartOptions(pie("10"))).to.throw(
            'Invalid explosion "10" of series "S". Expected a percentage, or one for each slice',
        );
        expect(() => checkChartOptions(pie(null))).to.throw("Invalid explosion null");
        expect(() => checkChartOptions(pie(["10"]))).to.throw(
            'Invalid explosion "10" of series "S". Expected a percentage or undefined for each slice',
        );
        expect(() => checkChartOptions(pie([null]))).to.throw("Invalid explosion null");
    });
});

describe("checkChartOptions, for trendlines", () => {
    const withTrendlines = (trendlines: unknown, values: readonly (number | null)[] = [1, 2, 3, 4]): ChartRunOptions =>
        column({ categories: ["A", "B", "C", "D"], series: [{ name: "S", values, trendlines: trendlines as readonly [] }] });

    it("should take every type, with the options each has", () => {
        const trendlines = [
            { type: "linear", intercept: -3, forecastForward: 1, forecastBackward: 0.5, equation: true, rSquared: true, name: "Fit" },
            { type: "exponential", intercept: 2, equation: true, label: { numberFormat: "0.00", font: { size: 8 } } },
            { type: "logarithmic", rSquared: true },
            { type: "polynomial", order: 6, intercept: 0 },
            { type: "power", line: { color: "FF0000", width: 1, dash: "dash" } },
            { type: "movingAverage", period: 3 },
            { type: "movingAverage" },
        ];
        expect(() => checkChartOptions(withTrendlines(trendlines))).to.not.throw();
        expect(() => checkChartOptions(withTrendlines([]))).to.not.throw();
    });

    it("should throw for trendlines that aren't a list, or a type that isn't one", () => {
        expect(() => checkChartOptions(withTrendlines({ type: "linear" }))).to.throw(
            'Invalid trendlines [object Object] for series "S". Expected a list of them',
        );
        expect(() => checkChartOptions(withTrendlines([{ type: "straight" }]))).to.throw(
            'Invalid trendline type "straight" for series "S". Expected one of "linear", "exponential", "logarithmic", "polynomial", "power", "movingAverage"',
        );
        expect(() => checkChartOptions(withTrendlines([{}]))).to.throw("Invalid trendline type undefined");
        expect(() => checkChartOptions(withTrendlines([undefined]))).to.throw("Invalid trendline type undefined");
        expect(() => checkChartOptions(withTrendlines(["linear"]))).to.throw("Invalid trendline type undefined");
    });

    it("should throw for an order or period on a trendline without one, or out of range", () => {
        expect(() => checkChartOptions(withTrendlines([{ type: "linear", order: 2 }]))).to.throw(
            'Invalid option order for the linear trendline of series "S". Only a polynomial trendline has an order',
        );
        expect(() => checkChartOptions(withTrendlines([{ type: "linear", period: 2 }]))).to.throw(
            'Invalid option period for the linear trendline of series "S". Only a moving average has a period',
        );
        expect(() => checkChartOptions(withTrendlines([{ type: "polynomial", order: 7 }]))).to.throw(
            'Invalid order of the polynomial trendline of series "S" 7. Expected a whole number from 2 to 6',
        );
        expect(() => checkChartOptions(withTrendlines([{ type: "polynomial", order: 2.5 }]))).to.throw("Invalid order");
        expect(() => checkChartOptions(withTrendlines([{ type: "polynomial", order: 1 }]))).to.throw("Invalid order");
    });

    it("should throw for a moving average's period out of range, or longer than the series", () => {
        const period = (value: number, values?: readonly (number | null)[]): ChartRunOptions =>
            withTrendlines([{ type: "movingAverage", period: value }], values);
        expect(() => checkChartOptions(period(3))).to.not.throw();
        expect(() => checkChartOptions(period(4))).to.throw(
            `Invalid period 4 of the movingAverage trendline of series "S". Expected a whole number from 2 to one fewer than the series' 4 values`,
        );
        expect(() => checkChartOptions(period(1))).to.throw("Invalid period 1");
        expect(() => checkChartOptions(period(2.5))).to.throw("Invalid period 2.5");
        // Gaps aren't averaged
        expect(() => checkChartOptions(period(3, [1, null, 3, 4]))).to.throw("than the series' 3 values");
        expect(() => checkChartOptions(withTrendlines([{ type: "movingAverage" }], [1, null]))).to.throw("Invalid period 2");
    });

    it("should throw for what a moving average doesn't have", () => {
        for (const [option, value] of [
            ["forecastForward", 1],
            ["forecastBackward", 1],
            ["intercept", 1],
            ["equation", true],
            ["rSquared", false],
            ["label", {}],
        ] as const) {
            expect(() => checkChartOptions(withTrendlines([{ type: "movingAverage", [option]: value }])), option).to.throw(
                `Invalid option ${option} for the movingAverage trendline of series "S". A moving average has no equation, so it has none`,
            );
        }
    });

    it("should throw for a forecast that isn't a finite number of 0 or more", () => {
        for (const value of [-1, Number.NaN, Infinity, "1"]) {
            expect(() => checkChartOptions(withTrendlines([{ type: "linear", forecastForward: value }])), String(value)).to.throw(
                `Invalid forecastForward ${typeof value === "string" ? `"${value}"` : value} of the linear trendline of series "S". Expected a finite number of 0 or more`,
            );
        }
        expect(() => checkChartOptions(withTrendlines([{ type: "linear", forecastBackward: -0.5 }]))).to.throw(
            "Invalid forecastBackward -0.5",
        );
    });

    it("should throw for an intercept on a trendline without one, or that isn't a finite number, or 0 or less on an exponential", () => {
        for (const type of ["logarithmic", "power"]) {
            expect(() => checkChartOptions(withTrendlines([{ type, intercept: 1 }]))).to.throw(
                `Invalid option intercept for the ${type} trendline of series "S". Only linear, exponential and polynomial trendlines have one`,
            );
        }
        expect(() => checkChartOptions(withTrendlines([{ type: "linear", intercept: Infinity }]))).to.throw(
            'Invalid intercept Infinity of the linear trendline of series "S". Expected a finite number',
        );
        expect(() => checkChartOptions(withTrendlines([{ type: "exponential", intercept: 0 }]))).to.throw(
            'Invalid intercept 0 of the exponential trendline of series "S". Expected a finite number above 0',
        );
        expect(() => checkChartOptions(withTrendlines([{ type: "polynomial", intercept: -5 }]))).to.not.throw();
    });

    it("should throw for a label on a trendline showing neither its equation nor its R² value", () => {
        expect(() => checkChartOptions(withTrendlines([{ type: "linear", label: { numberFormat: "0" } }]))).to.throw(
            'Invalid option label for the linear trendline of series "S". It shows neither its equation nor its R² value',
        );
        expect(() => checkChartOptions(withTrendlines([{ type: "linear", equation: false, label: {} }]))).to.throw("Invalid option label");
        expect(() => checkChartOptions(withTrendlines([{ type: "linear", rSquared: true, label: { font: { size: 0 } } }]))).to.throw(
            "Invalid font size 0",
        );
    });

    it("should throw for a line out of range, or a name that isn't text", () => {
        expect(() => checkChartOptions(withTrendlines([{ type: "linear", line: { width: 1585 } }]))).to.throw("Invalid line width 1585");
        expect(() => checkChartOptions(withTrendlines([{ type: "linear", name: 5 }]))).to.throw(
            'Invalid name 5 of the linear trendline of series "S". Expected text',
        );
    });

    it("should throw for values an exponential, power or logarithmic trendline can't be fitted to", () => {
        expect(() => checkChartOptions(withTrendlines([{ type: "exponential" }], [1, 0, 3]))).to.throw(
            'Can\'t fit the exponential trendline of series "S" to the value 0. A exponential trendline needs values above 0',
        );
        expect(() => checkChartOptions(withTrendlines([{ type: "power" }], [1, -2]))).to.throw("to the value -2");
        // Gaps are left out
        expect(() => checkChartOptions(withTrendlines([{ type: "exponential" }], [1, null, 3]))).to.not.throw();
        // A chart with categories numbers them from 1, so a logarithmic trendline always fits
        expect(() => checkChartOptions(withTrendlines([{ type: "logarithmic" }], [-1, 0, 5]))).to.not.throw();
        const scatter = (type: string, points: readonly { readonly x: number; readonly y: number }[]): ChartRunOptions => ({
            type: "scatter",
            series: [{ name: "P", points, trendlines: [{ type: type as "linear" }] }],
        });
        expect(() =>
            checkChartOptions(
                scatter("logarithmic", [
                    { x: 0, y: 1 },
                    { x: 1, y: 1 },
                ]),
            ),
        ).to.throw('Can\'t fit the logarithmic trendline of series "P" to the x value 0. A logarithmic trendline needs x values above 0');
        expect(() => checkChartOptions(scatter("power", [{ x: -1, y: 1 }]))).to.throw("to the x value -1");
        expect(() => checkChartOptions(scatter("power", [{ x: 1, y: 0 }]))).to.throw("to the value 0");
        expect(() => checkChartOptions(scatter("exponential", [{ x: -5, y: 1 }]))).to.not.throw();
    });

    it("should throw for a trendline on a stacked series, but not on one drawn another way", () => {
        expect(() =>
            checkChartOptions(column({ stacking: "stacked", series: [{ name: "S", values: [1], trendlines: [{ type: "linear" }] }] })),
        ).to.throw('Invalid option trendlines for series "S". It is stacked, and a stacked series has no trendline');
        expect(() =>
            checkChartOptions(
                column({
                    stacking: "percent",
                    series: [
                        { name: "A", values: [1] },
                        { name: "S", values: [1], type: "line", trendlines: [{ type: "linear" }] },
                    ],
                }),
            ),
        ).to.not.throw();
    });

    it("should throw for trendlines and error bars on series of pie, doughnut and radar charts", () => {
        const series = { name: "S", values: [1] };
        for (const type of ["pie", "doughnut", "pieOfPie", "barOfPie"] as const) {
            expect(() =>
                checkChartOptions({
                    type,
                    categories: ["A"],
                    series: [{ ...series, trendlines: [{ type: "linear" }] }],
                } as unknown as ChartRunOptions),
            ).to.throw('Invalid option trendlines for series "S"');
            expect(() =>
                checkChartOptions({
                    type,
                    categories: ["A"],
                    series: [{ ...series, errorBars: { type: "standardError" } }],
                } as unknown as ChartRunOptions),
            ).to.throw('Invalid option errorBars for series "S"');
        }
        expect(() =>
            checkChartOptions({ type: "radar", categories: ["A"], series: [{ ...series, trendlines: [] }] } as unknown as ChartRunOptions),
        ).to.throw(`Invalid option trendlines for series "S". A radar chart's series have neither`);
    });

    it("should check the trendlines of scatter and bubble series", () => {
        expect(() =>
            checkChartOptions({
                type: "scatter",
                series: [{ name: "P", points: [{ x: 1, y: 1 }], trendlines: [{ type: "curve" as "linear" }] }],
            }),
        ).to.throw('Invalid trendline type "curve" for series "P"');
        expect(() =>
            checkChartOptions({
                type: "bubble",
                series: [{ name: "B", points: [{ x: 1, y: 1, size: 1 }], trendlines: [{ type: "movingAverage" }] }],
            }),
        ).to.throw('Invalid period 2 of the movingAverage trendline of series "B"');
    });
});

describe("checkChartOptions, for error bars", () => {
    const withErrorBars = (errorBars: unknown): ChartRunOptions =>
        column({ series: [{ name: "S", values: [1, 2, 3], errorBars: errorBars as { readonly type: "standardError" } }] });

    it("should take every type, with the options each has", () => {
        for (const errorBars of [
            { type: "fixed", value: 2, direction: "plus", endCaps: false, line: { width: 1 } },
            { type: "fixed", value: 0 },
            { type: "percentage", value: 5, direction: "minus" },
            { type: "standardDeviation" },
            { type: "standardDeviation", value: 2, direction: "both" },
            { type: "standardError" },
            { type: "custom", plus: [1, null, 2] },
            { type: "custom", minus: [] },
            { type: "custom", plus: [1], minus: [0, 0, 0] },
        ]) {
            expect(() => checkChartOptions(withErrorBars(errorBars)), JSON.stringify(errorBars)).to.not.throw();
        }
    });

    it("should throw for a type that isn't one", () => {
        expect(() => checkChartOptions(withErrorBars({ type: "range" }))).to.throw(
            'Invalid error bars type "range" for series "S". Expected one of "fixed", "percentage", "standardDeviation", "standardError", "custom"',
        );
        expect(() => checkChartOptions(withErrorBars({}))).to.throw("Invalid error bars type undefined");
        expect(() => checkChartOptions(withErrorBars(5))).to.throw("Invalid error bars type undefined");
        expect(() => checkChartOptions(withErrorBars(null))).to.throw("Invalid error bars type undefined");
    });

    it("should throw for a fixed or percentage amount that is missing, or isn't a finite number of 0 or more", () => {
        expect(() => checkChartOptions(withErrorBars({ type: "fixed" }))).to.throw('The fixed the error bars of series "S" need a value');
        expect(() => checkChartOptions(withErrorBars({ type: "percentage" }))).to.throw("need a value");
        for (const value of [-1, Number.NaN, Infinity, "5"]) {
            expect(() => checkChartOptions(withErrorBars({ type: "fixed", value })), String(value)).to.throw(
                `Invalid value ${typeof value === "string" ? `"${value}"` : value} of the error bars of series "S". Expected a finite number of 0 or more`,
            );
        }
        expect(() => checkChartOptions(withErrorBars({ type: "standardDeviation", value: -2 }))).to.throw("Invalid value -2");
    });

    it("should throw for an amount of the standard error", () => {
        expect(() => checkChartOptions(withErrorBars({ type: "standardError", value: 1 }))).to.throw(
            'Invalid option value for the error bars of series "S". The standard error has no amount',
        );
    });

    it("should throw for a direction that isn't one, or on custom error bars", () => {
        expect(() => checkChartOptions(withErrorBars({ type: "fixed", value: 1, direction: "up" }))).to.throw(
            'Invalid direction "up" of the error bars of series "S". Expected "both", "plus" or "minus"',
        );
        expect(() => checkChartOptions(withErrorBars({ type: "custom", plus: [1], direction: "plus" }))).to.throw(
            'Invalid option direction for the error bars of series "S". Custom error bars go the ways their plus and minus amounts are given',
        );
    });

    it("should throw for custom error bars without amounts, with more amounts than points, or amounts that aren't 0 or more", () => {
        expect(() => checkChartOptions(withErrorBars({ type: "custom" }))).to.throw(
            'Custom the error bars of series "S" need plus or minus amounts, or both',
        );
        expect(() => checkChartOptions(withErrorBars({ type: "custom", plus: [1, 2, 3, 4] }))).to.throw(
            'The error bars of series "S" have 4 plus amounts, but there are 3 points',
        );
        expect(() => checkChartOptions(withErrorBars({ type: "custom", minus: 1 }))).to.throw(
            'Invalid minus amounts 1 of the error bars of series "S". Expected one for each point',
        );
        for (const amount of [-1, Number.NaN, Infinity, "1", undefined]) {
            expect(() => checkChartOptions(withErrorBars({ type: "custom", plus: [1, amount] })), String(amount)).to.throw(
                `Invalid plus amount ${typeof amount === "string" ? `"${amount}"` : amount} of the error bars of series "S". Expected a finite number of 0 or more, or null`,
            );
        }
    });

    it("should throw for a line out of range", () => {
        expect(() => checkChartOptions(withErrorBars({ type: "standardError", line: { width: -1 } }))).to.throw("Invalid line width -1");
    });

    it("should check a scatter or bubble series' x and y error bars, against its points", () => {
        const points = [
            { x: 1, y: 1, size: 1 },
            { x: 2, y: 2, size: 1 },
        ];
        expect(() =>
            checkChartOptions({ type: "scatter", series: [{ name: "P", points, xErrorBars: { type: "custom", plus: [1, 2, 3] } }] }),
        ).to.throw('The x error bars of series "P" have 3 plus amounts, but there are 2 points');
        expect(() =>
            checkChartOptions({ type: "bubble", series: [{ name: "B", points, yErrorBars: { type: "fixed", value: -1 } }] }),
        ).to.throw('Invalid value -1 of the y error bars of series "B"');
        expect(() =>
            checkChartOptions({
                type: "bubble",
                series: [{ name: "B", points, xErrorBars: { type: "standardError" }, yErrorBars: { type: "custom", minus: [1, 1] } }],
            }),
        ).to.not.throw();
    });
});

describe("checkChartOptions, for data tables and empty values", () => {
    it("should take a data table on column, bar, line, area and stock charts", () => {
        expect(() => checkChartOptions(column({ dataTable: true }))).to.not.throw();
        expect(() => checkChartOptions(column({ dataTable: false }))).to.not.throw();
        expect(() => checkChartOptions(column({ dataTable: { legendKeys: false, font: { size: 8 } } }))).to.not.throw();
        expect(() =>
            checkChartOptions({ type: "stock", categories: ["A"], high: [2], low: [1], close: [1], dataTable: true }),
        ).to.not.throw();
    });

    it("should throw for a data table's font out of range, or a data table on another type", () => {
        expect(() => checkChartOptions(column({ dataTable: { font: { size: 5000 } } }))).to.throw("Invalid font size 5000");
        const pie = { categories: ["A"], series: [{ name: "S", values: [1] }], dataTable: true };
        expect(() => checkChartOptions({ type: "pie", ...pie } as ChartRunOptions)).to.throw(
            "Invalid option dataTable. A pie chart has no data table. Column, bar, line, area and stock charts have one",
        );
        expect(() => checkChartOptions({ type: "barOfPie", ...pie } as ChartRunOptions)).to.throw("A bar of pie chart has no data table");
        expect(() => checkChartOptions({ type: "radar", ...pie } as ChartRunOptions)).to.throw("A radar chart has no data table");
        const points = { series: [{ name: "S", points: [{ x: 1, y: 1, size: 1 }] }], dataTable: true };
        expect(() => checkChartOptions({ type: "scatter", ...points } as ChartRunOptions)).to.throw("A scatter chart has no data table");
        expect(() => checkChartOptions({ type: "bubble", ...points } as ChartRunOptions)).to.throw("A bubble chart has no data table");
    });

    it("should take gaps, zero or a line joining the points either side for empty values", () => {
        for (const emptyValues of ["gap", "zero", "connect"] as const) {
            expect(() => checkChartOptions(column({ emptyValues }))).to.not.throw();
            expect(() =>
                checkChartOptions({ type: "radar", categories: ["A"], series: [{ name: "S", values: [null] }], emptyValues }),
            ).to.not.throw();
        }
    });

    it("should throw for another way to draw empty values, or empty values on a chart without them", () => {
        expect(() => checkChartOptions(column({ emptyValues: "span" as "gap" }))).to.throw(
            'Invalid option emptyValues "span". Expected "gap", "zero" or "connect"',
        );
        expect(() =>
            checkChartOptions({
                type: "doughnut",
                categories: ["A"],
                series: [{ name: "S", values: [1] }],
                emptyValues: "zero",
            } as ChartRunOptions),
        ).to.throw("Invalid option emptyValues. A doughnut chart leaves out the slice of an empty value");
        expect(() =>
            checkChartOptions({
                type: "scatter",
                series: [{ name: "S", points: [{ x: 1, y: 1 }] }],
                emptyValues: "gap",
            } as ChartRunOptions),
        ).to.throw("Invalid option emptyValues. A scatter chart's points have no empty values");
        expect(() =>
            checkChartOptions({
                type: "bubble",
                series: [{ name: "S", points: [{ x: 1, y: 1, size: 1 }] }],
                emptyValues: "gap",
            } as ChartRunOptions),
        ).to.throw("A bubble chart's points have no empty values");
    });
});

describe("checkChartOptions, for hidden legend entries", () => {
    it("should take the text of any of the legend's entries: series, trendlines, or a pie's categories", () => {
        expect(() =>
            checkChartOptions(
                column({
                    series: [
                        { name: "A", values: [1], trendlines: [{ type: "linear" }, { type: "movingAverage", period: 2, name: "Smooth" }] },
                        { name: "B", values: [1, 2, 3] },
                    ],
                    legend: { hiddenEntries: ["B", "Linear (A)"] },
                }),
            ),
        ).to.throw("Invalid period 2");
        expect(() =>
            checkChartOptions(
                column({
                    series: [
                        { name: "A", values: [1, 2, 3], trendlines: [{ type: "linear" }, { type: "movingAverage", name: "Smooth" }] },
                        { name: "B", values: [1, 2, 3] },
                    ],
                    legend: { hiddenEntries: ["B", "Linear (A)", "Smooth"] },
                }),
            ),
        ).to.not.throw();
        expect(() =>
            checkChartOptions({
                type: "pie",
                categories: ["North", 2025],
                series: [{ name: "S", values: [1, 2] }],
                legend: { hiddenEntries: [2025, "North"] },
            }),
        ).to.not.throw();
        expect(() =>
            checkChartOptions({ type: "stock", categories: ["A"], high: [2], low: [1], close: [1], legend: { hiddenEntries: ["Close"] } }),
        ).to.not.throw();
        expect(() => checkChartOptions(column({ legend: { hiddenEntries: [] } }))).to.not.throw();
    });

    it("should throw for text that isn't an entry's, listing the entries", () => {
        expect(() => checkChartOptions(column({ legend: { hiddenEntries: ["2024"] } }))).to.throw(
            'Invalid hidden legend entry "2024". The legend\'s entries are "2025"',
        );
        expect(() =>
            checkChartOptions(
                column({
                    series: [
                        { name: "A", values: [1, 2], trendlines: [{ type: "polynomial" }] },
                        { name: "B", values: [1] },
                    ],
                    legend: { hiddenEntries: ["C"] },
                }),
            ),
        ).to.throw('Invalid hidden legend entry "C". The legend\'s entries are "A", "B" and "Poly. (A)"');
        // A pie's legend is its categories, not its series
        expect(() =>
            checkChartOptions({
                type: "pie",
                categories: ["X", "Y"],
                series: [{ name: "S", values: [1, 2] }],
                legend: { hiddenEntries: ["S"] },
            }),
        ).to.throw('The legend\'s entries are "X" and "Y"');
        expect(() =>
            checkChartOptions({
                type: "stock",
                categories: ["A"],
                open: [1],
                high: [2],
                low: [1],
                close: [1],
                legend: { hiddenEntries: ["Volume"] },
            }),
        ).to.throw('The legend\'s entries are "Open", "High", "Low" and "Close"');
    });

    it("should throw for hidden entries that aren't a list", () => {
        expect(() => checkChartOptions(column({ legend: { hiddenEntries: "2025" as unknown as readonly string[] } }))).to.throw(
            'Invalid hidden legend entries "2025". Expected a list of the entries\' text',
        );
    });
});

describe("checkChartOptions, for pie of pie and bar of pie charts", () => {
    const split = (options: object = {}): ChartRunOptions =>
        ({
            type: "pieOfPie",
            categories: ["A", "B", "C", 4],
            series: [{ name: "S", values: [4, 3, 2, 1] }],
            ...options,
        }) as ChartRunOptions;

    it("should take every way to split, and the second plot's size, gap and lines", () => {
        for (const option of [
            { split: { by: "position", count: 1 } },
            { split: { by: "position", count: 4 } },
            { split: { by: "value", lessThan: 2.5 } },
            { split: { by: "value", lessThan: -1 } },
            { split: { by: "percentage", lessThan: 0 } },
            { split: { by: "percentage", lessThan: 100 } },
            { split: { by: "categories", categories: ["B", 4, "4"] } },
            { secondPlotSize: 5, gapWidth: 0, seriesLines: { width: 1 } },
            { secondPlotSize: 200, gapWidth: 500 },
            { type: "barOfPie" },
        ]) {
            expect(() => checkChartOptions(split(option)), JSON.stringify(option)).to.not.throw();
        }
    });

    it("should throw for a split by position without a count, or one that isn't a whole number from 1 to the categories", () => {
        expect(() => checkChartOptions(split({ split: { by: "position" } }))).to.throw(
            "Invalid split. Splitting by position needs the count of the last categories that go to the second plot",
        );
        for (const count of [0, 5, 1.5, Number.NaN]) {
            expect(() => checkChartOptions(split({ split: { by: "position", count } })), String(count)).to.throw(
                `Invalid split count ${count}. Expected a whole number from 1 to 4`,
            );
        }
    });

    it("should throw for a split by value or percentage that isn't a finite number, or a percentage out of range", () => {
        expect(() => checkChartOptions(split({ split: { by: "value" } }))).to.throw(
            "Invalid split value undefined. Expected a finite number",
        );
        expect(() => checkChartOptions(split({ split: { by: "value", lessThan: "5" } }))).to.throw('Invalid split value "5"');
        expect(() => checkChartOptions(split({ split: { by: "percentage", lessThan: Infinity } }))).to.throw(
            "Invalid split percentage Infinity. Expected a finite number",
        );
        expect(() => checkChartOptions(split({ split: { by: "percentage", lessThan: 101 } }))).to.throw(
            "Invalid split percentage 101. Expected a number from 0 to 100",
        );
    });

    it("should throw for a split by categories without any, or with one the chart doesn't have", () => {
        expect(() => checkChartOptions(split({ split: { by: "categories", categories: [] } }))).to.throw(
            "Invalid split. Splitting by categories needs at least one category for the second plot",
        );
        expect(() => checkChartOptions(split({ split: { by: "categories" } }))).to.throw("Splitting by categories needs at least one");
        expect(() => checkChartOptions(split({ split: { by: "categories", categories: ["B", "Z"] } }))).to.throw(
            `Invalid split category "Z". It isn't one of the chart's categories`,
        );
    });

    it("should throw for a split by something else", () => {
        expect(() => checkChartOptions(split({ split: { by: "size", count: 2 } }))).to.throw(
            'Invalid split "size". Expected { by: "position", "value", "percentage" or "categories", ... }',
        );
        expect(() => checkChartOptions(split({ split: 3 }))).to.throw("Invalid split undefined");
        expect(() => checkChartOptions(split({ split: null }))).to.throw("Invalid split undefined");
    });

    it("should throw for a second plot's size, gap or lines out of range, or a first slice angle", () => {
        expect(() => checkChartOptions(split({ secondPlotSize: 4 }))).to.throw(
            "Invalid second plot size 4. Expected a number from 5 to 200",
        );
        expect(() => checkChartOptions(split({ gapWidth: 501 }))).to.throw("Invalid gap width 501. Expected a number from 0 to 500");
        expect(() => checkChartOptions(split({ seriesLines: { width: 2000 } }))).to.throw("Invalid line width 2000");
        expect(() => checkChartOptions(split({ firstSliceAngle: 90 }))).to.throw(
            "Invalid option firstSliceAngle. A pie of pie or bar of pie chart's first slice always starts at 12 o'clock",
        );
    });

    it("should check the series as a pie chart's", () => {
        expect(() =>
            checkChartOptions(
                split({
                    series: [
                        { name: "A", values: [1] },
                        { name: "B", values: [1] },
                    ],
                }),
            ),
        ).to.throw("A pie of pie chart has one series, but 2 were given. A doughnut chart can have more");
        expect(() => checkChartOptions(split({ type: "barOfPie", series: [{ name: "S", values: [1, -1] }] }))).to.throw(
            `Invalid value -1 in series "S". A bar of pie chart's values can't be negative`,
        );
        expect(() => checkChartOptions(split({ categories: [new Date("2025-01-01")] }))).to.throw("Invalid category");
        expect(() => checkChartOptions(split({ series: [] }))).to.throw("A chart needs at least one series");
    });
});

describe("checkChartOptions, for stock charts", () => {
    const stock = (options: object = {}): ChartRunOptions =>
        ({
            type: "stock",
            categories: ["Mon", "Tue", "Wed"],
            high: [12, 13, 14],
            low: [10, 11, 12],
            close: [11, 12, 13],
            ...options,
        }) as ChartRunOptions;

    it("should take prices, opening prices and volumes, with gaps, and the options each has", () => {
        expect(() => checkChartOptions(stock())).to.not.throw();
        expect(() =>
            checkChartOptions(
                stock({
                    categories: [new Date("2025-01-06"), new Date("2025-01-07"), new Date("2025-01-08")],
                    open: [10, 13, null],
                    volume: [0, 5, 10],
                    high: [12, 13, null],
                    close: [12, null, 13],
                    names: { volume: "Vol.", close: "Last" },
                    upBars: { fill: "00FF00", border: "none" },
                    downBars: { fill: "none", border: { width: 2 } },
                    highLowLines: { dash: "dash" },
                    valueAxis: { minimum: 5, crossesAt: 1 },
                    volumeAxis: { displayUnits: "thousands" },
                    categoryAxis: { numberFormat: "d mmm" },
                    emptyValues: "zero",
                    legend: false,
                }),
            ),
        ).to.not.throw();
        // Values can be fewer than the categories
        expect(() => checkChartOptions(stock({ high: [12], low: [10], close: [] }))).to.not.throw();
    });

    it("should throw for missing prices, series, or no categories", () => {
        for (const role of ["high", "low", "close"]) {
            expect(() => checkChartOptions(stock({ [role]: undefined })), role).to.throw(`A stock chart needs its ${role} prices`);
        }
        expect(() => checkChartOptions(stock({ series: [{ name: "Open", values: [1] }] }))).to.throw(
            "Invalid option series. A stock chart's data is its high, low and close, and its open and volume if given",
        );
        expect(() => checkChartOptions(stock({ categories: [] }))).to.throw("A chart needs at least one category");
    });

    it("should throw for prices that aren't a list, or a value that isn't a finite number or null, or too many", () => {
        expect(() => checkChartOptions(stock({ open: 5 }))).to.throw("Invalid open 5. Expected a value for each category");
        expect(() => checkChartOptions(stock({ high: [12, Number.NaN, 14] }))).to.throw(
            'Invalid value NaN in series "High". Expected a finite number or null',
        );
        expect(() => checkChartOptions(stock({ close: [11, 12, 13, 14] }))).to.throw(
            'Series "Close" has 4 values, but there are 3 categories',
        );
        expect(() => checkChartOptions(stock({ volume: [1, "2", 3] }))).to.throw('Invalid value "2" in series "Volume"');
    });

    it("should throw for a name that isn't text", () => {
        expect(() => checkChartOptions(stock({ names: { high: 5 } }))).to.throw("Invalid name 5 of the high series. Expected text");
    });

    it("should throw for a high below its low, or an open or close outside them", () => {
        expect(() => checkChartOptions(stock({ high: [10, 13, 14], low: [12, 11, 12] }))).to.throw(
            'The high 10 of "Mon" is below its low 12',
        );
        expect(() => checkChartOptions(stock({ close: [11, 14, 13] }))).to.throw(
            `The close 14 of "Tue" isn't between its low 11 and its high 13`,
        );
        expect(() => checkChartOptions(stock({ open: [11, 12, 11] }))).to.throw(
            `The open 11 of "Wed" isn't between its low 12 and its high 14`,
        );
        expect(() => checkChartOptions(stock({ categories: [new Date("2025-01-06")], high: [1], low: [2], close: [1] }))).to.throw(
            'The high 1 of "2025-01-06" is below its low 2',
        );
        expect(() => checkChartOptions(stock({ categories: [5, 6, 7], high: [12, 10] }))).to.throw("The high 10 of 6 is below its low 11");
        // A high or low left out isn't compared
        expect(() => checkChartOptions(stock({ high: [null, 13, 14], close: [50, 12, 13] }))).to.not.throw();
    });

    it("should throw for negative volumes", () => {
        expect(() => checkChartOptions(stock({ volume: [1, -2, 3] }))).to.throw("Invalid volume -2. Volumes can't be negative");
    });

    it("should throw for up or down bars without opening prices, or a volume axis without volumes", () => {
        expect(() => checkChartOptions(stock({ upBars: { fill: "00FF00" } }))).to.throw(
            "Invalid option upBars. The chart has no opening prices, so no bars from the open to the close",
        );
        expect(() => checkChartOptions(stock({ downBars: {} }))).to.throw("Invalid option downBars");
        expect(() => checkChartOptions(stock({ volumeAxis: {} }))).to.throw("Invalid option volumeAxis. The chart has no volumes");
    });

    it("should check the axes, lines and bars, and take a category's number for where an axis crosses its dates", () => {
        expect(() => checkChartOptions(stock({ valueAxis: { interval: 0 } }))).to.throw("Invalid value axis interval 0");
        expect(() => checkChartOptions(stock({ volume: [1, 2, 3], volumeAxis: { minimum: 5, maximum: 1 } }))).to.throw(
            "Invalid volume axis range from 5 to 1",
        );
        expect(() => checkChartOptions(stock({ categoryAxis: { labelRotation: 100 } }))).to.throw(
            "Invalid category axis label rotation 100",
        );
        expect(() =>
            checkChartOptions(
                stock({
                    categories: [new Date("2025-01-06")],
                    high: [1],
                    low: [1],
                    close: [1],
                    valueAxis: { crossesAt: new Date("2025-01-06") },
                }),
            ),
        ).to.throw("A date is only for a value axis crossing categories that are dates");
        expect(() => checkChartOptions(stock({ highLowLines: { width: -1 } }))).to.throw("Invalid line width -1");
        expect(() => checkChartOptions(stock({ open: [11, 12, 13], upBars: { border: { width: 2000 } } }))).to.throw(
            "Invalid line width 2000",
        );
        expect(() => checkChartOptions(stock({ title: { text: "T", font: { size: 0 } } }))).to.throw("Invalid font size 0");
    });
});
