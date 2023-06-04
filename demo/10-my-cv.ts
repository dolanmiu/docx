// Generate a CV

import * as fs from "fs";
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, Tab, TabStopPosition, TabStopType, TextRun } from "docx";

// tslint:disable:no-shadowed-variable

const PHONE_NUMBER = "07534563401";
const PROFILE_URL = "https://www.linkedin.com/in/dolan1";
const EMAIL = "docx@com";

interface Experience {
    readonly isCurrent: boolean;
    readonly summary: string;
    readonly title: string;
    readonly startDate: {
        readonly month: number;
        readonly year: number;
    };
    readonly endDate?: {
        readonly month: number;
        readonly year: number;
    };
    readonly company: {
        readonly name: string;
    };
}

interface Education {
    readonly degree: string;
    readonly fieldOfStudy: string;
    readonly notes: string;
    readonly schoolName: string;
    readonly startDate: {
        readonly year: number;
    };
    readonly endDate: {
        readonly year: number;
    };
}

interface Skill {
    readonly name: string;
}

interface Achievement {
    readonly issuer: string;
    readonly name: string;
}

const experiences: Experience[] = [
    {
        isCurrent: true,
        summary: "Full-stack developer working with Angular and Java. Working for the iShares platform",
        title: "Associate Software Developer",
        startDate: {
            month: 11,
            year: 2017,
        },
        company: {
            name: "BlackRock",
        },
    },
    {
        isCurrent: false,
        summary:
            "Full-stack developer working with Angular, Node and TypeScript. Working for the iShares platform. Emphasis on Dev-ops and developing the continuous integration pipeline.",
        title: "Software Developer",
        endDate: {
            month: 11,
            year: 2017,
        },
        startDate: {
            month: 10,
            year: 2016,
        },
        company: {
            name: "Torch Markets",
        },
    },
    {
        isCurrent: false,
        summary:
            "Used ASP.NET MVC 5 to produce a diversity data collection tool for the future of British television.\n\nUsed AngularJS and C# best practices. Technologies used include JavaScript, ASP.NET MVC 5, SQL, Oracle, SASS, Bootstrap, Grunt.",
        title: "Software Developer",
        endDate: {
            month: 10,
            year: 2016,
        },
        startDate: {
            month: 3,
            year: 2015,
        },
        company: {
            name: "Soundmouse",
        },
    },
    {
        isCurrent: false,
        summary:
            // cspell:disable-next-line
            "Develop web commerce platforms for various high profile clients.\n\nCreated a log analysis web application with the Play Framework in Java, incorporating Test Driven Development. It asynchronously uploads and processes large (2 GB) log files, and outputs meaningful results in context with the problem. \n\nAnalysis  and  development  of  the payment system infrastructure and user accounts section to be used by several clients of the company such as Waitrose, Tally Weijl, DJ Sports, Debenhams, Ann Summers, John Lewis and others.\n\nTechnologies used include WebSphere Commerce, Java, JavaScript and JSP.",
        title: "Java Developer",
        endDate: {
            month: 10,
            year: 2014,
        },
        startDate: {
            month: 3,
            year: 2013,
        },
        company: {
            name: "Soundmouse",
        },
    },
];

const education: Education[] = [
    {
        degree: "Master of Science (MSc)",
        fieldOfStudy: "Computer Science",
        notes: "Exam Results: 1st Class with Distinction, Dissertation: 1st Class with Distinction\n\nRelevant Courses: Java and C# Programming, Software Engineering, Artificial Intelligence, \nComputational Photography, Algorithms, Architecture and Hardware.\n\nCreated a Windows 8 game in JavaScript for the dissertation. \n\nCreated an award-winning 3D stereoscopic game in C# using XNA.",
        schoolName: "University College London",
        startDate: {
            year: 2012,
        },
        endDate: {
            year: 2013,
        },
    },
    {
        degree: "Bachelor of Engineering (BEng)",
        fieldOfStudy: "Material Science and Engineering",
        notes: "Exam Results: 2:1, Dissertation: 1st Class with Distinction\n\nRelevant courses: C Programming, Mathematics and Business for Engineers.",
        schoolName: "Imperial College London",
        startDate: {
            year: 2009,
        },
        endDate: {
            year: 2012,
        },
    },
];

const skills: Skill[] = [
    {
        name: "Angular",
    },
    {
        name: "TypeScript",
    },
    {
        name: "JavaScript",
    },
    {
        name: "NodeJS",
    },
];

const achievements: Achievement[] = [
    {
        issuer: "Oracle",
        name: "Oracle Certified Expert",
    },
];

