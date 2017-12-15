import { XmlAttributeComponent, XmlComponent } from "../../../../../xml-components";
import { GraphicData } from "./graphic-data";

interface IGraphicProperties {
    a: string;
}

class GraphicAttributes extends XmlAttributeComponent<IGraphicProperties> {
    protected xmlKeys = {
        a: "xmlns:a",
    };
}

export class Graphic extends XmlComponent {

    constructor(referenceId: number) {
        super("a:graphic");
        this.root.push(new GraphicAttributes({
            a: "http://schemas.openxmlformats.org/drawingml/2006/main",
        }));
        this.root.push(new GraphicData(referenceId));
    }
}
