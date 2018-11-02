import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

interface IBlipProperties {
    readonly embed: string;
    readonly cstate: string;
}

class BlipAttributes extends XmlAttributeComponent<IBlipProperties> {
    protected readonly xmlKeys = {
        embed: "r:embed",
        cstate: "cstate",
    };
}

export class Blip extends XmlComponent {
    constructor(referenceId: number) {
        super("a:blip");
        this.root.push(
            new BlipAttributes({
                embed: `rId${referenceId}`,
                cstate: "none",
            }),
        );
    }
}
