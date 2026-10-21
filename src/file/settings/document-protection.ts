/**
 * Document protection module for WordprocessingML documents.
 *
 * Protection limits what people can change in a document when they open it in Word, as Word's Restrict Editing
 * does: nothing, or only comments, tracked changes or forms. A password stops anyone without it turning the
 * protection off.
 *
 * Reference: ISO/IEC 29500-1 17.15.1.29 (documentProtection)
 *
 * @module
 */
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

import { PROTECTION_PASSWORD_SPIN_COUNT, hashProtectionPassword, randomSalt } from "./protection-password";

/**
 * What people can change in a protected document, as Word's Restrict Editing offers it.
 *
 * ## XSD Schema
 *
 * ```xml
 * <xsd:simpleType name="ST_DocProtect">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="none"/>
 *     <xsd:enumeration value="readOnly"/>
 *     <xsd:enumeration value="comments"/>
 *     <xsd:enumeration value="trackedChanges"/>
 *     <xsd:enumeration value="forms"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export const DocumentProtectionType = {
    /**
     * ## No Changes (Read Only)
     *
     * Nothing can be changed, except in the document's editable ranges (`EditableRangeStart` to `EditableRangeEnd`).
     */
    READ_ONLY: "readOnly",
    /**
     * ## Comments
     *
     * Only comments can be added, and the editable ranges changed.
     */
    COMMENTS: "comments",
    /**
     * ## Tracked Changes
     *
     * Anything can be changed, and every change is tracked, as a revision people can accept or reject.
     */
    TRACKED_CHANGES: "trackedChanges",
    /**
     * ## Filling in Forms
     *
     * Only form fields can be filled in.
     */
    FORMS: "forms",
} as const;

/**
 * Options for protecting a document.
 *
 * @see {@link DocumentProtection}
 */
export type IDocumentProtectionOptions = {
    /** What people can change in the document */
    readonly type: (typeof DocumentProtectionType)[keyof typeof DocumentProtectionType];
    /**
     * The password that turns the protection off. Without one, anyone can turn it off in Word (Review > Restrict
     * Editing > Stop Protection). Word only reads its first 15 characters.
     *
     * The document isn't encrypted, so the protection stops changes in Word, not people who read or change the file
     * another way.
     */
    readonly password?: string;
};

/**
 * Attributes of the document protection element.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_DocProtect">
 *   <xsd:attribute name="edit" type="ST_DocProtect" use="optional"/>
 *   <xsd:attribute name="formatting" type="s:ST_OnOff" use="optional"/>
 *   <xsd:attribute name="enforcement" type="s:ST_OnOff"/>
 *   <xsd:attributeGroup ref="AG_Password"/>
 *   <xsd:attributeGroup ref="AG_TransitionalPassword"/>
 * </xsd:complexType>
 * ```
 */
class DocumentProtectionAttributes extends XmlAttributeComponent<{
    readonly edit: string;
    readonly enforcement: boolean;
    readonly cryptProviderType?: string;
    readonly cryptAlgorithmClass?: string;
    readonly cryptAlgorithmType?: string;
    readonly cryptAlgorithmSid?: number;
    readonly cryptSpinCount?: number;
    readonly hash?: string;
    readonly salt?: string;
}> {
    protected readonly xmlKeys = {
        edit: "w:edit",
        enforcement: "w:enforcement",
        cryptProviderType: "w:cryptProviderType",
        cryptAlgorithmClass: "w:cryptAlgorithmClass",
        cryptAlgorithmType: "w:cryptAlgorithmType",
        cryptAlgorithmSid: "w:cryptAlgorithmSid",
        cryptSpinCount: "w:cryptSpinCount",
        hash: "w:hash",
        salt: "w:salt",
    };
}

const toBase64 = (bytes: readonly number[]): string => btoa(String.fromCharCode(...bytes));

/**
 * Represents a document's protection (`w:documentProtection`), which limits what people can change in it in Word.
 *
 * A password is hashed as Word hashes it, with a random 16-byte salt, 100,000 times, after Word's legacy key
 * derivation, but with SHA-256 (`w:cryptAlgorithmSid` 12), which is much faster here than the SHA-512 Word uses. These
 * are the transitional password attributes, which Word writes.
 *
 * Reference: ISO/IEC 29500-1 17.15.1.29 (documentProtection)
 *
 * @example
 * ```typescript
 * new DocumentProtection({ type: DocumentProtectionType.READ_ONLY, password: "secret" });
 * ```
 */
export class DocumentProtection extends XmlComponent {
    public constructor({ type, password }: IDocumentProtectionOptions) {
        super("w:documentProtection");

        // Word turns protection off for anyone when its password is empty, and writes no hash for it
        if (password === undefined || password === "") {
            this.root.push(new DocumentProtectionAttributes({ edit: type, enforcement: true }));
            return;
        }

        const salt = randomSalt(16);
        this.root.push(
            new DocumentProtectionAttributes({
                edit: type,
                enforcement: true,
                cryptProviderType: "rsaAES",
                cryptAlgorithmClass: "hash",
                cryptAlgorithmType: "typeAny",
                // SHA-256
                cryptAlgorithmSid: 12,
                cryptSpinCount: PROTECTION_PASSWORD_SPIN_COUNT,
                hash: toBase64(hashProtectionPassword(password, salt, PROTECTION_PASSWORD_SPIN_COUNT)),
                salt: toBase64(salt),
            }),
        );
    }
}
