import { IXmlableObject, XmlComponent } from "file/xml-components";
import { AbstractNumbering } from "./abstract-numbering";
import { Num } from "./num";
export declare class Numbering extends XmlComponent {
    private nextId;
    private abstractNumbering;
    private concreteNumbering;
    constructor();
    createAbstractNumbering(): AbstractNumbering;
    createConcreteNumbering(abstractNumbering: AbstractNumbering): Num;
    prepForXml(): IXmlableObject;
}
