# Citations and Bibliography

<!-- cspell:ignore Mabe Müller -->

A document can cite its sources, such as books, articles and websites, in its text, such as "(Baker, 2010)", and list them in a bibliography, in one of Word's styles of citation, such as APA, MLA or Chicago. Word does this with **References > Citations & Bibliography**, and `docx` writes the same: each citation and bibliography is written as Word writes it, in the style the document's sources are given. Word writes them again when it updates the document's fields, or when the style is changed in **References > Style**, and lists the sources in its **Source Manager**.

Citations and bibliographies come with the `docx` package, from `docx/bibliography`. The sources go in the document's `bibliography`:

```ts
import { Document, Packer, Paragraph, TextRun } from "docx";
import { Bibliography, Citation, CitationStyle, SourceType, createBibliography } from "docx/bibliography";
```

In a page without a bundler, load `dist/bibliography.umd.cjs` after `dist/index.umd.cjs` (or `dist/bibliography.iife.js` after `dist/index.iife.js`). It adds a `docxBibliography` global, such as `docxBibliography.createBibliography({ ... })`.

## Example

```ts live
import { Document, Paragraph, TextRun } from "docx";
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
        ],
    }),
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun("Pizza has been baked in Naples for centuries "),
                        new Citation("Bak10"),
                        new TextRun(", and wetter dough bakes faster "),
                        new Citation({ source: "Lee18", pages: "240" }),
                        new TextRun("."),
                    ],
                }),
                new Bibliography({ title: "References" }),
            ],
        },
    ],
});
```

## Sources

`createBibliography` takes the document's sources, and the style its citations and bibliographies are written in, which is APA, Word's default, if it isn't given:

| Property  | Type            | Notes    | Description                                                                   |
| --------- | --------------- | -------- | ----------------------------------------------------------------------------- |
| `sources` | `Source[]`      | Required | The sources, such as books and websites                                       |
| `style`   | `CitationStyle` | Optional | The style of the citations and bibliographies, `CitationStyle.APA` if not set |

Each source has a `tag`, which citations refer to it by and Word calls its tag name, such as "Bak10", and a `type`, one of the kinds of source Word's **Create Source** dialog has:

| `SourceType`              | Word's type             | Its main fields                                                                      |
| ------------------------- | ----------------------- | ------------------------------------------------------------------------------------ |
| `BOOK`                    | Book                    | `authors`, `title`, `year`, `city`, `publisher`, `edition`, `volume`, `editors`      |
| `BOOK_SECTION`            | Book Section            | `authors`, `title`, `bookTitle`, `bookAuthors`, `pages`, `year`, `city`, `publisher` |
| `JOURNAL_ARTICLE`         | Journal Article         | `authors`, `title`, `journalName`, `year`, `volume`, `issue`, `pages`                |
| `ARTICLE_IN_A_PERIODICAL` | Article in a Periodical | `authors`, `title`, `periodicalTitle`, `year`, `month`, `day`, `pages`               |
| `CONFERENCE_PROCEEDINGS`  | Conference Proceedings  | `authors`, `title`, `conferenceName`, `year`, `city`, `publisher`, `pages`           |
| `REPORT`                  | Report                  | `authors`, `title`, `institution`, `reportType`, `year`, `city`, `publisher`         |
| `WEBSITE`                 | Web site                | `authors`, `title`, `websiteName`, `url`, `year`, `month`, `day`, `yearAccessed`     |
| `DOCUMENT_FROM_WEBSITE`   | Document From Web site  | `authors`, `title`, `websiteName`, `url`, `year`, `yearAccessed`                     |
| `ELECTRONIC_SOURCE`       | Electronic Source       | `authors`, `title`, `publicationTitle`, `medium`, `year`, `publisher`                |
| `ART`                     | Art                     | `artists`, `title`, `institution`, `year`, `city`                                    |
| `SOUND_RECORDING`         | Sound Recording         | `composers`, `performers`, `title`, `albumTitle`, `year`, `productionCompany`        |
| `PERFORMANCE`             | Performance             | `writers`, `directors`, `performers`, `title`, `theater`, `year`, `city`             |
| `FILM`                    | Film                    | `directors`, `writers`, `producers`, `title`, `year`, `distributor`, `medium`        |
| `INTERVIEW`               | Interview               | `interviewees`, `interviewers`, `title`, `broadcastTitle`, `year`, `broadcaster`     |
| `PATENT`                  | Patent                  | `inventors`, `title`, `patentNumber`, `countryOrRegion`, `year`                      |
| `CASE`                    | Case                    | `title`, `caseNumber`, `court`, `reporter`, `year`                                   |
| `MISCELLANEOUS`           | Miscellaneous           | `authors`, `title`, `publicationTitle`, `year`, `city`, `publisher`                  |

