import { XmlComponent } from "../../../file/xml-components";
export interface IStyleAttributes {
    readonly type?: string;
    readonly styleId?: string;
    readonly default?: boolean;
    readonly customStyle?: string;
}
export interface IStyleOptions {
    readonly name?: string;
    readonly basedOn?: string;
    readonly next?: string;
    readonly link?: string;
    readonly uiPriority?: number;
    readonly semiHidden?: boolean;
    readonly unhideWhenUsed?: boolean;
    readonly quickFormat?: boolean;
}
export declare class Style extends XmlComponent {
    constructor(attributes: IStyleAttributes, options: IStyleOptions);
}
