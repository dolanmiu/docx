import { IViewWrapper } from "file/document-wrapper";
import { BaseXmlComponent, IXmlableObject } from "file/xml-components";

export class Formatter {
    public format(input: BaseXmlComponent, file?: IViewWrapper): IXmlableObject {
        const output = input.prepForXml(file);

        if (output) {
            return output;
        } else {
            throw Error("XMLComponent did not format correctly");
        }
    }
}
