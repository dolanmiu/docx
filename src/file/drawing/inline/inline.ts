import { XmlComponent } from "file/xml-components";
import { Graphic } from "./graphic";
import { GraphicFrameProperties } from "./graphic-frame/graphic-frame-properties";
import { InlineAttributes } from "./inline-attributes";

export class Inline extends XmlComponent {

    constructor(referenceId: number) {
        super("wp:inline");

        this.root.push(new InlineAttributes({
            distT: 0,
            distB: 0,
            distL: 0,
            distR: 0,
        }));

        this.root.push(new GraphicFrameProperties());
        this.root.push(new Graphic(referenceId));
    }
}
