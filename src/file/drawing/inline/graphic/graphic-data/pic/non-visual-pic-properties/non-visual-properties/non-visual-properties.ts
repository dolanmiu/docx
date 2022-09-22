import { XmlComponent } from "@file/xml-components";
import { NonVisualPropertiesAttributes } from "./non-visual-properties-attributes";

export class NonVisualProperties extends XmlComponent {
    public constructor() {
        super("pic:cNvPr");

        this.root.push(
            new NonVisualPropertiesAttributes({
                id: 0,
                name: "",
                descr: "",
            }),
        );
    }
}
