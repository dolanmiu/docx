// New data for the charts a template already has: ChartDataPatch finds each chart whose alt text is a placeholder, such
// as {{sales}}, and replaces its data, keeping the chart's look. The template is made first here, as it would be in Word,
// where the placeholder goes in the chart's alt text.
// See docs/usage/chart-templates.md.

import * as fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph, patchDocument, PatchType, TextRun } from "docx";
import { ChartDataPatch, ChartRun } from "docx/charts";

// The template: charts with the look they are to keep, made with some data, and a placeholder in each one's alt text
const template = new Document({
    sections: [
        {
            children: [
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("{{title}}")] }),
                new Paragraph({
                    children: [
                        new ChartRun({
                            type: "column",
                            title: "Sales by quarter",
                            categories: ["Q1", "Q2"],
                            series: [{ name: "Last year", values: [100, 120], color: "1F4E79" }],
                            dataLabels: { value: true, numberFormat: "#,##0" },
                            valueAxis: { numberFormat: "#,##0", minimum: 0 },
                            gapWidth: 60,
                            transformation: { width: 576, height: 288 },
                            altText: { name: "Sales", description: "{{sales}}" },
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new ChartRun({
                            type: "doughnut",
                            title: "Sales by region",
                            categories: ["A", "B"],
                            series: [{ name: "Share", values: [1, 1] }],
                            dataLabels: { percentage: true },
                            holeSize: 60,
                            transformation: { width: 288, height: 240 },
                            altText: { name: "Regions", description: "{{regions}}" },
                        }),
                        new ChartRun({
                            type: "line",
                            title: "Visitors",
                            categories: ["Mon", "Tue"],
                            series: [{ name: "Visitors", values: [10, 20] }],
                            markers: { shape: "circle", size: 7 },
                            smooth: true,
                            legend: false,
                            transformation: { width: 288, height: 240 },
                            altText: { name: "Visitors", description: "{{visitors}}" },
                        }),
                    ],
                }),
            ],
        },
    ],
});

Packer.toBuffer(template)
    .then((data) =>
        patchDocument({
            outputType: "nodebuffer",
            data,
            patches: {
                title: { type: PatchType.PARAGRAPH, children: [new TextRun("Sales report, 2025")] },
                // More categories and series than the template's chart had: the new series take the next colours
                sales: new ChartDataPatch({
                    categories: ["Q1", "Q2", "Q3", "Q4"],
                    series: [
                        { name: "2024", values: [1200, 1350, 1500, 1700] },
                        { name: "2025", values: [1400, 1600, 1550, 1900] },
                        { name: "Target", values: [1500, 1500, 1600, 1600] },
                    ],
                }),
                // The new slices take the next colours too
                regions: new ChartDataPatch({
                    categories: ["North", "South", "East", "West"],
                    series: [{ name: "2025", values: [2100, 1800, 1500, 1050] }],
                }),
                visitors: new ChartDataPatch({
                    categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                    series: [{ name: "Visitors", values: [320, 410, 380, null, 460, 610, 580] }],
                    description: "Visitors each day of the week, from 320 on Monday to 610 on Saturday. Thursday's count is missing.",
                }),
            },
        }),
    )
    .then((doc) => {
        fs.writeFileSync("My Document.docx", doc);
    });
