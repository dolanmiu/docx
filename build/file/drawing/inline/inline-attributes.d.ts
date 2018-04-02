import { XmlAttributeComponent } from "../../../file/xml-components";
export interface IInlineAttributes {
    distT?: number;
    distB?: number;
    distL?: number;
    distR?: number;
}
export declare class InlineAttributes extends XmlAttributeComponent<IInlineAttributes> {
    protected xmlKeys: {
        distT: string;
        distB: string;
        distL: string;
        distR: string;
    };
}
