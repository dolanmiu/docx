/**
 * The embedded workbook (`word/embeddings/Microsoft_Excel_Worksheet1.xlsx`) that holds a chart's data, so Word's "Edit
 * Data" opens it. It has one sheet, laid out as Word lays out a new chart's data, with its text in shared strings, as
 * Excel writes it.
 *
 * @module
 */
import type { EmbeddedPackageFile, XmlComponent } from "docx";

import type { ChartSheet } from "../chart-data";
import { createElement, createText } from "../chart-elements";
import { SHEET_NAME, cellName } from "./cell-reference";
import { formatNumber } from "../plot-area/series";

const SPREADSHEET_NAMESPACE = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const RELATIONSHIP_TYPES = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

const createContentTypes = (): XmlComponent =>
    createElement("Types", { xmlns: "http://schemas.openxmlformats.org/package/2006/content-types" }, [
        createElement("Default", { Extension: "rels", ContentType: "application/vnd.openxmlformats-package.relationships+xml" }),
        createElement("Default", { Extension: "xml", ContentType: "application/xml" }),
        ...[
            ["/xl/workbook.xml", "sheet.main+xml"],
            ["/xl/worksheets/sheet1.xml", "worksheet+xml"],
            ["/xl/styles.xml", "styles+xml"],
            ["/xl/sharedStrings.xml", "sharedStrings+xml"],
        ].map(([partName, type]) =>
            createElement("Override", {
                PartName: partName,
                ContentType: `application/vnd.openxmlformats-officedocument.spreadsheetml.${type}`,
            }),
        ),
    ]);

const createRelationships = (relationships: readonly (readonly [type: string, target: string])[]): XmlComponent =>
    createElement(
        "Relationships",
        { xmlns: "http://schemas.openxmlformats.org/package/2006/relationships" },
        relationships.map(([type, target], index) =>
            createElement("Relationship", { Id: `rId${index + 1}`, Type: `${RELATIONSHIP_TYPES}/${type}`, Target: target }),
        ),
    );

const createWorkbook = (): XmlComponent =>
    createElement("workbook", { xmlns: SPREADSHEET_NAMESPACE, "xmlns:r": RELATIONSHIP_TYPES }, [
        createElement("sheets", {}, [createElement("sheet", { name: SHEET_NAME, sheetId: 1, "r:id": "rId1" })]),
    ]);

/**
 * The fewest styles Excel accepts: one font, the two fills every workbook has, one border and one cell format.
 */
const createStyles = (): XmlComponent =>
    createElement("styleSheet", { xmlns: SPREADSHEET_NAMESPACE }, [
        createElement("fonts", { count: 1 }, [
            createElement("font", {}, [
                createElement("sz", { val: 11 }),
                createElement("name", { val: "Calibri" }),
                createElement("family", { val: 2 }),
            ]),
        ]),
        createElement("fills", { count: 2 }, [
            createElement("fill", {}, [createElement("patternFill", { patternType: "none" })]),
            createElement("fill", {}, [createElement("patternFill", { patternType: "gray125" })]),
        ]),
        createElement("borders", { count: 1 }, [
            createElement(
                "border",
                {},
                ["left", "right", "top", "bottom", "diagonal"].map((side) => createElement(side)),
            ),
        ]),
        createElement("cellStyleXfs", { count: 1 }, [createElement("xf", { numFmtId: 0, fontId: 0, fillId: 0, borderId: 0 })]),
        createElement("cellXfs", { count: 1 }, [createElement("xf", { numFmtId: 0, fontId: 0, fillId: 0, borderId: 0, xfId: 0 })]),
        createElement("cellStyles", { count: 1 }, [createElement("cellStyle", { name: "Normal", xfId: 0, builtinId: 0 })]),
    ]);

/**
 * The sheet: its used range, and each cell that isn't empty. Text is the index of a shared string.
 */
const createWorksheet = (sheet: ChartSheet, strings: ReadonlyMap<string, number>): XmlComponent => {
    const columns = Math.max(...sheet.map((row) => row.length));
    return createElement("worksheet", { xmlns: SPREADSHEET_NAMESPACE, "xmlns:r": RELATIONSHIP_TYPES }, [
        createElement("dimension", { ref: `A1:${cellName(columns - 1, sheet.length - 1)}` }),
        createElement(
            "sheetData",
            {},
            sheet.flatMap((row, rowIndex) => {
                const cells = row.flatMap((cell, column) => {
                    if (cell === undefined) {
                        return [];
                    }
                    return typeof cell === "string"
                        ? [createElement("c", { r: cellName(column, rowIndex), t: "s" }, [createText("v", `${strings.get(cell)}`)])]
                        : [createElement("c", { r: cellName(column, rowIndex) }, [createText("v", formatNumber(cell))])];
                });
                return cells.length === 0 ? [] : [createElement("row", { r: rowIndex + 1 }, cells)];
            }),
        ),
    ]);
};

/**
 * The shared strings: each piece of text once. Excel writes `xml:space="preserve"` on text that starts or ends with
 * white space, though the ISO schema doesn't allow it there, so this does too.
 */
const createSharedStrings = (strings: readonly string[], count: number): XmlComponent =>
    createElement(
        "sst",
        { xmlns: SPREADSHEET_NAMESPACE, count, uniqueCount: strings.length },
        strings.map((text) =>
            createElement("si", {}, [
                /^\s|\s$/.test(text) ? createElement("t", { "xml:space": "preserve" }).addChildElement(text) : createText("t", text),
            ]),
        ),
    );

/**
 * The workbook's files, to zip into the embedded package.
 *
 * @param sheet - The sheet's cells, row by row
 */
export const createWorkbookFiles = (sheet: ChartSheet): readonly EmbeddedPackageFile[] => {
    const texts = sheet.flat().filter((cell): cell is string => typeof cell === "string");
    const strings = [...new Set(texts)];

    return [
        { path: "[Content_Types].xml", content: createContentTypes() },
        { path: "_rels/.rels", content: createRelationships([["officeDocument", "xl/workbook.xml"]]) },
        { path: "xl/workbook.xml", content: createWorkbook() },
        {
            path: "xl/_rels/workbook.xml.rels",
            content: createRelationships([
                ["worksheet", "worksheets/sheet1.xml"],
                ["styles", "styles.xml"],
                ["sharedStrings", "sharedStrings.xml"],
            ]),
        },
        { path: "xl/worksheets/sheet1.xml", content: createWorksheet(sheet, new Map(strings.map((text, index) => [text, index]))) },
        { path: "xl/styles.xml", content: createStyles() },
        { path: "xl/sharedStrings.xml", content: createSharedStrings(strings, texts.length) },
    ];
};
