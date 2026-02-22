/**
 * Numbering module for WordprocessingML documents.
 *
 * Numbering provides support for numbered and bulleted lists.
 *
 * Reference: http://officeopenxml.com/WPnumbering.php
 *
 * @see https://stackoverflow.com/questions/58622437/purpose-of-abstractnum-and-numberinginstance
 *
 * @module
 */
import { AlignmentType } from "@file/paragraph";
import { type IContext, type IXmlableObject, XmlComponent } from "@file/xml-components";
import { abstractNumUniqueNumericIdGen, concreteNumUniqueNumericIdGen, convertInchesToTwip } from "@util/convenience-functions";

import { AbstractNumbering } from "./abstract-numbering";
import { type ILevelsOptions, LevelFormat } from "./level";
import { ConcreteNumbering } from "./num";
import { DocumentAttributes } from "../document/document-attributes";

/**
 * Options for configuring numbering definitions.
 *
 * @property config - Array of numbering configurations
 *
 * @see {@link Numbering}
 */
export type INumberingOptions = {
    /** Array of numbering configurations, each with levels and a reference name. */
    readonly config: readonly {
        /** Array of level definitions for this numbering configuration. */
        readonly levels: readonly ILevelsOptions[];
        /** Unique reference name for this numbering configuration. */
        readonly reference: string;
    }[];
};

/**
 * Represents the numbering definitions in a WordprocessingML document.
 *
 * The numbering element contains abstract numbering definitions and their
 * concrete instances, which are referenced by paragraphs to create lists.
 * Each numbering configuration includes a default bullet list and any
 * custom numbering schemes defined by the user.
 *
 * Reference: http://officeopenxml.com/WPnumbering.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="numbering" type="CT_Numbering"/>
 *
 * <xsd:complexType name="CT_Numbering">
 *   <xsd:sequence>
 *     <xsd:element name="numPicBullet" type="CT_NumPicBullet" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="abstractNum" type="CT_AbstractNum" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="num" type="CT_Num" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="numIdMacAtCleanup" type="CT_DecimalNumber" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create numbering with custom decimal list
 * const numbering = new Numbering({
 *   config: [
 *     {
 *       reference: "my-decimal-list",
 *       levels: [
 *         {
 *           level: 0,
 *           format: LevelFormat.DECIMAL,
 *           text: "%1.",
 *           alignment: AlignmentType.LEFT,
 *           start: 1,
 *           style: {
 *             paragraph: {
 *               indent: { left: 720, hanging: 360 },
 *             },
 *           },
 *         },
 *         {
 *           level: 1,
 *           format: LevelFormat.LOWER_LETTER,
 *           text: "%2)",
 *           alignment: AlignmentType.LEFT,
 *           style: {
 *             paragraph: {
 *               indent: { left: 1440, hanging: 360 },
 *             },
 *           },
 *         },
 *       ],
 *     },
 *   ],
 * });
 * ```
 */
export class Numbering extends XmlComponent {
    private readonly abstractNumberingMap = new Map<string, AbstractNumbering>();
    private readonly concreteNumberingMap = new Map<string, ConcreteNumbering>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly referenceConfigMap = new Map<string, Record<string, any>>();
    private readonly abstractNumUniqueNumericId = abstractNumUniqueNumericIdGen();
    private readonly concreteNumUniqueNumericId = concreteNumUniqueNumericIdGen();

    /**
     * Creates a new numbering definition collection.
     *
     * Initializes the numbering with a default bullet list configuration and
     * any custom numbering configurations provided in the options.
     *
     * @param options - Configuration options for numbering definitions
     */
    public constructor(options: INumberingOptions) {
        super("w:numbering");
        this.root.push(
            new DocumentAttributes(
                ["wpc", "mc", "o", "r", "m", "v", "wp14", "wp", "w10", "w", "w14", "w15", "wpg", "wpi", "wne", "wps"],
                "w14 w15 wp14",
            ),
        );

        const abstractNumbering = new AbstractNumbering(this.abstractNumUniqueNumericId(), [
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
                overrideLevels: [
                    {
                        num: 0,
                        start: 1,
                    },
                ],
            }),
        );

        this.abstractNumberingMap.set("default-bullet-numbering", abstractNumbering);

        for (const con of options.config) {
            this.abstractNumberingMap.set(con.reference, new AbstractNumbering(this.abstractNumUniqueNumericId(), con.levels));
            this.referenceConfigMap.set(con.reference, con.levels);
        }
    }

    /**
     * Prepares the numbering definitions for XML serialization.
     *
     * Adds all abstract and concrete numbering definitions to the XML tree.
     *
     * @param context - The XML context
     * @returns The prepared XML object
     */
    public prepForXml(context: IContext): IXmlableObject | undefined {
        for (const numbering of this.abstractNumberingMap.values()) {
            this.root.push(numbering);
        }

        for (const numbering of this.concreteNumberingMap.values()) {
            this.root.push(numbering);
        }
        return super.prepForXml(context);
    }

    /**
     * Creates a concrete numbering instance from an abstract numbering definition.
     *
     * This method creates a new concrete numbering instance that references an
     * abstract numbering definition. It's used internally when paragraphs reference
     * numbering configurations.
     *
     * @param reference - The reference name of the abstract numbering definition
     * @param instance - The instance number for this concrete numbering
     */
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
            numId: this.concreteNumUniqueNumericId(),
            abstractNumId: abstractNumbering.id,
            reference,
            instance,
            overrideLevels: [
                typeof firstLevelStartNumber === "number" && Number.isInteger(firstLevelStartNumber)
                    ? {
                          num: 0,
                          start: firstLevelStartNumber,
                      }
                    : {
                          num: 0,
                          start: 1,
                      },
            ],
        };

        this.concreteNumberingMap.set(fullReference, new ConcreteNumbering(concreteNumberingSettings));
    }

    /**
     * Gets all concrete numbering instances.
     *
     * @returns An array of all concrete numbering instances
     */
    public get ConcreteNumbering(): readonly ConcreteNumbering[] {
        return Array.from(this.concreteNumberingMap.values());
    }

    /**
     * Gets all reference configurations.
     *
     * @returns An array of all numbering reference configurations
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public get ReferenceConfig(): readonly Record<string, any>[] {
        return Array.from(this.referenceConfigMap.values());
    }
}
