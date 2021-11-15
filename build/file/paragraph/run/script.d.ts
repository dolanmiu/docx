import { XmlComponent } from "../../../file/xml-components";
export declare abstract class VerticalAlign extends XmlComponent {
    constructor(type: string);
}
export declare class SuperScript extends VerticalAlign {
    constructor();
}
export declare class SubScript extends VerticalAlign {
    constructor();
}
