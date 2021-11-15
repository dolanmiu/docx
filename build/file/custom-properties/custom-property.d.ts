import { XmlComponent } from "../../file/xml-components";
export interface ICustomPropertyOptions {
    readonly name: string;
    readonly value: string;
}
export declare class CustomProperty extends XmlComponent {
    constructor(id: number, properties: ICustomPropertyOptions);
}
export declare class CustomPropertyValue extends XmlComponent {
    constructor(value: string);
}
