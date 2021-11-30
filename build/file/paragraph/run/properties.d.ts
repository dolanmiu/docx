import { IChangedAttributesProperties } from "../../track-revision/track-revision";
import { IShadingAttributesProperties } from "../../../file/shading";
import { IgnoreIfEmptyXmlComponent, XmlComponent } from "../../../file/xml-components";
import { EmphasisMarkType } from "./emphasis-mark";
import { IFontAttributesProperties } from "./run-fonts";
import { UnderlineType } from "./underline";
interface IFontOptions {
    readonly name: string;
    readonly hint?: string;
}
export interface IRunStylePropertiesOptions {
    readonly bold?: boolean;
    readonly boldComplexScript?: boolean;
    readonly italics?: boolean;
    readonly italicsComplexScript?: boolean;
    readonly underline?: {
        readonly color?: string;
        readonly type?: UnderlineType;
    };
    readonly emphasisMark?: {
        readonly type?: EmphasisMarkType;
    };
    readonly color?: string;
    readonly size?: number | string;
    readonly sizeComplexScript?: boolean | number | string;
    readonly rightToLeft?: boolean;
    readonly smallCaps?: boolean;
    readonly allCaps?: boolean;
    readonly strike?: boolean;
    readonly doubleStrike?: boolean;
    readonly subScript?: boolean;
    readonly superScript?: boolean;
    readonly font?: string | IFontOptions | IFontAttributesProperties;
    readonly highlight?: string;
    readonly highlightComplexScript?: boolean | string;
    readonly characterSpacing?: number;
    readonly shading?: IShadingAttributesProperties;
    readonly emboss?: boolean;
    readonly imprint?: boolean;
    readonly revision?: IRunPropertiesChangeOptions;
}
export interface IRunPropertiesOptions extends IRunStylePropertiesOptions {
    readonly style?: string;
}
export interface IRunPropertiesChangeOptions extends IRunPropertiesOptions, IChangedAttributesProperties {
}
export declare class RunProperties extends IgnoreIfEmptyXmlComponent {
    constructor(options?: IRunPropertiesOptions);
    push(item: XmlComponent): void;
}
export declare class RunPropertiesChange extends XmlComponent {
    constructor(options: IRunPropertiesChangeOptions);
}
export {};
