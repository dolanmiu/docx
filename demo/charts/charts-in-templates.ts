// Charts in a template: patchDocument puts charts where the template's placeholders are, as it does text and images,
// and adds each chart's part and embedded workbook to the document.
// See docs/usage/charts.md.

import * as fs from "fs";
import { Paragraph, patchDocument, PatchType, TextRun } from "docx";
import { ChartRun } from "docx/charts";

const quarters = ["Q1", "Q2", "Q3", "Q4"];

patchDocument({
    outputType: "nodebuffer",
    data: fs.readFileSync("demo/assets/simple-template.docx"),
    patches: {
        header_adjective: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun("sales report,")],
        },
        footer_text: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun("patched")],
        },
        name: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun("Ada")],
        },
        // A placeholder in a paragraph of its own is replaced by paragraphs
        paragraph_replace: {
            type: PatchType.DOCUMENT,
            children: [
                new Paragraph({ children: [new TextRun({ text: "Sales by quarter", bold: true })] }),
                new Paragraph({
                    children: [
                        new ChartRun({
                            type: "column",
                            title: "Sales",
                            categories: quarters,
                            series: [
                                { name: "2024", values: [120, 135, 150, 170] },
                                { name: "2025", values: [140, 160, 155, 190] },
                            ],
                            valueAxis: { title: "Units", minimum: 0 },
                            transformation: { width: 576, height: 288 },
                        }),
                    ],
                }),
            ],
        },
        table: {
            type: PatchType.DOCUMENT,
            children: [
                new Paragraph({
                    children: [
                        new ChartRun({
                            type: "pie",
                            title: "Sales by region, 2025",
                            categories: ["North", "South", "East", "West"],
                            series: [{ name: "2025", values: [210, 180, 150, 105] }],
                            dataLabels: { percentage: true },
                            transformation: { width: 384, height: 288 },
                        }),
                    ],
                }),
            ],
        },
        table_heading_1: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun("Region")],
        },
        item_1: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun("North")],
        },
        // A placeholder in a line of text is replaced by runs, so a chart can sit in a line, as an image does
        image_test: {
            type: PatchType.PARAGRAPH,
            children: [
                new TextRun("Returns by quarter: "),
                new ChartRun({
                    type: "line",
                    categories: quarters,
                    series: [{ name: "Returns", values: [12, 9, 11, 7] }],
                    legend: false,
                    markers: true,
                    transformation: { width: 288, height: 144 },
                    altText: { name: "Returns chart", description: "Returns by quarter: 12, 9, 11 and 7" },
                }),
            ],
        },
    },
}).then((doc) => {
    fs.writeFileSync("My Document.docx", doc);
});
