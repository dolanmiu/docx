import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

interface IComponentAttributes {
    readonly val: string;
}

class ComponentAttributes extends XmlAttributeComponent<IComponentAttributes> {
    protected readonly xmlKeys = { val: "w:val" };
}

export class Name extends XmlComponent {
    constructor(value: string) {
        super("w:name");
        this.root.push(new ComponentAttributes({ val: value }));
    }
}

export class BasedOn extends XmlComponent {
    constructor(value: string) {
        super("w:basedOn");
        this.root.push(new ComponentAttributes({ val: value }));
    }
}

export class Next extends XmlComponent {
    constructor(value: string) {
        super("w:next");
        this.root.push(new ComponentAttributes({ val: value }));
    }
}

export class Link extends XmlComponent {
    constructor(value: string) {
        super("w:link");
        this.root.push(new ComponentAttributes({ val: value }));
    }
}

export class UiPriority extends XmlComponent {
    constructor(value: string) {
        super("w:uiPriority");
        // TODO: this value should be a ST_DecimalNumber
        this.root.push(new ComponentAttributes({ val: value }));
    }
}

export class UnhideWhenUsed extends XmlComponent {
    constructor() {
        super("w:unhideWhenUsed");
    }
}

export class QuickFormat extends XmlComponent {
    constructor() {
        super("w:qFormat");
    }
}

export class TableProperties extends XmlComponent {}

export class RsId extends XmlComponent {}

export class SemiHidden extends XmlComponent {
    constructor() {
        super("w:semiHidden");
    }
}
