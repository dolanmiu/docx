export abstract class BaseXmlComponent {
    protected rootKey: string;

    constructor(rootKey: string) {
        this.rootKey = rootKey;
    }

    public abstract prepForXml(): XmlableObject;
}
