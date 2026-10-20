import { describe, expect, it } from "vitest";

import { PACKAGE_FILE_TYPE, embeddedFileTypeOf } from "./embedded-file-type";

describe("embeddedFileTypeOf", () => {
    it.each([
        [
            "budget.xlsx",
            "Excel.Sheet.12",
            "Microsoft_Excel_Worksheet",
            "xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        [
            "tools.xlsm",
            "Excel.SheetMacroEnabled.12",
            "Microsoft_Excel_Macro-enabled_Worksheet",
            "xlsm",
            "application/vnd.ms-excel.sheet.macroEnabled.12",
        ],
        [
            "letter.docx",
            "Word.Document.12",
            "Microsoft_Word_Document",
            "docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        [
            "tools.docm",
            "Word.DocumentMacroEnabled.12",
            "Microsoft_Word_Macro-enabled_Document",
            "docm",
            "application/vnd.ms-word.document.macroEnabled.12",
        ],
        [
            "slides.pptx",
            "PowerPoint.Show.12",
            "Microsoft_PowerPoint_Presentation",
            "pptx",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ],
        [
            "slides.pptm",
            "PowerPoint.ShowMacroEnabled.12",
            "Microsoft_PowerPoint_Macro-enabled_Presentation",
            "pptm",
            "application/vnd.ms-powerpoint.presentation.macroEnabled.12",
        ],
    ])("should embed %s as itself, for Office to open", (fileName, progId, partName, extension, contentType) => {
        expect(embeddedFileTypeOf(fileName)).toEqual({
            progId,
            partName,
            extension,
            contentType,
            relationshipType: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/package",
        });
    });

    it("should read the extension in any case, after the last dot", () => {
        expect(embeddedFileTypeOf("Q3 Budget.v2.XLSX").progId).toBe("Excel.Sheet.12");
    });

    it.each(["song.mp3", "video.mp4", "manual.pdf", "old.xls", "README", "xlsx", "budget.xlsx.zip", "a.constructor", "a.toString"])(
        "should embed %s in an OLE package",
        (fileName) => {
            expect(embeddedFileTypeOf(fileName)).toBe(PACKAGE_FILE_TYPE);
        },
    );

    it("should keep a package in an OLE object part", () => {
        expect(PACKAGE_FILE_TYPE).toEqual({
            progId: "Package",
            partName: "oleObject",
            extension: "bin",
            contentType: "application/vnd.openxmlformats-officedocument.oleObject",
            relationshipType: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject",
        });
    });
});