Any source can have any field, as in Word, and each style writes the fields it has for the type of source. A person, such as an author, has a `lastName`, and can have a `firstName` and a `middleName`. Styles that write initials write them from the first letter of each name, such as "J.-P." for "Jean-Paul". A source written by an organization has a `corporateAuthor` in place of its `authors`:

```ts live
import { Document, Paragraph } from "docx";
import { Bibliography, Citation, SourceType, createBibliography } from "docx/bibliography";

const doc = new Document({
    bibliography: createBibliography({
        sources: [
            {
                tag: "WPA16",
                type: SourceType.REPORT,
                corporateAuthor: "World Pizza Association",
                title: "Pizza Standards",
                year: 2016,
                city: "Rome",
                publisher: "WPA Press",
            },
            {
                tag: "Hug21",
                type: SourceType.WEBSITE,
                authors: [{ lastName: "Hughes", firstName: "Leo" }],
                title: "Stretching Dough by Hand",
                websiteName: "Pizza School",
                url: "https://example.com/stretching",
                year: 2021,
                month: "January",
                day: 9,
                yearAccessed: 2022,
                monthAccessed: "February",
                dayAccessed: 3,
            },
        ],
    }),
    sections: [
        {
            children: [
                new Paragraph({ children: [new Citation("WPA16")] }),
                new Paragraph({ children: [new Citation("Hug21")] }),
                new Bibliography(),
            ],
        },
    ],
});
```

Each field is text as Word keeps it, and is written as it's given, so give a month as "March" rather than "3", pages as "50-62", and an edition as "2nd". A year, a day, a volume and an issue can be numbers.

## Citations

A `Citation` cites a source by its tag. It goes in a paragraph, as a run does:

| Property     | Type      | Notes    | Description                                                                  |
| ------------ | --------- | -------- | ---------------------------------------------------------------------------- |
| `source`     | `string`  | Required | The tag of the source cited                                                  |
| `pages`      | `string`  | Optional | The pages cited, such as "50" or "50-62", which most styles write as "p. 50" |
| `volume`     | `string`  | Optional | The volume cited                                                             |
| `prefix`     | `string`  | Optional | Text before the source, such as "see "                                       |
| `suffix`     | `string`  | Optional | Text after the source, such as ", emphasis added"                            |
| `hideAuthor` | `boolean` | Optional | Leaves out the authors, such as when they're named in the text               |
| `hideYear`   | `boolean` | Optional | Leaves out the year                                                          |
| `hideTitle`  | `boolean` | Optional | Leaves out the title, in the styles that write one                           |

A citation can cite several sources together, such as "(Baker, 2010; Lee & Kim, 2018)":

```ts live
import { Document, Paragraph, TextRun } from "docx";
import { Citation, SourceType, createBibliography } from "docx/bibliography";

const doc = new Document({
    bibliography: createBibliography({
        sources: [
            {
                tag: "Bak10",
                type: SourceType.BOOK,
                authors: [{ lastName: "Baker", firstName: "Anna" }],
                title: "The Art of Pizza",
                year: 2010,
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
            },
        ],
    }),
    sections: [
        {
            children: [
                new Paragraph({ children: [new TextRun("A tag: "), new Citation("Bak10")] }),
                new Paragraph({ children: [new TextRun("Pages: "), new Citation({ source: "Bak10", pages: "12-14" })] }),
                new Paragraph({ children: [new TextRun("Before it: "), new Citation({ source: "Bak10", prefix: "see " })] }),
                new Paragraph({ children: [new TextRun("As Baker writes "), new Citation({ source: "Bak10", hideAuthor: true })] }),
                new Paragraph({ children: [new TextRun("Two sources: "), new Citation(["Bak10", { source: "Lee18", pages: "240" }])] }),
            ],
        },
    ],
});
```

