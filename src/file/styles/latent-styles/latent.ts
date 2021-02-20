import { XmlComponent } from "file/xml-components";
import { LatentStyleException } from "./exceptions";

export class LatentStyles extends XmlComponent {
    constructor() {
        super("w:latentStyles");
    }

    public push(latentException: LatentStyleException): void {
        this.root.push(latentException);
    }
}
