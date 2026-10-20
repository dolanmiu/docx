/**
 * How each kind of file is embedded: Office's own files as themselves, and any other file in an OLE package.
 *
 * @module
 */

/**
 * How a file is embedded in a document: the application Word opens it with, and the part it is kept in.
 */
export type EmbeddedFileType = {
    /** The OLE ProgID of the application Word opens the file with, such as "Excel.Sheet.12" */
    readonly progId: string;
    /** The start of the part's file name, as Word names it, such as "Microsoft_Excel_Worksheet" */
    readonly partName: string;
    /** The extension of the part's file name, such as "xlsx" */
    readonly extension: string;
    /** The part's content type */
    readonly contentType: string;
    /** The type of the relationship to the part from the part the file is in, such as the document */
    readonly relationshipType:
        | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/package"
        | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject";
};

const PACKAGE_RELATIONSHIP = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/package";

/**
 * Office's own files, by extension, which are embedded as themselves, as Word embeds them, so Word opens each in its
 * application: Excel, Word or PowerPoint. Their ProgIDs are Office 2007's, which every version since opens.
 */
const OFFICE_FILE_TYPES: Readonly<Record<string, EmbeddedFileType>> = {
    xlsx: {
        progId: "Excel.Sheet.12",
        partName: "Microsoft_Excel_Worksheet",
        extension: "xlsx",
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        relationshipType: PACKAGE_RELATIONSHIP,
    },
    xlsm: {
        progId: "Excel.SheetMacroEnabled.12",
        partName: "Microsoft_Excel_Macro-enabled_Worksheet",
        extension: "xlsm",
        contentType: "application/vnd.ms-excel.sheet.macroEnabled.12",
        relationshipType: PACKAGE_RELATIONSHIP,
    },
    docx: {
        progId: "Word.Document.12",
        partName: "Microsoft_Word_Document",
        extension: "docx",
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        relationshipType: PACKAGE_RELATIONSHIP,
    },
    docm: {
        progId: "Word.DocumentMacroEnabled.12",
        partName: "Microsoft_Word_Macro-enabled_Document",
        extension: "docm",
        contentType: "application/vnd.ms-word.document.macroEnabled.12",
        relationshipType: PACKAGE_RELATIONSHIP,
    },
    pptx: {
        progId: "PowerPoint.Show.12",
        partName: "Microsoft_PowerPoint_Presentation",
        extension: "pptx",
        contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        relationshipType: PACKAGE_RELATIONSHIP,
    },
    pptm: {
        progId: "PowerPoint.ShowMacroEnabled.12",
        partName: "Microsoft_PowerPoint_Macro-enabled_Presentation",
        extension: "pptm",
        contentType: "application/vnd.ms-powerpoint.presentation.macroEnabled.12",
        relationshipType: PACKAGE_RELATIONSHIP,
    },
};

/**
 * Any other file, which is embedded in an OLE package, as Word embeds a file no application on the computer embeds
 * itself, such as a sound, a video or a PDF.
 */
export const PACKAGE_FILE_TYPE: EmbeddedFileType = {
    progId: "Package",
    partName: "oleObject",
    extension: "bin",
    contentType: "application/vnd.openxmlformats-officedocument.oleObject",
    relationshipType: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject",
};

/**
 * How a file is embedded, from the extension of its name: as itself for Office's own files, such as "budget.xlsx", and
 * in an OLE package for any other.
 */
export const embeddedFileTypeOf = (fileName: string): EmbeddedFileType => {
    const extension = /\.([^.]+)$/.exec(fileName)?.[1].toLowerCase();
    return extension !== undefined && Object.hasOwn(OFFICE_FILE_TYPES, extension) ? OFFICE_FILE_TYPES[extension] : PACKAGE_FILE_TYPE;
};
