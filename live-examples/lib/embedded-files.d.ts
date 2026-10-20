import { IContext } from 'docx';
import { IXmlableObject } from 'docx';
import { Run } from 'docx';

/**
 * The picture a document shows for an embedded file.
 */
export declare type EmbeddedFilePreview = {
    /** The image format. Word draws an embedded file's picture as a legacy picture, which can't be an SVG */
    readonly type: "jpg" | "png" | "gif" | "bmp";
    /** The image data. Accepts a Buffer, Uint8Array, ArrayBuffer, or a base64-encoded data URI string */
    readonly data: Buffer | string | Uint8Array | ArrayBuffer;
};

/**
 * Represents a file embedded in a WordprocessingML document, as Word's Insert > Object > "Create from File" embeds one:
 * an OLE object, drawn as a picture of it, that opens the file from the document.
 *
 * An Excel workbook, Word document or PowerPoint presentation is embedded as itself, so Word opens it in its
 * application, which can change it in the document. Any other file, such as a sound, a video or a PDF, is embedded in an
 * OLE package, which Word for Windows opens with the application the computer opens its type with, as it does a file
 * embedded there. Word for Mac shows it, but can't open it.
 *
 * The document shows the picture given in `preview`, of the file's content or an icon, until the file is opened. The
 * object sits inline with text, in a paragraph, including in a table, header, footer or footnote.
 *
 * Reference: http://officeopenxml.com/WPembeddedObjects.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * The embedded file combines several elements:
 * - w:r (run container)
 * - w:object (the embedded object, with its original size)
 * - v:shapetype and v:shape (the picture frame it's drawn in)
 * - v:imagedata (the picture)
 * - o:OLEObject (the application it is for, and the part the file is in)
 *
 * @example
 * ```typescript
 * new Paragraph({
 *   children: [
 *     new EmbeddedFileRun({
 *       fileName: "budget.xlsx",
 *       data: fs.readFileSync("./budget.xlsx"),
 *       preview: { type: "png", data: fs.readFileSync("./budget.png") },
 *       transformation: { width: 240, height: 120 },
 *     }),
 *   ],
 * });
 * ```
 */
export declare class EmbeddedFileRun extends Run {
    private readonly preview;
    /**
     * @throws If the file is an Excel workbook, Word document or PowerPoint presentation that isn't a zip file, as Office's
     * files are, so Office couldn't open it, such as an older Excel workbook (.xls) named .xlsx
     * @throws If the preview's type isn't "jpg", "png", "gif" or "bmp", such as when JavaScript leaves it out
     */
    constructor({ fileName, data, preview, transformation, displayAsIcon, altText }: EmbeddedFileRunOptions);
    prepForXml(context: IContext): IXmlableObject | undefined;
}

/**
 * Options for an {@link EmbeddedFileRun}.
 */
export declare type EmbeddedFileRunOptions = {
    /**
     * The file's name, such as "budget.xlsx". Its extension says how the file is embedded: an Excel workbook (.xlsx,
     * .xlsm), a Word document (.docx, .docm) or a PowerPoint presentation (.pptx, .pptm) as itself, which Word opens in
     * Excel, Word or PowerPoint, and any other file, such as a sound, a video or a PDF, in an OLE package, which Word
     * for Windows opens with the application the computer opens its type with. A packaged file keeps the name
     */
    readonly fileName: string;
    /** The file. Accepts a Buffer, Uint8Array, ArrayBuffer, or a base64-encoded data URI string */
    readonly data: Buffer | string | Uint8Array | ArrayBuffer;
    /**
     * The picture the document shows for the file: of its content, such as a workbook's table, or an icon. Word draws
     * it until the file is opened and changed in its application, which then draws the file again
     */
    readonly preview: EmbeddedFilePreview;
    /** The size the picture is drawn at, in pixels, at 96 to the inch, as an ImageRun's */
    readonly transformation: {
        /** Width in pixels */
        readonly width: number;
        /** Height in pixels */
        readonly height: number;
    };
    /**
     * Whether the file is shown as an icon, as Word's "Display as icon" does, rather than as its content. When the file is
     * changed in its application, Word draws its application's icon instead of its content. A packaged file is always
     * shown as an icon. Default is false
     */
    readonly displayAsIcon?: boolean;
    /** A description of the file for screen readers, as Word's "Alt Text" */
    readonly altText?: string;
};

export { }
