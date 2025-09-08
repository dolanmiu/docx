import { IContext, IXmlableObject, XmlComponent } from "@file/xml-components";

import { ICheckboxContentControlOptions } from "./properties";
import { contentControlIdGen } from "./shared-id-generator";
import { validateDataBinding } from "./validation-utils";

/**
 * CheckboxContentControl implementation for binary selection controls.
 *
 * Creates checkbox Content Controls that provide users with simple binary choices
 * (checked/unchecked). These controls are inline elements ideal for forms, agreements,
 * approval workflows, and any scenario requiring boolean input.
 *
 * The control generates OOXML structured document tags (SDT) with specialized
 * checkbox elements that integrate seamlessly with Microsoft Word's checkbox UI,
 * including support for custom symbols, fonts, and enhanced styling.
 *
 * Note: This provides full Content Control functionality compared to the existing
 * simpler CheckBox class, including enhanced properties, validation, and documentation.
 *
 * @example Basic checkbox
 * ```typescript
 * const agreementCheckbox = new CheckboxContentControl({
 *     tag: "TermsAgreement",
 *     title: "Terms and Conditions Agreement",
 *     checked: false,
 *     children: []
 * });
 *
 * const paragraph = new Paragraph({
 *     children: [
 *         agreementCheckbox,
 *         new TextRun(" I agree to the terms and conditions")
 *     ]
 * });
 * ```
 *
 * @example Custom styled checkbox
 * ```typescript
 * const approvalCheckbox = new CheckboxContentControl({
 *     tag: "DocumentApproval",
 *     title: "Document Approval Status",
 *     checked: true,
 *     checkedSymbol: { font: "Wingdings", character: "☑" },
 *     uncheckedSymbol: { font: "Wingdings", character: "☐" },
 *     appearance: 'boundingBox',
 *     color: "009900",
 *     lock: {
 *         sdtLocked: true,
 *         contentLock: false
 *     },
 *     children: []
 * });
 * ```
 */
export class CheckboxContentControl extends XmlComponent {
    private readonly tag: string;
    private readonly title?: string;
    private readonly id: number;
    private readonly checked: boolean;
    private readonly checkedSymbol: { readonly font: string; readonly character: string };
    private readonly uncheckedSymbol: { readonly font: string; readonly character: string };
    private readonly appearance?: string;
    private readonly color?: string;
    private readonly dataBinding?: { readonly xpath: string; readonly storeItemId: string };
    private readonly lock?: { readonly contentLock?: boolean; readonly sdtLocked?: boolean };
    private readonly placeholder?: string;

    // Default symbols matching Microsoft's standards
    private readonly DEFAULT_CHECKED_SYMBOL = { font: "MS Gothic", character: "2612" };
    private readonly DEFAULT_UNCHECKED_SYMBOL = { font: "MS Gothic", character: "2610" };

    /**
     * Creates a new CheckboxContentControl instance.
     *
     * @param options - Configuration options for the checkbox content control
     * @throws {Error} When validation fails for the provided options
     */
    public constructor(options: ICheckboxContentControlOptions) {
        super("w:sdt");

        // Validate input options
        this.validateOptions(options);

        // Validate data binding GUID format if provided
        if (options.dataBinding) {
            validateDataBinding(options.dataBinding, "CheckboxContentControl");
        }

        this.tag = options.tag;
        this.title = options.title;
        this.id = contentControlIdGen();
        this.checked = options.checked || false;
        this.checkedSymbol = options.checkedSymbol || this.DEFAULT_CHECKED_SYMBOL;
        this.uncheckedSymbol = options.uncheckedSymbol || this.DEFAULT_UNCHECKED_SYMBOL;
        this.appearance = options.appearance;
        this.color = options.color;
        this.dataBinding = options.dataBinding;
        this.lock = options.lock;
        this.placeholder = options.placeholder;

        // Checkbox controls don't need children in the traditional sense
        // The checkbox state is represented by the symbol elements
    }

    /**
     * Validates the constructor options and throws descriptive errors for invalid configurations.
     *
     * @private
     * @param options - The options to validate
     * @throws {Error} When validation fails
     */
    private validateOptions(options: ICheckboxContentControlOptions): void {
        // Validate tag is not empty
        if (!options.tag || options.tag.trim().length === 0) {
            throw new Error(
                "CheckboxContentControl: 'tag' is required and cannot be empty. " +
                    "The tag serves as the unique identifier for the checkbox control and is essential for programmatic access. " +
                    "Example: { tag: 'Approved', children: [] }",
            );
        }

        // Validate symbol configurations if provided
        if (options.checkedSymbol) {
            if (!options.checkedSymbol.font || !options.checkedSymbol.character) {
                throw new Error(
                    "CheckboxContentControl: 'checkedSymbol' must have both 'font' and 'character' properties. " +
                        "Example: { checkedSymbol: { font: 'Wingdings', character: '☑' } }",
                );
            }
        }

        if (options.uncheckedSymbol) {
            if (!options.uncheckedSymbol.font || !options.uncheckedSymbol.character) {
                throw new Error(
                    "CheckboxContentControl: 'uncheckedSymbol' must have both 'font' and 'character' properties. " +
                        "Example: { uncheckedSymbol: { font: 'Wingdings', character: '☐' } }",
                );
            }
        }

        // Validate children array exists (even if empty for checkboxes)
        if (!Array.isArray(options.children)) {
            throw new Error(
                "CheckboxContentControl: 'children' must be an array. " +
                    "Checkbox controls typically use an empty array: { children: [] }",
            );
        }
    }

