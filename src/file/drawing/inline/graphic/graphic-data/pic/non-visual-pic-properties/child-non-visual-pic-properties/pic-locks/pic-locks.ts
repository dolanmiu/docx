import { XmlComponent } from "@file/xml-components";
import { PicLocksAttributes } from "./pic-locks-attributes";

export class PicLocks extends XmlComponent {
    public constructor() {
        super("a:picLocks");
        this.root.push(
            new PicLocksAttributes({
                noChangeAspect: 1,
                noChangeArrowheads: 1,
            }),
        );
    }
}
