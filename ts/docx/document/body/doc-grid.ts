import { Attributes, XmlComponent } from "../../xml-components";

export class DocumentGrid extends XmlComponent {

    constructor() {
        super("w:docGrid");
        this.root.push(new Attributes({
            linePitch: "360",
        }));
    }
}
