import { XmlComponent } from "../../../../../xml-components";
import { GraphicData } from "./graphic-data";

export class Graphic extends XmlComponent {

    constructor(referenceId: number) {
        super("a:graphic");
        this.root.push(new GraphicData(referenceId));
    }
}
