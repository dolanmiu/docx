import { XmlComponent } from "file/xml-components";
import { GraphicDataAttributes } from "./graphic-data-attribute";
import { Pic } from "./pic";

export class GraphicData extends XmlComponent {
    private readonly pic: Pic;

    constructor(referenceId: number, x: number, y: number) {
        super("a:graphicData");

        this.root.push(
            new GraphicDataAttributes({
                uri: "http://schemas.openxmlformats.org/drawingml/2006/picture",
            }),
        );

        this.pic = new Pic(referenceId, x, y);

        this.root.push(this.pic);
    }

    public setXY(x: number, y: number): void {
        this.pic.setXY(x, y);
    }
}
