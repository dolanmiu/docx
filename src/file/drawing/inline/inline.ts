import { XmlComponent } from "file/xml-components";
import { Graphic } from "./graphic";
import { GraphicFrameProperties } from "./graphic-frame/graphic-frame-properties";

export class Inline extends XmlComponent {

    constructor(referenceId: number) {
        super("wp:inline");

        this.root.push(new GraphicFrameProperties());
        this.root.push(new Graphic(referenceId));
    }
}
