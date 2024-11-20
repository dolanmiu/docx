import { XmlComponent } from "@file/xml-components";

import { Shape } from "../shape/shape";

export type IPictElement = {
    readonly shape: Shape;
};

export class PictElement extends XmlComponent {
    public constructor({ shape }: IPictElement) {
        super("w:pict");
        this.root.push(shape);
    }
}
