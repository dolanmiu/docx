import { XmlAttributeComponent, XmlComponent } from "../../../../../file/xml-components";
export declare enum LineNumberRestartFormat {
    NEW_PAGE = "newPage",
    NEW_SECTION = "newSection",
    CONTINUOUS = "continuous"
}
export interface ILineNumberAttributes {
    readonly countBy?: number;
    readonly start?: number;
    readonly restart?: LineNumberRestartFormat;
    readonly distance?: number | string;
}
export declare class LineNumberAttributes extends XmlAttributeComponent<ILineNumberAttributes> {
    protected readonly xmlKeys: {
        countBy: string;
        start: string;
        restart: string;
        distance: string;
    };
}
export declare class LineNumberType extends XmlComponent {
    constructor({ countBy, start, restart, distance }: ILineNumberAttributes);
}
