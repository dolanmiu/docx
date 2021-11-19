import { XmlAttributeComponent, XmlComponent } from "../../../file/xml-components";
export declare class DocumentBackgroundAttributes extends XmlAttributeComponent<{
    readonly color?: string;
    readonly themeColor?: string;
    readonly themeShade?: string;
    readonly themeTint?: string;
}> {
    protected readonly xmlKeys: {
        color: string;
        themeColor: string;
        themeShade: string;
        themeTint: string;
    };
}
export interface IDocumentBackgroundOptions {
    readonly color?: string;
    readonly themeColor?: string;
    readonly themeShade?: string;
    readonly themeTint?: string;
}
export declare class DocumentBackground extends XmlComponent {
    constructor(options: IDocumentBackgroundOptions);
}
