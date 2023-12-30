import { IViewWrapper } from "@file/document-wrapper";
import { Relationships } from "@file/relationships";
import { XmlComponent } from "@file/xml-components";
import { uniqueUuid } from "@util/convenience-functions";

import { FontOptions, createFontTable } from "./font-table";

export type FontOptionsWithKey = FontOptions & { readonly fontKey: string };

export class FontWrapper implements IViewWrapper {
    private readonly fontTable: XmlComponent;
    private readonly relationships: Relationships;
    public readonly fontOptionsWithKey: readonly FontOptionsWithKey[] = [];

    public constructor(public readonly options: readonly FontOptions[]) {
        this.fontOptionsWithKey = options.map((o) => ({ ...o, fontKey: uniqueUuid() }));
        this.fontTable = createFontTable(this.fontOptionsWithKey);
        this.relationships = new Relationships();

        for (let i = 0; i < options.length; i++) {
            this.relationships.createRelationship(
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
