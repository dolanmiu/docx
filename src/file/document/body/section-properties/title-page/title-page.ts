import { XmlComponent } from "file/xml-components";
import { TitlePageAttributes } from "./title-page-attributes";

export class TitlePage extends XmlComponent {
    constructor() {
        super("w:titlePg");
        this.root.push(
            new TitlePageAttributes({
                value: "1",
            }),
        );
    }
}
