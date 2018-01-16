import { XmlComponent } from "file/xml-components";
import { GraphicDataAttributes } from "./graphic-data-attribute";
import { Pic } from "./pic";

export class GraphicData extends XmlComponent {

    constructor(referenceId: number) {
        super("a:graphicData");

        this.root.push(new GraphicDataAttributes({
            uri: "http://schemas.openxmlformats.org/drawingml/2006/picture",
        }));

        this.root.push(new Pic(referenceId));
    }
}
