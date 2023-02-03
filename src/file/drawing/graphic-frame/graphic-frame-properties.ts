import { XmlComponent } from "@file/xml-components";
import { GraphicFrameLocks } from "./graphic-frame-locks/graphic-frame-locks";

export class GraphicFrameProperties extends XmlComponent {
    public constructor() {
        super("wp:cNvGraphicFramePr");

        this.root.push(new GraphicFrameLocks());
    }
}
