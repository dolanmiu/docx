import { XmlComponent } from "../../xml-components";

export class Body extends XmlComponent {

    constructor() {
        super("w:body");
    }

    public push(component: XmlComponent): void {
        this.root.push(component);
    }
}
