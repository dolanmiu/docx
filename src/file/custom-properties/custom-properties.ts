import { IContext, IXmlableObject, XmlComponent } from "file/xml-components";
import { CustomPropertiesAttributes } from "./custom-properties-attributes";
import { CustomProperty, ICustomPropertyOptions } from "./custom-property";

export class CustomProperties extends XmlComponent {
    // tslint:disable-next-line:readonly-keyword
    private nextId: number;
    private readonly properties: CustomProperty[] = [];

    constructor(properties: ICustomPropertyOptions[]) {
        super("Properties");

        this.root.push(
            new CustomPropertiesAttributes({
                xmlns: "http://schemas.openxmlformats.org/officeDocument/2006/custom-properties",
                vt: "http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes",
            }),
        );

        // I'm not sure why, but every example I have seen starts with 2
        // https://docs.microsoft.com/en-us/office/open-xml/how-to-set-a-custom-property-in-a-word-processing-document
        this.nextId = 2;

        for (const property of properties) {
            this.addCustomProperty(property);
        }
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        this.properties.forEach((x) => this.root.push(x));
        return super.prepForXml(context);
    }

    public addCustomProperty(property: ICustomPropertyOptions): void {
        this.properties.push(new CustomProperty(this.nextId++, property));
    }
}
