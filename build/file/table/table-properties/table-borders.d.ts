import { BorderStyle, IBorderOptions } from "../../../file/border";
import { XmlComponent } from "../../../file/xml-components";
export interface ITableBordersOptions {
    readonly top?: IBorderOptions;
    readonly bottom?: IBorderOptions;
    readonly left?: IBorderOptions;
    readonly right?: IBorderOptions;
    readonly insideHorizontal?: IBorderOptions;
    readonly insideVertical?: IBorderOptions;
}
export declare class TableBorders extends XmlComponent {
    static readonly NONE: {
        top: {
            style: BorderStyle;
            size: number;
            color: string;
        };
        bottom: {
            style: BorderStyle;
            size: number;
            color: string;
        };
        left: {
            style: BorderStyle;
            size: number;
            color: string;
        };
        right: {
            style: BorderStyle;
            size: number;
            color: string;
        };
        insideHorizontal: {
            style: BorderStyle;
            size: number;
            color: string;
        };
        insideVertical: {
            style: BorderStyle;
            size: number;
            color: string;
        };
    };
    constructor(options: ITableBordersOptions);
}
