import { Document, IDocumentOptions } from "./document";
import { Footer } from "./footer/footer";
import { FootNotes } from "./footnotes";
import { Header } from "./header/header";
import { Relationships } from "./relationships";
export interface IViewWrapper {
    readonly View: Document | Footer | Header | FootNotes;
    readonly Relationships: Relationships;
}
export declare class DocumentWrapper implements IViewWrapper {
    private readonly document;
    private readonly relationships;
    constructor(options: IDocumentOptions);
    get View(): Document;
    get Relationships(): Relationships;
}
