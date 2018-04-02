import { XmlComponent } from "../../../file/xml-components";
export declare abstract class BaseUnderline extends XmlComponent {
    constructor(underlineType: string, color?: string);
}
export declare class Underline extends BaseUnderline {
    constructor(underlineType?: string, color?: string);
}
export declare class DashUnderline extends BaseUnderline {
    constructor();
}
export declare class DashDotDotHeavyUnderline extends BaseUnderline {
    constructor();
}
export declare class DashDotHeavyUnderline extends BaseUnderline {
    constructor();
}
export declare class DashLongUnderline extends BaseUnderline {
    constructor();
}
export declare class DashLongHeavyUnderline extends BaseUnderline {
    constructor();
}
export declare class DotDashUnderline extends BaseUnderline {
    constructor();
}
export declare class DotDotDashUnderline extends BaseUnderline {
    constructor();
}
export declare class DottedUnderline extends BaseUnderline {
    constructor();
}
export declare class DottedHeavyUnderline extends BaseUnderline {
    constructor();
}
export declare class DoubleUnderline extends BaseUnderline {
    constructor();
}
export declare class SingleUnderline extends BaseUnderline {
    constructor();
}
export declare class ThickUnderline extends BaseUnderline {
    constructor();
}
export declare class WaveUnderline extends BaseUnderline {
    constructor();
}
export declare class WavyDoubleUnderline extends BaseUnderline {
    constructor();
}
export declare class WavyHeavyUnderline extends BaseUnderline {
    constructor();
}
export declare class WordsUnderline extends BaseUnderline {
    constructor();
}
