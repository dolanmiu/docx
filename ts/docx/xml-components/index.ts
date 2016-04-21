export abstract class BaseXmlComponent {
    protected rootKey: string;

    constructor(rootKey: string) {
        this.rootKey = rootKey;
    }

    abstract replaceKey(): void;
}

export abstract class XmlComponent extends BaseXmlComponent {
    protected root: Array<BaseXmlComponent>;

    constructor(rootKey: string) {
        super(rootKey);
        this.root = new Array<BaseXmlComponent>();
    }

    replaceKey(): void {
        //console.log(this.rootKey);
        //console.log(this.root);
        if (this.root !== undefined) {
            this.root.forEach(root => {
                root.replaceKey();
            });
            this[this.rootKey] = this.root;
            delete this.root;
        }
    }
}

export abstract class XmlUnitComponent extends BaseXmlComponent {
    protected root: string;

    constructor(rootKey: string) {
        super(rootKey);
    }

    replaceKey(): void {
        if (this.root !== undefined) {
            this[this.rootKey] = this.root;
            delete this.root;
        }
    }
}

interface AttributesProperties {
    val?: any;
    color?: string;
    space?: string;
    sz?: string;
    type?: string;
    rsidR?: string;
    rsidRPr?: string;
    rsidSect?: string;
    w?: string;
    h?: string;
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
    header?: string;
    footer?: string;
    gutter?: string;
    linePitch?: string;
}

export class Attributes extends XmlComponent {
    private _attr: Object;

    xmlKeys = {
        val: "w:val",
        color: "w:color",
        space: "w:space",
        sz: "w:sz",
        type: "w:type",
        rsidR: "w:rsidR",
        rsidRPr: "w:rsidRPr",
        rsidSect: "w:rsidSect",
        w: "w:w",
        h: "w:h",
        top: "w:top",
        right: "w:right",
        bottom: "w:bottom",
        left: "w:left",
        header: "w:header",
        footer: "w:footer",
        gutter: "w:gutter",
        linePitch: "w:linePitch"
    };

    constructor(properties?: AttributesProperties) {
        super("_attr");
        this._attr = properties

        if (!properties) {
            this._attr = {};
        }

        this._attr["xmlKeys"] = this.xmlKeys;
    }
}

export class Text extends XmlUnitComponent {

    constructor(text: string) {
        super("w:t"); //need special xml component
        this.root = text;
    }
}