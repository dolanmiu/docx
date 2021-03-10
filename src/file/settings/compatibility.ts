import { XmlComponent } from "file/xml-components";
import { CompatibilitySetting } from "./compatibility-setting/compatibility-setting";

class DoNotExpandShiftReturn extends XmlComponent {
    constructor() {
        super("w:doNotExpandShiftReturn");
    }
}

export interface ICompatibilityOptions {
    readonly doNotExpandShiftReturn?: boolean;
    readonly version?: number;
}

export class Compatibility extends XmlComponent {
    constructor(options: ICompatibilityOptions) {
        super("w:compat");

        if (options.doNotExpandShiftReturn) {
            this.root.push(new DoNotExpandShiftReturn());
        }

        if (options.version) {
            this.root.push(new CompatibilitySetting(options.version));
        }
    }
}
