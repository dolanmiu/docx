import { XmlComponent } from "../../../../file/xml-components";
export declare class Graphic extends XmlComponent {
    private data;
    constructor(referenceId: number, x: number, y: number);
    setXY(x: number, y: number): void;
}
