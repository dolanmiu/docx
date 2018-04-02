import { IMediaData } from "../../file/media";
import { XmlComponent } from "../../file/xml-components";
export declare class Drawing extends XmlComponent {
    private inline;
    constructor(imageData: IMediaData);
    scale(factorX: number, factorY: number): void;
}
