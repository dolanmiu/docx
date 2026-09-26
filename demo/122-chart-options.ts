// More from native Word charts: combo charts with a secondary axis, dates, axes in reverse and on a logarithmic scale,
// display units, label positions and number formats, bars of their own colour, markers and dashed lines, fonts and
// fills, and radar and bubble charts. Each chart without a description is described for screen readers from its data.
// See docs/usage/charts.md.

import * as fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { ChartRun } from "docx/charts";

const heading = (text: string): Paragraph => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });

const chart = (run: ChartRun): Paragraph => new Paragraph({ children: [run] });

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Chart options")] }),

                heading("Combo, with a secondary axis"),
                chart(
                    new ChartRun({
                        type: "column",
                        title: "Sales and growth",
                        categories: months,
                        series: [
                            { name: "Sales", values: [120, 135, 150, 170, 160, 180] },
                            { name: "Target", values: [130, 140, 150, 160, 170, 180], type: "line", line: { dash: "dash", width: 1.5 } },
                            {
                                name: "Growth",
                                values: [4, 12.5, 11.1, 13.3, -5.9, 12.5],
                                type: "line",
                                axis: "secondary",
                                markers: { shape: "diamond", size: 7 },
                            },
                        ],
                        valueAxis: { title: "Units", minimum: 0 },
                        secondaryValueAxis: { title: "Growth (%)", numberFormat: "0" },
                        transformation: { width: 576, height: 300 },
                    }),
                ),

                heading("Dates"),
                chart(
                    new ChartRun({
                        type: "line",
                        title: "Sign-ups",
                        categories: [
                            new Date("2025-01-01"),
                            new Date("2025-02-01"),
                            new Date("2025-03-01"),
                            new Date("2025-05-01"),
                            new Date("2025-08-01"),
                            new Date("2025-09-01"),
                        ],
                        series: [{ name: "Sign-ups", values: [320, 410, 380, 520, 610, 700], smooth: true }],
                        markers: { shape: "circle", size: 6 },
                        dataLabels: { value: true, position: "above", numberFormat: "#,##0" },
                        categoryAxis: { numberFormat: "mmm", labelRotation: 0 },
                        legend: false,
                        transformation: { width: 576, height: 260 },
                    }),
                ),

                heading("Axes: reverse order, display units and label rotation"),
                chart(
                    new ChartRun({
                        type: "bar",
                        title: "Revenue by region",
                        categories: ["North", "South", "East", "West", "Central"],
                        series: [{ name: "Revenue", values: [1250000, 980000, 1430000, 760000, 1105000] }],
                        // The first region at the top, and the values along the bottom
                        categoryAxis: { reverseOrder: true },
                        valueAxis: { crossesAt: "maximum", displayUnits: "thousands", numberFormat: "#,##0", labelRotation: -45 },
                        legend: false,
                        transformation: { width: 576, height: 260 },
                    }),
                ),

                heading("Logarithmic scale"),
                chart(
                    new ChartRun({
                        type: "line",
                        title: "Users",
                        categories: [2019, 2020, 2021, 2022, 2023, 2024, 2025],
                        series: [{ name: "Users", values: [12, 95, 610, 4800, 31000, 240000, 1900000] }],
                        markers: true,
                        valueAxis: { logarithmicBase: 10, minimum: 1, numberFormat: "#,##0" },
                        legend: false,
                        transformation: { width: 576, height: 260 },
                    }),
                ),

                heading("Labels and colours"),
                chart(
                    new ChartRun({
                        type: "column",
                        title: "Tickets closed",
                        categories: ["Ana", "Ben", "Cai", "Dee", "Eli"],
                        series: [
                            {
                                name: "Tickets",
                                values: [42, 57, 38, 71, 49],
                                // The most, in green
                                colors: [undefined, undefined, undefined, "70AD47"],
                                dataLabels: { value: true, position: "insideEnd", font: { color: "FFFFFF", bold: true } },
                            },
                        ],
                        gapWidth: 80,
                        legend: false,
                        valueAxis: { visible: false, gridlines: false },
                        transformation: { width: 576, height: 240 },
                    }),
                ),

                heading("Fonts and fills"),
                chart(
                    new ChartRun({
                        type: "area",
                        title: { text: "Rainfall", font: { size: 18, bold: true, color: { theme: "accent1", darker: 25 } } },
                        font: { name: "Georgia" },
                        categories: months,
                        series: [
                            { name: "2024", values: [78, 62, 55, 41, 30, 18] },
                            { name: "2025", values: [70, 66, 48, 45, 22, 25] },
                        ],
                        legend: { position: "top", font: { italics: true } },
                        valueAxis: { title: "mm", font: { size: 8 } },
                        chartArea: { fill: "F7F9FC", border: { color: { theme: "accent1" }, width: 1.5 } },
                        plotArea: { fill: "FFFFFF" },
                        transformation: { width: 576, height: 260 },
                    }),
                ),

                heading("Radar"),
                chart(
                    new ChartRun({
                        type: "radar",
                        title: "Skills",
                        categories: ["Speed", "Strength", "Range", "Stamina", "Skill"],
                        series: [
                            { name: "Alice", values: [4, 3, 5, 2, 4] },
                            { name: "Bob", values: [3, 5, 2, 4, 3], markers: { shape: "square" } },
                        ],
                        markers: true,
                        valueAxis: { minimum: 0, maximum: 5, interval: 1 },
                        legend: { position: "right" },
                        transformation: { width: 576, height: 300 },
                    }),
                ),

                heading("Bubble"),
                chart(
                    new ChartRun({
                        type: "bubble",
                        title: "Markets",
                        series: [
                            {
                                name: "Europe",
                                points: [
                                    { x: 12, y: 4.5, size: 740 },
                                    { x: 18, y: 3.1, size: 330 },
                                ],
                            },
                            {
                                name: "Asia",
                                points: [
                                    { x: 24, y: 6.8, size: 1400 },
                                    { x: 9, y: 5.2, size: 280 },
                                ],
                            },
                        ],
                        bubbleScale: 60,
                        xAxis: { title: "Market share (%)", minimum: 0, maximum: 30 },
                        yAxis: { title: "Growth (%)", minimum: 0, maximum: 8 },
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
