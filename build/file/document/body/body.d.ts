import { IContext, IXmlableObject, XmlComponent } from "../../../file/xml-components";
import { ISectionPropertiesOptions } from "./section-properties/section-properties";
export declare class Body extends XmlComponent {
    private readonly sections;
    constructor();
    addSection(options: ISectionPropertiesOptions): void;
    prepForXml(context: IContext): IXmlableObject | undefined;
    push(component: XmlComponent): void;
    private createSectionParagraph;
}
