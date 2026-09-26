/**
 * Chart run module: native Word charts, drawn by the application from their data.
 *
 * Reference: http://officeopenxml.com/drwOverview.php
 *
 * @module
 */
import { Drawing, PackagePart, Run, createTransformation } from "docx";

import { DEFAULT_CHART_SIZE, createChartData } from "./chart-data";
import type { ChartRunOptions } from "./chart-options";
import { PartReference } from "./chart-reference";
import { CHART_NAMESPACE, RELATIONSHIPS_NAMESPACE, createChartSpace } from "./chart-space";
import { createWorkbookFiles } from "./workbook/workbook";

export type {
    AreaChartOptions,
    BarChartBaseOptions,
    BarChartOptions,
    CategoryChartOptions,
    ChartAxis,
    ChartBaseOptions,
    ChartDataLabels,
    ChartLegend,
    ChartLegendPosition,
    ChartPoint,
    ChartRunOptions,
    ChartSeries,
    ChartSize,
    ChartStacking,
    ChartType,
    ChartValueAxis,
    ColumnChartOptions,
    DoughnutChartOptions,
    LineChartOptions,
    PieChartBaseOptions,
    PieChartDataLabels,
    PieChartOptions,
    PieChartSeries,
    ScatterChartOptions,
    ScatterChartSeries,
} from "./chart-options";

/**
 * Represents a chart in a WordprocessingML document: a column, bar, line, area, pie, doughnut or scatter chart, drawn
 * by Word from its data in the document's theme, as a chart made with Word's Insert Chart is.
 *
 * The chart is a part of its own (`word/charts/chart1.xml`), with its data in an embedded workbook, so Word's "Edit
 * Data" opens it in Excel. It sits inline with text unless `floating` is set, and goes in a paragraph, including in a
 * table, header, footer or footnote.
 *
 * Reference: http://officeopenxml.com/drwOverview.php
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * new Paragraph({
 *   children: [
 *     new ChartRun({
 *       type: "column",
 *       title: "Sales",
 *       categories: ["Jan", "Feb", "Mar"],
 *       series: [
 *         { name: "2024", values: [10, 20, 30] },
 *         { name: "2025", values: [15, 25, null] },
 *       ],
 *     }),
 *   ],
 * });
 * ```
 */
export class ChartRun extends Run {
    /**
     * @throws If there are no series or categories, a value isn't a finite number or null, a series has more values
     * than there are categories, a pie chart has more than one series or a pie or doughnut chart a negative value, a
     * scatter point isn't two finite numbers, or an option is out of its range
     */
    public constructor(options: ChartRunOptions) {
        super({});

        const data = createChartData(options);
        const workbook = new PackagePart({
            folder: "embeddings",
            name: "Microsoft_Excel_Worksheet",
            extension: "xlsx",
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            relationshipType: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/package",
            content: { files: createWorkbookFiles(data.sheet) },
        });
        const chart = new PackagePart({
            folder: "charts",
            name: "chart",
            extension: "xml",
            contentType: "application/vnd.openxmlformats-officedocument.drawingml.chart+xml",
            relationshipType: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart",
            content: createChartSpace(options, data, workbook),
        });

        this.root.push(
            new Drawing(
                {
                    type: "graphic",
                    uri: CHART_NAMESPACE,
                    transformation: createTransformation(options.transformation ?? DEFAULT_CHART_SIZE),
                    content: new PartReference("c:chart", chart, { namespaces: { c: CHART_NAMESPACE, r: RELATIONSHIPS_NAMESPACE } }),
                    // Word doesn't keep a chart's aspect ratio when it is resized
                    lockAspectRatio: false,
                },
                { floating: options.floating, docProperties: options.altText },
            ),
        );
    }
}
