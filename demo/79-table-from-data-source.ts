// Example of how you would create a table and add data to it from a data source

import * as fs from "fs";
import {
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    VerticalAlignTable,
    TextDirection,
    TextRun,
    WidthType,
} from "docx";

interface StockPrice {
    readonly date: Date;
    readonly ticker: string;
    readonly price: number;
}

const DATA: StockPrice[] = [
    {
        date: new Date("2007-08-28"),
        ticker: "Apple",
        price: 18.12,
    },
    {
        date: new Date("2007-08-29"),
        ticker: "Apple",
        price: 19.15,
    },
    {
        date: new Date("2007-08-30"),
        ticker: "Apple",
        price: 19.46,
    },
    {
        date: new Date("2007-08-31"),
        ticker: "Apple",
        price: 19.78,
    },
    {
        date: new Date("2007-09-04"),
        ticker: "Apple",
        price: 20.59,
    },
    {
        date: new Date("2007-09-05"),
        ticker: "Apple",
        price: 19.54,
    },
    {
        date: new Date("2007-09-06"),
        ticker: "Apple",
        price: 19.29,
    },
    {
        date: new Date("2007-09-07"),
        ticker: "Apple",
        price: 18.82,
    },
    {
        date: new Date("2007-09-10"),
        ticker: "Apple",
        price: 19.53,
    },
    {
        date: new Date("2007-09-11"),
        ticker: "Apple",
        price: 19.36,
    },
    {
        date: new Date("2007-09-12"),
        ticker: "Apple",
        price: 19.55,
    },
    {
        date: new Date("2007-09-13"),
        ticker: "Apple",
        price: 19.6,
    },
    {
        date: new Date("2007-09-14"),
        ticker: "Apple",
        price: 19.83,
    },
    {
        date: new Date("2007-09-17"),
        ticker: "Apple",
        price: 19.77,
    },
];

const generateRows = (prices: StockPrice[]): TableRow[] =>
    prices.map(
        ({ date, ticker, price }) =>
            new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph(date.toString())],
                        verticalAlign: VerticalAlignTable.CENTER,
                        textDirection: TextDirection.LEFT_TO_RIGHT_TOP_TO_BOTTOM,
                    }),
                    new TableCell({
                        children: [new Paragraph(ticker)],
                        verticalAlign: VerticalAlignTable.CENTER,
                        textDirection: TextDirection.LEFT_TO_RIGHT_TOP_TO_BOTTOM,
                    }),
                    new TableCell({
                        children: [new Paragraph(price.toString())],
                        verticalAlign: VerticalAlignTable.CENTER,
                        textDirection: TextDirection.TOP_TO_BOTTOM_RIGHT_TO_LEFT,
                    }),
                ],
            }),
    );

const doc = new Document({
    sections: [
        {
            children: [
                new Table({
                    width: {
                        size: 9070,
                        type: WidthType.DXA,
                    },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            heading: HeadingLevel.HEADING_2,
                                            children: [
                                                new TextRun({
                                                    text: "Date",
                                                    bold: true,
                                                    size: 40,
                                                }),
                                            ],
                                        }),
                                    ],
                                    verticalAlign: VerticalAlignTable.CENTER,
                                    textDirection: TextDirection.LEFT_TO_RIGHT_TOP_TO_BOTTOM,
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            heading: HeadingLevel.HEADING_2,
                                            children: [
                                                new TextRun({
                                                    text: "Ticker",
                                                    bold: true,
                                                    size: 40,
                                                }),
                                            ],
                                        }),
                                    ],
                                    verticalAlign: VerticalAlignTable.CENTER,
                                    textDirection: TextDirection.LEFT_TO_RIGHT_TOP_TO_BOTTOM,
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            heading: HeadingLevel.HEADING_2,
                                            children: [
                                                new TextRun({
                                                    text: "Price",
                                                    bold: true,
                                                    size: 40,
                                                }),
                                            ],
                                        }),
                                    ],
                                    verticalAlign: VerticalAlignTable.CENTER,
                                    textDirection: TextDirection.TOP_TO_BOTTOM_RIGHT_TO_LEFT,
                                }),
                            ],
                        }),
                        ...generateRows(DATA),
                    ],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
