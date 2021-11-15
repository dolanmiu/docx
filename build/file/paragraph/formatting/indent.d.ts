import { XmlComponent } from "../../../file/xml-components";
export interface IIndentAttributesProperties {
    readonly start?: number | string;
    readonly end?: number | string;
    readonly left?: number | string;
    readonly right?: number | string;
    readonly hanging?: number | string;
    readonly firstLine?: number | string;
}
export declare class Indent extends XmlComponent {
    constructor({ start, end, left, right, hanging, firstLine }: IIndentAttributesProperties);
}
