import { XmlComponent } from "../../../../xml-components";
import { Graphic } from "./graphic";

export class Inline extends XmlComponent {

    constructor(referenceId: number) {
        super("wp:inline");
        this.root.push(new Graphic(referenceId));
    }
}
