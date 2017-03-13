import { XmlComponent } from "../../../../../../../../xml-components";
import { Blip } from "./blip";

export class BlipFill extends XmlComponent {

    constructor(referenceId: number) {
        super("pic:blipFill");
        this.root.push(new Blip(referenceId));
    }
}
