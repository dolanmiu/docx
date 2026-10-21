// Sources of several kinds, citations of them in the text, and a bibliography, in APA, as Word's References > Citations & Bibliography writes them
// See docs/usage/bibliography.md for full documentation.

import * as fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { Bibliography, Citation, CitationStyle, SourceType, createBibliography } from "docx/bibliography";

const doc = new Document({
    bibliography: createBibliography({
        style: CitationStyle.APA,
        sources: [
            {
                tag: "Bak10",
                type: SourceType.BOOK,
                authors: [{ lastName: "Baker", firstName: "Anna" }],
                title: "The Art of Pizza",
                year: 2010,
                city: "Naples",
                publisher: "Oven Press",
            },
            {
                tag: "Lee18",
                type: SourceType.JOURNAL_ARTICLE,
                authors: [
                    { lastName: "Lee", firstName: "Daniel" },
                    { lastName: "Kim", firstName: "Sora" },
                ],
                title: "Crust Hydration and Bake Time",
                journalName: "Journal of Baking Science",
                year: 2018,
                volume: 12,
                issue: 4,
                pages: "233-250",
            },
            {
                tag: "Hug21",
                type: SourceType.WEBSITE,
                authors: [{ lastName: "Hughes", firstName: "Leo" }],
                title: "Stretching Dough by Hand",
                websiteName: "Pizza School",
                year: 2021,
                month: "January",
                day: 9,
                yearAccessed: 2022,
                monthAccessed: "February",
                dayAccessed: 3,
                url: "https://example.com/stretching",
            },
            {
                tag: "WPA16",
                type: SourceType.REPORT,
                corporateAuthor: "World Pizza Association",
                title: "Pizza Standards",
                year: 2016,
                city: "Rome",
                publisher: "WPA Press",
            },
        ],
    }),
    sections: [
        {
            children: [
                new Paragraph({ text: "Pizza report", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({
                    children: [
                        new TextRun("Pizza has been baked in Naples for centuries "),
                        new Citation("Bak10"),
                        new TextRun(". Wetter dough bakes faster "),
                        new Citation({ source: "Lee18", pages: "240" }),
                        new TextRun(", and is easier to stretch by hand "),
                        new Citation("Hug21"),
                        new TextRun("."),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun("A margherita has tomato, mozzarella and basil "),
                        new Citation(["WPA16", { source: "Bak10", pages: "12-14" }]),
                        new TextRun("."),
                    ],
                }),
                new Bibliography({ title: "References" }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
