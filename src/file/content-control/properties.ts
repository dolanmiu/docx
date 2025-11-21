import { Paragraph, TextRun } from "../paragraph";
import { Table } from "../table";

/**
 * Base properties for Content Controls.
 *
 * Content Controls are structured document tags (SDT) that provide a way to bind
 * data to specific regions of a document and restrict editing in those regions.
 * They are essential for creating templates and dynamic document generation.
 *
 * @example Basic usage
 * ```typescript
 * const control = new RunContentControl({
 *     tag: "CustomerName",
 *     title: "Customer Name Field",
 *     children: [new TextRun("John Doe")]
 * });
 * ```
 */
export type IContentControlProperties = {
    /**
     * Machine-readable tag identifier for the control.
     *
     * This is the primary identifier used to locate and manipulate the control
     * programmatically. It should be unique within the document and descriptive
     * of the control's purpose.
     *
     * @example "CustomerName", "OrderTotal", "DeliveryDate"
     */
    readonly tag: string;

    /**
     * User-friendly title displayed in Microsoft Word's Developer tools.
     *
     * This appears as the control's name in Word's Content Control properties
     * dialog and when the control is selected. If omitted, only the tag will
     * be visible to users.
     *
     * @example "Customer Name", "Order Total", "Delivery Date"
     */
    readonly title?: string;

    /**
     * Visual appearance mode of the content control in Microsoft Word.
     *
     * Controls how the content control is displayed to users:
     * - 'boundingBox': Shows a box around the control (default)
     * - 'tags': Shows start/end tags around the control
     * - 'hidden': No visual indicators shown
     *
     * @example "boundingBox" | "tags" | "hidden"
     * @default "boundingBox"
     */
    readonly appearance?: "boundingBox" | "tags" | "hidden";

    /**
     * Border color for the content control in hexadecimal format.
     *
     * Defines the color of the control's visual border when appearance is set
     * to 'boundingBox'. Color should be specified as a 6-character hex string
     * without the # prefix.
     *
     * @example "0066CC" (blue), "FF0000" (red), "009900" (green)
     */
    readonly color?: string;

    /**
     * Data binding configuration for linking the control to custom XML data.
     *
     * Allows the content control to be automatically populated from and synchronized
     * with custom XML data stored in the document. This enables advanced document
     * automation and data-driven template scenarios.
     *
     * @example
     * ```typescript
     * dataBinding: {
     *     xpath: "/root/customer/name",
     *     storeItemId: "{12345678-1234-1234-1234-123456789012}"
     * }
     * ```
     */
    readonly dataBinding?: {
        /**
         * XPath expression pointing to the data in the custom XML part.
         * @example "/root/customer/name", "/invoice/items/item[1]/description"
         */
        readonly xpath: string;
        /**
         * GUID identifier of the custom XML part containing the data.
         * @example "{12345678-1234-1234-1234-123456789012}"
         */
        readonly storeItemId: string;
    };

    /**
     * Locking configuration to restrict user interaction with the control.
     *
     * Provides granular control over what users can do with the content control,
     * enabling template protection and controlled editing scenarios.
     *
     * @example
     * ```typescript
     * lock: {
     *     contentLock: true,  // Users cannot edit the content
     *     sdtLocked: true     // Users cannot delete the control
     * }
     * ```
     */
    readonly lock?: {
        /**
         * Prevents users from editing the content within the control.
         * The control and its boundaries remain visible, but content is read-only.
         * @example true (content locked), false or undefined (content editable)
         */
        readonly contentLock?: boolean;
        /**
         * Prevents users from deleting the entire content control.
         * Users can still edit content (unless contentLock is also true).
         * @example true (control cannot be deleted), false or undefined (control can be deleted)
         */
        readonly sdtLocked?: boolean;
    };

    /**
     * Placeholder text displayed when the control is empty or uninitialized.
     *
     * When specified, this text appears in the control and is automatically selected
     * for replacement when the user clicks on the control. This improves the user
     * experience by providing clear guidance on what content is expected.
     *
     * @example "Click here to enter customer name", "Select a date", "Enter description"
     */
    readonly placeholder?: string;
};

/**
 * Enhanced properties specific to text-based content controls.
 *
 * These properties provide additional control over text input behavior and formatting
 * for content controls that primarily handle textual content.
 */
