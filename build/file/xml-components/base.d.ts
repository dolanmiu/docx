import { IViewWrapper } from "../document-wrapper";
import { File } from "../file";
import { IXmlableObject } from "./xmlable-object";
export interface IContext {
    readonly file: File;
    readonly viewWrapper: IViewWrapper;
}
export declare abstract class BaseXmlComponent {
    protected readonly rootKey: string;
    constructor(rootKey: string);
    abstract prepForXml(context: IContext): IXmlableObject | undefined;
}
