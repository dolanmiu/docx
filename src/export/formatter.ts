import { BaseXmlComponent, IXmlableObject } from "file/xml-components";

export class Formatter {
    public format(input: BaseXmlComponent): IXmlableObject {
        const output = input.prepForXml();

        if (output) {
            return output;
        } else {
            throw Error("XMLComponent did not format correctly");
        }
    }
}
