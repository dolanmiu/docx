import { Attributes, XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { decimalNumber } from "@util/values";

class AbstractNumId extends XmlComponent {
    public constructor(value: number) {
        super("w:abstractNumId");
        this.root.push(
            new Attributes({
                val: value,
            }),
        );
    }
}

class NumAttributes extends XmlAttributeComponent<{
    readonly numId: number;
}> {
    protected readonly xmlKeys = { numId: "w:numId" };
}

export interface IConcreteNumberingOptions {
    readonly numId: number;
    readonly abstractNumId: number;
    readonly reference: string;
    readonly instance: number;
    readonly overrideLevel?: {
        readonly num: number;
        readonly start?: number;
    };
}

// <xsd:complexType name="CT_Numbering">
//     ...
//     <xsd:element name="num" type="CT_Num" minOccurs="0" maxOccurs="unbounded"/>

//         <xsd:complexType name="CT_Num">
//             <xsd:sequence>
//                 <xsd:element name="abstractNumId" type="CT_DecimalNumber" minOccurs="1"/>
//                 <xsd:element name="lvlOverride" type="CT_NumLvl" minOccurs="0" maxOccurs="9"/>
//             </xsd:sequence>
//             <xsd:attribute name="numId" type="ST_DecimalNumber" use="required"/>
//         </xsd:complexType>
export class ConcreteNumbering extends XmlComponent {
    public readonly numId: number;
    public readonly reference: string;
    public readonly instance: number;

    public constructor(options: IConcreteNumberingOptions) {
        super("w:num");

        this.numId = options.numId;
        this.reference = options.reference;
        this.instance = options.instance;

        this.root.push(
            new NumAttributes({
                numId: decimalNumber(options.numId),
            }),
        );

        this.root.push(new AbstractNumId(decimalNumber(options.abstractNumId)));

        if (options.overrideLevel) {
            this.root.push(new LevelOverride(options.overrideLevel.num, options.overrideLevel.start));
        }
    }
}

class LevelOverrideAttributes extends XmlAttributeComponent<{ readonly ilvl: number }> {
    protected readonly xmlKeys = { ilvl: "w:ilvl" };
}

export class LevelOverride extends XmlComponent {
    public constructor(levelNum: number, start?: number) {
        super("w:lvlOverride");
        this.root.push(new LevelOverrideAttributes({ ilvl: levelNum }));
        if (start !== undefined) {
            this.root.push(new StartOverride(start));
        }
    }
}

class StartOverrideAttributes extends XmlAttributeComponent<{ readonly val: number }> {
    protected readonly xmlKeys = { val: "w:val" };
}

class StartOverride extends XmlComponent {
    public constructor(start: number) {
        super("w:startOverride");
        this.root.push(new StartOverrideAttributes({ val: start }));
    }
}
