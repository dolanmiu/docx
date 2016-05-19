export abstract class BaseXmlComponent {
    protected rootKey: string;

    constructor(rootKey: string) {
        this.rootKey = rootKey;
    }

    abstract replaceKey(): void;
    clearVariables(): void {
    };
}