When two sources have the same first author, styles such as APA add the title to tell them apart, and when the first authors of two sources have the same last name, they add the initials, as Word does.

## Bibliography

A `Bibliography` lists every source of the document's bibliography, cited or not, sorted as the style sorts them. Give it a `title` for a heading above it, in the Heading 1 style, as Word's built-in **Bibliography**, **References** and **Works Cited** bibliographies have:

| Property | Type     | Notes    | Description                                                     |
| -------- | -------- | -------- | --------------------------------------------------------------- |
| `title`  | `string` | Optional | A heading above the list, such as "References" or "Works Cited" |

Its paragraphs are in the Bibliography style, which has no formatting of its own, as in Word. Give `bibliography` in the default styles to change it:

```ts live
import { Document } from "docx";
import { Bibliography, SourceType, createBibliography } from "docx/bibliography";

const doc = new Document({
    styles: { default: { bibliography: { run: { size: 20, color: "444444" } } } },
    bibliography: createBibliography({
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
        ],
    }),
    sections: [{ children: [new Bibliography({ title: "Works Cited" })] }],
});
```

## Styles

`CitationStyle` has each of Word's styles, by the name Word lists it by, and its edition:

| `CitationStyle`                  | Word's style                     | Edition | A citation      |
| -------------------------------- | -------------------------------- | ------- | --------------- |
| `APA`                            | APA                              | 6th     | (Baker, 2010)   |
| `CHICAGO`                        | Chicago                          | 16th    | (Baker 2010)    |
| `GB7714`                         | GB7714                           | 2005    | (Baker, 2010)   |
| `GOST_NAME_SORT`                 | GOST - Name Sort                 | 2003    | (Baker, 2010)   |
| `GOST_TITLE_SORT`                | GOST - Title Sort                | 2003    | (Baker, 2010)   |
| `HARVARD_ANGLIA`                 | Harvard - Anglia                 | 2008    | (Baker, 2010)   |
| `IEEE`                           | IEEE                             | 2006    | [1]             |
| `ISO_690_FIRST_ELEMENT_AND_DATE` | ISO 690 - First Element and Date | 1987    | (Baker, 2010)   |
| `ISO_690_NUMERICAL_REFERENCE`    | ISO 690 - Numerical Reference    | 1987    | (1)             |
| `MLA`                            | MLA                              | 7th     | (Baker)         |
| `SIST02`                         | SIST02                           | 2003    | （Baker，2010） |
| `TURABIAN`                       | Turabian                         | 6th     | (Baker 2010)    |

IEEE and ISO 690's numerical style number the sources in the order they're first cited, and IEEE writes its bibliography as a table of the numbers and the sources:

```ts live
import { Document, Paragraph, TextRun } from "docx";
import { Bibliography, Citation, CitationStyle, SourceType, createBibliography } from "docx/bibliography";

const doc = new Document({
    bibliography: createBibliography({
        style: CitationStyle.IEEE,
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
        ],
    }),
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun("Wetter dough bakes faster "),
                        new Citation("Lee18"),
                        new TextRun(", as it always has "),
                        new Citation("Bak10"),
                        new TextRun("."),
                    ],
                }),
                new Bibliography({ title: "References" }),
            ],
        },
    ],
});
```

Each style is written from Word's own, with Word's English wording, so a citation or a bibliography is the same before and after Word updates it. The one difference is the order of names with accents: Word for Mac sorts some of them in an order of its own, such as "Müller" before "Mabe", and `docx` sorts a letter with an accent as the letter, so Word for Mac may put such names in another order when it updates the bibliography.

## Demo

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/bibliography/citations-and-bibliography.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/bibliography/citations-and-bibliography.ts_
