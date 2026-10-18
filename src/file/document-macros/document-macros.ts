/**
 * Document macros module: a document's VBA macros, which make it a macro-enabled document (.docm).
 *
 * The macros are a VBA project, which Word keeps in word/vbaProject.bin. The events of the document that the project
 * handles are listed in word/vbaData.xml, as Word only runs a handler, such as `Document_Open`, for an event listed
 * there.
 *
 * Reference: ooxml-schemas/microsoft/wml-2006.xsd (CT_VbaSuppData), [MS-OFFMACRO2]
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

/**
 * An event of a document that its macros can handle, in the document's own module, ThisDocument. Each is the event's
 * name in VBA, after "Document_", such as "open" for `Document_Open`.
 *
 * @publicApi
 */
export type DocumentMacroEvent =
    | "new"
    | "open"
    | "close"
    | "sync"
    | "xmlAfterInsert"
    | "xmlBeforeDelete"
    | "contentControlAfterAdd"
    | "contentControlBeforeDelete"
    | "contentControlOnExit"
    | "contentControlOnEnter"
    | "contentControlBeforeStoreUpdate"
    | "contentControlBeforeContentUpdate"
    | "buildingBlockInsert";

/**
 * A document's VBA macros, for the document's `macros`.
 *
 * @publicApi
 */
export type DocumentMacros = {
    /**
     * The VBA project, the file Word keeps a document's macros in. `createMacros` from `docx/macros` writes it from VBA
     * code. Or it is the word/vbaProject.bin of a .docm Word saved
     */
    readonly project: Uint8Array | ArrayBuffer;
    /**
     * The events of the document that the project handles in ThisDocument, such as "open" for `Document_Open`. Word only
     * runs the handlers of the events listed. `createMacros` lists them from the code. For a project from a .docm, they
     * are the `wne:docEvents` in its word/vbaData.xml
     */
    readonly events?: readonly DocumentMacroEvent[];
};

// Each event's element in word/vbaData.xml, in the schema's order
const EVENT_ELEMENTS: Readonly<Record<DocumentMacroEvent, string>> = {
    new: "wne:eventDocNew",
    open: "wne:eventDocOpen",
    close: "wne:eventDocClose",
    sync: "wne:eventDocSync",
    xmlAfterInsert: "wne:eventDocXmlAfterInsert",
    xmlBeforeDelete: "wne:eventDocXmlBeforeDelete",
    contentControlAfterAdd: "wne:eventDocContentControlAfterInsert",
    contentControlBeforeDelete: "wne:eventDocContentControlBeforeDelete",
    contentControlOnExit: "wne:eventDocContentControlOnExit",
    contentControlOnEnter: "wne:eventDocContentControlOnEnter",
    contentControlBeforeStoreUpdate: "wne:eventDocStoreUpdate",
    contentControlBeforeContentUpdate: "wne:eventDocContentControlContentUpdate",
    buildingBlockInsert: "wne:eventDocBuildingBlockAfterInsert",
};

/**
 * The events of a document that its macros handle (word/vbaData.xml).
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_VbaSuppData">
 *   <xsd:sequence>
 *     <xsd:element name="docEvents" type="CT_DocEvents" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="mcds" type="CT_Mcds" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createMacroEvents = (events: readonly DocumentMacroEvent[]): XmlComponent =>
    new BuilderElement<{ readonly namespace: string }>({
        name: "wne:vbaSuppData",
        attributes: { namespace: { key: "xmlns:wne", value: "http://schemas.microsoft.com/office/word/2006/wordml" } },
        children: [
            new BuilderElement({
                name: "wne:docEvents",
                children: Object.entries(EVENT_ELEMENTS)
                    .filter(([event]) => events.includes(event as DocumentMacroEvent))
                    .map(([, name]) => new BuilderElement({ name })),
            }),
        ],
    });
