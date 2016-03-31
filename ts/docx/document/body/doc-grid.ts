import {XmlComponent, Attributes} from "../../xml-components";

export class DocumentGrid {
    private docGrid: Array<XmlComponent>;

    constructor() {
        this.docGrid = new Array<XmlComponent>();
        this.docGrid.push(new Attributes({
            linePitch: "360"
        }));
    }
}