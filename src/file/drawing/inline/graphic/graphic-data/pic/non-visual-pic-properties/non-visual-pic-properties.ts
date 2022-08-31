import { XmlComponent } from "@file/xml-components";
import { ChildNonVisualProperties } from "./child-non-visual-pic-properties/child-non-visual-pic-properties";
import { NonVisualProperties } from "./non-visual-properties/non-visual-properties";

export class NonVisualPicProperties extends XmlComponent {
    public constructor() {
        super("pic:nvPicPr");

        this.root.push(new NonVisualProperties());
        this.root.push(new ChildNonVisualProperties());
    }
}
