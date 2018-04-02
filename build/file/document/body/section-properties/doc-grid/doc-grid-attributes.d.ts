import { XmlAttributeComponent } from "../../../../../file/xml-components";
export interface IDocGridAttributesProperties {
    linePitch?: number;
}
export declare class DocGridAttributes extends XmlAttributeComponent<IDocGridAttributesProperties> {
    protected xmlKeys: {
        linePitch: string;
    };
}
