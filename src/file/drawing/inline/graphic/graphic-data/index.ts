import { XmlComponent } from "file/xml-components";
import { Pic } from "./pic";

export class GraphicData extends XmlComponent {

    constructor(referenceId: number) {
        super("a:graphicData");
        this.root.push(new Pic(referenceId));
    }
}
