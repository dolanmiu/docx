import { XmlComponent } from "../../file/xml-components";
export declare class Title extends XmlComponent {
    constructor(value: string);
}
export declare class Subject extends XmlComponent {
    constructor(value: string);
}
export declare class Creator extends XmlComponent {
    constructor(value: string);
}
export declare class Keywords extends XmlComponent {
    constructor(value: string);
}
export declare class Description extends XmlComponent {
    constructor(value: string);
}
export declare class LastModifiedBy extends XmlComponent {
    constructor(value: string);
}
export declare class Revision extends XmlComponent {
    constructor(value: string);
}
export declare abstract class DateComponent extends XmlComponent {
    protected getCurrentDate(): string;
}
export declare class Created extends DateComponent {
    constructor();
}
export declare class Modified extends DateComponent {
    constructor();
}
