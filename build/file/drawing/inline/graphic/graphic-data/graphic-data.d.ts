import { IMediaData, IMediaDataTransformation } from "../../../../../file/media";
import { XmlComponent } from "../../../../../file/xml-components";
export declare class GraphicData extends XmlComponent {
    private readonly pic;
    constructor(mediaData: IMediaData, transform: IMediaDataTransformation);
}
