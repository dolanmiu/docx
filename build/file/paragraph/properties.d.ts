import { IContext, IgnoreIfEmptyXmlComponent, IXmlableObject, XmlComponent } from "../../file/xml-components";
import { IShadingAttributesProperties } from "../shading";
import { AlignmentType } from "./formatting/alignment";
import { IBordersOptions } from "./formatting/border";
import { IIndentAttributesProperties } from "./formatting/indent";
import { ISpacingProperties } from "./formatting/spacing";
import { HeadingLevel } from "./formatting/style";
import { LeaderType, TabStopPosition, TabStopType } from "./formatting/tab-stop";
import { IFrameOptions } from "./frame/frame-properties";
export interface ILevelParagraphStylePropertiesOptions {
    readonly alignment?: AlignmentType;
    readonly thematicBreak?: boolean;
    readonly contextualSpacing?: boolean;
    readonly rightTabStop?: number;
    readonly leftTabStop?: number;
    readonly indent?: IIndentAttributesProperties;
    readonly spacing?: ISpacingProperties;
    readonly keepNext?: boolean;
    readonly keepLines?: boolean;
    readonly outlineLevel?: number;
}
export interface IParagraphStylePropertiesOptions extends ILevelParagraphStylePropertiesOptions {
    readonly numbering?: {
        readonly reference: string;
        readonly level: number;
        readonly instance?: number;
        readonly custom?: boolean;
    };
}
export interface IParagraphPropertiesOptions extends IParagraphStylePropertiesOptions {
    readonly border?: IBordersOptions;
    readonly heading?: HeadingLevel;
    readonly bidirectional?: boolean;
    readonly pageBreakBefore?: boolean;
    readonly tabStops?: {
        readonly position: number | TabStopPosition;
        readonly type: TabStopType;
        readonly leader?: LeaderType;
    }[];
    readonly style?: string;
    readonly bullet?: {
        readonly level: number;
    };
    readonly shading?: IShadingAttributesProperties;
    readonly widowControl?: boolean;
    readonly frame?: IFrameOptions;
    readonly suppressLineNumbers?: boolean;
}
export declare class ParagraphProperties extends IgnoreIfEmptyXmlComponent {
    private readonly numberingReferences;
    constructor(options?: IParagraphPropertiesOptions);
    push(item: XmlComponent): void;
    prepForXml(context: IContext): IXmlableObject | undefined;
}