export type ITextContentControlProperties = IContentControlProperties & {
    /**
     * Allows multiple lines of text within the control.
     *
     * When set to true, users can press Enter to create line breaks within the control.
     * When false or undefined, the control restricts input to a single line.
     *
     * @example true (multi-line), false or undefined (single-line)
     * @default false
     */
    readonly multiLine?: boolean;

    /**
     * Maximum number of characters allowed in the control.
     *
     * Enforces a character limit on user input. When the limit is reached,
     * users cannot type additional characters. Useful for fields like postal codes,
     * phone numbers, or ID numbers with specific length requirements.
     *
     * @example 5 (postal code), 10 (phone), 255 (general text)
     */
    readonly maxLength?: number;

    /**
     * Default text formatting applied to content within the control.
     *
     * Defines the visual appearance of text when no other formatting is specified.
     * This styling is applied automatically and can be overridden by users if the
     * control allows content editing.
     *
     * @example
     * ```typescript
     * defaultStyle: {
     *     bold: true,
     *     color: "FF0000",
     *     fontSize: 12,
     *     fontFamily: "Arial"
     * }
     * ```
     */
    readonly defaultStyle?: {
        /**
         * Apply bold formatting to the default text.
         * @example true (bold), false or undefined (normal weight)
         */
        readonly bold?: boolean;
        /**
         * Apply italic formatting to the default text.
         * @example true (italic), false or undefined (normal style)
         */
        readonly italic?: boolean;
        /**
         * Text color in hexadecimal format (without # prefix).
         * @example "FF0000" (red), "0066CC" (blue), "009900" (green)
         */
        readonly color?: string;
        /**
         * Font size in half-points (Word's internal measurement).
         * @example 24 (12pt), 28 (14pt), 32 (16pt)
         */
        readonly fontSize?: number;
        /**
         * Font family name for the text.
         * @example "Arial", "Times New Roman", "Calibri"
         */
        readonly fontFamily?: string;
    };

    /**
     * Enable rich text mode (allows nesting other content controls)
     *
     * IMPORTANT: When true, this control can contain other content controls, TextRuns, etc.
     * When false (default), this is a plain text control that cannot contain other content controls.
     *
     * Use richText: true when you need to nest content controls inline.
     *
     * @default false
     */
    readonly richText?: boolean;
};

/**
 * Options for creating a RunContentControl (inline content control).
 *
 * Run-level content controls are inline elements that exist within paragraphs,
 * similar to TextRun elements. They are ideal for single values like names,
 * dates, or amounts that appear within sentences.
 *
 * These controls generate Plain Text Content Controls in Word, which means they
 * cannot contain formatted text or multiple paragraphs. They do support nesting
 * other RunContentControls for complex inline structures.
 *
 * @example Simple inline control
 * ```typescript
 * new Paragraph({
 *     children: [
 *         new TextRun("Customer: "),
 *         new RunContentControl({
 *             tag: "CustomerName",
 *             title: "Customer Name",
 *             children: [new TextRun("John Doe")]
 *         })
 *     ]
 * })
 * ```
 */
export type IRunContentControlOptions = ITextContentControlProperties & {
    /**
     * The inline elements to display inside the control.
     *
     * Must contain at least one TextRun or nested RunContentControl element.
     * Multiple elements can be used to create content with different formatting
     * or to nest additional content controls within the same control.
     *
     * @example Single text run
     * ```typescript
     * children: [new TextRun("Default Value")]
     * ```
     *
     * @example Multiple formatted runs
     * ```typescript
     * children: [
     *     new TextRun({ text: "Important: ", bold: true }),
     *     new TextRun("Regular text")
     * ]
     * ```
     *
     * @example Nested content controls
     * ```typescript
     * children: [
     *     new TextRun("Document Date: "),
     *     new RunContentControl({
     *         tag: "ActualDate",
     *         children: [new TextRun("MM/DD/YYYY")]
     *     })
     * ]
     * ```
     */
    readonly children: readonly (TextRun | unknown)[];
};

