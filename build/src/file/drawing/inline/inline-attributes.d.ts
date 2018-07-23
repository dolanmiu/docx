import { XmlAttributeComponent } from "file/xml-components";
import { IDistance } from "../drawing";
export interface IInlineAttributes extends IDistance {
}
export declare class InlineAttributes extends XmlAttributeComponent<IInlineAttributes> {
    protected xmlKeys: {
        distT: string;
        distB: string;
        distL: string;
        distR: string;
    };
}
