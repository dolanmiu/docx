const docx = require("../build");

const PHONE_NUMBER = "07534563401";
const PROFILE_URL = "https://www.linkedin.com/in/dolan1";
const EMAIL = "docx@docx.com";

const experiences = [
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
            "Full-stack developer working with Angular, Node and TypeScript. Working for the iShares platform. Emphasis on Dev-ops and developing the continous integration pipeline.",
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

const education = [
    {
        degree: "Master of Science (MSc)",
        fieldOfStudy: "Computer Science",
        notes:
            "Exam Results: 1st Class with Distinction, Dissertation: 1st Class with Distinction\n\nRelevant Courses: Java and C# Programming, Software Engineering, Artificial Intelligence, \nComputational Photography, Algorithmics, Architecture and Hardware.\n\nCreated a Windows 8 game in JavaScript for the dissertation. \n\nCreated an award-winning 3D stereoscopic game in C# using XNA.",
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
        notes:
            "Exam Results: 2:1, Dissertation: 1st Class with Distinction\n\nRelevant courses: C Programming, Mathematics and Business for Engineers.",
        schoolName: "Imperial College London",
        startDate: {
            year: 2009,
        },
        endDate: {
            year: 2012,
        },
    },
];

const skills = [
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

const achievements = [
    {
        issuer: "Oracle",
        name: "Oracle Certified Expert",
    },
];

class DocumentCreator {
    create(data) {
        const experiences = data[0];
        const educations = data[1];
        const skills = data[2];
        const achivements = data[3];
        const document = new docx.Document();
        document.addParagraph(new docx.Paragraph("Dolan Miu").title());

        document.addParagraph(this.createContactInfo(PHONE_NUMBER, PROFILE_URL, EMAIL));
        document.addParagraph(this.createHeading("Education"));

        for (const education of educations) {
            document.addParagraph(
                this.createInstitutionHeader(education.schoolName, `${education.startDate.year} - ${education.endDate.year}`),
            );
            document.addParagraph(this.createRoleText(`${education.fieldOfStudy} - ${education.degree}`));

            const bulletPoints = this.splitParagraphIntoBullets(education.notes);
            bulletPoints.forEach((bulletPoint) => {
                document.addParagraph(this.createBullet(bulletPoint));
            });
        }

        document.addParagraph(this.createHeading("Experience"));

        for (const position of experiences) {
            document.addParagraph(
                this.createInstitutionHeader(
                    position.company.name,
                    this.createPositionDateText(position.startDate, position.endDate, position.isCurrent),
                ),
            );
            document.addParagraph(this.createRoleText(position.title));

            const bulletPoints = this.splitParagraphIntoBullets(position.summary);

            bulletPoints.forEach((bulletPoint) => {
                document.addParagraph(this.createBullet(bulletPoint));
            });
        }

        document.addParagraph(this.createHeading("Skills, Achievements and Interests"));

        document.addParagraph(this.createSubHeading("Skills"));
        document.addParagraph(this.createSkillList(skills));

        document.addParagraph(this.createSubHeading("Achievements"));

        for (const achievementParagraph of this.createAchivementsList(achivements)) {
            document.addParagraph(achievementParagraph);
        }

        document.addParagraph(this.createSubHeading("Interests"));

        document.addParagraph(this.createInterests("Programming, Technology, Music Production, Web Design, 3D Modelling, Dancing."));

        document.addParagraph(this.createHeading("References"));

        document.addParagraph(
            new docx.Paragraph(
                "Dr. Dean Mohamedally Director of Postgraduate Studies Department of Computer Science, University College London Malet Place, Bloomsbury, London WC1E d.mohamedally@ucl.ac.uk",
            ),
        );
        document.addParagraph(new docx.Paragraph("More references upon request"));
        document.addParagraph(
            new docx.Paragraph(
                "This CV was generated in real-time based on my Linked-In profile from my personal website www.dolan.bio.",
            ).center(),
        );
        return document;
    }

    createContactInfo(phoneNumber, profileUrl, email) {
        const paragraph = new docx.Paragraph().center();
        const contactInfo = new docx.TextRun(`Mobile: ${phoneNumber} | LinkedIn: ${profileUrl} | Email: ${email}`);
        const address = new docx.TextRun("Address: 58 Elm Avenue, Kent ME4 6ER, UK").break();

        paragraph.addRun(contactInfo);
        paragraph.addRun(address);

        return paragraph;
    }

    createHeading(text) {
        return new docx.Paragraph(text).heading1().thematicBreak();
    }

    createSubHeading(text) {
        return new docx.Paragraph(text).heading2();
    }

    createInstitutionHeader(institutionName, dateText) {
        const paragraph = new docx.Paragraph().maxRightTabStop();
        const institution = new docx.TextRun(institutionName).bold();
        const date = new docx.TextRun(dateText).tab().bold();

        paragraph.addRun(institution);
        paragraph.addRun(date);

        return paragraph;
    }

    createRoleText(roleText) {
        const paragraph = new docx.Paragraph();
        const role = new docx.TextRun(roleText).italic();

        paragraph.addRun(role);

        return paragraph;
    }

    createBullet(text) {
        return new docx.Paragraph(text).bullet();
    }

    createSkillList(skills) {
        const paragraph = new docx.Paragraph();
        const skillConcat = skills.map((skill) => skill.name).join(", ") + ".";

        paragraph.addRun(new docx.TextRun(skillConcat));

        return paragraph;
    }

    createAchivementsList(achivements) {
        const arr = [];

        for (const achievement of achivements) {
            arr.push(new docx.Paragraph(achievement.name).bullet());
        }

        return arr;
    }

    createInterests(interests) {
        const paragraph = new docx.Paragraph();

        paragraph.addRun(new docx.TextRun(interests));
        return paragraph;
    }

    splitParagraphIntoBullets(text) {
        return text.split("\n\n");
    }

    createPositionDateText(startDate, endDate, isCurrent) {
        const startDateText = this.getMonthFromInt(startDate.month) + ". " + startDate.year;
        const endDateText = isCurrent ? "Present" : `${this.getMonthFromInt(endDate.month)}. ${endDate.year}`;

        return `${startDateText} - ${endDateText}`;
    }

    getMonthFromInt(value) {
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
        }
    }
}

const documentCreator = new DocumentCreator();

const doc = documentCreator.create([experiences, education, skills, achievements]);

var exporter = new docx.LocalPacker(doc);
exporter.pack("Dolan Miu CV");

console.log('Document created successfully at project root!');
