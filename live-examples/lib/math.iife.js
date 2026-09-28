var docxMath = (function(exports, docx) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	//#region src/math/math-elements.ts
	/**
	* What docx/math's components share: the checks on their arguments, and the elements they are made of. Nothing here is
	* exported from docx/math.
	*
	* @module
	*/
	/**
	* A count of things, such as "1 column" or "3 columns".
	*/
	var plural = (count, thing) => `${count} ${thing}${count === 1 ? "" : "s"}`;
	/**
	* An element whose value is its `m:val`, such as `<m:begChr m:val="("/>`.
	*/
	var createValueElement = (name, value) => new docx.BuilderElement({
		name,
		attributes: { value: {
			key: "m:val",
			value
		} }
	});
	/**
	* Throws for what can't go in an argument: a `Math`, which Word won't open inside math, and a paragraph or a run of
	* document text, which the schema doesn't allow there. Only an argument's own children can be checked.
	*/
	var checkArgument = (owner, where, children) => {
		for (const child of children) {
			if (child instanceof docx.Math) throw new Error(`${owner}: ${where} holds a Math. Word won't open math inside math, so give the Math's children instead`);
			if (child instanceof docx.Paragraph) throw new Error(`${owner}: ${where} holds a Paragraph. Math goes in a paragraph, not a paragraph in math`);
			if (child instanceof docx.Run) throw new Error(`${owner}: ${where} holds a TextRun or another run of document text, which can't go in math. Use a MathRun`);
		}
	};
	/**
	* Throws unless a bracket or separator is one character, or none. Characters are counted as code points, so `𝒜` is one.
	*/
	var checkCharacter = (owner, option, value) => {
		if ([...value].length > 1) throw new Error(`${owner}: ${option} is "${value}", which is more than one character. Give one character, or "" for none`);
	};
	/**
	* Throws unless a value is one of those allowed, for code that isn't type checked.
	*/
	var checkOneOf = (owner, option, value, allowed) => {
		if (!allowed.includes(value)) throw new Error(`${owner}: ${option} is "${value}", which isn't one of ${allowed.map((one) => `"${one}"`).join(", ")}`);
	};
	/**
	* An argument of any name, such as a limit (`m:lim`). An empty one gets a zero-width space, as LibreOffice can't read
	* an equation with an empty argument, and draws "¿" in its place.
	*/
	var createNamedArgument = (name, children) => new docx.BuilderElement({
		name,
		children: children.length === 0 ? [new docx.MathRun("​")] : children
	});
	/**
	* An argument (`m:e`). An empty one gets a zero-width space, as {@link createNamedArgument} says.
	*/
	var createArgument = (children) => createNamedArgument("m:e", children);
	/**
	* Brackets (`m:d`) around arguments, with a separator between them. They grow with their content unless `grow` is
	* false, as Word's do when `m:grow` isn't written.
	*/
	var bracketsElement = ({ open, close, separator, grow }, args) => ({
		name: "m:d",
		children: [new docx.BuilderElement({
			name: "m:dPr",
			children: [
				createValueElement("m:begChr", open),
				...separator === void 0 ? [] : [createValueElement("m:sepChr", separator)],
				createValueElement("m:endChr", close),
				...grow === false ? [createValueElement("m:grow", 0)] : []
			]
		}), ...args]
	});
	//#endregion
	//#region src/math/math-accent.ts
	/**
	* Accents over math, such as a hat, a tilde, dots or a vector's arrow.
	*
	* @module
	*/
	var ACCENTS = {
		hat: "̂",
		check: "̌",
		tilde: "̃",
		acute: "́",
		grave: "̀",
		dot: "̇",
		doubleDot: "̈",
		tripleDot: "⃛",
		breve: "̆",
		bar: "̅",
		ring: "̊",
		rightArrow: "⃗",
		leftArrow: "⃖",
		leftRightArrow: "⃡",
		rightHarpoon: "⃑",
		leftHarpoon: "⃐"
	};
	/**
	* An accent over math (`m:acc`), such as a hat, a tilde, dots or a vector's arrow, as LaTeX's `\hat`, `\tilde`,
	* `\dot` and `\vec`. Word stretches the accent over what it goes over.
	*
	* For a line over or under math, as LaTeX's `\overline` and `\underline`, use a `MathBar`.
	*
	* @example
	* ```typescript
	* new MathAccent({ accent: "rightArrow", children: [new MathRun("v")] });
	* ```
	*/
	var MathAccent = class extends docx.BuilderElement {
		constructor({ accent = "hat", children }) {
			checkOneOf("MathAccent", "accent", accent, Object.keys(ACCENTS));
			checkArgument("MathAccent", "children", children);
			super({
				name: "m:acc",
				children: [new docx.BuilderElement({
					name: "m:accPr",
					children: [createValueElement("m:chr", ACCENTS[accent])]
				}), createArgument(children)]
			});
		}
	};
	//#endregion
	//#region src/math/math-bar.ts
	/**
	* Lines over or under math, such as LaTeX's `\overline` and `\underline`.
	*
	* @module
	*/
	var POSITIONS = ["above", "below"];
	/**
	* A line over or under math (`m:bar`), as LaTeX's `\overline` and `\underline`, as long as what it goes over.
	*
	* @example
	* ```typescript
	* new MathBar({ children: [new MathRun("AB")] });
	* new MathBar({ position: "below", children: [new MathRun("x")] });
	* ```
	*/
	var MathBar = class extends docx.BuilderElement {
		constructor({ position = "above", children }) {
			checkOneOf("MathBar", "position", position, POSITIONS);
			checkArgument("MathBar", "children", children);
			super({
				name: "m:bar",
				children: [new docx.BuilderElement({
					name: "m:barPr",
					children: [createValueElement("m:pos", position === "above" ? "top" : "bot")]
				}), createArgument(children)]
			});
		}
	};
	//#endregion
	//#region src/math/math-box.ts
	/**
	* Boxes around math, and lines struck through it, such as LaTeX's `\boxed` and `\cancel`.
	*
	* @module
	*/
	var SIDES = {
		top: "m:hideTop",
		bottom: "m:hideBot",
		left: "m:hideLeft",
		right: "m:hideRight"
	};
	var STRIKES = {
		horizontal: "m:strikeH",
		vertical: "m:strikeV",
		diagonalUp: "m:strikeBLTR",
		diagonalDown: "m:strikeTLBR"
	};
	/**
	* A box around math (`m:borderBox`), as LaTeX's `\boxed`, with lines struck through it, as `\cancel`, `\bcancel` and
	* `\xcancel`. Any of its sides can be left out.
	*
	* @example
	* ```typescript
	* new MathBox({ children: [new MathRun("E=mc²")] });
	* new MathBox({ borders: [], strikes: ["diagonalUp"], children: [new MathRun("x")] });
	* ```
	*/
	var MathBox = class extends docx.BuilderElement {
		constructor({ children, borders = [
			"top",
			"bottom",
			"left",
			"right"
		], strikes = [] }) {
			borders.forEach((side) => checkOneOf("MathBox", "borders", side, Object.keys(SIDES)));
			strikes.forEach((strike) => checkOneOf("MathBox", "strikes", strike, Object.keys(STRIKES)));
			checkArgument("MathBox", "children", children);
			const properties = [...Object.entries(SIDES).filter(([side]) => !borders.includes(side)).map(([, name]) => createValueElement(name, 1)), ...Object.entries(STRIKES).filter(([strike]) => strikes.includes(strike)).map(([, name]) => createValueElement(name, 1))];
			super({
				name: "m:borderBox",
				children: [...properties.length === 0 ? [] : [new docx.BuilderElement({
					name: "m:borderBoxPr",
					children: properties
				})], createArgument(children)]
			});
		}
	};
	//#endregion
	//#region src/math/math-brace.ts
	/**
	* Braces over or under math, with a label, such as LaTeX's `\overbrace` and `\underbrace`.
	*
	* @module
	*/
	var BRACES = {
		curly: {
			above: "⏞",
			below: "⏟"
		},
		square: {
			above: "⎴",
			below: "⎵"
		},
		round: {
			above: "⏜",
			below: "⏝"
		}
	};
	/**
	* A brace over or under math (`m:groupChr`), as long as what it goes over, as LaTeX's `\overbrace` and
	* `\underbrace`. A label goes on the brace's other side, as Word writes it: in a limit above (`m:limUpp`) or below
	* (`m:limLow`).
	*
	* @example
	* ```typescript
	* new MathBrace({
	*   position: "below",
	*   children: [new MathRun("1+2+⋯+n")],
	*   label: [new MathRun("n terms")],
	* });
	* ```
	*/
	var MathBrace = class extends docx.BuilderElement {
		constructor({ position = "above", brace = "curly", children, label }) {
			checkOneOf("MathBrace", "position", position, POSITIONS);
			checkOneOf("MathBrace", "brace", brace, Object.keys(BRACES));
			checkArgument("MathBrace", "children", children);
			if (label !== void 0) checkArgument("MathBrace", "label", label);
			const above = position === "above";
			const group = {
				name: "m:groupChr",
				children: [new docx.BuilderElement({
					name: "m:groupChrPr",
					children: [
						createValueElement("m:chr", BRACES[brace][position]),
						createValueElement("m:pos", above ? "top" : "bot"),
						createValueElement("m:vertJc", above ? "bot" : "top")
					]
				}), createArgument(children)]
			};
			super(label === void 0 ? group : {
				name: above ? "m:limUpp" : "m:limLow",
				children: [(0, docx.createMathBase)({ children: [new docx.BuilderElement(group)] }), createNamedArgument("m:lim", label)]
			});
		}
	};
	//#endregion
	//#region src/math/math-brackets.ts
	/**
	* Brackets of any characters around math, such as |x|, ‖v‖, ⟨a|b⟩ or a brace on one side.
	*
	* @module
	*/
	/**
	* Brackets of any characters around math (`m:d`), such as |x|, ‖v‖, ⟨a|b⟩ or a brace on one side only. They grow
	* with what they hold.
	*
	* `MathRoundBrackets`, `MathSquareBrackets`, `MathCurlyBrackets` and `MathAngledBrackets` are fixed pairs of these.
	*
	* @example
	* ```typescript
	* new MathBrackets({ open: "|", close: "|", children: [new MathRun("x")] });
	* new MathBrackets({ open: "⟨", close: "⟩", items: [[new MathRun("a")], [new MathRun("b")]] });
	* new MathBrackets({ open: "{", close: "", children: [new MathRun("x")] });
	* ```
	*/
	var MathBrackets = class extends docx.BuilderElement {
		constructor(options) {
			var _options$items;
			const { open = "(", close = ")", separator, grow } = options;
			const items = (_options$items = options.items) !== null && _options$items !== void 0 ? _options$items : [options.children];
			checkCharacter("MathBrackets", "open", open);
			checkCharacter("MathBrackets", "close", close);
			if (separator !== void 0) checkCharacter("MathBrackets", "separator", separator);
			if (items.length === 0) throw new Error("MathBrackets: items is empty. Give at least one item, or use children");
			items.forEach((item, index) => checkArgument("MathBrackets", options.items ? `item ${index + 1}` : "children", item));
			super(bracketsElement({
				open,
				close,
				separator,
				grow
			}, items.map(createArgument)));
		}
	};
	//#endregion
	//#region \0@oxc-project+runtime@0.150.0/helpers/esm/objectWithoutPropertiesLoose.js
	function _objectWithoutPropertiesLoose(r, e) {
		if (null == r) return {};
		var t = {};
		for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
			if (e.includes(n)) continue;
			t[n] = r[n];
		}
		return t;
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.150.0/helpers/esm/objectWithoutProperties.js
	function _objectWithoutProperties(e, t) {
		if (null == e) return {};
		var o, r, i = _objectWithoutPropertiesLoose(e, t);
		if (Object.getOwnPropertySymbols) {
			var s = Object.getOwnPropertySymbols(e);
			for (r = 0; r < s.length; r++) o = s[r], t.includes(o) || {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
		}
		return i;
	}
	//#endregion
	//#region src/math/math-matrix.ts
	/**
	* Matrices, such as LaTeX's `pmatrix`, `bmatrix`, `vmatrix` and `Vmatrix`.
	*
	* @module
	*/
	var _excluded = ["brackets"];
	var BRACKETS = {
		round: ["(", ")"],
		square: ["[", "]"],
		curly: ["{", "}"],
		angled: ["⟨", "⟩"],
		verticalBars: ["|", "|"],
		doubleVerticalBars: ["‖", "‖"]
	};
	var COLUMN_ALIGNMENTS$1 = [
		"left",
		"center",
		"right"
	];
	var VERTICAL_ALIGNMENTS = [
		"top",
		"center",
		"bottom"
	];
	/**
	* A matrix (`m:m`), without brackets. Its errors name `owner`, its rows as `rowsName`, and each cell as `cellName` does.
	*/
	var matrixElement = (owner, { rows, columnAlignment = "center", verticalAlignment = "center" }, { rowsName = "rows", cellName = (row, column) => `row ${row + 1}, cell ${column + 1}` } = {}) => {
		if (rows.length === 0) throw new Error(`${owner}: there are no ${rowsName}. Give at least one`);
		if (rows.length > 256) throw new Error(`${owner}: there are ${rows.length} ${rowsName}, but Word allows at most 256`);
		const columns = Math.max(...rows.map((row) => row.length));
		if (columns === 0) throw new Error(`${owner}: every row is empty. Give at least one cell`);
		if (columns > 64) throw new Error(`${owner}: a row has ${columns} cells, but Word allows at most 64`);
		const alignments = typeof columnAlignment === "string" ? Array.from({ length: columns }, () => columnAlignment) : columnAlignment;
		if (alignments.length !== columns) throw new Error(`${owner}: columnAlignment has ${plural(alignments.length, "alignment")}, but the rows have ${plural(columns, "column")}. Give one for each`);
		alignments.forEach((alignment) => checkOneOf(owner, "columnAlignment", alignment, COLUMN_ALIGNMENTS$1));
		checkOneOf(owner, "verticalAlignment", verticalAlignment, VERTICAL_ALIGNMENTS);
		rows.forEach((row, rowIndex) => row.forEach((cell, column) => checkArgument(owner, cellName(rowIndex, column), cell)));
		const groups = alignments.reduce((all, alignment) => all.length > 0 && all[all.length - 1].alignment === alignment ? [...all.slice(0, -1), {
			alignment,
			count: all[all.length - 1].count + 1
		}] : [...all, {
			alignment,
			count: 1
		}], []);
		return {
			name: "m:m",
			children: [new docx.BuilderElement({
				name: "m:mPr",
				children: [
					createValueElement("m:baseJc", verticalAlignment),
					createValueElement("m:plcHide", 1),
					new docx.BuilderElement({
						name: "m:mcs",
						children: groups.map(({ alignment, count }) => new docx.BuilderElement({
							name: "m:mc",
							children: [new docx.BuilderElement({
								name: "m:mcPr",
								children: [createValueElement("m:count", count), createValueElement("m:mcJc", alignment)]
							})]
						}))
					})
				]
			}), ...rows.map((row) => new docx.BuilderElement({
				name: "m:mr",
				children: Array.from({ length: columns }, (_, column) => {
					var _row$column;
					return createArgument((_row$column = row[column]) !== null && _row$column !== void 0 ? _row$column : []);
				})
			}))]
		};
	};
	/**
	* A matrix (`m:m`), in brackets or none (`m:d`): LaTeX's `matrix`, `pmatrix`, `bmatrix`, `Bmatrix`, `vmatrix` and
	* `Vmatrix`.
	*
	* Word lines up each column's cells as `columnAlignment` says, and hides the placeholders of empty cells. LibreOffice
	* and Pages centre every column.
	*
	* @example
	* ```typescript
	* new MathMatrix({
	*   brackets: "round",
	*   rows: [
	*     [[new MathRun("1")], [new MathRun("2")]],
	*     [[new MathRun("3")], [new MathRun("4")]],
	*   ],
	* });
	* ```
	*/
	var MathMatrix = class extends docx.BuilderElement {
		constructor(_ref) {
			let { brackets = "none" } = _ref, options = _objectWithoutProperties(_ref, _excluded);
			checkOneOf("MathMatrix", "brackets", brackets, ["none", ...Object.keys(BRACKETS)]);
			const matrix = matrixElement("MathMatrix", options);
			super(brackets === "none" ? matrix : bracketsElement({
				open: BRACKETS[brackets][0],
				close: BRACKETS[brackets][1]
			}, [(0, docx.createMathBase)({ children: [new docx.BuilderElement(matrix)] })]));
		}
	};
	//#endregion
	//#region src/math/math-cases.ts
	/**
	* Cases, such as LaTeX's `cases`: values, each with its condition, in a brace.
	*
	* @module
	*/
	/**
	* Cases, as LaTeX's `cases`: values, each with its condition, one to a line, in a brace on the left. The values and
	* the conditions each line up on the left.
	*
	* They are written as pandoc writes them: a matrix of two columns in a brace with no closing bracket. Word's own
	* equation editor lines the conditions up with an `&` instead, which LibreOffice draws.
	*
	* @example
	* ```typescript
	* new MathCases({
	*   cases: [
	*     { value: [new MathRun("x,")], condition: [new MathRun({ text: "if ", normalText: true }), new MathRun("x≥0")] },
	*     { value: [new MathRun("−x,")], condition: [new MathRun({ text: "otherwise", normalText: true })] },
	*   ],
	* });
	* ```
	*/
	var MathCases = class extends docx.BuilderElement {
		constructor({ cases }) {
			const conditions = cases.some((one) => one.condition !== void 0);
			const matrix = matrixElement("MathCases", {
				rows: cases.map(({ value, condition }) => conditions ? [value, condition !== null && condition !== void 0 ? condition : []] : [value]),
				columnAlignment: "left"
			}, {
				rowsName: "cases",
				cellName: (row, column) => `case ${row + 1}'s ${column === 0 ? "value" : "condition"}`
			});
			super(bracketsElement({
				open: "{",
				close: ""
			}, [(0, docx.createMathBase)({ children: [new docx.BuilderElement(matrix)] })]));
		}
	};
	//#endregion
	//#region src/math/math-equation-array.ts
	/**
	* Equation arrays: rows of math lined up at points, such as LaTeX's `align` and `aligned`, with equation numbers.
	*
	* @module
	*/
	/**
	* An equation array (`m:eqArr`): rows of math, one to a line, lined up at the points between their parts, as LaTeX's
	* `align` and `aligned`, with an equation number at the end of any row.
	*
	* Word marks the points with an `&`, and the number with a `#`, in the text. So an `&` or a `#` in a `MathRun` in the
	* array is taken as one too. LibreOffice shows the `&` and `#`, and centres the rows; Pages lines them up, but shows
	* the `#`.
	*
	* @example
	* ```typescript
	* new MathEquationArray({
	*   rows: [
	*     { parts: [[new MathRun("y")], [new MathRun("=mx+b")]], equationNumber: "(1)" },
	*     { parts: [[new MathRun("y′")], [new MathRun("=m")]], equationNumber: "(2)" },
	*   ],
	* });
	* ```
	*/
	var MathEquationArray = class extends docx.BuilderElement {
		constructor({ rows, verticalAlignment }) {
			if (rows.length === 0) throw new Error("MathEquationArray: there are no rows. Give at least one");
			if (rows.length > 64) throw new Error(`MathEquationArray: there are ${rows.length} rows, but Word allows at most 64`);
			if (verticalAlignment !== void 0) checkOneOf("MathEquationArray", "verticalAlignment", verticalAlignment, VERTICAL_ALIGNMENTS);
			rows.forEach(({ parts }, row) => {
				if (parts.length === 0) throw new Error(`MathEquationArray: row ${row + 1} has no parts. Give at least one, which can be empty`);
				parts.forEach((part, index) => checkArgument("MathEquationArray", `row ${row + 1}, part ${index + 1}`, part));
			});
			super({
				name: "m:eqArr",
				children: [...verticalAlignment === void 0 ? [] : [new docx.BuilderElement({
					name: "m:eqArrPr",
					children: [createValueElement("m:baseJc", verticalAlignment)]
				})], ...rows.map(({ parts, equationNumber }) => createArgument([...parts.flatMap((part, index) => index === 0 ? part : [new docx.MathRun("&"), ...part]), ...equationNumber ? [new docx.MathRun("#"), new docx.MathRun(equationNumber)] : []]))]
			});
		}
	};
	//#endregion
	//#region src/math/math-large-operator.ts
	/**
	* Large operators with limits, such as products, unions and contour integrals, as well as sums and integrals.
	*
	* @module
	*/
	var LARGE_OPERATORS = {
		sum: "∑",
		product: "∏",
		coproduct: "∐",
		union: "⋃",
		intersection: "⋂",
		squareUnion: "⨆",
		multisetUnion: "⨄",
		logicalOr: "⋁",
		logicalAnd: "⋀",
		directSum: "⨁",
		tensorProduct: "⨂",
		circledDot: "⨀",
		integral: "∫",
		doubleIntegral: "∬",
		tripleIntegral: "∭",
		quadrupleIntegral: "⨌",
		contourIntegral: "∮",
		surfaceIntegral: "∯",
		volumeIntegral: "∰"
	};
	var LIMITS = ["aboveBelow", "side"];
	/**
	* A large operator with limits (`m:nary`), such as ∏, ⋃ or ∮, as LaTeX's `\prod`, `\bigcup` and `\oint`, over what
	* it applies to. `MathSum` and `MathIntegral` are two of these.
	*
	* @example
	* ```typescript
	* new MathLargeOperator({
	*   operator: "product",
	*   subScript: [new MathRun("i=1")],
	*   superScript: [new MathRun("n")],
	*   children: [new MathRun("i")],
	* });
	* ```
	*/
	var MathLargeOperator = class extends docx.BuilderElement {
		constructor({ operator, children, subScript, superScript, limits }) {
			checkOneOf("MathLargeOperator", "operator", operator, Object.keys(LARGE_OPERATORS));
			if (limits !== void 0) checkOneOf("MathLargeOperator", "limits", limits, LIMITS);
			checkArgument("MathLargeOperator", "children", children);
			if (subScript !== void 0) checkArgument("MathLargeOperator", "subScript", subScript);
			if (superScript !== void 0) checkArgument("MathLargeOperator", "superScript", superScript);
			const side = limits === void 0 ? operator.endsWith("ntegral") : limits === "side";
			super({
				name: "m:nary",
				children: [
					(0, docx.createMathNAryProperties)({
						accent: LARGE_OPERATORS[operator],
						hasSubScript: subScript !== void 0,
						hasSuperScript: superScript !== void 0,
						limitLocationVal: side ? "subSup" : "undOvr"
					}),
					(0, docx.createMathSubScriptElement)({ children: subScript !== null && subScript !== void 0 ? subScript : [] }),
					(0, docx.createMathSuperScriptElement)({ children: superScript !== null && superScript !== void 0 ? superScript : [] }),
					createArgument(children)
				]
			});
		}
	};
	//#endregion
	//#region src/math/math-phantom.ts
	/**
	* Phantoms: math that takes up room without being seen, or is seen without taking up room, such as LaTeX's
	* `\phantom` and `\smash`.
	*
	* @module
	*/
	/**
	* A phantom (`m:phant`): math that takes up room without being seen, as LaTeX's `\phantom`, to leave space for it or
	* line things up with it. Or math that is seen but takes up no room, or less, as `\smash`.
	*
	* @example
	* ```typescript
	* // As much space as "x+y" takes up
	* new MathPhantom({ children: [new MathRun("x+y")] });
	*
	* // A tall fraction that doesn't push its line apart
	* new MathPhantom({ visible: true, height: false, depth: false, children: [fraction] });
	* ```
	*/
	var MathPhantom = class extends docx.BuilderElement {
		constructor({ children, visible = false, width = true, height = true, depth = true }) {
			checkArgument("MathPhantom", "children", children);
			super({
				name: "m:phant",
				children: [new docx.BuilderElement({
					name: "m:phantPr",
					children: [
						createValueElement("m:show", visible ? 1 : 0),
						...width ? [] : [createValueElement("m:zeroWid", 1)],
						...height ? [] : [createValueElement("m:zeroAsc", 1)],
						...depth ? [] : [createValueElement("m:zeroDesc", 1)]
					]
				}), createArgument(children)]
			});
		}
	};
	//#endregion
	//#region \0@oxc-project+runtime@0.150.0/helpers/esm/typeof.js
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.150.0/helpers/esm/toPrimitive.js
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
	//#region \0@oxc-project+runtime@0.150.0/helpers/esm/toPropertyKey.js
	function toPropertyKey(t) {
		var i = toPrimitive(t, "string");
		return "symbol" == _typeof(i) ? i : i + "";
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.150.0/helpers/esm/defineProperty.js
	function _defineProperty(e, r, t) {
		return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
			value: t,
			enumerable: !0,
			configurable: !0,
			writable: !0
		}) : e[r] = t, e;
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.150.0/helpers/esm/objectSpread2.js
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
	//#region src/math/latex/latex-atoms.ts
	/**
	* What the LaTeX parser reads an equation into, and how that becomes docx's math: runs of text that share a font are
	* joined, scripts go on their bases, and large operators and functions take the math after them as their argument.
	*
	* @module
	*/
	var ZERO_WIDTH_SPACE = "​";
	/**
	* The part an atom plays, which says where an operator's argument ends. A script's is its base's, so the bracket in
	* `)^2` still closes.
	*/
	var roleOf$1 = (atom) => {
		switch (atom.kind) {
			case "text": return atom.role;
			case "built":
				var _atom$role;
				return (_atom$role = atom.role) !== null && _atom$role !== void 0 ? _atom$role : "ordinary";
			case "scripts": return atom.base.length === 1 ? roleOf$1(atom.base[0]) : "ordinary";
			default: return "ordinary";
		}
	};
	/**
	* Where the argument of the operator or function before `start` ends. LaTeX doesn't say, so it goes as far as TeX's
	* spacing suggests: to a relation, a + or −, or punctuation, or to another operator or function, outside brackets.
	* So ∑ᵢ aᵢ + b takes aᵢ, ∫ f(x) dx takes f(x) dx, and sin(x + y) takes (x + y). An operator that comes first is part
	* of the argument, as in ∑ᵢ ∑ⱼ aᵢⱼ, and so is a sign, as in sin −x.
	*/
	var argumentEnd = (atoms, start) => {
		let depth = 0;
		for (let index = start; index < atoms.length; index++) {
			const atom = atoms[index];
			const role = roleOf$1(atom);
			if (depth === 0) {
				if (role === "relation" || role === "punctuation" || role === "close") return index;
				if (index > start && (role === "additive" || atom.kind === "operator" || atom.kind === "function")) return index;
			}
			if (role === "open") depth++;
			else if (role === "close") depth--;
		}
		return atoms.length;
	};
	/** An argument's math, with a zero-width space when it is empty, which LibreOffice needs to read the equation */
	var orSpace = (children) => children.length === 0 ? [new docx.MathRun(ZERO_WIDTH_SPACE)] : children;
	var isPlain = (font) => Object.values(font).every((value) => value === void 0 || value === false);
	var sameFont = (one, other) => one.style === other.style && one.script === other.script && !!one.normalText === !!other.normalText && !!one.literal === !!other.literal;
	var createRun = (text, font) => new docx.MathRun(isPlain(font) ? text : _objectSpread2({ text }, font));
	var withScripts = (base, sub, sup) => {
		const children = orSpace(base);
		if (sub !== void 0 && sup !== void 0) return new docx.MathSubSuperScript({
			children,
			subScript: orSpace(atomsToMath(sub)),
			superScript: orSpace(atomsToMath(sup))
		});
		if (sub !== void 0) return new docx.MathSubScript({
			children,
			subScript: orSpace(atomsToMath(sub))
		});
		return new docx.MathSuperScript({
			children,
			superScript: orSpace(atomsToMath(sup))
		});
	};
	var createOperator = (atom, argument) => {
		if (atom.kind === "operator") return new MathLargeOperator({
			operator: atom.operator,
			limits: atom.limits,
			subScript: atom.sub && orSpace(atomsToMath(atom.sub)),
			superScript: atom.sup && orSpace(atomsToMath(atom.sup)),
			children: argument
		});
		const name = atomsToMath(atom.name);
		const hasScripts = atom.sub !== void 0 || atom.sup !== void 0;
		const below = atom.sub === void 0 ? name : [new docx.MathLimitLower({
			children: name,
			limit: orSpace(atomsToMath(atom.sub))
		})];
		const limited = atom.sup === void 0 ? below : [new docx.MathLimitUpper({
			children: below,
			limit: orSpace(atomsToMath(atom.sup))
		})];
		const scripted = hasScripts ? [withScripts(name, atom.sub, atom.sup)] : name;
		return new docx.MathFunction({
			name: atom.limitsBelow ? limited : scripted,
			children: orSpace(argument)
		});
	};
	/**
	* Turns atoms into pieces of math. A group's pieces are among those around it, so its text can join theirs, as in
	* `a{b}c`.
	*/
	var atomsToPieces = (atoms) => {
		const pieces = [];
		for (let index = 0; index < atoms.length; index++) {
			const atom = atoms[index];
			switch (atom.kind) {
				case "text":
					pieces.push({
						kind: "text",
						text: atom.text,
						font: atom.font
					});
					break;
				case "group":
					pieces.push(...atomsToPieces(atom.atoms));
					break;
				case "built":
					pieces.push({
						kind: "component",
						component: atom.component
					});
					break;
				case "scripts":
					pieces.push({
						kind: "component",
						component: withScripts(atomsToMath(atom.base), atom.sub, atom.sup)
					});
					break;
				case "operator":
				case "function": {
					const end = argumentEnd(atoms, index + 1);
					pieces.push({
						kind: "component",
						component: createOperator(atom, atomsToMath(atoms.slice(index + 1, end)))
					});
					index = end - 1;
					break;
				}
			}
		}
		return pieces;
	};
	/**
	* Turns atoms into docx's math, with text next to text in the same font joined in one run.
	*/
	var atomsToMath = (atoms) => atomsToPieces(atoms).reduce((joined, piece) => {
		const last = joined[joined.length - 1];
		return piece.kind === "text" && (last === null || last === void 0 ? void 0 : last.kind) === "text" && sameFont(last.font, piece.font) ? [...joined.slice(0, -1), _objectSpread2(_objectSpread2({}, last), {}, { text: last.text + piece.text })] : [...joined, piece];
	}, []).map((piece) => piece.kind === "text" ? createRun(piece.text, piece.font) : piece.component);
	//#endregion
	//#region src/math/latex/latex-symbols.ts
	/**
	* Whether a table has an entry of its own for a key. Unlike `in`, it isn't fooled by the names every object has, such as
	* `\constructor`.
	*/
	var hasEntry = (table, key) => Object.prototype.hasOwnProperty.call(table, key);
	var withRole = (role, symbols) => Object.entries(symbols).map(([name, text]) => [name, {
		text,
		role
	}]);
	var GREEK = {
		alpha: "α",
		beta: "β",
		gamma: "γ",
		delta: "δ",
		epsilon: "ϵ",
		varepsilon: "ε",
		zeta: "ζ",
		eta: "η",
		theta: "θ",
		vartheta: "ϑ",
		iota: "ι",
		kappa: "κ",
		varkappa: "ϰ",
		lambda: "λ",
		mu: "μ",
		nu: "ν",
		xi: "ξ",
		omicron: "ο",
		pi: "π",
		varpi: "ϖ",
		rho: "ρ",
		varrho: "ϱ",
		sigma: "σ",
		varsigma: "ς",
		tau: "τ",
		upsilon: "υ",
		phi: "ϕ",
		varphi: "φ",
		chi: "χ",
		psi: "ψ",
		omega: "ω",
		digamma: "ϝ"
	};
	/** Capital Greek letters, which LaTeX draws upright */
	var UPRIGHT_GREEK = {
		Gamma: "Γ",
		Delta: "Δ",
		Theta: "Θ",
		Lambda: "Λ",
		Xi: "Ξ",
		Pi: "Π",
		Sigma: "Σ",
		Upsilon: "Υ",
		Phi: "Φ",
		Psi: "Ψ",
		Omega: "Ω"
	};
	/** Capital Greek letters in italic, as amsmath's `\varGamma` */
	var ITALIC_GREEK = Object.fromEntries(Object.entries(UPRIGHT_GREEK).map(([name, text]) => [`var${name}`, text]));
	var ORDINARY = _objectSpread2(_objectSpread2({}, GREEK), {}, {
		infty: "∞",
		partial: "∂",
		nabla: "∇",
		forall: "∀",
		exists: "∃",
		nexists: "∄",
		emptyset: "∅",
		varnothing: "∅",
		neg: "¬",
		lnot: "¬",
		angle: "∠",
		measuredangle: "∡",
		sphericalangle: "∢",
		triangle: "△",
		hbar: "ℏ",
		hslash: "ℏ",
		ell: "ℓ",
		wp: "℘",
		Re: "ℜ",
		Im: "ℑ",
		aleph: "ℵ",
		beth: "ℶ",
		gimel: "ℷ",
		daleth: "ℸ",
		imath: "ı",
		jmath: "ȷ",
		prime: "′",
		backprime: "‵",
		top: "⊤",
		bot: "⊥",
		ldots: "…",
		dots: "…",
		dotsc: "…",
		dotso: "…",
		cdots: "⋯",
		dotsb: "⋯",
		dotsm: "⋯",
		dotsi: "⋯",
		vdots: "⋮",
		ddots: "⋱",
		iddots: "⋰",
		square: "□",
		Box: "□",
		blacksquare: "■",
		Diamond: "◇",
		lozenge: "◊",
		blacklozenge: "⧫",
		clubsuit: "♣",
		diamondsuit: "♢",
		heartsuit: "♡",
		spadesuit: "♠",
		flat: "♭",
		natural: "♮",
		sharp: "♯",
		surd: "√",
		mho: "℧",
		complement: "∁",
		dag: "†",
		ddag: "‡",
		S: "§",
		P: "¶",
		copyright: "©",
		pounds: "£",
		euro: "€",
		yen: "¥",
		degree: "°",
		bigstar: "★",
		checkmark: "✓",
		maltese: "✠",
		backslash: "\\",
		Vert: "‖",
		vert: "|"
	});
	var BINARY = {
		times: "×",
		div: "÷",
		cdot: "⋅",
		centerdot: "⋅",
		ast: "∗",
		star: "⋆",
		circ: "∘",
		bullet: "∙",
		oplus: "⊕",
		ominus: "⊖",
		otimes: "⊗",
		oslash: "⊘",
		odot: "⊙",
		circledast: "⊛",
		circledcirc: "⊚",
		boxplus: "⊞",
		boxminus: "⊟",
		boxtimes: "⊠",
		boxdot: "⊡",
		cup: "∪",
		cap: "∩",
		sqcup: "⊔",
		sqcap: "⊓",
		uplus: "⊎",
		vee: "∨",
		lor: "∨",
		wedge: "∧",
		land: "∧",
		setminus: "∖",
		smallsetminus: "∖",
		wr: "≀",
		amalg: "⨿",
		diamond: "⋄",
		triangleleft: "◁",
		triangleright: "▷",
		bigtriangleup: "△",
		bigtriangledown: "▽",
		lhd: "⊲",
		rhd: "⊳",
		unlhd: "⊴",
		unrhd: "⊵",
		ltimes: "⋉",
		rtimes: "⋊",
		dotplus: "∔",
		Cup: "⋓",
		Cap: "⋒",
		intercal: "⊺",
		barwedge: "⌅",
		veebar: "⊻",
		divideontimes: "⋇",
		leftthreetimes: "⋋",
		rightthreetimes: "⋌",
		curlyvee: "⋎",
		curlywedge: "⋏",
		bigcirc: "◯",
		dagger: "†",
		ddagger: "‡"
	};
	var ADDITIVE = {
		pm: "±",
		mp: "∓"
	};
	var RELATION = {
		le: "≤",
		leq: "≤",
		ge: "≥",
		geq: "≥",
		leqslant: "⩽",
		geqslant: "⩾",
		leqq: "≦",
		geqq: "≧",
		ne: "≠",
		neq: "≠",
		equiv: "≡",
		approx: "≈",
		approxeq: "≊",
		sim: "∼",
		simeq: "≃",
		backsim: "∽",
		cong: "≅",
		propto: "∝",
		varpropto: "∝",
		in: "∈",
		notin: "∉",
		ni: "∋",
		owns: "∋",
		subset: "⊂",
		subseteq: "⊆",
		supset: "⊃",
		supseteq: "⊇",
		subsetneq: "⊊",
		supsetneq: "⊋",
		subseteqq: "⫅",
		supseteqq: "⫆",
		nsubseteq: "⊈",
		nsupseteq: "⊉",
		sqsubset: "⊏",
		sqsupset: "⊐",
		sqsubseteq: "⊑",
		sqsupseteq: "⊒",
		mid: "∣",
		nmid: "∤",
		shortmid: "∣",
		parallel: "∥",
		nparallel: "∦",
		shortparallel: "∥",
		perp: "⊥",
		models: "⊨",
		vdash: "⊢",
		dashv: "⊣",
		vDash: "⊨",
		Vdash: "⊩",
		ll: "≪",
		gg: "≫",
		lll: "⋘",
		ggg: "⋙",
		prec: "≺",
		succ: "≻",
		preceq: "⪯",
		succeq: "⪰",
		doteq: "≐",
		asymp: "≍",
		bowtie: "⋈",
		Join: "⨝",
		smile: "⌣",
		frown: "⌢",
		coloneqq: "≔",
		coloneq: "≔",
		eqqcolon: "≕",
		triangleq: "≜",
		lesssim: "≲",
		gtrsim: "≳",
		lessgtr: "≶",
		gtrless: "≷",
		nless: "≮",
		ngtr: "≯",
		nleq: "≰",
		ngeq: "≱",
		nsim: "≁",
		ncong: "≇",
		lneq: "⪇",
		gneq: "⪈",
		lneqq: "≨",
		gneqq: "≩",
		therefore: "∴",
		because: "∵",
		circeq: "≗",
		bumpeq: "≏",
		Bumpeq: "≎",
		risingdotseq: "≓",
		fallingdotseq: "≒",
		vartriangleleft: "⊲",
		vartriangleright: "⊳",
		trianglelefteq: "⊴",
		trianglerighteq: "⊵",
		between: "≬",
		pitchfork: "⋔",
		colon: ":",
		to: "→",
		rightarrow: "→",
		leftarrow: "←",
		gets: "←",
		leftrightarrow: "↔",
		Rightarrow: "⇒",
		Leftarrow: "⇐",
		Leftrightarrow: "⇔",
		implies: "⟹",
		impliedby: "⟸",
		iff: "⟺",
		longrightarrow: "⟶",
		longleftarrow: "⟵",
		longleftrightarrow: "⟷",
		Longrightarrow: "⟹",
		Longleftarrow: "⟸",
		Longleftrightarrow: "⟺",
		mapsto: "↦",
		longmapsto: "⟼",
		hookrightarrow: "↪",
		hookleftarrow: "↩",
		uparrow: "↑",
		downarrow: "↓",
		updownarrow: "↕",
		Uparrow: "⇑",
		Downarrow: "⇓",
		Updownarrow: "⇕",
		nearrow: "↗",
		searrow: "↘",
		swarrow: "↙",
		nwarrow: "↖",
		rightharpoonup: "⇀",
		rightharpoondown: "⇁",
		leftharpoonup: "↼",
		leftharpoondown: "↽",
		rightleftharpoons: "⇌",
		leftrightharpoons: "⇋",
		upharpoonright: "↾",
		upharpoonleft: "↿",
		downharpoonright: "⇂",
		downharpoonleft: "⇃",
		twoheadrightarrow: "↠",
		twoheadleftarrow: "↞",
		rightarrowtail: "↣",
		leftarrowtail: "↢",
		leadsto: "⇝",
		rightsquigarrow: "⇝",
		leftrightsquigarrow: "↭",
		curvearrowright: "↷",
		curvearrowleft: "↶",
		circlearrowright: "↻",
		circlearrowleft: "↺",
		rightrightarrows: "⇉",
		leftleftarrows: "⇇",
		rightleftarrows: "⇄",
		leftrightarrows: "⇆",
		Rrightarrow: "⇛",
		Lleftarrow: "⇚",
		nrightarrow: "↛",
		nleftarrow: "↚",
		nRightarrow: "⇏",
		nLeftarrow: "⇍",
		nleftrightarrow: "↮",
		nLeftrightarrow: "⇎",
		looparrowright: "↬",
		looparrowleft: "↫",
		multimap: "⊸"
	};
	/** Brackets, which `\left`, `\right`, `\middle` and `\big` take too */
	var OPENING = {
		langle: "⟨",
		lceil: "⌈",
		lfloor: "⌊",
		lvert: "|",
		lVert: "‖",
		lbrace: "{",
		lbrack: "[",
		ulcorner: "⌜",
		llcorner: "⌞",
		lgroup: "⟮",
		lmoustache: "⎰",
		llbracket: "⟦"
	};
	var CLOSING = {
		rangle: "⟩",
		rceil: "⌉",
		rfloor: "⌋",
		rvert: "|",
		rVert: "‖",
		rbrace: "}",
		rbrack: "]",
		urcorner: "⌝",
		lrcorner: "⌟",
		rgroup: "⟯",
		rmoustache: "⎱",
		rrbracket: "⟧"
	};
	var ESCAPED_ORDINARY = Object.fromEntries([
		["%", "%"],
		["$", "$"],
		["_", "_"],
		["|", "‖"]
	]);
	/** The symbols LaTeX writes with a command, by the command's name without its backslash */
	var SYMBOLS = new Map([
		...withRole("ordinary", _objectSpread2(_objectSpread2({}, ORDINARY), ESCAPED_ORDINARY)),
		...withRole("binary", BINARY),
		...withRole("additive", ADDITIVE),
		...withRole("relation", RELATION),
		...withRole("open", _objectSpread2(_objectSpread2({}, OPENING), Object.fromEntries([["{", "{"]]))),
		...withRole("close", _objectSpread2(_objectSpread2({}, CLOSING), Object.fromEntries([["}", "}"]])))
	]);
	/** Characters typed as they are, which Word writes as another character or which play a part */
	var CHARACTERS = /* @__PURE__ */ new Map([
		["+", {
			text: "+",
			role: "additive"
		}],
		["-", {
			text: "−",
			role: "additive"
		}],
		["*", {
			text: "∗",
			role: "binary"
		}],
		["=", {
			text: "=",
			role: "relation"
		}],
		["<", {
			text: "<",
			role: "relation"
		}],
		[">", {
			text: ">",
			role: "relation"
		}],
		[":", {
			text: ":",
			role: "relation"
		}],
		[",", {
			text: ",",
			role: "punctuation"
		}],
		[";", {
			text: ";",
			role: "punctuation"
		}],
		["(", {
			text: "(",
			role: "open"
		}],
		["[", {
			text: "[",
			role: "open"
		}],
		[")", {
			text: ")",
			role: "close"
		}],
		["]", {
			text: "]",
			role: "close"
		}]
	]);
	var ROLES_OF_CHARACTERS = new Map([...SYMBOLS.values(), ...CHARACTERS.values()].filter(({ text, role }) => role !== "ordinary" && text !== "|" && text !== "‖").map(({ text, role }) => [text, role]));
	/** The part a character plays, whether it was typed as it is or written with a command */
	var roleOf = (character) => {
		var _ROLES_OF_CHARACTERS$;
		return (_ROLES_OF_CHARACTERS$ = ROLES_OF_CHARACTERS.get(character)) !== null && _ROLES_OF_CHARACTERS$ !== void 0 ? _ROLES_OF_CHARACTERS$ : "ordinary";
	};
	/** The delimiters typed as they are, which `\left`, `\right`, `\middle` and `\big` take. A dot is none */
	var DELIMITER_CHARACTERS = /* @__PURE__ */ new Map([
		["(", "("],
		[")", ")"],
		["[", "["],
		["]", "]"],
		["|", "|"],
		["/", "/"],
		["<", "⟨"],
		[">", "⟩"],
		[".", ""]
	]);
	/** The delimiters `\left`, `\right`, `\middle` and `\big` take, by their command's name */
	var DELIMITER_COMMANDS = new Map([
		...Object.entries(OPENING),
		...Object.entries(CLOSING),
		["{", "{"],
		["}", "}"],
		["|", "‖"],
		...Object.entries({
			vert: "|",
			Vert: "‖",
			backslash: "\\",
			uparrow: "↑",
			downarrow: "↓",
			updownarrow: "↕",
			Uparrow: "⇑",
			Downarrow: "⇓",
			Updownarrow: "⇕"
		})
	]);
	/** Relations with a line through them, for `\not`: the character Unicode has for each */
	var NEGATIONS = /* @__PURE__ */ new Map([
		["=", "≠"],
		["<", "≮"],
		[">", "≯"],
		["≤", "≰"],
		["≥", "≱"],
		["≡", "≢"],
		["∼", "≁"],
		["≃", "≄"],
		["≈", "≉"],
		["≅", "≇"],
		["∈", "∉"],
		["∋", "∌"],
		["⊂", "⊄"],
		["⊃", "⊅"],
		["⊆", "⊈"],
		["⊇", "⊉"],
		["∣", "∤"],
		["∥", "∦"],
		["≺", "⊀"],
		["≻", "⊁"],
		["⊢", "⊬"],
		["⊨", "⊭"],
		["∃", "∄"],
		["→", "↛"],
		["←", "↚"],
		["↔", "↮"],
		["⇒", "⇏"],
		["⇐", "⇍"],
		["⇔", "⇎"]
	]);
	/** Spaces, by their command's name */
	var SPACES = /* @__PURE__ */ new Map([
		[",", " "],
		["thinspace", " "],
		[":", " "],
		[">", " "],
		["medspace", " "],
		[";", " "],
		["thickspace", " "],
		[" ", " "],
		["space", " "],
		["enspace", " "],
		["quad", " "],
		["qquad", "  "],
		["!", ""],
		["negthinspace", ""],
		["negmedspace", ""],
		["negthickspace", ""]
	]);
	/** Functions, which LaTeX writes upright with a thin space after them */
	var FUNCTIONS = {
		arccos: "arccos",
		arcsin: "arcsin",
		arctan: "arctan",
		arg: "arg",
		cos: "cos",
		cosh: "cosh",
		cot: "cot",
		coth: "coth",
		csc: "csc",
		deg: "deg",
		dim: "dim",
		exp: "exp",
		hom: "hom",
		ker: "ker",
		lg: "lg",
		ln: "ln",
		log: "log",
		sec: "sec",
		sin: "sin",
		sinh: "sinh",
		tan: "tan",
		tanh: "tanh"
	};
	/** Functions whose limits go below them in a display, such as lim with x → 0 below it */
	var FUNCTIONS_WITH_LIMITS = {
		det: "det",
		gcd: "gcd",
		inf: "inf",
		lim: "lim",
		liminf: "lim inf",
		limsup: "lim sup",
		max: "max",
		min: "min",
		Pr: "Pr",
		sup: "sup"
	};
	/** Large operators, by their command's name */
	var LARGE_OPERATOR_COMMANDS = {
		sum: "sum",
		prod: "product",
		coprod: "coproduct",
		bigcup: "union",
		bigcap: "intersection",
		bigsqcup: "squareUnion",
		biguplus: "multisetUnion",
		bigvee: "logicalOr",
		bigwedge: "logicalAnd",
		bigoplus: "directSum",
		bigotimes: "tensorProduct",
		bigodot: "circledDot",
		int: "integral",
		iint: "doubleIntegral",
		iiint: "tripleIntegral",
		iiiint: "quadrupleIntegral",
		oint: "contourIntegral",
		oiint: "surfaceIntegral",
		oiiint: "volumeIntegral"
	};
	/** Accents, by their command's name */
	var ACCENT_COMMANDS = {
		hat: "hat",
		widehat: "hat",
		check: "check",
		widecheck: "check",
		tilde: "tilde",
		widetilde: "tilde",
		acute: "acute",
		grave: "grave",
		dot: "dot",
		ddot: "doubleDot",
		dddot: "tripleDot",
		breve: "breve",
		bar: "bar",
		mathring: "ring",
		vec: "rightArrow",
		overrightarrow: "rightArrow",
		overleftarrow: "leftArrow",
		overleftrightarrow: "leftRightArrow",
		overrightharpoon: "rightHarpoon",
		overleftharpoon: "leftHarpoon"
	};
	/** Braces over and under math, by their command's name */
	var BRACE_COMMANDS = {
		overbrace: {
			brace: "curly",
			position: "above"
		},
		underbrace: {
			brace: "curly",
			position: "below"
		},
		overbracket: {
			brace: "square",
			position: "above"
		},
		underbracket: {
			brace: "square",
			position: "below"
		},
		overparen: {
			brace: "round",
			position: "above"
		},
		underparen: {
			brace: "round",
			position: "below"
		}
	};
	/** Arrows that stretch to fit text above and below them, by their command's name */
	var EXTENSIBLE_ARROWS = {
		xrightarrow: "→",
		xleftarrow: "←",
		xleftrightarrow: "↔",
		xRightarrow: "⇒",
		xLeftarrow: "⇐",
		xLeftrightarrow: "⇔",
		xmapsto: "↦",
		xhookrightarrow: "↪",
		xhookleftarrow: "↩",
		xrightharpoonup: "⇀",
		xrightleftharpoons: "⇌"
	};
	//#endregion
	//#region src/math/latex/latex-parser.ts
	/**
	* Reads LaTeX math into atoms: rows of cells, as a matrix or aligned equations have them, or one row of one cell.
	*
	* @module
	*/
	/** The commands that end a list of atoms, for what comes before it to take */
	var LIST_ENDS = /* @__PURE__ */ new Set([
		"right",
		"middle",
		"end",
		"\\"
	]);
	var TEXT_COMMANDS = /* @__PURE__ */ new Set([
		"text",
		"textrm",
		"textnormal",
		"textup",
		"textmd",
		"textbf",
		"textit",
		"textsl",
		"textsf",
		"texttt",
		"emph",
		"mbox",
		"hbox"
	]);
	var plainOrBold = (font) => font.style === "bold" || font.style === "boldItalic" ? "bold" : "plain";
	/** Commands that write their argument in a font, and what each does to the font around it */
	var FONT_COMMANDS = {
		mathrm: () => ({ style: "plain" }),
		mathup: () => ({ style: "plain" }),
		mathnormal: () => ({}),
		mathit: () => ({ style: "italic" }),
		mathbf: (font) => ({
			script: font.script,
			style: "bold"
		}),
		bold: (font) => ({
			script: font.script,
			style: "bold"
		}),
		boldsymbol: (font) => ({
			script: font.script,
			style: "boldItalic"
		}),
		bm: (font) => ({
			script: font.script,
			style: "boldItalic"
		}),
		pmb: (font) => ({
			script: font.script,
			style: "boldItalic"
		}),
		mathbb: (font) => ({
			script: "doubleStruck",
			style: plainOrBold(font)
		}),
		Bbb: (font) => ({
			script: "doubleStruck",
			style: plainOrBold(font)
		}),
		mathcal: (font) => ({
			script: "script",
			style: plainOrBold(font)
		}),
		mathscr: (font) => ({
			script: "script",
			style: plainOrBold(font)
		}),
		mathfrak: (font) => ({
			script: "fraktur",
			style: plainOrBold(font)
		}),
		mathsf: (font) => ({
			script: "sansSerif",
			style: plainOrBold(font)
		}),
		mathtt: (font) => ({
			script: "monospace",
			style: plainOrBold(font)
		})
	};
	/** The old commands that change the font for the rest of their group, such as `{\bf x}` */
	var FONT_SWITCHES = {
		rm: "mathrm",
		bf: "mathbf",
		it: "mathit",
		sf: "mathsf",
		tt: "mathtt",
		cal: "mathcal"
	};
	/** Commands written between a numerator and a denominator, such as `{a \over b}` */
	var INFIX_FRACTIONS = {
		over: {},
		atop: { type: "noBar" },
		choose: {
			type: "noBar",
			brackets: ["(", ")"]
		},
		brace: {
			type: "noBar",
			brackets: ["{", "}"]
		},
		brack: {
			type: "noBar",
			brackets: ["[", "]"]
		}
	};
	/** Commands that are nothing to Word: sizes, spacing it works out itself, and labels */
	var IGNORED = /* @__PURE__ */ new Set([
		"displaystyle",
		"textstyle",
		"scriptstyle",
		"scriptscriptstyle",
		"nonumber",
		"notag",
		"limits",
		"nolimits",
		"allowbreak",
		"nobreak",
		"hline",
		"hdashline",
		"/"
	]);
	/** Commands that are nothing to Word and take an argument, which is left out */
	var IGNORED_WITH_ARGUMENT = /* @__PURE__ */ new Set([
		"label",
		"cline",
		"color"
	]);
	var MATRIX_BRACKETS = {
		matrix: "none",
		smallmatrix: "none",
		pmatrix: "round",
		bmatrix: "square",
		Bmatrix: "curly",
		vmatrix: "verticalBars",
		Vmatrix: "doubleVerticalBars"
	};
	var ALIGNED_ENVIRONMENTS = /* @__PURE__ */ new Set([
		"align",
		"aligned",
		"alignat",
		"alignedat",
		"flalign",
		"eqnarray",
		"split",
		"gather",
		"gathered",
		"multline"
	]);
	/** Environments that hold one equation, and are only numbered with `\tag` */
	var EQUATION_ENVIRONMENTS = /* @__PURE__ */ new Set([
		"equation",
		"displaymath",
		"math"
	]);
	var COLUMN_ALIGNMENTS = {
		l: "left",
		c: "center",
		r: "right"
	};
	var PRIMES = [
		"′",
		"″",
		"‴",
		"⁗"
	];
	/** What LaTeX writes for some characters typed next to each other in text, such as an en dash for -- */
	var LIGATURES = [
		["---", "—"],
		["--", "–"],
		["``", "“"],
		["''", "”"],
		["`", "‘"],
		["'", "’"],
		["~", "\xA0"]
	];
	/**
	* Math of rows: aligned equations, each row's cells as the parts lined up at their `&`s, with its number.
	*/
	var equationArrayOf = (rows) => new MathEquationArray({ rows: rows.map(({ cells, tag }) => ({
		parts: cells.map(atomsToMath),
		equationNumber: tag
	})) });
	/**
	* Reads the LaTeX from `from` to `to` in `source` into rows of cells.
	*
	* @throws If the LaTeX has a command, an environment or a character it doesn't know, or isn't well formed
	*/
	var parseLatex = (source, from, to) => {
		let index = from;
		const fail = (problem, at = index) => {
			const start = Math.max(from, at - 30);
			const end = Math.min(to, at + 30);
			const excerpt = `${start > from ? "…" : ""}${source.slice(start, end)}${end < to ? "…" : ""}`;
			throw new Error(`latexToMath: ${problem}, at character ${at + 1} of "${excerpt}"`);
		};
		const skipSpace = () => {
			while (index < to) if (source[index] === "%") while (index < to && source[index] !== "\n") index++;
			else if (/\s/.test(source[index])) index++;
			else return;
		};
		const tokenAt = (at) => {
			if (at >= to) return;
			if (source[at] === "\\") {
				if (at + 1 >= to) return fail("a backslash ends the LaTeX, with no command after it", at);
				const letters = /^[a-zA-Z]+/.exec(source.slice(at + 1, to));
				if (letters) return {
					token: {
						type: "command",
						name: letters[0],
						start: at
					},
					next: at + 1 + letters[0].length
				};
				const escaped = String.fromCodePoint(source.codePointAt(at + 1));
				return {
					token: {
						type: "command",
						name: /\s/.test(escaped) ? " " : escaped,
						start: at
					},
					next: at + 1 + escaped.length
				};
			}
			const character = String.fromCodePoint(source.codePointAt(at));
			return {
				token: {
					type: "character",
					value: character,
					start: at
				},
				next: at + character.length
			};
		};
		const peek = () => {
			var _tokenAt;
			skipSpace();
			return (_tokenAt = tokenAt(index)) === null || _tokenAt === void 0 ? void 0 : _tokenAt.token;
		};
		const next = () => {
			skipSpace();
			const read = tokenAt(index);
			if (read !== void 0) index = read.next;
			return read === null || read === void 0 ? void 0 : read.token;
		};
		const isCharacter = (token, value) => (token === null || token === void 0 ? void 0 : token.type) === "character" && token.value === value;
		const isCommand = (token, name) => (token === null || token === void 0 ? void 0 : token.type) === "command" && token.name === name;
		/** Reads a star after a command, as in `\operatorname*` */
		const readStar = () => {
			if (isCharacter(peek(), "*")) {
				next();
				return true;
			}
			return false;
		};
		/** Reads what is between braces as it is, such as an environment's name */
		const readRawGroup = (what) => {
			skipSpace();
			if (source[index] !== "{") return fail(`${what} needs an argument in braces`);
			const start = index;
			let depth = 0;
			for (; index < to; index++) if (source[index] === "\\") index++;
			else if (source[index] === "{") depth++;
			else if (source[index] === "}" && --depth === 0) {
				index++;
				return source.slice(start + 1, index - 1).trim();
			}
			return fail(`${what}'s argument has no closing }`, start);
		};
		/** Reads what is between square brackets as it is, such as `\smash[t]`'s option, if there are any */
		const readRawOption = () => {
			skipSpace();
			if (source[index] !== "[") return;
			const end = source.indexOf("]", index);
			if (end === -1 || end >= to) return fail("a [ has no closing ]");
			const option = source.slice(index + 1, end).trim();
			index = end + 1;
			return option;
		};
		const text = (value, font, role = "ordinary") => ({
			kind: "text",
			text: value,
			font,
			role
		});
		const isPlainFont = (font) => font.style === void 0 && font.script === void 0 && !font.normalText;
		/** Says what is wrong with a token that ends a list where it can't */
		const unexpected = (token) => {
			if (isCharacter(token, "&") || isCommand(token, "\\")) return fail(`${token.type === "command" ? "a \\\\" : "an &"} can only go between the rows and cells of a matrix or of aligned equations, not inside braces, brackets or \\left and \\right`, token.start);
			if (isCharacter(token, "}")) return fail("a } has no { before it", token.start);
			return token.type === "command" && token.name !== "end" ? fail(`\\${token.name} has no \\left before it`, token.start) : fail("\\end has no \\begin before it", token.start);
		};
		/** Reads the closing character of what a list is in, or says what is wrong */
		const readClosing = (end, closing, what, at) => {
			if (isCharacter(end, closing)) {
				next();
				return;
			}
			if (end === void 0) fail(`${what} has no closing ${closing}`, at);
			unexpected(end);
		};
		/**
		* Reads atoms up to the end of their list: a closing brace, a `&` or `\\`, `\right`, `\middle` or `\end`, the
		* closing character given, or the end of the LaTeX. The token at the end isn't read.
		*/
		const parseList = (outer, closing) => {
			let atoms = [];
			let font = outer;
			let infix;
			for (let token = peek(); token !== void 0; token = peek()) {
				if (token.type === "character" && (token.value === "}" || token.value === "&" || token.value === closing)) break;
				if (token.type === "command" && LIST_ENDS.has(token.name)) break;
				if (token.type === "command" && hasEntry(FONT_SWITCHES, token.name)) {
					next();
					font = FONT_COMMANDS[FONT_SWITCHES[token.name]](font);
					continue;
				}
				if (token.type === "command" && hasEntry(INFIX_FRACTIONS, token.name)) {
					next();
					if (infix !== void 0) fail(`\\${token.name} follows \\${infix.name} in the same group. Put one of them in braces`, token.start);
					infix = {
						name: token.name,
						numerator: atoms
					};
					atoms = [];
					continue;
				}
				atoms = [...atoms, ...parseAtom(font)];
			}
			if (infix === void 0) return {
				atoms,
				end: peek()
			};
			const { type, brackets } = INFIX_FRACTIONS[infix.name];
			const fraction = new docx.MathFraction({
				numerator: orSpace(atomsToMath(infix.numerator)),
				denominator: orSpace(atomsToMath(atoms)),
				type
			});
			return {
				atoms: [{
					kind: "built",
					component: brackets ? new MathBrackets({
						open: brackets[0],
						close: brackets[1],
						children: [fraction]
					}) : fraction
				}],
				end: peek()
			};
		};
		/**
		* Reads a command's argument: a group in braces, or one token, such as the 1 and 2 of `\frac12`.
		*/
		const readArgument = (font, what) => {
			const token = peek();
			if (token === void 0 || token.type === "character" && [
				"}",
				"&",
				"^",
				"_"
			].includes(token.value) || token.type === "command" && LIST_ENDS.has(token.name)) {
				var _token$start;
				return fail(`${what} needs an argument`, (_token$start = token === null || token === void 0 ? void 0 : token.start) !== null && _token$start !== void 0 ? _token$start : index);
			}
			if (isCharacter(token, "{")) {
				next();
				const { atoms, end } = parseList(font);
				readClosing(end, "}", `${what}'s argument`, token.start);
				return atoms;
			}
			const atom = parsePrimary(font, false);
			return atom === void 0 ? [] : [atom];
		};
		/** Reads an argument in square brackets, as `\sqrt[3]{x}` has, if there is one */
		const readOptionalArgument = (font, what) => {
			skipSpace();
			if (source[index] !== "[") return;
			const start = index;
			index++;
			const { atoms, end } = parseList(font, "]");
			readClosing(end, "]", `${what}'s option`, start);
			return atoms;
		};
		const readMath = (font, what) => atomsToMath(readArgument(font, what));
		/** Reads an atom, and the subscripts, superscripts and primes after it */
		const parseAtom = (font) => {
			var _PRIMES, _sup;
			const base = parsePrimary(font, true);
			if (base === void 0) return [];
			let sub;
			let sup;
			let primes = 0;
			for (let token = peek(); (token === null || token === void 0 ? void 0 : token.type) === "character"; token = peek()) if (token.value === "'") {
				if (sup !== void 0) fail("a prime follows a superscript. Put the prime first, as in f'^2", token.start);
				next();
				primes++;
			} else if (token.value === "^") {
				if (sup !== void 0) fail("there are two superscripts in a row. Put them in braces, as in x^{ab}", token.start);
				next();
				sup = readArgument(font, "^");
			} else if (token.value === "_") {
				if (sub !== void 0) fail("there are two subscripts in a row. Put them in braces, as in x_{ab}", token.start);
				next();
				sub = readArgument(font, "_");
			} else break;
			const superscript = primes === 0 ? sup : [text((_PRIMES = PRIMES[primes - 1]) !== null && _PRIMES !== void 0 ? _PRIMES : "′".repeat(primes), font), ...(_sup = sup) !== null && _sup !== void 0 ? _sup : []];
			if (sub === void 0 && superscript === void 0) return [base];
			if (base.kind === "operator" || base.kind === "function") return [_objectSpread2(_objectSpread2({}, base), {}, {
				sub,
				sup: superscript
			})];
			return [{
				kind: "scripts",
				base: base.kind === "group" ? base.atoms : [base],
				sub,
				sup: superscript
			}];
		};
		/**
		* Reads one atom, without its scripts, or nothing for a command that writes nothing. Digits are read as one number
		* when `numbers` is true, but not in an argument of one token, as the 1 and 2 of `\frac12`.
		*/
		const parsePrimary = (font, numbers) => {
			const token = next();
			if (token.type === "command") return parseCommand(token, font);
			const { value } = token;
			switch (value) {
				case "{": {
					const { atoms, end } = parseList(font);
					readClosing(end, "}", "a {", token.start);
					return {
						kind: "group",
						atoms
					};
				}
				case "^":
				case "_":
				case "'":
					index = token.start;
					return {
						kind: "group",
						atoms: []
					};
				case "~": return text("\xA0", font);
				case "$": return fail("a $ can only end math that is in \\text", token.start);
			}
			if (numbers && /\d/.test(value)) {
				const [digits] = /^\d*(?:\.\d+)*/.exec(source.slice(index, to));
				index += digits.length;
				return text(value + digits, font);
			}
			const character = CHARACTERS.get(value);
			return character === void 0 ? text(value, font, roleOf(value)) : text(character.text, font, character.role);
		};
		/** Reads `\limits` or `\nolimits` after a large operator or function, if there is one */
		const readLimits = () => {
			const token = peek();
			if (isCommand(token, "limits")) {
				next();
				return "aboveBelow";
			}
			if (isCommand(token, "nolimits")) {
				next();
				return "side";
			}
		};
		const functionAtom = (name, limitsBelow) => {
			const limits = readLimits();
			return {
				kind: "function",
				name,
				limitsBelow: limits === void 0 ? limitsBelow : limits === "aboveBelow"
			};
		};
		/** Reads a delimiter, for `\left`, `\right`, `\middle` and `\big` */
		const readDelimiter = (what) => {
			var _DELIMITER_CHARACTERS;
			const token = next();
			if (token === void 0) return fail(`${what} needs a delimiter after it, such as ( or \\langle`);
			if (token.type === "command") {
				var _DELIMITER_COMMANDS$g;
				return (_DELIMITER_COMMANDS$g = DELIMITER_COMMANDS.get(token.name)) !== null && _DELIMITER_COMMANDS$g !== void 0 ? _DELIMITER_COMMANDS$g : fail(`${what} can't take \\${token.name}, which isn't a delimiter`, token.start);
			}
			const role = roleOf(token.value);
			return (_DELIMITER_CHARACTERS = DELIMITER_CHARACTERS.get(token.value)) !== null && _DELIMITER_CHARACTERS !== void 0 ? _DELIMITER_CHARACTERS : role === "open" || role === "close" ? token.value : fail(`${what} can't take "${token.value}", which isn't a delimiter`, token.start);
		};
		const parseLeftRight = (font, start) => {
			const open = readDelimiter("\\left");
			let items = [];
			let separators = [];
			for (;;) {
				const { atoms, end } = parseList(font);
				items = [...items, atoms];
				if (isCommand(end, "middle")) {
					next();
					separators = [...separators, readDelimiter("\\middle")];
				} else if (isCommand(end, "right")) {
					next();
					break;
				} else if (end === void 0) return fail("\\left has no \\right", start);
				else unexpected(end);
			}
			const close = readDelimiter("\\right");
			const converted = items.map(atomsToMath);
			if (converted.length === 1) return {
				kind: "built",
				component: new MathBrackets({
					open,
					close,
					children: converted[0]
				})
			};
			if (separators.every((separator) => separator === separators[0])) return {
				kind: "built",
				component: new MathBrackets({
					open,
					close,
					separator: separators[0],
					items: converted
				})
			};
			return {
				kind: "built",
				component: new MathBrackets({
					open,
					close,
					children: converted.flatMap((item, itemIndex) => itemIndex === 0 ? item : [new docx.MathRun(separators[itemIndex - 1]), ...item])
				})
			};
		};
		/** Reads `\text` and its like: normal text, which can hold math between dollar signs */
		const parseText = (what) => {
			const font = { normalText: true };
			skipSpace();
			if (source[index] !== "{") {
				const token = next();
				return (token === null || token === void 0 ? void 0 : token.type) === "character" ? [text(token.value, font)] : fail(`${what} needs an argument`);
			}
			const start = index;
			index++;
			let atoms = [];
			let written = "";
			let depth = 0;
			const flush = () => {
				if (written !== "") {
					atoms = [...atoms, text(written, font)];
					written = "";
				}
			};
			for (;;) {
				if (index >= to) return fail(`${what}'s argument has no closing }`, start);
				const character = source[index];
				if (character === "}") {
					index++;
					if (depth === 0) break;
					depth--;
				} else if (character === "{") {
					index++;
					depth++;
				} else if (character === "$") {
					flush();
					index++;
					const { atoms: math, end } = parseList({}, "$");
					readClosing(end, "$", "math in text", index);
					atoms = [...atoms, ...math];
				} else if (character === "\\") {
					const { token, next: after } = tokenAt(index);
					const { name } = token;
					index = after;
					if (/^[a-zA-Z]+$/.test(name)) while (index < to && /[ \t]/.test(source[index])) index++;
					if (TEXT_COMMANDS.has(name)) {
						flush();
						atoms = [...atoms, ...parseText(`\\${name}`)];
					} else if (SPACES.has(name)) written += name === " " ? " " : SPACES.get(name);
					else if ([
						"&",
						"%",
						"$",
						"#",
						"_",
						"{",
						"}"
					].includes(name)) written += name;
					else if (name === "textbackslash") written += "\\";
					else if (name === "ldots" || name === "dots" || name === "textellipsis") written += "…";
					else fail(`unknown command \\${name} in text`, token.start);
				} else if (/\s/.test(character)) {
					written += written.endsWith(" ") ? "" : " ";
					index++;
				} else {
					const at = index;
					const ligature = LIGATURES.find(([characters]) => source.startsWith(characters, at));
					const typed = ligature ? ligature[0] : String.fromCodePoint(source.codePointAt(index));
					written += ligature ? ligature[1] : typed;
					index += typed.length;
				}
			}
			flush();
			return atoms;
		};
		/** Reads the rows and cells of an environment, or of the whole LaTeX when `environment` is undefined */
		const parseRows = (font, environment, begin) => {
			let rows = [];
			let cells = [];
			const endRow = () => {
				const tags = cells.flatMap((cell) => cell.filter((atom) => atom.kind === "tag"));
				const row = { cells: cells.map((cell) => cell.filter((atom) => atom.kind !== "tag")) };
				rows = [...rows, tags.length === 0 ? row : _objectSpread2(_objectSpread2({}, row), {}, { tag: tags[tags.length - 1].text })];
				cells = [];
			};
			for (;;) {
				const { atoms, end } = parseList(font);
				cells = [...cells, atoms];
				if (isCharacter(end, "&")) next();
				else if (isCommand(end, "\\")) {
					next();
					readRawOption();
					endRow();
				} else {
					endRow();
					if (environment === void 0) {
						if (end !== void 0) unexpected(end);
					} else if (isCommand(end, "end")) {
						next();
						const name = readRawGroup("\\end");
						if (name !== environment) fail(`\\begin{${environment}} ends with \\end{${name}}`, end.start);
					} else if (end === void 0) fail(`\\begin{${environment}} has no \\end{${environment}}`, begin);
					else unexpected(end);
					break;
				}
			}
			const last = rows[rows.length - 1];
			return rows.length > 1 && last.tag === void 0 && last.cells.length === 1 && last.cells[0].length === 0 ? rows.slice(0, -1) : rows;
		};
		const parseEnvironment = (font, start) => {
			const name = readRawGroup("\\begin");
			const base = name.replace(/\*$/, "");
			const cellsOf = (rows) => rows.map(({ cells }) => cells.map(atomsToMath));
			if (hasEntry(MATRIX_BRACKETS, base)) {
				const alignment = name.endsWith("*") ? readRawOption() : void 0;
				const rows = parseRows(font, name, start);
				return {
					kind: "built",
					component: new MathMatrix({
						brackets: MATRIX_BRACKETS[base],
						rows: cellsOf(rows),
						columnAlignment: hasEntry(COLUMN_ALIGNMENTS, alignment !== null && alignment !== void 0 ? alignment : "c") ? COLUMN_ALIGNMENTS[alignment !== null && alignment !== void 0 ? alignment : "c"] : fail(`\\begin{${name}} can't line its columns up "${alignment}"`, start)
					})
				};
			}
			if (base === "array" || base === "subarray") {
				readRawOption();
				const specification = [...readRawGroup(`\\begin{${name}}`).replace(/[@!]\{[^}]*\}/g, "").replace(/[pmb]\{[^}]*\}/g, "l")].map((letter) => COLUMN_ALIGNMENTS[letter]).filter((alignment) => alignment !== void 0);
				const rows = parseRows(font, name, start);
				const columns = Math.max(...rows.map(({ cells }) => cells.length));
				return {
					kind: "built",
					component: new MathMatrix({
						rows: cellsOf(rows),
						columnAlignment: Array.from({ length: columns }, (_, column) => {
							var _specification$column;
							return (_specification$column = specification[column]) !== null && _specification$column !== void 0 ? _specification$column : "center";
						})
					})
				};
			}
			if (base === "cases" || base === "dcases") return {
				kind: "built",
				component: new MathCases({ cases: parseRows(font, name, start).map(({ cells }, row) => {
					if (cells.length > 2) fail(`case ${row + 1} of \\begin{${name}} has ${cells.length} parts, but a case has at most two: its value & its condition`, start);
					const [value, condition] = cells.map(atomsToMath);
					return condition === void 0 ? { value } : {
						value,
						condition
					};
				}) })
			};
			if (base === "rcases" || base === "drcases") return {
				kind: "built",
				component: new MathBrackets({
					open: "",
					close: "}",
					children: [new MathMatrix({
						rows: cellsOf(parseRows(font, name, start)),
						columnAlignment: "left"
					})]
				})
			};
			if (ALIGNED_ENVIRONMENTS.has(base) || EQUATION_ENVIRONMENTS.has(base)) {
				if (base === "alignat" || base === "alignedat") readRawGroup(`\\begin{${name}}`);
				const rows = parseRows(font, name, start);
				return EQUATION_ENVIRONMENTS.has(base) && rows.length === 1 && rows[0].cells.length === 1 && rows[0].tag === void 0 ? {
					kind: "group",
					atoms: rows[0].cells[0]
				} : {
					kind: "built",
					component: equationArrayOf(rows)
				};
			}
			return fail(`unknown environment ${name}`, start);
		};
		const parseCommand = (token, font) => {
			const { name, start } = token;
			const what = `\\${name}`;
			if (name === "&" || name === "#") return text(name, _objectSpread2(_objectSpread2({}, font), {}, { literal: true }));
			if (hasEntry(UPRIGHT_GREEK, name)) return text(UPRIGHT_GREEK[name], isPlainFont(font) ? { style: "plain" } : font);
			if (hasEntry(ITALIC_GREEK, name)) return text(ITALIC_GREEK[name], isPlainFont(font) ? { style: "italic" } : font);
			const symbol = SYMBOLS.get(name);
			if (symbol !== void 0) return text(symbol.text, font, symbol.role);
			const width = SPACES.get(name);
			if (width !== void 0) return width === "" ? void 0 : text(width, font);
			if (hasEntry(FUNCTIONS, name)) return functionAtom([text(FUNCTIONS[name], { style: "plain" })], false);
			if (hasEntry(FUNCTIONS_WITH_LIMITS, name)) return functionAtom([text(FUNCTIONS_WITH_LIMITS[name], { style: "plain" })], true);
			if (hasEntry(LARGE_OPERATOR_COMMANDS, name)) return {
				kind: "operator",
				operator: LARGE_OPERATOR_COMMANDS[name],
				limits: readLimits()
			};
			if (hasEntry(ACCENT_COMMANDS, name)) return {
				kind: "built",
				component: new MathAccent({
					accent: ACCENT_COMMANDS[name],
					children: readMath(font, what)
				})
			};
			if (hasEntry(FONT_COMMANDS, name)) return {
				kind: "group",
				atoms: readArgument(FONT_COMMANDS[name](font), what)
			};
			if (TEXT_COMMANDS.has(name)) return {
				kind: "group",
				atoms: parseText(what)
			};
			if (hasEntry(BRACE_COMMANDS, name)) {
				const { brace, position } = BRACE_COMMANDS[name];
				const children = readMath(font, what);
				const labelled = isCharacter(peek(), position === "above" ? "^" : "_");
				if (labelled) next();
				return {
					kind: "built",
					component: new MathBrace({
						brace,
						position,
						children,
						label: labelled ? readMath(font, what) : void 0
					})
				};
			}
			if (hasEntry(EXTENSIBLE_ARROWS, name)) {
				const below = readOptionalArgument(font, what);
				const above = orSpace(readMath(font, what));
				const arrow = new docx.MathLimitUpper({
					children: [new docx.MathRun(EXTENSIBLE_ARROWS[name])],
					limit: above
				});
				return {
					kind: "built",
					role: "relation",
					component: below === void 0 ? arrow : new docx.MathLimitLower({
						children: [arrow],
						limit: orSpace(atomsToMath(below))
					})
				};
			}
			if (/^[Bb]igg?[lrm]?$/.test(name)) {
				var _roles$name;
				const delimiter = readDelimiter(what);
				return delimiter === "" ? void 0 : text(delimiter, font, (_roles$name = {
					l: "open",
					r: "close",
					m: "relation"
				}[name[name.length - 1]]) !== null && _roles$name !== void 0 ? _roles$name : roleOf(delimiter));
			}
			if (IGNORED.has(name)) return;
			if (IGNORED_WITH_ARGUMENT.has(name)) {
				readRawGroup(what);
				return;
			}
			switch (name) {
				case "frac":
				case "dfrac":
				case "tfrac":
				case "cfrac":
				case "nicefrac":
				case "sfrac": {
					if (name === "cfrac") readRawOption();
					const numerator = orSpace(readMath(font, what));
					const denominator = orSpace(readMath(font, what));
					return {
						kind: "built",
						component: new docx.MathFraction({
							numerator,
							denominator,
							type: name === "nicefrac" || name === "sfrac" ? "skewed" : void 0
						})
					};
				}
				case "binom":
				case "dbinom":
				case "tbinom": {
					const numerator = orSpace(readMath(font, what));
					const denominator = orSpace(readMath(font, what));
					return {
						kind: "built",
						component: new MathBrackets({ children: [new docx.MathFraction({
							numerator,
							denominator,
							type: "noBar"
						})] })
					};
				}
				case "sqrt": {
					const degree = readOptionalArgument(font, what);
					const children = orSpace(readMath(font, what));
					return {
						kind: "built",
						component: new docx.MathRadical(degree === void 0 || degree.length === 0 ? { children } : {
							children,
							degree: atomsToMath(degree)
						})
					};
				}
				case "left": return parseLeftRight(font, start);
				case "overline":
				case "underline": return {
					kind: "built",
					component: new MathBar({
						position: name === "overline" ? "above" : "below",
						children: readMath(font, what)
					})
				};
				case "overset":
				case "stackrel":
				case "underset": {
					const limit = orSpace(readMath(font, what));
					const base = readArgument(font, what);
					const children = orSpace(atomsToMath(base));
					return {
						kind: "built",
						role: name === "stackrel" ? "relation" : base.length === 1 && base[0].kind === "text" ? base[0].role : "ordinary",
						component: name === "underset" ? new docx.MathLimitLower({
							children,
							limit
						}) : new docx.MathLimitUpper({
							children,
							limit
						})
					};
				}
				case "operatorname": {
					const below = readStar();
					return functionAtom(readArgument({ style: "plain" }, what), below);
				}
				case "boxed": return {
					kind: "built",
					component: new MathBox({ children: readMath(font, what) })
				};
				case "fbox": return {
					kind: "built",
					component: new MathBox({ children: atomsToMath(parseText(what)) })
				};
				case "cancel":
				case "bcancel":
				case "xcancel": return {
					kind: "built",
					component: new MathBox({
						borders: [],
						strikes: {
							cancel: ["diagonalUp"],
							bcancel: ["diagonalDown"],
							xcancel: ["diagonalUp", "diagonalDown"]
						}[name],
						children: readMath(font, what)
					})
				};
				case "phantom":
				case "hphantom":
				case "vphantom":
				case "smash": {
					const option = name === "smash" ? readRawOption() : void 0;
					return {
						kind: "built",
						component: new MathPhantom(_objectSpread2(_objectSpread2({}, {
							phantom: {},
							hphantom: {
								height: false,
								depth: false
							},
							vphantom: { width: false },
							smash: {
								visible: true,
								height: option === "b",
								depth: option === "t"
							}
						}[name]), {}, { children: readMath(font, what) }))
					};
				}
				case "mathstrut": return {
					kind: "built",
					component: new MathPhantom({
						width: false,
						children: [new docx.MathRun("(")]
					})
				};
				case "textcolor":
					readRawGroup(what);
					return {
						kind: "group",
						atoms: readArgument(font, what)
					};
				case "mathop":
				case "mathbin":
				case "mathrel":
				case "mathord":
				case "mathopen":
				case "mathclose":
				case "mathpunct":
				case "mathinner": return {
					kind: "group",
					atoms: readArgument(font, what)
				};
				case "not": {
					const negation = (relation) => {
						var _NEGATIONS$get;
						return text((_NEGATIONS$get = NEGATIONS.get(relation)) !== null && _NEGATIONS$get !== void 0 ? _NEGATIONS$get : `${relation}\u0338`, font, "relation");
					};
					const negated = peek();
					if ((negated === null || negated === void 0 ? void 0 : negated.type) === "character" && ![
						"{",
						"}",
						"^",
						"_",
						"&",
						"$"
					].includes(negated.value)) {
						var _CHARACTERS$get$text, _CHARACTERS$get;
						next();
						return negation((_CHARACTERS$get$text = (_CHARACTERS$get = CHARACTERS.get(negated.value)) === null || _CHARACTERS$get === void 0 ? void 0 : _CHARACTERS$get.text) !== null && _CHARACTERS$get$text !== void 0 ? _CHARACTERS$get$text : negated.value);
					}
					if ((negated === null || negated === void 0 ? void 0 : negated.type) === "command" && SYMBOLS.has(negated.name)) {
						next();
						return negation(SYMBOLS.get(negated.name).text);
					}
					return fail("\\not needs a symbol after it, such as \\not= or \\not\\in", start);
				}
				case "bmod":
				case "mod": return {
					kind: "group",
					atoms: [
						text(name === "mod" ? " " : " ", font),
						text("mod", { style: "plain" }),
						text(" ", font)
					]
				};
				case "pmod":
				case "pod": {
					const argument = readArgument(font, what);
					return {
						kind: "group",
						atoms: [
							text(" ", font),
							text("(", font, "open"),
							...name === "pmod" ? [text("mod", { style: "plain" }), text(" ", font)] : [],
							...argument,
							text(")", font, "close")
						]
					};
				}
				case "hspace":
					readStar();
					readRawGroup(what);
					return text(" ", font);
				case "substack": {
					skipSpace();
					if (source[index] !== "{") return fail("\\substack needs an argument in braces");
					const open = index;
					index++;
					let rows = [];
					for (;;) {
						const { atoms, end } = parseList(font);
						rows = [...rows, atoms];
						if (isCommand(end, "\\")) next();
						else {
							readClosing(end, "}", "\\substack's argument", open);
							break;
						}
					}
					return {
						kind: "built",
						component: new MathMatrix({ rows: rows.map((row) => [atomsToMath(row)]) })
					};
				}
				case "tag": {
					const star = readStar();
					const tag = readRawGroup(what).replace(/\$/g, "");
					return {
						kind: "tag",
						text: star ? tag : `(${tag})`
					};
				}
				case "begin": return parseEnvironment(font, start);
				default: return fail(`unknown command ${what}`, start);
			}
		};
		return parseRows({}, void 0, from);
	};
	//#endregion
	//#region src/math/latex-to-math.ts
	var DELIMITERS = [
		["$$", "$$"],
		["\\[", "\\]"],
		["\\(", "\\)"],
		["$", "$"]
	];
	/**
	* Turns LaTeX math into docx's math, to go in a `Math`, as Word's own equations, which it shows and edits as it does
	* those typed into it.
	*
	* It reads the math that LaTeX, MathJax and KaTeX write: fractions, scripts, roots, sums, integrals and other large
	* operators, functions such as sin and lim, brackets that grow with `\left` and `\right`, accents, braces, boxes,
	* fonts such as `\mathbb` and `\mathrm`, `\text`, Greek letters and symbols, and the environments for matrices,
	* cases and aligned equations, with `\tag` for their numbers. The math can be given in `$…$`, `$$…$$`, `\(…\)` or
	* `\[…\]`, which are left out.
	*
	* Colours, sizes and spacing that Word works out for itself are left out.
	*
	* @param latex - The LaTeX, such as `"\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}"`
	* @returns The math, to be the children of a `Math`, or to go among other math components
	* @throws If the LaTeX has a command or an environment it doesn't know, or isn't well formed, such as a `{` with no
	* `}`. The error says where
	*
	* @example
	* ```typescript
	* new Math({ children: latexToMath("x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}") });
	* ```
	*/
	var latexToMath = (latex) => {
		var _DELIMITERS$find;
		const start = latex.length - latex.trimStart().length;
		const end = latex.trimEnd().length;
		const [open, close] = (_DELIMITERS$find = DELIMITERS.find(([opening, closing]) => end - start >= opening.length + closing.length && latex.startsWith(opening, start) && latex.endsWith(closing, end))) !== null && _DELIMITERS$find !== void 0 ? _DELIMITERS$find : ["", ""];
		const rows = parseLatex(latex, start + open.length, end - close.length);
		return rows.length === 1 && rows[0].cells.length === 1 && rows[0].tag === void 0 ? atomsToMath(rows[0].cells[0]) : [equationArrayOf(rows)];
	};
	//#endregion
	Object.defineProperty(exports, "Math", {
		enumerable: true,
		get: function() {
			return docx.Math;
		}
	});
	exports.MathAccent = MathAccent;
	Object.defineProperty(exports, "MathAngledBrackets", {
		enumerable: true,
		get: function() {
			return docx.MathAngledBrackets;
		}
	});
	exports.MathBar = MathBar;
	exports.MathBox = MathBox;
	exports.MathBrace = MathBrace;
	exports.MathBrackets = MathBrackets;
	exports.MathCases = MathCases;
	Object.defineProperty(exports, "MathCurlyBrackets", {
		enumerable: true,
		get: function() {
			return docx.MathCurlyBrackets;
		}
	});
	Object.defineProperty(exports, "MathDegree", {
		enumerable: true,
		get: function() {
			return docx.MathDegree;
		}
	});
	Object.defineProperty(exports, "MathDenominator", {
		enumerable: true,
		get: function() {
			return docx.MathDenominator;
		}
	});
	exports.MathEquationArray = MathEquationArray;
	Object.defineProperty(exports, "MathFraction", {
		enumerable: true,
		get: function() {
			return docx.MathFraction;
		}
	});
	Object.defineProperty(exports, "MathFunction", {
		enumerable: true,
		get: function() {
			return docx.MathFunction;
		}
	});
	Object.defineProperty(exports, "MathFunctionName", {
		enumerable: true,
		get: function() {
			return docx.MathFunctionName;
		}
	});
	Object.defineProperty(exports, "MathFunctionProperties", {
		enumerable: true,
		get: function() {
			return docx.MathFunctionProperties;
		}
	});
	Object.defineProperty(exports, "MathIntegral", {
		enumerable: true,
		get: function() {
			return docx.MathIntegral;
		}
	});
	exports.MathLargeOperator = MathLargeOperator;
	Object.defineProperty(exports, "MathLimit", {
		enumerable: true,
		get: function() {
			return docx.MathLimit;
		}
	});
	Object.defineProperty(exports, "MathLimitLower", {
		enumerable: true,
		get: function() {
			return docx.MathLimitLower;
		}
	});
	Object.defineProperty(exports, "MathLimitUpper", {
		enumerable: true,
		get: function() {
			return docx.MathLimitUpper;
		}
	});
	exports.MathMatrix = MathMatrix;
	Object.defineProperty(exports, "MathNumerator", {
		enumerable: true,
		get: function() {
			return docx.MathNumerator;
		}
	});
	exports.MathPhantom = MathPhantom;
	Object.defineProperty(exports, "MathPreSubSuperScript", {
		enumerable: true,
		get: function() {
			return docx.MathPreSubSuperScript;
		}
	});
	Object.defineProperty(exports, "MathRadical", {
		enumerable: true,
		get: function() {
			return docx.MathRadical;
		}
	});
	Object.defineProperty(exports, "MathRadicalProperties", {
		enumerable: true,
		get: function() {
			return docx.MathRadicalProperties;
		}
	});
	Object.defineProperty(exports, "MathRoundBrackets", {
		enumerable: true,
		get: function() {
			return docx.MathRoundBrackets;
		}
	});
	Object.defineProperty(exports, "MathRun", {
		enumerable: true,
		get: function() {
			return docx.MathRun;
		}
	});
	Object.defineProperty(exports, "MathSquareBrackets", {
		enumerable: true,
		get: function() {
			return docx.MathSquareBrackets;
		}
	});
	Object.defineProperty(exports, "MathSubScript", {
		enumerable: true,
		get: function() {
			return docx.MathSubScript;
		}
	});
	Object.defineProperty(exports, "MathSubSuperScript", {
		enumerable: true,
		get: function() {
			return docx.MathSubSuperScript;
		}
	});
	Object.defineProperty(exports, "MathSum", {
		enumerable: true,
		get: function() {
			return docx.MathSum;
		}
	});
	Object.defineProperty(exports, "MathSuperScript", {
		enumerable: true,
		get: function() {
			return docx.MathSuperScript;
		}
	});
	Object.defineProperty(exports, "createMathAccentCharacter", {
		enumerable: true,
		get: function() {
			return docx.createMathAccentCharacter;
		}
	});
	Object.defineProperty(exports, "createMathBase", {
		enumerable: true,
		get: function() {
			return docx.createMathBase;
		}
	});
	Object.defineProperty(exports, "createMathLimitLocation", {
		enumerable: true,
		get: function() {
			return docx.createMathLimitLocation;
		}
	});
	Object.defineProperty(exports, "createMathNAryProperties", {
		enumerable: true,
		get: function() {
			return docx.createMathNAryProperties;
		}
	});
	Object.defineProperty(exports, "createMathPreSubSuperScriptProperties", {
		enumerable: true,
		get: function() {
			return docx.createMathPreSubSuperScriptProperties;
		}
	});
	Object.defineProperty(exports, "createMathSubScriptElement", {
		enumerable: true,
		get: function() {
			return docx.createMathSubScriptElement;
		}
	});
	Object.defineProperty(exports, "createMathSubScriptProperties", {
		enumerable: true,
		get: function() {
			return docx.createMathSubScriptProperties;
		}
	});
	Object.defineProperty(exports, "createMathSubSuperScriptProperties", {
		enumerable: true,
		get: function() {
			return docx.createMathSubSuperScriptProperties;
		}
	});
	Object.defineProperty(exports, "createMathSuperScriptElement", {
		enumerable: true,
		get: function() {
			return docx.createMathSuperScriptElement;
		}
	});
	Object.defineProperty(exports, "createMathSuperScriptProperties", {
		enumerable: true,
		get: function() {
			return docx.createMathSuperScriptProperties;
		}
	});
	exports.latexToMath = latexToMath;
	return exports;
})({}, docx);
