import { XmlAttributeComponent, XmlComponent } from "../../../../../file/xml-components";
import { Column } from "./column";
export interface IColumnsAttributes {
    readonly space?: number | string;
    readonly count?: number;
    readonly separate?: boolean;
    readonly equalWidth?: boolean;
    readonly children?: Column[];
}
export declare class ColumnsAttributes extends XmlAttributeComponent<IColumnsAttributes> {
    protected readonly xmlKeys: {
        space: string;
        count: string;
        separate: string;
        equalWidth: string;
    };
}
export declare class Columns extends XmlComponent {
    constructor({ space, count, separate, equalWidth, children }: IColumnsAttributes);
}
