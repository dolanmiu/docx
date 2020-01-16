import { AlignmentType, IIndentAttributesProperties, ISpacingProperties, UnderlineType } from "../paragraph";
import { ShadingType } from "../table";

export interface IRunStyleOptions {
    readonly size?: number;
    readonly bold?: boolean;
    readonly italics?: boolean;
    readonly smallCaps?: boolean;
    readonly allCaps?: boolean;
    readonly strike?: boolean;
    readonly doubleStrike?: boolean;
    readonly subScript?: boolean;
    readonly superScript?: boolean;
    readonly underline?: {
        readonly type?: UnderlineType;
        readonly color?: string;
    };
    readonly color?: string;
    readonly font?: string;
    readonly characterSpacing?: number;
    readonly highlight?: string;
    readonly shadow?: {
        readonly type: ShadingType;
        readonly fill: string;
        readonly color: string;
    };
}

export interface IParagraphStyleOptions2 {
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

// Needed because of: https://github.com/s-panferov/awesome-typescript-loader/issues/432
/**
 * @ignore
 */
export const WORKAROUND4 = "";
