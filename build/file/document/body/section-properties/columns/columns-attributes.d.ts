import { XmlAttributeComponent } from "../../../../../file/xml-components";
export interface IColumnsAttributes {
    space?: number;
}
export declare class ColumnsAttributes extends XmlAttributeComponent<IColumnsAttributes> {
    protected xmlKeys: {
        space: string;
    };
}
