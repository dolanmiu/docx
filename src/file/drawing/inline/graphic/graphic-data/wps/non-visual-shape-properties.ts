import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

export type INonVisualShapePropertiesOptions = {
    readonly txBox: string;
};

class NonVisualShapePropertiesAttributes extends XmlAttributeComponent<{
    readonly txBox: string;
}> {
    protected readonly xmlKeys = {
        txBox: "txBox",
    };
}

export class NonVisualShapeProperties extends XmlComponent {
    public constructor(options: INonVisualShapePropertiesOptions = { txBox: "1" }) {
        super("wps:cNvSpPr");

        this.root.push(
            new NonVisualShapePropertiesAttributes({
                txBox: options.txBox,
            }),
        );
    }
}
