import {XmlComponent, Attributes} from "../xml-components";

class TabStop extends XmlComponent {

    constructor(tab: Tab) {
        super("w:tabs");
        this.root.push(tab);
    }
}

class Tab extends XmlComponent {

    constructor(value: string, position: any) {
        super("w:tab");
        this.root.push(new Attributes({
            val: value,
            pos: position
        }));
    }
}

export class MaxRightTabStop extends TabStop {
    constructor() {
        super(new Tab("right", "RIGHT_MARGIN"));
    }
}

export class LeftTabStop extends TabStop {
    constructor(position: number) {
        super(new Tab("left", position));
    }
}
