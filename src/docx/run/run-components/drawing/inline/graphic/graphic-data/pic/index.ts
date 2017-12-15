import { XmlComponent } from "../../../../../../../xml-components";
import { BlipFill } from "./blip/blip-fill";

export class Pic extends XmlComponent {

    constructor(referenceId: number) {
        super("pic:pic");
        this.root.push(new BlipFill(referenceId));
    }
}
