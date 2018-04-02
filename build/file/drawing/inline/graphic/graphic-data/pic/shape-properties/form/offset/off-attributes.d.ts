import { XmlAttributeComponent } from "../../../../../../../../../file/xml-components";
export interface IOffsetAttributes {
    x?: number;
    y?: number;
}
export declare class OffsetAttributes extends XmlAttributeComponent<IOffsetAttributes> {
    protected xmlKeys: {
        x: string;
        y: string;
    };
}
