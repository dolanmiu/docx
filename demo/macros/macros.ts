// A macro-enabled document: VBA macros written from their code, which Word runs from the .docm

import * as fs from "fs";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { createMacros } from "docx/macros";

const doc = new Document({
    macros: createMacros({
        // The document's own module, which handles its events. Word runs Document_Open when the document opens
        thisDocument: `
Private Sub Document_Open()
    ActiveDocument.Content.InsertParagraphAfter
    ActiveDocument.Content.InsertAfter "Opened on " & Format(Date, "d mmmm yyyy") & "."
End Sub
`,
        modules: [
            {
                name: "Formatting",
                code: `
' Run from View > Macros
Sub HighlightNumbers()
    Dim item As Range
    For Each item In ActiveDocument.Words
        If IsNumeric(Trim(item.Text)) Then item.HighlightColorIndex = wdYellow
    Next
End Sub
`,
            },
        ],
    }),
    sections: [
        {
            children: [
                new Paragraph({ children: [new TextRun({ text: "A document with macros", bold: true })] }),
                new Paragraph("Enable macros when Word asks, and the document adds the date it was opened below."),
                new Paragraph("Then run HighlightNumbers from View > Macros to highlight 3, 14 and 159 in this sentence."),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docm", buffer);
});
