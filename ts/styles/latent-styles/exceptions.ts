import { XmlAttributeComponent, XmlComponent } from "../../docx/xml-components";

interface ILatentStyleExceptionAttributesProperties {
    name?: string;
    uiPriority?: string;
    qFormat?: string;
    semiHidden?: string;
    unhideWhenUsed?: string;
}

class LatentStyleExceptionAttributes extends XmlAttributeComponent<ILatentStyleExceptionAttributesProperties> {
    protected xmlKeys = {
        name: "w:name",
        uiPriority: "w:uiPriority",
        qFormat: "w:qFormat",
        semiHidden: "w:semiHidden",
        unhideWhenUsed: "w:unhideWhenUsed",
    };
}

export class LatentStyleException extends XmlComponent {

    constructor(attributes: ILatentStyleExceptionAttributesProperties) {
        super("w:lsdException");
        this.root.push(new LatentStyleExceptionAttributes(attributes));
    }
}
