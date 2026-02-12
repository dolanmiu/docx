/**
 * Font Wrapper module for WordprocessingML documents.
 *
 * Manages font table and relationships for embedded fonts.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-w_fonts.html
 *
 * @module
 */
import { IViewWrapper } from "@file/document-wrapper";
import { Relationships } from "@file/relationships";
import { XmlComponent } from "@file/xml-components";
import { uniqueUuid } from "@util/convenience-functions";

import { FontOptions, createFontTable } from "./font-table";

/**
 * Font options extended with a unique font key.
 */
export type FontOptionsWithKey = FontOptions & { readonly fontKey: string };

/**
 * Wrapper class for managing the font table and its relationships.
 *
 * Creates a font table with embedded font files and manages the relationships
 * required for font embedding. Each font is assigned a unique key for obfuscation.
 *
 * @example
 * ```typescript
 * const fontWrapper = new FontWrapper([
 *   { name: "CustomFont", data: fontBuffer }
 * ]);
 * ```
 */
export class FontWrapper implements IViewWrapper {
    private readonly fontTable: XmlComponent;
    private readonly relationships: Relationships;
    public readonly fontOptionsWithKey: readonly FontOptionsWithKey[] = [];

    public constructor(public readonly options: readonly FontOptions[]) {
        this.fontOptionsWithKey = options.map((o) => ({ ...o, fontKey: uniqueUuid() }));
        this.fontTable = createFontTable(this.fontOptionsWithKey);
        this.relationships = new Relationships();

        for (let i = 0; i < options.length; i++) {
            this.relationships.addRelationship(
                i + 1,
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/font",
                `fonts/${options[i].name}.odttf`,
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
