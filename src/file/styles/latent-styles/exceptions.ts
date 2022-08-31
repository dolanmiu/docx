import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

export interface ILatentStyleExceptionAttributesProperties {
    readonly name?: string;
    readonly uiPriority?: string;
    readonly qFormat?: string;
    readonly semiHidden?: string;
    readonly unhideWhenUsed?: string;
}

export class LatentStyleExceptionAttributes extends XmlAttributeComponent<ILatentStyleExceptionAttributesProperties> {
    protected readonly xmlKeys = {
        name: "w:name",
        uiPriority: "w:uiPriority",
        qFormat: "w:qFormat",
        semiHidden: "w:semiHidden",
        unhideWhenUsed: "w:unhideWhenUsed",
    };
}

export class LatentStyleException extends XmlComponent {
    public constructor(attributes: ILatentStyleExceptionAttributesProperties) {
        super("w:lsdException");
        this.root.push(new LatentStyleExceptionAttributes(attributes));
    }
}
