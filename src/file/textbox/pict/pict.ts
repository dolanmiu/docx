import { XmlComponent } from "@file/xml-components";
import { Shape } from "../shape/shape";

export interface IPict {
    readonly shape: Shape;
}

export class Pict extends XmlComponent {
    public constructor({ shape }: IPict) {
        super("w:pict");
        this.root.push(shape);
    }
}
