import { XmlComponent } from "@file/xml-components";

import { HeaderFooterReferenceType } from "./document";
import { IViewWrapper } from "./document-wrapper";
import { Footer } from "./footer/footer";
import { Media } from "./media";
import { Paragraph } from "./paragraph";
import { Relationships } from "./relationships";
import { Table } from "./table";

export interface IDocumentFooter {
    readonly footer: FooterWrapper;
    readonly type: HeaderFooterReferenceType;
}

export class FooterWrapper implements IViewWrapper {
    private readonly footer: Footer;
    private readonly relationships: Relationships;

    public constructor(private readonly media: Media, referenceId: number, initContent?: XmlComponent) {
        this.footer = new Footer(referenceId, initContent);
        this.relationships = new Relationships();
    }

    public add(item: Paragraph | Table): void {
        this.footer.add(item);
    }

    public addChildElement(childElement: XmlComponent): void {
        this.footer.addChildElement(childElement);
    }

    public get View(): Footer {
        return this.footer;
    }

    public get Relationships(): Relationships {
        return this.relationships;
    }

    public get Media(): Media {
        return this.media;
    }
}
