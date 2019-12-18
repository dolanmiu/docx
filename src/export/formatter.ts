import { BaseXmlComponent, IXmlableObject } from "file/xml-components";
import { File } from "../file";

export class Formatter {
    public format(input: BaseXmlComponent, file?: File): IXmlableObject {
        const output = input.prepForXml(file);

        if (output) {
            return output;
        } else {
            throw Error("XMLComponent did not format correctly");
        }
    }
}
