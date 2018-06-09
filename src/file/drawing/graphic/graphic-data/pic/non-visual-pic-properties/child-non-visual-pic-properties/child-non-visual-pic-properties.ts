import { XmlComponent } from "file/xml-components";
import { PicLocks } from "./pic-locks/pic-locks";

export class ChildNonVisualProperties extends XmlComponent {
    constructor() {
        super("pic:cNvPicPr");

        this.root.push(new PicLocks());
    }
}
