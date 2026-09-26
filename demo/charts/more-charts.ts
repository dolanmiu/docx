// Stock charts, pie of pie and bar of pie charts, categories in groups, trendlines and error bars, the labels of single
// points, slices pulled out of a pie, hidden legend entries, a data table, and a line joined across an empty value.
// See docs/usage/charts.md.

import * as fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { ChartRun } from "docx/charts";

const heading = (text: string): Paragraph => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });

const chart = (run: ChartRun): Paragraph => new Paragraph({ children: [run] });

// Two weeks of trading days, without the weekend between them
const days = [6, 7, 8, 9, 10, 13, 14, 15, 16, 17].map((day) => new Date(Date.UTC(2025, 0, day)));
const prices = {
    open: [101.2, 102.5, 104.1, 103.0, 101.8, 103.5, 105.2, 106.8, 105.9, 107.4],
    high: [103.1, 104.8, 105.0, 103.6, 104.2, 105.9, 107.3, 107.5, 108.1, 109.6],
    low: [100.4, 101.9, 102.6, 100.9, 101.1, 102.8, 104.6, 105.1, 105.2, 106.9],
    close: [102.4, 104.2, 102.9, 101.5, 103.7, 105.4, 106.9, 105.6, 107.8, 109.1],
};

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("More charts")] }),

                heading("Stock charts"),
                chart(
                    new ChartRun({
                        type: "stock",
                        title: "High-low-close",
                        categories: days,
                        high: prices.high,
                        low: prices.low,
                        close: prices.close,
                        valueAxis: { minimum: 98, numberFormat: "0" },
                        categoryAxis: { numberFormat: "d mmm" },
                        legend: false,
                        transformation: { width: 576, height: 240 },
                    }),
                ),
                chart(
                    new ChartRun({
                        type: "stock",
                        title: "Volume-open-high-low-close",
                        categories: days,
                        volume: [18200, 21500, 26400, 19800, 22100, 17300, 24800, 28100, 20400, 25900],
                        ...prices,
                        upBars: { fill: "70AD47" },
                        downBars: { fill: "C00000" },
                        valueAxis: { minimum: 90, maximum: 112, numberFormat: "0" },
                        volumeAxis: { maximum: 60000, displayUnits: "thousands" },
                        categoryAxis: { numberFormat: "d mmm" },
                        transformation: { width: 576, height: 280 },
                    }),
                ),

                heading("Pie of pie and bar of pie"),
                chart(
                    new ChartRun({
                        type: "pieOfPie",
                        title: "Spending",
                        categories: ["Rent", "Food", "Travel", "Books", "Games", "Music"],
                        series: [{ name: "Spending", values: [1200, 450, 180, 60, 45, 30] }],
                        dataLabels: { percentage: true, numberFormat: "0%" },
                        split: { by: "position", count: 3 },
                        transformation: { width: 576, height: 260 },
                    }),
                ),
                chart(
                    new ChartRun({
                        type: "barOfPie",
                        title: "Visitors by country",
                        categories: ["UK", "US", "France", "Spain", "Italy"],
                        series: [{ name: "Visitors", values: [5400, 3200, 900, 700, 400] }],
                        split: { by: "position", count: 3 },
                        secondPlotSize: 60,
                        transformation: { width: 576, height: 260 },
                    }),
                ),

                heading("Categories in groups"),
                chart(
                    new ChartRun({
                        type: "column",
                        title: "Sales by quarter",
                        categories: [
                            { name: "2024", categories: ["Q1", "Q2", "Q3", "Q4"] },
                            { name: "2025", categories: ["Q1", "Q2", "Q3"] },
                        ],
                        series: [
                            { name: "North", values: [120, 135, 150, 170, 160, 180, 175] },
                            { name: "South", values: [90, 110, 105, 130, 125, 140, 150] },
                        ],
                        transformation: { width: 576, height: 280 },
                    }),
                ),

                heading("Trendlines and error bars"),
                chart(
                    new ChartRun({
                        type: "scatter",
                        title: "Growth",
                        series: [
                            {
                                name: "Height",
                                points: [
                                    { x: 1, y: 2.1 },
                                    { x: 2, y: 3.9 },
                                    { x: 3, y: 8.2 },
                                    { x: 4, y: 15.4 },
                                    { x: 5, y: 31.8 },
                                ],
                                trendlines: [{ type: "exponential", equation: true, rSquared: true, label: { numberFormat: "0.000" } }],
                                yErrorBars: { type: "percentage", value: 10 },
                            },
                        ],
                        xAxis: { title: "Week" },
                        yAxis: { title: "Height (cm)" },
                        transformation: { width: 576, height: 280 },
                    }),
                ),
                chart(
                    new ChartRun({
                        type: "column",
                        title: "Test scores",
                        categories: ["Class A", "Class B", "Class C", "Class D"],
                        series: [
                            {
                                name: "Average",
                                values: [72, 65, 81, 77],
                                errorBars: { type: "custom", plus: [6, 9, 4, 5], minus: [5, 8, 6, 4] },
                                trendlines: [{ type: "movingAverage", period: 2, name: "Two-class average" }],
                            },
                        ],
                        valueAxis: { minimum: 0, maximum: 100 },
                        transformation: { width: 576, height: 260 },
                    }),
                ),

                heading("Labels of single points, pulled-out slices and hidden legend entries"),
                chart(
                    new ChartRun({
                        type: "line",
                        title: "Visitors",
                        categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                        series: [
                            {
                                name: "Visitors",
                                values: [320, 410, null, 380, 460, 610, 580],
                                markers: true,
                                pointLabels: [undefined, undefined, undefined, undefined, undefined, { text: "Record", position: "above" }],
                            },
                            { name: "Target", values: [400, 400, 400, 400, 400, 400, 400], line: { dash: "dash", width: 1.5 } },
                        ],
                        // Wednesday's count is missing, and the line runs from Tuesday to Thursday
                        emptyValues: "connect",
                        legend: { hiddenEntries: ["Target"] },
                        transformation: { width: 576, height: 260 },
                    }),
                ),
                chart(
                    new ChartRun({
                        type: "pie",
                        title: "Share",
                        categories: ["North", "South", "East", "West"],
                        series: [
                            {
                                name: "Share",
                                values: [42, 28, 18, 12],
                                explosion: [undefined, undefined, undefined, 20],
                                pointLabels: [
                                    undefined,
                                    undefined,
                                    undefined,
                                    { category: true, percentage: true, position: "outsideEnd" },
                                ],
                            },
                        ],
                        transformation: { width: 576, height: 260 },
                    }),
                ),

                heading("A data table"),
                chart(
                    new ChartRun({
                        type: "column",
                        title: "Rainfall (mm)",
                        categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                        series: [
                            { name: "2024", values: [78, 52, 61, 45, 50, 41] },
                            { name: "2025", values: [83, 60, 49, 52, 38, 44] },
                        ],
                        dataTable: true,
                        legend: false,
                        transformation: { width: 576, height: 300 },
                    }),
                ),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
