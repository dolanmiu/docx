import { describe, expect, it } from "vitest";
import xml from "xml";

import { Formatter } from "@export/formatter";
import type { EmbeddedPackageFile, XmlComponent } from "docx";

import { createWorkbookFiles } from "./workbook";

const toXml = (component: EmbeddedPackageFile["content"]): string => xml(new Formatter().format(component as XmlComponent));

const files = (sheet: Parameters<typeof createWorkbookFiles>[0]): Readonly<Record<string, string>> =>
    Object.fromEntries(createWorkbookFiles(sheet).map(({ path, content }) => [path, toXml(content)]));

describe("createWorkbookFiles", () => {
    const workbook = files([
        [undefined, "2024", "2025"],
        ["Jan", 10, 1.5],
        ["Feb", 20, undefined],
    ]);

    it("should write the files of a workbook with one sheet, its styles and shared strings", () => {
        expect(Object.keys(workbook)).to.deep.equal([
            "[Content_Types].xml",
            "_rels/.rels",
            "xl/workbook.xml",
            "xl/_rels/workbook.xml.rels",
            "xl/worksheets/sheet1.xml",
            "xl/styles.xml",
            "xl/sharedStrings.xml",
        ]);
    });

    it("should give each part its content type and relationship", () => {
        expect(workbook["[Content_Types].xml"]).to.equal(
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
                '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
                '<Default Extension="xml" ContentType="application/xml"/>' +
                '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
                '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
                '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
                '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>' +
                "</Types>",
        );
        expect(workbook["_rels/.rels"]).to.equal(
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
                '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
                "</Relationships>",
        );
        expect(workbook["xl/_rels/workbook.xml.rels"]).to.equal(
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
                '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
                '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
                '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>' +
                "</Relationships>",
        );
        expect(workbook["xl/workbook.xml"]).to.equal(
            '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
                '<sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>',
        );
    });

    it("should write each cell that isn't empty, with text as a shared string and numbers as they are", () => {
        expect(workbook["xl/worksheets/sheet1.xml"]).to.equal(
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
                '<dimension ref="A1:C3"/><sheetData>' +
                '<row r="1"><c r="B1" t="s"><v>0</v></c><c r="C1" t="s"><v>1</v></c></row>' +
                '<row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>10</v></c><c r="C2"><v>1.5</v></c></row>' +
                '<row r="3"><c r="A3" t="s"><v>3</v></c><c r="B3"><v>20</v></c></row>' +
                "</sheetData></worksheet>",
        );
    });

    it("should leave out a row with no cells", () => {
        expect(
            files([
                ["X", "A"],
                [undefined, undefined],
                [1, 2],
            ])["xl/worksheets/sheet1.xml"],
        ).to.contain('<sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row><row r="3">');
    });

    it("should write each piece of text once, counting every cell, and keep the spaces around text as Excel does", () => {
        const sheet = files([
            ["X", " padded ", "X", "B"],
            [1, 2, 3, 4],
        ]);

        expect(sheet["xl/sharedStrings.xml"]).to.equal(
            '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="4" uniqueCount="3">' +
                '<si><t>X</t></si><si><t xml:space="preserve"> padded </t></si><si><t>B</t></si></sst>',
        );
        expect(sheet["xl/worksheets/sheet1.xml"]).to.contain('<c r="C1" t="s"><v>0</v></c><c r="D1" t="s"><v>2</v></c>');
    });

    it("should write the fewest styles Excel accepts", () => {
        expect(workbook["xl/styles.xml"]).to.equal(
            '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
                '<fonts count="1"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font></fonts>' +
                '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
                '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
                '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
                '<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>' +
                '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
                "</styleSheet>",
        );
    });
});
