import { XmlComponent } from "../../file/xml-components";
import { ConcreteHyperlink, Paragraph } from "../paragraph";
import { Table } from "../table";
import { TableOfContents } from "../table-of-contents";
import { Body } from "./body";
import { IDocumentBackgroundOptions } from "./document-background";
export interface IDocumentOptions {
    readonly background: IDocumentBackgroundOptions;
}
export declare class Document extends XmlComponent {
    private readonly body;
    constructor(options: IDocumentOptions);
    add(item: Paragraph | Table | TableOfContents | ConcreteHyperlink): Document;
    get Body(): Body;
}
