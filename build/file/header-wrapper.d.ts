import { XmlComponent } from "../file/xml-components";
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
export declare class HeaderWrapper implements IViewWrapper {
    private readonly media;
    private readonly header;
    private readonly relationships;
    constructor(media: Media, referenceId: number, initContent?: XmlComponent);
    add(item: Paragraph | Table): HeaderWrapper;
    addChildElement(childElement: XmlComponent | string): void;
    get View(): Header;
    get Relationships(): Relationships;
    get Media(): Media;
}
