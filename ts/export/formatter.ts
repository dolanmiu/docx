import { BaseXmlComponent } from "../docx/xml-components";

export class Formatter {
    public format(input: BaseXmlComponent): any {
        return input.toXml();
    }
}
