import { XmlAttributeComponent, XmlComponent } from "../xml-components";

class TabStop extends XmlComponent {

    constructor(tab: Tab) {
        super("w:tabs");
        this.root.push(tab);
    }
}

export type tabOptions = "left" | "right";

class TabAttributes extends XmlAttributeComponent<{val: tabOptions, pos: string | number}> {
    protected xmlKeys = {val: "w:val", pos: "w:pos"};
}

class Tab extends XmlComponent {

    constructor(value: tabOptions, position: string | number) {
        super("w:tab");
        this.root.push(new TabAttributes({
            val: value,
            pos: position,
        }));
    }
}

export class MaxRightTabStop extends TabStop {
    constructor() {
        super(new Tab("right", 9026));
    }
}

export class LeftTabStop extends TabStop {
    constructor(position: number) {
        super(new Tab("left", position));
    }
}
