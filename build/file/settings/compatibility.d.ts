import { XmlComponent } from "../../file/xml-components";
export interface ICompatibilityOptions {
    readonly doNotExpandShiftReturn?: boolean;
    readonly version?: number;
}
export declare class Compatibility extends XmlComponent {
    constructor(options: ICompatibilityOptions);
}
