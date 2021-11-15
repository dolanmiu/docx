import { XmlComponent } from "../../../file/xml-components";
export declare class SimpleField extends XmlComponent {
    constructor(instruction: string, cachedValue?: string);
}
export declare class SimpleMailMergeField extends SimpleField {
    constructor(fieldName: string);
}
