import { XmlComponent } from "@file/xml-components";
import { CustomPropertyAttributes } from "./custom-property-attributes";

export interface ICustomPropertyOptions {
    readonly name: string;
    readonly value: string;
}

export class CustomProperty extends XmlComponent {
    public constructor(id: number, properties: ICustomPropertyOptions) {
        super("property");
        this.root.push(
            new CustomPropertyAttributes({
                fmtid: "{D5CDD505-2E9C-101B-9397-08002B2CF9AE}",
                pid: id.toString(),
                name: properties.name,
            }),
        );
        this.root.push(new CustomPropertyValue(properties.value));
    }
}

export class CustomPropertyValue extends XmlComponent {
    public constructor(value: string) {
        super("vt:lpwstr");
        this.root.push(value);
    }
}
