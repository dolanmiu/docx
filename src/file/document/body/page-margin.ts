import { Attributes, XmlComponent } from "../../xml-components";

export class PageMargin extends XmlComponent {

    constructor() {
        super("w:pgMar");
        this.root.push(new Attributes({
            top: "1440",
            right: "1440",
            bottom: "1440",
            left: "1440",
            header: "708",
            footer: "708",
            gutter: "0",
        }));
    }
}