    /**
     * Generates the OOXML representation of this checkbox content control.
     *
     * This method creates the specialized XML structure required for checkbox controls,
     * including the w:checkbox element with checked/unchecked states and symbol
     * configurations. The generated XML follows the Office Open XML specification
     * for checkbox controls.
     *
     * The generated structure includes:
     * - SDT properties with checkbox-specific elements (w:checkbox)
     * - Checked/unchecked state configuration
     * - Custom symbol definitions for both states
     * - All standard content control properties (tag, title, appearance, etc.)
     *
     * @param context - The formatting context provided by the document processor
     * @returns The XML structure representing this checkbox control, or undefined if generation fails
     *
     * @internal This method is called automatically during document generation
     */
    public prepForXml(context: IContext): IXmlableObject | undefined {
        // Generate the checkbox element with state and symbol configuration
        // Use w14 namespace (Word 2010) to match existing checkbox implementation
        const checkboxElement = {
            "w14:checkbox": [
                // Current checked state
                { "w14:checked": { _attr: { "w14:val": this.checked ? "1" : "0" } } },
                // Symbol for checked state (correct OOXML structure with nested elements)
                {
                    "w14:checkedState": [
                        { "w14:font": { _attr: { "w14:val": this.checkedSymbol.font } } },
                        { "w14:val": { _attr: { "w14:val": this.checkedSymbol.character } } },
                    ],
                },
                // Symbol for unchecked state (correct OOXML structure with nested elements)
                {
                    "w14:uncheckedState": [
                        { "w14:font": { _attr: { "w14:val": this.uncheckedSymbol.font } } },
                        { "w14:val": { _attr: { "w14:val": this.uncheckedSymbol.character } } },
                    ],
                },
            ],
        };

        // Generate the SDT properties section for checkbox control
        const sdtPr = {
            "w:sdtPr": [
                // Add user-friendly title (appears in Word's Developer tools)
                ...(this.title ? [{ "w:alias": { _attr: { "w:val": this.title } } }] : []),
                // Add machine-readable tag (required - used for programmatic access)
                { "w:tag": { _attr: { "w:val": this.tag } } },
                // Add unique numeric ID (required - used by Word internally)
                { "w:id": { _attr: { "w:val": this.id.toString() } } },
                // Add appearance mode if specified
                ...(this.appearance ? [{ "w:appearance": { _attr: { "w:val": this.appearance } } }] : []),
                // Add border color if specified
                ...(this.color ? [{ "w:color": { _attr: { "w:val": this.color } } }] : []),
                // Add data binding if specified
                ...(this.dataBinding
                    ? [
                          {
                              "w:dataBinding": {
                                  _attr: {
                                      "w:xpath": this.dataBinding.xpath,
                                      "w:storeItemID": this.dataBinding.storeItemId,
                                  },
                              },
                          },
                      ]
                    : []),
                // Add locking properties if specified
                ...(this.lock
                    ? [
                          {
                              "w:lock": {
                                  _attr: {
                                      ...(this.lock.contentLock ? { "w:contentLocked": "1" } : {}),
                                      ...(this.lock.sdtLocked ? { "w:sdtLocked": "1" } : {}),
                                  },
                              },
                          },
                      ]
                    : []),
                // Add placeholder indicator if specified
                ...(this.placeholder ? [{ "w:showingPlcHdr": {} }] : []),
                // Add the checkbox-specific element
                checkboxElement,
            ],
        };

        // Generate the SDT content section
        // For checkboxes, content is typically empty as the visual representation
        // is handled by the checkbox symbols in the properties section
        const processedChildren = this.root
            .map((child) => {
                if (typeof child === "object" && "prepForXml" in child) {
                    return child.prepForXml(context);
                }
                return child;
            })
            .filter((child) => child !== undefined);

        const sdtContent = {
            "w:sdtContent": processedChildren,
        };

        // Return the complete SDT structure for checkbox control
        return {
            "w:sdt": [sdtPr, sdtContent],
        };
    }
}