class DocumentCreator {
    // tslint:disable-next-line: typedef
    public create([experiences, educations, skills, achievements]: [Experience[], Education[], Skill[], Achievement[]]): Document {
        const document = new Document({
            sections: [
                {
                    children: [
                        new Paragraph({
                            text: "Dolan Miu",
                            heading: HeadingLevel.TITLE,
                        }),
                        this.createContactInfo(PHONE_NUMBER, PROFILE_URL, EMAIL),
                        this.createHeading("Education"),
                        ...educations
                            .map((education) => {
                                const arr: Paragraph[] = [];
                                arr.push(
                                    this.createInstitutionHeader(
                                        education.schoolName,
                                        `${education.startDate.year} - ${education.endDate.year}`,
                                    ),
                                );
                                arr.push(this.createRoleText(`${education.fieldOfStudy} - ${education.degree}`));

                                const bulletPoints = this.splitParagraphIntoBullets(education.notes);
                                bulletPoints.forEach((bulletPoint) => {
                                    arr.push(this.createBullet(bulletPoint));
                                });

                                return arr;
                            })
                            .reduce((prev, curr) => prev.concat(curr), []),
                        this.createHeading("Experience"),
                        ...experiences
                            .map((position) => {
                                const arr: Paragraph[] = [];

                                arr.push(
                                    this.createInstitutionHeader(
                                        position.company.name,
                                        this.createPositionDateText(position.startDate, position.endDate, position.isCurrent),
                                    ),
                                );
                                arr.push(this.createRoleText(position.title));

                                const bulletPoints = this.splitParagraphIntoBullets(position.summary);

                                bulletPoints.forEach((bulletPoint) => {
                                    arr.push(this.createBullet(bulletPoint));
                                });

                                return arr;
                            })
                            .reduce((prev, curr) => prev.concat(curr), []),
                        this.createHeading("Skills, Achievements and Interests"),
                        this.createSubHeading("Skills"),
                        this.createSkillList(skills),
                        this.createSubHeading("Achievements"),
                        ...this.createAchievementsList(achievements),
                        this.createSubHeading("Interests"),
                        this.createInterests("Programming, Technology, Music Production, Web Design, 3D Modelling, Dancing."),
                        this.createHeading("References"),
                        new Paragraph(
                            "Dr. Dean Mohamedally Director of Postgraduate Studies Department of Computer Science, University College London Malet Place, Bloomsbury, London WC1E d.mohamedally@ucl.ac.uk",
                        ),
                        new Paragraph("More references upon request"),
                        new Paragraph({
                            text: "This CV was generated in real-time based on my Linked-In profile from my personal website www.dolan.bio.",
                            alignment: AlignmentType.CENTER,
                        }),
                    ],
                },
            ],
        });

        return document;
    }

    public createContactInfo(phoneNumber: string, profileUrl: string, email: string): Paragraph {
        return new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun(`Mobile: ${phoneNumber} | LinkedIn: ${profileUrl} | Email: ${email}`),
                new TextRun({
                    text: "Address: 58 Elm Avenue, Kent ME4 6ER, UK",
                    break: 1,
                }),
            ],
        });
    }

    public createHeading(text: string): Paragraph {
        return new Paragraph({
            text: text,
            heading: HeadingLevel.HEADING_1,
            thematicBreak: true,
        });
    }

    public createSubHeading(text: string): Paragraph {
        return new Paragraph({
            text: text,
            heading: HeadingLevel.HEADING_2,
        });
    }

    public createInstitutionHeader(institutionName: string, dateText: string): Paragraph {
        return new Paragraph({
            tabStops: [
                {
                    type: TabStopType.RIGHT,
                    position: TabStopPosition.MAX,
                },
            ],
            children: [
                new TextRun({
                    text: institutionName,
                    bold: true,
                }),
                new TextRun({
                    children: [new Tab(), dateText],
                    bold: true,
                }),
            ],
        });
    }

    public createRoleText(roleText: string): Paragraph {
        return new Paragraph({
            children: [
                new TextRun({
                    text: roleText,
                    italics: true,
                }),
            ],
        });
    }

    public createBullet(text: string): Paragraph {
        return new Paragraph({
            text: text,
            bullet: {
                level: 0,
            },
        });
    }

    // tslint:disable-next-line:no-any
    public createSkillList(skills: any[]): Paragraph {
        return new Paragraph({
            children: [new TextRun(skills.map((skill) => skill.name).join(", ") + ".")],
        });
    }

    // tslint:disable-next-line:no-any
    public createAchievementsList(achievements: any[]): Paragraph[] {
        return achievements.map(
            (achievement) =>
                new Paragraph({
                    text: achievement.name,
                    bullet: {
                        level: 0,
                    },
                }),
        );
    }

    public createInterests(interests: string): Paragraph {
        return new Paragraph({
            children: [new TextRun(interests)],
        });
    }

    public splitParagraphIntoBullets(text: string): string[] {
        return text.split("\n\n");
    }

    // tslint:disable-next-line:no-any
    public createPositionDateText(startDate: any, endDate: any, isCurrent: boolean): string {
        const startDateText = this.getMonthFromInt(startDate.month) + ". " + startDate.year;
        const endDateText = isCurrent ? "Present" : `${this.getMonthFromInt(endDate.month)}. ${endDate.year}`;

        return `${startDateText} - ${endDateText}`;
    }

    public getMonthFromInt(value: number): string {
        switch (value) {
            case 1:
                return "Jan";
            case 2:
                return "Feb";
            case 3:
                return "Mar";
            case 4:
                return "Apr";
            case 5:
                return "May";
            case 6:
                return "Jun";
            case 7:
                return "Jul";
            case 8:
                return "Aug";
            case 9:
                return "Sept";
            case 10:
                return "Oct";
            case 11:
                return "Nov";
            case 12:
                return "Dec";
            default:
                return "N/A";
        }
    }
}

const documentCreator = new DocumentCreator();

const doc = documentCreator.create([experiences, education, skills, achievements]);

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
