import { XmlAttributeComponent } from "../../../../../../../../file/xml-components";
export declare class NonVisualPropertiesAttributes extends XmlAttributeComponent<{
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
