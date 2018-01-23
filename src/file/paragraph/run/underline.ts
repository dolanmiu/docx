import { Attributes, XmlComponent } from "file/xml-components";

export abstract class BaseUnderline extends XmlComponent {
    constructor(underlineType: string, color?: string) {
        super("w:u");
        this.root.push(
            new Attributes({
                val: underlineType,
                color: color,
            }),
        );
    }
}

export class Underline extends BaseUnderline {
    constructor(underlineType: string = "single", color?: string) {
        super(underlineType, color);
    }
}

export class DashUnderline extends BaseUnderline {
    constructor() {
        super("dash");
    }
}

export class DashDotDotHeavyUnderline extends BaseUnderline {
    constructor() {
        super("dashDotDotHeavy");
    }
}

export class DashDotHeavyUnderline extends BaseUnderline {
    constructor() {
        super("dashDotHeavy");
    }
}

export class DashLongUnderline extends BaseUnderline {
    constructor() {
        super("dashLong");
    }
}

export class DashLongHeavyUnderline extends BaseUnderline {
    constructor() {
        super("dashLongHeavy");
    }
}

export class DotDashUnderline extends BaseUnderline {
    constructor() {
        super("dotDash");
    }
}

export class DotDotDashUnderline extends BaseUnderline {
    constructor() {
        super("dotDotDash");
    }
}

export class DottedUnderline extends BaseUnderline {
    constructor() {
        super("dotted");
    }
}

export class DottedHeavyUnderline extends BaseUnderline {
    constructor() {
        super("dottedHeavy");
    }
}

export class DoubleUnderline extends BaseUnderline {
    constructor() {
        super("double");
    }
}

export class SingleUnderline extends BaseUnderline {
    constructor() {
        super("single");
    }
}

export class ThickUnderline extends BaseUnderline {
    constructor() {
        super("thick");
    }
}

export class WaveUnderline extends BaseUnderline {
    constructor() {
        super("wave");
    }
}

export class WavyDoubleUnderline extends BaseUnderline {
    constructor() {
        super("wavyDouble");
    }
}

export class WavyHeavyUnderline extends BaseUnderline {
    constructor() {
        super("wavyHeavy");
    }
}

export class WordsUnderline extends BaseUnderline {
    constructor() {
        super("words");
    }
}
