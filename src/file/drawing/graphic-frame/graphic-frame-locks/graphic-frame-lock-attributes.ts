import { XmlAttributeComponent } from "@file/xml-components";

/**
 * Attributes for graphic frame locking properties.
 *
 * Defines the XML attributes that control which operations are forbidden
 * on a graphic frame element.
 */
export class GraphicFrameLockAttributes extends XmlAttributeComponent<{
    /** DrawingML namespace declaration */
    readonly xmlns?: string;
    /** Disallow aspect ratio changes (0=allow, 1=disallow) */
    readonly noChangeAspect?: number;
}> {
    protected readonly xmlKeys = {
        xmlns: "xmlns:a",
        noChangeAspect: "noChangeAspect",
    };
}
