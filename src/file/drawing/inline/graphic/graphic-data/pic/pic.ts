import { XmlComponent } from "file/xml-components";
import { BlipFill } from "./blip/blip-fill";
import { NonVisualPicProperties } from "./non-visual-pic-properties/non-visual-pic-properties";

export class Pic extends XmlComponent {

    constructor(referenceId: number) {
        super("pic:pic");

        this.root.push(new NonVisualPicProperties());
        this.root.push(new BlipFill(referenceId));
    }
}
