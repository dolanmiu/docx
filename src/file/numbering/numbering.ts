// http://officeopenxml.com/WPnumbering.php
// https://stackoverflow.com/questions/58622437/purpose-of-abstractnum-and-numberinginstance
import { AlignmentType } from "@file/paragraph";
import { IContext, IXmlableObject, XmlComponent } from "@file/xml-components";
import { convertInchesToTwip, uniqueNumericId } from "@util/convenience-functions";

import { DocumentAttributes } from "../document/document-attributes";
import { AbstractNumbering } from "./abstract-numbering";
import { ILevelsOptions, LevelFormat } from "./level";
import { ConcreteNumbering } from "./num";

export interface INumberingOptions {
    readonly config: readonly {
        readonly levels: readonly ILevelsOptions[];
        readonly reference: string;
    }[];
}

// <xsd:element name="numbering" type="CT_Numbering"/>
//
//     <xsd:complexType name="CT_Numbering">
//         <xsd:sequence>
//             <xsd:element name="numPicBullet" type="CT_NumPicBullet" minOccurs="0" maxOccurs="unbounded"/>
//             <xsd:element name="abstractNum" type="CT_AbstractNum" minOccurs="0" maxOccurs="unbounded"/>
//             <xsd:element name="num" type="CT_Num" minOccurs="0" maxOccurs="unbounded"/>
//             <xsd:element name="numIdMacAtCleanup" type="CT_DecimalNumber" minOccurs="0"/>
//         </xsd:sequence>
//     </xsd:complexType>
export class Numbering extends XmlComponent {
    private readonly abstractNumberingMap = new Map<string, AbstractNumbering>();
    private readonly concreteNumberingMap = new Map<string, ConcreteNumbering>();
    private readonly referenceConfigMap = new Map<string, object>();

    public constructor(options: INumberingOptions) {
        super("w:numbering");
        this.root.push(
            new DocumentAttributes({
                wpc: "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas",
                mc: "http://schemas.openxmlformats.org/markup-compatibility/2006",
                o: "urn:schemas-microsoft-com:office:office",
                r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
                m: "http://schemas.openxmlformats.org/officeDocument/2006/math",
                v: "urn:schemas-microsoft-com:vml",
                wp14: "http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing",
                wp: "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
                w10: "urn:schemas-microsoft-com:office:word",
                w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
                w14: "http://schemas.microsoft.com/office/word/2010/wordml",
                w15: "http://schemas.microsoft.com/office/word/2012/wordml",
                wpg: "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup",
                wpi: "http://schemas.microsoft.com/office/word/2010/wordprocessingInk",
                wne: "http://schemas.microsoft.com/office/word/2006/wordml",
                wps: "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
                Ignorable: "w14 w15 wp14",
            }),
        );

        const abstractNumbering = new AbstractNumbering(uniqueNumericId(), [
            {
                level: 0,
                format: LevelFormat.BULLET,
                text: "\u25CF",
                alignment: AlignmentType.LEFT,
                style: {
                    paragraph: {
                        indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) },
                    },
                },
            },
            {
                level: 1,
                format: LevelFormat.BULLET,
                text: "\u25CB",
                alignment: AlignmentType.LEFT,
                style: {
                    paragraph: {
                        indent: { left: convertInchesToTwip(1), hanging: convertInchesToTwip(0.25) },
                    },
                },
            },
            {
                level: 2,
                format: LevelFormat.BULLET,
                text: "\u25A0",
                alignment: AlignmentType.LEFT,
                style: {
                    paragraph: {
                        indent: { left: 2160, hanging: convertInchesToTwip(0.25) },
                    },
                },
            },
            {
                level: 3,
                format: LevelFormat.BULLET,
                text: "\u25CF",
                alignment: AlignmentType.LEFT,
                style: {
                    paragraph: {
                        indent: { left: 2880, hanging: convertInchesToTwip(0.25) },
                    },
                },
            },
            {
                level: 4,
                format: LevelFormat.BULLET,
                text: "\u25CB",
                alignment: AlignmentType.LEFT,
                style: {
                    paragraph: {
                        indent: { left: 3600, hanging: convertInchesToTwip(0.25) },
                    },
                },
            },
            {
                level: 5,
                format: LevelFormat.BULLET,
                text: "\u25A0",
                alignment: AlignmentType.LEFT,
                style: {
                    paragraph: {
                        indent: { left: 4320, hanging: convertInchesToTwip(0.25) },
                    },
                },
            },
            {
                level: 6,
                format: LevelFormat.BULLET,
                text: "\u25CF",
                alignment: AlignmentType.LEFT,
                style: {
                    paragraph: {
                        indent: { left: 5040, hanging: convertInchesToTwip(0.25) },
                    },
                },
            },
            {
                level: 7,
                format: LevelFormat.BULLET,
                text: "\u25CF",
                alignment: AlignmentType.LEFT,
                style: {
                    paragraph: {
                        indent: { left: 5760, hanging: convertInchesToTwip(0.25) },
                    },
                },
            },
            {
                level: 8,
                format: LevelFormat.BULLET,
                text: "\u25CF",
                alignment: AlignmentType.LEFT,
                style: {
                    paragraph: {
                        indent: { left: 6480, hanging: convertInchesToTwip(0.25) },
                    },
                },
            },
        ]);

        this.concreteNumberingMap.set(
            "default-bullet-numbering",
            new ConcreteNumbering({
                numId: 1,
                abstractNumId: abstractNumbering.id,
                reference: "default-bullet-numbering",
                instance: 0,
                overrideLevel: {
                    num: 0,
                    start: 1,
                },
            }),
        );

        this.abstractNumberingMap.set("default-bullet-numbering", abstractNumbering);

        for (const con of options.config) {
            this.abstractNumberingMap.set(con.reference, new AbstractNumbering(uniqueNumericId(), con.levels));
            this.referenceConfigMap.set(con.reference, con.levels);
        }
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        for (const numbering of this.abstractNumberingMap.values()) {
            this.root.push(numbering);
        }

        for (const numbering of this.concreteNumberingMap.values()) {
            this.root.push(numbering);
        }
        return super.prepForXml(context);
    }

    public createConcreteNumberingInstance(reference: string, instance: number): void {
        const abstractNumbering = this.abstractNumberingMap.get(reference);

        if (!abstractNumbering) {
            return;
        }

        const fullReference = `${reference}-${instance}`;

        if (this.concreteNumberingMap.has(fullReference)) {
            return;
        }

        const referenceConfigLevels = this.referenceConfigMap.get(reference);
        const firstLevelStartNumber = referenceConfigLevels && referenceConfigLevels[0].start;

        const concreteNumberingSettings = {
            numId: uniqueNumericId(),
            abstractNumId: abstractNumbering.id,
            reference,
            instance,
            overrideLevel:
                firstLevelStartNumber && Number.isInteger(firstLevelStartNumber)
                    ? {
                          num: 0,
                          start: firstLevelStartNumber,
                      }
                    : {
                          num: 0,
                          start: 1,
                      },
        };

        this.concreteNumberingMap.set(fullReference, new ConcreteNumbering(concreteNumberingSettings));
    }

    public get ConcreteNumbering(): readonly ConcreteNumbering[] {
        return Array.from(this.concreteNumberingMap.values());
    }
    public get ReferenceConfig(): readonly object[] {
        return Array.from(this.referenceConfigMap.values());
    }
}
