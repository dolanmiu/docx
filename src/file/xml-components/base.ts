import { IXmlableObject } from "./xmlable-object";

export abstract class BaseXmlComponent {
    protected rootKey: string;
    protected deleted: boolean = false;

    constructor(rootKey: string) {
        this.rootKey = rootKey;
    }

    public abstract prepForXml(): IXmlableObject;

    public get IsDeleted(): boolean {
        return this.deleted;
    }
}
