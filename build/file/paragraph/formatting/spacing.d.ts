import { XmlComponent } from "../../../file/xml-components";
export interface ISpacingProperties {
    after?: number;
    before?: number;
    line?: number;
}
export declare class Spacing extends XmlComponent {
    constructor(opts: ISpacingProperties);
}
