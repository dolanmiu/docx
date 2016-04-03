import {XmlComponent, Attributes} from "../../xml-components";

export class DocumentGrid implements XmlComponent {
    private docGrid: Array<XmlComponent>;
    
    xmlKeys = {
        docGrid: 'w:docGrid'
    }

    constructor() {
        this.docGrid = new Array<XmlComponent>();
        this.docGrid.push(new Attributes({
            linePitch: "360"
        }));
    }
}