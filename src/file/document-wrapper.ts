import { Document, IDocumentOptions } from "./document";
import { Footer } from "./footer/footer";
import { FootNotes } from "./footnotes";
import { Header } from "./header/header";
import { Relationships } from "./relationships";
import { XmlComponent } from "./xml-components";

export type IViewWrapper = {
    readonly View: Document | Footer | Header | FootNotes | XmlComponent;
    readonly Relationships: Relationships;
};

export class DocumentWrapper implements IViewWrapper {
    private readonly document: Document;
    private readonly relationships: Relationships;

    public constructor(options: IDocumentOptions) {
        this.document = new Document(options);
        this.relationships = new Relationships();
    }

    public get View(): Document {
        return this.document;
    }

    public get Relationships(): Relationships {
        return this.relationships;
    }
}
