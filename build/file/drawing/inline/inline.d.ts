import { IMediaDataDimensions } from "../../../file/media";
import { XmlComponent } from "../../../file/xml-components";
export declare class Inline extends XmlComponent {
    private dimensions;
    private extent;
    private graphic;
    constructor(referenceId: number, dimensions: IMediaDataDimensions);
    scale(factorX: number, factorY: number): void;
}
