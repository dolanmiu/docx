import { XmlComponent } from "../../file/xml-components";
export interface IPropertiesOptions {
    title?: string;
    subject?: string;
    creator?: string;
    keywords?: string;
    description?: string;
    lastModifiedBy?: string;
    revision?: string;
}
export declare class CoreProperties extends XmlComponent {
    constructor(options: IPropertiesOptions);
}
