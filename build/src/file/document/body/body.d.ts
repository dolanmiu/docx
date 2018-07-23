import { IXmlableObject, XmlComponent } from "file/xml-components";
import { SectionProperties, SectionPropertiesOptions } from "./section-properties";
export declare class Body extends XmlComponent {
    private defaultSection;
    private sections;
    constructor(sectionPropertiesOptions?: SectionPropertiesOptions);
    addSection(section: SectionPropertiesOptions | SectionProperties): void;
    prepForXml(): IXmlableObject;
    push(component: XmlComponent): void;
    readonly DefaultSection: SectionProperties;
    private createSectionParagraph;
}
