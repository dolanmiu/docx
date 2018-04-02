import { XmlComponent } from "../../../file/xml-components";
import { SectionPropertiesOptions } from "./section-properties/section-properties";
export declare class Body extends XmlComponent {
    constructor(sectionPropertiesOptions?: SectionPropertiesOptions);
    push(component: XmlComponent): void;
}
