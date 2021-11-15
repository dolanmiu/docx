import { NumberFormat } from "../../../../../file/shared/number-format";
import { XmlAttributeComponent, XmlComponent } from "../../../../../file/xml-components";
export declare enum PageNumberSeparator {
    HYPHEN = "hyphen",
    PERIOD = "period",
    COLON = "colon",
    EM_DASH = "emDash",
    EN_DASH = "endash"
}
export interface IPageNumberTypeAttributes {
    readonly start?: number;
    readonly formatType?: NumberFormat;
    readonly separator?: PageNumberSeparator;
}
export declare class PageNumberTypeAttributes extends XmlAttributeComponent<IPageNumberTypeAttributes> {
    protected readonly xmlKeys: {
        start: string;
        formatType: string;
        separator: string;
    };
}
export declare class PageNumberType extends XmlComponent {
    constructor({ start, formatType, separator }: IPageNumberTypeAttributes);
}
