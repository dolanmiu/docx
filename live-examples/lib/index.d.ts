import { default as default_2 } from 'jszip';
import { Element as Element_2 } from 'xml-js';
import { Stream } from 'stream';

/**
 * Represents an abstract numbering definition in a WordprocessingML document.
 *
 * Abstract numbering definitions define the formatting and style of numbered or
 * bulleted lists that can be referenced by concrete numbering instances.
 * Each abstract definition can contain up to 9 levels.
 *
 * Reference: http://officeopenxml.com/WPnumbering.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_AbstractNum">
 *   <xsd:sequence>
 *     <xsd:element name="nsid" type="CT_LongHexNumber" minOccurs="0"/>
 *     <xsd:element name="multiLevelType" type="CT_MultiLevelType" minOccurs="0"/>
 *     <xsd:element name="tmpl" type="CT_LongHexNumber" minOccurs="0"/>
 *     <xsd:element name="name" type="CT_String" minOccurs="0"/>
 *     <xsd:element name="styleLink" type="CT_String" minOccurs="0"/>
 *     <xsd:element name="numStyleLink" type="CT_String" minOccurs="0"/>
 *     <xsd:element name="lvl" type="CT_Lvl" minOccurs="0" maxOccurs="9"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="abstractNumId" type="ST_DecimalNumber" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create an abstract numbering definition with multiple levels
 * const abstractNumbering = new AbstractNumbering(1, [
 *   {
 *     level: 0,
 *     format: LevelFormat.DECIMAL,
 *     text: "%1.",
 *     alignment: AlignmentType.LEFT,
 *   },
 *   {
 *     level: 1,
 *     format: LevelFormat.LOWER_LETTER,
 *     text: "%2)",
 *     alignment: AlignmentType.LEFT,
 *   },
 * ]);
 * ```
 */
export declare class AbstractNumbering extends XmlComponent {
    /** The unique identifier for this abstract numbering definition. */
    readonly id: number;
    /**
     * Creates a new abstract numbering definition.
     *
     * @param id - Unique identifier for this abstract numbering definition
     * @param levelOptions - Array of level definitions (up to 9 levels)
     */
    constructor(id: number, levelOptions: readonly ILevelsOptions[]);
}

/**
 * Creates a unique numeric ID generator for abstract numbering definitions.
 *
 * Abstract numbering definitions define the appearance and behavior of lists.
 *
 * @returns A function that generates sequential IDs starting from 1
 *
 * @example
 * ```typescript
 * const idGen = abstractNumUniqueNumericIdGen();
 * const id = idGen(); // Returns 1
 * ```
 */
export declare const abstractNumUniqueNumericIdGen: () => UniqueNumericIdCreator;

/**
 * Paragraph justification (alignment) types.
 *
 * Specifies the horizontal alignment of text within a paragraph.
 *
 * Reference: http://officeopenxml.com/WPalignment.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_Jc">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="start"/>
 *     <xsd:enumeration value="center"/>
 *     <xsd:enumeration value="end"/>
 *     <xsd:enumeration value="both"/>
 *     <xsd:enumeration value="mediumKashida"/>
 *     <xsd:enumeration value="distribute"/>
 *     <xsd:enumeration value="numTab"/>
 *     <xsd:enumeration value="highKashida"/>
 *     <xsd:enumeration value="lowKashida"/>
 *     <xsd:enumeration value="thaiDistribute"/>
 *     <xsd:enumeration value="left"/>
 *     <xsd:enumeration value="right"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export declare const AlignmentType: {
    /** Align Start */
    readonly START: "start";
    /** Align Center */
    readonly CENTER: "center";
    /** End */
    readonly END: "end";
    /** Justified */
    readonly BOTH: "both";
    /** Medium Kashida Length */
    readonly MEDIUM_KASHIDA: "mediumKashida";
    /** Distribute All Characters Equally */
    readonly DISTRIBUTE: "distribute";
    /** Align to List Tab */
    readonly NUM_TAB: "numTab";
    /** Widest Kashida Length */
    readonly HIGH_KASHIDA: "highKashida";
    /** Low Kashida Length */
    readonly LOW_KASHIDA: "lowKashida";
    /** Thai Language Justification */
    readonly THAI_DISTRIBUTE: "thaiDistribute";
    /** Align Left */
    readonly LEFT: "left";
    /** Align Right */
    readonly RIGHT: "right";
    /** Justified */
    readonly JUSTIFIED: "both";
};

/**
 * Represents a reference to an annotation (comment).
 *
 * Used internally within comment ranges to mark comment references.
 */
export declare class AnnotationReference extends EmptyElement {
    constructor();
}

/**
 * Represents the extended application properties of a WordprocessingML document.
 *
 * Extended properties contain application-specific metadata such as total editing time,
 * word count, character count, and other Office-specific information.
 *
 * Reference: ISO-IEC29500-4_2016 shared-documentPropertiesExtended.xsd
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Properties">
 *   <xsd:sequence>
 *     <xsd:element name="Template" type="xsd:string" minOccurs="0"/>
 *     <xsd:element name="Manager" type="xsd:string" minOccurs="0"/>
 *     <xsd:element name="Company" type="xsd:string" minOccurs="0"/>
 *     <xsd:element name="Pages" type="xsd:int" minOccurs="0"/>
 *     <xsd:element name="Words" type="xsd:int" minOccurs="0"/>
 *     <xsd:element name="Characters" type="xsd:int" minOccurs="0"/>
 *     <xsd:element name="PresentationFormat" type="xsd:string" minOccurs="0"/>
 *     <xsd:element name="Lines" type="xsd:int" minOccurs="0"/>
 *     <xsd:element name="Paragraphs" type="xsd:int" minOccurs="0"/>
 *     <xsd:element name="CharactersWithSpaces" type="xsd:int" minOccurs="0"/>
 *     <xsd:element name="Application" type="xsd:string" minOccurs="0"/>
 *     <xsd:element name="DocSecurity" type="xsd:int" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const appProps = new AppProperties();
 * ```
 */
declare class AppProperties extends XmlComponent {
    constructor();
}

/**
 * Simple attribute data as a key-value record.
 */
export declare type AttributeData = Record<string, boolean | number | string>;

/**
 * Maps TypeScript property names to their XML attribute names.
 *
 * This type is used to define how JavaScript-friendly property names
 * are translated into namespaced XML attribute names.
 */
export declare type AttributeMap<T> = Record<keyof T, string>;

/**
 * Structured attribute payload with explicit key-value mapping.
 *
 * This type is used by NextAttributeComponent to provide more explicit
 * control over attribute name mapping.
 */
export declare type AttributePayload<T> = {
    readonly [P in keyof T]: {
        readonly key: string;
        readonly value: T[P];
    };
};

/**
 * Common XML attributes used across WordprocessingML elements.
 *
 * This class provides a convenient way to add common attributes to XML elements.
 * It automatically maps JavaScript-friendly property names to their corresponding
 * w: (WordprocessingML) namespace prefixed XML attribute names.
 *
 * @example
 * ```typescript
 * // Create an element with a value attribute
 * new Attributes({ val: "someValue" });
 * // Generates: <element w:val="someValue"/>
 *
 * // Multiple attributes
 * new Attributes({ color: "FF0000", sz: "24" });
 * // Generates: <element w:color="FF0000" w:sz="24"/>
 * ```
 */
export declare class Attributes extends XmlAttributeComponent<{
    /** Generic value attribute (w:val). */
    readonly val?: string | number | boolean;
    /** Color value (w:color). */
    readonly color?: string;
    /** Fill color (w:fill). */
    readonly fill?: string;
    /** Space preservation (w:space). */
    readonly space?: string;
    /** Size value (w:sz). */
    readonly sz?: string;
    /** Type specification (w:type). */
    readonly type?: string;
    /** Revision ID for run content (w:rsidR). */
    readonly rsidR?: string;
    /** Revision ID for run properties (w:rsidRPr). */
    readonly rsidRPr?: string;
    /** Revision ID for section (w:rsidSect). */
    readonly rsidSect?: string;
    /** Width (w:w). */
    readonly w?: string;
    /** Height (w:h). */
    readonly h?: string;
    /** Top margin/spacing (w:top). */
    readonly top?: string;
    /** Right margin/spacing (w:right). */
    readonly right?: string;
    /** Bottom margin/spacing (w:bottom). */
    readonly bottom?: string;
    /** Left margin/spacing (w:left). */
    readonly left?: string;
    /** Header margin (w:header). */
    readonly header?: string;
    /** Footer margin (w:footer). */
    readonly footer?: string;
    /** Gutter margin (w:gutter). */
    readonly gutter?: string;
    /** Line pitch (w:linePitch). */
    readonly linePitch?: string;
    /** Position value (w:pos). */
    readonly pos?: string | number;
}> {
    protected readonly xmlKeys: {
        val: string;
        color: string;
        fill: string;
        space: string;
        sz: string;
        type: string;
        rsidR: string;
        rsidRPr: string;
        rsidSect: string;
        w: string;
        h: string;
        top: string;
        right: string;
        bottom: string;
        left: string;
        header: string;
        footer: string;
        gutter: string;
        linePitch: string;
        pos: string;
    };
}

/**
 * Abstract base class for all XML components in the library.
 *
 * BaseXmlComponent defines the minimal interface that all XML components must implement.
 * It stores the XML element name (rootKey) and requires subclasses to implement
 * the prepForXml method for serialization.
 *
 * @example
 * ```typescript
 * class MyElement extends BaseXmlComponent {
 *   constructor() {
 *     super("w:myElement");
 *   }
 *
 *   prepForXml(context: IContext): IXmlableObject {
 *     return { "w:myElement": {} };
 *   }
 * }
 * ```
 */
export declare abstract class BaseXmlComponent {
    /** The XML element name for this component (e.g., "w:p" for paragraph). */
    protected readonly rootKey: string;
    /**
     * Creates a new BaseXmlComponent with the specified XML element name.
     *
     * @param rootKey - The XML element name (e.g., "w:p", "w:r", "w:t")
     */
    constructor(rootKey: string);
    /**
     * Prepares this component for XML serialization.
     *
     * This method is called by the Formatter to convert the component into an object
     * structure that can be serialized to XML. Subclasses must implement this to
     * define their XML representation.
     *
     * @param context - The serialization context
     * @returns The XML-serializable object, or undefined to exclude from output
     */
    abstract prepForXml(context: IContext): IXmlableObject | undefined;
    /**
     * The components written in this one's place, one after another, when it can't be written as a single element,
     * such as a run with another run in its children. Undefined when it is written as itself.
     *
     * @internal
     */
    get writtenAs(): readonly BaseXmlComponent[] | undefined;
}

/**
 * Represents the document body in a WordprocessingML document.
 *
 * The body element is the container for all block-level content in the document.
 * This includes paragraphs, tables, and section properties that define page layout.
 *
 * The body supports multiple sections, where each section (except the last one) must
 * have its section properties stored in a paragraph's properties at the end of that
 * section. The last section's properties are stored as a direct child of the body element.
 *
 * Reference: http://officeopenxml.com/WPdocument.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Body">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_BlockLevelElts" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="sectPr" minOccurs="0" maxOccurs="1" type="CT_SectPr"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Body is typically created internally by the Document class
 * const doc = new Document({});
 * const body = doc.Body;
 *
 * // Add content to the body via Document.add()
 * doc.add(new Paragraph("Content in first section"));
 *
 * // Add a new section
 * body.addSection({
 *   page: {
 *     size: { width: 12240, height: 15840 },
 *   },
 * });
 *
 * // Content after addSection belongs to the new section
 * doc.add(new Paragraph("Content in second section"));
 * ```
 */
declare class Body_2 extends XmlComponent {
    private readonly sections;
    /**
     * Section properties that were moved into a paragraph at the end of their section
     * by {@link addSection}, keyed by that paragraph. Used to find the section that
     * governs a given child of the body.
     */
    private readonly sectionParagraphs;
    constructor();
    /**
     * Finds the section properties that govern a top-level child of the body.
     *
     * A section's properties are stored after its content (either in the closing
     * paragraph of the section or, for the last section, at the end of the body), so
     * the governing section is the first one found at or after the child. When no
     * child is given (or it is not a direct child of the body), the first section is
     * returned.
     *
     * @param child - A direct child of the body (paragraph, table, etc.)
     * @returns The governing section properties, or undefined if the body has no sections
     */
    getSectionPropertiesFor(child?: XmlComponent): SectionProperties | undefined;
    /**
     * Adds new section properties to the document body.
     *
     * Creates a new section by moving the previous section's properties into a paragraph
     * at the end of that section, and then adding the new section as the current section.
     *
     * According to the OOXML specification:
     * - Section properties for all sections except the last must be stored in a paragraph's
     *   properties (pPr/sectPr) at the end of each section
     * - The last section's properties are stored as a direct child of the body element (w:body/w:sectPr)
     *
     * @param options - Section properties configuration (page size, margins, headers, footers, etc.)
     */
    addSection(options: ISectionPropertiesOptions): void;
    /**
     * Prepares the body element for XML serialization.
     *
     * Ensures that the last section's properties are placed as a direct child of the body
     * element, as required by the OOXML specification.
     *
     * @param context - The XML serialization context
     * @returns The prepared XML object or undefined
     */
    prepForXml(context: IContext): IXmlableObject | undefined;
    /**
     * Adds a block-level component to the body.
     *
     * This method is used internally by the Document class to add paragraphs,
     * tables, and other block-level elements to the document body.
     *
     * @param component - The XML component to add (paragraph, table, etc.)
     */
    push(component: XmlComponent): void;
    private createSectionParagraph;
}
export { Body_2 as Body }

/**
 * Represents a bookmark in a WordprocessingML document.
 *
 * A bookmark identifies a location or range of content that can be referenced
 * elsewhere, such as from a hyperlink or table of contents. The bookmark consists
 * of a start marker, content, and an end marker.
 *
 * Reference: http://officeopenxml.com/WPbookmark.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="bookmarkStart" type="CT_Bookmark"/>
 * <xsd:element name="bookmarkEnd" type="CT_MarkupRange"/>
 *
 * <xsd:complexType name="CT_Bookmark">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_BookmarkRange">
 *       <xsd:attribute name="name" type="s:ST_String" use="required"/>
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create a bookmark around a heading
 * new Bookmark({
 *   id: "section1",
 *   children: [new TextRun("Section 1 Heading")],
 * });
 *
 * // Link to the bookmark from elsewhere
 * new InternalHyperlink({
 *   children: [new TextRun("Go to Section 1")],
 *   anchor: "section1",
 * });
 * ```
 */
export declare class Bookmark {
    readonly start: BookmarkStart;
    readonly children: readonly ParagraphChild[];
    readonly end: BookmarkEnd;
    constructor(options: IBookmarkOptions);
}

/**
 * Represents the end marker of a bookmark range.
 *
 * This element marks the end of a bookmarked region in the document.
 * It must be paired with a corresponding BookmarkStart element with the same id.
 *
 * Reference: http://officeopenxml.com/WPbookmark.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="bookmarkEnd" type="CT_MarkupRange"/>
 *
 * <xsd:complexType name="CT_MarkupRange">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_Markup">
 *       <xsd:attribute name="displacedByCustomXml" type="ST_DisplacedByCustomXml" use="optional"/>
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new BookmarkEnd(1);
 * ```
 */
export declare class BookmarkEnd extends XmlComponent {
    constructor(linkId: number);
}

/**
 * Represents the start marker of a bookmark range.
 *
 * This element marks the beginning of a bookmarked region in the document.
 * It must be paired with a corresponding BookmarkEnd element with the same id.
 *
 * Reference: http://officeopenxml.com/WPbookmark.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="bookmarkStart" type="CT_Bookmark"/>
 *
 * <xsd:complexType name="CT_Bookmark">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_BookmarkRange">
 *       <xsd:attribute name="name" type="s:ST_String" use="required"/>
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new BookmarkStart("myBookmark", 1);
 * ```
 */
export declare class BookmarkStart extends XmlComponent {
    constructor(id: string, linkId: number);
}

/**
 * Returns the next bookmark ID from a single counter shared by every bookmark.
 *
 * Bookmark IDs must be unique within a document, but a bookmark is created
 * before it belongs to one, so all bookmarks draw from this one counter rather
 * than a generator per instance.
 *
 * @returns A number no earlier call has returned
 *
 * @example
 * ```typescript
 * const first = bookmarkUniqueNumericId();
 * const second = bookmarkUniqueNumericId(); // first + 1
 * ```
 */
export declare const bookmarkUniqueNumericId: UniqueNumericIdCreator;

/**
 * Creates a unique numeric ID generator for bookmarks.
 *
 * Bookmarks are used to mark specific locations in a document for navigation
 * and cross-referencing.
 *
 * @returns A function that generates sequential IDs starting from 1
 *
 * @example
 * ```typescript
 * const idGen = bookmarkUniqueNumericIdGen();
 * const id = idGen(); // Returns 1
 * ```
 */
export declare const bookmarkUniqueNumericIdGen: () => UniqueNumericIdCreator;

/**
 * Represents paragraph borders in a WordprocessingML document.
 *
 * The pBdr element specifies borders that surround the paragraph.
 *
 * Reference: http://officeopenxml.com/WPborders.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PBdr">
 *   <xsd:sequence>
 *     <xsd:element name="top" type="CT_Border" minOccurs="0"/>
 *     <xsd:element name="left" type="CT_Border" minOccurs="0"/>
 *     <xsd:element name="bottom" type="CT_Border" minOccurs="0"/>
 *     <xsd:element name="right" type="CT_Border" minOccurs="0"/>
 *     <xsd:element name="between" type="CT_Border" minOccurs="0"/>
 *     <xsd:element name="bar" type="CT_Border" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new Paragraph({
 *   border: {
 *     top: { style: BorderStyle.SINGLE, size: 6, color: "FF0000" },
 *     bottom: { style: BorderStyle.SINGLE, size: 6, color: "FF0000" },
 *   },
 *   children: [new TextRun("Paragraph with top and bottom borders")],
 * });
 * ```
 */
export declare class Border extends IgnoreIfEmptyXmlComponent {
    constructor(options: IBordersOptions);
}

/**
 * Table borders are defined with the <w:tblBorders> element. Child elements of this element specify the kinds of `border`:
 *
 * `bottom`, `end` (`right` in the previous version of the standard), `insideH`, `insideV`, `start` (`left` in the previous version of the standard), and `top`.
 *
 * Reference: http://officeopenxml.com/WPtableBorders.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_Border">
 *     <xsd:restriction base="xsd:string">
 *          <xsd:enumeration value="single"/>
 *          <xsd:enumeration value="dashDotStroked"/>
 *          <xsd:enumeration value="dashed"/>
 *          <xsd:enumeration value="dashSmallGap"/>
 *          <xsd:enumeration value="dotDash"/>
 *          <xsd:enumeration value="dotDotDash"/>
 *          <xsd:enumeration value="dotted"/>
 *          <xsd:enumeration value="double"/>
 *          <xsd:enumeration value="doubleWave"/>
 *          <xsd:enumeration value="inset"/>
 *          <xsd:enumeration value="nil"/>
 *          <xsd:enumeration value="none"/>
 *          <xsd:enumeration value="outset"/>
 *          <xsd:enumeration value="thick"/>
 *          <xsd:enumeration value="thickThinLargeGap"/>
 *          <xsd:enumeration value="thickThinMediumGap"/>
 *          <xsd:enumeration value="thickThinSmallGap"/>
 *          <xsd:enumeration value="thinThickLargeGap"/>
 *          <xsd:enumeration value="thinThickMediumGap"/>
 *          <xsd:enumeration value="thinThickSmallGap"/>
 *          <xsd:enumeration value="thinThickThinLargeGap"/>
 *          <xsd:enumeration value="thinThickThinMediumGap"/>
 *          <xsd:enumeration value="thinThickThinSmallGap"/>
 *          <xsd:enumeration value="threeDEmboss"/>
 *          <xsd:enumeration value="threeDEngrave"/>
 *          <xsd:enumeration value="triple"/>
 *          <xsd:enumeration value="wave"/>
 *     </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export declare const BorderStyle: {
    /** a single line */
    readonly SINGLE: "single";
    /** a line with a series of alternating thin and thick strokes */
    readonly DASH_DOT_STROKED: "dashDotStroked";
    /** a dashed line */
    readonly DASHED: "dashed";
    /** a dashed line with small gaps */
    readonly DASH_SMALL_GAP: "dashSmallGap";
    /** a line with alternating dots and dashes */
    readonly DOT_DASH: "dotDash";
    /** a line with a repeating dot - dot - dash sequence */
    readonly DOT_DOT_DASH: "dotDotDash";
    /** a dotted line */
    readonly DOTTED: "dotted";
    /** a double line */
    readonly DOUBLE: "double";
    /** a double wavy line */
    readonly DOUBLE_WAVE: "doubleWave";
    /** an inset set of lines */
    readonly INSET: "inset";
    /** no border */
    readonly NIL: "nil";
    /** no border */
    readonly NONE: "none";
    /** an outset set of lines */
    readonly OUTSET: "outset";
    /** a single line */
    readonly THICK: "thick";
    /** a thick line contained within a thin line with a large-sized intermediate gap */
    readonly THICK_THIN_LARGE_GAP: "thickThinLargeGap";
    /** a thick line contained within a thin line with a medium-sized intermediate gap */
    readonly THICK_THIN_MEDIUM_GAP: "thickThinMediumGap";
    /** a thick line contained within a thin line with a small intermediate gap */
    readonly THICK_THIN_SMALL_GAP: "thickThinSmallGap";
    /** a thin line contained within a thick line with a large-sized intermediate gap */
    readonly THIN_THICK_LARGE_GAP: "thinThickLargeGap";
    /** a thick line contained within a thin line with a medium-sized intermediate gap */
    readonly THIN_THICK_MEDIUM_GAP: "thinThickMediumGap";
    /** a thick line contained within a thin line with a small intermediate gap */
    readonly THIN_THICK_SMALL_GAP: "thinThickSmallGap";
    /** a thin-thick-thin line with a large gap */
    readonly THIN_THICK_THIN_LARGE_GAP: "thinThickThinLargeGap";
    /** a thin-thick-thin line with a medium gap */
    readonly THIN_THICK_THIN_MEDIUM_GAP: "thinThickThinMediumGap";
    /** a thin-thick-thin line with a small gap */
    readonly THIN_THICK_THIN_SMALL_GAP: "thinThickThinSmallGap";
    /** a three-staged gradient line, getting darker towards the paragraph */
    readonly THREE_D_EMBOSS: "threeDEmboss";
    /** a three-staged gradient like, getting darker away from the paragraph */
    readonly THREE_D_ENGRAVE: "threeDEngrave";
    /** a triple line */
    readonly TRIPLE: "triple";
    /** a wavy line */
    readonly WAVE: "wave";
};

/**
 * Flexible XML element builder with explicit attribute and child configuration.
 *
 * BuilderElement provides a structured way to create XML elements with typed
 * attributes and children. It uses the NextAttributeComponent pattern for
 * explicit attribute key-value mapping.
 *
 * @example
 * ```typescript
 * // Element with attributes
 * new BuilderElement({
 *   name: "w:spacing",
 *   attributes: {
 *     before: { key: "w:before", value: 240 },
 *     after: { key: "w:after", value: 120 }
 *   }
 * });
 * // Generates: <w:spacing w:before="240" w:after="120"/>
 *
 * // Element with children
 * new BuilderElement({
 *   name: "w:pPr",
 *   children: [
 *     new StringValueElement("w:pStyle", "Heading1")
 *   ]
 * });
 * ```
 */
export declare class BuilderElement<T extends AttributeData = {}> extends XmlComponent {
    /**
     * Creates a BuilderElement with the specified configuration.
     *
     * @param config - Element configuration
     * @param config.name - The XML element name
     * @param config.attributes - Optional attributes with explicit key-value pairs
     * @param config.children - Optional child elements
     */
    constructor({ name, attributes, children, }: {
        /** The XML element name. */
        readonly name: string;
        /** Optional attributes with explicit key-value pairs. */
        readonly attributes?: AttributePayload<T>;
        /** Optional child elements. */
        readonly children?: readonly XmlComponent[];
    });
}

/**
 * Represents a carriage return character.
 *
 * Inserts a carriage return, which may be rendered differently than a standard line break.
 */
export declare class CarriageReturn extends EmptyElement {
    constructor();
}

export declare class CellMerge extends XmlComponent {
    constructor(options: ICellMergeAttributes);
}

export declare class CellMergeAttributes extends XmlAttributeComponent<ICellMergeAttributes> {
    protected readonly xmlKeys: {
        id: string;
        author: string;
        date: string;
        verticalMerge: string;
        verticalMergeOriginal: string;
    };
}

/**
 * Cell spacing measurement types.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_TblCellSpacing">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="nil"/>
 *     <xsd:enumeration value="dxa"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 */
declare const CellSpacingType: {
    /** Value is in twentieths of a point */
    readonly DXA: "dxa";
    /** No (empty) value. */
    readonly NIL: "nil";
};

/**
 * Character set constants for font definitions.
 * Maps character set names to their hexadecimal identifiers.
 *
 * @publicApi
 */
export declare const CharacterSet: {
    readonly ANSI: "00";
    readonly DEFAULT: "01";
    readonly SYMBOL: "02";
    readonly MAC: "4D";
    readonly JIS: "80";
    readonly HANGUL: "81";
    readonly JOHAB: "82";
    readonly GB_2312: "86";
    readonly CHINESEBIG5: "88";
    readonly GREEK: "A1";
    readonly TURKISH: "A2";
    readonly VIETNAMESE: "A3";
    readonly HEBREW: "B1";
    readonly ARABIC: "B2";
    readonly BALTIC: "BA";
    readonly RUSSIAN: "CC";
    readonly THAI: "DE";
    readonly EASTEUROPE: "EE";
    readonly OEM: "FF";
};

/**
 * Represents an interactive checkbox in a WordprocessingML document.
 *
 * CheckBox creates a content control with checkbox functionality,
 * displaying a checked or unchecked symbol based on its state. The checkbox
 * is implemented using structured document tags (w:sdt) with checkbox-specific
 * properties.
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SdtCheckbox">
 *   <xsd:sequence>
 *     <xsd:element name="checked" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="checkedState" type="CT_SdtCheckboxSymbol" minOccurs="0"/>
 *     <xsd:element name="uncheckedState" type="CT_SdtCheckboxSymbol" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * <xsd:element name="checkbox" type="CT_SdtCheckbox"/>
 * ```
 *
 * @example
 * ```typescript
 * // Simple checkbox
 * new CheckBox({ checked: true });
 *
 * // Checkbox with custom alias
 * new CheckBox({
 *   checked: false,
 *   alias: "Accept Terms",
 * });
 *
 * // Checkbox with custom symbols
 * new CheckBox({
 *   checked: true,
 *   checkedState: { value: "2611", font: "Wingdings" },
 *   uncheckedState: { value: "2610", font: "Wingdings" },
 * });
 * ```
 */
export declare class CheckBox extends XmlComponent {
    private readonly DEFAULT_UNCHECKED_SYMBOL;
    private readonly DEFAULT_CHECKED_SYMBOL;
    private readonly DEFAULT_FONT;
    constructor(options?: ICheckboxSymbolOptions);
}

/**
 * Represents a checkbox symbol element (checked or unchecked state).
 *
 * This element defines the appearance of a checkbox in a particular state,
 * specifying the Unicode character and font to render.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SdtCheckboxSymbol">
 *   <xsd:attribute name="font" type="w:ST_String"/>
 *   <xsd:attribute name="val" type="w:ST_ShortHexNumber"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Checked state symbol
 * new CheckBoxSymbolElement("w14:checkedState", "2612", "MS Gothic");
 *
 * // Unchecked state symbol
 * new CheckBoxSymbolElement("w14:uncheckedState", "2610", "MS Gothic");
 *
 * // Symbol without explicit font
 * new CheckBoxSymbolElement("w14:checked", "1");
 * ```
 */
export declare class CheckBoxSymbolElement extends XmlComponent {
    constructor(name: string, val: string, font?: string);
}

/**
 * Represents the checkbox element within a structured document tag.
 *
 * This class generates the w14:checkbox element that defines the checkbox behavior,
 * including its checked state and the symbols used for checked and unchecked states.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SdtCheckbox">
 *   <xsd:sequence>
 *     <xsd:element name="checked" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="checkedState" type="CT_SdtCheckboxSymbol" minOccurs="0"/>
 *     <xsd:element name="uncheckedState" type="CT_SdtCheckboxSymbol" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * <xsd:element name="checkbox" type="CT_SdtCheckbox"/>
 * ```
 *
 * @example
 * ```typescript
 * // Default checkbox (unchecked with default symbols)
 * new CheckBoxUtil();
 *
 * // Checked checkbox with defaults
 * new CheckBoxUtil({ checked: true });
 *
 * // Custom symbols
 * new CheckBoxUtil({
 *   checked: false,
 *   checkedState: { value: "2611", font: "Wingdings" },
 *   uncheckedState: { value: "2610", font: "Wingdings" },
 * });
 * ```
 */
export declare class CheckBoxUtil extends XmlComponent {
    private readonly DEFAULT_UNCHECKED_SYMBOL;
    private readonly DEFAULT_CHECKED_SYMBOL;
    private readonly DEFAULT_FONT;
    constructor(options?: ICheckboxSymbolOptions);
}

/**
 * Represents a column definition (col) for a multi-column section layout.
 *
 * This element defines the width and spacing for an individual column when
 * using unequal column widths in a section.
 *
 * Reference: http://officeopenxml.com/WPsectionPr.php
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * // Create a column with specific width and spacing
 * new Column({
 *   width: 3000,
 *   space: 720
 * });
 * ```
 */
export declare class Column extends XmlComponent {
    constructor(options: IColumnAttributes);
}

/**
 * Represents a column break in a WordprocessingML document.
 *
 * A column break forces text to continue at the beginning of the next column.
 *
 * Reference: http://officeopenxml.com/WPtextSpecialContent-break.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Br">
 *   <xsd:attribute name="type" type="ST_BrType" use="optional"/>
 *   <xsd:attribute name="clear" type="ST_BrClear" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new Paragraph({
 *   children: [new ColumnBreak()],
 * });
 * ```
 */
export declare class ColumnBreak extends Run {
    constructor();
}

/**
 * Represents a single comment in a WordprocessingML document.
 *
 * Contains the actual content of a comment, including author information
 * and the comment text (typically paragraphs).
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Comment">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_BlockLevelElts" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="initials" type="s:ST_String"/>
 *   <xsd:attribute name="author" type="s:ST_String"/>
 *   <xsd:attribute name="date" type="s:ST_DateTime"/>
 *   <xsd:attribute name="id" type="ST_DecimalNumber" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new Comment({
 *   id: 0,
 *   author: "John Doe",
 *   initials: "JD",
 *   children: [new Paragraph("This is a comment")],
 * });
 * ```
 */
declare class Comment_2 extends XmlComponent {
    private readonly paraId?;
    constructor({ id, initials, author, date, children }: ICommentOptions, paraId?: string);
    /**
     * Serializes this comment to XML, injecting w14:paraId and w14:textId into the last
     * paragraph when threading is active. These attributes link the comment to its
     * corresponding w15:commentEx entry in commentsExtended.xml.
     */
    prepForXml(context: IContext): IXmlableObject | undefined;
}
export { Comment_2 as Comment }

/**
 * Converts a comment ID to a deterministic 8-character uppercase hex paraId.
 */
export declare const commentIdToParaId: (id: number) => string;

/**
 * Represents the end of a comment range in a WordprocessingML document.
 *
 * Marks the end of a region of text that is associated with a comment.
 * Must be paired with a CommentRangeStart with the same ID.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_MarkupRange">
 *   <xsd:attribute name="id" type="ST_DecimalNumber" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new CommentRangeEnd(0);
 * ```
 */
export declare class CommentRangeEnd extends XmlComponent {
    constructor(id: number);
}

/**
 * Represents the start of a comment range in a WordprocessingML document.
 *
 * Marks the beginning of a region of text that is associated with a comment.
 * Must be paired with a CommentRangeEnd with the same ID.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_MarkupRange">
 *   <xsd:attribute name="id" type="ST_DecimalNumber" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new CommentRangeStart(0);
 * ```
 */
export declare class CommentRangeStart extends XmlComponent {
    constructor(id: number);
}

/**
 * Represents a reference to a comment in a WordprocessingML document.
 *
 * This element is placed within a run to create a link to a comment.
 * It should be placed after the CommentRangeEnd element.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Markup">
 *   <xsd:attribute name="id" type="ST_DecimalNumber" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new CommentReference(0);
 * ```
 */
export declare class CommentReference extends XmlComponent {
    constructor(id: number);
}

/**
 * Represents the comments container in a WordprocessingML document.
 *
 * This is the root element for the comments.xml file that stores all
 * comment definitions in the document. When any comment uses `parentId`,
 * threading is activated and thread data is generated for commentsExtended.xml.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="comments" type="CT_Comments"/>
 * <xsd:complexType name="CT_Comments">
 *   <xsd:sequence>
 *     <xsd:element name="comment" type="CT_Comment" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new Comments({
 *   children: [
 *     {
 *       id: 0,
 *       author: "John Doe",
 *       children: [new Paragraph("First comment")],
 *     },
 *     {
 *       id: 1,
 *       author: "Jane Smith",
 *       parentId: 0,
 *       children: [new Paragraph("Reply to first comment")],
 *     },
 *   ],
 * });
 * ```
 */
export declare class Comments extends XmlComponent {
    private readonly relationships;
    private readonly threadData?;
    private readonly commentIdsData?;
    private readonly isEmpty;
    constructor({ children }: ICommentsOptions);
    get Relationships(): Relationships;
    /** Thread data for commentsExtended.xml, or undefined when no comments use parentId. */
    get ThreadData(): readonly ICommentThreadData[] | undefined;
    /** Comment id data for commentsIds.xml, or undefined when no comments carry a durableId. */
    get CommentIdsData(): readonly ICommentIdData[] | undefined;
    /** Whether there are no comments, in which case the document has no comments.xml part. */
    get IsEmpty(): boolean;
}

/**
 * Represents the commentsExtended part (word/commentsExtended.xml).
 *
 * Contains w15:commentEx elements that define comment reply threading
 * and resolved status.
 *
 * ## XSD Schema (wml-2012.xsd)
 * ```xml
 * <xsd:complexType name="CT_CommentsEx">
 *   <xsd:sequence>
 *     <xsd:element name="commentEx" type="CT_CommentEx" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export declare class CommentsExtended extends XmlComponent {
    constructor(threadData: readonly ICommentThreadData[]);
}

/**
 * Represents the commentsIds part (word/commentsIds.xml).
 *
 * Contains w16cid:commentId elements that map each comment's volatile paraId
 * to a stable w16cid:durableId preserved by Word across edits.
 *
 * ## XSD Schema (wml-cid.xsd)
 * ```xml
 * <xsd:complexType name="CT_CommentsIds">
 *   <xsd:sequence>
 *     <xsd:element name="commentId" type="CT_CommentId" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export declare class CommentsIds extends XmlComponent {
    constructor(commentIdsData: readonly ICommentIdData[]);
}

/**
 * Compound line types for outlines.
 *
 * Defines the structure of compound lines (single, double, etc.).
 */
declare const CompoundLine: {
    /** Single line */
    readonly SINGLE: "sng";
    /** Double line */
    readonly DOUBLE: "dbl";
    /** Thick-thin double line */
    readonly THICK_THIN: "thickThin";
    /** Thin-thick double line */
    readonly THIN_THICK: "thinThick";
    /** Triple line */
    readonly TRI: "tri";
};

/**
 * Represents a concrete hyperlink in a WordprocessingML document.
 *
 * This class is the low-level implementation of hyperlinks used internally.
 * Use InternalHyperlink or ExternalHyperlink for creating hyperlinks in documents.
 *
 * Reference: http://officeopenxml.com/WPhyperlink.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="hyperlink" type="CT_Hyperlink"/>
 *
 * <xsd:complexType name="CT_Hyperlink">
 *   <xsd:group ref="EG_PContent" minOccurs="0" maxOccurs="unbounded"/>
 *   <xsd:attribute name="tgtFrame" type="s:ST_String" use="optional"/>
 *   <xsd:attribute name="tooltip" type="s:ST_String" use="optional"/>
 *   <xsd:attribute name="docLocation" type="s:ST_String" use="optional"/>
 *   <xsd:attribute name="history" type="s:ST_OnOff" use="optional"/>
 *   <xsd:attribute name="anchor" type="s:ST_String" use="optional"/>
 *   <xsd:attribute ref="r:id"/>
 * </xsd:complexType>
 * ```
 */
export declare class ConcreteHyperlink extends XmlComponent {
    readonly linkId: string;
    constructor(children: readonly ParagraphChild[], relationshipId: string, anchor?: string);
}

/**
 * Represents a concrete numbering instance in a WordprocessingML document.
 *
 * A concrete numbering instance references an abstract numbering definition and
 * can override specific levels. Paragraphs reference concrete numbering instances
 * to apply list formatting.
 *
 * Reference: http://officeopenxml.com/WPnumbering.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Num">
 *   <xsd:sequence>
 *     <xsd:element name="abstractNumId" type="CT_DecimalNumber" minOccurs="1"/>
 *     <xsd:element name="lvlOverride" type="CT_NumLvl" minOccurs="0" maxOccurs="9"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="numId" type="ST_DecimalNumber" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create a concrete numbering instance
 * const concreteNumbering = new ConcreteNumbering({
 *   numId: 1,
 *   abstractNumId: 0,
 *   reference: "my-numbering",
 *   instance: 0,
 *   overrideLevels: [
 *     {
 *       num: 0,
 *       start: 5, // Start numbering at 5 instead of 1
 *     },
 *   ],
 * });
 * ```
 */
export declare class ConcreteNumbering extends XmlComponent {
    /** The unique identifier for this numbering instance. */
    readonly numId: number;
    /** The reference name for this numbering instance. */
    readonly reference: string;
    /** The instance number for tracking multiple uses. */
    readonly instance: number;
    /**
     * Creates a new concrete numbering instance.
     *
     * @param options - Configuration options for the numbering instance
     */
    constructor(options: IConcreteNumberingOptions);
}

/**
 * Creates a unique numeric ID generator for concrete numbering instances.
 *
 * Concrete numbering instances reference abstract numbering definitions and are
 * used to apply numbering to paragraphs. Initial value is 1 because ID 1 is
 * reserved for "default-bullet-numbering".
 *
 * @returns A function that generates sequential IDs starting from 2
 *
 * @example
 * ```typescript
 * const idGen = concreteNumUniqueNumericIdGen();
 * const id = idGen(); // Returns 2 (1 is reserved)
 * ```
 */
export declare const concreteNumUniqueNumericIdGen: () => UniqueNumericIdCreator;

/**
 * Represents the Content Types part of an OPC package.
 *
 * ContentTypes maps file extensions and specific paths to their
 * MIME content types, enabling applications to process each part correctly.
 *
 * Reference: http://officeopenxml.com/anatomyofOOXML.php
 *
 * @example
 * ```typescript
 * const contentTypes = new ContentTypes();
 * contentTypes.addHeader(1); // Add header1.xml
 * contentTypes.addFooter(1); // Add footer1.xml
 * ```
 */
declare class ContentTypes extends XmlComponent {
    constructor();
    /**
     * Registers the comments part in the content types.
     */
    addComments(): void;
    /**
     * Registers the commentsExtended part in the content types.
     */
    addCommentsExtended(): void;
    /**
     * Registers the commentsIds part in the content types.
     */
    addCommentsIds(): void;
    /**
     * Registers a footer part in the content types.
     *
     * @param index - Footer index number (e.g., 1 for footer1.xml)
     */
    addFooter(index: number): void;
    /**
     * Registers a part by its name, such as a chart or an embedded workbook that a drawing adds to the package.
     *
     * @param contentType - The part's content type
     * @param partName - The part's name, from the root of the package, such as "/word/charts/chart1.xml"
     */
    addOverride(contentType: string, partName: string): void;
    /**
     * Registers a header part in the content types.
     *
     * @param index - Header index number (e.g., 1 for header1.xml)
     */
    addHeader(index: number): void;
}

/**
 * Represents a continuation separator for footnotes or endnotes.
 *
 * Used when footnotes/endnotes continue across multiple pages.
 */
export declare class ContinuationSeparator extends EmptyElement {
    constructor();
}

/**
 * Converts inches to TWIP (twentieths of a point).
 *
 * TWIP is a common unit in Office Open XML where 1 inch = 1440 TWIP.
 *
 * @param inches - The measurement in inches to convert
 * @returns The equivalent measurement in TWIP
 *
 * @example
 * ```typescript
 * const width = convertInchesToTwip(1); // Returns 1440
 * ```
 *
 * @publicApi
 */
export declare const convertInchesToTwip: (inches: number) => number;

/**
 * Converts millimeters to TWIP (twentieths of a point).
 *
 * TWIP is a common unit in Office Open XML where 1 inch = 1440 TWIP.
 *
 * @param millimeters - The measurement in millimeters to convert
 * @returns The equivalent measurement in TWIP
 *
 * @example
 * ```typescript
 * const width = convertMillimetersToTwip(25.4); // Returns 1440 (1 inch)
 * ```
 *
 * @publicApi
 */
export declare const convertMillimetersToTwip: (millimeters: number) => number;

/**
 * Converts an xml-js Element into an XmlComponent tree.
 *
 * This function recursively processes XML elements in JSON format (from xml-js)
 * and creates a tree of ImportedXmlComponent objects that match the structure
 * of the original XML.
 *
 * @param element - The XML element in JSON representation from xml-js
 * @returns An ImportedXmlComponent tree, text string, or undefined
 *
 * @example
 * ```typescript
 * const xmlElement = xml2js('<w:p><w:r><w:t>Hello</w:t></w:r></w:p>');
 * const component = convertToXmlComponent(xmlElement);
 * ```
 */
export declare const convertToXmlComponent: (element: Element_2) => ImportedXmlComponent | string | undefined;

declare type CoreGroupOptions = {
    readonly children: readonly IGroupChildMediaData[];
    readonly transformation: IMediaTransformation;
    readonly floating?: IFloating;
    readonly altText?: DocPropertiesOptions;
};

/**
 * Core options for image configuration.
 *
 * `link` opens a web address when the image is clicked (with Ctrl in Word), and takes precedence over a hyperlink the
 * image is in. `decorative` marks the image as decorative, as Word's "Mark as decorative" does, so screen readers skip
 * it: use it instead of alternative text for images that carry no information, such as borders and flourishes.
 */
declare type CoreImageOptions = DrawingLinkOptions & {
    /** Size, position, rotation, and flip settings for the image. Width and height are specified in pixels. */
    readonly transformation: IMediaTransformation;
    /** Floating layout options. When set, the image is positioned freely on the page rather than inline with text. Controls text wrapping, overlap, anchoring, and z-order. */
    readonly floating?: IFloating;
    /** Accessibility properties for the image, including a name, description (alt text), and title. */
    readonly altText?: DocPropertiesOptions;
    /** Border/outline settings for the image, including line width, color, cap style, and compound line type. */
    readonly outline?: OutlineOptions;
    /** Solid color fill behind the image, using either an RGB hex value or a theme scheme color. */
    readonly solidFill?: SolidFillOptions;
    /** Crops the image by trimming a percentage (0-100) off each edge before it is stretched to fill the frame. */
    readonly crop?: ICropOptions;
    /** Formatting of the run the image is in, such as `position` to raise or lower it from the text's baseline. */
    readonly run?: IRunPropertiesOptions;
    /** Marks the image as an inserted revision for change tracking. Requires an id, author name, and date. */
    readonly insertion?: IChangedAttributesProperties;
    /**
     * Marks the image as a deleted revision for change tracking. Requires an id, author name, and date. With
     * `insertion`, the image was inserted and then deleted, such as by another author.
     */
    readonly deletion?: IChangedAttributesProperties;
};

/**
 * Core properties shared by all media data types.
 */
declare type CoreMediaData = {
    /** File name for the media in the package */
    readonly fileName: string;
    /** Transformation settings for display */
    readonly transformation: IMediaDataTransformation;
    /** Raw image data as Buffer, Uint8Array, or ArrayBuffer */
    readonly data: Buffer | Uint8Array | ArrayBuffer;
};

/**
 * Represents the core properties of a WordprocessingML document.
 *
 * Core properties contain document metadata based on Dublin Core elements,
 * including title, subject, creator, keywords, description, and modification tracking.
 *
 * Reference: ISO-IEC29500-4_2016 shared-documentPropertiesCore.xsd
 *
 * ## XSD Schema
 * ```xml
 * <xs:complexType name="CT_CoreProperties">
 *   <xs:all>
 *     <xs:element name="category" minOccurs="0" maxOccurs="1" type="xs:string"/>
 *     <xs:element name="contentStatus" minOccurs="0" maxOccurs="1" type="xs:string"/>
 *     <xs:element ref="dcterms:created" minOccurs="0" maxOccurs="1"/>
 *     <xs:element ref="dc:creator" minOccurs="0" maxOccurs="1"/>
 *     <xs:element ref="dc:description" minOccurs="0" maxOccurs="1"/>
 *     <xs:element ref="dc:identifier" minOccurs="0" maxOccurs="1"/>
 *     <xs:element name="keywords" minOccurs="0" maxOccurs="1" type="CT_Keywords"/>
 *     <xs:element ref="dc:language" minOccurs="0" maxOccurs="1"/>
 *     <xs:element name="lastModifiedBy" minOccurs="0" maxOccurs="1" type="xs:string"/>
 *     <xs:element name="lastPrinted" minOccurs="0" maxOccurs="1" type="xs:dateTime"/>
 *     <xs:element ref="dcterms:modified" minOccurs="0" maxOccurs="1"/>
 *     <xs:element name="revision" minOccurs="0" maxOccurs="1" type="xs:string"/>
 *     <xs:element ref="dc:subject" minOccurs="0" maxOccurs="1"/>
 *     <xs:element ref="dc:title" minOccurs="0" maxOccurs="1"/>
 *     <xs:element name="version" minOccurs="0" maxOccurs="1" type="xs:string"/>
 *   </xs:all>
 * </xs:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const coreProps = new CoreProperties({
 *   title: "My Document",
 *   subject: "Sample Document",
 *   creator: "John Doe",
 *   keywords: "docx, example",
 *   description: "A sample document",
 *   lastModifiedBy: "Jane Doe",
 *   revision: 1
 * });
 * ```
 */
declare class CoreProperties extends XmlComponent {
    constructor(options: Omit<IPropertiesOptions, "sections">);
}

declare type CoreShapeOptions = {
    readonly transformation: IMediaTransformation;
    readonly floating?: IFloating;
    readonly altText?: DocPropertiesOptions;
    readonly outline?: OutlineOptions;
    readonly solidFill?: SolidFillOptions;
};

/**
 * Creates paragraph alignment (justification) element for a WordprocessingML document.
 *
 * The jc element specifies the horizontal alignment of all text in the paragraph.
 *
 * Reference: http://officeopenxml.com/WPalignment.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Jc">
 *   <xsd:attribute name="val" type="ST_Jc" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new Paragraph({
 *   alignment: AlignmentType.CENTER,
 *   children: [new TextRun("Centered text")],
 * });
 * ```
 */
export declare const createAlignment: (type: (typeof AlignmentType)[keyof typeof AlignmentType]) => XmlComponent;

export declare const createBodyProperties: (options?: IBodyPropertiesOptions) => XmlComponent;

/**
 * Creates a border element for a WordprocessingML document.
 *
 * Used to create border specifications for paragraphs, tables, table cells,
 * and sections. The element name is specified to create different border
 * types (top, bottom, left, right, etc.).
 *
 * @example
 * ```typescript
 * // Create a top border
 * createBorderElement("w:top", {
 *   style: BorderStyle.SINGLE,
 *   color: "FF0000",
 *   size: 24,
 *   space: 1,
 * });
 * ```
 */
export declare const createBorderElement: (elementName: string, { color, size, space, style }: IBorderOptions) => XmlComponent;

/**
 * Creates column layout settings (cols) for a document section.
 *
 * This element defines the multi-column layout properties for a section,
 * including column count, spacing, and whether columns have equal or custom widths.
 *
 * Reference: http://officeopenxml.com/WPsectionPr.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Columns">
 *   <xsd:sequence minOccurs="0">
 *     <xsd:element name="col" type="CT_Column" maxOccurs="45"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="equalWidth" type="s:ST_OnOff" use="optional"/>
 *   <xsd:attribute name="space" type="s:ST_TwipsMeasure" use="optional" default="720"/>
 *   <xsd:attribute name="num" type="ST_DecimalNumber" use="optional" default="1"/>
 *   <xsd:attribute name="sep" type="s:ST_OnOff" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Two equal-width columns with separator
 * createColumns({
 *   count: 2,
 *   space: 720,
 *   separate: true,
 *   equalWidth: true
 * });
 *
 * // Custom column widths
 * createColumns({
 *   equalWidth: false,
 *   children: [
 *     { width: 3000, space: 720 },
 *     { width: 4000, space: 0 }
 *   ]
 * });
 * ```
 */
export declare const createColumns: ({ space, count, separate, equalWidth, children }: IColumnsAttributes) => XmlComponent;

/**
 * This element specifies the settings for the document grid, which enables precise layout of full-width East Asian language characters within a document by specifying the desired number of characters per line and lines per page for all East Asian text content in this section.
 *
 * Reference: https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_docGrid_topic_ID0EHU5S.html
 *
 * ```xml
 * <xsd:complexType name="CT_DocGrid">
 *   <xsd:attribute name="type" type="ST_DocGrid"/>
 *   <xsd:attribute name="linePitch" type="ST_DecimalNumber"/>
 *   <xsd:attribute name="charSpace" type="ST_DecimalNumber"/>
 * </xsd:complexType>
 * ```
 * @returns
 */
export declare const createDocumentGrid: ({ type, linePitch, charSpace }: IDocGridAttributesProperties) => XmlComponent;

/**
 * Creates a dot emphasis mark.
 *
 * Convenience function for applying a dot emphasis mark to text.
 */
export declare const createDotEmphasisMark: () => XmlComponent;

/**
 * Creates an emphasis mark element for a WordprocessingML document.
 *
 * Emphasis marks are characters (typically dots or circles) placed above or below
 * text to emphasize it. This is commonly used in East Asian typography.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Em">
 *   <xsd:attribute name="val" type="ST_Em" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Apply dot emphasis mark
 * createEmphasisMark(EmphasisMarkType.DOT);
 *
 * // Default to dot
 * createEmphasisMark();
 * ```
 */
export declare const createEmphasisMark: (emphasisMarkType?: (typeof EmphasisMarkType)[keyof typeof EmphasisMarkType]) => XmlComponent;

/**
 * Creates a frame properties XML component for paragraph text frames.
 *
 * Frames allow paragraphs to be positioned absolutely on the page with text wrapping.
 * They support both coordinate-based and alignment-based positioning, along with
 * drop cap effects and various text wrapping options.
 *
 * Reference: http://officeopenxml.com/WPparagraph-textFrames.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_FramePr">
 *   <xsd:attribute name="dropCap" type="ST_DropCap" use="optional"/>
 *   <xsd:attribute name="lines" type="ST_DecimalNumber" use="optional"/>
 *   <xsd:attribute name="w" type="s:ST_TwipsMeasure" use="optional"/>
 *   <xsd:attribute name="h" type="s:ST_TwipsMeasure" use="optional"/>
 *   <xsd:attribute name="vSpace" type="s:ST_TwipsMeasure" use="optional"/>
 *   <xsd:attribute name="hSpace" type="s:ST_TwipsMeasure" use="optional"/>
 *   <xsd:attribute name="wrap" type="ST_Wrap" use="optional"/>
 *   <xsd:attribute name="hAnchor" type="ST_HAnchor" use="optional"/>
 *   <xsd:attribute name="vAnchor" type="ST_VAnchor" use="optional"/>
 *   <xsd:attribute name="x" type="ST_SignedTwipsMeasure" use="optional"/>
 *   <xsd:attribute name="xAlign" type="s:ST_XAlign" use="optional"/>
 *   <xsd:attribute name="y" type="ST_SignedTwipsMeasure" use="optional"/>
 *   <xsd:attribute name="yAlign" type="s:ST_YAlign" use="optional"/>
 *   <xsd:attribute name="hRule" type="ST_HeightRule" use="optional"/>
 *   <xsd:attribute name="anchorLock" type="s:ST_OnOff" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Frame with absolute positioning
 * createFrameProperties({
 *   type: "absolute",
 *   position: { x: 1440, y: 1440 }, // 1 inch from anchor
 *   width: 2880, // 2 inches
 *   height: 1440, // 1 inch
 *   anchor: {
 *     horizontal: FrameAnchorType.PAGE,
 *     vertical: FrameAnchorType.PAGE,
 *   },
 *   wrap: FrameWrap.AROUND,
 * });
 *
 * // Frame with alignment positioning and drop cap
 * createFrameProperties({
 *   type: "alignment",
 *   alignment: {
 *     x: HorizontalPositionAlign.LEFT,
 *     y: VerticalPositionAlign.TOP,
 *   },
 *   width: 1440,
 *   height: 1440,
 *   anchor: {
 *     horizontal: FrameAnchorType.TEXT,
 *     vertical: FrameAnchorType.TEXT,
 *   },
 *   dropCap: DropCapType.DROP,
 *   lines: 3,
 * });
 * ```
 *
 * @param options - Frame positioning and formatting options
 * @returns XmlComponent representing the frame properties element
 */
export declare const createFrameProperties: (options: IFrameOptions) => XmlComponent;

export declare const createHeaderFooterReference: (type: (typeof HeaderFooterType)[keyof typeof HeaderFooterType], options: IHeaderFooterOptions) => XmlComponent;

/**
 * Creates a horizontal position element for floating drawings.
 *
 * The positionH element specifies the horizontal positioning of a floating
 * object relative to a base element (page, margin, column, etc.).
 *
 * Reference: https://www.datypic.com/sc/ooxml/e-wp_positionH-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PosH">
 *   <xsd:choice>
 *     <xsd:element name="align" type="ST_AlignH"/>
 *     <xsd:element name="posOffset" type="ST_PositionOffset"/>
 *   </xsd:choice>
 *   <xsd:attribute name="relativeFrom" type="ST_RelFromH" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @param options - Horizontal position configuration
 * @returns The positionH XML element
 *
 * @example
 * ```typescript
 * // Align to the left of the page
 * createHorizontalPosition({
 *   relative: HorizontalPositionRelativeFrom.PAGE,
 *   align: HorizontalPositionAlign.LEFT,
 * });
 *
 * // Offset from the margin
 * createHorizontalPosition({
 *   relative: HorizontalPositionRelativeFrom.MARGIN,
 *   offset: 914400, // 1 inch in EMUs
 * });
 * ```
 */
export declare const createHorizontalPosition: ({ relative, align, offset }: IHorizontalPositionOptions) => XmlComponent;

/**
 * Creates paragraph indentation element for a WordprocessingML document.
 *
 * The ind element specifies the indentation of the paragraph from the margins.
 *
 * Reference: http://officeopenxml.com/WPindentation.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Ind">
 *   <xsd:attribute name="start" type="ST_SignedTwipsMeasure" use="optional"/>
 *   <xsd:attribute name="startChars" type="ST_DecimalNumber" use="optional"/>
 *   <xsd:attribute name="end" type="ST_SignedTwipsMeasure" use="optional"/>
 *   <xsd:attribute name="endChars" type="ST_DecimalNumber" use="optional"/>
 *   <xsd:attribute name="left" type="ST_SignedTwipsMeasure" use="optional"/>
 *   <xsd:attribute name="leftChars" type="ST_DecimalNumber" use="optional"/>
 *   <xsd:attribute name="right" type="ST_SignedTwipsMeasure" use="optional"/>
 *   <xsd:attribute name="rightChars" type="ST_DecimalNumber" use="optional"/>
 *   <xsd:attribute name="hanging" type="s:ST_TwipsMeasure" use="optional"/>
 *   <xsd:attribute name="hangingChars" type="ST_DecimalNumber" use="optional"/>
 *   <xsd:attribute name="firstLine" type="s:ST_TwipsMeasure" use="optional"/>
 *   <xsd:attribute name="firstLineChars" type="ST_DecimalNumber" use="optional"/>
 * </xsd:complexType>
 * ```
 */
export declare const createIndent: ({ start, end, left, right, hanging, firstLine, firstLineChars }: IIndentAttributesProperties) => XmlComponent;

/**
 * This element specifies the settings for line numbering to be displayed before each column of text in this section in the document.
 *
 * References:
 * - https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_lnNumType_topic_ID0EVRAT.html
 * - http://officeopenxml.com/WPsectionLineNumbering.php
 *
 * ## XSD Schema
 *
 * ```xml
 * <xsd:complexType name="CT_LineNumber">
 *   <xsd:attribute name="countBy" type="ST_DecimalNumber" use="optional"/>
 *   <xsd:attribute name="start" type="ST_DecimalNumber" use="optional" default="1"/>
 *   <xsd:attribute name="distance" type="s:ST_TwipsMeasure" use="optional"/>
 *   <xsd:attribute name="restart" type="ST_LineNumberRestart" use="optional" default="newPage"/>
 * </xsd:complexType>
 * ```
 */
export declare const createLineNumberType: ({ countBy, start, restart, distance }: ILineNumberAttributes) => XmlComponent;

/**
 * Creates an accent character element for n-ary operators.
 *
 * This element specifies the character used for the n-ary operator,
 * such as summation (∑), integral (∫), or product (∏) symbols.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_chr-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Char">
 *   <xsd:attribute name="val" type="ST_Char" use="required"/>
 * </xsd:complexType>
 * ```
 */
export declare const createMathAccentCharacter: ({ accent }: MathAccentCharacterOptions) => XmlComponent;

/**
 * Creates a math base element.
 *
 * The math base (m:e) is used within math structures like fractions,
 * radicals, and n-ary operators to contain the primary expression.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_e-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_OMathArg">
 *   <xsd:sequence>
 *     <xsd:element name="argPr" type="CT_OMathArgPr" minOccurs="0"/>
 *     <xsd:group ref="EG_OMathMathElements" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="ctrlPr" type="CT_CtrlPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export declare const createMathBase: ({ children }: MathBaseOptions) => XmlComponent;

/**
 * Creates a limit location element for n-ary operators.
 *
 * This element specifies where limits appear relative to the operator:
 * - "undOvr": limits appear directly above and below the operator
 * - "subSup": limits appear as superscript and subscript
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_limLoc-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_LimLoc">
 *   <xsd:attribute name="val" type="ST_LimLoc"/>
 * </xsd:complexType>
 * ```
 */
export declare const createMathLimitLocation: ({ value }: MathLimitLocationOptions) => XmlComponent;

/**
 * Creates properties for n-ary operator structures.
 *
 * This element specifies properties for n-ary objects like summations
 * and integrals, including the operator character and limit positioning.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_naryPr-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_NaryPr">
 *   <xsd:sequence>
 *     <xsd:element name="chr" type="CT_Char" minOccurs="0"/>
 *     <xsd:element name="limLoc" type="CT_LimLoc" minOccurs="0"/>
 *     <xsd:element name="grow" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="subHide" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="supHide" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="ctrlPr" type="CT_CtrlPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export declare const createMathNAryProperties: ({ accent, hasSuperScript, hasSubScript, limitLocationVal, }: MathNAryPropertiesOptions) => XmlComponent;

/**
 * Creates properties for a pre-subscript and pre-superscript structure.
 *
 * This element specifies properties for the pre-script object.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sPrePr-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SPrePr">
 *   <xsd:sequence>
 *     <xsd:element name="ctrlPr" type="CT_CtrlPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export declare const createMathPreSubSuperScriptProperties: () => XmlComponent;

/**
 * Creates a subscript element for math structures.
 *
 * This element contains the subscript content, used in n-ary operators,
 * script objects, and other structures that support subscripts.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sub-3.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_OMathArg">
 *   <xsd:sequence>
 *     <xsd:element name="argPr" type="CT_OMathArgPr" minOccurs="0"/>
 *     <xsd:group ref="EG_OMathMathElements" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="ctrlPr" type="CT_CtrlPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export declare const createMathSubScriptElement: ({ children }: MathSubScriptElementOptions) => XmlComponent;

/**
 * Creates properties for a subscript structure.
 *
 * This element specifies properties for the subscript object.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sSubPr-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SSubPr">
 *   <xsd:sequence>
 *     <xsd:element name="ctrlPr" type="CT_CtrlPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export declare const createMathSubScriptProperties: () => XmlComponent;

/**
 * Creates properties for a combined subscript and superscript structure.
 *
 * This element specifies properties for the subscript-superscript object.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sSubSupPr-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SSubSupPr">
 *   <xsd:sequence>
 *     <xsd:element name="alignScripts" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="ctrlPr" type="CT_CtrlPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export declare const createMathSubSuperScriptProperties: () => XmlComponent;

/**
 * Creates a superscript element for math structures.
 *
 * This element contains the superscript content, used in n-ary operators,
 * script objects, and other structures that support superscripts.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sup-3.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_OMathArg">
 *   <xsd:sequence>
 *     <xsd:element name="argPr" type="CT_OMathArgPr" minOccurs="0"/>
 *     <xsd:group ref="EG_OMathMathElements" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="ctrlPr" type="CT_CtrlPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export declare const createMathSuperScriptElement: ({ children }: MathSuperScriptElementOptions) => XmlComponent;

/**
 * Creates properties for a superscript structure.
 *
 * This element specifies properties for the superscript object.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sSupPr-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SSupPr">
 *   <xsd:sequence>
 *     <xsd:element name="ctrlPr" type="CT_CtrlPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export declare const createMathSuperScriptProperties: () => XmlComponent;

/**
 * Creates an outline level element for a paragraph.
 *
 * The outline level determines the paragraph's position in the document
 * outline and affects table of contents generation. Level 0 corresponds
 * to Heading 1, level 1 to Heading 2, etc.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_DecimalNumber">
 *   <xsd:attribute name="val" type="xsd:integer" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Set outline level to 0 (Heading 1)
 * createOutlineLevel(0);
 *
 * // Set outline level to 2 (Heading 3)
 * createOutlineLevel(2);
 * ```
 */
export declare const createOutlineLevel: (level: number) => XmlComponent;

/**
 * Creates page margins (pgMar) for a document section.
 *
 * This element specifies the page margins for all pages in a section,
 * including top, bottom, left, right, header, footer, and gutter margins.
 *
 * Reference: http://officeopenxml.com/WPsectionPr.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PageMar">
 *   <xsd:attribute name="top" type="ST_SignedTwipsMeasure" use="required"/>
 *   <xsd:attribute name="right" type="s:ST_TwipsMeasure" use="required"/>
 *   <xsd:attribute name="bottom" type="ST_SignedTwipsMeasure" use="required"/>
 *   <xsd:attribute name="left" type="s:ST_TwipsMeasure" use="required"/>
 *   <xsd:attribute name="header" type="s:ST_TwipsMeasure" use="required"/>
 *   <xsd:attribute name="footer" type="s:ST_TwipsMeasure" use="required"/>
 *   <xsd:attribute name="gutter" type="s:ST_TwipsMeasure" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create page margins with 1 inch margins (1440 twips = 1 inch)
 * createPageMargin(1440, 1440, 1440, 1440, 720, 720, 0);
 * ```
 */
export declare const createPageMargin: (top: number | UniversalMeasure, right: number | PositiveUniversalMeasure, bottom: number | UniversalMeasure, left: number | PositiveUniversalMeasure, header: number | PositiveUniversalMeasure, footer: number | PositiveUniversalMeasure, gutter: number | PositiveUniversalMeasure) => XmlComponent;

/**
 * Creates page numbering settings (pgNumType) for a document section.
 *
 * This element specifies the page numbering format and starting value
 * for all pages in a section.
 *
 * Reference: http://officeopenxml.com/WPSectionPgNumType.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PageNumber">
 *   <xsd:attribute name="fmt" type="ST_NumberFormat" use="optional" default="decimal"/>
 *   <xsd:attribute name="start" type="ST_DecimalNumber" use="optional"/>
 *   <xsd:attribute name="chapStyle" type="ST_DecimalNumber" use="optional"/>
 *   <xsd:attribute name="chapSep" type="ST_ChapterSep" use="optional" default="hyphen"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Start page numbering at 5 with lowercase roman numerals
 * createPageNumberType({
 *   start: 5,
 *   formatType: NumberFormat.LOWER_ROMAN
 * });
 * ```
 */
export declare const createPageNumberType: ({ start, formatType, separator }: IPageNumberTypeAttributes) => XmlComponent;

/**
 * This element specifies the properties (size and orientation) for all pages in the current section.
 *
 * Reference: https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_pgSz_topic_ID0ENEDT.html?hl=pgsz%2Cpage%2Csize
 *
 * ## XSD Schema
 *
 * ```xml
 * <xsd:complexType name="CT_PageSz">
 *   <xsd:attribute name="w" type="s:ST_TwipsMeasure"/>
 *   <xsd:attribute name="h" type="s:ST_TwipsMeasure"/>
 *   <xsd:attribute name="orient" type="ST_PageOrientation" use="optional"/>
 *   <xsd:attribute name="code" type="ST_DecimalNumber" use="optional"/>
 * </xsd:complexType>
 * ```
 */
export declare const createPageSize: ({ width, height, orientation, code }: IPageSizeAttributes) => XmlComponent;

/**
 * Creates a paragraph style reference for a WordprocessingML document.
 *
 * The pStyle element specifies the paragraph style to apply to the paragraph.
 *
 * Reference: http://officeopenxml.com/WPstyle.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_String">
 *   <xsd:attribute name="val" type="s:ST_String" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Using a built-in heading style
 * new Paragraph({
 *   style: HeadingLevel.HEADING_1,
 *   children: [new TextRun("Chapter 1")],
 * });
 *
 * // Using a custom style
 * new Paragraph({
 *   style: "MyCustomStyle",
 *   children: [new TextRun("Styled text")],
 * });
 * ```
 */
export declare const createParagraphStyle: (styleId: string) => XmlComponent;

/**
 * Creates font settings for a run in a WordprocessingML document.
 *
 * The rFonts element specifies which fonts should be used for different character
 * ranges in a run. This allows documents to use different fonts for ASCII, complex
 * script, East Asian, and high ANSI characters.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Fonts">
 *   <xsd:attribute name="hint" type="ST_Hint"/>
 *   <xsd:attribute name="ascii" type="s:ST_String"/>
 *   <xsd:attribute name="hAnsi" type="s:ST_String"/>
 *   <xsd:attribute name="eastAsia" type="s:ST_String"/>
 *   <xsd:attribute name="cs" type="s:ST_String"/>
 *   <xsd:attribute name="asciiTheme" type="ST_Theme"/>
 *   <xsd:attribute name="hAnsiTheme" type="ST_Theme"/>
 *   <xsd:attribute name="eastAsiaTheme" type="ST_Theme"/>
 *   <xsd:attribute name="cstheme" type="ST_Theme"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Use same font for all character sets
 * createRunFonts("Arial");
 *
 * // Specify different fonts for different character sets
 * createRunFonts({
 *   ascii: "Arial",
 *   eastAsia: "MS Mincho",
 *   cs: "Arial",
 *   hAnsi: "Arial",
 * });
 *
 * // Use the theme's font for body text, in every character set
 * createRunFonts({ theme: "body" });
 * ```
 */
export declare const createRunFonts: (nameOrAttrs: string | IFontAttributesProperties | IThemeFontReference, hint?: string) => XmlComponent;

/**
 * Creates section type (type) for a document section.
 *
 * This element specifies the type of section break, which determines
 * where the new section begins relative to the previous section.
 *
 * Reference: http://officeopenxml.com/WPsection.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SectType">
 *   <xsd:attribute name="val" type="ST_SectionMark"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create a continuous section (no page break)
 * createSectionType(SectionType.CONTINUOUS);
 *
 * // Create a section that starts on next odd page
 * createSectionType(SectionType.ODD_PAGE);
 * ```
 */
export declare const createSectionType: (value: (typeof SectionType)[keyof typeof SectionType]) => XmlComponent;

/**
 * Creates a shading element for a WordprocessingML document.
 *
 * The shd element specifies the shading applied to the paragraph,
 * table cell, or text run.
 *
 * Reference: http://officeopenxml.com/WPshading.php
 */
export declare const createShading: ({ fill, color, type }: IShadingAttributesProperties) => XmlComponent;

/**
 * # Simple Positioning Coordinates
 *
 * This element specifies the coordinates at which a DrawingML object shall be positioned relative to the top-left edge of its page, when the `simplePos` attribute is specified on the <anchor> element (§5.5.2.3).
 *
 * References:
 * - https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_simplePos_topic_ID0E5K6OB.html
 * - http://officeopenxml.com/drwPicFloating-position.php
 *
 * ## XSD Schema
 *
 * ```xml
 * <xsd:complexType name="CT_Point2D">
 *   <xsd:attribute name="x" type="ST_Coordinate" use="required"/>
 *   <xsd:attribute name="y" type="ST_Coordinate" use="required"/>
 * </xsd:complexType>
 * ```
 */
export declare const createSimplePos: () => XmlComponent;

/**
 * Creates paragraph spacing element for a WordprocessingML document.
 *
 * The spacing element specifies the spacing between lines and paragraphs.
 *
 * Reference: http://officeopenxml.com/WPspacing.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Spacing">
 *   <xsd:attribute name="before" type="s:ST_TwipsMeasure" use="optional"/>
 *   <xsd:attribute name="beforeLines" type="ST_DecimalNumber" use="optional"/>
 *   <xsd:attribute name="beforeAutospacing" type="s:ST_OnOff" use="optional"/>
 *   <xsd:attribute name="after" type="s:ST_TwipsMeasure" use="optional"/>
 *   <xsd:attribute name="afterLines" type="ST_DecimalNumber" use="optional"/>
 *   <xsd:attribute name="afterAutospacing" type="s:ST_OnOff" use="optional"/>
 *   <xsd:attribute name="line" type="ST_SignedTwipsMeasure" use="optional"/>
 *   <xsd:attribute name="lineRule" type="ST_LineSpacingRule" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new Paragraph({
 *   spacing: {
 *     before: 200,
 *     after: 200,
 *     line: 360,
 *     lineRule: LineRuleType.AT_LEAST,
 *   },
 *   children: [new TextRun("Paragraph with custom spacing")],
 * });
 * ```
 */
export declare const createSpacing: ({ after, before, line, lineRule, beforeAutoSpacing, afterAutoSpacing }: ISpacingProperties) => XmlComponent;

/**
 * Creates a string element using the builder pattern.
 *
 * This is an alternative to StringValueElement that uses BuilderElement
 * for more explicit attribute naming.
 *
 * @param name - The XML element name
 * @param value - The string value
 * @returns An XmlComponent with the string value
 *
 * @example
 * ```typescript
 * createStringElement("w:pStyle", "Heading1");
 * // Generates: <w:pStyle w:val="Heading1"/>
 * ```
 */
export declare const createStringElement: (name: string, value: string) => XmlComponent;

/**
 * Creates floating table properties in a WordprocessingML document.
 *
 * This element specifies the positioning of a floating table,
 * including anchor points, offsets, and text wrapping behavior.
 * The overlap option isn't part of it: the table properties write it as w:tblOverlap.
 *
 * Reference: http://officeopenxml.com/WPtableFloating.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_TblPPr">
 *   <xsd:attribute name="leftFromText" type="s:ST_TwipsMeasure"/>
 *   <xsd:attribute name="rightFromText" type="s:ST_TwipsMeasure"/>
 *   <xsd:attribute name="topFromText" type="s:ST_TwipsMeasure"/>
 *   <xsd:attribute name="bottomFromText" type="s:ST_TwipsMeasure"/>
 *   <xsd:attribute name="vertAnchor" type="ST_VAnchor"/>
 *   <xsd:attribute name="horzAnchor" type="ST_HAnchor"/>
 *   <xsd:attribute name="tblpXSpec" type="s:ST_XAlign"/>
 *   <xsd:attribute name="tblpX" type="ST_SignedTwipsMeasure"/>
 *   <xsd:attribute name="tblpYSpec" type="s:ST_YAlign"/>
 *   <xsd:attribute name="tblpY" type="ST_SignedTwipsMeasure"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * createTableFloatProperties({
 *   horizontalAnchor: TableAnchorType.MARGIN,
 *   relativeHorizontalPosition: RelativeHorizontalPosition.CENTER,
 *   topFromText: 200,
 *   bottomFromText: 200,
 * });
 * ```
 */
export declare const createTableFloatProperties: ({ horizontalAnchor, verticalAnchor, absoluteHorizontalPosition, relativeHorizontalPosition, absoluteVerticalPosition, relativeVerticalPosition, bottomFromText, topFromText, leftFromText, rightFromText, }: ITableFloatOptions) => XmlComponent;

/**
 * Creates table layout settings in a WordprocessingML document.
 *
 * The tblLayout element specifies the algorithm used to lay out the table.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_TblLayoutType">
 *   <xsd:attribute name="type" type="ST_TblLayoutType"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * createTableLayout(TableLayoutType.FIXED);
 * ```
 */
export declare const createTableLayout: (type: (typeof TableLayoutType)[keyof typeof TableLayoutType]) => XmlComponent;

/**
 * Creates a table look element for conditional formatting settings.
 *
 * The tblLook element specifies which conditional formatting settings
 * are active for a table. These settings work in conjunction with table
 * styles to apply special formatting to specific regions of the table.
 *
 * Reference: http://officeopenxml.com/WPtblLook.php
 *
 * @example
 * ```typescript
 * // Table with header row formatting and alternating row colors
 * new Table({
 *   rows: [...],
 *   tableLook: {
 *     firstRow: true,
 *     noHBand: false,
 *     noVBand: true,
 *   },
 * });
 * ```
 */
export declare const createTableLook: ({ firstRow, lastRow, firstColumn, lastColumn, noHBand, noVBand }: ITableLookOptions) => XmlComponent;

/**
 * Creates table row height (trHeight) in a WordprocessingML document.
 *
 * The trHeight element specifies the height of a table row, along with a rule
 * determining how the height should be applied.
 *
 * Reference: http://officeopenxml.com/WPtableRow.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Height">
 *   <xsd:attribute name="val" type="s:ST_TwipsMeasure"/>
 *   <xsd:attribute name="hRule" type="ST_HeightRule"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * createTableRowHeight(1000, HeightRule.EXACT);
 * ```
 */
export declare const createTableRowHeight: (value: number | PositiveUniversalMeasure, rule: (typeof HeightRule)[keyof typeof HeightRule]) => XmlComponent;

/**
 * Creates a table width element in a WordprocessingML document.
 *
 * Used for specifying widths of tables, cells, margins, and indentation.
 *
 * Reference: http://officeopenxml.com/WPtableWidth.php
 *
 * @example
 * ```typescript
 * createTableWidthElement("w:tblW", { size: 5000, type: WidthType.DXA });
 * createTableWidthElement("w:tcW", { size: 50, type: WidthType.PERCENTAGE });
 * ```
 */
export declare const createTableWidthElement: (name: string, { type, size }: ITableWidthProperties) => XmlComponent;

/**
 * Creates a collection of tab stops for a WordprocessingML document.
 *
 * Tab stops define the positions where text will align when a tab character is used.
 *
 * Reference: http://officeopenxml.com/WPtab.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Tabs">
 *   <xsd:sequence>
 *     <xsd:element name="tab" type="CT_TabStop" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new Paragraph({
 *   tabStops: [
 *     { type: TabStopType.LEFT, position: 2000 },
 *     { type: TabStopType.CENTER, position: 4000 },
 *     { type: TabStopType.RIGHT, position: TabStopPosition.MAX, leader: LeaderType.DOT },
 *   ],
 *   children: [new TextRun("Text\twith\ttabs")],
 * });
 * ```
 */
export declare const createTabStop: (tabDefinitions: readonly TabStopDefinition[]) => XmlComponent;

/**
 * Creates a single tab stop item element.
 *
 * Reference: http://officeopenxml.com/WPtab.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_TabStop">
 *   <xsd:attribute name="val" type="ST_TabJc" use="required"/>
 *   <xsd:attribute name="leader" type="ST_TabTlc" use="optional"/>
 *   <xsd:attribute name="pos" type="ST_SignedTwipsMeasure" use="required"/>
 * </xsd:complexType>
 * ```
 */
export declare const createTabStopItem: ({ type, position, leader }: TabStopDefinition) => XmlComponent;

export declare const createTransformation: (options: IMediaTransformation) => IMediaDataTransformation;

/**
 * Creates underline formatting for a run in a WordprocessingML document.
 *
 * The u element specifies the style and optional color of underline
 * formatting applied to text.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Underline">
 *   <xsd:attribute name="val" type="ST_Underline" use="required"/>
 *   <xsd:attribute name="color" type="ST_HexColor"/>
 *   <xsd:attribute name="themeColor" type="ST_ThemeColor"/>
 *   <xsd:attribute name="themeTint" type="ST_UcharHexNumber"/>
 *   <xsd:attribute name="themeShade" type="ST_UcharHexNumber"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Simple single underline
 * createUnderline();
 *
 * // Double underline
 * createUnderline(UnderlineType.DOUBLE);
 *
 * // Red wavy underline
 * createUnderline(UnderlineType.WAVE, "FF0000");
 *
 * // Underline in the theme's first accent color
 * createUnderline(UnderlineType.SINGLE, { theme: "accent1" });
 * ```
 */
export declare const createUnderline: (underlineType?: (typeof UnderlineType)[keyof typeof UnderlineType], color?: string | ThemeColor) => XmlComponent;

/**
 * Creates a vertical alignment element in a WordprocessingML document.
 *
 * Used in table cells and sections to control vertical text positioning.
 *
 * @example
 * ```typescript
 * createVerticalAlign(VerticalAlignTable.CENTER);
 * ```
 */
export declare const createVerticalAlign: (value: (typeof VerticalAlign)[keyof typeof VerticalAlign]) => XmlComponent;

/**
 * Creates a vertical position element for floating drawings.
 *
 * The positionV element specifies the vertical positioning of a floating
 * object relative to a base element (page, margin, paragraph, line, etc.).
 *
 * Reference: https://www.datypic.com/sc/ooxml/e-wp_positionV-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PosV">
 *   <xsd:choice>
 *     <xsd:element name="align" type="ST_AlignV"/>
 *     <xsd:element name="posOffset" type="ST_PositionOffset"/>
 *   </xsd:choice>
 *   <xsd:attribute name="relativeFrom" type="ST_RelFromV" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @param options - Vertical position configuration
 * @returns The positionV XML element
 *
 * @example
 * ```typescript
 * // Align to the top of the page
 * createVerticalPosition({
 *   relative: VerticalPositionRelativeFrom.PAGE,
 *   align: VerticalPositionAlign.TOP,
 * });
 *
 * // Offset from the paragraph
 * createVerticalPosition({
 *   relative: VerticalPositionRelativeFrom.PARAGRAPH,
 *   offset: 457200, // 0.5 inch in EMUs
 * });
 * ```
 */
export declare const createVerticalPosition: ({ relative, align, offset }: IVerticalPositionOptions) => XmlComponent;

/**
 * Creates a VML shape element.
 *
 * The VML shape element (v:shape) represents a vector graphics shape in WordprocessingML documents.
 * The shape's appearance is determined by its type (a reference to a `v:shapetype`), its style,
 * and its children.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Shape">
 *   <xsd:choice maxOccurs="unbounded">
 *     <xsd:group ref="EG_ShapeElements"/>
 *     <xsd:element ref="o:ink"/>
 *     <xsd:element ref="pvml:iscomment"/>
 *     <xsd:element ref="o:equationxml"/>
 *   </xsd:choice>
 *   <xsd:attributeGroup ref="AG_AllCoreAttributes"/>
 *   <xsd:attributeGroup ref="AG_AllShapeAttributes"/>
 *   <xsd:attributeGroup ref="AG_Type"/>
 *   <xsd:attributeGroup ref="AG_Adj"/>
 *   <xsd:attributeGroup ref="AG_Path"/>
 *   <xsd:attribute ref="o:gfxdata"/>
 *   <xsd:attribute name="equationxml" type="xsd:string" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @param options - Configuration options for the shape
 * @returns An XmlComponent representing the v:shape element
 *
 * Text boxes are drawn with it, and so are the watermarks in `docx/watermarks`.
 *
 * @example
 * ```typescript
 * const shape = createVmlShape({
 *   id: "box",
 *   type: "#_x0000_t202",
 *   style: { position: "absolute", width: "200pt", height: "50pt", rotation: 10 },
 *   fillColor: "silver",
 *   stroked: false,
 * });
 * ```
 */
export declare const createVmlShape: ({ id, type, style, coordinateSize, adjustment, path, presetShapeType, allowInCell, alt, title, fillColor, filled, stroked, strokeColor, strokeWeight, children, }: IVmlShapeOptions) => XmlComponent;

/**
 * Creates no text wrapping for a floating drawing.
 *
 * WrapNone causes text to flow behind or in front of the drawing
 * without wrapping around it.
 *
 * Reference: http://officeopenxml.com/drwPicFloating-textWrap.php
 */
export declare const createWrapNone: () => XmlComponent;

/**
 * Creates square text wrapping for a floating drawing.
 *
 * WrapSquare causes text to wrap around the rectangular bounding box
 * of the drawing on the specified side(s).
 *
 * Reference: http://officeopenxml.com/drwPicFloating-textWrap.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_WrapSquare">
 *   <xsd:sequence>
 *     <xsd:element name="effectExtent" type="CT_EffectExtent" minOccurs="0"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="wrapText" type="ST_WrapText" use="required"/>
 *   <xsd:attribute name="distT" type="ST_WrapDistance"/>
 *   <xsd:attribute name="distB" type="ST_WrapDistance"/>
 *   <xsd:attribute name="distL" type="ST_WrapDistance"/>
 *   <xsd:attribute name="distR" type="ST_WrapDistance"/>
 * </xsd:complexType>
 * ```
 */
export declare const createWrapSquare: (textWrapping: ITextWrapping, margins?: IMargins) => XmlComponent;

/**
 * Creates through text wrapping for a floating drawing.
 *
 * WrapThrough wraps text around the contours of the drawing like WrapTight, and also
 * fills any open space inside the drawing, such as the middle of a ring.
 *
 * Reference: http://officeopenxml.com/drwPicFloating-textWrap.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_WrapThrough">
 *   <xsd:sequence>
 *     <xsd:element name="wrapPolygon" type="CT_WrapPath"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="wrapText" type="ST_WrapText" use="required"/>
 *   <xsd:attribute name="distL" type="ST_WrapDistance"/>
 *   <xsd:attribute name="distR" type="ST_WrapDistance"/>
 * </xsd:complexType>
 * ```
 *
 * @param margins - The distances from the text on the left and right. The top and bottom aren't written for through wrapping
 * @param textWrapping - Which sides the text wraps on. Defaults to both
 */
export declare const createWrapThrough: (margins?: IMargins, textWrapping?: Pick<ITextWrapping, "side">) => XmlComponent;

/**
 * Creates tight text wrapping for a floating drawing.
 *
 * WrapTight causes text to wrap closely around the contours
 * of the drawing rather than its rectangular bounding box.
 *
 * Reference: http://officeopenxml.com/drwPicFloating-textWrap.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_WrapTight">
 *   <xsd:sequence>
 *     <xsd:element name="wrapPolygon" type="CT_WrapPath"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="wrapText" type="ST_WrapText" use="required"/>
 *   <xsd:attribute name="distL" type="ST_WrapDistance"/>
 *   <xsd:attribute name="distR" type="ST_WrapDistance"/>
 * </xsd:complexType>
 * ```
 *
 * @param margins - The distances from the text on the left and right. The top and bottom aren't written for tight wrapping
 * @param textWrapping - Which sides the text wraps on. Defaults to both
 */
export declare const createWrapTight: (margins?: IMargins, textWrapping?: Pick<ITextWrapping, "side">) => XmlComponent;

/**
 * Creates top-and-bottom text wrapping for a floating drawing.
 *
 * WrapTopAndBottom causes text to appear above and below the drawing
 * without wrapping beside it, creating a line break effect.
 *
 * Reference: http://officeopenxml.com/drwPicFloating-textWrap.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_WrapTopBottom">
 *   <xsd:sequence>
 *     <xsd:element name="effectExtent" type="CT_EffectExtent" minOccurs="0"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="distT" type="ST_WrapDistance"/>
 *   <xsd:attribute name="distB" type="ST_WrapDistance"/>
 * </xsd:complexType>
 * ```
 */
export declare const createWrapTopAndBottom: (margins?: IMargins) => XmlComponent;

/**
 * Represents the collection of custom document properties.
 *
 * Custom properties allow storing arbitrary metadata as name-value pairs.
 * Each property is assigned a unique ID starting from 2 (per Office specification).
 *
 * Reference: ISO-IEC29500-4_2016 shared-documentPropertiesCustom.xsd
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_CustomProperties">
 *   <xsd:sequence>
 *     <xsd:element name="property" type="CT_Property" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const customProps = new CustomProperties([
 *   { name: "Department", value: "Engineering" },
 *   { name: "Project", value: "Alpha" }
 * ]);
 * ```
 */
declare class CustomProperties extends XmlComponent {
    private nextId;
    private readonly properties;
    constructor(properties: readonly ICustomPropertyOptions[]);
    prepForXml(context: IContext): IXmlableObject | undefined;
    addCustomProperty(property: ICustomPropertyOptions): void;
}

/**
 * Converts a JavaScript Date object to an ISO 8601 date-time string.
 *
 * The format is CCYY-MM-DDThh:mm:ss.sssZ where T is a literal and Z indicates UTC.
 * This matches the xsd:dateTime format required by OOXML.
 *
 * Reference: ST_DateTime in OOXML specification
 *
 * @param val - The Date object to convert
 * @returns An ISO 8601 formatted date-time string
 *
 * @example
 * ```typescript
 * const now = new Date();
 * const timestamp = dateTimeValue(now); // Returns "2024-01-15T10:30:00.000Z"
 * ```
 */
export declare const dateTimeValue: (val: Date) => string;

/**
 * Represents the current day in long format (e.g., "01", "15").
 *
 * Inserts a dynamic field showing the day portion of the current date with leading zeros.
 */
export declare class DayLong extends EmptyElement {
    constructor();
}

/**
 * Represents the current day in short format (e.g., "1", "15").
 *
 * Inserts a dynamic field showing the day portion of the current date.
 */
export declare class DayShort extends EmptyElement {
    constructor();
}

/**
 * Validates and converts a number to an integer (decimal number).
 *
 * Reference: ST_DecimalNumber in OOXML specification
 *
 * @param val - The number to validate and convert
 * @returns The floored integer value
 * @throws Error if the value is NaN
 *
 * @example
 * ```typescript
 * const num = decimalNumber(10.7); // Returns 10
 * const negative = decimalNumber(-5.3); // Returns -5
 * ```
 */
export declare const decimalNumber: (val: number) => number;

export declare class DeletedTableCell extends XmlComponent {
    constructor(options: IChangedAttributesProperties);
}

export declare class DeletedTableRow extends XmlComponent {
    constructor(options: IChangedAttributesProperties);
}

/**
 * Represents a deleted text run in a tracked changes document.
 *
 * A deletion marks text that has been removed from the document as part of
 * revision tracking. It wraps a text run with metadata about who made the
 * deletion and when. Deleted text is typically shown with strikethrough
 * formatting in applications that support track changes.
 *
 * Reference: http://officeopenxml.com/WPtrackChanges.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="del" type="CT_RunTrackChange" minOccurs="0"/>
 *
 * <xsd:complexType name="CT_RunTrackChange">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_TrackChange">
 *       <xsd:choice minOccurs="0" maxOccurs="unbounded">
 *         <xsd:group ref="EG_ContentRunContent"/>
 *         <xsd:group ref="m:EG_OMathMathElements"/>
 *       </xsd:choice>
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create a deleted text run
 * new DeletedTextRun({
 *   id: 2,
 *   author: "Jane Smith",
 *   date: "2024-01-15T11:00:00Z",
 *   text: "This text was removed",
 *   italics: true
 * });
 *
 * // Deleted run with page number field
 * new DeletedTextRun({
 *   id: 3,
 *   author: "John Doe",
 *   date: "2024-01-15T12:00:00Z",
 *   children: [PageNumber.CURRENT]
 * });
 * ```
 */
export declare class DeletedTextRun extends XmlComponent {
    protected readonly deletedTextRunWrapper: DeletedTextRunWrapper;
    constructor(options: IDeletedRunOptions);
}

/**
 * Internal wrapper for the run element within a deletion.
 *
 * Wraps the actual run content (text, fields, etc.) within a w:r element
 * that appears inside the w:del element. Handles special cases like page
 * numbers and other field codes using deleted-specific element types.
 *
 * @internal
 */
declare class DeletedTextRunWrapper extends XmlComponent {
    private readonly following;
    constructor(options: IRunOptions);
    get writtenAs(): readonly BaseXmlComponent[] | undefined;
}

/**
 * Options for configuring document properties of a drawing: its name and alternative text, written in `wp:docPr`.
 */
export declare type DocPropertiesOptions = {
    /** Name of the drawing element (used for identification) */
    readonly name: string;
    /** Description/alt text for accessibility */
    readonly description?: string;
    /** Title of the drawing element */
    readonly title?: string;
    readonly id?: string;
};

/**
 * Returns the next drawing ID from a single counter shared by every drawing.
 *
 * Drawing IDs (`wp:docPr` and `wps:cNvPr`) must be unique within a document,
 * and Word reports unreadable content when two drawings share one. A drawing
 * is created before it belongs to a document, so all drawings draw from this
 * one counter rather than a generator per instance.
 *
 * @returns A number no earlier call has returned
 *
 * @example
 * ```typescript
 * const first = docPropertiesUniqueNumericId();
 * const second = docPropertiesUniqueNumericId(); // first + 1
 * ```
 */
export declare const docPropertiesUniqueNumericId: UniqueNumericIdCreator;

/**
 * Creates a unique numeric ID generator for document properties.
 *
 * @returns A function that generates sequential IDs starting from 1
 *
 * @example
 * ```typescript
 * const idGen = docPropertiesUniqueNumericIdGen();
 * const id = idGen(); // Returns 1
 * ```
 */
export declare const docPropertiesUniqueNumericIdGen: () => UniqueNumericIdCreator;

/**
 * Represents the main document element in a WordprocessingML document.
 *
 * The document element is the root element of the main document part. It contains
 * the body element which holds all the content of the document.
 *
 * Reference: http://officeopenxml.com/WPdocument.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="document" type="CT_Document"/>
 *
 * <xsd:complexType name="CT_Document">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_DocumentBase">
 *       <xsd:sequence>
 *         <xsd:element name="body" type="CT_Body" minOccurs="0" maxOccurs="1"/>
 *       </xsd:sequence>
 *       <xsd:attribute name="conformance" type="s:ST_ConformanceClass"/>
 *       <xsd:attribute ref="mc:Ignorable" use="optional" />
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 *
 * <xsd:complexType name="CT_DocumentBase">
 *   <xsd:sequence>
 *     <xsd:element name="background" type="CT_Background" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create a document with default options
 * const doc = new Document({});
 *
 * // Create a document with background
 * const doc = new Document({
 *   background: {
 *     color: "FF0000",
 *   },
 * });
 *
 * // Add content to the document
 * doc.add(new Paragraph("Hello World"));
 * doc.add(new Table({ rows: [...] }));
 * ```
 */
declare class Document_2 extends XmlComponent {
    private readonly body;
    constructor(options: IDocumentOptions);
    /**
     * Adds a block-level element to the document body.
     *
     * @param item - The element to add (paragraph, table, table of contents, hyperlink, or any other file child)
     * @returns The Document instance for method chaining
     */
    add(item: Paragraph | Table | TableOfContents | ConcreteHyperlink | FileChild): Document_2;
    /**
     * Gets the document body element.
     *
     * @returns The Body instance containing all document content
     */
    get Body(): Body_2;
}

/**
 * Type representing valid namespace keys.
 */
export declare type DocumentAttributeNamespace = keyof typeof DocumentAttributeNamespaces;

/**
 * XML namespace URIs used in WordprocessingML documents.
 *
 * These namespaces define the various XML schemas that can be referenced
 * in a document, including WordprocessingML, DrawingML, VML, and others.
 */
export declare const DocumentAttributeNamespaces: {
    wpc: string;
    mc: string;
    o: string;
    r: string;
    m: string;
    v: string;
    wp14: string;
    wp: string;
    w10: string;
    w: string;
    w14: string;
    w15: string;
    wpg: string;
    wpi: string;
    wne: string;
    wps: string;
    cp: string;
    dc: string;
    dcterms: string;
    dcmitype: string;
    xsi: string;
    cx: string;
    cx1: string;
    cx2: string;
    cx3: string;
    cx4: string;
    cx5: string;
    cx6: string;
    cx7: string;
    cx8: string;
    aink: string;
    am3d: string;
    w16cex: string;
    w16cid: string;
    w16: string;
    w16sdtdh: string;
    w16se: string;
};

/**
 * Represents XML namespace attributes for a WordprocessingML document.
 *
 * This class generates the xmlns declarations required at the root element
 * of document.xml and other document parts.
 *
 * @example
 * ```typescript
 * new DocumentAttributes(['w', 'r', 'wp'], 'w14 w15');
 * // Generates: xmlns:w="..." xmlns:r="..." xmlns:wp="..." mc:Ignorable="w14 w15"
 * ```
 *
 * @internal
 */
export declare class DocumentAttributes extends XmlAttributeComponent<IDocumentAttributesProperties> {
    protected readonly xmlKeys: AttributeMap<IDocumentAttributesProperties>;
    constructor(ns: readonly DocumentAttributeNamespace[], Ignorable?: string);
}

/**
 * Represents a document background in a WordprocessingML document.
 *
 * The background element specifies the background color or theme color
 * for the document.
 *
 * Reference: http://officeopenxml.com/WPdocument.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Background">
 *   <xsd:sequence>
 *     <xsd:sequence maxOccurs="unbounded">
 *       <xsd:any processContents="lax" namespace="urn:schemas-microsoft-com:vml" minOccurs="0" maxOccurs="unbounded"/>
 *       <xsd:any processContents="lax" namespace="urn:schemas-microsoft-com:office:office" minOccurs="0" maxOccurs="unbounded"/>
 *     </xsd:sequence>
 *     <xsd:element name="drawing" type="CT_Drawing" minOccurs="0"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="color" type="ST_HexColor" use="optional" default="auto"/>
 *   <xsd:attribute name="themeColor" type="ST_ThemeColor" use="optional"/>
 *   <xsd:attribute name="themeTint" type="ST_UcharHexNumber" use="optional"/>
 *   <xsd:attribute name="themeShade" type="ST_UcharHexNumber" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new DocumentBackground({ color: "FFFF00" }); // Yellow background
 * new DocumentBackground({ color: { theme: "accent1", lighter: 80 } }); // A light version of the theme's first accent color
 * ```
 */
export declare class DocumentBackground extends XmlComponent {
    /**
     * @throws If a color isn't valid, or `color` is a theme color and `themeColor`, `themeShade` or `themeTint` is given
     */
    constructor({ color, themeColor, themeShade, themeTint }: IDocumentBackgroundOptions);
}

/**
 * Attributes for the document background element.
 *
 * ## XSD Schema (ST_ThemeColor)
 * ```xml
 * <xsd:simpleType name="ST_ThemeColor">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="dark1"/>
 *     <xsd:enumeration value="light1"/>
 *     <xsd:enumeration value="dark2"/>
 *     <xsd:enumeration value="light2"/>
 *     <xsd:enumeration value="accent1"/>
 *     <xsd:enumeration value="accent2"/>
 *     <xsd:enumeration value="accent3"/>
 *     <xsd:enumeration value="accent4"/>
 *     <xsd:enumeration value="accent5"/>
 *     <xsd:enumeration value="accent6"/>
 *     <xsd:enumeration value="hyperlink"/>
 *     <xsd:enumeration value="followedHyperlink"/>
 *     <xsd:enumeration value="none"/>
 *     <xsd:enumeration value="background1"/>
 *     <xsd:enumeration value="text1"/>
 *     <xsd:enumeration value="background2"/>
 *     <xsd:enumeration value="text2"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @internal
 */
export declare class DocumentBackgroundAttributes extends XmlAttributeComponent<{
    readonly color?: string;
    readonly themeColor?: string;
    readonly themeShade?: string;
    readonly themeTint?: string;
}> {
    protected readonly xmlKeys: {
        color: string;
        themeColor: string;
        themeShade: string;
        themeTint: string;
    };
}

/**
 * Represents document-wide default formatting in a WordprocessingML document.
 *
 * Document defaults define the base formatting properties that apply to all
 * paragraphs and runs in a document unless overridden by a style or direct formatting.
 *
 * Reference: http://officeopenxml.com/WPstyles.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_DocDefaults">
 *   <xsd:sequence>
 *     <xsd:element name="rPrDefault" type="CT_RPrDefault" minOccurs="0"/>
 *     <xsd:element name="pPrDefault" type="CT_PPrDefault" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Set default font and spacing for the document
 * new DocumentDefaults({
 *   run: {
 *     font: "Calibri",
 *     size: 22
 *   },
 *   paragraph: {
 *     spacing: { after: 200, line: 276 }
 *   }
 * });
 * ```
 */
export declare class DocumentDefaults extends XmlComponent {
    private readonly runPropertiesDefaults;
    private readonly paragraphPropertiesDefaults;
    constructor(options: IDocumentDefaultsOptions);
}

/**
 * Specifies the type of the current document grid, which defines the grid behavior.
 *
 * The grid can define a grid which snaps all East Asian characters to grid positions, but leaves Latin text with its default spacing; a grid which adds the specified character pitch to all characters on each row; or a grid which affects only the line pitch for the current section.
 *
 * Reference: https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_ST_DocGrid_topic_ID0ELYP2.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_DocGrid">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="default"/>
 *     <xsd:enumeration value="lines"/>
 *     <xsd:enumeration value="linesAndChars"/>
 *     <xsd:enumeration value="snapToChars"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 */
export declare const DocumentGridType: {
    /**
     * Specifies that no document grid shall be applied to the contents of the current section in the document.
     */
    readonly DEFAULT: "default";
    /**
     * Specifies that the parent section shall have additional line pitch added to each line within it (as specified on the <docGrid> element (§2.6.5)) in order to maintain the specified number of lines per page.
     */
    readonly LINES: "lines";
    /**
     * Specifies that the parent section shall have both the additional line pitch and character pitch added to each line and character within it (as specified on the <docGrid> element (§2.6.5)) in order to maintain a specific number of lines per page and characters per line.
     *
     * When this value is set, the input specified via the user interface may be allowed in exact number of line/character pitch units. */
    readonly LINES_AND_CHARS: "linesAndChars";
    /**
     * Specifies that the parent section shall have both the additional line pitch and character pitch added to each line and character within it (as specified on the <docGrid> element (§2.6.5)) in order to maintain a specific number of lines per page and characters per line.
     *
     * When this value is set, the input specified via the user interface may be restricted to the number of lines per page and characters per line, with the consumer or producer translating this information based on the current font data to get the resulting line and character pitch values
     */
    readonly SNAP_TO_CHARS: "snapToChars";
};

/**
 * Wrapper for the main document body.
 *
 * DocumentWrapper combines the main Document view with its Relationships,
 * managing the primary content of the .docx file along with references to
 * images, hyperlinks, and other linked resources.
 *
 * @example
 * ```typescript
 * const wrapper = new DocumentWrapper({
 *   sections: [{
 *     children: [new Paragraph("Hello World")],
 *   }],
 * });
 * ```
 */
declare class DocumentWrapper implements IViewWrapper {
    private readonly document;
    private readonly relationships;
    constructor(options: IDocumentOptions);
    get View(): Document_2;
    get Relationships(): Relationships;
}

/**
 * Represents a drawing element in a WordprocessingML document.
 *
 * Drawings can be either inline (positioned as part of the text flow) or
 * anchored (positioned relative to the page, column, or paragraph).
 *
 * Reference: http://officeopenxml.com/drwOverview.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Drawing">
 *   <xsd:choice minOccurs="1" maxOccurs="unbounded">
 *     <xsd:element ref="wp:anchor" minOccurs="0"/>
 *     <xsd:element ref="wp:inline" minOccurs="0"/>
 *   </xsd:choice>
 * </xsd:complexType>
 * ```
 */
export declare class Drawing extends XmlComponent {
    constructor(imageData: IExtendedMediaData, drawingOptions?: IDrawingOptions);
}

/**
 * A link and accessibility settings shared by drawings and the shapes in them.
 */
export declare type DrawingLinkOptions = {
    /** A web address followed when the drawing is clicked (with Ctrl in Word) */
    readonly link?: string;
    /** Marks the drawing as decorative, so screen readers skip it */
    readonly decorative?: boolean;
};

/**
 * A patch for a drawing in a template whose alt text holds the placeholder, such as `{{sales}}`, rather than for the
 * placeholder in text. It changes the drawing, and the parts it refers to, in place. `ChartDataPatch` from `docx/charts`
 * is one: it replaces the data of a chart made in Word.
 *
 * A drawing's alt text is its description (`descr`) or title. A drawing patch leaves the placeholder in text as it is.
 *
 * @publicApi
 */
export declare abstract class DrawingPatch {
    readonly type: "drawing";
    /**
     * Changes a drawing whose alt text holds the placeholder, and the parts it refers to. `patchDocument` calls it for
     * each such drawing before it patches text, so it only sees the template's own drawings.
     *
     * @throws If the drawing can't be patched, which stops the document being patched
     */
    abstract patch(drawing: TemplateDrawing, template: TemplatePackage): void;
}

/**
 * Drop cap types for paragraph frames.
 *
 * Drop caps are decorative large initial letters that span multiple lines at the
 * beginning of a paragraph. This enum defines how the drop cap should be positioned.
 */
export declare const DropCapType: {
    /** No drop cap effect */
    readonly NONE: "none";
    /** Drop cap that drops down into the paragraph text */
    readonly DROP: "drop";
    /** Drop cap that extends into the margin */
    readonly MARGIN: "margin";
};

/**
 * Attributes for effect extent.
 */
export declare type EffectExtentAttributes = {
    /**
     * ## Additional Extent on Top Edge
     *
     * Specifies the additional length, in EMUs, which shall be added to the top edge of the DrawingML object to determine its actual top edge including effects.
     */
    readonly top: number;
    /**
     * ## Additional Extent on Right Edge
     *
     * Specifies the additional length, in EMUs, which shall be added to the right edge of the DrawingML object to determine its actual right edge including effects.
     */
    readonly right: number;
    /**
     * ## Additional Extent on Bottom Edge
     *
     * Specifies the additional length, in EMUs, which shall be added to the bottom edge of the DrawingML object to determine its actual bottom edge including effects.
     */
    readonly bottom: number;
    /**
     * ## Additional Extent on Left Edge
     *
     * Specifies the additional length, in EMUs, which shall be added to the left edge of the DrawingML object to determine its actual left edge including effects.
     */
    readonly left: number;
};

/**
 * Validates an eighth-point measurement value.
 *
 * Eighth-points are used for fine-grained measurements in text formatting.
 *
 * Reference: ST_EighthPointMeasure in OOXML specification
 *
 * @param val - The measurement value in eighth-points
 * @returns The validated positive integer value
 *
 * @example
 * ```typescript
 * const measure = eighthPointMeasureValue(16); // 2 points
 * ```
 */
export declare const eighthPointMeasureValue: (val: number) => number;

/**
 * A file of a package that is embedded in the document, such as a sheet of an embedded workbook.
 */
export declare type EmbeddedPackageFile = {
    /** The file's path in the embedded package, such as "xl/workbook.xml" */
    readonly path: string;
    /** The file's XML, formatted as the document's parts are, or its bytes */
    readonly content: XmlComponent | Uint8Array;
};

/**
 * Emphasis mark types.
 *
 * Defines the types of emphasis marks that can be applied to text.
 * Emphasis marks are commonly used in East Asian typography.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_Em">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="none"/>
 *     <xsd:enumeration value="dot"/>
 *     <xsd:enumeration value="comma"/>
 *     <xsd:enumeration value="circle"/>
 *     <xsd:enumeration value="underDot"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export declare const EmphasisMarkType: {
    /** Dot emphasis mark */
    readonly DOT: "dot";
};

/**
 * Empty object singleton used for empty XML elements.
 *
 * This sealed object is used to generate self-closing XML tags when an element
 * has no children or attributes.
 *
 * @internal
 */
export declare const EMPTY_OBJECT: {};

/**
 * XML element representing an empty element (CT_Empty).
 *
 * EmptyElement creates self-closing XML tags with no attributes or content.
 *
 * OOXML Reference:
 * ```xml
 * <xsd:complexType name="CT_Empty"/>
 * ```
 *
 * @example
 * ```typescript
 * new EmptyElement("w:noProof");
 * // Generates: <w:noProof/>
 * ```
 */
export declare class EmptyElement extends XmlComponent {
}

/**
 * Encode a string to UTF-8 bytes.
 *
 * This is used to pre-encode XML content before passing to JSZip,
 * which avoids a bug where JSZip's string chunking can split UTF-16
 * surrogate pairs for characters above U+FFFF (like emoji).
 *
 * The copy via `new Uint8Array()` ensures the returned array uses the
 * current module's Uint8Array constructor, avoiding cross-realm issues
 * in test environments (jsdom) where TextEncoder returns a different
 * realm's Uint8Array that fails JSZip's instanceof checks.
 *
 * @see https://github.com/Stuk/jszip/pull/963
 */
export declare const encodeUtf8: (str: string) => Uint8Array;

export declare class EndnoteIdReference extends XmlComponent {
    constructor(id: number);
}

/**
 * Represents a reference to an endnote.
 *
 * Used within endnote content to refer back to the endnote marker.
 */
export declare class EndnoteReference extends EmptyElement {
    constructor();
}

export declare class EndnoteReferenceRun extends Run {
    constructor(id: number);
}

export declare class EndnoteReferenceRunAttributes extends XmlAttributeComponent<{
    readonly id: number;
}> {
    protected readonly xmlKeys: {
        id: string;
    };
}

export declare class Endnotes extends XmlComponent {
    constructor();
    createEndnote(id: number, paragraph: readonly Paragraph[]): void;
}

declare class EndnotesWrapper implements IViewWrapper {
    private readonly endnotes;
    private readonly relationships;
    constructor();
    get View(): Endnotes;
    get Relationships(): Relationships;
}

/**
 * Represents an external hyperlink to a URL outside the document.
 *
 * External hyperlinks create a relationship to an external resource (URL).
 * The relationship is created during document preparation and the hyperlink
 * is converted to a ConcreteHyperlink with the relationship ID.
 *
 * Reference: http://officeopenxml.com/WPhyperlink.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="hyperlink" type="CT_Hyperlink"/>
 *
 * <xsd:complexType name="CT_Hyperlink">
 *   <xsd:group ref="EG_PContent" minOccurs="0" maxOccurs="unbounded"/>
 *   <xsd:attribute ref="r:id"/>
 *   <xsd:attribute name="history" type="s:ST_OnOff" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new ExternalHyperlink({
 *   children: [new TextRun({ text: "Visit Example", style: "Hyperlink" })],
 *   link: "https://example.com",
 * });
 * ```
 */
export declare class ExternalHyperlink extends XmlComponent {
    readonly options: IExternalHyperlinkOptions;
    constructor(options: IExternalHyperlinkOptions);
}

/**
 * Represents a field instruction for a Table of Contents.
 *
 * The FieldInstruction class generates the TOC field code string that Word uses
 * to determine how to build the table of contents, including which headings to include,
 * formatting options, and other TOC-specific settings.
 *
 * Reference: http://officeopenxml.com/WPfieldInstructions.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="instrText" type="CT_Text"/>
 * ```
 *
 * @example
 * ```typescript
 * // Basic TOC field instruction
 * new FieldInstruction({ headingStyleRange: "1-3" });
 *
 * // TOC with hyperlinks and custom styles
 * new FieldInstruction({
 *   hyperlink: true,
 *   headingStyleRange: "1-3",
 *   stylesWithLevels: [new StyleLevel("CustomStyle", 2)],
 * });
 * ```
 */
declare class FieldInstruction extends XmlComponent {
    private readonly properties;
    constructor(properties?: ITableOfContentsOptions);
}

/**
 * Represents a Word document file.
 *
 * The File class (exported as `Document`) is the main entry point for creating DOCX documents.
 * It manages all document components including content, styles, numbering, headers/footers,
 * and media. Documents are organized into sections, each of which can have its own page
 * settings, headers, and footers.
 *
 * This class handles the assembly of all OOXML parts required for a valid .docx file,
 * including relationships, content types, and document properties.
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * // Simple document with one section
 * const doc = new Document({
 *   sections: [{
 *     children: [
 *       new Paragraph("Hello World"),
 *     ],
 *   }],
 * });
 *
 * // Document with multiple sections and headers/footers
 * const doc = new Document({
 *   creator: "John Doe",
 *   sections: [
 *     {
 *       headers: {
 *         default: new Header({
 *           children: [new Paragraph("Header Text")],
 *         }),
 *       },
 *       children: [
 *         new Paragraph("Section 1 content"),
 *       ],
 *     },
 *     {
 *       children: [
 *         new Paragraph("Section 2 content"),
 *       ],
 *     },
 *   ],
 * });
 *
 * // Document with custom styles and numbering
 * const doc = new Document({
 *   styles: {
 *     paragraphStyles: [
 *       {
 *         id: "MyHeading",
 *         name: "My Heading",
 *         basedOn: "Heading1",
 *         run: { bold: true, color: "FF0000" },
 *       },
 *     ],
 *   },
 *   numbering: {
 *     config: [
 *       {
 *         reference: "my-numbering",
 *         levels: [
 *           { level: 0, format: "decimal", text: "%1.", alignment: "left" },
 *         ],
 *       },
 *     ],
 *   },
 *   sections: [{
 *     children: [new Paragraph("Content")],
 *   }],
 * });
 * ```
 */
declare class File_2 {
    private currentRelationshipId;
    private readonly documentWrapper;
    private readonly headers;
    private readonly footers;
    private readonly coreProperties;
    private readonly numbering;
    private readonly media;
    private readonly fileRelationships;
    private readonly footnotesWrapper;
    private readonly endnotesWrapper;
    private readonly settings;
    private readonly contentTypes;
    private readonly customProperties;
    private readonly appProperties;
    private readonly styles;
    private readonly comments;
    /** Extended comment data for reply threading and resolved state (word/commentsExtended.xml). */
    private readonly commentsExtended?;
    /** Durable comment id mapping (word/commentsIds.xml). */
    private readonly commentsIds?;
    private readonly fontWrapper;
    private readonly theme;
    private readonly packageParts;
    constructor(options: IPropertiesOptions);
    private addSection;
    private createHeader;
    private createFooter;
    private addHeaderToDocument;
    private addFooterToDocument;
    private addDefaultRelationships;
    get Document(): DocumentWrapper;
    get Styles(): Styles;
    get CoreProperties(): CoreProperties;
    get Numbering(): Numbering;
    get Media(): Media;
    get FileRelationships(): Relationships;
    get Headers(): readonly HeaderWrapper[];
    get Footers(): readonly FooterWrapper[];
    get ContentTypes(): ContentTypes;
    get CustomProperties(): CustomProperties;
    get AppProperties(): AppProperties;
    get FootNotes(): FootnotesWrapper;
    get Endnotes(): EndnotesWrapper;
    get Settings(): Settings;
    get Comments(): Comments;
    /** Extended comments part for reply threading. Undefined when no comment threads exist. */
    get CommentsExtended(): CommentsExtended | undefined;
    /** Durable comment id part. Undefined when no comment carries a durableId. */
    get CommentsIds(): CommentsIds | undefined;
    get FontTable(): FontWrapper;
    /** The document's theme (word/theme/theme1.xml). */
    get Theme(): Theme;
    /** The parts that drawings, such as charts, add to the package when it is written. */
    get PackageParts(): PackageParts;
}
export { File_2 as Document }
export { File_2 as File }

/**
 * Base class for document body children.
 *
 * FileChild represents a block-level element that can be added directly
 * to the document body. Examples include Paragraph and Table.
 */
export declare class FileChild extends XmlComponent {
    /** Marker property identifying this as a FileChild */
    readonly fileChild: symbol;
}

/**
 * Patch definition for document-level replacement.
 *
 * Replaces placeholder text with block-level content (entire paragraphs, tables, etc.).
 */
declare type FilePatch = {
    /** Indicates this is a document-level patch */
    readonly type: typeof PatchType.DOCUMENT;
    /** Content to insert (paragraphs, tables, etc.) */
    readonly children: readonly FileChild[];
};

/**
 * Options for embedding a font in the document.
 */
declare type FontOptions = {
    /** Font family name */
    readonly name: string;
    /** Font file data (TTF, OTF, etc.) */
    readonly data: Buffer;
    /** Character set/encoding for the font */
    readonly characterSet?: (typeof CharacterSet)[keyof typeof CharacterSet];
};

/**
 * Font options extended with a unique font key.
 */
declare type FontOptionsWithKey = FontOptions & {
    readonly fontKey: string;
};

/**
 * Wrapper class for managing the font table and its relationships.
 *
 * Creates a font table with embedded font files and manages the relationships
 * required for font embedding. Each font is assigned a unique key for obfuscation.
 *
 * @example
 * ```typescript
 * const fontWrapper = new FontWrapper([
 *   { name: "CustomFont", data: fontBuffer }
 * ]);
 * ```
 */
declare class FontWrapper implements IViewWrapper {
    readonly options: readonly FontOptions[];
    private readonly fontTable;
    private readonly relationships;
    readonly fontOptionsWithKey: readonly FontOptionsWithKey[];
    constructor(options: readonly FontOptions[]);
    get View(): XmlComponent;
    get Relationships(): Relationships;
}

/**
 * Represents a document footer.
 *
 * Footers appear at the bottom of each page in a section and can contain
 * paragraphs, tables, images, and other content.
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * const footer = new Footer({
 *   children: [
 *     new Paragraph({ children: [new TextRun("Page "), PageNumber.CURRENT] }),
 *   ],
 * });
 * ```
 */
export declare class Footer {
    readonly options: IHeaderOptions;
    constructor(options?: IHeaderOptions);
}

/**
 * Represents a footer in a WordprocessingML document.
 *
 * A footer is the portion of the document that appears at the bottom of each page in a section.
 * Footers can contain block-level elements such as paragraphs and tables. Each section can
 * have up to three different footers: first page, even pages, and odd pages.
 *
 * Reference: http://officeopenxml.com/WPfooters.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_HdrFtr">
 *   <xsd:group ref="EG_BlockLevelElts" minOccurs="1" maxOccurs="unbounded"/>
 * </xsd:complexType>
 *
 * <xsd:element name="ftr" type="CT_HdrFtr"/>
 * ```
 *
 * @example
 * ```typescript
 * // Create a simple footer with page numbers
 * const footer = new Footer(1);
 * footer.add(new Paragraph({
 *   alignment: AlignmentType.CENTER,
 *   children: [new TextRun("Page "), PageNumber.CURRENT]
 * }));
 *
 * // Create a footer with a table
 * const footer = new Footer(2);
 * footer.add(new Table({
 *   rows: [
 *     new TableRow({
 *       children: [new TableCell({ children: [new Paragraph("Footer Content")] })]
 *     })
 *   ]
 * }));
 * ```
 */
declare class Footer_2 extends InitializableXmlComponent {
    private readonly refId;
    constructor(referenceNumber: number, initContent?: XmlComponent);
    get ReferenceId(): number;
    add(item: Paragraph | Table): void;
}

/**
 * Wrapper for document footers.
 *
 * FooterWrapper combines a Footer view with its Relationships and Media,
 * enabling footers to contain paragraphs, tables, images, and hyperlinks.
 * Each section can have multiple footers for different page types.
 *
 * Reference: http://officeopenxml.com/WPfooter.php
 *
 * @example
 * ```typescript
 * const footerWrapper = new FooterWrapper(media, 1);
 * footerWrapper.add(new Paragraph("Page Footer"));
 * footerWrapper.add(new Table({
 *   rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph("Cell")] })] })],
 * }));
 * ```
 */
export declare class FooterWrapper implements IViewWrapper {
    private readonly media;
    private readonly footer;
    private readonly relationships;
    constructor(media: Media, referenceId: number, initContent?: XmlComponent);
    add(item: Paragraph | Table): void;
    addChildElement(childElement: XmlComponent): void;
    get View(): Footer_2;
    get Relationships(): Relationships;
    get Media(): Media;
}

/**
 * Represents a footnote reference element in WordprocessingML.
 *
 * FootnoteReference creates the link between the main document text
 * and the footnote content by using a unique identifier.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_FtnEdnRef">
 *   <xsd:attribute name="customMarkFollows" type="s:ST_OnOff" use="optional"/>
 *   <xsd:attribute name="id" use="required" type="ST_DecimalNumber"/>
 * </xsd:complexType>
 * ```
 *
 * @internal
 */
export declare class FootnoteReference extends XmlComponent {
    constructor(id: number);
}

/**
 * Represents a reference to a footnote.
 *
 * Used within footnote content to refer back to the footnote marker.
 */
export declare class FootnoteReferenceElement extends EmptyElement {
    constructor();
}

/**
 * Represents a footnote reference run in a WordprocessingML document.
 *
 * FootnoteReferenceRun creates a run containing a footnote reference marker
 * (typically a superscript number) that appears in the main document text.
 * Clicking this marker navigates to the corresponding footnote content.
 *
 * Reference: http://officeopenxml.com/WPfootnotes.php
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * // Add a footnote reference in a paragraph
 * new Paragraph({
 *   children: [
 *     new TextRun("This text has a footnote"),
 *     new FootnoteReferenceRun(1),
 *   ],
 * });
 * ```
 */
export declare class FootnoteReferenceRun extends Run {
    /**
     * Creates a new footnote reference run.
     *
     * @param id - Unique identifier linking to the footnote content
     */
    constructor(id: number);
}

/**
 * Represents the attributes for a footnote reference element.
 *
 * @internal
 */
export declare class FootNoteReferenceRunAttributes extends XmlAttributeComponent<{
    /** Unique identifier linking to the footnote */
    readonly id: number;
}> {
    protected readonly xmlKeys: {
        id: string;
    };
}

/**
 * Represents the footnotes collection in a WordprocessingML document.
 *
 * FootNotes manages all footnotes in a document and automatically creates
 * the required separator and continuation separator footnotes. These special
 * footnotes define the line that separates body text from footnotes and the
 * line used when footnotes continue across pages.
 *
 * Reference: http://officeopenxml.com/WPfootnotes.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Footnotes">
 *   <xsd:sequence maxOccurs="unbounded">
 *     <xsd:element name="footnote" type="CT_FtnEdn" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // FootNotes is typically managed internally by the Document class
 * // Users create footnotes through the Document API
 * const doc = new Document({
 *   sections: [{
 *     children: [
 *       new Paragraph({
 *         children: [
 *           new TextRun("Text with footnote"),
 *           new FootnoteReferenceRun(1),
 *         ],
 *       }),
 *     ],
 *     footnotes: {
 *       1: {
 *         children: [new Paragraph("Footnote content")],
 *       },
 *     },
 *   }],
 * });
 * ```
 */
export declare class FootNotes extends XmlComponent {
    constructor();
    /**
     * Creates and adds a new footnote to the collection.
     *
     * @param id - Unique numeric identifier for the footnote
     * @param paragraph - Array of paragraphs that make up the footnote content
     */
    createFootNote(id: number, paragraph: readonly Paragraph[]): void;
}

/**
 * Wrapper class for managing footnotes in a document.
 *
 * Encapsulates the footnotes collection and its relationships,
 * implementing the IViewWrapper interface for consistent access.
 *
 * @example
 * ```typescript
 * const wrapper = new FootnotesWrapper();
 * const footnotes = wrapper.View;
 * const relationships = wrapper.Relationships;
 * ```
 */
declare class FootnotesWrapper implements IViewWrapper {
    private readonly footnotess;
    private readonly relationships;
    constructor();
    get View(): FootNotes;
    get Relationships(): Relationships;
}

/**
 * Frame anchor types specifying what the frame should be anchored relative to.
 *
 * Determines the reference point for frame positioning (horizontal and vertical).
 */
export declare const FrameAnchorType: {
    /** Anchor relative to the page margin */
    readonly MARGIN: "margin";
    /** Anchor relative to the page edge */
    readonly PAGE: "page";
    /** Anchor relative to the text column */
    readonly TEXT: "text";
};

/**
 * Text wrapping types for frames.
 *
 * Controls how surrounding text wraps around the frame.
 */
export declare const FrameWrap: {
    /** Wrap text around the frame on all sides */
    readonly AROUND: "around";
    /** Automatic wrapping based on available space */
    readonly AUTO: "auto";
    /** No text wrapping */
    readonly NONE: "none";
    /** Do not allow text beside the frame */
    readonly NOT_BESIDE: "notBeside";
    /** Allow text to flow through the frame */
    readonly THROUGH: "through";
    /** Wrap text tightly around the frame */
    readonly TIGHT: "tight";
};

/**
 * Any DrawingML graphic, such as a shape, group or drawing canvas, written into a {@link Drawing} as it is given.
 *
 * The drawing writes the parts every drawing has: its size and position (`wp:inline` or `wp:anchor`), its id and
 * alternative text (`wp:docPr`) and `a:graphic`. `content` is written inside `a:graphicData`, and `uri` says what kind of
 * graphic it is. This is how `docx/shapes` writes its shapes.
 *
 * @example
 * ```typescript
 * new Drawing({
 *   type: "graphic",
 *   uri: "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
 *   transformation: createTransformation({ width: 100, height: 50 }),
 *   content: new BuilderElement({ name: "wps:wsp", children: [...] }),
 * });
 * ```
 */
export declare type GraphicMediaData = {
    readonly type: "graphic";
    /** What kind of graphic `content` is: the `uri` attribute of `a:graphicData` */
    readonly uri: string;
    readonly transformation: IMediaDataTransformation;
    /** The graphic, written inside `a:graphicData` */
    readonly content: XmlComponent;
    /**
     * Whether Word keeps the graphic's aspect ratio when it is resized (`noChangeAspect`). Default is true. Charts are
     * written with false, as Word writes them
     */
    readonly lockAspectRatio?: boolean;
};

/**
 * Represents a grid span (gridSpan) element in a WordprocessingML document.
 *
 * The gridSpan element specifies the number of logical columns this cell spans
 * in the table grid. This is used to merge cells horizontally (column span).
 *
 * Reference: http://officeopenxml.com/WPtableCell.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_DecimalNumber">
 *   <xsd:attribute name="val" type="ST_DecimalNumber" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Cell spanning 3 columns
 * new GridSpan(3);
 * ```
 */
export declare class GridSpan extends XmlComponent {
    constructor(value: number);
}

/**
 * Generates a SHA-1 hash of the provided data.
 *
 * Useful for generating deterministic IDs based on content, such as for
 * image references or revision tracking.
 *
 * @param data - The data to hash (Buffer, string, Uint8Array, or ArrayBuffer)
 * @returns A hexadecimal string representation of the SHA-1 hash
 *
 * @example
 * ```typescript
 * const hash = hashedId("Hello World"); // Returns "0a4d55a8d778e5022fab701977c5d840bbc486d0"
 * ```
 */
export declare const hashedId: (data: Buffer | string | Uint8Array | ArrayBuffer) => string;

/**
 * Represents a document header.
 *
 * Headers appear at the top of each page in a section and can contain
 * paragraphs, tables, images, and other content.
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * const header = new Header({
 *   children: [
 *     new Paragraph({ children: [new TextRun("Company Name")] }),
 *   ],
 * });
 * ```
 */
export declare class Header {
    readonly options: IHeaderOptions;
    constructor(options?: IHeaderOptions);
}

/**
 * Represents a header in a WordprocessingML document.
 *
 * A header is the portion of the document that appears at the top of each page in a section.
 * Headers can contain block-level elements such as paragraphs and tables. Each section can
 * have up to three different headers: first page, even pages, and odd pages.
 *
 * Reference: http://officeopenxml.com/WPheaders.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_HdrFtr">
 *   <xsd:group ref="EG_BlockLevelElts" minOccurs="1" maxOccurs="unbounded"/>
 * </xsd:complexType>
 *
 * <xsd:element name="hdr" type="CT_HdrFtr"/>
 * ```
 *
 * @example
 * ```typescript
 * // Create a simple header
 * const header = new Header(1);
 * header.add(new Paragraph("Company Name"));
 *
 * // Create a header with a table
 * const header = new Header(2);
 * header.add(new Table({
 *   rows: [
 *     new TableRow({
 *       children: [new TableCell({ children: [new Paragraph("Header Content")] })]
 *     })
 *   ]
 * }));
 * ```
 */
declare class Header_2 extends InitializableXmlComponent {
    private readonly refId;
    constructor(referenceNumber: number, initContent?: XmlComponent);
    get ReferenceId(): number;
    add(item: Paragraph | Table): void;
}

/**
 * This simple type specifies the possible types of headers and footers which may be specified for a given header or footer reference in a document. This value determines the page(s) on which the current header or footer shall be displayed.
 *
 * Reference: https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_ST_HdrFtr_topic_ID0E2UW2.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_HdrFtr">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="even"/>
 *     <xsd:enumeration value="default"/>
 *     <xsd:enumeration value="first"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 */
export declare const HeaderFooterReferenceType: {
    /** Specifies that this header or footer shall appear on every page in this section which is not overridden with a specific `even` or `first` page header/footer. In a section with all three types specified, this type shall be used on all odd numbered pages (counting from the `first` page in the section, not the section numbering). */
    readonly DEFAULT: "default";
    /** Specifies that this header or footer shall appear on the first page in this section. The appearance of this header or footer is contingent on the setting of the `titlePg` element (§2.10.6). */
    readonly FIRST: "first";
    /** Specifies that this header or footer shall appear on all even numbered pages in this section (counting from the first page in the section, not the section numbering). The appearance of this header or footer is contingent on the setting of the `evenAndOddHeaders` element (§2.10.1). */
    readonly EVEN: "even";
};

export declare const HeaderFooterType: {
    readonly HEADER: "w:headerReference";
    readonly FOOTER: "w:footerReference";
};

/**
 * Wrapper for document headers.
 *
 * HeaderWrapper combines a Header view with its Relationships and Media,
 * enabling headers to contain paragraphs, tables, images, and hyperlinks.
 * Each section can have multiple headers for different page types.
 *
 * Reference: http://officeopenxml.com/WPheader.php
 *
 * @example
 * ```typescript
 * const headerWrapper = new HeaderWrapper(media, 1);
 * headerWrapper.add(new Paragraph("Page Header"));
 * headerWrapper.add(new Table({
 *   rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph("Cell")] })] })],
 * }));
 * ```
 */
export declare class HeaderWrapper implements IViewWrapper {
    private readonly media;
    private readonly header;
    private readonly relationships;
    constructor(media: Media, referenceId: number, initContent?: XmlComponent);
    add(item: Paragraph | Table): HeaderWrapper;
    addChildElement(childElement: XmlComponent | string): void;
    get View(): Header_2;
    get Relationships(): Relationships;
    get Media(): Media;
}

/**
 * Built-in heading level styles.
 *
 * These are the standard heading styles available in Word documents.
 *
 * @publicApi
 */
export declare const HeadingLevel: {
    /** Heading 1 style */
    readonly HEADING_1: "Heading1";
    /** Heading 2 style */
    readonly HEADING_2: "Heading2";
    /** Heading 3 style */
    readonly HEADING_3: "Heading3";
    /** Heading 4 style */
    readonly HEADING_4: "Heading4";
    /** Heading 5 style */
    readonly HEADING_5: "Heading5";
    /** Heading 6 style */
    readonly HEADING_6: "Heading6";
    /** Title style */
    readonly TITLE: "Title";
};

/**
 * Height rules for table rows.
 *
 * Specifies how the height value should be interpreted.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_HeightRule">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="auto"/>
 *     <xsd:enumeration value="exact"/>
 *     <xsd:enumeration value="atLeast"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export declare const HeightRule: {
    /** Height is determined based on the content, so value is ignored. */
    readonly AUTO: "auto";
    /** At least the value specified */
    readonly ATLEAST: "atLeast";
    /** Exactly the value specified */
    readonly EXACT: "exact";
};

/**
 * A border with a hex color, as borders had before they took colors of the document's theme.
 *
 * @inline
 */
declare type HexColorBorderOptions = Omit<IBorderOptions, "color"> & {
    readonly color?: string;
};

/**
 * Validates and normalizes a hexadecimal color value.
 *
 * Accepts either "auto" or a 6-character RGB hex value (with or without # prefix).
 * The # prefix is commonly used but technically invalid in OOXML, so it is stripped
 * for strict compliance.
 *
 * Reference: ST_HexColor in OOXML specification
 *
 * @param val - The color value to validate ("auto" or hex color)
 * @returns The normalized color value
 * @throws Error if the hex color is invalid
 *
 * @example
 * ```typescript
 * const color1 = hexColorValue("auto"); // Returns "auto"
 * const color2 = hexColorValue("FF0000"); // Returns "FF0000"
 * const color3 = hexColorValue("#00FF00"); // Returns "00FF00" (# stripped)
 * ```
 */
export declare const hexColorValue: (val: string) => string;

/**
 * Highlight color values for text highlighting.
 *
 * These colors specify the background highlight color that can be applied to text.
 *
 * Reference: http://officeopenxml.com/WPtextShading.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_HighlightColor">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="black"/>
 *     <xsd:enumeration value="blue"/>
 *     <xsd:enumeration value="cyan"/>
 *     <xsd:enumeration value="green"/>
 *     <xsd:enumeration value="magenta"/>
 *     <xsd:enumeration value="red"/>
 *     <xsd:enumeration value="yellow"/>
 *     <xsd:enumeration value="white"/>
 *     <xsd:enumeration value="darkBlue"/>
 *     <xsd:enumeration value="darkCyan"/>
 *     <xsd:enumeration value="darkGreen"/>
 *     <xsd:enumeration value="darkMagenta"/>
 *     <xsd:enumeration value="darkRed"/>
 *     <xsd:enumeration value="darkYellow"/>
 *     <xsd:enumeration value="darkGray"/>
 *     <xsd:enumeration value="lightGray"/>
 *     <xsd:enumeration value="none"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 */
export declare const HighlightColor: {
    /** Black highlight */
    readonly BLACK: "black";
    /** Blue highlight */
    readonly BLUE: "blue";
    /** Cyan highlight */
    readonly CYAN: "cyan";
    /** Dark blue highlight */
    readonly DARK_BLUE: "darkBlue";
    /** Dark cyan highlight */
    readonly DARK_CYAN: "darkCyan";
    /** Dark gray highlight */
    readonly DARK_GRAY: "darkGray";
    /** Dark green highlight */
    readonly DARK_GREEN: "darkGreen";
    /** Dark magenta highlight */
    readonly DARK_MAGENTA: "darkMagenta";
    /** Dark red highlight */
    readonly DARK_RED: "darkRed";
    /** Dark yellow highlight */
    readonly DARK_YELLOW: "darkYellow";
    /** Green highlight */
    readonly GREEN: "green";
    /** Light gray highlight */
    readonly LIGHT_GRAY: "lightGray";
    /** Magenta highlight */
    readonly MAGENTA: "magenta";
    /** No highlight */
    readonly NONE: "none";
    /** Red highlight */
    readonly RED: "red";
    /** White highlight */
    readonly WHITE: "white";
    /** Yellow highlight */
    readonly YELLOW: "yellow";
};

/**
 * Horizontal alignment options for floating drawings.
 *
 * Reference: https://www.datypic.com/sc/ooxml/t-wp_ST_AlignH.html
 *
 * @publicApi
 */
export declare const HorizontalPositionAlign: {
    /** Center horizontally */
    readonly CENTER: "center";
    /** Align to inside margin (left on odd, right on even pages) */
    readonly INSIDE: "inside";
    /** Align to left */
    readonly LEFT: "left";
    /** Align to outside margin (right on odd, left on even pages) */
    readonly OUTSIDE: "outside";
    /** Align to right */
    readonly RIGHT: "right";
};

/**
 * Horizontal Relative Positioning.
 *
 * Specifies the horizontal base from which the drawing position is calculated.
 *
 * Reference: https://www.datypic.com/sc/ooxml/t-wp_ST_RelFromH.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_RelFromH">
 *   <xsd:restriction base="xsd:token">
 *     <xsd:enumeration value="margin"/>
 *     <xsd:enumeration value="page"/>
 *     <xsd:enumeration value="column"/>
 *     <xsd:enumeration value="character"/>
 *     <xsd:enumeration value="leftMargin"/>
 *     <xsd:enumeration value="rightMargin"/>
 *     <xsd:enumeration value="insideMargin"/>
 *     <xsd:enumeration value="outsideMargin"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export declare const HorizontalPositionRelativeFrom: {
    /**
     * ## Character
     *
     * Specifies that the horizontal positioning shall be relative to the position of the anchor within its run content.
     */
    readonly CHARACTER: "character";
    /**
     * ## Column
     *
     * Specifies that the horizontal positioning shall be relative to the extents of the column which contains its anchor.
     */
    readonly COLUMN: "column";
    /**
     * ## Inside Margin
     *
     * Specifies that the horizontal positioning shall be relative to the inside margin of the current page (the left margin on odd pages, right on even pages).
     */
    readonly INSIDE_MARGIN: "insideMargin";
    /**
     * ## Left Margin
     *
     * Specifies that the horizontal positioning shall be relative to the left margin of the page.
     */
    readonly LEFT_MARGIN: "leftMargin";
    /**
     * ## Page Margin
     *
     * Specifies that the horizontal positioning shall be relative to the page margins.
     */
    readonly MARGIN: "margin";
    /**
     * ## Outside Margin
     *
     * Specifies that the horizontal positioning shall be relative to the outside margin of the current page (the right margin on odd pages, left on even pages).
     */
    readonly OUTSIDE_MARGIN: "outsideMargin";
    /**
     * ## Page Edge
     *
     * Specifies that the horizontal positioning shall be relative to the edge of the page.
     */
    readonly PAGE: "page";
    /**
     * ## Right Margin
     *
     * Specifies that the horizontal positioning shall be relative to the right margin of the page.
     */
    readonly RIGHT_MARGIN: "rightMargin";
};

/**
 * XML element representing a half-point size measurement (CT_HpsMeasure).
 *
 * HpsMeasure elements are used for font sizes and other measurements in WordprocessingML.
 * Values can be specified as numbers (interpreted as half-points) or with explicit units.
 *
 * OOXML Reference:
 * ```xml
 * <xsd:complexType name="CT_HpsMeasure">
 *   <xsd:attribute name="val" type="ST_HpsMeasure" use="required"/>
 * </xsd:complexType>
 *
 * <xsd:simpleType name="ST_HpsMeasure">
 *   <xsd:union memberTypes="s:ST_UnsignedDecimalNumber s:ST_PositiveUniversalMeasure" />
 * </xsd:simpleType>
 * ```
 *
 * @example
 * ```typescript
 * // Font size of 24 half-points (12pt)
 * new HpsMeasureElement("w:sz", 24);
 * // Generates: <w:sz w:val="24"/>
 *
 * // Using explicit units
 * new HpsMeasureElement("w:sz", "12pt");
 * ```
 */
export declare class HpsMeasureElement extends XmlComponent {
    /**
     * Creates an HpsMeasureElement.
     *
     * @param name - The XML element name
     * @param val - The measurement value (number in half-points or string with units)
     */
    constructor(name: string, val: number | PositiveUniversalMeasure);
}

/**
 * Validates a half-point (HPS) measurement value.
 *
 * Accepts either a positive universal measure string or a positive number.
 * HPS (half-points) are commonly used for font sizes.
 *
 * Reference: ST_HpsMeasure in OOXML specification
 *
 * @param val - The measurement value (positive universal measure or number)
 * @returns The normalized measurement value
 *
 * @example
 * ```typescript
 * const fontSize1 = hpsMeasureValue("12pt");
 * const fontSize2 = hpsMeasureValue(24); // 12pt in half-points
 * ```
 */
export declare const hpsMeasureValue: (val: PositiveUniversalMeasure | number) => string | number;

/**
 * Hyperlink type enumeration.
 *
 * Defines the types of hyperlinks supported in WordprocessingML documents.
 *
 * @publicApi
 */
export declare const HyperlinkType: {
    /** Internal hyperlink to a bookmark within the document */
    readonly INTERNAL: "INTERNAL";
    /** External hyperlink to a URL outside the document */
    readonly EXTERNAL: "EXTERNAL";
};

/**
 * Options for frames positioned using alignment values.
 *
 * Use this type when you want to position the frame relative to the anchor
 * using standard alignment positions (e.g., left, center, right, top, bottom).
 *
 * @property type - Must be "alignment" for alignment-based positioning
 * @property alignment - Horizontal and vertical alignment values
 */
export declare type IAlignmentFrameOptions = {
    /** Must be "alignment" for alignment-based positioning */
    readonly type: "alignment";
    /** Horizontal and vertical alignment values */
    readonly alignment: {
        /** Horizontal alignment relative to the anchor */
        readonly x: (typeof HorizontalPositionAlign)[keyof typeof HorizontalPositionAlign];
        /** Vertical alignment relative to the anchor */
        readonly y: (typeof VerticalPositionAlign)[keyof typeof VerticalPositionAlign];
    };
} & IBaseFrameOptions;

/**
 * Base options for character style configuration.
 *
 * @property run - Run properties (font, size, color, etc.) for this character style
 */
export declare type IBaseCharacterStyleOptions = {
    /** Run properties (font, size, color, etc.) for this character style */
    readonly run?: IRunStylePropertiesOptions;
} & IStyleOptions;

/**
 * Base options shared by all frame types.
 *
 * @property anchorLock - Lock the anchor position to prevent it from moving
 * @property dropCap - Drop cap effect type
 * @property width - Frame width in twips
 * @property height - Frame height in twips
 * @property wrap - Text wrapping behavior around the frame
 * @property lines - Number of lines for drop cap effect
 * @property anchor - Anchor reference points for horizontal and vertical positioning
 * @property space - Spacing between frame and surrounding text
 * @property rule - Height rule determining how frame height is calculated
 */
declare type IBaseFrameOptions = {
    /** Lock the anchor position to prevent it from moving */
    readonly anchorLock?: boolean;
    /** Drop cap effect type */
    readonly dropCap?: (typeof DropCapType)[keyof typeof DropCapType];
    /** Frame width in twips */
    readonly width: number;
    /** Frame height in twips */
    readonly height: number;
    /** Text wrapping behavior around the frame */
    readonly wrap?: (typeof FrameWrap)[keyof typeof FrameWrap];
    /** Number of lines for drop cap effect */
    readonly lines?: number;
    /** Anchor reference points for horizontal and vertical positioning */
    readonly anchor: {
        /** Horizontal anchor reference point */
        readonly horizontal: (typeof FrameAnchorType)[keyof typeof FrameAnchorType];
        /** Vertical anchor reference point */
        readonly vertical: (typeof FrameAnchorType)[keyof typeof FrameAnchorType];
    };
    /** Spacing between frame and surrounding text in twips */
    readonly space?: {
        /** Horizontal spacing in twips */
        readonly horizontal: number;
        /** Vertical spacing in twips */
        readonly vertical: number;
    };
    /** Height rule determining how frame height is calculated */
    readonly rule?: (typeof HeightRule)[keyof typeof HeightRule];
};

/**
 * Base options for paragraph style configuration.
 *
 * @property paragraph - Paragraph properties (alignment, spacing, indentation, etc.)
 * @property run - Run properties that apply to text within this paragraph style
 */
export declare type IBaseParagraphStyleOptions = {
    /** Paragraph properties (alignment, spacing, indentation, etc.) */
    readonly paragraph?: IParagraphStylePropertiesOptions;
    /** Run properties that apply to text within this paragraph style */
    readonly run?: IRunStylePropertiesOptions;
} & IStyleOptions;

export declare type IBodyPropertiesOptions = {
    readonly wrap?: (typeof TextWrappingType)[keyof typeof TextWrappingType];
    readonly verticalAnchor?: VerticalAnchor;
    readonly margins?: {
        readonly top?: number;
        readonly bottom?: number;
        readonly left?: number;
        readonly right?: number;
    };
    readonly noAutoFit?: boolean;
};

/**
 * Options for creating a bookmark.
 *
 * @property id - The bookmark name used for reference
 * @property children - Array of paragraph children contained within the bookmark range
 */
export declare type IBookmarkOptions = {
    /** The bookmark name used for reference */
    readonly id: string;
    /** Array of paragraph children contained within the bookmark range */
    readonly children: readonly ParagraphChild[];
};

/**
 * Options for configuring a border element.
 *
 * @property style - The border style (single, dashed, dotted, etc.)
 * @property color - Border color in hex format (e.g., "FF00AA" for purple), or a color of the document's theme
 * @property size - Border thickness in eighths of a point (1/8 pt)
 * @property space - Spacing offset from the content in points
 */
export declare type IBorderOptions = {
    readonly style: (typeof BorderStyle)[keyof typeof BorderStyle];
    /** Border color, in hex (eg 'FF00AA'), or a color of the document's theme (eg `{ theme: "accent1" }`) */
    readonly color?: string | ThemeColor;
    /** Size of the border in 1/8 pt */
    readonly size?: number;
    /** Spacing offset. Values are specified in pt */
    readonly space?: number;
};

/**
 * Options for configuring paragraph borders.
 *
 * Borders can be applied to top, bottom, left, right, and between paragraphs.
 *
 * @property top - Border for the top edge of the paragraph
 * @property bottom - Border for the bottom edge of the paragraph
 * @property left - Border for the left edge of the paragraph
 * @property right - Border for the right edge of the paragraph
 * @property between - Border between consecutive paragraphs with the same border settings
 */
export declare type IBordersOptions = {
    /** Border for the top edge of the paragraph */
    readonly top?: IBorderOptions;
    /** Border for the bottom edge of the paragraph */
    readonly bottom?: IBorderOptions;
    /** Border for the left edge of the paragraph */
    readonly left?: IBorderOptions;
    /** Border for the right edge of the paragraph */
    readonly right?: IBorderOptions;
    /** Border between consecutive paragraphs with the same border settings */
    readonly between?: IBorderOptions;
};

export declare type ICellMergeAttributes = IChangedAttributesProperties & {
    readonly verticalMerge?: (typeof VerticalMergeRevisionType)[keyof typeof VerticalMergeRevisionType];
    readonly verticalMergeOriginal?: (typeof VerticalMergeRevisionType)[keyof typeof VerticalMergeRevisionType];
};

/**
 * Properties for a tracked change element.
 *
 * These properties identify the change and its author for revision tracking.
 *
 * @property id - Unique identifier for this change (must be unique within the document)
 * @property author - Name of the author who made the change
 * @property date - Date and time when the change was made (ISO 8601 format)
 */
declare type IChangedAttributesProperties = {
    /** Unique identifier for this change (must be unique within the document) */
    readonly id: number;
    /** Name of the author who made the change */
    readonly author: string;
    /** Date and time when the change was made (ISO 8601 format) */
    readonly date: string;
};

/**
 * Options for creating a character style.
 *
 * @property id - Unique identifier for the character style
 */
export declare type ICharacterStyleOptions = {
    /** Unique identifier for the character style */
    readonly id: string;
} & IBaseCharacterStyleOptions;

/**
 * Options for configuring a checkbox control.
 *
 * @property alias - Display name for the checkbox control
 * @property checked - Whether the checkbox is initially checked
 * @property checkedState - Symbol properties for the checked state
 * @property uncheckedState - Symbol properties for the unchecked state
 */
export declare type ICheckboxSymbolOptions = {
    /** Display name for the checkbox control. */
    readonly alias?: string;
    /** Whether the checkbox is initially checked. */
    readonly checked?: boolean;
    /** Symbol properties for the checked state. */
    readonly checkedState?: ICheckboxSymbolProperties;
    /** Symbol properties for the unchecked state. */
    readonly uncheckedState?: ICheckboxSymbolProperties;
};

/**
 * Configuration for a checkbox symbol state (checked or unchecked).
 *
 * @property value - Hexadecimal character code for the symbol (e.g., "2612" for ☒)
 * @property font - Font family to use for rendering the symbol
 */
export declare type ICheckboxSymbolProperties = {
    /** Hexadecimal character code for the symbol (e.g., "2612" for ☒). */
    readonly value?: string;
    /** Font family to use for rendering the symbol. */
    readonly font?: string;
};

/**
 * Options for configuring individual column properties.
 *
 * @property width - Column width in twips or universal measure
 * @property space - Space after column in twips or universal measure (default: 0)
 */
export declare type IColumnAttributes = {
    /** Column width in twips or universal measure */
    readonly width: number | PositiveUniversalMeasure;
    /** Space after column in twips or universal measure (default: 0) */
    readonly space?: number | PositiveUniversalMeasure;
};

/**
 * Options for configuring column layout in a section.
 *
 * @property space - Spacing between columns in twips (default: 720)
 * @property count - Number of columns (default: 1)
 * @property separate - Whether to draw vertical separator lines between columns
 * @property equalWidth - Whether all columns have equal width
 * @property children - Individual column definitions (used when equalWidth is false)
 */
export declare type IColumnsAttributes = {
    /** Spacing between columns in twips (default: 720) */
    readonly space?: number | PositiveUniversalMeasure;
    /** Number of columns (default: 1) */
    readonly count?: number;
    /** Whether to draw vertical separator lines between columns */
    readonly separate?: boolean;
    /** Whether all columns have equal width */
    readonly equalWidth?: boolean;
    /** Individual column definitions (used when equalWidth is false, max: 45) */
    readonly children?: readonly Column[];
};

/**
 * Comment id data for a single comment, used to build commentsIds.xml.
 */
export declare type ICommentIdData = {
    /** 8-character uppercase hex identifier linking to w14:paraId on the comment's paragraph */
    readonly paraId: string;
    /** Stable comment id preserved by Word across edits (maps to w16cid:durableId) */
    readonly durableId: string;
};

/**
 * Options for creating a single comment.
 *
 * @property id - Unique identifier for the comment
 * @property children - Content of the comment (typically paragraphs)
 * @property initials - Initials of the comment author
 * @property author - Name of the comment author
 * @property date - Date and time the comment was created
 */
export declare type ICommentOptions = {
    /** Unique identifier for the comment */
    readonly id: number;
    /** Content of the comment (typically paragraphs) */
    readonly children: readonly FileChild[];
    /** Initials of the comment author */
    readonly initials?: string;
    /** Name of the comment author */
    readonly author?: string;
    /** Date and time the comment was created */
    readonly date?: Date;
    /** ID of the parent comment for reply threading */
    readonly parentId?: number;
    /** Whether the comment thread is marked as resolved */
    readonly resolved?: boolean;
    /** Stable comment id written to word/commentsIds.xml (w16cid:durableId). Preserved by Word across edits, unlike w:id. */
    readonly durableId?: string;
};

/**
 * Options for creating a comments container.
 *
 * @property children - Array of comment definitions
 */
export declare type ICommentsOptions = {
    /** Array of comment definitions */
    readonly children: readonly ICommentOptions[];
};

/**
 * Thread data for a single comment, used to build commentsExtended.xml.
 */
export declare type ICommentThreadData = {
    /** 8-character uppercase hex identifier linking to w14:paraId on the comment's paragraph */
    readonly paraId: string;
    /** paraId of the parent comment for reply threading (maps to w15:paraIdParent) */
    readonly parentParaId?: string;
    /** Whether the thread is resolved (maps to w15:done: "1"/"0") */
    readonly done?: boolean;
};

/**
 * Options for configuring document compatibility settings.
 *
 * These settings control how Word processes and displays documents to match
 * behavior from older Word versions or other word processors like WordPerfect.
 *
 * @see {@link Compatibility}
 */
declare type ICompatibilityOptions = {
    /** Word compatibility mode version (e.g., 15 for Word 2013+) */
    readonly version?: number;
    /** Use Simplified Rules For Table Border Conflicts */
    readonly useSingleBorderforContiguousCells?: boolean;
    /** Emulate WordPerfect 6.x Paragraph Justification */
    readonly wordPerfectJustification?: boolean;
    /** Do Not Create Custom Tab Stop for Hanging Indent */
    readonly noTabStopForHangingIndent?: boolean;
    /** Do Not Add Leading Between Lines of Text */
    readonly noLeading?: boolean;
    /** Add Additional Space Below Baseline For Underlined East Asian Text */
    readonly spaceForUnderline?: boolean;
    /** Do Not Balance Text Columns within a Section */
    readonly noColumnBalance?: boolean;
    /** Balance Single Byte and Double Byte Characters */
    readonly balanceSingleByteDoubleByteWidth?: boolean;
    /** Do Not Center Content on Lines With Exact Line Height */
    readonly noExtraLineSpacing?: boolean;
    /** Convert Backslash To Yen Sign When Entered */
    readonly doNotLeaveBackslashAlone?: boolean;
    /** Underline All Trailing Spaces */
    readonly underlineTrailingSpaces?: boolean;
    /** Don't Justify Lines Ending in Soft Line Break */
    readonly doNotExpandShiftReturn?: boolean;
    /** Only Expand/Condense Text By Whole Points */
    readonly spacingInWholePoints?: boolean;
    /** Emulate Word 6.0 Line Wrapping for East Asian Text */
    readonly lineWrapLikeWord6?: boolean;
    /** Print Body Text before Header/Footer Contents */
    readonly printBodyTextBeforeHeader?: boolean;
    /** Print Colors as Black And White without Dithering */
    readonly printColorsBlack?: boolean;
    /** Space width */
    readonly spaceWidth?: boolean;
    /** Display Page/Column Breaks Present in Frames */
    readonly showBreaksInFrames?: boolean;
    /** Increase Priority Of Font Size During Font Substitution */
    readonly subFontBySize?: boolean;
    /** Ignore Exact Line Height for Last Line on Page */
    readonly suppressBottomSpacing?: boolean;
    /** Ignore Minimum and Exact Line Height for First Line on Page */
    readonly suppressTopSpacing?: boolean;
    /** Ignore Minimum Line Height for First Line on Page */
    readonly suppressSpacingAtTopOfPage?: boolean;
    /** Emulate WordPerfect 5.x Line Spacing */
    readonly suppressTopSpacingWP?: boolean;
    /** Do Not Use Space Before On First Line After a Page Break */
    readonly suppressSpBfAfterPgBrk?: boolean;
    /** Swap Paragraph Borders on Odd Numbered Pages */
    readonly swapBordersFacingPages?: boolean;
    /** Treat Backslash Quotation Delimiter as Two Quotation Marks */
    readonly convertMailMergeEsc?: boolean;
    /** Emulate WordPerfect 6.x Font Height Calculation */
    readonly truncateFontHeightsLikeWP6?: boolean;
    /** Emulate Word 5.x for the Macintosh Small Caps Formatting */
    readonly macWordSmallCaps?: boolean;
    /** Use Printer Metrics To Display Documents */
    readonly usePrinterMetrics?: boolean;
    /** Do Not Suppress Paragraph Borders Next To Frames */
    readonly doNotSuppressParagraphBorders?: boolean;
    /** Line Wrap Trailing Spaces */
    readonly wrapTrailSpaces?: boolean;
    /** Emulate Word 6.x/95/97 Footnote Placement */
    readonly footnoteLayoutLikeWW8?: boolean;
    /** Emulate Word 97 Text Wrapping Around Floating Objects */
    readonly shapeLayoutLikeWW8?: boolean;
    /** Align Table Rows Independently */
    readonly alignTablesRowByRow?: boolean;
    /** Ignore Width of Last Tab Stop When Aligning Paragraph If It Is Not Left Aligned */
    readonly forgetLastTabAlignment?: boolean;
    /** Add Document Grid Line Pitch To Lines in Table Cells */
    readonly adjustLineHeightInTable?: boolean;
    /** Emulate Word 95 Full-Width Character Spacing */
    readonly autoSpaceLikeWord95?: boolean;
    /** Do Not Increase Line Height for Raised/Lowered Text */
    readonly noSpaceRaiseLower?: boolean;
    /** Use Fixed Paragraph Spacing for HTML Auto Setting */
    readonly doNotUseHTMLParagraphAutoSpacing?: boolean;
    /** Ignore Space Before Table When Deciding If Table Should Wrap Floating Object */
    readonly layoutRawTableWidth?: boolean;
    /** Allow Table Rows to Wrap Inline Objects Independently */
    readonly layoutTableRowsApart?: boolean;
    /** Emulate Word 97 East Asian Line Breaking */
    readonly useWord97LineBreakRules?: boolean;
    /** Do Not Allow Floating Tables To Break Across Pages */
    readonly doNotBreakWrappedTables?: boolean;
    /** Do Not Snap to Document Grid in Table Cells with Objects */
    readonly doNotSnapToGridInCell?: boolean;
    /** Select Field When First or Last Character Is Selected */
    readonly selectFieldWithFirstOrLastCharacter?: boolean;
    /** Use Legacy Ethiopic and Amharic Line Breaking Rules */
    readonly applyBreakingRules?: boolean;
    /** Do Not Allow Hanging Punctuation With Character Grid */
    readonly doNotWrapTextWithPunctuation?: boolean;
    /** Do Not Compress Compressible Characters When Using Document Grid */
    readonly doNotUseEastAsianBreakRules?: boolean;
    /** Emulate Word 2002 Table Style Rules */
    readonly useWord2002TableStyleRules?: boolean;
    /** Allow Tables to AutoFit Into Page Margins */
    readonly growAutofit?: boolean;
    /** Do Not Bypass East Asian/Complex Script Layout Code */
    readonly useFELayout?: boolean;
    /** Do Not Automatically Apply List Paragraph Style To Bulleted/Numbered Text */
    readonly useNormalStyleForList?: boolean;
    /** Ignore Hanging Indent When Creating Tab Stop After Numbering */
    readonly doNotUseIndentAsNumberingTabStop?: boolean;
    /** Use Alternate Set of East Asian Line Breaking Rules */
    readonly useAlternateEastAsianLineBreakRules?: boolean;
    /** Allow Contextual Spacing of Paragraphs in Tables */
    readonly allowSpaceOfSameStyleInTable?: boolean;
    /** Do Not Ignore Floating Objects When Calculating Paragraph Indentation */
    readonly doNotSuppressIndentation?: boolean;
    /** Do Not AutoFit Tables To Fit Next To Wrapped Objects */
    readonly doNotAutofitConstrainedTables?: boolean;
    /** Allow Table Columns To Exceed Preferred Widths of Constituent Cells */
    readonly autofitToFirstFixedWidthCell?: boolean;
    /** Underline Following Character Following Numbering */
    readonly underlineTabInNumberingList?: boolean;
    /** Always Use Fixed Width for Hangul Characters */
    readonly displayHangulFixedWidth?: boolean;
    /** Always Move Paragraph Mark to Page after a Page Break */
    readonly splitPgBreakAndParaMark?: boolean;
    /** Don't Vertically Align Cells Containing Floating Objects */
    readonly doNotVerticallyAlignCellWithSp?: boolean;
    /** Don't Break Table Rows Around Floating Tables */
    readonly doNotBreakConstrainedForcedTable?: boolean;
    /** Ignore Vertical Alignment in Textboxes */
    readonly ignoreVerticalAlignmentInTextboxes?: boolean;
    /** Use ANSI Kerning Pairs from Fonts */
    readonly useAnsiKerningPairs?: boolean;
    /** Use Cached Paragraph Information for Column Balancing */
    readonly cachedColumnBalance?: boolean;
};

/**
 * Options for creating a concrete numbering instance.
 *
 * @property numId - Unique identifier for this numbering instance
 * @property abstractNumId - ID of the abstract numbering definition to reference
 * @property reference - Reference name for this numbering instance
 * @property instance - Instance number for tracking multiple uses
 * @property overrideLevels - Array of level overrides to customize specific levels
 */
export declare type IConcreteNumberingOptions = {
    /** Unique identifier for this numbering instance. */
    readonly numId: number;
    /** ID of the abstract numbering definition to reference. */
    readonly abstractNumId: number;
    /** Reference name for this numbering instance. */
    readonly reference: string;
    /** Instance number for tracking multiple uses. */
    readonly instance: number;
    /** Array of level overrides to customize specific levels. */
    readonly overrideLevels?: readonly IOverrideLevel[];
};

/**
 * Context object passed through the XML tree during serialization.
 *
 * This context provides access to the document structure and maintains state
 * during the conversion of components to XML.
 *
 * @property file - The root File object being serialized
 * @property viewWrapper - Access to document relationships and other document parts
 * @property stack - Current traversal stack of components (mutable for performance)
 */
export declare type IContext = {
    /** The root File object being serialized. */
    readonly file: File_2;
    /** Access to document relationships and other document parts. */
    readonly viewWrapper: IViewWrapper;
    /** Current traversal stack of components (mutable for performance). */
    readonly stack: IXmlableObject[];
};

/**
 * Options for cropping an image.
 *
 * Each value is a percentage (0-100) of the image dimension to crop away
 * from the given edge. For example, `{ left: 10 }` crops 10% off the left
 * side of the image.
 */
export declare type ICropOptions = {
    /** Percentage (0-100) of the image width to crop from the left edge. */
    readonly left?: number;
    /** Percentage (0-100) of the image height to crop from the top edge. */
    readonly top?: number;
    /** Percentage (0-100) of the image width to crop from the right edge. */
    readonly right?: number;
    /** Percentage (0-100) of the image height to crop from the bottom edge. */
    readonly bottom?: number;
};

/**
 * Options for creating a custom property.
 *
 * @property name - The property name
 * @property value - The property value (as string)
 */
declare type ICustomPropertyOptions = {
    /** The property name */
    readonly name: string;
    /** The property value (as string) */
    readonly value: string;
};

/**
 * Options for configuring default document styles.
 *
 * Allows customization of built-in styles for common document elements.
 *
 * @property document - Document-wide default formatting
 * @property title - Title paragraph style options
 * @property heading1 - Heading 1 paragraph style options
 * @property heading2 - Heading 2 paragraph style options
 * @property heading3 - Heading 3 paragraph style options
 * @property heading4 - Heading 4 paragraph style options
 * @property heading5 - Heading 5 paragraph style options
 * @property heading6 - Heading 6 paragraph style options
 * @property strong - Strong paragraph style options
 * @property listParagraph - List paragraph style options
 * @property hyperlink - Hyperlink character style options
 * @property footnoteReference - Footnote reference character style options
 * @property footnoteText - Footnote text paragraph style options
 * @property footnoteTextChar - Footnote text character style options
 */
declare type IDefaultStylesOptions = {
    /** Document-wide default formatting */
    readonly document?: IDocumentDefaultsOptions;
    /** Title paragraph style options */
    readonly title?: IBaseParagraphStyleOptions;
    /** Heading 1 paragraph style options */
    readonly heading1?: IBaseParagraphStyleOptions;
    /** Heading 2 paragraph style options */
    readonly heading2?: IBaseParagraphStyleOptions;
    /** Heading 3 paragraph style options */
    readonly heading3?: IBaseParagraphStyleOptions;
    /** Heading 4 paragraph style options */
    readonly heading4?: IBaseParagraphStyleOptions;
    /** Heading 5 paragraph style options */
    readonly heading5?: IBaseParagraphStyleOptions;
    /** Heading 6 paragraph style options */
    readonly heading6?: IBaseParagraphStyleOptions;
    /** Strong paragraph style options */
    readonly strong?: IBaseParagraphStyleOptions;
    /** List paragraph style options */
    readonly listParagraph?: IBaseParagraphStyleOptions;
    /** Hyperlink character style options */
    readonly hyperlink?: IBaseCharacterStyleOptions;
    /** Footnote reference character style options */
    readonly footnoteReference?: IBaseCharacterStyleOptions;
    /** Footnote text paragraph style options */
    readonly footnoteText?: IBaseParagraphStyleOptions;
    /** Footnote text character style options */
    readonly footnoteTextChar?: IBaseCharacterStyleOptions;
    readonly endnoteReference?: IBaseCharacterStyleOptions;
    readonly endnoteText?: IBaseParagraphStyleOptions;
    readonly endnoteTextChar?: IBaseCharacterStyleOptions;
};

/**
 * Options for creating a deleted text run.
 *
 * Combines run formatting options with track change metadata.
 *
 * @property id - Unique identifier for this deletion
 * @property author - Name of the author who deleted the text
 * @property date - Date and time when the deletion was made (ISO 8601 format)
 */
declare type IDeletedRunOptions = IRunOptions & IChangedAttributesProperties;

/**
 * Distance options for drawing elements.
 *
 * Specifies the margins around a drawing element.
 */
export declare type IDistance = {
    readonly distT?: number;
    readonly distB?: number;
    readonly distL?: number;
    readonly distR?: number;
};

export declare type IDocGridAttributesProperties = {
    /**
     * Specifies the type of the current document grid, which defines the grid behavior.
     *
     * The grid can define a grid which snaps all East Asian characters to grid positions, but leaves Latin text with its default spacing; a grid which adds the specified character pitch to each character on each row; or a grid which affects only the line pitch for the current section.
     */
    readonly type?: (typeof DocumentGridType)[keyof typeof DocumentGridType];
    /**
     * Specifies the number of lines to be allowed on the document grid for the current page assuming all lines have equal line pitch applied to them. This line pitch shall not be added to any line which appears within a table cell unless the <adjustLineHeightInTable> element (§2.15.3.1) is present in the document's compatibility settings.
     *
     * This attribute is specified in twentieths of a point, and defines the pitch for each line of text on this page such that the desired number of single spaced lines of text fits on the current page.
     *
     * ```xml
     * <w:docGrid w:linePitch="684" …/>
     * ```
     *
     * The `linePitch` attribute specifies that 34.2 points is to the amount of pitch allowed for each line on this page in order to maintain the specific document grid. ]
     *
     * Individual paragraphs can override the line pitch information specified for the document grid by either:
     *
     * Specifying an exact line spacing value using the `lineRule` attribute of value exact on the <spacing> element (§2.3.1.33).
     *
     * Specifying that the paragraph text shall not snap to the document grid via the <snapToGrid> element (§2.3.1.32).
     *
     * The possible values for this attribute are defined by the ST_DecimalNumber simple type (§2.18.16).
     */
    readonly linePitch: number;
    /**
     * Specifies the number of characters to be allowed on the document grid for each line in this section.
     *
     * This attribute's value shall be specified by multiplying the difference between the desired character pitch and the character pitch for that character in the font size of the Normal font by 4096.
     *
     * This value shall then be used to add the character pitch for the specified point size to each character in the section [: This results in text in the Normal style having a specific number of characters per line. ]
     *
     * ```xml
     * <w:docGrid w:charSize="40960" …/>
     * ```
     * The `charSpace` attribute specifies a value of 40960, which means that the delta between the character pitch of each character in the grid and the Normal font is 10 points, resulting in a character pitch of 11+10 = 21 points for all characters in this section. ]
     *
     * Individual runs of text can override the line pitch information specified for the document grid by specifying that the run text shall not snap to the document grid via the <snapToGrid> element (§2.3.2.32).
     *
     * The possible values for this attribute are defined by the `ST_DecimalNumber` simple type (§2.18.16).
     */
    readonly charSpace?: number;
};

/**
 * Properties for document namespace attributes.
 *
 * Allows specifying which namespaces to include and optional Ignorable attribute
 * for compatibility with older processors.
 */
export declare type IDocumentAttributesProperties = Partial<Record<DocumentAttributeNamespace, string>> & {
    readonly Ignorable?: string;
};

/**
 * Options for creating a document background.
 *
 * @see {@link DocumentBackground}
 */
export declare type IDocumentBackgroundOptions = {
    /**
     * Background color: a hex color such as `"FF0000"`, or a color of the document's theme such as
     * `{ theme: "accent1", lighter: 80 }`
     */
    readonly color?: string | ThemeColor;
    /**
     * Theme color name (e.g., "accent1", "dark1")
     *
     * @deprecated Give `color` a theme color instead, such as `{ theme: "accent1" }`
     */
    readonly themeColor?: string;
    /**
     * Theme shade value (darkens the theme color)
     *
     * @deprecated Give `color` a theme color instead, such as `{ theme: "accent1", darker: 25 }`
     */
    readonly themeShade?: string;
    /**
     * Theme tint value (lightens the theme color)
     *
     * @deprecated Give `color` a theme color instead, such as `{ theme: "accent1", lighter: 40 }`
     */
    readonly themeTint?: string;
};

/**
 * Options for configuring document-wide default formatting.
 *
 * @property paragraph - Default paragraph properties applied to all paragraphs
 * @property run - Default run properties applied to all text runs
 */
export declare type IDocumentDefaultsOptions = {
    /** Default paragraph properties applied to all paragraphs */
    readonly paragraph?: IParagraphStylePropertiesOptions;
    /** Default run properties applied to all text runs */
    readonly run?: IRunStylePropertiesOptions;
};

/**
 * Configuration for a document footer.
 *
 * @property footer - The FooterWrapper instance containing the footer content
 * @property type - The footer type (default, first page, even pages)
 */
export declare type IDocumentFooter = {
    readonly footer: FooterWrapper;
    readonly type: (typeof HeaderFooterReferenceType)[keyof typeof HeaderFooterReferenceType];
};

/**
 * Configuration for a document header.
 *
 * @property header - The HeaderWrapper instance containing the header content
 * @property type - The header type (default, first page, even pages)
 */
export declare type IDocumentHeader = {
    readonly header: HeaderWrapper;
    readonly type: (typeof HeaderFooterReferenceType)[keyof typeof HeaderFooterReferenceType];
};

/**
 * Options for creating a Document element.
 *
 * @property background - Optional background settings for the document
 *
 * @see {@link Document}
 */
export declare type IDocumentOptions = {
    /** Optional background settings for the document */
    readonly background?: IDocumentBackgroundOptions;
};

/**
 * Options for configuring a drawing element.
 *
 * @see {@link Drawing}
 */
export declare type IDrawingOptions = DrawingLinkOptions & {
    readonly floating?: IFloating;
    readonly docProperties?: DocPropertiesOptions;
    readonly outline?: OutlineOptions;
    readonly solidFill?: SolidFillOptions;
    readonly crop?: ICropOptions;
    /** How far the drawing's visible effects (such as a thick line) reach past its box, in EMUs */
    readonly effectExtent?: EffectExtentAttributes;
};

export declare type IExtendedMediaData = IMediaData | WpsMediaData | WpgMediaData | GraphicMediaData;

/**
 * Options for creating an external hyperlink.
 *
 * @property children - Array of paragraph children (usually TextRun elements) that form the hyperlink text
 * @property link - URL to link to outside the document
 */
export declare type IExternalHyperlinkOptions = {
    /** Array of paragraph children that form the hyperlink text */
    readonly children: readonly ParagraphChild[];
    /** URL to link to outside the document */
    readonly link: string;
};

/**
 * Configuration options for a floating/anchored drawing.
 *
 * @see {@link Anchor}
 */
export declare type IFloating = {
    readonly horizontalPosition: IHorizontalPositionOptions;
    readonly verticalPosition: IVerticalPositionOptions;
    readonly allowOverlap?: boolean;
    readonly lockAnchor?: boolean;
    readonly behindDocument?: boolean;
    readonly layoutInCell?: boolean;
    readonly margins?: IMargins;
    readonly wrap?: ITextWrapping;
    readonly zIndex?: number;
};

/**
 * Options for font attributes across different character sets.
 *
 * @property ascii - Font for ASCII characters (0x00-0x7F)
 * @property cs - Font for complex script characters
 * @property eastAsia - Font for East Asian characters
 * @property hAnsi - Font for high ANSI characters (0x80-0xFF)
 * @property hint - Hint for font selection algorithm
 */
export declare type IFontAttributesProperties = {
    /** Font for ASCII characters (0x00-0x7F) */
    readonly ascii?: string;
    /** Font for complex script characters */
    readonly cs?: string;
    /** Font for East Asian characters */
    readonly eastAsia?: string;
    /** Font for high ANSI characters (0x80-0xFF) */
    readonly hAnsi?: string;
    /** Hint for font selection algorithm */
    readonly hint?: string;
};

declare type IFontOptions = {
    readonly name: string;
    readonly hint?: string;
};

/**
 * Union type for all frame positioning options.
 *
 * A frame can be positioned using either absolute coordinates (IXYFrameOptions)
 * or alignment values (IAlignmentFrameOptions).
 *
 * Note: Be wary of TypeScript's Open types when using discriminated unions.
 * Reference: https://stackoverflow.com/q/46370222/3481582
 */
export declare type IFrameOptions = IXYFrameOptions | IAlignmentFrameOptions;

/**
 * XML component that is excluded from output if it has no meaningful content.
 *
 * IgnoreIfEmptyXmlComponent is useful for optional container elements that
 * should only appear in the XML if they contain children or attributes.
 * If the element would be empty, it returns undefined instead, causing it
 * to be excluded from the output.
 *
 * @example
 * ```typescript
 * class OptionalContainer extends IgnoreIfEmptyXmlComponent {
 *   constructor(items?: Item[]) {
 *     super("w:container");
 *     if (items) {
 *       items.forEach(item => this.root.push(item));
 *     }
 *   }
 * }
 *
 * const container1 = new OptionalContainer([item1, item2]);
 * // Renders: <w:container>...</w:container>
 *
 * const container2 = new OptionalContainer();
 * // Renders: nothing (excluded from output)
 * ```
 */
export declare abstract class IgnoreIfEmptyXmlComponent extends XmlComponent {
    private readonly includeIfEmpty;
    constructor(rootKey: string, includeIfEmpty?: boolean);
    /**
     * Prepares the component for XML serialization, excluding it if empty.
     *
     * @param context - The serialization context
     * @returns The XML-serializable object, or undefined if empty
     */
    prepForXml(context: IContext): IXmlableObject | undefined;
}

export declare type IGroupChildMediaData = (WpsMediaData | IMediaData) & WpgCommonMediaData;

/**
 * Header/footer group for specifying different headers/footers
 * for default, first, and even pages.
 *
 * @property default - Header/footer for default pages (odd pages when even headers are used)
 * @property first - Header/footer for first page (requires titlePage setting)
 * @property even - Header/footer for even pages (requires evenAndOddHeaders setting)
 */
export declare type IHeaderFooterGroup<T> = {
    /** Header/footer for default pages (odd pages when even headers are used) */
    readonly default?: T;
    /** Header/footer for first page (requires titlePage setting) */
    readonly first?: T;
    /** Header/footer for even pages (requires evenAndOddHeaders setting) */
    readonly even?: T;
};

export declare type IHeaderFooterOptions = {
    readonly type?: (typeof HeaderFooterReferenceType)[keyof typeof HeaderFooterReferenceType];
    readonly id?: number;
};

/**
 * Options for creating a header or footer.
 *
 * @see {@link Header}
 * @see {@link Footer}
 */
export declare type IHeaderOptions = {
    /** The content elements (paragraphs and tables) for the header/footer */
    readonly children: readonly (Paragraph | Table)[];
};

/**
 * Options for horizontal positioning of a floating drawing.
 */
export declare type IHorizontalPositionOptions = {
    /** The base from which horizontal position is calculated */
    readonly relative?: (typeof HorizontalPositionRelativeFrom)[keyof typeof HorizontalPositionRelativeFrom];
    /** Alignment relative to the horizontal base */
    readonly align?: (typeof HorizontalPositionAlign)[keyof typeof HorizontalPositionAlign];
    /** Offset in EMUs from the horizontal base */
    readonly offset?: number;
};

/**
 * Options for automatic hyphenation settings.
 *
 * @see {@link Settings}
 */
declare type IHyphenationOptions = {
    /** Specifies whether the application automatically hyphenates words as they are typed in the document. */
    readonly autoHyphenation?: boolean;
    /** Specifies the minimum number of characters at the beginning of a word before a hyphen can be inserted. */
    readonly hyphenationZone?: number;
    /** Specifies the maximum number of consecutive lines that can end with a hyphenated word. */
    readonly consecutiveHyphenLimit?: number;
    /** Specifies whether to hyphenate words in all capital letters. */
    readonly doNotHyphenateCaps?: boolean;
};

/**
 * Options for creating an ImageRun.
 *
 * @see {@link ImageRun}
 */
export declare type IImageOptions = (RegularImageOptions | SvgMediaOptions) & CoreImageOptions;

/**
 * Properties for configuring paragraph indentation.
 *
 * Values can be specified as numbers (in twips) or as universal measures (e.g., "1in", "2.5cm").
 */
export declare type IIndentAttributesProperties = {
    readonly start?: number | UniversalMeasure;
    readonly end?: number | UniversalMeasure;
    readonly left?: number | UniversalMeasure;
    readonly right?: number | UniversalMeasure;
    readonly hanging?: number | PositiveUniversalMeasure;
    readonly firstLine?: number | PositiveUniversalMeasure;
    readonly firstLineChars?: number;
};

/**
 * Options for creating an inserted text run.
 *
 * Combines run formatting options with track change metadata.
 *
 * @property id - Unique identifier for this insertion
 * @property author - Name of the author who inserted the text
 * @property date - Date and time when the insertion was made (ISO 8601 format)
 */
declare type IInsertedRunOptions = IChangedAttributesProperties & IRunOptions;

/**
 * Options for creating an internal hyperlink.
 *
 * @property children - Array of paragraph children (usually TextRun elements) that form the hyperlink text
 * @property anchor - Name of the bookmark to link to within the document
 */
export declare type IInternalHyperlinkOptions = {
    /** Array of paragraph children that form the hyperlink text */
    readonly children: readonly ParagraphChild[];
    /** Name of the bookmark to link to within the document */
    readonly anchor: string;
};

/**
 * Options for language settings.
 *
 * Specifies the language for different text types within a run.
 * Language codes should follow RFC 1766 (e.g., "en-US", "fr-FR", "ja-JP").
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Language">
 *   <xsd:attribute name="val" type="s:ST_Lang" use="optional"/>
 *   <xsd:attribute name="eastAsia" type="s:ST_Lang" use="optional"/>
 *   <xsd:attribute name="bidi" type="s:ST_Lang" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @property value - Language for Latin and complex script text (e.g., "en-US")
 * @property eastAsia - Language for East Asian text (e.g., "ja-JP", "zh-CN")
 * @property bidirectional - Language for bidirectional text (e.g., "ar-SA", "he-IL")
 */
declare type ILanguageOptions = {
    /** Language for Latin and complex script text (RFC 1766 format, e.g., "en-US") */
    readonly value?: string;
    /** Language for East Asian text (RFC 1766 format, e.g., "ja-JP") */
    readonly eastAsia?: string;
    /** Language for bidirectional text (RFC 1766 format, e.g., "ar-SA") */
    readonly bidirectional?: string;
};

/**
 * Paragraph style properties for numbering levels.
 *
 * These properties are used when defining paragraph styles within numbering level definitions.
 */
export declare type ILevelParagraphStylePropertiesOptions = {
    /** Paragraph text alignment (left, right, center, justified, etc.) */
    readonly alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    /** Whether to display a horizontal line (thematic break) below the paragraph */
    readonly thematicBreak?: boolean;
    /** Whether to ignore spacing before/after when adjacent paragraphs have the same style */
    readonly contextualSpacing?: boolean;
    /** Position in twips for a right-aligned tab stop */
    readonly rightTabStop?: number;
    /** Position in twips for a left-aligned tab stop */
    readonly leftTabStop?: number;
    /** Indentation settings for the paragraph */
    readonly indent?: IIndentAttributesProperties;
    /** Spacing before/after paragraph and between lines */
    readonly spacing?: ISpacingProperties;
    /**
     * Specifies that the paragraph (or at least part of it) should be rendered on the same page as the next paragraph when possible. If multiple paragraphs are to be kept together but they exceed a page, then the set of paragraphs begin on a new page and page breaks are used thereafter as needed.
     */
    readonly keepNext?: boolean;
    /**
     * Specifies that all lines of the paragraph are to be kept on a single page when possible.
     */
    readonly keepLines?: boolean;
    /** Outline level for table of contents and document outline (0-9) */
    readonly outlineLevel?: number;
};

/**
 * Options for configuring a numbering level.
 *
 * @property level - Level index (0-8)
 * @property format - Number format type (decimal, roman, letter, etc.)
 * @property text - Level text template with placeholders like %1, %2
 * @property alignment - Text alignment for the numbering
 * @property start - Starting number for this level
 * @property suffix - Character(s) following the numbering (tab, space, nothing)
 * @property isLegalNumberingStyle - Use legal numbering style
 * @property style - Run and paragraph style properties
 */
export declare type ILevelsOptions = {
    /** Level index (0-8). */
    readonly level: number;
    /** Number format type (decimal, roman, letter, bullet, etc.). */
    readonly format?: (typeof LevelFormat)[keyof typeof LevelFormat];
    /** Level text template with placeholders like %1, %2. */
    readonly text?: string;
    /**
     * Alignment of the level's number: left, center or right. START and the justified alignments are written as left,
     * and END as right, since Office doesn't allow the others here. Defaults to START.
     */
    readonly alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    /** Starting number for this level. */
    readonly start?: number;
    /** Character(s) following the numbering. */
    readonly suffix?: (typeof LevelSuffix)[keyof typeof LevelSuffix];
    /** Use legal numbering style (e.g., 1.1.1). */
    readonly isLegalNumberingStyle?: boolean;
    /** Run and paragraph style properties. */
    readonly style?: {
        /**
         * Run style properties for the numbering text. Its highlight, math and revision aren't written, since Office
         * doesn't allow them for a level's number.
         */
        readonly run?: IRunStylePropertiesOptions;
        /** Paragraph style properties for the level. */
        readonly paragraph?: ILevelParagraphStylePropertiesOptions;
        /**
         * The paragraph style id that the level should be associated with.
         *
         * https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.paragraphstyleidinlevel?view=openxml-3.0.1
         */
        readonly style?: string;
    };
};

export declare type ILineNumberAttributes = {
    /**
     * Specifies the line number increments to be displayed in the current document.
     *
     * Although each line has an associated line number, only lines which are an even multiple of this value shall be displayed.
     *
     * ### Example
     *
     * ```xml
     * <w:lnNumType … w:countBy="5"/>
     * ```
     *
     * This setting ensures that only lines whose number is a multiple of  (e.g. 5, 10, and 15) will have a line number displayed. ]
     *
     * The possible values for this attribute are defined by the ST_DecimalNumber simple type (§2.18.16).
     */
    readonly countBy?: number;
    /**
     * ## Line Numbering Starting Value
     *
     * Specifies the starting value used for the first line whenever the line numbering is restarted by use of the `restart` attribute.
     *
     * ### Example
     *
     * ```xml
     * <w:lnNumType w:start="3" w:countBy="5"/>
     * ```
     *
     * The `start` attribute specifies that line numbers shall be counted starting from the number 3.
     *
     * The possible values for this attribute are defined by the ST_DecimalNumber simple type (§2.18.16).
     */
    readonly start?: number;
    /**
     * ## Line Numbering Restart Setting
     *
     * Specifies when the line numbering in this section shall be reset to the line number specified by the `start` attribute's value.
     *
     * The line numbering increments for each line (even if it is not displayed) until it reaches the restart point specified by this element.
     *
     * ### Example
     *
     * ```xml
     * <w:sectPr>
     *   ...
     *   <w:lnNumType w:restart="newPage" ... />
     * </w:sectPr>
     * ```
     *
     * The value of `newPage` specifies that the line numbers shall restart at the top of each page to the value specified by the `start` attribute. In this case, `newPage` is the default, so this value could have been omitted entirely.
     *
     * The possible values for this attribute are defined by the ST_LineNumberRestart simple type (§2.18.54).
     */
    readonly restart?: (typeof LineNumberRestartFormat)[keyof typeof LineNumberRestartFormat];
    /**
     * Specifies the distance between the text margin and the edge of any line numbers appearing in that section.
     *
     * ```xml
     * <w:lnNumType ... w:distance="720"/>
     * ```
     *
     * The possible values for this attribute are defined by the ST_TwipsMeasure simple type (§2.18.105).
     */
    readonly distance?: number | PositiveUniversalMeasure;
};

/**
 * Represents an image in a WordprocessingML document.
 *
 * ImageRun embeds an image within a run, supporting various formats
 * including JPG, PNG, GIF, BMP, and SVG. Optionally wraps the run in
 * `<w:ins>` or `<w:del>`, or both, for track-change insertion/deletion markup.
 *
 * Reference: http://officeopenxml.com/drwPicInline.php
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * new ImageRun({
 *   data: fs.readFileSync("./image.png"),
 *   transformation: {
 *     width: 100,
 *     height: 100,
 *   },
 *   type: "png",
 * });
 * ```
 */
export declare class ImageRun extends XmlComponent {
    private readonly imageData;
    constructor(options: IImageOptions);
    prepForXml(context: IContext): IXmlableObject | undefined;
}

/**
 * Margin distances around a floating drawing in EMUs.
 */
export declare type IMargins = {
    readonly left?: number;
    readonly bottom?: number;
    readonly top?: number;
    readonly right?: number;
};

/**
 * Options for creating a MathFraction.
 *
 * @see {@link MathFraction}
 */
export declare type IMathFractionOptions = {
    /** Math components for the numerator (top) of the fraction */
    readonly numerator: readonly MathComponent[];
    /** Math components for the denominator (bottom) of the fraction */
    readonly denominator: readonly MathComponent[];
    /**
     * How the fraction is drawn: stacked, skewed, linear, or stacked with no bar.
     * @default "stacked"
     */
    readonly type?: MathFractionType;
};

/**
 * Options for creating a MathFunction.
 *
 * @see {@link MathFunction}
 */
export declare type IMathFunctionOptions = {
    /** The function argument (e.g., the expression inside sin(...)) */
    readonly children: readonly MathComponent[];
    /** The function name (e.g., "sin", "cos", "log") */
    readonly name: readonly MathComponent[];
};

/**
 * Options for creating a MathIntegral.
 *
 * @see {@link MathIntegral}
 */
export declare type IMathIntegralOptions = {
    /** The integrand expression */
    readonly children: readonly MathComponent[];
    /** Optional lower bound of integration */
    readonly subScript?: readonly MathComponent[];
    /** Optional upper bound of integration */
    readonly superScript?: readonly MathComponent[];
    /**
     * Where the limits go: above and below the ∫, or to its right.
     * @default "side"
     */
    readonly limits?: MathLimitsPosition;
};

/**
 * Options for creating a MathLimitLower.
 *
 * @see {@link MathLimitLower}
 */
export declare type IMathLimitLowerOptions = {
    /** The base expression */
    readonly children: readonly MathComponent[];
    /** The limit expression that appears below the base */
    readonly limit: readonly MathComponent[];
};

/**
 * Options for creating a MathLimitUpper.
 *
 * @see {@link MathLimitUpper}
 */
export declare type IMathLimitUpperOptions = {
    /** The base expression */
    readonly children: readonly MathComponent[];
    /** The limit expression that appears above the base */
    readonly limit: readonly MathComponent[];
};

/**
 * Options for creating a Math element.
 *
 * @see {@link Math}
 */
export declare type IMathOptions = {
    /** Array of math components (fractions, radicals, runs, etc.) */
    readonly children: readonly MathComponent[];
};

/**
 * Options for creating a MathPreSubSuperScript.
 *
 * @see {@link MathPreSubSuperScript}
 */
export declare type IMathPreSubSuperScriptOptions = {
    /** The base expression */
    readonly children: readonly MathComponent[];
    /** The pre-subscript expression (appears lower-left of base) */
    readonly subScript: readonly MathComponent[];
    /** The pre-superscript expression (appears upper-left of base) */
    readonly superScript: readonly MathComponent[];
};

/**
 * Options for creating a MathRadical.
 *
 * @see {@link MathRadical}
 */
export declare type IMathRadicalOptions = {
    /** The content under the radical sign */
    readonly children: readonly MathComponent[];
    /** Optional degree of the root (e.g., 3 for cube root). If omitted, square root is assumed. */
    readonly degree?: readonly MathComponent[];
};

/**
 * Options for creating a MathSubScript.
 *
 * @see {@link MathSubScript}
 */
export declare type IMathSubScriptOptions = {
    /** The base expression */
    readonly children: readonly MathComponent[];
    /** The subscript expression */
    readonly subScript: readonly MathComponent[];
};

/**
 * Options for creating a MathSubSuperScript.
 *
 * @see {@link MathSubSuperScript}
 */
export declare type IMathSubSuperScriptOptions = {
    /** The base expression */
    readonly children: readonly MathComponent[];
    /** The subscript expression */
    readonly subScript: readonly MathComponent[];
    /** The superscript expression */
    readonly superScript: readonly MathComponent[];
};

/**
 * Options for creating a MathSum.
 *
 * @see {@link MathSum}
 */
export declare type IMathSumOptions = {
    /** The expression being summed */
    readonly children: readonly MathComponent[];
    /** Optional lower bound (subscript) of the sum */
    readonly subScript?: readonly MathComponent[];
    /** Optional upper bound (superscript) of the sum */
    readonly superScript?: readonly MathComponent[];
    /**
     * Where the limits go: above and below the ∑, or to its right.
     * @default "aboveBelow"
     */
    readonly limits?: MathLimitsPosition;
};

/**
 * Options for creating a MathSuperScript.
 *
 * @see {@link MathSuperScript}
 */
export declare type IMathSuperScriptOptions = {
    /** The base expression */
    readonly children: readonly MathComponent[];
    /** The superscript (exponent) expression */
    readonly superScript: readonly MathComponent[];
};

export declare type IMediaData = (RegularMediaData | SvgMediaData) & CoreMediaData;

export declare type IMediaDataTransformation = {
    readonly offset?: {
        readonly pixels: {
            readonly x: number;
            readonly y: number;
        };
        readonly emus?: {
            readonly x: number;
            readonly y: number;
        };
    };
    readonly pixels: {
        /** Width in pixels */
        readonly x: number;
        /** Height in pixels */
        readonly y: number;
    };
    /** Display dimensions in EMUs (English Metric Units) */
    readonly emus: {
        /** Width in EMUs (1 inch = 914400 EMUs) */
        readonly x: number;
        /** Height in EMUs (1 inch = 914400 EMUs) */
        readonly y: number;
    };
    /** Optional flip transformations */
    readonly flip?: {
        /** Whether to flip the image vertically */
        readonly vertical?: boolean;
        /** Whether to flip the image horizontally */
        readonly horizontal?: boolean;
    };
    /** Optional rotation angle in degrees */
    readonly rotation?: number;
};

/**
 * Transformation options for media display.
 *
 * Specifies how an image should be transformed when displayed in the document.
 */
export declare type IMediaTransformation = {
    readonly offset?: {
        readonly top?: number;
        readonly left?: number;
    };
    readonly width: number;
    /** Display height in pixels */
    readonly height: number;
    /** Optional flip transformations */
    readonly flip?: {
        /** Whether to flip the image vertically */
        readonly vertical?: boolean;
        /** Whether to flip the image horizontally */
        readonly horizontal?: boolean;
    };
    /** Optional rotation angle in degrees */
    readonly rotation?: number;
};

/**
 * Represents attributes for imported root elements.
 *
 * This class is used internally to handle attributes on root elements
 * that are being imported from external XML. It passes through the
 * attributes without transformation.
 *
 * @example
 * ```typescript
 * const attrs = new ImportedRootElementAttributes({
 *   "xmlns:w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
 * });
 * ```
 */
export declare class ImportedRootElementAttributes extends XmlComponent {
    private readonly _attr;
    /**
     * Creates an ImportedRootElementAttributes component.
     *
     * @param _attr - The attributes object to pass through
     */
    constructor(_attr: any);
    /**
     * Prepares the attributes for XML serialization.
     *
     * @param _ - Context (unused)
     * @returns Object with _attr key containing the raw attributes
     */
    prepForXml(_: IContext): IXmlableObject;
}

/**
 * XML component representing imported XML content.
 *
 * ImportedXmlComponent allows you to parse XML strings and incorporate them
 * into the document structure. This is particularly useful when working with
 * templates or when you need to include pre-existing XML fragments.
 *
 * @example
 * ```typescript
 * // Parse XML string into component tree
 * const component = ImportedXmlComponent.fromXmlString(
 *   '<w:p><w:r><w:t>Hello World</w:t></w:r></w:p>'
 * );
 *
 * // Manually create an imported component
 * const element = new ImportedXmlComponent("w:customElement", { "w:val": "value" });
 * element.push(new ImportedXmlComponent("w:child"));
 * ```
 */
export declare class ImportedXmlComponent extends XmlComponent {
    /**
     * Parses an XML string and converts it to an ImportedXmlComponent tree.
     *
     * This static method is the primary way to import external XML content.
     * It uses xml-js to parse the XML string into a JSON representation,
     * then converts that into a tree of XmlComponent objects.
     *
     * @param importedContent - The XML content as a string
     * @returns An ImportedXmlComponent representing the parsed XML
     *
     * @example
     * ```typescript
     * const xml = '<w:p><w:r><w:t>Hello</w:t></w:r></w:p>';
     * const component = ImportedXmlComponent.fromXmlString(xml);
     * ```
     */
    static fromXmlString(importedContent: string): ImportedXmlComponent;
    /**
     * Creates an ImportedXmlComponent.
     *
     * @param rootKey - The XML element name
     * @param _attr - Optional attributes for the root element
     */
    constructor(rootKey: string, _attr?: any);
    /**
     * Adds a child component or text to this element.
     *
     * @param xmlComponent - The child component or text string to add
     */
    push(xmlComponent: XmlComponent | string): void;
}

/**
 * XML component that can be initialized from another component.
 *
 * InitializableXmlComponent extends XmlComponent to support copying the internal
 * state (root array) from another component. This is useful when you need to
 * create a new component that shares or extends the children of an existing component.
 *
 * @example
 * ```typescript
 * class MyElement extends InitializableXmlComponent {
 *   constructor(init?: MyElement) {
 *     super("w:myElement", init);
 *     // If init is provided, this.root is copied from init
 *     // Otherwise, this.root is an empty array
 *   }
 * }
 *
 * const element1 = new MyElement();
 * element1.addChildElement(new TextRun("Hello"));
 *
 * const element2 = new MyElement(element1);
 * // element2 now has the same children as element1
 * ```
 */
export declare abstract class InitializableXmlComponent extends XmlComponent {
    /**
     * Creates a new InitializableXmlComponent.
     *
     * @param rootKey - The XML element name
     * @param initComponent - Optional component to copy children from
     */
    constructor(rootKey: string, initComponent?: InitializableXmlComponent);
}

declare type INonVisualShapePropertiesOptions = {
    readonly txBox: string;
};

/**
 * Supported input data types for document patching.
 *
 * The patcher can accept documents in various formats including buffers,
 * arrays, and streams.
 */
export declare type InputDataType = Buffer | string | number[] | Uint8Array | ArrayBuffer | Blob | NodeJS.ReadableStream | default_2;

export declare class InsertedTableCell extends XmlComponent {
    constructor(options: IChangedAttributesProperties);
}

export declare class InsertedTableRow extends XmlComponent {
    constructor(options: IChangedAttributesProperties);
}

/**
 * Represents an inserted text run in a tracked changes document.
 *
 * An insertion marks text that has been added to the document as part of
 * revision tracking. It wraps a standard text run with metadata about who
 * made the insertion and when.
 *
 * Reference: http://officeopenxml.com/WPtrackChanges.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="ins" type="CT_RunTrackChange" minOccurs="0"/>
 *
 * <xsd:complexType name="CT_RunTrackChange">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_TrackChange">
 *       <xsd:choice minOccurs="0" maxOccurs="unbounded">
 *         <xsd:group ref="EG_ContentRunContent"/>
 *         <xsd:group ref="m:EG_OMathMathElements"/>
 *       </xsd:choice>
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create an inserted text run
 * new InsertedTextRun({
 *   id: 1,
 *   author: "John Doe",
 *   date: "2024-01-15T10:30:00Z",
 *   text: "This text was added",
 *   bold: true
 * });
 * ```
 */
export declare class InsertedTextRun extends XmlComponent {
    constructor(options: IInsertedRunOptions);
}

/**
 * Represents an internal hyperlink to a bookmark within the document.
 *
 * Internal hyperlinks use the anchor attribute to reference a bookmark by name.
 * The bookmark must exist in the document for the hyperlink to function.
 *
 * Reference: http://officeopenxml.com/WPhyperlink.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="hyperlink" type="CT_Hyperlink"/>
 *
 * <xsd:complexType name="CT_Hyperlink">
 *   <xsd:group ref="EG_PContent" minOccurs="0" maxOccurs="unbounded"/>
 *   <xsd:attribute name="anchor" type="s:ST_String" use="optional"/>
 *   <xsd:attribute name="history" type="s:ST_OnOff" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create a bookmark
 * new Bookmark({
 *   id: "section1",
 *   children: [new TextRun("Section 1")],
 * });
 *
 * // Link to the bookmark
 * new InternalHyperlink({
 *   children: [new TextRun({ text: "Go to Section 1", style: "Hyperlink" })],
 *   anchor: "section1",
 * });
 * ```
 */
export declare class InternalHyperlink extends ConcreteHyperlink {
    constructor(options: IInternalHyperlinkOptions);
}

export declare type INumberedItemReferenceOptions = {
    /**
     * \h option - Creates a hyperlink to the bookmarked paragraph.
     * @default true
     */
    readonly hyperlink?: boolean;
    /**
     * which switch to use for the reference format
     * @default NumberedItemReferenceFormat.FULL_CONTEXT
     */
    readonly referenceFormat?: NumberedItemReferenceFormat;
};

/**
 * Options for configuring numbering definitions.
 *
 * @property config - Array of numbering configurations
 *
 * @see {@link Numbering}
 */
export declare type INumberingOptions = {
    /** Array of numbering configurations, each with levels and a reference name. */
    readonly config: readonly {
        /** Array of level definitions for this numbering configuration. */
        readonly levels: readonly ILevelsOptions[];
        /** Unique reference name for this numbering configuration. */
        readonly reference: string;
    }[];
};

/**
 * Options for overriding a specific level in a numbering instance.
 *
 * @property num - The level number to override (0-8)
 * @property start - The starting number for this level
 */
declare type IOverrideLevel = {
    /** The level number to override (0-8). */
    readonly num: number;
    /** The starting number for this level. */
    readonly start?: number;
};

/**
 * Attributes for configuring page border behavior.
 *
 * @property display - Which pages display the border
 * @property offsetFrom - Whether border is positioned relative to page or text
 * @property zOrder - Whether border appears in front or behind page contents
 */
export declare type IPageBorderAttributes = {
    /** Which pages display the border */
    readonly display?: (typeof PageBorderDisplay)[keyof typeof PageBorderDisplay];
    /** Whether border is positioned relative to page or text (default: text) */
    readonly offsetFrom?: (typeof PageBorderOffsetFrom)[keyof typeof PageBorderOffsetFrom];
    /** Whether border appears in front or behind page contents (default: front) */
    readonly zOrder?: (typeof PageBorderZOrder)[keyof typeof PageBorderZOrder];
};

/**
 * Options for configuring page borders.
 *
 * @property pageBorders - General page border attributes (display, offset, z-order)
 * @property pageBorderTop - Top border styling
 * @property pageBorderRight - Right border styling
 * @property pageBorderBottom - Bottom border styling
 * @property pageBorderLeft - Left border styling
 */
export declare type IPageBordersOptions = {
    /** General page border attributes (display, offset, z-order) */
    readonly pageBorders?: IPageBorderAttributes;
    /** Top border styling */
    readonly pageBorderTop?: IBorderOptions;
    /** Right border styling */
    readonly pageBorderRight?: IBorderOptions;
    /** Bottom border styling */
    readonly pageBorderBottom?: IBorderOptions;
    /** Left border styling */
    readonly pageBorderLeft?: IBorderOptions;
};

/**
 * Options for configuring page margins.
 *
 * All measurements are in twips (1/20th of a point) or universal measure.
 *
 * @property top - Top margin
 * @property right - Right margin
 * @property bottom - Bottom margin
 * @property left - Left margin
 * @property header - Header margin (distance from top of page to header)
 * @property footer - Footer margin (distance from bottom of page to footer)
 * @property gutter - Gutter margin for binding
 */
export declare type IPageMarginAttributes = {
    /** Top margin in twips or universal measure */
    readonly top?: number | UniversalMeasure;
    /** Right margin in twips or universal measure */
    readonly right?: number | PositiveUniversalMeasure;
    /** Bottom margin in twips or universal measure */
    readonly bottom?: number | UniversalMeasure;
    /** Left margin in twips or universal measure */
    readonly left?: number | PositiveUniversalMeasure;
    /** Header margin (distance from top of page to header) in twips or universal measure */
    readonly header?: number | PositiveUniversalMeasure;
    /** Footer margin (distance from bottom of page to footer) in twips or universal measure */
    readonly footer?: number | PositiveUniversalMeasure;
    /** Gutter margin for binding in twips or universal measure */
    readonly gutter?: number | PositiveUniversalMeasure;
};

/**
 * Options for configuring page numbering.
 *
 * @property start - Starting page number for the section
 * @property formatType - Number format (decimal, roman, letter, etc.)
 * @property separator - Separator between chapter and page number
 */
export declare type IPageNumberTypeAttributes = {
    /** Starting page number for the section */
    readonly start?: number;
    /** Number format (decimal, roman, letter, etc., default: decimal) */
    readonly formatType?: (typeof NumberFormat)[keyof typeof NumberFormat];
    /** Separator between chapter and page number (default: hyphen) */
    readonly separator?: (typeof PageNumberSeparator)[keyof typeof PageNumberSeparator];
};

/**
 * Options for page reference fields.
 *
 * @see {@link PageReference}
 */
export declare type IPageReferenceOptions = {
    /**
     * \h option - Creates a hyperlink to the bookmarked paragraph.
     */
    readonly hyperlink?: boolean;
    /**
     * \p option - Causes the field to display its position relative to the source
     *  bookmark. If the PAGEREF field is on the same page as the
     *  bookmark, it omits "on page #" and returns "above" or "below"
     *  only. If the PAGEREF field is not on the same page as the
     *  bookmark, the string "on page #" is used.
     */
    readonly useRelativePosition?: boolean;
};

export declare type IPageSizeAttributes = {
    /**
     * ## Page Width
     *
     * This attribute indicates the width (in twentieths of a point) for all pages in the current section.
     *
     * ### Example
     *
     * ```xml
     * <w:pgSz w:w="15840" w:h="12240" />
     * ```
     *
     * All pages in this section are displayed on a page that is 15840 twentieths of a point (11") wide.
     *
     * The possible values for this attribute are defined by the ST_TwipsMeasure simple type (§2.18.105).
     */
    readonly width: number | PositiveUniversalMeasure;
    /**
     * ## Page Height
     *
     * Specifies the height (in twentieths of a point) for all pages in the current section.
     *
     * ### Example
     *
     * ```xml
     * <w:pgSz w:w="15840" w:h="12240" />
     * ```
     *
     * All pages in this section are displayed on a page that is `12240` twentieths of a point (`8.5"`) tall.
     *
     * The possible values for this attribute are defined by the `ST_TwipsMeasure` simple type (§2.18.105).
     */
    readonly height: number | PositiveUniversalMeasure;
    /**
     * ## Page Orientation
     *
     * Specifies the orientation of all pages in this section.
     *
     * This information is used to determine the actual paper size to use on the printer.
     *
     * This implies that the actual paper size width and height are reversed for pages in this section. If this attribute is omitted, then portrait shall be implied.
     *
     * ### Example
     *
     * ```xml
     * <w:pgSz w:w="15840" w:h="12240" w:orient="landscape" />
     * ```
     *
     * Although the page width is 11", and page height is 8.5", according to the `w` and `h` attributes, because the `orient` attribute is set to landscape, pages in this section are printed on 8.5x11" paper in landscape mode.
     *
     * The possible values for this attribute are defined by the `ST_PageOrientation` simple type (§2.18.71).
     */
    readonly orientation?: (typeof PageOrientation)[keyof typeof PageOrientation];
    /**
     * ## Printer Paper Code
     *
     * Specifies a printer-specific paper code for the paper type, which shall be used by the printer for pages in this section.
     *
     * This code is stored to ensure the proper paper type is chosen if the specified paper size matches the sizes of multiple paper types supported by the current printer.
     *
     * It will be sent to the printer and used by the printer to determine the appropriate paper type to use when printing.
     *
     * This value is not interpreted or modified other than storing it as specified by the printer.
     *
     * The possible values for this attribute are defined by the `ST_DecimalNumber` simple type (§2.18.16).
     */
    readonly code?: number;
};

/**
 * Options for creating a Paragraph element.
 *
 * @property text - Simple text content for the paragraph (creates a single TextRun)
 * @property children - Array of child elements (runs, hyperlinks, bookmarks, etc.)
 */
export declare type IParagraphOptions = {
    /** Simple text content for the paragraph. Creates a single TextRun. */
    readonly text?: string;
    /** Array of child elements such as TextRun, ImageRun, Hyperlink, Bookmark, etc. */
    readonly children?: readonly ParagraphChild[];
} & IParagraphPropertiesOptions;

export declare type IParagraphPropertiesChangeOptions = IChangedAttributesProperties & IParagraphPropertiesOptionsBase;

/**
 * Options that control how a {@link ParagraphProperties} element is assembled, as opposed to what it contains.
 */
export declare type IParagraphPropertiesConfig = {
    /**
     * Whether `bullet` and `numbering` paragraphs that do not name a style of their own are given
     * Word's built-in `ListParagraph` style through an implicit `w:pStyle`.
     *
     * This is the default for document paragraphs, so that list items pick up the built-in list formatting.
     * Paragraph style, numbering level and document default definitions must pass `false`: a `w:pStyle`
     * inside a definition is not how a definition inherits from another style (that is `basedOn`), and
     * Word has been observed to fall back to `ListParagraph` instead of applying the custom style when it finds one there.
     *
     * @default true
     */
    readonly implicitListParagraphStyle?: boolean;
};

/**
 * Options for configuring paragraph properties.
 *
 * These options control all aspects of paragraph formatting including
 * alignment, spacing, indentation, borders, numbering, and more.
 *
 * Reference: http://officeopenxml.com/WPparagraphProperties.php
 */
export declare type IParagraphPropertiesOptions = {
    readonly revision?: IParagraphPropertiesChangeOptions;
    readonly includeIfEmpty?: boolean;
} & IParagraphPropertiesOptionsBase;

export declare type IParagraphPropertiesOptionsBase = {
    /** Heading level (Heading1, Heading2, etc.) - applies predefined heading style */
    readonly heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
    /** Whether to render text right-to-left for bidirectional languages */
    readonly bidirectional?: boolean;
    /** Whether to insert a page break before this paragraph */
    readonly pageBreakBefore?: boolean;
    /** Custom tab stop positions and alignments */
    readonly tabStops?: readonly TabStopDefinition[];
    /** Style ID to apply to this paragraph */
    readonly style?: string;
    /** Bullet list configuration */
    readonly bullet?: {
        /** Indentation level for the bullet (0-8) */
        readonly level: number;
    };
    /** Whether to prevent single lines at top/bottom of page (widow/orphan control) */
    readonly widowControl?: boolean;
    /** Frame properties for positioning the paragraph */
    readonly frame?: IFrameOptions;
    /** Whether to suppress line numbers for this paragraph */
    readonly suppressLineNumbers?: boolean;
    /** Whether to allow word wrapping */
    readonly wordWrap?: boolean;
    /** Whether to allow punctuation to extend beyond text margins */
    readonly overflowPunctuation?: boolean;
    /** Character scaling percentage (e.g., 200 for 200%) */
    readonly scale?: number;
    /**
     * This element specifies whether inter-character spacing shall automatically be adjusted between regions of numbers and regions of East Asian text in the current paragraph. These regions shall be determined by the Unicode character values of the text content within the paragraph.
     * This only works in Microsoft Word. It is not part of the ECMA-376 OOXML standard.
     */
    readonly autoSpaceEastAsianText?: boolean;
    /**
     * Run properties to apply to all runs in the paragraph.
     * Reference: ECMA-376, 3rd Edition (June, 2011), Fundamentals and Markup Language Reference § 17.3.1.29.
     */
    readonly run?: IParagraphRunOptions;
} & IParagraphStylePropertiesOptions;

export declare type IParagraphRunOptions = IRunOptionsBase & IParagraphRunPropertiesOptions;

export declare type IParagraphRunPropertiesOptions = {
    readonly insertion?: IChangedAttributesProperties;
    readonly deletion?: IChangedAttributesProperties;
} & IRunPropertiesOptions;

/**
 * Options for creating a paragraph style.
 *
 * @property id - Unique identifier for the paragraph style
 */
export declare type IParagraphStyleOptions = {
    /** Unique identifier for the paragraph style */
    readonly id: string;
} & IBaseParagraphStyleOptions;

/**
 * Paragraph style properties options.
 *
 * These properties are used when defining paragraph styles and include
 * border, shading, and numbering options in addition to level properties.
 */
export declare type IParagraphStylePropertiesOptions = {
    /** Border settings for the paragraph */
    readonly border?: IBordersOptions;
    /** Background shading/fill color for the paragraph */
    readonly shading?: IShadingAttributesProperties;
    /** Numbering configuration for lists, or false to remove numbering */
    readonly numbering?: {
        /** Reference ID of the numbering definition to use */
        readonly reference: string;
        /** Level in the numbering hierarchy (0-8) */
        readonly level: number;
        /** Instance number for multiple lists with same reference */
        readonly instance?: number;
        /**
         * Whether the numbering is fully custom, in which case the paragraph is not given the
         * built-in `ListParagraph` style. Only affects document paragraphs; style, numbering level
         * and document default definitions never receive that style.
         */
        readonly custom?: boolean;
    } | false;
} & ILevelParagraphStylePropertiesOptions;

/**
 * Union type representing all patch types.
 */
export declare type IPatch = ParagraphPatch | FilePatch;

/**
 * Options for configuring document properties.
 *
 * @property sections - Document section configurations
 * @property title - Document title
 * @property subject - Document subject
 * @property creator - Document creator/author
 * @property keywords - Document keywords for searchability
 * @property description - Document description
 * @property lastModifiedBy - User who last modified the document
 * @property revision - Revision number
 * @property externalStyles - External stylesheet reference
 * @property styles - Document styles configuration
 * @property numbering - Numbering configuration
 * @property comments - Document comments configuration
 * @property footnotes - Document footnotes
 * @property background - Document background settings
 * @property features - Document features like track changes
 * @property compatabilityModeVersion - Compatibility mode version
 * @property compatibility - Compatibility settings
 * @property customProperties - Custom document properties
 * @property evenAndOddHeaderAndFooters - Enable different headers/footers for even/odd pages
 * @property defaultTabStop - Default tab stop width
 * @property fonts - Font configurations
 * @property hyphenation - Hyphenation settings
 * @property theme - The document's theme: its colors, and its fonts for headings and body text
 */
export declare type IPropertiesOptions = {
    readonly sections: readonly ISectionOptions[];
    readonly title?: string;
    readonly subject?: string;
    readonly creator?: string;
    readonly keywords?: string;
    readonly description?: string;
    readonly lastModifiedBy?: string;
    readonly revision?: number;
    readonly externalStyles?: string;
    readonly styles?: IStylesOptions;
    readonly numbering?: INumberingOptions;
    readonly comments?: ICommentsOptions;
    readonly footnotes?: Readonly<Record<string, {
        readonly children: readonly Paragraph[];
    }>>;
    readonly endnotes?: Readonly<Record<string, {
        readonly children: readonly Paragraph[];
    }>>;
    readonly background?: IDocumentBackgroundOptions;
    readonly features?: {
        readonly trackRevisions?: boolean;
        readonly updateFields?: boolean;
    };
    readonly compatabilityModeVersion?: number;
    readonly compatibility?: ICompatibilityOptions;
    readonly customProperties?: readonly ICustomPropertyOptions[];
    readonly evenAndOddHeaderAndFooters?: boolean;
    readonly defaultTabStop?: number;
    readonly fonts?: readonly FontOptions[];
    readonly hyphenation?: IHyphenationOptions;
    /**
     * The document's theme: its colors, and its fonts for headings and body text. Every document has a theme, Office's
     * from Office 2016 to 2021 unless the options change it
     */
    readonly theme?: IThemeOptions;
};

/**
 * Options for creating a Run element.
 *
 * The run element specifies a region of text with a common set of properties.
 * The children property can contain various inline content elements.
 *
 * @see {@link Run}
 */
export declare type IRunOptions = IRunOptionsBase & IRunPropertiesOptions;

declare type IRunOptionsBase = {
    readonly children?: readonly (FieldInstruction | (typeof PageNumber)[keyof typeof PageNumber] | FootnoteReferenceRun | AnnotationReference | CarriageReturn | ContinuationSeparator | DayLong | DayShort | EndnoteReference | FootnoteReferenceElement | LastRenderedPageBreak | MonthLong | MonthShort | NoBreakHyphen | PageNumberElement | Separator | SoftHyphen | Tab | YearLong | YearShort | XmlComponent | string)[];
    readonly break?: number;
    readonly text?: string;
};

/**
 * Options for run properties change tracking.
 *
 * Used for revision tracking when run properties have been modified.
 */
export declare type IRunPropertiesChangeOptions = {} & IRunPropertiesOptions & IChangedAttributesProperties;

/**
 * Options for configuring run properties.
 *
 * Extends IRunStylePropertiesOptions with a style reference.
 */
export declare type IRunPropertiesOptions = {
    /** Reference to a character style by name */
    readonly style?: string;
} & IRunStylePropertiesOptions;

/**
 * Run style properties options.
 *
 * These properties define the formatting that can be applied to a run of text,
 * including font, size, bold, italic, underline, color, and other character formatting.
 *
 * Reference: http://officeopenxml.com/WPtextFormatting.php
 */
export declare type IRunStylePropertiesOptions = {
    readonly noProof?: boolean;
    readonly bold?: boolean;
    readonly boldComplexScript?: boolean;
    readonly italics?: boolean;
    readonly italicsComplexScript?: boolean;
    readonly underline?: {
        readonly color?: string | ThemeColor;
        readonly type?: (typeof UnderlineType)[keyof typeof UnderlineType];
    };
    readonly effect?: (typeof TextEffect)[keyof typeof TextEffect];
    readonly emphasisMark?: {
        readonly type?: (typeof EmphasisMarkType)[keyof typeof EmphasisMarkType];
    };
    /** The text's color: a hex color such as `"FF0000"`, `"auto"`, or a color of the document's theme such as `{ theme: "accent1" }` */
    readonly color?: string | ThemeColor;
    readonly kern?: number | PositiveUniversalMeasure;
    readonly position?: UniversalMeasure;
    readonly size?: number | PositiveUniversalMeasure;
    readonly sizeComplexScript?: boolean | number | PositiveUniversalMeasure;
    readonly rightToLeft?: boolean;
    readonly smallCaps?: boolean;
    readonly allCaps?: boolean;
    readonly strike?: boolean;
    readonly doubleStrike?: boolean;
    readonly subScript?: boolean;
    readonly superScript?: boolean;
    /**
     * The font: a font name, a font for each character set, or one of the fonts of the document's theme, such as
     * `{ theme: "body" }`
     */
    readonly font?: string | IFontOptions | IFontAttributesProperties | IThemeFontReference;
    readonly highlight?: (typeof HighlightColor)[keyof typeof HighlightColor];
    /**
     * @deprecated Has no effect. WordprocessingML has no highlight of its own for complex script text: `highlight`
     * highlights all the run's text. docx used to write it as `w:highlightCs`, which is in no schema.
     */
    readonly highlightComplexScript?: boolean | string;
    readonly characterSpacing?: number;
    readonly shading?: IShadingAttributesProperties;
    readonly emboss?: boolean;
    readonly imprint?: boolean;
    readonly revision?: IRunPropertiesChangeOptions;
    readonly language?: ILanguageOptions;
    readonly border?: IBorderOptions;
    readonly snapToGrid?: boolean;
    readonly vanish?: boolean;
    readonly specVanish?: boolean;
    readonly scale?: number;
    readonly math?: boolean;
};

/**
 * Options for a document section.
 *
 * Each section can have its own headers, footers, and page properties.
 *
 * @property headers - Optional header definitions for the section
 * @property headers.default - Default header for all pages (when first/even not specified)
 * @property headers.first - Header for the first page of the section
 * @property headers.even - Header for even-numbered pages
 * @property footers - Optional footer definitions for the section
 * @property footers.default - Default footer for all pages (when first/even not specified)
 * @property footers.first - Footer for the first page of the section
 * @property footers.even - Footer for even-numbered pages
 * @property properties - Section properties such as page size, margins, and orientation
 * @property children - Array of content elements (paragraphs, tables, etc.) for this section
 */
export declare type ISectionOptions = {
    /** Optional header definitions for the section. */
    readonly headers?: {
        /** Default header for all pages (when first/even not specified). */
        readonly default?: Header;
        /** Header for the first page of the section. */
        readonly first?: Header;
        /** Header for even-numbered pages. */
        readonly even?: Header;
    };
    /** Optional footer definitions for the section. */
    readonly footers?: {
        /** Default footer for all pages (when first/even not specified). */
        readonly default?: Footer;
        /** Footer for the first page of the section. */
        readonly first?: Footer;
        /** Footer for even-numbered pages. */
        readonly even?: Footer;
    };
    /** Section properties such as page size, margins, and orientation. */
    readonly properties?: ISectionPropertiesOptions;
    /** Array of content elements (paragraphs, tables, etc.) for this section. */
    readonly children: readonly FileChild[];
};

export declare type ISectionPropertiesChangeOptions = IChangedAttributesProperties & ISectionPropertiesOptionsBase;

/**
 * Options for configuring section properties.
 *
 * This type defines all possible configuration options for a document section,
 * including page layout, margins, headers/footers, and numbering.
 *
 * @property page - Page-level settings (size, margins, borders, numbering, text direction)
 * @property grid - Document grid settings for East Asian typography
 * @property headerWrapperGroup - Header definitions for default, first, and even pages
 * @property footerWrapperGroup - Footer definitions for default, first, and even pages
 * @property lineNumbers - Line numbering settings
 * @property titlePage - Whether first page has different header/footer
 * @property verticalAlign - Vertical alignment of text on page
 * @property column - Column layout settings
 * @property type - Section break type (next page, continuous, etc.)
 *
 * @see {@link SectionProperties}
 */
export declare type ISectionPropertiesOptions = {
    readonly revision?: ISectionPropertiesChangeOptions;
} & ISectionPropertiesOptionsBase;

export declare type ISectionPropertiesOptionsBase = {
    /** Page-level settings including size, margins, borders, and text direction */
    readonly page?: {
        /** Page size and orientation */
        readonly size?: Partial<IPageSizeAttributes>;
        /** Page margins (top, bottom, left, right, header, footer, gutter) */
        readonly margin?: IPageMarginAttributes;
        /** Page numbering format and starting value */
        readonly pageNumbers?: IPageNumberTypeAttributes;
        /** Page border settings */
        readonly borders?: IPageBordersOptions;
        /** Text flow direction (horizontal or vertical) */
        readonly textDirection?: (typeof PageTextDirectionType)[keyof typeof PageTextDirectionType];
    };
    /** Document grid settings for precise East Asian character layout */
    readonly grid?: Partial<IDocGridAttributesProperties>;
    /** Header definitions for default, first, and even pages */
    readonly headerWrapperGroup?: IHeaderFooterGroup<HeaderWrapper>;
    /** Footer definitions for default, first, and even pages */
    readonly footerWrapperGroup?: IHeaderFooterGroup<FooterWrapper>;
    /** Line numbering settings for the section */
    readonly lineNumbers?: ILineNumberAttributes;
    /** Whether first page has different header/footer */
    readonly titlePage?: boolean;
    /** Vertical alignment of text on page (top, center, bottom, justified) */
    readonly verticalAlign?: SectionVerticalAlign;
    /** Column layout settings (count, spacing, equal width) */
    readonly column?: IColumnsAttributes;
    /** Section break type (next page, continuous, even page, odd page) */
    readonly type?: (typeof SectionType)[keyof typeof SectionType];
};

/**
 * Options for configuring document settings.
 *
 * @see {@link Settings}
 */
declare type ISettingsOptions = {
    /** @deprecated Use compatibility.version instead */
    readonly compatibilityModeVersion?: number;
    /** Enable different headers/footers for even and odd pages */
    readonly evenAndOddHeaders?: boolean;
    /** Enable track changes (revision marking) */
    readonly trackRevisions?: boolean;
    /** Update fields when document is opened */
    readonly updateFields?: boolean;
    /** Compatibility settings for older Word versions */
    readonly compatibility?: ICompatibilityOptions;
    /** Default distance between tab stops in twips */
    readonly defaultTabStop?: number;
    /** Hyphenation settings */
    readonly hyphenation?: IHyphenationOptions;
};

/**
 * Properties for configuring shading.
 *
 * @property fill - Background fill color in hex format (e.g., "FF0000" for red), or a color of the document's theme
 * @property color - Pattern color in hex format, or a color of the document's theme
 * @property type - Shading pattern type. Without one, the shading is clear: the fill color only
 */
export declare type IShadingAttributesProperties = {
    readonly fill?: string | ThemeColor;
    readonly color?: string | ThemeColor;
    readonly type?: (typeof ShadingType)[keyof typeof ShadingType];
};

/**
 * Properties for configuring paragraph spacing.
 *
 * All values are in twips (twentieths of a point) unless otherwise specified.
 *
 * @property after - Spacing after the paragraph in twips
 * @property before - Spacing before the paragraph in twips
 * @property line - Line spacing value in twips (interpretation depends on lineRule)
 * @property lineRule - How to interpret the line spacing value
 * @property beforeAutoSpacing - Use automatic spacing before the paragraph
 * @property afterAutoSpacing - Use automatic spacing after the paragraph
 */
export declare type ISpacingProperties = {
    /** Spacing after the paragraph in twips */
    readonly after?: number;
    /** Spacing before the paragraph in twips */
    readonly before?: number;
    /** Line spacing value in twips (interpretation depends on lineRule) */
    readonly line?: number;
    /** How to interpret the line spacing value */
    readonly lineRule?: (typeof LineRuleType)[keyof typeof LineRuleType];
    /** Use automatic spacing before the paragraph */
    readonly beforeAutoSpacing?: boolean;
    /** Use automatic spacing after the paragraph */
    readonly afterAutoSpacing?: boolean;
};

/**
 * Attributes for style elements.
 *
 * @property type - Type of style (paragraph, character, table, numbering)
 * @property styleId - Unique identifier for the style
 * @property default - Whether this is the default style for its type
 * @property customStyle - Whether this is a custom user-defined style
 */
declare type IStyleAttributes = {
    /** Type of style (paragraph, character, table, numbering) */
    readonly type?: string;
    /** Unique identifier for the style */
    readonly styleId?: string;
    /** Whether this is the default style for its type */
    readonly default?: boolean;
    /** Whether this is a custom user-defined style */
    readonly customStyle?: string;
};

/**
 * Options for configuring a style.
 *
 * @property name - Display name of the style
 * @property basedOn - Style ID that this style inherits from (must be same type)
 * @property next - Style to automatically apply to the next paragraph
 * @property link - Linked style ID for paragraph/character style pairing
 * @property uiPriority - Priority for displaying in the UI (lower numbers appear first)
 * @property semiHidden - Whether the style is semi-hidden in the UI
 * @property unhideWhenUsed - Whether the style should unhide when used
 * @property quickFormat - Whether the style appears in the quick format gallery
 */
declare type IStyleOptions = {
    /** Display name of the style */
    readonly name?: string;
    /**
     * Specifies the style upon which the current style is based-that is, the style from which the current style inherits. It is the mechanism for implementing style inheritance.
     * Note that if the type of the current style must match the type of the style upon which it is based or the basedOn element will be ignored.
     * However, if the current style is a numbering style, then the `basedOn` element is ignored.
     *
     * **WARNING**: You cannot set `basedOn` to be the same as `name`. This is akin to inheriting from itself. This creates a cyclic dependency and cause undesirable behavior.
     */
    readonly basedOn?: string;
    /** Style to automatically apply to the next paragraph */
    readonly next?: string;
    /** Linked style ID for paragraph/character style pairing */
    readonly link?: string;
    /** Priority for displaying in the UI (lower numbers appear first) */
    readonly uiPriority?: number;
    /** Whether the style is semi-hidden in the UI */
    readonly semiHidden?: boolean;
    /** Whether the style should unhide when used */
    readonly unhideWhenUsed?: boolean;
    /** Whether the style appears in the quick format gallery */
    readonly quickFormat?: boolean;
};

/**
 * Options for configuring document styles.
 *
 * @property default - Default styles for document, headings, and common elements
 * @property initialStyles - Initial base XML component for styles root element
 * @property paragraphStyles - Array of custom paragraph style definitions
 * @property characterStyles - Array of custom character style definitions
 * @property importedStyles - Array of styles imported from external sources
 *
 * @see {@link Styles}
 */
export declare type IStylesOptions = {
    /**
     * Default styles for document, headings, and common elements. With `externalStyles`, each one given here takes the
     * place of the external style with its id, or of the external document defaults
     */
    readonly default?: IDefaultStylesOptions;
    /** Initial base XML component for styles root element */
    readonly initialStyles?: BaseXmlComponent;
    /** Array of custom paragraph style definitions */
    readonly paragraphStyles?: readonly IParagraphStyleOptions[];
    /** Array of custom character style definitions */
    readonly characterStyles?: readonly ICharacterStyleOptions[];
    /** Array of styles imported from external sources */
    readonly importedStyles?: readonly (XmlComponent | StyleForParagraph | StyleForCharacter | ImportedXmlComponent)[];
};

/**
 * Options for creating a SymbolRun.
 *
 * @see {@link SymbolRun}
 */
export declare type ISymbolRunOptions = {
    /** The Unicode character code for the symbol */
    readonly char: string;
    /** The font to use for the symbol (e.g., "Wingdings", "Symbol") */
    readonly symbolfont?: string;
} & IRunOptions;

/**
 * Options for configuring table borders.
 *
 * Borders can be applied to the outside edges (top, bottom, left, right)
 * and inside lines (insideHorizontal, insideVertical) of the table.
 */
export declare type ITableBordersOptions = {
    readonly top?: IBorderOptions;
    readonly bottom?: IBorderOptions;
    readonly left?: IBorderOptions;
    readonly right?: IBorderOptions;
    readonly insideHorizontal?: IBorderOptions;
    readonly insideVertical?: IBorderOptions;
};

/**
 * Options for configuring table cell borders.
 *
 * Defines border settings for individual edges of a table cell. Border settings
 * can be specified for top, bottom, left, right, start, and end edges.
 *
 * @see {@link TableCellBorders}
 */
export declare type ITableCellBorders = {
    /** Border for the top edge of the cell */
    readonly top?: IBorderOptions;
    /** Border for the start edge (left in LTR, right in RTL) */
    readonly start?: IBorderOptions;
    /** Border for the left edge of the cell */
    readonly left?: IBorderOptions;
    /** Border for the bottom edge of the cell */
    readonly bottom?: IBorderOptions;
    /** Border for the end edge (right in LTR, left in RTL) */
    readonly end?: IBorderOptions;
    /** Border for the right edge of the cell */
    readonly right?: IBorderOptions;
};

/**
 * Options for configuring table cell margins.
 *
 * All margin values are specified in the units defined by `marginUnitType`.
 * If `marginUnitType` is not specified, values are in DXA (twentieths of a point).
 *
 * @example
 * ```typescript
 * // Set uniform margins of 100 twips on all sides
 * const margins: ITableCellMarginOptions = {
 *   top: 100,
 *   bottom: 100,
 *   left: 100,
 *   right: 100,
 * };
 *
 * // Set margins using percentage-based width
 * const percentMargins: ITableCellMarginOptions = {
 *   marginUnitType: WidthType.PERCENTAGE,
 *   left: 5,
 *   right: 5,
 * };
 * ```
 */
declare type ITableCellMarginOptions = {
    /**
     * The unit type for margin values.
     * Defaults to DXA (twentieths of a point) if not specified.
     *
     * @default WidthType.DXA
     */
    readonly marginUnitType?: (typeof WidthType)[keyof typeof WidthType];
    /**
     * Top margin (padding above cell content).
     * Value is in units specified by `marginUnitType`.
     */
    readonly top?: number;
    /**
     * Bottom margin (padding below cell content).
     * Value is in units specified by `marginUnitType`.
     */
    readonly bottom?: number;
    /**
     * Left margin (padding to the left of cell content).
     * Value is in units specified by `marginUnitType`.
     */
    readonly left?: number;
    /**
     * Right margin (padding to the right of cell content).
     * Value is in units specified by `marginUnitType`.
     */
    readonly right?: number;
};

/**
 * Options for creating a TableCell element.
 *
 * @see {@link TableCell}
 */
export declare type ITableCellOptions = {
    /** Array of Paragraph or nested Table elements that make up the cell content */
    readonly children: readonly (Paragraph | Table)[];
} & ITableCellPropertiesOptions;

declare type ITableCellPropertiesChangeOptions = ITableCellPropertiesOptionsBase & IChangedAttributesProperties;

/**
 * Options for configuring table cell properties.
 *
 * @see {@link TableCellProperties}
 */
declare type ITableCellPropertiesOptions = {
    readonly revision?: ITableCellPropertiesChangeOptions;
    readonly includeIfEmpty?: boolean;
} & ITableCellPropertiesOptionsBase;

declare type ITableCellPropertiesOptionsBase = {
    /** Shading (background color/pattern) for the cell */
    readonly shading?: IShadingAttributesProperties;
    /** Cell margins (padding) for the cell content */
    readonly margins?: ITableCellMarginOptions;
    /** Vertical alignment of content within the cell */
    readonly verticalAlign?: TableVerticalAlign;
    /** Text direction/flow within the cell */
    readonly textDirection?: (typeof TextDirection)[keyof typeof TextDirection];
    /** Vertical merge setting for the cell */
    readonly verticalMerge?: (typeof VerticalMergeType)[keyof typeof VerticalMergeType];
    /** Width specification for the cell */
    readonly width?: ITableWidthProperties;
    /** Number of columns this cell spans (horizontal merge) */
    readonly columnSpan?: number;
    /** Number of rows this cell spans (vertical merge) */
    readonly rowSpan?: number;
    /** Border settings for the cell edges */
    readonly borders?: ITableCellBorders;
    readonly insertion?: IChangedAttributesProperties;
    readonly deletion?: IChangedAttributesProperties;
    readonly cellMerge?: ICellMergeAttributes;
};

/**
 * Properties for table cell spacing.
 *
 * @see {@link createTableCellSpacing}
 */
declare type ITableCellSpacingProperties = {
    /** The spacing value (in twips, percentage, or universal measure) */
    readonly value: number | Percentage | UniversalMeasure;
    /** The type of measurement (defaults to DXA/twips) */
    readonly type?: (typeof CellSpacingType)[keyof typeof CellSpacingType];
};

export declare type ITableFloatOptions = {
    /**
     * Specifies the horizontal anchor or the base object from which the horizontal positioning in the
     * tblpX or tblpXSpec attribute should be determined.
     * margin - relative to the vertical edge of the text margin before any text runs (left edge for left-to-right paragraphs)
     * page - relative to the vertical edge of the page before any text runs (left edge for left-to-right paragraphs)
     * text - relative to the vertical edge of the text margin for the column in which the anchor paragraph is located
     * If omitted, the value is assumed to be page.
     */
    readonly horizontalAnchor?: (typeof TableAnchorType)[keyof typeof TableAnchorType];
    /**
     * Specifies an absolute horizontal position for the table, relative to the horizontalAnchor.
     * The value is in twentieths of a point. Note that the value can be negative, in which case the
     * table is positioned before the anchor object in the direction of horizontal text flow.
     * If relativeHorizontalPosition is also specified, then the absoluteHorizontalPosition attribute is ignored.
     * If the attribute is omitted, the value is assumed to be zero.
     */
    readonly absoluteHorizontalPosition?: number | UniversalMeasure;
    /**
     * Specifies a relative horizontal position for the table, relative to the horizontalAnchor attribute.
     * This will supersede the absoluteHorizontalPosition attribute.
     * Possible values are:
     * center - the table should be horizontally centered with respect to the anchor
     * inside - the table should be inside of the anchor
     * left - the table should be left aligned with respect to the anchor
     * outside - the table should be outside of the anchor
     * right - the table should be right aligned with respect to the anchor
     */
    readonly relativeHorizontalPosition?: (typeof RelativeHorizontalPosition)[keyof typeof RelativeHorizontalPosition];
    /**
     * Specifies the vertical anchor or the base object from which the vertical positioning
     * in the absoluteVerticalPosition attribute should be determined. Possible values are:
     * margin - relative to the horizontal edge of the text margin before any text runs (top edge for top-to-bottom paragraphs)
     * page - relative to the horizontal edge of the page before any text runs (top edge for top-to-bottom paragraphs)
     * text - relative to the horizontal edge of the text margin for the column in which the anchor paragraph is located
     * If omitted, the value is assumed to be page.
     */
    readonly verticalAnchor?: (typeof TableAnchorType)[keyof typeof TableAnchorType];
    /**
     * Specifies an absolute vertical position for the table, relative to the verticalAnchor anchor.
     * The value is in twentieths of a point. Note that the value can be negative, in which case the table is
     * positioned before the anchor object in the direction of vertical text flow.
     * If relativeVerticalPosition is also specified, then the absoluteVerticalPosition attribute is ignored.
     * If the attribute is omitted, the value is assumed to be zero.
     */
    readonly absoluteVerticalPosition?: number | UniversalMeasure;
    /**
     * Specifies a relative vertical position for the table, relative to the verticalAnchor attribute.
     * This will supersede the absoluteVerticalPosition attribute. Possible values are:
     * center - the table should be vertically centered with respect to the anchor
     * inside - the table should be vertically aligned to the edge of the anchor and inside the anchor
     * bottom - the table should be vertically aligned to the bottom edge of the anchor
     * outside - the table should be vertically aligned to the edge of the anchor and outside the anchor
     * inline - the table should be vertically aligned in line with the surrounding text (so as to not allow any text wrapping around it)
     * top - the table should be vertically aligned to the top edge of the anchor
     */
    readonly relativeVerticalPosition?: (typeof RelativeVerticalPosition)[keyof typeof RelativeVerticalPosition];
    /**
     * Specifies the minimum distance to be maintained between the table and the top of text in the paragraph
     * below the table. The value is in twentieths of a point. If omitted, the value is assumed to be zero.
     */
    readonly bottomFromText?: number | PositiveUniversalMeasure;
    /**
     * Specifies the minimum distance to be maintained between the table and the bottom edge of text in the paragraph
     * above the table. The value is in twentieths of a point. If omitted, the value is assumed to be zero.
     */
    readonly topFromText?: number | PositiveUniversalMeasure;
    /**
     * Specifies the minimum distance to be maintained between the table and the edge of text in the paragraph
     * to the left of the table. The value is in twentieths of a point. If omitted, the value is assumed to be zero.
     */
    readonly leftFromText?: number | PositiveUniversalMeasure;
    /**
     * Specifies the minimum distance to be maintained between the table and the edge of text in the paragraph
     * to the right of the table. The value is in twentieths of a point. If omitted, the value is assumed to be zero.
     */
    readonly rightFromText?: number | PositiveUniversalMeasure;
    /**
     * Specifies whether the table may overlap other floating tables. It is written in the table's properties as
     * w:tblOverlap, beside w:tblpPr.
     */
    readonly overlap?: (typeof OverlapType)[keyof typeof OverlapType];
};

declare type ITableGridChangeOptions = {
    readonly id: number;
    readonly columnWidths: readonly number[] | readonly PositiveUniversalMeasure[];
};

/**
 * Options for configuring table look conditional formatting.
 *
 * These options control which conditional formatting styles are applied
 * to the table. When a table style defines special formatting for these
 * regions (e.g., bold headers, alternating row colors), these flags
 * determine whether that special formatting is visible.
 *
 * @example
 * ```typescript
 * // Apply header row and first column formatting with horizontal banding
 * const tableLook: ITableLookOptions = {
 *   firstRow: true,      // Apply header row formatting
 *   firstColumn: true,   // Apply first column formatting
 *   noHBand: false,      // Enable horizontal row banding
 *   noVBand: true,       // Disable vertical column banding
 * };
 * ```
 */
export declare type ITableLookOptions = {
    /**
     * Apply first row conditional formatting.
     * When true, the first row of the table uses the special formatting
     * defined for header rows in the table style.
     */
    readonly firstRow?: boolean;
    /**
     * Apply last row conditional formatting.
     * When true, the last row of the table uses the special formatting
     * defined for total/footer rows in the table style.
     */
    readonly lastRow?: boolean;
    /**
     * Apply first column conditional formatting.
     * When true, the first column of the table uses the special formatting
     * defined for first columns in the table style.
     */
    readonly firstColumn?: boolean;
    /**
     * Apply last column conditional formatting.
     * When true, the last column of the table uses the special formatting
     * defined for last columns in the table style.
     */
    readonly lastColumn?: boolean;
    /**
     * Disable horizontal row banding.
     * When true, horizontal banding (alternating row colors) is disabled.
     * When false or undefined, horizontal banding is enabled if defined in the table style.
     */
    readonly noHBand?: boolean;
    /**
     * Disable vertical column banding.
     * When true, vertical banding (alternating column colors) is disabled.
     * When false or undefined, vertical banding is enabled if defined in the table style.
     */
    readonly noVBand?: boolean;
};

/**
 * Options for configuring a Table of Contents.
 *
 * These options control which content is included in the TOC and how it is formatted.
 * Options correspond to field switches in the TOC field code.
 *
 * Reference:
 * - https://www.ecma-international.org/publications/standards/Ecma-376.htm (Part 1, Page 1251)
 * - http://officeopenxml.com/WPtableOfContents.php
 */
export declare type ITableOfContentsOptions = {
    /**
     * \a option - Includes captioned items, but omits caption labels and numbers.
     * The identifier designated by text in this switch's field-argument corresponds to the caption label.
     * Use captionLabelIncludingNumbers (\c) to build a table of captions with labels and numbers.
     */
    readonly captionLabel?: string;
    /**
     * \b option - Includes entries only from the portion of the document marked by
     * the bookmark named by text in this switch's field-argument.
     */
    readonly entriesFromBookmark?: string;
    /**
     * \c option -  Includes figures, tables, charts, and other items that are numbered
     * by a SEQ field (§17.16.5.56). The sequence identifier designated by text in this switch's
     * field-argument, which corresponds to the caption label, shall match the identifier in the
     * corresponding SEQ field.
     */
    readonly captionLabelIncludingNumbers?: string;
    /**
     * \d option - When used with \s, the text in this switch's field-argument defines
     * the separator between sequence and page numbers. The default separator is a hyphen (-).
     */
    readonly sequenceAndPageNumbersSeparator?: string;
    /**
     * \f option - Includes only those TC fields whose identifier exactly matches the
     * text in this switch's field-argument (which is typically a letter).
     */
    readonly tcFieldIdentifier?: string;
    /**
     * \h option - Makes the table of contents entries hyperlinks.
     */
    readonly hyperlink?: boolean;
    /**
     * \l option - Includes TC fields that assign entries to one of the levels specified
     * by text in this switch's field-argument as a range having the form startLevel-endLevel,
     * where startLevel and endLevel are integers, and startLevel has a value equal-to or less-than endLevel.
     * TC fields that assign entries to lower levels are skipped.
     */
    readonly tcFieldLevelRange?: string;
    /**
     * \n option - Without field-argument, omits page numbers from the table of contents.
     * Page numbers are omitted from all levels unless a range of entry levels is specified by
     * text in this switch's field-argument. A range is specified as for \l.
     */
    readonly pageNumbersEntryLevelsRange?: string;
    /**
     * \o option -  Uses paragraphs formatted with all or the specified range of builtin
     * heading styles. Headings in a style range are specified by text in this switch's
     * field-argument using the notation specified as for \l, where each integer corresponds
     * to the style with a style ID of HeadingX (e.g. 1 corresponds to Heading1).
     * If no heading range is specified, all heading levels used in the document are listed.
     */
    readonly headingStyleRange?: string;
    /**
     * \p option - Text in this switch's field-argument specifies a sequence of characters
     * that separate an entry and its page number. The default is a tab with leader dots.
     */
    readonly entryAndPageNumberSeparator?: string;
    /**
     * \s option - For entries numbered with a SEQ field (§17.16.5.56), adds a prefix to the page number.
     * The prefix depends on the type of entry. text in this switch's field-argument shall match the
     * identifier in the SEQ field.
     */
    readonly seqFieldIdentifierForPrefix?: string;
    /**
     * \t field-argument Uses paragraphs formatted with styles other than the built-in heading styles.
     * Text in this switch's field-argument specifies those styles as a set of comma-separated doublets,
     * with each doublet being a comma-separated set of style name and table of content level.
     * \t can be combined with \o.
     */
    readonly stylesWithLevels?: readonly StyleLevel[];
    /**
     * \u Uses the applied paragraph outline level.
     */
    readonly useAppliedParagraphOutlineLevel?: boolean;
    /**
     * \w Preserves tab entries within table entries.
     */
    readonly preserveTabInEntries?: boolean;
    /**
     * \x Preserves newline characters within table entries.
     */
    readonly preserveNewLineInEntries?: boolean;
    /**
     * \z Hides tab leader and page numbers in web page view (§17.18.102).
     */
    readonly hideTabAndPageNumbersInWebView?: boolean;
};

/**
 * Options for creating a Table element.
 *
 * @see {@link Table}
 */
export declare type ITableOptions = {
    readonly rows: readonly TableRow[];
    /** Preferred width of the table. Defaults to auto. */
    readonly width?: ITableWidthProperties;
    /**
     * Widths of the grid columns (`w:tblGrid`) in twips (twentieths of a point).
     *
     * Word treats the grid as a hint and lays the table out from `width` and the cells'
     * widths, but Google Docs, Apple Pages and QuickLook lay the table out from the grid
     * alone and ignore percentage widths. When omitted, the grid is derived from `width`
     * and the cells' widths, resolved against the page (or, for nested tables, the
     * parent cell) when the document is packed, so the table renders the same in every
     * consumer. Supply explicit values to take full control of the grid.
     */
    readonly columnWidths?: readonly number[];
    readonly columnWidthsRevision?: ITableGridChangeOptions;
    readonly margins?: ITableCellMarginOptions;
    readonly indent?: ITableWidthProperties;
    readonly float?: ITableFloatOptions;
    readonly layout?: (typeof TableLayoutType)[keyof typeof TableLayoutType];
    readonly style?: string;
    readonly borders?: ITableBordersOptions;
    readonly alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    readonly visuallyRightToLeft?: boolean;
    readonly tableLook?: ITableLookOptions;
    readonly cellSpacing?: ITableCellSpacingProperties;
    readonly revision?: ITablePropertiesChangeOptions;
};

export declare type ITablePropertiesChangeOptions = ITablePropertiesOptions & IChangedAttributesProperties;

/**
 * Options for configuring table properties.
 *
 * @see {@link TableProperties}
 */
export declare type ITablePropertiesOptions = {
    readonly revision?: ITablePropertiesChangeOptions;
    readonly includeIfEmpty?: boolean;
} & ITablePropertiesOptionsBase;

export declare type ITablePropertiesOptionsBase = {
    readonly width?: ITableWidthProperties;
    readonly indent?: ITableWidthProperties;
    readonly layout?: (typeof TableLayoutType)[keyof typeof TableLayoutType];
    readonly borders?: ITableBordersOptions;
    readonly float?: ITableFloatOptions;
    readonly shading?: IShadingAttributesProperties;
    readonly style?: string;
    readonly alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    readonly cellMargin?: ITableCellMarginOptions;
    readonly visuallyRightToLeft?: boolean;
    readonly tableLook?: ITableLookOptions;
    readonly cellSpacing?: ITableCellSpacingProperties;
};

/**
 * Options for creating a TableRow element.
 *
 * @see {@link TableRow}
 */
export declare type ITableRowOptions = {
    /** Array of TableCell elements that make up the row */
    readonly children: readonly TableCell[];
} & ITableRowPropertiesOptions;

export declare type ITableRowPropertiesChangeOptions = ITableRowPropertiesOptionsBase & IChangedAttributesProperties;

/**
 * Options for configuring table row properties.
 *
 * @see {@link TableRowProperties}
 */
export declare type ITableRowPropertiesOptions = ITableRowPropertiesOptionsBase & {
    readonly insertion?: IChangedAttributesProperties;
    readonly deletion?: IChangedAttributesProperties;
    readonly revision?: ITableRowPropertiesChangeOptions;
    readonly includeIfEmpty?: boolean;
};

export declare type ITableRowPropertiesOptionsBase = {
    /** Whether the row can be split across pages (cantSplit) */
    readonly cantSplit?: boolean;
    /** Whether the row should be repeated as a header row on each page (tblHeader) */
    readonly tableHeader?: boolean;
    /** Row height configuration (trHeight) */
    readonly height?: {
        /** Height value in twips or as a PositiveUniversalMeasure */
        readonly value: number | PositiveUniversalMeasure;
        /** Height rule determining how the height value is applied */
        readonly rule: (typeof HeightRule)[keyof typeof HeightRule];
    };
    /** Spacing between cells in the row (tblCellSpacing) */
    readonly cellSpacing?: ITableCellSpacingProperties;
};

/**
 * Properties for specifying table or cell width.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_TblWidth">
 *   <xsd:attribute name="w" type="ST_MeasurementOrPercent"/>
 *   <xsd:attribute name="type" type="ST_TblWidth"/>
 * </xsd:complexType>
 * ```
 */
export declare type ITableWidthProperties = {
    readonly size: number | Percentage | UniversalMeasure;
    readonly type?: (typeof WidthType)[keyof typeof WidthType];
};

/**
 * Options for creating a Textbox.
 *
 * Extends paragraph options while replacing the style property with VML shape styling.
 *
 * @property style - VML shape style properties for positioning and sizing
 * @property children - Array of child elements (text runs, hyperlinks, etc.)
 */
declare type ITextboxOptions = Omit<IParagraphOptions, "style"> & {
    /** VML shape style properties for the textbox (positioning, sizing, wrapping, etc.) */
    readonly style?: VmlShapeStyle;
};

/**
 * Options for configuring text wrapping around a drawing.
 */
export declare type ITextWrapping = {
    readonly type: (typeof TextWrappingType)[keyof typeof TextWrappingType];
    readonly side?: (typeof TextWrappingSide)[keyof typeof TextWrappingSide];
    readonly margins?: IDistance;
};

/**
 * The colors of a document's theme, each a 6-digit hex color such as `"4472C4"`.
 *
 * Word shows these colors at the top of its color menus, and text, tables and shapes that use a theme color change
 * when the theme's colors change. The colors not given are Office's.
 *
 * @publicApi
 */
export declare type IThemeColorsOptions = {
    /** The dark color for text on a light background (`dk1`). Default is the system's window text color, black */
    readonly dark1?: string;
    /** The light color for backgrounds (`lt1`). Default is the system's window color, white */
    readonly light1?: string;
    /** A second dark color for text (`dk2`). Default is `"44546A"` */
    readonly dark2?: string;
    /** A second light color for backgrounds (`lt2`). Default is `"E7E6E6"` */
    readonly light2?: string;
    /** Default is `"4472C4"`, blue */
    readonly accent1?: string;
    /** Default is `"ED7D31"`, orange */
    readonly accent2?: string;
    /** Default is `"A5A5A5"`, gray */
    readonly accent3?: string;
    /** Default is `"FFC000"`, gold */
    readonly accent4?: string;
    /** Default is `"5B9BD5"`, light blue */
    readonly accent5?: string;
    /** Default is `"70AD47"`, green */
    readonly accent6?: string;
    /** The color of hyperlinks (`hlink`). Default is `"0563C1"` */
    readonly hyperlink?: string;
    /** The color of hyperlinks that have been followed (`folHlink`). Default is `"954F72"` */
    readonly followedHyperlink?: string;
};

/**
 * The fonts of one of a theme's fonts for each kind of script.
 *
 * @publicApi
 */
export declare type IThemeFontOptions = {
    /** The font for Latin text, such as English */
    readonly latin?: string;
    /** The font for East Asian text. By default Word picks a font for each East Asian language */
    readonly eastAsia?: string;
    /** The font for complex scripts, such as Arabic and Hebrew. By default Word picks a font for each script */
    readonly complexScript?: string;
};

/**
 * A font of the document's theme. Text in it changes font when the theme's fonts change.
 *
 * @publicApi
 */
export declare type IThemeFontReference = {
    /** The theme's font for headings (`major`) or for body text (`minor`) */
    readonly theme: ThemeFont;
};

/**
 * The fonts of a document's theme: a font name for Latin text, or fonts for each kind of script.
 *
 * Word lists them at the top of its font menu, as "(Headings)" and "(Body)". Text uses them when its font is
 * `{ theme: "headings" }` or `{ theme: "body" }`.
 *
 * @publicApi
 */
export declare type IThemeFontsOptions = {
    /** The font for headings (`majorFont`). Default is Calibri Light */
    readonly headings?: string | IThemeFontOptions;
    /** The font for body text (`minorFont`). Default is Calibri */
    readonly body?: string | IThemeFontOptions;
};

/**
 * Options for a document's theme. Anything not given is as Office's theme has it, from Office 2016 to 2021.
 *
 * @publicApi
 */
export declare type IThemeOptions = {
    /** The theme's name, as Word shows it. Default is `"Office Theme"` */
    readonly name?: string;
    /** The theme's colors */
    readonly colors?: IThemeColorsOptions;
    /** The theme's fonts for headings and body text */
    readonly fonts?: IThemeFontsOptions;
};

/**
 * Options for vertical positioning of a floating drawing.
 */
export declare type IVerticalPositionOptions = {
    /** The base from which vertical position is calculated */
    readonly relative?: (typeof VerticalPositionRelativeFrom)[keyof typeof VerticalPositionRelativeFrom];
    /** Alignment relative to the vertical base */
    readonly align?: (typeof VerticalPositionAlign)[keyof typeof VerticalPositionAlign];
    /** Offset in EMUs from the vertical base */
    readonly offset?: number;
};

/**
 * Interface for document view wrappers.
 *
 * ViewWrappers combine a document part (view) with its relationships,
 * providing a unified interface for managing document components.
 *
 * @property View - The document part (Document, Header, Footer, etc.)
 * @property Relationships - The relationships associated with this view
 */
declare type IViewWrapper = {
    readonly View: Document_2 | Footer_2 | Header_2 | FootNotes | Endnotes | XmlComponent;
    readonly Relationships: Relationships;
};

/**
 * Options for creating a VML shape.
 */
export declare type IVmlShapeOptions = {
    /** Unique identifier for the shape. */
    readonly id: string;
    /** Reference to a shape type definition, e.g. `#_x0000_t202` for a text box. */
    readonly type?: string;
    /** Styling properties for positioning and sizing the shape. */
    readonly style?: VmlShapeStyle;
    /** Size of the shape's coordinate space, e.g. `21600,21600`. */
    readonly coordinateSize?: string;
    /** Adjustment values for the shape's geometry, e.g. `10800`. */
    readonly adjustment?: string;
    /** Path defining the shape's geometry in VML path syntax. */
    readonly path?: string;
    /** Office preset shape type number (`o:spt`), e.g. `136` for plain WordArt or `75` for a picture frame. */
    readonly presetShapeType?: number;
    /** Whether the shape may be positioned inside a table cell (`o:allowincell`). */
    readonly allowInCell?: boolean;
    /** Alternative text for the shape. */
    readonly alt?: string;
    /** Title of the shape. */
    readonly title?: string;
    /** Fill colour: a named colour or a hex value prefixed with `#`. */
    readonly fillColor?: string;
    /** Whether the shape is filled. */
    readonly filled?: boolean;
    /** Whether the shape's outline is drawn. */
    readonly stroked?: boolean;
    /** Outline colour: a named colour or a hex value prefixed with `#`. */
    readonly strokeColor?: string;
    /** Outline thickness, e.g. `1pt`. */
    readonly strokeWeight?: string;
    /** Child elements such as `v:fill`, `v:textpath`, `v:imagedata` or `v:textbox`. */
    readonly children?: readonly XmlComponent[];
};

/**
 * @publicApi
 * @deprecated Use `ShapeGroupRun` from `docx/shapes`, whose children can be shapes, pictures, groups and connectors.
 */
export declare type IWpgGroupOptions = {
    readonly type: "wpg";
} & CoreGroupOptions;

/**
 * @publicApi
 * @deprecated Use `ShapeRun` from `docx/shapes`, with `type: "rectangle"` and `children` for a text box. It has plain
 * options for fills, lines, effects and text layout.
 */
export declare type IWpsShapeOptions = WpsShapeCoreOptions & {
    readonly type: "wps";
} & CoreShapeOptions;

/**
 * Object that can be serialized to XML.
 *
 * This interface represents the intermediate object structure used by the xml library
 * to generate the final XML output. Objects typically have a structure like:
 * ```
 * {
 *   "w:elementName": {
 *     _attr: { "w:attribute": "value" },
 *     // child elements or text
 *   }
 * }
 * ```
 */
export declare interface IXmlableObject extends Record<string, unknown> {
    readonly [key: string]: any;
}

/**
 * XML-serializable object types for the docx library.
 *
 * This module defines the core types used for representing XML structures
 * in an object format that can be serialized using the xml library.
 *
 * @module
 */
/**
 * Attributes for an XML element.
 *
 * Maps attribute names to their values. Attribute values can be strings,
 * numbers, or booleans, which will be converted to strings in the final XML.
 */
export declare type IXmlAttribute = Readonly<Record<string, string | number | boolean>>;

/**
 * Represents a serialized XML file with its path in the OOXML package.
 *
 * @property data - The XML content as a string
 * @property path - The file path within the ZIP archive (e.g., "word/document.xml")
 */
declare type IXmlifyedFile = {
    readonly data: string;
    readonly path: string;
};

/**
 * Options for frames positioned using absolute X/Y coordinates.
 *
 * Use this type when you need precise control over frame positioning using
 * specific coordinate values.
 *
 * @property type - Must be "absolute" for coordinate-based positioning
 * @property position - Absolute X and Y coordinates in twips
 */
export declare type IXYFrameOptions = {
    /** Must be "absolute" for coordinate-based positioning */
    readonly type: "absolute";
    /** Absolute X and Y coordinates in twips */
    readonly position: {
        /** Horizontal position in twips from the anchor point */
        readonly x: number;
        /** Vertical position in twips from the anchor point */
        readonly y: number;
    };
} & IBaseFrameOptions;

/**
 * Represents the last rendered page break location.
 *
 * Used internally by Word to track where page breaks occurred in the last rendering.
 * This is typically generated by Word and not created manually.
 */
export declare class LastRenderedPageBreak extends EmptyElement {
    constructor();
}

/**
 * Tab stop leader character types.
 *
 * Specifies the character used to fill the space before the tab stop.
 *
 * @publicApi
 */
export declare const LeaderType: {
    /** Dot leader (....) */
    readonly DOT: "dot";
    /** Hyphen leader (----) */
    readonly HYPHEN: "hyphen";
    /** Middle dot leader (····) */
    readonly MIDDLE_DOT: "middleDot";
    /** No leader */
    readonly NONE: "none";
    /** Underscore leader (____) */
    readonly UNDERSCORE: "underscore";
};

/**
 * Represents a length unit value for VML shape styling.
 *
 * Length units can be specified in multiple formats:
 * - "auto" - Automatically calculated by the application
 * - number - Numeric value (typically in points)
 * - Percentage - Percentage-based measurement
 * - UniversalMeasure - Measurement with explicit units (pt, cm, in, etc.)
 * - RelativeMeasure - Relative measurement units
 */
export declare type LengthUnit = "auto" | number | Percentage | UniversalMeasure | RelativeMeasure;

/**
 * Represents a numbering level within an abstract numbering definition.
 *
 * This is the standard level definition used in abstract numbering definitions.
 * Each abstract numbering definition can contain up to 9 levels (0-8).
 *
 * Reference: http://officeopenxml.com/WPnumbering-numFmt.php
 *
 * @example
 * ```typescript
 * // Create a decimal numbered level
 * const level = new Level({
 *   level: 0,
 *   format: LevelFormat.DECIMAL,
 *   text: "%1.",
 *   alignment: AlignmentType.LEFT,
 *   start: 1,
 * });
 *
 * // Create a bullet level with custom styling
 * const bulletLevel = new Level({
 *   level: 0,
 *   format: LevelFormat.BULLET,
 *   text: "\u2022",
 *   alignment: AlignmentType.LEFT,
 *   style: {
 *     paragraph: {
 *       indent: { left: 720, hanging: 360 },
 *     },
 *   },
 * });
 * ```
 */
export declare class Level extends LevelBase {
}

/**
 * Base class for numbering level definitions.
 *
 * Defines the formatting and behavior of a single level in a multi-level
 * numbering scheme. Each level can have its own numbering format, text template,
 * alignment, and styling.
 *
 * Reference: http://officeopenxml.com/WPnumbering-numFmt.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Lvl">
 *   <xsd:sequence>
 *     <xsd:element name="start" type="CT_DecimalNumber" minOccurs="0"/>
 *     <xsd:element name="numFmt" type="CT_NumFmt" minOccurs="0"/>
 *     <xsd:element name="lvlRestart" type="CT_DecimalNumber" minOccurs="0"/>
 *     <xsd:element name="pStyle" type="CT_String" minOccurs="0"/>
 *     <xsd:element name="isLgl" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="suff" type="CT_LevelSuffix" minOccurs="0"/>
 *     <xsd:element name="lvlText" type="CT_LevelText" minOccurs="0"/>
 *     <xsd:element name="lvlPicBulletId" type="CT_DecimalNumber" minOccurs="0"/>
 *     <xsd:element name="legacy" type="CT_LvlLegacy" minOccurs="0"/>
 *     <xsd:element name="lvlJc" type="CT_Jc" minOccurs="0"/>
 *     <xsd:element name="pPr" type="CT_PPrGeneral" minOccurs="0"/>
 *     <xsd:element name="rPr" type="CT_RPr" minOccurs="0"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="ilvl" type="ST_DecimalNumber" use="required"/>
 *   <xsd:attribute name="tplc" type="ST_LongHexNumber" use="optional"/>
 *   <xsd:attribute name="tentative" type="s:ST_OnOff" use="optional"/>
 * </xsd:complexType>
 * ```
 */
export declare class LevelBase extends XmlComponent {
    private readonly paragraphProperties;
    private readonly runProperties;
    /**
     * Creates a new numbering level.
     *
     * @param options - Level configuration options
     * @throws Error if level is greater than 9 (Word limitation)
     */
    constructor({ level, format, text, alignment, start, style, suffix, isLegalNumberingStyle, }: ILevelsOptions);
}

/**
 * Number format types for list levels.
 *
 * Defines the various numbering formats available for list levels, including
 * decimal, roman numerals, letters, and various international formats.
 *
 * Reference: http://officeopenxml.com/WPnumbering-numFmt.php
 *
 * @example
 * ```typescript
 * // Use decimal numbering (1, 2, 3...)
 * format: LevelFormat.DECIMAL
 *
 * // Use lowercase roman numerals (i, ii, iii...)
 * format: LevelFormat.LOWER_ROMAN
 *
 * // Use bullet points
 * format: LevelFormat.BULLET
 * ```
 *
 * @publicApi
 */
export declare const LevelFormat: {
    /** Decimal numbering (1, 2, 3...). */
    readonly DECIMAL: "decimal";
    /** Uppercase roman numerals (I, II, III...). */
    readonly UPPER_ROMAN: "upperRoman";
    /** Lowercase roman numerals (i, ii, iii...). */
    readonly LOWER_ROMAN: "lowerRoman";
    /** Uppercase letters (A, B, C...). */
    readonly UPPER_LETTER: "upperLetter";
    /** Lowercase letters (a, b, c...). */
    readonly LOWER_LETTER: "lowerLetter";
    /** Ordinal numbers (1st, 2nd, 3rd...). */
    readonly ORDINAL: "ordinal";
    /** Cardinal text (one, two, three...). */
    readonly CARDINAL_TEXT: "cardinalText";
    /** Ordinal text (first, second, third...). */
    readonly ORDINAL_TEXT: "ordinalText";
    /** Hexadecimal numbering. */
    readonly HEX: "hex";
    /** Chicago Manual of Style numbering. */
    readonly CHICAGO: "chicago";
    /** Ideograph digital numbering. */
    readonly IDEOGRAPH__DIGITAL: "ideographDigital";
    /** Japanese counting system. */
    readonly JAPANESE_COUNTING: "japaneseCounting";
    /** Japanese aiueo ordering. */
    readonly AIUEO: "aiueo";
    /** Japanese iroha ordering. */
    readonly IROHA: "iroha";
    /** Full-width decimal numbering. */
    readonly DECIMAL_FULL_WIDTH: "decimalFullWidth";
    /** Half-width decimal numbering. */
    readonly DECIMAL_HALF_WIDTH: "decimalHalfWidth";
    /** Japanese legal numbering. */
    readonly JAPANESE_LEGAL: "japaneseLegal";
    /** Japanese digital ten thousand numbering. */
    readonly JAPANESE_DIGITAL_TEN_THOUSAND: "japaneseDigitalTenThousand";
    /** Decimal numbers enclosed in circles. */
    readonly DECIMAL_ENCLOSED_CIRCLE: "decimalEnclosedCircle";
    /** Full-width decimal numbering variant 2. */
    readonly DECIMAL_FULL_WIDTH2: "decimalFullWidth2";
    /** Full-width aiueo ordering. */
    readonly AIUEO_FULL_WIDTH: "aiueoFullWidth";
    /** Full-width iroha ordering. */
    readonly IROHA_FULL_WIDTH: "irohaFullWidth";
    /** Decimal with leading zeros. */
    readonly DECIMAL_ZERO: "decimalZero";
    /** Bullet points. */
    readonly BULLET: "bullet";
    /** Korean ganada ordering. */
    readonly GANADA: "ganada";
    /** Korean chosung ordering. */
    readonly CHOSUNG: "chosung";
    /** Decimal enclosed with fullstop. */
    readonly DECIMAL_ENCLOSED_FULLSTOP: "decimalEnclosedFullstop";
    /** Decimal enclosed in parentheses. */
    readonly DECIMAL_ENCLOSED_PARENTHESES: "decimalEnclosedParen";
    /** Decimal enclosed in circles (Chinese). */
    readonly DECIMAL_ENCLOSED_CIRCLE_CHINESE: "decimalEnclosedCircleChinese";
    /** Ideograph enclosed in circles. */
    readonly IDEOGRAPH_ENCLOSED_CIRCLE: "ideographEnclosedCircle";
    /** Traditional ideograph numbering. */
    readonly IDEOGRAPH_TRADITIONAL: "ideographTraditional";
    /** Ideograph zodiac numbering. */
    readonly IDEOGRAPH_ZODIAC: "ideographZodiac";
    /** Traditional ideograph zodiac numbering. */
    readonly IDEOGRAPH_ZODIAC_TRADITIONAL: "ideographZodiacTraditional";
    /** Taiwanese counting system. */
    readonly TAIWANESE_COUNTING: "taiwaneseCounting";
    /** Traditional ideograph legal numbering. */
    readonly IDEOGRAPH_LEGAL_TRADITIONAL: "ideographLegalTraditional";
    /** Taiwanese counting thousand system. */
    readonly TAIWANESE_COUNTING_THOUSAND: "taiwaneseCountingThousand";
    /** Taiwanese digital numbering. */
    readonly TAIWANESE_DIGITAL: "taiwaneseDigital";
    /** Chinese counting system. */
    readonly CHINESE_COUNTING: "chineseCounting";
    /** Simplified Chinese legal numbering. */
    readonly CHINESE_LEGAL_SIMPLIFIED: "chineseLegalSimplified";
    /** Chinese counting thousand system. */
    readonly CHINESE_COUNTING_THOUSAND: "chineseCountingThousand";
    /** Korean digital numbering. */
    readonly KOREAN_DIGITAL: "koreanDigital";
    /** Korean counting system. */
    readonly KOREAN_COUNTING: "koreanCounting";
    /** Korean legal numbering. */
    readonly KOREAN_LEGAL: "koreanLegal";
    /** Korean digital numbering variant 2. */
    readonly KOREAN_DIGITAL2: "koreanDigital2";
    /** Vietnamese counting system. */
    readonly VIETNAMESE_COUNTING: "vietnameseCounting";
    /** Russian lowercase numbering. */
    readonly RUSSIAN_LOWER: "russianLower";
    /** Russian uppercase numbering. */
    readonly RUSSIAN_UPPER: "russianUpper";
    /** No numbering. */
    readonly NONE: "none";
    /** Number enclosed in dashes. */
    readonly NUMBER_IN_DASH: "numberInDash";
    /** Hebrew numbering variant 1. */
    readonly HEBREW1: "hebrew1";
    /** Hebrew numbering variant 2. */
    readonly HEBREW2: "hebrew2";
    /** Arabic alpha numbering. */
    readonly ARABIC_ALPHA: "arabicAlpha";
    /** Arabic abjad numbering. */
    readonly ARABIC_ABJAD: "arabicAbjad";
    /** Hindi vowels. */
    readonly HINDI_VOWELS: "hindiVowels";
    /** Hindi consonants. */
    readonly HINDI_CONSONANTS: "hindiConsonants";
    /** Hindi numbers. */
    readonly HINDI_NUMBERS: "hindiNumbers";
    /** Hindi counting system. */
    readonly HINDI_COUNTING: "hindiCounting";
    /** Thai letters. */
    readonly THAI_LETTERS: "thaiLetters";
    /** Thai numbers. */
    readonly THAI_NUMBERS: "thaiNumbers";
    /** Thai counting system. */
    readonly THAI_COUNTING: "thaiCounting";
    /** Thai Baht text. */
    readonly BAHT_TEXT: "bahtText";
    /** Dollar text. */
    readonly DOLLAR_TEXT: "dollarText";
    /** Custom numbering format. */
    readonly CUSTOM: "custom";
};

/**
 * Represents a numbering level used in level overrides.
 *
 * This level type is used when overriding specific levels within a
 * concrete numbering instance.
 */
export declare class LevelForOverride extends LevelBase {
}

/**
 * Represents a level override in a concrete numbering instance.
 *
 * Level overrides allow customization of specific levels within a numbering
 * instance, such as changing the starting number.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_NumLvl">
 *   <xsd:sequence>
 *     <xsd:element name="startOverride" type="CT_DecimalNumber" minOccurs="0"/>
 *     <xsd:element name="lvl" type="CT_Lvl" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="ilvl" type="ST_DecimalNumber" use="required"/>
 * </xsd:complexType>
 * ```
 */
export declare class LevelOverride extends XmlComponent {
    /**
     * Creates a new level override.
     *
     * @param levelNum - The level number to override (0-8)
     * @param start - Optional starting number for the level
     */
    constructor(levelNum: number, start?: number);
}

/**
 * Suffix types for list levels.
 *
 * Defines what follows the numbering text (tab, space, or nothing).
 *
 * @example
 * ```typescript
 * // Add a tab after the numbering
 * suffix: LevelSuffix.TAB
 *
 * // Add a space after the numbering
 * suffix: LevelSuffix.SPACE
 *
 * // No separator after the numbering
 * suffix: LevelSuffix.NOTHING
 * ```
 *
 * @publicApi
 */
export declare const LevelSuffix: {
    /** No separator after the numbering. */
    readonly NOTHING: "nothing";
    /** Space character after the numbering. */
    readonly SPACE: "space";
    /** Tab character after the numbering. */
    readonly TAB: "tab";
};

/**
 * Line cap styles for outline endpoints.
 *
 * Defines how the ends of a line are rendered.
 */
declare const LineCap: {
    /** Round cap style */
    readonly ROUND: "rnd";
    /** Square cap style */
    readonly SQUARE: "sq";
    /** Flat cap style */
    readonly FLAT: "flat";
};

/**
 * This simple type specifies when the line numbering in the parent section shall be reset to its restart value. The line numbering increments for each line (even if the line number itself is not displayed) until it reaches the restart point specified by this element.
 *
 * Reference: https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_ST_LineNumberRestart_topic_ID0EUS42.html
 *
 * ## XSD Schema
 *
 * ```xml
 * <xsd:simpleType name="ST_LineNumberRestart">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="newPage"/>
 *     <xsd:enumeration value="newSection"/>
 *     <xsd:enumeration value="continuous"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export declare const LineNumberRestartFormat: {
    /**
     * ## Restart Line Numbering on Each Page
     *
     * Specifies that line numbering for the parent section shall restart to the starting value whenever a new page is displayed.
     */
    readonly NEW_PAGE: "newPage";
    /**
     * ## Restart Line Numbering for Each Section
     *
     * Specifies that line numbering for the parent section shall restart to the starting value whenever the parent begins.
     */
    readonly NEW_SECTION: "newSection";
    /**
     * ## Continue Line Numbering From Previous Section
     *
     * Specifies that line numbering for the parent section shall continue from the line numbering from the end of the previous section, if any.
     */
    readonly CONTINUOUS: "continuous";
};

/**
 * Line spacing rule types.
 *
 * Specifies how the line height is calculated.
 *
 * @publicApi
 */
export declare const LineRuleType: {
    /** Line spacing is at least the specified value */
    readonly AT_LEAST: "atLeast";
    /** Line spacing is exactly the specified value */
    readonly EXACTLY: "exactly";
    /** Line spacing is exactly the specified value (alias for EXACTLY) */
    readonly EXACT: "exact";
    /** Line spacing is automatically determined based on content */
    readonly AUTO: "auto";
};

/**
 * Validates a long hexadecimal number (4 bytes / 8 characters).
 *
 * Reference: ST_LongHexNumber in OOXML specification
 *
 * @param val - The hexadecimal string to validate
 * @returns The validated hexadecimal string
 * @throws Error if the value is not a valid 8-character hex string
 *
 * @example
 * ```typescript
 * const hex = longHexNumber("ABCD1234"); // Valid
 * ```
 */
export declare const longHexNumber: (val: string) => string;

/**
 * Represents a mathematical equation in a WordprocessingML document.
 *
 * Math is the container for Office MathML (OMML) content, supporting
 * fractions, radicals, integrals, sums, scripts, and more.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_oMath-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_OMath">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_OMathElements" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new Math({
 *   children: [
 *     new MathFraction({
 *       numerator: [new MathRun("a")],
 *       denominator: [new MathRun("b")],
 *     }),
 *   ],
 * });
 * ```
 */
declare class Math_2 extends XmlComponent {
    constructor(options: IMathOptions);
}
export { Math_2 as Math }

/**
 * Options for creating an accent character element.
 */
declare type MathAccentCharacterOptions = {
    /** The n-ary operator character (e.g., "∑", "∫", "∏") */
    readonly accent: string;
};

/**
 * Represents angle brackets in a math equation.
 *
 * MathAngledBrackets displays content surrounded by angle brackets ⟨ ⟩.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_d-1.html
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * new MathAngledBrackets({ children: [new MathRun("x, y")] });
 * ```
 */
export declare class MathAngledBrackets extends XmlComponent {
    constructor(options: MathAngledBracketsOptions);
}

/**
 * Options for MathAngledBrackets.
 */
declare type MathAngledBracketsOptions = {
    readonly children: readonly MathComponent[];
};

/**
 * Options for creating a math base element.
 */
declare type MathBaseOptions = {
    /** The content of the base */
    readonly children: readonly MathComponent[];
};

/**
 * Union type of all valid math components.
 *
 * MathComponent represents any element that can appear within a Math equation,
 * including runs, fractions, radicals, integrals, sums, scripts, and brackets.
 */
export declare type MathComponent = MathRun | MathFraction | MathSum | MathIntegral | MathSuperScript | MathSubScript | MathSubSuperScript | MathRadical | MathFunction | MathRoundBrackets | MathCurlyBrackets | MathAngledBrackets | MathSquareBrackets;

/**
 * Represents curly braces in a math equation.
 *
 * MathCurlyBrackets displays content surrounded by curly braces { }.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_d-1.html
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * new MathCurlyBrackets({ children: [new MathRun("x + y")] });
 * ```
 */
export declare class MathCurlyBrackets extends XmlComponent {
    constructor(options: {
        readonly children: readonly MathComponent[];
    });
}

/**
 * Represents the degree of a radical (root) in a math equation.
 *
 * MathDegree specifies the degree of the root, such as 3 for cube root.
 * For square roots, this element is typically hidden.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_deg-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_OMathArg">
 *   <xsd:sequence>
 *     <xsd:element name="argPr" type="CT_OMathArgPr" minOccurs="0"/>
 *     <xsd:group ref="EG_OMathMathElements" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="ctrlPr" type="CT_CtrlPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @internal
 */
export declare class MathDegree extends XmlComponent {
    constructor(children?: readonly MathComponent[]);
}

/**
 * Represents the denominator (bottom part) of a fraction.
 *
 * @internal
 */
export declare class MathDenominator extends XmlComponent {
    constructor(children: readonly MathComponent[]);
}

/**
 * Represents a fraction in a math equation.
 *
 * MathFraction displays a numerator over a denominator with a fraction bar.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_f-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_F">
 *   <xsd:sequence>
 *     <xsd:element name="fPr" type="CT_FPr" minOccurs="0"/>
 *     <xsd:element name="num" type="CT_OMathArg"/>
 *     <xsd:element name="den" type="CT_OMathArg"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new MathFraction({
 *   numerator: [new MathRun("a + b")],
 *   denominator: [new MathRun("c")],
 * });
 *
 * // n over k, as a binomial coefficient, in brackets
 * new MathRoundBrackets({
 *   children: [new MathFraction({ numerator: [new MathRun("n")], denominator: [new MathRun("k")], type: "noBar" })],
 * });
 * ```
 */
export declare class MathFraction extends XmlComponent {
    constructor(options: IMathFractionOptions);
}

/**
 * How a fraction is drawn (`m:type`):
 *
 * - `"stacked"`: the numerator over the denominator, with a bar between them;
 * - `"skewed"`: the numerator up and to the left of a slash, and the denominator down and to the right, as ½;
 * - `"linear"`: on one line, with a slash between them, as a/b;
 * - `"noBar"`: stacked, with no bar between them, as in a binomial coefficient.
 */
export declare type MathFractionType = "stacked" | "skewed" | "linear" | "noBar";

/**
 * Represents a mathematical function in a math equation.
 *
 * MathFunction displays a function name followed by its argument,
 * such as sin(x), cos(θ), or log(n).
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_func-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Func">
 *   <xsd:sequence>
 *     <xsd:element name="funcPr" type="CT_FuncPr" minOccurs="0"/>
 *     <xsd:element name="fName" type="CT_OMathArg"/>
 *     <xsd:element name="e" type="CT_OMathArg"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // sin(x)
 * new MathFunction({
 *   name: [new MathRun("sin")],
 *   children: [new MathRun("x")],
 * });
 * ```
 */
export declare class MathFunction extends XmlComponent {
    constructor(options: IMathFunctionOptions);
}

/**
 * Represents a function name in a math equation.
 *
 * MathFunctionName contains the function name (e.g., sin, cos, log)
 * that appears before the function argument.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_fName-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_OMathArg">
 *   <xsd:sequence>
 *     <xsd:element name="argPr" type="CT_OMathArgPr" minOccurs="0"/>
 *     <xsd:group ref="EG_OMathMathElements" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="ctrlPr" type="CT_CtrlPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @internal
 */
export declare class MathFunctionName extends XmlComponent {
    constructor(children: readonly MathComponent[]);
}

/**
 * Represents properties for a math function structure.
 *
 * This element specifies properties for the function object,
 * such as function name alignment and spacing.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_funcPr-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_FuncPr">
 *   <xsd:sequence>
 *     <xsd:element name="ctrlPr" type="CT_CtrlPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @internal
 */
export declare class MathFunctionProperties extends XmlComponent {
    constructor();
}

/**
 * Represents an integral (∫) expression in a math equation.
 *
 * MathIntegral displays the integral symbol with optional bounds.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_nary-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Nary">
 *   <xsd:sequence>
 *     <xsd:element name="naryPr" type="CT_NaryPr" minOccurs="0"/>
 *     <xsd:element name="sub" type="CT_OMathArg"/>
 *     <xsd:element name="sup" type="CT_OMathArg"/>
 *     <xsd:element name="e" type="CT_OMathArg"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Definite integral from 0 to 1
 * new MathIntegral({
 *   children: [new MathRun("f(x) dx")],
 *   subScript: [new MathRun("0")],
 *   superScript: [new MathRun("1")],
 * });
 * ```
 */
export declare class MathIntegral extends XmlComponent {
    constructor(options: IMathIntegralOptions);
}

/**
 * Represents a limit in a math equation.
 *
 * MathLimit is used within limit structures to specify the limit
 * expression that appears above or below the base.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_lim-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_OMathArg">
 *   <xsd:sequence>
 *     <xsd:element name="argPr" type="CT_OMathArgPr" minOccurs="0"/>
 *     <xsd:group ref="EG_OMathMathElements" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="ctrlPr" type="CT_CtrlPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @internal
 */
export declare class MathLimit extends XmlComponent {
    constructor(children: readonly MathComponent[]);
}

/**
 * Options for creating a limit location element.
 */
declare type MathLimitLocationOptions = {
    /** Location: "undOvr" (under/over) or "subSup" (subscript/superscript). Defaults to "undOvr". */
    readonly value?: string;
};

/**
 * Represents a lower limit structure in a math equation.
 *
 * MathLimitLower displays content with a limit underneath,
 * commonly used for limits in calculus (e.g., lim with x→0 below).
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_limLow-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_LimLow">
 *   <xsd:sequence>
 *     <xsd:element name="limLowPr" type="CT_LimLowPr" minOccurs="0"/>
 *     <xsd:element name="e" type="CT_OMathArg"/>
 *     <xsd:element name="lim" type="CT_OMathArg"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // lim with x→0 underneath
 * new MathLimitLower({
 *   children: [new MathRun("lim")],
 *   limit: [new MathRun("x→0")],
 * });
 * ```
 */
export declare class MathLimitLower extends XmlComponent {
    constructor(options: IMathLimitLowerOptions);
}

/**
 * Where a large operator's limits go (`m:limLoc`):
 *
 * - `"aboveBelow"`: above and below it, as a sum's usually are;
 * - `"side"`: to its right, as a superscript and subscript, as an integral's usually are.
 */
export declare type MathLimitsPosition = "aboveBelow" | "side";

/**
 * Represents an upper limit structure in a math equation.
 *
 * MathLimitUpper displays content with a limit above,
 * commonly used for mathematical notation like lim with conditions above.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_limUpp-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_LimUpp">
 *   <xsd:sequence>
 *     <xsd:element name="limUppPr" type="CT_LimUppPr" minOccurs="0"/>
 *     <xsd:element name="e" type="CT_OMathArg"/>
 *     <xsd:element name="lim" type="CT_OMathArg"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Expression with limit above
 * new MathLimitUpper({
 *   children: [new MathRun("max")],
 *   limit: [new MathRun("x∈S")],
 * });
 * ```
 */
export declare class MathLimitUpper extends XmlComponent {
    constructor(options: IMathLimitUpperOptions);
}

/**
 * Options for creating n-ary properties.
 */
declare type MathNAryPropertiesOptions = {
    /** The n-ary operator character (e.g., "∑" for sum, "∫" for integral) */
    readonly accent: string;
    /** Whether the n-ary has a superscript (upper limit) */
    readonly hasSuperScript: boolean;
    /** Whether the n-ary has a subscript (lower limit) */
    readonly hasSubScript: boolean;
    /** Location of limits: "undOvr" (under/over) or "subSup" (subscript/superscript) */
    readonly limitLocationVal?: string;
};

/**
 * Represents the numerator (top part) of a fraction.
 *
 * @internal
 */
export declare class MathNumerator extends XmlComponent {
    constructor(children: readonly MathComponent[]);
}

/**
 * Represents a pre-subscript and pre-superscript expression in a math equation.
 *
 * MathPreSubSuperScript displays a base with both subscript and superscript
 * positioned before (to the left of) the base, commonly used in tensor notation.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sPre-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SPre">
 *   <xsd:sequence>
 *     <xsd:element name="sPrePr" type="CT_SPrePr" minOccurs="0"/>
 *     <xsd:element name="sub" type="CT_OMathArg"/>
 *     <xsd:element name="sup" type="CT_OMathArg"/>
 *     <xsd:element name="e" type="CT_OMathArg"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Pre-scripts for tensor notation
 * new MathPreSubSuperScript({
 *   children: [new MathRun("T")],
 *   subScript: [new MathRun("i")],
 *   superScript: [new MathRun("j")],
 * });
 * ```
 */
export declare class MathPreSubSuperScript extends BuilderElement {
    constructor({ children, subScript, superScript }: IMathPreSubSuperScriptOptions);
}

/**
 * Represents a radical (root) expression in a math equation.
 *
 * MathRadical displays a radical symbol (√) with optional degree for
 * n-th roots (cube root, fourth root, etc.).
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_rad-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Rad">
 *   <xsd:sequence>
 *     <xsd:element name="radPr" type="CT_RadPr" minOccurs="0"/>
 *     <xsd:element name="deg" type="CT_OMathArg"/>
 *     <xsd:element name="e" type="CT_OMathArg"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Square root of x
 * new MathRadical({ children: [new MathRun("x")] });
 *
 * // Cube root of x
 * new MathRadical({
 *   children: [new MathRun("x")],
 *   degree: [new MathRun("3")],
 * });
 * ```
 */
export declare class MathRadical extends XmlComponent {
    constructor(options: IMathRadicalOptions);
}

/**
 * Represents properties for a radical structure.
 *
 * This element specifies properties for the radical object,
 * such as whether to hide the degree (for square roots).
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_radPr-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_RadPr">
 *   <xsd:sequence>
 *     <xsd:element name="degHide" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="ctrlPr" type="CT_CtrlPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @internal
 */
export declare class MathRadicalProperties extends XmlComponent {
    constructor(hasDegree: boolean);
}

/**
 * Represents round brackets (parentheses) in a math equation.
 *
 * MathRoundBrackets displays content surrounded by parentheses ( ).
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_d-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_D">
 *   <xsd:sequence>
 *     <xsd:element name="dPr" type="CT_DPr" minOccurs="0"/>
 *     <xsd:element name="e" type="CT_OMathArg" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new MathRoundBrackets({ children: [new MathRun("x + y")] });
 * ```
 */
export declare class MathRoundBrackets extends XmlComponent {
    constructor(options: {
        readonly children: readonly MathComponent[];
    });
}

/**
 * Represents a run of text within a math equation.
 *
 * MathRun is the container for text content in Office MathML,
 * similar to how Run contains text in regular paragraphs.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_r-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_R">
 *   <xsd:sequence>
 *     <xsd:element name="rPr" type="CT_RPR" minOccurs="0"/>
 *     <xsd:group ref="EG_ScriptStyle" minOccurs="0"/>
 *     <xsd:choice minOccurs="0" maxOccurs="unbounded">
 *       <xsd:element ref="w:br"/>
 *       <xsd:element name="t" type="CT_Text"/>
 *     </xsd:choice>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new MathRun("x + y");
 * new MathRun({ text: "if ", normalText: true });
 * new MathRun({ text: "R", script: "doubleStruck" });
 * new MathRun({ text: "d", style: "plain" });
 * ```
 */
export declare class MathRun extends XmlComponent {
    constructor(options: string | MathRunOptions);
}

/**
 * Options for a {@link MathRun}.
 */
export declare type MathRunOptions = {
    /** The text */
    readonly text: string;
    /**
     * Writes the text as ordinary text rather than math, as Word's "Normal Text" button does (`m:nor`): upright and in
     * the document's font, with its spaces kept. For words in an equation, such as "if" and "otherwise" in cases. It
     * can't be given with `style` or `script`, which are for math.
     * @default false
     */
    readonly normalText?: boolean;
    /**
     * How the letters are drawn: plain (upright), bold, italic or both (`m:sty`).
     * @default "plain" with a `script` other than roman, as LaTeX draws its alphabets upright; otherwise none, and Word
     * draws letters in italic
     */
    readonly style?: MathRunStyle;
    /**
     * The alphabet the letters are drawn in, such as double-struck for ℝ (`m:scr`).
     */
    readonly script?: MathRunScript;
    /**
     * Takes the text as it is (`m:lit`), rather than as something Word builds up or lines up, such as an `&` in a
     * `MathEquationArray`, which would otherwise be a point the rows line up at.
     * @default false
     */
    readonly literal?: boolean;
};

/**
 * The alphabet a {@link MathRun}'s letters are drawn in (`m:scr`):
 *
 * - `"roman"`: the math font's own letters, as Word draws them unless a run has an alphabet;
 * - `"script"`: 𝒜, as LaTeX's `\mathcal` and `\mathscr`;
 * - `"fraktur"`: 𝔄, as `\mathfrak`;
 * - `"doubleStruck"`: 𝔸, as `\mathbb`, for sets such as ℝ;
 * - `"sansSerif"`: 𝖠, as `\mathsf`;
 * - `"monospace"`: 𝙰, as `\mathtt`.
 */
export declare type MathRunScript = "roman" | "script" | "fraktur" | "doubleStruck" | "sansSerif" | "monospace";

/**
 * How a {@link MathRun}'s letters are drawn (`m:sty`):
 *
 * - `"plain"`: upright, as LaTeX's `\mathrm`;
 * - `"bold"`: bold and upright, as `\mathbf`;
 * - `"italic"`: italic, as `\mathit`;
 * - `"boldItalic"`: bold and italic, as `\boldsymbol`.
 *
 * Word draws letters in italic, and digits and capital Greek letters upright, unless a run has a style. A run in an
 * alphabet other than roman is plain unless given a style, as LaTeX draws its alphabets upright.
 */
export declare type MathRunStyle = "plain" | "bold" | "italic" | "boldItalic";

/**
 * Represents square brackets in a math equation.
 *
 * MathSquareBrackets displays content surrounded by square brackets [ ].
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_d-1.html
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * new MathSquareBrackets({ children: [new MathRun("x + y")] });
 * ```
 */
export declare class MathSquareBrackets extends XmlComponent {
    constructor(options: {
        readonly children: readonly MathComponent[];
    });
}

/**
 * Represents a subscript expression in a math equation.
 *
 * MathSubScript displays a base with a subscript, like x₁.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sSub-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SSub">
 *   <xsd:sequence>
 *     <xsd:element name="sSubPr" type="CT_SSubPr" minOccurs="0"/>
 *     <xsd:element name="e" type="CT_OMathArg"/>
 *     <xsd:element name="sub" type="CT_OMathArg"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // x with subscript 1
 * new MathSubScript({
 *   children: [new MathRun("x")],
 *   subScript: [new MathRun("1")],
 * });
 * ```
 */
export declare class MathSubScript extends XmlComponent {
    constructor(options: IMathSubScriptOptions);
}

/**
 * Options for creating a subscript element.
 */
declare type MathSubScriptElementOptions = {
    /** The content of the subscript */
    readonly children: readonly MathComponent[];
};

/**
 * Represents a combined subscript and superscript expression in a math equation.
 *
 * MathSubSuperScript displays a base with both a subscript and superscript,
 * commonly used for tensor notation or indexed variables with exponents.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sSubSup-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SSubSup">
 *   <xsd:sequence>
 *     <xsd:element name="sSubSupPr" type="CT_SSubSupPr" minOccurs="0"/>
 *     <xsd:element name="e" type="CT_OMathArg"/>
 *     <xsd:element name="sub" type="CT_OMathArg"/>
 *     <xsd:element name="sup" type="CT_OMathArg"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // x with subscript i and superscript 2
 * new MathSubSuperScript({
 *   children: [new MathRun("x")],
 *   subScript: [new MathRun("i")],
 *   superScript: [new MathRun("2")],
 * });
 * ```
 */
export declare class MathSubSuperScript extends XmlComponent {
    constructor(options: IMathSubSuperScriptOptions);
}

/**
 * Represents a summation (Σ) expression in a math equation.
 *
 * MathSum displays the summation symbol with optional lower and upper bounds.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_nary-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Nary">
 *   <xsd:sequence>
 *     <xsd:element name="naryPr" type="CT_NaryPr" minOccurs="0"/>
 *     <xsd:element name="sub" type="CT_OMathArg"/>
 *     <xsd:element name="sup" type="CT_OMathArg"/>
 *     <xsd:element name="e" type="CT_OMathArg"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Sum from i=1 to n
 * new MathSum({
 *   children: [new MathRun("x")],
 *   subScript: [new MathRun("i=1")],
 *   superScript: [new MathRun("n")],
 * });
 * ```
 */
export declare class MathSum extends XmlComponent {
    constructor(options: IMathSumOptions);
}

/**
 * Represents a superscript expression in a math equation.
 *
 * MathSuperScript displays a base with an exponent, like x².
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sSup-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SSup">
 *   <xsd:sequence>
 *     <xsd:element name="sSupPr" type="CT_SSupPr" minOccurs="0"/>
 *     <xsd:element name="e" type="CT_OMathArg"/>
 *     <xsd:element name="sup" type="CT_OMathArg"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // x squared
 * new MathSuperScript({
 *   children: [new MathRun("x")],
 *   superScript: [new MathRun("2")],
 * });
 * ```
 */
export declare class MathSuperScript extends XmlComponent {
    constructor(options: IMathSuperScriptOptions);
}

/**
 * Options for creating a superscript element.
 */
declare type MathSuperScriptElementOptions = {
    /** The content of the superscript */
    readonly children: readonly MathComponent[];
};

/**
 * Validates a measurement value that can be expressed as a number, percentage, or universal measure.
 *
 * Reference: ST_MeasurementOrPercent in OOXML specification
 *
 * @param val - The measurement value (number, percentage, or universal measure)
 * @returns The normalized measurement value
 *
 * @example
 * ```typescript
 * const measure1 = measurementOrPercentValue(100); // Unqualified number
 * const measure2 = measurementOrPercentValue("50%"); // Percentage
 * const measure3 = measurementOrPercentValue("10mm"); // Universal measure
 * ```
 */
export declare const measurementOrPercentValue: (val: number | Percentage | UniversalMeasure) => number | UniversalMeasure | Percentage;

/**
 * Manages embedded media (images) in a document.
 *
 * Media stores all images referenced in the document and provides
 * access to their data for packaging into the DOCX file. Each image
 * is stored with a unique key for retrieval.
 *
 * @example
 * ```typescript
 * const media = new Media();
 * media.addImage("image1", {
 *   type: "png",
 *   fileName: "image1.png",
 *   transformation: {
 *     pixels: { x: 200, y: 100 },
 *     emus: { x: 1828800, y: 914400 }
 *   },
 *   data: imageBuffer
 * });
 * const allImages = media.Array;
 * ```
 */
export declare class Media {
    private readonly map;
    constructor();
    /**
     * Adds an image to the media collection.
     *
     * @param key - Unique identifier for this image
     * @param mediaData - Complete image data including file name, transformation, and raw data
     */
    addImage(key: string, mediaData: IMediaData): void;
    /**
     * Gets all images as an array.
     *
     * @returns Read-only array of all media data in the collection
     */
    get Array(): readonly IMediaData[];
}

/**
 * Represents the current month in long format (e.g., "January", "December").
 *
 * Inserts a dynamic field showing the full month name of the current date.
 */
export declare class MonthLong extends EmptyElement {
    constructor();
}

/**
 * Represents the current month in short format (e.g., "1", "12").
 *
 * Inserts a dynamic field showing the month portion of the current date.
 */
export declare class MonthShort extends EmptyElement {
    constructor();
}

/**
 * Next-generation attribute component with explicit key-value pairs.
 *
 * NextAttributeComponent provides an alternative approach to attributes where
 * each property explicitly specifies both its XML attribute name and value.
 * This gives more control but is more verbose than XmlAttributeComponent.
 *
 * @example
 * ```typescript
 * new NextAttributeComponent({
 *   fontSize: { key: "w:sz", value: 24 },
 *   bold: { key: "w:b", value: true }
 * });
 * // Generates: _attr: { "w:sz": 24, "w:b": true }
 * ```
 */
export declare class NextAttributeComponent<T extends AttributeData> extends BaseXmlComponent {
    private readonly root;
    /**
     * Creates a new NextAttributeComponent.
     *
     * @param root - Attribute payload with explicit key-value mappings
     */
    constructor(root: AttributePayload<T>);
    /**
     * Converts the attribute payload to an XML-serializable object.
     *
     * Extracts the key and value from each property and filters out
     * undefined values.
     *
     * @param _ - Context (unused for attributes)
     * @returns Object with _attr key containing the attributes
     */
    prepForXml(_: IContext): IXmlableObject;
}

/**
 * Represents a non-breaking hyphen character.
 *
 * Inserts a hyphen that prevents line breaking at that position.
 */
export declare class NoBreakHyphen extends EmptyElement {
    constructor();
}

/**
 * The non-visual drawing properties of a shape, picture or group inside a drawing, such as `wps:cNvPr`.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_NonVisualDrawingProps">
 *   <xsd:sequence>
 *     <xsd:element name="hlinkClick" type="CT_Hyperlink" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="hlinkHover" type="CT_Hyperlink" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="id" type="ST_DrawingElementId" use="required"/>
 *   <xsd:attribute name="name" type="xsd:string" use="required"/>
 *   <xsd:attribute name="descr" type="xsd:string" use="optional" default=""/>
 *   <xsd:attribute name="hidden" type="xsd:boolean" use="optional" default="false"/>
 *   <xsd:attribute name="title" type="xsd:string" use="optional" default=""/>
 * </xsd:complexType>
 * ```
 */
export declare class NonVisualDrawingProperties extends XmlComponent {
    private readonly link?;
    constructor(name: string, { id, name: drawingName, description, title, link, decorative }: NonVisualDrawingPropertiesOptions);
    prepForXml(context: IContext): IXmlableObject | undefined;
}

export declare type NonVisualDrawingPropertiesOptions = DrawingLinkOptions & {
    readonly id: number;
    readonly name: string;
    readonly description?: string;
    readonly title?: string;
};

/**
 * Creates a field/cross reference to a numbered item in the document.
 *
 * The REF field displays the text or page number of a bookmarked paragraph,
 * particularly useful for referencing numbered headings or list items.
 *
 * @example
 * ```typescript
 * // Reference a numbered heading
 * new NumberedItemReference("heading_1_bookmark", "1.2.3", {
 *   hyperlink: true,
 *   referenceFormat: NumberedItemReferenceFormat.FULL_CONTEXT,
 * });
 * ```
 */
export declare class NumberedItemReference extends SimpleField {
    constructor(bookmarkId: string, 
    /**
     * The cached value of the field. This is used to display the field result in the document.
     */
    cachedValue?: string, options?: INumberedItemReferenceOptions);
}

/**
 * Format options for numbered item references.
 *
 * Specifies how the paragraph number should be displayed when referenced.
 */
export declare enum NumberedItemReferenceFormat {
    NONE = "none",
    /**
     * \r option - inserts the paragraph number of the bookmarked paragraph in relative context, or relative to its position in the numbering scheme
     */
    RELATIVE = "relative",
    /**
     * \n option - causes the field result to be the paragraph number without trailing periods. No information about prior numbered levels is displayed unless it is included as part of the current level.
     */
    NO_CONTEXT = "no_context",
    /**
     * \w option - causes the field result to be the entire paragraph number without trailing periods, regardless of the location of the REF field.
     */
    FULL_CONTEXT = "full_context"
}

/**
 * Number format types for page numbers and list numbering.
 *
 * Provides international number formats including decimal, Roman numerals,
 * alphabetic, and various Asian numbering systems.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_NumberFormat">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="decimal"/>
 *     <xsd:enumeration value="upperRoman"/>
 *     <xsd:enumeration value="lowerRoman"/>
 *     <xsd:enumeration value="upperLetter"/>
 *     <xsd:enumeration value="lowerLetter"/>
 *     <!-- ... many more formats ... -->
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @example
 * ```typescript
 * // Arabic numerals (1, 2, 3)
 * NumberFormat.DECIMAL;
 *
 * // Roman numerals (I, II, III)
 * NumberFormat.UPPER_ROMAN;
 *
 * // Letters (a, b, c)
 * NumberFormat.LOWER_LETTER;
 * ```
 *
 * @publicApi
 */
export declare const NumberFormat: {
    readonly DECIMAL: "decimal";
    readonly UPPER_ROMAN: "upperRoman";
    readonly LOWER_ROMAN: "lowerRoman";
    readonly UPPER_LETTER: "upperLetter";
    readonly LOWER_LETTER: "lowerLetter";
    readonly ORDINAL: "ordinal";
    readonly CARDINAL_TEXT: "cardinalText";
    readonly ORDINAL_TEXT: "ordinalText";
    readonly HEX: "hex";
    readonly CHICAGO: "chicago";
    readonly IDEOGRAPH_DIGITAL: "ideographDigital";
    readonly JAPANESE_COUNTING: "japaneseCounting";
    readonly AIUEO: "aiueo";
    readonly IROHA: "iroha";
    readonly DECIMAL_FULL_WIDTH: "decimalFullWidth";
    readonly DECIMAL_HALF_WIDTH: "decimalHalfWidth";
    readonly JAPANESE_LEGAL: "japaneseLegal";
    readonly JAPANESE_DIGITAL_TEN_THOUSAND: "japaneseDigitalTenThousand";
    readonly DECIMAL_ENCLOSED_CIRCLE: "decimalEnclosedCircle";
    readonly DECIMAL_FULL_WIDTH_2: "decimalFullWidth2";
    readonly AIUEO_FULL_WIDTH: "aiueoFullWidth";
    readonly IROHA_FULL_WIDTH: "irohaFullWidth";
    readonly DECIMAL_ZERO: "decimalZero";
    readonly BULLET: "bullet";
    readonly GANADA: "ganada";
    readonly CHOSUNG: "chosung";
    readonly DECIMAL_ENCLOSED_FULL_STOP: "decimalEnclosedFullstop";
    readonly DECIMAL_ENCLOSED_PAREN: "decimalEnclosedParen";
    readonly DECIMAL_ENCLOSED_CIRCLE_CHINESE: "decimalEnclosedCircleChinese";
    readonly IDEOGRAPH_ENCLOSED_CIRCLE: "ideographEnclosedCircle";
    readonly IDEOGRAPH_TRADITIONAL: "ideographTraditional";
    readonly IDEOGRAPH_ZODIAC: "ideographZodiac";
    readonly IDEOGRAPH_ZODIAC_TRADITIONAL: "ideographZodiacTraditional";
    readonly TAIWANESE_COUNTING: "taiwaneseCounting";
    readonly IDEOGRAPH_LEGAL_TRADITIONAL: "ideographLegalTraditional";
    readonly TAIWANESE_COUNTING_THOUSAND: "taiwaneseCountingThousand";
    readonly TAIWANESE_DIGITAL: "taiwaneseDigital";
    readonly CHINESE_COUNTING: "chineseCounting";
    readonly CHINESE_LEGAL_SIMPLIFIED: "chineseLegalSimplified";
    readonly CHINESE_COUNTING_TEN_THOUSAND: "chineseCountingThousand";
    readonly KOREAN_DIGITAL: "koreanDigital";
    readonly KOREAN_COUNTING: "koreanCounting";
    readonly KOREAN_LEGAL: "koreanLegal";
    readonly KOREAN_DIGITAL_2: "koreanDigital2";
    readonly VIETNAMESE_COUNTING: "vietnameseCounting";
    readonly RUSSIAN_LOWER: "russianLower";
    readonly RUSSIAN_UPPER: "russianUpper";
    readonly NONE: "none";
    readonly NUMBER_IN_DASH: "numberInDash";
    readonly HEBREW_1: "hebrew1";
    readonly HEBREW_2: "hebrew2";
    readonly ARABIC_ALPHA: "arabicAlpha";
    readonly ARABIC_ABJAD: "arabicAbjad";
    readonly HINDI_VOWELS: "hindiVowels";
    readonly HINDI_CONSONANTS: "hindiConsonants";
    readonly HINDI_NUMBERS: "hindiNumbers";
    readonly HINDI_COUNTING: "hindiCounting";
    readonly THAI_LETTERS: "thaiLetters";
    readonly THAI_NUMBERS: "thaiNumbers";
    readonly THAI_COUNTING: "thaiCounting";
    readonly BAHT_TEXT: "bahtText";
    readonly DOLLAR_TEXT: "dollarText";
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
export declare class Numbering extends XmlComponent {
    private readonly abstractNumberingMap;
    private readonly concreteNumberingMap;
    private readonly referenceConfigMap;
    private readonly abstractNumUniqueNumericId;
    private readonly concreteNumUniqueNumericId;
    /**
     * Creates a new numbering definition collection.
     *
     * Initializes the numbering with a default bullet list configuration and
     * any custom numbering configurations provided in the options.
     *
     * @param options - Configuration options for numbering definitions
     */
    constructor(options: INumberingOptions);
    /**
     * Prepares the numbering definitions for XML serialization.
     *
     * Adds all abstract and concrete numbering definitions to the XML tree.
     *
     * @param context - The XML context
     * @returns The prepared XML object
     */
    prepForXml(context: IContext): IXmlableObject | undefined;
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
    createConcreteNumberingInstance(reference: string, instance: number): void;
    /**
     * Gets all concrete numbering instances.
     *
     * @returns An array of all concrete numbering instances
     */
    get ConcreteNumbering(): readonly ConcreteNumbering[];
    /**
     * Gets all reference configurations.
     *
     * @returns An array of all numbering reference configurations
     */
    get ReferenceConfig(): readonly Record<string, any>[];
}

/**
 * Represents numbering properties for a paragraph.
 *
 * The numPr element specifies the numbering definition instance and level
 * for the paragraph, enabling numbered and bulleted lists.
 *
 * Reference: http://officeopenxml.com/WPnumbering.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_NumPr">
 *   <xsd:sequence>
 *     <xsd:element name="ilvl" type="CT_DecimalNumber" minOccurs="0"/>
 *     <xsd:element name="numId" type="CT_DecimalNumber" minOccurs="0"/>
 *     <xsd:element name="numberingChange" type="CT_TrackChangeNumbering" minOccurs="0"/>
 *     <xsd:element name="ins" type="CT_TrackChange" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create a bulleted list item at level 0
 * new Paragraph({
 *   numbering: {
 *     reference: "my-bullet-list",
 *     level: 0,
 *   },
 *   children: [new TextRun("First item")],
 * });
 *
 * // Create a numbered list item at level 1
 * new Paragraph({
 *   numbering: {
 *     reference: "my-numbered-list",
 *     level: 1,
 *   },
 *   children: [new TextRun("Nested item")],
 * });
 * ```
 */
export declare class NumberProperties extends XmlComponent {
    constructor(numberId: number | string, indentLevel: number);
}

/**
 * XML element with a numeric value attribute.
 *
 * NumberValueElement creates elements with a single "w:val" attribute
 * containing a numeric value.
 *
 * @example
 * ```typescript
 * new NumberValueElement("w:ilvl", 2);
 * // Generates: <w:ilvl w:val="2"/>
 * ```
 */
export declare class NumberValueElement extends XmlComponent {
    /**
     * Creates a NumberValueElement.
     *
     * @param name - The XML element name
     * @param val - The numeric value
     */
    constructor(name: string, val: number);
}

/**
 * XML element representing a boolean on/off value (CT_OnOff).
 *
 * This element type is used throughout WordprocessingML to represent boolean properties.
 * A value of true (or 1) means the property is enabled. A value of false (or 0) means
 * it is explicitly disabled. When the value is true, the attribute is often omitted.
 *
 * OOXML Reference:
 * ```xml
 * <xsd:complexType name="CT_OnOff">
 *   <xsd:attribute name="val" type="s:ST_OnOff"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Bold enabled (w:val omitted when true)
 * new OnOffElement("w:b", true);
 * // Generates: <w:b/>
 *
 * // Bold explicitly disabled
 * new OnOffElement("w:b", false);
 * // Generates: <w:b w:val="false"/>
 * ```
 */
export declare class OnOffElement extends XmlComponent {
    /**
     * Creates an OnOffElement.
     *
     * @param name - The XML element name (e.g., "w:b", "w:i")
     * @param val - The boolean value (defaults to true)
     */
    constructor(name: string, val?: boolean | undefined);
}

/**
 * Attributes for configuring outline properties.
 */
declare type OutlineAttributes = {
    /** Line width in EMUs (English Metric Units) */
    readonly width?: number;
    /** Line cap style */
    readonly cap?: keyof typeof LineCap;
    /** Compound line type */
    readonly compoundLine?: keyof typeof CompoundLine;
    /** Pen alignment */
    readonly align?: keyof typeof PenAlignment;
};

/**
 * Fill properties for outline.
 */
declare type OutlineFillProperties = OutlineNoFill | OutlineSolidFill;

/**
 * No fill option for outline.
 */
declare type OutlineNoFill = {
    /** No fill type */
    readonly type: "noFill";
};

/**
 * Complete outline configuration options.
 *
 * Combines outline attributes with fill properties.
 */
declare type OutlineOptions = OutlineAttributes & OutlineFillProperties;

/**
 * RGB solid fill for outline.
 */
declare type OutlineRgbSolidFill = {
    /** Solid fill type */
    readonly type: "solidFill";
    /** RGB color type */
    readonly solidFillType: "rgb";
    /** Hex color value (e.g., "FF0000" for red) */
    readonly value: string;
};

/**
 * Scheme-based solid fill for outline.
 */
declare type OutlineSchemeSolidFill = {
    /** Solid fill type */
    readonly type: "solidFill";
    /** Scheme color type */
    readonly solidFillType: "scheme";
    /** Scheme color value */
    readonly value: (typeof SchemeColor)[keyof typeof SchemeColor];
};

/**
 * Union type for solid fill options.
 */
declare type OutlineSolidFill = OutlineRgbSolidFill | OutlineSchemeSolidFill;

/**
 * Output type definitions for document generation.
 *
 * This module defines the various output formats supported when generating
 * .docx files. These types correspond to JSZip's output formats.
 *
 * @module
 */
/**
 * Maps output type names to their corresponding TypeScript types.
 *
 * This type is used to provide type-safe document generation where the output
 * format determines the return type. Based on JSZip's output types.
 *
 * @example
 * ```typescript
 * // Generate as base64 string
 * const doc: OutputByType["base64"] = await packer.toBase64(document);
 *
 * // Generate as Buffer (Node.js)
 * const doc: OutputByType["nodebuffer"] = await packer.toBuffer(document);
 *
 * // Generate as Blob (browser)
 * const doc: OutputByType["blob"] = await packer.toBlob(document);
 * ```
 */
export declare type OutputByType = {
    /** Base64-encoded string representation */
    readonly base64: string;
    /** UTF-8 string representation */
    readonly string: string;
    /** Text string representation */
    readonly text: string;
    /** Binary string representation */
    readonly binarystring: string;
    /** Array of numbers (0-255) representing bytes */
    readonly array: readonly number[];
    /** Uint8Array (typed array) representation */
    readonly uint8array: Uint8Array;
    /** ArrayBuffer representation */
    readonly arraybuffer: ArrayBuffer;
    /** Blob representation (browser environments) */
    readonly blob: Blob;
    /** Node.js Buffer representation */
    readonly nodebuffer: Buffer;
};

/**
 * Valid output type identifiers.
 *
 * Use these string literals to specify the desired output format when
 * generating documents.
 *
 * @example
 * ```typescript
 * const outputType: OutputType = "base64";
 * const doc = await packer.generate(document, { type: outputType });
 * ```
 */
export declare type OutputType = keyof OutputByType;

/**
 * Table overlap behavior types.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_TblOverlap">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="never"/>
 *     <xsd:enumeration value="overlap"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 */
export declare const OverlapType: {
    readonly NEVER: "never";
    readonly OVERLAP: "overlap";
};

/**
 * A part that something in a document adds to the package when it is written, such as a chart, with the relationship to
 * it from the part it is used in: the document, a header, a footer, the footnotes, the endnotes or the comments.
 *
 * The part is added once, however many times it is written, and parts are numbered in the order they are added, such
 * as word/charts/chart1.xml and word/charts/chart2.xml. The XML that refers to the part uses {@link relationshipId}, and
 * calls {@link addTo} from its `prepForXml`.
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * const chart = new PackagePart({
 *   folder: "charts",
 *   name: "chart",
 *   extension: "xml",
 *   contentType: "application/vnd.openxmlformats-officedocument.drawingml.chart+xml",
 *   relationshipType: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart",
 *   content: chartSpace,
 * });
 *
 * class ChartReference extends XmlComponent {
 *   public prepForXml(context: IContext): IXmlableObject | undefined {
 *     chart.addTo(context);
 *     return super.prepForXml(context);
 *   }
 * }
 * ```
 */
export declare class PackagePart {
    readonly options: PackagePartOptions;
    private readonly id;
    /** The id of the relationship to the part, such as a chart's `r:id` in the document */
    readonly relationshipId: string;
    private readonly addedTo;
    /**
     * @throws If the folder isn't a single folder name, or is one of the folders docx writes parts of its own in
     */
    constructor(options: PackagePartOptions);
    /**
     * Adds the part to the package being written, once, and a relationship to it from the part being written.
     */
    addTo(context: IContext): void;
}

/**
 * Options for a {@link PackagePart}.
 */
export declare type PackagePartOptions = {
    /** The folder under word/ the part is written in, such as "charts" */
    readonly folder: string;
    /** The start of the part's file name, which is numbered in the order parts are added: "chart" for word/charts/chart1.xml */
    readonly name: string;
    /** The extension of the part's file name, such as "xml" */
    readonly extension: string;
    /** The part's content type, such as "application/vnd.openxmlformats-officedocument.drawingml.chart+xml" */
    readonly contentType: string;
    /** The type of the relationship to the part from the part that refers to it, such as the chart relationship */
    readonly relationshipType: RelationshipType;
    /**
     * The part's content: XML, formatted as the document's parts are, its bytes, or the files of a package, such as an
     * embedded workbook, which are zipped. XML can refer to other parts by calling their {@link PackagePart.addTo} when
     * it is formatted, as a document does
     */
    readonly content: XmlComponent | Uint8Array | {
        readonly files: readonly EmbeddedPackageFile[];
    };
};

/**
 * The parts added to a document's package when it is written, with their paths under word/, in the order they were
 * added. Not part of the public API: `File` holds one, and the compiler writes its parts, as `patchDocument` does.
 */
declare class PackageParts {
    private readonly contentTypes;
    private readonly existingPaths;
    private readonly paths;
    private readonly folders;
    /**
     * @param contentTypes - Where each part's content type is added
     * @param existingPaths - The paths under word/ of the parts the package already has, such as a template's charts,
     * which new parts are numbered after
     */
    constructor(contentTypes: Pick<ContentTypes, "addOverride">, existingPaths?: ReadonlySet<string>);
    /**
     * Adds a part, and its content type, once.
     *
     * @returns The part's path under word/, such as "charts/chart1.xml"
     */
    add(part: PackagePart): string;
    /**
     * Each part added, with its path under word/, in the order they were added.
     */
    get Array(): readonly {
        readonly part: PackagePart;
        readonly path: string;
    }[];
    /**
     * Creates the relationships of a part whose XML is being written, so the parts its XML refers to are found from its
     * folder.
     *
     * @param path - The part's path under word/
     */
    createRelationships(path: string): Relationships;
    /**
     * The target of a relationship to a part, relative to the part the relationships are from. The document, headers,
     * footers, footnotes, endnotes and comments are all in word/.
     *
     * @param path - The part's path under word/
     */
    getTarget(relationships: Relationships, path: string): string;
}

/**
 * Exports documents to various output formats.
 *
 * The Packer class provides static methods to convert a File object into different
 * output formats such as Buffer, Blob, string, or stream. It handles the compilation
 * of the document structure into OOXML format and compression into a .docx ZIP archive.
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * // Export to buffer (Node.js)
 * const buffer = await Packer.toBuffer(doc);
 *
 * // Export to blob (browser)
 * const blob = await Packer.toBlob(doc);
 *
 * // Export with prettified XML
 * const buffer = await Packer.toBuffer(doc, PrettifyType.WITH_2_BLANKS);
 * ```
 */
export declare class Packer {
    /**
     * Exports a document to the specified output format.
     *
     * @param file - The document to export
     * @param type - The output format type (e.g., "nodebuffer", "blob", "string")
     * @param prettify - Whether to prettify the XML output (boolean or PrettifyType)
     * @param overrides - Optional array of file overrides for custom XML content
     * @returns A promise resolving to the exported document in the specified format
     */
    static pack<T extends OutputType>(file: File_2, type: T, prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType], overrides?: readonly IXmlifyedFile[]): Promise<OutputByType[T]>;
    /**
     * Exports a document to a string representation.
     *
     * @param file - The document to export
     * @param prettify - Whether to prettify the XML output
     * @param overrides - Optional array of file overrides
     * @returns A promise resolving to the document as a string
     */
    static toString(file: File_2, prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType], overrides?: readonly IXmlifyedFile[]): Promise<string>;
    /**
     * Exports a document to a Node.js Buffer.
     *
     * @param file - The document to export
     * @param prettify - Whether to prettify the XML output
     * @param overrides - Optional array of file overrides
     * @returns A promise resolving to the document as a Buffer
     */
    static toBuffer(file: File_2, prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType], overrides?: readonly IXmlifyedFile[]): Promise<Buffer>;
    /**
     * Exports a document to a base64-encoded string.
     *
     * @param file - The document to export
     * @param prettify - Whether to prettify the XML output
     * @param overrides - Optional array of file overrides
     * @returns A promise resolving to the document as a base64 string
     */
    static toBase64String(file: File_2, prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType], overrides?: readonly IXmlifyedFile[]): Promise<string>;
    /**
     * Exports a document to a Blob (for browser environments).
     *
     * @param file - The document to export
     * @param prettify - Whether to prettify the XML output
     * @param overrides - Optional array of file overrides
     * @returns A promise resolving to the document as a Blob
     */
    static toBlob(file: File_2, prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType], overrides?: readonly IXmlifyedFile[]): Promise<Blob>;
    /**
     * Exports a document to an ArrayBuffer.
     *
     * @param file - The document to export
     * @param prettify - Whether to prettify the XML output
     * @param overrides - Optional array of file overrides
     * @returns A promise resolving to the document as an ArrayBuffer
     */
    static toArrayBuffer(file: File_2, prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType], overrides?: readonly IXmlifyedFile[]): Promise<ArrayBuffer>;
    /**
     * Exports a document to a Node.js Stream.
     *
     * @param file - The document to export
     * @param prettify - Whether to prettify the XML output
     * @param overrides - Optional array of file overrides
     * @returns A readable stream containing the document data
     */
    static toStream(file: File_2, prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType], overrides?: readonly IXmlifyedFile[]): Stream;
    private static readonly compiler;
}

/**
 * Specifies which pages display the page border.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_PageBorderDisplay">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="allPages"/>
 *     <xsd:enumeration value="firstPage"/>
 *     <xsd:enumeration value="notFirstPage"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export declare const PageBorderDisplay: {
    /** Display border on all pages */
    readonly ALL_PAGES: "allPages";
    /** Display border only on first page */
    readonly FIRST_PAGE: "firstPage";
    /** Display border on all pages except first page */
    readonly NOT_FIRST_PAGE: "notFirstPage";
};

/**
 * Specifies whether page border is positioned relative to page edge or text.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_PageBorderOffset">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="page"/>
 *     <xsd:enumeration value="text"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export declare const PageBorderOffsetFrom: {
    /** Position border relative to page edge */
    readonly PAGE: "page";
    /** Position border relative to text (default) */
    readonly TEXT: "text";
};

/**
 * Represents page borders (pgBorders) for a document section.
 *
 * This element specifies the borders to display around pages in a section,
 * including which pages display the borders and how they are positioned.
 *
 * Reference: http://officeopenxml.com/WPsectionBorders.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PageBorders">
 *   <xsd:sequence>
 *     <xsd:element name="top" type="CT_TopPageBorder" minOccurs="0"/>
 *     <xsd:element name="left" type="CT_PageBorder" minOccurs="0"/>
 *     <xsd:element name="bottom" type="CT_BottomPageBorder" minOccurs="0"/>
 *     <xsd:element name="right" type="CT_PageBorder" minOccurs="0"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="zOrder" type="ST_PageBorderZOrder" use="optional" default="front"/>
 *   <xsd:attribute name="display" type="ST_PageBorderDisplay" use="optional"/>
 *   <xsd:attribute name="offsetFrom" type="ST_PageBorderOffset" use="optional" default="text"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Add page borders to all pages
 * new PageBorders({
 *   pageBorders: {
 *     display: PageBorderDisplay.ALL_PAGES,
 *     offsetFrom: PageBorderOffsetFrom.PAGE,
 *     zOrder: PageBorderZOrder.FRONT
 *   },
 *   pageBorderTop: { style: BorderStyle.SINGLE, size: 24, color: "000000" },
 *   pageBorderBottom: { style: BorderStyle.SINGLE, size: 24, color: "000000" }
 * });
 * ```
 */
export declare class PageBorders extends IgnoreIfEmptyXmlComponent {
    constructor(options?: IPageBordersOptions);
}

/**
 * Specifies z-order of page border relative to intersecting objects.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_PageBorderZOrder">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="front"/>
 *     <xsd:enumeration value="back"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export declare const PageBorderZOrder: {
    /** Display border behind page contents */
    readonly BACK: "back";
    /** Display border in front of page contents (default) */
    readonly FRONT: "front";
};

/**
 * Represents a page break in a WordprocessingML document.
 *
 * A page break forces text to continue at the beginning of the next page.
 *
 * Reference: http://officeopenxml.com/WPtextSpecialContent-break.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Br">
 *   <xsd:attribute name="type" type="ST_BrType" use="optional"/>
 *   <xsd:attribute name="clear" type="ST_BrClear" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new Paragraph({
 *   children: [new PageBreak()],
 * });
 * ```
 */
export declare class PageBreak extends Run {
    constructor();
}

/**
 * Represents a page break before setting for paragraph properties.
 *
 * When applied to a paragraph, ensures the paragraph begins on a new page.
 *
 * Reference: http://officeopenxml.com/WPparagraphProperties.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_OnOff">
 *   <xsd:attribute name="val" type="s:ST_OnOff" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new Paragraph({
 *   pageBreakBefore: true,
 *   children: [new TextRun("This text starts on a new page")],
 * });
 * ```
 */
export declare class PageBreakBefore extends XmlComponent {
    constructor();
}

/**
 * Constants for page number field types.
 *
 * These values are used to insert dynamic page number fields into a document.
 *
 * Reference: http://officeopenxml.com/WPfields.php
 *
 * @publicApi
 */
export declare const PageNumber: {
    /** Inserts the current page number */
    readonly CURRENT: "CURRENT";
    /** Inserts the total number of pages in the document */
    readonly TOTAL_PAGES: "TOTAL_PAGES";
    /** Inserts the total number of pages in the current section */
    readonly TOTAL_PAGES_IN_SECTION: "TOTAL_PAGES_IN_SECTION";
    /** Inserts the current section number */
    readonly CURRENT_SECTION: "SECTION";
};

/**
 * Represents a page number field element.
 *
 * Inserts the current page number at this position.
 */
export declare class PageNumberElement extends EmptyElement {
    constructor();
}

/**
 * Specifies the separator character between chapter number and page number.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_ChapterSep">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="hyphen"/>
 *     <xsd:enumeration value="period"/>
 *     <xsd:enumeration value="colon"/>
 *     <xsd:enumeration value="emDash"/>
 *     <xsd:enumeration value="enDash"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export declare const PageNumberSeparator: {
    /** Hyphen separator (-) */
    readonly HYPHEN: "hyphen";
    /** Period separator (.) */
    readonly PERIOD: "period";
    /** Colon separator (:) */
    readonly COLON: "colon";
    /** Em dash separator (—) */
    readonly EM_DASH: "emDash";
    /** En dash separator (–) */
    readonly EN_DASH: "endash";
};

/**
 * This simple type specifies the orientation of all pages in the parent section. This information is used to determine the actual paper size to use when printing the file.
 *
 * Reference: https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_ST_PageOrientation_topic_ID0EKBK3.html
 *
 * ## XSD Schema
 *
 * ```xml
 * <xsd:simpleType name="ST_PageOrientation">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="portrait"/>
 *     <xsd:enumeration value="landscape"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export declare const PageOrientation: {
    /**
     * ## Portrait Mode
     *
     * Specifies that pages in this section shall be printed in portrait mode.
     */
    readonly PORTRAIT: "portrait";
    /**
     * ## Landscape Mode
     *
     * Specifies that pages in this section shall be printed in landscape mode, which prints the page contents with a 90 degree rotation with respect to the normal page orientation.
     */
    readonly LANDSCAPE: "landscape";
};

/**
 * Represents a page reference (PAGEREF) field.
 *
 * The PAGEREF field displays the page number of the page containing
 * the specified bookmark, useful for cross-references like "see page 5".
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * // Simple page reference
 * new PageReference("figure_1_bookmark");
 *
 * // With hyperlink
 * new PageReference("table_2", { hyperlink: true });
 *
 * // With relative position (e.g., "above" or "on page 5")
 * new PageReference("section_3", {
 *   hyperlink: true,
 *   useRelativePosition: true,
 * });
 * ```
 */
export declare class PageReference extends Run {
    constructor(bookmarkId: string, options?: IPageReferenceOptions);
}

/**
 * Represents text direction (textDirection) for pages in a section.
 *
 * This element specifies the direction and orientation of text flow
 * for all pages in a section.
 *
 * Reference: http://officeopenxml.com/WPsectionPr.php
 *
 * @example
 * ```typescript
 * // Horizontal text flow (left-to-right, top-to-bottom)
 * new PageTextDirection(PageTextDirectionType.LEFT_TO_RIGHT_TOP_TO_BOTTOM);
 *
 * // Vertical text flow (top-to-bottom, right-to-left)
 * new PageTextDirection(PageTextDirectionType.TOP_TO_BOTTOM_RIGHT_TO_LEFT);
 * ```
 */
export declare class PageTextDirection extends XmlComponent {
    constructor(value: (typeof PageTextDirectionType)[keyof typeof PageTextDirectionType]);
}

/**
 * Specifies the text flow direction for pages in a section.
 *
 * This controls whether text flows horizontally (left-to-right) or
 * vertically (top-to-bottom), commonly used for East Asian languages.
 */
export declare const PageTextDirectionType: {
    /** Left-to-right, top-to-bottom (standard Western text flow) */
    readonly LEFT_TO_RIGHT_TOP_TO_BOTTOM: "lrTb";
    /** Top-to-bottom, right-to-left (vertical East Asian text flow) */
    readonly TOP_TO_BOTTOM_RIGHT_TO_LEFT: "tbRl";
};

/**
 * Represents a paragraph in a WordprocessingML document.
 *
 * A paragraph is the primary unit of block-level content in a document and can contain
 * various inline elements such as text runs, images, hyperlinks, and bookmarks.
 *
 * Reference: http://officeopenxml.com/WPparagraph.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_P">
 *   <xsd:sequence>
 *     <xsd:element name="pPr" type="CT_PPr" minOccurs="0"/>
 *     <xsd:group ref="EG_PContent" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="rsidRPr" type="ST_LongHexNumber"/>
 *   <xsd:attribute name="rsidR" type="ST_LongHexNumber"/>
 *   <xsd:attribute name="rsidDel" type="ST_LongHexNumber"/>
 *   <xsd:attribute name="rsidP" type="ST_LongHexNumber"/>
 *   <xsd:attribute name="rsidRDefault" type="ST_LongHexNumber"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Simple paragraph with text
 * new Paragraph("Hello World");
 *
 * // Paragraph with options
 * new Paragraph({
 *   children: [new TextRun("Hello"), new TextRun({ text: "World", bold: true })],
 *   alignment: AlignmentType.CENTER,
 * });
 * ```
 */
export declare class Paragraph extends FileChild {
    private readonly properties;
    constructor(options: string | IParagraphOptions);
    prepForXml(context: IContext): IXmlableObject | undefined;
    addRunToFront(run: Run): Paragraph;
}

/**
 * The types of children that can be contained within a Paragraph element.
 * This union type represents all valid inline content elements that can appear
 * within a paragraph in WordprocessingML.
 */
export declare type ParagraphChild = TextRun | ImageRun | SymbolRun | Bookmark | PageBreak | ColumnBreak | SequentialIdentifier | FootnoteReferenceRun | InternalHyperlink | ExternalHyperlink | InsertedTextRun | DeletedTextRun | Math_2 | SimpleField | SimpleMailMergeField | Comments | Comment_2 | CommentRangeStart | CommentRangeEnd | CommentReference | CheckBox;

/**
 * Patch definition for paragraph-level replacement.
 *
 * Replaces placeholder text with inline content (runs, hyperlinks, etc.)
 * while preserving the surrounding paragraph structure.
 */
declare type ParagraphPatch = {
    /** Indicates this is a paragraph-level patch */
    readonly type: typeof PatchType.PARAGRAPH;
    /** Content to insert (runs, hyperlinks, images, etc.) */
    readonly children: readonly ParagraphChild[];
};

/**
 * Represents paragraph properties (pPr) in a WordprocessingML document.
 *
 * The paragraph properties element specifies all formatting applied to a paragraph,
 * including alignment, spacing, indentation, borders, numbering, and style references.
 *
 * Reference: http://officeopenxml.com/WPparagraphProperties.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PPr">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_PPrBase">
 *       <xsd:sequence>
 *         <xsd:element name="rPr" type="CT_ParaRPr" minOccurs="0"/>
 *         <xsd:element name="sectPr" type="CT_SectPr" minOccurs="0"/>
 *         <xsd:element name="pPrChange" type="CT_PPrChange" minOccurs="0"/>
 *       </xsd:sequence>
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 * ```
 *
 * The base type CT_PPrBase contains:
 * ```xml
 * <xsd:complexType name="CT_PPrBase">
 *   <xsd:sequence>
 *     <xsd:element name="pStyle" type="CT_String" minOccurs="0"/>
 *     <xsd:element name="keepNext" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="keepLines" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="pageBreakBefore" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="framePr" type="CT_FramePr" minOccurs="0"/>
 *     <xsd:element name="widowControl" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="numPr" type="CT_NumPr" minOccurs="0"/>
 *     <xsd:element name="suppressLineNumbers" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="pBdr" type="CT_PBdr" minOccurs="0"/>
 *     <xsd:element name="shd" type="CT_Shd" minOccurs="0"/>
 *     <xsd:element name="tabs" type="CT_Tabs" minOccurs="0"/>
 *     <xsd:element name="suppressAutoHyphens" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="kinsoku" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="wordWrap" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="overflowPunct" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="topLinePunct" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="autoSpaceDE" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="autoSpaceDN" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="bidi" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="adjustRightInd" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="snapToGrid" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="spacing" type="CT_Spacing" minOccurs="0"/>
 *     <xsd:element name="ind" type="CT_Ind" minOccurs="0"/>
 *     <xsd:element name="contextualSpacing" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="mirrorIndents" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="suppressOverlap" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="jc" type="CT_Jc" minOccurs="0"/>
 *     <xsd:element name="textDirection" type="CT_TextDirection" minOccurs="0"/>
 *     <xsd:element name="textAlignment" type="CT_TextAlignment" minOccurs="0"/>
 *     <xsd:element name="textboxTightWrap" type="CT_TextboxTightWrap" minOccurs="0"/>
 *     <xsd:element name="outlineLvl" type="CT_DecimalNumber" minOccurs="0"/>
 *     <xsd:element name="divId" type="CT_DecimalNumber" minOccurs="0"/>
 *     <xsd:element name="cnfStyle" type="CT_Cnf" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Basic paragraph with alignment
 * new ParagraphProperties({
 *   alignment: AlignmentType.CENTER,
 * });
 *
 * // Formatted paragraph with spacing and indentation
 * new ParagraphProperties({
 *   alignment: AlignmentType.JUSTIFIED,
 *   spacing: { before: 200, after: 200, line: 360 },
 *   indent: { left: 720, right: 720 },
 * });
 *
 * // Heading with outline level
 * new ParagraphProperties({
 *   heading: HeadingLevel.HEADING_1,
 *   outlineLevel: 0,
 *   keepNext: true,
 * });
 *
 * // Numbered list item
 * new ParagraphProperties({
 *   numbering: {
 *     reference: "my-numbering",
 *     level: 0,
 *     instance: 0,
 *   },
 * });
 *
 * // Paragraph with borders and shading
 * new ParagraphProperties({
 *   border: {
 *     top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
 *     bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
 *   },
 *   shading: { fill: "EEEEEE" },
 * });
 * ```
 */
export declare class ParagraphProperties extends IgnoreIfEmptyXmlComponent {
    private readonly numberingReferences;
    /**
     * Creates paragraph properties.
     *
     * @param options - The paragraph formatting to emit
     * @param config - Controls how the element is assembled; see {@link IParagraphPropertiesConfig}
     */
    constructor(options?: IParagraphPropertiesOptions, { implicitListParagraphStyle }?: IParagraphPropertiesConfig);
    /**
     * Adds a property element to the paragraph properties.
     *
     * @param item - The XML component to add to the paragraph properties
     */
    push(item: XmlComponent): void;
    /**
     * Prepares the paragraph properties for XML serialization.
     *
     * This method creates concrete numbering instances for any numbering references
     * before the properties are converted to XML.
     *
     * @param context - The XML context containing document and file information
     * @returns The prepared XML object, or undefined if the component should be ignored
     */
    prepForXml(context: IContext): IXmlableObject | undefined;
}

export declare class ParagraphPropertiesChange extends XmlComponent {
    constructor(options: IParagraphPropertiesChangeOptions);
}

/**
 * Represents default paragraph properties in a WordprocessingML document.
 *
 * This element defines the default paragraph formatting properties that apply
 * to all paragraphs in the document unless overridden.
 *
 * Reference: http://officeopenxml.com/WPstyles.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PPrDefault">
 *   <xsd:sequence>
 *     <xsd:element name="pPr" type="CT_PPrGeneral" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Set default paragraph spacing
 * new ParagraphPropertiesDefaults({
 *   spacing: { after: 200, line: 276 }
 * });
 * ```
 */
export declare class ParagraphPropertiesDefaults extends XmlComponent {
    constructor(options?: IParagraphStylePropertiesOptions);
}

export declare class ParagraphRunProperties extends RunProperties {
    constructor(options?: IParagraphRunPropertiesOptions);
}

/**
 * Detects all placeholders present in a document template.
 *
 * Scans through all XML content in a .docx file to find placeholder text
 * enclosed in delimiters (default: {{placeholder}}), and placeholders in the
 * alt text of drawings, such as a chart for `docx/charts`' `ChartDataPatch`.
 * This is useful for discovering what patches a template expects before
 * performing replacement.
 *
 * @param options - Patch detector configuration
 * @returns Array of placeholder keys found in the document
 *
 * @example
 * ```typescript
 * const placeholders = await patchDetector({ data: templateBuffer });
 * // Returns: ["name", "date", "address"] if template contains {{name}}, {{date}}, {{address}}
 *
 * // Use detected placeholders to create patches
 * const patches = {};
 * placeholders.forEach(key => {
 *   patches[key] = {
 *     type: PatchType.PARAGRAPH,
 *     children: [new TextRun(getUserData(key))],
 *   };
 * });
 * ```
 */
export declare const patchDetector: ({ data }: PatchDetectorOptions) => Promise<readonly string[]>;

/**
 * Options for patch detection.
 *
 * @property data - The document template to scan for placeholders
 */
declare type PatchDetectorOptions = {
    readonly data: InputDataType;
};

/**
 * Patches an existing .docx document by replacing placeholders with new content.
 *
 * This function opens an existing Word document, searches for placeholder text
 * (e.g., {{name}}), and replaces it with the provided content while preserving
 * the original document structure and optionally the original formatting.
 *
 * @param options - Configuration options for patching
 * @returns A promise resolving to the patched document in the specified output format
 *
 * @example
 * ```typescript
 * // Patch with paragraph content
 * const buffer = await patchDocument({
 *   outputType: "nodebuffer",
 *   data: templateBuffer,
 *   patches: {
 *     name: {
 *       type: PatchType.PARAGRAPH,
 *       children: [new TextRun({ text: "John Doe", bold: true })],
 *     },
 *   },
 * });
 *
 * // Patch with custom delimiters
 * const buffer = await patchDocument({
 *   outputType: "nodebuffer",
 *   data: templateBuffer,
 *   patches: { ... },
 *   placeholderDelimiters: { start: "<<", end: ">>" },
 * });
 * ```
 *
 * @publicApi
 */
export declare const patchDocument: <T extends PatchDocumentOutputType = PatchDocumentOutputType>({ outputType, data, patches, keepOriginalStyles, placeholderDelimiters, recursive, }: PatchDocumentOptions<T>) => Promise<OutputByType[T]>;

/**
 * Options for patching a document.
 *
 * @property outputType - Desired output format (buffer, blob, string, etc.)
 * @property data - The input document to patch
 * @property patches - Map of placeholder keys to patch definitions
 * @property keepOriginalStyles - Whether to preserve original text formatting
 * @property placeholderDelimiters - Custom delimiter characters for placeholders
 * @property recursive - Whether to replace every occurrence of a placeholder in a paragraph, rather than only the first
 */
export declare type PatchDocumentOptions<T extends PatchDocumentOutputType = PatchDocumentOutputType> = {
    /** Output format type */
    readonly outputType: T;
    /** Input document data */
    readonly data: InputDataType;
    /**
     * Mapping of placeholder keys to patch content, or to a {@link DrawingPatch}, such as `docx/charts`' `ChartDataPatch`,
     * for a drawing whose alt text holds the placeholder
     */
    readonly patches: Readonly<Record<string, IPatch | DrawingPatch>>;
    /** Preserve original formatting of replaced text (default: true) */
    readonly keepOriginalStyles?: boolean;
    /** Custom placeholder delimiters (default: {{ and }}) */
    readonly placeholderDelimiters?: Readonly<{
        readonly start: string;
        readonly end: string;
    }>;
    /** Replace every occurrence of a placeholder in a paragraph, rather than only the first (default: true) */
    readonly recursive?: boolean;
};

/**
 * Output format types for patched documents.
 */
export declare type PatchDocumentOutputType = OutputType;

/**
 * Patch type enumeration.
 *
 * Determines how the replacement content should be inserted into the document.
 *
 * @publicApi
 */
export declare const PatchType: {
    /** Replace entire file-level elements (e.g., whole paragraphs) */
    readonly DOCUMENT: "file";
    /** Replace content within paragraphs (inline replacement) */
    readonly PARAGRAPH: "paragraph";
    /**
     * Change a drawing whose alt text holds the placeholder, and the parts it refers to, such as the data of a chart made
     * in Word. See {@link DrawingPatch}
     */
    readonly DRAWING: "drawing";
};

/**
 * Pen alignment options for outline positioning.
 *
 * Defines how the outline is aligned relative to the shape edge.
 */
declare const PenAlignment: {
    /** Center alignment */
    readonly CENTER: "ctr";
    /** Inset alignment */
    readonly INSET: "in";
};

/**
 * A percentage value with optional sign.
 *
 * Pattern: `-?[0-9]+(\.[0-9]+)?%`
 *
 * Reference: ST_Percentage in OOXML specification
 *
 * @example
 * ```typescript
 * const percent: Percentage = "50%";
 * const negative: Percentage = "-10.5%";
 * ```
 */
export declare type Percentage = `${"-" | ""}${number}%`;

/**
 * Normalizes a percentage value by parsing and reformatting.
 *
 * Reference: ST_Percentage in OOXML specification
 *
 * @param val - The percentage string to normalize
 * @returns The normalized percentage
 *
 * @example
 * ```typescript
 * const percent = percentageValue("50.000%"); // Returns "50%"
 * ```
 */
export declare const percentageValue: (val: Percentage) => Percentage;

/**
 * Validates a point measurement value.
 *
 * Reference: ST_PointMeasure in OOXML specification
 *
 * @param val - The measurement value in points
 * @returns The validated positive integer value
 *
 * @example
 * ```typescript
 * const fontSize = pointMeasureValue(12); // 12pt
 * ```
 */
export declare const pointMeasureValue: (val: number) => number;

/**
 * Represents a positional tab element for a WordprocessingML document.
 *
 * A positional tab is an absolute position tab stop that is typically used
 * in bidirectional text scenarios. Unlike normal tabs, positional tabs specify
 * an exact alignment and position within the paragraph.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PTab">
 *   <xsd:attribute name="alignment" type="ST_PTabAlignment" use="required" />
 *   <xsd:attribute name="relativeTo" type="ST_PTabRelativeTo" use="required" />
 *   <xsd:attribute name="leader" type="ST_PTabLeader" use="required" />
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create a centered positional tab
 * new PositionalTab({
 *   alignment: PositionalTabAlignment.CENTER,
 *   relativeTo: PositionalTabRelativeTo.MARGIN,
 *   leader: PositionalTabLeader.DOT,
 * });
 * ```
 */
export declare class PositionalTab extends XmlComponent {
    constructor(options: PositionalTabOptions);
}

/**
 * Positional tab alignment types.
 *
 * Specifies how text is aligned at the positional tab stop.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_PTabAlignment">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="left" />
 *     <xsd:enumeration value="center" />
 *     <xsd:enumeration value="right" />
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export declare const PositionalTabAlignment: {
    /** Left-aligned tab */
    readonly LEFT: "left";
    /** Center-aligned tab */
    readonly CENTER: "center";
    /** Right-aligned tab */
    readonly RIGHT: "right";
};

/**
 * Positional tab leader character types.
 *
 * Specifies the character used to fill the space before the tab.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_PTabLeader">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="none" />
 *     <xsd:enumeration value="dot" />
 *     <xsd:enumeration value="hyphen" />
 *     <xsd:enumeration value="underscore" />
 *     <xsd:enumeration value="middleDot" />
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export declare const PositionalTabLeader: {
    /** No leader character */
    readonly NONE: "none";
    /** Dot leader (...) */
    readonly DOT: "dot";
    /** Hyphen leader (---) */
    readonly HYPHEN: "hyphen";
    /** Underscore leader (___) */
    readonly UNDERSCORE: "underscore";
    /** Middle dot leader (···) */
    readonly MIDDLE_DOT: "middleDot";
};

/**
 * Options for creating a PositionalTab.
 *
 * @property alignment - How text is aligned at the tab stop
 * @property relativeTo - What the tab position is relative to
 * @property leader - Character used to fill space before the tab
 */
export declare type PositionalTabOptions = {
    /** How text is aligned at the tab stop */
    readonly alignment: (typeof PositionalTabAlignment)[keyof typeof PositionalTabAlignment];
    /** What the tab position is relative to */
    readonly relativeTo: (typeof PositionalTabRelativeTo)[keyof typeof PositionalTabRelativeTo];
    /** Character used to fill space before the tab */
    readonly leader: (typeof PositionalTabLeader)[keyof typeof PositionalTabLeader];
};

/**
 * Positional tab relative positioning types.
 *
 * Specifies what the positional tab position is relative to.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_PTabRelativeTo">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="margin" />
 *     <xsd:enumeration value="indent" />
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export declare const PositionalTabRelativeTo: {
    /** Position relative to margin */
    readonly MARGIN: "margin";
    /** Position relative to indent */
    readonly INDENT: "indent";
};

/**
 * A positive percentage value.
 *
 * Same as Percentage but restricted to positive values only.
 *
 * Reference: ST_PositivePercentage in OOXML specification
 *
 * @example
 * ```typescript
 * const percent: PositivePercentage = "50%";
 * ```
 */
export declare type PositivePercentage = `${number}%`;

/**
 * A positive measurement value with unit suffix.
 *
 * Same as UniversalMeasure but restricted to positive values only.
 *
 * Reference: ST_PositiveUniversalMeasure in OOXML specification
 *
 * @example
 * ```typescript
 * const measure: PositiveUniversalMeasure = "10.5mm";
 * ```
 */
export declare type PositiveUniversalMeasure = `${number}${"mm" | "cm" | "in" | "pt" | "pc" | "pi"}`;

/**
 * Validates and normalizes a positive universal measure value.
 *
 * Reference: ST_PositiveUniversalMeasure in OOXML specification
 *
 * @param val - The positive universal measure string to validate
 * @returns The normalized positive universal measure
 * @throws Error if the value is negative
 *
 * @example
 * ```typescript
 * const measure = positiveUniversalMeasureValue("10.5mm"); // Valid
 * const invalid = positiveUniversalMeasureValue("-5mm"); // Throws Error
 * ```
 */
export declare const positiveUniversalMeasureValue: (val: PositiveUniversalMeasure) => PositiveUniversalMeasure;

/**
 * Prettify options for formatting XML output.
 *
 * Controls the indentation style used when formatting the generated XML.
 * Prettified output is more human-readable but results in larger file sizes.
 *
 * @publicApi
 */
export declare const PrettifyType: {
    /** No prettification (smallest file size) */
    readonly NONE: "";
    /** Indent with 2 spaces */
    readonly WITH_2_BLANKS: "  ";
    /** Indent with 4 spaces */
    readonly WITH_4_BLANKS: "    ";
    /** Indent with tab character */
    readonly WITH_TAB: "\t";
};

declare type RegularImageOptions = {
    /** The image format. */
    readonly type: "jpg" | "png" | "gif" | "bmp";
    /** The image data. Accepts a Buffer, Uint8Array, ArrayBuffer, or a base64-encoded data URI string. */
    readonly data: Buffer | string | Uint8Array | ArrayBuffer;
};

/**
 * Regular raster image formats.
 */
declare type RegularMediaData = {
    /** Image format type */
    readonly type: "jpg" | "png" | "gif" | "bmp";
};

/**
 * Represents a collection of relationships in an OPC package.
 *
 * Relationships define connections between package parts, such as
 * linking the main document to its headers, footers, images, etc.
 *
 * Reference: http://officeopenxml.com/anatomyofOOXML.php
 *
 * @example
 * ```typescript
 * const relationships = new Relationships();
 * relationships.addRelationship(
 *   1,
 *   "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
 *   "media/image1.png"
 * );
 * ```
 */
declare class Relationships extends XmlComponent {
    constructor();
    /**
     * Creates a new relationship to another part in the package.
     *
     * @param id - Unique identifier for this relationship (will be prefixed with "rId")
     * @param type - Relationship type URI (e.g., image, header, hyperlink)
     * @param target - Path to the target part
     * @param targetMode - Optional mode indicating if target is external
     */
    addRelationship(id: number | string, type: RelationshipType, target: string, targetMode?: (typeof TargetModeType)[keyof typeof TargetModeType]): void;
    /**
     * Gets the count of relationships in this collection.
     * Excludes the attributes element from the count.
     */
    get RelationshipCount(): number;
}

/**
 * Supported relationship type URIs.
 *
 * These URIs define the type of relationship between parts in an OPC package.
 * Each type corresponds to a specific kind of document component or resource.
 */
export declare type RelationshipType = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/webSettings" | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" | "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties" | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes" | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/endnotes" | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments" | "http://schemas.microsoft.com/office/2011/relationships/commentsExtended" | "http://schemas.microsoft.com/office/2016/09/relationships/commentsIds" | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/font" | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/package";

/**
 * Relative horizontal position values for floating tables.
 */
export declare const RelativeHorizontalPosition: {
    readonly CENTER: "center";
    readonly INSIDE: "inside";
    readonly LEFT: "left";
    readonly OUTSIDE: "outside";
    readonly RIGHT: "right";
};

/**
 * A relative measurement value using em or ex units.
 *
 * Used in VML text boxes for font-relative measurements.
 *
 * @example
 * ```typescript
 * const measure: RelativeMeasure = "2em";
 * const negative: RelativeMeasure = "-0.5ex";
 * ```
 */
export declare type RelativeMeasure = `${"-" | ""}${number}${"em" | "ex"}`;

/**
 * Relative vertical position values for floating tables.
 */
export declare const RelativeVerticalPosition: {
    readonly CENTER: "center";
    readonly INSIDE: "inside";
    readonly BOTTOM: "bottom";
    readonly OUTSIDE: "outside";
    readonly INLINE: "inline";
    readonly TOP: "top";
};

/**
 * RGB color options for solid fill.
 */
declare type RgbColorOptions = {
    /** RGB color type */
    readonly type: "rgb";
    /** Hex color value (e.g., "FF0000" for red) */
    readonly value: string;
};

/**
 * Represents a run of text with uniform formatting in a WordprocessingML document.
 *
 * A run is the lowest level unit of text in a paragraph. All content within a run
 * shares the same formatting properties (bold, italic, font, size, etc.).
 *
 * Reference: http://officeopenxml.com/WPtext.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_R">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_RPr" minOccurs="0"/>
 *     <xsd:group ref="EG_RunInnerContent" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="rsidRPr" type="ST_LongHexNumber"/>
 *   <xsd:attribute name="rsidDel" type="ST_LongHexNumber"/>
 *   <xsd:attribute name="rsidR" type="ST_LongHexNumber"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Simple run with text
 * new Run({ text: "Hello World" });
 *
 * // Bold and italic run
 * new Run({ text: "Formatted", bold: true, italics: true });
 *
 * // Run with page number
 * new Run({ children: [PageNumber.CURRENT] });
 * ```
 */
export declare class Run extends XmlComponent {
    protected readonly properties: RunProperties;
    private readonly following;
    constructor(options: IRunOptions);
    get writtenAs(): readonly BaseXmlComponent[] | undefined;
}

/**
 * Represents run properties (rPr) in a WordprocessingML document.
 *
 * Run properties specify all character-level formatting applied to text,
 * such as bold, italic, font, size, color, underline, and other text effects.
 *
 * Reference: http://officeopenxml.com/WPtextFormatting.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_RPr">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_RPrContent" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * The EG_RPrBase group includes elements like rStyle, rFonts, b, bCs, i, iCs,
 * caps, smallCaps, strike, dstrike, outline, shadow, emboss, imprint, noProof,
 * snapToGrid, vanish, color, spacing, w, kern, position, sz, szCs, highlight,
 * u, effect, bdr, shd, vertAlign, rtl, em, lang, and more.
 */
export declare class RunProperties extends IgnoreIfEmptyXmlComponent {
    constructor(options?: IRunPropertiesOptions);
    push(item: XmlComponent): void;
}

/**
 * Represents a run properties change element for revision tracking.
 *
 * This element is used to track changes to run properties when revision
 * tracking is enabled in the document.
 */
export declare class RunPropertiesChange extends XmlComponent {
    constructor(options: IRunPropertiesChangeOptions);
}

/**
 * Represents default run properties in a WordprocessingML document.
 *
 * This element defines the default text run formatting properties that apply
 * to all text runs in the document unless overridden by styles or direct formatting.
 *
 * Reference: http://officeopenxml.com/WPstyles.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_RPrDefault">
 *   <xsd:sequence>
 *     <xsd:element name="rPr" type="CT_RPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Set default font and size
 * new RunPropertiesDefaults({
 *   font: "Calibri",
 *   size: 22
 * });
 * ```
 */
export declare class RunPropertiesDefaults extends XmlComponent {
    constructor(options?: IRunStylePropertiesOptions);
}

/**
 * Scheme color values for theme-based colors.
 *
 * These values reference colors defined in the document's color scheme/theme.
 */
export declare const SchemeColor: {
    /** Background color 1 */
    readonly BG1: "bg1";
    /** Text color 1 */
    readonly TX1: "tx1";
    /** Background color 2 */
    readonly BG2: "bg2";
    /** Text color 2 */
    readonly TX2: "tx2";
    /** Accent color 1 */
    readonly ACCENT1: "accent1";
    /** Accent color 2 */
    readonly ACCENT2: "accent2";
    /** Accent color 3 */
    readonly ACCENT3: "accent3";
    /** Accent color 4 */
    readonly ACCENT4: "accent4";
    /** Accent color 5 */
    readonly ACCENT5: "accent5";
    /** Accent color 6 */
    readonly ACCENT6: "accent6";
    /** Hyperlink color */
    readonly HLINK: "hlink";
    /** Followed hyperlink color */
    readonly FOLHLINK: "folHlink";
    /** Dark color 1 */
    readonly DK1: "dk1";
    /** Light color 1 */
    readonly LT1: "lt1";
    /** Dark color 2 */
    readonly DK2: "dk2";
    /** Light color 2 */
    readonly LT2: "lt2";
    /** Placeholder color */
    readonly PHCLR: "phClr";
};

/**
 * Scheme color options for solid fill.
 */
declare type SchemeColorOptions = {
    /** Scheme color type */
    readonly type: "scheme";
    /** Scheme color value */
    readonly value: (typeof SchemeColor)[keyof typeof SchemeColor];
};

/**
 * Default margin values for sections (in twips).
 *
 * Standard margins are 1 inch (1440 twips) on all sides.
 * Header/footer margins are 0.5 inches (708 twips) from page edge.
 *
 * @property TOP - Top margin: 1440 twips (1 inch)
 * @property RIGHT - Right margin: 1440 twips (1 inch)
 * @property BOTTOM - Bottom margin: 1440 twips (1 inch)
 * @property LEFT - Left margin: 1440 twips (1 inch)
 * @property HEADER - Header margin: 708 twips (0.5 inches)
 * @property FOOTER - Footer margin: 708 twips (0.5 inches)
 * @property GUTTER - Gutter margin: 0 twips
 */
export declare const sectionMarginDefaults: {
    /** Top margin: 1440 twips (1 inch) */
    TOP: number;
    /** Right margin: 1440 twips (1 inch) */
    RIGHT: number;
    /** Bottom margin: 1440 twips (1 inch) */
    BOTTOM: number;
    /** Left margin: 1440 twips (1 inch) */
    LEFT: number;
    /** Header margin from top: 708 twips (0.5 inches) */
    HEADER: number;
    /** Footer margin from bottom: 708 twips (0.5 inches) */
    FOOTER: number;
    /** Gutter margin for binding: 0 twips */
    GUTTER: number;
};

/**
 * Default page size values (in twips, A4 portrait).
 *
 * A4 size is 210mm x 297mm (8.27" x 11.69").
 *
 * @property WIDTH - Page width: 11906 twips (8.27 inches, 210mm)
 * @property HEIGHT - Page height: 16838 twips (11.69 inches, 297mm)
 * @property ORIENTATION - Page orientation: portrait
 */
export declare const sectionPageSizeDefaults: {
    /** Page width: 11906 twips (8.27 inches, 210mm) */
    WIDTH: number;
    /** Page height: 16838 twips (11.69 inches, 297mm) */
    HEIGHT: number;
    /** Page orientation: portrait */
    ORIENTATION: "portrait";
};

/**
 * Represents section properties (sectPr) in a WordprocessingML document.
 *
 * Section properties define the page layout for a section of the document,
 * including page size, margins, headers/footers, columns, and page numbering.
 * A document can contain multiple sections with different properties.
 *
 * Reference: http://officeopenxml.com/WPsection.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SectPr">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_HdrFtrReferences" minOccurs="0" maxOccurs="6"/>
 *     <xsd:group ref="EG_SectPrContents" minOccurs="0"/>
 *     <xsd:element name="sectPrChange" type="CT_SectPrChange" minOccurs="0"/>
 *   </xsd:sequence>
 *   <xsd:attributeGroup ref="AG_SectPrAttributes"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create section with custom page size and margins
 * new SectionProperties({
 *   page: {
 *     size: {
 *       width: 12240,
 *       height: 15840,
 *       orientation: PageOrientation.PORTRAIT
 *     },
 *     margin: {
 *       top: 1440,
 *       right: 1440,
 *       bottom: 1440,
 *       left: 1440
 *     },
 *     pageNumbers: {
 *       start: 1,
 *       formatType: NumberFormat.DECIMAL
 *     }
 *   },
 *   column: {
 *     count: 2,
 *     space: 720
 *   }
 * });
 * ```
 */
export declare class SectionProperties extends XmlComponent {
    /**
     * Width, in twips, available to block-level content in this section.
     *
     * This is the page width (accounting for orientation) minus the left and right
     * margins and the gutter. When the section is laid out in several columns, it is
     * the width of a single column. Percentage table widths are resolved against it.
     */
    private readonly availableTextWidth;
    constructor({ page: { size: { width, height, orientation, code, }, margin: { top, right, bottom, left, header, footer, gutter, }, pageNumbers, borders, textDirection, }, grid: { linePitch, charSpace, type: gridType }, headerWrapperGroup, footerWrapperGroup, lineNumbers, titlePage, verticalAlign, column, type, revision, }?: ISectionPropertiesOptions);
    /**
     * Width, in twips, available to block-level content (paragraphs and tables) in this section.
     *
     * Page width minus the left and right margins and the gutter, divided among the
     * section's columns when there is more than one. Tables use this to resolve
     * percentage widths into the absolute twip grid that Google Docs, Apple Pages and
     * other consumers lay tables out from.
     *
     * @example
     * ```typescript
     * // A4 portrait with 1 inch margins
     * new SectionProperties().AvailableTextWidth; // 11906 - 1440 - 1440 = 9026
     * ```
     */
    get AvailableTextWidth(): number;
    private static calculateAvailableTextWidth;
    private addHeaderFooterGroup;
}

export declare class SectionPropertiesChange extends XmlComponent {
    constructor(options: ISectionPropertiesChangeOptions);
}

/**
 * Specifies the type of section break.
 *
 * This determines where the section begins relative to the previous section.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_SectionMark">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="nextPage"/>
 *     <xsd:enumeration value="nextColumn"/>
 *     <xsd:enumeration value="continuous"/>
 *     <xsd:enumeration value="evenPage"/>
 *     <xsd:enumeration value="oddPage"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export declare const SectionType: {
    /** Section begins on the next page */
    readonly NEXT_PAGE: "nextPage";
    /** Section begins on the next column */
    readonly NEXT_COLUMN: "nextColumn";
    /** Section begins immediately following the previous section */
    readonly CONTINUOUS: "continuous";
    /** Section begins on the next even-numbered page */
    readonly EVEN_PAGE: "evenPage";
    /** Section begins on the next odd-numbered page */
    readonly ODD_PAGE: "oddPage";
};

export declare type SectionVerticalAlign = (typeof VerticalAlignSection)[keyof typeof VerticalAlignSection];

/**
 * Represents a separator line for footnotes or endnotes.
 *
 * Used to create the separator line between document content and footnotes/endnotes.
 */
export declare class Separator extends EmptyElement {
    constructor();
}

/**
 * Represents a sequential identifier field in a WordprocessingML document.
 *
 * SequentialIdentifier creates a SEQ field that automatically numbers items in a document.
 * Each identifier maintains its own sequence, allowing you to have separate numbering
 * for figures, tables, equations, etc.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_R">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_RunInnerContent" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create a figure number
 * new SequentialIdentifier("Figure");
 *
 * // Create a table number
 * new SequentialIdentifier("Table");
 *
 * // Create an equation number
 * new SequentialIdentifier("Equation");
 * ```
 */
export declare class SequentialIdentifier extends Run {
    constructor(identifier: string);
}

/**
 * Represents document settings in a WordprocessingML document.
 *
 * Settings contain document-wide configuration options such as
 * compatibility mode, track changes, hyphenation, and more.
 *
 * Reference: http://officeopenxml.com/WPsettings.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Settings">
 *   <xsd:sequence>
 *     <xsd:element name="trackRevisions" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="defaultTabStop" type="CT_TwipsMeasure" minOccurs="0"/>
 *     <xsd:element name="autoHyphenation" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="consecutiveHyphenLimit" type="CT_DecimalNumber" minOccurs="0"/>
 *     <xsd:element name="hyphenationZone" type="CT_TwipsMeasure" minOccurs="0"/>
 *     <xsd:element name="doNotHyphenateCaps" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="evenAndOddHeaders" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="updateFields" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="compat" type="CT_Compat" minOccurs="0"/>
 *     <!-- Additional elements omitted for brevity -->
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Basic settings with track changes enabled
 * new Settings({
 *   trackRevisions: true,
 *   evenAndOddHeaders: true,
 * });
 *
 * // Settings with compatibility mode and hyphenation
 * new Settings({
 *   compatibility: {
 *     version: 15, // Word 2013+
 *   },
 *   hyphenation: {
 *     autoHyphenation: true,
 *     consecutiveHyphenLimit: 2,
 *   },
 * });
 * ```
 */
declare class Settings extends XmlComponent {
    constructor(options: ISettingsOptions);
}

/**
 * Shading pattern types.
 *
 * Specifies the pattern used for shading. The pattern combines the fill
 * color and the pattern color.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_Shd">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="nil"/>
 *     <xsd:enumeration value="clear"/>
 *     <xsd:enumeration value="solid"/>
 *     <xsd:enumeration value="horzStripe"/>
 *     <xsd:enumeration value="vertStripe"/>
 *     <xsd:enumeration value="reverseDiagStripe"/>
 *     <xsd:enumeration value="diagStripe"/>
 *     <xsd:enumeration value="horzCross"/>
 *     <xsd:enumeration value="diagCross"/>
 *     <!-- ... percent values ... -->
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export declare const ShadingType: {
    /** Clear shading - no pattern, fill color only */
    readonly CLEAR: "clear";
    readonly DIAGONAL_CROSS: "diagCross";
    readonly DIAGONAL_STRIPE: "diagStripe";
    readonly HORIZONTAL_CROSS: "horzCross";
    readonly HORIZONTAL_STRIPE: "horzStripe";
    readonly NIL: "nil";
    readonly PERCENT_5: "pct5";
    readonly PERCENT_10: "pct10";
    readonly PERCENT_12: "pct12";
    readonly PERCENT_15: "pct15";
    readonly PERCENT_20: "pct20";
    readonly PERCENT_25: "pct25";
    readonly PERCENT_30: "pct30";
    readonly PERCENT_35: "pct35";
    readonly PERCENT_37: "pct37";
    readonly PERCENT_40: "pct40";
    readonly PERCENT_45: "pct45";
    readonly PERCENT_50: "pct50";
    readonly PERCENT_55: "pct55";
    readonly PERCENT_60: "pct60";
    readonly PERCENT_62: "pct62";
    readonly PERCENT_65: "pct65";
    readonly PERCENT_70: "pct70";
    readonly PERCENT_75: "pct75";
    readonly PERCENT_80: "pct80";
    readonly PERCENT_85: "pct85";
    readonly PERCENT_87: "pct87";
    readonly PERCENT_90: "pct90";
    readonly PERCENT_95: "pct95";
    readonly REVERSE_DIAGONAL_STRIPE: "reverseDiagStripe";
    readonly SOLID: "solid";
    readonly THIN_DIAGONAL_CROSS: "thinDiagCross";
    readonly THIN_DIAGONAL_STRIPE: "thinDiagStripe";
    readonly THIN_HORIZONTAL_CROSS: "thinHorzCross";
    readonly THIN_REVERSE_DIAGONAL_STRIPE: "thinReverseDiagStripe";
    readonly THIN_VERTICAL_STRIPE: "thinVertStripe";
    readonly VERTICAL_STRIPE: "vertStripe";
};

/**
 * Validates a short hexadecimal number (2 bytes / 4 characters).
 *
 * Reference: ST_ShortHexNumber in OOXML specification
 *
 * @param val - The hexadecimal string to validate
 * @returns The validated hexadecimal string
 * @throws Error if the value is not a valid 4-character hex string
 *
 * @example
 * ```typescript
 * const hex = shortHexNumber("AB12"); // Valid
 * ```
 */
export declare const shortHexNumber: (val: string) => string;

/**
 * Validates a signed half-point (HPS) measurement value.
 *
 * Accepts either a universal measure string or a numeric value.
 *
 * Reference: ST_SignedHpsMeasure in OOXML specification
 *
 * @param val - The measurement value (universal measure or number)
 * @returns The normalized measurement value
 *
 * @example
 * ```typescript
 * const spacing1 = signedHpsMeasureValue("6pt");
 * const spacing2 = signedHpsMeasureValue(-12); // Negative spacing
 * ```
 */
export declare const signedHpsMeasureValue: (val: UniversalMeasure | number) => string | number;

/**
 * Validates a signed TWIP measurement value.
 *
 * Accepts either a universal measure string or a numeric TWIP value.
 *
 * Reference: ST_SignedTwipsMeasure in OOXML specification
 *
 * @param val - The measurement value (universal measure or number)
 * @returns The normalized measurement value
 *
 * @example
 * ```typescript
 * const measure1 = signedTwipsMeasureValue("10mm");
 * const measure2 = signedTwipsMeasureValue(1440); // 1 inch in TWIP
 * ```
 */
export declare const signedTwipsMeasureValue: (val: UniversalMeasure | number) => UniversalMeasure | number;

/**
 * Represents a simple field in a WordprocessingML document.
 *
 * A simple field (fldSimple) contains both the field code and the optional cached value
 * in a single element, unlike complex fields which use separate begin/end markers.
 * Simple fields are typically used for fields that don't require complex nesting.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-w_fldSimple-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SimpleField">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_PContent" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="instr" type="s:ST_String" use="required"/>
 *   <xsd:attribute name="fldLock" type="s:ST_OnOff"/>
 *   <xsd:attribute name="dirty" type="s:ST_OnOff"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Simple field with instruction
 * new SimpleField("DATE");
 *
 * // Simple field with cached value
 * new SimpleField("DATE", "2024-01-01");
 * ```
 */
export declare class SimpleField extends XmlComponent {
    constructor(instruction: string, cachedValue?: string);
}

/**
 * Represents a mail merge field in a WordprocessingML document.
 *
 * SimpleMailMergeField is a specialized simple field for mail merge operations.
 * It creates a MERGEFIELD that will be populated with data during mail merge.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * @example
 * ```typescript
 * // Creates a merge field for "FirstName"
 * new SimpleMailMergeField("FirstName");
 * // Renders as: MERGEFIELD FirstName with placeholder «FirstName»
 * ```
 */
export declare class SimpleMailMergeField extends SimpleField {
    constructor(fieldName: string);
}

/**
 * Represents a soft hyphen (optional hyphen) character.
 *
 * Inserts a hyphen that only appears when a word is broken across lines.
 */
export declare class SoftHyphen extends EmptyElement {
    constructor();
}

/**
 * Union type for solid fill options.
 */
declare type SolidFillOptions = RgbColorOptions | SchemeColorOptions;

/**
 * XML space handling modes.
 *
 * Controls how whitespace is handled in text elements.
 *
 * @example
 * ```typescript
 * // Preserve whitespace (spaces, newlines)
 * SpaceType.PRESERVE;
 *
 * // Default whitespace handling
 * SpaceType.DEFAULT;
 * ```
 *
 * @publicApi
 */
export declare const SpaceType: {
    readonly DEFAULT: "default";
    readonly PRESERVE: "preserve";
};

export declare const standardizeData: (data: string | Buffer | Uint8Array | ArrayBuffer) => Buffer | Uint8Array | ArrayBuffer;

/**
 * XML element containing text content.
 *
 * StringContainer creates elements with text content (not attributes).
 * This is used for elements where the value is the text node content
 * rather than an attribute.
 *
 * @example
 * ```typescript
 * new StringContainer("w:author", "John Doe");
 * // Generates: <w:author>John Doe</w:author>
 * ```
 */
export declare class StringContainer extends XmlComponent {
    /**
     * Creates a StringContainer.
     *
     * @param name - The XML element name
     * @param val - The text content
     */
    constructor(name: string, val: string);
}

/**
 * XML element with a string enum value attribute.
 *
 * StringEnumValueElement is similar to StringValueElement but uses a generic
 * type parameter to enforce type safety for enum values.
 *
 * @example
 * ```typescript
 * type AlignmentType = "left" | "center" | "right";
 * new StringEnumValueElement<AlignmentType>("w:jc", "center");
 * // Generates: <w:jc w:val="center"/>
 * ```
 */
export declare class StringEnumValueElement<T extends string> extends XmlComponent {
    /**
     * Creates a StringEnumValueElement.
     *
     * @param name - The XML element name
     * @param val - The enum value
     */
    constructor(name: string, val: T);
}

/**
 * XML element with a string value attribute (CT_String).
 *
 * StringValueElement creates elements with a single "w:val" attribute
 * containing a string value.
 *
 * OOXML Reference:
 * ```xml
 * <xsd:complexType name="CT_String">
 *   <xsd:attribute name="val" type="s:ST_String" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new StringValueElement("w:style", "Heading1");
 * // Generates: <w:style w:val="Heading1"/>
 * ```
 */
export declare class StringValueElement extends XmlComponent {
    /**
     * Creates a StringValueElement.
     *
     * @param name - The XML element name
     * @param val - The string value
     */
    constructor(name: string, val: string);
}

/**
 * Represents a base style definition in a WordprocessingML document.
 *
 * This is the base class for paragraph and character styles. It defines common
 * style properties such as name, inheritance (basedOn), UI priority, and visibility.
 *
 * Reference: http://officeopenxml.com/WPstyles.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Style">
 *   <xsd:sequence>
 *     <xsd:element name="name" type="CT_String" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="aliases" type="CT_String" minOccurs="0"/>
 *     <xsd:element name="basedOn" type="CT_String" minOccurs="0"/>
 *     <xsd:element name="next" type="CT_String" minOccurs="0"/>
 *     <xsd:element name="link" type="CT_String" minOccurs="0"/>
 *     <xsd:element name="autoRedefine" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="hidden" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="uiPriority" type="CT_DecimalNumber" minOccurs="0"/>
 *     <xsd:element name="semiHidden" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="unhideWhenUsed" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="qFormat" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="locked" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="personal" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="personalCompose" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="personalReply" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="rsid" type="CT_LongHexNumber" minOccurs="0"/>
 *     <xsd:element name="pPr" type="CT_PPrGeneral" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="rPr" type="CT_RPr" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tblPr" type="CT_TblPrBase" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="trPr" type="CT_TrPr" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tcPr" type="CT_TcPr" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tblStylePr" type="CT_TblStylePr" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="type" type="ST_StyleType" use="optional"/>
 *   <xsd:attribute name="styleId" type="s:ST_String" use="optional"/>
 *   <xsd:attribute name="default" type="s:ST_OnOff" use="optional"/>
 *   <xsd:attribute name="customStyle" type="s:ST_OnOff" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // This is typically extended by StyleForParagraph or StyleForCharacter
 * // See those classes for usage examples
 * ```
 */
declare class Style extends XmlComponent {
    constructor(attributes: IStyleAttributes, options: IStyleOptions);
}

/**
 * Represents a character style in a WordprocessingML document.
 *
 * Character styles apply formatting to individual runs of text within a paragraph,
 * such as font, size, color, bold, italic, and other text-level formatting.
 *
 * Reference: http://officeopenxml.com/WPstyles.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Style">
 *   <xsd:sequence>
 *     <!-- Style elements including rPr for run properties -->
 *     <xsd:element name="rPr" type="CT_RPr" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="type" type="ST_StyleType" use="optional"/>
 *   <xsd:attribute name="styleId" type="s:ST_String" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create a custom character style for highlighting
 * new StyleForCharacter({
 *   id: "Highlight",
 *   name: "Highlight Text",
 *   basedOn: "DefaultParagraphFont",
 *   run: {
 *     color: "FF0000",
 *     bold: true
 *   }
 * });
 * ```
 */
export declare class StyleForCharacter extends Style {
    private readonly runProperties;
    constructor(options: ICharacterStyleOptions);
}

/**
 * Represents a paragraph style in a WordprocessingML document.
 *
 * Paragraph styles apply formatting to entire paragraphs, including both
 * paragraph-level properties (spacing, alignment, indentation) and
 * run-level properties (font, size, color) for text within the paragraph.
 *
 * Reference: http://officeopenxml.com/WPstyles.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Style">
 *   <xsd:sequence>
 *     <!-- Style elements including pPr for paragraph properties -->
 *     <xsd:element name="pPr" type="CT_PPrGeneral" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="rPr" type="CT_RPr" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="type" type="ST_StyleType" use="optional"/>
 *   <xsd:attribute name="styleId" type="s:ST_String" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create a custom heading style
 * new StyleForParagraph({
 *   id: "CustomHeading",
 *   name: "Custom Heading",
 *   basedOn: "Normal",
 *   paragraph: {
 *     spacing: { before: 240, after: 120 },
 *     alignment: AlignmentType.LEFT
 *   },
 *   run: {
 *     size: 28,
 *     bold: true,
 *     color: "2E74B5"
 *   }
 * });
 * ```
 */
export declare class StyleForParagraph extends Style {
    private readonly paragraphProperties;
    private readonly runProperties;
    constructor(options: IParagraphStyleOptions);
}

/**
 * Table of Contents Properties module.
 *
 * This module defines configuration options for table of contents generation,
 * including field switches and style mappings.
 *
 * Reference: http://officeopenxml.com/WPtableOfContents.php
 *
 * @module
 */
/**
 * Represents a style-to-level mapping for table of contents entries.
 *
 * StyleLevel associates a paragraph style name with a TOC level, allowing
 * custom styles to be included in the table of contents at specific levels.
 *
 * @publicApi
 */
export declare class StyleLevel {
    /** The name of the paragraph style. */
    readonly styleName: string;
    /** The TOC level (1-9) to assign to this style. */
    readonly level: number;
    constructor(styleName: string, level: number);
}

/**
 * Represents the styles definitions in a WordprocessingML document.
 *
 * The styles element contains document defaults, latent styles, and
 * individual style definitions for paragraphs and characters. Styles provide
 * a way to define consistent formatting across a document.
 *
 * Reference: http://officeopenxml.com/WPstyles.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Styles">
 *   <xsd:sequence>
 *     <xsd:element name="docDefaults" type="CT_DocDefaults" minOccurs="0"/>
 *     <xsd:element name="latentStyles" type="CT_LatentStyles" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="style" type="CT_Style" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create styles with custom paragraph and character styles
 * new Styles({
 *   paragraphStyles: [{
 *     id: "CustomHeading",
 *     name: "Custom Heading",
 *     basedOn: "Normal",
 *     run: { bold: true, size: 28 }
 *   }],
 *   characterStyles: [{
 *     id: "Highlight",
 *     name: "Highlight",
 *     run: { color: "FF0000" }
 *   }]
 * });
 * ```
 */
export declare class Styles extends XmlComponent {
    constructor(options: IStylesOptions);
    /**
     * Writes the styles in the schema's order: the document defaults, the latent styles, then the styles. A style id
     * can only be used once, so a style replaces an earlier one with its id. That way external styles replace docx's
     * default styles, and paragraph and character styles replace the default and imported ones. Of several document
     * defaults, or several latent styles, the last is kept. Normal is marked as the default paragraph style when no
     * style is.
     */
    prepForXml(context: IContext): IXmlableObject;
}

/**
 * SVG image format with fallback support.
 */
declare type SvgMediaData = {
    /** SVG image type */
    readonly type: "svg";
    /**
     * Fallback image for Word processors that do not support SVG.
     * This ensures the document displays correctly in all viewers.
     */
    readonly fallback: RegularMediaData & CoreMediaData;
};

declare type SvgMediaOptions = {
    /** The image format. Must be `"svg"` for SVG images. */
    readonly type: "svg";
    /** The SVG image data. Accepts a Buffer, Uint8Array, ArrayBuffer, or a base64-encoded data URI string. */
    readonly data: Buffer | string | Uint8Array | ArrayBuffer;
    /** A non-SVG fallback image, required for Word processors that do not support SVG rendering. */
    readonly fallback: RegularImageOptions;
};

/**
 * Represents a symbol character in a WordprocessingML document.
 *
 * SymbolRun is used to insert special characters from symbol fonts.
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * new SymbolRun({
 *   char: "F04A",
 *   symbolfont: "Wingdings",
 * });
 * ```
 */
export declare class SymbolRun extends Run {
    constructor(options: ISymbolRunOptions | string);
}

/**
 * Represents a tab character.
 *
 * Inserts a tab stop, advancing to the next tab position in the paragraph.
 *
 * @publicApi
 */
export declare class Tab extends EmptyElement {
    constructor();
}

/**
 * Represents a table in a WordprocessingML document.
 *
 * A table is a set of paragraphs (and other block-level content) arranged in rows and columns.
 * Tables are used to organize content into a grid structure.
 *
 * Reference: http://officeopenxml.com/WPtable.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Tbl">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_RangeMarkupElements" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="tblPr" type="CT_TblPr"/>
 *     <xsd:element name="tblGrid" type="CT_TblGrid"/>
 *     <xsd:group ref="EG_ContentRowContent" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new Table({
 *   rows: [
 *     new TableRow({
 *       children: [
 *         new TableCell({ children: [new Paragraph("Cell 1")] }),
 *         new TableCell({ children: [new Paragraph("Cell 2")] }),
 *       ],
 *     }),
 *   ],
 * });
 * ```
 */
export declare class Table extends FileChild {
    private readonly rows;
    private readonly width;
    private readonly columnWidths;
    private readonly columnWidthsRevision;
    /**
     * Grid column widths in twips: the explicit `columnWidths`, or the widths derived
     * from the table and cell widths (re-resolved against the actual page or parent
     * cell every time the table is serialized).
     */
    private resolvedColumnWidths;
    constructor({ rows, width, columnWidths, columnWidthsRevision, margins, indent, float, layout, style, borders, alignment, visuallyRightToLeft, tableLook, cellSpacing, revision, }: ITableOptions);
    /**
     * Widths of the grid columns in twips, as they will be written to `w:tblGrid`.
     *
     * These are the explicit `columnWidths` when given, otherwise the widths derived
     * from the table and cell widths. Derived widths are resolved against the page (or
     * the parent cell for nested tables) during serialization, so before that they
     * reflect the default page size.
     */
    get ColumnWidths(): readonly number[];
    /**
     * Width in twips, according to the grid, of a cell in one of this table's rows.
     *
     * Used by nested tables to resolve their own widths against the cell they sit in.
     *
     * @param row - A row of this table
     * @param cell - A cell of that row
     * @returns The summed width of the grid columns the cell spans, or undefined if the cell cannot be located on the grid
     */
    getCellWidth(row: TableRow, cell: TableCell): number | undefined;
    /**
     * Resolves derived grid column widths against the width actually available to the
     * table (the section's text width, or the parent cell for nested tables) before
     * serializing.
     */
    prepForXml(context: IContext): IXmlableObject | undefined;
    /**
     * Finds the width in twips available to this table from the serialization context:
     * the parent cell for a nested table, otherwise the text width of the section the
     * table belongs to (the first section for headers, footers and other parts). Falls
     * back to the default page when the context carries no document.
     */
    private resolveAvailableWidth;
}

/**
 * Anchor types for floating table positioning.
 *
 * Specifies the base object from which positioning is determined.
 */
export declare const TableAnchorType: {
    readonly MARGIN: "margin";
    readonly PAGE: "page";
    readonly TEXT: "text";
};

/**
 * Represents table borders in a WordprocessingML document.
 *
 * The tblBorders element specifies the borders for all cells in the table.
 *
 * Reference: http://officeopenxml.com/WPtableBorders.php
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * new TableBorders({
 *   top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
 *   bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
 * });
 *
 * // To remove all borders
 * new TableBorders(TableBorders.NONE);
 * ```
 */
export declare class TableBorders extends XmlComponent {
    /**
     * No borders. Its borders are declared with hex colors, as they were before borders took colors of the document's
     * theme, so that code reading them still compiles.
     */
    static readonly NONE: {
        readonly [Side in keyof ITableBordersOptions]: HexColorBorderOptions;
    };
    constructor(options: ITableBordersOptions);
}

/**
 * Represents a table cell in a WordprocessingML document.
 *
 * A table cell is the basic unit of content within a table. Each cell can contain
 * paragraphs, nested tables, or other block-level content. Cells must always end
 * with a paragraph element.
 *
 * Reference: http://officeopenxml.com/WPtableCell.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Tc">
 *   <xsd:sequence>
 *     <xsd:element name="tcPr" type="CT_TcPr" minOccurs="0" maxOccurs="1"/>
 *     <xsd:group ref="EG_BlockLevelElts" minOccurs="1" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="id" type="s:ST_String" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new TableCell({
 *   children: [new Paragraph("Cell content")],
 *   width: { size: 3000, type: WidthType.DXA },
 * });
 * ```
 */
export declare class TableCell extends XmlComponent {
    /**
     * The options the cell was created with.
     *
     * Its borders and shading are declared with hex colors, as they were before they took colors of the document's
     * theme, so that code reading them still compiles. A cell given a theme color has it here as it was given.
     */
    readonly options: WithHexColors<Omit<ITableCellOptions, "revision">> & {
        readonly revision?: WithHexColors<NonNullable<ITableCellOptions["revision"]>>;
    };
    constructor(options: ITableCellOptions);
    prepForXml(context: IContext): IXmlableObject | undefined;
}

/**
 * Represents table cell borders (tcBorders) in a WordprocessingML document.
 *
 * The tcBorders element specifies the borders for a single table cell. Each border
 * can be configured independently with different styles, colors, and widths.
 *
 * Reference: http://officeopenxml.com/WPtableCell.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_TcBorders">
 *   <xsd:sequence>
 *     <xsd:element name="top" type="CT_Border" minOccurs="0"/>
 *     <xsd:element name="start" type="CT_Border" minOccurs="0"/>
 *     <xsd:element name="left" type="CT_Border" minOccurs="0"/>
 *     <xsd:element name="bottom" type="CT_Border" minOccurs="0"/>
 *     <xsd:element name="end" type="CT_Border" minOccurs="0"/>
 *     <xsd:element name="right" type="CT_Border" minOccurs="0"/>
 *     <xsd:element name="insideH" type="CT_Border" minOccurs="0"/>
 *     <xsd:element name="insideV" type="CT_Border" minOccurs="0"/>
 *     <xsd:element name="tl2br" type="CT_Border" minOccurs="0"/>
 *     <xsd:element name="tr2bl" type="CT_Border" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new TableCellBorders({
 *   top: { style: BorderStyle.SINGLE, size: 6, color: "FF0000" },
 *   bottom: { style: BorderStyle.SINGLE, size: 6, color: "0000FF" },
 * });
 * ```
 */
export declare class TableCellBorders extends IgnoreIfEmptyXmlComponent {
    constructor(options: ITableCellBorders);
}

/**
 * Table layout algorithm types.
 *
 * Specifies how the table width is calculated.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_TblLayoutType">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="fixed"/>
 *     <xsd:enumeration value="autofit"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export declare const TableLayoutType: {
    /** Auto-fit layout - column widths are adjusted based on content */
    readonly AUTOFIT: "autofit";
    /** Fixed layout - column widths are fixed as specified */
    readonly FIXED: "fixed";
};

/**
 * Represents a Table of Contents in a WordprocessingML document.
 *
 * TableOfContents creates an auto-generated list of document headings
 * with page numbers. It uses a TOC field code to generate entries.
 *
 * Reference: http://officeopenxml.com/WPtableOfContents.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SdtBlock">
 *   <xsd:sequence>
 *     <xsd:element name="sdtPr" type="CT_SdtPr" minOccurs="0"/>
 *     <xsd:element name="sdtEndPr" type="CT_SdtEndPr" minOccurs="0"/>
 *     <xsd:element name="sdtContent" type="CT_SdtContentBlock" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new TableOfContents("Contents", {
 *   hyperlink: true,
 *   headingStyleRange: "1-3",
 * });
 * ```
 */
export declare class TableOfContents extends FileChild {
    constructor(alias?: string, { contentChildren, cachedEntries, beginDirty, ...properties }?: ITableOfContentsOptions & {
        readonly contentChildren?: readonly (XmlComponent | string)[];
        /**
         * Use this to provide pre-generated entries for the Table of Contents.
         *
         * Note that indentation should come from the paragraph styles defined on the document. By default the styles are TOC1, TOC2, etc. These can be overridden with stylesWithLevels (\t)
         */
        readonly cachedEntries?: readonly ToCEntry[];
        readonly beginDirty?: boolean;
    });
    private getTabStopsForLevel;
    private buildCachedContentRun;
    private buildCachedContentParagraphChild;
}

/**
 * Represents table properties (tblPr) in a WordprocessingML document.
 *
 * The tblPr element specifies the properties for a table including width,
 * alignment, borders, margins, and layout.
 *
 * Reference: http://officeopenxml.com/WPtableProperties.php
 */
export declare class TableProperties extends IgnoreIfEmptyXmlComponent {
    constructor(options: ITablePropertiesOptions);
}

/**
 * Represents a table row in a WordprocessingML document.
 *
 * A table row is a single row of cells within a table. Each row contains
 * one or more table cells that hold the actual content.
 *
 * Reference: http://officeopenxml.com/WPtableRow.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Row">
 *   <xsd:sequence>
 *     <xsd:element name="tblPrEx" type="CT_TblPrEx" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="trPr" type="CT_TrPr" minOccurs="0" maxOccurs="1"/>
 *     <xsd:group ref="EG_ContentCellContent" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="rsidRPr" type="ST_LongHexNumber"/>
 *   <xsd:attribute name="rsidR" type="ST_LongHexNumber"/>
 *   <xsd:attribute name="rsidDel" type="ST_LongHexNumber"/>
 *   <xsd:attribute name="rsidTr" type="ST_LongHexNumber"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new TableRow({
 *   children: [
 *     new TableCell({ children: [new Paragraph("Cell 1")] }),
 *     new TableCell({ children: [new Paragraph("Cell 2")] }),
 *   ],
 * });
 * ```
 */
export declare class TableRow extends XmlComponent {
    private readonly options;
    constructor(options: ITableRowOptions);
    get CellCount(): number;
    get cells(): readonly TableCell[];
    addCellToIndex(cell: TableCell, index: number): void;
    addCellToColumnIndex(cell: TableCell, columnIndex: number): void;
    rootIndexToColumnIndex(rootIndex: number): number;
    columnIndexToRootIndex(columnIndex: number, allowEndNewCell?: boolean): number;
}

/**
 * Represents table row properties (trPr) in a WordprocessingML document.
 *
 * The trPr element specifies properties for a table row including height,
 * whether it can split across pages, and whether it's a header row.
 *
 * Reference: http://officeopenxml.com/WPtableRowProperties.php
 *
 * @example
 * ```typescript
 * new TableRowProperties({
 *   cantSplit: true,
 *   tableHeader: true,
 *   height: {
 *     value: 1000,
 *     rule: HeightRule.EXACT,
 *   },
 * });
 * ```
 */
export declare class TableRowProperties extends IgnoreIfEmptyXmlComponent {
    constructor(options: ITableRowPropertiesOptions);
}

export declare class TableRowPropertiesChange extends XmlComponent {
    constructor(options: ITableRowPropertiesChangeOptions);
}

export declare type TableVerticalAlign = (typeof VerticalAlignTable)[keyof typeof VerticalAlignTable];

/**
 * Definition for a single tab stop.
 *
 * @property type - The type of tab stop alignment
 * @property position - The position of the tab stop in twips. A fraction is rounded down to a whole number of twips
 * @property leader - Optional leader character to fill space before the tab
 *
 * @see {@link TabStop}
 */
export declare type TabStopDefinition = {
    /** The type of tab stop alignment */
    readonly type: (typeof TabStopType)[keyof typeof TabStopType];
    /** The position of the tab stop in twips. A fraction is rounded down to a whole number of twips */
    readonly position: number | (typeof TabStopPosition)[keyof typeof TabStopPosition];
    /** Optional leader character to fill space before the tab */
    readonly leader?: (typeof LeaderType)[keyof typeof LeaderType];
};

/**
 * Predefined tab stop positions.
 *
 * @publicApi
 */
export declare const TabStopPosition: {
    /** Maximum tab stop position (right margin) */
    readonly MAX: 9026;
};

/**
 * Tab stop alignment types.
 *
 * Specifies the type of tab stop and how text aligns to it.
 *
 * @publicApi
 */
export declare const TabStopType: {
    /** Left-aligned tab stop */
    readonly LEFT: "left";
    /** Right-aligned tab stop */
    readonly RIGHT: "right";
    /** Center-aligned tab stop */
    readonly CENTER: "center";
    /** Bar tab stop - inserts a vertical bar at the position */
    readonly BAR: "bar";
    /** Clears a tab stop at the specified position */
    readonly CLEAR: "clear";
    /** Decimal-aligned tab stop - aligns on decimal point */
    readonly DECIMAL: "decimal";
    /** End-aligned tab stop (right-to-left equivalent) */
    readonly END: "end";
    /** List tab stop for numbered lists */
    readonly NUM: "num";
    /** Start-aligned tab stop (left-to-right equivalent) */
    readonly START: "start";
};

/**
 * Target mode types for relationships.
 *
 * Indicates whether a relationship target is external to the package.
 */
declare const TargetModeType: {
    /** Target is external to the package (e.g., hyperlink to a URL) */
    readonly EXTERNAL: "External";
};

/**
 * Represents a text direction (textDirection) element in a WordprocessingML document.
 *
 * The textDirection element specifies the flow of text within a table cell. This is
 * useful for creating rotated text or supporting different writing systems.
 *
 * Reference: http://officeopenxml.com/WPtableCell.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_TextDirection">
 *   <xsd:attribute name="val" type="ST_TextDirection" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Vertical text flowing from top to bottom
 * new TDirection(TextDirection.TOP_TO_BOTTOM_RIGHT_TO_LEFT);
 * ```
 */
export declare class TDirection extends XmlComponent {
    constructor(value: (typeof TextDirection)[keyof typeof TextDirection]);
}

/**
 * A drawing in a template whose alt text holds a placeholder, such as a chart made in Word.
 *
 * @publicApi
 */
export declare type TemplateDrawing = {
    /** The placeholder, with its delimiters, such as "{{sales}}" */
    readonly placeholder: string;
    /**
     * The drawing, `wp:inline` or `wp:anchor`, or in a group or drawing canvas, its `graphicFrame`, which a patch can
     * change in place
     */
    readonly element: Element_2;
    /** The drawing's non-visual properties, `wp:docPr` or `wpg:cNvPr`, whose `descr` and `title` are its alt text */
    readonly properties: Element_2;
    /** The part the drawing is in, such as the document or a header */
    readonly part: TemplatePart;
};

/**
 * What a {@link DrawingPatch} can do with the template's package.
 *
 * @publicApi
 */
export declare type TemplatePackage = {
    /**
     * The part a relationship of a part refers to, such as the chart a drawing's `c:chart` refers to by its `r:id`.
     *
     * @returns The part, or undefined if the part has no such relationship, the relationship is to something outside the
     * package, or the package has no such part
     */
    readonly getRelatedPart: (from: TemplatePart, relationshipId: string) => TemplatePart | undefined;
    /**
     * Points a relationship of a part to a new part, such as a chart's to a new workbook, or adds the relationship if the
     * part has none with the id. The part the relationship referred to is removed from the package, unless something
     * else refers to it.
     *
     * @param relationshipId - The relationship's id, or undefined for a new relationship
     * @returns The relationship's id
     */
    readonly replaceRelatedPart: (from: TemplatePart, relationshipId: string | undefined, part: PackagePart) => string;
    /** Formats XML as the template's parts are parsed, to put in one of them */
    readonly format: (content: XmlComponent) => Element_2;
};

/**
 * A part of a template's package, as a {@link DrawingPatch} sees it.
 *
 * @publicApi
 */
export declare type TemplatePart = {
    /** The part's path in the package, such as "word/charts/chart1.xml" */
    readonly path: string;
    /** The part's XML, parsed, which a patch can change in place, or undefined if the part isn't XML, such as a workbook */
    readonly xml: Element_2 | undefined;
};

/**
 * Represents a textbox in a WordprocessingML document.
 *
 * A Textbox creates a floating text container using VML shapes that can be positioned
 * anywhere on the page. Unlike regular paragraphs, textboxes support absolute positioning,
 * custom dimensions, and text wrapping control.
 *
 * The textbox is implemented as a paragraph with a run containing a picture element (w:pict)
 * with a VML shape (v:shape) that contains a VML textbox (v:textbox) with the actual content.
 * In a paragraph's children, the textbox is only the run, in that paragraph, and its own
 * paragraph options, such as its alignment, don't apply.
 *
 * @publicApi
 *
 * ## XSD Schema
 * The Textbox combines multiple OOXML elements:
 * - w:p (paragraph container)
 * - w:r (run containing the picture)
 * - w:pict (picture element containing VML)
 * - v:shape (VML shape with styling)
 * - v:textbox (VML textbox content container)
 * - w:txbxContent (WordprocessingML textbox content)
 *
 * @example
 * ```typescript
 * // Simple textbox with text
 * new Textbox({
 *   children: [new Paragraph("Hello World")],
 *   style: {
 *     width: "3in",
 *     height: "1in"
 *   }
 * });
 *
 * // Positioned textbox with wrapping
 * new Textbox({
 *   children: [
 *     new Paragraph({
 *       children: [
 *         new TextRun({ text: "Floating Text", bold: true }),
 *         new TextRun({ text: " in a textbox", break: 1 })
 *       ]
 *     })
 *   ],
 *   style: {
 *     width: "2.5in",
 *     height: "1.5in",
 *     position: "absolute",
 *     left: "1in",
 *     top: "2in",
 *     wrapStyle: "square"
 *   }
 * });
 *
 * // Textbox in a paragraph, after its text
 * new Paragraph({
 *   children: [
 *     new TextRun("See the note: "),
 *     new Textbox({
 *       children: [new Paragraph("A note")],
 *       style: { width: "2in", height: "auto" }
 *     })
 *   ]
 * });
 * ```
 */
export declare class Textbox extends FileChild {
    private readonly run;
    constructor({ style, children, ...rest }: ITextboxOptions);
    prepForXml(context: IContext): IXmlableObject | undefined;
}

/**
 * Text direction values for table cells.
 *
 * Specifies the direction in which text flows within a table cell.
 */
export declare const TextDirection: {
    /** Text flows from bottom to top, left to right */
    readonly BOTTOM_TO_TOP_LEFT_TO_RIGHT: "btLr";
    /** Text flows from left to right, top to bottom (default) */
    readonly LEFT_TO_RIGHT_TOP_TO_BOTTOM: "lrTb";
    /** Text flows from top to bottom, right to left */
    readonly TOP_TO_BOTTOM_RIGHT_TO_LEFT: "tbRl";
};

/**
 * Text animation effect types.
 *
 * These effects specify animations that can be applied to text. Note that
 * these effects are deprecated and may not be supported by all applications.
 *
 * Reference: http://officeopenxml.com/WPtextFormatting.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_TextEffect">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="blinkBackground"/>
 *     <xsd:enumeration value="lights"/>
 *     <xsd:enumeration value="antsBlack"/>
 *     <xsd:enumeration value="antsRed"/>
 *     <xsd:enumeration value="shimmer"/>
 *     <xsd:enumeration value="sparkle"/>
 *     <xsd:enumeration value="none"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export declare const TextEffect: {
    /** Blinking background animation */
    readonly BLINK_BACKGROUND: "blinkBackground";
    /** Lights animation effect */
    readonly LIGHTS: "lights";
    /** Black marching ants animation */
    readonly ANTS_BLACK: "antsBlack";
    /** Red marching ants animation */
    readonly ANTS_RED: "antsRed";
    /** Shimmer animation effect */
    readonly SHIMMER: "shimmer";
    /** Sparkle animation effect */
    readonly SPARKLE: "sparkle";
    /** No text effect */
    readonly NONE: "none";
};

/**
 * Represents a text run in a WordprocessingML document.
 *
 * TextRun is a convenience class that extends Run, allowing you to pass
 * either a string or full run options. This is the most common way to
 * add text content to a paragraph.
 *
 * Reference: http://officeopenxml.com/WPtext.php
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * // Simple text
 * new TextRun("Hello World");
 *
 * // Formatted text
 * new TextRun({ text: "Bold Text", bold: true });
 * ```
 */
export declare class TextRun extends Run {
    constructor(options: IRunOptions | string);
}

/**
 * Enumeration of text wrapping sides for floating drawings.
 *
 * Specifies on which side(s) text can wrap around the drawing.
 *
 * Reference: http://officeopenxml.com/drwPicFloating-textWrap.php
 *
 * @publicApi
 */
export declare const TextWrappingSide: {
    /** Text wraps on both sides of the drawing */
    readonly BOTH_SIDES: "bothSides";
    /** Text wraps only on the left side */
    readonly LEFT: "left";
    /** Text wraps only on the right side */
    readonly RIGHT: "right";
    /** Text wraps on the side with more space */
    readonly LARGEST: "largest";
};

/**
 * Enumeration of text wrapping types for floating drawings.
 *
 * Reference: http://officeopenxml.com/drwPicFloating-textWrap.php
 *
 * @publicApi
 */
export declare const TextWrappingType: {
    /** Text doesn't wrap around the drawing. It is drawn in front of or behind the text */
    readonly NONE: 0;
    /** Text wraps around the drawing's box */
    readonly SQUARE: 1;
    /** Text wraps closely around the drawing's outline */
    readonly TIGHT: 2;
    /** Text sits above and below the drawing, not beside it */
    readonly TOP_AND_BOTTOM: 3;
    /** Text wraps closely around the drawing's outline, and fills any open space inside it */
    readonly THROUGH: 4;
};

/**
 * Represents a thematic break (horizontal rule) in a WordprocessingML document.
 *
 * Creates a horizontal line across the paragraph using a bottom border.
 *
 * Reference: http://officeopenxml.com/WPborders.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PBdr">
 *   <xsd:sequence>
 *     <xsd:element name="bottom" type="CT_Border" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new Paragraph({
 *   thematicBreak: true,
 *   children: [new TextRun("Paragraph with horizontal rule below")],
 * });
 * ```
 */
export declare class ThematicBreak extends XmlComponent {
    constructor();
}

/**
 * Represents the theme of a document, written to `word/theme/theme1.xml`.
 *
 * Every document has one: Office's theme, from Office 2016 to 2021, with the colors and fonts the options give.
 *
 * Reference: http://officeopenxml.com/drwTheme.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="theme" type="CT_OfficeStyleSheet"/>
 *
 * <xsd:complexType name="CT_OfficeStyleSheet">
 *   <xsd:sequence>
 *     <xsd:element name="themeElements" type="CT_BaseStyles" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="objectDefaults" type="CT_ObjectStyleDefaults" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extraClrSchemeLst" type="CT_ColorSchemeList" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="custClrLst" type="CT_CustomColorList" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="name" type="xsd:string" use="optional" default=""/>
 * </xsd:complexType>
 *
 * <xsd:complexType name="CT_BaseStyles">
 *   <xsd:sequence>
 *     <xsd:element name="clrScheme" type="CT_ColorScheme" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="fontScheme" type="CT_FontScheme" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="fmtScheme" type="CT_StyleMatrix" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // A document whose theme has a green accent and Georgia for headings
 * const doc = new Document({
 *   theme: { colors: { accent1: "2E7D32" }, fonts: { headings: "Georgia" } },
 *   sections: [],
 * });
 * ```
 */
export declare class Theme extends XmlComponent {
    private readonly colors;
    constructor({ name, colors, fonts }?: IThemeOptions);
    /**
     * The hex color of each of the theme's colors. The system's window text and window colors are black and white.
     */
    get Colors(): Readonly<Record<ThemeColorName, string>>;
}

/**
 * A color of the document's theme, lighter or darker if you like, as Word's color menus offer them: "Blue, Accent 1,
 * Lighter 40%" is `{ theme: "accent1", lighter: 40 }`. It changes when the theme's colors change.
 *
 * @publicApi
 */
export declare type ThemeColor = {
    /** The theme's color, such as `"accent1"` or `"dark2"` */
    readonly theme: ThemeColorName;
    /** Makes the color lighter, from 0 (unchanged) to 100 (white) */
    readonly lighter?: number;
    /** Makes the color darker, from 0 (unchanged) to 100 (black) */
    readonly darker?: number;
};

/**
 * One of the twelve colors of the document's theme, as `Document`'s `theme.colors` names them.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_ThemeColor">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="dark1"/>
 *     <xsd:enumeration value="light1"/>
 *     <xsd:enumeration value="dark2"/>
 *     <xsd:enumeration value="light2"/>
 *     <xsd:enumeration value="accent1"/>
 *     <xsd:enumeration value="accent2"/>
 *     <xsd:enumeration value="accent3"/>
 *     <xsd:enumeration value="accent4"/>
 *     <xsd:enumeration value="accent5"/>
 *     <xsd:enumeration value="accent6"/>
 *     <xsd:enumeration value="hyperlink"/>
 *     <xsd:enumeration value="followedHyperlink"/>
 *     <xsd:enumeration value="none"/>
 *     <xsd:enumeration value="background1"/>
 *     <xsd:enumeration value="text1"/>
 *     <xsd:enumeration value="background2"/>
 *     <xsd:enumeration value="text2"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export declare type ThemeColorName = "dark1" | "light1" | "dark2" | "light2" | "accent1" | "accent2" | "accent3" | "accent4" | "accent5" | "accent6" | "hyperlink" | "followedHyperlink";

/**
 * One of the fonts of the document's theme: its font for headings, or its font for body text.
 *
 * @publicApi
 */
export declare type ThemeFont = "headings" | "body";

declare type ToCEntry = {
    readonly title: string;
    readonly level: number;
    readonly page?: number;
    readonly href?: string;
};

/**
 * Validates a positive TWIP measurement value.
 *
 * Accepts either a positive universal measure string or a positive number.
 *
 * Reference: ST_TwipsMeasure in OOXML specification
 *
 * @param val - The measurement value (positive universal measure or number)
 * @returns The normalized measurement value
 *
 * @example
 * ```typescript
 * const width1 = twipsMeasureValue("25.4mm");
 * const width2 = twipsMeasureValue(1440); // 1 inch in TWIP
 * ```
 */
export declare const twipsMeasureValue: (val: PositiveUniversalMeasure | number) => PositiveUniversalMeasure | number;

/**
 * Validates a single-byte hexadecimal number (1 byte / 2 characters).
 *
 * Reference: ST_UcharHexNumber in OOXML specification
 *
 * @param val - The hexadecimal string to validate
 * @returns The validated hexadecimal string
 * @throws Error if the value is not a valid 2-character hex string
 *
 * @example
 * ```typescript
 * const hex = uCharHexNumber("FF"); // Valid
 * ```
 */
export declare const uCharHexNumber: (val: string) => string;

/**
 * Underline style types for text.
 *
 * Defines the various underline patterns that can be applied to text runs.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_Underline">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="single"/>
 *     <xsd:enumeration value="words"/>
 *     <xsd:enumeration value="double"/>
 *     <xsd:enumeration value="thick"/>
 *     <xsd:enumeration value="dotted"/>
 *     <xsd:enumeration value="dottedHeavy"/>
 *     <xsd:enumeration value="dash"/>
 *     <xsd:enumeration value="dashedHeavy"/>
 *     <xsd:enumeration value="dashLong"/>
 *     <xsd:enumeration value="dashLongHeavy"/>
 *     <xsd:enumeration value="dotDash"/>
 *     <xsd:enumeration value="dashDotHeavy"/>
 *     <xsd:enumeration value="dotDotDash"/>
 *     <xsd:enumeration value="dashDotDotHeavy"/>
 *     <xsd:enumeration value="wave"/>
 *     <xsd:enumeration value="wavyHeavy"/>
 *     <xsd:enumeration value="wavyDouble"/>
 *     <xsd:enumeration value="none"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export declare const UnderlineType: {
    /** Single underline */
    readonly SINGLE: "single";
    /** Underline words only (not spaces) */
    readonly WORDS: "words";
    /** Double underline */
    readonly DOUBLE: "double";
    /** Thick single underline */
    readonly THICK: "thick";
    /** Dotted underline */
    readonly DOTTED: "dotted";
    /** Heavy dotted underline */
    readonly DOTTEDHEAVY: "dottedHeavy";
    /** Dashed underline */
    readonly DASH: "dash";
    /** Heavy dashed underline */
    readonly DASHEDHEAVY: "dashedHeavy";
    /** Long dashed underline */
    readonly DASHLONG: "dashLong";
    /** Heavy long dashed underline */
    readonly DASHLONGHEAVY: "dashLongHeavy";
    /** Dot-dash underline */
    readonly DOTDASH: "dotDash";
    /** Heavy dot-dash underline */
    readonly DASHDOTHEAVY: "dashDotHeavy";
    /** Dot-dot-dash underline */
    readonly DOTDOTDASH: "dotDotDash";
    /** Heavy dot-dot-dash underline */
    readonly DASHDOTDOTHEAVY: "dashDotDotHeavy";
    /** Wave underline */
    readonly WAVE: "wave";
    /** Heavy wave underline */
    readonly WAVYHEAVY: "wavyHeavy";
    /** Double wave underline */
    readonly WAVYDOUBLE: "wavyDouble";
    /** No underline */
    readonly NONE: "none";
};

/**
 * Generates a unique lowercase alphanumeric ID using nanoid.
 *
 * The ID is suitable for use as a relationship ID or other unique identifier
 * within a document.
 *
 * @returns A unique lowercase string ID
 */
export declare const uniqueId: () => string;

/**
 * A function that generates unique sequential numeric IDs.
 */
export declare type UniqueNumericIdCreator = () => number;

/**
 * Creates a unique numeric ID generator with sequential numbering.
 *
 * @param initial - The initial value to start counting from (default: 0)
 * @returns A function that returns incrementing numbers on each call
 *
 * @example
 * ```typescript
 * const idGen = uniqueNumericIdCreator(10);
 * console.log(idGen()); // 11
 * console.log(idGen()); // 12
 * console.log(idGen()); // 13
 * ```
 */
export declare const uniqueNumericIdCreator: (initial?: number) => UniqueNumericIdCreator;

/**
 * Generates a UUID v4-style unique identifier.
 *
 * The UUID follows the format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *
 * @returns A UUID string
 *
 * @example
 * ```typescript
 * const uuid = uniqueUuid(); // Returns "a3bb189e-8bf9-3888-9912-ace4e6543002"
 * ```
 */
export declare const uniqueUuid: () => string;

/**
 * Runtime validation and type conversion functions for OOXML specification values.
 *
 * This module provides runtime checks and cleanup for value types in the OOXML spec
 * that aren't easily expressed through the TypeScript type system alone. These
 * validators help prevent silent failures and corrupted documents by enforcing
 * spec-compliant values at runtime.
 *
 * @module
 */
/**
 * A measurement value with optional sign and unit suffix.
 *
 * Supports units: mm (millimeters), cm (centimeters), in (inches),
 * pt (points), pc (picas), pi (picas).
 *
 * Pattern: `-?[0-9]+(\.[0-9]+)?(mm|cm|in|pt|pc|pi)`
 *
 * @example
 * ```typescript
 * const measure: UniversalMeasure = "10.5mm";
 * const negative: UniversalMeasure = "-5pt";
 * ```
 */
export declare type UniversalMeasure = `${"-" | ""}${number}${"mm" | "cm" | "in" | "pt" | "pc" | "pi"}`;

/**
 * Converts a universal measure (or a value already in twips) into twips.
 *
 * Numbers are assumed to already be in twips and are returned unchanged.
 * Strings are converted according to their unit suffix.
 *
 * @param val - A number of twips or a universal measure such as "10mm" or "1.5in"
 * @returns The equivalent number of twips (not rounded)
 *
 * @example
 * ```typescript
 * universalMeasureToTwips(720); // Returns 720
 * universalMeasureToTwips("1in"); // Returns 1440
 * universalMeasureToTwips("2.54cm"); // Returns 1440
 * ```
 */
export declare const universalMeasureToTwips: (val: UniversalMeasure | number) => number;

/**
 * Normalizes a universal measure value by parsing and reformatting.
 *
 * Ensures the numeric portion is properly formatted while preserving the unit.
 *
 * Reference: ST_UniversalMeasure in OOXML specification
 *
 * @param val - The universal measure string to normalize
 * @returns The normalized universal measure
 *
 * @example
 * ```typescript
 * const measure = universalMeasureValue("10.500mm"); // Returns "10.5mm"
 * ```
 */
export declare const universalMeasureValue: (val: UniversalMeasure) => UniversalMeasure;

/**
 * Validates and converts a number to a positive integer (unsigned decimal number).
 *
 * Reference: ST_UnsignedDecimalNumber in OOXML specification
 *
 * @param val - The number to validate and convert
 * @returns The floored positive integer value
 * @throws Error if the value is NaN or negative
 *
 * @example
 * ```typescript
 * const num = unsignedDecimalNumber(10.7); // Returns 10
 * const invalid = unsignedDecimalNumber(-5); // Throws Error
 * ```
 */
export declare const unsignedDecimalNumber: (val: number) => number;

/**
 * @deprecated Use {@link VerticalAlignTable} for table cells or
 * {@link VerticalAlignSection} for section properties. This alias remains for
 * backward-compatibility and will be removed in the next major release.
 *
 * @publicApi
 */
export declare const VerticalAlign: {
    readonly BOTH: "both";
    readonly TOP: "top";
    readonly CENTER: "center";
    readonly BOTTOM: "bottom";
};

/**
 * Enumeration for section (<w:sectPr>) vertical alignment. Adds `both` on top of
 * the table-cell set (§17.18.87 ST_VerticalJc within <w:sectPr>).
 *
 * @publicApi
 */
export declare const VerticalAlignSection: {
    readonly BOTH: "both";
    readonly TOP: "top";
    readonly CENTER: "center";
    readonly BOTTOM: "bottom";
};

/**
 * Enumeration for table-cell vertical alignment. Only `top`, `center`, `bottom`
 * are valid according to ECMA-376 (§17.18.87 ST_VerticalJc within `<w:tcPr>`).
 *
 * @publicApi
 */
export declare const VerticalAlignTable: {
    readonly TOP: "top";
    readonly CENTER: "center";
    readonly BOTTOM: "bottom";
};

/**
 * @publicApi
 */
export declare enum VerticalAnchor {
    CENTER = "ctr",
    TOP = "t",
    BOTTOM = "b"
}

/**
 * Represents a vertical merge (vMerge) element in a WordprocessingML document.
 *
 * The vMerge element specifies that this cell is part of a vertically merged region.
 * Cells can either restart a new merge region or continue an existing one from above.
 * This is used to create row spans in tables.
 *
 * Reference: http://officeopenxml.com/WPtableCell.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_VMerge">
 *   <xsd:attribute name="val" type="ST_Merge"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // First cell in a vertical merge
 * new VerticalMerge(VerticalMergeType.RESTART);
 *
 * // Subsequent cells that continue the merge
 * new VerticalMerge(VerticalMergeType.CONTINUE);
 * ```
 */
export declare class VerticalMerge extends XmlComponent {
    constructor(value: (typeof VerticalMergeType)[keyof typeof VerticalMergeType]);
}

/**
 * Vertical merge revision types.
 */
export declare const VerticalMergeRevisionType: {
    /**
     * Cell that is merged with upper one.
     */
    readonly CONTINUE: "cont";
    /**
     * Cell that is starting the vertical merge.
     */
    readonly RESTART: "rest";
};

/**
 * Vertical merge types for table cells.
 *
 * Defines the merge behavior for vertically merged cells (row span).
 */
export declare const VerticalMergeType: {
    /**
     * Cell that is merged with upper one.
     * This cell continues a vertical merge started by a cell above it.
     */
    readonly CONTINUE: "continue";
    /**
     * Cell that is starting the vertical merge.
     * This cell begins a new vertical merge region.
     */
    readonly RESTART: "restart";
};

/**
 * Vertical alignment options for floating drawings.
 *
 * Reference: https://www.datypic.com/sc/ooxml/t-wp_ST_AlignV.html
 *
 * @publicApi
 */
export declare const VerticalPositionAlign: {
    /** Align to bottom */
    readonly BOTTOM: "bottom";
    /** Center vertically */
    readonly CENTER: "center";
    /** Align to inside margin */
    readonly INSIDE: "inside";
    /** Align to outside margin */
    readonly OUTSIDE: "outside";
    /** Align to top */
    readonly TOP: "top";
};

/**
 * Vertical Relative Positioning.
 *
 * Specifies the vertical base from which the drawing position is calculated.
 *
 * Reference: https://www.datypic.com/sc/ooxml/t-wp_ST_RelFromV.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_RelFromV">
 *   <xsd:restriction base="xsd:token">
 *     <xsd:enumeration value="margin"/>
 *     <xsd:enumeration value="page"/>
 *     <xsd:enumeration value="paragraph"/>
 *     <xsd:enumeration value="line"/>
 *     <xsd:enumeration value="topMargin"/>
 *     <xsd:enumeration value="bottomMargin"/>
 *     <xsd:enumeration value="insideMargin"/>
 *     <xsd:enumeration value="outsideMargin"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export declare const VerticalPositionRelativeFrom: {
    /**
     * ## Bottom Margin
     *
     * Specifies that the vertical positioning shall be relative to the bottom margin of the current page.
     */
    readonly BOTTOM_MARGIN: "bottomMargin";
    /**
     * ## Inside Margin
     *
     * Specifies that the vertical positioning shall be relative to the inside margin of the current page.
     */
    readonly INSIDE_MARGIN: "insideMargin";
    /**
     * ## Line
     *
     * Specifies that the vertical positioning shall be relative to the line containing the anchor character.
     */
    readonly LINE: "line";
    /**
     * ## Page Margin
     *
     * Specifies that the vertical positioning shall be relative to the page margins.
     */
    readonly MARGIN: "margin";
    /**
     * ## Outside Margin
     *
     * Specifies that the vertical positioning shall be relative to the outside margin of the current page.
     */
    readonly OUTSIDE_MARGIN: "outsideMargin";
    /**
     * ## Page Edge
     *
     * Specifies that the vertical positioning shall be relative to the edge of the page.
     */
    readonly PAGE: "page";
    /**
     * ## Paragraph
     *
     * Specifies that the vertical positioning shall be relative to the paragraph which contains the drawing anchor.
     */
    readonly PARAGRAPH: "paragraph";
    /**
     * ## Top Margin
     *
     * Specifies that the vertical positioning shall be relative to the top margin of the current page.
     */
    readonly TOP_MARGIN: "topMargin";
};

/**
 * Styling options for VML shapes.
 *
 * This type defines all available CSS-like styling properties for positioning, sizing,
 * and configuring VML shapes in WordprocessingML documents. These properties control
 * the shape's appearance, layout, and interaction with surrounding text.
 *
 * Properties are emitted in the order they are declared on the object.
 */
export declare type VmlShapeStyle = {
    /** Specifies that the orientation of a shape is flipped. Default is no value. */
    readonly flip?: "x" | "y" | "xy" | "yx";
    /** Specifies the height of the containing block of the shape. Default is 0. It is specified in CSS units or, for elements in a group, in the coordinate system of the parent element. */
    readonly height?: LengthUnit;
    /** Specifies the position of the left of the containing block of the shape relative to the element left of it in the flow of the page. Default is 0. It is specified in CSS units or, for elements in a group, in the coordinate system of the parent element. This property shall not be used for shapes anchored inline. */
    readonly left?: LengthUnit;
    /** Specifies the position of the bottom of the containing block of the shape relative to the shape anchor. Default is 0. It is specified in CSS units or, for elements in a group, in the coordinate system of the parent element. */
    readonly marginBottom?: LengthUnit;
    /** Specifies the position of the left of the containing block of the shape relative to the shape anchor. Default is 0. It is specified in CSS units or, for elements in a group, in the coordinate system of the parent element. */
    readonly marginLeft?: LengthUnit;
    /** Specifies the position of the right of the containing block of the shape relative to the shape anchor. Default is 0. It is specified in CSS units or, for elements in a group, in the coordinate system of the parent element. */
    readonly marginRight?: LengthUnit;
    /** Specifies the position of the top of the containing block of the shape relative to the shape anchor. Default is 0. It is specified in CSS units or, for elements in a group, in the coordinate system of the parent element. */
    readonly marginTop?: LengthUnit;
    /** Specifies the horizontal positioning data for objects in WordprocessingML documents. Default is absolute. */
    readonly positionHorizontal?: "absolute" | "left" | "center" | "right" | "inside" | "outside";
    /** Specifies relative horizontal position data for objects in WordprocessingML documents. This modifies the mso-position-horizontal property. Default is text. */
    readonly positionHorizontalRelative?: "margin" | "page" | "text" | "char";
    /** Specifies the vertical positioning data for objects in WordprocessingML documents. Default is absolute. */
    readonly positionVertical?: "absolute" | "left" | "center" | "right" | "inside" | "outside";
    /** Specifies relative vertical position data for objects in WordprocessingML documents. This modifies the mso-position-vertical property. Default is text. */
    readonly positionVerticalRelative?: "margin" | "page" | "text" | "char";
    /** Specifies the distance from the bottom of the shape to the text that wraps around it. Default is 0 pt. Note that this property is different from the CSS margin property, which changes the origin of the shape to include the margin areas. This property does not change the origin. */
    readonly wrapDistanceBottom?: number;
    /** Specifies the distance from the left side of the shape to the text that wraps around it. Default is 0 pt. Note that this property is different from the CSS margin property, which changes the origin of the shape to include the margin areas. This property does not change the origin. */
    readonly wrapDistanceLeft?: number;
    /** Specifies the distance from the right side of the shape to the text that wraps around it. Default is 0 pt. Note that this property is different from the CSS margin property, which changes the origin of the shape to include the margin areas. This property does not change the origin. */
    readonly wrapDistanceRight?: number;
    /** Specifies the distance from the top of the shape to the text that wraps around it. Default is 0 pt. Note that this property is different from the CSS margin property, which changes the origin of the shape to include the margin areas. This property does not change the origin. */
    readonly wrapDistanceTop?: number;
    /** Specifies whether the wrap coordinates were customized by the user. If the wrap coordinates are generated by an editor, this property is true; otherwise they were customized by a user. Default is false. */
    readonly wrapEdited?: boolean;
    /** Specifies the wrapping mode for text in shapes in WordprocessingML documents. Default is square. */
    readonly wrapStyle?: "square" | "none";
    /** Specifies the type of positioning used to place an element. Default is static. When the element is contained inside a group, this property must be absolute. */
    readonly position?: "static" | "absolute" | "relative";
    /** Specifies the angle that a shape is rotated, in degrees. Default is 0. Positive angles are clockwise. */
    readonly rotation?: number;
    /** Specifies the position of the top of the containing block of the shape relative to the element above it in the flow of the page. Default is 0. It is specified in CSS units or, for elements in a group, in the coordinate system of the parent element. This property shall not be used for shapes anchored inline. */
    readonly top?: LengthUnit;
    /** Specifies whether a shape is displayed. Only inherit and hidden are used; any other values are mapped to inherit. Default is inherit. */
    readonly visibility?: "hidden" | "inherit";
    /** Specifies the width of the containing block of the shape. Default is 0. It is specified in CSS units or, for elements in a group, in the coordinate system of the parent element. */
    readonly width: LengthUnit;
    /** Specifies the display order of overlapping shapes. Default is 0. This property shall not be used for shapes anchored inline. */
    readonly zIndex?: "auto" | number;
};

/**
 * Width type values for tables and cells.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_TblWidth">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="nil"/>
 *     <xsd:enumeration value="pct"/>
 *     <xsd:enumeration value="dxa"/>
 *     <xsd:enumeration value="auto"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export declare const WidthType: {
    /** Auto. */
    readonly AUTO: "auto";
    /** Value is in twentieths of a point */
    readonly DXA: "dxa";
    /** No (empty) value. */
    readonly NIL: "nil";
    /** Value is in percentage. */
    readonly PERCENTAGE: "pct";
};

/**
 * Borders and shading with hex colors, as a cell's options had them before they took colors of the document's theme.
 *
 * @inline
 */
declare type WithHexColors<T> = Omit<T, "borders" | "shading"> & {
    readonly borders?: {
        readonly [Side in keyof ITableCellBorders]: Omit<IBorderOptions, "color"> & {
            readonly color?: string;
        };
    };
    readonly shading?: Omit<IShadingAttributesProperties, "color" | "fill"> & {
        readonly fill?: string;
        readonly color?: string;
    };
};

/**
 * @ignore
 */
export declare const WORKAROUND2 = "";

/**
 * @ignore
 */
export declare const WORKAROUND3 = "";

/**
 * @ignore
 */
export declare const WORKAROUND4 = "";

export declare type WpgCommonMediaData = {
    readonly outline?: OutlineOptions;
    readonly solidFill?: SolidFillOptions;
};

/**
 * A group of text boxes and pictures.
 *
 * @publicApi
 * @deprecated Use `ShapeGroupRun` from `docx/shapes`, whose children can be shapes, pictures, groups and connectors,
 * positioned in pixels.
 */
export declare class WpgGroupRun extends Run {
    private readonly wpgGroupData;
    private readonly mediaDatas;
    constructor(options: IWpgGroupOptions);
    prepForXml(context: IContext): IXmlableObject | undefined;
}

export declare type WpgMediaData = {
    readonly type: "wpg";
    readonly transformation: IMediaDataTransformation;
    readonly children: readonly IGroupChildMediaData[];
};

export declare type WpsMediaData = {
    readonly type: "wps";
    readonly transformation: IMediaDataTransformation;
    readonly data: WpsShapeCoreOptions;
};

declare type WpsShapeCoreOptions = {
    readonly children: readonly Paragraph[];
    readonly nonVisualProperties?: INonVisualShapePropertiesOptions;
    readonly bodyProperties?: IBodyPropertiesOptions;
};

/**
 * A rectangular text box.
 *
 * @publicApi
 * @deprecated Use `ShapeRun` from `docx/shapes`, with `type: "rectangle"` and `children` for a text box. It has plain
 * options for fills, lines, effects and text layout, and can be any of the preset shapes.
 */
export declare class WpsShapeRun extends Run {
    private readonly wpsShapeData;
    constructor(options: IWpsShapeOptions);
}

/**
 * Base class for creating XML attributes with automatic name mapping.
 *
 * XmlAttributeComponent allows you to define attributes using JavaScript-friendly
 * property names that are automatically mapped to XML attribute names. Subclasses
 * can define an xmlKeys map to specify the transformation.
 *
 * @example
 * ```typescript
 * class MyAttributes extends XmlAttributeComponent<{ fontSize: number }> {
 *   protected readonly xmlKeys = { fontSize: "w:sz" };
 * }
 *
 * new MyAttributes({ fontSize: 24 });
 * // Generates: _attr: { "w:sz": 24 }
 * ```
 */
export declare abstract class XmlAttributeComponent<T extends Record<string, any>> extends BaseXmlComponent {
    private readonly root;
    /** Optional mapping from property names to XML attribute names. */
    protected readonly xmlKeys?: AttributeMap<T>;
    /**
     * Creates a new attribute component.
     *
     * @param root - The attribute data object
     */
    constructor(root: T);
    /**
     * Converts the attribute data to an XML-serializable object.
     *
     * This method transforms the property names using xmlKeys (if defined)
     * and filters out undefined values.
     *
     * @param _ - Context (unused for attributes)
     * @returns Object with _attr key containing the mapped attributes
     */
    prepForXml(_: IContext): IXmlableObject;
}

/**
 * Base class for all XML components in WordprocessingML documents.
 *
 * XmlComponent provides the infrastructure for building XML element trees
 * that are serialized into document.xml and other parts of the DOCX package.
 * It manages a collection of child components and handles the conversion to
 * the intermediate object format used by the xml serialization library.
 *
 * @example
 * ```typescript
 * // Creating a custom XML component
 * class MyElement extends XmlComponent {
 *   constructor(text: string) {
 *     super("w:myElement");
 *     this.root.push(new Attributes({ val: text }));
 *   }
 * }
 *
 * const element = new MyElement("Hello");
 * // When serialized: <w:myElement w:val="Hello"/>
 * ```
 */
export declare abstract class XmlComponent extends BaseXmlComponent {
    /**
     * Array of child components, text nodes, and attributes.
     *
     * This array forms the content of the XML element. It can contain other
     * XmlComponents, string values (text nodes), or attribute components.
     */
    protected root: (BaseXmlComponent | string | any)[];
    /**
     * Creates a new XmlComponent.
     *
     * @param rootKey - The XML element name (e.g., "w:p", "w:r", "w:t")
     */
    constructor(rootKey: string);
    /**
     * Prepares this component and its children for XML serialization.
     *
     * This method is called by the Formatter to convert the component tree into
     * an object structure compatible with the xml library (https://www.npmjs.com/package/xml).
     * It recursively processes all children and handles special cases like
     * attribute-only elements and empty elements.
     *
     * The method can be overridden by subclasses to customize XML representation
     * or execute side effects during serialization (e.g., creating relationships).
     *
     * @param context - The serialization context containing document state
     * @returns The XML-serializable object, or undefined to exclude from output
     *
     * @example
     * ```typescript
     * // Override to add custom serialization logic
     * prepForXml(context: IContext): IXmlableObject | undefined {
     *   // Custom logic here
     *   return super.prepForXml(context);
     * }
     * ```
     */
    prepForXml(context: IContext): IXmlableObject | undefined;
    /**
     * Adds a child element to this component.
     *
     * @deprecated Do not use this method. It is only used internally by the library. It will be removed in a future version.
     * @param child - The child component or text string to add
     * @returns This component (for chaining)
     */
    addChildElement(child: XmlComponent | string): XmlComponent;
}

/**
 * Represents the current year in long format (e.g., "2024").
 *
 * Inserts a dynamic field showing the year portion of the current date in four digits.
 */
export declare class YearLong extends EmptyElement {
    constructor();
}

/**
 * Represents the current year in short format (e.g., "24").
 *
 * Inserts a dynamic field showing the year portion of the current date in two digits.
 */
export declare class YearShort extends EmptyElement {
    constructor();
}

export { }
