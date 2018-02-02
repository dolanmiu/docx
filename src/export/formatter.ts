import { BaseXmlComponent, IXmlableObject } from "file/xml-components";

export class Formatter {
    public format(input: BaseXmlComponent): IXmlableObject {
        return input.prepForXml();
    }
}
