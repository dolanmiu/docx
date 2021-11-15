import { XmlAttributeComponent, XmlComponent } from "../../../file/xml-components";
export interface ILatentStyleExceptionAttributesProperties {
    readonly name?: string;
    readonly uiPriority?: string;
    readonly qFormat?: string;
    readonly semiHidden?: string;
    readonly unhideWhenUsed?: string;
}
export declare class LatentStyleExceptionAttributes extends XmlAttributeComponent<ILatentStyleExceptionAttributesProperties> {
    protected readonly xmlKeys: {
        name: string;
        uiPriority: string;
        qFormat: string;
        semiHidden: string;
        unhideWhenUsed: string;
    };
}
export declare class LatentStyleException extends XmlComponent {
    constructor(attributes: ILatentStyleExceptionAttributesProperties);
}
