import { XmlComponent } from "../file/xml-components";
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
export declare class FooterWrapper implements IViewWrapper {
    private readonly media;
    private readonly footer;
    private readonly relationships;
    constructor(media: Media, referenceId: number, initContent?: XmlComponent);
    add(item: Paragraph | Table): void;
    addChildElement(childElement: XmlComponent): void;
    get View(): Footer;
    get Relationships(): Relationships;
    get Media(): Media;
}
