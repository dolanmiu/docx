var docxBibliography = (function(exports, docx) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	//#region \0@oxc-project+runtime@0.152.0/helpers/esm/typeof.js
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.152.0/helpers/esm/toPrimitive.js
	function toPrimitive(t, r) {
		if ("object" != _typeof(t) || !t) return t;
		var e = t[Symbol.toPrimitive];
		if (void 0 !== e) {
			var i = e.call(t, r || "default");
			if ("object" != _typeof(i)) return i;
			throw new TypeError("@@toPrimitive must return a primitive value.");
		}
		return ("string" === r ? String : Number)(t);
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.152.0/helpers/esm/toPropertyKey.js
	function toPropertyKey(t) {
		var i = toPrimitive(t, "string");
		return "symbol" == _typeof(i) ? i : i + "";
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.152.0/helpers/esm/defineProperty.js
	function _defineProperty(e, r, t) {
		return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
			value: t,
			enumerable: !0,
			configurable: !0,
			writable: !0
		}) : e[r] = t, e;
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.152.0/helpers/esm/objectSpread2.js
	function ownKeys(e, r) {
		var t = Object.keys(e);
		if (Object.getOwnPropertySymbols) {
			var o = Object.getOwnPropertySymbols(e);
			r && (o = o.filter(function(r) {
				return Object.getOwnPropertyDescriptor(e, r).enumerable;
			})), t.push.apply(t, o);
		}
		return t;
	}
	function _objectSpread2(e) {
		for (var r = 1; r < arguments.length; r++) {
			var t = null != arguments[r] ? arguments[r] : {};
			r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
				_defineProperty(e, r, t[r]);
			}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
				Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
			});
		}
		return e;
	}
	//#endregion
	//#region src/bibliography/styles/formatted-text.ts
	/** Text with formatting, from plain text or text with formatting */
	var formatted = (text) => typeof text === "string" ? text ? [{ text }] : [] : text;
	/** The parts, one after another */
	var join = (...parts) => parts.flatMap(formatted);
	/** The text, in italics, as HTML's `<i>` */
	var italic = (...parts) => join(...parts).map((run) => _objectSpread2(_objectSpread2({}, run), {}, { italics: true }));
	/** The text, in bold, as HTML's `<b>` */
	var bold = (...parts) => join(...parts).map((run) => _objectSpread2(_objectSpread2({}, run), {}, { bold: true }));
	/** The text, underlined, as HTML's `<u>` */
	var underline = (...parts) => join(...parts).map((run) => _objectSpread2(_objectSpread2({}, run), {}, { underline: true }));
	/** A line break, as HTML's `<br>` */
	var LINE_BREAK = [{
		text: "",
		lineBreak: true
	}];
	/** The text without its formatting, as an XSL style reads the string value of what it has written */
	var textOf = (text) => typeof text === "string" ? text : text.map((run) => run.text).join("");
	var sameFormat = (a, b) => !a.lineBreak && !b.lineBreak && !!a.bold === !!b.bold && !!a.italics === !!b.italics && !!a.underline === !!b.underline;
	/**
	* The runs as Word reads a style's HTML into a paragraph: each run of spaces, tabs and line feeds becomes one space, and
	* there is none at the start of the paragraph or after a line break, as in HTML. Runs with the same formatting are
	* joined, and empty ones dropped.
	*/
	var readAsWord = (text) => {
		const runs = [];
		let atSpace = true;
		for (const run of formatted(text)) {
			if (run.lineBreak) {
				runs.push(run);
				atSpace = true;
				continue;
			}
			let collapsed = run.text.replace(/[ \t\r\n]+/g, " ");
			if (atSpace && collapsed.startsWith(" ")) collapsed = collapsed.slice(1);
			if (!collapsed) continue;
			atSpace = collapsed.endsWith(" ");
			const last = runs[runs.length - 1];
			if (last && sameFormat(last, run)) runs[runs.length - 1] = _objectSpread2(_objectSpread2({}, last), {}, { text: last.text + collapsed });
			else runs.push(_objectSpread2(_objectSpread2({}, run), {}, { text: collapsed }));
		}
		return runs;
	};
	/** The runs, with runs next to each other that have the same formatting joined, as Word joins a citation's sources */
	var mergeRuns = (text) => formatted(text).reduce((runs, run) => {
		const last = runs[runs.length - 1];
		return last && sameFormat(last, run) ? [...runs.slice(0, -1), _objectSpread2(_objectSpread2({}, last), {}, { text: last.text + run.text })] : [...runs, run];
	}, []);
	//#endregion
	//#region src/bibliography/word-source.ts
	/**
	* Sources as Word keeps them: each field and role of people by its name in the bibliography's XML, which is what Word's
	* styles of citation read. The styles of `docx/bibliography` are written from Word's, so they read sources this way too.
	*
	* Reference: ooxml-schemas/ISO-IEC29500-4_2016/shared-bibliography.xsd
	*
	* @module
	*/
	/** The roles of the people who made a source, in the order the schema lists them */
	var ROLES = [
		"Artist",
		"Author",
		"BookAuthor",
		"Compiler",
		"Composer",
		"Conductor",
		"Counsel",
		"Director",
		"Editor",
		"Interviewee",
		"Interviewer",
		"Inventor",
		"Performer",
		"ProducerName",
		"Translator",
		"Writer"
	];
	/** Each field, by its name in the bibliography's XML, and the option of a {@link Source} it is from */
	var FIELDS = {
		Title: "title",
		ShortTitle: "shortTitle",
		BookTitle: "bookTitle",
		JournalName: "journalName",
		PeriodicalTitle: "periodicalTitle",
		ConferenceName: "conferenceName",
		InternetSiteTitle: "websiteName",
		PublicationTitle: "publicationTitle",
		AlbumTitle: "albumTitle",
		BroadcastTitle: "broadcastTitle",
		Year: "year",
		Month: "month",
		Day: "day",
		YearAccessed: "yearAccessed",
		MonthAccessed: "monthAccessed",
		DayAccessed: "dayAccessed",
		City: "city",
		StateProvince: "stateOrProvince",
		CountryRegion: "countryOrRegion",
		Publisher: "publisher",
		ProductionCompany: "productionCompany",
		Distributor: "distributor",
		Institution: "institution",
		Department: "department",
		ThesisType: "reportType",
		Edition: "edition",
		Volume: "volume",
		NumberVolumes: "numberOfVolumes",
		Issue: "issue",
		Pages: "pages",
		Medium: "medium",
		Version: "version",
		StandardNumber: "standardNumber",
		URL: "url",
		RecordingNumber: "recordingNumber",
		Theater: "theater",
		Broadcaster: "broadcaster",
		Station: "station",
		Type: "patentType",
		PatentNumber: "patentNumber",
		CaseNumber: "caseNumber",
		AbbreviatedCaseNumber: "abbreviatedCaseNumber",
		Court: "court",
		Reporter: "reporter",
		Comments: "comments"
	};
	/** The people with each role, and the option of a {@link Source} they are from */
	var PEOPLE = {
		Artist: "artists",
		Author: "authors",
		BookAuthor: "bookAuthors",
		Compiler: "compilers",
		Composer: "composers",
		Conductor: "conductors",
		Counsel: "counsel",
		Director: "directors",
		Editor: "editors",
		Interviewee: "interviewees",
		Interviewer: "interviewers",
		Inventor: "inventors",
		Performer: "performers",
		ProducerName: "producers",
		Translator: "translators",
		Writer: "writers"
	};
	/** The roles an organization can have in place of people, and the option of a {@link Source} it is from */
	var ORGANIZATIONS = {
		Author: "corporateAuthor",
		Performer: "corporatePerformer"
	};
	/** Each type of source, and its name in the bibliography's XML */
	var SOURCE_TYPES = {
		book: "Book",
		bookSection: "BookSection",
		journalArticle: "JournalArticle",
		articleInAPeriodical: "ArticleInAPeriodical",
		conferenceProceedings: "ConferenceProceedings",
		report: "Report",
		website: "InternetSite",
		documentFromWebsite: "DocumentFromInternetSite",
		electronicSource: "ElectronicSource",
		art: "Art",
		soundRecording: "SoundRecording",
		performance: "Performance",
		film: "Film",
		interview: "Interview",
		patent: "Patent",
		case: "Case",
		miscellaneous: "Misc"
	};
	var personOf = ({ lastName, firstName = "", middleName = "" }) => ({
		last: lastName,
		first: firstName,
		middle: middleName
	});
	/**
	* A source as Word keeps it, numbered as cited in the order given.
	*
	* @throws If it has no tag, a type that isn't one of {@link SourceType}'s, or both people and an organization with the
	* same role
	*/
	var wordSourceOf = (source, order) => {
		if (!source.tag) throw new Error("A bibliography's source has no tag. Give each source the tag its citations refer to it by, such as \"Dic06\"");
		if (!Object.keys(SOURCE_TYPES).includes(source.type)) throw new Error(`The source "${source.tag}" has the type "${source.type}", which isn't a type of source. Give one of SourceType's, such as SourceType.BOOK`);
		const names = {};
		for (const role of ROLES) {
			const people = source[PEOPLE[role]];
			const organization = role in ORGANIZATIONS ? source[ORGANIZATIONS[role]] : void 0;
			if (organization && (people === null || people === void 0 ? void 0 : people.length)) throw new Error(`The source "${source.tag}" has both ${PEOPLE[role]} and ${ORGANIZATIONS[role]}. Give one or the other`);
			if (organization) names[role] = { corporate: organization };
			else if (people === null || people === void 0 ? void 0 : people.length) names[role] = { people: people.map(personOf) };
		}
		const fields = {};
		for (const [field, option] of Object.entries(FIELDS)) {
			const value = source[option];
			if (value !== void 0 && value !== "") fields[field] = String(value);
		}
		return {
			tag: source.tag,
			type: SOURCE_TYPES[source.type],
			names,
			fields,
			order
		};
	};
	/** A field of a source, or "" when it doesn't have it, as Word's styles read a field */
	var fieldOf = (source, field) => {
		var _source$fields$field;
		return (_source$fields$field = source.fields[field]) !== null && _source$fields$field !== void 0 ? _source$fields$field : "";
	};
	/** The people with a role, or none when it has an organization or nobody in it */
	var peopleOf = (source, role) => {
		const names = source.names[role];
		return names && "people" in names ? names.people : [];
	};
	/** The organization with a role, or "" when it has people or nobody in it */
	var organizationOf = (source, role) => {
		const names = source.names[role];
		return names && "corporate" in names ? names.corporate : "";
	};
	var text = (name, value) => new docx.StringContainer(`b:${name}`, value);
	var personXml = ({ last, first, middle }) => new docx.BuilderElement({
		name: "b:Person",
		children: [
			...last ? [text("Last", last)] : [],
			...first ? [text("First", first)] : [],
			...middle ? [text("Middle", middle)] : []
		]
	});
	/**
	* A source's XML, as Word writes it: its tag, type, people and fields, and the order it is cited in.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_SourceType">
	*   <xsd:sequence>
	*     <xsd:choice minOccurs="0" maxOccurs="unbounded">
	*       <xsd:element name="AbbreviatedCaseNumber" type="s:ST_String"/>
	*       <xsd:element name="Author" type="CT_AuthorType"/>
	*       ...
	*       <xsd:element name="Year" type="s:ST_String"/>
	*     </xsd:choice>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createSourceXml = (source) => {
		const roles = ROLES.filter((role) => source.names[role] !== void 0);
		return new docx.BuilderElement({
			name: "b:Source",
			children: [
				text("Tag", source.tag),
				text("SourceType", source.type),
				...roles.length > 0 ? [new docx.BuilderElement({
					name: "b:Author",
					children: roles.map((role) => {
						const names = source.names[role];
						return new docx.BuilderElement({
							name: `b:${role}`,
							children: ["corporate" in names ? text("Corporate", names.corporate) : new docx.BuilderElement({
								name: "b:NameList",
								children: names.people.map(personXml)
							})]
						});
					})
				})] : [],
				...Object.keys(FIELDS).filter((field) => source.fields[field] !== void 0).map((field) => text(field, source.fields[field])),
				text("RefOrder", String(source.order))
			]
		});
	};
	//#endregion
	//#region src/bibliography/format.ts
	/**
	* Writes citations and bibliographies with a style of citation, as Word does when it updates a document's fields: it
	* works out what each source cited needs to be told apart from the others, and gives the style each source of a
	* citation in turn.
	*
	* @module
	*/
	var MAIN_ROLES$4 = {
		Book: ["Author", "Editor"],
		BookSection: ["Author"],
		JournalArticle: ["Author", "Editor"],
		ArticleInAPeriodical: ["Author", "Editor"],
		ConferenceProceedings: ["Author", "Editor"],
		Report: ["Author"],
		SoundRecording: [
			"Composer",
			"Performer",
			"Conductor"
		],
		Performance: [
			"Writer",
			"Director",
			"Performer"
		],
		Art: ["Artist"],
		DocumentFromInternetSite: ["Author", "Editor"],
		InternetSite: ["Author", "Editor"],
		Film: [
			"ProducerName",
			"Writer",
			"Director"
		],
		Interview: [
			"Interviewee",
			"Editor",
			"Translator"
		],
		Patent: ["Inventor"],
		ElectronicSource: ["Author", "Editor"],
		Case: [],
		Misc: ["Author", "Editor"]
	};
	/** The people a source is named by, or none when it is named by an organization or has no one in those roles */
	var mainPeopleOf = (source) => {
		for (const role of MAIN_ROLES$4[source.type]) {
			const names = source.names[role];
			if (names) return "people" in names ? names.people : [];
		}
		return [];
	};
	var isSamePerson = (a, b) => a.last === b.last && a.first === b.first && a.middle === b.middle;
	/** How many of their first people two lists of people have in common */
	var commonPeople = (a, b) => {
		let count = 0;
		while (count < a.length && count < b.length && isSamePerson(a[count], b[count])) count++;
		return count;
	};
	/**
	* What Word works out from a document's sources to tell a source apart in its citations: whether another source has
	* the same first author, or the same first three when it has more than three, whether another source's first author
	* has the same last name but is someone else, and how many of its authors tell it apart. Sources named by an
	* organization, or by nobody, aren't compared.
	*/
	var flagsOf = (source, sources) => {
		const people = mainPeopleOf(source);
		if (people.length === 0) return {
			repeatedAuthor: false,
			nonUniqueLastName: false,
			minAuthors: 1
		};
		const others = sources.filter((other) => other !== source).map(mainPeopleOf).filter((other) => other.length > 0);
		const compared = people.length > 3 ? 3 : 1;
		const repeatedAuthor = others.some((other) => other.length >= compared && commonPeople(people, other) >= compared);
		return {
			repeatedAuthor,
			nonUniqueLastName: others.some((other) => other[0].last === people[0].last && !isSamePerson(other[0], people[0])),
			minAuthors: repeatedAuthor ? 2 : Math.max(1, ...others.map((other) => commonPeople(people, other) + 1))
		};
	};
	/**
	* Where each source is in the order the document cites them in, from 1, as Word numbers them (`b:RefOrder`): the
	* sources cited, in the order they're first cited, then the others in the order they're listed in.
	*
	* @param tags - The tags of the sources the document cites, in the order it cites them
	*/
	var citationOrderOf = (sourceTags, citedTags) => {
		const order = /* @__PURE__ */ new Map();
		for (const tag of [...citedTags, ...sourceTags]) if (!order.has(tag) && sourceTags.includes(tag)) order.set(tag, order.size + 1);
		return order;
	};
	/**
	* A citation of one or more sources, as the style writes it: each source in turn, each read as Word reads a style's
	* HTML.
	*
	* @throws If a source cited isn't one of the sources
	*/
	var formatCitation$2 = (style, sources, cited) => mergeRuns(join(...cited.map((options, index) => {
		var _options$pages, _options$volume;
		const source = sources.find((candidate) => candidate.tag === options.source);
		if (!source) throw new Error(`A citation cites the source "${options.source}", which isn't one of the bibliography's sources. Its sources' tags are ${sources.map(({ tag }) => `"${tag}"`).join(", ")}`);
		return readAsWord(style.citation(_objectSpread2(_objectSpread2({
			source,
			first: index === 0,
			last: index === cited.length - 1
		}, flagsOf(source, sources)), {}, {
			hideAuthor: !!options.hideAuthor,
			hideYear: !!options.hideYear,
			hideTitle: !!options.hideTitle,
			pages: (_options$pages = options.pages) !== null && _options$pages !== void 0 ? _options$pages : "",
			volume: (_options$volume = options.volume) !== null && _options$volume !== void 0 ? _options$volume : "",
			prefix: options.prefix,
			suffix: options.suffix
		})));
	})));
	/** A bibliography of the sources, as the style writes it, with each paragraph and cell read as Word reads a style's HTML */
	var formatBibliography$1 = (style, sources) => {
		const bibliography = style.bibliography(sources);
		return "rows" in bibliography ? { rows: bibliography.rows.map(([label, entry]) => [readAsWord(label), readAsWord(entry)]) } : {
			paragraphs: bibliography.paragraphs.map(readAsWord),
			hangingIndent: bibliography.hangingIndent
		};
	};
	//#endregion
	//#region src/bibliography/document-sources.ts
	/**
	* A document's sources: the part Word keeps them in, and the sources as its citations and bibliographies write them,
	* numbered in the order the document cites them.
	*
	* @module
	*/
	var BIBLIOGRAPHY_NAMESPACE = "http://schemas.openxmlformats.org/officeDocument/2006/bibliography";
	/** The sources each citation cites, by the citation, which a document's citations are found by */
	var citedSourcesOf = /* @__PURE__ */ new WeakMap();
	/**
	* The tags of the sources the document's citations cite, in the order they are in its parts: its body, footnotes,
	* endnotes, headers and footers.
	*
	* A component can keep its children in any of its properties, such as a hyperlink's options or a footnote's first
	* paragraph, until it is written, so each property of each component is looked in, in order, and each object once.
	*/
	var citedTagsOf = (file) => {
		const visited = /* @__PURE__ */ new WeakSet();
		const visit = (value) => {
			if (typeof value !== "object" || value === null || visited.has(value) || ArrayBuffer.isView(value)) return [];
			visited.add(value);
			const cited = citedSourcesOf.get(value);
			if (cited) return cited.map(({ source }) => source);
			return (Array.isArray(value) ? value : Object.values(value)).flatMap(visit);
		};
		return [
			file.Document.View,
			file.FootNotes.View,
			file.Endnotes.View,
			...file.Headers.map((header) => header.View),
			...file.Footers.map((footer) => footer.View)
		].flatMap(visit);
	};
	/**
	* A document's sources and the style they're written in, for the document's `bibliography`: the part Word keeps them
	* in (customXml/item1.xml), which `createBibliography` makes.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_Sources">
	*   <xsd:sequence>
	*     <xsd:element name="Source" type="CT_SourceType" minOccurs="0" maxOccurs="unbounded"/>
	*   </xsd:sequence>
	*   <xsd:attribute name="SelectedStyle" type="s:ST_String"/>
	*   <xsd:attribute name="StyleName" type="s:ST_String"/>
	*   <xsd:attribute name="URI" type="s:ST_String"/>
	* </xsd:complexType>
	* ```
	*/
	var BibliographySources = class extends docx.XmlComponent {
		/**
		* @throws If a source has no tag, or the same tag as another, a type that isn't one of SourceType's, or both people and
		* an organization in one role
		*/
		constructor(style, sources) {
			super("b:Sources");
			_defineProperty(this, "style", void 0);
			_defineProperty(this, "sources", void 0);
			_defineProperty(this, "documents", /* @__PURE__ */ new WeakMap());
			this.style = style;
			this.sources = sources;
			for (const source of sources) wordSourceOf(source, 0);
			const repeated = sources.find((source, index) => sources.findIndex(({ tag }) => tag === source.tag) !== index);
			if (repeated) throw new Error(`Two of the bibliography's sources have the tag "${repeated.tag}". Give each source a tag of its own`);
		}
		/** The document's sources, numbered in the order it cites them */
		sourcesOf(file) {
			const known = this.documents.get(file);
			if (known) return known;
			const order = citationOrderOf(this.sources.map(({ tag }) => tag), citedTagsOf(file));
			const sources = {
				style: this.style,
				sources: this.sources.map((source) => wordSourceOf(source, order.get(source.tag)))
			};
			this.documents.set(file, sources);
			return sources;
		}
		/**
		* Written with the file of Word's style after a slash, as Word for Mac writes it, its name and version, and each
		* source, with the order the document cites it in. Word for Windows writes a backslash, which Word for Mac doesn't
		* find the style by, so a document with one opens in APA in Word for Mac.
		*/
		prepForXml(context) {
			return new docx.BuilderElement({
				name: "b:Sources",
				attributes: {
					selectedStyle: {
						key: "SelectedStyle",
						value: `/${this.style.file}`
					},
					styleName: {
						key: "StyleName",
						value: this.style.name
					},
					version: {
						key: "Version",
						value: this.style.version
					},
					prefix: {
						key: "xmlns:b",
						value: BIBLIOGRAPHY_NAMESPACE
					},
					namespace: {
						key: "xmlns",
						value: BIBLIOGRAPHY_NAMESPACE
					}
				},
				children: this.sourcesOf(context.file).sources.map(createSourceXml)
			}).prepForXml(context);
		}
	};
	/**
	* The sources of the document being written, which its citations and bibliographies write.
	*
	* @throws If the document has no bibliography, or one that `createBibliography` didn't make
	*/
	var documentSourcesOf = (context) => {
		var _context$file$Bibliog;
		const sources = (_context$file$Bibliog = context.file.Bibliography) === null || _context$file$Bibliog === void 0 ? void 0 : _context$file$Bibliog.sources;
		if (!(sources instanceof BibliographySources)) throw new Error("A citation or a bibliography needs the document's sources. Give the Document `bibliography: createBibliography({ sources })` from docx/bibliography");
		return sources.sourcesOf(context.file);
	};
	//#endregion
	//#region src/bibliography/field.ts
	/**
	* The fields of citations and bibliographies, written with the result `docx` works out for them, as Word writes them.
	*
	* @module
	*/
	/** Formatted text as runs, each kept out of spelling and grammar checks, as Word writes a citation's or a bibliography's */
	var runsOf = (text) => text.map((run) => new docx.TextRun(_objectSpread2(_objectSpread2({}, run.lineBreak ? { break: 1 } : { text: run.text }), {}, {
		bold: run.bold,
		italics: run.italics,
		underline: run.underline ? {} : void 0,
		noProof: true
	})));
	/** A field's instruction, with its spaces kept */
	var FieldInstruction = class extends docx.XmlComponent {
		constructor(instruction) {
			super("w:instrText");
			this.root.push(new docx.NextAttributeComponent({ space: {
				key: "xml:space",
				value: "preserve"
			} }));
			this.root.push(instruction);
		}
	};
	var fieldChar = (type) => new docx.BuilderElement({
		name: "w:r",
		children: [new docx.BuilderElement({
			name: "w:fldChar",
			attributes: { type: {
				key: "w:fldCharType",
				value: type
			} }
		})]
	});
	/**
	* A field whose result has been worked out, as runs: its start, its instruction, the result, and its end.
	*
	* @param result - The result's runs, between the field's separator and its end
	*/
	var createFieldRuns = (instruction, result) => [
		fieldChar("begin"),
		new docx.BuilderElement({
			name: "w:r",
			children: [new FieldInstruction(instruction)]
		}),
		fieldChar("separate"),
		...result,
		fieldChar("end")
	];
	//#endregion
	//#region src/bibliography/bibliography.ts
	/**
	* Bibliographies: the list of a document's sources, in the style of its citations, as Word's References > Bibliography
	* inserts it.
	*
	* @module
	*/
	/** What Word writes, in bold, in a bibliography of a document with no sources */
	var NO_SOURCES = "Invalid source specified.";
	/** A paragraph with the runs given */
	var paragraphOf$2 = (children, options = {}) => {
		const paragraph = new docx.Paragraph(options);
		for (const child of children) paragraph.addChildElement(child);
		return paragraph;
	};
	/**
	* An entry's paragraph, in the Bibliography style, with the lines after its first indented half an inch if the style's
	* are. Its mark is kept out of spelling and grammar checks, as its runs are
	*/
	var entryOf$2 = (children, hangingIndent = false) => paragraphOf$2(children, _objectSpread2(_objectSpread2({ style: "Bibliography" }, hangingIndent ? { indent: {
		left: 720,
		hanging: 720
	} } : {}), {}, { run: { noProof: true } }));
	var tableCellSpacing = () => new docx.BuilderElement({
		name: "w:tblCellSpacing",
		attributes: {
			width: {
				key: "w:w",
				value: 15
			},
			type: {
				key: "w:type",
				value: "dxa"
			}
		}
	});
	var cellOf = (width, text) => new docx.BuilderElement({
		name: "w:tc",
		children: [new docx.BuilderElement({
			name: "w:tcPr",
			children: [new docx.BuilderElement({
				name: "w:tcW",
				attributes: {
					width: {
						key: "w:w",
						value: width.width
					},
					type: {
						key: "w:type",
						value: width.type
					}
				}
			}), new docx.BuilderElement({ name: "w:hideMark" })]
		}), entryOf$2(runsOf(text))]
	});
	/**
	* A bibliography of numbered sources, as Word writes IEEE's: a table as wide as the text, of each source's number and
	* its entry, the number's column as narrow as its numbers.
	*/
	var tableOf = (rows) => {
		const margin = (side) => new docx.BuilderElement({
			name: `w:${side}`,
			attributes: {
				width: {
					key: "w:w",
					value: 15
				},
				type: {
					key: "w:type",
					value: "dxa"
				}
			}
		});
		return new docx.BuilderElement({
			name: "w:tbl",
			children: [
				new docx.BuilderElement({
					name: "w:tblPr",
					children: [
						new docx.BuilderElement({
							name: "w:tblW",
							attributes: {
								width: {
									key: "w:w",
									value: 5e3
								},
								type: {
									key: "w:type",
									value: "pct"
								}
							}
						}),
						tableCellSpacing(),
						new docx.BuilderElement({
							name: "w:tblCellMar",
							children: [
								"top",
								"left",
								"bottom",
								"right"
							].map(margin)
						}),
						new docx.BuilderElement({
							name: "w:tblLook",
							attributes: {
								value: {
									key: "w:val",
									value: "04A0"
								},
								firstRow: {
									key: "w:firstRow",
									value: 1
								},
								lastRow: {
									key: "w:lastRow",
									value: 0
								},
								firstColumn: {
									key: "w:firstColumn",
									value: 1
								},
								lastColumn: {
									key: "w:lastColumn",
									value: 0
								},
								noHBand: {
									key: "w:noHBand",
									value: 0
								},
								noVBand: {
									key: "w:noVBand",
									value: 1
								}
							}
						})
					]
				}),
				new docx.BuilderElement({
					name: "w:tblGrid",
					children: [409, 8617].map((width) => new docx.BuilderElement({
						name: "w:gridCol",
						attributes: { width: {
							key: "w:w",
							value: width
						} }
					}))
				}),
				...rows.map(([label, entry]) => new docx.BuilderElement({
					name: "w:tr",
					children: [
						new docx.BuilderElement({
							name: "w:trPr",
							children: [tableCellSpacing()]
						}),
						cellOf({
							width: 50,
							type: "pct"
						}, label),
						cellOf({
							width: 0,
							type: "auto"
						}, entry)
					]
				}))
			]
		});
	};
	/**
	* The bibliography's content control and its BIBLIOGRAPHY field, whose result is the document's sources in the style of
	* its citations. The field starts in the first paragraph and ends in a paragraph of its own after the last, as Word
	* writes it.
	*/
	var createBibliographyControl = (context) => {
		const { style, sources } = documentSourcesOf(context);
		const bibliography = formatBibliography$1(style, sources);
		const [begin, instruction, separate, end] = createFieldRuns(" BIBLIOGRAPHY ", []);
		const fieldStart = [
			begin,
			instruction,
			separate
		];
		const content = sources.length === 0 ? [paragraphOf$2([
			...fieldStart,
			...runsOf([{
				text: NO_SOURCES,
				bold: true
			}]),
			end
		])] : "rows" in bibliography ? [
			paragraphOf$2(fieldStart, { run: { noProof: true } }),
			tableOf(bibliography.rows),
			paragraphOf$2([], { run: { noProof: true } }),
			paragraphOf$2([end])
		] : [...bibliography.paragraphs.map((entry, index) => entryOf$2([...index === 0 ? fieldStart : [], ...runsOf(entry)], bibliography.hangingIndent)), paragraphOf$2([end])];
		return new docx.BuilderElement({
			name: "w:sdt",
			children: [new docx.BuilderElement({
				name: "w:sdtPr",
				children: [new docx.BuilderElement({ name: "w:bibliography" })]
			}), new docx.BuilderElement({
				name: "w:sdtContent",
				children: content
			})]
		});
	};
	/**
	* A bibliography: the list of the document's sources, in the style of its citations, as Word's References >
	* Bibliography inserts it. It lists every source of the document's bibliography, cited or not, and Word writes it again
	* when it updates the document's fields, or when the style is changed.
	*
	* The document needs its sources: give it `bibliography: createBibliography({ sources })`.
	*
	* @publicApi
	*
	* @example
	* ```typescript
	* // As Word's built-in "References" bibliography: a heading, then the list
	* new Bibliography({ title: "References" });
	* ```
	*/
	var Bibliography = class extends docx.FileChild {
		constructor(options = {}) {
			super("w:sdt");
			_defineProperty(this, "options", void 0);
			this.options = options;
		}
		/**
		* With a title, written as Word's built-in bibliographies are, in a content control of Word's Bibliographies gallery,
		* with the title as a Heading 1 before the bibliography's own content control. Without one, it is that content
		* control alone
		*/
		prepForXml(context) {
			const list = createBibliographyControl(context);
			if (this.options.title === void 0) return list.prepForXml(context);
			return new docx.BuilderElement({
				name: "w:sdt",
				children: [new docx.BuilderElement({
					name: "w:sdtPr",
					children: [new docx.BuilderElement({
						name: "w:docPartObj",
						children: [new docx.BuilderElement({
							name: "w:docPartGallery",
							attributes: { value: {
								key: "w:val",
								value: "Bibliographies"
							} }
						}), new docx.BuilderElement({ name: "w:docPartUnique" })]
					})]
				}), new docx.BuilderElement({
					name: "w:sdtContent",
					children: [new docx.Paragraph({
						style: "Heading1",
						children: [new docx.TextRun(this.options.title)]
					}), list]
				})]
			}).prepForXml(context);
		}
	};
	//#endregion
	//#region src/bibliography/citation.ts
	/**
	* Citations: references in the text to one or more of a document's sources, such as "(Baker, 2010)", as Word's
	* References > Insert Citation inserts them.
	*
	* @module
	*/
	/** A field's value in its instruction: in quotes, with the quotes and backslashes in it escaped, as Word writes one */
	var quoted$1 = (value) => `"${value.replace(/[\\"]/g, "\\$&")}"`;
	/** A source's tag in a field's instruction: as it is, unless it has a space or a quote in it */
	var tagOf = (tag) => /[\s"\\]/.test(tag) ? quoted$1(tag) : tag;
	/** The switches of a source of a citation, after its tag */
	var switchesOf = ({ pages, volume, prefix, suffix, hideAuthor, hideYear, hideTitle }) => [
		...prefix !== void 0 ? [`\\f ${quoted$1(prefix)}`] : [],
		...suffix !== void 0 ? [`\\s ${quoted$1(suffix)}`] : [],
		...pages !== void 0 ? [`\\p ${quoted$1(pages)}`] : [],
		...volume !== void 0 ? [`\\v ${quoted$1(volume)}`] : [],
		...hideAuthor ? ["\\n"] : [],
		...hideYear ? ["\\y"] : [],
		...hideTitle ? ["\\t"] : []
	];
	/**
	* A citation's field instruction, such as ` CITATION Dic06 \p "50" \l 1033 `: the first source's tag and switches, the
	* language, English, and each other source after `\m`.
	*/
	var citationInstructionOf = (cited) => ` CITATION ${cited.map((source, index) => [
		index === 0 ? tagOf(source.source) : `\\m ${tagOf(source.source)}`,
		...switchesOf(source),
		...index === 0 ? ["\\l 1033"] : []
	].join(" ")).join("  ")} `;
	/**
	* The citation as Word writes it: a citation content control, with a CITATION field, whose result is the citation in
	* the style of the document's bibliography.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_SdtRun">
	*   <xsd:sequence>
	*     <xsd:element name="sdtPr" type="CT_SdtPr" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="sdtEndPr" type="CT_SdtEndPr" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="sdtContent" type="CT_SdtContentRun" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var CitationContentControl = class extends docx.XmlComponent {
		constructor(cited) {
			super("w:sdt");
			_defineProperty(this, "cited", void 0);
			this.cited = cited;
		}
		prepForXml(context) {
			const { style, sources } = documentSourcesOf(context);
			return new docx.BuilderElement({
				name: "w:sdt",
				children: [new docx.BuilderElement({
					name: "w:sdtPr",
					children: [new docx.BuilderElement({ name: "w:citation" })]
				}), new docx.BuilderElement({
					name: "w:sdtContent",
					children: createFieldRuns(citationInstructionOf(this.cited), runsOf(formatCitation$2(style, sources, this.cited)))
				})]
			}).prepForXml(context);
		}
	};
	/**
	* A citation of one or more of the document's sources, by their tags, such as "(Baker, 2010)" in APA, as Word's
	* References > Insert Citation inserts it. It is written in the style of the document's bibliography, and Word writes
	* it again when it updates the document's fields, or when the style is changed.
	*
	* The document needs its sources: give it `bibliography: createBibliography({ sources })`.
	*
	* @publicApi
	*
	* @example
	* ```typescript
	* new Paragraph({ children: [new TextRun("Pizza is older than you think "), new Citation("Bak10")] });
	*
	* // Pages, and text before the citation
	* new Citation({ source: "Bak10", pages: "50", prefix: "see " });
	*
	* // Two sources, as one citation: "(Baker, 2010; Evans, 2019, p. 20)"
	* new Citation(["Bak10", { source: "Eva19", pages: "20" }]);
	* ```
	*/
	var Citation = class extends docx.Run {
		/**
		* @param cited - The source cited, by its tag, or with how it is cited, or several sources, cited together
		* @throws If no source is cited
		*/
		constructor(cited) {
			super({});
			_defineProperty(this, "cited", void 0);
			const list = Array.isArray(cited) ? cited : [cited];
			if (list.length === 0) throw new Error("A citation cites no source. Give it the tag of the source it cites, such as \"Dic06\"");
			this.cited = list.map((source) => typeof source === "string" ? { source } : source);
			citedSourcesOf.set(this, this.cited);
		}
		/** Written as Word's citation content control, in place of a run */
		get writtenAs() {
			return [new CitationContentControl(this.cited)];
		}
	};
	//#endregion
	//#region src/bibliography/styles/locals.ts
	/** The wording, by its path in Word's input to a style, such as `LOCALS.Strings.EditorShortCap` for `b:Strings/b:EditorShortCap` */
	var LOCALS = {
		Properties: { Direction: "ltr" },
		General: {
			AuthorsSeparator: ", ",
			CloseBracket: ")",
			CloseLink: ">",
			CloseQuote: "”",
			Dot: ".",
			DotInitial: ".",
			EndChars: ".!?",
			Enum: ":",
			EnumSeparator: ": ",
			Equal: "=",
			FromToDash: "-",
			GroupSeparator: "; ",
			Hyphens: "-–—",
			ListSeparator: ", ",
			NoAndBeforeLastAuthor: "no",
			NoCommaBeforeAnd: "no",
			NoItalics: "no",
			NonBreakingSpace: "\xA0",
			OpenBracket: "(",
			OpenLink: "<",
			OpenQuote: "“",
			SimpleAuthor: {
				F: "%F",
				L: "%L",
				M: "%M"
			},
			SimpleDate: {
				D: "%D",
				M: "%M",
				Y: "%Y"
			},
			Space: " ",
			TitleClose: "",
			TitleOpen: ""
		},
		APA: {
			BeforeLastAuthor: "&",
			CitationLong: {
				FML: "%L %f %m",
				FM: "%f %m",
				ML: "%L %m",
				FL: "%L %f "
			},
			CitationShort: {
				FML: "%L",
				FM: "%F",
				ML: "%L",
				FL: "%L"
			},
			Date: {
				DMY: "%Y, %M %D",
				DM: "%M %D",
				MY: "%Y, %M",
				DY: "%Y"
			},
			DateAccessed: {
				DMY: "%M %D, %Y",
				DM: "%M %D",
				MY: "%M %Y",
				DY: "%Y"
			},
			DateCourt: {
				DMY: "%M %D, %Y",
				DM: "%M %D",
				MY: "%M %Y",
				DY: "%Y"
			},
			GeneralClose: ")",
			GeneralOpen: "(",
			MainAuthors: {
				FML: "%L, %f %m",
				FM: "%f %m",
				ML: "%L, %m",
				FL: "%L, %f"
			},
			SecondaryAuthors: {
				FML: "%f %m %L",
				FM: "%f %m",
				ML: "%m %L",
				FL: "%f %L"
			},
			SecondaryClose: "]",
			SecondaryOpen: "["
		},
		Chicago: {
			CitationLong: {
				FML: "%f %m %L",
				FM: "%f %m",
				ML: "%m %L",
				FL: "%f %L"
			},
			CitationShort: {
				FML: "%L",
				FM: "%F",
				ML: "%L",
				FL: "%L"
			},
			Date: {
				DMY: "%D %M %Y",
				DM: "%D %M",
				MY: "%M %Y",
				DY: "%Y"
			},
			MainAuthor: {
				FML: "%L, %F %M",
				FM: "%F %M",
				ML: "%L, %M",
				FL: "%L, %F"
			},
			OtherAuthors: {
				FML: "%F %M %L",
				FM: "%F %M",
				ML: "%M %L",
				FL: "%F %L"
			},
			SameAuthor: "—",
			SecondaryAuthors: {
				FML: "%F %M %L",
				FM: "%F %M",
				ML: "%M %L",
				FL: "%F %L"
			}
		},
		MLA: {
			CitationLong: {
				FML: "%f %m %L",
				FM: "%f %m",
				ML: "%m %L",
				FL: "%f %L"
			},
			CitationShort: {
				FML: "%L",
				FM: "%F",
				ML: "%L",
				FL: "%L"
			},
			Date: {
				DMY: "%D %M %Y",
				DM: "%D %M",
				MY: "%M %Y",
				DY: "%Y"
			},
			MainAuthor: {
				FML: "%L, %F %M",
				FM: "%F %M",
				ML: "%L, %M",
				FL: "%L, %F"
			},
			OtherAuthors: {
				FML: "%F %M %L",
				FM: "%F %M",
				ML: "%M %L",
				FL: "%F %L"
			},
			SameAuthor: "—",
			SecondaryAuthors: {
				FML: "%F %M %L",
				FM: "%F %M",
				ML: "%M %L",
				FL: "%F %L"
			}
		},
		Gost: {
			Authors: {
				FML: "%L %F %M",
				FM: "%F %M",
				ML: "%L %M",
				FL: "%L %F"
			},
			CitationLong: {
				FML: "%L %f. %m.",
				FM: "%f. %m.",
				ML: "%L %m.",
				FL: "%L %f."
			},
			CitationShort: {
				FML: "%L",
				FM: "%F",
				ML: "%L",
				FL: "%L"
			},
			Date: {
				DMY: "%D %M %Y",
				DM: "%D %M",
				MY: "%M %Y",
				DY: "%Y"
			},
			GeneralClose: "]",
			GeneralOpen: "[",
			OneSlash: "/",
			TwoSlash: "//"
		},
		ISO690: {
			CitationLong: {
				FML: "%L, %f. %m.",
				FM: "%f. %m.",
				ML: "%L, %m.",
				FL: "%L, %f."
			},
			CitationShort: {
				FML: "%L",
				FM: "%F",
				ML: "%L",
				FL: "%L"
			},
			Date: {
				DMY: "%D %M %Y",
				DM: "%D %M",
				MY: "%M %Y",
				DY: "%Y"
			},
			DateAccessed: {
				DMY: "%D %M %Y",
				DM: "%D %M",
				MY: "%M %Y",
				DY: "%Y"
			},
			GeneralClose: "]",
			GeneralOpen: "[",
			MainAuthors: {
				FML: "%L, %F %M",
				FM: "%F %M",
				ML: "%L, %M",
				FL: "%L, %F"
			},
			SameAuthor: "—",
			SecondaryAuthors: {
				FML: "%F %M %L",
				FM: "%F %M",
				ML: "%M %L",
				FL: "%F %L"
			}
		},
		SIST: {
			Date: {
				DMY: "%D %M %Y",
				DM: "%D %M",
				MY: "%M %Y",
				DY: "%Y"
			},
			DateAccessed: {
				DMY: "%D %M %Y",
				DM: "%D %M",
				MY: "%M %Y",
				DY: "%Y"
			},
			GeneralClose: "]",
			GeneralOpen: "[",
			MainAuthors: {
				FML: "%L%F%M",
				FM: "%F%M",
				ML: "%L%M",
				FL: "%L%F"
			},
			SameAuthor: "—",
			SecondaryAuthors: {
				FML: "%L%F%M",
				FM: "%F%M",
				ML: "%L%M",
				FL: "%L%F"
			}
		},
		SourceNames: {
			Book: "Book",
			BookSection: "Book Section",
			JournalArticle: "Journal",
			ArticleInAPeriodical: "Article",
			ConferenceProceedings: "Conference",
			Report: "Report",
			InternetSite: "Online",
			DocumentFromInternetSite: "Online",
			ElectronicSource: "Electronic Source",
			Art: "Art",
			SoundRecording: "Sound Recording",
			Performance: "Performance",
			Film: "Film",
			Interview: "Interview",
			Patent: "Patent",
			Case: "Case",
			Misc: "Misc"
		},
		Strings: {
			AccessedCap: "Accessed %1",
			AccessedUnCap: "accessed %1",
			AndOthersUnCap: "et al.",
			AndUnCap: "and",
			ArtistShortUnCap: "art.",
			AuthorShortUnCap: "auth.",
			BookAuthorShortUnCap: "book auth.",
			ByCap: "By %1",
			ByUnCap: "by %1",
			ChapterCap: "Chapter %1",
			ChapterInCap: "In %1",
			ChapterInUnCap: "in %1",
			ChapterUnCap: "chapter %1",
			CitedCap: "Cited: %1",
			CompiledByCap: "Compiled by %1",
			CompiledByUnCap: "compiled by %1",
			CompilerCap: "Compiler",
			CompilersCap: "Compilers",
			CompilerShortCap: "Comp.",
			CompilerShortUnCap: "comp.",
			CompilerShortUnCapIso: "compl.",
			CompilersShortCap: "Comps.",
			CompilersShortUnCap: "comps.",
			ComposerCap: "Composer",
			ComposersCap: "Composers",
			ComposerShortCap: "Comp.",
			ComposerShortUnCapIso: "comps.",
			ComposersShortCap: "Comps.",
			ConductedByCap: "Conducted by %1",
			ConductedByUnCap: "conducted by %1",
			ConductorCap: "Conductor",
			ConductorsCap: "Conductors",
			ConductorShortCap: "Cond.",
			ConductorShortUnCap: "cond.",
			ConductorsShortCap: "Conds.",
			ConductorsShortUnCap: "conds.",
			CounselShortUnCap: "counsl.",
			CounselShortUnCapIso: "counsl.",
			DirectedByCap: "Directed by %1",
			DirectedByUnCap: "directed by %1",
			DirectorCap: "Director",
			DirectorsCap: "Directors",
			DirectorShortCap: "Dir.",
			DirectorShortUnCap: "dir.",
			DirectorsShortCap: "Dirs.",
			DirectorsShortUnCap: "dirs.",
			EditedByCap: "Edited by %1",
			EditedByUnCap: "edited by %1",
			EditionShortUnCap: "%1 ed.",
			EditionUnCap: "%1 edition",
			EditorCap: "Editor",
			EditorsCap: "Editors",
			EditorShortCap: "Ed.",
			EditorShortUnCap: "ed.",
			EditorsShortCap: "Eds.",
			EditorsShortUnCap: "",
			FiledCap: "Filed %1",
			FromCap: "Retrieved from %1",
			FromUnCap: "from %1",
			InCap: "In",
			InNameCap: "In %1",
			InNameUnCap: "in %1",
			InterviewByCap: "Interview by %1",
			InterviewByUnCap: "interview by %1",
			InterviewCap: "Interview",
			IntervieweeShortUnCap: "interv.",
			InterviewerCap: "Interviewer",
			InterviewersCap: "Interviewers",
			InterviewWithCap: "Interview with %1",
			InventorShortUnCap: "invent.",
			MotionPictureCap: "Motion Picture",
			NoDateShortUnCap: "n.d.",
			NumberShortCap: "No. %1",
			NumberShortUnCap: "no. %1",
			OnAlbumTitleCap: "On %1",
			OnlineCap: "Online",
			OnlineUnCap: "online",
			PagesCountinousShort: "pp.",
			PageShort: "p.",
			PatentCap: "Patent %1",
			PatentFiledCap: "Patent filed %1",
			PatentNumberShortCap: "Patent No. %1",
			PerformedByCap: "Performed by %1",
			PerformedByUnCap: "performed by %1",
			PerformerCap: "Performer",
			PerformersCap: "Performers",
			PerformerShortCap: "Perf.",
			PerformerShortUnCap: "perf.",
			PerformersShortCap: "Perfs.",
			PerformersShortUnCap: "perfs.",
			ProducedByCap: "Produced by %1",
			ProducedByUnCap: "produced by %1",
			ProducerCap: "Producer",
			ProducersCap: "Producers",
			ProducerShortCap: "Prod.",
			ProducerShortUnCap: "prod.",
			ProducersShortCap: "Prods.",
			ProductionCompanyShortCap: "Prod.",
			RecordedByCap: "Recorded by %1",
			RetrievedCap: "Retrieved %1",
			RetrievedFromCap: "Retrieved %1, from %2",
			SineLocoShort: "s.l.",
			SineLocoSineNomineShort: "s.l. : s.n.",
			SineNomineShort: "s.n.",
			TranslatedByCap: "Translated by %1",
			TranslatedByUnCap: "translated by %1",
			TranslatorCap: "Translator",
			TranslatorsCap: "Translators",
			TranslatorShortCap: "Trans.",
			TranslatorShortUnCap: "trans.",
			TranslatorsShortCap: "Trans.",
			TranslatorsShortUnCap: "trans.",
			UnCapEditorsShort: "eds.",
			VersionShortCap: "Vers.",
			VolumeCap: "Volume %1",
			VolumeOfShortCap: "Vol. %1 of %2",
			VolumesAfterShortUnCap: "%1 vols.",
			VolumeShortCap: "Vol. %1",
			VolumeShortUnCap: "vol. %1",
			VolumesOfShortCap: "Vols. %1 of %2",
			VolumesShortCap: "Vols. %1",
			VolumesShortUnCap: "vols. %1",
			WithUnCap: "%1 with %2",
			WriterCap: "Writer",
			WritersCap: "Writers",
			WriterShortUnCap: "writ."
		}
	};
	//#endregion
	//#region src/bibliography/styles/xsl.ts
	/**
	* The templates Word's styles of citation share, written in TypeScript: names and their initials, dates, formats such
	* as "Retrieved %1, from %2", lists of fields and their separators, and the order of a bibliography.
	*
	* Each follows its XSL template, including where that doesn't do what it looks like it should, so the styles write what
	* Word writes. Each XSL template's name is in its description.
	*
	* @module
	*/
	/** The last character of the text, or "" when it is empty, as `substring($text, string-length($text))` */
	var lastCharOf = (text) => text.slice(-1);
	/**
	* Whether a character is one of the characters, as XPath's `contains($characters, $character)`, which is true of ""
	*/
	var isOneOf = (character, characters) => characters.includes(character);
	/** The text with each character of `from` replaced by the one at its place in `to`, or removed, as XPath's `translate` */
	var translate = (text, from, to) => [...text].map((character) => {
		var _to$index;
		const index = from.indexOf(character);
		return index < 0 ? character : (_to$index = to[index]) !== null && _to$index !== void 0 ? _to$index : "";
	}).join("");
	/** The parts of a format: %%, a % and the character after it, or the text up to the next % */
	var formatPartsOf = (format) => {
		var _format$match;
		return (_format$match = format.match(/%%|%[^]?|[^%]+/g)) !== null && _format$match !== void 0 ? _format$match : [];
	};
	/**
	* The templates Word's styles share, writing with a style's punctuation.
	*
	* @param punctuation - The punctuation the style writes with
	*/
	var xslTemplates = (punctuation) => {
		const dot = punctuation.Dot;
		const endsWithEndChar = (text) => isOneOf(lastCharOf(text), punctuation.EndChars);
		/** The initials of a name, such as "J.-P." of "Jean-Paul", or "M." of "Mary Ann" (`formatNameInitial`) */
		const nameInitial = (name) => {
			if (name.length === 0) return "";
			const withoutSpaces = translate(name, " \xA0", "");
			let hyphenated = "";
			for (let rest = withoutSpaces; rest.length >= 2;) if (isOneOf(rest[0], punctuation.Hyphens)) {
				hyphenated += rest.slice(0, 2) + punctuation.DotInitial;
				rest = rest.slice(2);
			} else rest = rest.slice(1);
			const first = withoutSpaces.slice(0, 1);
			return (isOneOf(first, punctuation.Hyphens) ? "" : first + punctuation.DotInitial) + hyphenated;
		};
		/** One part of a person's name for a pattern: %F, %M or %L the name, %f, %m or %l its initials (`formatNameOneItem`) */
		const namePart = (person, code) => {
			switch (code) {
				case "F": return person.first;
				case "M": return person.middle;
				case "L": return person.last;
				case "f": return nameInitial(person.first);
				case "m": return nameInitial(person.middle);
				case "l": return nameInitial(person.last);
				default: return "";
			}
		};
		/**
		* A person's name, written with the pattern for the names they have (`formatNameCore` and `StringFormatName`). The
		* template's `withDot` and `upperLast` are tested without a `$`, so they never add a dot or capitals
		*/
		const formatName = (person, patterns) => {
			const { first, middle, last } = person;
			return (!first && !middle && !last ? "" : !first && !middle ? punctuation.SimpleAuthor.L : !first && !last ? punctuation.SimpleAuthor.M : !first ? patterns.ML : !middle && !last ? punctuation.SimpleAuthor.F : !middle ? patterns.FL : !last ? patterns.FM : patterns.FML).replace(/%(.)|%$/g, (_match, code) => code === "%" ? "%" : code ? namePart(person, code) : "");
		};
		/**
		* A date, written with the pattern for the parts it has, or the year alone when it has no month (`formatDateCorePrivate`
		* and `StringFormatDate`). A month and a day with no year, or a month alone, are written as nothing
		*/
		const formatDatePrivate = (day, month, year, patterns) => {
			return (!year ? "" : !month ? punctuation.SimpleDate.Y : !day ? patterns.MY : patterns.DMY).replace(/%(.)|%$/g, (_match, code) => code === "%" ? "%" : code === "D" ? day : code === "M" ? month : code === "Y" ? year : "");
		};
		/**
		* A format, such as "Retrieved %1, from %2", with each %1 to %9 replaced by its parameter, with its formatting, and
		* %% by % (`StringFormat`)
		*/
		const stringFormat = (format, ...parameters) => join(...formatPartsOf(format).map((part) => {
			var _parameters;
			return part === "%%" ? "%" : part.startsWith("%") ? (_parameters = parameters[Number(part.slice(1)) - 1]) !== null && _parameters !== void 0 ? _parameters : "" : part;
		}));
		/**
		* A format with each parameter replaced, as {@link stringFormat}, and a dot after it unless it ends with a character
		* that ends a sentence, such as a dot or a question mark, or with an empty parameter (`StringFormatDot`)
		*/
		const stringFormatDot = (format, ...parameters) => {
			var _parts, _parameters2;
			const parts = formatPartsOf(format);
			const last = (_parts = parts[parts.length - 1]) !== null && _parts !== void 0 ? _parts : "";
			const needsDot = last === "%%" ? true : last.startsWith("%") ? last.length === 2 && !isOneOf(lastCharOf(textOf((_parameters2 = parameters[Number(last.slice(1)) - 1]) !== null && _parameters2 !== void 0 ? _parameters2 : "")), punctuation.EndChars) : last.length > 0 && !isOneOf(lastCharOf(last), punctuation.EndChars);
			const text = stringFormat(format, ...parameters);
			return needsDot ? join(text, dot) : text;
		};
		/** The text, and a dot after it unless it ends with a character that ends a sentence (`appendField_Dot`) */
		const appendDot = (text) => text.length === 0 ? "" : endsWithEndChar(text) ? text : text + dot;
		/** A dot, unless the text is empty or ends with a character that ends a sentence (`need_Dot`) */
		const needDot = (text) => text.length === 0 || endsWithEndChar(text) ? "" : dot;
		/**
		* The items of a list with the list's separator between them, or the group separator after a `group` item, and a dot
		* after the last unless it ends a sentence (`PrintList` and `PrintList2`). A text item is written as text, and a
		* formatted one with its formatting
		*/
		const printList = (items) => {
			const { parts, lastDisplayed } = items.reduce((list, item) => {
				if (item === "group") return _objectSpread2(_objectSpread2({}, list), {}, { separator: punctuation.GroupSeparator });
				const text = textOf(item);
				if (text.length === 0) return list;
				const separated = list.lastDisplayed.length > 0;
				return {
					parts: [
						...list.parts,
						...separated ? [list.separator] : [],
						item
					],
					separator: separated ? punctuation.ListSeparator : list.separator,
					lastDisplayed: text
				};
			}, {
				parts: [],
				separator: punctuation.ListSeparator,
				lastDisplayed: ""
			});
			return join(...parts, needDot(lastDisplayed));
		};
		return {
			nameInitial,
			formatName,
			formatDatePrivate,
			stringFormat,
			stringFormatDot,
			appendDot,
			needDot,
			printList
		};
	};
	/**
	* The text in italics, as a style's `ApplyItalicTitleNS` and `ApplyItalicFieldNS` write it, as English has italics
	* (`NoItalics` is "no")
	*/
	var applyItalic$1 = (text) => textOf(text).length === 0 && formatted(text).length === 0 ? [] : italic(text);
	var SORTED_AS = {
		æ: "ae",
		œ: "oe",
		ø: "o",
		ß: "ss",
		ł: "l",
		đ: "d",
		ð: "d",
		þ: "th",
		ı: "i"
	};
	/** A sort key's letters, without the accents, hyphens and apostrophes that Word ignores when it sorts, in small letters */
	var primaryKeyOf = (key) => key.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[-'’­]/g, "").replace(new RegExp(`[${Object.keys(SORTED_AS).join("")}]`, "g"), (letter) => SORTED_AS[letter]);
	var compareStrings = (a, b) => a < b ? -1 : a > b ? 1 : 0;
	/**
	* The items sorted by their sort keys, as a style's `xsl:sort` sorts them in Word: in small letters, without the
	* hyphens and apostrophes in them, and then by their accents. Items with the same key keep their order.
	*
	* A letter with an accent is sorted as the letter. Word for Mac sorts some of them in an order of its own, such as
	* "Müller" before "Mabe", so it may put such names in another order when it updates a bibliography.
	*/
	var sortByKey = (items, keyOf) => items.map((item, index) => ({
		item,
		index,
		key: keyOf(item)
	})).sort((a, b) => compareStrings(primaryKeyOf(a.key), primaryKeyOf(b.key)) || compareStrings(a.key.toLowerCase(), b.key.toLowerCase()) || a.index - b.index).map(({ item }) => item);
	//#endregion
	//#region src/bibliography/styles/apa.ts
	/**
	* APA, sixth edition: Word's `APASixthEditionOfficeOnline.xsl`, written in TypeScript.
	*
	* Citations name each source's authors and year, such as "(Baker, 2010)", with the title too when another source has
	* the same first author. The bibliography lists the sources by author, each with a hanging indent.
	*
	* Each function follows the XSL template or variable named in its description, including where that doesn't do what it
	* looks like it should, so the citations and bibliography are the ones Word writes.
	*
	* @module
	*/
	var general$1 = LOCALS.General;
	var strings$1 = LOCALS.Strings;
	var style = LOCALS.APA;
	var xsl$6 = xslTemplates(general$1);
	var MAX_CITATION_AUTHORS = 5;
	var MAX_BIBLIOGRAPHY_AUTHORS = 7;
	/**
	* Where MSXML, Word's XSLT, starts or ends a copy of a variable. Word reads a space there when it is between two
	* elements, such as two italics, or between an element and the end of the paragraph
	*/
	var BOUNDARY = { text: "" };
	/** A copy of a variable, with its boundaries (`xsl:copy-of select="$variable"`) */
	var copyOf = (text) => join([BOUNDARY], text, [BOUNDARY]);
	/** The text as `apply-templates mode="outputHtml"` writes it, which leaves out its copies' boundaries */
	var withoutBoundaries = (text) => join(text).filter((run) => run !== BOUNDARY);
	var isElement = (run) => !!(run.italics || run.bold || run.underline);
	/** The text, with a space where Word reads one at a boundary of a copy, and the boundaries left out */
	var resolveBoundaries = (text) => text.flatMap((run, index) => {
		if (run !== BOUNDARY) return [run];
		const written = (other) => other !== BOUNDARY && other.text.length > 0;
		const before = text.slice(0, index).filter(written).pop();
		const after = text.slice(index + 1).find(written);
		return before && isElement(before) && (!after || isElement(after)) ? [{ text: general$1.Space }] : [];
	});
	/** Whether the text has any characters, as `string-length($text) > 0` */
	var has = (text) => textOf(text).length > 0;
	/** The people with a role, or the organization that has it, as Word keeps them */
	var namesOf$1 = (source, role) => role ? source.names[role] : void 0;
	/** The text of the people with a role, or of the organization, as `string-length(b:Author/b:Role)` reads it */
	var namesText$1 = (names) => !names ? "" : "corporate" in names ? names.corporate : names.people.map(({ last, first, middle }) => last + first + middle).join("");
	/** How many people have a role, and none for an organization (`count(b:Author/b:Role/b:NameList/b:Person)`) */
	var peopleCountOf = (source, role) => {
		const names = source.names[role];
		return names && "people" in names ? names.people.length : 0;
	};
	/** How many people have a role, or 1 for an organization (`count1` of `formatManySecondary`) */
	var countOf$3 = (names) => !names ? 0 : "corporate" in names ? 1 : names.people.length;
	/**
	* The role whose people a source is named by: its authors, or for some types its editors, composers, writers and so on,
	* whichever it has first (`MainContributors`)
	*/
	var mainContributorsOf$2 = (source) => {
		var _roles$source$type$fi;
		return (_roles$source$type$fi = {
			Book: ["Author", "Editor"],
			BookSection: ["Author"],
			JournalArticle: ["Author", "Editor"],
			ArticleInAPeriodical: ["Author", "Editor"],
			ConferenceProceedings: ["Author", "Editor"],
			Report: ["Author"],
			SoundRecording: [
				"Composer",
				"Performer",
				"Conductor"
			],
			Performance: [
				"Writer",
				"Director",
				"Performer"
			],
			Art: ["Artist"],
			DocumentFromInternetSite: ["Author", "Editor"],
			InternetSite: ["Author", "Editor"],
			Film: [
				"ProducerName",
				"Writer",
				"Director"
			],
			Interview: [
				"Interviewee",
				"Editor",
				"Translator"
			],
			Patent: ["Inventor"],
			ElectronicSource: ["Author", "Editor"],
			Case: [],
			Misc: ["Author", "Editor"]
		}[source.type].find((role) => namesText$1(source.names[role]).length > 0)) !== null && _roles$source$type$fi !== void 0 ? _roles$source$type$fi : "";
	};
	/** A main author's name, such as "Dickens, C. J." (`formatMainAuthor`) */
	var formatMainAuthor = (person) => xsl$6.formatName(person, style.MainAuthors);
	/** Another person's name, such as "E. Hemingway" (`formatSecondaryName`) */
	var formatSecondaryName = (person) => xsl$6.formatName(person, style.SecondaryAuthors);
	/**
	* What comes after the person at a position of a list of people: ", " between them, ", & " before the last, unless the
	* list isn't the last one written, or ". . . " when there are more than seven and the rest are left out
	* (`formatPersonSeperator`)
	*
	* @param position - The person's position, from 1
	* @param isLast - Whether the list is the last of the lists written, which "&" is before the last person of
	*/
	var formatPersonSeperator$1 = (position, count, isLast = true) => {
		let separator = "";
		if (position === count - 1) {
			if (count <= MAX_BIBLIOGRAPHY_AUTHORS) separator += general$1.AuthorsSeparator + (isLast ? style.BeforeLastAuthor + general$1.Space : "");
			else separator += (general$1.Dot + general$1.Space).repeat(3);
		}
		if (position < count - 1 && position < MAX_BIBLIOGRAPHY_AUTHORS) separator += general$1.AuthorsSeparator;
		return separator;
	};
	/** Whether the person at a position is written: the first six, and the last (`position() < $maxBibAuthors or position() = last()`) */
	var isWritten = (position, count) => position < MAX_BIBLIOGRAPHY_AUTHORS || position === count;
	/**
	* People in a list, each written by the format, or the organization (`formatPersonsAuthor`, and with the format of other
	* people `formatPersons`)
	*/
	var formatPersonsWith = (format) => (names) => !names ? "" : "corporate" in names ? names.corporate : names.people.map((person, index) => (isWritten(index + 1, names.people.length) ? format(person) : "") + formatPersonSeperator$1(index + 1, names.people.length)).join("");
	/** Main authors, such as "Smith, J., & Jones, M. A." (`formatPersonsAuthor`) */
	var formatPersonsAuthor$3 = formatPersonsWith(formatMainAuthor);
	/** Other people, such as "E. Hemingway & J. Austen" (`formatPersons`) */
	var formatPersons$5 = formatPersonsWith(formatSecondaryName);
	/**
	* People with a role in a list of lists, each written by the format, with "& " before a single person when they are the
	* last list after others (`formatPersons2`, and with the format of main authors `formatPersonsAuthor2`)
	*/
	var formatPersons2With = (format) => (names, before, isLast) => {
		if ("corporate" in names) return names.corporate;
		const { people } = names;
		return people.map((person, index) => {
			const position = index + 1;
			return (position === 1 && before && isLast && people.length === 1 ? style.BeforeLastAuthor + general$1.Space : "") + (isWritten(position, people.length) ? format(person) : "") + formatPersonSeperator$1(position, people.length, isLast);
		}).join("");
	};
	var formatPersons2 = formatPersons2With(formatSecondaryName);
	var formatPersonsAuthor2 = formatPersons2With(formatMainAuthor);
	var NO_LIST = {
		role: "",
		single: "",
		many: ""
	};
	/**
	* Up to three lists of people, each with its suffix, such as "(E. Hemingway, Ed., & J. Austen, Trans.)", in brackets
	* (`formatManySecondary`). In place of a third list, `special` is text written after the others, after "&"
	*/
	var formatManySecondary = (source, lists, special = "") => {
		const [first, second = NO_LIST, third = NO_LIST] = lists.map((list) => _objectSpread2(_objectSpread2({}, list), {}, { names: namesOf$1(source, list.role) }));
		const count1 = countOf$3(first.names);
		const count2 = countOf$3(second.names);
		const count3 = third.role ? countOf$3(third.names) : special ? 1 : 0;
		if (count1 + count2 + count3 === 0) return "";
		const suffix = (list, count) => count === 1 ? list.single : list.many;
		let text = style.GeneralOpen;
		if (count1 > 0) text += formatPersons2(first.names, false, count2 + count3 === 0) + suffix(first, count1);
		if (count2 > 0) {
			text += (count1 > 0 ? general$1.AuthorsSeparator : "") + formatPersons2(second.names, count1 > 0, count3 === 0);
			text += suffix(second, count2);
		}
		if (count3 > 0 && !special) {
			text += (count1 + count2 > 0 ? general$1.AuthorsSeparator : "") + formatPersons2(third.names, count1 + count2 > 0, true);
			text += suffix(third, count3);
		} else if (special) text += (count1 + count2 > 0 ? general$1.AuthorsSeparator + style.BeforeLastAuthor + general$1.Space : "") + special;
		return text + style.GeneralClose;
	};
	/** Up to three lists of main people, each with its suffix, and a dot (`formatManyMain`) */
	var formatManyMain = (source, lists) => {
		const names = lists.map((list) => namesOf$1(source, list.role));
		const counts = names.map(countOf$3);
		if (counts.every((count) => count === 0)) return "";
		let text = "";
		lists.forEach((list, index) => {
			if (counts[index] === 0) return;
			const before = counts.slice(0, index).some((count) => count > 0);
			const isLast = counts.slice(index + 1).every((count) => count === 0);
			text += (before ? general$1.AuthorsSeparator : "") + formatPersonsAuthor2(names[index], before, isLast);
			text += counts[index] === 1 ? list.single : list.many;
		});
		return text + general$1.Dot;
	};
	/** The text in the style's brackets, as "(" and ")" */
	var enclose = (text) => style.GeneralOpen + text + style.GeneralClose;
	/** The text without the brackets `formatManySecondary` put around it (`substring($text, 1 + string-length($open), ...)`) */
	var withoutBrackets = (text) => text.slice(style.GeneralOpen.length, text.length - style.GeneralClose.length);
	/** A volume or pages written as one, such as "Vol. 3", or several, such as "Vols. 3-4" or "pp. 5, 9" */
	var isSeveral = (text) => text.includes(",") || translate(text, general$1.Hyphens, "").length !== text.length;
	/** A date: the source's, the one it was read on, or a court case's (`formatDateCore`) */
	var formatDateCore = (day, month, year, patterns, displayNoDate) => year.length === 0 ? displayNoDate ? strings$1.NoDateShortUnCap : "" : xsl$6.formatDatePrivate(day, month, year, patterns);
	/** Two fields, with ": " between them, and a dot (`templateB`) */
	var templateB$1 = (first, second) => xsl$6.appendDot(first + (first && second ? general$1.EnumSeparator : "") + second);
	/** Two fields, with ", " between them, and a dot (`templateC`) */
	var templateC$2 = (first, second) => xsl$6.appendDot(first + (first && second ? general$1.ListSeparator : "") + second);
	/** Two fields, with ", " between them (`templateC2`) */
	var templateC2 = (first, second) => first + (first && second ? general$1.ListSeparator : "") + second;
	/** The city, state or province, and country or region, such as "Chicago, Illinois, United States" (`templateCSC2`) */
	var templateCSC2 = (source) => templateC2(fieldOf(source, "City"), templateC2(fieldOf(source, "StateProvince"), fieldOf(source, "CountryRegion")));
	/**
	* A title, a volume, an issue or an edition, and pages, of a publication, in italics but for the issue in brackets and
	* the pages, and a dot (`templateF`, and without italics for the third, `thirdNoItalic`). It is a copy of a variable
	*/
	var templateF = (first, second, third, fourth, fifth, thirdNoItalic) => {
		const temp = join(first ? applyItalic$1(first) : "", second ? applyItalic$1((first ? general$1.ListSeparator : "") + second) : "", third ? thirdNoItalic ? enclose(third) : applyItalic$1(enclose(third)) : "", fourth ? applyItalic$1((first || second || third ? general$1.ListSeparator : "") + fourth) : "", fifth ? (first || second || third || fourth ? general$1.ListSeparator : "") + fifth : "");
		return join(copyOf(temp), xsl$6.needDot(textOf(temp)));
	};
	/** A journal's or a periodical's title and volume in italics, its issue in brackets, and pages, and a dot (`templateG`) */
	var templateG = (first, second, third, fourth) => {
		const temp = join(first ? applyItalic$1(first) : "", second ? applyItalic$1((first ? general$1.ListSeparator : "") + second) : "", third ? enclose(third) : "", fourth ? (first || second || third ? general$1.ListSeparator : "") + fourth : "");
		return join(temp, xsl$6.needDot(textOf(temp)));
	};
	/** A title in italics and another field, and a dot (`templateH`, and `templateCItalic`) */
	var templateH = (first, second) => {
		const temp = join(first ? applyItalic$1(first) : "", first && second ? general$1.ListSeparator : "", second);
		return join(temp, xsl$6.needDot(textOf(temp)));
	};
	/** "Retrieved March 3, 2006, from Site: https://…", or the parts of it the source has (`templateRDAFU`) */
	var templateRDAFU = (source) => {
		const dac = formatDateCore(fieldOf(source, "DayAccessed"), fieldOf(source, "MonthAccessed"), fieldOf(source, "YearAccessed"), style.DateAccessed, false);
		const site = fieldOf(source, "InternetSiteTitle");
		const url = fieldOf(source, "URL");
		const siteAndUrl = (site ? url ? site : xsl$6.appendDot(site) : "") + (site && url ? general$1.EnumSeparator : "") + url;
		if (dac && siteAndUrl) return textOf(xsl$6.stringFormat(strings$1.RetrievedFromCap, dac, siteAndUrl));
		if (dac) return textOf(xsl$6.stringFormat(strings$1.RetrievedCap, dac));
		return siteAndUrl ? textOf(xsl$6.stringFormat(strings$1.FromCap, siteAndUrl)) : "";
	};
	/** The title of a source, or what a citation names it by when it has none (`populateMain`'s `b:Title`) */
	var citationTitleOf$2 = (source) => {
		const title = fieldOf(source, "Title");
		if (title) return title;
		const fallback = {
			BookSection: "BookTitle",
			ArticleInAPeriodical: "PeriodicalTitle",
			InternetSite: "InternetSiteTitle",
			DocumentFromInternetSite: "InternetSiteTitle",
			ElectronicSource: "PublicationTitle",
			Art: "PublicationTitle",
			Misc: "PublicationTitle",
			SoundRecording: "AlbumTitle",
			Interview: "BroadcastTitle"
		}[source.type];
		return fieldOf(source, "ShortTitle") || (fallback ? fieldOf(source, fallback) : "");
	};
	/**
	* A source of a citation, such as "(Baker, 2010, p. 50" before the next source's "; " (`xsl:when test="b:Citation"`)
	*/
	var citation$4 = (cited) => {
		var _cited$prefix, _cited$suffix;
		const { source } = cited;
		const { type } = source;
		const title0 = fieldOf(source, "ShortTitle") || citationTitleOf$2(source);
		const year0 = fieldOf(source, "Year");
		const patentNumber = fieldOf(source, "PatentNumber");
		const countryRegion = fieldOf(source, "CountryRegion");
		const patent = patentNumber ? (countryRegion ? countryRegion + general$1.Space : "") + textOf(xsl$6.stringFormat(strings$1.PatentNumberShortCap, patentNumber)) : "";
		const main = namesOf$1(source, mainContributorsOf$2(source));
		let author0 = "";
		if (main && "corporate" in main) author0 = main.corporate;
		else if (main) {
			const count = main.people.length;
			main.people.forEach((person, index) => {
				const position = index + 1;
				if (position === 1) author0 += xsl$6.formatName(person, cited.nonUniqueLastName ? style.CitationLong : style.CitationShort);
				if (position > 1 && count <= MAX_CITATION_AUTHORS) author0 += xsl$6.formatName(person, style.CitationShort);
				if (count > MAX_CITATION_AUTHORS && position === 1) author0 += general$1.ListSeparator + strings$1.AndOthersUnCap;
				if (count <= MAX_CITATION_AUTHORS && position === count - 1) author0 += count === 2 ? general$1.Space + style.BeforeLastAuthor + general$1.Space : general$1.AuthorsSeparator + style.BeforeLastAuthor + general$1.Space;
				if (count <= MAX_CITATION_AUTHORS && position < count - 1) author0 += general$1.AuthorsSeparator;
			});
		}
		const title = cited.hideTitle ? "" : title0;
		const year = cited.hideYear ? "" : type === "InternetSite" ? year0 || strings$1.NoDateShortUnCap : year0;
		const author = cited.hideAuthor ? "" : author0;
		const { volume, pages } = cited;
		const volVolume = volume ? textOf(xsl$6.stringFormat(isSeveral(volume) ? strings$1.VolumesShortUnCap : strings$1.VolumeShortUnCap, volume)) : "";
		const ppPages = pages ? (isSeveral(pages) ? strings$1.PagesCountinousShort : strings$1.PageShort) + general$1.Space + pages : "";
		const displayAuthor = type === "Patent" && patent ? patent : author;
		const displayTitle = !displayAuthor ? title : type === "Patent" && patent ? "" : cited.repeatedAuthor ? title : "";
		let text = cited.first ? general$1.OpenBracket : "";
		text += (_cited$prefix = cited.prefix) !== null && _cited$prefix !== void 0 ? _cited$prefix : "";
		text += displayAuthor;
		if (displayTitle) text += (displayAuthor ? general$1.ListSeparator : "") + displayTitle;
		if (year && (author0 || title0 || year0)) text += (displayAuthor || displayTitle ? general$1.ListSeparator : "") + year;
		if (!author0 && !title0 && !year0) text += source.tag;
		if (volume || pages) {
			text += displayAuthor || displayTitle || year ? general$1.ListSeparator : "";
			text += volume && pages ? volume + general$1.Enum + pages : volVolume || ppPages;
		}
		text += (_cited$suffix = cited.suffix) !== null && _cited$suffix !== void 0 ? _cited$suffix : "";
		text += cited.last ? general$1.CloseBracket : general$1.GroupSeparator;
		return join(text);
	};
	/** A source's key in the order of the bibliography: its main people, its year and its title (`b:SortingString`) */
	var sortingStringOf$6 = (source) => {
		const main = namesOf$1(source, mainContributorsOf$2(source));
		const author = main && "corporate" in main ? main.corporate : formatPersonsAuthor$3(main);
		const title = source.type === "Patent" ? (fieldOf(source, "CountryRegion") ? general$1.Space + fieldOf(source, "CountryRegion") : "") + (fieldOf(source, "PatentNumber") ? general$1.Space + fieldOf(source, "PatentNumber") : "") : fieldOf(source, "Title") ? general$1.Space + fieldOf(source, "Title") : "";
		const year = fieldOf(source, "Year") ? general$1.Space + fieldOf(source, "Year") : "";
		if (source.type === "Case") return title + year;
		return author ? general$1.Space + author + year + title : title + year;
	};
	/** The parts of the source's entry, joined with a space between those it has */
	var spaced$1 = (...parts) => join(...parts.filter(has).flatMap((part, index) => index === 0 ? [part] : [general$1.Space, part]));
	/** A source's entry in the bibliography (`xsl:for-each select="…/b:Bibliography/b:Source"`) */
	var entryOf$1 = (source) => {
		const field = (name) => fieldOf(source, name);
		const roleText = (role) => formatPersonsAuthor$3(source.names[role]);
		const peopleText = (role) => formatPersons$5(source.names[role]);
		const count = (role) => peopleCountOf(source, role);
		const title = field("Title");
		const titleDot = xsl$6.appendDot(title);
		const edition = field("Edition");
		const year = field("Year");
		const issue = field("Issue");
		const pages = field("Pages");
		const volume = field("Volume");
		const bookTitle = field("BookTitle");
		const conferenceName = field("ConferenceName");
		const publisher = field("Publisher");
		const court = field("Court");
		const date = formatDateCore(field("Day"), field("Month"), year, style.Date, true);
		const dateCourt = formatDateCore(field("Day"), field("Month"), year, style.DateCourt, false);
		const ppPages = pages ? (isSeveral(pages) ? strings$1.PagesCountinousShort : strings$1.PageShort) + general$1.Space + pages : "";
		const prefixVolumeCap = volume ? textOf(xsl$6.stringFormat(isSeveral(volume) ? strings$1.VolumesShortCap : strings$1.VolumeShortCap, volume)) : "";
		const volumeDot = xsl$6.appendDot(volume);
		const tempCSCPu = templateB$1(templateCSC2(source), publisher);
		const producerName = peopleText("ProducerName");
		const tempCSCPr = templateB$1(templateCSC2(source), producerName || field("ProductionCompany"));
		const tempCP = templateB$1(field("City"), publisher);
		const tempID = templateC$2(field("Institution"), field("Department"));
		const tempRIDC = textOf(xsl$6.printList([
			field("ThesisType"),
			field("Institution"),
			field("Department"),
			field("City")
		]));
		const tempTCSC = templateC$2(field("Theater"), templateCSC2(source));
		const tempICSC = templateC$2(field("Institution"), templateCSC2(source));
		const tempCD = templateB$1(field("CountryRegion"), field("Distributor"));
		const tempSC = templateC$2(field("Station"), field("City"));
		const tempTV = templateH(title, field("Version"));
		const tempPrP = templateH(field("BroadcastTitle"), pages);
		const tempJVIP = templateG(field("JournalName"), volume, issue, pages);
		const tempPTVI = templateG(field("PeriodicalTitle"), volume, issue, ppPages);
		const tempPVEP = templateF(field("PublicationTitle"), volume, edition, "", pages, true);
		const tempPVIEP = templateF(field("PublicationTitle"), volume, issue, edition, pages, false);
		const enclosedDateDot = enclose(date) + general$1.Dot;
		const author = roleText("Author");
		const authorDot = xsl$6.appendDot(author);
		const editorLF = roleText("Editor");
		const translator = peopleText("Translator");
		const cEditors = count("Editor");
		const ensufixEditorLF = editorLF ? editorLF + general$1.Space + (cEditors > 1 ? enclose(strings$1.EditorsShortCap) : enclose(strings$1.EditorShortCap)) : "";
		const ensufixEditorLFDot = ensufixEditorLF ? ensufixEditorLF + general$1.Dot : "";
		const ensufixWithRole = (role, single, many) => {
			const people = roleText(role);
			return people ? people + general$1.Space + (count(role) > 1 ? enclose(many) : enclose(single)) + general$1.Dot : "";
		};
		const theAuthor = author || ensufixEditorLF;
		const theAuthorDot = xsl$6.appendDot(theAuthor);
		const writeEditor = author ? "Editor" : "";
		const titleEditionVolumeDot = title ? join(applyItalic$1(edition || prefixVolumeCap ? title : titleDot), edition || prefixVolumeCap ? general$1.Space + style.GeneralOpen + (edition ? textOf(xsl$6.stringFormat(strings$1.EditionShortUnCap, edition)) : "") + (edition && prefixVolumeCap ? general$1.ListSeparator : "") + prefixVolumeCap + style.GeneralClose + general$1.Dot : "") : [];
		const theEditorAndTranslatorDot = formatManySecondary(source, [{
			role: writeEditor,
			single: general$1.ListSeparator + strings$1.EditorShortCap,
			many: general$1.ListSeparator + strings$1.EditorsShortCap
		}, {
			role: "Translator",
			single: general$1.ListSeparator + strings$1.TranslatorShortCap,
			many: general$1.ListSeparator + strings$1.TranslatorsShortCap
		}]);
		const editorSuffix = general$1.Space + enclose(strings$1.EditorShortCap);
		const theEditorEnc = withoutBrackets(formatManySecondary(source, [{
			role: writeEditor,
			single: editorSuffix,
			many: editorSuffix
		}]));
		const theBookAuthorAndEditor = formatManySecondary(source, [{
			role: "BookAuthor",
			single: "",
			many: ""
		}, {
			role: "Editor",
			single: editorSuffix,
			many: general$1.Space + enclose(strings$1.EditorsShortCap)
		}]);
		const theBookAuthorAndEditor2 = theBookAuthorAndEditor ? withoutBrackets(theBookAuthorAndEditor) : "";
		const theBookAuthorAndEditorDot = theBookAuthorAndEditor ? theBookAuthorAndEditor2 + general$1.Dot : "";
		const bookTitlePagesDot = bookTitle ? volume || pages || translator || edition ? join(applyItalic$1(bookTitle), general$1.Space + style.GeneralOpen + (translator ? translator + general$1.ListSeparator + (count("Translator") > 1 ? strings$1.TranslatorsShortCap : strings$1.TranslatorShortCap) : "") + (edition ? (translator ? general$1.ListSeparator : "") + textOf(xsl$6.stringFormat(strings$1.EditionShortUnCap, edition)) : "") + (volume ? (translator || edition ? general$1.ListSeparator : "") + textOf(xsl$6.stringFormat(isSeveral(volume) ? strings$1.VolumesShortCap : strings$1.VolumeShortCap, volume)) : "") + (pages ? (translator || edition || volume ? general$1.ListSeparator : "") + ppPages : "") + style.GeneralClose + general$1.Dot) : applyItalic$1(xsl$6.appendDot(bookTitle)) : [];
		const composerLF = roleText("Composer");
		const performerLF = roleText("Performer");
		const conductorLF = roleText("Conductor");
		const theAuthorSoundRecordingDot = composerLF || performerLF || conductorLF;
		const composer = peopleText("Composer");
		const performer = peopleText("Performer");
		const conductor = peopleText("Conductor");
		const secondarySoundRecordingName = composer ? performer || conductor : performer ? conductor : "";
		const thePerformerAndConductorDot = secondarySoundRecordingName ? style.SecondaryOpen + textOf(xsl$6.stringFormat(strings$1.RecordedByCap, secondarySoundRecordingName)) + style.SecondaryClose + general$1.Dot : "";
		const writer = peopleText("Writer");
		const director = peopleText("Director");
		const theAuthorPerformanceDot = xsl$6.appendDot(roleText("Writer")) || ensufixWithRole("Director", strings$1.DirectorCap, strings$1.DirectorsCap) || ensufixWithRole("Performer", strings$1.PerformerCap, strings$1.PerformersCap);
		const thePerformanceDirectorAndPerformerDot = formatManySecondary(source, [{
			role: writer ? "Director" : "",
			single: general$1.ListSeparator + strings$1.DirectorCap,
			many: general$1.ListSeparator + strings$1.DirectorsCap
		}, {
			role: writer || director ? "Performer" : "",
			single: general$1.ListSeparator + strings$1.PerformerCap,
			many: general$1.ListSeparator + strings$1.PerformersCap
		}]);
		const theMiscAuthorDot = authorDot || ensufixEditorLFDot;
		const theMiscEditorAndTranslatorAndCompilerDot = formatManySecondary(source, [
			{
				role: authorDot ? "Editor" : "",
				single: general$1.ListSeparator + strings$1.EditorShortCap,
				many: general$1.ListSeparator + strings$1.EditorsShortCap
			},
			{
				role: "Translator",
				single: general$1.ListSeparator + strings$1.TranslatorShortCap,
				many: general$1.ListSeparator + strings$1.TranslatorsShortCap
			},
			{
				role: "Compiler",
				single: general$1.ListSeparator + strings$1.CompilerCap,
				many: general$1.ListSeparator + strings$1.CompilersCap
			}
		]);
		const filmSuffix = (word) => general$1.Space + enclose(word);
		const theFilmProducerAndWriterAndDirectorDot = formatManyMain(source, [
			{
				role: "ProducerName",
				single: filmSuffix(strings$1.ProducerCap),
				many: filmSuffix(strings$1.ProducersCap)
			},
			{
				role: "Writer",
				single: filmSuffix(strings$1.WriterCap),
				many: filmSuffix(strings$1.WritersCap)
			},
			{
				role: "Director",
				single: filmSuffix(strings$1.DirectorCap),
				many: filmSuffix(strings$1.DirectorsCap)
			}
		]);
		const interviewer = {
			role: "Interviewer",
			single: general$1.ListSeparator + strings$1.InterviewerCap,
			many: general$1.ListSeparator + strings$1.InterviewersCap
		};
		const theInterviewInterviewerAndEditorAndTranslator = formatManySecondary(source, [
			interviewer,
			{
				role: "Editor",
				single: general$1.ListSeparator + strings$1.EditorCap,
				many: general$1.ListSeparator + strings$1.EditorsCap
			},
			{
				role: "Translator",
				single: general$1.ListSeparator + strings$1.TranslatorCap,
				many: general$1.ListSeparator + strings$1.TranslatorsCap
			}
		]);
		const theInterviewInterviewer = formatManySecondary(source, [interviewer]);
		const theInternetSiteEditorAndProducerDot = formatManySecondary(source, [{
			role: writeEditor,
			single: general$1.ListSeparator + strings$1.EditorCap,
			many: general$1.ListSeparator + strings$1.EditorsCap
		}, {
			role: "ProducerName",
			single: general$1.ListSeparator + strings$1.ProducerCap,
			many: general$1.ListSeparator + strings$1.ProducersCap
		}], field("ProductionCompany"));
		const albumTitle = field("AlbumTitle");
		const medium = field("Medium");
		const albumTitleMedium = join(albumTitle ? xsl$6.stringFormat(strings$1.OnAlbumTitleCap, applyItalic$1(albumTitle)) : "", albumTitle && medium ? general$1.Space : "", medium ? style.SecondaryOpen + medium + style.SecondaryClose : "");
		const albumTitleMediumDot = textOf(albumTitleMedium).trim() ? join(copyOf(albumTitleMedium), xsl$6.needDot(textOf(albumTitleMedium))) : [];
		const conferenceNameItalic = () => applyItalic$1(!volume && pages || !publisher && (volume || pages) ? conferenceName : xsl$6.appendDot(conferenceName));
		const conferenceVolumeAndPages = volumeDot || pages ? [
			publisher ? "" : general$1.ListSeparator,
			volumeDot && !pages ? join(general$1.Space, applyItalic$1(volumeDot)) : "",
			volume && pages ? join(general$1.Space, applyItalic$1(volume), general$1.ListSeparator, xsl$6.appendDot(ppPages)) : "",
			!volume && pages ? general$1.Space + enclose(ppPages) + general$1.Dot : ""
		] : [];
		const before = (...parts) => parts.some(has);
		switch (source.type) {
			case "Book": return theAuthorDot ? spaced$1(theAuthorDot, enclosedDateDot, titleEditionVolumeDot, theEditorAndTranslatorDot, tempCSCPu) : spaced$1(titleEditionVolumeDot, enclosedDateDot, theEditorAndTranslatorDot, tempCSCPu);
			case "BookSection": return join(authorDot ? spaced$1(authorDot, enclosedDateDot, titleDot) : spaced$1(titleDot, enclosedDateDot), theBookAuthorAndEditor ? join(general$1.Space, xsl$6.stringFormat(strings$1.InNameCap, has(bookTitlePagesDot) ? theBookAuthorAndEditor2 : theBookAuthorAndEditorDot)) : [], has(bookTitlePagesDot) ? join(theBookAuthorAndEditor ? general$1.ListSeparator : general$1.Space, theBookAuthorAndEditor ? bookTitlePagesDot : xsl$6.stringFormat(strings$1.InNameCap, bookTitlePagesDot)) : [], tempCSCPu ? general$1.Space + tempCSCPu : "");
			case "JournalArticle": return theAuthorDot ? spaced$1(theAuthorDot, enclosedDateDot, titleDot, theEditorAndTranslatorDot, tempJVIP) : spaced$1(titleDot, enclosedDateDot, theEditorAndTranslatorDot, tempJVIP);
			case "ArticleInAPeriodical": return theAuthorDot ? spaced$1(theAuthorDot, enclosedDateDot, titleDot, theEditorAndTranslatorDot, tempPTVI) : spaced$1(titleDot, enclosedDateDot, theEditorAndTranslatorDot, tempPTVI);
			case "ConferenceProceedings":
				if (theAuthorDot) {
					const conference = theEditorEnc ? join(general$1.Space, xsl$6.stringFormat(strings$1.InNameCap, conferenceName ? join(theEditorEnc, general$1.ListSeparator, conferenceNameItalic()) : theEditorEnc + general$1.Dot)) : conferenceName ? join(general$1.Space, conferenceNameItalic()) : [];
					return join(spaced$1(theAuthorDot, enclosedDateDot, titleDot), conference, ...conferenceVolumeAndPages, tempCP ? general$1.Space + tempCP : "");
				}
				return join(titleDot, (title ? general$1.Space : "") + enclosedDateDot, conferenceName ? join(general$1.Space, conferenceNameItalic()) : "", ...conferenceVolumeAndPages, tempCP ? general$1.Space + tempCP : "");
			case "SoundRecording": return theAuthorSoundRecordingDot ? spaced$1(theAuthorSoundRecordingDot, enclosedDateDot, thePerformerAndConductorDot ? title + general$1.Space + thePerformerAndConductorDot : titleDot, albumTitleMediumDot, tempCSCPr) : spaced$1(titleDot, enclosedDateDot, thePerformerAndConductorDot, albumTitleMediumDot, tempCSCPr);
			case "Performance": return theAuthorPerformanceDot ? spaced$1(theAuthorPerformanceDot, enclosedDateDot, titleDot ? applyItalic$1(titleDot) : "", thePerformanceDirectorAndPerformerDot, tempTCSC) : spaced$1(titleDot ? applyItalic$1(titleDot) : "", enclosedDateDot, tempTCSC);
			case "DocumentFromInternetSite": return theAuthorDot ? spaced$1(theAuthorDot, enclosedDateDot, titleDot ? applyItalic$1(titleDot) : "", theEditorAndTranslatorDot) : spaced$1(titleDot ? applyItalic$1(titleDot) : "", enclosedDateDot, theEditorAndTranslatorDot);
			case "InternetSite": return theAuthorDot ? spaced$1(theAuthorDot, enclosedDateDot, tempTV, theInternetSiteEditorAndProducerDot) : spaced$1(tempTV, enclosedDateDot, theInternetSiteEditorAndProducerDot);
			case "Case": {
				const courtAndDate = court || dateCourt ? enclose(court + (court && dateCourt ? general$1.Space : "") + dateCourt) : "";
				return join(title, field("CaseNumber") ? (title ? general$1.ListSeparator : "") + field("CaseNumber") : "", courtAndDate ? (title || field("CaseNumber") ? general$1.Space : "") + courtAndDate : "", title || field("CaseNumber") || court || dateCourt ? general$1.Dot : "");
			}
			case "Patent": {
				const inventorLFDot = xsl$6.appendDot(roleText("Inventor"));
				const patentNumber = field("PatentNumber");
				return join(spaced$1(inventorLFDot, enclosedDateDot), patentNumber ? applyItalic$1(join(general$1.Space, field("CountryRegion") ? field("CountryRegion") + general$1.Space : "", xsl$6.stringFormatDot(strings$1.PatentNumberShortCap, patentNumber))) : "");
			}
			case "Misc": return theMiscAuthorDot ? spaced$1(theMiscAuthorDot, enclosedDateDot, titleDot, withoutBoundaries(tempPVIEP), theMiscEditorAndTranslatorAndCompilerDot, tempCSCPu) : spaced$1(titleDot, enclosedDateDot, withoutBoundaries(tempPVIEP), theMiscEditorAndTranslatorAndCompilerDot, tempCSCPu);
			case "ElectronicSource": return theMiscAuthorDot ? spaced$1(theMiscAuthorDot, enclosedDateDot, titleDot, has(tempPVEP) ? copyOf(tempPVEP) : "", theMiscEditorAndTranslatorAndCompilerDot, tempCSCPu) : spaced$1(titleDot, enclosedDateDot, withoutBoundaries(tempPVEP), theMiscEditorAndTranslatorAndCompilerDot, tempCSCPu);
			case "Art": {
				const artistLFDot = xsl$6.appendDot(roleText("Artist"));
				const publicationTitleDot = xsl$6.appendDot(field("PublicationTitle"));
				return join(artistLFDot, general$1.Space + enclosedDateDot, titleDot ? join(artistLFDot ? general$1.Space : "", publicationTitleDot ? titleDot : applyItalic$1(titleDot)) : "", publicationTitleDot ? join(before(artistLFDot, titleDot) ? general$1.Space : "", applyItalic$1(publicationTitleDot)) : "", tempICSC ? (before(artistLFDot, titleDot, publicationTitleDot) ? general$1.Space : "") + tempICSC : "");
			}
			case "Report": return spaced$1(authorDot, enclosedDateDot, titleDot ? applyItalic$1(titleDot) : "", ...publisher ? [tempID, tempCP] : [tempRIDC]);
			case "Film": return join(theFilmProducerAndWriterAndDirectorDot ? join(spaced$1(theFilmProducerAndWriterAndDirectorDot, enclosedDateDot, title ? applyItalic$1(title) : "")) : join(title ? applyItalic$1(title) : "", (title ? general$1.Space : "") + enclosedDateDot), general$1.Space + style.SecondaryOpen + strings$1.MotionPictureCap + style.SecondaryClose + general$1.Dot, tempCD ? general$1.Space + tempCD : "");
			default: {
				const intervieweeLFDot = xsl$6.appendDot(roleText("Interviewee"));
				const interviewTitleDot = xsl$6.appendDot(title);
				const broadcasterDot = xsl$6.appendDot(field("Broadcaster"));
				return field("Broadcaster") ? spaced$1(intervieweeLFDot, enclosedDateDot, interviewTitleDot, xsl$6.appendDot(field("BroadcastTitle")) ? applyItalic$1(xsl$6.appendDot(field("BroadcastTitle"))) : "", theInterviewInterviewer, broadcasterDot, tempSC) : spaced$1(intervieweeLFDot, enclosedDateDot, interviewTitleDot, tempPrP, theInterviewInterviewerAndEditorAndTranslator, tempCSCPu);
			}
		}
	};
	/**
	* A source's entry: its parts, as a copy of a variable, then where it was read online, as the paragraph of the
	* bibliography is written (`xsl:element name="p"`)
	*/
	var paragraphOf$1 = (source) => {
		const entry = entryOf$1(source);
		const retrieved = templateRDAFU(source);
		return resolveBoundaries(join(has(entry) ? join(copyOf(entry), retrieved ? general$1.Space : "") : "", retrieved));
	};
	/** APA, sixth edition: Word's `APASixthEditionOfficeOnline.xsl` */
	var apa = {
		name: "APA",
		file: "APASixthEditionOfficeOnline.xsl",
		version: "6",
		citation: citation$4,
		bibliography: (sources) => ({
			paragraphs: sortByKey(sources, sortingStringOf$6).map(paragraphOf$1),
			hangingIndent: true
		})
	};
	//#endregion
	//#region src/bibliography/styles/chicago-family.ts
	/**
	* The templates Word's two styles from the Chicago Manual of Style share, Chicago (CHICAGO.XSL) and Turabian
	* (TURABIAN.XSL): they write the same citations, find the people a source is named by and sort their bibliographies in
	* the same way, and write some parts of an entry, such as the city and the publisher, alike.
	*
	* Each function follows the XSL template its description names, as both styles have it.
	*
	* @module
	*/
	var { General: General$8, Strings: Strings$7, Chicago: Chicago$2 } = LOCALS;
	var xsl$5 = xslTemplates(General$8);
	/** The parts, when the test passes: a text that isn't empty, or true */
	var when = (test, ...parts) => test ? join(...parts) : [];
	/** A space, when any of the texts isn't empty, as the styles write one between the parts of an entry */
	var spaceIf = (...texts) => texts.some((text) => text.length > 0) ? General$8.Space : "";
	/** ", " when any of the texts isn't empty, as a citation separates its volume or pages from what comes before them */
	var listSeparatorIf = (...texts) => texts.some((text) => text.length > 0) ? General$8.ListSeparator : "";
	/** The text with its spaces at the start and end removed, and each run of them made one space, as XPath's `normalize-space` */
	var normalizeSpace$1 = (text) => text.replace(/[ \t\r\n]+/g, " ").trim();
	/** A format with one text in place of %1, or "" when the text is empty, as the styles' `StringFormat` calls are guarded */
	var formatIf = (format, text) => text ? textOf(xsl$5.stringFormat(format, text)) : "";
	/** A volume, as "Vol. 2", or "Vols. 2-3" for more than one (the styles' choice of `VolumeShortCap` and `VolumesShortCap`) */
	var volumeFormatOf$2 = (volume, single, several) => volume.includes(",") || translate(volume, General$8.Hyphens, "").length !== volume.length ? several : single;
	/**
	* The word for one or more people, such as "Trans.", then their names, and a dot (`prefixTranslatorDot` and others). Its
	* people are editors, translators, conductors, composers or compilers, who are never an organization, so the list has a
	* name only when it has people
	*/
	var prefixed = (text, count, single, several) => text ? (count > 1 ? several : single) + General$8.Space + xsl$5.appendDot(text) : "";
	/**
	* A list of people last name first, ", " and the word for one or more of them, such as "ed." (`sufixEditorLFDot` and
	* others). Its people are editors, compilers or translators, who are never an organization, so the list has a name only
	* when it has people
	*/
	var suffixed = (text, count, single, several) => text ? text + General$8.ListSeparator + (count > 1 ? several : single) : "";
	/** A title in quotes */
	var quoted = (text) => General$8.OpenQuote + text + General$8.CloseQuote;
	/** The text of a role's people, their names one after another, or of its organization, as XPath reads `b:Author/b:Editor` */
	var roleTextOf = (names) => names === void 0 ? "" : "corporate" in names ? names.corporate : names.people.map((person) => person.last + person.first + person.middle).join("");
	/** How many people have a role, as `count(b:Author/b:Editor/b:NameList/b:Person)` */
	var countOf$2 = (names) => names !== void 0 && "people" in names ? names.people.length : 0;
	var MAIN_CONTRIBUTORS$1 = {
		Book: [
			"Author",
			"Editor",
			"Translator"
		],
		BookSection: ["Author", "BookAuthor"],
		JournalArticle: ["Author", "Editor"],
		ArticleInAPeriodical: ["Author", "Editor"],
		ConferenceProceedings: ["Author"],
		Report: ["Author"],
		SoundRecording: [
			"Performer",
			"Conductor",
			"Composer",
			"Artist"
		],
		Performance: [
			"Writer",
			"Performer",
			"Director"
		],
		Art: ["Artist"],
		DocumentFromInternetSite: ["Author"],
		InternetSite: ["Author"],
		Film: [
			"Writer",
			"Performer",
			"Director"
		],
		Interview: [
			"Interviewee",
			"Editor",
			"Translator"
		],
		Patent: [
			"Inventor",
			"Editor",
			"Translator"
		],
		ElectronicSource: ["Author", "Editor"],
		Case: ["Author"],
		Misc: [
			"Author",
			"Editor",
			"Compiler",
			"Translator"
		]
	};
	/** The role a source is named by: the first of its type's roles that has a name (`MainContributors`) */
	var mainContributorOf = (source) => MAIN_CONTRIBUTORS$1[source.type].find((role) => roleTextOf(source.names[role]).length > 0);
	/** The people or the organization a source is named by, as `populateMain` copies them to `b:Author/b:Main` */
	var mainOf$2 = (source) => {
		const role = mainContributorOf(source);
		return role === void 0 ? void 0 : source.names[role];
	};
	var CITATION_TITLES$1 = {
		BookSection: "BookTitle",
		ArticleInAPeriodical: "PeriodicalTitle",
		InternetSite: "InternetSiteTitle",
		DocumentFromInternetSite: "InternetSiteTitle",
		ElectronicSource: "PublicationTitle",
		Art: "PublicationTitle",
		Misc: "PublicationTitle",
		SoundRecording: "AlbumTitle",
		Interview: "BroadcastTitle"
	};
	/** A source's title in a citation: its title, or its short title, or the title of what it's in (`populateMain`) */
	var citationTitleOf$1 = (source) => {
		const fallback = CITATION_TITLES$1[source.type];
		return fieldOf(source, "Title") || fieldOf(source, "ShortTitle") || (fallback === void 0 ? "" : fieldOf(source, fallback));
	};
	/** The year, or "n.d." (`getYear`) */
	var getYear = (source) => fieldOf(source, "Year") || Strings$7.NoDateShortUnCap;
	/** The first, the second after ": ", and the third after ", ", of those that aren't empty (`templateANoDot`) */
	var templateANoDot = (first, second, third) => first + (first && second ? General$8.EnumSeparator : "") + second + ((first || second) && third ? General$8.ListSeparator : "") + third;
	/** {@link templateANoDot}, with a dot after it (`templateA`) */
	var templateA$1 = (first, second, third) => xsl$5.appendDot(templateANoDot(first, second, third));
	/** The first and the second, with a space between them, and a dot after (`templateSpaceAB`) */
	var templateSpaceAB = (first, second) => xsl$5.appendDot(first + (first && second ? General$8.Space : "") + second);
	/** The first and the second, with ", " between them, and a dot after (`templateC`) */
	var templateC$1 = (first, second) => xsl$5.appendDot(first + (first && second ? General$8.ListSeparator : "") + second);
	/** The first, the second after ", ", and the third after ": ", with a dot after (`templateE`) */
	var templateE$1 = (first, second, third) => xsl$5.appendDot(first + (first && second ? General$8.ListSeparator : "") + second + ((first || second) && third ? General$8.EnumSeparator : "") + third);
	/** The city, and the state or province (`templateCityStateProvince`) */
	var templateCityStateProvince = (source) => {
		const city = fieldOf(source, "City");
		const state = fieldOf(source, "StateProvince");
		return city + (city && state ? General$8.ListSeparator : "") + state;
	};
	/** The country and the patent's number, such as "United States Patent 7,123,456." (`templateCP`) */
	var templateCP = (source) => templateSpaceAB(fieldOf(source, "CountryRegion"), formatIf(Strings$7.PatentCap, fieldOf(source, "PatentNumber")));
	/**
	* The items of a list, with a space before them, or nothing when the list is empty (`PrintSpaceAndList`)
	*/
	var printSpaceAndList = (items) => {
		const list = xsl$5.printList(items);
		return when(textOf(list), General$8.Space, list);
	};
	/**
	* The text a bibliography is sorted by: the authors, a periodical's title, the title, and whether the source is named
	* by its authors, editors, compilers or translators (`b:SortingString`, from `populateMain`)
	*
	* @param formatPersonsAuthor - The style's list of a source's authors
	*/
	var sortingStringOf$5 = (source, formatPersonsAuthor) => {
		const role = mainContributorOf(source);
		const author = formatPersonsAuthor(mainOf$2(source));
		const periodicalTitle = fieldOf(source, "PeriodicalTitle");
		const title = fieldOf(source, "Title");
		const order = role === "Editor" ? "2" : role === "Compiler" ? "3" : role === "Translator" ? "4" : "1";
		return `${author && source.type !== "Case" ? ` ${author}` : ""}${periodicalTitle && source.type === "ArticleInAPeriodical" ? ` ${periodicalTitle}` : ""}${title ? ` ${title}` : ""} ${order}`;
	};
	/**
	* A source of a citation, such as "(Baker 2010, 50)", with its authors, the title when another source has the same
	* authors, and the year (`b:Citation`)
	*/
	var citation$3 = (cited) => {
		var _cited$prefix, _cited$suffix;
		const { source } = cited;
		const title0 = fieldOf(source, "ShortTitle") || citationTitleOf$1(source);
		const yearSimple = fieldOf(source, "Year");
		const year0 = yearSimple || Strings$7.NoDateShortUnCap;
		const main = mainOf$2(source);
		const minAuthors = cited.minAuthors > 1 ? cited.minAuthors : 1;
		const patterns = cited.nonUniqueLastName ? Chicago$2.CitationLong : Chicago$2.CitationShort;
		const people = main !== void 0 && "people" in main ? main.people : [];
		const cAuthors = people.length;
		const author0 = main !== void 0 && "corporate" in main ? main.corporate : people.map((person, index) => {
			const position = index + 1;
			return (cAuthors > 3 && position > minAuthors ? "" : xsl$5.formatName(person, patterns)) + (cAuthors > 3 && position === minAuthors ? General$8.ListSeparator + Strings$7.AndOthersUnCap : cAuthors > 3 && position > minAuthors ? "" : cAuthors - 1 === position && (cAuthors === 2 || cAuthors === 3) || cAuthors > 3 && position === 2 ? General$8.Space + Strings$7.AndUnCap + General$8.Space : cAuthors > position && position < 3 ? General$8.AuthorsSeparator : "");
		}).join("");
		const title = cited.hideTitle ? "" : title0;
		const year = cited.hideYear ? "" : year0;
		const author = cited.hideAuthor ? "" : author0;
		const { volume, pages } = cited;
		const volVolume = formatIf(volumeFormatOf$2(volume, Strings$7.VolumeShortUnCap, Strings$7.VolumesShortUnCap), volume);
		const displayTitle = !author || cited.repeatedAuthor ? title : "";
		const nothing = !author0 && !title0 && !yearSimple;
		return join(cited.first ? General$8.OpenBracket : "", (_cited$prefix = cited.prefix) !== null && _cited$prefix !== void 0 ? _cited$prefix : "", author, when(displayTitle, author ? General$8.ListSeparator : "", displayTitle), nothing ? source.tag : "", when(year && !nothing, spaceIf(author, displayTitle), year), when(volume || pages, listSeparatorIf(author, displayTitle, year), volume && pages ? volume + General$8.Enum + pages : volVolume || pages), (_cited$suffix = cited.suffix) !== null && _cited$suffix !== void 0 ? _cited$suffix : "", cited.last ? General$8.CloseBracket : General$8.ListSeparator);
	};
	/**
	* A bibliography: its sources sorted, each written as an entry with its authors, or with a dash for the authors of an
	* entry with the same authors as the one before it (`b:Bibliography`)
	*
	* @param formatPersonsAuthor - The style's list of a source's authors (`formatPersonsAuthor`)
	* @param bibliographyEntry - The style's entry of a source, given its authors or the dash
	*/
	var bibliographyOf = (sources, formatPersonsAuthor, bibliographyEntry) => {
		const sorted = sortByKey(sources, (source) => sortingStringOf$5(source, formatPersonsAuthor));
		const mains = sorted.map((source) => formatPersonsAuthor(mainOf$2(source)));
		return {
			hangingIndent: true,
			paragraphs: sorted.map((source, index) => bibliographyEntry(source, index > 0 && mains[index] === mains[index - 1] && mains[index].length > 0 ? Chicago$2.SameAuthor : mains[index]))
		};
	};
	//#endregion
	//#region src/bibliography/styles/chicago.ts
	/**
	* Chicago, the author-date style of the Chicago Manual of Style (16th edition), written from Word's own (CHICAGO.XSL).
	*
	* Each function follows the XSL template its description names, including where that doesn't do what it looks like it
	* should, so citations and bibliographies are written as Word writes them when it updates a document's fields.
	*
	* @module
	*/
	var { General: General$7, Strings: Strings$6, Chicago: Chicago$1, APA: APA$2 } = LOCALS;
	var xsl$4 = xslTemplates(General$7);
	/** A format of a date, such as "%D %M", with each %D, %M and %Y replaced by the day, month and year (`StringFormatDate`) */
	var stringFormatDate = (format, day, month, year) => format.replace(/%([DMY])/g, (_match, code) => code === "D" ? day : code === "M" ? month : year);
	/**
	* What comes after a person in a list of a source's authors: a comma, "and", or "et al." after the seventh of 11 or more
	* (`formatPersonSeparator`)
	*/
	var formatPersonSeparator$3 = (position, count) => {
		if (count < 11) return position === count ? "" : position === count - 1 ? General$7.ListSeparator + Strings$6.AndUnCap + General$7.Space : General$7.ListSeparator;
		return position > 7 ? "" : position === 7 ? General$7.ListSeparator + Strings$6.AndOthersUnCap : General$7.ListSeparator;
	};
	/** What comes after a person in a list of other contributors, such as editors (`formatPersonSeparator2`) */
	var formatPersonSeparator2 = (position, count) => {
		if (count < 11) return position === count ? "" : position === count - 1 ? General$7.Space + Strings$6.AndUnCap + General$7.Space : General$7.ListSeparator;
		return position > 7 ? "" : position === 7 ? General$7.ListSeparator + Strings$6.AndOthersUnCap : General$7.ListSeparator;
	};
	/**
	* People as a source's authors are listed: the first last name first, the others first name first, and only the first
	* seven of 11 or more; or the organization (`formatPersonsAuthor`)
	*/
	var formatPersonsAuthor$2 = (names) => {
		if (names === void 0) return "";
		if ("corporate" in names) return names.corporate;
		const count = names.people.length;
		return names.people.map((person, index) => {
			const position = index + 1;
			const patterns = position === 1 ? Chicago$1.MainAuthor : count < 11 || position < 8 ? Chicago$1.OtherAuthors : void 0;
			return (patterns === void 0 ? "" : xsl$4.formatName(person, patterns)) + formatPersonSeparator$3(position, count);
		}).join("");
	};
	/** People as a source's other contributors are listed, such as its editors, first name first (`formatPersons`) */
	var formatPersons$4 = (names) => {
		if (names === void 0) return "";
		if ("corporate" in names) return names.corporate;
		const count = names.people.length;
		return names.people.map((person, index) => {
			const position = index + 1;
			return (count < 11 || position < 8 ? xsl$4.formatName(person, Chicago$1.SecondaryAuthors) : "") + formatPersonSeparator2(position, count);
		}).join("");
	};
	/** The month and the day, such as "9 January", when the source has a year and a month (`getMonthDay`) */
	var getMonthDay = (source) => {
		const month = fieldOf(source, "Month");
		if (!fieldOf(source, "Year") || !month) return "";
		const day = fieldOf(source, "Day");
		return stringFormatDate(day ? Chicago$1.Date.DM : General$7.SimpleDate.M, day, month, "");
	};
	/**
	* The date a source was read, such as "February 3, 2022", with the pattern for the parts it has (`formatDateAccessed`,
	* with Chicago's `formatDateCore` and `formatDateCorePrivate`, which write a month and a day without a year)
	*/
	var formatDateAccessed$1 = (source) => {
		const day = fieldOf(source, "DayAccessed");
		const month = fieldOf(source, "MonthAccessed");
		const year = fieldOf(source, "YearAccessed");
		const patterns = APA$2.DateAccessed;
		return stringFormatDate(!year ? month ? day ? patterns.DM : General$7.SimpleDate.M : "" : !month ? General$7.SimpleDate.Y : !day ? patterns.MY : patterns.DMY, day, month, year);
	};
	/** The month and day, the edition and the pages, such as "5 June, Late ed.: 10-12." (`templateMDEP`) */
	var templateMDEP = (source) => {
		const edition = fieldOf(source, "Edition");
		return templateE$1(getMonthDay(source), edition ? textOf(xsl$4.stringFormat(Strings$6.EditionShortUnCap, edition)) : "", fieldOf(source, "Pages"));
	};
	/** The recording number and the medium, each with a dot after it (`templateRM`) */
	var templateRM = (source) => {
		const recordingNumber = fieldOf(source, "RecordingNumber");
		const medium = fieldOf(source, "Medium");
		return xsl$4.appendDot(recordingNumber) + (recordingNumber && medium ? General$7.Space : "") + xsl$4.appendDot(medium);
	};
	/** The court, the city and the month and day, in brackets, such as "(Supreme Court, Washington 28 June)." (`templateCCMD`) */
	var templateCCMD = (source) => {
		const monthDay = getMonthDay(source);
		const court = fieldOf(source, "Court");
		const city = fieldOf(source, "City");
		return xsl$4.appendDot(court || city || monthDay ? General$7.OpenBracket + court + (court && (city || monthDay) ? General$7.ListSeparator : "") + (city || monthDay ? city + (city && monthDay ? General$7.Space : "") + monthDay : "") + General$7.CloseBracket : "");
	};
	/** A journal's publisher, volume, issue and pages, such as "(Baking Society) 12 (4): 233-250." (`templatePVIP`) */
	var templatePVIP = (source) => {
		const publisher = fieldOf(source, "Publisher");
		const volume = fieldOf(source, "Volume");
		const issue = fieldOf(source, "Issue");
		const pages = fieldOf(source, "Pages");
		return xsl$4.appendDot((publisher ? General$7.OpenBracket + publisher + General$7.CloseBracket : "") + (volume ? (publisher ? General$7.Space : "") + volume : "") + (issue ? (publisher || volume ? General$7.Space : "") + General$7.OpenBracket + issue + General$7.CloseBracket : "") + ((volume || issue) && pages ? General$7.EnumSeparator : "") + (pages ? (publisher || volume || issue ? General$7.Space : "") + pages : ""));
	};
	/** The city, the publisher, and the month and day in brackets, or the pages (`templateCPMDP`) */
	var templateCPMDP = (source) => {
		const monthDay = getMonthDay(source);
		const pages = fieldOf(source, "Pages");
		const text = templateA$1(templateCityStateProvince(source), fieldOf(source, "Publisher"), (monthDay ? General$7.OpenBracket + monthDay + General$7.CloseBracket : "") + (pages && monthDay ? General$7.EnumSeparator + pages : ""));
		return text + (pages && !monthDay ? (text ? General$7.Space : "") + xsl$4.appendDot(pages) : "");
	};
	/** When a website was read, and its address, such as "Accessed February 3, 2022. https://example.com." (`templateDAUD`) */
	var templateDAUD = (source) => {
		const dateAccessed = formatDateAccessed$1(source);
		const url = fieldOf(source, "URL");
		return (dateAccessed ? xsl$4.appendDot(textOf(xsl$4.stringFormat(Strings$6.AccessedCap, dateAccessed))) : "") + (url ? (dateAccessed ? General$7.Space : "") + xsl$4.appendDot(url) : "");
	};
	/** A report's type, department, institution, city and publisher, and pages (`templateRICP`) */
	var templateRICP = (source) => textOf(xsl$4.printList([
		fieldOf(source, "ThesisType"),
		fieldOf(source, "Department"),
		fieldOf(source, "Institution"),
		templateANoDot(templateCityStateProvince(source), fieldOf(source, "Publisher"), ""),
		fieldOf(source, "Pages")
	]));
	/**
	* A source's entry in the bibliography, as the style writes the paragraph (`b:Bibliography`)
	*
	* @param authorMain - Its authors, or a dash when they're the authors of the entry before it
	*/
	var bibliographyEntry$1 = (source, authorMain) => {
		const field = (name) => fieldOf(source, name);
		const names = (role) => source.names[role];
		const cEditors = countOf$2(names("Editor"));
		const cTranslators = countOf$2(names("Translator"));
		const cComposers = countOf$2(names("Composer"));
		const cCompilers = countOf$2(names("Compiler"));
		const cProducers = countOf$2(names("ProducerName"));
		const cConductors = countOf$2(names("Conductor"));
		const author = formatPersonsAuthor$2(names("Author"));
		const compiler = formatPersons$4(names("Compiler"));
		const compilerLF = formatPersonsAuthor$2(names("Compiler"));
		const editor = formatPersons$4(names("Editor"));
		const editorLF = formatPersonsAuthor$2(names("Editor"));
		const translator = formatPersons$4(names("Translator"));
		const translatorLF = formatPersonsAuthor$2(names("Translator"));
		const performer = formatPersons$4(names("Performer"));
		const intervieweeLF = formatPersonsAuthor$2(names("Interviewee"));
		const producerName = formatPersons$4(names("ProducerName"));
		const interviewer = formatPersons$4(names("Interviewer"));
		const writer = formatPersons$4(names("Writer"));
		const writerLF = formatPersonsAuthor$2(names("Writer"));
		const director = formatPersons$4(names("Director"));
		const inventorLF = formatPersonsAuthor$2(names("Inventor"));
		const bookAuthor = formatPersons$4(names("BookAuthor"));
		const performerLF = formatPersonsAuthor$2(names("Performer"));
		const conductorLF = formatPersonsAuthor$2(names("Conductor"));
		const conductor = formatPersons$4(names("Conductor"));
		const composerLF = formatPersonsAuthor$2(names("Composer"));
		const composer = formatPersons$4(names("Composer"));
		const artist = formatPersonsAuthor$2(names("Artist"));
		const writerLFDot = xsl$4.appendDot(writerLF);
		const monthDayDot = xsl$4.appendDot(getMonthDay(source));
		const yearDot = xsl$4.appendDot(getYear(source));
		const tempCSPP = templateA$1(templateCityStateProvince(source), field("Publisher"), "");
		const tempRICP = templateRICP(source);
		const tempCPMDP = templateCPMDP(source);
		const tempMDEP = templateMDEP(source);
		const tempRM = templateRM(source);
		const tempTC = templateC$1(field("Theater"), field("City"));
		const tempIC = templateC$1(field("Institution"), field("City"));
		const tempCPMD = templateA$1(templateCityStateProvince(source), field("Publisher"), getMonthDay(source));
		const tempSC = templateC$1(field("Station"), field("City"));
		const tempCP = templateCP(source);
		const tempCCMD = templateCCMD(source);
		const tempPVIP = templatePVIP(source);
		const tempDAUD = templateDAUD(source);
		const titleDot = xsl$4.appendDot(field("Title"));
		const albumTitleDot = xsl$4.appendDot(field("AlbumTitle"));
		const pagesDot = xsl$4.appendDot(field("Pages"));
		const bookTitleDot = xsl$4.appendDot(field("BookTitle"));
		const conferenceNameDot = xsl$4.appendDot(field("ConferenceName"));
		const broadcasterDot = xsl$4.appendDot(field("Broadcaster"));
		const interviewTitle = field("Title");
		const publisher = field("Publisher");
		const publicationTitle = field("PublicationTitle");
		const publicationTitleDot = xsl$4.appendDot(publicationTitle);
		const institutionDot = xsl$4.appendDot(field("Institution"));
		const journalName = field("JournalName");
		const journalNameDot = xsl$4.appendDot(journalName);
		const internetSiteTitleDot = xsl$4.appendDot(field("InternetSiteTitle"));
		const mediumDot = xsl$4.appendDot(field("Medium"));
		const issueDot = xsl$4.appendDot(field("Issue"));
		const distributorDot = xsl$4.appendDot(field("Distributor"));
		const numberVolumesDot = xsl$4.appendDot(formatIf(Strings$6.VolumesAfterShortUnCap, field("NumberVolumes")));
		const noIssueDot = xsl$4.appendDot(formatIf(Strings$6.NumberShortUnCap, field("Issue")));
		const editionDot = xsl$4.appendDot(field("Edition"));
		const broadcastTitle = field("BroadcastTitle");
		const versionDot = xsl$4.appendDot(field("Version"));
		const broadcastTitleDot = xsl$4.appendDot(broadcastTitle);
		const periodicalTitle = field("PeriodicalTitle");
		const periodicalTitleDot = xsl$4.appendDot(periodicalTitle);
		const productionCompany = field("ProductionCompany");
		const volume = field("Volume");
		const prefixVersionDot = versionDot ? Strings$6.VersionShortCap + General$7.Space + versionDot : "";
		const prefixEditorDot = prefixed(editor, cEditors, Strings$6.EditorShortCap, Strings$6.EditorShortCap);
		const prefixTranslatorDot = prefixed(translator, cTranslators, Strings$6.TranslatorShortCap, Strings$6.TranslatorsShortCap);
		const sufixEditorLFDot = suffixed(editorLF, cEditors, Strings$6.EditorShortUnCap, Strings$6.EditorsShortUnCap);
		const prefixConductorDot = prefixed(conductor, cConductors, Strings$6.ConductorShortCap, Strings$6.ConductorsShortCap);
		const prefixComposerDot = prefixed(composer, cComposers, Strings$6.ComposerShortCap, Strings$6.ComposersShortCap);
		const prefixCompilerDot = prefixed(compiler, cCompilers, Strings$6.CompilerShortCap, Strings$6.CompilersShortCap);
		const sufixCompilerLFDot = suffixed(compilerLF, cCompilers, Strings$6.CompilerShortUnCap, Strings$6.CompilersShortUnCap);
		const sufixTranslatorLFDot = suffixed(translatorLF, cTranslators, Strings$6.TranslatorShortUnCap, Strings$6.TranslatorsShortUnCap);
		const prefixVolume = formatIf(volumeFormatOf$2(volume, Strings$6.VolumeShortCap, Strings$6.VolumesShortCap), volume);
		const prefixVolumeDot = xsl$4.appendDot(prefixVolume);
		const bookTitle = field("BookTitle");
		const inBook = bookTitleDot !== "" && prefixVolumeDot !== "";
		const volumeBookTitle = join(prefixVolume, inBook ? General$7.ListSeparator : "", bookTitle ? xsl$4.stringFormat(inBook ? Strings$6.InNameUnCap : Strings$6.InNameCap, applyItalic$1(bookTitle)) : "");
		const theCapShortPrefixVolumeDot = prefixVolumeDot;
		const prodDot = xsl$4.appendDot(producerName || productionCompany);
		const prod = producerName || productionCompany;
		const prefixProdDot = producerName || productionCompany ? (cProducers > 1 ? Strings$6.ProducersShortCap + General$7.Space : cProducers === 1 ? Strings$6.ProducerShortCap + General$7.Space : "") + prodDot : "";
		const authorDot = xsl$4.appendDot(author);
		const sectionAuthorDot = authorDot;
		const bookAuthorDot = xsl$4.appendDot(bookAuthor);
		const performerLFDot = xsl$4.appendDot(performerLF);
		const artistDot = xsl$4.appendDot(artist);
		const interviewerDot = xsl$4.appendDot(interviewer);
		const intervieweeLFDot = xsl$4.appendDot(intervieweeLF);
		const conductorLFDot = xsl$4.appendDot(conductorLF);
		const inventorLFDot = xsl$4.appendDot(inventorLF);
		const writerDot = xsl$4.appendDot(writer);
		const composerLFDot = xsl$4.appendDot(composerLF);
		const theAuthorSufixDot = xsl$4.appendDot(author ? authorMain : editorLF && [
			"Book",
			"Misc",
			"ArticleInAPeriodical",
			"ConferenceProceedings",
			"InternetSite",
			"DocumentFromInternetSite"
		].includes(source.type) ? suffixed(editorLF, cEditors, Strings$6.EditorShortUnCap, Strings$6.EditorsShortUnCap) : compilerLF && source.type === "Misc" ? suffixed(compilerLF, cCompilers, Strings$6.CompilerShortUnCap, Strings$6.CompilersShortUnCap) : translatorLF && (source.type === "Book" || source.type === "Misc") ? suffixed(translatorLF, cTranslators, Strings$6.TranslatorShortUnCap, Strings$6.TranslatorsShortUnCap) : "");
		const theUnCapLongByAuthor = formatIf(Strings$6.ByUnCap, bookAuthor);
		const theCapLongByAuthor = formatIf(Strings$6.ByCap, bookAuthor);
		const theCapLongPrefixEditorDot = xsl$4.appendDot(author ? formatIf(Strings$6.EditedByCap, editor) : "");
		const theCapLongPrefixCompilerDot = xsl$4.appendDot(author || editor ? formatIf(Strings$6.CompiledByCap, compiler) : "");
		const theCapLongPrefixTranslatorDot = xsl$4.appendDot(author || editor || compiler ? formatIf(Strings$6.TranslatedByCap, translator) : "");
		const theCapLongPrefixEditedBy = formatIf(Strings$6.EditedByCap, editor);
		const theCapLongPrefixEditedByDot = xsl$4.appendDot(theCapLongPrefixEditedBy);
		const theUnCapLongPrefixEditedBy = formatIf(Strings$6.EditedByUnCap, editor);
		const theUnCapLongPrefixEditedByDot = xsl$4.appendDot(theUnCapLongPrefixEditedBy);
		const theCapLongPrefixTranslatedBy = formatIf(Strings$6.TranslatedByCap, translator);
		const theCapLongPrefixTranslatedByDot = xsl$4.appendDot(theCapLongPrefixTranslatedBy);
		const theUnCapLongPrefixTranslatedBy = formatIf(Strings$6.TranslatedByUnCap, translator);
		const theUnCapLongPrefixTranslatedByDot = xsl$4.appendDot(theUnCapLongPrefixTranslatedBy);
		const theCPAuthorSufixDot = xsl$4.appendDot(author ? authorMain : suffixed(editorLF, cEditors, Strings$6.EditorShortUnCap, Strings$6.EditorsShortUnCap));
		const theCPCapLongPrefixEditorDot = theCapLongPrefixEditorDot;
		const theCapLongPrefixDirectedByDot = xsl$4.appendDot(formatIf(Strings$6.DirectedByCap, director));
		const theCapLongPrefixPerformedByDot = xsl$4.appendDot(formatIf(Strings$6.PerformedByCap, performer));
		const theCapLongPrefixProducedByDot = xsl$4.appendDot(formatIf(Strings$6.ProducedByCap, prod));
		const entry = {
			Book: () => join(theAuthorSufixDot, when(yearDot, spaceIf(theAuthorSufixDot), yearDot), when(titleDot, spaceIf(theAuthorSufixDot, yearDot), applyItalic$1(titleDot)), when(editionDot, spaceIf(theAuthorSufixDot, yearDot, titleDot), editionDot), when(theCapLongPrefixEditorDot, spaceIf(theAuthorSufixDot, yearDot, titleDot, editionDot), theCapLongPrefixEditorDot), when(theCapLongPrefixTranslatorDot, spaceIf(theAuthorSufixDot, yearDot, titleDot, theCapLongPrefixEditorDot, editionDot), theCapLongPrefixTranslatorDot), when(theCapShortPrefixVolumeDot, spaceIf(theAuthorSufixDot, yearDot, titleDot, theCapLongPrefixEditorDot, theCapLongPrefixTranslatorDot, editionDot), theCapShortPrefixVolumeDot), when(numberVolumesDot, spaceIf(theAuthorSufixDot, yearDot, titleDot, theCapLongPrefixEditorDot, theCapLongPrefixTranslatorDot, theCapShortPrefixVolumeDot, editionDot), numberVolumesDot), when(tempCSPP, spaceIf(theAuthorSufixDot, yearDot, titleDot, theCapLongPrefixEditorDot, theCapLongPrefixTranslatorDot, theCapShortPrefixVolumeDot, editionDot, numberVolumesDot), tempCSPP)),
			ConferenceProceedings: () => join(theCPAuthorSufixDot, when(yearDot, spaceIf(theCPAuthorSufixDot), yearDot), when(titleDot, spaceIf(theCPAuthorSufixDot, yearDot), quoted(titleDot)), when(theCPCapLongPrefixEditorDot, spaceIf(theCPAuthorSufixDot, yearDot, titleDot), theCPCapLongPrefixEditorDot), when(conferenceNameDot, spaceIf(theCPAuthorSufixDot, yearDot, titleDot, theCPCapLongPrefixEditorDot), applyItalic$1(conferenceNameDot)), when(tempCSPP, spaceIf(theCPAuthorSufixDot, yearDot, titleDot, theCPCapLongPrefixEditorDot, conferenceNameDot), tempCSPP), when(pagesDot, spaceIf(theCPAuthorSufixDot, yearDot, titleDot, theCPCapLongPrefixEditorDot, conferenceNameDot, tempCSPP), pagesDot)),
			BookSection: () => join(sectionAuthorDot, when(yearDot, spaceIf(sectionAuthorDot), yearDot), volume ? when(titleDot, spaceIf(sectionAuthorDot, yearDot), applyItalic$1(titleDot), spaceIf(sectionAuthorDot, yearDot, titleDot, bookAuthorDot)) : join(when(titleDot, spaceIf(sectionAuthorDot, yearDot), quoted(titleDot)), spaceIf(sectionAuthorDot, yearDot, titleDot, bookAuthorDot)), printSpaceAndList([
				volume ? when(textOf(volumeBookTitle), volumeBookTitle) : bookTitle ? xsl$4.stringFormat(Strings$6.InNameCap, applyItalic$1(bookTitle)) : "",
				!volume && !bookTitleDot ? theCapLongByAuthor : theUnCapLongByAuthor,
				!volume && !bookTitleDot && !theCapLongByAuthor ? theCapLongPrefixEditedBy : theUnCapLongPrefixEditedBy,
				theUnCapLongPrefixTranslatedBy,
				field("Pages")
			]), when(tempCSPP, spaceIf(sectionAuthorDot, yearDot, titleDot, bookAuthorDot, bookTitleDot, prefixEditorDot, prefixTranslatorDot, volume), tempCSPP)),
			JournalArticle: () => join(authorDot || sufixEditorLFDot, when(yearDot, spaceIf(authorDot, sufixEditorLFDot), yearDot), when(titleDot, spaceIf(authorDot, sufixEditorLFDot, yearDot), quoted(titleDot)), when(theCPCapLongPrefixEditorDot && authorDot, spaceIf(authorDot, sufixEditorLFDot, yearDot, titleDot), theCPCapLongPrefixEditorDot), when(journalName, spaceIf(authorDot, sufixEditorLFDot, yearDot, titleDot), applyItalic$1(tempPVIP ? journalName : journalNameDot)), when(tempPVIP, spaceIf(authorDot, sufixEditorLFDot, yearDot, titleDot, journalName), tempPVIP)),
			Report: () => join(authorDot, when(yearDot, spaceIf(authorDot), yearDot), when(titleDot, spaceIf(authorDot, yearDot), publisher ? applyItalic$1(titleDot) : quoted(titleDot)), when(tempRICP, spaceIf(authorDot, yearDot, titleDot), tempRICP)),
			SoundRecording: () => {
				const titles = (titleSpace, albumSpace) => join(when(titleDot && albumTitleDot, titleSpace, quoted(titleDot)), when(titleDot && !albumTitleDot, titleSpace, applyItalic$1(titleDot)), when(albumTitleDot, albumSpace, applyItalic$1(albumTitleDot)));
				if (performerLF) return join(performerLFDot, when(yearDot, General$7.Space, yearDot), titles(General$7.Space, General$7.Space), when(prefixConductorDot, General$7.Space, prefixConductorDot), when(prefixComposerDot, General$7.Space, prefixComposerDot), when(tempRM, General$7.Space, tempRM));
				return conductorLFDot ? join(conductorLFDot, when(yearDot, General$7.Space, yearDot), titles(General$7.Space, General$7.Space), when(prefixComposerDot, General$7.Space, prefixComposerDot), when(tempRM, General$7.Space, tempRM)) : join(composerLFDot, when(yearDot, spaceIf(composerLFDot), yearDot), titles(spaceIf(composerLFDot), spaceIf(composerLFDot, yearDot, titleDot)), when(tempRM, spaceIf(composerLFDot, yearDot, titleDot, albumTitleDot), tempRM));
			},
			Performance: () => join(writerLFDot, when(yearDot, spaceIf(writerLFDot), yearDot), when(titleDot, spaceIf(writerLFDot, yearDot), applyItalic$1(titleDot)), when(theCapLongPrefixDirectedByDot, spaceIf(writerLFDot, yearDot, titleDot), theCapLongPrefixDirectedByDot), when(theCapLongPrefixPerformedByDot, spaceIf(writerLFDot, yearDot, titleDot, theCapLongPrefixDirectedByDot), theCapLongPrefixPerformedByDot), when(tempTC, spaceIf(writerLFDot, yearDot, titleDot, theCapLongPrefixDirectedByDot, theCapLongPrefixPerformedByDot), tempTC), when(monthDayDot, spaceIf(writerLFDot, yearDot, titleDot, theCapLongPrefixDirectedByDot, theCapLongPrefixPerformedByDot, tempTC), monthDayDot)),
			Art: () => publicationTitle ? join(normalizeSpace$1(artistDot), when(yearDot, spaceIf(artistDot), yearDot), when(titleDot, spaceIf(artistDot, yearDot), quoted(titleDot)), when(institutionDot, spaceIf(artistDot, yearDot, titleDot), institutionDot), when(publicationTitleDot, spaceIf(artistDot, yearDot, titleDot, institutionDot), applyItalic$1(publicationTitleDot)), when(tempCSPP, spaceIf(artistDot, yearDot, titleDot, institutionDot, publicationTitle), tempCSPP)) : join(normalizeSpace$1(artistDot), when(yearDot, spaceIf(artistDot), yearDot), when(titleDot, spaceIf(artistDot, yearDot), applyItalic$1(titleDot)), when(tempIC, spaceIf(artistDot, yearDot, titleDot), tempIC)),
			DocumentFromInternetSite: () => join(theAuthorSufixDot, when(yearDot, spaceIf(theAuthorSufixDot), yearDot), when(titleDot, spaceIf(theAuthorSufixDot, yearDot), quoted(titleDot)), when(prefixVersionDot, spaceIf(theAuthorSufixDot, yearDot, titleDot), prefixVersionDot), when(internetSiteTitleDot, spaceIf(theAuthorSufixDot, yearDot, titleDot, versionDot), applyItalic$1(internetSiteTitleDot)), when(theCPCapLongPrefixEditorDot, spaceIf(theAuthorSufixDot, yearDot, titleDot, versionDot, internetSiteTitleDot), theCPCapLongPrefixEditorDot), when(prodDot, spaceIf(theAuthorSufixDot, yearDot, titleDot, versionDot, internetSiteTitleDot, theCPCapLongPrefixEditorDot), prodDot), when(monthDayDot, spaceIf(theAuthorSufixDot, yearDot, titleDot, versionDot, internetSiteTitleDot, theCPCapLongPrefixEditorDot, prodDot), monthDayDot)),
			InternetSite: () => join(theAuthorSufixDot, when(yearDot, spaceIf(theAuthorSufixDot), yearDot), when(titleDot, spaceIf(theAuthorSufixDot, yearDot), applyItalic$1(titleDot)), when(theCPCapLongPrefixEditorDot, spaceIf(theAuthorSufixDot, yearDot, titleDot), theCPCapLongPrefixEditorDot), when(prefixVersionDot, spaceIf(theAuthorSufixDot, yearDot, titleDot, theCPCapLongPrefixEditorDot), prefixVersionDot), when(prodDot, spaceIf(theAuthorSufixDot, yearDot, titleDot, theCPCapLongPrefixEditorDot, versionDot), prodDot), when(monthDayDot, spaceIf(theAuthorSufixDot, yearDot, titleDot, theCPCapLongPrefixEditorDot, versionDot, prodDot), monthDayDot)),
			Patent: () => join(inventorLFDot, when(yearDot, spaceIf(inventorLFDot), yearDot), when(titleDot, spaceIf(inventorLFDot, yearDot), titleDot), when(prefixEditorDot, spaceIf(inventorLFDot, yearDot, titleDot), prefixEditorDot), when(prefixTranslatorDot, spaceIf(inventorLFDot, yearDot, titleDot, prefixEditorDot), prefixTranslatorDot), when(tempCP, spaceIf(inventorLFDot, yearDot, titleDot, prefixEditorDot, prefixTranslatorDot), tempCP), when(monthDayDot, spaceIf(inventorLFDot, yearDot, titleDot, prefixEditorDot, prefixTranslatorDot, tempCP), monthDayDot)),
			Case: () => join(when(titleDot, applyItalic$1(titleDot)), when(yearDot, spaceIf(titleDot), yearDot), when(field("CaseNumber"), spaceIf(titleDot, yearDot), field("CaseNumber")), when(tempCCMD, spaceIf(titleDot, yearDot, field("CaseNumber")), tempCCMD)),
			Misc: () => join(theAuthorSufixDot, when(yearDot, spaceIf(theAuthorSufixDot), yearDot), when(titleDot, spaceIf(theAuthorSufixDot, yearDot), quoted(titleDot)), when(publicationTitleDot, spaceIf(theAuthorSufixDot, yearDot, titleDot), applyItalic$1(publicationTitleDot)), when(prefixVolumeDot, spaceIf(theAuthorSufixDot, yearDot, titleDot, publicationTitleDot), prefixVolumeDot), when(noIssueDot, spaceIf(theAuthorSufixDot, yearDot, titleDot, publicationTitleDot, prefixVolumeDot), noIssueDot), when(theCPCapLongPrefixEditorDot, spaceIf(theAuthorSufixDot, yearDot, titleDot, publicationTitleDot, prefixVolumeDot, issueDot), theCPCapLongPrefixEditorDot), when(theCapLongPrefixTranslatorDot, spaceIf(theAuthorSufixDot, yearDot, titleDot, publicationTitleDot, prefixVolumeDot, issueDot, theCPCapLongPrefixEditorDot), theCapLongPrefixTranslatorDot), when(theCapLongPrefixCompilerDot, spaceIf(theAuthorSufixDot, yearDot, titleDot, publicationTitleDot, prefixVolumeDot, issueDot, theCPCapLongPrefixEditorDot, theCapLongPrefixTranslatorDot), theCapLongPrefixCompilerDot), when(tempCPMD, spaceIf(theAuthorSufixDot, yearDot, titleDot, publicationTitleDot, prefixVolumeDot, issueDot, theCPCapLongPrefixEditorDot, theCapLongPrefixTranslatorDot, theCapLongPrefixCompilerDot), tempCPMD), when(pagesDot, spaceIf(theAuthorSufixDot, yearDot, titleDot, publicationTitleDot, prefixVolumeDot, issueDot, theCPCapLongPrefixEditorDot, theCapLongPrefixTranslatorDot, theCapLongPrefixCompilerDot, tempCPMD), pagesDot)),
			ElectronicSource: () => {
				const lfAuthor = authorDot || sufixEditorLFDot || sufixTranslatorLFDot || sufixCompilerLFDot;
				const before = [
					lfAuthor,
					yearDot,
					titleDot,
					publicationTitleDot,
					editionDot,
					prefixVolumeDot,
					mediumDot
				];
				return join(lfAuthor, when(yearDot, spaceIf(lfAuthor), yearDot), when(titleDot && publicationTitleDot, spaceIf(lfAuthor, yearDot), quoted(titleDot)), when(titleDot && !publicationTitleDot, spaceIf(lfAuthor, yearDot), applyItalic$1(titleDot)), when(publicationTitleDot, spaceIf(lfAuthor, yearDot, titleDot), applyItalic$1(publicationTitleDot)), when(editionDot, spaceIf(lfAuthor, yearDot, titleDot, publicationTitleDot), editionDot), when(prefixVolumeDot, spaceIf(lfAuthor, yearDot, titleDot, publicationTitleDot, editionDot), prefixVolumeDot), when(mediumDot, spaceIf(lfAuthor, yearDot, titleDot, publicationTitleDot, editionDot, prefixVolumeDot), mediumDot), when(authorDot && theCPCapLongPrefixEditorDot, spaceIf(...before), theCPCapLongPrefixEditorDot), when(theCapLongPrefixTranslatorDot && (authorDot || sufixEditorLFDot), spaceIf(...before), theCapLongPrefixTranslatorDot), when(prefixCompilerDot && (authorDot || sufixEditorLFDot || sufixTranslatorLFDot), spaceIf(...before), prefixCompilerDot), when(prefixProdDot, spaceIf(...before), prefixProdDot), when(tempCPMD, spaceIf(...before, prefixProdDot), tempCPMD));
			},
			ArticleInAPeriodical: () => join(theAuthorSufixDot, when(periodicalTitle && !theAuthorSufixDot, applyItalic$1(periodicalTitleDot)), when(yearDot, spaceIf(theAuthorSufixDot, periodicalTitle), yearDot), when(titleDot, spaceIf(theAuthorSufixDot, periodicalTitle, yearDot), quoted(titleDot)), when(periodicalTitle && theAuthorSufixDot, General$7.Space, applyItalic$1(tempMDEP ? periodicalTitle : periodicalTitleDot)), when(tempMDEP, theAuthorSufixDot && periodicalTitle ? General$7.ListSeparator : General$7.Space, tempMDEP)),
			Film: () => join(when(writerDot, writerLFDot), when(yearDot, spaceIf(writerLFDot), yearDot), when(titleDot, spaceIf(writerDot, yearDot), applyItalic$1(titleDot)), when(mediumDot, spaceIf(writerDot, yearDot, titleDot), mediumDot), when(theCapLongPrefixDirectedByDot, spaceIf(writerDot, yearDot, titleDot, mediumDot), theCapLongPrefixDirectedByDot), when(theCapLongPrefixProducedByDot, spaceIf(writerDot, yearDot, titleDot, theCapLongPrefixDirectedByDot, mediumDot), theCapLongPrefixProducedByDot), when(theCapLongPrefixPerformedByDot, spaceIf(writerDot, yearDot, titleDot, theCapLongPrefixDirectedByDot, theCapLongPrefixProducedByDot, mediumDot), theCapLongPrefixPerformedByDot), when(distributorDot, spaceIf(writerDot, yearDot, titleDot, theCapLongPrefixDirectedByDot, theCapLongPrefixProducedByDot, theCapLongPrefixPerformedByDot, mediumDot), distributorDot)),
			Interview: () => {
				const interviewTitleDot = titleDot;
				const start = join(when(intervieweeLFDot, interviewerDot ? intervieweeLF : intervieweeLFDot), when(interviewerDot, intervieweeLFDot ? General$7.ListSeparator : "", xsl$4.stringFormatDot(intervieweeLFDot ? Strings$6.InterviewByUnCap : Strings$6.InterviewByCap, interviewer)), when(yearDot, spaceIf(interviewerDot, intervieweeLFDot), yearDot), when(interviewTitle, spaceIf(interviewerDot, intervieweeLFDot, yearDot), broadcastTitleDot ? join(intervieweeLFDot ? General$7.Space : "", quoted(interviewTitleDot)) : join(spaceIf(intervieweeLFDot, broadcastTitleDot), applyItalic$1(interviewTitle))));
				if (field("Broadcaster")) return join(start, when(broadcastTitleDot, spaceIf(interviewerDot, intervieweeLFDot, yearDot, interviewTitle), applyItalic$1(broadcastTitleDot)), when(broadcasterDot, spaceIf(interviewerDot, intervieweeLFDot, yearDot, interviewTitle, broadcastTitleDot), broadcasterDot), when(tempSC, spaceIf(interviewerDot, intervieweeLFDot, yearDot, interviewTitle, broadcastTitleDot, broadcasterDot), tempSC), when(monthDayDot, spaceIf(interviewerDot, intervieweeLFDot, yearDot, interviewTitle, broadcastTitleDot, broadcasterDot, tempSC), monthDayDot));
				return join(start, when(broadcastTitleDot, spaceIf(interviewerDot, intervieweeLFDot, yearDot, interviewTitle), applyItalic$1(editor || translator ? broadcastTitle : broadcastTitleDot)), when(theCapLongPrefixEditedByDot, broadcastTitleDot ? join(General$7.ListSeparator, theCapLongPrefixTranslatedByDot ? theUnCapLongPrefixEditedBy : theUnCapLongPrefixEditedByDot) : theCapLongPrefixTranslatedByDot ? theCapLongPrefixEditedBy : theCapLongPrefixEditedByDot), when(theCapLongPrefixTranslatedByDot, broadcastTitleDot || theCapLongPrefixEditedByDot ? join(General$7.ListSeparator, theUnCapLongPrefixTranslatedByDot) : theCapLongPrefixTranslatedByDot), when(tempCPMDP, spaceIf(interviewerDot, intervieweeLFDot, yearDot, interviewTitle, broadcastTitleDot, theCapLongPrefixTranslatedByDot, theCapLongPrefixEditedByDot), tempCPMDP));
			}
		}[source.type]();
		if (tempDAUD) return join(entry, General$7.Space, tempDAUD);
		return entry[entry.length - 1].italics ? join(entry, General$7.Space) : entry;
	};
	/**
	* Chicago, the author-date style of the Chicago Manual of Style, as Word writes it: citations such as "(Baker 2010, 50)",
	* and a bibliography of entries such as "Baker, Anna. 2010. *The Art of Pizza.* Naples: Forno Press.", with a dash for
	* the authors of an entry with the same authors as the one before it.
	*/
	var chicago = {
		name: "Chicago",
		file: "CHICAGO.XSL",
		version: "16",
		citation: citation$3,
		bibliography: (sources) => bibliographyOf(sources, formatPersonsAuthor$2, bibliographyEntry$1)
	};
	//#endregion
	//#region src/bibliography/styles/iso-690-family.ts
	/**
	* The templates of Word's ISO 690 styles and of GB7714, written in TypeScript. GB.XSL and ISO690.XSL differ in only a few
	* of their templates, and ISO690Nmerical.XSL, ISO 690's numerical style, shares most of theirs: how each type of source
	* is written, its people, its place of publication and its dates.
	*
	* These styles write the names that a source starts with in bold, and its titles in italics. Word reads the HTML they
	* write with quirks, which {@link readHtml} follows: a space between two elements next to each other, and at the end of
	* a copy of a variable after an element, and formatting left on after an element of ISO 690's numerical style that is
	* empty.
	*
	* @module
	*/
	var { General: General$6, Strings: Strings$5, ISO690: ISO690$2 } = LOCALS;
	var { appendDot: appendDot$2, formatDatePrivate: formatDatePrivate$1, formatName: formatName$1, needDot: needDot$2, printList, stringFormat: stringFormat$1, stringFormatDot: stringFormatDot$1 } = xslTemplates(General$6);
	/** An element with its content */
	var element = (name, ...content) => ({
		element: name,
		content
	});
	/** A copy of a variable with its content */
	var copy = (...content) => ({ copy: content });
	/** The text of what a style writes, as its string value */
	var textOfHtml = (nodes) => nodes.map((node) => typeof node === "string" ? node : "value" in node ? node.value : textOfHtml("element" in node ? node.content : node.copy)).join("");
	/** What a style writes, as the tokens of its HTML. An element is copied when it's in a copy of a variable */
	var tokensOf = (nodes, copied = false) => nodes.flatMap((node) => {
		if (typeof node === "string") return node ? [{ text: node }] : [];
		if ("value" in node) return [{ text: node.value }];
		return "element" in node ? [
			{
				open: node.element,
				copied
			},
			...tokensOf(node.content, copied),
			{ close: node.element }
		] : [
			"boundary",
			...tokensOf(node.copy, true),
			"boundary"
		];
	});
	/**
	* Paragraphs of a style's HTML, read as Word reads them: each run of spaces becomes one, as in HTML, and there's none at
	* the start of a paragraph. MSXML writes a line break, which Word reads as a space, between an element and an element
	* after it, and at the end of a copy of a variable between an element and the end of the paragraph.
	*
	* An element written into a variable and copied, with nothing in it, such as the bold of an entry of ISO 690's
	* numerical style with no author, is written as `<b/>`, which Word reads as a start tag that isn't ended: the rest of the
	* bibliography is bold, or in italics. An element with an `xsl:value-of` in it has a text node, though it is empty, so it
	* isn't written that way.
	*/
	var readHtml = (paragraphs) => {
		const marks = {
			b: 0,
			i: 0
		};
		return paragraphs.map((paragraph) => {
			const runs = [];
			let lastNode;
			let boundary = false;
			let emptyCopy;
			const lastText = () => {
				var _runs$text, _runs;
				return (_runs$text = (_runs = runs[runs.length - 1]) === null || _runs === void 0 ? void 0 : _runs.text) !== null && _runs$text !== void 0 ? _runs$text : "";
			};
			const space = () => {
				if (runs.length > 0 && !lastText().endsWith(" ")) runs.push({ text: " " });
			};
			for (const token of tokensOf(paragraph)) if (token === "boundary") boundary = true;
			else if ("text" in token) {
				let text = token.text.replace(/[ \t\r\n]+/g, " ");
				if (text.startsWith(" ") && (lastText() === "" || lastText().endsWith(" "))) text = text.slice(1);
				const run = _objectSpread2(_objectSpread2({ text }, marks.b > 0 ? { bold: true } : {}), marks.i > 0 ? { italics: true } : {});
				const last = runs[runs.length - 1];
				if (!text) {} else if (last && !!last.bold === !!run.bold && !!last.italics === !!run.italics) runs[runs.length - 1] = _objectSpread2(_objectSpread2({}, last), {}, { text: last.text + text });
				else runs.push(run);
				lastNode = "text";
				boundary = false;
				emptyCopy = void 0;
			} else if ("open" in token) {
				if (lastNode === "end") space();
				marks[token.open]++;
				emptyCopy = token.copied ? token.open : void 0;
				lastNode = "start";
				boundary = false;
			} else {
				if (emptyCopy !== token.close) marks[token.close]--;
				emptyCopy = void 0;
				lastNode = "end";
				boundary = false;
			}
			if (boundary && lastNode === "end") space();
			return runs;
		});
	};
	/** The data in italics, as `ApplyItalicTitleNS` and `ApplyItalicFieldNS` write it: `<i>` around a copy of the data */
	var applyItalic = (...data) => element("i", copy(...data));
	/** The roles each type of source can be listed by, in the order the styles look for them (`MainContributors`) */
	var MAIN_ROLES$3 = {
		Book: [
			"Author",
			"Editor",
			"Translator"
		],
		BookSection: ["Author"],
		JournalArticle: ["Author", "Editor"],
		ArticleInAPeriodical: ["Author"],
		ConferenceProceedings: ["Author", "Editor"],
		Report: ["Author"],
		SoundRecording: [
			"Artist",
			"Performer",
			"Composer",
			"Conductor",
			"ProducerName"
		],
		Performance: [
			"Writer",
			"Director",
			"Performer",
			"ProducerName"
		],
		Art: ["Artist"],
		DocumentFromInternetSite: ["Author"],
		InternetSite: ["Author"],
		Film: [
			"Director",
			"Writer",
			"Performer",
			"ProducerName"
		],
		Interview: ["Interviewee"],
		Patent: ["Inventor"],
		ElectronicSource: [
			"Author",
			"Editor",
			"ProducerName",
			"Translator"
		],
		Case: ["Author", "Counsel"],
		Misc: [
			"Author",
			"Editor",
			"Compiler",
			"Translator"
		]
	};
	/**
	* The string value of the people with a role, as XSL reads an element: each person's last, first and middle names, one
	* after another, or the organization
	*/
	var stringOfNames = (names) => names === void 0 ? "" : "corporate" in names ? names.corporate : names.people.map(({ last, first, middle }) => last + first + middle).join("");
	/**
	* A source as the styles read it, with its main contributors (`populateMain`). An interview with a broadcaster or the
	* title of a broadcast has no editors, translators, compilers or publisher, and one with neither has no station
	*/
	var populate = (source) => {
		var _MAIN_ROLES$type$find;
		const { type } = source;
		const broadcast = type === "Interview" && (fieldOf(source, "Broadcaster") !== "" || fieldOf(source, "BroadcastTitle") !== "");
		const names = (role) => broadcast && (role === "Editor" || role === "Translator" || role === "Compiler") ? void 0 : source.names[role];
		const field = (name) => type === "Interview" && !broadcast && name === "Station" || broadcast && name === "Publisher" ? "" : fieldOf(source, name);
		const mainRole = (_MAIN_ROLES$type$find = MAIN_ROLES$3[type].find((role) => stringOfNames(source.names[role]) !== "")) !== null && _MAIN_ROLES$type$find !== void 0 ? _MAIN_ROLES$type$find : "";
		const corporate = mainRole ? organizationOf(source, mainRole) : "";
		return {
			source,
			type,
			field,
			names,
			mainRole,
			main: corporate ? { corporate } : { people: mainRole ? peopleOf(source, mainRole) : [] }
		};
	};
	/** What follows a person in a list of people: ", et al." after the first of four or more, ", " or " and " (`formatPersonSeparator`) */
	var formatPersonSeparator$2 = (position, count) => {
		if (count > 3) return General$6.AuthorsSeparator + Strings$5.AndOthersUnCap;
		if (count - 1 > position) return General$6.AuthorsSeparator;
		return position === count - 1 ? General$6.Space + Strings$5.AndUnCap + General$6.Space : "";
	};
	/**
	* People, written as the styles list them: the first followed by ", et al." when there are four or more, and the
	* others' names "First Middle Last", or the main contributors' "Last, First Middle", or the organization (`formatPersons`)
	*/
	var formatPersons$3 = (names, isMain) => {
		if ("corporate" in names) return names.corporate;
		return (names.people.length >= 4 ? names.people.slice(0, 1) : names.people).map((person, index) => formatName$1(person, isMain ? ISO690$2.MainAuthors : ISO690$2.SecondaryAuthors) + formatPersonSeparator$2(index + 1, names.people.length)).join("");
	};
	/**
	* What the main contributors are, after their names, such as "ed.", by their role (`GetMainAuthorTitle`). The template
	* compares whether they're an organization, a string, with `true()`, which a string always is, so it doesn't depend on how
	* many of them there are
	*/
	var mainAuthorTitle = (source) => {
		switch (source.mainRole) {
			case "Editor": return Strings$5.EditorShortUnCap;
			case "Translator": return Strings$5.TranslatorShortUnCap;
			case "Performer": return Strings$5.PerformerShortUnCap;
			case "Composer": return Strings$5.ComposerShortUnCapIso;
			case "Conductor": return Strings$5.ConductorShortUnCap;
			case "ProducerName": return Strings$5.ProducerShortUnCap;
			case "Writer": return source.type === "Film" ? Strings$5.WriterShortUnCap : "";
			case "Counsel": return Strings$5.CounselShortUnCap;
			case "Compiler": return Strings$5.CompilerShortUnCap;
			default: return "";
		}
	};
	/** The main contributors, and what they are, such as "Garcia, Lucia, [ed.]" (`formatMain`) */
	var formatMain$1 = (source) => {
		if ("people" in source.main && source.main.people.length === 0) return "";
		const title = mainAuthorTitle(source);
		return formatPersons$3(source.main, true) + (title ? General$6.ListSeparator + ISO690$2.GeneralOpen + title + ISO690$2.GeneralClose : "");
	};
	/**
	* The people with a role who aren't the main contributors, after what they are, such as "[ed.] Ernest Hemingway. ",
	* as the variables of the bibliography's templates write them (such as `Editors` with `formatEditor`). They're written
	* when the source has the role and its people aren't its main contributors
	*/
	var formatRole$1 = (source, role, label, labelledBy = role) => {
		const names = source.names(role);
		if (names === void 0 || stringOfNames(source.main) === stringOfNames(names)) return "";
		if (stringOfNames(source.names(labelledBy)) === "") return General$6.Space;
		const people = formatPersons$3(names, false);
		return ISO690$2.GeneralOpen + label + ISO690$2.GeneralClose + General$6.Space + people + needDot$2(people) + General$6.Space;
	};
	/** Whether a string has text other than spaces, as `string-length(normalize-space($text)) > 0` */
	var hasText = (text) => /[^ \t\r\n]/.test(text);
	/** The types of source written with their place of publication and publisher */
	var PUBLISHED = /* @__PURE__ */ new Set([
		"Book",
		"BookSection",
		"JournalArticle",
		"ArticleInAPeriodical",
		"ConferenceProceedings",
		"Report",
		"SoundRecording",
		"Performance",
		"Art",
		"Interview",
		"ElectronicSource",
		"Case",
		"Misc"
	]);
	/** The types of source whose publisher, or broadcaster, follows their place */
	var BY_PUBLISHER = /* @__PURE__ */ new Set([
		"Book",
		"BookSection",
		"JournalArticle",
		"ArticleInAPeriodical",
		"ConferenceProceedings",
		"Interview",
		"Report",
		"Misc"
	]);
	/** The publisher of a source, or who produced it, after its place: "s.n." when it has none (`after` of `formatLocation`) */
	var publisherOf = (source) => {
		const { type, field } = source;
		if (field("Publisher") && type === "Report") return field("Publisher");
		if (field("ProductionCompany") && (type === "SoundRecording" || type === "Performance")) return field("ProductionCompany");
		if ((field("ProductionCompany") || field("Publisher")) && type === "ElectronicSource") return field("Publisher") + (field("Publisher") && field("ProductionCompany") ? General$6.ListSeparator : "") + field("ProductionCompany");
		if (field("Court") && type === "Case") return field("Court");
		if (type === "Art" && (field("Publisher") || field("Year"))) return field("Publisher") + (field("Publisher") && field("Year") ? General$6.ListSeparator : "") + field("Year");
		if ((field("Publisher") || field("Broadcaster") && type === "Interview") && BY_PUBLISHER.has(type)) return (type === "Interview" ? field("Broadcaster") : "") + field("Publisher");
		return !field("Broadcaster") && type === "Interview" ? "" : Strings$5.SineNomineShort;
	};
	/**
	* Whether a source with no place has nothing to write in its place either: none of the publisher, the institution, the
	* production company or the court its type is written with (`nothing` of `formatLocation`)
	*/
	var hasNoPublisher = (source) => {
		const { type, field } = source;
		return !(field("Publisher") && type === "Report" || field("Institution") && type === "Art" || field("ProductionCompany") && (type === "SoundRecording" || type === "Performance") || (field("ProductionCompany") || field("Publisher")) && type === "ElectronicSource" || field("Court") && type === "Case" || (field("Publisher") || field("Broadcaster") && type === "Interview") && (BY_PUBLISHER.has(type) || type === "Art"));
	};
	/**
	* Where a source was published, and by whom, such as "Chicago : Adventure Works Press", "s.l." and "s.n." when it has
	* no place or publisher, or for a film, its production company and distributor (`formatLocation`)
	*/
	var formatLocation$1 = (source) => {
		const { type, field } = source;
		if (type === "Film") return field("ProductionCompany") + (field("ProductionCompany") && field("Distributor") ? General$6.GroupSeparator : "") + field("Distributor");
		if (type === "Patent") return field("CountryRegion");
		if (!PUBLISHED.has(type)) return "";
		const hasPlace = !!field("City") || !!field("Theater") && type === "Performance";
		if (!hasPlace && hasNoPublisher(source)) return "";
		const separated = (first) => first + (first && field("City") ? General$6.ListSeparator + General$6.Space : "");
		const place = hasPlace ? (type === "Performance" ? separated(field("Theater")) : "") + (type === "ElectronicSource" ? separated(field("Edition")) : "") + (type === "Interview" ? separated(field("Station")) : "") + (type === "Art" && field("Institution") && field("City") ? General$6.ListSeparator : "") + field("City") : (type === "Art" && field("Institution") ? General$6.ListSeparator : "") + Strings$5.SineLocoShort;
		const state = field("StateProvince");
		const country = field("CountryRegion");
		const region = type === "Performance" || type === "Art" || type === "ElectronicSource" || type === "Case" || type === "Misc" ? (state || country ? General$6.ListSeparator : "") + state + (state && country ? General$6.ListSeparator : "") + country : "";
		const publisher = publisherOf(source);
		return (type === "Art" ? field("Institution") : "") + place + region + (hasText(publisher) ? General$6.NonBreakingSpace + General$6.EnumSeparator + publisher : "");
	};
	/** The date a source was published, such as "14 March 2018" (`formatDayMonthYear`) */
	var formatDayMonthYear = (source) => formatDatePrivate$1(source.field("Day"), source.field("Month"), source.field("Year"), ISO690$2.Date);
	/**
	* The date a website was read, such as "[Cited: 3 February 2022.]". The template tests for the day it was read three
	* times, so it is written only when it has the day (`formatDayMonthYearAccessed`)
	*/
	var formatDayMonthYearAccessed = (source) => {
		if (!source.field("DayAccessed")) return "";
		const date = formatDatePrivate$1(source.field("DayAccessed"), source.field("MonthAccessed"), source.field("YearAccessed"), ISO690$2.DateAccessed);
		return ISO690$2.GeneralOpen + textOf(stringFormatDot$1(Strings$5.CitedCap, date)) + ISO690$2.GeneralClose;
	};
	/** The first, second and third that it has, with ", " between them, and a dot after them (`templateJ` and `templateC`) */
	var joinWithDot = (...parts) => appendDot$2(parts.filter((part) => part).join(General$6.ListSeparator));
	/** "vol." or "vols.", for a volume such as "2" or "2-3", or "Vol." and "Vols." in a bibliography */
	var volumeFormatOf$1 = (volume, single, several) => volume.includes(",") || translate(volume, General$6.Hyphens, "") !== volume ? several : single;
	/** Pages such as "p. 50" or "pp. 50-62", the way the styles write them in a bibliography and in a citation */
	var pagesOf = (pages) => pages ? (pages.includes(",") || translate(pages, General$6.Hyphens, "") !== pages ? Strings$5.PagesCountinousShort : Strings$5.PageShort) + General$6.Space + pages : "";
	/**
	* A source's entry in the bibliography, without its main contributors (the `xsl:choose` by `b:SourceType`, and the
	* bibliography's variables). The title of a journal article or a paper is "—." when it is the same as the one before's.
	* GB7714 writes a space after a website's version and date, or a report's department and institution, by different
	* fields than ISO 690
	*/
	var entryOf = (source, previous, style) => {
		const { type, field } = source;
		const italicWithDot = (text) => text ? [applyItalic(appendDot$2(text) + General$6.Space)] : [];
		const spaced = (text) => text ? General$6.Space + text + General$6.Dot : "";
		const title = italicWithDot(field("Title"));
		const titleOfMonographParts = field("Title") ? appendDot$2(field("Title")) + General$6.Space : "";
		const volume = field("Volume") ? textOf(stringFormat$1(volumeFormatOf$1(field("Volume"), Strings$5.VolumeShortCap, Strings$5.VolumesShortCap), field("Volume"))) : "";
		const pages = pagesOf(field("Pages"));
		const dayMonthYear = formatDayMonthYear(source);
		const location = formatLocation$1(source);
		const comments = spaced(field("Comments"));
		const standardNumber = spaced(field("StandardNumber"));
		const editors = formatRole$1(source, "Editor", Strings$5.EditorShortUnCap);
		const translators = formatRole$1(source, "Translator", Strings$5.TranslatorShortUnCap);
		const performers = formatRole$1(source, "Performer", Strings$5.PerformerShortUnCap);
		const producers = formatRole$1(source, "ProducerName", Strings$5.ProducerShortUnCap);
		const compilers = formatRole$1(source, "Compiler", Strings$5.CompilerShortUnCapIso);
		const medium = field("Medium") ? ISO690$2.GeneralOpen + field("Medium") + ISO690$2.GeneralClose : "";
		const mediumDot = medium ? medium + General$6.Dot + General$6.Space : "";
		const list = (...items) => textOf(printList(items));
		const spaceAndList = (...items) => {
			const result = list(...items);
			return result ? [General$6.Space, copy(result)] : [];
		};
		const websiteTitle = [...italicWithDot(field("InternetSiteTitle")), ISO690$2.GeneralOpen + Strings$5.OnlineCap + ISO690$2.GeneralClose + General$6.Space];
		const website = [
			joinWithDot(field("Version"), type === "InternetSite" ? field("ProductionCompany") : "", dayMonthYear) + (field("Version") || dayMonthYear || style === "ISO 690" && field("ProductionCompany") ? General$6.Space : ""),
			formatDayMonthYearAccessed(source),
			comments,
			spaced(field("URL")),
			standardNumber
		];
		return {
			start: type === "ConferenceProceedings" || type === "JournalArticle" ? [applyItalic(previous && (previous.type === "JournalArticle" || previous.type === "ConferenceProceedings") && previous.field("Title") !== "" && previous.field("Title") === field("Title") ? ISO690$2.SameAuthor + General$6.Dot : copy(titleOfMonographParts))] : [],
			rest: (() => {
				switch (type) {
					case "Book": return [
						copy(...title),
						editors,
						translators,
						field("Edition") ? appendDot$2(field("Edition")) + General$6.Space : "",
						list(location, field("Year")),
						pages ? General$6.Space + appendDot$2(pages) : "",
						...spaceAndList(volume, comments),
						standardNumber
					];
					case "BookSection": return [
						copy(titleOfMonographParts),
						formatRole$1(source, "BookAuthor", Strings$5.BookAuthorShortUnCap),
						editors,
						translators,
						copy(...italicWithDot(field("BookTitle"))),
						field("Edition") ? appendDot$2(field("Edition")) + General$6.Space : "",
						list(location, field("Year"), volume, pages),
						comments
					];
					case "JournalArticle": return [
						editors,
						field("Issue") ? field("Issue") + General$6.ListSeparator : "",
						list(location, dayMonthYear, field("JournalName"), volume, pages),
						comments,
						standardNumber
					];
					case "ArticleInAPeriodical": return [
						copy(titleOfMonographParts),
						editors,
						copy(...italicWithDot(field("PeriodicalTitle"))),
						list(field("Edition"), dayMonthYear, volume, field("Issue"), pages),
						comments
					];
					case "ConferenceProceedings": return [
						editors,
						list(location, field("Year")),
						copy(field("ConferenceName") ? General$6.Space + appendDot$2(field("ConferenceName")) : ""),
						...spaceAndList(volume, pages),
						comments,
						standardNumber
					];
					case "Report": return [
						copy(...title),
						joinWithDot(field("Department"), field("Institution")) + (field("Department") || field("Institution") || style === "GB7714" && field("ProductionCompany") ? General$6.Space : ""),
						list(location, field("Year")),
						...spaceAndList(pages, field("ThesisType")),
						comments,
						standardNumber
					];
					case "SoundRecording": return [
						copy(titleOfMonographParts),
						performers,
						formatRole$1(source, "Composer", Strings$5.ComposerShortUnCapIso),
						formatRole$1(source, "Conductor", Strings$5.ConductorShortUnCap),
						producers,
						copy(...italicWithDot(field("AlbumTitle"))),
						copy(medium ? medium + General$6.Space : ""),
						list(location, field("Year")),
						comments,
						standardNumber
					];
					case "Performance": return [
						copy(...title),
						formatRole$1(source, "Director", Strings$5.DirectorShortUnCap),
						performers,
						producers,
						list(location, dayMonthYear),
						comments,
						standardNumber
					];
					case "Art": return [
						copy(...title),
						list(location),
						comments
					];
					case "DocumentFromInternetSite": return [
						copy(titleOfMonographParts),
						copy(...websiteTitle),
						...website
					];
					case "InternetSite": return [
						textOfHtml(title),
						copy(...websiteTitle),
						...website
					];
					case "Film": return [
						copy(...title),
						mediumDot,
						formatRole$1(source, "Writer", Strings$5.WriterShortUnCap),
						performers,
						producers,
						list(location, field("Year")),
						comments,
						standardNumber
					];
					case "Interview": {
						const broadcastTitle = field("BroadcastTitle") ? appendDot$2(field("BroadcastTitle")) + General$6.Space : "";
						return [
							!field("Broadcaster") && !field("BroadcastTitle") ? applyItalic({ value: textOfHtml(title) }) : textOfHtml(title),
							formatRole$1(source, "Interviewer", Strings$5.IntervieweeShortUnCap, "Interviewee"),
							editors,
							translators,
							compilers,
							broadcastTitle ? applyItalic({ value: broadcastTitle }) : "",
							list(location, dayMonthYear),
							...spaceAndList(pages),
							comments,
							standardNumber
						];
					}
					case "Patent": return [
						copy(...title),
						copy(...field("PatentNumber") ? [applyItalic(field("PatentNumber") + General$6.Space)] : []),
						editors,
						translators,
						list(location, dayMonthYear),
						field("Type") ? General$6.Space + appendDot$2(field("Type")) : "",
						comments
					];
					case "ElectronicSource": return [
						copy(...title),
						copy(medium ? medium + General$6.Space : ""),
						editors,
						producers,
						translators,
						list(location, dayMonthYear),
						...spaceAndList(field("PublicationTitle"), volume ? General$6.Space + appendDot$2(volume) : ""),
						comments,
						standardNumber
					];
					case "Case": return [
						copy(...title),
						copy(field("CaseNumber") ? field("CaseNumber") + General$6.ListSeparator : ""),
						copy(field("AbbreviatedCaseNumber") ? field("AbbreviatedCaseNumber") + General$6.Dot + General$6.Space : ""),
						formatRole$1(source, "Counsel", Strings$5.CounselShortUnCap),
						list(location, dayMonthYear),
						spaced(field("Reporter")),
						comments
					];
					default: return [
						copy(titleOfMonographParts),
						field("Edition"),
						General$6.Space,
						editors,
						compilers,
						translators,
						applyItalic({ value: textOfHtml(italicWithDot(field("PublicationTitle"))) }),
						mediumDot,
						list(location, dayMonthYear),
						...spaceAndList(volume, field("Issue"), pages),
						comments,
						standardNumber
					];
				}
			})()
		};
	};
	/** Whether a source is a journal article or a paper, which these styles start with its title */
	var startsWithTitle = (source) => (source === null || source === void 0 ? void 0 : source.type) === "JournalArticle" || (source === null || source === void 0 ? void 0 : source.type) === "ConferenceProceedings";
	/** Whether the source before has the same main contributors, as the string values of their elements */
	var hasSameMain = (source, previous) => previous !== void 0 && stringOfNames(previous.main) === stringOfNames(source.main);
	/**
	* A citation's volume and pages, such as "vol. 2", "p. 50" or "2:50", after a space when the citation has something
	* before them
	*
	* @param separator - Between a volume and pages: ":" for ISO 690 by first element and date, ": " for its numerical style
	*/
	var citedVolumeAndPages = (volume, pages, separator, spaced) => {
		if (!volume && !pages) return "";
		const cited = volume && pages ? volume + separator + pages : volume ? textOf(stringFormat$1(volumeFormatOf$1(volume, Strings$5.VolumeShortUnCap, Strings$5.VolumesShortUnCap), volume)) : pagesOf(pages);
		return (spaced ? General$6.Space : "") + cited;
	};
	/** The patterns GB7714 writes the first of a citation's people with: Word's simple patterns, the last name */
	var GB7714_CITATION = {
		FML: General$6.SimpleAuthor.L,
		FM: General$6.SimpleAuthor.F,
		ML: General$6.SimpleAuthor.L,
		FL: General$6.SimpleAuthor.L
	};
	/**
	* What a source is sorted by in the bibliography (`b:SortingString` of `populateMain`): a journal article's or a paper's
	* title, then its main contributors, then any other source's title
	*/
	var sortingStringOf$4 = (source) => {
		const title = source.field("Title");
		const author = formatPersons$3(source.main, true);
		return (startsWithTitle(source) && title ? General$6.Space + title : "") + (author ? General$6.Space + author : "") + (title && !startsWithTitle(source) ? General$6.Space + title : "");
	};
	/**
	* A source of a citation, as ISO 690 by first element and date, and GB7714, write it: the main contributors, or for
	* a journal article or a paper its title, then the year, such as "(Baker, 2010 p. 50)". A source with no contributors,
	* title or year is cited by its tag, and in GB7714 one with no contributors or year (the template's `b:Citation`)
	*/
	var firstElementCitation = (style) => (cited) => {
		var _cited$prefix, _cited$suffix;
		const source = populate(cited.source);
		const { field, main } = source;
		const title = field("ShortTitle") || field("Title");
		const year = field("Year");
		const people = "people" in main ? main.people : [];
		const author = startsWithTitle(source) && field("Title") ? field("Title") : "corporate" in main ? main.corporate : (people.length > 0 ? formatName$1(people[0], style === "GB7714" ? GB7714_CITATION : ISO690$2.CitationShort) : "") + (people.length > 1 ? General$6.AuthorsSeparator + Strings$5.AndOthersUnCap : "");
		const shownAuthor = cited.hideAuthor ? "" : author;
		const shownYear = cited.hideYear ? "" : year;
		return [{ text: (cited.first ? General$6.OpenBracket : "") + ((_cited$prefix = cited.prefix) !== null && _cited$prefix !== void 0 ? _cited$prefix : "") + shownAuthor + (shownYear ? (shownAuthor ? General$6.ListSeparator : "") + shownYear : "") + (!author && (style === "GB7714" || !title) && !year ? cited.source.tag : "") + citedVolumeAndPages(cited.volume, cited.pages, General$6.Enum, !!shownAuthor || !!shownYear) + ((_cited$suffix = cited.suffix) !== null && _cited$suffix !== void 0 ? _cited$suffix : "") + (cited.last ? General$6.CloseBracket : General$6.GroupSeparator) }];
	};
	/**
	* The bibliography as ISO 690 by first element and date, and GB7714, write it: sorted by its sources' main
	* contributors, each with the year after them in bold, such as "**Baker, Anna. 2010.** _The Art of Pizza._", or "—."
	* for the same contributors as the source before (the template's `b:Bibliography`)
	*/
	var firstElementBibliography = (style) => (sources) => {
		const sorted = sortByKey(sources.map(populate), sortingStringOf$4);
		return {
			paragraphs: readHtml(sorted.map((source, index) => {
				const previous = sorted[index - 1];
				const main = formatMain$1(source);
				const { start, rest } = entryOf(source, previous, style);
				const year = source.field("Year");
				const named = startsWithTitle(previous) || startsWithTitle(source) || !hasSameMain(source, previous) ? [copy(main), needDot$2(main)] : [stringOfNames(source.main) ? ISO690$2.SameAuthor + General$6.Dot : ""];
				return [
					...start,
					element("b", ...named, year ? General$6.Space + year + General$6.Dot : ""),
					General$6.Space,
					...rest
				];
			})),
			hangingIndent: false
		};
	};
	//#endregion
	//#region src/bibliography/styles/gb7714.ts
	/**
	* The GB7714 style of citation, written from Word's (GB.XSL). It is Word's ISO 690 by first element and date but for a
	* few of its templates: it cites a source by its tag when the source has no author or year, and writes a space after a
	* website's version and date, and a report's department and institution, by different fields.
	*
	* @module
	*/
	/** GB7714, as Word writes it */
	var gb7714 = {
		name: "GB7714",
		file: "GB.XSL",
		version: "2005",
		citation: firstElementCitation("GB7714"),
		bibliography: firstElementBibliography("GB7714")
	};
	//#endregion
	//#region src/bibliography/styles/gost-family.ts
	/**
	* The templates of Word's two GOST styles, GOST - Name Sort (GostName.XSL) and GOST - Title Sort (GostTitle.XSL), which
	* write citations and bibliographies as the Russian standard GOST 7.1 has them, such as "Dickens Charles John How to
	* Write Bibliographies [Book]. - Chicago : Adventure Works Press, 2006."
	*
	* The two styles are the same but for how an entry starts and how the bibliography is sorted. GOST - Name Sort starts an
	* entry with its authors in bold, and leaves out the people who are those authors from the rest of it. GOST - Title Sort
	* starts it with its title in bold, and names its authors after the title.
	*
	* @module
	*/
	var { General: General$5, Gost, Strings: Strings$4, SourceNames: SourceNames$1 } = LOCALS;
	var xsl$3 = xslTemplates(General$5);
	var NON_BREAKING_SPACE = General$5.NonBreakingSpace;
	var SOURCE_TYPE_OPEN = General$5.Space + Gost.GeneralOpen;
	var SOURCE_TYPE_CLOSE = Gost.GeneralClose;
	var SHORT_TITLE_HEADER = NON_BREAKING_SPACE + General$5.Equal + General$5.Space;
	var COLON_SEPARATOR = NON_BREAKING_SPACE + General$5.EnumSeparator;
	var SEMICOLON_SEPARATOR = NON_BREAKING_SPACE + General$5.GroupSeparator;
	var HYPHEN_SECTION_HEADER = General$5.Dot + NON_BREAKING_SPACE + General$5.FromToDash + General$5.Space;
	var SLASH_HEADER = NON_BREAKING_SPACE + Gost.OneSlash + General$5.Space;
	var COLLECTION_NAME_HEADER = NON_BREAKING_SPACE + Gost.TwoSlash + General$5.Space;
	var PERSON_AND_OTHERS = General$5.Space + Gost.GeneralOpen + Strings$4.AndOthersUnCap + Gost.GeneralClose;
	var SINE_LOCO = Gost.GeneralOpen + Strings$4.SineLocoShort + Gost.GeneralClose;
	var SINE_NOMINE = Gost.GeneralOpen + Strings$4.SineNomineShort + Gost.GeneralClose;
	/**
	* The roles a type of source is named by, in the order they're looked for (`MainContributors`). GOST looks for more
	* roles than Word does to tell sources apart
	*/
	var MAIN_ROLES$2 = {
		Book: [
			"Author",
			"Editor",
			"Translator"
		],
		BookSection: ["Author"],
		JournalArticle: ["Author", "Editor"],
		ArticleInAPeriodical: ["Author"],
		ConferenceProceedings: ["Author"],
		Report: ["Author"],
		SoundRecording: [
			"Artist",
			"Performer",
			"Composer",
			"Conductor",
			"ProducerName"
		],
		Performance: [
			"Writer",
			"Director",
			"Performer",
			"ProducerName"
		],
		Art: ["Artist"],
		DocumentFromInternetSite: ["Author"],
		InternetSite: ["Author"],
		Film: [
			"Director",
			"Writer",
			"Performer",
			"ProducerName"
		],
		Interview: ["Interviewee"],
		Patent: ["Inventor"],
		ElectronicSource: [
			"Author",
			"Editor",
			"ProducerName",
			"Translator"
		],
		Case: ["Author", "Counsel"],
		Misc: [
			"Author",
			"Editor",
			"Compiler",
			"Translator"
		]
	};
	/** The string value of the people with a role, or the organization: their names one after another, as XPath reads it */
	var stringOf$1 = (names) => "corporate" in names ? names.corporate : names.people.map(({ last, first, middle }) => last + first + middle).join("");
	/** The people or organization a source is named by: those of the first of its type's roles it has a name in (`populateMain`) */
	var mainOf$1 = (source) => {
		const role = MAIN_ROLES$2[source.type].find((candidate) => {
			const candidateNames = source.names[candidate];
			return candidateNames !== void 0 && stringOf$1(candidateNames).length > 0;
		});
		const names = role === void 0 ? void 0 : source.names[role];
		if (names === void 0) return {
			people: [],
			corporate: ""
		};
		return "corporate" in names ? {
			people: [],
			corporate: names.corporate
		} : {
			people: names.people,
			corporate: ""
		};
	};
	var stringOfMain = (main) => main.corporate ? main.corporate : stringOf$1({ people: main.people });
	/**
	* The separator after a person of a list of people (`formatPersonSeparator`): " [et al.]" after the first of four or more,
	* a comma between the others, and "and" before the last
	*/
	var formatPersonSeparator$1 = (position, count) => {
		if (count > 3) return PERSON_AND_OTHERS;
		if (count - 1 > position) return General$5.ListSeparator;
		return position === count - 1 ? General$5.Space + Strings$4.AndUnCap + General$5.Space : "";
	};
	/**
	* People with a role, last name first (`formatPersons`). Of four or more, only the first is written, with " [et al.]".
	* The template writes an organization in their place, which its callers here write themselves
	*/
	var formatPersons$2 = (people) => {
		const count = people.length;
		return (count >= 4 ? people.slice(0, 1) : people).map((person, index) => xsl$3.formatName(person, Gost.Authors) + formatPersonSeparator$1(index + 1, count)).join("");
	};
	/**
	* The people with a role, after the role's abbreviation, such as "ed. Hall Grace", when one of them has a last name
	* (`formatEditor`, `formatTranslator` and the like)
	*/
	var formatRole = (source, role, header) => {
		const people = peopleOf(source, role);
		return people.some(({ last }) => last.length > 0) ? `${header}${General$5.Space}${formatPersons$2(people)}` : "";
	};
	/** The performers after "perf.", or the group that performed (`formatPerformer`) */
	var formatPerformer = (source) => {
		const names = source.names.Performer;
		return names !== void 0 && "corporate" in names ? `${Strings$4.PerformerShortUnCap}${General$5.Space}${names.corporate}` : formatRole(source, "Performer", Strings$4.PerformerShortUnCap);
	};
	/** The authors after "auth.", or the organization the source is named by (`formatAuthor`) */
	var formatAuthor = (source, main) => {
		if (main.corporate) return `${Strings$4.AuthorShortUnCap}${General$5.Space}${main.corporate}`;
		const people = peopleOf(source, "Author");
		return people.length > 0 ? `${Strings$4.AuthorShortUnCap}${General$5.Space}${formatPersons$2(people)}` : "";
	};
	/** The volume, such as "Vol. 3", or "Vols. 2-3" for more than one (the `volVolume` variable) */
	var formatVolume$1 = (volume, single, plural) => {
		if (volume.length === 0) return "";
		return textOfFormat(volume.includes(",") ? plural : translate(volume, General$5.Hyphens, "") === volume ? single : plural, volume);
	};
	/** The pages, such as "p. 5", or "pp. 10-20" for more than one */
	var formatPages$1 = (pages) => {
		if (pages.length === 0) return "";
		return `${pages.includes(",") ? Strings$4.PagesCountinousShort : translate(pages, General$5.Hyphens, "") === pages ? Strings$4.PageShort : Strings$4.PagesCountinousShort}${General$5.Space}${pages}`;
	};
	var textOfFormat = (format, parameter) => xsl$3.stringFormat(format, parameter).map((run) => run.text).join("");
	/** Parts joined by a separator, each written only when it isn't empty */
	var separated = (separator, ...parts) => parts.filter((part) => part.length > 0).join(separator);
	/** Up to four parts with " : " between them (`formatColonElement`) */
	var formatColonElement = (...parts) => separated(COLON_SEPARATOR, ...parts);
	/**
	* Where a source was published and by whom, such as "Chicago : Press", with "[s.l.]" or "[s.n.]" for one that's missing
	* (`formatLocationElement`). With neither, it is the source's distributor
	*/
	var formatLocationElement = (source, location, publisher, { distributor = "", noLocation = false } = {}) => {
		if (location.length === 0 && publisher.length === 0) return formatColonElement("", "", fieldOf(source, "Distributor"));
		return formatColonElement(noLocation ? "" : location.length === 0 ? SINE_LOCO : location, publisher.length === 0 ? SINE_NOMINE : publisher, distributor);
	};
	/** A section after " - ", such as ". - Chicago : Press, 2006", or nothing when both its parts are empty (`formatHyphenSection`) */
	var formatHyphenSection = (first, second = "") => first.length === 0 && second.length === 0 ? "" : HYPHEN_SECTION_HEADER + separated(General$5.ListSeparator, first, second);
	/** A date, such as "14 March 2018", or nothing without a year (`formatDateMonthYear` and `formatDateCore`) */
	var formatDate$1 = (day, month, year) => year.length === 0 ? "" : xsl$3.formatDatePrivate(day, month, year, Gost.Date);
	/**
	* The people responsible for the source, other than the ones it's named by, after " / ", in brackets when there are more
	* than two kinds of them (`formatPrimaryResponsibilities`). How many there are counts the kinds the source has, less one
	* for the people it's named by in GOST - Name Sort
	*/
	var formatPrimaryResponsibilities = (count, first = "", second = "", third = "") => (count > 0 ? SLASH_HEADER : "") + (count > 2 ? Gost.GeneralOpen : "") + first + (first !== "" && count > 1 ? SEMICOLON_SEPARATOR : "") + second + (first === "" && count > 1 || count > 2 ? SEMICOLON_SEPARATOR : "") + third + (count > 2 ? Gost.GeneralClose : "");
	/**
	* The people responsible for the source's publication, such as its editors, and the collection it is in, after " // "
	* (`formatSecondaryResponsibilities`)
	*/
	var formatSecondaryResponsibilities = (collection, ...elements) => {
		const written = elements.filter((element) => element.length > 0);
		if (collection.length > 0) return COLLECTION_NAME_HEADER + collection + written.map((element) => SLASH_HEADER + element).join("");
		return written.length > 0 ? SLASH_HEADER + written.join(SLASH_HEADER) : "";
	};
	/** The roles each type counts as primary responsibilities (`getNonEmpty_*_PrimSectionsCount`) */
	var PRIMARY_ROLES = {
		Book: ["Author"],
		BookSection: ["Author"],
		JournalArticle: ["Author"],
		ArticleInAPeriodical: ["Author"],
		ConferenceProceedings: ["Author"],
		Report: ["Author"],
		SoundRecording: ["Composer", "Artist"],
		Performance: [
			"Writer",
			"Performer",
			"Director"
		],
		Art: ["Artist"],
		DocumentFromInternetSite: ["Author"],
		InternetSite: ["Author"],
		Film: [
			"Writer",
			"Performer",
			"Director"
		],
		Interview: ["Interviewee"],
		Patent: ["Inventor"],
		ElectronicSource: ["Author"],
		Case: ["Author"],
		Misc: ["Author"]
	};
	/**
	* How many of its type's roles that count as primary responsibilities the source has people or an organization in. GOST
	* - Name Sort doesn't count an organization as a book section's author, as its template counts only people
	*/
	var countOf$1 = (source, sort) => PRIMARY_ROLES[source.type].filter((role) => {
		const names = source.names[role];
		return names !== void 0 && ("corporate" in names ? sort === "title" || source.type !== "BookSection" : names.people.length > 0);
	}).length;
	var field = (source, name) => fieldOf(source, name);
	/** Text after " : ", such as a report's type, when it isn't empty */
	var colonHeaded = (text) => text.length > 0 ? COLON_SEPARATOR + text : "";
	/**
	* A source's entry in a bibliography (the `b:Bibliography` part of the template that matches `/`): who it's by, its
	* title and type, the people responsible for it, where and when it was published, then its comments and its standard
	* number, each after " - ", and a dot.
	*/
	var formatEntry$1 = (source, sort) => {
		const main = mainOf$1(source);
		const mainString = stringOfMain(main);
		const unlessMain = (role, write) => {
			const names = source.names[role];
			return sort === "title" || names !== void 0 && stringOf$1(names) !== mainString ? write() : "";
		};
		const authors = unlessMain("Author", () => formatAuthor(source, main));
		const editors = unlessMain("Editor", () => formatRole(source, "Editor", Strings$4.EditorShortUnCap));
		const translators = unlessMain("Translator", () => formatRole(source, "Translator", Strings$4.TranslatorShortUnCap));
		const artists = unlessMain("Artist", () => formatRole(source, "Artist", Strings$4.ArtistShortUnCap));
		const composers = unlessMain("Composer", () => formatRole(source, "Composer", Strings$4.ComposerShortUnCapIso));
		const conductors = unlessMain("Conductor", () => formatRole(source, "Conductor", Strings$4.ConductorShortUnCap));
		const performers = unlessMain("Performer", () => formatPerformer(source));
		const writers = unlessMain("Writer", () => formatRole(source, "Writer", Strings$4.WriterShortUnCap));
		const directors = unlessMain("Director", () => formatRole(source, "Director", Strings$4.DirectorShortUnCap));
		const producers = unlessMain("ProducerName", () => formatRole(source, "ProducerName", Strings$4.ProducerShortUnCap));
		const interviewees = unlessMain("Interviewee", () => formatRole(source, "Interviewee", Strings$4.IntervieweeShortUnCap));
		const compilers = unlessMain("Compiler", () => formatRole(source, "Compiler", Strings$4.CompilerShortUnCapIso));
		const inventors = unlessMain("Inventor", () => formatRole(source, "Inventor", Strings$4.InventorShortUnCap));
		const counsel = unlessMain("Counsel", () => formatRole(source, "Counsel", Strings$4.CounselShortUnCap));
		const bookAuthors = unlessMain("BookAuthor", () => formatRole(source, "BookAuthor", Strings$4.BookAuthorShortUnCap));
		const volume = formatVolume$1(field(source, "Volume"), Strings$4.VolumeShortCap, Strings$4.VolumesShortCap);
		const pages = formatPages$1(field(source, "Pages"));
		const date = formatDate$1(field(source, "Day"), field(source, "Month"), field(source, "Year"));
		const city = field(source, "City");
		const publisher = field(source, "Publisher");
		const productionCompany = field(source, "ProductionCompany");
		const cityPublisherYear = formatHyphenSection(formatLocationElement(source, city, publisher), field(source, "Year"));
		const cityPublisherDate = formatHyphenSection(formatLocationElement(source, city, publisher), date);
		const issueVolume = formatHyphenSection(formatColonElement(field(source, "Issue"), volume));
		const pagesSection = formatHyphenSection(pages);
		const editionSection = formatHyphenSection(field(source, "Edition"));
		const volumeSection = formatHyphenSection(volume);
		const accessedSection = formatHyphenSection(formatDate$1(field(source, "DayAccessed"), field(source, "MonthAccessed"), field(source, "YearAccessed")));
		const mainSections = sort === "name" && (main.people.length > 0 || main.corporate.length > 0) ? 1 : 0;
		const primaryAuthors = sort === "title" ? authors : "";
		const primary = (first = "", second = "", third = "") => formatPrimaryResponsibilities(countOf$1(source, sort) - mainSections, first, second, third);
		const sectionsOf = {
			Book: () => primary(primaryAuthors) + formatSecondaryResponsibilities("", editors, translators) + cityPublisherYear + formatHyphenSection(formatColonElement(field(source, "Edition"), volume, field(source, "NumberVolumes"), pages)),
			BookSection: () => primary(primaryAuthors) + formatSecondaryResponsibilities(field(source, "BookTitle"), bookAuthors, editors, translators) + cityPublisherYear + formatHyphenSection(formatColonElement(field(source, "Edition"), volume, field(source, "NumberVolumes"))),
			JournalArticle: () => primary(primaryAuthors) + formatSecondaryResponsibilities(field(source, "JournalName"), editors) + cityPublisherDate + issueVolume + pagesSection,
			ArticleInAPeriodical: () => primary(primaryAuthors) + formatSecondaryResponsibilities(field(source, "PeriodicalTitle"), editors) + cityPublisherDate + editionSection + issueVolume + pagesSection,
			ConferenceProceedings: () => primary(primaryAuthors) + formatSecondaryResponsibilities(field(source, "ConferenceName"), editors) + cityPublisherYear + volumeSection + pagesSection,
			Report: () => colonHeaded(field(source, "ThesisType")) + primary(primaryAuthors) + formatSecondaryResponsibilities("", separated(SEMICOLON_SEPARATOR, field(source, "Department"), field(source, "Institution"))) + cityPublisherYear + pagesSection,
			SoundRecording: () => colonHeaded(field(source, "Medium")) + primary(artists, composers) + formatSecondaryResponsibilities(field(source, "AlbumTitle"), conductors, performers, producers) + formatHyphenSection(formatLocationElement(source, city, productionCompany), field(source, "Year")),
			Performance: () => primary(writers, performers, directors) + formatSecondaryResponsibilities("", producers) + formatHyphenSection(formatLocationElement(source, separated(SEMICOLON_SEPARATOR, field(source, "Theater"), city), productionCompany), date),
			Art: () => primary(artists) + formatHyphenSection(formatLocationElement(source, city, field(source, "Institution"))),
			DocumentFromInternetSite: () => primary(primaryAuthors) + formatSecondaryResponsibilities(field(source, "InternetSiteTitle"), editors, producers) + formatHyphenSection(productionCompany, date) + formatHyphenSection(field(source, "Version")) + accessedSection + formatHyphenSection(field(source, "URL")),
			InternetSite: () => primary(primaryAuthors) + formatSecondaryResponsibilities(field(source, "InternetSiteTitle"), editors, producers) + formatHyphenSection(productionCompany, date) + accessedSection + formatHyphenSection(field(source, "URL")),
			Film: () => primary(writers, performers, directors) + formatSecondaryResponsibilities("", producers) + formatHyphenSection(formatLocationElement(source, "", productionCompany, {
				distributor: field(source, "Distributor"),
				noLocation: true
			}), field(source, "Year")),
			Interview: () => (sort === "title" && interviewees + compilers + editors === "" ? "" : formatSecondaryResponsibilities("", interviewees, compilers, editors, translators)) + formatHyphenSection(formatLocationElement(source, city, separated(SEMICOLON_SEPARATOR, field(source, "Broadcaster"), field(source, "Station"), publisher)), date) + pagesSection,
			Patent: () => colonHeaded(field(source, "PatentNumber")) + colonHeaded(field(source, "Type")) + primary(inventors) + formatSecondaryResponsibilities("", editors, translators) + formatHyphenSection(field(source, "CountryRegion"), date),
			ElectronicSource: () => primary(authors) + formatSecondaryResponsibilities("", editors, producers, translators) + formatHyphenSection(formatLocationElement(source, city, separated(SEMICOLON_SEPARATOR, publisher, productionCompany)), date) + editionSection + volumeSection,
			Case: () => colonHeaded(field(source, "CaseNumber")) + colonHeaded(field(source, "AbbreviatedCaseNumber")) + primary(authors) + formatSecondaryResponsibilities("", counsel) + formatHyphenSection(formatLocationElement(source, city, field(source, "Court")), date),
			Misc: () => primary(authors) + formatSecondaryResponsibilities(field(source, "PublicationTitle"), compilers, editors, translators) + cityPublisherDate + editionSection + volumeSection + pagesSection
		};
		const { type } = source;
		const titles = (type === "InternetSite" || type === "DocumentFromInternetSite" ? SOURCE_TYPE_OPEN + Strings$4.OnlineCap + SOURCE_TYPE_CLOSE : type === "Misc" || type === "ElectronicSource" || type === "Film" ? field(source, "Medium") && SOURCE_TYPE_OPEN + field(source, "Medium") + SOURCE_TYPE_CLOSE : SOURCE_TYPE_OPEN + SourceNames$1[type] + SOURCE_TYPE_CLOSE) + (type === "ElectronicSource" && field(source, "PublicationTitle") ? SHORT_TITLE_HEADER + field(source, "PublicationTitle") : "") + (type === "Case" && field(source, "Reporter") ? SHORT_TITLE_HEADER + field(source, "Reporter") : "") + (field(source, "ShortTitle") ? SHORT_TITLE_HEADER + field(source, "ShortTitle") : "");
		const text = join(sort === "name" ? join(bold(main.corporate ? main.corporate : formatPersons$2(main.people)), General$5.Space, field(source, "Title")) : bold(field(source, "Title")), titles, sectionsOf[type](), formatHyphenSection(field(source, "Comments")), formatHyphenSection(field(source, "StandardNumber")));
		return /^[ \t\r\n]*$/.test(textOf(text)) ? [] : join(text, General$5.Dot);
	};
	/**
	* A source of a citation (the `b:Citation` part of the template that matches `/`), such as "(Baker, 2010 p. 50)": the
	* last name of the first of the people it's named by, with ", et al." when there are more, its year, and the volume or
	* pages cited. It is its tag when it has neither people nor a year
	*/
	var formatCitation$1 = ({ source, first, last, hideAuthor, hideYear, pages, volume, prefix, suffix }) => {
		const main = mainOf$1(source);
		const author0 = main.corporate ? main.corporate : main.people.length === 0 ? "" : xsl$3.formatName(main.people[0], Gost.CitationShort) + (main.people.length > 1 ? General$5.AuthorsSeparator + Strings$4.AndOthersUnCap : "");
		const year0 = fieldOf(source, "Year");
		const author = hideAuthor ? "" : author0;
		const year = hideYear ? "" : year0;
		const volumeCited = formatVolume$1(volume, Strings$4.VolumeShortUnCap, Strings$4.VolumesShortUnCap);
		const pagesCited = formatPages$1(pages);
		return join(first ? General$5.OpenBracket : "", prefix !== null && prefix !== void 0 ? prefix : "", author, year ? (author ? General$5.ListSeparator : "") + year : "", author0 === "" && year0 === "" ? source.tag : "", volume || pages ? (author || year ? General$5.Space : "") + (volume && pages ? volume + General$5.Enum + pages : volumeCited || pagesCited) : "", suffix !== null && suffix !== void 0 ? suffix : "", last ? General$5.CloseBracket : General$5.GroupSeparator);
	};
	//#endregion
	//#region src/bibliography/styles/gost-name-sort.ts
	/**
	* Word's GOST - Name Sort style (GostName.XSL): citations such as "(Baker, 2010 p. 50)", and a bibliography of entries
	* such as "**Dickens Charles John** How to Write Bibliographies [Book]. - Chicago : Adventure Works Press, 2006.", each
	* starting with its authors in bold, sorted by them.
	*
	* @module
	*/
	/** What the bibliography is sorted by (`b:SortingString`, as `populateMain` writes it): the authors, then the title */
	var sortingStringOf$3 = (source) => {
		const main = mainOf$1(source);
		const author = main.corporate ? main.corporate : formatPersons$2(main.people);
		const title = fieldOf(source, "Title");
		return (author ? ` ${author}` : "") + (title ? ` ${title}` : "");
	};
	/**
	* Word's GOST - Name Sort style.
	*
	* @internal
	*/
	var gostNameSort = {
		name: "GOST - Name Sort",
		file: "GostName.XSL",
		version: "2003",
		citation: formatCitation$1,
		bibliography: (sources) => ({
			hangingIndent: false,
			paragraphs: sortByKey(sources, sortingStringOf$3).map((source) => formatEntry$1(source, "name"))
		})
	};
	//#endregion
	//#region src/bibliography/styles/gost-title-sort.ts
	/**
	* Word's GOST - Title Sort style (GostTitle.XSL): citations such as "(Baker, 2010 p. 50)", and a bibliography of entries
	* such as "**How to Write Bibliographies** [Book] / auth. Dickens Charles John. - Chicago : Adventure Works Press,
	* 2006.", each starting with its title in bold, sorted by it.
	*
	* @module
	*/
	/**
	* The sources sorted by title, then by the last, first and middle names of the first of the people they're named by
	* (`sortedList`). Each sort keeps the order of the one before for sources it doesn't tell apart, so sorting by the last
	* key first sorts by them all
	*/
	var sorted = (sources) => {
		const person = (source) => {
			var _mainOf$people$;
			return (_mainOf$people$ = mainOf$1(source).people[0]) !== null && _mainOf$people$ !== void 0 ? _mainOf$people$ : {
				last: "",
				first: "",
				middle: ""
			};
		};
		return [
			(source) => person(source).middle,
			(source) => person(source).first,
			(source) => person(source).last,
			(source) => fieldOf(source, "Title")
		].reduce((list, key) => sortByKey(list, key), sources);
	};
	/**
	* Word's GOST - Title Sort style.
	*
	* @internal
	*/
	var gostTitleSort = {
		name: "GOST - Title Sort",
		file: "GostTitle.XSL",
		version: "2003",
		citation: formatCitation$1,
		bibliography: (sources) => ({
			hangingIndent: false,
			paragraphs: sorted(sources).map((source) => formatEntry$1(source, "title"))
		})
	};
	//#endregion
	//#region src/bibliography/styles/harvard-anglia.ts
	/**
	* Harvard - Anglia: Word's `HarvardAnglia2008OfficeOnline.xsl`, written in TypeScript.
	*
	* Citations name each source's authors and year, such as "(Baker, 2010)". The bibliography lists the sources by author,
	* each with its year after the authors, such as "Baker, A., 2010. The Art of Pizza. London: Baker Books.".
	*
	* Each function follows the XSL template or variable named in its description, including where that doesn't do what it
	* looks like it should, so the citations and bibliography are the ones Word writes.
	*
	* @module
	*/
	var general = LOCALS.General;
	var strings = LOCALS.Strings;
	var xsl$2 = xslTemplates(general);
	var apaWording = LOCALS.APA;
	/** "&" with a space each side, between the last two people (`templ_prop_BeforeLastAuthor`) */
	var AND = general.Space + apaWording.BeforeLastAuthor + general.Space;
	/** What the bibliography names a source by when it has nobody to name it by, which the style writes as it is */
	var ANONYMOUS = "Anon., ";
	/** The roles a source is named by, in the order the style looks for them (`MainContributors`, `MainImportantContributors`) */
	var MAIN_CONTRIBUTORS = {
		Book: ["Author", "Editor"],
		BookSection: ["Author", "Editor"],
		ConferenceProceedings: ["Author", "Editor"],
		Misc: ["Author", "Editor"],
		JournalArticle: ["Author", "Editor"],
		ArticleInAPeriodical: ["Author", "Editor"],
		InternetSite: ["Author"],
		ElectronicSource: ["Author"],
		Report: ["Author"],
		DocumentFromInternetSite: ["Author"],
		SoundRecording: [
			"Composer",
			"Conductor",
			"Performer"
		],
		Performance: ["Writer"],
		Art: ["Artist"],
		Interview: ["Interviewee"],
		Patent: ["Inventor"],
		Case: [],
		Film: []
	};
	/** The text of the people with a role, or of the organization, as `string-length(b:Author/b:Role)` reads it */
	var namesText = (names) => !names ? "" : "corporate" in names ? names.corporate : names.people.map(({ last, first, middle }) => last + first + middle).join("");
	/** The first of the roles the source is named by that has anybody's name in it */
	var mainContributorsOf$1 = (source) => MAIN_CONTRIBUTORS[source.type].find((role) => namesText(source.names[role]) !== "");
	/** The text with each part replaced, left to right (`FindReplaceString`) */
	var findReplaceString = (originalString, stringToBeReplaced, stringReplacement) => originalString.split(stringToBeReplaced).join(stringReplacement);
	/** The text without the spaces, tabs and line breaks at its end (`right-trim`) */
	var rightTrim$1 = (s) => s.replace(/[ \t\r\n]+$/, "");
	/** The text without the spaces at its start (`left-trim`) */
	var leftTrim$1 = (s) => s.replace(/^ +/, "");
	/** The initials of a name, each with a dot, such as "M. A." of "Mary Ann" (`splitAuthorSpace`) */
	var splitAuthorSpace$1 = (first) => {
		const space = first.indexOf(" ");
		return space < 0 ? first.slice(0, 1) + general.Dot : first.slice(0, space).slice(0, 1) + general.Dot + general.Space + splitAuthorSpace$1(leftTrim$1(first.slice(space + 1)));
	};
	/** The initials of a name with hyphens, such as "J.-P." of "Jean-Paul" (`HandleHypenInAuthor`) */
	var handleHypenInAuthor = (authour, retVal = "") => {
		const dash = general.FromToDash;
		const initial = !authour.startsWith(dash) && retVal === "" ? authour.slice(0, 1) + general.Dot : "";
		const index = authour.indexOf(dash);
		if (index < 0) return initial + retVal;
		const after = authour.slice(index + dash.length);
		return initial + handleHypenInAuthor(after, retVal + dash + after.slice(0, 1) + general.Dot);
	};
	/** The initials of each word of a name with hyphens, such as "M. J.-P." of "Mary Jean-Paul" (`HandleSPaceHypenInAuthor`) */
	var handleSpaceHypenInAuthor = (author) => {
		const space = author.indexOf(" ");
		return space < 0 ? handleHypenInAuthor(author) : handleHypenInAuthor(author.slice(0, space)) + general.Space + handleSpaceHypenInAuthor(leftTrim$1(author.slice(space + 1)));
	};
	/** The initials of a first or middle name, with or without hyphens (`xsl:when test="contains(b:First,$prop_APA_FromToDash)"`) */
	var initialsOf = (name) => name.includes(general.FromToDash) ? handleSpaceHypenInAuthor(rightTrim$1(name)) : splitAuthorSpace$1(rightTrim$1(name));
	/**
	* People, last name first, such as "Smith, J. & Jones, M. A., ", or the first of five or more and "et al., " (the
	* people of `BibDisplayAuthor`, which `BibDisplayArtist`, `BibDisplayAuthorSoundRec` and the others write the same way)
	*/
	var bibDisplayPeople = (people) => {
		if (people.length >= 5) {
			const [{ last, first, middle }] = people;
			return (last ? last + general.ListSeparator : "") + (first ? initialsOf(first) + (first.includes(general.FromToDash) ? "" : general.Space) : "") + (middle ? initialsOf(middle) + general.Space : "") + strings.AndOthersUnCap + general.ListSeparator;
		}
		return people.map(({ last, first, middle }, index) => {
			const beforeLast = index === people.length - 2;
			return (last ? last + (!first && !middle && beforeLast ? AND : general.ListSeparator) : "") + (first ? initialsOf(first) + (middle ? general.Space : beforeLast ? AND : general.ListSeparator) : "") + (middle ? initialsOf(middle) + (beforeLast ? AND : general.ListSeparator) : "");
		}).join("");
	};
	/**
	* The editors, last name first, such as "Hall, G., ed." or "Garcia, L. & Nguyen, B. eds.", which a source with no
	* authors is listed by (`BibDisplayEditorNL`)
	*/
	var bibDisplayEditorNL = (editors) => {
		const [{ last, first, middle }] = editors;
		if (editors.length === 1) return (last ? last + (first || middle ? general.ListSeparator : general.Space) : "") + (first ? initialsOf(first) + (middle ? general.Space : general.ListSeparator) : "") + (middle ? initialsOf(middle) + general.Space : "") + strings.EditorShortUnCap;
		if (editors.length >= 5) return (last ? last + general.ListSeparator : "") + (first ? initialsOf(first) + general.Space : "") + (middle ? initialsOf(middle) + general.Space : "") + strings.AndOthersUnCap + general.Space + strings.UnCapEditorsShort;
		return editors.map((editor, index) => {
			const beforeLast = index === editors.length - 2;
			const after = index === editors.length - 1 ? general.Space : general.ListSeparator;
			return (editor.last ? editor.last + general.ListSeparator : "") + (editor.first ? initialsOf(editor.first) + (editor.middle ? general.Space : beforeLast ? AND : after) : "") + (editor.middle ? initialsOf(editor.middle) + (beforeLast ? AND : after) : "");
		}).join("") + strings.UnCapEditorsShort;
	};
	/**
	* The authors, or else the organization that is the author, or else when it is asked for the editors, or "Anon., "
	* (`BibDisplayAuthor`, and its `DisplayEditorIfAuthorUnavailale`)
	*/
	var bibDisplayAuthor = (source, displayEditorIfAuthorUnavailable = false) => {
		const authors = peopleOf(source, "Author");
		const corporate = organizationOf(source, "Author");
		const editors = peopleOf(source, "Editor");
		if (authors.length) return bibDisplayPeople(authors);
		if (corporate) return corporate + general.ListSeparator;
		return editors.length && displayEditorIfAuthorUnavailable ? bibDisplayEditorNL(editors) + general.ListSeparator : ANONYMOUS;
	};
	/**
	* The people with a role, or "Anon., " (`BibDisplayArtist`, and `BibDisplayAuthorPerformance` and
	* `BibDisplayAuthorInterview` with the writers and interviewees)
	*/
	var bibDisplayArtist = (people) => people.length ? bibDisplayPeople(people) : ANONYMOUS;
	/** The inventors, or else the organization that is the author, or "Anon., " (`BibDisplayAuthorPatent`) */
	var bibDisplayAuthorPatent = (source) => {
		const inventors = peopleOf(source, "Inventor");
		const corporate = organizationOf(source, "Author");
		return inventors.length ? bibDisplayPeople(inventors) : corporate ? corporate + general.ListSeparator : ANONYMOUS;
	};
	/** The composers, or else the conductors or the performers, or the organization that performs, or "Anon., " (`BibDisplayAuthorSoundRec`) */
	var bibDisplayAuthorSoundRec = (source) => {
		const people = [
			peopleOf(source, "Composer"),
			peopleOf(source, "Conductor"),
			peopleOf(source, "Performer")
		].find((list) => list.length);
		const corporate = organizationOf(source, "Performer");
		return people ? bibDisplayPeople(people) : corporate ? corporate + general.ListSeparator : ANONYMOUS;
	};
	/**
	* The editors of the book a section is in, first name first, such as "G. Hall, ed. ", when the section has authors
	* (`BibDisplayEditor`)
	*/
	var bibDisplayEditor = (source) => {
		const editors = peopleOf(source, "Editor");
		if (!peopleOf(source, "Author").length && !organizationOf(source, "Author")) return "";
		const [{ last, first, middle }] = editors;
		if (editors.length === 1) return (first ? splitAuthorSpace$1(rightTrim$1(first)) + general.Space : "") + (middle ? splitAuthorSpace$1(rightTrim$1(middle)) + general.Space : "") + (last ? last + general.ListSeparator : "") + strings.EditorShortUnCap + general.Space;
		if (editors.length >= 5) return (first ? splitAuthorSpace$1(rightTrim$1(first)) + general.Space : "") + (middle ? splitAuthorSpace$1(rightTrim$1(middle)) + general.Space : "") + (last ? last + general.ListSeparator : "") + strings.AndOthersUnCap + general.Space + strings.UnCapEditorsShort + general.Space;
		return editors.map((editor, index) => {
			const end = index === editors.length - 2 ? AND : general.ListSeparator;
			return (editor.first ? splitAuthorSpace$1(rightTrim$1(editor.first)) + (!editor.middle && !editor.last ? end : general.Space) : "") + (editor.middle ? splitAuthorSpace$1(rightTrim$1(editor.middle)) + (!editor.last ? end : general.Space) : "") + (editor.last ? editor.last + end : "");
		}).join("") + strings.UnCapEditorsShort + general.Space;
	};
	/** "Directed by John Smith. ", or by several directors, when the film has any (`BibDisplayDirector`) */
	var bibDisplayDirector = (source) => {
		const directors = peopleOf(source, "Director");
		const directorName = directors.map(({ last, first, middle }, index) => {
			const isLast = index === directors.length - 1;
			const end = !isLast ? general.ListSeparator : directors.length === 1 ? general.Dot + general.Space : general.Dot;
			return (first ? first + (last || middle ? general.Space : end) : "") + (middle ? middle + (last ? general.Space : end) : "") + (last ? last + (isLast ? general.Dot + general.Space : general.ListSeparator) : "");
		}).join("");
		return directorName ? findReplaceString(strings.DirectedByCap, "%1", directorName) : "";
	};
	/** The year and a dot, or "n.d.", and a space (`BibDisplayYear`) */
	var bibDisplayYear = (source) => (fieldOf(source, "Year") ? fieldOf(source, "Year") + general.Dot : strings.NoDateShortUnCap) + general.Space;
	/** A case's year in brackets, or "(n.d.)", with a dot when it has no reporter, and a space (`BibDisplayYearCase`) */
	var bibDisplayYearCase = (source) => general.OpenBracket + (fieldOf(source, "Year") || strings.NoDateShortUnCap) + general.CloseBracket + (fieldOf(source, "Reporter") ? "" : general.Dot) + general.Space;
	/** An interview's date, such as "(3 May 2010).", or its year, or "n.d." (`BibDisplayDayMonthYear`) */
	var bibDisplayDayMonthYear = (source) => {
		const day = fieldOf(source, "Day");
		const month = fieldOf(source, "Month");
		const year = fieldOf(source, "Year");
		if (!year) return strings.NoDateShortUnCap;
		return month ? general.OpenBracket + (day ? day + general.Space : "") + month + general.Space + year + general.CloseBracket + general.Dot : year + general.Dot;
	};
	/** The title, a dot and a space (`BibDisplayTitle`) */
	var bibDisplayTitle = (source) => fieldOf(source, "Title") ? rightTrim$1(fieldOf(source, "Title")) + general.Dot + general.Space : "";
	/** The title and a space (`BibDisplayTitleInt`, and `BibDisplayTitleCase`, which is the same) */
	var bibDisplayTitleInt = (source) => fieldOf(source, "Title") ? fieldOf(source, "Title") + general.Space : "";
	/** The title, a comma and a space (`BibDisplayTitleES`) */
	var bibDisplayTitleES = (source) => fieldOf(source, "Title") ? fieldOf(source, "Title") + general.ListSeparator + general.Space : "";
	/** A section's title and a dot, and a space when it has authors (`BibDisplayTitleBC`) */
	var bibDisplayTitleBC = (source) => fieldOf(source, "Title") ? fieldOf(source, "Title") + general.Dot + (peopleOf(source, "Author").length ? general.Space : "") : "";
	/** The title of the book a section is in, a dot and a space (`BibDisplayBookTitle`) */
	var bibDisplayBookTitle = (source) => fieldOf(source, "BookTitle") ? fieldOf(source, "BookTitle") + general.Dot + general.Space : "";
	/** The journal's name, and a comma when more follows or else a dot (`BibDisplayJournalName`) */
	var bibDisplayJournalName = (source) => {
		return fieldOf(source, "JournalName") ? fieldOf(source, "JournalName") + ([
			"Month",
			"Pages",
			"Volume",
			"Issue"
		].some((field) => fieldOf(source, field)) ? general.ListSeparator + general.Space : general.Dot) : "";
	};
	/** The volume and issue, such as "7(2)", "Volume 7" or "Issue 2", and a comma before pages or else a dot */
	var volumeAndIssueOf = (source) => {
		const volume = fieldOf(source, "Volume");
		const issue = fieldOf(source, "Issue");
		const end = fieldOf(source, "Pages") ? general.ListSeparator : general.Dot;
		if (volume) return (issue ? volume + general.OpenBracket + issue + general.CloseBracket : findReplaceString(strings.VolumeCap, "%1", volume)) + end;
		return issue ? `Issue${general.Space}${issue}${end}` : "";
	};
	/** A journal article's date, then its volume and issue (`BibDisplayVolumeIssueJA`) */
	var bibDisplayVolumeIssueJA = (source) => {
		const day = fieldOf(source, "Day");
		const month = fieldOf(source, "Month");
		return (month ? (day ? day + general.Space + month : month) + ((fieldOf(source, "Volume") || fieldOf(source, "Issue")) && fieldOf(source, "Pages") ? general.ListSeparator : general.Dot) : "") + volumeAndIssueOf(source);
	};
	/** A periodical's title in italics, its date, then its volume and issue (`BibDisplayVolumeIssue`) */
	var bibDisplayVolumeIssue = (source) => {
		const periodicalTitle = fieldOf(source, "PeriodicalTitle");
		const day = fieldOf(source, "Day");
		const month = fieldOf(source, "Month");
		const afterTitle = [
			"Month",
			"Volume",
			"Issue",
			"Pages"
		];
		const afterMonth = [
			"Volume",
			"Issue",
			"Pages"
		];
		const end = (fields) => (fields.some((field) => fieldOf(source, field)) ? general.ListSeparator : general.Dot) + general.Space;
		return join(periodicalTitle ? join(italic(periodicalTitle), end(afterTitle)) : "", month ? (day ? day + general.Space : "") + month + end(afterMonth) : "", volumeAndIssueOf(source));
	};
	/** The city, with its state or province in brackets, or "s.l.", and a colon (`BibDisplayCity`) */
	var bibDisplayCity = (source) => {
		const city = fieldOf(source, "City");
		const state = fieldOf(source, "StateProvince");
		return (city && state ? city + general.OpenBracket + state + general.CloseBracket : city || state || strings.SineLocoShort) + (city || state ? general.EnumSeparator : general.Enum);
	};
	/** The city, or "s.l.", and ": " (`BibDisplayCityReport`) */
	var bibDisplayCityReport = (source) => (fieldOf(source, "City") || strings.SineLocoShort) + general.EnumSeparator;
	/** The city, or "s.l.", and a comma (`BibDisplayConfCityConfProc`) */
	var bibDisplayConfCityConfProc = (source) => fieldOf(source, "City") ? fieldOf(source, "City") + general.ListSeparator + general.Space : strings.SineLocoShort + general.ListSeparator;
	/** The publisher and a dot, or "s.n." (`BibDisplayPublisher`) */
	var bibDisplayPublisher = (source) => fieldOf(source, "Publisher") ? fieldOf(source, "Publisher") + general.Dot : strings.SineNomineShort;
	/**
	* The publisher, or "s.n.", and a comma before pages, or else a dot after a publisher (`BibDisplayConfPublisher`, and
	* `BibDisplayPublisherBC`, which is the same)
	*/
	var bibDisplayConfPublisher = (source) => {
		const pages = fieldOf(source, "Pages");
		return fieldOf(source, "Publisher") ? fieldOf(source, "Publisher") + (pages ? general.ListSeparator + general.Space : general.Dot) : strings.SineNomineShort + (pages ? general.ListSeparator + general.Space : "");
	};
	/** Pages, such as "p. 5" or "pp. 5-9", which the style writes in English whatever the language (`DisplayPageOrPages`) */
	var displayPageOrPages = (pages) => (pages.includes("-") || pages.includes(",") ? "pp. " : "p. ") + pages;
	/** The pages and a dot (`BibDisplayPages`) */
	var bibDisplayPages = (source) => fieldOf(source, "Pages") ? displayPageOrPages(fieldOf(source, "Pages")) + general.Dot : "";
	/** The edition and "ed. ", which is the style's word for an editor (`BibDisplayEdition`) */
	var bibDisplayEdition = (source) => fieldOf(source, "Edition") ? fieldOf(source, "Edition") + general.Space + strings.EditorShortUnCap + general.Space : "";
	/** "[Online]", and a space before where it is or a dot (`BibDisplayStrOnline`) */
	var bibDisplayStrOnline = (source) => apaWording.SecondaryOpen + strings.OnlineCap + apaWording.SecondaryClose + (fieldOf(source, "URL") || fieldOf(source, "YearAccessed") ? general.Space : general.Dot);
	/** "Available at: " and the address, underlined, on a line of its own (`BibDisplayURL`) */
	var bibDisplayURL = (source) => fieldOf(source, "URL") ? join(LINE_BREAK, "Available at:", general.Space, underline(fieldOf(source, "URL"))) : [];
	/** "[Accessed 20 April 2023].", on a line of its own (`BibDisplayAccessedDates`) */
	var bibDisplayAccessedDates = (source) => {
		const year = fieldOf(source, "YearAccessed");
		const month = fieldOf(source, "MonthAccessed");
		const day = fieldOf(source, "DayAccessed");
		if (!year) return [];
		const date = month ? (day ? day + general.Space : "") + month + general.Space + year : year;
		return join(LINE_BREAK, general.Space + apaWording.SecondaryOpen + findReplaceString(strings.AccessedCap, " %1", general.Space) + date + apaWording.SecondaryClose + general.Dot);
	};
	/** The country or region, and a comma before the patent's number or else a dot, or "s.l. " (`BibDisplayCountryRegionPatent`) */
	var bibDisplayCountryRegionPatent = (source) => fieldOf(source, "CountryRegion") ? fieldOf(source, "CountryRegion") + (fieldOf(source, "PatentNumber") ? general.ListSeparator : general.Dot) : strings.SineLocoShort + general.Space;
	/** "Patent No. 123." (`BibDisplayPatentNumber`) */
	var bibDisplayPatentNumber = (source) => fieldOf(source, "PatentNumber") ? findReplaceString(strings.PatentNumberShortCap, "%1", fieldOf(source, "PatentNumber")) + general.Dot : "";
	/** The country or region, or "s.l.", and ": " (`BibDisplayCountryRegion`) */
	var bibDisplayCountryRegion = (source) => (fieldOf(source, "CountryRegion") || strings.SineLocoShort) + general.EnumSeparator;
	/** The production company and a dot, or "s.n." (`BibDisplayProductionCompany`) */
	var bibDisplayProductionCompany = (source) => fieldOf(source, "ProductionCompany") ? fieldOf(source, "ProductionCompany") + general.Dot : strings.SineNomineShort;
	/** The text of a source's entry in the bibliography, by its type (`ProceedBibliography`) */
	var proceedBibliography = (source) => {
		const field = (name) => fieldOf(source, name);
		switch (source.type) {
			case "BookSection": return join(bibDisplayAuthor(source, true), bibDisplayYear(source), bibDisplayTitleBC(source), general.Space, findReplaceString(strings.InNameCap, " %1", general.EnumSeparator), peopleOf(source, "Editor").length ? bibDisplayEditor(source) + (peopleOf(source, "Author").length ? general.Space : "") : "", italic(bibDisplayBookTitle(source)), bibDisplayEdition(source), bibDisplayCity(source), bibDisplayConfPublisher(source), bibDisplayPages(source));
			case "InternetSite":
			case "DocumentFromInternetSite": return join(bibDisplayAuthor(source), bibDisplayYear(source), italic(bibDisplayTitle(source)), bibDisplayStrOnline(source), bibDisplayURL(source), bibDisplayAccessedDates(source));
			case "JournalArticle": return join(bibDisplayAuthor(source, true), bibDisplayYear(source), bibDisplayTitle(source), italic(bibDisplayJournalName(source)), bibDisplayVolumeIssueJA(source), bibDisplayPages(source));
			case "ArticleInAPeriodical": return join(bibDisplayAuthor(source, true), bibDisplayYear(source), bibDisplayTitle(source), bibDisplayVolumeIssue(source), bibDisplayPages(source));
			case "ConferenceProceedings": return join(bibDisplayAuthor(source, true), bibDisplayYear(source), italic(bibDisplayTitle(source)), bibDisplayConfCityConfProc(source), bibDisplayConfPublisher(source), bibDisplayPages(source));
			case "Report": return join(bibDisplayAuthor(source), bibDisplayYear(source), italic(bibDisplayTitleES(source)), bibDisplayCityReport(source), bibDisplayPublisher(source));
			case "ElectronicSource": return join(bibDisplayAuthor(source), bibDisplayYear(source), italic(bibDisplayTitleES(source)), bibDisplayCityReport(source), bibDisplayConfPublisher(source));
			case "Art": return join(bibDisplayArtist(peopleOf(source, "Artist")), bibDisplayYear(source), italic(bibDisplayTitle(source)), apaWording.SecondaryOpen + LOCALS.SourceNames.Art + apaWording.SecondaryClose, field("Institution") ? general.Space + general.OpenBracket + field("Institution") + general.CloseBracket : "", general.Dot);
			case "SoundRecording": return join(bibDisplayAuthorSoundRec(source), bibDisplayYear(source), italic(bibDisplayTitle(source)), apaWording.SecondaryOpen + LOCALS.SourceNames.SoundRecording + apaWording.SecondaryClose, field("ProductionCompany") ? general.Space + general.OpenBracket + field("ProductionCompany") + general.CloseBracket + general.Dot : general.Dot);
			case "Performance": return join(bibDisplayArtist(peopleOf(source, "Writer")), bibDisplayYear(source), italic(bibDisplayTitle(source)), bibDisplayCityReport(source), bibDisplayProductionCompany(source));
			case "Interview": return join(bibDisplayArtist(peopleOf(source, "Interviewee")), bibDisplayYear(source), italic(bibDisplayTitleInt(source)), apaWording.SecondaryOpen + strings.InterviewCap + apaWording.SecondaryClose + general.Space, bibDisplayDayMonthYear(source));
			case "Patent": return join(bibDisplayAuthorPatent(source), bibDisplayYear(source), italic(bibDisplayTitle(source)), bibDisplayCountryRegionPatent(source), bibDisplayPatentNumber(source));
			case "Film": return join(italic(bibDisplayTitle(source)), bibDisplayYear(source), apaWording.SecondaryOpen + LOCALS.SourceNames.Film + apaWording.SecondaryClose + general.Space, bibDisplayDirector(source), bibDisplayCountryRegion(source), bibDisplayProductionCompany(source));
			case "Case": return join(italic(bibDisplayTitleInt(source)), bibDisplayYearCase(source), field("Reporter") ? field("Reporter") + general.Dot + general.Space : "");
			default: return join(bibDisplayAuthor(source, true), bibDisplayYear(source), italic(bibDisplayTitle(source)), bibDisplayEdition(source), bibDisplayCity(source), bibDisplayPublisher(source));
		}
	};
	/** The initials of a name, with no dots or spaces, such as "MA" of "Mary Ann" (`splitNameSpace`) */
	var splitNameSpace = (first) => {
		const space = first.indexOf(" ");
		return space < 0 ? first.slice(0, 1) : first.slice(0, space).slice(0, 1) + splitNameSpace(first.slice(space + 1));
	};
	/** The first four people, each as their last name and initials with nothing between, such as "SmithJJonesMA" (`formatPersonsAuthor`) */
	var formatPersonsAuthor$1 = (people) => people.slice(0, 4).map(({ last, first, middle }) => last + splitNameSpace(first) + splitNameSpace(middle)).join("");
	/**
	* A source's key in the order of the bibliography: who it is named by, or "Anon.", its year, or "n.d.", and its title,
	* or a case's or film's title and year (`b:SortingString`)
	*/
	var sortingStringOf$2 = (source) => {
		const role = mainContributorsOf$1(source);
		const title = fieldOf(source, "Title");
		const year = fieldOf(source, "Year") || "n.d.";
		if (source.type === "Case" || source.type === "Film") return title + year;
		return ((role ? organizationOf(source, role) || formatPersonsAuthor$1(peopleOf(source, role)) : "") || "Anon.") + year + title;
	};
	/**
	* How a citation names a source by its main people: one person's last name, two joined by "&", or the first of three
	* or more and "et al.", or else the organization that is the author, or "Anon." (`MainContributors`, as the citation
	* calls it, with no `returnType`)
	*/
	var mainContributorsNameOf = (source) => {
		const role = mainContributorsOf$1(source);
		const people = role ? peopleOf(source, role) : [];
		if (!people.length) return organizationOf(source, "Author") || "Anon.";
		const part = people.some((person) => person.last) ? "last" : people.some((person) => person.first) ? "first" : "middle";
		const [name] = people.map((person) => person[part]).filter((value) => value !== "");
		return people.length === 1 ? name : people.length === 2 ? `${name} & ${people[1][part]}` : `${name}, et al.`;
	};
	/** The volume or pages cited, such as "2:5", "vol. 2" or "pp. 5-9" (`VolumePages`) */
	var volumePages = (volume, pages) => {
		if (volume && pages) return volume + general.Enum + pages;
		if (volume) {
			const several = volume.includes(",") || translate(volume, general.Hyphens, "") !== volume;
			return textOf(xsl$2.stringFormat(several ? strings.VolumesShortUnCap : strings.VolumeShortUnCap, volume));
		}
		return pages ? displayPageOrPages(pages) : "";
	};
	/**
	* A source of a citation, such as "(Baker, 2010, p. 50" before the next source's "; ": a case or a film by its title, and
	* any other source by its people (`Citation`)
	*/
	var citation$2 = (cited) => {
		var _cited$prefix, _cited$suffix;
		const { source } = cited;
		const year = fieldOf(source, "Year") || strings.NoDateShortUnCap;
		const volpagesInfo = volumePages(cited.volume, cited.pages);
		const name = source.type === "Case" || source.type === "Film" ? cited.hideTitle ? "" : fieldOf(source, "Title") : cited.hideAuthor ? "" : mainContributorsNameOf(source);
		let text = cited.first ? general.OpenBracket : "";
		text += (_cited$prefix = cited.prefix) !== null && _cited$prefix !== void 0 ? _cited$prefix : "";
		if (name) text += name + (!cited.hideYear || volpagesInfo ? general.ListSeparator : "");
		if (!cited.hideYear) text += year + (volpagesInfo ? general.ListSeparator : "");
		text += volpagesInfo;
		text += (_cited$suffix = cited.suffix) !== null && _cited$suffix !== void 0 ? _cited$suffix : "";
		text += cited.last ? general.CloseBracket : general.GroupSeparator;
		return join(text);
	};
	/** Harvard - Anglia: Word's `HarvardAnglia2008OfficeOnline.xsl` */
	var harvardAnglia = {
		name: "Harvard - Anglia",
		file: "HarvardAnglia2008OfficeOnline.xsl",
		version: "2008",
		citation: citation$2,
		bibliography: (sources) => ({
			paragraphs: sortByKey(sources, sortingStringOf$2).map(proceedBibliography),
			hangingIndent: false
		})
	};
	//#endregion
	//#region src/bibliography/styles/ieee.ts
	/**
	* IEEE: citations such as "[1]" or "[1, p. 50]", and a bibliography that is a table of each source's number and its
	* entry, such as "[1] A. Baker, The Art of Pizza, Naples: Pizza Press, 2010.", in the order the sources are cited.
	*
	* Written from Word's style, IEEE2006OfficeOnline.xsl, whose templates each function names. Unlike Word's other styles,
	* it writes people's initials and its lists of people with templates of its own, and has some English words written
	* into it, such as "Available:" and "Artist".
	*
	* @module
	*/
	var { General: General$4, Strings: Strings$3, APA: APA$1, SourceNames } = LOCALS;
	var SPACE$1 = General$4.Space;
	var DOT$1 = General$4.Dot;
	var LIST$1 = General$4.ListSeparator;
	var DASH = General$4.FromToDash;
	var OPEN = APA$1.SecondaryOpen;
	var CLOSE = APA$1.SecondaryClose;
	/** Whether the source has any of the fields, as the style's `count(b:Field)!=0` */
	var hasAny = (source, ...fields) => fields.some((field) => fieldOf(source, field) !== "");
	/** The text without the spaces, tabs and line feeds at its end (`right-trim`) */
	var rightTrim = (text) => text.replace(/[ \t\r\n]+$/, "");
	/** The text without the spaces at its start (`left-trim`) */
	var leftTrim = (text) => text.replace(/^ +/, "");
	/** The text with each occurrence of a string replaced (`FindReplaceString`) */
	var findReplace = (text, find, replacement) => text.split(find).join(replacement);
	/** The list separator without its spaces, such as "," (`List_Separator_NoSpace`) */
	var LIST_WITHOUT_SPACE = findReplace(LIST$1, " ", "");
	/** Pages, such as "p. 50" or "pp. 50-62", in English whatever the language (`DisplayPageOrPages`) */
	var pageOrPages = (cited) => cited.includes("-") || cited.includes(",") ? `pp. ${cited}` : `p. ${cited}`;
	/** The initial of each word of a name, such as "M. A." of "Mary Ann" (`splitAuthorSpace`) */
	var splitAuthorSpace = (name) => {
		const space = name.indexOf(" ");
		return space < 0 ? name.slice(0, 1) + DOT$1 : name.slice(0, space).slice(0, 1) + DOT$1 + SPACE$1 + splitAuthorSpace(leftTrim(name.slice(space + 1)));
	};
	/** The initials of a hyphenated name, such as "J.-P." of "Jean-Paul" (`HandleHypenInAuthor`) */
	var handleHyphenInAuthor = (name, initials = "") => {
		const initial = !name.startsWith(DASH) && initials === "" ? name.slice(0, 1) + DOT$1 : "";
		const dash = name.indexOf(DASH);
		if (dash < 0) return initial + initials;
		const after = name.slice(dash + DASH.length);
		return initial + handleHyphenInAuthor(after, initials + DASH + after.slice(0, 1) + DOT$1);
	};
	/** The initials of each word of a name, each word's hyphenated parts too, such as "J.-P. A." (`HandleSPaceHypenInAuthor`) */
	var handleSpaceHyphenInAuthor = (name) => {
		const space = name.indexOf(" ");
		return space < 0 ? handleHyphenInAuthor(name) : handleHyphenInAuthor(name.slice(0, space)) + SPACE$1 + handleSpaceHyphenInAuthor(leftTrim(name.slice(space + 1)));
	};
	/** The initials of a name, which has its trailing spaces trimmed, with hyphenated names' (most lists of people) */
	var hyphenated = (name) => name.includes(DASH) ? handleSpaceHyphenInAuthor(rightTrim(name)) : splitAuthorSpace(rightTrim(name));
	/** The initials of a name, hyphenated without its trailing spaces trimmed (a single director's first name) */
	var hyphenatedUntrimmed = (name) => name.includes(DASH) ? handleSpaceHyphenInAuthor(name) : splitAuthorSpace(rightTrim(name));
	/** The initials of a name, its trailing spaces trimmed, without hyphenated names' (editors after the authors) */
	var unhyphenated = (name) => splitAuthorSpace(rightTrim(name));
	/**
	* People as the style lists them: each one's initials and last name, a list separator after each but the last two, and
	* "and" before the last, such as "A. Baker, J. Smith and R. Patel". After the list comes its ending, and after one
	* person, it comes only when they have a last name.
	*
	* @param initials - How the first name's initials are written, then the middle name's
	* @param initialsOfOne - How they're written when there is one person
	*/
	var namesOf = (people, ending, initials = [hyphenated, hyphenated], initialsOfOne = initials) => {
		const nameOf = ({ first, middle }, [firstInitials, middleInitials]) => (first ? firstInitials(first) + SPACE$1 : "") + (middle ? middleInitials(middle) + SPACE$1 : "");
		if (people.length === 1) {
			const [person] = people;
			return nameOf(person, initialsOfOne) + (person.last ? person.last + ending : "");
		}
		return people.map((person, index) => (index === people.length - 1 ? SPACE$1 + Strings$3.AndUnCap + SPACE$1 : "") + nameOf(person, initials) + (person.last ? person.last + (index + 2 !== people.length && index + 1 < people.length ? LIST$1 : "") : "")).join("") + ending;
	};
	/** People with a role, their role after them, such as "M. Lane, Composer, " */
	var peopleWithRole = (people, one, many) => people.length === 0 ? "" : namesOf(people, LIST$1) + (people.length === 1 ? one : many);
	/**
	* The separator after a book's, a book section's or a miscellaneous source's editors, when they're named in place of
	* its authors (`Seperator`)
	*/
	var separator = (source) => {
		switch (source.type) {
			case "Book":
			case "Misc": return hasAny(source, "Title", "Edition", "Volume", "City", "StateProvince", "Publisher", "Year", "Pages") ? LIST$1 : SPACE$1;
			case "BookSection": return hasAny(source, "Title", "BookTitle", "Edition", "Volume", "City", "StateProvince", "Publisher", "Year", "Pages") ? LIST$1 : SPACE$1;
			default: return "";
		}
	};
	/** The editors, named in place of the authors, such as "E. Hemingway, Ed., " (`BibDisplayEditorNL`) */
	var editorNL = (source) => {
		const editors = peopleOf(source, "Editor");
		return namesOf(editors, LIST$1) + (editors.length === 1 ? Strings$3.EditorShortCap : Strings$3.EditorsShortCap) + separator(source);
	};
	/**
	* The editors after the authors, such as "E. Hemingway, Ed., ", when the source has authors (`BibDisplayEditor` and
	* `BibDisplayEditorBook`)
	*/
	var editor = (source) => {
		const editors = peopleOf(source, "Editor");
		if (editors.length === 0 || peopleOf(source, "Author").length === 0 && !organizationOf(source, "Author")) return "";
		return namesOf(editors, LIST$1, [unhyphenated, unhyphenated]) + (editors.length === 1 ? Strings$3.EditorShortCap : Strings$3.EditorsShortCap) + (hasAny(source, "City", "Publisher", "StateProvince", "Year", "Pages") ? LIST$1 : SPACE$1);
	};
	/**
	* The authors, or the organization that wrote it, and a list separator after them when the entry goes on, or a dot. With
	* neither, a book, a book section, a journal article and a miscellaneous source name their editors instead
	*
	* @param following - The fields the entry goes on with
	* @param editorsFollow - Whether the entry goes on with the editors after the authors
	* @param editorsInstead - Whether the editors are named when the source has no authors
	*/
	var authorsOf = (source, following, { editorsFollow = false, editorsInstead = false, organizationEnding } = {}) => {
		const authors = peopleOf(source, "Author");
		if (authors.length > 0) return namesOf(authors, hasAny(source, ...following) || editorsFollow && peopleOf(source, "Editor").length > 0 ? LIST$1 : DOT$1);
		const organization = organizationOf(source, "Author");
		if (organization) return organization + (organizationEnding !== null && organizationEnding !== void 0 ? organizationEnding : hasAny(source, ...following) ? LIST$1 : DOT$1);
		return editorsInstead && peopleOf(source, "Editor").length > 0 ? editorNL(source) : "";
	};
	/** A book's or a miscellaneous source's authors (`BibDisplayAuthorBook`) */
	var authorBook = (source) => authorsOf(source, [
		"Title",
		"Edition",
		"Volume",
		"City",
		"StateProvince",
		"Publisher",
		"Year",
		"Pages"
	], {
		editorsFollow: true,
		editorsInstead: true
	});
	/** A book section's authors (`BibDisplayAuthorBookSection`) */
	var authorBookSection = (source) => authorsOf(source, [
		"Title",
		"BookTitle",
		"Edition",
		"Volume",
		"City",
		"StateProvince",
		"Publisher",
		"Year",
		"Pages"
	], {
		editorsFollow: true,
		editorsInstead: true
	});
	/** A website's or a document's authors, whose organization is always followed by a list separator (`BibDisplayAuthorWebsite`) */
	var authorWebsite = (source) => authorsOf(source, [
		"Title",
		"ProductionCompany",
		"Year"
	], { organizationEnding: LIST$1 });
	/**
	* An article's authors, in a journal or a periodical. Both look for a journal's name, not a periodical's title
	* (`BibDisplayAuthorJArtcicle`)
	*/
	var authorJournalArticle = (source) => authorsOf(source, [
		"Title",
		"JournalName",
		"Volume",
		"Issue",
		"Year",
		"Pages"
	], { editorsInstead: true });
	/** A conference paper's authors (`BibDisplayAuthorConPr`) */
	var authorConferenceProceedings = (source) => authorsOf(source, [
		"Title",
		"ConferenceName",
		"City",
		"Year"
	]);
	/** A report's or an electronic source's authors (`BibDisplayAuthorReport`) */
	var authorReport = (source) => authorsOf(source, [
		"Title",
		"City",
		"Publisher",
		"Year"
	]);
	/** A patent's inventors (`BibDisplayAuthorPatent`) */
	var authorPatent = (source) => {
		const inventors = peopleOf(source, "Inventor");
		return inventors.length === 0 ? "" : namesOf(inventors, hasAny(source, "Title") ? LIST$1 : DOT$1);
	};
	/** A sound recording's composers, or its conductors, or its performers, with their role (`BibDisplayAuthorSoundRec`) */
	var authorSoundRecording = (source) => {
		const roles = [
			[
				"Composer",
				Strings$3.ComposerCap,
				Strings$3.ComposersCap
			],
			[
				"Conductor",
				Strings$3.ConductorCap,
				Strings$3.ConductorsCap
			],
			[
				"Performer",
				Strings$3.PerformerCap,
				Strings$3.PerformersCap
			]
		];
		for (const [role, one, many] of roles) {
			const people = peopleOf(source, role);
			if (people.length > 0) return peopleWithRole(people, one + LIST$1, many + LIST$1);
		}
		const performer = organizationOf(source, "Performer");
		return performer ? performer + LIST$1 + Strings$3.PerformerCap + LIST$1 : "";
	};
	/** A performance's writers, with their role (`BibDisplayAuthorPerformance`) */
	var authorPerformance = (source) => peopleWithRole(peopleOf(source, "Writer"), Strings$3.WriterCap + LIST$1, Strings$3.WritersCap + LIST$1);
	/** An interview's interviewees, with their role in English (`BibDisplayAuthorInterview`) */
	var authorInterview = (source) => peopleWithRole(peopleOf(source, "Interviewee"), `Interviewee${LIST$1}${SPACE$1}`, `Interviewees${LIST$1}${SPACE$1}`);
	/** A work of art's artists, with their role in English (`BibDisplayArtist`) */
	var artist = (source) => peopleWithRole(peopleOf(source, "Artist"), `Artist${LIST$1}${SPACE$1}`, `Artists${LIST$1}${SPACE$1}`);
	/** A film's directors, with their role. A single director's hyphenated first name isn't trimmed first (`BibDisplayDirector`) */
	var director = (source) => {
		const directors = peopleOf(source, "Director");
		if (directors.length === 0) return "";
		return namesOf(directors, LIST$1, [hyphenated, hyphenated], [hyphenatedUntrimmed, hyphenated]) + (directors.length === 1 ? Strings$3.DirectorCap : Strings$3.DirectorsCap) + LIST$1;
	};
	/** A title in quotes, and a list separator in the quotes when the entry goes on, or a dot after them */
	var quotedTitle = (source, goesOn) => {
		if (!hasAny(source, "Title")) return "";
		const quoted = General$4.OpenQuote + rightTrim(fieldOf(source, "Title"));
		return goesOn ? quoted + LIST_WITHOUT_SPACE + General$4.CloseQuote + SPACE$1 : quoted + General$4.CloseQuote + DOT$1;
	};
	/** A journal article's title (`BibDisplayTitleJournal`) */
	var titleJournal = (source) => quotedTitle(source, hasAny(source, "JournalName", "Volume", "Issue", "Pages", "Year"));
	/** An article's title in a periodical (`BibDisplayTitleAP`) */
	var titleArticleInAPeriodical = (source) => quotedTitle(source, hasAny(source, "Volume", "Issue", "Pages", "Year"));
	/** A report's or an electronic source's title (`BibDisplayTitleReport`) */
	var titleReport = (source) => quotedTitle(source, hasAny(source, "City", "Year", "Publisher"));
	/** A conference paper's title (`BibDisplayTitleConferenceProceedings`) */
	var titleConferenceProceedings = (source) => quotedTitle(source, hasAny(source, "ConferenceName", "City", "Year"));
	/** A book section's title (`BibDisplayTitleBC`) */
	var titleBookSection = (source) => quotedTitle(source, hasAny(source, "BookTitle", "Edition", "Volume", "City", "StateProvince", "Publisher", "Year", "Pages") || peopleOf(source, "Author").length > 0 && peopleOf(source, "Editor").length > 0);
	/** A web page's title, with a list separator in the quotes (`BibDisplayTitleWebSite`) */
	var titleWebsite = (source) => hasAny(source, "Title") ? General$4.OpenQuote + rightTrim(fieldOf(source, "Title")) + LIST_WITHOUT_SPACE + General$4.CloseQuote + SPACE$1 : "";
	/** A patent's title (`BibDisplayTitlePatent`) */
	var titlePatent = (source) => hasAny(source, "Title") ? General$4.OpenQuote + rightTrim(fieldOf(source, "Title")) + General$4.CloseQuote + DOT$1 + SPACE$1 : "";
	/** A book's or a miscellaneous source's title (`BibDisplayTitleBook`) */
	var titleBook = (source) => {
		if (!hasAny(source, "Title")) return "";
		const goesOn = hasAny(source, "Edition", "Volume", "City", "StateProvince", "Publisher", "Year", "Pages") || peopleOf(source, "Author").length > 0 && peopleOf(source, "Editor").length > 0;
		return rightTrim(fieldOf(source, "Title")) + (goesOn ? LIST$1 : DOT$1);
	};
	/** A title and a dot (`BibDisplayTitle`, `BibDisplayTitleInt` and `BibDisplayTitlePerformance`) */
	var title = (source) => hasAny(source, "Title") ? rightTrim(fieldOf(source, "Title")) + DOT$1 + SPACE$1 : "";
	/** A court case's title (`BibDisplayTitleCase`) */
	var titleCase = (source) => hasAny(source, "Title") ? rightTrim(fieldOf(source, "Title")) + (hasAny(source, "Year") ? LIST$1 : DOT$1) : "";
	/** The title of the book a book section is in, after "in" (`BibDisplayBookTitle`) */
	var bookTitle = (source) => {
		if (!hasAny(source, "BookTitle")) return [];
		const goesOn = hasAny(source, "Edition", "Volume", "City", "StateProvince", "Publisher", "Year", "Pages") || peopleOf(source, "Author").length > 0 && peopleOf(source, "Editor").length > 0;
		return join(findReplace(Strings$3.InNameUnCap, " %1", SPACE$1) + SPACE$1, italic(fieldOf(source, "BookTitle")), goesOn ? LIST$1 : DOT$1);
	};
	/** The name of the conference a paper is from, after "in" (`BibDisplayConferenceName`) */
	var conferenceName = (source) => hasAny(source, "ConferenceName") ? join(findReplace(Strings$3.InNameUnCap, " %1", SPACE$1) + SPACE$1, italic(fieldOf(source, "ConferenceName")), hasAny(source, "City", "Year") ? LIST$1 : DOT$1) : [];
	/** A journal's name (`BibDisplayJournalName`) */
	var journalName = (source) => hasAny(source, "JournalName") ? fieldOf(source, "JournalName") + (hasAny(source, "Volume", "Issue", "Pages", "Year") ? LIST$1 : DOT$1) : "";
	/** A periodical's title (`BibDisplayJournalNameAP`) */
	var periodicalTitle = (source) => hasAny(source, "PeriodicalTitle") ? fieldOf(source, "PeriodicalTitle") + (hasAny(source, "Volume", "Issue", "Pages", "Year") ? LIST$1 : DOT$1) : "";
	/** A volume, such as "vol. 3", or volumes, such as "Vols. 2-3" */
	var volumeOf = (source) => {
		const volume = fieldOf(source, "Volume");
		return volume.includes("-") || volume.includes(",") ? findReplace(Strings$3.VolumesOfShortCap, "%1 of %2", SPACE$1) + volume : SPACE$1 + findReplace(Strings$3.VolumeShortUnCap, " %1", SPACE$1) + volume;
	};
	/** A journal's or a periodical's volume (`BibDisplayVolumeJournal`) */
	var volumeJournal = (source) => hasAny(source, "Volume") ? volumeOf(source) + (hasAny(source, "Pages", "Year", "Issue") ? LIST$1 : DOT$1) : "";
	/** A book's volume (`BibDisplayVolumeBook`) */
	var volumeBook = (source) => {
		if (!hasAny(source, "Volume")) return "";
		const goesOn = hasAny(source, "City", "StateProvince", "Publisher", "Year", "Pages") || peopleOf(source, "Author").length > 0 && peopleOf(source, "Editor").length > 0;
		return volumeOf(source) + (goesOn ? LIST$1 : DOT$1);
	};
	/** A journal's or a periodical's issue, such as "no. 4" (`BibDisplayIssueJournal`) */
	var issueJournal = (source) => hasAny(source, "Issue") ? SPACE$1 + findReplace(Strings$3.NumberShortUnCap, " %1", SPACE$1) + fieldOf(source, "Issue") + (hasAny(source, "Pages", "Year") ? LIST$1 : DOT$1) : "";
	/** An article's pages (`BibDisplayPagesJournal`) */
	var pagesJournal = (source) => hasAny(source, "Pages") ? pageOrPages(fieldOf(source, "Pages")) + (hasAny(source, "Year") ? LIST$1 : DOT$1) : "";
	/** A book's pages (`BibDisplayPages`) */
	var pagesBook = (source) => hasAny(source, "Pages") ? pageOrPages(fieldOf(source, "Pages")) + DOT$1 : "";
	/** An edition, such as "2nd ed." (`BibDisplayEdition`) */
	var edition = (source) => {
		if (!hasAny(source, "Edition")) return "";
		const goesOn = hasAny(source, "Volume", "City", "StateProvince", "Publisher", "Year", "Pages") || peopleOf(source, "Author").length > 0 && peopleOf(source, "Editor").length > 0;
		return fieldOf(source, "Edition") + SPACE$1 + Strings$3.EditorShortUnCap + (goesOn ? LIST$1 : "");
	};
	/** A book's or a miscellaneous source's city (`BibDisplayCity`) */
	var city = (source) => {
		if (!hasAny(source, "City")) return "";
		const ending = hasAny(source, "Publisher") && !hasAny(source, "StateProvince") ? General$4.EnumSeparator : hasAny(source, "StateProvince", "Year", "Pages") ? LIST$1 : DOT$1;
		return fieldOf(source, "City") + ending;
	};
	/** A book section's city (`BibDisplayCityBookSection`) */
	var cityBookSection = (source) => hasAny(source, "City") ? fieldOf(source, "City") + (hasAny(source, "Publisher", "StateProvince", "Year", "Pages") ? LIST$1 : DOT$1) : "";
	/** A city with a list separator after it when the source has a year, or a dot (`BibDisplayCityReport` and `BibDisplayConfCityConfProc`) */
	var cityBeforeYear = (source) => hasAny(source, "City") ? fieldOf(source, "City") + (hasAny(source, "Year") ? LIST$1 : DOT$1) : "";
	/** A state or province (`BibDisplayStateProvinceBook` and `BibDisplayStateProvinceBC`) */
	var stateProvince = (source) => {
		if (!hasAny(source, "StateProvince")) return "";
		const ending = hasAny(source, "Publisher") ? General$4.EnumSeparator + SPACE$1 : hasAny(source, "Year", "Pages") ? LIST$1 : DOT$1;
		return fieldOf(source, "StateProvince") + ending;
	};
	/** A report's or an electronic source's publisher (`BibDisplayPublisher`) */
	var publisher = (source) => hasAny(source, "Publisher") ? fieldOf(source, "Publisher") + (hasAny(source, "City", "Year") ? LIST$1 : DOT$1) : "";
	/** A book's publisher (`BibDisplayPublisherBC`) */
	var publisherBook = (source) => hasAny(source, "Publisher") ? fieldOf(source, "Publisher") + (hasAny(source, "Year", "Pages") ? LIST$1 : DOT$1) : "";
	/** A year and a dot, and a space after it, with or without the year (`BibDisplayYear`) */
	var year = (source) => (hasAny(source, "Year") ? fieldOf(source, "Year") + DOT$1 : "") + SPACE$1;
	/** A year and a dot (`BibDisplayYearReport`, `BibDisplayYearCase` and `BibDisplayYearSoundrecording`) */
	var yearAndDot = (source) => hasAny(source, "Year") ? fieldOf(source, "Year") + DOT$1 : "";
	/** A book's year, and a space after it, with or without the year (`BibDisplayYearBC`) */
	var yearBook = (source) => (hasAny(source, "Year") ? fieldOf(source, "Year") + (hasAny(source, "Pages") ? LIST$1 : DOT$1) : "") + SPACE$1;
	/**
	* A date, such as "14 March 2018.", or the year alone when it has no month. A date with no year is left out
	* (`BibDisplayDayMonthYearInterview` and `BibDisplayDayMonthYearPatent`)
	*/
	var dayMonthYear = (source) => {
		if (!hasAny(source, "Year")) return "";
		const month = hasAny(source, "Month");
		return (month && hasAny(source, "Day") ? [
			fieldOf(source, "Day"),
			fieldOf(source, "Month"),
			fieldOf(source, "Year")
		] : month ? [fieldOf(source, "Month"), fieldOf(source, "Year")] : [fieldOf(source, "Year")]).join(SPACE$1) + DOT$1;
	};
	/** A website's or an article's date, and a space after it (`BibDisplayDayMonthYearWebSiteJournal`) */
	var dayMonthYearWebsiteJournal = (source) => dayMonthYear(source) + SPACE$1;
	/** When a website or a document on one was read, such as " [Accessed 3 February 2022]." (`BibDisplayAccessedDates`) */
	var accessedDates = (source) => {
		if (!hasAny(source, "YearAccessed")) return "";
		const month = hasAny(source, "MonthAccessed");
		const date = month && hasAny(source, "DayAccessed") ? [
			fieldOf(source, "DayAccessed"),
			fieldOf(source, "MonthAccessed"),
			fieldOf(source, "YearAccessed")
		] : month && !hasAny(source, "DayAccessed") ? [fieldOf(source, "MonthAccessed"), fieldOf(source, "YearAccessed")] : [fieldOf(source, "YearAccessed")];
		return SPACE$1 + OPEN + findReplace(Strings$3.AccessedCap, " %1", SPACE$1) + date.join(SPACE$1) + CLOSE + DOT$1;
	};
	/** A website's address, after "Available:" in English (`BibDisplayURL`) */
	var url = (source) => hasAny(source, "URL") ? `Available:${SPACE$1}${fieldOf(source, "URL")}${DOT$1}` : "";
	/** A website's production company (`BibDisplayProductionCompanywebsite`) */
	var productionCompanyWebsite = (source) => hasAny(source, "ProductionCompany") ? fieldOf(source, "ProductionCompany") + (hasAny(source, "Month", "Day", "Year", "URL") ? LIST$1 : DOT$1) : "";
	/** A sound recording's production company (`BibDisplayProductionCompanySRec`) */
	var productionCompanySoundRecording = (source) => hasAny(source, "ProductionCompany") ? fieldOf(source, "ProductionCompany") + DOT$1 + SPACE$1 : "";
	/** A production company or an institution, and a list separator when the source has a year, or a dot */
	var beforeYear = (source, field) => hasAny(source, field) ? fieldOf(source, field) + (hasAny(source, "Year") ? LIST$1 + SPACE$1 : DOT$1) : "";
	/** A film's country or region (`BibDisplayCountryRegionFilm`) */
	var countryRegionFilm = (source) => hasAny(source, "CountryRegion") ? fieldOf(source, "CountryRegion") + (hasAny(source, "ProductionCompany") ? General$4.EnumSeparator : DOT$1) : "";
	/** A patent's country or region (`BibDisplayCountryRegionPatent`) */
	var countryRegionPatent = (source) => hasAny(source, "CountryRegion") ? fieldOf(source, "CountryRegion") + (hasAny(source, "PatentNumber", "Year") ? SPACE$1 : DOT$1) : "";
	/** A patent's number, such as "Patent 7,123,456" (`BibDisplayPatent`) */
	var patent = (source) => hasAny(source, "PatentNumber") ? findReplace(Strings$3.PatentCap, " %1", SPACE$1) + fieldOf(source, "PatentNumber") + (hasAny(source, "Year") ? LIST$1 + SPACE$1 : DOT$1) : "";
	/** A kind of source in brackets, such as "[Online]. " */
	var kindOf = (kind) => OPEN + kind + CLOSE + DOT$1 + SPACE$1;
	/** A book's entry, with its title in italics for a miscellaneous source */
	var bookEntry = (source, titleOf) => join(authorBook(source), titleOf(titleBook(source)), edition(source), volumeBook(source), editor(source), city(source), stateProvince(source), publisherBook(source), yearBook(source), pagesBook(source));
	/** A website's or a document's entry */
	var websiteEntry = (source) => join(authorWebsite(source), titleWebsite(source), productionCompanyWebsite(source), dayMonthYearWebsiteJournal(source), kindOf(Strings$3.OnlineCap), url(source), accessedDates(source));
	/** A report's or an electronic source's entry */
	var reportEntry = (source) => join(authorReport(source), titleReport(source), publisher(source), cityBeforeYear(source), yearAndDot(source));
	/** Each type of source's entry in the bibliography (the template that matches `b:Source`) */
	var ENTRIES$1 = {
		Book: (source) => bookEntry(source, (text) => text),
		Misc: (source) => bookEntry(source, italic),
		BookSection: (source) => join(authorBookSection(source), titleBookSection(source), bookTitle(source), edition(source), volumeBook(source), editor(source), cityBookSection(source), stateProvince(source), publisherBook(source), yearBook(source), pagesBook(source)),
		InternetSite: websiteEntry,
		DocumentFromInternetSite: websiteEntry,
		JournalArticle: (source) => join(authorJournalArticle(source), titleJournal(source), italic(journalName(source)), volumeJournal(source), issueJournal(source), pagesJournal(source), dayMonthYearWebsiteJournal(source)),
		ArticleInAPeriodical: (source) => join(authorJournalArticle(source), titleArticleInAPeriodical(source), italic(periodicalTitle(source)), volumeJournal(source), issueJournal(source), pagesJournal(source), dayMonthYearWebsiteJournal(source)),
		ConferenceProceedings: (source) => join(authorConferenceProceedings(source), titleConferenceProceedings(source), conferenceName(source), cityBeforeYear(source), year(source)),
		Report: reportEntry,
		ElectronicSource: reportEntry,
		Art: (source) => join(artist(source), italic(title(source)), kindOf("Art"), beforeYear(source, "Institution"), year(source)),
		SoundRecording: (source) => join(authorSoundRecording(source), italic(title(source)), kindOf(SourceNames.SoundRecording), productionCompanySoundRecording(source), yearAndDot(source)),
		Performance: (source) => join(authorPerformance(source), italic(title(source)), kindOf("Performance"), beforeYear(source, "ProductionCompany"), year(source)),
		Interview: (source) => join(authorInterview(source), italic(title(source)), kindOf(Strings$3.InterviewCap), dayMonthYear(source)),
		Patent: (source) => join(authorPatent(source), titlePatent(source), countryRegionPatent(source), patent(source), dayMonthYear(source)),
		Film: (source) => join(director(source), italic(title(source)), kindOf(SourceNames.Film), countryRegionFilm(source), beforeYear(source, "ProductionCompany"), year(source)),
		Case: (source) => join(italic(titleCase(source)), yearAndDot(source))
	};
	/** IEEE, as Word writes it with IEEE2006OfficeOnline.xsl */
	var ieee = {
		name: "IEEE",
		file: "IEEE2006OfficeOnline.xsl",
		version: "2006",
		citation: ({ source, first, last, pages: cited }) => join(first ? OPEN : "", String(source.order), cited ? LIST$1 + pageOrPages(cited) : "", last ? CLOSE : LIST$1 + SPACE$1),
		bibliography: (sources) => ({ rows: [...sources].sort((a, b) => a.order - b.order).map((source) => [join(OPEN, String(source.order), CLOSE, SPACE$1), join(ENTRIES$1[source.type](source))]) })
	};
	//#endregion
	//#region src/bibliography/styles/iso-690-first-element-and-date.ts
	/**
	* The ISO 690 style of citation by first element and date, written from Word's (ISO690.XSL): citations such as
	* "(Baker, 2010)", and a bibliography sorted by its sources' authors, with the year after them.
	*
	* @module
	*/
	/** ISO 690 by first element and date, as Word writes it */
	var iso690FirstElementAndDate = {
		name: "ISO 690 - First Element and Date",
		file: "ISO690.XSL",
		version: "1987",
		citation: firstElementCitation("ISO 690"),
		bibliography: firstElementBibliography("ISO 690")
	};
	//#endregion
	//#region src/bibliography/styles/iso-690-numerical-reference.ts
	var { General: General$3, ISO690: ISO690$1 } = LOCALS;
	var { appendDot: appendDot$1, needDot: needDot$1 } = xslTemplates(General$3);
	/** A source of a citation: its number, then the volume or pages cited, such as "(1 p. 50)" or "(1 2: 50)" (the template's `b:Citation`) */
	var citation$1 = (cited) => {
		var _cited$prefix, _cited$suffix;
		return [{ text: (cited.first ? General$3.OpenBracket : "") + ((_cited$prefix = cited.prefix) !== null && _cited$prefix !== void 0 ? _cited$prefix : "") + String(cited.source.order) + citedVolumeAndPages(cited.volume, cited.pages, General$3.EnumSeparator, true) + ((_cited$suffix = cited.suffix) !== null && _cited$suffix !== void 0 ? _cited$suffix : "") + (cited.last ? General$3.CloseBracket : General$3.GroupSeparator) }];
	};
	/**
	* A source's entry, without its number (`BibReference`): the main contributors in bold, such as "**Baker, Anna.**", or
	* "—." when they're the same as the source before's, then the rest of the entry
	*/
	var referenceOf = (source, previous) => {
		const main = formatMain$1(source);
		const { start, rest } = entryOf(source, previous, "ISO 690");
		const named = startsWithTitle(previous) || startsWithTitle(source) ? [element("b", copy(main), needDot$1(main)), General$3.Space] : hasSameMain(source, previous) ? [stringOfNames(source.main) ? ISO690$1.SameAuthor + General$3.Dot + General$3.Space : ""] : [element("b", copy(appendDot$1(main))), General$3.Space];
		return [
			...start,
			...named,
			...rest
		];
	};
	/**
	* The bibliography, in the order the document cites its sources, each entry after its number, such as "1. ", or empty
	* when it has nothing (the template's `b:Bibliography`)
	*/
	var bibliography$1 = (sources) => {
		const sorted = [...sources].sort((a, b) => a.order - b.order).map(populate);
		return {
			paragraphs: readHtml(sorted.map((source, index) => {
				const reference = referenceOf(source, sorted[index - 1]);
				return hasText(textOfHtml(reference)) ? [String(source.source.order) + General$3.Dot + General$3.Space, copy(...reference)] : [];
			})),
			hangingIndent: false
		};
	};
	/** ISO 690 by numerical reference, as Word writes it */
	var iso690NumericalReference = {
		name: "ISO 690 - Numerical Reference",
		file: "ISO690Nmerical.XSL",
		version: "1987",
		citation: citation$1,
		bibliography: bibliography$1
	};
	//#endregion
	//#region src/bibliography/styles/mla.ts
	/**
	* MLA, seventh edition: citations such as "(Baker 50)", and a bibliography of the sources sorted by their authors, such
	* as "Baker, Anna. The Art of Pizza. Naples: Pizza Press, 2010.", each indented after its first line, with "—" in place
	* of the authors of the entry before when they are the same.
	*
	* Written from Word's style, MLASeventhEditionOfficeOnline.xsl, whose templates and variables each function names.
	*
	* @module
	*/
	var { General: General$2, Strings: Strings$2, MLA } = LOCALS;
	var { appendDot, formatDatePrivate, formatName, needDot, stringFormat, stringFormatDot } = xslTemplates(General$2);
	var SPACE = General$2.Space;
	var LIST = General$2.ListSeparator;
	/**
	* The roles whose people each type of source is named by, in the order the style looks for them. A film's last is its
	* producers, which the style looks for as `b:Producer`, which no source has
	*/
	var MAIN_ROLES$1 = {
		Book: [
			"Author",
			"Editor",
			"Translator"
		],
		BookSection: ["Author"],
		JournalArticle: ["Author"],
		ArticleInAPeriodical: ["Author"],
		ConferenceProceedings: ["Author", "Editor"],
		Report: ["Author"],
		SoundRecording: [
			"Performer",
			"Conductor",
			"Composer"
		],
		Performance: [
			"Writer",
			"Director",
			"Performer"
		],
		Art: ["Artist"],
		DocumentFromInternetSite: ["Author"],
		InternetSite: ["Author"],
		Film: [
			"Writer",
			"Director",
			"Performer"
		],
		Interview: ["Interviewee"],
		Patent: ["Inventor"],
		ElectronicSource: [
			"Author",
			"Editor",
			"Compiler",
			"Translator"
		],
		Case: [],
		Misc: ["Author"]
	};
	/** The text of the people with a role, or of the organization, as the style reads a role's string value */
	var stringValueOf = (names) => !names ? "" : "corporate" in names ? names.corporate : names.people.map(({ last, first, middle }) => last + first + middle).join("");
	/** The people a source is named by: those with the first of its main roles that has any (`MainContributors`) */
	var mainContributorsOf = (source) => {
		const role = MAIN_ROLES$1[source.type].find((candidate) => stringValueOf(source.names[candidate]) !== "");
		return role === void 0 ? void 0 : source.names[role];
	};
	/**
	* What comes after a person in a list of people: "et al." after the first of more than three, who is the only one
	* written, "and" before the last of two or three, and a list separator after the others (`formatPersonSeperator`)
	*/
	var personSeparator = (position, count) => count > 3 ? position === 1 ? LIST + Strings$2.AndOthersUnCap : "" : position === count - 1 ? SPACE + Strings$2.AndUnCap + SPACE : position === count ? "" : LIST;
	/**
	* The people who made a source, as an entry starts with them, such as "Baker, Anna, Ravi Patel and Mary Ann Jones", or
	* "Baker, Anna, et al." for more than three, or the organization (`formatPersonsAuthor`)
	*/
	var personsAuthor = (names) => {
		if (!names) return "";
		if ("corporate" in names) return names.corporate;
		const count = names.people.length;
		return names.people.map((person, index) => (index === 0 ? formatName(person, MLA.MainAuthor) : count <= 3 ? formatName(person, MLA.OtherAuthors) : "") + personSeparator(index + 1, count)).join("");
	};
	/** People later in an entry, such as "Ravi Patel and Mary Ann Jones" as its editors, or the organization (`formatPersons`) */
	var persons = (names) => {
		if (!names) return "";
		if ("corporate" in names) return names.corporate;
		const count = names.people.length;
		return names.people.map((person, index) => (count <= 3 || index === 0 ? formatName(person, MLA.SecondaryAuthors) : "") + personSeparator(index + 1, count)).join("");
	};
	/** How many people have a role, which is none when an organization has it */
	var countOf = (source, role) => {
		const names = source.names[role];
		return names && "people" in names ? names.people.length : 0;
	};
	/** The word for several people, or for one, or nothing for an organization, as the style counts the people */
	var wordFor = (count, one, many) => count > 1 ? many : count === 1 ? one : "";
	/** The year, or "n.d." without one (`getYear`) */
	var yearOf = (source) => fieldOf(source, "Year") || Strings$2.NoDateShortUnCap;
	/** The date, such as "14 March 2018", or "n.d." without a year (`formatDate`) */
	var dateOf = (source) => {
		const year = fieldOf(source, "Year");
		return year ? formatDatePrivate(fieldOf(source, "Day"), fieldOf(source, "Month"), year, MLA.Date) : Strings$2.NoDateShortUnCap;
	};
	/** The date the source was read, or nothing without a year (`formatDateAccessed`) */
	var dateAccessedOf = (source) => {
		const year = fieldOf(source, "YearAccessed");
		return year ? formatDatePrivate(fieldOf(source, "DayAccessed"), fieldOf(source, "MonthAccessed"), year, MLA.Date) : "";
	};
	/** The text without the spaces, tabs and line feeds at its ends, and with each run of them in it as one space (`normalize-space`) */
	var normalizeSpace = (text) => text.replace(/[ \t\r\n]+/g, " ").replace(/^ | $/g, "");
	/** Three fields, with a separator between the first two and another before the third, and a dot after them */
	var fieldsDot = (first, second, third, firstSeparator, secondSeparator) => {
		const firstTwo = first + (first && second ? firstSeparator : "") + second;
		return appendDot(firstTwo + (firstTwo && third ? secondSeparator : "") + third);
	};
	/** The first field, ": ", the second, ", " and the third, such as "Naples: Pizza Press, 2010." (`templateA`) */
	var templateA = (first, second, third) => fieldsDot(first, second, third, General$2.EnumSeparator, LIST);
	/** The first field, ": " and the second, such as "Italy: Patent 123." (`templateB`) */
	var templateB = (first, second) => fieldsDot(first, second, "", General$2.EnumSeparator, "");
	/** The first field, ", " and the second, such as "National Gallery, London." (`templateC`) */
	var templateC = (first, second) => fieldsDot(first, second, "", LIST, "");
	/** The first field, ", ", the second, ": " and the third, such as "14 March 2018, late ed.: 12-14." (`templateE`) */
	var templateE = (first, second, third) => fieldsDot(first, second, third, LIST, General$2.EnumSeparator);
	/** A journal's volume and issue, its year in brackets and the pages, such as "12.4 (2018): 233-250." (`templateVIYP`) */
	var templateVIYP$1 = (source) => {
		const volume = fieldOf(source, "Volume");
		const issue = fieldOf(source, "Issue");
		const pages = fieldOf(source, "Pages");
		return appendDot(volume + (volume && issue ? General$2.Dot : "") + issue + SPACE + General$2.OpenBracket + yearOf(source) + General$2.CloseBracket + (pages ? General$2.EnumSeparator : "") + pages);
	};
	/** The medium, the date the source was read and its address, such as "Web. 3 May 2019. <https://pizza.example>." (`templateMDaU`) */
	var templateMDaU = (source) => {
		const medium = appendDot(fieldOf(source, "Medium"));
		const accessed = appendDot(dateAccessedOf(source));
		const url = fieldOf(source, "URL");
		const accessedUrl = appendDot(accessed + (accessed && url ? SPACE : "") + (url ? General$2.OpenLink + url + General$2.CloseLink : ""));
		return medium + (medium && accessedUrl ? SPACE : "") + accessedUrl;
	};
	/** The format of a volume, or of volumes when it has a comma or a hyphen in it, such as "2-3" */
	var volumeFormatOf = (volume, one, many) => volume.includes(",") || translate(volume, General$2.Hyphens, "").length !== volume.length ? many : one;
	/** The parts of an entry that have text, each with a space before it when a part before it has text, as the style writes them */
	var spaced = (...parts) => parts.reduce((entry, [name, text, after = entry.names]) => {
		const names = [...entry.names, name];
		if (textOf(text).length === 0) return _objectSpread2(_objectSpread2({}, entry), {}, { names });
		const space = after.some((other) => entry.written.includes(other)) ? SPACE : "";
		return {
			text: join(entry.text, space, text),
			written: [...entry.written, name],
			names
		};
	}, {
		text: [],
		written: [],
		names: []
	}).text;
	/** A title in italics, and a dot after it unless it ends a sentence */
	var italicDot = (title) => join(italic(title), needDot(title));
	/** A title and a dot after it, in quotes */
	var quotedDot = (title) => title ? General$2.OpenQuote + appendDot(title) + General$2.CloseQuote : "";
	/** People with a role and the word for it before them, such as "Ed. Ravi Patel.", or an organization with a space before it */
	var prefixDot = (people, count, one, many) => people ? wordFor(count, one, many) + SPACE + appendDot(people) : "";
	/** People named first and the word for their role, such as "Patel, Ravi, ed." */
	var suffixLF = (people, count, one, many) => people ? people + LIST + wordFor(count, one, many) : "";
	/**
	* The variables of a source's entry, from its fields and people, and its author, which is "—" for the same people as
	* the entry before
	*/
	var variablesOf = (source, author) => {
		const field = (name) => fieldOf(source, name);
		const count = (role) => countOf(source, role);
		const editor = persons(source.names.Editor);
		const translator = persons(source.names.Translator);
		const producerName = persons(source.names.ProducerName);
		const productionCompany = field("ProductionCompany");
		const volume = field("Volume");
		const prodDot = producerName ? appendDot(producerName) : appendDot(productionCompany);
		return {
			author,
			authorDot: appendDot(author),
			sectionAuthorDot: appendDot(personsAuthor(source.names.Author)),
			bookAuthorDot: appendDot(personsAuthor(source.names.BookAuthor)),
			performerLF: personsAuthor(source.names.Performer),
			performerLFDot: appendDot(personsAuthor(source.names.Performer)),
			conductorLFDot: appendDot(personsAuthor(source.names.Conductor)),
			composerLFDot: appendDot(personsAuthor(source.names.Composer)),
			artistDot: appendDot(personsAuthor(source.names.Artist)),
			intervieweeLFDot: appendDot(personsAuthor(source.names.Interviewee)),
			inventorLFDot: appendDot(personsAuthor(source.names.Inventor)),
			interviewer: persons(source.names.Interviewer),
			interviewerDot: appendDot(persons(source.names.Interviewer)),
			writer: persons(source.names.Writer),
			composer: persons(source.names.Composer),
			editor,
			translator,
			suffixEditorLFDot: suffixLF(personsAuthor(source.names.Editor), count("Editor"), Strings$2.EditorShortUnCap, Strings$2.EditorsShortUnCap),
			suffixTranslatorLFDot: suffixLF(personsAuthor(source.names.Translator), count("Translator"), Strings$2.TranslatorShortUnCap, Strings$2.TranslatorsShortUnCap),
			suffixCompilerLFDot: suffixLF(personsAuthor(source.names.Compiler), count("Compiler"), Strings$2.CompilerShortUnCap, Strings$2.CompilersShortUnCap),
			prefixEditorDot: prefixDot(editor, count("Editor"), Strings$2.EditorShortCap, Strings$2.EditorShortCap),
			prefixTranslatorDot: prefixDot(translator, count("Translator"), Strings$2.TranslatorShortCap, Strings$2.TranslatorsShortCap),
			prefixDirectorDot: prefixDot(persons(source.names.Director), count("Director"), Strings$2.DirectorShortCap, Strings$2.DirectorsShortCap),
			prefixPerformerDot: prefixDot(persons(source.names.Performer), count("Performer"), Strings$2.PerformerShortCap, Strings$2.PerformerShortCap),
			prefixConductorDot: prefixDot(persons(source.names.Conductor), count("Conductor"), Strings$2.ConductorShortUnCap, Strings$2.ConductorsShortUnCap),
			prefixCompilerDot: prefixDot(persons(source.names.Compiler), count("Compiler"), Strings$2.CompilerShortCap, Strings$2.CompilersShortCap),
			prefixVersionDot: field("Version") ? Strings$2.VersionShortCap + SPACE + appendDot(field("Version")) : "",
			prefixVolumeDot: volume ? appendDot(textOf(stringFormat(volumeFormatOf(volume, Strings$2.VolumeShortCap, Strings$2.VolumesShortCap), volume))) : "",
			noVolumesSufDot: field("NumberVolumes") ? appendDot(textOf(stringFormat(Strings$2.VolumesAfterShortUnCap, field("NumberVolumes")))) : "",
			prefixCaseNoDot: field("CaseNumber") ? textOf(stringFormatDot(Strings$2.NumberShortCap, field("CaseNumber"))) : "",
			prodDot,
			prefixProdDot: producerName || productionCompany ? wordFor(count("ProducerName"), Strings$2.ProducerShortCap + SPACE, Strings$2.ProducersShortCap + SPACE) + prodDot : "",
			tempProdPr: producerName ? Strings$2.ProducerShortCap + SPACE + appendDot(producerName) : "",
			title: field("Title"),
			titleDot: appendDot(field("Title")),
			dateDot: appendDot(dateOf(source)),
			editionDot: appendDot(field("Edition")),
			pagesDot: appendDot(field("Pages")),
			institutionDot: appendDot(field("Institution")),
			tempCPY: templateA(field("City"), field("Publisher"), yearOf(source)),
			tempCPD: templateA(field("City"), field("Publisher"), dateOf(source))
		};
	};
	/** A book's volume, or how many volumes it has, and how many after its publisher when it has both */
	var volumesOf = (v) => [["volume", v.prefixVolumeDot || v.noVolumesSufDot], ["volumes", v.prefixVolumeDot ? v.noVolumesSufDot : ""]];
	/** A book's entry, named by its editors, or else its translators, when it has no author */
	var book = (v) => {
		const [volume, volumes] = volumesOf(v);
		const place = ["place", v.tempCPY];
		if (v.editor && !v.author) return spaced(["editor", v.suffixEditorLFDot], ["title", italicDot(v.title)], ["translator", v.prefixTranslatorDot], ["edition", v.editionDot], volume, place, volumes);
		return v.translator && !v.author ? spaced(["translator", v.suffixTranslatorLFDot], ["title", italicDot(v.title)], ["edition", v.editionDot], volume, place, volumes) : spaced(["author", v.authorDot], ["title", italicDot(v.title)], ["editor", v.prefixEditorDot], ["translator", v.prefixTranslatorDot], ["edition", v.editionDot], volume, place, volumes);
	};
	/** A book section's entry, named by its own authors even when the entry before has them */
	var bookSection = (v, source) => {
		const [volume, volumes] = volumesOf(v);
		return spaced(["author", v.sectionAuthorDot], ["title", quotedDot(v.title)], ["bookAuthor", v.bookAuthorDot], ["bookTitle", italicDot(fieldOf(source, "BookTitle"))], ["editor", v.prefixEditorDot], ["translator", v.prefixTranslatorDot], ["edition", v.editionDot], volume, ["place", v.tempCPY], volumes, ["pages", v.pagesDot]);
	};
	/** A conference paper's entry, named by its editors when it has no author */
	var conferenceProceedings = (v, source) => {
		const title = ["title", quotedDot(v.title)];
		const conference = ["conference", italicDot(fieldOf(source, "ConferenceName"))];
		return v.editor && !v.author ? spaced(["editor", v.suffixEditorLFDot], title, conference, ["place", v.tempCPY], ["pages", v.pagesDot]) : spaced(["author", v.authorDot], title, conference, ["editor", v.prefixEditorDot], ["place", v.tempCPY], ["pages", v.pagesDot]);
	};
	/** A report's entry: one with a city has its title in italics, and its publisher */
	var report = (v, source) => {
		const type = ["type", appendDot(fieldOf(source, "ThesisType"))];
		return fieldOf(source, "City") ? spaced(["author", v.authorDot], ["title", italicDot(v.title)], type, ["institution", v.institutionDot], ["place", v.tempCPY]) : spaced(["author", v.authorDot], ["title", quotedDot(v.title)], type, ["institution", templateC(fieldOf(source, "Institution"), yearOf(source))]);
	};
	/** A sound recording's entry, named by its performers, or else its conductors, or else its composers */
	var soundRecording = (v, source) => {
		const title = ["title", quotedDot(v.title)];
		const album = ["album", italicDot(fieldOf(source, "AlbumTitle"))];
		const composer = ["composer", v.composer ? stringFormatDot(Strings$2.ByCap, v.composer) : ""];
		const place = ["place", templateA(fieldOf(source, "City"), fieldOf(source, "ProductionCompany"), yearOf(source))];
		if (v.performerLF) return spaced(["performer", v.performerLFDot], title, album, ["conductor", v.prefixConductorDot], composer, ["producer", v.tempProdPr], place);
		return v.conductorLFDot ? spaced(["conductor", v.conductorLFDot], title, album, composer, ["producer", v.tempProdPr], place) : spaced(["composer", v.composerLFDot], title, album, [
			"producer",
			v.tempProdPr,
			["composer", "title"]
		], place);
	};
	/** A performance's or a film's title, writers, directors and performers */
	var titleAndPeople = (v) => [
		["title", italicDot(v.title)],
		["writer", v.writer ? stringFormatDot(Strings$2.ByCap, v.writer) : ""],
		["director", v.prefixDirectorDot],
		["performer", v.prefixPerformerDot]
	];
	/** A work of art's entry, with the publication it is in when it has one */
	var art = (v, source) => {
		const artist = ["artist", normalizeSpace(v.artistDot)];
		const title = ["title", italicDot(v.title)];
		const publication = fieldOf(source, "PublicationTitle");
		return publication ? spaced(artist, title, ["institution", v.institutionDot], ["publication", italicDot(publication)], ["place", v.tempCPY], ["pages", v.pagesDot]) : spaced(artist, title, ["institution", templateC(fieldOf(source, "Institution"), fieldOf(source, "City"))], ["pages", v.pagesDot]);
	};
	/** An electronic source's entry, named by its authors, or else its editors, its compilers or its translators */
	var electronicSource = (v, source) => {
		const publication = fieldOf(source, "PublicationTitle");
		const before = [
			"author",
			"title",
			"publication",
			"edition",
			"volume"
		];
		return spaced(["author", v.authorDot || v.suffixEditorLFDot || v.suffixCompilerLFDot || v.suffixTranslatorLFDot], ["title", publication ? quotedDot(v.title) : italicDot(v.title)], ["publication", italicDot(publication)], ["edition", v.editionDot], ["volume", v.prefixVolumeDot], [
			"editor",
			v.authorDot ? v.prefixEditorDot : "",
			before
		], [
			"compiler",
			v.authorDot || v.suffixEditorLFDot ? v.prefixCompilerDot : "",
			before
		], [
			"translator",
			v.authorDot || v.suffixEditorLFDot || v.suffixCompilerLFDot ? v.prefixTranslatorDot : "",
			before
		], [
			"producer",
			v.prefixProdDot,
			before
		], [
			"place",
			v.tempCPD,
			[...before, "producer"]
		]);
	};
	/** An interview's title, or "Interview" without one, and its interviewers with it when it is broadcast */
	var interviewTitle = (v, source) => {
		const broadcast = fieldOf(source, "BroadcastTitle");
		if (!fieldOf(source, "Broadcaster")) return !v.title ? Strings$2.InterviewCap + General$2.Dot : broadcast ? quotedDot(v.title) : italic(v.title);
		if (!v.title) return v.interviewer ? stringFormatDot(Strings$2.InterviewWithCap, v.interviewer) : Strings$2.InterviewCap + General$2.Dot;
		if (!v.interviewer) return broadcast ? General$2.OpenQuote + v.title + General$2.CloseQuote : italicDot(v.title);
		return stringFormatDot(Strings$2.WithUnCap, broadcast ? General$2.OpenQuote + v.title + General$2.CloseQuote : appendDot(v.title), v.interviewerDot);
	};
	/** An interview's entry, with a space before each part after its title, whatever is before it */
	var interview = (v, source) => {
		const after = (text) => textOf(text) ? join(SPACE, text) : "";
		return join(v.intervieweeLFDot, v.intervieweeLFDot ? SPACE : "", interviewTitle(v, source), after(italic(appendDot(fieldOf(source, "BroadcastTitle")))), ...fieldOf(source, "Broadcaster") ? [
			after(appendDot(fieldOf(source, "Broadcaster"))),
			after(templateC(fieldOf(source, "Station"), fieldOf(source, "City"))),
			after(v.dateDot)
		] : [
			after(v.interviewerDot),
			after(v.prefixEditorDot),
			after(v.prefixTranslatorDot),
			after(v.tempCPD),
			after(v.pagesDot)
		]);
	};
	/** Each type of source's entry, before its medium, the date it was read and its address (the `source` variable) */
	var ENTRIES = {
		Book: book,
		BookSection: bookSection,
		JournalArticle: (v, source) => spaced(["author", v.authorDot], ["title", quotedDot(v.title)], ["journal", italic(fieldOf(source, "JournalName"))], ["volume", templateVIYP$1(source)]),
		ConferenceProceedings: conferenceProceedings,
		Report: report,
		SoundRecording: soundRecording,
		Performance: (v, source) => spaced(...titleAndPeople(v), ["place", templateC(fieldOf(source, "Theater"), fieldOf(source, "City"))], ["date", v.dateDot]),
		Art: art,
		DocumentFromInternetSite: (v, source) => spaced(["author", v.authorDot], ["title", quotedDot(v.title)], ["version", v.prefixVersionDot], ["date", v.dateDot], ["site", italic(appendDot(fieldOf(source, "InternetSiteTitle")))], ["editor", v.prefixEditorDot], ["producer", v.prodDot]),
		InternetSite: (v) => spaced(["author", v.authorDot], ["title", italicDot(v.title)], ["editor", v.prefixEditorDot], ["version", v.prefixVersionDot], ["date", v.dateDot], ["producer", v.prodDot]),
		Patent: (v, source) => {
			const patentNumber = fieldOf(source, "PatentNumber");
			return spaced(["inventor", v.inventorLFDot], ["title", v.titleDot], ["editor", v.prefixEditorDot], ["translator", v.prefixTranslatorDot], ["country", templateB(fieldOf(source, "CountryRegion"), patentNumber ? textOf(stringFormat(Strings$2.PatentCap, patentNumber)) : "")], ["date", v.dateDot]);
		},
		Case: (v, source) => spaced(["title", v.titleDot], ["number", v.prefixCaseNoDot], ["court", appendDot(fieldOf(source, "Court"))], ["place", templateB(fieldOf(source, "City"), dateOf(source))]),
		Misc: (v, source) => spaced(["author", v.authorDot], ["title", quotedDot(v.title)], ["publication", italicDot(fieldOf(source, "PublicationTitle"))], ["volume", v.prefixVolumeDot], ["issue", appendDot(fieldOf(source, "Issue"))], ["editor", v.prefixEditorDot], ["translator", v.prefixTranslatorDot], ["compiler", v.prefixCompilerDot], ["place", v.tempCPD], ["pages", v.pagesDot]),
		ElectronicSource: electronicSource,
		ArticleInAPeriodical: (v, source) => {
			const edition = fieldOf(source, "Edition");
			return spaced(["author", v.authorDot], ["title", quotedDot(v.title)], ["periodical", italic(fieldOf(source, "PeriodicalTitle"))], ["date", templateE(dateOf(source), edition ? textOf(stringFormat(Strings$2.EditionShortUnCap, edition)) : "", fieldOf(source, "Pages"))]);
		},
		Film: (v, source) => spaced(...titleAndPeople(v), ["producer", v.prefixProdDot], ["distributor", templateC(fieldOf(source, "Distributor"), yearOf(source))]),
		Interview: interview
	};
	/** The title a type of source has in a citation when it has neither a short title nor a title */
	var CITATION_TITLES = {
		BookSection: "BookTitle",
		ArticleInAPeriodical: "PeriodicalTitle",
		InternetSite: "InternetSiteTitle",
		DocumentFromInternetSite: "InternetSiteTitle",
		ElectronicSource: "PublicationTitle",
		Art: "PublicationTitle",
		Misc: "PublicationTitle",
		SoundRecording: "AlbumTitle",
		Interview: "BroadcastTitle"
	};
	/** A source's title in a citation: its short title, or its title, or for most types another title it has (`populateMain`) */
	var citationTitleOf = (source) => {
		const other = CITATION_TITLES[source.type];
		return fieldOf(source, "ShortTitle") || fieldOf(source, "Title") || (other ? fieldOf(source, other) : "");
	};
	/**
	* The people a source is named by in a citation: the last names of the first three, with their initials when another
	* source's first author has the same last name, or the organization
	*/
	var citationAuthorsOf = (names, nonUniqueLastName) => {
		if (!names) return "";
		if ("corporate" in names) return names.corporate;
		const count = names.people.length;
		return names.people.map((person, index) => {
			const position = index + 1;
			return (position > 3 ? "" : formatName(person, nonUniqueLastName ? MLA.CitationLong : MLA.CitationShort)) + (count - 1 === position && (count === 2 || count === 3) || count > 3 && position === 2 ? SPACE + Strings$2.AndUnCap + SPACE : count > position && position < 3 ? General$2.AuthorsSeparator : "");
		}).join("");
	};
	/**
	* A source of a citation, such as "(Baker 50)": its authors, its title when they don't tell it apart from another
	* source or it has none, and the volume and pages cited
	*/
	var citation = (cited) => {
		var _cited$prefix, _cited$suffix;
		const { source, volume, pages } = cited;
		const title0 = citationTitleOf(source);
		const author0 = citationAuthorsOf(mainContributorsOf(source), cited.nonUniqueLastName);
		const author = cited.hideAuthor ? "" : author0;
		const title = cited.hideTitle ? "" : title0;
		const displayTitle = !author || cited.repeatedAuthor ? title : "";
		const volVolume = volume ? textOf(stringFormat(volumeFormatOf(volume, Strings$2.VolumeShortUnCap, Strings$2.VolumesShortUnCap), volume)) : "";
		return join(cited.first ? General$2.OpenBracket : "", (_cited$prefix = cited.prefix) !== null && _cited$prefix !== void 0 ? _cited$prefix : "", author, displayTitle ? (author ? LIST : "") + displayTitle : "", !author0 && !title0 ? source.tag : "", volume || pages ? (author || displayTitle ? SPACE : "") + (volume && pages ? volume + General$2.Enum + pages : volVolume || pages) : "", (_cited$suffix = cited.suffix) !== null && _cited$suffix !== void 0 ? _cited$suffix : "", cited.last ? General$2.CloseBracket : General$2.GroupSeparator);
	};
	/** What the bibliography is sorted by: the source's authors and its title, or its title first for some types (`b:SortingString`) */
	var sortingStringOf$1 = (source) => {
		const author = personsAuthor(mainContributorsOf(source));
		const title = fieldOf(source, "Title");
		const titleFirst = source.type === "Performance" || source.type === "Case" || source.type === "Film";
		return (titleFirst && title ? SPACE + title : "") + (author ? SPACE + author : "") + (!titleFirst && title ? SPACE + title : "");
	};
	/**
	* A bibliography of the sources, sorted, each entry with its medium, the date it was read and its address after it, and
	* "—" for its author when the entry before is named by the same people
	*/
	var bibliography = (sources) => {
		const sorted = sortByKey(sources, sortingStringOf$1);
		const mains = sorted.map((source) => personsAuthor(mainContributorsOf(source)));
		return {
			hangingIndent: true,
			paragraphs: sorted.map((source, index) => {
				var _entry;
				const author = index > 0 && mains[index] !== "" && mains[index] === mains[index - 1] ? MLA.SameAuthor : personsAuthor(source.names.Author);
				const entry = ENTRIES[source.type](variablesOf(source, author), source);
				const after = templateMDaU(source);
				const space = !after && ((_entry = entry[entry.length - 1]) === null || _entry === void 0 ? void 0 : _entry.italics) ? SPACE : "";
				return join(entry, textOf(entry) && after ? SPACE : "", after, space);
			})
		};
	};
	/** MLA, as Word writes it with MLASeventhEditionOfficeOnline.xsl */
	var mla = {
		name: "MLA",
		file: "MLASeventhEditionOfficeOnline.xsl",
		version: "7",
		citation,
		bibliography
	};
	//#endregion
	//#region src/bibliography/styles/sist02.ts
	/**
	* Word's SIST02 style (SIST02.XSL), which writes citations and bibliographies as the Japanese standard SIST 02 has them,
	* with full-width punctuation: citations such as "（Baker，2010p.50）", and a bibliography of entries such as
	* "**SmithJohn, JonesMaryAnn** *Dough and Fire．*London，Crust Books，2011．", sorted by their authors.
	*
	* The style writes its own punctuation in place of Word's: full-width commas, dots and brackets, and nothing for a space,
	* so names and the parts of an entry are written one after another. Word reads a space between two of its bold or italic
	* elements that follow each other, as it does in each of the styles that write them.
	*
	* @module
	*/
	var { General: General$1, ISO690, SIST, Strings: Strings$1 } = LOCALS;
	var DOT = "．";
	var LIST_SEPARATOR = "，";
	var ENUM = "，";
	var OPEN_BRACKET = "（";
	var CLOSE_BRACKET = "）";
	var xsl$1 = xslTemplates({
		Dot: DOT,
		DotInitial: "",
		EndChars: General$1.EndChars,
		Hyphens: General$1.Hyphens,
		ListSeparator: LIST_SEPARATOR,
		GroupSeparator: "",
		SimpleAuthor: General$1.SimpleAuthor,
		SimpleDate: General$1.SimpleDate
	});
	/** The names of the people a source is named by, last name first: the style's own, which are Word's (`SIST_MainAuthors`) */
	var MAIN_AUTHORS = {
		FML: "%L%F%M",
		FM: "%F%M",
		ML: "%L%M",
		FL: "%L%F"
	};
	/** The names of the other people: the style's own (`SIST_SecondaryAuthors`), with a middle name before a first name */
	var SECONDARY_AUTHORS = {
		FML: "%L%M%F",
		FM: "%M%F",
		ML: "%L%M",
		FL: "%L%F"
	};
	/** The name of the first person in a citation: the last name, or the first name of someone who has no last name */
	var CITATION_AUTHOR = {
		FML: General$1.SimpleAuthor.L,
		FM: General$1.SimpleAuthor.F,
		ML: General$1.SimpleAuthor.L,
		FL: General$1.SimpleAuthor.L
	};
	/** The roles a type of source is named by, in the order they're looked for (`MainContributors`) */
	var MAIN_ROLES = {
		Book: [
			"Author",
			"Editor",
			"Translator"
		],
		BookSection: ["Author"],
		JournalArticle: ["Author", "Editor"],
		ArticleInAPeriodical: ["Author"],
		ConferenceProceedings: ["Author", "Editor"],
		Report: ["Author"],
		SoundRecording: [
			"Artist",
			"Performer",
			"Composer",
			"Conductor",
			"ProducerName"
		],
		Performance: [
			"Writer",
			"Director",
			"Performer",
			"ProducerName"
		],
		Art: ["Artist"],
		DocumentFromInternetSite: ["Author"],
		InternetSite: ["Author"],
		Film: [
			"Director",
			"Writer",
			"Performer",
			"ProducerName"
		],
		Interview: ["Interviewee"],
		Patent: ["Inventor"],
		ElectronicSource: [
			"Author",
			"Editor",
			"ProducerName",
			"Translator"
		],
		Case: ["Author", "Counsel"],
		Misc: [
			"Author",
			"Editor",
			"Compiler",
			"Translator"
		]
	};
	/**
	* What the people a source is named by are, after their names, such as "[ed.]", by their role (`GetMainAuthorTitle`).
	* The template means to write the plural for more than one person, but its test of whether they are an organization
	* is always true, so it writes the singular
	*/
	var MAIN_AUTHOR_TITLES = {
		Editor: Strings$1.EditorShortUnCap,
		Translator: Strings$1.TranslatorShortUnCap,
		Performer: Strings$1.PerformerShortUnCap,
		Composer: Strings$1.ComposerShortUnCapIso,
		Conductor: Strings$1.ConductorShortUnCap,
		ProducerName: Strings$1.ProducerShortUnCap,
		Writer: Strings$1.WriterShortUnCap,
		Counsel: Strings$1.CounselShortUnCap,
		Compiler: Strings$1.CompilerShortUnCap
	};
	/** The types whose entries start with their titles in italics, and whose citations name them by their titles */
	var isTitledFirst = (type) => type === "JournalArticle" || type === "ConferenceProceedings";
	/** The string value of the people with a role, or the organization: their names one after another, as XPath reads it */
	var stringOf = (names) => "corporate" in names ? names.corporate : names.people.map(({ last, first, middle }) => last + first + middle).join("");
	/**
	* The people or organization a source is named by: those of the first of its type's roles it has a name in
	* (`MainContributors` and `populateMain`), if it has any
	*/
	var mainOf = (source) => MAIN_ROLES[source.type].flatMap((role) => {
		const names = source.names[role];
		return names !== void 0 && stringOf(names).length > 0 ? [{
			role,
			names
		}] : [];
	})[0];
	/** The string value of the people or organization a source is named by, or "" (`b:Author/b:Main`) */
	var mainStringOf = (source) => {
		const main = mainOf(source);
		return main === void 0 ? "" : stringOf(main.names);
	};
	/**
	* The separator after a person of a list of people (`formatPersonSeparator`): "et al." after the first of four or more,
	* and a comma between the others
	*/
	var formatPersonSeparator = (position, count) => count > 3 ? Strings$1.AndOthersUnCap : count > position ? General$1.AuthorsSeparator : "";
	/** People with a role, or the organization that has it (`formatPersons`). Of four or more people, only the first is written */
	var formatPersons$1 = (names, patterns) => {
		if ("corporate" in names) return names.corporate;
		const count = names.people.length;
		return (count >= 4 ? names.people.slice(0, 1) : names.people).map((person, index) => xsl$1.formatName(person, patterns) + formatPersonSeparator(index + 1, count)).join("");
	};
	/**
	* The people a source is named by, last name first, and what they are, such as "GarciaLucia, NguyenBao，[ed.]"
	* (`formatMain`)
	*/
	var formatMain = (source) => {
		var _MAIN_AUTHOR_TITLES$m;
		const main = mainOf(source);
		if (main === void 0) return "";
		const title = main.role === "Writer" && source.type !== "Film" ? "" : (_MAIN_AUTHOR_TITLES$m = MAIN_AUTHOR_TITLES[main.role]) !== null && _MAIN_AUTHOR_TITLES$m !== void 0 ? _MAIN_AUTHOR_TITLES$m : "";
		return formatPersons$1(main.names, MAIN_AUTHORS) + (title ? LIST_SEPARATOR + SIST.GeneralOpen + title + SIST.GeneralClose : "");
	};
	/** The volume, such as "Vol. 3", or "Vols. 2-3" for more than one */
	var formatVolume = (volume, single, plural) => {
		if (volume.length === 0) return "";
		const format = volume.includes(",") ? plural : translate(volume, General$1.Hyphens, "") === volume ? single : plural;
		return textOf(xsl$1.stringFormat(format, volume));
	};
	/** The pages, such as "p.5", or "pp.10-20" for more than one */
	var formatPages = (pages) => {
		if (pages.length === 0) return "";
		return (pages.includes(",") ? Strings$1.PagesCountinousShort : translate(pages, General$1.Hyphens, "") === pages ? Strings$1.PageShort : Strings$1.PagesCountinousShort) + pages;
	};
	/** Parts with a comma between them, each written only when it isn't empty, and a dot after them (`templateC` and `templateJ`) */
	var formatParts = (...parts) => xsl$1.appendDot(parts.filter((part) => part.length > 0).join(LIST_SEPARATOR));
	var boldElement = (text) => ({
		tag: "b",
		text
	});
	/** Text in italics (`ApplyItalicTitleNS` and `ApplyItalicFieldNS`), which the style writes as an element even when empty */
	var italicElement = (text) => ({
		tag: "i",
		text
	});
	/** Text in italics, or nothing when it is empty, as the style's variables of titles write it */
	var italicUnlessEmpty = (text) => text ? [italicElement(text)] : [];
	var SPACE_BETWEEN_ELEMENTS = [{ text: " " }];
	/**
	* An entry, as Word reads the style's HTML of it: with a space between two elements that follow each other, even when
	* the first is empty, as Word's XSLT processor writes a line break between them. Word doesn't read one at the end of the
	* paragraph
	*/
	var paragraphOf = (nodes) => {
		const parts = nodes.filter((node) => node !== "").flatMap((node, index, written) => typeof node === "string" ? [formatted(node)] : [...typeof written[index - 1] === "object" ? [SPACE_BETWEEN_ELEMENTS] : [], node.tag === "b" ? bold(node.text) : italic(node.text)]).filter((part) => part.length > 0);
		return join(...parts[parts.length - 1] === SPACE_BETWEEN_ELEMENTS ? parts.slice(0, -1) : parts);
	};
	/**
	* Where a source was published and by whom, such as "London，Crust Books", with "s.l." or "s.n." for one that's missing
	* (`formatLocation`). A source of most types with neither has nothing
	*/
	var formatLocation = (type, field) => {
		if (type === "Film") return field("ProductionCompany") + field("Distributor");
		if (type === "Patent") return field("CountryRegion");
		if (type === "DocumentFromInternetSite" || type === "InternetSite") return "";
		const published = [
			"Book",
			"BookSection",
			"JournalArticle",
			"ArticleInAPeriodical",
			"ConferenceProceedings",
			"Interview",
			"Report",
			"Misc"
		].includes(type);
		const hasPlace = field("City") !== "" || type === "Performance" && field("Theater") !== "";
		const hasPublisher = type === "Report" && field("Publisher") !== "" || type === "Art" && field("Institution") !== "" || (type === "SoundRecording" || type === "Performance") && field("ProductionCompany") !== "" || type === "ElectronicSource" && (field("ProductionCompany") !== "" || field("Publisher") !== "") || type === "Case" && field("Court") !== "" || (field("Publisher") !== "" || type === "Interview" && field("Broadcaster") !== "") && (published || type === "Art");
		if (!hasPlace && !hasPublisher) return "";
		const before = (prefixType, prefix) => type === prefixType ? field(prefix) + (field(prefix) !== "" && field("City") !== "" ? LIST_SEPARATOR : "") : "";
		const place = hasPlace ? before("Performance", "Theater") + before("ElectronicSource", "Edition") + before("Interview", "Station") + (type === "Art" && field("Institution") !== "" && field("City") !== "" ? LIST_SEPARATOR : "") + field("City") : (type === "Art" && field("Institution") !== "" ? LIST_SEPARATOR : "") + Strings$1.SineLocoShort;
		const region = [
			"Performance",
			"Art",
			"ElectronicSource",
			"Case",
			"Misc"
		].includes(type) ? (field("StateProvince") !== "" || field("CountryRegion") !== "" ? LIST_SEPARATOR : "") + [field("StateProvince"), field("CountryRegion")].filter((part) => part !== "").join(LIST_SEPARATOR) : "";
		const both = (first, second) => [field(first), field(second)].filter((part) => part !== "").join(LIST_SEPARATOR);
		const after = type === "Report" && field("Publisher") !== "" ? field("Publisher") : (type === "SoundRecording" || type === "Performance") && field("ProductionCompany") !== "" ? field("ProductionCompany") : type === "ElectronicSource" && (field("ProductionCompany") !== "" || field("Publisher") !== "") ? both("Publisher", "ProductionCompany") : type === "Case" && field("Court") !== "" ? field("Court") : type === "Art" && (field("Publisher") !== "" || field("Year") !== "") ? both("Publisher", "Year") : published && (field("Publisher") !== "" || type === "Interview" && field("Broadcaster") !== "") ? (type === "Interview" ? field("Broadcaster") : "") + field("Publisher") : type === "Interview" && field("Broadcaster") === "" ? "" : Strings$1.SineNomineShort;
		return (type === "Art" ? field("Institution") : "") + place + region + (/[^ \t\r\n]/.test(after) ? LIST_SEPARATOR + after : "");
	};
	/**
	* A source's entry in the bibliography (the `b:Bibliography` part of the template that matches `/`): its title in
	* italics, for an article, then the people it's named by in bold, or "—．" when they're the ones of the entry before,
	* then the rest of it, by its type, each part ending with a dot.
	*
	* @param previous - The entry before it in the bibliography, if it has one
	*/
	var formatEntry = (source, previous) => {
		var _namesOf;
		const { type } = source;
		const broadcast = type === "Interview" && (fieldOf(source, "Broadcaster") !== "" || fieldOf(source, "BroadcastTitle") !== "");
		const field = (name) => type === "Interview" && name === (broadcast ? "Publisher" : "Station") ? "" : fieldOf(source, name);
		const namesOf = (role) => broadcast && (role === "Editor" || role === "Translator" || role === "Compiler") ? void 0 : source.names[role];
		const mainString = mainStringOf(source);
		/**
		* The people with a role, and the role, such as "HemingwayErnested.．" (`formatEditor`, `formatTranslator` and the
		* like), unless they're the people the source is named by
		*/
		const formatRole = (role, label) => {
			const names = namesOf(role);
			return names !== void 0 && stringOf(names) !== mainString && stringOf(names).length > 0 ? formatPersons$1(names, SECONDARY_AUTHORS) + label + DOT : "";
		};
		const editors = formatRole("Editor", Strings$1.EditorShortUnCap);
		const translators = formatRole("Translator", Strings$1.TranslatorShortUnCap);
		const bookAuthors = formatRole("BookAuthor", Strings$1.BookAuthorShortUnCap);
		const compilers = formatRole("Compiler", Strings$1.CompilerShortUnCapIso);
		const composers = formatRole("Composer", Strings$1.ComposerShortUnCapIso);
		const conductors = formatRole("Conductor", Strings$1.ConductorShortUnCap);
		const counsel = formatRole("Counsel", Strings$1.CounselShortUnCap);
		const directors = formatRole("Director", Strings$1.DirectorShortUnCap);
		const performers = formatRole("Performer", Strings$1.PerformerShortUnCap);
		const producers = formatRole("ProducerName", Strings$1.ProducerShortUnCap);
		const writers = formatRole("Writer", Strings$1.WriterShortUnCap);
		const interviewerNames = namesOf("Interviewer");
		const interviewers = interviewerNames !== void 0 && stringOf(interviewerNames) !== mainString && stringOf((_namesOf = namesOf("Interviewee")) !== null && _namesOf !== void 0 ? _namesOf : { people: [] }) !== "" ? formatPersons$1(interviewerNames, SECONDARY_AUTHORS) + Strings$1.IntervieweeShortUnCap + DOT : "";
		const location = formatLocation(type, field);
		const date = xsl$1.formatDatePrivate(field("Day"), field("Month"), field("Year"), SIST.Date);
		const accessed = field("DayAccessed") ? SIST.GeneralOpen + textOf(xsl$1.stringFormatDot(Strings$1.CitedCap, xsl$1.formatDatePrivate(field("DayAccessed"), field("MonthAccessed"), field("YearAccessed"), SIST.DateAccessed))) + SIST.GeneralClose : "";
		const volume = formatVolume(field("Volume"), Strings$1.VolumeShortCap, Strings$1.VolumesShortCap);
		const pages = formatPages(field("Pages"));
		const ended = (name) => field(name) ? field(name) + DOT : "";
		const comments = ended("Comments");
		const standardNumber = field("StandardNumber") ? OPEN_BRACKET + field("StandardNumber") + "）．" : "";
		const url = ended("URL");
		const medium = field("Medium") ? SIST.GeneralOpen + field("Medium") + SIST.GeneralClose : "";
		const mediumDot = medium && medium + DOT;
		const title = xsl$1.appendDot(field("Title"));
		const italicTitle = italicUnlessEmpty(title);
		const italicField = (name) => italicUnlessEmpty(xsl$1.appendDot(field(name)));
		const internetSiteTitle = [...italicField("InternetSiteTitle"), SIST.GeneralOpen + Strings$1.OnlineCap + SIST.GeneralClose];
		const versionAndDate = formatParts(field("Version"), type === "InternetSite" ? field("ProductionCompany") : "", date);
		const printList = (...items) => textOf(xsl$1.printList(items));
		const sectionsOf = {
			Book: () => [
				...italicTitle,
				editors,
				translators,
				printList(location, field("Edition"), field("Year"), volume, pages),
				comments,
				standardNumber
			],
			BookSection: () => [
				title,
				bookAuthors,
				editors,
				translators,
				...italicField("BookTitle"),
				printList(location, field("Year"), field("Edition"), volume, pages),
				comments
			],
			JournalArticle: () => [
				editors,
				field("Issue") && field("Issue") + LIST_SEPARATOR,
				printList(location, date, field("JournalName"), volume, pages),
				comments,
				standardNumber
			],
			ArticleInAPeriodical: () => [
				title,
				editors,
				...italicField("PeriodicalTitle"),
				printList(field("Edition"), date, volume, field("Issue"), pages),
				comments
			],
			ConferenceProceedings: () => [
				editors,
				printList(location, field("Year")),
				xsl$1.appendDot(field("ConferenceName")),
				printList(volume, pages),
				comments,
				standardNumber
			],
			Report: () => [
				...italicTitle,
				formatParts(field("Department"), field("Institution")),
				printList(location, field("Year")),
				printList(pages, field("ThesisType")),
				comments,
				standardNumber
			],
			SoundRecording: () => [
				title,
				performers,
				composers,
				conductors,
				producers,
				...italicField("AlbumTitle"),
				medium,
				printList(location, field("Year")),
				comments,
				standardNumber
			],
			Performance: () => [
				...italicTitle,
				directors,
				performers,
				producers,
				printList(location, date),
				comments,
				standardNumber
			],
			Art: () => [
				...italicTitle,
				printList(location),
				comments
			],
			DocumentFromInternetSite: () => [
				title,
				...internetSiteTitle,
				versionAndDate,
				accessed,
				comments,
				url,
				standardNumber
			],
			InternetSite: () => [
				title,
				...internetSiteTitle,
				versionAndDate,
				accessed,
				comments,
				url,
				standardNumber
			],
			Film: () => [
				...italicTitle,
				mediumDot,
				writers,
				performers,
				producers,
				printList(location, field("Year")),
				comments,
				standardNumber
			],
			Interview: () => [
				broadcast ? title : italicElement(title),
				interviewers,
				editors,
				translators,
				compilers,
				...italicUnlessEmpty(xsl$1.appendDot(field("BroadcastTitle"))),
				printList(location, date),
				printList(pages),
				comments,
				standardNumber
			],
			Patent: () => [
				...italicTitle,
				...italicUnlessEmpty(field("PatentNumber")),
				editors,
				translators,
				printList(location, date),
				xsl$1.appendDot(field("Type")),
				comments
			],
			ElectronicSource: () => [
				...italicTitle,
				medium,
				editors,
				producers,
				translators,
				printList(location, date),
				printList(field("PublicationTitle"), xsl$1.appendDot(volume)),
				comments,
				standardNumber
			],
			Case: () => [
				...italicTitle,
				field("CaseNumber") && field("CaseNumber") + LIST_SEPARATOR,
				ended("AbbreviatedCaseNumber"),
				counsel,
				printList(location, date),
				ended("Reporter"),
				comments
			],
			Misc: () => [
				title,
				field("Edition"),
				editors,
				compilers,
				translators,
				italicElement(xsl$1.appendDot(field("PublicationTitle"))),
				mediumDot,
				printList(location, date),
				printList(volume, field("Issue"), pages),
				comments,
				standardNumber
			]
		};
		const previousTitled = previous !== void 0 && isTitledFirst(previous.type);
		const sameTitle = previousTitled && fieldOf(previous, "Title") !== "" && fieldOf(previous, "Title") === field("Title");
		const sameMain = previous !== void 0 && mainStringOf(previous) === mainString;
		return paragraphOf([...[...isTitledFirst(type) ? [italicElement(sameTitle ? ISO690.SameAuthor + DOT : title)] : [], boldElement(previousTitled || isTitledFirst(type) || !sameMain ? formatMain(source) : mainString && SIST.SameAuthor + DOT)], ...sectionsOf[type]()]);
	};
	/** What the bibliography is sorted by (`b:SortingString`, as `populateMain` writes it): the authors, with the title */
	var sortingStringOf = (source) => {
		const main = mainOf(source);
		const author = main === void 0 ? "" : formatPersons$1(main.names, MAIN_AUTHORS);
		const title = fieldOf(source, "Title");
		const titledFirst = isTitledFirst(source.type);
		return (titledFirst && title ? ` ${title}` : "") + (author ? ` ${author}` : "") + (!titledFirst && title ? ` ${title}` : "");
	};
	/**
	* A source of a citation (the `b:Citation` part of the template that matches `/`), such as "（Baker，2010p.50）": the last
	* name of the first of the people it's named by, with "et al." when there are more, or an article's title, its year,
	* and the volume or pages cited. It is its tag when it has neither a name nor a year
	*/
	var formatCitation = ({ source, first, last, hideAuthor, hideYear, pages, volume, prefix, suffix }) => {
		const main = mainOf(source);
		const title = fieldOf(source, "Title");
		const author0 = isTitledFirst(source.type) && title ? title : main === void 0 ? "" : "corporate" in main.names ? main.names.corporate : xsl$1.formatName(main.names.people[0], CITATION_AUTHOR) + (main.names.people.length > 1 ? Strings$1.AndOthersUnCap : "");
		const year0 = fieldOf(source, "Year");
		const author = hideAuthor ? "" : author0;
		const year = hideYear ? "" : year0;
		return join(first ? OPEN_BRACKET : "", prefix !== null && prefix !== void 0 ? prefix : "", author, year ? (author ? LIST_SEPARATOR : "") + year : "", author0 === "" && year0 === "" ? source.tag : "", volume && pages ? volume + ENUM + pages : formatVolume(volume, Strings$1.VolumeShortUnCap, Strings$1.VolumesShortUnCap) || formatPages(pages), suffix !== null && suffix !== void 0 ? suffix : "", last ? CLOSE_BRACKET : "");
	};
	/** The bibliography: each source's entry, sorted by the people it's named by, after the entry before it */
	var formatBibliography = (sources) => {
		const sorted = sortByKey(sources, sortingStringOf);
		return {
			hangingIndent: false,
			paragraphs: sorted.map((source, index) => formatEntry(source, sorted[index - 1]))
		};
	};
	/**
	* Word's SIST02 style.
	*
	* @internal
	*/
	var sist02 = {
		name: "SIST02",
		file: "SIST02.XSL",
		version: "2003",
		citation: formatCitation,
		bibliography: formatBibliography
	};
	//#endregion
	//#region src/bibliography/styles/turabian.ts
	/**
	* Turabian, the style of Kate Turabian's manual for writers of papers (6th edition), written from Word's own
	* (TURABIAN.XSL).
	*
	* Its citations are Chicago's, and its bibliography is sorted as Chicago's is, but its entries end with where and when
	* the source was published, rather than having the year after the authors.
	*
	* Each function follows the XSL template its description names, including where that doesn't do what it looks like it
	* should, so citations and bibliographies are written as Word writes them when it updates a document's fields.
	*
	* @module
	*/
	var { General, Strings, Chicago, APA } = LOCALS;
	var xsl = xslTemplates(General);
	/**
	* What comes after a person in a list of a source's authors: a comma, ", and", or "et al." after the first of seven or
	* more (`formatPersonSeperator`, where English has a comma before "and")
	*/
	var formatPersonSeperator = (position, count) => {
		if (count > 6) return position === 1 ? General.ListSeparator + Strings.AndOthersUnCap : "";
		return position === count ? "" : position === count - 1 ? General.ListSeparator + Strings.AndUnCap + General.Space : General.ListSeparator;
	};
	/**
	* What comes after a person in a list of other contributors, such as editors: a comma, ", &" with APA's word before the
	* last author, or "et al." after the first of seven or more (`formatPersonSeperator2`)
	*/
	var formatPersonSeperator2 = (position, count) => {
		if (count > 6) return position === 1 ? General.ListSeparator + Strings.AndOthersUnCap : "";
		return position === count ? "" : position === count - 1 ? General.AuthorsSeparator + APA.BeforeLastAuthor + General.Space : General.ListSeparator;
	};
	/**
	* People as a source's authors are listed: the first last name first, the others first name first, and only the first
	* of seven or more; or the organization (`formatPersonsAuthor`)
	*/
	var formatPersonsAuthor = (names) => {
		if (names === void 0) return "";
		if ("corporate" in names) return names.corporate;
		const count = names.people.length;
		return names.people.map((person, index) => {
			const position = index + 1;
			return (position === 1 ? xsl.formatName(person, Chicago.MainAuthor) : count <= 6 ? xsl.formatName(person, Chicago.OtherAuthors) : "") + formatPersonSeperator(position, count);
		}).join("");
	};
	/**
	* People as a source's other contributors are listed, such as its editors, first name first, and only the first of seven
	* or more (`formatPersons`)
	*/
	var formatPersons = (names) => {
		if (names === void 0) return "";
		if ("corporate" in names) return names.corporate;
		const count = names.people.length;
		return names.people.map((person, index) => {
			const position = index + 1;
			return (count <= 6 || position === 1 ? xsl.formatName(person, Chicago.SecondaryAuthors) : "") + formatPersonSeperator2(position, count);
		}).join("");
	};
	/** The date, such as "4 May 2001", or "n.d." when the source has no year (`formatDate`, with `formatDateCore`) */
	var formatDate = (source) => {
		const year = fieldOf(source, "Year");
		return year ? xsl.formatDatePrivate(fieldOf(source, "Day"), fieldOf(source, "Month"), year, Chicago.Date) : Strings.NoDateShortUnCap;
	};
	/** The date a source was read, such as "May 4, 2022", or nothing when it has no year (`formatDateAccessed`) */
	var formatDateAccessed = (source) => xsl.formatDatePrivate(fieldOf(source, "DayAccessed"), fieldOf(source, "MonthAccessed"), fieldOf(source, "YearAccessed"), APA.DateAccessed);
	/** The city, the publisher and the year, such as "Naples: Forno Press, 2010" (`templateCPYNoDot`) */
	var templateCPYNoDot = (source) => templateANoDot(templateCityStateProvince(source), fieldOf(source, "Publisher"), getYear(source));
	/** The city, the publisher and the year, with a dot after them (`templateCPY`) */
	var templateCPY = (source) => templateA$1(templateCityStateProvince(source), fieldOf(source, "Publisher"), getYear(source));
	/** The date, the edition and the pages, such as "4 May 2001, 3rd ed.: 10-20." (`templateDEP`) */
	var templateDEP = (source) => templateE$1(formatDate(source), formatIf(Strings.EditionShortUnCap, fieldOf(source, "Edition")), fieldOf(source, "Pages"));
	/**
	* The recording number, the year and the medium, each with a dot after it, such as "KR-101. 2005. CD." (`templateRYM`).
	* The year is never empty, as it is "n.d." when the source has none
	*/
	var templateRYM = (source) => {
		const recordingNumber = fieldOf(source, "RecordingNumber");
		const medium = fieldOf(source, "Medium");
		return xsl.appendDot(recordingNumber) + (recordingNumber ? General.Space : "") + xsl.appendDot(getYear(source)) + (medium ? General.Space : "") + xsl.appendDot(medium);
	};
	/**
	* The court, the city and the date, in brackets, such as "(Supreme Court, Washington 28 June 2001)." (`templateCCD`).
	* The date is never empty, as it is "n.d." when the source has no year, so the brackets are always written
	*/
	var templateCCD = (source) => {
		const court = fieldOf(source, "Court");
		const city = fieldOf(source, "City");
		return xsl.appendDot(General.OpenBracket + court + (court ? General.ListSeparator : "") + city + (city ? General.Space : "") + formatDate(source) + General.CloseBracket);
	};
	/**
	* A journal's publisher, volume, issue, month and year, and pages, such as " 12, no. 4 (May 2010): 233-250."
	* (`templateVIYP`). It starts with a space or a comma when the journal has a name, which comes before it. The year is
	* never empty, as it is "n.d." when the source has none, so neither is this
	*/
	var templateVIYP = (source) => {
		const journalName = fieldOf(source, "JournalName");
		const publisher = fieldOf(source, "Publisher");
		const volume = fieldOf(source, "Volume");
		const issue = fieldOf(source, "Issue");
		const month = fieldOf(source, "Month");
		const pages = fieldOf(source, "Pages");
		const monthYear = (fieldOf(source, "Year") && month ? month + General.Space : "") + getYear(source);
		return xsl.appendDot((publisher ? (journalName ? General.Space : "") + General.OpenBracket + publisher + General.CloseBracket : "") + (volume ? (journalName || publisher ? General.Space : "") + volume : "") + ((journalName || publisher || volume) && issue || !volume && !issue && journalName ? General.ListSeparator : "") + formatIf(Strings.NumberShortUnCap, issue) + General.Space + (volume || issue ? General.OpenBracket + monthYear + General.CloseBracket : monthYear) + (pages ? General.EnumSeparator + pages : ""));
	};
	/**
	* The city, the publisher, and the date in brackets with the pages after it, such as "Paris: Press, (4 May 2001): 10-20."
	* (`templateCPDMY`). The date is never empty, as it is "n.d." when the source has no year, so the template's pages
	* without a date are never written
	*/
	var templateCPDMY = (source) => {
		const pages = fieldOf(source, "Pages");
		return templateA$1(templateCityStateProvince(source), fieldOf(source, "Publisher"), General.OpenBracket + formatDate(source) + General.CloseBracket + (pages ? General.EnumSeparator + pages : ""));
	};
	/** A website's address, and when it was read, such as "https://example.com (accessed May 4, 2022)" (`templateDACURL`) */
	var templateDACURL = (source) => {
		const url = fieldOf(source, "URL");
		const date = formatDateAccessed(source);
		return url + (url && date ? General.Space : "") + (date ? General.OpenBracket + formatIf(Strings.AccessedUnCap, date) + General.CloseBracket : "");
	};
	/** A report's type, department, institution, city, publisher and year, and pages (`templateRICPY`) */
	var templateRICPY = (source) => textOf(xsl.printList([
		fieldOf(source, "ThesisType"),
		fieldOf(source, "Department"),
		fieldOf(source, "Institution"),
		templateCPYNoDot(source),
		fieldOf(source, "Pages")
	]));
	/**
	* A source's entry in the bibliography, as the style writes the paragraph (`b:Bibliography`)
	*
	* @param authorMain - Its authors, or a dash when they're the authors of the entry before it
	*/
	var bibliographyEntry = (source, authorMain) => {
		const field = (name) => fieldOf(source, name);
		const names = (role) => source.names[role];
		const cEditors = countOf$2(names("Editor"));
		const cTranslators = countOf$2(names("Translator"));
		const cComposers = countOf$2(names("Composer"));
		const cCompilers = countOf$2(names("Compiler"));
		const cProducers = countOf$2(names("ProducerName"));
		const cConductors = countOf$2(names("Conductor"));
		const author = formatPersonsAuthor(names("Author"));
		const compiler = formatPersons(names("Compiler"));
		const compilerLF = formatPersonsAuthor(names("Compiler"));
		const editor = formatPersons(names("Editor"));
		const editorLF = formatPersonsAuthor(names("Editor"));
		const translator = formatPersons(names("Translator"));
		const translatorLF = formatPersonsAuthor(names("Translator"));
		const performer = formatPersons(names("Performer"));
		const intervieweeLF = formatPersonsAuthor(names("Interviewee"));
		const producerName = formatPersons(names("ProducerName"));
		const interviewer = formatPersons(names("Interviewer"));
		const writer = formatPersons(names("Writer"));
		const writerLF = formatPersonsAuthor(names("Writer"));
		const director = formatPersons(names("Director"));
		const inventorLF = formatPersonsAuthor(names("Inventor"));
		const bookAuthor = formatPersons(names("BookAuthor"));
		const performerLF = formatPersonsAuthor(names("Performer"));
		const conductorLF = formatPersonsAuthor(names("Conductor"));
		const conductor = formatPersons(names("Conductor"));
		const composerLF = formatPersonsAuthor(names("Composer"));
		const composer = formatPersons(names("Composer"));
		const artist = formatPersonsAuthor(names("Artist"));
		const writerLFDot = xsl.appendDot(writerLF);
		const dateDot = xsl.appendDot(formatDate(source));
		const tempCPY = templateCPY(source);
		const tempRICPY = templateRICPY(source);
		const tempCPDMY = templateCPDMY(source);
		const tempDEP = templateDEP(source);
		const tempRYM = templateRYM(source);
		const tempTC = templateC$1(field("Theater"), field("City"));
		const tempIC = templateC$1(field("Institution"), field("City"));
		const tempDY = templateC$1(field("Distributor"), getYear(source));
		const tempCPD = templateA$1(templateCityStateProvince(source), field("Publisher"), formatDate(source));
		const tempSC = templateC$1(field("Station"), field("City"));
		const tempCP = templateCP(source);
		const tempCCD = templateCCD(source);
		const tempVIYP = templateVIYP(source);
		const tempDaU = xsl.appendDot(templateDACURL(source));
		const titleDot = xsl.appendDot(field("Title"));
		const albumTitleDot = xsl.appendDot(field("AlbumTitle"));
		const pagesDot = xsl.appendDot(field("Pages"));
		const bookTitle = field("BookTitle");
		const bookTitleDot = xsl.appendDot(bookTitle);
		const conferenceNameDot = xsl.appendDot(field("ConferenceName"));
		const broadcasterDot = xsl.appendDot(field("Broadcaster"));
		const interviewTitle = field("Title");
		const publisher = field("Publisher");
		const publicationTitle = field("PublicationTitle");
		const publicationTitleDot = xsl.appendDot(publicationTitle);
		const institutionDot = xsl.appendDot(field("Institution"));
		const journalName = field("JournalName");
		const internetSiteTitleDot = xsl.appendDot(field("InternetSiteTitle"));
		const mediumDot = xsl.appendDot(field("Medium"));
		const issueDot = xsl.appendDot(field("Issue"));
		const numberVolumesDot = xsl.appendDot(formatIf(Strings.VolumesAfterShortUnCap, field("NumberVolumes")));
		const noIssueDot = xsl.appendDot(formatIf(Strings.NumberShortUnCap, field("Issue")));
		const editionDot = xsl.appendDot(field("Edition"));
		const broadcastTitle = field("BroadcastTitle");
		const versionDot = xsl.appendDot(field("Version"));
		const broadcastTitleDot = xsl.appendDot(broadcastTitle);
		const periodicalTitle = field("PeriodicalTitle");
		const periodicalTitleDot = xsl.appendDot(periodicalTitle);
		const productionCompany = field("ProductionCompany");
		const volume = field("Volume");
		const caseNoDot = field("CaseNumber");
		const prefixVersionDot = versionDot ? Strings.VersionShortCap + General.Space + versionDot : "";
		const prefixEditorDot = prefixed(editor, cEditors, Strings.EditorShortCap, Strings.EditorShortCap);
		const prefixTranslatorDot = prefixed(translator, cTranslators, Strings.TranslatorShortCap, Strings.TranslatorsShortCap);
		const sufixEditorLFDot = suffixed(editorLF, cEditors, Strings.EditorShortUnCap, Strings.EditorsShortUnCap);
		const prefixConductorDot = prefixed(conductor, cConductors, Strings.ConductorShortCap, Strings.ConductorsShortCap);
		const prefixComposerDot = prefixed(composer, cComposers, Strings.ComposerShortCap, Strings.ComposersShortCap);
		const prefixCompilerDot = prefixed(compiler, cCompilers, Strings.CompilerShortCap, Strings.CompilersShortCap);
		const sufixCompilerLFDot = suffixed(compilerLF, cCompilers, Strings.CompilerShortUnCap, Strings.CompilersShortUnCap);
		const sufixTranslatorLFDot = suffixed(translatorLF, cTranslators, Strings.TranslatorShortUnCap, Strings.TranslatorsShortUnCap);
		const prefixVolume = formatIf(volumeFormatOf$2(volume, Strings.VolumeShortCap, Strings.VolumesShortCap), volume);
		const prefixVolumeDot = xsl.appendDot(prefixVolume);
		const inBook = bookTitleDot !== "" && prefixVolumeDot !== "";
		const volumeBookTitle = join(prefixVolume, inBook ? General.ListSeparator : "", bookTitle ? xsl.stringFormat(inBook ? Strings.InNameUnCap : Strings.InNameCap, applyItalic$1(bookTitle)) : "");
		const theCapShortPrefixVolumeDot = prefixVolumeDot;
		const prod = producerName || productionCompany;
		const prodDot = xsl.appendDot(prod);
		const prefixProdDot = prod ? (cProducers > 1 ? Strings.ProducersShortCap + General.Space : cProducers === 1 ? Strings.ProducerShortCap + General.Space : "") + prodDot : "";
		const authorDot = xsl.appendDot(author);
		const sectionAuthorDot = authorDot;
		const bookAuthorDot = xsl.appendDot(bookAuthor);
		const performerLFDot = xsl.appendDot(performerLF);
		const artistDot = xsl.appendDot(artist);
		const interviewerDot = xsl.appendDot(interviewer);
		const intervieweeLFDot = xsl.appendDot(intervieweeLF);
		const conductorLFDot = xsl.appendDot(conductorLF);
		const inventorLFDot = xsl.appendDot(inventorLF);
		const writerDot = xsl.appendDot(writer);
		const composerLFDot = xsl.appendDot(composerLF);
		const theAuthorSufixDot = xsl.appendDot(author ? authorMain : editorLF && [
			"Book",
			"Misc",
			"ArticleInAPeriodical",
			"ConferenceProceedings",
			"InternetSite",
			"DocumentFromInternetSite"
		].includes(source.type) ? suffixed(editorLF, cEditors, Strings.EditorShortUnCap, Strings.EditorsShortUnCap) : compilerLF && source.type === "Misc" ? suffixed(compilerLF, cCompilers, Strings.CompilerShortUnCap, Strings.CompilersShortUnCap) : translatorLF && (source.type === "Book" || source.type === "Misc") ? suffixed(translatorLF, cTranslators, Strings.TranslatorShortUnCap, Strings.TranslatorsShortUnCap) : "");
		const theUnCapLongByAuthor = formatIf(Strings.ByUnCap, bookAuthor);
		const theCapLongByAuthor = formatIf(Strings.ByCap, bookAuthor);
		const theCapLongPrefixEditorDot = xsl.appendDot(author ? formatIf(Strings.EditedByCap, editor) : "");
		const theCapLongPrefixCompilerDot = xsl.appendDot(author || editor ? formatIf(Strings.CompiledByCap, compiler) : "");
		const theCapLongPrefixTranslatorDot = xsl.appendDot(author || editor || compiler ? formatIf(Strings.TranslatedByCap, translator) : "");
		const theCapLongPrefixEditedBy = formatIf(Strings.EditedByCap, editor);
		const theCapLongPrefixEditedByDot = xsl.appendDot(theCapLongPrefixEditedBy);
		const theUnCapLongPrefixEditedBy = formatIf(Strings.EditedByUnCap, editor);
		const theUnCapLongPrefixEditedByDot = xsl.appendDot(theUnCapLongPrefixEditedBy);
		const theCapLongPrefixTranslatedBy = formatIf(Strings.TranslatedByCap, translator);
		const theCapLongPrefixTranslatedByDot = xsl.appendDot(theCapLongPrefixTranslatedBy);
		const theUnCapLongPrefixTranslatedBy = formatIf(Strings.TranslatedByUnCap, translator);
		const theUnCapLongPrefixTranslatedByDot = xsl.appendDot(theUnCapLongPrefixTranslatedBy);
		const theCPAuthorSufixDot = xsl.appendDot(author ? authorMain : suffixed(editorLF, cEditors, Strings.EditorShortUnCap, Strings.EditorsShortUnCap));
		const theCPCapLongPrefixEditorDot = theCapLongPrefixEditorDot;
		const theCapLongPrefixDirectedByDot = xsl.appendDot(formatIf(Strings.DirectedByCap, director));
		const theCapLongPrefixPerformedByDot = xsl.appendDot(formatIf(Strings.PerformedByCap, performer));
		const theCapLongPrefixProducedByDot = xsl.appendDot(formatIf(Strings.ProducedByCap, prod));
		const entry = {
			Book: () => join(theAuthorSufixDot, when(titleDot, spaceIf(theAuthorSufixDot), applyItalic$1(titleDot)), when(editionDot, spaceIf(theAuthorSufixDot, titleDot), editionDot), when(theCapLongPrefixEditorDot, spaceIf(theAuthorSufixDot, titleDot, editionDot), theCapLongPrefixEditorDot), when(theCapLongPrefixTranslatorDot, spaceIf(theAuthorSufixDot, titleDot, theCapLongPrefixEditorDot, editionDot), theCapLongPrefixTranslatorDot), when(theCapShortPrefixVolumeDot, spaceIf(theAuthorSufixDot, titleDot, theCapLongPrefixEditorDot, theCapLongPrefixTranslatorDot, editionDot), theCapShortPrefixVolumeDot), when(numberVolumesDot, spaceIf(theAuthorSufixDot, titleDot, theCapLongPrefixEditorDot, theCapLongPrefixTranslatorDot, theCapShortPrefixVolumeDot, editionDot), numberVolumesDot), spaceIf(theAuthorSufixDot, titleDot, theCapLongPrefixEditorDot, theCapLongPrefixTranslatorDot, theCapShortPrefixVolumeDot, editionDot, numberVolumesDot), tempCPY),
			ConferenceProceedings: () => join(theCPAuthorSufixDot, when(titleDot, spaceIf(theCPAuthorSufixDot), quoted(titleDot)), when(theCPCapLongPrefixEditorDot, spaceIf(theCPAuthorSufixDot, titleDot), theCPCapLongPrefixEditorDot), when(conferenceNameDot, spaceIf(theCPAuthorSufixDot, titleDot, theCPCapLongPrefixEditorDot), applyItalic$1(conferenceNameDot)), spaceIf(theCPAuthorSufixDot, titleDot, theCPCapLongPrefixEditorDot, conferenceNameDot), tempCPY, when(pagesDot, General.Space, pagesDot)),
			BookSection: () => join(sectionAuthorDot, volume ? when(titleDot, spaceIf(sectionAuthorDot), applyItalic$1(titleDot), General.Space) : join(when(titleDot, spaceIf(sectionAuthorDot), quoted(titleDot)), spaceIf(sectionAuthorDot, titleDot, bookAuthorDot)), printSpaceAndList([
				volume ? volumeBookTitle : bookTitle ? xsl.stringFormat(Strings.InNameCap, applyItalic$1(bookTitle)) : "",
				!volume && !bookTitleDot ? theCapLongByAuthor : theUnCapLongByAuthor,
				!volume && !bookTitleDot && !theCapLongByAuthor ? theCapLongPrefixEditedBy : theUnCapLongPrefixEditedBy,
				theUnCapLongPrefixTranslatedBy,
				field("Pages")
			]), spaceIf(sectionAuthorDot, titleDot, bookAuthorDot, bookTitleDot, prefixEditorDot, prefixTranslatorDot, volume), tempCPY),
			JournalArticle: () => join(authorDot || sufixEditorLFDot, when(titleDot, spaceIf(authorDot, sufixEditorLFDot), quoted(titleDot)), when(theCPCapLongPrefixEditorDot && authorDot, General.Space, theCPCapLongPrefixEditorDot), when(journalName, spaceIf(authorDot, titleDot, sufixEditorLFDot), applyItalic$1(journalName)), journalName ? "" : spaceIf(authorDot, titleDot, sufixEditorLFDot), tempVIYP),
			Report: () => join(authorDot, when(titleDot, spaceIf(authorDot), publisher ? applyItalic$1(titleDot) : quoted(titleDot)), spaceIf(authorDot, titleDot), tempRICPY),
			SoundRecording: () => {
				const titles = (titleSpace, albumSpace) => join(when(titleDot && albumTitleDot, titleSpace, quoted(titleDot)), when(titleDot && !albumTitleDot, titleSpace, applyItalic$1(titleDot)), when(albumTitleDot, albumSpace, applyItalic$1(albumTitleDot)));
				if (performerLF) return join(performerLFDot, titles(General.Space, General.Space), when(prefixConductorDot, General.Space, prefixConductorDot), when(prefixComposerDot, General.Space, prefixComposerDot), General.Space, tempRYM);
				return conductorLFDot ? join(conductorLFDot, titles(General.Space, General.Space), when(prefixComposerDot, General.Space, prefixComposerDot), General.Space, tempRYM) : join(composerLFDot, titles(spaceIf(composerLFDot), spaceIf(composerLFDot, titleDot)), spaceIf(composerLFDot, titleDot, albumTitleDot), tempRYM);
			},
			Performance: () => join(when(writerLFDot, General.Space, writerLFDot), when(titleDot, spaceIf(writerLFDot), applyItalic$1(titleDot)), when(theCapLongPrefixDirectedByDot, spaceIf(titleDot, writerDot), theCapLongPrefixDirectedByDot), when(theCapLongPrefixPerformedByDot, spaceIf(titleDot, writerDot, theCapLongPrefixDirectedByDot), theCapLongPrefixPerformedByDot), when(tempTC, spaceIf(titleDot, writerDot, theCapLongPrefixDirectedByDot, theCapLongPrefixPerformedByDot), tempTC), spaceIf(titleDot, writerDot, theCapLongPrefixDirectedByDot, theCapLongPrefixPerformedByDot, tempTC), dateDot),
			Art: () => publicationTitle ? join(normalizeSpace$1(artistDot), when(titleDot, spaceIf(artistDot), quoted(titleDot)), when(institutionDot, spaceIf(artistDot, titleDot), institutionDot), spaceIf(artistDot, titleDot, institutionDot), applyItalic$1(publicationTitleDot), General.Space, tempCPY) : join(normalizeSpace$1(artistDot), when(titleDot, spaceIf(artistDot), applyItalic$1(titleDot)), when(tempIC, spaceIf(artistDot, titleDot), tempIC)),
			DocumentFromInternetSite: () => join(theAuthorSufixDot, when(titleDot, spaceIf(theAuthorSufixDot), quoted(titleDot)), when(prefixVersionDot, spaceIf(theAuthorSufixDot, titleDot), prefixVersionDot), when(internetSiteTitleDot, spaceIf(theAuthorSufixDot, titleDot, versionDot), applyItalic$1(internetSiteTitleDot)), when(theCPCapLongPrefixEditorDot, spaceIf(theAuthorSufixDot, titleDot, versionDot, internetSiteTitleDot), theCPCapLongPrefixEditorDot), when(prodDot, spaceIf(theAuthorSufixDot, titleDot, versionDot, internetSiteTitleDot, theCPCapLongPrefixEditorDot), prodDot), spaceIf(theAuthorSufixDot, titleDot, versionDot, internetSiteTitleDot, theCPCapLongPrefixEditorDot, prodDot), dateDot, when(tempDaU, General.Space, tempDaU)),
			InternetSite: () => join(theAuthorSufixDot, when(titleDot, spaceIf(theAuthorSufixDot), applyItalic$1(titleDot)), when(theCPCapLongPrefixEditorDot, spaceIf(theAuthorSufixDot, titleDot), theCPCapLongPrefixEditorDot), when(prefixVersionDot, spaceIf(theAuthorSufixDot, titleDot, theCPCapLongPrefixEditorDot), prefixVersionDot), when(prodDot, spaceIf(theAuthorSufixDot, titleDot, theCPCapLongPrefixEditorDot, versionDot), prodDot), spaceIf(theAuthorSufixDot, titleDot, theCPCapLongPrefixEditorDot, versionDot, prodDot), dateDot, when(tempDaU, General.Space, tempDaU)),
			Patent: () => join(inventorLFDot, when(titleDot, spaceIf(inventorLFDot), titleDot), when(prefixEditorDot, spaceIf(inventorLFDot, titleDot), prefixEditorDot), when(prefixTranslatorDot, spaceIf(inventorLFDot, titleDot, prefixEditorDot), prefixTranslatorDot), when(tempCP, spaceIf(inventorLFDot, titleDot, prefixEditorDot, prefixTranslatorDot), tempCP), spaceIf(inventorLFDot, titleDot, prefixEditorDot, prefixTranslatorDot, tempCP), dateDot),
			Case: () => join(applyItalic$1(titleDot), when(caseNoDot, spaceIf(titleDot), caseNoDot), spaceIf(titleDot, caseNoDot), tempCCD),
			Misc: () => join(theAuthorSufixDot, when(titleDot, spaceIf(theAuthorSufixDot), quoted(titleDot)), when(publicationTitleDot, spaceIf(theAuthorSufixDot, titleDot), applyItalic$1(publicationTitleDot)), when(prefixVolumeDot, spaceIf(theAuthorSufixDot, titleDot, publicationTitleDot), prefixVolumeDot), when(noIssueDot, spaceIf(theAuthorSufixDot, titleDot, publicationTitleDot, prefixVolumeDot), noIssueDot), when(theCPCapLongPrefixEditorDot, spaceIf(theAuthorSufixDot, titleDot, publicationTitleDot, prefixVolumeDot, issueDot), theCPCapLongPrefixEditorDot), when(theCapLongPrefixTranslatorDot, spaceIf(theAuthorSufixDot, titleDot, publicationTitleDot, prefixVolumeDot, issueDot, theCPCapLongPrefixEditorDot), theCapLongPrefixTranslatorDot), when(theCapLongPrefixCompilerDot, spaceIf(theAuthorSufixDot, titleDot, publicationTitleDot, prefixVolumeDot, issueDot, theCPCapLongPrefixEditorDot, theCapLongPrefixTranslatorDot), theCapLongPrefixCompilerDot), spaceIf(theAuthorSufixDot, titleDot, publicationTitleDot, prefixVolumeDot, issueDot, theCPCapLongPrefixEditorDot, theCapLongPrefixTranslatorDot, theCapLongPrefixCompilerDot), tempCPD, when(pagesDot, General.Space, pagesDot)),
			ElectronicSource: () => {
				const lfAuthor = authorDot || sufixEditorLFDot || sufixTranslatorLFDot || sufixCompilerLFDot;
				const before = [
					lfAuthor,
					titleDot,
					publicationTitleDot,
					editionDot,
					prefixVolumeDot,
					mediumDot
				];
				return join(lfAuthor, when(titleDot && publicationTitleDot, spaceIf(lfAuthor), quoted(titleDot)), when(titleDot && !publicationTitleDot, spaceIf(lfAuthor), applyItalic$1(titleDot)), when(publicationTitleDot, spaceIf(lfAuthor, titleDot), applyItalic$1(publicationTitleDot)), when(editionDot, spaceIf(lfAuthor, titleDot, publicationTitleDot), editionDot), when(prefixVolumeDot, spaceIf(lfAuthor, titleDot, publicationTitleDot, editionDot), prefixVolumeDot), when(mediumDot, spaceIf(lfAuthor, titleDot, publicationTitleDot, editionDot, prefixVolumeDot), mediumDot), when(authorDot && theCPCapLongPrefixEditorDot, spaceIf(...before), theCPCapLongPrefixEditorDot), when(theCapLongPrefixTranslatorDot && (authorDot || sufixEditorLFDot), spaceIf(...before), theCapLongPrefixTranslatorDot), when(prefixCompilerDot && (authorDot || sufixEditorLFDot || sufixTranslatorLFDot), spaceIf(...before), prefixCompilerDot), when(prefixProdDot, spaceIf(...before), prefixProdDot), spaceIf(...before, prefixProdDot), tempCPD);
			},
			ArticleInAPeriodical: () => join(theAuthorSufixDot, when(periodicalTitle && !theAuthorSufixDot, applyItalic$1(periodicalTitleDot)), when(titleDot, spaceIf(theAuthorSufixDot, periodicalTitle), quoted(titleDot)), when(periodicalTitle && theAuthorSufixDot, General.Space, applyItalic$1(periodicalTitle)), theAuthorSufixDot && periodicalTitle ? General.ListSeparator : spaceIf(theAuthorSufixDot, titleDot), tempDEP),
			Film: () => join(when(writerDot, writerLFDot), when(titleDot, spaceIf(writerDot), applyItalic$1(titleDot)), when(mediumDot, spaceIf(titleDot, writerDot), mediumDot), when(theCapLongPrefixDirectedByDot, spaceIf(titleDot, writerDot, mediumDot), theCapLongPrefixDirectedByDot), when(theCapLongPrefixProducedByDot, spaceIf(titleDot, writerDot, theCapLongPrefixDirectedByDot, mediumDot), theCapLongPrefixProducedByDot), when(theCapLongPrefixPerformedByDot, spaceIf(titleDot, writerDot, theCapLongPrefixDirectedByDot, theCapLongPrefixProducedByDot, mediumDot), theCapLongPrefixPerformedByDot), spaceIf(titleDot, writerDot, theCapLongPrefixDirectedByDot, theCapLongPrefixProducedByDot, theCapLongPrefixPerformedByDot, mediumDot), tempDY),
			Interview: () => {
				const interviewTitleDot = titleDot;
				const start = join(when(intervieweeLFDot, interviewerDot ? intervieweeLF : intervieweeLFDot), when(interviewerDot, intervieweeLFDot ? General.ListSeparator : "", xsl.stringFormatDot(intervieweeLFDot ? Strings.InterviewByUnCap : Strings.InterviewByCap, interviewer)), when(interviewTitle, spaceIf(interviewerDot, intervieweeLFDot), broadcastTitleDot ? join(intervieweeLFDot ? General.Space : "", quoted(interviewTitleDot)) : join(spaceIf(intervieweeLFDot), applyItalic$1(interviewTitle))));
				if (field("Broadcaster")) return join(start, when(broadcastTitleDot, spaceIf(interviewerDot, intervieweeLFDot, interviewTitle), applyItalic$1(broadcastTitleDot)), spaceIf(interviewerDot, intervieweeLFDot, interviewTitle, broadcastTitleDot), broadcasterDot, when(tempSC, General.Space, tempSC), General.Space, dateDot);
				return join(start, when(broadcastTitleDot, spaceIf(interviewerDot, intervieweeLFDot, interviewTitle), applyItalic$1(editor || translator ? broadcastTitle : broadcastTitleDot)), when(theCapLongPrefixEditedByDot, broadcastTitleDot ? join(General.ListSeparator, theCapLongPrefixTranslatedByDot ? theUnCapLongPrefixEditedBy : theUnCapLongPrefixEditedByDot) : theCapLongPrefixTranslatedByDot ? theCapLongPrefixEditedBy : theCapLongPrefixEditedByDot), when(theCapLongPrefixTranslatedByDot, broadcastTitleDot || theCapLongPrefixEditedByDot ? join(General.ListSeparator, theUnCapLongPrefixTranslatedByDot) : theCapLongPrefixTranslatedByDot), spaceIf(interviewerDot, intervieweeLFDot, interviewTitle, broadcastTitleDot, theCapLongPrefixTranslatedByDot, theCapLongPrefixEditedByDot), tempCPDMY);
			}
		}[source.type]();
		const last = entry[entry.length - 1];
		return (last === null || last === void 0 ? void 0 : last.italics) ? join(entry, General.Space) : entry;
	};
	/**
	* Turabian, the style of Kate Turabian's manual for writers of papers, as Word writes it: citations such as
	* "(Baker 2010, 50)", and a bibliography of entries such as "Baker, Anna. *The Art of Pizza.* Naples: Forno Press, 2010.",
	* with a dash for the authors of an entry with the same authors as the one before it.
	*/
	var turabian = {
		name: "Turabian",
		file: "TURABIAN.XSL",
		version: "6",
		citation: citation$3,
		bibliography: (sources) => bibliographyOf(sources, formatPersonsAuthor, bibliographyEntry)
	};
	//#endregion
	//#region src/bibliography/citation-style.ts
	/**
	* The styles of citation Word has, such as APA and MLA, which a document's citations and bibliographies are written in.
	*
	* @module
	*/
	/**
	* The styles of citation Word has, as Word lists them in References > Style. Each is written as Word writes it, and its
	* citation of a book by Anna Baker from 2010 is in its description.
	*
	* @publicApi
	*/
	var CitationStyle = {
		/** APA, sixth edition: "(Baker, 2010)" */
		APA: "apa",
		/** Chicago, sixteenth edition, author-date: "(Baker 2010)" */
		CHICAGO: "chicago",
		/** GB7714, China's national standard: "(Baker, 2010)" */
		GB7714: "gb7714",
		/** GOST, Russia's national standard, with the bibliography sorted by name: "(Baker, 2010)" */
		GOST_NAME_SORT: "gostNameSort",
		/** GOST, Russia's national standard, with the bibliography sorted by title: "(Baker, 2010)" */
		GOST_TITLE_SORT: "gostTitleSort",
		/** Harvard, as Anglia Ruskin University writes it: "(Baker, 2010)" */
		HARVARD_ANGLIA: "harvardAnglia",
		/** IEEE, with the sources numbered in the order they're cited: "[1]" */
		IEEE: "ieee",
		/** ISO 690, with the first element and the date: "(Baker, 2010)" */
		ISO_690_FIRST_ELEMENT_AND_DATE: "iso690FirstElementAndDate",
		/** ISO 690, with the sources numbered in the order they're cited: "(1)" */
		ISO_690_NUMERICAL_REFERENCE: "iso690NumericalReference",
		/** MLA, seventh edition: "(Baker)" */
		MLA: "mla",
		/** SIST02, Japan's standard, in full-width punctuation: "（Baker，2010）" */
		SIST02: "sist02",
		/** Turabian, sixth edition: "(Baker 2010)" */
		TURABIAN: "turabian"
	};
	/** Each style of citation's definition */
	var STYLE_DEFINITIONS = {
		apa,
		chicago,
		gb7714,
		gostNameSort,
		gostTitleSort,
		harvardAnglia,
		ieee,
		iso690FirstElementAndDate,
		iso690NumericalReference,
		mla,
		sist02,
		turabian
	};
	//#endregion
	//#region src/bibliography/create-bibliography.ts
	/**
	* A document's bibliography, for the document's `bibliography`: the sources its citations and bibliographies refer to,
	* and the style they're written in, as Word's References > Manage Sources and Style keep them.
	*
	* Every source is in the document's bibliographies, cited or not, as Word's are, and Word lists every source in its
	* Source Manager.
	*
	* @publicApi
	*
	* @throws If two sources have the same tag, a source has none, a source's type isn't one of {@link SourceType}'s, or the
	* style isn't one of {@link CitationStyle}'s
	*
	* @example
	* ```typescript
	* const doc = new Document({
	*   bibliography: createBibliography({
	*     style: CitationStyle.APA,
	*     sources: [
	*       {
	*         tag: "Bak10",
	*         type: SourceType.BOOK,
	*         authors: [{ lastName: "Baker", firstName: "Anna" }],
	*         title: "The Art of Pizza",
	*         year: 2010,
	*         city: "Naples",
	*         publisher: "Oven Press",
	*       },
	*     ],
	*   }),
	*   sections: [{ children: [new Paragraph({ children: [new Citation("Bak10")] }), new Bibliography({ title: "References" })] }],
	* });
	* ```
	*/
	var createBibliography = ({ style = CitationStyle.APA, sources }) => {
		if (!Object.keys(STYLE_DEFINITIONS).includes(style)) throw new Error(`"${style}" isn't a style of citation. Give one of CitationStyle's, such as CitationStyle.APA`);
		return { sources: new BibliographySources(STYLE_DEFINITIONS[style], sources) };
	};
	//#endregion
	//#region src/bibliography/source.ts
	/**
	* The sources that a document's citations and bibliographies refer to, as Word's Create Source dialog describes them.
	*
	* Reference: ooxml-schemas/ISO-IEC29500-4_2016/shared-bibliography.xsd
	*
	* @module
	*/
	/**
	* The kinds of source Word's Create Source dialog has. Each has the fields Word asks for when it's chosen, though any
	* source can have any field. Word's own name for each, as it writes it in the document, is in brackets.
	*
	* @publicApi
	*/
	var SourceType = {
		/** A book (`Book`) */
		BOOK: "book",
		/** A chapter or other part of a book, with its own title and authors (`BookSection`) */
		BOOK_SECTION: "bookSection",
		/** An article in a journal (`JournalArticle`) */
		JOURNAL_ARTICLE: "journalArticle",
		/** An article in a magazine or a newspaper (`ArticleInAPeriodical`) */
		ARTICLE_IN_A_PERIODICAL: "articleInAPeriodical",
		/** A paper in the proceedings of a conference (`ConferenceProceedings`) */
		CONFERENCE_PROCEEDINGS: "conferenceProceedings",
		/** A report or a thesis (`Report`) */
		REPORT: "report",
		/** A page of a website (`InternetSite`) */
		WEBSITE: "website",
		/** A document on a website, such as a PDF (`DocumentFromInternetSite`) */
		DOCUMENT_FROM_WEBSITE: "documentFromWebsite",
		/** A source on a medium other than paper, such as a CD-ROM or a database (`ElectronicSource`) */
		ELECTRONIC_SOURCE: "electronicSource",
		/** A work of art (`Art`) */
		ART: "art",
		/** A recording of music or of speech (`SoundRecording`) */
		SOUND_RECORDING: "soundRecording",
		/** A play, a concert or another performance (`Performance`) */
		PERFORMANCE: "performance",
		/** A film (`Film`) */
		FILM: "film",
		/** An interview (`Interview`) */
		INTERVIEW: "interview",
		/** A patent (`Patent`) */
		PATENT: "patent",
		/** A court case (`Case`) */
		CASE: "case",
		/** Any other source (`Misc`) */
		MISCELLANEOUS: "miscellaneous"
	};
	//#endregion
	exports.Bibliography = Bibliography;
	exports.Citation = Citation;
	exports.CitationStyle = CitationStyle;
	exports.SourceType = SourceType;
	exports.createBibliography = createBibliography;
	return exports;
})({}, docx);
