import { XmlComponent } from "../../../file/xml-components";
export declare enum LineRuleType {
    AT_LEAST = "atLeast",
    EXACTLY = "exactly",
    AUTO = "auto"
}
export interface ISpacingProperties {
    readonly after?: number;
    readonly before?: number;
    readonly line?: number;
    readonly lineRule?: LineRuleType;
    readonly beforeAutoSpacing?: boolean;
    readonly afterAutoSpacing?: boolean;
}
export declare class Spacing extends XmlComponent {
    constructor(options: ISpacingProperties);
}
