import { IMediaData, IMediaDataTransformation } from "../../../../file/media";
import { XmlComponent } from "../../../../file/xml-components";
export declare class Graphic extends XmlComponent {
    private readonly data;
    constructor(mediaData: IMediaData, transform: IMediaDataTransformation);
}