/**
 * Options for creating a BlockContentControl (block-level content control).
 *
 * Block-level content controls are top-level document elements that exist at the same
 * hierarchical level as paragraphs and tables. They are ideal for containing entire
 * sections of content such as address blocks, terms and conditions, or any multi-paragraph
 * structured content.
 *
 * These controls generate Rich Text Content Controls in Word, which means they can
 * contain multiple paragraphs, tables, and complex formatting.
 *
 * @example Simple block control
 * ```typescript
 * const doc = new Document({
 *     sections: [{
 *         children: [
 *             new Paragraph("Introduction"),
 *             new BlockContentControl({
 *                 tag: "CustomerAddress",
 *                 title: "Customer Address",
 *                 children: [
 *                     new Paragraph("Customer Name"),
 *                     new Paragraph("123 Main Street"),
 *                     new Paragraph("City, State 12345")
 *                 ]
 *             }),
 *             new Paragraph("Conclusion")
 *         ]
 *     }]
 * });
 * ```
 *
 * @example Mixed content with tables
 * ```typescript
 * new BlockContentControl({
 *     tag: "OrderSummary",
 *     title: "Order Summary Section",
 *     children: [
 *         new Paragraph("Order Details:"),
 *         new Table({
 *             rows: [
 *                 new TableRow({
 *                     children: [
 *                         new TableCell({ children: [new Paragraph("Item")] }),
 *                         new TableCell({ children: [new Paragraph("Price")] })
 *                     ]
 *                 })
 *             ]
 *         })
 *     ]
 * })
 * ```
 */
export type IBlockContentControlOptions = IContentControlProperties & {
    /**
     * The block-level elements to display inside the control.
     *
     * Must contain at least one Paragraph or Table element. BlockContentControls also
     * support nesting other BlockContentControls, allowing complex document structures
     * with hierarchical content organization.
     *
     * @example Paragraphs only
     * ```typescript
     * children: [
     *     new Paragraph("First paragraph"),
     *     new Paragraph("Second paragraph")
     * ]
     * ```
     *
     * @example Mixed content with tables
     * ```typescript
     * children: [
     *     new Paragraph("Introduction"),
     *     new Table({ rows: [...] }),
     *     new Paragraph("Conclusion")
     * ]
     * ```
     *
     * @example Nested content controls
     * ```typescript
     * children: [
     *     new Paragraph("Outer section"),
     *     new BlockContentControl({
     *         tag: "InnerSection",
     *         title: "Inner Section",
     *         children: [
     *             new Paragraph("Inner content")
     *         ]
     *     }),
     *     new Paragraph("After nested section")
     * ]
     * ```
     */
    readonly children: readonly (Paragraph | Table | unknown)[];
};

/**
 * Options for creating a DropdownContentControl (interactive selection control).
 *
 * Dropdown controls provide users with a predefined list of options to choose from.
 * They support two modes: dropDownList (restricted selection) and comboBox (allows
 * custom text entry in addition to predefined options).
 *
 * These controls are inline elements that exist within paragraphs and generate
 * specialized OOXML elements for interactive selection functionality.
 *
 * @example Basic dropdown list
 * ```typescript
 * new Paragraph({
 *     children: [
 *         new TextRun("Priority: "),
 *         new DropdownContentControl({
 *             tag: "TaskPriority",
 *             title: "Task Priority",
 *             type: 'dropDownList',
 *             listItems: [
 *                 { displayText: "High Priority", value: "high" },
 *                 { displayText: "Medium Priority", value: "medium" },
 *                 { displayText: "Low Priority", value: "low" }
 *             ],
 *             children: [new TextRun("Medium Priority")]
 *         })
 *     ]
 * })
 * ```
 *
 * @example Combo box (allows custom input)
 * ```typescript
 * new DropdownContentControl({
 *     tag: "CustomerType",
 *     title: "Customer Type",
 *     type: 'comboBox',
 *     listItems: [
 *         { displayText: "Individual", value: "individual" },
 *         { displayText: "Business", value: "business" },
 *         { displayText: "Non-Profit", value: "nonprofit" }
 *     ],
 *     placeholder: "Select or enter customer type",
 *     children: [new TextRun("Select customer type")]
 * })
 * ```
 */
