import { XmlComponent } from "@file/xml-components";

export abstract class InitializableXmlComponent extends XmlComponent {
    public constructor(rootKey: string, initComponent?: InitializableXmlComponent) {
        super(rootKey);

        if (initComponent) {
            this.root = initComponent.root;
        }
    }
}
