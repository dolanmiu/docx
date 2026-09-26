// Native Word charts: one of each type, drawn by Word from their data in the document's theme, with the data in an
// embedded workbook that Word's "Edit Data" opens. A small line chart is in the header, two charts are side by side in a
// table, and one floats beside its text.
// See docs/usage/charts.md.

import * as fs from "fs";
import {
    AlignmentType,
    BorderStyle,
    Document,
    Header,
    HeadingLevel,
    HorizontalPositionAlign,
    HorizontalPositionRelativeFrom,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    TextWrappingSide,
    TextWrappingType,
    VerticalPositionRelativeFrom,
    WidthType,
} from "docx";
import { ChartRun } from "docx/charts";

const heading = (text: string): Paragraph => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });

const quarters = ["Q1", "Q2", "Q3", "Q4"];

const noBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

const doc = new Document({
    sections: [
        {
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                                new TextRun("Visitors this year  "),
                                // A chart with no title, legend or axes, as small as a word
                                new ChartRun({
                                    type: "line",
                                    categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                                    series: [{ name: "Visitors", values: [12, 15, 14, 18, 22, 21, 25, 24, 28, 27, 31, 35] }],
                                    legend: false,
                                    categoryAxis: { visible: false },
                                    valueAxis: { visible: false, gridlines: false },
                                    transformation: { width: 144, height: 48 },
                                    altText: {
                                        name: "Visitors",
                                        description: "Visitors rose from 12 thousand in January to 35 thousand in December",
                                    },
                                }),
                            ],
                        }),
                    ],
                }),
            },
            children: [
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Charts")] }),
                new Paragraph(
                    "Each chart is a native Word chart, drawn by Word from its data. Select one in Word and choose Edit Data to change its data in Excel.",
                ),

                heading("Column"),
                new Paragraph({
                    children: [
                        new ChartRun({
                            type: "column",
                            title: "Sales by quarter",
                            categories: quarters,
                            series: [
                                { name: "2024", values: [120, 135, 150, 170] },
                                { name: "2025", values: [140, 150, 165, null] },
                            ],
                            valueAxis: { title: "Units", minimum: 0, numberFormat: "#,##0" },
                            dataLabels: { value: true },
                            transformation: { width: 576, height: 300 },
                            altText: { name: "Sales by quarter", description: "Sales by quarter in 2024 and 2025" },
                        }),
                    ],
                }),

                heading("Bar, stacked"),
                new Paragraph({
                    children: [
                        new ChartRun({
                            type: "bar",
                            title: "Hours by team",
                            categories: ["Design", "Build", "Test"],
                            series: [
                                { name: "Planned", values: [30, 80, 40] },
                                { name: "Extra", values: [5, 20, 15], color: { theme: "accent2", lighter: 40 } },
                            ],
                            stacking: "stacked",
                            dataLabels: { value: true },
                            transformation: { width: 576, height: 240 },
                        }),
                    ],
                }),

                heading("Line, with markers"),
                new Paragraph({
                    children: [
                        new ChartRun({
                            type: "line",
                            title: "Temperature",
                            categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                            series: [
                                { name: "High", values: [21, 23, 25, 24, 22, 26, 27] },
                                { name: "Low", values: [12, 13, 15, 14, 13, 16, 17] },
                            ],
                            markers: true,
                            valueAxis: { title: "°C" },
                            legend: { position: "right" },
                            transformation: { width: 576, height: 280 },
                        }),
                    ],
                }),

                heading("Area, 100% stacked"),
                new Paragraph({
                    children: [
                        new ChartRun({
                            type: "area",
                            title: "Energy mix",
                            categories: [2021, 2022, 2023, 2024, 2025],
                            series: [
                                { name: "Wind", values: [20, 24, 28, 31, 35] },
                                { name: "Solar", values: [10, 13, 17, 21, 26] },
                                { name: "Gas", values: [45, 40, 35, 30, 25] },
                            ],
                            stacking: "percent",
                            transformation: { width: 576, height: 280 },
                        }),
                    ],
                }),

                heading("Pie and doughnut, in a table"),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: noBorders,
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new ChartRun({
                                                    type: "pie",
                                                    title: "Market share",
                                                    categories: ["North", "South", "East", "West"],
                                                    series: [{ name: "Share", values: [40, 25, 20, 15] }],
                                                    dataLabels: { percentage: true },
                                                    transformation: { width: 290, height: 260 },
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new ChartRun({
                                                    type: "doughnut",
                                                    title: "Budget and spend",
                                                    categories: ["Staff", "Rent", "Other"],
                                                    series: [
                                                        { name: "Budget", values: [60, 25, 15] },
                                                        { name: "Spend", values: [65, 25, 10] },
                                                    ],
                                                    transformation: { width: 290, height: 260 },
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),

                heading("Scatter"),
                new Paragraph({
                    children: [
                        new ChartRun({
                            type: "scatter",
                            title: "Height and weight",
                            series: [
                                {
                                    name: "Group A",
                                    points: [
                                        { x: 150, y: 50 },
                                        { x: 160, y: 56 },
                                        { x: 165, y: 61 },
                                        { x: 172, y: 68 },
                                        { x: 180, y: 75 },
                                    ],
                                },
                                {
                                    name: "Group B",
                                    points: [
                                        { x: 155, y: 58 },
                                        { x: 162, y: 63 },
                                        { x: 170, y: 72 },
                                        { x: 178, y: 80 },
                                    ],
                                },
                            ],
                            xAxis: { title: "Height (cm)", minimum: 140 },
                            yAxis: { title: "Weight (kg)", minimum: 40 },
                            transformation: { width: 576, height: 280 },
                        }),
                    ],
                }),

                heading("Floating"),
                new Paragraph({
                    children: [
                        new ChartRun({
                            type: "column",
                            title: "Orders",
                            categories: ["Mon", "Tue", "Wed"],
                            series: [{ name: "Orders", values: [8, 12, 9] }],
                            legend: false,
                            transformation: { width: 260, height: 180 },
                            floating: {
                                horizontalPosition: {
                                    relative: HorizontalPositionRelativeFrom.MARGIN,
                                    align: HorizontalPositionAlign.RIGHT,
                                },
                                verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
                                wrap: { type: TextWrappingType.SQUARE, side: TextWrappingSide.LEFT },
                                margins: { left: 114300 },
                            },
                            altText: { name: "Orders", description: "Orders on Monday, Tuesday and Wednesday" },
                        }),
                        new TextRun(
                            "A floating chart is positioned on the page rather than in the line of text. This one is anchored to this " +
                                "paragraph at the right margin, and the text wraps around it. Floating charts use the same positioning " +
                                "and wrapping options as floating images.",
                        ),
                    ],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
