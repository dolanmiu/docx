import { IXmlableObject } from "./xmlable-object";

export abstract class BaseXmlComponent {
    protected readonly rootKey: string;
    // tslint:disable-next-line:readonly-keyword
    protected deleted: boolean = false;

    constructor(rootKey: string) {
        this.rootKey = rootKey;
    }

    public abstract prepForXml(): IXmlableObject | undefined;

    public get IsDeleted(): boolean {
        return this.deleted;
    }
}
