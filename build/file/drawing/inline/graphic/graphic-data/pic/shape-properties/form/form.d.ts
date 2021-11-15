import { IMediaDataTransformation } from "../../../../../../../../file/media";
import { XmlAttributeComponent, XmlComponent } from "../../../../../../../../file/xml-components";
export declare class FormAttributes extends XmlAttributeComponent<{
    readonly flipVertical?: boolean;
    readonly flipHorizontal?: boolean;
    readonly rotation?: number;
}> {
    protected readonly xmlKeys: {
        flipVertical: string;
        flipHorizontal: string;
        rotation: string;
    };
}
export declare class Form extends XmlComponent {
    private readonly extents;
    constructor(options: IMediaDataTransformation);
}
