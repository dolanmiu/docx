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
                `Invalid value ${value} in series "Bad". Expected a finite number or null`,
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
        ).to.throw("Invalid category Wed Jan 01 2025");
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
