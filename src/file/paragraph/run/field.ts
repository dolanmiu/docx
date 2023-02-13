// http://www.datypic.com/sc/ooxml/e-w_fldChar-1.html
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

// <xsd:complexType name="CT_FldChar">
//     <xsd:choice>
//         <xsd:element name="fldData" type="CT_Text" minOccurs="0" maxOccurs="1" />
//         <xsd:element name="ffData" type="CT_FFData" minOccurs="0" maxOccurs="1" />
//         <xsd:element name="numberingChange" type="CT_TrackChangeNumbering" minOccurs="0" />
//     </xsd:choice>
//     <xsd:attribute name="fldCharType" type="ST_FldCharType" use="required" />
//     <xsd:attribute name="fldLock" type="s:ST_OnOff" />
//     <xsd:attribute name="dirty" type="s:ST_OnOff" />
// </xsd:complexType>

enum FieldCharacterType {
    BEGIN = "begin",
    END = "end",
    SEPARATE = "separate",
}

class FidCharAttrs extends XmlAttributeComponent<{
    readonly type: FieldCharacterType;
    readonly dirty?: boolean;
    readonly fieldLock?: boolean;
}> {
    protected readonly xmlKeys = { type: "w:fldCharType", dirty: "w:dirty", fieldLock: "w:fldLock" };
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
