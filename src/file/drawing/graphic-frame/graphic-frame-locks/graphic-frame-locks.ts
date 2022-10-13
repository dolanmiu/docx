import { XmlComponent } from "@file/xml-components";
import { GraphicFrameLockAttributes } from "./graphic-frame-lock-attributes";

export class GraphicFrameLocks extends XmlComponent {
    public constructor() {
        super("a:graphicFrameLocks");

        this.root.push(
            new GraphicFrameLockAttributes({
                xmlns: "http://schemas.openxmlformats.org/drawingml/2006/main",
                noChangeAspect: 1,
            }),
        );
    }
}
