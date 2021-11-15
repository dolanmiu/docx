import { IMediaData, IMediaDataTransformation } from "../../../file/media";
import { XmlComponent } from "../../../file/xml-components";
export declare class Inline extends XmlComponent {
    private readonly extent;
    private readonly graphic;
    constructor(mediaData: IMediaData, transform: IMediaDataTransformation);
}
