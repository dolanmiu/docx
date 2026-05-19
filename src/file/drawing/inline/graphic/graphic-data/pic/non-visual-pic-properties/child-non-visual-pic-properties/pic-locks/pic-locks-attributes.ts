/**
 * Picture locks attributes module.
 *
 * This module defines the attributes that control locking behavior
 * for picture elements.
 *
 * @module
 */
import { XmlAttributeComponent } from "@file/xml-components";

/**
 * Attributes for picture locking properties.
 *
 * Defines the XML attributes that control which operations are forbidden
 * on a picture element.
 *
 * @internal
 */
export class PicLocksAttributes extends XmlAttributeComponent<{
    /** Disallow aspect ratio changes (0=allow, 1=disallow) */
    readonly noChangeAspect?: number;
    /** Disallow arrowhead changes (0=allow, 1=disallow) */
    readonly noChangeArrowheads?: number;
}> {
    protected readonly xmlKeys = {
        noChangeAspect: "noChangeAspect",
        noChangeArrowheads: "noChangeArrowheads",
    };
}
