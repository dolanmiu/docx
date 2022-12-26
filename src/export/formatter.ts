import { BaseXmlComponent, IContext, IXmlableObject } from "@file/xml-components";

export class Formatter {
    // tslint:disable-next-line: no-object-literal-type-assertion
    public format(input: BaseXmlComponent, context: IContext = { stack: [] } as unknown as IContext): IXmlableObject {
        const output = input.prepForXml(context);

        if (output) {
            return output;
        } else {
            throw Error("XMLComponent did not format correctly");
        }
    }
}
