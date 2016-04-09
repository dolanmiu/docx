import {XmlComponent} from "../../docx/xml-components";
import {LatentStyleException} from "./exceptions";

export class LatentStyles implements XmlComponent {
    private latentStyles: Array<XmlComponent>;
    
    xmlKeys = {
        latentStyles: "w:latentStyles"
    }
    
    constructor() {
        this.latentStyles = new Array<XmlComponent>();
    }
    
    push(latentException: LatentStyleException): void {
        this.latentStyles.push(latentException);
    }
}