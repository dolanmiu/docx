import { XmlAttributeComponent, XmlComponent } from "../xml-components";

export class TabStop extends XmlComponent {

    constructor(tab: Tab) {
        super("w:tabs");
        this.root.push(tab);
    }
}

export type TabOptions = "left" | "right";

export class TabAttributes extends XmlAttributeComponent<{val: TabOptions, pos: string | number}> {
    protected xmlKeys = {val: "w:val", pos: "w:pos"};
}

export class Tab extends XmlComponent {

    constructor(value: TabOptions, position: string | number) {
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
