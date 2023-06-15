import { IViewWrapper } from "@file/document-wrapper";
import { Relationships } from "@file/relationships";
import { XmlComponent } from "@file/xml-components";

import { IFontOptions } from "./font";
import { createFontTable } from "./font-table";

export class FontWrapper implements IViewWrapper {
    private readonly fontTable: XmlComponent;
    private readonly relationships: Relationships;

    public constructor(public readonly options: readonly IFontOptions[]) {
        this.fontTable = createFontTable(options);
        this.relationships = new Relationships();

        for (let i = 0; i < options.length; i++) {
            this.relationships.createRelationship(
                i,
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
