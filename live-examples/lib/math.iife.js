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
	* An argument (`m:e`). An empty one gets a zero-width space, as LibreOffice can't read an equation with an empty
	* argument, and draws "¿" in its place.
	*/
	var createArgument = (children) => (0, docx.createMathBase)({ children: children.length === 0 ? [new docx.MathRun("​")] : children });
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
	var COLUMN_ALIGNMENTS = [
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
		alignments.forEach((alignment) => checkOneOf(owner, "columnAlignment", alignment, COLUMN_ALIGNMENTS));
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
	Object.defineProperty(exports, "Math", {
		enumerable: true,
		get: function() {
			return docx.Math;
		}
	});
	Object.defineProperty(exports, "MathAngledBrackets", {
		enumerable: true,
		get: function() {
			return docx.MathAngledBrackets;
		}
	});
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
	return exports;
})({}, docx);
