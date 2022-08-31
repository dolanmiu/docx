import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

enum FieldCharacterType {
    BEGIN = "begin",
    END = "end",
    SEPARATE = "separate",
}

class FidCharAttrs extends XmlAttributeComponent<{ readonly type: FieldCharacterType; readonly dirty?: boolean }> {
    protected readonly xmlKeys = { type: "w:fldCharType", dirty: "w:dirty" };
}

export class Begin extends XmlComponent {
    public constructor(dirty?: boolean) {
        super("w:fldChar");
        this.root.push(new FidCharAttrs({ type: FieldCharacterType.BEGIN, dirty }));
    }
}

export class Separate extends XmlComponent {
    public constructor(dirty?: boolean) {
        super("w:fldChar");
        this.root.push(new FidCharAttrs({ type: FieldCharacterType.SEPARATE, dirty }));
    }
}

export class End extends XmlComponent {
    public constructor(dirty?: boolean) {
        super("w:fldChar");
        this.root.push(new FidCharAttrs({ type: FieldCharacterType.END, dirty }));
    }
}