export type IDropdownContentControlOptions = ITextContentControlProperties & {
    /**
     * The type of dropdown control to create.
     *
     * - 'dropDownList': Users can only select from predefined options
     * - 'comboBox': Users can select from options OR enter custom text
     *
     * @example 'dropDownList' for restricted selection, 'comboBox' for flexible input
     */
    readonly type: "dropDownList" | "comboBox";

    /**
     * List of predefined options available in the dropdown.
     *
     * Each item has a displayText (shown to users) and a value (stored internally).
     * The order in this array determines the order in the dropdown menu.
     *
     * @example
     * ```typescript
     * listItems: [
     *     { displayText: "Option 1", value: "opt1" },
     *     { displayText: "Option 2", value: "opt2" },
     *     { displayText: "Custom Option", value: "custom" }
     * ]
     * ```
     */
    readonly listItems: readonly {
        /**
         * Text displayed to users in the dropdown menu.
         * @example "High Priority", "Individual Customer", "United States"
         */
        readonly displayText: string;
        /**
         * Internal value stored when this option is selected.
         * @example "high", "individual", "us"
         */
        readonly value: string;
    }[];

    /**
     * The TextRun elements to display as the default/current selection.
     *
     * This should typically match one of the listItems' displayText values,
     * or be placeholder text indicating what the user should select.
     */
    readonly children: readonly (TextRun | unknown)[];
};

/**
 * Options for creating a DatePickerContentControl (calendar interface control).
 *
 * Date picker controls provide users with a calendar interface for selecting dates.
 * They generate specialized OOXML elements that integrate with Microsoft Word's
 * built-in date picker functionality, including format strings, calendar types,
 * and localization support.
 *
 * These controls are inline elements that exist within paragraphs and provide
 * a professional date selection experience with proper formatting.
 *
 * @example Basic date picker
 * ```typescript
 * new Paragraph({
 *     children: [
 *         new TextRun("Due Date: "),
 *         new DatePickerContentControl({
 *             tag: "DueDate",
 *             title: "Project Due Date",
 *             dateFormat: "MM/dd/yyyy",
 *             calendarType: 'gregorian',
 *             locale: "en-US",
 *             children: [new TextRun("12/31/2024")]
 *         })
 *     ]
 * })
 * ```
 *
 * @example Advanced date picker with data binding
 * ```typescript
 * new DatePickerContentControl({
 *     tag: "ContractDate",
 *     title: "Contract Execution Date",
 *     dateFormat: "dd/MM/yyyy",
 *     calendarType: 'gregorian',
 *     locale: "en-GB",
 *     defaultDate: new Date(),
 *     storeMappedDataAs: 'dateTime',
 *     appearance: 'boundingBox',
 *     color: "0066CC",
 *     lock: { sdtLocked: true },
 *     dataBinding: {
 *         xpath: "/contract/executionDate",
 *         storeItemId: "{date-xml-guid}"
 *     },
 *     children: [new TextRun("Select contract date")]
 * })
 * ```
 */
export type IDatePickerContentControlOptions = IContentControlProperties & {
    /**
     * Date format string for displaying and parsing dates.
     *
     * Defines how dates are formatted when displayed to users and how user input
     * is parsed. Uses standard date format patterns supported by Microsoft Word.
     *
     * @example "MM/dd/yyyy" (US format), "dd/MM/yyyy" (European format), "yyyy-MM-dd" (ISO format)
     * @default "MM/dd/yyyy"
     */
    readonly dateFormat?: string;

    /**
     * Calendar type to use for date selection.
     *
     * Determines which calendar system is used in the date picker interface.
     * Different calendar types are important for international applications
     * and religious/cultural requirements.
     *
     * @example 'gregorian' (Western), 'hijri' (Islamic), 'hebrew' (Jewish), 'taiwan' (Taiwanese)
     * @default 'gregorian'
     */
    readonly calendarType?: "gregorian" | "hijri" | "hebrew" | "taiwan";

    /**
     * Default date value when the control is first created.
     *
     * Sets the initial date value for the control. If not specified, the control
     * will start empty or with placeholder text. The date is automatically
     * formatted according to the dateFormat property.
     *
     * @example new Date(), new Date('2024-12-31'), new Date(2024, 11, 31)
     */
    readonly defaultDate?: Date;

    /**
     * Locale identifier for date formatting and calendar display.
     *
     * Determines the language and regional settings used for date formatting,
     * month names, day names, and calendar interface elements.
     *
     * @example "en-US" (English US), "en-GB" (English UK), "fr-FR" (French), "de-DE" (German)
     * @default "en-US"
     */
    readonly locale?: string;

    /**
     * How the mapped data should be stored when using data binding.
     *
     * Determines the format of the data stored in custom XML parts when the
     * control is bound to XML data. Affects how the date value is serialized
     * and retrieved from the data source.
     *
     * @example 'text' (formatted string), 'date' (date only), 'dateTime' (date and time)
     * @default 'text'
     */
    readonly storeMappedDataAs?: "text" | "date" | "dateTime";

    /**
     * The TextRun elements to display as the current date value.
     *
     * This should contain the formatted date string that users see before
     * interacting with the calendar. The content is automatically updated
     * when users select a new date from the calendar interface.
     */
    readonly children: readonly (TextRun | unknown)[];
};

