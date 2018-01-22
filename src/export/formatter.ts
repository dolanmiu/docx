import { BaseXmlComponent } from "file/xml-components";
import { IXmlableObject } from "file/xml-components/xmlable-object";

export class Formatter {
    public format(input: BaseXmlComponent): IXmlableObject {
        return input.prepForXml();
    }
}
