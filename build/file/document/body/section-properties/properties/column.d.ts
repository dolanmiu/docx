import { XmlAttributeComponent, XmlComponent } from "../../../../../file/xml-components";
export interface IColumnAttributes {
    readonly width: number | string;
    readonly space?: number | string;
}
export declare class ColumnAttributes extends XmlAttributeComponent<IColumnAttributes> {
    protected readonly xmlKeys: {
        width: string;
        space: string;
    };
}
export declare class Column extends XmlComponent {
    constructor({ width, space }: IColumnAttributes);
}
