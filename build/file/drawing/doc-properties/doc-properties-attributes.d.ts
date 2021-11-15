import { XmlAttributeComponent } from "../../../file/xml-components";
export declare class DocPropertiesAttributes extends XmlAttributeComponent<{
    readonly id?: number;
    readonly name?: string;
    readonly descr?: string;
}> {
    protected readonly xmlKeys: {
        id: string;
        name: string;
        descr: string;
    };
}
