import { XmlUnitComponent } from "../xml-components";

export class Text extends XmlUnitComponent {

    constructor(text: string) {
        super("w:t");
        this.root = text;
    }
}