/**
 * Options for creating a CheckboxContentControl (binary selection control).
 *
 * Checkbox controls provide users with a simple binary choice (checked/unchecked).
 * They generate specialized OOXML elements that integrate with Microsoft Word's
 * checkbox functionality, including custom symbol support and visual styling.
 *
 * These controls are inline elements that exist within paragraphs and provide
 * a clean way to represent boolean choices, agreements, or status indicators.
 *
 * Note: This is different from the existing simpler CheckBox class - this provides
 * full Content Control functionality with enhanced properties and validation.
 *
 * @example Basic checkbox
 * ```typescript
 * new Paragraph({
 *     children: [
 *         new CheckboxContentControl({
 *             tag: "TermsAgreement",
 *             title: "Terms and Conditions Agreement",
 *             checked: false,
 *             children: []
 *         }),
 *         new TextRun(" I agree to the terms and conditions")
 *     ]
 * })
 * ```
 *
 * @example Custom symbols and styling
 * ```typescript
 * new CheckboxContentControl({
 *     tag: "ApprovalStatus",
 *     title: "Document Approval",
 *     checked: true,
 *     checkedSymbol: { font: "Wingdings", character: "☑" },
 *     uncheckedSymbol: { font: "Wingdings", character: "☐" },
 *     appearance: 'boundingBox',
 *     color: "009900",
 *     lock: { sdtLocked: true },
 *     children: []
 * })
 * ```
 */
export type ICheckboxContentControlOptions = IContentControlProperties & {
    /**
     * Whether the checkbox is initially checked or unchecked.
     *
     * Determines the default state of the checkbox when the document is opened.
     * Users can change this state by clicking the checkbox unless content is locked.
     *
     * @example true (checked), false (unchecked)
     * @default false
     */
    readonly checked?: boolean;

    /**
     * Symbol configuration for the checked state.
     *
     * Defines the visual appearance of the checkbox when it is checked.
     * Uses Unicode characters or font-specific symbols to customize the look.
     *
     * @example { font: "Wingdings", character: "☑" }
     * @example { font: "Segoe UI Symbol", character: "✓" }
     * @default { font: "MS Gothic", character: "☑" }
     */
    readonly checkedSymbol?: {
        /**
         * Font family containing the checkbox symbol.
         * @example "Wingdings", "Segoe UI Symbol", "MS Gothic"
         */
        readonly font: string;
        /**
         * Unicode character or symbol for the checked state.
         * @example "☑", "✓", "✔", "2612"
         */
        readonly character: string;
    };

    /**
     * Symbol configuration for the unchecked state.
     *
     * Defines the visual appearance of the checkbox when it is unchecked.
     * Uses Unicode characters or font-specific symbols to customize the look.
     *
     * @example { font: "Wingdings", character: "☐" }
     * @example { font: "Segoe UI Symbol", character: "□" }
     * @default { font: "MS Gothic", character: "☐" }
     */
    readonly uncheckedSymbol?: {
        /**
         * Font family containing the checkbox symbol.
         * @example "Wingdings", "Segoe UI Symbol", "MS Gothic"
         */
        readonly font: string;
        /**
         * Unicode character or symbol for the unchecked state.
         * @example "☐", "□", "◯", "2610"
         */
        readonly character: string;
    };

    /**
     * Children are not typically used for checkbox controls.
     *
     * Checkbox controls are self-contained visual elements that don't require
     * child TextRun elements. An empty array should be provided to maintain
     * consistency with the Content Control interface.
     */
    readonly children: readonly unknown[];
};
