import { XmlAttributeComponent } from "../../file/xml-components";
export interface IChangedAttributesProperties {
    readonly id: number;
    readonly author: string;
    readonly date: string;
}
export declare class ChangeAttributes extends XmlAttributeComponent<IChangedAttributesProperties> {
    protected readonly xmlKeys: {
        id: string;
        author: string;
        date: string;
    };
}
