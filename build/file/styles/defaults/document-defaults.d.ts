import { IParagraphStylePropertiesOptions } from "../../../file/paragraph/properties";
import { IRunStylePropertiesOptions } from "../../../file/paragraph/run/properties";
import { XmlComponent } from "../../../file/xml-components";
export interface IDocumentDefaultsOptions {
    readonly paragraph?: IParagraphStylePropertiesOptions;
    readonly run?: IRunStylePropertiesOptions;
}
export declare class DocumentDefaults extends XmlComponent {
    private readonly runPropertiesDefaults;
    private readonly paragraphPropertiesDefaults;
    constructor(options: IDocumentDefaultsOptions);
}
