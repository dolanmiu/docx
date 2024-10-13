// Patch a document with patches

import * as fs from "fs";
import { patchDocument, PatchType, TextRun } from "docx";

patchDocument({
    outputType: "nodebuffer",
    data: fs.readFileSync("demo/assets/field-trip.docx"),
    patches: {
        todays_date: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun({ text: new Date().toLocaleDateString() })],
        },

        school_name: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun({ text: "test" })],
        },

        address: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun({ text: "blah blah" })],
        },

        city: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun({ text: "test" })],
        },

        state: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun({ text: "test" })],
        },

        zip: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun({ text: "test" })],
        },

        phone: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun({ text: "test" })],
        },

        first_name: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun({ text: "test" })],
        },

        last_name: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun({ text: "test" })],
        },

        email_address: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun({ text: "test" })],
        },

        ft_dates: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun({ text: "test" })],
        },

        grade: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun({ text: "test" })],
        },
    },
}).then((doc) => {
    fs.writeFileSync("My Document.docx", doc);
});
