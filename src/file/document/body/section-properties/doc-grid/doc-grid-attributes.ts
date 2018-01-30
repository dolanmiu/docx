import { XmlAttributeComponent } from "file/xml-components";

export interface IDocGridAttributesProperties {
    linePitch?: number;
}

export class DocGridAttributes extends XmlAttributeComponent<IDocGridAttributesProperties> {
    protected xmlKeys = {
        linePitch: "w:linePitch",
    };
}
