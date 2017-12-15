import { BaseXmlComponent } from "../docx/xml-components";
import { IXmlableObject } from "../docx/xml-components/xmlable-object";

export class Formatter {
    public format(input: BaseXmlComponent): IXmlableObject {
        return input.prepForXml();
    }
}
