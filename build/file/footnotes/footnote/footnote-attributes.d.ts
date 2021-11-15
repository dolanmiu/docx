import { XmlAttributeComponent } from "../../../file/xml-components";
export declare class FootnoteAttributes extends XmlAttributeComponent<{
    readonly type?: string;
    readonly id: number;
}> {
    protected readonly xmlKeys: {
        type: string;
        id: string;
    };
}
