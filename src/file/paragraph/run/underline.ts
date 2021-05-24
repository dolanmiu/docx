import { Attributes, XmlComponent } from "file/xml-components";

export enum UnderlineType {
    SINGLE = "single",
    WORDS = "words",
    DOUBLE = "double",
    THICK = "thick",
    DOTTED = "dotted",
    DOTTEDHEAVY = "dottedHeavy",
    DASH = "dash",
    DASHEDHEAVY = "dashedHeavy",
    DASHLONG = "dashLong",
    DASHLONGHEAVY = "dashLongHeavy",
    DOTDASH = "dotDash",
    DASHDOTHEAVY = "dashDotHeavy",
    DOTDOTDASH = "dotDotDash",
    DASHDOTDOTHEAVY = "dashDotDotHeavy",
    WAVE = "wave",
    WAVYHEAVY = "wavyHeavy",
    WAVYDOUBLE = "wavyDouble",
}

export abstract class BaseUnderline extends XmlComponent {
    constructor(underlineType: UnderlineType, color?: string) {
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
    constructor(underlineType: UnderlineType = UnderlineType.SINGLE, color?: string) {
        super(underlineType, color);
    }
}

export class DashUnderline extends BaseUnderline {
    constructor() {
        super(UnderlineType.DASH);
    }
}

export class DashDotDotHeavyUnderline extends BaseUnderline {
    constructor() {
        super(UnderlineType.DASHDOTDOTHEAVY);
    }
}

export class DashDotHeavyUnderline extends BaseUnderline {
    constructor() {
        super(UnderlineType.DASHDOTHEAVY);
    }
}

export class DashLongUnderline extends BaseUnderline {
    constructor() {
        super(UnderlineType.DASHLONG);
    }
}

export class DashLongHeavyUnderline extends BaseUnderline {
    constructor() {
        super(UnderlineType.DASHLONGHEAVY);
    }
}

export class DotDashUnderline extends BaseUnderline {
    constructor() {
        super(UnderlineType.DOTDASH);
    }
}

export class DotDotDashUnderline extends BaseUnderline {
    constructor() {
        super(UnderlineType.DOTDOTDASH);
    }
}

export class DottedUnderline extends BaseUnderline {
    constructor() {
        super(UnderlineType.DOTTED);
    }
}

export class DottedHeavyUnderline extends BaseUnderline {
    constructor() {
        super(UnderlineType.DOTTEDHEAVY);
    }
}

export class DoubleUnderline extends BaseUnderline {
    constructor() {
        super(UnderlineType.DOUBLE);
    }
}

export class SingleUnderline extends BaseUnderline {
    constructor() {
        super(UnderlineType.SINGLE);
    }
}

export class ThickUnderline extends BaseUnderline {
    constructor() {
        super(UnderlineType.THICK);
    }
}

export class WaveUnderline extends BaseUnderline {
    constructor() {
        super(UnderlineType.WAVE);
    }
}

export class WavyDoubleUnderline extends BaseUnderline {
    constructor() {
        super(UnderlineType.WAVYDOUBLE);
    }
}

export class WavyHeavyUnderline extends BaseUnderline {
    constructor() {
        super(UnderlineType.WAVYHEAVY);
    }
}

export class WordsUnderline extends BaseUnderline {
    constructor() {
        super(UnderlineType.WORDS);
    }
}
