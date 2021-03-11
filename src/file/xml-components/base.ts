import { IViewWrapper } from "../document-wrapper";
import { File } from "../file";
import { IXmlableObject } from "./xmlable-object";

export interface IContext {
    readonly file: File;
    readonly viewWrapper: IViewWrapper;
}

export abstract class BaseXmlComponent {
    protected readonly rootKey: string;
    // tslint:disable-next-line:readonly-keyword
    protected deleted: boolean = false;

    constructor(rootKey: string) {
        this.rootKey = rootKey;
    }

    public abstract prepForXml(context: IContext): IXmlableObject | undefined;

    public get IsDeleted(): boolean {
        return this.deleted;
    }
}
