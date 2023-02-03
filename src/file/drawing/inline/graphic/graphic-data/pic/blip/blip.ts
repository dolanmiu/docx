import { IMediaData } from "@file/media";
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

class BlipAttributes extends XmlAttributeComponent<{
    readonly embed: string;
    readonly cstate: string;
}> {
    protected readonly xmlKeys = {
        embed: "r:embed",
        cstate: "cstate",
    };
}

export class Blip extends XmlComponent {
    public constructor(mediaData: IMediaData) {
        super("a:blip");
        this.root.push(
            new BlipAttributes({
                embed: `rId{${mediaData.fileName}}`,
                cstate: "none",
            }),
        );
    }
}
