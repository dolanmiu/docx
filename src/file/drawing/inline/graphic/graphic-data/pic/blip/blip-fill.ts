import { XmlComponent } from "file/xml-components";
import { Blip } from "./blip";
import { SourceRectangle } from "./source-rectangle";
import { Stretch } from "./stretch";

export class BlipFill extends XmlComponent {
    constructor(referenceId: number) {
        super("pic:blipFill");
        this.root.push(new Blip(referenceId));
        this.root.push(new SourceRectangle());
        this.root.push(new Stretch());
    }
}
