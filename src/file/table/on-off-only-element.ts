/**
 * On/off elements of tables that Office only takes "on" and "off" for.
 *
 * @module
 */
import { OnOffElement, StringValueElement, type XmlComponent } from "@file/xml-components";

/**
 * Creates an on/off element that Office only takes "on" and "off" for.
 *
 * ISO 29500 types a table's w:bidiVisual and a row's w:cantSplit and w:tblHeader as CT_OnOff, which takes true, false,
 * 1, 0, on and off. Office's schema types them as CT_OnOffOnly, which only takes on and off, so Word's validator rejects
 * w:val="false". Off is written as "off", which both accept.
 *
 * @example
 * ```typescript
 * createOnOffOnlyElement("w:cantSplit", true);
 * // Generates: <w:cantSplit/>
 *
 * createOnOffOnlyElement("w:cantSplit", false);
 * // Generates: <w:cantSplit w:val="off"/>
 * ```
 *
 * @internal
 */
export const createOnOffOnlyElement = (name: string, value: boolean): XmlComponent =>
    value ? new OnOffElement(name) : new StringValueElement(name, "off");
