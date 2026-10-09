/**
 * Font Wrapper module for WordprocessingML documents.
 *
 * Manages font table and relationships for embedded fonts.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-w_fonts.html
 *
 * @module
 */
import type { IViewWrapper } from "@file/document-wrapper";
import { Relationships } from "@file/relationships";
import type { XmlComponent } from "@file/xml-components";
import { uniqueUuid } from "@util/convenience-functions";

import { type FontOptions, createFontTable } from "./font-table";

/**
 * Font options extended with the unique key of the regular face's file.
 */
export type FontOptionsWithKey = FontOptions & { readonly fontKey: string };

/**
 * A font file the document embeds: one face of one of its fonts, with the unique key it is obfuscated with.
 *
 * @property name - Font family name
 * @property data - Font file data of the face
 * @property bold - Whether the face is bold
 * @property italic - Whether the face is italic
 * @property fontKey - Unique key (GUID) the file is obfuscated with
 */
export type EmbeddedFontFile = {
    readonly name: string;
    readonly data: Buffer;
    readonly bold: boolean;
    readonly italic: boolean;
    readonly fontKey: string;
};

// The faces of a font a document can embed: the option that gives each face's file, and the element that refers to it
const FACES = [
    { option: "data", element: "embedRegular", bold: false, italic: false },
    { option: "bold", element: "embedBold", bold: true, italic: false },
    { option: "italic", element: "embedItalic", bold: false, italic: true },
    { option: "boldItalic", element: "embedBoldItalic", bold: true, italic: true },
] as const;

/**
 * Wrapper class for managing the font table and its relationships.
 *
 * Creates a font table with embedded font files and manages the relationships
 * required for font embedding. Each face of a font is embedded as a file of its own,
 * with a unique key for obfuscation.
 *
 * @example
 * ```typescript
 * const fontWrapper = new FontWrapper([
 *   { name: "CustomFont", data: fontBuffer, bold: boldFontBuffer }
 * ]);
 * ```
 */
export class FontWrapper implements IViewWrapper {
    private readonly fontTable: XmlComponent;
    private readonly relationships: Relationships;
    public readonly fontOptionsWithKey: readonly FontOptionsWithKey[] = [];
    /** The files of the faces the fonts embed, in order: the Nth is `fonts/font<N>.odttf`, with the relationship `rId<N>` */
    public readonly files: readonly EmbeddedFontFile[] = [];

    public constructor(public readonly options: readonly FontOptions[]) {
        const faces = options.map((font) =>
            FACES.flatMap(({ option, element, bold, italic }) => {
                const data = font[option];
                return data ? [{ element, file: { name: font.name, data, bold, italic, fontKey: uniqueUuid() } }] : [];
            }),
        );
        this.files = faces.flatMap((ofFont) => ofFont.map(({ file }) => file));
        // The regular face is the first face of each font
        this.fontOptionsWithKey = options.map((font, index) => ({ ...font, fontKey: faces[index][0].file.fontKey }));
        this.fontTable = createFontTable(
            options.map((font, index) => ({
                name: font.name,
                characterSet: font.characterSet,
                ...Object.fromEntries(
                    faces[index].map(({ element, file }) => [element, { id: `rId${this.files.indexOf(file) + 1}`, fontKey: file.fontKey }]),
                ),
            })),
        );
        this.relationships = new Relationships();

        for (let i = 0; i < this.files.length; i++) {
            // Use sequential filenames (`font1.odttf`, `font2.odttf` …) rather
            // than the user-facing family name. Word treats the embedded-font
            // path as a literal filename and rejects spaces / non-ASCII in
            // the docx package — see https://github.com/dolanmiu/docx/issues/3019.
            // The user-facing family name lives only in <w:font name="..."/>.
            this.relationships.addRelationship(
                i + 1,
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/font",
                `fonts/font${i + 1}.odttf`,
            );
        }
    }

    public get View(): XmlComponent {
        return this.fontTable;
    }

    public get Relationships(): Relationships {
        return this.relationships;
    }
}
