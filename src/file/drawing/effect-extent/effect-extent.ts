import { XmlComponent } from "@file/xml-components";
import { EffectExtentAttributes } from "./effect-extent-attributes";

export class EffectExtent extends XmlComponent {
    public constructor() {
        super("wp:effectExtent");

        this.root.push(
            new EffectExtentAttributes({
                b: 0,
                l: 0,
                r: 0,
                t: 0,
            }),
        );
    }
}
