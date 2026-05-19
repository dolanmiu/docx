/**
 * Text attributes module for WordprocessingML documents.
 *
 * This module provides XML attributes for text elements,
 * particularly the xml:space attribute for whitespace handling.
 *
 * @module
 */
import type { SpaceType } from "@file/shared";
import { XmlAttributeComponent } from "@file/xml-components";

/**
 * Represents text element attributes.
 *
 * Used to set the xml:space attribute which controls
 * whitespace preservation in text content.
 *
 * @example
 * ```typescript
 * new TextAttributes({ space: SpaceType.PRESERVE });
 * ```
 *
 * @internal
 */
export class TextAttributes extends XmlAttributeComponent<{
    readonly space: (typeof SpaceType)[keyof typeof SpaceType];
}> {
    protected readonly xmlKeys = { space: "xml:space" };
}
