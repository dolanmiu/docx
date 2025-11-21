// Complete Phase 2A + 2B Content Controls Implementation Demo
// Showcases ALL foundation + interactive properties: basic controls, nesting, enhanced properties,
// locking, placeholders, text formatting, data binding, dropdowns, date pickers, and checkboxes

import * as fs from "fs";
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    RunContentControl,
    BlockContentControl,
    DropdownContentControl,
    DatePickerContentControl,
    CheckboxContentControl,
    AlignmentType,
    Table,
    TableRow,
    TableCell,
} from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                // Document title
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: "Phase 2A + 2B Content Controls Complete Demo",
                            bold: true,
                            size: 28,
                        }),
                    ],
                }),

                new Paragraph(""),

                // Example 1: Basic inline content control
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "1. Basic Usage: ",
                            bold: true,
                        }),
                        new TextRun("Dear "),
                        new RunContentControl({
                            tag: "CustomerName",
                            title: "Customer Name",
                            children: [new TextRun("[Customer Name]")],
                        }),
                        new TextRun(", thank you for your business."),
                    ],
                }),

                // Example 2: Multiple controls in one paragraph
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "2. Multiple Controls: ",
                            bold: true,
                        }),
                        new TextRun("Your order "),
                        new RunContentControl({
                            tag: "OrderNumber",
                            title: "Order Number",
                            children: [
                                new TextRun({
                                    text: "[Order #]",
                                    color: "0066CC",
                                }),
                            ],
                        }),
                        new TextRun(" totaling "),
                        new RunContentControl({
                            tag: "OrderTotal",
                            title: "Order Total",
                            children: [
                                new TextRun({
                                    text: "$0.00",
                                    bold: true,
                                    color: "009900",
                                }),
                            ],
                        }),
                        new TextRun(" has been processed successfully."),
                    ],
                }),

                // Example 3: Control without title (tag only)
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "3. Tag-Only Control: ",
                            bold: true,
                        }),
                        new TextRun("Contact us at "),
                        new RunContentControl({
                            tag: "ContactEmail",
                            children: [
                                new TextRun({
                                    text: "support@company.com",
                                    underline: {
                                        type: "single",
                                        color: "0066CC",
                                    },
                                }),
                            ],
                        }),
                        new TextRun(" for support."),
                    ],
                }),

                // Example 4: Complex formatting within control
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "4. Formatted Content: ",
                            bold: true,
                        }),
                        new RunContentControl({
                            tag: "ImportantNote",
                            title: "Important Note",
                            children: [
                                new TextRun({
                                    text: "URGENT: ",
                                    bold: true,
                                    color: "FF0000",
                                }),
                                new TextRun({
                                    text: "Please review immediately",
                                    italic: true,
                                }),
                            ],
                        }),
                    ],
                }),

                // Example 5: Date and reference fields
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "5. Date & Reference: ",
                            bold: true,
                        }),
                        new TextRun("Document date: "),
                        new RunContentControl({
                            tag: "DocumentDate",
                            title: "Document Date",
                            children: [new TextRun("[MM/DD/YYYY]")],
                        }),
                        new TextRun(" | Reference: "),
                        new RunContentControl({
                            tag: "ReferenceNumber",
                            title: "Reference Number",
                            children: [
                                new TextRun({
                                    text: "[REF-000000]",
                                    allCaps: true,
                                }),
                            ],
                        }),
                    ],
                }),

                new Paragraph(""),

                // Example 6: Block-level content control (Rich Text)
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "6. Block Content Control (Multi-paragraph): ",
                            bold: true,
                        }),
                    ],
                }),

                new BlockContentControl({
                    tag: "CustomerAddress",
                    title: "Customer Address Block",
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "[Customer Name]",
                                    bold: true,
                                    size: 24,
                                }),
                            ],
                        }),
                        new Paragraph({
                            children: [new TextRun("[Street Address]")],
                        }),
                        new Paragraph({
                            children: [new TextRun("[City, State ZIP]")],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "[Country]",
                                    italic: true,
                                }),
                            ],
                        }),
                    ],
                }),

                // Example 7: Block control with mixed content (Paragraphs + Table)
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "7. Mixed Block Content (Paragraphs + Table): ",
                            bold: true,
                        }),
                    ],
                }),

                new BlockContentControl({
                    tag: "OrderSummary",
                    title: "Order Summary Section",
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Order Details",
                                    bold: true,
                                    underline: { type: "single" },
                                }),
                            ],
                        }),
                        new Table({
                            width: { size: 100, type: "pct" },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    children: [new TextRun({ text: "Item", bold: true })],
                                                }),
                                            ],
                                        }),
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    children: [new TextRun({ text: "Quantity", bold: true })],
                                                }),
                                            ],
                                        }),
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    children: [new TextRun({ text: "Price", bold: true })],
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph("[Item Name]")],
                                        }),
                                        new TableCell({
                                            children: [new Paragraph("[Qty]")],
                                        }),
                                        new TableCell({
                                            children: [new Paragraph("[Price]")],
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun("Order Total: "),
                                new TextRun({
                                    text: "$XXX.XX",
                                    bold: true,
                                    color: "009900",
                                }),
                            ],
                        }),
                    ],
                }),

                new Paragraph(""),

                // Example 8: Nested BlockContentControls
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "8. Nested Block Content Controls: ",
                            bold: true,
                        }),
                    ],
                }),

                new BlockContentControl({
                    tag: "ContractDocument",
                    title: "Contract Document Structure",
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "CONTRACT TERMS",
                                    bold: true,
                                    allCaps: true,
                                }),
                            ],
                        }),

                        // Nested block control for party information
                        new BlockContentControl({
                            tag: "PartyInformation",
                            title: "Party Information Section",
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: "Party 1:",
                                            underline: { type: "single" },
                                        }),
                                    ],
                                }),
                                new Paragraph("[Party 1 Details]"),
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: "Party 2:",
                                            underline: { type: "single" },
                                        }),
                                    ],
                                }),
                                new Paragraph("[Party 2 Details]"),
                            ],
                        }),

                        // Nested block control for terms
                        new BlockContentControl({
                            tag: "TermsSection",
                            title: "Terms and Conditions",
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: "Terms and Conditions:",
                                            bold: true,
                                        }),
                                    ],
                                }),
                                new Paragraph("1. [Term 1]"),
                                new Paragraph("2. [Term 2]"),
                                new Paragraph("3. [Term 3]"),
                            ],
                        }),

                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "END OF CONTRACT",
                                    bold: true,
                                    italic: true,
                                }),
                            ],
                        }),
                    ],
                }),

                // Example 9: Nested RunContentControls (your suggested use case)
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "9. Nested Inline Controls (Date in Document Info): ",
                            bold: true,
                        }),
                    ],
                }),

                new Paragraph({
                    children: [
                        new RunContentControl({
                            tag: "DocumentInfo",
                            title: "Document Information",
                            richText: true, // 🔧 FIX: Enable rich text mode for nesting!
                            children: [
                                new TextRun("Report generated on "),
                                new RunContentControl({
                                    tag: "ReportDate",
                                    title: "Report Date",
                                    children: [
                                        new TextRun({
                                            text: "[MM/DD/YYYY]",
                                            color: "0066CC",
                                        }),
                                    ],
                                }),
                                new TextRun(" at "),
                                new RunContentControl({
                                    tag: "ReportTime",
                                    title: "Report Time",
                                    children: [
                                        new TextRun({
                                            text: "[HH:MM AM/PM]",
                                            color: "0066CC",
                                        }),
                                    ],
                                }),
                                new TextRun(" by system."),
                            ],
                        }),
                    ],
                }),

                new Paragraph(""),

                // Example 10: Complete Phase 2A Properties (All Features)
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "10. Complete Phase 2A Properties (All Features): ",
                            bold: true,
                        }),
                    ],
                }),

                // Demonstrate appearance modes with colors
                new Paragraph({
                    children: [
                        new TextRun("Appearance Modes: "),
                        new RunContentControl({
                            tag: "BoundingBoxControl",
                            title: "Bounding Box Mode",
                            appearance: "boundingBox",
                            color: "0066CC",
                            children: [
                                new TextRun({
                                    text: "[Bounding Box]",
                                    bold: true,
                                }),
                            ],
                        }),
                        new TextRun(" | "),
                        new RunContentControl({
                            tag: "TagsControl",
                            title: "Tags Mode",
                            appearance: "tags",
                            color: "FF6600",
                            children: [
                                new TextRun({
                                    text: "[Tags Mode]",
                                    italic: true,
                                }),
                            ],
                        }),
                        new TextRun(" | "),
                        new RunContentControl({
                            tag: "HiddenControl",
                            title: "Hidden Mode",
                            appearance: "hidden",
                            children: [new TextRun("[Hidden Mode]")],
                        }),
                    ],
                }),

                // Demonstrate locking and placeholder properties
                new Paragraph({
                    children: [
                        new TextRun("Locking & Placeholder: "),
                        new RunContentControl({
                            tag: "LockedContentControl",
                            title: "Content Locked (Read-Only)",
                            appearance: "boundingBox",
                            color: "FF0000",
                            lock: {
                                contentLock: true,
                                sdtLocked: false,
                            },
                            placeholder: "This content is locked for editing",
                            children: [new TextRun("[Protected Content]")],
                        }),
                        new TextRun(" | "),
                        new RunContentControl({
                            tag: "DeleteProtectedControl",
                            title: "Delete Protected",
                            appearance: "tags",
                            color: "990099",
                            lock: {
                                sdtLocked: true,
                            },
                            placeholder: "This control cannot be deleted",
                            children: [new TextRun("[Delete Protected]")],
                        }),
                    ],
                }),

                // Demonstrate text formatting properties
                new Paragraph({
                    children: [
                        new TextRun("Text Properties: "),
                        new RunContentControl({
                            tag: "FormattedTextControl",
                            title: "Formatted Text Control",
                            appearance: "boundingBox",
                            color: "009900",
                            multiLine: true,
                            maxLength: 100,
                            defaultStyle: {
                                bold: true,
                                italic: true,
                                color: "FF6600",
                                fontSize: 28,
                                fontFamily: "Arial",
                            },
                            placeholder: "Multi-line text with formatting",
                            children: [new TextRun("[Styled Text - Max 100 chars]")],
                        }),
                    ],
                }),

                // Demonstrate complete block control with all Phase 2A properties
                new BlockContentControl({
                    tag: "CompletePhase2ABlock",
                    title: "Complete Phase 2A Block Control",
                    appearance: "boundingBox",
                    color: "990099",
                    lock: {
                        contentLock: false,
                        sdtLocked: true,
                    },
                    placeholder: "This block demonstrates all Phase 2A properties",
                    dataBinding: {
                        xpath: "/root/customer",
                        storeItemId: "{12345678-1234-1234-1234-123456789012}",
                    },
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "COMPLETE PHASE 2A DEMONSTRATION",
                                    bold: true,
                                    underline: { type: "single" },
                                }),
                            ],
                        }),
                        new Paragraph("* Appearance: boundingBox with purple border"),
                        new Paragraph("* Locking: Control cannot be deleted (sdtLocked=true)"),
                        new Paragraph("* Placeholder: Instructional text for users"),
                        new Paragraph("* Data Binding: Linked to /root/customer XML data"),
                        new Paragraph({
                            children: [
                                new TextRun("* Nested inline control: "),
                                new RunContentControl({
                                    tag: "NestedDemo",
                                    title: "Nested in Block",
                                    appearance: "tags",
                                    color: "006600",
                                    multiLine: false,
                                    maxLength: 50,
                                    defaultStyle: {
                                        bold: true,
                                        color: "0066CC",
                                    },
                                    lock: {
                                        contentLock: true,
                                    },
                                    placeholder: "Nested control with all properties",
                                    children: [new TextRun("[Nested Formatted]")],
                                }),
                            ],
                        }),
                        new Table({
                            width: { size: 100, type: "pct" },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph("Property")],
                                        }),
                                        new TableCell({
                                            children: [new Paragraph("Status")],
                                        }),
                                    ],
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph("All Features")],
                                        }),
                                        new TableCell({
                                            children: [new Paragraph("* Implemented")],
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),

                new Paragraph(""),

                // Example 11: Interactive Controls - Dropdown and ComboBox (Phase 2B)
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "11. Interactive Controls - Dropdown & ComboBox (Phase 2B): ",
                            bold: true,
                        }),
                    ],
                }),

                // Demonstrate dropdown list (restricted selection)
                new Paragraph({
                    children: [
                        new TextRun("Task Priority: "),
                        new DropdownContentControl({
                            tag: "TaskPriority",
                            title: "Task Priority Level",
                            type: "dropDownList",
                            appearance: "boundingBox",
                            color: "FF6600",
                            lock: { sdtLocked: true },
                            listItems: [
                                { displayText: "Critical", value: "critical" },
                                { displayText: "High", value: "high" },
                                { displayText: "Medium", value: "medium" },
                                { displayText: "Low", value: "low" },
                                { displayText: "Not Set", value: "none" },
                            ],
                            children: [new TextRun("Medium")],
                        }),
                        new TextRun(" | Status: "),
                        new DropdownContentControl({
                            tag: "TaskStatus",
                            title: "Task Status",
                            type: "dropDownList",
                            appearance: "tags",
                            color: "0066CC",
                            listItems: [
                                { displayText: "Planned", value: "planned" },
                                { displayText: "In Progress", value: "inprogress" },
                                { displayText: "Complete", value: "complete" },
                                { displayText: "Cancelled", value: "cancelled" },
                            ],
                            children: [new TextRun("Planned")],
                        }),
                    ],
                }),

                // Demonstrate combo box (allows custom input)
                new Paragraph({
                    children: [
                        new TextRun("Customer Type: "),
                        new DropdownContentControl({
                            tag: "CustomerType",
                            title: "Customer Type Selection",
                            type: "comboBox",
                            appearance: "boundingBox",
                            color: "990099",
                            placeholder: "Select from list or enter custom type",
                            multiLine: false,
                            maxLength: 50,
                            defaultStyle: {
                                bold: true,
                                color: "663399",
                            },
                            listItems: [
                                { displayText: "Individual Customer", value: "individual" },
                                { displayText: "Business Customer", value: "business" },
                                { displayText: "Government Entity", value: "government" },
                                { displayText: "Non-Profit Organization", value: "nonprofit" },
                                { displayText: "Educational Institution", value: "education" },
                                { displayText: "Other (specify below)", value: "other" },
                            ],
                            children: [new TextRun("Select customer type")],
                        }),
                        new TextRun(" | Region: "),
                        new DropdownContentControl({
                            tag: "Region",
                            title: "Geographic Region",
                            type: "comboBox",
                            appearance: "hidden",
                            dataBinding: {
                                xpath: "/customer/region",
                                storeItemId: "{12345678-1234-5678-9ABC-123456789007}",
                            },
                            listItems: [
                                { displayText: "North America", value: "na" },
                                { displayText: "Europe", value: "eu" },
                                { displayText: "Asia Pacific", value: "apac" },
                                { displayText: "South America", value: "sa" },
                                { displayText: "Africa", value: "af" },
                            ],
                            children: [new TextRun("North America")],
                        }),
                    ],
                }),

                // Demonstrate dropdown with comprehensive properties
                new Paragraph({
                    children: [
                        new TextRun("Department: "),
                        new DropdownContentControl({
                            tag: "Department",
                            title: "Employee Department",
                            type: "dropDownList",
                            appearance: "boundingBox",
                            color: "006600",
                            lock: {
                                contentLock: false,
                                sdtLocked: true,
                            },
                            placeholder: "Select employee department from the list",
                            dataBinding: {
                                xpath: "/employee/department",
                                storeItemId: "{12345678-1234-5678-9ABC-123456789008}",
                            },
                            defaultStyle: {
                                bold: true,
                                fontFamily: "Arial",
                            },
                            listItems: [
                                { displayText: "Sales", value: "sales" },
                                { displayText: "Engineering", value: "engineering" },
                                { displayText: "Finance", value: "finance" },
                                { displayText: "Human Resources", value: "hr" },
                                { displayText: "Marketing", value: "marketing" },
                                { displayText: "Operations", value: "operations" },
                                { displayText: "Support", value: "support" },
                            ],
                            children: [new TextRun("Sales")],
                        }),
                    ],
                }),

                new Paragraph(""),

                // Example 12: Date Picker and Checkbox Controls
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "12. Date Picker and Checkbox Controls: ",
                            bold: true,
                        }),
                    ],
                }),

                // Demonstrate date pickers
                new Paragraph({
                    children: [
                        new TextRun("Project Start: "),
                        new DatePickerContentControl({
                            tag: "ProjectStartDate",
                            title: "Project Start Date",
                            dateFormat: "MM/dd/yyyy",
                            calendarType: "gregorian",
                            locale: "en-US",
                            defaultDate: new Date(2024, 0, 1),
                            appearance: "boundingBox",
                            color: "0066CC",
                            children: [new TextRun("01/01/2024")],
                        }),
                        new TextRun(" | Due: "),
                        new DatePickerContentControl({
                            tag: "ProjectDueDate",
                            title: "Project Due Date",
                            dateFormat: "dd/MM/yyyy",
                            calendarType: "gregorian",
                            locale: "en-GB",
                            storeMappedDataAs: "dateTime",
                            appearance: "tags",
                            color: "FF6600",
                            placeholder: "Select project due date",
                            dataBinding: {
                                xpath: "/project/dueDate",
                                storeItemId: "{12345678-1234-5678-9ABC-123456789009}",
                            },
                            children: [new TextRun("31/12/2024")],
                        }),
                    ],
                }),

                // Demonstrate checkboxes
                new Paragraph({
                    children: [
                        new CheckboxContentControl({
                            tag: "TermsAccepted",
                            title: "Terms and Conditions Agreement",
                            checked: false,
                            appearance: "boundingBox",
                            color: "FF0000",
                            children: [],
                        }),
                        new TextRun(" I agree to the terms and conditions | "),
                        new CheckboxContentControl({
                            tag: "NewsletterOptIn",
                            title: "Newsletter Subscription",
                            checked: true,
                            checkedSymbol: { font: "Wingdings", character: "X" },
                            uncheckedSymbol: { font: "Wingdings", character: "O" },
                            appearance: "tags",
                            color: "009900",
                            lock: { sdtLocked: true },
                            children: [],
                        }),
                        new TextRun(" Subscribe to newsletter"),
                    ],
                }),

                // Demonstrate advanced checkbox with data binding
                new Paragraph({
                    children: [
                        new CheckboxContentControl({
                            tag: "DocumentApproval",
                            title: "Document Approval Status",
                            checked: false,
                            checkedSymbol: { font: "Segoe UI Symbol", character: "Y" },
                            uncheckedSymbol: { font: "Segoe UI Symbol", character: "N" },
                            appearance: "boundingBox",
                            color: "990099",
                            lock: {
                                contentLock: false,
                                sdtLocked: true,
                            },
                            placeholder: "Document approval checkbox",
                            dataBinding: {
                                xpath: "/document/approved",
                                storeItemId: "{12345678-1234-5678-9ABC-123456789012}",
                            },
                            children: [],
                        }),
                        new TextRun(" "),
                        new TextRun({
                            text: "DOCUMENT APPROVED",
                            bold: true,
                            allCaps: true,
                        }),
                        new TextRun(" by "),
                        new DatePickerContentControl({
                            tag: "ApprovalDate",
                            title: "Approval Date",
                            dateFormat: "MMMM dd, yyyy",
                            appearance: "hidden",
                            children: [new TextRun("December 19, 2024")],
                        }),
                    ],
                }),

                new Paragraph(""),

                // Separator
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Instructions for Microsoft Word:",
                            bold: true,
                            underline: {
                                type: "single",
                            },
                        }),
                    ],
                }),

                // Instructions
                new Paragraph({
                    children: [new TextRun("• Open the Developer tab in Word")],
                }),
                new Paragraph({
                    children: [new TextRun("• Click on content controls to see their properties")],
                }),
                new Paragraph({
                    children: [new TextRun("• Inline controls (examples 1-5) appear within paragraphs")],
                }),
                new Paragraph({
                    children: [new TextRun("• Block controls (examples 6-7) appear as separate document sections")],
                }),
                new Paragraph({
                    children: [new TextRun("• Nested controls (examples 8-9) demonstrate hierarchical structures")],
                }),
                new Paragraph({
                    children: [new TextRun("• Complete Phase 2A (example 10) shows all foundation properties")],
                }),
                new Paragraph({
                    children: [new TextRun("• Interactive controls (examples 11-12) show dropdowns, date pickers, and checkboxes")],
                }),
                new Paragraph({
                    children: [new TextRun("• Try editing locked controls to see protection behavior")],
                }),
                new Paragraph({
                    children: [new TextRun("• Click dropdown controls to see selection menus")],
                }),
                new Paragraph({
                    children: [new TextRun("• Click date controls to open calendar picker")],
                }),
                new Paragraph({
                    children: [new TextRun("• Click checkboxes to toggle checked/unchecked state")],
                }),
                new Paragraph({
                    children: [new TextRun("• Use 'Properties' button to view tags, titles, locks, and data binding")],
                }),
                new Paragraph({
                    children: [new TextRun("• Content controls are highlighted when selected")],
                }),

                new Paragraph(""),

                // Footer
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                        new TextRun({
                            text: "Phase 2A + 2B Complete: Foundation + Interactive Controls",
                            italic: true,
                            size: 16,
                        }),
                    ],
                }),
            ],
        },
    ],
});

// Generate the document
Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
    console.log("Document created successfully!");
    console.log("Open 'My Document.docx' in Microsoft Word to see the Content Controls");
});
