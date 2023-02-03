import { XmlComponent } from "@file/xml-components";

import { HeaderFooterReferenceType } from "./document";
import { IViewWrapper } from "./document-wrapper";
import { Header } from "./header/header";
import { Media } from "./media";
import { Paragraph } from "./paragraph";
import { Relationships } from "./relationships";
import { Table } from "./table";

export interface IDocumentHeader {
    readonly header: HeaderWrapper;
    readonly type: HeaderFooterReferenceType;
}

export class HeaderWrapper implements IViewWrapper {
    private readonly header: Header;
    private readonly relationships: Relationships;

    public constructor(private readonly media: Media, referenceId: number, initContent?: XmlComponent) {
        this.header = new Header(referenceId, initContent);
        this.relationships = new Relationships();
    }

    public add(item: Paragraph | Table): HeaderWrapper {
        this.header.add(item);

        return this;
    }

    public addChildElement(childElement: XmlComponent | string): void {
        this.header.addChildElement(childElement);
    }

    public get View(): Header {
        return this.header;
    }

    public get Relationships(): Relationships {
        return this.relationships;
    }

    public get Media(): Media {
        return this.media;
    }
}
