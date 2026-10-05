var docxCharts = (function(exports, docx) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	//#region src/charts/chart-categories.ts
	var isGroup$1 = (category) => typeof category === "object" && category !== null && !(category instanceof Date);
	/**
	* Whether the categories are groups of categories.
	*/
	var isCategoryGroups = (categories) => categories.length > 0 && isGroup$1(categories[0]);
	/**
	* The rows of labels grouped categories are laid out in, one for each category, from the outermost group in.
	*/
	var categoryRowsOf = (groups) => groups.flatMap(({ name, categories }) => {
		return (isCategoryGroups(categories) ? categoryRowsOf(categories) : categories.map((one) => [one])).map((row, index) => [index === 0 ? name : void 0, ...row]);
	});
	/**
	* The categories along the axis, without their groups: the categories of the innermost groups, in order.
	*/
	var leafCategoriesOf = (categories) => isCategoryGroups(categories) ? categoryRowsOf(categories).map((row) => row[row.length - 1]) : categories;
	/**
	* Each category's label with its groups', from the outermost in, such as "2025 Q1", as a screen reader reads it.
	*/
	var groupedCategoryLabelsOf = (groups) => groups.flatMap(({ name, categories }) => (isCategoryGroups(categories) ? groupedCategoryLabelsOf(categories) : categories.map(String)).map((label) => `${name} ${label}`));
	//#endregion
	//#region src/charts/chart-dates.ts
	/**
	* Dates as a chart's categories: Excel's serial numbers for them, and the unit a date axis spaces them by.
	*
	* @module
	*/
	var MILLISECONDS_PER_DAY = 864e5;
	var EXCEL_EPOCH = Date.UTC(1899, 11, 30);
	var FIRST_DATE = Date.UTC(1900, 2, 1);
	var LAST_DATE = Date.UTC(9999, 11, 31);
	/**
	* How dates are written in the sheet and on the axis, for each unit: unambiguous in any locale.
	*/
	var DATE_FORMATS = {
		days: "d mmm yyyy",
		months: "mmm yyyy",
		years: "yyyy"
	};
	/**
	* A date as an error message writes it: ISO text in UTC, which is the same in every time zone, or "Invalid Date".
	*/
	var dateText$1 = (date) => Number.isFinite(date.getTime()) ? date.toISOString() : String(date);
	/**
	* Checks that a category is a date Excel can hold.
	*
	* @throws If it isn't a valid date from 1 March 1900 to 31 December 9999
	*/
	var checkDate = (date) => {
		const time = date.getTime();
		if (!(time >= FIRST_DATE && time < LAST_DATE + MILLISECONDS_PER_DAY)) throw new Error(`Invalid category date ${dateText$1(date)}. Expected a date from 1900-03-01 to 9999-12-31`);
	};
	/**
	* A date as Excel's serial number: days since 30 December 1899, with the time of day as a fraction. Dates are read in
	* UTC, as `docx` writes every date, so `new Date("2025-01-31")` is 31 January 2025.
	*/
	var serialDate = (date) => (date.getTime() - EXCEL_EPOCH) / MILLISECONDS_PER_DAY;
	/**
	* The unit dates are spaced by, as Excel chooses it: years when they are all the 1st of January, months when they are
	* all the 1st of a month, and otherwise days.
	*/
	var timeUnitOf = (dates) => {
		const startsOf = (date) => date.getTime() % MILLISECONDS_PER_DAY === 0 && date.getUTCDate() === 1;
		if (!dates.every(startsOf)) return "days";
		return dates.every((date) => date.getUTCMonth() === 0) ? "years" : "months";
	};
	//#endregion
	//#region src/charts/chart-stock.ts
	var DEFAULT_NAMES = {
		volume: "Volume",
		open: "Open",
		high: "High",
		low: "Low",
		close: "Close"
	};
	var ROLES = [
		"volume",
		"open",
		"high",
		"low",
		"close"
	];
	/**
	* A stock chart's series, in Word's order, which is the order its sheet's columns are in and its series are plotted in:
	* the volumes, the opening prices, the highs, the lows and the closing prices. Those not given are left out.
	*/
	var stockSeriesOf = (options) => ROLES.flatMap((role) => {
		var _options$names$role, _options$names;
		const values = options[role];
		return values === void 0 ? [] : [{
			role,
			name: (_options$names$role = (_options$names = options.names) === null || _options$names === void 0 ? void 0 : _options$names[role]) !== null && _options$names$role !== void 0 ? _options$names$role : DEFAULT_NAMES[role],
			values
		}];
	});
	//#endregion
	//#region src/charts/chart-legend.ts
	var TRENDLINE_NAMES = {
		linear: "Linear",
		exponential: "Expon.",
		logarithmic: "Log.",
		polynomial: "Poly.",
		power: "Power"
	};
	/**
	* A trendline's name in the legend: its own, or Office's, such as "Linear (Sales)" or "3 per. Mov. Avg. (Sales)".
	*
	* @param series - The series' name
	*/
	var trendlineNameOf = (trendline, series) => {
		var _trendline$period;
		if (trendline.name !== void 0) return trendline.name;
		return `${trendline.type === "movingAverage" ? `${(_trendline$period = trendline.period) !== null && _trendline$period !== void 0 ? _trendline$period : 2} per. Mov. Avg.` : TRENDLINE_NAMES[trendline.type]} (${series})`;
	};
	/**
	* The legend's entries, in order. A pie's or doughnut's are its categories. Other charts' are their series, in order,
	* then their trendlines, which Office numbers after every series.
	*/
	var legendEntriesOf = (options) => {
		switch (options.type) {
			case "pie":
			case "doughnut":
			case "pieOfPie":
			case "barOfPie": return options.categories.map((category, index) => ({
				text: String(category),
				index
			}));
			case "stock": return stockSeriesOf(options).map(({ name }, index) => ({
				text: name,
				index
			}));
			default: {
				const { series } = options;
				const trendlines = series.flatMap(({ name, trendlines: own = [] }) => own.map((trendline) => trendlineNameOf(trendline, name)));
				return [...series.map(({ name }) => name), ...trendlines].map((text, index) => ({
					text,
					index
				}));
			}
		}
	};
	//#endregion
	//#region src/charts/chart-checks.ts
	/**
	* Checks a chart's options, so mistakes show up where the chart is made rather than when the document is opened.
	*
	* @module
	*/
	/**
	* Checks that an option is a number in a range, if it is given.
	*
	* @throws If it isn't
	*/
	var checkRange = (value, option, minimum, maximum) => {
		if (value !== void 0 && !(value >= minimum && value <= maximum)) throw new Error(`Invalid ${option} ${value}. Expected a number from ${minimum} to ${maximum}`);
	};
	/**
	* A value as an error message writes it: text in quotes, so "5" isn't mistaken for a number, and a date as ISO text, so
	* the message is the same in every time zone.
	*/
	var quoted$1 = (value) => {
		if (typeof value === "string") return `"${value}"`;
		return value instanceof Date ? dateText$1(value) : String(value);
	};
	/**
	* Checks that an option is a whole number in a range, if it is given.
	*/
	var checkWholeNumber = (value, option, minimum, maximum) => {
		if (value !== void 0 && !(Number.isInteger(value) && value >= minimum && value <= maximum)) throw new Error(`Invalid ${option} ${quoted$1(value)}. Expected a whole number from ${minimum} to ${maximum}`);
	};
	var checkSize$1 = ({ width, height }) => {
		for (const [name, value] of [["width", width], ["height", height]]) if (!(value > 0 && Number.isFinite(value))) throw new Error(`Invalid chart ${name} ${value}. Expected a positive number of pixels`);
	};
	var checkFont = (font) => checkRange(font === null || font === void 0 ? void 0 : font.size, "font size", 1, 4e3);
	var checkTitle = (title) => checkFont(typeof title === "object" ? title.font : void 0);
	var checkLine = (line) => checkRange(line === null || line === void 0 ? void 0 : line.width, "line width", 0, 1584);
	var checkArea = (area) => checkLine((area === null || area === void 0 ? void 0 : area.border) === "none" ? void 0 : area === null || area === void 0 ? void 0 : area.border);
	var checkMarkers = (markers) => checkRange(typeof markers === "object" ? markers.size : void 0, "marker size", 2, 72);
	var checkDataLabels = (labels) => checkFont(labels ? labels.font : void 0);
	var SHOWN$1 = [
		"value",
		"category",
		"seriesName",
		"percentage",
		"bubbleSize"
	];
	/**
	* Checks the labels of single points: no more than there are points, each a label's options, `false` or undefined, and
	* a label with text showing nothing else.
	*
	* @param points - How many points the series has room for, and what they are, for messages
	*/
	var checkPointLabels = (series, count, points) => {
		const { name, pointLabels } = series;
		if (pointLabels === void 0) return;
		if (!Array.isArray(pointLabels)) throw new Error(`Invalid point labels ${quoted$1(pointLabels)} for series "${name}". Expected a label for each point, in order`);
		if (pointLabels.length > count) throw new Error(`Series "${name}" has ${pointLabels.length} point labels, but there are ${count} ${points}`);
		pointLabels.forEach((label, index) => {
			if (label === void 0 || label === false) return;
			if (typeof label !== "object" || label === null) throw new Error(`Invalid label ${quoted$1(label)} of point ${index + 1} of series "${name}". Expected a label's options, false or undefined`);
			const { text, numberFormat, font } = label;
			if (text !== void 0) {
				if (typeof text !== "string") throw new Error(`Invalid text ${quoted$1(text)} of the label of point ${index + 1} of series "${name}". Expected text`);
				const shown = [...SHOWN$1, "numberFormat"].find((option) => label[option] !== void 0);
				if (shown !== void 0) throw new Error(`Invalid option ${shown} of the label of point ${index + 1} of series "${name}". A label with text shows only its text`);
			}
			if (numberFormat !== void 0 && typeof numberFormat !== "string") throw new Error(`Invalid number format ${quoted$1(numberFormat)} of the label of point ${index + 1} of series "${name}"`);
			checkFont(font);
		});
	};
	/**
	* Checks where an axis crosses the other: a place, a finite number, or, on a value axis crossing categories that are
	* dates, a date. A value axis crossing dates takes a date rather than a category's number.
	*
	* @param dates - Whether the axis crosses categories that are dates
	*/
	var checkCrossing = (crossesAt, name, dates) => {
		if (crossesAt instanceof Date) {
			if (!dates) throw new Error(`Invalid ${name} crossing ${String(crossesAt)}. A date is only for a value axis crossing categories that are dates`);
			checkDate(crossesAt);
			return;
		}
		if (typeof crossesAt === "number" ? !Number.isFinite(crossesAt) : ![
			void 0,
			"auto",
			"minimum",
			"maximum"
		].includes(crossesAt)) throw new Error(`Invalid ${name} crossing ${crossesAt}. Expected "auto", "minimum", "maximum" or a finite number`);
		if (dates && typeof crossesAt === "number") throw new Error(`Invalid ${name} crossing ${crossesAt}. The categories are dates, so expected a date`);
	};
	var checkAxis = (axis, name, dates = false) => {
		checkTitle(axis === null || axis === void 0 ? void 0 : axis.title);
		checkFont(axis === null || axis === void 0 ? void 0 : axis.font);
		checkRange(axis === null || axis === void 0 ? void 0 : axis.labelRotation, `${name} label rotation`, -90, 90);
		checkCrossing(axis === null || axis === void 0 ? void 0 : axis.crossesAt, name, dates);
	};
	var DISPLAY_UNITS = [
		"hundreds",
		"thousands",
		"tenThousands",
		"hundredThousands",
		"millions",
		"tenMillions",
		"hundredMillions",
		"billions",
		"trillions"
	];
	/**
	* @param dates - Whether the axis crosses categories that are dates
	*/
	var checkValueAxis = (axis, name, dates = false) => {
		checkAxis(axis, name, dates);
		if (axis === void 0) return;
		const { minimum, maximum, interval, logarithmicBase, displayUnits } = axis;
		if (displayUnits !== void 0 && !DISPLAY_UNITS.includes(displayUnits)) throw new Error(`Invalid ${name} display units "${displayUnits}". Expected one of ${DISPLAY_UNITS.join(", ")}`);
		for (const [option, value] of [
			["minimum", minimum],
			["maximum", maximum],
			["interval", interval]
		]) if (value !== void 0 && !Number.isFinite(value)) throw new Error(`Invalid ${name} ${option} ${value}. Expected a finite number`);
		if (minimum !== void 0 && maximum !== void 0 && !(minimum < maximum)) throw new Error(`Invalid ${name} range from ${minimum} to ${maximum}. Expected the minimum to be less than the maximum`);
		if (interval !== void 0 && !(interval > 0)) throw new Error(`Invalid ${name} interval ${interval}. Expected a number greater than 0`);
		checkRange(logarithmicBase, `${name} logarithmic base`, 2, 1e3);
		if (logarithmicBase !== void 0) {
			for (const [option, value] of [["minimum", minimum], ["maximum", maximum]]) if (value !== void 0 && !(value > 0)) throw new Error(`Invalid ${name} ${option} ${value}. A logarithmic axis' range is above 0`);
		}
	};
	var checkValue = (value, series) => {
		if (value !== null && !Number.isFinite(value)) throw new Error(`Invalid value ${quoted$1(value)} in series "${series}". Expected a finite number or null`);
	};
	var isGroup = (category) => typeof category === "object" && category !== null && !(category instanceof Date);
	/**
	* Checks groups of categories: each has a name and at least one category, holds categories or groups but not both, and
	* every group at the same depth holds groups as deep.
	*
	* @returns How deep the groups are: 1 for groups of categories, 2 for groups of those, and so on
	*/
	var checkGroups = (groups) => {
		const depths = groups.map((group) => {
			const { name, categories } = isGroup(group) ? group : {};
			if (!isGroup(group) || typeof name !== "string" || !Array.isArray(categories)) throw new Error(`Invalid category group ${isGroup(group) ? JSON.stringify(group) : quoted$1(group)}. Expected { name, categories }, as every category is a group or none is`);
			if (categories.length === 0) throw new Error(`Category group "${name}" has no categories`);
			if (isGroup(categories[0])) return 1 + checkGroups(categories);
			for (const category of categories) {
				if (isGroup(category)) throw new Error(`Category group "${name}" holds categories and groups. A group holds one or the other`);
				if (category instanceof Date) throw new Error(`Invalid category ${quoted$1(category)} in group "${name}". Categories in groups are text or numbers, not dates`);
				if (typeof category !== "string" && !Number.isFinite(category)) throw new Error(`Invalid category ${quoted$1(category)} in group "${name}". Expected text or a finite number`);
			}
			return 1;
		});
		if (new Set(depths).size > 1) throw new Error("Invalid category groups. Every group at the same depth holds groups as deep, so every category has as many groups");
		return depths[0];
	};
	/**
	* Checks the categories: text or finite numbers, or on a chart with a category axis, all dates, or all groups.
	*/
	var checkCategories = (categories, { dates, groups, type }) => {
		if (!Array.isArray(categories)) throw new Error(`Invalid categories ${quoted$1(categories)}. Expected a list of them`);
		if (categories.length === 0) throw new Error("A chart needs at least one category");
		if (isCategoryGroups(categories)) {
			if (!groups) throw new Error(`Invalid categories. A ${type} chart's categories can't be in groups`);
			checkGroups(categories);
			return;
		}
		const plain = categories;
		if (plain.some(isGroup)) throw new Error("Invalid categories. Expected all of them to be groups, or none");
		const dated = plain.filter((category) => category instanceof Date);
		if (dates && dated.length > 0) {
			if (dated.length < plain.length) throw new Error("Invalid categories. Expected all of them to be dates, or none");
			dated.forEach(checkDate);
			return;
		}
		for (const category of plain) if (typeof category !== "string" && !Number.isFinite(category)) throw new Error(`Invalid category ${quoted$1(category)}. Expected text or a finite number`);
	};
	var checkSeries = (series) => {
		if (!Array.isArray(series) || series.length === 0) throw new Error("A chart needs at least one series");
	};
	var checkCategorySeries = ({ name, values, dataLabels }, categories) => {
		if (values.length > categories) throw new Error(`Series "${name}" has ${values.length} values, but there are ${categories} categories`);
		for (const value of values) checkValue(value, name);
		checkDataLabels(dataLabels);
	};
	var checkColors = ({ name, colors }, categories) => {
		if (colors && colors.length > categories) throw new Error(`Series "${name}" has ${colors.length} colors, but there are ${categories} categories`);
	};
	/**
	* Checks how far a pie's slices are pulled out: one amount for all, or one for each slice.
	*/
	var checkExplosion = ({ name, explosion }, categories) => {
		if (explosion === void 0 || typeof explosion === "number") {
			checkRange(explosion, `explosion of series "${name}"`, 0, 400);
			return;
		}
		if (!Array.isArray(explosion)) throw new Error(`Invalid explosion ${quoted$1(explosion)} of series "${name}". Expected a percentage, or one for each slice`);
		if (explosion.length > categories) throw new Error(`Series "${name}" has ${explosion.length} explosions, but there are ${categories} categories`);
		for (const amount of explosion) {
			if (amount !== void 0 && typeof amount !== "number") throw new Error(`Invalid explosion ${quoted$1(amount)} of series "${name}". Expected a percentage or undefined for each slice`);
			checkRange(amount, `explosion of series "${name}"`, 0, 400);
		}
	};
	var checkPieSeries = (series, categories, type) => {
		checkCategorySeries(series, categories);
		const negative = series.values.find((value) => value !== null && value < 0);
		if (negative !== void 0) throw new Error(`Invalid value ${negative} in series "${series.name}". A ${type} chart's values can't be negative`);
		checkColors(series, categories);
		checkPointLabels(series, categories, "categories");
		checkExplosion(series, categories);
	};
	/**
	* Throws for an option a series has that it can't have, such as markers on a series drawn as columns.
	*/
	var checkOptionsFor = (series, options, reason) => {
		const given = options.find((option) => series[option] !== void 0);
		if (given !== void 0) throw new Error(`Invalid option ${given} for series "${series.name}". ${reason}`);
	};
	/**
	* Throws for an option a chart has that its type can't have, such as a data table on a pie chart.
	*/
	var checkChartOptionsFor = (options, names, reason) => {
		const given = names.find((option) => options[option] !== void 0);
		if (given !== void 0) throw new Error(`Invalid option ${given}. ${reason}`);
	};
	var TRENDLINE_TYPES = [
		"linear",
		"exponential",
		"logarithmic",
		"polynomial",
		"power",
		"movingAverage"
	];
	/**
	* Checks a series' trendlines: their type, the options it has, and that the series' values are ones it can be fitted to.
	*/
	var checkTrendlines = (series, trendlines, data) => {
		if (trendlines === void 0) return;
		if (!Array.isArray(trendlines)) throw new Error(`Invalid trendlines ${quoted$1(trendlines)} for series "${series}". Expected a list of them`);
		for (const trendline of trendlines) {
			var _trendline$label;
			const { type } = trendline !== null && trendline !== void 0 ? trendline : {};
			if (type === void 0 || !TRENDLINE_TYPES.includes(type)) throw new Error(`Invalid trendline type ${quoted$1(type)} for series "${series}". Expected one of ${TRENDLINE_TYPES.map((one) => `"${one}"`).join(", ")}`);
			const name = `the ${type} trendline of series "${series}"`;
			const invalid = (option, reason) => /* @__PURE__ */ new Error(`Invalid option ${option} for ${name}. ${reason}`);
			if (type !== "polynomial" && trendline.order !== void 0) throw invalid("order", "Only a polynomial trendline has an order");
			if (type !== "movingAverage" && trendline.period !== void 0) throw invalid("period", "Only a moving average has a period");
			checkWholeNumber(trendline.order, `order of ${name}`, 2, 6);
			if (type === "movingAverage") {
				for (const option of [
					"forecastForward",
					"forecastBackward",
					"intercept",
					"equation",
					"rSquared",
					"label"
				]) if (trendline[option] !== void 0) throw invalid(option, "A moving average has no equation, so it has none");
				const { period = 2 } = trendline;
				if (!(Number.isInteger(period) && period >= 2 && period < data.length)) throw new Error(`Invalid period ${quoted$1(period)} of ${name}. Expected a whole number from 2 to one fewer than the series' ${data.length} values`);
			}
			for (const option of ["forecastForward", "forecastBackward"]) {
				const value = trendline[option];
				if (value !== void 0 && !(typeof value === "number" && value >= 0 && Number.isFinite(value))) throw new Error(`Invalid ${option} ${quoted$1(value)} of ${name}. Expected a finite number of 0 or more`);
			}
			if (trendline.intercept !== void 0) {
				if (![
					"linear",
					"exponential",
					"polynomial"
				].includes(type)) throw invalid("intercept", "Only linear, exponential and polynomial trendlines have one");
				if (!Number.isFinite(trendline.intercept) || type === "exponential" && !(trendline.intercept > 0)) throw new Error(`Invalid intercept ${quoted$1(trendline.intercept)} of ${name}. Expected a finite number${type === "exponential" ? " above 0" : ""}`);
			}
			if (trendline.label !== void 0 && !trendline.equation && !trendline.rSquared) throw invalid("label", "It shows neither its equation nor its R² value");
			checkFont((_trendline$label = trendline.label) === null || _trendline$label === void 0 ? void 0 : _trendline$label.font);
			checkLine(trendline.line);
			if (trendline.name !== void 0 && typeof trendline.name !== "string") throw new Error(`Invalid name ${quoted$1(trendline.name)} of ${name}. Expected text`);
			const nonPositive = (axis) => {
				var _data$find;
				return (_data$find = data.find((point) => !(point[axis] > 0))) === null || _data$find === void 0 ? void 0 : _data$find[axis];
			};
			const needsPositive = type === "exponential" ? ["y"] : type === "power" ? ["x", "y"] : type === "logarithmic" ? ["x"] : [];
			for (const axis of needsPositive) {
				const value = nonPositive(axis);
				if (value !== void 0) throw new Error(`Can't fit ${name} to the ${axis === "y" ? "value" : "x value"} ${value}. A ${type} trendline needs ${axis === "y" ? "values" : "x values"} above 0`);
			}
		}
	};
	var ERROR_BAR_TYPES = [
		"fixed",
		"percentage",
		"standardDeviation",
		"standardError",
		"custom"
	];
	/**
	* Checks a series' error bars: their type and amounts, and for custom ones, no more amounts than there are points.
	*
	* @param which - Which error bars they are, for messages, such as "error bars" or "x error bars"
	*/
	var checkErrorBars = (series, errorBars, count, which) => {
		if (errorBars === void 0) return;
		const { type } = typeof errorBars === "object" && errorBars !== null ? errorBars : {};
		if (type === void 0 || !ERROR_BAR_TYPES.includes(type)) throw new Error(`Invalid ${which} type ${quoted$1(type)} for series "${series}". Expected one of ${ERROR_BAR_TYPES.map((one) => `"${one}"`).join(", ")}`);
		const name = `the ${which} of series "${series}"`;
		checkLine(errorBars.line);
		if (errorBars.type === "custom") {
			if ("direction" in errorBars && errorBars.direction !== void 0) throw new Error(`Invalid option direction for ${name}. Custom error bars go the ways their plus and minus amounts are given`);
			if (errorBars.plus === void 0 && errorBars.minus === void 0) throw new Error(`Custom ${name} need plus or minus amounts, or both`);
			for (const side of ["plus", "minus"]) {
				const amounts = errorBars[side];
				if (amounts === void 0) continue;
				if (!Array.isArray(amounts)) throw new Error(`Invalid ${side} amounts ${quoted$1(amounts)} of ${name}. Expected one for each point`);
				if (amounts.length > count) throw new Error(`The ${which} of series "${series}" have ${amounts.length} ${side} amounts, but there are ${count} points`);
				const wrong = amounts.findIndex((amount) => amount !== null && !(typeof amount === "number" && amount >= 0 && Number.isFinite(amount)));
				if (wrong !== -1) throw new Error(`Invalid ${side} amount ${quoted$1(amounts[wrong])} of ${name}. Expected a finite number of 0 or more, or null`);
			}
			return;
		}
		if (errorBars.direction !== void 0 && ![
			"both",
			"plus",
			"minus"
		].includes(errorBars.direction)) throw new Error(`Invalid direction ${quoted$1(errorBars.direction)} of ${name}. Expected "both", "plus" or "minus"`);
		const { value } = errorBars;
		if (errorBars.type === "standardError") {
			if (value !== void 0) throw new Error(`Invalid option value for ${name}. The standard error has no amount`);
			return;
		}
		if (value === void 0 && errorBars.type !== "standardDeviation") throw new Error(`The ${errorBars.type} ${name} need a value`);
		if (value !== void 0 && !(typeof value === "number" && value >= 0 && Number.isFinite(value))) throw new Error(`Invalid value ${quoted$1(value)} of ${name}. Expected a finite number of 0 or more`);
	};
	var DRAWN_AS = {
		column: "columns",
		bar: "bars",
		line: "a line",
		area: "an area"
	};
	/**
	* The points of a series with a value for each category, numbered from 1 as a trendline numbers them. Gaps are left out.
	*/
	var numbered = (values) => values.flatMap((value, index) => value === null ? [] : [{
		x: index + 1,
		y: value
	}]);
	/**
	* Checks a series of a column, bar, line or area chart: how it's drawn, its axis, and that its options are ones the way
	* it's drawn has.
	*
	* @param stacked - Whether the series is stacked: drawn as the chart's type, which is stacked
	*/
	var checkComboSeries = (series, type, categories, stacked) => {
		var _series$type;
		checkCategorySeries(series, categories);
		if (series.type !== void 0) {
			if (type === "bar") throw new Error(`Invalid option type for series "${series.name}". A bar chart's series are all bars`);
			if (![
				"column",
				"line",
				"area"
			].includes(series.type)) throw new Error(`Invalid type "${series.type}" for series "${series.name}". Expected "column", "line" or "area"`);
		}
		if (series.axis !== void 0 && series.axis !== "primary" && series.axis !== "secondary") throw new Error(`Invalid axis "${series.axis}" for series "${series.name}". Expected "primary" or "secondary"`);
		const drawnAs = (_series$type = series.type) !== null && _series$type !== void 0 ? _series$type : type;
		if (drawnAs !== "line") checkOptionsFor(series, [
			"markers",
			"smooth",
			"line"
		], `It is drawn as ${DRAWN_AS[drawnAs]}, and only a line has it`);
		if (drawnAs !== "column" && drawnAs !== "bar") checkOptionsFor(series, ["colors"], `It is drawn as ${DRAWN_AS[drawnAs]}, and only bars have it`);
		if (stacked && drawnAs === type) checkOptionsFor(series, ["trendlines"], "It is stacked, and a stacked series has no trendline");
		checkColors(series, categories);
		checkMarkers(series.markers);
		checkLine(series.line);
		checkPointLabels(series, categories, "categories");
		checkTrendlines(series.name, series.trendlines, numbered(series.values));
		checkErrorBars(series.name, series.errorBars, categories, "error bars");
	};
	var checkPoint = ({ x, y }, series) => {
		if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error(`Invalid point (${x}, ${y}) in series "${series}". Expected a finite x and y`);
	};
	var checkPoints = (series) => {
		const { name, points, dataLabels } = series;
		if (points.length === 0) throw new Error(`Series "${name}" has no points`);
		for (const point of points) checkPoint(point, name);
		checkDataLabels(dataLabels);
		checkPointLabels(series, points.length, "points");
		checkTrendlines(name, series.trendlines, points);
		checkErrorBars(name, series.xErrorBars, points.length, "x error bars");
		checkErrorBars(name, series.yErrorBars, points.length, "y error bars");
	};
	var checkBubbleSeries = (series) => {
		checkPoints(series);
		for (const { x, y, size } of series.points) if (!(size >= 0 && Number.isFinite(size))) throw new Error(`Invalid size ${size} of the bubble at (${x}, ${y}) in series "${series.name}". Expected a finite number of 0 or more`);
	};
	var EMPTY_VALUES$1 = [
		"gap",
		"zero",
		"connect"
	];
	/**
	* Each type's name in messages, such as "pie of pie".
	*/
	var TYPE_NAMES$1 = {
		column: "column",
		bar: "bar",
		line: "line",
		area: "area",
		pie: "pie",
		doughnut: "doughnut",
		pieOfPie: "pie of pie",
		barOfPie: "bar of pie",
		radar: "radar",
		scatter: "scatter",
		bubble: "bubble",
		stock: "stock"
	};
	/**
	* Checks what every chart can have: its size, text, areas and legend.
	*/
	var checkChartBase = (options) => {
		if (options.transformation) checkSize$1(options.transformation);
		checkTitle(options.title);
		checkFont(options.font);
		checkFont(options.legend ? options.legend.font : void 0);
		checkArea(options.chartArea);
		checkArea(options.plotArea);
		const { emptyValues, dataTable } = options;
		if (emptyValues !== void 0 && !EMPTY_VALUES$1.includes(emptyValues)) throw new Error(`Invalid option emptyValues ${quoted$1(emptyValues)}. Expected "gap", "zero" or "connect"`);
		checkFont(typeof dataTable === "object" ? dataTable.font : void 0);
	};
	/**
	* Checks the entries the legend hides: each is the text of an entry.
	*/
	var checkHiddenEntries = (options) => {
		const hidden = options.legend ? options.legend.hiddenEntries : void 0;
		if (hidden === void 0) return;
		if (!Array.isArray(hidden)) throw new Error(`Invalid hidden legend entries ${quoted$1(hidden)}. Expected a list of the entries' text`);
		const entries = legendEntriesOf(options).map(({ text }) => text);
		for (const entry of hidden) if (!entries.includes(String(entry))) {
			const all = entries.map((one) => `"${one}"`);
			throw new Error(`Invalid hidden legend entry ${quoted$1(entry)}. The legend's entries are ${all.length > 1 ? `${all.slice(0, -1).join(", ")} and ` : ""}${all[all.length - 1]}`);
		}
	};
	/**
	* Checks a pie of pie or bar of pie chart's split: the categories, value or percentage it splits the pie by.
	*/
	var checkSplit = (split, categories) => {
		if (split === void 0) return;
		const { by } = typeof split === "object" && split !== null ? split : {};
		switch (by) {
			case "position":
				checkWholeNumber(split.count, "split count", 1, categories.length);
				if (split.count === void 0) throw new Error("Invalid split. Splitting by position needs the count of the last categories that go to the second plot");
				return;
			case "value":
			case "percentage": {
				const { lessThan } = split;
				if (!(typeof lessThan === "number" && Number.isFinite(lessThan))) throw new Error(`Invalid split ${by === "value" ? "value" : "percentage"} ${quoted$1(lessThan)}. Expected a finite number`);
				if (by === "percentage") checkRange(lessThan, "split percentage", 0, 100);
				return;
			}
			case "categories": {
				const chosen = split.categories;
				if (!Array.isArray(chosen) || chosen.length === 0) throw new Error("Invalid split. Splitting by categories needs at least one category for the second plot");
				const missing = chosen.find((category) => !categories.some((one) => String(one) === String(category)));
				if (missing !== void 0) throw new Error(`Invalid split category ${quoted$1(missing)}. It isn't one of the chart's categories`);
				return;
			}
			default: throw new Error(`Invalid split ${quoted$1(by)}. Expected { by: "position", "value", "percentage" or "categories", ... }`);
		}
	};
	var checkSplitPie = (options) => {
		checkChartOptionsFor(options, ["firstSliceAngle"], "A pie of pie or bar of pie chart's first slice always starts at 12 o'clock");
		checkSplit(options.split, options.categories);
		checkRange(options.secondPlotSize, "second plot size", 5, 200);
		checkRange(options.gapWidth, "gap width", 0, 500);
		checkLine(options.seriesLines);
	};
	/**
	* Checks a stock chart: its prices and volumes, each a value for each category, with each high at least its low, and
	* each open and close between them, and options that need opening prices or volumes only with them.
	*/
	var checkStock = (options) => {
		checkChartOptionsFor(options, ["series"], "A stock chart's data is its high, low and close, and its open and volume if given");
		checkCategories(options.categories, {
			dates: true,
			groups: false,
			type: "stock"
		});
		const count = options.categories.length;
		for (const role of [
			"high",
			"low",
			"close"
		]) if (options[role] === void 0) throw new Error(`A stock chart needs its ${role} prices`);
		const series = stockSeriesOf(options);
		for (const { role, name, values } of series) {
			if (!Array.isArray(values)) throw new Error(`Invalid ${role} ${quoted$1(values)}. Expected a value for each category`);
			if (typeof name !== "string") throw new Error(`Invalid name ${quoted$1(name)} of the ${role} series. Expected text`);
			checkCategorySeries({
				name,
				values
			}, count);
			if (role === "volume") {
				const negative = values.find((value) => value !== null && value < 0);
				if (negative !== void 0) throw new Error(`Invalid volume ${negative}. Volumes can't be negative`);
			}
		}
		const { open = [], high, low, close } = options;
		const categories = options.categories.map((category) => category instanceof Date ? category.toISOString().slice(0, 10) : category);
		for (let index = 0; index < count; index++) {
			var _high$index, _low$index, _open$index, _close$index;
			const [top, bottom] = [(_high$index = high[index]) !== null && _high$index !== void 0 ? _high$index : null, (_low$index = low[index]) !== null && _low$index !== void 0 ? _low$index : null];
			if (top === null || bottom === null) continue;
			if (top < bottom) throw new Error(`The high ${top} of ${quoted$1(categories[index])} is below its low ${bottom}`);
			for (const [role, value] of [["open", (_open$index = open[index]) !== null && _open$index !== void 0 ? _open$index : null], ["close", (_close$index = close[index]) !== null && _close$index !== void 0 ? _close$index : null]]) if (value !== null && (value > top || value < bottom)) throw new Error(`The ${role} ${value} of ${quoted$1(categories[index])} isn't between its low ${bottom} and its high ${top}`);
		}
		if (options.open === void 0) checkChartOptionsFor(options, ["upBars", "downBars"], "The chart has no opening prices, so no bars from the open to the close");
		if (options.volume === void 0) checkChartOptionsFor(options, ["volumeAxis"], "The chart has no volumes");
		checkAxis(options.categoryAxis, "category axis");
		checkValueAxis(options.valueAxis, "value axis");
		checkValueAxis(options.volumeAxis, "volume axis");
		checkLine(options.highLowLines);
		checkArea(options.upBars);
		checkArea(options.downBars);
	};
	/**
	* Checks a chart's options, so mistakes show up where the chart is made.
	*
	* @throws If there are no series or categories, a value isn't a finite number or null, a series has more values than
	* there are categories or an option its type doesn't have, a pie chart has more than one series or a pie or doughnut
	* chart a negative value, a scatter or bubble point isn't finite numbers, a trendline can't be fitted to its series, a
	* stock chart's high is below its low, or an option is out of its range
	*/
	var checkChartOptions = (options) => {
		checkChartBase(options);
		if (options.type === "stock") {
			checkStock(options);
			checkHiddenEntries(options);
			return;
		}
		checkSeries(options.series);
		checkDataLabels(options.dataLabels);
		const withoutDataTable = `A ${TYPE_NAMES$1[options.type]} chart has no data table. Column, bar, line, area and stock charts have one`;
		if (options.type === "scatter" || options.type === "bubble") checkChartOptionsFor(options, ["emptyValues"], `A ${options.type} chart's points have no empty values`);
		switch (options.type) {
			case "scatter": {
				checkChartOptionsFor(options, ["dataTable"], withoutDataTable);
				const { lines = "none" } = options;
				for (const series of options.series) {
					checkPoints(series);
					checkMarkers(series.markers);
					checkLine(series.line);
					if (lines === "none") checkOptionsFor(series, ["line"], `The chart's lines are "none"`);
				}
				checkMarkers(options.markers);
				checkValueAxis(options.xAxis, "x axis");
				checkValueAxis(options.yAxis, "y axis");
				break;
			}
			case "bubble":
				checkChartOptionsFor(options, ["dataTable"], withoutDataTable);
				options.series.forEach(checkBubbleSeries);
				checkRange(options.bubbleScale, "bubble scale", 0, 300);
				checkValueAxis(options.xAxis, "x axis");
				checkValueAxis(options.yAxis, "y axis");
				break;
			case "pie":
			case "doughnut":
			case "pieOfPie":
			case "barOfPie": {
				const type = TYPE_NAMES$1[options.type];
				checkChartOptionsFor(options, ["dataTable"], withoutDataTable);
				checkChartOptionsFor(options, ["emptyValues"], `A ${type} chart leaves out the slice of an empty value`);
				checkCategories(options.categories, {
					dates: false,
					groups: false,
					type
				});
				if (options.type !== "doughnut" && options.series.length > 1) throw new Error(`A ${type} chart has one series, but ${options.series.length} were given. A doughnut chart can have more`);
				for (const series of options.series) {
					checkPieSeries(series, options.categories.length, type);
					checkOptionsFor(series, ["trendlines", "errorBars"], `A ${type} chart's series have neither`);
				}
				if (options.type === "pieOfPie" || options.type === "barOfPie") checkSplitPie(options);
				else {
					checkRange(options.firstSliceAngle, "first slice angle", 0, 360);
					checkRange(options.type === "doughnut" ? options.holeSize : void 0, "hole size", 10, 90);
				}
				break;
			}
			case "radar":
				checkChartOptionsFor(options, ["dataTable"], withoutDataTable);
				checkCategories(options.categories, {
					dates: false,
					groups: false,
					type: "radar"
				});
				for (const series of options.series) {
					checkCategorySeries(series, options.categories.length);
					checkMarkers(series.markers);
					checkLine(series.line);
					checkPointLabels(series, options.categories.length, "categories");
					checkOptionsFor(series, ["trendlines", "errorBars"], "A radar chart's series have neither");
					if (options.filled) checkOptionsFor(series, ["markers", "line"], "A filled radar chart's series have neither");
				}
				checkMarkers(options.markers);
				if (options.filled && options.markers !== void 0) throw new Error("Invalid option markers. A filled radar chart's series have no markers");
				checkAxis(options.categoryAxis, "category axis");
				checkValueAxis(options.valueAxis, "value axis");
				break;
			default: {
				var _options$stacking;
				checkCategories(options.categories, {
					dates: true,
					groups: true,
					type: options.type
				});
				const leaves = leafCategoriesOf(options.categories);
				const dates = leaves.some((category) => category instanceof Date);
				const stacked = ((_options$stacking = options.stacking) !== null && _options$stacking !== void 0 ? _options$stacking : "none") !== "none";
				options.series.forEach((series) => checkComboSeries(series, options.type, leaves.length, stacked));
				if (options.series.every(({ axis }) => axis === "secondary")) throw new Error("A chart needs at least one series on the primary axis");
				checkAxis(options.categoryAxis, "category axis");
				checkValueAxis(options.valueAxis, "value axis", dates);
				checkValueAxis(options.secondaryValueAxis, "secondary value axis", dates);
				if (options.type === "line") checkMarkers(options.markers);
				if (options.type === "column" || options.type === "bar") {
					checkRange(options.gapWidth, "gap width", 0, 500);
					checkRange(options.overlap, "overlap", -100, 100);
				}
			}
		}
		checkHiddenEntries(options);
	};
	//#endregion
	//#region src/charts/workbook/cell-reference.ts
	/**
	* References to the cells of the embedded workbook's sheet, as a chart's formulas and the sheet's cells write them.
	*
	* @module
	*/
	/** The name of the workbook's only sheet, as Word names it */
	var SHEET_NAME = "Sheet1";
	/**
	* The letters of a column, such as A for the first, Z for the 26th and AA for the 27th.
	*
	* @param column - The column's index, from 0
	*/
	var columnName = (column) => (column >= 26 ? columnName(Math.floor(column / 26) - 1) : "") + String.fromCharCode(65 + column % 26);
	/**
	* A column's index, from 0, from its letters: 0 for A, 25 for Z and 26 for AA.
	*/
	var columnIndexOf = (letters) => [...letters].reduce((index, letter) => index * 26 + letter.charCodeAt(0) - 64, 0) - 1;
	/**
	* A cell's name, such as B2.
	*
	* @param column - The column's index, from 0
	* @param row - The row's index, from 0
	*/
	var cellName = (column, row) => `${columnName(column)}${row + 1}`;
	/**
	* A formula for a cell, or for cells down a column, such as `Sheet1!$B$1` or `Sheet1!$B$2:$B$5`.
	*
	* @param column - The column's index, from 0
	* @param firstRow - The first row's index, from 0
	* @param rows - The number of rows
	*/
	var sheetReference = (column, firstRow, rows = 1) => sheetRangeReference(column, column, firstRow, rows);
	/**
	* A formula for a block of cells, such as `Sheet1!$A$2:$B$9`, or for one cell.
	*
	* @param firstColumn - The first column's index, from 0
	* @param lastColumn - The last column's index, from 0
	* @param firstRow - The first row's index, from 0
	* @param rows - The number of rows
	*/
	var sheetRangeReference = (firstColumn, lastColumn, firstRow, rows = 1) => {
		const first = `$${columnName(firstColumn)}$${firstRow + 1}`;
		return rows === 1 && firstColumn === lastColumn ? `${SHEET_NAME}!${first}` : `${SHEET_NAME}!${first}:$${columnName(lastColumn)}$${firstRow + rows}`;
	};
	//#endregion
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
	//#region src/charts/chart-data.ts
	/**
	* Lays a chart's data out as Word does in the embedded workbook's sheet: the cells, and the references to them that the
	* chart's series are written with, with the values each holds. Plain data, not XML.
	*
	* @module
	*/
	/** The size Word inserts a chart at: 6 by 3.5 inches */
	var DEFAULT_CHART_SIZE = {
		width: 576,
		height: 336
	};
	/**
	* The categories, as the sheet's first columns write them and the series refer to them: text, numbers, dates as numbers
	* with a date format, or groups, a column for each level from the outermost in.
	*/
	var createCategoryData = (categories) => {
		if (isCategoryGroups(categories)) {
			const rows = categoryRowsOf(categories);
			const width = rows[0].length;
			return {
				width,
				rows,
				data: {
					type: "levels",
					formula: sheetRangeReference(0, width - 1, 1, rows.length),
					count: rows.length,
					levels: Array.from({ length: width }, (_, level) => rows.map((row) => {
						const label = row[width - 1 - level];
						return label === void 0 ? void 0 : String(label);
					}))
				}
			};
		}
		const formula = sheetReference(0, 1, categories.length);
		if (categories.every((category) => category instanceof Date)) {
			const format = DATE_FORMATS[timeUnitOf(categories)];
			const points = categories.map(serialDate);
			return {
				width: 1,
				rows: points.map((value) => [{
					value,
					format
				}]),
				data: {
					type: "number",
					formula,
					points,
					format
				}
			};
		}
		if (categories.every((category) => typeof category === "number")) return {
			width: 1,
			rows: categories.map((category) => [category]),
			data: {
				type: "number",
				formula,
				points: categories
			}
		};
		return {
			width: 1,
			rows: categories.map((category) => [typeof category === "number" ? category : String(category)]),
			data: {
				type: "text",
				formula,
				points: categories.map(String)
			}
		};
	};
	/**
	* The columns of a series' custom error bars' amounts, with a name each, and where they are, from a column on.
	*/
	var createErrorColumns = (errorBars, heading, rows, column) => {
		if ((errorBars === null || errorBars === void 0 ? void 0 : errorBars.type) !== "custom") return { columns: [] };
		const sides = [[
			"plus",
			"+",
			errorBars.plus
		], [
			"minus",
			"-",
			errorBars.minus
		]].flatMap(([side, sign, amounts]) => amounts === void 0 ? [] : [{
			side,
			sign,
			amounts
		}]);
		const cellsOf = (amounts) => Array.from({ length: rows }, (_, row) => {
			var _amounts$row;
			return (_amounts$row = amounts[row]) !== null && _amounts$row !== void 0 ? _amounts$row : void 0;
		});
		const dataOf = (side) => {
			const index = sides.findIndex((one) => one.side === side);
			return index === -1 ? void 0 : {
				type: "number",
				formula: sheetReference(column + index, 1, rows),
				points: cellsOf(sides[index].amounts)
			};
		};
		const plus = dataOf("plus");
		const minus = dataOf("minus");
		return {
			columns: sides.map(({ sign, amounts }) => ({
				heading: `${heading} (${sign})`,
				cells: cellsOf(amounts)
			})),
			data: _objectSpread2(_objectSpread2({}, plus === void 0 ? {} : { plus }), minus === void 0 ? {} : { minus })
		};
	};
	/**
	* The sheet with columns added on the right, their headings in row 1. The sheet has a row for every cell of theirs.
	*/
	var withColumns = (sheet, columns) => sheet.map((row, index) => [...row, ...columns.map((column) => index === 0 ? column.heading : column.cells[index - 1])]);
	/**
	* Lays out a chart with categories as Word does: the series' names in row 1 after the categories' columns, the
	* categories in column A from row 2, or in columns A, B and so on when they are in groups, and each series' values below
	* its name. The top left cells are empty. Custom error bars' amounts are in columns after the series.
	*/
	var createCategoryChartData = (categories, series) => {
		const { width, rows, data: categoryData } = createCategoryData(categories);
		const values = series.map((one) => rows.map((_, index) => {
			var _one$values$index;
			return (_one$values$index = one.values[index]) !== null && _one$values$index !== void 0 ? _one$values$index : void 0;
		}));
		const sheet = [[...Array.from({ length: width }, () => void 0), ...series.map(({ name }) => name)], ...rows.map((category, row) => [...category, ...values.map((column) => column[row])])];
		const errors = series.reduce(({ next, all }, one) => {
			const columns = createErrorColumns(one.errorBars, one.name, rows.length, next);
			return {
				next: next + columns.columns.length,
				all: [...all, columns]
			};
		}, {
			next: width + series.length,
			all: []
		}).all;
		return {
			sheet: withColumns(sheet, errors.flatMap(({ columns }) => columns)),
			series: series.map(({ name }, index) => _objectSpread2({
				name: {
					type: "text",
					formula: sheetReference(width + index, 0),
					points: [name]
				},
				categories: categoryData,
				values: {
					type: "number",
					formula: sheetReference(width + index, 1, rows.length),
					points: values[index]
				}
			}, errors[index].data === void 0 ? {} : { errors: { y: errors[index].data } }))
		};
	};
	/**
	* Lays out a scatter or bubble chart. Word's scatter sheet shares one column of x values between its series, but each of
	* these series has points of its own, so each series has columns of its own: "X" above its x values, its name above its
	* y values, and for a bubble chart, "Size" above its sizes. Custom error bars' amounts are in columns after the series.
	*/
	var createPointChartData = (series, bubbles) => {
		const width = bubbles ? 3 : 2;
		const rows = Math.max(...series.map(({ points }) => points.length));
		const sizeOf = (point) => point && "size" in point ? point.size : void 0;
		const sheet = [series.flatMap(({ name }) => bubbles ? [
			"X",
			name,
			"Size"
		] : ["X", name]), ...Array.from({ length: rows }, (_, row) => series.flatMap(({ points }) => {
			const point = points[row];
			return bubbles ? [
				point === null || point === void 0 ? void 0 : point.x,
				point === null || point === void 0 ? void 0 : point.y,
				sizeOf(point)
			] : [point === null || point === void 0 ? void 0 : point.x, point === null || point === void 0 ? void 0 : point.y];
		}))];
		const errors = series.reduce(({ next, all }, { name, points, xErrorBars, yErrorBars }) => {
			const x = createErrorColumns(xErrorBars, `${name} x`, points.length, next);
			const y = createErrorColumns(yErrorBars, `${name} y`, points.length, next + x.columns.length);
			return {
				next: next + x.columns.length + y.columns.length,
				all: [...all, {
					x,
					y
				}]
			};
		}, {
			next: series.length * width,
			all: []
		}).all;
		return {
			sheet: withColumns(sheet, errors.flatMap(({ x, y }) => [...x.columns, ...y.columns])),
			series: series.map(({ name, points }, index) => {
				const column = (offset, cells) => ({
					type: "number",
					formula: sheetReference(index * width + offset, 1, points.length),
					points: cells
				});
				const { x, y } = errors[index];
				const data = _objectSpread2({
					name: {
						type: "text",
						formula: sheetReference(index * width + 1, 0),
						points: [name]
					},
					categories: column(0, points.map((point) => point.x)),
					values: column(1, points.map((point) => point.y))
				}, x.data === void 0 && y.data === void 0 ? {} : { errors: _objectSpread2(_objectSpread2({}, x.data === void 0 ? {} : { x: x.data }), y.data === void 0 ? {} : { y: y.data }) });
				return bubbles ? _objectSpread2(_objectSpread2({}, data), {}, { sizes: column(2, points.map(sizeOf)) }) : data;
			})
		};
	};
	/**
	* Checks a chart's options and lays out its data.
	*
	* @throws If an option is wrong: see {@link checkChartOptions}
	*/
	var createChartData = (options) => {
		checkChartOptions(options);
		switch (options.type) {
			case "scatter": return createPointChartData(options.series, false);
			case "bubble": return createPointChartData(options.series, true);
			case "stock": return createCategoryChartData(options.categories, stockSeriesOf(options));
			default: return createCategoryChartData(options.categories, options.series);
		}
	};
	//#endregion
	//#region src/charts/chart-elements.ts
	/**
	* Small builders for the elements charts are written with.
	*
	* @module
	*/
	/**
	* An element with its attributes, in the order given, and its children. Undefined attributes are left out.
	*/
	var createElement = (name, attributes = {}, children = []) => {
		const given = Object.entries(attributes).flatMap(([key, value]) => value === void 0 ? [] : [[key, {
			key,
			value
		}]]);
		return new docx.BuilderElement({
			name,
			attributes: given.length === 0 ? void 0 : Object.fromEntries(given),
			children
		});
	};
	/**
	* An element whose value is its `val` attribute, such as `<c:gapWidth val="219"/>`. A boolean is written as 1 or 0, as
	* Office writes them, since Office doesn't always read a missing `val` as the schema's default.
	*/
	var createValue = (name, value) => createElement(name, { val: typeof value === "boolean" ? Number(value) : value });
	/**
	* An element that holds text, such as `<c:v>Sales</c:v>`.
	*/
	var createText = (name, text) => new docx.StringContainer(name, text);
	//#endregion
	//#region src/charts/chart-color.ts
	/**
	* Colours for series, bars and slices.
	*
	* A copy of `src/shapes/preset-shape/shape-color.ts`, as `docx/charts` and `docx/shapes` are separate entries that
	* import only `docx`. Make a fix in both.
	*
	* @module
	*/
	/**
	* Checks that a percentage option is between 0 and 100 and returns it.
	*
	* @throws If the value is outside 0 to 100
	*/
	var percentageValue = (value, option) => {
		if (!(value >= 0 && value <= 100)) throw new Error(`Invalid ${option} ${value}. Expected a number from 0 to 100`);
		return value;
	};
	var THEME_COLOR_OOXML_NAMES = new Map(Object.entries({
		dark1: "dk1",
		light1: "lt1",
		dark2: "dk2",
		light2: "lt2",
		accent1: "accent1",
		accent2: "accent2",
		accent3: "accent3",
		accent4: "accent4",
		accent5: "accent5",
		accent6: "accent6",
		hyperlink: "hlink",
		followedHyperlink: "folHlink"
	}));
	var THEME_COLOR_SUGGESTIONS = new Map([
		...[...THEME_COLOR_OOXML_NAMES].map(([name, ooxml]) => [ooxml, name]),
		["text1", "dark1"],
		["background1", "light1"],
		["text2", "dark2"],
		["background2", "light2"]
	]);
	var createColorChange = ({ name, value }) => new docx.BuilderElement({
		name,
		attributes: { value: {
			key: "val",
			value
		} }
	});
	/**
	* How a theme colour is made lighter or darker, as Word does it: by scaling its luminance (`lumMod`), and for a lighter
	* colour, adding to it (`lumOff`). Both are in thousandths of a percent.
	*/
	var themeColorChanges = ({ lighter, darker }) => {
		if (lighter !== void 0 && darker !== void 0) throw new Error("Invalid theme colour. Expected lighter or darker, not both");
		if (lighter !== void 0) {
			const amount = percentageValue(lighter, "lighter");
			return [{
				name: "a:lumMod",
				value: Math.round((100 - amount) * 1e3)
			}, {
				name: "a:lumOff",
				value: Math.round(amount * 1e3)
			}];
		}
		return darker === void 0 ? [] : [{
			name: "a:lumMod",
			value: Math.round((100 - percentageValue(darker, "darker")) * 1e3)
		}];
	};
	var createThemeColor = (color, changes) => {
		const name = THEME_COLOR_OOXML_NAMES.get(color.theme);
		if (name === void 0) {
			const suggestion = THEME_COLOR_SUGGESTIONS.get(color.theme);
			throw new Error(`Invalid theme colour "${color.theme}". ${suggestion ? `Did you mean "${suggestion}"?` : `Expected one of ${[...THEME_COLOR_OOXML_NAMES.keys()].join(", ")}`}`);
		}
		return new docx.BuilderElement({
			name: "a:schemeClr",
			attributes: { value: {
				key: "val",
				value: name
			} },
			children: [...themeColorChanges(color), ...changes].map(createColorChange)
		});
	};
	/**
	* Creates an `a:srgbClr` element from a hex colour, or an `a:schemeClr` element from a colour of the document's theme,
	* with an optional transparency.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_SRgbColor">
	*   <xsd:sequence>
	*     <xsd:group ref="EG_ColorTransform" minOccurs="0" maxOccurs="unbounded"/>
	*   </xsd:sequence>
	*   <xsd:attribute name="val" type="s:ST_HexColorRGB" use="required"/>
	* </xsd:complexType>
	*
	* <xsd:complexType name="CT_SchemeColor">
	*   <xsd:sequence>
	*     <xsd:group ref="EG_ColorTransform" minOccurs="0" maxOccurs="unbounded"/>
	*   </xsd:sequence>
	*   <xsd:attribute name="val" type="ST_SchemeColorVal" use="required"/>
	* </xsd:complexType>
	* ```
	*
	* @param color - A 6-digit hex colour such as `"FF0000"` or `"#FF0000"`, or a colour of the document's theme
	* @param transparency - From 0 (opaque) to 100 (invisible)
	* @throws If the colour is not a 6-digit hex value or a colour of the theme, or a percentage is outside 0 to 100
	*
	* @example
	* ```typescript
	* createChartColor("1F4E79", 25); // <a:srgbClr val="1F4E79"><a:alpha val="75000"/></a:srgbClr>
	* createChartColor({ theme: "accent1", darker: 25 }); // <a:schemeClr val="accent1"><a:lumMod val="75000"/></a:schemeClr>
	* ```
	*/
	var createChartColor = (color, transparency) => {
		const changes = transparency ? [{
			name: "a:alpha",
			value: Math.round((100 - percentageValue(transparency, "transparency")) * 1e3)
		}] : [];
		if (typeof color !== "string") return createThemeColor(color, changes);
		if (color === "auto") throw new Error(`Invalid chart color 'auto'. Expected 6 digit hex value`);
		return new docx.BuilderElement({
			name: "a:srgbClr",
			attributes: { value: {
				key: "val",
				value: (0, docx.hexColorValue)(color)
			} },
			children: changes.map(createColorChange)
		});
	};
	//#endregion
	//#region src/charts/chart-style.ts
	var EMUS_PER_POINT = 12700;
	/**
	* A colour of the chart's theme, by the name Office's chart styles use (`tx1` for text, `bg1` for the background), as a
	* percentage of the way from the background to it: text at 65% is `tx1` with its luminance scaled to 65% and 35% added.
	*/
	var createSchemeColor = (name, changes = []) => createElement("a:schemeClr", { val: name }, changes.map((change) => createValue(change.name, change.value)));
	var textColor = (percent) => createSchemeColor("tx1", [{
		name: "a:lumMod",
		value: percent * 1e3
	}, {
		name: "a:lumOff",
		value: (100 - percent) * 1e3
	}]);
	var ACCENT_VARIATIONS = [
		[],
		[{
			name: "a:lumMod",
			value: 6e4
		}],
		[{
			name: "a:lumMod",
			value: 8e4
		}, {
			name: "a:lumOff",
			value: 2e4
		}],
		[{
			name: "a:lumMod",
			value: 8e4
		}],
		[{
			name: "a:lumMod",
			value: 6e4
		}, {
			name: "a:lumOff",
			value: 4e4
		}],
		[{
			name: "a:lumMod",
			value: 5e4
		}],
		[{
			name: "a:lumMod",
			value: 7e4
		}, {
			name: "a:lumOff",
			value: 3e4
		}],
		[{
			name: "a:lumMod",
			value: 7e4
		}],
		[{
			name: "a:lumMod",
			value: 5e4
		}, {
			name: "a:lumOff",
			value: 5e4
		}]
	];
	var LINE_DASH_OOXML_NAMES = {
		solid: "solid",
		dot: "dot",
		dash: "dash",
		longDash: "lgDash",
		dashDot: "dashDot",
		longDashDot: "lgDashDot",
		longDashDotDot: "lgDashDotDot",
		shortDash: "sysDash",
		shortDot: "sysDot",
		shortDashDot: "sysDashDot",
		shortDashDotDot: "sysDashDotDot"
	};
	var MARKER_SHAPES = [
		"circle",
		"square",
		"diamond",
		"triangle",
		"x",
		"star",
		"plus",
		"dash",
		"dot"
	];
	/**
	* The colour of a series, or of a slice of a pie: the theme's accents 1 to 6, then the six again, darker or lighter, as
	* Office colours them. After 54 the colours repeat.
	*
	* @param index - The series' or slice's index, from 0
	* @param color - A colour given for it, which is used instead
	* @param transparency - From 0 (opaque) to 100 (invisible), as Office draws bubbles at 25%
	*/
	var createSeriesColor = (index, color, transparency) => color === void 0 ? createSchemeColor(`accent${index % 6 + 1}`, [...ACCENT_VARIATIONS[Math.floor(index / 6) % ACCENT_VARIATIONS.length], ...transparency ? [{
		name: "a:alpha",
		value: (100 - transparency) * 1e3
	}] : []]) : createChartColor(color, transparency);
	var createSolidFill = (color) => createElement("a:solidFill", {}, [color]);
	var createNoFill = () => createElement("a:noFill");
	var createEffects = () => createElement("a:effectLst");
	var createDash = (dash) => {
		const name = LINE_DASH_OOXML_NAMES[dash];
		if (name === void 0) throw new Error(`Invalid line dash "${dash}". Expected one of ${Object.keys(LINE_DASH_OOXML_NAMES).join(", ")}`);
		return createValue("a:prstDash", name);
	};
	var createLine = ({ width, color, round, axis, dash }) => {
		const w = width === void 0 ? void 0 : Math.round(width * EMUS_PER_POINT);
		return createElement("a:ln", axis ? {
			w,
			cap: "flat",
			cmpd: "sng",
			algn: "ctr"
		} : {
			w,
			cap: round ? "rnd" : void 0
		}, [
			color ? createSolidFill(color) : createNoFill(),
			...color && dash ? [createDash(dash)] : [],
			...round || axis ? [createElement("a:round")] : []
		]);
	};
	/**
	* Shape properties (`c:spPr`): an optional fill and a line, then no effects, as Office writes them.
	*/
	var createShapeProperties = (fill, line) => createElement("c:spPr", {}, [
		...fill ? [fill] : [],
		line,
		createEffects()
	]);
	/**
	* No fill and no line, for titles, the legend and data labels.
	*/
	var createNoShapeProperties = () => createShapeProperties(createNoFill(), createLine({}));
	/**
	* A border given as options, over a default width and colour.
	*/
	var createBorder = (border, defaultColor) => {
		var _border$width;
		return createLine({
			width: (_border$width = border.width) !== null && _border$width !== void 0 ? _border$width : .75,
			color: border.color === void 0 ? defaultColor : createChartColor(border.color),
			dash: border.dash,
			axis: true
		});
	};
	var createAreaFill = (fill, defaultFill) => {
		if (fill === "none") return createNoFill();
		return fill === void 0 ? defaultFill : createSolidFill(createChartColor(fill));
	};
	/**
	* The chart area: filled with the background colour, with a thin light grey border, or as given.
	*/
	var createChartAreaProperties = ({ fill, border } = {}) => createShapeProperties(createAreaFill(fill, createSolidFill(createSchemeColor("bg1"))), border === "none" ? createLine({}) : createBorder(border !== null && border !== void 0 ? border : {}, textColor(15)));
	/**
	* The plot area: no fill and no border, or as given.
	*/
	var createPlotAreaProperties = ({ fill, border } = {}) => createShapeProperties(createAreaFill(fill, createNoFill()), border === void 0 || border === "none" ? createLine({}) : createBorder(border, textColor(15)));
	/**
	* A bar, column, area or slice of a series: a solid fill and no line.
	*/
	var createFilledSeriesProperties = (color) => createShapeProperties(createSolidFill(color), createLine({}));
	/**
	* A slice of a pie or doughnut: a solid fill, with a border in the background colour between it and the next slice.
	*/
	var createSliceProperties = (color) => createShapeProperties(createSolidFill(color), createLine({
		width: 1.5,
		color: createSchemeColor("lt1")
	}));
	/**
	* A series' line, over its default width, with round ends: 2.25 points for a line or radar series, and 1.5 for a
	* scatter series.
	*
	* @param color - The series' colour, which the line has unless it has a colour of its own
	*/
	var createSeriesLine = (color, width, line = {}) => {
		var _line$width;
		return createLine({
			width: (_line$width = line.width) !== null && _line$width !== void 0 ? _line$width : width,
			color: line.color === void 0 ? color : createChartColor(line.color),
			dash: line.dash,
			round: true
		});
	};
	/**
	* The line of a line or radar chart's series, 2.25 points wide with round ends, or as given.
	*/
	var createLineSeriesProperties = (color, line) => createShapeProperties(void 0, createSeriesLine(color, 2.25, line));
	/**
	* The line of a scatter chart's series, 1.5 points wide with round ends, or as given, or none.
	*/
	var createScatterSeriesProperties = (color, line) => createShapeProperties(void 0, color ? createSeriesLine(color, 1.5, line) : createLine({
		width: 2,
		round: true
	}));
	/**
	* A bubble chart's series: bubbles filled with the series' colour at 75% opacity, with no line, as Office draws them.
	*/
	var createBubbleSeriesProperties = (index, color) => createShapeProperties(createSolidFill(createSeriesColor(index, color, 25)), createLine({}));
	/**
	* A marker (`c:marker`): a circle of size 5, or the shape and size given, filled with the series' colour with a thin
	* outline in it, or none.
	*
	* @param seriesColor - Creates the series' colour, or undefined for no marker
	*/
	var createMarker = (seriesColor, { shape = "circle", size = 5 } = {}) => {
		if (!seriesColor) return createElement("c:marker", {}, [createValue("c:symbol", "none")]);
		if (!MARKER_SHAPES.includes(shape)) throw new Error(`Invalid marker shape "${shape}". Expected one of ${MARKER_SHAPES.join(", ")}`);
		return createElement("c:marker", {}, [
			createValue("c:symbol", shape),
			createValue("c:size", Math.round(size)),
			createShapeProperties(createSolidFill(seriesColor()), createLine({
				width: .75,
				color: seriesColor()
			}))
		]);
	};
	/**
	* A trendline: 1.5 points wide with round ends, in short dots of the series' colour, as Office draws them, or as given.
	*
	* @param color - The series' colour
	*/
	var createTrendlineProperties = (color, line = {}) => {
		var _line$width2, _line$dash;
		return createShapeProperties(void 0, createLine({
			width: (_line$width2 = line.width) !== null && _line$width2 !== void 0 ? _line$width2 : 1.5,
			color: line.color === void 0 ? color : createChartColor(line.color),
			dash: (_line$dash = line.dash) !== null && _line$dash !== void 0 ? _line$dash : "shortDot",
			round: true
		}));
	};
	/**
	* A line drawn between a chart's points or plots, such as error bars, a stock chart's high-low lines, or the lines
	* joining a pie to its second plot: 0.75 points wide, with flat ends, a percentage of the way from the background to the
	* text colour, or as given.
	*
	* @param percent - How far from the background to the text colour the line is, from 0 to 100
	*/
	var createChartLinesProperties = (line = {}, percent) => createShapeProperties(void 0, createBorder(line, textColor(percent)));
	/**
	* Error bars: dark grey lines 0.75 points wide, as Office draws them, or as given.
	*/
	var createErrorBarsProperties = (line) => createShapeProperties(createNoFill(), createBorder(line !== null && line !== void 0 ? line : {}, textColor(65)));
	/**
	* The bars of a stock chart from each open to each close, as Office draws them: white where the price rose, and dark
	* grey where it fell, each with a thin grey border, or as given.
	*
	* @param rising - Whether they are the bars where the price rose
	*/
	var createUpDownBarProperties = ({ fill, border } = {}, rising) => createShapeProperties(createAreaFill(fill, createSolidFill(rising ? createSchemeColor("lt1") : textColor(65))), border === "none" ? createLine({}) : createBorder(border !== null && border !== void 0 ? border : {}, textColor(65)));
	/**
	* The closing price of a stock chart without opening prices: a short dash across its high-low line, in its colour.
	*/
	var createCloseMarker = () => {
		const color = () => textColor(75);
		return createElement("c:marker", {}, [
			createValue("c:symbol", "dash"),
			createValue("c:size", 7),
			createShapeProperties(createSolidFill(color()), createLine({
				width: .75,
				color: color()
			}))
		]);
	};
	/**
	* A series drawn only by what joins its points, such as a stock chart's prices: no line.
	*/
	var createHiddenSeriesProperties = () => createShapeProperties(void 0, createLine({
		width: 1.5,
		round: true
	}));
	/**
	* The data table: no fill, with light grey borders, as Office draws it.
	*/
	var createDataTableProperties = () => createShapeProperties(createNoFill(), createBorder({}, textColor(15)));
	/**
	* Gridlines, or the line of an axis: 0.75 points wide, 15% of the way from the background to the text colour, or 25%
	* for a scatter chart's axes.
	*/
	var createAxisLine = (percent = 15) => createLine({
		width: .75,
		color: textColor(percent),
		axis: true
	});
	/**
	* An axis' shape properties: no fill, and its line.
	*/
	var createAxisProperties = (line) => createShapeProperties(createNoFill(), line !== null && line !== void 0 ? line : createLine({}));
	/**
	* Gridlines (`c:majorGridlines`).
	*/
	var createGridlines = () => createElement("c:majorGridlines", {}, [createShapeProperties(void 0, createAxisLine())]);
	/**
	* The text body's properties (`a:bodyPr`), as Office writes them for a chart's text.
	*/
	var createBodyProperties = ({ rotation = -6e7, labelMargins }) => createElement("a:bodyPr", _objectSpread2(_objectSpread2({
		rot: rotation,
		spcFirstLastPara: 1,
		vertOverflow: "ellipsis",
		vert: "horz",
		wrap: "square"
	}, labelMargins ? {
		lIns: 38100,
		tIns: 19050,
		rIns: 38100,
		bIns: 19050
	} : {}), {}, {
		anchor: "ctr",
		anchorCtr: 1
	}), labelMargins ? [createElement("a:spAutoFit")] : []);
	/**
	* The paragraph properties of a chart's text (`a:pPr` with `a:defRPr`): the theme's body font, in grey, or the font
	* given. A typeface given is for Latin and complex scripts, as Office sets it, and East Asian text keeps the theme's.
	*/
	var createParagraphProperties = ({ size, color = 65, spacing, font = {} }) => {
		var _font$size, _font$bold, _font$italics, _font$name, _font$name2;
		return createElement("a:pPr", {}, [createElement("a:defRPr", {
			sz: Math.round(((_font$size = font.size) !== null && _font$size !== void 0 ? _font$size : size) * 100),
			b: Number((_font$bold = font.bold) !== null && _font$bold !== void 0 ? _font$bold : false),
			i: Number((_font$italics = font.italics) !== null && _font$italics !== void 0 ? _font$italics : false),
			u: "none",
			strike: "noStrike",
			kern: 1200,
			spc: spacing ? 0 : void 0,
			baseline: 0
		}, [
			createSolidFill(font.color === void 0 ? textColor(color) : createChartColor(font.color)),
			createElement("a:latin", { typeface: (_font$name = font.name) !== null && _font$name !== void 0 ? _font$name : "+mn-lt" }),
			createElement("a:ea", { typeface: "+mn-ea" }),
			createElement("a:cs", { typeface: (_font$name2 = font.name) !== null && _font$name2 !== void 0 ? _font$name2 : "+mn-cs" })
		])]);
	};
	/**
	* The text properties (`c:txPr`) of an axis, the legend, a title or data labels.
	*/
	var createTextProperties = (options) => createElement("c:txPr", {}, [
		createBodyProperties(options),
		createElement("a:lstStyle"),
		createElement("a:p", {}, [createParagraphProperties(options), createElement("a:endParaRPr", { lang: "en-US" })])
	]);
	/**
	* The chart's own text properties, which Office writes empty.
	*/
	var createChartTextProperties = () => createElement("c:txPr", {}, [
		createElement("a:bodyPr"),
		createElement("a:lstStyle"),
		createElement("a:p", {}, [createElement("a:pPr", {}, [createElement("a:defRPr")]), createElement("a:endParaRPr", { lang: "en-US" })])
	]);
	//#endregion
	//#region src/charts/chart-text.ts
	/**
	* The font of a piece of the chart's text: its own, over the chart's.
	*/
	var fontOf = (chartFont, font) => chartFont === void 0 ? font : _objectSpread2(_objectSpread2({}, chartFont), font);
	/**
	* A title given as text, or as text with a font.
	*/
	var titleOf$1 = (title) => typeof title === "string" ? { text: title } : title;
	/**
	* A title, as Office writes a chart's or an axis' title: its text, not over the plot, with no fill or line. Each line of
	* the text is a paragraph.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_Title">
	*   <xsd:sequence>
	*     <xsd:element name="tx" type="CT_Tx" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="layout" type="CT_Layout" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="overlay" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="txPr" type="a:CT_TextBody" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createTitle = (title, options) => {
		var _options$rotation;
		const { text, font } = titleOf$1(title);
		const textOptions = _objectSpread2(_objectSpread2({}, options), {}, {
			rotation: (_options$rotation = options.rotation) !== null && _options$rotation !== void 0 ? _options$rotation : 0,
			font: fontOf(options.font, font)
		});
		return createElement("c:title", {}, [
			createRichText(text, textOptions),
			createValue("c:overlay", false),
			createNoShapeProperties(),
			createTextProperties(textOptions)
		]);
	};
	/**
	* Text of a title's or label's own (`c:tx` with `c:rich`), each line a paragraph, in the look given.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_Tx">
	*   <xsd:sequence>
	*     <xsd:choice minOccurs="1" maxOccurs="1">
	*       <xsd:element name="strRef" type="CT_StrRef" minOccurs="1" maxOccurs="1"/>
	*       <xsd:element name="rich" type="a:CT_TextBody" minOccurs="1" maxOccurs="1"/>
	*     </xsd:choice>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createRichText = (text, options) => createElement("c:tx", {}, [createElement("c:rich", {}, [
		createBodyProperties(options),
		createElement("a:lstStyle"),
		...text.split("\n").map((line) => createElement("a:p", {}, [createParagraphProperties(options), createElement("a:r", {}, [createElement("a:rPr", { lang: "en-US" }), createText("a:t", line)])]))
	])]);
	/**
	* A chart's title, in 14 point text above the plot.
	*/
	var createChartTitle = (title, font) => createTitle(title, {
		size: 14,
		spacing: true,
		font
	});
	/**
	* An axis' title, in 10 point text. A vertical axis' title reads from bottom to top.
	*/
	var createAxisTitle = (title, vertical, font) => createTitle(title, {
		size: 10,
		rotation: vertical ? -54e5 : 0,
		font
	});
	var TYPE_NAMES = {
		column: "Column",
		bar: "Bar",
		line: "Line",
		area: "Area",
		pie: "Pie",
		doughnut: "Doughnut",
		pieOfPie: "Pie of pie",
		barOfPie: "Bar of pie",
		radar: "Radar",
		scatter: "Scatter",
		bubble: "Bubble",
		stock: "Stock"
	};
	var MONTHS = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec"
	];
	/**
	* A date as the axis labels it by default, in UTC, as the chart reads it: "3 Jan 2025", "Jan 2025" or "2025", by the
	* unit the dates are spaced by.
	*/
	var dateText = (date, unit) => {
		const year = String(date.getUTCFullYear());
		const month = `${MONTHS[date.getUTCMonth()]} ${year}`;
		switch (unit) {
			case "years": return year;
			case "months": return month;
			default: return `${date.getUTCDate()} ${month}`;
		}
	};
	/**
	* The categories as a screen reader reads them. A category in groups is read with its groups, such as "2025 Q1".
	*/
	var categoryTexts = (categories) => {
		if (isCategoryGroups(categories)) return groupedCategoryLabelsOf(categories);
		const unit = timeUnitOf(categories.filter((category) => category instanceof Date));
		return categories.map((category) => category instanceof Date ? dateText(category, unit) : String(category));
	};
	var listOf = (name, items) => `${name}: ${items.length === 0 ? "no values" : items.join(", ")}.`;
	/**
	* A sentence for each series: its name, then each category's value, or each point. Gaps are left out.
	*/
	var describeSeries = (options) => {
		switch (options.type) {
			case "scatter": return options.series.map(({ name, points }) => listOf(name, points.map(({ x, y }) => `(${x}, ${y})`)));
			case "bubble": return options.series.map(({ name, points }) => listOf(name, points.map(({ x, y, size }) => `(${x}, ${y}) size ${size}`)));
			default: {
				const categories = categoryTexts(options.categories);
				return (options.type === "stock" ? stockSeriesOf(options) : options.series).map(({ name, values }) => listOf(name, values.flatMap((value, index) => value === null ? [] : [`${categories[index]} ${value}`])));
			}
		}
	};
	/**
	* Cuts a description that is too long at the end of the last value that fits, or in a title too long to fit, and ends
	* it with an ellipsis.
	*
	* @param heading - The length of the chart's type and title, which start the description
	*/
	var limitLength = (description, heading) => {
		if (description.length <= 1e3) return description;
		const start = description.slice(0, 999);
		const end = Math.max(start.lastIndexOf(", "), start.lastIndexOf(". "));
		return `${end >= heading ? start.slice(0, end) : start}…`;
	};
	/**
	* Describes a chart: its type and title, then each series' values, such as "Column chart, Sales. 2024: Jan 10, Feb 20,
	* Mar 30. 2025: Jan 15, Feb 25." It is at most {@link MAX_DESCRIPTION_LENGTH} characters long.
	*/
	var describeChart = (options) => {
		const title = options.title === void 0 ? "" : titleOf$1(options.title).text.replace(/\s+/g, " ").trim();
		const heading = `${TYPE_NAMES[options.type]} chart${title ? `, ${title}` : ""}.`;
		return limitLength([heading, ...describeSeries(options)].join(" "), heading.length);
	};
	/**
	* The chart's alternative text: its own, with a description of the chart when it has none and isn't decorative.
	*/
	var chartAltText = (options) => {
		const { altText, decorative } = options;
		if (decorative || (altText === null || altText === void 0 ? void 0 : altText.description)) return altText;
		const description = describeChart(options);
		return altText ? _objectSpread2(_objectSpread2({}, altText), {}, { description }) : {
			name: "",
			description,
			title: ""
		};
	};
	//#endregion
	//#region src/charts/chart-reference.ts
	/**
	* Elements that refer to a part of the package, and add it to the package when they are written.
	*
	* @module
	*/
	/**
	* An element that refers to a part of the package by its relationship id (`r:id`), and adds the part, and the
	* relationship to it, when it is written: a chart in the document (`c:chart`), or the workbook of a chart
	* (`c:externalData`).
	*/
	var PartReference = class extends docx.XmlComponent {
		constructor(name, part, { namespaces = {}, children = [] } = {}) {
			super(name);
			_defineProperty(this, "part", void 0);
			this.part = part;
			this.root.push(new docx.NextAttributeComponent(_objectSpread2(_objectSpread2({}, Object.fromEntries(Object.entries(namespaces).map(([prefix, uri]) => [prefix, {
				key: `xmlns:${prefix}`,
				value: uri
			}]))), {}, { id: {
				key: "r:id",
				value: part.relationshipId
			} })), ...children);
		}
		prepForXml(context) {
			this.part.addTo(context);
			return super.prepForXml(context);
		}
	};
	//#endregion
	//#region src/charts/plot-area/series.ts
	/**
	* A number as the chart's caches and the sheet's cells write it: JavaScript's shortest form that reads back as the same
	* number.
	*/
	var formatNumber = (value) => String(value);
	/**
	* A reference to text (`c:strRef`) with its cache (`c:strCache`), from which applications draw the chart without
	* opening the workbook.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_StrRef">
	*   <xsd:sequence>
	*     <xsd:element name="f" type="xsd:string" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="strCache" type="CT_StrData" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createTextReference = ({ formula, points }) => createElement("c:strRef", {}, [createText("c:f", formula), createElement("c:strCache", {}, [createValue("c:ptCount", points.length), ...points.map((point, index) => createElement("c:pt", { idx: index }, [createText("c:v", point)]))])]);
	/**
	* A reference to numbers (`c:numRef`) with its cache (`c:numCache`), in the cells' number format. The cache leaves out
	* empty cells, so they are gaps, and counts every cell.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_NumRef">
	*   <xsd:sequence>
	*     <xsd:element name="f" type="xsd:string" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="numCache" type="CT_NumData" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createNumberReference = ({ formula, points, format = "General" }) => createElement("c:numRef", {}, [createText("c:f", formula), createElement("c:numCache", {}, [
		createText("c:formatCode", format),
		createValue("c:ptCount", points.length),
		...points.flatMap((point, index) => point === void 0 ? [] : [createElement("c:pt", { idx: index }, [createText("c:v", formatNumber(point))])])
	])]);
	/**
	* A reference to categories in groups (`c:multiLvlStrRef`), with its cache: a level of labels (`c:lvl`) for the
	* categories, then one for each level of their groups, out to the outermost. A group's label is at its first category.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_MultiLvlStrRef">
	*   <xsd:sequence>
	*     <xsd:element name="f" type="xsd:string" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="multiLvlStrCache" type="CT_MultiLvlStrData" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	*
	* <xsd:complexType name="CT_MultiLvlStrData">
	*   <xsd:sequence>
	*     <xsd:element name="ptCount" type="CT_UnsignedInt" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="lvl" type="CT_Lvl" minOccurs="0" maxOccurs="unbounded"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createLevelsReference = ({ formula, count, levels }) => createElement("c:multiLvlStrRef", {}, [createText("c:f", formula), createElement("c:multiLvlStrCache", {}, [createValue("c:ptCount", count), ...levels.map((level) => createElement("c:lvl", {}, level.flatMap((label, index) => label === void 0 ? [] : [createElement("c:pt", { idx: index }, [createText("c:v", label)])])))])]);
	/**
	* A series' data (`c:cat`, `c:val`, `c:xVal`, `c:yVal`, `c:bubbleSize`, or an error bar's `c:plus` or `c:minus`): a
	* reference to text, numbers, or categories in groups.
	*/
	var createDataSource = (name, data) => {
		switch (data.type) {
			case "text": return createElement(name, {}, [createTextReference(data)]);
			case "levels": return createElement(name, {}, [createLevelsReference(data)]);
			default: return createElement(name, {}, [createNumberReference(data)]);
		}
	};
	/**
	* A series' name (`c:tx`): a reference to the cell it is in.
	*/
	var createSeriesName = (name) => createElement("c:tx", {}, [createTextReference(name)]);
	/**
	* The start of a series (`c:ser`): its index and order, both unique in the chart, and its name (`c:tx`).
	*
	* ## XSD Schema
	* ```xml
	* <xsd:group name="EG_SerShared">
	*   <xsd:sequence>
	*     <xsd:element name="idx" type="CT_UnsignedInt" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="order" type="CT_UnsignedInt" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="tx" type="CT_SerTx" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:group>
	* ```
	*/
	var createSeriesStart = (index, data) => [
		createValue("c:idx", index),
		createValue("c:order", index),
		createSeriesName(data.name)
	];
	/**
	* A series' categories and values (`c:cat` and `c:val`).
	*/
	var createCategoriesAndValues = (data) => [createDataSource("c:cat", data.categories), createDataSource("c:val", data.values)];
	//#endregion
	//#region src/charts/plot-area/axes.ts
	/** The primary axes, which every chart with axes has */
	var PRIMARY_AXES = {
		category: 1,
		value: 2
	};
	/** The secondary axes: a value axis on the right, and a hidden category axis for it to cross */
	var SECONDARY_AXES = {
		category: 3,
		value: 4
	};
	var CROSSINGS = {
		auto: "autoZero",
		minimum: "min",
		maximum: "max"
	};
	var isVertical = (position) => position === "l" || position === "r";
	/**
	* The start of every axis (`EG_AxShared`), up to its title. The schema puts the logarithmic base first, and the maximum
	* before the minimum.
	*/
	var createAxisStart = ({ id, position, font }, { title, visible = true, reverseOrder = false }, { logarithmicBase, maximum, minimum }, gridlines) => [
		createValue("c:axId", id),
		createElement("c:scaling", {}, [
			...logarithmicBase === void 0 ? [] : [createValue("c:logBase", formatNumber(logarithmicBase))],
			createValue("c:orientation", reverseOrder ? "maxMin" : "minMax"),
			...maximum === void 0 ? [] : [createValue("c:max", maximum)],
			...minimum === void 0 ? [] : [createValue("c:min", minimum)]
		]),
		createValue("c:delete", !visible),
		createValue("c:axPos", position),
		...gridlines ? [createGridlines()] : [],
		...title === void 0 ? [] : [createAxisTitle(title, isVertical(position), font)]
	];
	/**
	* Where an axis crosses the other: a place on it (`c:crosses`), or a value (`c:crossesAt`), which for a 100% stacked
	* chart's values is a fraction of 1, and for a date axis, a date's serial number.
	*/
	var createCrossing = (crossesAt, percent) => {
		if (crossesAt instanceof Date) return createValue("c:crossesAt", formatNumber(serialDate(crossesAt)));
		return typeof crossesAt === "number" ? createValue("c:crossesAt", formatNumber(percent ? crossesAt / 100 : crossesAt)) : createValue("c:crosses", CROSSINGS[crossesAt]);
	};
	/**
	* The end of every axis (`EG_AxShared`), after its number format: no tick marks, labels next to the axis in 9 point
	* text, turned as asked or as Office chooses, and where it crosses the other axis.
	*/
	var createAxisEnd = (placement, axis, line) => {
		var _ref, _axis$crossesAt, _placement$crossesPer;
		return [
			createValue("c:majorTickMark", placement.radar ? "cross" : "none"),
			createValue("c:minorTickMark", "none"),
			createValue("c:tickLblPos", "nextTo"),
			createAxisProperties(line),
			createTextProperties({
				size: 9,
				rotation: axis.labelRotation === void 0 ? void 0 : Math.round(axis.labelRotation * 6e4),
				font: fontOf(placement.font, axis.font)
			}),
			createValue("c:crossAx", placement.crossAxisId),
			createCrossing((_ref = (_axis$crossesAt = axis.crossesAt) !== null && _axis$crossesAt !== void 0 ? _axis$crossesAt : placement.crosses) !== null && _ref !== void 0 ? _ref : "auto", (_placement$crossesPer = placement.crossesPercent) !== null && _placement$crossesPer !== void 0 ? _placement$crossesPer : false)
		];
	};
	/**
	* The labels' number format: the one given, written as it is, or the sheet's (`sourceLinked`).
	*/
	var createNumberFormat = (given, linked) => given === void 0 ? createElement("c:numFmt", {
		formatCode: linked,
		sourceLinked: 1
	}) : createElement("c:numFmt", {
		formatCode: given,
		sourceLinked: 0
	});
	/**
	* A category axis, with a line, and gridlines if asked for. Categories that are dates are on a date axis, which spaces
	* them by date, as Excel does when a chart's categories are dates.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_CatAx">
	*   <xsd:sequence>
	*     <xsd:group ref="EG_AxShared" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="auto" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="lblAlgn" type="CT_LblAlgn" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="lblOffset" type="CT_LblOffset" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="tickLblSkip" type="CT_Skip" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="tickMarkSkip" type="CT_Skip" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="noMultiLvlLbl" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	*
	* <xsd:complexType name="CT_DateAx">
	*   <xsd:sequence>
	*     <xsd:group ref="EG_AxShared" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="auto" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="lblOffset" type="CT_LblOffset" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="baseTimeUnit" type="CT_TimeUnit" minOccurs="0" maxOccurs="1"/>
	*     ...
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*
	* @param dates - The categories' dates, when they are dates
	* @param byDate - Whether dates are spaced by date, on a date axis, or evenly, one for each category, on a text axis
	*/
	var createCategoryAxis = (placement, axis = {}, dates, byDate = true) => {
		var _ref2, _axis$gridlines, _dates$format;
		const start = createAxisStart(placement, axis, {}, (_ref2 = (_axis$gridlines = axis.gridlines) !== null && _axis$gridlines !== void 0 ? _axis$gridlines : placement.radar) !== null && _ref2 !== void 0 ? _ref2 : false);
		const end = createAxisEnd(placement, axis, createAxisLine());
		return dates && byDate ? createElement("c:dateAx", {}, [
			...start,
			createNumberFormat(axis.numberFormat, dates.format),
			...end,
			createValue("c:auto", true),
			createValue("c:lblOffset", 100),
			createValue("c:baseTimeUnit", dates.unit)
		]) : createElement("c:catAx", {}, [
			...start,
			createNumberFormat(axis.numberFormat, (_dates$format = dates === null || dates === void 0 ? void 0 : dates.format) !== null && _dates$format !== void 0 ? _dates$format : "General"),
			...end,
			createValue("c:auto", dates === void 0),
			createValue("c:lblAlgn", "ctr"),
			createValue("c:lblOffset", 100),
			createValue("c:noMultiLvlLbl", false)
		]);
	};
	/**
	* The units a value axis' labels are in, with the label that names them ("Thousands"), which Office writes, beside the
	* axis.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_DispUnits">
	*   <xsd:sequence>
	*     <xsd:choice>
	*       <xsd:element name="custUnit" type="CT_Double" minOccurs="1" maxOccurs="1"/>
	*       <xsd:element name="builtInUnit" type="CT_BuiltInUnit" minOccurs="1" maxOccurs="1"/>
	*     </xsd:choice>
	*     <xsd:element name="dispUnitsLbl" type="CT_DispUnitsLbl" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createDisplayUnits = (units, vertical, font) => createElement("c:dispUnits", {}, [createValue("c:builtInUnit", units), createElement("c:dispUnitsLbl", {}, [
		createElement("c:layout"),
		createNoShapeProperties(),
		createTextProperties({
			size: 9,
			rotation: vertical ? -54e5 : 0,
			font
		})
	])]);
	/**
	* A value axis, with gridlines unless asked not to. Its range and interval are written as given, or for a 100% stacked
	* chart, as fractions of 1.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_ValAx">
	*   <xsd:sequence>
	*     <xsd:group ref="EG_AxShared" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="crossBetween" type="CT_CrossBetween" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="majorUnit" type="CT_AxisUnit" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="minorUnit" type="CT_AxisUnit" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="dispUnits" type="CT_DispUnits" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createValueAxis = (placement, axis = {}) => {
		var _ref3, _axis$gridlines2;
		const { crossBetween, percent, scatter, radar } = placement;
		const { minimum, maximum, interval, numberFormat, logarithmicBase, displayUnits } = axis;
		const scale = (value) => formatNumber(percent ? value / 100 : value);
		return createElement("c:valAx", {}, [
			...createAxisStart(placement, axis, {
				logarithmicBase,
				maximum: maximum === void 0 ? void 0 : scale(maximum),
				minimum: minimum === void 0 ? void 0 : scale(minimum)
			}, (_ref3 = (_axis$gridlines2 = axis.gridlines) !== null && _axis$gridlines2 !== void 0 ? _axis$gridlines2 : placement.gridlines) !== null && _ref3 !== void 0 ? _ref3 : true),
			createNumberFormat(numberFormat, percent ? "0%" : "General"),
			...createAxisEnd(placement, axis, scatter ? createAxisLine(25) : radar ? createAxisLine() : void 0),
			createValue("c:crossBetween", crossBetween),
			...interval === void 0 ? [] : [createValue("c:majorUnit", scale(interval))],
			...displayUnits === void 0 ? [] : [createDisplayUnits(displayUnits, isVertical(placement.position), fontOf(placement.font, axis.font))]
		]);
	};
	/**
	* A scatter or bubble chart's axes: two value axes, the x axis along the bottom and the y axis on the left, each with
	* gridlines and a line of its own.
	*/
	var createPointAxes = (options, font) => [createValueAxis({
		id: PRIMARY_AXES.category,
		crossAxisId: PRIMARY_AXES.value,
		position: "b",
		crossBetween: "midCat",
		scatter: true,
		font
	}, options.xAxis), createValueAxis({
		id: PRIMARY_AXES.value,
		crossAxisId: PRIMARY_AXES.category,
		position: "l",
		crossBetween: "midCat",
		scatter: true,
		font
	}, options.yAxis)];
	//#endregion
	//#region src/charts/plot-area/chart-group.ts
	/**
	* How line and area charts' series are grouped (`ST_Grouping`). Bar charts call `"none"` `clustered`.
	*/
	var GROUPINGS = {
		none: "standard",
		stacked: "stacked",
		percent: "percentStacked"
	};
	/**
	* A series' labels: its own, or the chart's.
	*/
	var labelsOf = (own, chart) => own === void 0 ? chart : own;
	/**
	* The series of a chart, each with its index and data.
	*/
	var groupSeries = (series, data) => series.map((options, index) => ({
		index,
		options,
		data: data[index]
	}));
	//#endregion
	//#region src/charts/plot-area/data-labels.ts
	var BESIDE_POINTS = [
		"center",
		"left",
		"right",
		"above",
		"below"
	];
	var LABEL_PLACEMENTS = {
		bars: {
			default: "outsideEnd",
			allowed: [
				"center",
				"insideEnd",
				"insideBase",
				"outsideEnd"
			],
			name: "bars"
		},
		stackedBars: {
			default: "center",
			allowed: [
				"center",
				"insideEnd",
				"insideBase"
			],
			name: "stacked bars"
		},
		line: {
			default: "right",
			allowed: BESIDE_POINTS,
			name: "a line"
		},
		points: {
			default: "right",
			allowed: BESIDE_POINTS,
			name: "points"
		},
		pie: {
			default: "bestFit",
			allowed: [
				"center",
				"insideEnd",
				"outsideEnd",
				"bestFit"
			],
			name: "a pie"
		},
		area: {
			allowed: [],
			name: "an area"
		},
		doughnut: {
			allowed: [],
			name: "a doughnut"
		},
		radar: {
			allowed: [],
			name: "a radar chart"
		}
	};
	var POSITION_OOXML_NAMES = {
		center: "ctr",
		insideEnd: "inEnd",
		insideBase: "inBase",
		outsideEnd: "outEnd",
		left: "l",
		right: "r",
		above: "t",
		below: "b",
		bestFit: "bestFit"
	};
	/**
	* Where a series' labels go: the position given, or Office's.
	*
	* @throws If the position given isn't one the labelled shape can have
	*/
	var positionOf = (position, shape, series) => {
		const placement = LABEL_PLACEMENTS[shape];
		if (position === void 0) return placement.default && POSITION_OOXML_NAMES[placement.default];
		if (placement.allowed.length === 0) throw new Error(`Invalid data label position "${position}" for series "${series}". Labels on ${placement.name} have no position`);
		if (!placement.allowed.includes(position)) {
			const allowed = placement.allowed.map((one) => `"${one}"`);
			throw new Error(`Invalid data label position "${position}" for series "${series}". Labels on ${placement.name} can be at ${allowed.slice(0, -1).join(", ")} or ${allowed[allowed.length - 1]}`);
		}
		return POSITION_OOXML_NAMES[position];
	};
	var SHOWN = [
		"value",
		"category",
		"seriesName",
		"percentage",
		"bubbleSize"
	];
	var showsSomething = (labels) => SHOWN.some((option) => labels[option]);
	var createShown = ({ value, category, seriesName, percentage, bubbleSize }, leaderLines) => [
		createValue("c:showLegendKey", false),
		createValue("c:showVal", value !== null && value !== void 0 ? value : false),
		createValue("c:showCatName", category !== null && category !== void 0 ? category : false),
		createValue("c:showSerName", seriesName !== null && seriesName !== void 0 ? seriesName : false),
		createValue("c:showPercent", percentage !== null && percentage !== void 0 ? percentage : false),
		createValue("c:showBubbleSize", bubbleSize !== null && bubbleSize !== void 0 ? bubbleSize : false),
		...leaderLines ? [createValue("c:showLeaderLines", true)] : []
	];
	/**
	* How labels look (`EG_DLblShared`): their number format, no fill or line, 9 point text, their position and what they
	* show.
	*
	* @throws If the labels' position isn't one the labelled shape can have
	*/
	var createLabelLook = (labels, { shape, series, font }) => {
		const position = positionOf(labels.position, shape, series);
		return [
			...labels.numberFormat === void 0 ? [] : [createElement("c:numFmt", {
				formatCode: labels.numberFormat,
				sourceLinked: 0
			})],
			createNoShapeProperties(),
			createTextProperties(labelTextOptions(labels, font)),
			...position ? [createValue("c:dLblPos", position)] : []
		];
	};
	var labelTextOptions = (labels, font) => ({
		size: 9,
		color: 75,
		rotation: 0,
		labelMargins: true,
		font: fontOf(font, labels.font)
	});
	/**
	* The label of one point (`c:dLbl`), over its series' labels: its own text, or what it shows, and its position, number
	* format and font, or its series'. A point whose series' labels show something, and whose own shows nothing, has its
	* label deleted.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_DLbl">
	*   <xsd:sequence>
	*     <xsd:element name="idx" type="CT_UnsignedInt" minOccurs="1" maxOccurs="1"/>
	*     <xsd:choice>
	*       <xsd:element name="delete" type="CT_Boolean" minOccurs="1" maxOccurs="1"/>
	*       <xsd:group ref="Group_DLbl" minOccurs="1" maxOccurs="1"/>
	*     </xsd:choice>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	*
	* <xsd:group name="Group_DLbl">
	*   <xsd:sequence>
	*     <xsd:element name="layout" type="CT_Layout" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="tx" type="CT_Tx" minOccurs="0" maxOccurs="1"/>
	*     <xsd:group ref="EG_DLblShared" minOccurs="1" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:group>
	* ```
	*/
	var createPointLabel = (point, index, labels, options) => {
		var _own$position, _own$numberFormat, _own$font;
		if (point === void 0 || point === false && labels === void 0) return [];
		const own = point === false ? {} : point;
		const ownShows = own.text !== void 0 || SHOWN.some((option) => own[option] !== void 0);
		const merged = _objectSpread2(_objectSpread2({}, ownShows ? {} : labels), {}, {
			position: (_own$position = own.position) !== null && _own$position !== void 0 ? _own$position : labels === null || labels === void 0 ? void 0 : labels.position,
			numberFormat: (_own$numberFormat = own.numberFormat) !== null && _own$numberFormat !== void 0 ? _own$numberFormat : labels === null || labels === void 0 ? void 0 : labels.numberFormat,
			font: (_own$font = own.font) !== null && _own$font !== void 0 ? _own$font : labels === null || labels === void 0 ? void 0 : labels.font
		}, ownShows ? Object.fromEntries(SHOWN.map((option) => [option, own[option]])) : {});
		if (point === false || own.text === void 0 && !showsSomething(merged)) return labels === void 0 ? [] : [createElement("c:dLbl", {}, [createValue("c:idx", index), createValue("c:delete", true)])];
		return [createElement("c:dLbl", {}, [createValue("c:idx", index), ...own.text === void 0 ? [...createLabelLook(merged, options), ...createShown(merged)] : [
			createRichText(own.text, _objectSpread2(_objectSpread2({}, labelTextOptions(merged, options.font)), {}, { rotation: 0 })),
			...createLabelLook(merged, options),
			...createShown({ value: true })
		]])];
	};
	/**
	* A series' labels, in 9 point text, and the labels of its single points, or none when neither shows anything. A number
	* format given is written as it is, not linked to the sheet's.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_DLbls">
	*   <xsd:sequence>
	*     <xsd:element name="dLbl" type="CT_DLbl" minOccurs="0" maxOccurs="unbounded"/>
	*     <xsd:choice>
	*       <xsd:element name="delete" type="CT_Boolean" minOccurs="1" maxOccurs="1"/>
	*       <xsd:group ref="Group_DLbls" minOccurs="1" maxOccurs="1"/>
	*     </xsd:choice>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	*
	* <xsd:group name="EG_DLblShared">
	*   <xsd:sequence>
	*     <xsd:element name="numFmt" type="CT_NumFmt" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="txPr" type="a:CT_TextBody" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="dLblPos" type="CT_DLblPos" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="showLegendKey" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="showVal" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="showCatName" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="showSerName" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="showPercent" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="showBubbleSize" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="separator" type="xsd:string" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:group>
	* ```
	*
	* @throws If a position isn't one the labelled shape can have
	*/
	var createSeriesDataLabels = (labels, options) => {
		var _options$pointLabels;
		const shown = labels && showsSomething(labels) ? labels : void 0;
		const points = ((_options$pointLabels = options.pointLabels) !== null && _options$pointLabels !== void 0 ? _options$pointLabels : []).flatMap((point, index) => createPointLabel(point, index, shown, options));
		if (shown === void 0 && points.length === 0) return [];
		return [createElement("c:dLbls", {}, [...points, ...shown === void 0 ? createShown({}, options.leaderLines) : [...createLabelLook(shown, options), ...createShown(shown, options.leaderLines)]])];
	};
	/**
	* A chart group's labels, which show nothing, as Word writes them. Each series' own labels come first.
	*/
	var createGroupDataLabels = (leaderLines) => createElement("c:dLbls", {}, createShown({}, leaderLines));
	//#endregion
	//#region src/charts/plot-area/error-bars.ts
	var VALUE_TYPES = {
		fixed: "fixedVal",
		percentage: "percentage",
		standardDeviation: "stdDev",
		standardError: "stdErr",
		custom: "cust"
	};
	/**
	* Which way custom error bars go: the ways their amounts are given.
	*/
	var customDirectionOf = ({ plus, minus }) => {
		if (plus !== void 0 && minus !== void 0) return "both";
		return plus === void 0 ? "minus" : "plus";
	};
	/**
	* Error bars, as Office writes them: in a direction, which is `y` for a chart with categories, whichever way its bars
	* go, as Excel has it, with end caps unless asked not to. A custom one's amounts are references to its cells.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_ErrBars">
	*   <xsd:sequence>
	*     <xsd:element name="errDir" type="CT_ErrDir" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="errBarType" type="CT_ErrBarType" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="errValType" type="CT_ErrValType" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="noEndCap" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="plus" type="CT_NumDataSource" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="minus" type="CT_NumDataSource" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="val" type="CT_Double" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*
	* @param direction - The axis the bars go along
	* @param data - Where custom error bars' amounts are in the sheet
	*/
	var createErrorBars = (errorBars, direction, data) => {
		var _errorBars$value, _errorBars$direction, _errorBars$endCaps;
		if (errorBars === void 0) return [];
		const custom = errorBars.type === "custom" ? data : void 0;
		const value = errorBars.type === "standardDeviation" ? (_errorBars$value = errorBars.value) !== null && _errorBars$value !== void 0 ? _errorBars$value : 1 : "value" in errorBars ? errorBars.value : void 0;
		return [createElement("c:errBars", {}, [
			createValue("c:errDir", direction),
			createValue("c:errBarType", errorBars.type === "custom" ? customDirectionOf(custom) : (_errorBars$direction = errorBars.direction) !== null && _errorBars$direction !== void 0 ? _errorBars$direction : "both"),
			createValue("c:errValType", VALUE_TYPES[errorBars.type]),
			createValue("c:noEndCap", !((_errorBars$endCaps = errorBars.endCaps) !== null && _errorBars$endCaps !== void 0 ? _errorBars$endCaps : true)),
			...(custom === null || custom === void 0 ? void 0 : custom.plus) ? [createDataSource("c:plus", custom.plus)] : [],
			...(custom === null || custom === void 0 ? void 0 : custom.minus) ? [createDataSource("c:minus", custom.minus)] : [],
			...value === void 0 ? [] : [createValue("c:val", formatNumber(value))],
			createErrorBarsProperties(errorBars.line)
		])];
	};
	//#endregion
	//#region src/charts/plot-area/trendline.ts
	var TRENDLINE_OOXML_NAMES = {
		linear: "linear",
		exponential: "exp",
		logarithmic: "log",
		polynomial: "poly",
		power: "power",
		movingAverage: "movingAvg"
	};
	/**
	* The label of a trendline's equation and R² value, in 9 point text, as Office writes it.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_TrendlineLbl">
	*   <xsd:sequence>
	*     <xsd:element name="layout" type="CT_Layout" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="tx" type="CT_Tx" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="numFmt" type="CT_NumFmt" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="txPr" type="a:CT_TextBody" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createTrendlineLabel = ({ label = {} }, font) => {
		var _label$numberFormat;
		return createElement("c:trendlineLbl", {}, [
			createElement("c:layout"),
			createElement("c:numFmt", {
				formatCode: (_label$numberFormat = label.numberFormat) !== null && _label$numberFormat !== void 0 ? _label$numberFormat : "General",
				sourceLinked: 0
			}),
			createNoShapeProperties(),
			createTextProperties({
				size: 9,
				rotation: 0,
				font: fontOf(font, label.font)
			})
		]);
	};
	/**
	* A series' trendlines, each a dotted line in the series' colour, with its equation and R² value if asked for. A
	* trendline without a name of its own is named in the legend by the application, as Office names it, such as "Linear
	* (Sales)", in its own language.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_Trendline">
	*   <xsd:sequence>
	*     <xsd:element name="name" type="xsd:string" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="trendlineType" type="CT_TrendlineType" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="order" type="CT_Order" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="period" type="CT_Period" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="forward" type="CT_Double" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="backward" type="CT_Double" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="intercept" type="CT_Double" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="dispRSqr" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="dispEq" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="trendlineLbl" type="CT_TrendlineLbl" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*
	* @param seriesColor - Creates the series' colour
	* @param font - The chart's font
	*/
	var createTrendlines = (trendlines = [], seriesColor, font) => trendlines.map((trendline) => {
		var _trendline$order, _trendline$period;
		const { type, name, forecastForward, forecastBackward, intercept, equation = false, rSquared = false } = trendline;
		const numbers = [
			["c:forward", forecastForward],
			["c:backward", forecastBackward],
			["c:intercept", intercept]
		];
		return createElement("c:trendline", {}, [
			...name === void 0 ? [] : [createText("c:name", name)],
			createTrendlineProperties(seriesColor(), trendline.line),
			createValue("c:trendlineType", TRENDLINE_OOXML_NAMES[type]),
			...type === "polynomial" ? [createValue("c:order", (_trendline$order = trendline.order) !== null && _trendline$order !== void 0 ? _trendline$order : 2)] : [],
			...type === "movingAverage" ? [createValue("c:period", (_trendline$period = trendline.period) !== null && _trendline$period !== void 0 ? _trendline$period : 2)] : [],
			...numbers.flatMap(([element, value]) => value === void 0 ? [] : [createValue(element, formatNumber(value))]),
			createValue("c:dispRSqr", rSquared),
			createValue("c:dispEq", equation),
			...equation || rSquared ? [createTrendlineLabel(trendline, font)] : []
		]);
	});
	//#endregion
	//#region src/charts/plot-area/bubble-chart.ts
	/**
	* A bubble chart, with two value axes. Each bubble is filled with its series' colour at 75% opacity, as Office draws
	* them, so the bubbles behind show through.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_BubbleChart">
	*   <xsd:sequence>
	*     <xsd:element name="varyColors" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="ser" type="CT_BubbleSer" minOccurs="0" maxOccurs="unbounded"/>
	*     <xsd:element name="dLbls" type="CT_DLbls" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="bubble3D" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="bubbleScale" type="CT_BubbleScale" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="showNegBubbles" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="sizeRepresents" type="CT_SizeRepresents" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="axId" type="CT_UnsignedInt" minOccurs="2" maxOccurs="2"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	*
	* <xsd:complexType name="CT_BubbleSer">
	*   <xsd:sequence>
	*     <xsd:group ref="EG_SerShared" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="invertIfNegative" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="dPt" type="CT_DPt" minOccurs="0" maxOccurs="unbounded"/>
	*     <xsd:element name="dLbls" type="CT_DLbls" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="trendline" type="CT_Trendline" minOccurs="0" maxOccurs="unbounded"/>
	*     <xsd:element name="errBars" type="CT_ErrBars" minOccurs="0" maxOccurs="2"/>
	*     <xsd:element name="xVal" type="CT_AxDataSource" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="yVal" type="CT_NumDataSource" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="bubbleSize" type="CT_NumDataSource" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="bubble3D" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createBubbleChart = (options, data, font) => {
		var _options$bubbleScale;
		return {
			groups: [createElement("c:bubbleChart", {}, [
				createValue("c:varyColors", false),
				...data.series.map((series, index) => {
					var _series$errors, _series$errors2;
					const own = options.series[index];
					return createElement("c:ser", {}, [
						...createSeriesStart(index, series),
						createBubbleSeriesProperties(index, own.color),
						createValue("c:invertIfNegative", false),
						...createSeriesDataLabels(labelsOf(own.dataLabels, options.dataLabels), {
							shape: "points",
							series: own.name,
							font,
							pointLabels: own.pointLabels
						}),
						...createTrendlines(own.trendlines, () => createSeriesColor(index, own.color), font),
						...createErrorBars(own.xErrorBars, "x", (_series$errors = series.errors) === null || _series$errors === void 0 ? void 0 : _series$errors.x),
						...createErrorBars(own.yErrorBars, "y", (_series$errors2 = series.errors) === null || _series$errors2 === void 0 ? void 0 : _series$errors2.y),
						createDataSource("c:xVal", series.categories),
						createDataSource("c:yVal", series.values),
						createDataSource("c:bubbleSize", series.sizes),
						createValue("c:bubble3D", false)
					]);
				}),
				createGroupDataLabels(),
				createValue("c:bubbleScale", Math.round((_options$bubbleScale = options.bubbleScale) !== null && _options$bubbleScale !== void 0 ? _options$bubbleScale : 100)),
				createValue("c:showNegBubbles", false),
				createValue("c:sizeRepresents", options.sizeRepresents === "width" ? "w" : "area"),
				createValue("c:axId", PRIMARY_AXES.category),
				createValue("c:axId", PRIMARY_AXES.value)
			])],
			axes: createPointAxes(options, font)
		};
	};
	//#endregion
	//#region src/charts/plot-area/area-chart.ts
	/**
	* A group of areas.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_AreaChart">
	*   <xsd:sequence>
	*     <xsd:group ref="EG_AreaChartShared" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="axId" type="CT_UnsignedInt" minOccurs="2" maxOccurs="2"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	*
	* <xsd:complexType name="CT_AreaSer">
	*   <xsd:sequence>
	*     <xsd:group ref="EG_SerShared" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="pictureOptions" type="CT_PictureOptions" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="dPt" type="CT_DPt" minOccurs="0" maxOccurs="unbounded"/>
	*     <xsd:element name="dLbls" type="CT_DLbls" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="trendline" type="CT_Trendline" minOccurs="0" maxOccurs="unbounded"/>
	*     <xsd:element name="errBars" type="CT_ErrBars" minOccurs="0" maxOccurs="2"/>
	*     <xsd:element name="cat" type="CT_AxDataSource" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="val" type="CT_NumDataSource" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createAreaChart = ({ series, stacking, axes, dataLabels, font }) => createElement("c:areaChart", {}, [
		createValue("c:grouping", GROUPINGS[stacking]),
		createValue("c:varyColors", false),
		...series.map(({ index, options, data }) => {
			var _data$errors;
			return createElement("c:ser", {}, [
				...createSeriesStart(index, data),
				createFilledSeriesProperties(createSeriesColor(index, options.color)),
				...createSeriesDataLabels(labelsOf(options.dataLabels, dataLabels), {
					shape: "area",
					series: options.name,
					font,
					pointLabels: options.pointLabels
				}),
				...createTrendlines(options.trendlines, () => createSeriesColor(index, options.color), font),
				...createErrorBars(options.errorBars, "y", (_data$errors = data.errors) === null || _data$errors === void 0 ? void 0 : _data$errors.y),
				...createCategoriesAndValues(data)
			]);
		}),
		createGroupDataLabels(),
		createValue("c:axId", axes.category),
		createValue("c:axId", axes.value)
	]);
	//#endregion
	//#region src/charts/plot-area/bar-chart.ts
	/**
	* A bar's own colour (`c:dPt`), as Word writes it when one bar of a series is given a colour of its own.
	*/
	var createBarColors = (colors = []) => colors.flatMap((color, point) => color === void 0 ? [] : [createElement("c:dPt", {}, [
		createValue("c:idx", point),
		createValue("c:invertIfNegative", false),
		createValue("c:bubble3D", false),
		createFilledSeriesProperties(createChartColor(color))
	])]);
	/**
	* A group of columns or bars. A bar chart's categories are on the left and its values along the bottom.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_BarChart">
	*   <xsd:sequence>
	*     <xsd:group ref="EG_BarChartShared" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="gapWidth" type="CT_GapAmount" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="overlap" type="CT_Overlap" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="serLines" type="CT_ChartLines" minOccurs="0" maxOccurs="unbounded"/>
	*     <xsd:element name="axId" type="CT_UnsignedInt" minOccurs="2" maxOccurs="2"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	*
	* <xsd:group name="EG_BarChartShared">
	*   <xsd:sequence>
	*     <xsd:element name="barDir" type="CT_BarDir" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="grouping" type="CT_BarGrouping" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="varyColors" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="ser" type="CT_BarSer" minOccurs="0" maxOccurs="unbounded"/>
	*     <xsd:element name="dLbls" type="CT_DLbls" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:group>
	*
	* <xsd:complexType name="CT_BarSer">
	*   <xsd:sequence>
	*     <xsd:group ref="EG_SerShared" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="invertIfNegative" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="pictureOptions" type="CT_PictureOptions" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="dPt" type="CT_DPt" minOccurs="0" maxOccurs="unbounded"/>
	*     <xsd:element name="dLbls" type="CT_DLbls" minOccurs="0" maxOccurs="1"/>
	*     ...
	*     <xsd:element name="cat" type="CT_AxDataSource" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="val" type="CT_NumDataSource" minOccurs="0" maxOccurs="1"/>
	*     ...
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createBarChart = ({ series, stacking, axes, dataLabels, font, horizontal, gapWidth, overlap }) => {
		const stacked = stacking !== "none";
		const gap = gapWidth !== null && gapWidth !== void 0 ? gapWidth : stacked ? 150 : horizontal ? 182 : 219;
		const overlapping = stacked ? 100 : overlap !== null && overlap !== void 0 ? overlap : horizontal ? 0 : -27;
		return createElement("c:barChart", {}, [
			createValue("c:barDir", horizontal ? "bar" : "col"),
			createValue("c:grouping", stacked ? GROUPINGS[stacking] : "clustered"),
			createValue("c:varyColors", false),
			...series.map(({ index, options, data }) => {
				var _data$errors;
				return createElement("c:ser", {}, [
					...createSeriesStart(index, data),
					createFilledSeriesProperties(createSeriesColor(index, options.color)),
					createValue("c:invertIfNegative", false),
					...createBarColors(options.colors),
					...createSeriesDataLabels(labelsOf(options.dataLabels, dataLabels), {
						shape: stacked ? "stackedBars" : "bars",
						series: options.name,
						font,
						pointLabels: options.pointLabels
					}),
					...createTrendlines(options.trendlines, () => createSeriesColor(index, options.color), font),
					...createErrorBars(options.errorBars, "y", (_data$errors = data.errors) === null || _data$errors === void 0 ? void 0 : _data$errors.y),
					...createCategoriesAndValues(data)
				]);
			}),
			createGroupDataLabels(),
			createValue("c:gapWidth", Math.round(gap)),
			createValue("c:overlap", Math.round(overlapping)),
			createValue("c:axId", axes.category),
			createValue("c:axId", axes.value)
		]);
	};
	//#endregion
	//#region src/charts/plot-area/line-chart.ts
	/**
	* A marker for each point of a series, or none: the series' own markers, or the chart's.
	*
	* @param seriesColor - Creates the series' colour
	*/
	var createSeriesMarker = (markers, seriesColor) => createMarker(markers ? seriesColor : void 0, typeof markers === "object" ? markers : void 0);
	/**
	* A group of lines. Its lines are 2.25 points wide, with a circle at each point when they have markers, unless asked
	* otherwise.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_LineChart">
	*   <xsd:sequence>
	*     <xsd:group ref="EG_LineChartShared" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="hiLowLines" type="CT_ChartLines" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="upDownBars" type="CT_UpDownBars" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="marker" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="smooth" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="axId" type="CT_UnsignedInt" minOccurs="2" maxOccurs="2"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	*
	* <xsd:complexType name="CT_LineSer">
	*   <xsd:sequence>
	*     <xsd:group ref="EG_SerShared" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="marker" type="CT_Marker" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="dPt" type="CT_DPt" minOccurs="0" maxOccurs="unbounded"/>
	*     <xsd:element name="dLbls" type="CT_DLbls" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="trendline" type="CT_Trendline" minOccurs="0" maxOccurs="unbounded"/>
	*     <xsd:element name="errBars" type="CT_ErrBars" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="cat" type="CT_AxDataSource" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="val" type="CT_NumDataSource" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="smooth" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createLineChart = ({ series, stacking, axes, dataLabels, font, markers, smooth }) => {
		const markersOf = (options) => {
			var _options$markers;
			return (_options$markers = options.markers) !== null && _options$markers !== void 0 ? _options$markers : markers;
		};
		return createElement("c:lineChart", {}, [
			createValue("c:grouping", GROUPINGS[stacking]),
			createValue("c:varyColors", false),
			...series.map(({ index, options, data }) => {
				var _data$errors, _ref, _options$smooth;
				const seriesColor = () => createSeriesColor(index, options.color);
				return createElement("c:ser", {}, [
					...createSeriesStart(index, data),
					createLineSeriesProperties(seriesColor(), options.line),
					createSeriesMarker(markersOf(options), seriesColor),
					...createSeriesDataLabels(labelsOf(options.dataLabels, dataLabels), {
						shape: "line",
						series: options.name,
						font,
						pointLabels: options.pointLabels
					}),
					...createTrendlines(options.trendlines, seriesColor, font),
					...createErrorBars(options.errorBars, "y", (_data$errors = data.errors) === null || _data$errors === void 0 ? void 0 : _data$errors.y),
					...createCategoriesAndValues(data),
					createValue("c:smooth", (_ref = (_options$smooth = options.smooth) !== null && _options$smooth !== void 0 ? _options$smooth : smooth) !== null && _ref !== void 0 ? _ref : false)
				]);
			}),
			createGroupDataLabels(),
			...series.some(({ options }) => markersOf(options)) ? [createValue("c:marker", true)] : [],
			createValue("c:axId", axes.category),
			createValue("c:axId", axes.value)
		]);
	};
	//#endregion
	//#region src/charts/plot-area/category-chart.ts
	var KINDS = [
		"area",
		"bars",
		"line"
	];
	var kindOf$1 = (type) => {
		switch (type) {
			case "line": return "line";
			case "area": return "area";
			default: return "bars";
		}
	};
	/**
	* The group of series drawn one way against one pair of axes.
	*/
	var createGroup = (options, kind, group) => {
		switch (kind) {
			case "area": return createAreaChart(group);
			case "line": return createLineChart(_objectSpread2(_objectSpread2({}, group), {}, {
				markers: options.type === "line" ? options.markers : void 0,
				smooth: options.type === "line" ? options.smooth : void 0
			}));
			default: return createBarChart(_objectSpread2(_objectSpread2({}, group), {}, {
				horizontal: options.type === "bar",
				gapWidth: options.type === "column" || options.type === "bar" ? options.gapWidth : void 0,
				overlap: options.type === "column" || options.type === "bar" ? options.overlap : void 0
			}));
		}
	};
	/**
	* The categories' dates, when they are dates: the unit to space them by, and how they are written.
	*/
	var datesOf = (categories) => {
		const dates = leafCategoriesOf(categories).filter((category) => category instanceof Date);
		if (dates.length === 0) return;
		const unit = timeUnitOf(dates);
		return {
			unit,
			format: DATE_FORMATS[unit]
		};
	};
	/**
	* A column, bar, line or area chart: a group for each way its series are drawn against each value axis, then its axes.
	*
	* - Groups are written areas first, then bars, then lines, and those against the primary axis before those against the
	*   secondary, so each is drawn in front of the one before, as Office draws them.
	* - `stacking` stacks the groups drawn as the chart's `type`, and the chart's label position is for them. The others
	*   aren't stacked, and keep Office's label positions.
	* - The secondary value axis is on the right (or for a bar chart, at the top), with no gridlines. It crosses a hidden
	*   secondary category axis, which is in the same order as the primary one, so each series lines up with its category,
	*   at its end away from the primary value axis.
	* - The value axes cross at the categories (`midCat`) only when every series is an area, so the areas reach both sides of
	*   the plot, as in Word's and Excel's area charts, and the categories line up for every group.
	*/
	var createCategoryCharts = (options, data, font) => {
		var _options$stacking, _options$categoryAxis, _options$categoryAxis2;
		const series = groupSeries(options.series, data.series);
		const stacking = (_options$stacking = options.stacking) !== null && _options$stacking !== void 0 ? _options$stacking : "none";
		const ownKind = kindOf$1(options.type);
		const horizontal = options.type === "bar";
		const kindOfSeries = ({ options: one }) => {
			var _one$type;
			return kindOf$1((_one$type = one.type) !== null && _one$type !== void 0 ? _one$type : options.type);
		};
		const axisOf = ({ options: one }) => {
			var _one$axis;
			return (_one$axis = one.axis) !== null && _one$axis !== void 0 ? _one$axis : "primary";
		};
		const groupsOn = (axis, ids) => KINDS.flatMap((kind) => {
			const members = series.filter((one) => axisOf(one) === axis && kindOfSeries(one) === kind);
			return members.length === 0 ? [] : [createGroup(options, kind, {
				series: members,
				stacking: kind === ownKind ? stacking : "none",
				axes: ids,
				dataLabels: kind === ownKind || !options.dataLabels ? options.dataLabels : _objectSpread2(_objectSpread2({}, options.dataLabels), {}, { position: void 0 }),
				font
			})];
		});
		const percentOn = (axis) => stacking === "percent" && series.some((one) => axisOf(one) === axis && kindOfSeries(one) === ownKind);
		const secondary = series.some((one) => axisOf(one) === "secondary");
		const dates = datesOf(options.categories);
		const crossBetween = series.every((one) => kindOfSeries(one) === "area") ? "midCat" : "between";
		return {
			groups: [...groupsOn("primary", PRIMARY_AXES), ...secondary ? groupsOn("secondary", SECONDARY_AXES) : []],
			axes: [
				createCategoryAxis({
					id: PRIMARY_AXES.category,
					crossAxisId: PRIMARY_AXES.value,
					position: horizontal ? "l" : "b",
					crossesPercent: percentOn("primary"),
					font
				}, options.categoryAxis, dates),
				createValueAxis({
					id: PRIMARY_AXES.value,
					crossAxisId: PRIMARY_AXES.category,
					position: horizontal ? "b" : "l",
					crossBetween,
					percent: percentOn("primary"),
					font
				}, options.valueAxis),
				...secondary ? [createValueAxis({
					id: SECONDARY_AXES.value,
					crossAxisId: SECONDARY_AXES.category,
					position: horizontal ? "t" : "r",
					crosses: ((_options$categoryAxis = options.categoryAxis) === null || _options$categoryAxis === void 0 ? void 0 : _options$categoryAxis.reverseOrder) ? "minimum" : "maximum",
					crossBetween,
					percent: percentOn("secondary"),
					gridlines: false,
					font
				}, options.secondaryValueAxis), createCategoryAxis({
					id: SECONDARY_AXES.category,
					crossAxisId: SECONDARY_AXES.value,
					position: horizontal ? "l" : "b",
					crossesPercent: percentOn("secondary")
				}, {
					visible: false,
					reverseOrder: (_options$categoryAxis2 = options.categoryAxis) === null || _options$categoryAxis2 === void 0 ? void 0 : _options$categoryAxis2.reverseOrder
				}, dates)] : []
			]
		};
	};
	//#endregion
	//#region src/charts/plot-area/pie-chart.ts
	var SPLIT_TYPES = {
		position: "pos",
		value: "val",
		percentage: "percent",
		categories: "cust"
	};
	/**
	* How a pie of pie or bar of pie chart splits its pie, written out, so every application splits it the same way: as
	* given, or by default, the last third of the categories, rounded up, go to the second plot.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_OfPieChart">
	*   <xsd:sequence>
	*     <xsd:element name="ofPieType" type="CT_OfPieType" minOccurs="1" maxOccurs="1"/>
	*     <xsd:group ref="EG_PieChartShared" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="gapWidth" type="CT_GapAmount" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="splitType" type="CT_SplitType" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="splitPos" type="CT_Double" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="custSplit" type="CT_CustSplit" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="secondPieSize" type="CT_SecondPieSize" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="serLines" type="CT_ChartLines" minOccurs="0" maxOccurs="unbounded"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createSplit = (options) => {
		var _options$split, _options$gapWidth, _options$secondPlotSi;
		const split = (_options$split = options.split) !== null && _options$split !== void 0 ? _options$split : {
			by: "position",
			count: Math.max(1, Math.ceil(options.categories.length / 3))
		};
		const position = (() => {
			switch (split.by) {
				case "categories": {
					const chosen = split.categories.map(String);
					return [createElement("c:custSplit", {}, options.categories.flatMap((category, index) => chosen.includes(String(category)) ? [index] : []).map((point) => createValue("c:secondPiePt", point)))];
				}
				case "position": return [createValue("c:splitPos", split.count)];
				default: return [createValue("c:splitPos", formatNumber(split.lessThan))];
			}
		})();
		return [
			createValue("c:gapWidth", Math.round((_options$gapWidth = options.gapWidth) !== null && _options$gapWidth !== void 0 ? _options$gapWidth : 100)),
			createValue("c:splitType", SPLIT_TYPES[split.by]),
			...position,
			createValue("c:secondPieSize", Math.round((_options$secondPlotSi = options.secondPlotSize) !== null && _options$secondPlotSi !== void 0 ? _options$secondPlotSi : 75)),
			createElement("c:serLines", {}, [createChartLinesProperties(options.seriesLines, 35)])
		];
	};
	/**
	* How far a slice is pulled out, if it is on its own: an amount for each slice.
	*/
	var explosionOf = ({ explosion }, slice) => {
		const amount = Array.isArray(explosion) ? explosion[slice] : void 0;
		return amount === void 0 ? [] : [createValue("c:explosion", Math.round(amount))];
	};
	/**
	* A pie, doughnut, pie of pie or bar of pie chart, which has no axes. Each slice takes the next colour, or its own, with a border between it and
	* the next, and a slice has the same colour in each ring of a doughnut, as the legend shows the categories.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_PieChart">
	*   <xsd:sequence>
	*     <xsd:group ref="EG_PieChartShared" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="firstSliceAng" type="CT_FirstSliceAng" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	*
	* <xsd:complexType name="CT_DoughnutChart">
	*   <xsd:sequence>
	*     <xsd:group ref="EG_PieChartShared" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="firstSliceAng" type="CT_FirstSliceAng" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="holeSize" type="CT_HoleSize" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	*
	* <xsd:complexType name="CT_DPt">
	*   <xsd:sequence>
	*     <xsd:element name="idx" type="CT_UnsignedInt" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="invertIfNegative" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="marker" type="CT_Marker" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="bubble3D" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="explosion" type="CT_UnsignedInt" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
	*     ...
	*   </xsd:sequence>
	* </xsd:complexType>
	*
	* <xsd:complexType name="CT_PieSer">
	*   <xsd:sequence>
	*     <xsd:group ref="EG_SerShared" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="explosion" type="CT_UnsignedInt" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="dPt" type="CT_DPt" minOccurs="0" maxOccurs="unbounded"/>
	*     <xsd:element name="dLbls" type="CT_DLbls" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="cat" type="CT_AxDataSource" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="val" type="CT_NumDataSource" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createPieChart = (options, data, font) => {
		var _options$firstSliceAn, _options$holeSize;
		const { type } = options;
		const split = type === "pieOfPie" || type === "barOfPie";
		return {
			groups: [createElement(split ? "c:ofPieChart" : type === "doughnut" ? "c:doughnutChart" : "c:pieChart", {}, [
				...split ? [createValue("c:ofPieType", type === "pieOfPie" ? "pie" : "bar")] : [],
				createValue("c:varyColors", true),
				...data.series.map((series, index) => {
					const own = options.series[index];
					return createElement("c:ser", {}, [
						...createSeriesStart(index, series),
						...typeof own.explosion === "number" ? [createValue("c:explosion", Math.round(own.explosion))] : [],
						...options.categories.map((_, slice) => {
							var _own$colors;
							return createElement("c:dPt", {}, [
								createValue("c:idx", slice),
								createValue("c:bubble3D", false),
								...explosionOf(own, slice),
								createSliceProperties(createSeriesColor(slice, (_own$colors = own.colors) === null || _own$colors === void 0 ? void 0 : _own$colors[slice]))
							]);
						}),
						...createSeriesDataLabels(labelsOf(own.dataLabels, options.dataLabels), {
							shape: type === "doughnut" ? "doughnut" : "pie",
							series: own.name,
							leaderLines: true,
							font,
							pointLabels: own.pointLabels
						}),
						...createCategoriesAndValues(series)
					]);
				}),
				createGroupDataLabels(true),
				...options.type === "pie" || options.type === "doughnut" ? [createValue("c:firstSliceAng", Math.round((_options$firstSliceAn = options.firstSliceAngle) !== null && _options$firstSliceAn !== void 0 ? _options$firstSliceAn : 0))] : createSplit(options),
				...options.type === "doughnut" ? [createValue("c:holeSize", Math.round((_options$holeSize = options.holeSize) !== null && _options$holeSize !== void 0 ? _options$holeSize : 50))] : []
			])],
			axes: []
		};
	};
	//#endregion
	//#region src/charts/plot-area/radar-chart.ts
	/**
	* A radar chart: a spoke for each category, the category axis' gridlines, and rings at each value, the value axis'
	* gridlines. Each series is a line around the spokes, 2.25 points wide, or a filled area.
	*
	* Excel writes `c:radarStyle` `marker` for its "Radar" and "Radar with Markers" charts alike, and gives the plain radar's
	* series markers of `none`, so this does too.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_RadarChart">
	*   <xsd:sequence>
	*     <xsd:element name="radarStyle" type="CT_RadarStyle" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="varyColors" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="ser" type="CT_RadarSer" minOccurs="0" maxOccurs="unbounded"/>
	*     <xsd:element name="dLbls" type="CT_DLbls" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="axId" type="CT_UnsignedInt" minOccurs="2" maxOccurs="2"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	*
	* <xsd:complexType name="CT_RadarSer">
	*   <xsd:sequence>
	*     <xsd:group ref="EG_SerShared" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="marker" type="CT_Marker" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="dPt" type="CT_DPt" minOccurs="0" maxOccurs="unbounded"/>
	*     <xsd:element name="dLbls" type="CT_DLbls" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="cat" type="CT_AxDataSource" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="val" type="CT_NumDataSource" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createRadarChart = (options, data, font) => {
		var _options$filled;
		const filled = (_options$filled = options.filled) !== null && _options$filled !== void 0 ? _options$filled : false;
		return {
			groups: [createElement("c:radarChart", {}, [
				createValue("c:radarStyle", filled ? "filled" : "marker"),
				createValue("c:varyColors", false),
				...data.series.map((series, index) => {
					var _own$markers;
					const own = options.series[index];
					const seriesColor = () => createSeriesColor(index, own.color);
					return createElement("c:ser", {}, [
						...createSeriesStart(index, series),
						...filled ? [createFilledSeriesProperties(seriesColor())] : [createLineSeriesProperties(seriesColor(), own.line), createSeriesMarker((_own$markers = own.markers) !== null && _own$markers !== void 0 ? _own$markers : options.markers, seriesColor)],
						...createSeriesDataLabels(labelsOf(own.dataLabels, options.dataLabels), {
							shape: "radar",
							series: own.name,
							font,
							pointLabels: own.pointLabels
						}),
						...createCategoriesAndValues(series)
					]);
				}),
				createGroupDataLabels(),
				createValue("c:axId", PRIMARY_AXES.category),
				createValue("c:axId", PRIMARY_AXES.value)
			])],
			axes: [createCategoryAxis({
				id: PRIMARY_AXES.category,
				crossAxisId: PRIMARY_AXES.value,
				position: "b",
				radar: true,
				font
			}, options.categoryAxis), createValueAxis({
				id: PRIMARY_AXES.value,
				crossAxisId: PRIMARY_AXES.category,
				position: "l",
				crossBetween: "between",
				radar: true,
				font
			}, options.valueAxis)]
		};
	};
	//#endregion
	//#region src/charts/plot-area/scatter-chart.ts
	/**
	* A scatter chart, with two value axes. Applications draw a scatter series' line from the series' own line, whatever
	* `c:scatterStyle` says, so a series without lines has a line with no fill, as Word's "Scatter" writes it.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_ScatterChart">
	*   <xsd:sequence>
	*     <xsd:element name="scatterStyle" type="CT_ScatterStyle" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="varyColors" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="ser" type="CT_ScatterSer" minOccurs="0" maxOccurs="unbounded"/>
	*     <xsd:element name="dLbls" type="CT_DLbls" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="axId" type="CT_UnsignedInt" minOccurs="2" maxOccurs="2"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	*
	* <xsd:complexType name="CT_ScatterSer">
	*   <xsd:sequence>
	*     <xsd:group ref="EG_SerShared" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="marker" type="CT_Marker" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="dPt" type="CT_DPt" minOccurs="0" maxOccurs="unbounded"/>
	*     <xsd:element name="dLbls" type="CT_DLbls" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="trendline" type="CT_Trendline" minOccurs="0" maxOccurs="unbounded"/>
	*     <xsd:element name="errBars" type="CT_ErrBars" minOccurs="0" maxOccurs="2"/>
	*     <xsd:element name="xVal" type="CT_AxDataSource" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="yVal" type="CT_NumDataSource" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="smooth" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createScatterChart = (options, data, font) => {
		var _options$lines, _options$markers;
		const lines = (_options$lines = options.lines) !== null && _options$lines !== void 0 ? _options$lines : "none";
		const markers = (_options$markers = options.markers) !== null && _options$markers !== void 0 ? _options$markers : true;
		return {
			groups: [createElement("c:scatterChart", {}, [
				createValue("c:scatterStyle", lines === "smooth" ? "smoothMarker" : "lineMarker"),
				createValue("c:varyColors", false),
				...data.series.map((series, index) => {
					var _own$markers, _series$errors, _series$errors2;
					const own = options.series[index];
					const seriesColor = () => createSeriesColor(index, own.color);
					return createElement("c:ser", {}, [
						...createSeriesStart(index, series),
						createScatterSeriesProperties(lines === "none" ? void 0 : seriesColor(), own.line),
						createSeriesMarker((_own$markers = own.markers) !== null && _own$markers !== void 0 ? _own$markers : markers, seriesColor),
						...createSeriesDataLabels(labelsOf(own.dataLabels, options.dataLabels), {
							shape: "points",
							series: own.name,
							font,
							pointLabels: own.pointLabels
						}),
						...createTrendlines(own.trendlines, seriesColor, font),
						...createErrorBars(own.xErrorBars, "x", (_series$errors = series.errors) === null || _series$errors === void 0 ? void 0 : _series$errors.x),
						...createErrorBars(own.yErrorBars, "y", (_series$errors2 = series.errors) === null || _series$errors2 === void 0 ? void 0 : _series$errors2.y),
						createDataSource("c:xVal", series.categories),
						createDataSource("c:yVal", series.values),
						createValue("c:smooth", lines === "smooth")
					]);
				}),
				createGroupDataLabels(),
				createValue("c:axId", PRIMARY_AXES.category),
				createValue("c:axId", PRIMARY_AXES.value)
			])],
			axes: createPointAxes(options, font)
		};
	};
	//#endregion
	//#region src/charts/plot-area/stock-chart.ts
	/**
	* A stock chart: its prices, drawn by what joins them, and if it has volumes, their columns.
	*
	* - The prices' series have no line and no markers. Each category's high and low are joined by a line
	*   (`c:hiLowLines`). With opening prices, a bar goes from each open to each close (`c:upDownBars`): white where the
	*   price rose, and dark grey where it fell. Without them, the close is a short dash across the line.
	* - Volumes are columns against the primary value axis, on the left, and the prices are against the secondary value
	*   axis, on the right, as in Word's "Volume-High-Low-Close" chart. Without volumes, the prices are against the primary
	*   value axis.
	* - Dates are spaced evenly, one for each category, on a text axis rather than a date axis, so days without trading,
	*   such as weekends, leave no gaps. LibreOffice doesn't draw a stock chart's prices on a date axis either.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_StockChart">
	*   <xsd:sequence>
	*     <xsd:element name="ser" type="CT_LineSer" minOccurs="3" maxOccurs="4"/>
	*     <xsd:element name="dLbls" type="CT_DLbls" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="dropLines" type="CT_ChartLines" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="hiLowLines" type="CT_ChartLines" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="upDownBars" type="CT_UpDownBars" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="axId" type="CT_UnsignedInt" minOccurs="2" maxOccurs="2"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	*
	* <xsd:complexType name="CT_UpDownBars">
	*   <xsd:sequence>
	*     <xsd:element name="gapWidth" type="CT_GapAmount" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="upBars" type="CT_UpDownBar" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="downBars" type="CT_UpDownBar" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createStockChart = (options, data, font) => {
		var _options$categoryAxis;
		const series = stockSeriesOf(options).map((one, index) => _objectSpread2(_objectSpread2({}, one), {}, {
			index,
			data: data.series[index]
		}));
		const volume = series.find(({ role }) => role === "volume");
		const prices = series.filter(({ role }) => role !== "volume");
		const opens = options.open !== void 0;
		const priceAxes = volume ? SECONDARY_AXES : PRIMARY_AXES;
		const dates = datesOf(options.categories);
		const reversed = (_options$categoryAxis = options.categoryAxis) === null || _options$categoryAxis === void 0 ? void 0 : _options$categoryAxis.reverseOrder;
		const stock = createElement("c:stockChart", {}, [
			...prices.map(({ role, index, data: one }) => createElement("c:ser", {}, [
				...createSeriesStart(index, one),
				createHiddenSeriesProperties(),
				role === "close" && !opens ? createCloseMarker() : createMarker(void 0),
				...createCategoriesAndValues(one),
				createValue("c:smooth", false)
			])),
			createGroupDataLabels(),
			createElement("c:hiLowLines", {}, [createChartLinesProperties(options.highLowLines, 75)]),
			...opens ? [createElement("c:upDownBars", {}, [
				createValue("c:gapWidth", 150),
				createElement("c:upBars", {}, [createUpDownBarProperties(options.upBars, true)]),
				createElement("c:downBars", {}, [createUpDownBarProperties(options.downBars, false)])
			])] : [],
			createValue("c:axId", priceAxes.category),
			createValue("c:axId", priceAxes.value)
		]);
		const categoryAxis = createCategoryAxis({
			id: PRIMARY_AXES.category,
			crossAxisId: PRIMARY_AXES.value,
			position: "b",
			font
		}, options.categoryAxis, dates, false);
		const primaryValueAxis = (axis) => createValueAxis({
			id: PRIMARY_AXES.value,
			crossAxisId: PRIMARY_AXES.category,
			position: "l",
			crossBetween: "between",
			font
		}, axis);
		if (volume === void 0) return {
			groups: [stock],
			axes: [categoryAxis, primaryValueAxis(options.valueAxis)]
		};
		return {
			groups: [createBarChart({
				series: [{
					index: volume.index,
					options: {
						name: volume.name,
						values: volume.values
					},
					data: volume.data
				}],
				stacking: "none",
				axes: PRIMARY_AXES,
				font,
				horizontal: false
			}), stock],
			axes: [
				categoryAxis,
				primaryValueAxis(options.volumeAxis),
				createValueAxis({
					id: SECONDARY_AXES.value,
					crossAxisId: SECONDARY_AXES.category,
					position: "r",
					crosses: reversed ? "minimum" : "maximum",
					crossBetween: "between",
					gridlines: false,
					font
				}, options.valueAxis),
				createCategoryAxis({
					id: SECONDARY_AXES.category,
					crossAxisId: SECONDARY_AXES.value,
					position: "b"
				}, {
					visible: false,
					reverseOrder: reversed
				}, dates, false)
			]
		};
	};
	//#endregion
	//#region src/charts/plot-area/plot-area.ts
	var createChartGroups = (options, data, font) => {
		switch (options.type) {
			case "pie":
			case "doughnut":
			case "pieOfPie":
			case "barOfPie": return createPieChart(options, data, font);
			case "stock": return createStockChart(options, data, font);
			case "radar": return createRadarChart(options, data, font);
			case "scatter": return createScatterChart(options, data, font);
			case "bubble": return createBubbleChart(options, data, font);
			default: return createCategoryCharts(options, data, font);
		}
	};
	/**
	* A table of the chart's data under its plot, with light grey borders and 9 point text, and each series' legend key,
	* unless asked otherwise.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_DTable">
	*   <xsd:sequence>
	*     <xsd:element name="showHorzBorder" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="showVertBorder" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="showOutline" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="showKeys" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="txPr" type="a:CT_TextBody" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createDataTable = (table, chartFont) => {
		const { legendKeys = true, horizontalBorders = true, verticalBorders = true, outline = true, font } = table === true ? {} : table;
		return createElement("c:dTable", {}, [
			createValue("c:showHorzBorder", horizontalBorders),
			createValue("c:showVertBorder", verticalBorders),
			createValue("c:showOutline", outline),
			createValue("c:showKeys", legendKeys),
			createDataTableProperties(),
			createTextProperties({
				size: 9,
				rotation: 0,
				font: fontOf(chartFont, font)
			})
		]);
	};
	/**
	* The plot area, laid out automatically, with no fill or border unless asked for.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_PlotArea">
	*   <xsd:sequence>
	*     <xsd:element name="layout" type="CT_Layout" minOccurs="0" maxOccurs="1"/>
	*     <xsd:choice minOccurs="1" maxOccurs="unbounded">
	*       <xsd:element name="areaChart" type="CT_AreaChart" minOccurs="1" maxOccurs="1"/>
	*       <xsd:element name="lineChart" type="CT_LineChart" minOccurs="1" maxOccurs="1"/>
	*       <xsd:element name="scatterChart" type="CT_ScatterChart" minOccurs="1" maxOccurs="1"/>
	*       <xsd:element name="pieChart" type="CT_PieChart" minOccurs="1" maxOccurs="1"/>
	*       <xsd:element name="doughnutChart" type="CT_DoughnutChart" minOccurs="1" maxOccurs="1"/>
	*       <xsd:element name="barChart" type="CT_BarChart" minOccurs="1" maxOccurs="1"/>
	*       <xsd:element name="radarChart" type="CT_RadarChart" minOccurs="1" maxOccurs="1"/>
	*       <xsd:element name="bubbleChart" type="CT_BubbleChart" minOccurs="1" maxOccurs="1"/>
	*       ...
	*     </xsd:choice>
	*     <xsd:choice minOccurs="0" maxOccurs="unbounded">
	*       <xsd:element name="valAx" type="CT_ValAx" minOccurs="1" maxOccurs="1"/>
	*       <xsd:element name="catAx" type="CT_CatAx" minOccurs="1" maxOccurs="1"/>
	*       <xsd:element name="dateAx" type="CT_DateAx" minOccurs="1" maxOccurs="1"/>
	*       <xsd:element name="serAx" type="CT_SerAx" minOccurs="1" maxOccurs="1"/>
	*     </xsd:choice>
	*     <xsd:element name="dTable" type="CT_DTable" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createPlotArea = (options, data) => {
		const { groups, axes } = createChartGroups(options, data, options.font);
		const { dataTable } = options;
		return createElement("c:plotArea", {}, [
			createElement("c:layout"),
			...groups,
			...axes,
			...dataTable ? [createDataTable(dataTable, options.font)] : [],
			createPlotAreaProperties(options.plotArea)
		]);
	};
	//#endregion
	//#region src/charts/chart-space.ts
	var CHART_NAMESPACE = "http://schemas.openxmlformats.org/drawingml/2006/chart";
	var RELATIONSHIPS_NAMESPACE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
	var LEGEND_POSITIONS = {
		top: "t",
		bottom: "b",
		left: "l",
		right: "r",
		topRight: "tr"
	};
	var EMPTY_VALUES = {
		gap: "gap",
		zero: "zero",
		connect: "span"
	};
	/**
	* The legend (`c:legend`), beside the plot rather than over it, in 9 point text, without the entries it hides.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_Legend">
	*   <xsd:sequence>
	*     <xsd:element name="legendPos" type="CT_LegendPos" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="legendEntry" type="CT_LegendEntry" minOccurs="0" maxOccurs="unbounded"/>
	*     <xsd:element name="layout" type="CT_Layout" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="overlay" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="txPr" type="a:CT_TextBody" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createLegend = (options, { position = "bottom", font, hiddenEntries = [] }) => createElement("c:legend", {}, [
		createValue("c:legendPos", LEGEND_POSITIONS[position]),
		...legendEntriesOf(options).filter(({ text }) => hiddenEntries.some((entry) => String(entry) === text)).map(({ index }) => createElement("c:legendEntry", {}, [createValue("c:idx", index), createValue("c:delete", true)])),
		createValue("c:overlay", false),
		createNoShapeProperties(),
		createTextProperties({
			size: 9,
			rotation: 0,
			font: fontOf(options.font, font)
		})
	]);
	/**
	* The chart part's root, in the schema's order. Office's `c14:style`, `c:extLst` and `c16` extensions are left out, as
	* the look is written explicitly.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_ChartSpace">
	*   <xsd:sequence>
	*     <xsd:element name="date1904" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="lang" type="CT_TextLanguageID" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="roundedCorners" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="style" type="CT_Style" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="clrMapOvr" type="a:CT_ColorMapping" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="pivotSource" type="CT_PivotSource" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="protection" type="CT_Protection" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="chart" type="CT_Chart" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="txPr" type="a:CT_TextBody" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="externalData" type="CT_ExternalData" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="printSettings" type="CT_PrintSettings" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="userShapes" type="CT_RelId" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	*
	* <xsd:complexType name="CT_Chart">
	*   <xsd:sequence>
	*     <xsd:element name="title" type="CT_Title" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="autoTitleDeleted" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="pivotFmts" type="CT_PivotFmts" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="view3D" type="CT_View3D" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="floor" type="CT_Surface" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="sideWall" type="CT_Surface" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="backWall" type="CT_Surface" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="plotArea" type="CT_PlotArea" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="legend" type="CT_Legend" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="plotVisOnly" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="dispBlanksAs" type="CT_DispBlanksAs" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="showDLblsOverMax" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*
	* @param workbook - The embedded workbook, which the chart's data refers to
	*/
	var createChartSpace = (options, data, workbook) => {
		var _options$legend, _options$emptyValues;
		return createElement("c:chartSpace", {
			"xmlns:c": CHART_NAMESPACE,
			"xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main",
			"xmlns:r": RELATIONSHIPS_NAMESPACE
		}, [
			createValue("c:date1904", false),
			createValue("c:lang", "en-US"),
			createValue("c:roundedCorners", false),
			createElement("c:chart", {}, [
				...options.title === void 0 ? [] : [createChartTitle(options.title, options.font)],
				createValue("c:autoTitleDeleted", options.title === void 0),
				createPlotArea(options, data),
				...options.legend === false ? [] : [createLegend(options, (_options$legend = options.legend) !== null && _options$legend !== void 0 ? _options$legend : {})],
				createValue("c:plotVisOnly", true),
				createValue("c:dispBlanksAs", EMPTY_VALUES[(_options$emptyValues = options.emptyValues) !== null && _options$emptyValues !== void 0 ? _options$emptyValues : "gap"])
			]),
			createChartAreaProperties(options.chartArea),
			createChartTextProperties(),
			new PartReference("c:externalData", workbook, { children: [createValue("c:autoUpdate", false)] })
		]);
	};
	//#endregion
	//#region src/charts/workbook/workbook.ts
	/**
	* The embedded workbook (`word/embeddings/Microsoft_Excel_Worksheet1.xlsx`) that holds a chart's data, so Word's "Edit
	* Data" opens it. It has one sheet, laid out as Word lays out a new chart's data, with its text in shared strings, as
	* Excel writes it.
	*
	* @module
	*/
	var SPREADSHEET_NAMESPACE = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
	var RELATIONSHIP_TYPES = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
	var createContentTypes = () => createElement("Types", { xmlns: "http://schemas.openxmlformats.org/package/2006/content-types" }, [
		createElement("Default", {
			Extension: "rels",
			ContentType: "application/vnd.openxmlformats-package.relationships+xml"
		}),
		createElement("Default", {
			Extension: "xml",
			ContentType: "application/xml"
		}),
		...[
			["/xl/workbook.xml", "sheet.main+xml"],
			["/xl/worksheets/sheet1.xml", "worksheet+xml"],
			["/xl/styles.xml", "styles+xml"],
			["/xl/sharedStrings.xml", "sharedStrings+xml"]
		].map(([partName, type]) => createElement("Override", {
			PartName: partName,
			ContentType: `application/vnd.openxmlformats-officedocument.spreadsheetml.${type}`
		}))
	]);
	var createRelationships = (relationships) => createElement("Relationships", { xmlns: "http://schemas.openxmlformats.org/package/2006/relationships" }, relationships.map(([type, target], index) => createElement("Relationship", {
		Id: `rId${index + 1}`,
		Type: `${RELATIONSHIP_TYPES}/${type}`,
		Target: target
	})));
	var createWorkbook = () => createElement("workbook", {
		xmlns: SPREADSHEET_NAMESPACE,
		"xmlns:r": RELATIONSHIP_TYPES
	}, [createElement("sheets", {}, [createElement("sheet", {
		name: SHEET_NAME,
		sheetId: 1,
		"r:id": "rId1"
	})])]);
	var FIRST_NUMBER_FORMAT_ID = 164;
	/**
	* The fewest styles Excel accepts: one font, the two fills every workbook has, one border and one cell format, then a
	* cell format for each number format the sheet's cells have, such as a date format.
	*/
	var createStyles = (formats) => createElement("styleSheet", { xmlns: SPREADSHEET_NAMESPACE }, [
		...formats.length === 0 ? [] : [createElement("numFmts", { count: formats.length }, formats.map((formatCode, index) => createElement("numFmt", {
			numFmtId: FIRST_NUMBER_FORMAT_ID + index,
			formatCode
		})))],
		createElement("fonts", { count: 1 }, [createElement("font", {}, [
			createElement("sz", { val: 11 }),
			createElement("name", { val: "Calibri" }),
			createElement("family", { val: 2 })
		])]),
		createElement("fills", { count: 2 }, [createElement("fill", {}, [createElement("patternFill", { patternType: "none" })]), createElement("fill", {}, [createElement("patternFill", { patternType: "gray125" })])]),
		createElement("borders", { count: 1 }, [createElement("border", {}, [
			"left",
			"right",
			"top",
			"bottom",
			"diagonal"
		].map((side) => createElement(side)))]),
		createElement("cellStyleXfs", { count: 1 }, [createElement("xf", {
			numFmtId: 0,
			fontId: 0,
			fillId: 0,
			borderId: 0
		})]),
		createElement("cellXfs", { count: formats.length + 1 }, [createElement("xf", {
			numFmtId: 0,
			fontId: 0,
			fillId: 0,
			borderId: 0,
			xfId: 0
		}), ...formats.map((_, index) => createElement("xf", {
			numFmtId: FIRST_NUMBER_FORMAT_ID + index,
			fontId: 0,
			fillId: 0,
			borderId: 0,
			xfId: 0,
			applyNumberFormat: 1
		}))]),
		createElement("cellStyles", { count: 1 }, [createElement("cellStyle", {
			name: "Normal",
			xfId: 0,
			builtinId: 0
		})])
	]);
	/**
	* A cell that isn't empty: text, as the index of a shared string, or a number, with the cell format of its number format.
	*/
	var createCell = (cell, name, strings, formats) => {
		if (typeof cell === "string") return createElement("c", {
			r: name,
			t: "s"
		}, [createText("v", `${strings.get(cell)}`)]);
		return typeof cell === "number" ? createElement("c", { r: name }, [createText("v", formatNumber(cell))]) : createElement("c", {
			r: name,
			s: formats.indexOf(cell.format) + 1
		}, [createText("v", formatNumber(cell.value))]);
	};
	/**
	* The sheet: its used range, and each cell that isn't empty.
	*/
	var createWorksheet = (sheet, strings, formats) => {
		const columns = Math.max(...sheet.map((row) => row.length));
		return createElement("worksheet", {
			xmlns: SPREADSHEET_NAMESPACE,
			"xmlns:r": RELATIONSHIP_TYPES
		}, [createElement("dimension", { ref: `A1:${cellName(columns - 1, sheet.length - 1)}` }), createElement("sheetData", {}, sheet.flatMap((row, rowIndex) => {
			const cells = row.flatMap((cell, column) => cell === void 0 ? [] : [createCell(cell, cellName(column, rowIndex), strings, formats)]);
			return cells.length === 0 ? [] : [createElement("row", { r: rowIndex + 1 }, cells)];
		}))]);
	};
	/**
	* The shared strings: each piece of text once. Excel writes `xml:space="preserve"` on text that starts or ends with
	* white space, though the ISO schema doesn't allow it there, so this does too.
	*/
	var createSharedStrings = (strings, count) => createElement("sst", {
		xmlns: SPREADSHEET_NAMESPACE,
		count,
		uniqueCount: strings.length
	}, strings.map((text) => createElement("si", {}, [/^\s|\s$/.test(text) ? createElement("t", { "xml:space": "preserve" }).addChildElement(text) : createText("t", text)])));
	/**
	* The workbook's files, to zip into the embedded package.
	*
	* @param sheet - The sheet's cells, row by row
	*/
	var createWorkbookFiles = (sheet) => {
		const texts = sheet.flat().filter((cell) => typeof cell === "string");
		const strings = [...new Set(texts)];
		const formats = [...new Set(sheet.flat().flatMap((cell) => typeof cell === "object" ? [cell.format] : []))];
		return [
			{
				path: "[Content_Types].xml",
				content: createContentTypes()
			},
			{
				path: "_rels/.rels",
				content: createRelationships([["officeDocument", "xl/workbook.xml"]])
			},
			{
				path: "xl/workbook.xml",
				content: createWorkbook()
			},
			{
				path: "xl/_rels/workbook.xml.rels",
				content: createRelationships([
					["worksheet", "worksheets/sheet1.xml"],
					["styles", "styles.xml"],
					["sharedStrings", "sharedStrings.xml"]
				])
			},
			{
				path: "xl/worksheets/sheet1.xml",
				content: createWorksheet(sheet, new Map(strings.map((text, index) => [text, index])), formats)
			},
			{
				path: "xl/styles.xml",
				content: createStyles(formats)
			},
			{
				path: "xl/sharedStrings.xml",
				content: createSharedStrings(strings, texts.length)
			}
		];
	};
	/**
	* The workbook as a part of the package, with its relationship type and content type, which a chart refers to.
	*
	* @param sheet - The sheet's cells, row by row
	*/
	var createWorkbookPart = (sheet) => new docx.PackagePart({
		folder: "embeddings",
		name: "Microsoft_Excel_Worksheet",
		extension: "xlsx",
		contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		relationshipType: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/package",
		content: { files: createWorkbookFiles(sheet) }
	});
	//#endregion
	//#region src/charts/chart-run.ts
	/**
	* Chart run module: native Word charts, drawn by the application from their data.
	*
	* Reference: http://officeopenxml.com/drwOverview.php
	*
	* @module
	*/
	/**
	* Represents a chart in a WordprocessingML document: a column, bar, line, area, pie, doughnut, pie of pie, bar of pie,
	* radar, scatter, bubble or stock chart, drawn by Word from its data in the document's theme, as a chart made with
	* Word's Insert Chart is. A column, line or area chart's series can each be drawn another way, as Word's "Combo" charts
	* are.
	*
	* The chart is a part of its own (`word/charts/chart1.xml`), with its data in an embedded workbook, so Word's "Edit
	* Data" opens it in Excel. It sits inline with text unless `floating` is set, and goes in a paragraph, including in a
	* table, header, footer or footnote. Without a description in its `altText`, the chart is described for screen readers
	* from its data.
	*
	* Reference: http://officeopenxml.com/drwOverview.php
	*
	* @publicApi
	*
	* @example
	* ```typescript
	* new Paragraph({
	*   children: [
	*     new ChartRun({
	*       type: "column",
	*       title: "Sales",
	*       categories: ["Jan", "Feb", "Mar"],
	*       series: [
	*         { name: "2024", values: [10, 20, 30] },
	*         { name: "2025", values: [15, 25, null] },
	*       ],
	*     }),
	*   ],
	* });
	* ```
	*/
	var ChartRun = class extends docx.Run {
		/**
		* @throws If there are no series or categories, a value isn't a finite number or null, a series has more values
		* than there are categories or an option the way it is drawn doesn't have, a pie chart has more than one series or
		* a pie or doughnut chart a negative value, a scatter or bubble point isn't finite numbers, a data label position
		* isn't one the chart's type has, a trendline can't be fitted to its series' values, a stock chart's high is below
		* its low, a hidden legend entry isn't one of the legend's, or an option is out of its range
		*/
		constructor(options) {
			var _options$transformati;
			super(_objectSpread2(_objectSpread2({}, options.run), {}, {
				break: void 0,
				text: void 0,
				children: void 0
			}));
			const data = createChartData(options);
			const workbook = createWorkbookPart(data.sheet);
			const chart = new docx.PackagePart({
				folder: "charts",
				name: "chart",
				extension: "xml",
				contentType: "application/vnd.openxmlformats-officedocument.drawingml.chart+xml",
				relationshipType: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart",
				content: createChartSpace(options, data, workbook)
			});
			this.root.push(new docx.Drawing({
				type: "graphic",
				uri: CHART_NAMESPACE,
				transformation: (0, docx.createTransformation)((_options$transformati = options.transformation) !== null && _options$transformati !== void 0 ? _options$transformati : DEFAULT_CHART_SIZE),
				content: new PartReference("c:chart", chart, { namespaces: {
					c: CHART_NAMESPACE,
					r: RELATIONSHIPS_NAMESPACE
				} }),
				lockAspectRatio: false
			}, {
				floating: options.floating,
				docProperties: chartAltText(options),
				decorative: options.decorative
			}));
		}
	};
	//#endregion
	//#region src/charts/template/template-xml.ts
	/**
	* An element's name, such as "c:ser", or "" for text and comments, which have none.
	*/
	var nameOf = (element) => {
		var _element$name;
		return (_element$name = element.name) !== null && _element$name !== void 0 ? _element$name : "";
	};
	/**
	* The child elements of an element, without its text and comments.
	*/
	var elementsOf = (element) => {
		var _element$elements;
		return ((_element$elements = element === null || element === void 0 ? void 0 : element.elements) !== null && _element$elements !== void 0 ? _element$elements : []).filter((child) => child.type === "element");
	};
	/**
	* The child elements with a name, such as each `c:ser` of a `c:barChart`.
	*/
	var childrenOf = (element, name) => elementsOf(element).filter((child) => child.name === name);
	/**
	* The first child element with a name.
	*/
	var childOf = (element, name) => elementsOf(element).find((child) => child.name === name);
	/**
	* Every element under an element with a name, in document order.
	*/
	var descendantsOf = (element, name) => elementsOf(element).flatMap((child) => [...child.name === name ? [child] : [], ...descendantsOf(child, name)]);
	/**
	* An attribute's value, as text.
	*/
	var attributeOf = (element, name) => {
		var _element$attributes;
		const value = element === null || element === void 0 || (_element$attributes = element.attributes) === null || _element$attributes === void 0 ? void 0 : _element$attributes[name];
		return value === void 0 ? void 0 : String(value);
	};
	/**
	* An element's `val` attribute, such as "col" for `<c:barDir val="col"/>`.
	*/
	var valueOf = (element) => attributeOf(element, "val");
	/**
	* An element's `val` attribute as a whole number, or undefined if it has none, as in `<c:idx val="2"/>`.
	*/
	var numberOf = (element) => {
		var _valueOf;
		const value = Number(valueOf(element));
		return ((_valueOf = valueOf(element)) === null || _valueOf === void 0 ? void 0 : _valueOf.trim()) && Number.isInteger(value) ? value : void 0;
	};
	/**
	* An element's text, and its children's.
	*/
	var textOf = (element) => {
		var _element$elements2;
		return ((_element$elements2 = element === null || element === void 0 ? void 0 : element.elements) !== null && _element$elements2 !== void 0 ? _element$elements2 : []).map((child) => {
			if (child.type === "text") {
				var _child$text;
				return String((_child$text = child.text) !== null && _child$text !== void 0 ? _child$text : "");
			}
			if (child.type === "cdata") {
				var _child$cdata;
				return String((_child$cdata = child.cdata) !== null && _child$cdata !== void 0 ? _child$cdata : "");
			}
			return child.type === "element" ? textOf(child) : "";
		}).join("");
	};
	/**
	* A copy of an element, which can be changed without changing it.
	*/
	var copyOf = (element) => JSON.parse(JSON.stringify(element));
	/**
	* An element with other children.
	*/
	var withChildren = (element, children) => _objectSpread2(_objectSpread2({}, element), {}, { elements: [...children] });
	/**
	* An element with its children changed: each is replaced by what the function gives, which can be none or several.
	* Text and comments are kept.
	*/
	var mapChildren = (element, change) => {
		var _element$elements3;
		return withChildren(element, ((_element$elements3 = element.elements) !== null && _element$elements3 !== void 0 ? _element$elements3 : []).flatMap((child) => child.type === "element" ? change(child) : [child]));
	};
	/**
	* An element without the child elements a test picks.
	*/
	var withoutChildren = (element, remove) => mapChildren(element, (child) => remove(child) ? [] : [child]);
	/**
	* An element with other attributes, which are added to or replace its own. An undefined value removes the attribute.
	*/
	var withAttributes = (element, attributes) => {
		const all = _objectSpread2(_objectSpread2({}, element.attributes), attributes);
		return _objectSpread2(_objectSpread2({}, element), {}, { attributes: Object.fromEntries(Object.entries(all).flatMap(([name, value]) => value === void 0 ? [] : [[name, value]])) });
	};
	/**
	* An element with a child in its place in the schema's order: in place of its child of the same name, or before its
	* first child that comes after it. Children the order doesn't name keep their places.
	*
	* @param order - The names of the element's children, in the schema's order, which includes the child's name
	*/
	var withChild = (element, child, order) => {
		var _element$elements4;
		const children = (_element$elements4 = element.elements) !== null && _element$elements4 !== void 0 ? _element$elements4 : [];
		const same = children.findIndex((existing) => existing.type === "element" && existing.name === child.name);
		if (same !== -1) return withChildren(element, children.map((existing, index) => index === same ? child : existing));
		const rank = order.indexOf(nameOf(child));
		const next = children.findIndex((existing) => existing.type === "element" && order.indexOf(nameOf(existing)) > rank);
		return withChildren(element, next === -1 ? [...children, child] : [
			...children.slice(0, next),
			child,
			...children.slice(next)
		]);
	};
	/**
	* A new element.
	*/
	var createXmlElement = (name, attributes = {}, children = []) => _objectSpread2(_objectSpread2({
		type: "element",
		name
	}, Object.keys(attributes).length > 0 ? { attributes: _objectSpread2({}, attributes) } : {}), children.length > 0 ? { elements: [...children] } : {});
	//#endregion
	//#region src/charts/template/template-chart.ts
	var barType = (group) => valueOf(childOf(group, "c:barDir")) === "bar" ? "bar" : "column";
	var GROUPS = /* @__PURE__ */ new Map([
		["c:barChart", barType],
		["c:bar3DChart", barType],
		["c:lineChart", () => "line"],
		["c:line3DChart", () => "line"],
		["c:areaChart", () => "area"],
		["c:area3DChart", () => "area"],
		["c:pieChart", () => "pie"],
		["c:pie3DChart", () => "pie"],
		["c:ofPieChart", (group) => valueOf(childOf(group, "c:ofPieType")) === "bar" ? "barOfPie" : "pieOfPie"],
		["c:doughnutChart", () => "doughnut"],
		["c:radarChart", () => "radar"],
		["c:scatterChart", () => "scatter"],
		["c:bubbleChart", () => "bubble"],
		["c:stockChart", () => "stock"]
	]);
	var UNSUPPORTED_GROUPS = /* @__PURE__ */ new Map([["c:surfaceChart", "a surface chart"], ["c:surface3DChart", "a 3-D surface chart"]]);
	var WHOLE_CHART_TYPES = [
		"pie",
		"doughnut",
		"pieOfPie",
		"barOfPie",
		"radar",
		"stock"
	];
	var PIE_TYPES$1 = [
		"pie",
		"doughnut",
		"pieOfPie",
		"barOfPie"
	];
	var kindOf = (type) => {
		switch (type) {
			case "scatter":
			case "bubble": return type;
			default: return "category";
		}
	};
	/**
	* Whether a group's points each have their own colour. Office varies them unless told not to on pie and doughnut
	* charts, and doesn't on the others, when there is no `c:varyColors`. A `c:varyColors` without a value is true, as in
	* the schema.
	*/
	var variesColors = (group, type) => {
		const varyColors = childOf(group, "c:varyColors");
		if (varyColors === void 0) return PIE_TYPES$1.includes(type);
		const value = valueOf(varyColors);
		return value === void 0 || value === "1" || value === "true";
	};
	/**
	* The text of the chart's own title: each paragraph's runs and fields, a line each. A title Office writes from a
	* single series' name, or linked to a cell, has none.
	*/
	var titleOf = (chart) => {
		const rich = childOf(childOf(childOf(chart, "c:title"), "c:tx"), "c:rich");
		return rich === void 0 ? void 0 : childrenOf(rich, "a:p").map((paragraph) => descendantsOf(paragraph, "a:t").map(textOf).join("")).join("\n");
	};
	/**
	* Reads a chart part's chart.
	*
	* @throws If the chart is a pivot chart, has no plot area or series groups, has a group this can't patch, such as a
	* stock chart, or combines series with categories with series with points
	*/
	var readTemplateChart = (chartSpace) => {
		var _groups$find$type, _groups$find;
		if (childOf(chartSpace, "c:pivotSource") !== void 0) throw new Error("It is a pivot chart, whose data is a pivot table in its workbook");
		const chart = childOf(chartSpace, "c:chart");
		const plotArea = childOf(chart, "c:plotArea");
		if (chart === void 0 || plotArea === void 0) throw new Error("Its chart part has no plot area (c:chart and c:plotArea)");
		const groups = elementsOf(plotArea).filter((element) => nameOf(element).endsWith("Chart")).map((element) => {
			const name = nameOf(element);
			const unsupported = UNSUPPORTED_GROUPS.get(name);
			if (unsupported !== void 0) throw new Error(`It is ${unsupported}, which ChartDataPatch can't patch`);
			const typeOf = GROUPS.get(name);
			if (typeOf === void 0) throw new Error(`It has a group of series of a type ChartDataPatch doesn't know (${name})`);
			const groupType = typeOf(element);
			return {
				element,
				kind: kindOf(groupType),
				type: groupType,
				varyColors: variesColors(element, groupType)
			};
		});
		if (groups.length === 0) throw new Error("Its plot area has no series groups, such as c:barChart");
		const kinds = [...new Set(groups.map(({ kind }) => kind))];
		if (kinds.length > 1) throw new Error("It combines a scatter or bubble chart, whose series have points, with another type, whose series have categories, which ChartDataPatch can't patch");
		const series = groups.flatMap((group) => childrenOf(group.element, "c:ser").map((element) => ({
			element,
			group,
			index: numberOf(childOf(element, "c:idx")),
			order: numberOf(childOf(element, "c:order"))
		}))).map((one, position) => ({
			one,
			position
		})).sort((a, b) => {
			var _a$one$order, _b$one$order;
			return ((_a$one$order = a.one.order) !== null && _a$one$order !== void 0 ? _a$one$order : Infinity) - ((_b$one$order = b.one.order) !== null && _b$one$order !== void 0 ? _b$one$order : Infinity) || a.position - b.position;
		}).map(({ one }) => one);
		const type = (_groups$find$type = (_groups$find = groups.find((group) => WHOLE_CHART_TYPES.includes(group.type))) === null || _groups$find === void 0 ? void 0 : _groups$find.type) !== null && _groups$find$type !== void 0 ? _groups$find$type : groups[0].type;
		const stock = groups.find((group) => group.type === "stock");
		if (stock !== void 0) {
			const prices = childrenOf(stock.element, "c:ser").length;
			if (prices !== 3 && prices !== 4) throw new Error(`It is a stock chart with ${prices} series of prices. A stock chart has 3, or 4 with opening prices`);
			const others = groups.filter((group) => group !== stock);
			if (others.length > 1 || others.some((group) => group.type !== "column" || childrenOf(group.element, "c:ser").length !== 1)) throw new Error("It is a stock chart combined with a chart other than its volumes' columns, which ChartDataPatch can't patch");
		}
		return {
			chartSpace,
			chart,
			plotArea,
			groups,
			series,
			kind: kinds[0],
			type,
			title: titleOf(chart)
		};
	};
	/**
	* The number of points the series' values had in the template, from their cache.
	*/
	var pointCountOf = (series) => {
		var _childOf, _numberOf;
		return (_numberOf = numberOf(descendantsOf((_childOf = childOf(series, "c:val")) !== null && _childOf !== void 0 ? _childOf : childOf(series, "c:yVal"), "c:ptCount")[0])) !== null && _numberOf !== void 0 ? _numberOf : 0;
	};
	/**
	* The number format of a series' data in the template, from its cache, such as "0%", or undefined for "General".
	*
	* @param name - The data: `c:cat`, `c:val`, `c:xVal`, `c:yVal` or `c:bubbleSize`
	*/
	var formatCodeOf = (series, name) => {
		const [format] = descendantsOf(childOf(series, name), "c:formatCode");
		const code = format === void 0 ? "" : textOf(format).trim();
		return code === "" || code.toLowerCase() === "general" ? void 0 : code;
	};
	/**
	* Whether an Excel number format writes a date or time, such as "d mmm yyyy" or "[h]:mm", rather than a number, such as
	* "#,##0" or "0.0%". Quoted and escaped text, and colours and conditions in brackets, are left out.
	*/
	var isDateFormat = (code) => /\[(h+|m+|s+)\]/i.test(code) || /[dmyhs]/i.test(code.replace(/"[^"]*"/g, "").replace(/\\./g, "").replace(/\[[^\]]*\]/g, "").replace(/[_*]./g, ""));
	//#endregion
	//#region src/charts/template/template-series.ts
	/**
	* The children of every type of series, in the schema's order (`CT_BarSer`, `CT_LineSer`, `CT_AreaSer`, `CT_PieSer`,
	* `CT_RadarSer`, `CT_ScatterSer` and `CT_BubbleSer`), as one order all of them keep.
	*/
	var SERIES_ORDER = [
		"c:idx",
		"c:order",
		"c:tx",
		"c:spPr",
		"c:invertIfNegative",
		"c:pictureOptions",
		"c:marker",
		"c:explosion",
		"c:dPt",
		"c:dLbls",
		"c:trendline",
		"c:errBars",
		"c:cat",
		"c:xVal",
		"c:val",
		"c:yVal",
		"c:shape",
		"c:smooth",
		"c:bubbleSize",
		"c:bubble3D",
		"c:extLst"
	];
	/**
	* The children of a point's own look (`CT_DPt`), in the schema's order.
	*/
	var POINT_ORDER = [
		"c:idx",
		"c:invertIfNegative",
		"c:marker",
		"c:bubble3D",
		"c:explosion",
		"c:spPr",
		"c:pictureOptions",
		"c:extLst"
	];
	var COLORS = /* @__PURE__ */ new Set([
		"a:srgbClr",
		"a:schemeClr",
		"a:scrgbClr",
		"a:hslClr",
		"a:sysClr",
		"a:prstClr"
	]);
	var colorKey = (color) => JSON.stringify(color, (key, value) => key === "elements" && Array.isArray(value) ? value.filter((child) => !(child.type === "text" && String(child.text).trim() === "")) : value);
	var firstColorIn = (element) => elementsOf(element).reduce((found, child) => found !== null && found !== void 0 ? found : COLORS.has(nameOf(child)) ? child : firstColorIn(child), void 0);
	/**
	* The main colour of a series or a point: the first colour of its shape properties' fill or line, or else of its
	* marker's.
	*/
	var mainColorOf = (element) => {
		var _firstColorIn;
		return (_firstColorIn = firstColorIn(childOf(element, "c:spPr"))) !== null && _firstColorIn !== void 0 ? _firstColorIn : firstColorIn(childOf(childOf(element, "c:marker"), "c:spPr"));
	};
	/**
	* Replaces a colour, wherever it is in an element, with another. The old colour's transparency (`a:alpha`) is kept,
	* unless the new one has its own.
	*/
	var recolor = (element, from, to) => {
		var _to$elements;
		const key = colorKey(from);
		const alpha = childOf(from, "a:alpha");
		const replacement = alpha !== void 0 && childOf(to, "a:alpha") === void 0 ? _objectSpread2(_objectSpread2({}, to), {}, { elements: [...(_to$elements = to.elements) !== null && _to$elements !== void 0 ? _to$elements : [], alpha] }) : to;
		const change = (current) => mapChildren(current, (child) => [COLORS.has(nameOf(child)) && colorKey(child) === key ? copyOf(replacement) : change(child)]);
		return change(element);
	};
	/**
	* A series or point in another colour: its main colour, in its shape properties and its marker's, replaced with another.
	*/
	var withColor = (element, color) => {
		const main = mainColorOf(element);
		if (main === void 0) return element;
		return mapChildren(element, (child) => {
			if (child.name === "c:spPr") return [recolor(child, main, color)];
			return [child.name === "c:marker" ? mapChildren(child, (inner) => [inner.name === "c:spPr" ? recolor(inner, main, color) : inner]) : child];
		});
	};
	/**
	* An element without Office's unique id of it (`c16:uniqueId`), which a copy can't share, and its extension list if
	* that leaves it empty.
	*/
	var withoutUniqueId = (element) => mapChildren(element, (child) => {
		if (child.name !== "c:extLst") return [child];
		const extensions = withoutChildren(child, (extension) => descendantsOf(extension, "c16:uniqueId").length > 0);
		return elementsOf(extensions).length === 0 ? [] : [extensions];
	});
	var indexOf = (element) => {
		var _numberOf;
		return (_numberOf = numberOf(childOf(element, "c:idx"))) !== null && _numberOf !== void 0 ? _numberOf : 0;
	};
	/**
	* A series with its index (`c:idx`) and plot order (`c:order`).
	*/
	var withIndex = (series, index, order) => withChild(withChild(series, createXmlElement("c:idx", { val: index }), SERIES_ORDER), createXmlElement("c:order", { val: order }), SERIES_ORDER);
	/**
	* A series with new data: its name (`c:tx`), categories (`c:cat` or `c:xVal`), values (`c:val` or `c:yVal`) and sizes
	* (`c:bubbleSize`), each in place of the series' own or, if it has none, in its place in the schema's order.
	*/
	var withData = (series, data) => data.reduce((current, element) => withChild(current, element, SERIES_ORDER), series);
	/**
	* A series without the points' own looks and labels (`c:dPt` and `c:dLbl`) past its last point.
	*/
	var withoutPointsPast = (series, count) => mapChildren(series, (child) => {
		if (child.name === "c:dPt") return indexOf(child) < count ? [child] : [];
		return [child.name === "c:dLbls" ? withoutChildren(child, (label) => label.name === "c:dLbl" && indexOf(label) >= count) : child];
	});
	/**
	* A series whose points each have a look of their own, such as the slices of a pie, with a look for each new point: a
	* copy of the last point's, in the next colour, and pulled out of the pie only if every point is, as far. A series whose points don't all have one is left as it is, as the
	* points without one take the series' look.
	*
	* @param count - The number of points it has now
	* @param templateCount - The number it had in the template
	* @param colorOf - The colour of a point, by its index
	*/
	var withPointsUpTo = (series, count, templateCount, colorOf) => {
		const points = childrenOf(series, "c:dPt");
		const indexes = new Set(points.map(indexOf));
		const last = points.find((point) => indexOf(point) === templateCount - 1);
		if (count <= templateCount || last === void 0 || !Array.from({ length: templateCount }, (_, index) => index).every((index) => indexes.has(index))) return series;
		const model = new Set(points.map((point) => valueOf(childOf(point, "c:explosion")))).size === 1 ? withoutUniqueId(last) : withoutChildren(withoutUniqueId(last), (child) => child.name === "c:explosion");
		const added = Array.from({ length: count - templateCount }, (_, offset) => {
			const point = templateCount + offset;
			return withColor(withChild(copyOf(model), createXmlElement("c:idx", { val: point }), POINT_ORDER), colorOf(point));
		});
		const lastPoint = points[points.length - 1];
		return mapChildren(series, (child) => child === lastPoint ? [child, ...added] : [child]);
	};
	/**
	* A new series with the look of the template's last series: a copy of it with its own colour, and without what was the
	* last series' own, which are its unique id, trendlines, error bars and its points' own labels, and unless its points
	* are the categories' colours, as in a pie or doughnut chart, its points' own looks.
	*
	* @param keepPointColors - Whether its points' own looks are the categories' colours, and are kept
	* @param color - The new series' colour
	*/
	var copySeries = (model, keepPointColors, color) => {
		const copy = mapChildren(withoutUniqueId(model), (child) => {
			switch (child.name) {
				case "c:trendline":
				case "c:errBars": return [];
				case "c:dPt": return keepPointColors ? [withoutUniqueId(child)] : [];
				case "c:dLbls": return [withoutChildren(child, (label) => label.name === "c:dLbl")];
				default: return [child];
			}
		});
		return keepPointColors ? copy : withColor(copy, color);
	};
	//#endregion
	//#region src/charts/template/patch-chart.ts
	/**
	* The children of a chart part's root (`CT_ChartSpace`), in the schema's order.
	*/
	var CHART_SPACE_ORDER = [
		"c:date1904",
		"c:lang",
		"c:roundedCorners",
		"c:style",
		"c:clrMapOvr",
		"c:pivotSource",
		"c:protection",
		"c:chart",
		"c:spPr",
		"c:txPr",
		"c:externalData",
		"c:printSettings",
		"c:userShapes",
		"c:extLst"
	];
	var BEFORE_SERIES = /* @__PURE__ */ new Set([
		"c:barDir",
		"c:grouping",
		"c:varyColors",
		"c:radarStyle",
		"c:scatterStyle",
		"c:ofPieType"
	]);
	var AXES = /* @__PURE__ */ new Set([
		"c:valAx",
		"c:catAx",
		"c:dateAx",
		"c:serAx"
	]);
	var DATE_AXIS_ONLY = /* @__PURE__ */ new Set([
		"c:baseTimeUnit",
		"c:majorUnit",
		"c:majorTimeUnit",
		"c:minorUnit",
		"c:minorTimeUnit"
	]);
	var TIME_UNITS = [
		"days",
		"months",
		"years"
	];
	/**
	* A group with its series: the template's, patched, and after them, new ones. A group without series of its own has
	* the new ones after its `c:varyColors` and the like.
	*/
	var withSeries = (group, patched, added) => {
		var _group$elements;
		const children = (_group$elements = group.elements) !== null && _group$elements !== void 0 ? _group$elements : [];
		const isSeries = (child) => child.type === "element" && child.name === "c:ser";
		const last = children.reduce((found, child, index) => isSeries(child) ? index : found, -1);
		if (last === -1) {
			const before = children.reduce((found, child, index) => BEFORE_SERIES.has(nameOf(child)) ? index : found, -1);
			return withChildren(group, [
				...children.slice(0, before + 1),
				...added,
				...children.slice(before + 1)
			]);
		}
		return withChildren(group, children.flatMap((child, index) => {
			if (!isSeries(child)) return [child];
			const own = patched.get(child);
			return [...own === void 0 ? [] : [own], ...index === last ? added : []];
		}));
	};
	/**
	* A date axis as a category axis, for categories that aren't dates.
	*/
	var asCategoryAxis = (axis) => _objectSpread2(_objectSpread2({}, withoutChildren(axis, (child) => DATE_AXIS_ONLY.has(nameOf(child)))), {}, { name: "c:catAx" });
	/**
	* A date axis spacing its dates by the new dates' unit, if it spaced them by a longer one, so no two fall together.
	*/
	var withTimeUnit = (axis, unit) => mapChildren(axis, (child) => {
		var _valueOf;
		return child.name === "c:baseTimeUnit" && TIME_UNITS.indexOf((_valueOf = valueOf(child)) !== null && _valueOf !== void 0 ? _valueOf : "days") > TIME_UNITS.indexOf(unit) ? [createXmlElement("c:baseTimeUnit", { val: unit })] : [child];
	});
	var PIE_TYPES = [
		"pie",
		"doughnut",
		"pieOfPie",
		"barOfPie"
	];
	/**
	* A pie of pie or bar of pie chart whose own split (`c:custSplit`) has only the slices it has now.
	*/
	var withSplitUpTo = (group, count) => mapChildren(group, (child) => [child.name === "c:custSplit" ? withoutChildren(child, (point) => {
		var _numberOf;
		return point.name === "c:secondPiePt" && !(((_numberOf = numberOf(point)) !== null && _numberOf !== void 0 ? _numberOf : count) < count);
	}) : child]);
	var maxOf = (values) => values.reduce((max, value) => value === void 0 ? max : Math.max(max, value), -1);
	/**
	* The chart part's root with the new data.
	*
	* @param format - Formats `docx/charts`' XML as the template's parts are parsed
	* @param createSeries - Creates the series `docx/charts` would write for the new data, for a chart that has none to copy
	* @returns The new root, and the elements of the new data, which refer to the new workbook
	*/
	var patchChartSpace = (chart, data, format, createSeries) => {
		var _model$group, _kept$0$group, _kept$;
		const references = /* @__PURE__ */ new Set();
		const formatData = (content) => {
			const element = format(content);
			references.add(element);
			return element;
		};
		const dataOf = (series) => [
			formatData(createSeriesName(series.name)),
			formatData(createDataSource(chart.kind === "category" ? "c:cat" : "c:xVal", series.categories)),
			formatData(createDataSource(chart.kind === "category" ? "c:val" : "c:yVal", series.values)),
			...chart.kind === "bubble" && series.sizes ? [formatData(createDataSource("c:bubbleSize", series.sizes))] : []
		];
		const colorOf = (index) => format(createSeriesColor(index));
		const patch = (element, { varyColors }, series, templateCount) => {
			const count = series.values.points.length;
			const withNewData = withoutPointsPast(withData(element, dataOf(series)), count);
			return varyColors ? withPointsUpTo(withNewData, count, templateCount, colorOf) : withNewData;
		};
		const kept = chart.series.slice(0, data.series.length);
		const patched = new Map(kept.map((own, index) => [own.element, patch(own.element, own.group, data.series[index], pointCountOf(own.element))]));
		const model = chart.series[chart.series.length - 1];
		const group = (_model$group = model === null || model === void 0 ? void 0 : model.group) !== null && _model$group !== void 0 ? _model$group : chart.groups[0];
		const created = model === void 0 && data.series.length > 0 ? createSeries() : [];
		const firstIndex = maxOf(chart.series.map(({ index }) => index)) + 1;
		const firstOrder = maxOf(chart.series.map(({ order }) => order)) + 1;
		const added = data.series.slice(kept.length).map((series, offset) => {
			const position = kept.length + offset;
			const base = model === void 0 ? created[position] : withIndex(copySeries(model.element, PIE_TYPES.includes(group.type), colorOf(position)), firstIndex + offset, firstOrder + offset);
			return patch(base, group, series, model === void 0 ? 0 : pointCountOf(model.element));
		});
		const groups = new Map(chart.groups.map(({ element }) => {
			const withNewSeries = withSeries(element, patched, element === group.element ? added : []);
			return [element, element.name === "c:ofPieChart" ? withSplitUpTo(withNewSeries, data.series[0].values.points.length) : withNewSeries];
		}));
		const removed = new Set(chart.groups.filter(({ element }) => childrenOf(element, "c:ser").length > 0 && childrenOf(groups.get(element), "c:ser").length === 0).map(({ element }) => element));
		const axesOf = (element) => childrenOf(element, "c:axId").flatMap((axis) => {
			const id = valueOf(axis);
			return id === void 0 ? [] : [id];
		});
		const usedAxes = new Set(chart.groups.filter(({ element }) => !removed.has(element)).flatMap(({ element }) => axesOf(element)));
		const unusedAxes = new Set([...removed].flatMap(axesOf).filter((axis) => !usedAxes.has(axis)));
		const plotArea = mapChildren(chart.plotArea, (child) => {
			const patchedGroup = groups.get(child);
			if (patchedGroup !== void 0) return removed.has(child) ? [] : [patchedGroup];
			const id = valueOf(childOf(child, "c:axId"));
			if (AXES.has(nameOf(child)) && id !== void 0 && unusedAxes.has(id)) return [];
			if (child.name === "c:dateAx" && chart.kind === "category") return [data.dates === void 0 ? asCategoryAxis(child) : withTimeUnit(child, data.dates)];
			return [child];
		});
		const single = data.series.length === 1 ? (_kept$0$group = (_kept$ = kept[0]) === null || _kept$ === void 0 ? void 0 : _kept$.group) !== null && _kept$0$group !== void 0 ? _kept$0$group : group : void 0;
		const entries = (single === null || single === void 0 ? void 0 : single.varyColors) ? data.series[0].values.points.length : data.series.length;
		const newChart = mapChildren(chart.chart, (child) => {
			if (child === chart.plotArea) return [plotArea];
			return [child.name === "c:legend" ? withoutChildren(child, (entry) => {
				var _numberOf2;
				return entry.name === "c:legendEntry" && ((_numberOf2 = numberOf(childOf(entry, "c:idx"))) !== null && _numberOf2 !== void 0 ? _numberOf2 : 0) >= entries;
			}) : child];
		});
		const root = mapChildren(chart.chartSpace, (child) => {
			if (child === chart.chart) return [newChart];
			return [child.name === "c:date1904" ? withAttributes(child, { val: 0 }) : child];
		});
		return {
			chartSpace: withAttributes(root, Object.fromEntries([
				["xmlns:c", CHART_NAMESPACE],
				["xmlns:a", "http://schemas.openxmlformats.org/drawingml/2006/main"],
				["xmlns:r", RELATIONSHIPS_NAMESPACE]
			].filter(([name]) => attributeOf(root, name) === void 0))),
			references
		};
	};
	/**
	* The chart part's root, referring to its workbook by a relationship id, with Word's `c:autoUpdate` if it had no
	* reference to a workbook.
	*/
	var withWorkbook = (chartSpace, relationshipId) => {
		var _relationshipIdAttrib;
		const externalData = childOf(chartSpace, "c:externalData");
		if (externalData === void 0) return withChild(chartSpace, createXmlElement("c:externalData", { "r:id": relationshipId }, [createXmlElement("c:autoUpdate", { val: 0 })]), CHART_SPACE_ORDER);
		const name = (_relationshipIdAttrib = relationshipIdAttributeOf(externalData)) !== null && _relationshipIdAttrib !== void 0 ? _relationshipIdAttrib : "r:id";
		return mapChildren(chartSpace, (child) => [child === externalData ? withAttributes(child, { [name]: relationshipId }) : child]);
	};
	/**
	* The name of an element's relationship id attribute, such as `r:id`, whatever its prefix.
	*/
	var relationshipIdAttributeOf = (element) => {
		var _element$attributes;
		return Object.keys((_element$attributes = element === null || element === void 0 ? void 0 : element.attributes) !== null && _element$attributes !== void 0 ? _element$attributes : {}).find((name) => name.endsWith(":id") && !name.startsWith("xmlns"));
	};
	var REFERENCE = /(^|:)(f|sqref)$/;
	/**
	* The first element that refers to cells of the chart's workbook, other than the new data's, with the elements it is in.
	*/
	var findWorkbookReference = (element, skip, path = []) => elementsOf(element).reduce((found, child) => {
		if (found !== void 0 || skip.has(child)) return found;
		return REFERENCE.test(nameOf(child)) ? [...path, child] : findWorkbookReference(child, skip, [...path, child]);
	}, void 0);
	/**
	* Why something that refers to cells of the chart's workbook can't be kept, and what to do in Word.
	*
	* @param path - The element that refers to cells, with the elements it is in
	*/
	var describeWorkbookReference = (path) => {
		const names = path.map(nameOf);
		return `${(() => {
			if (names.some((name) => name.endsWith(":datalabelsRange"))) return "Its data labels show text from cells of its workbook (Word's \"Value From Cells\"). Turn that off in Word";
			if (names.some((name) => /:filtered/.test(name) || /:categoryFilterException/.test(name))) return "It has series or categories hidden with Word's chart filters. Show them, or remove them in Word's Select Data";
			if (names.includes("c:errBars")) return "Its error bars' custom values are cells of its workbook. Give them fixed values in Word, or remove them";
			if (names.includes("c:title")) return "A title is linked to a cell of its workbook. Type the title in Word instead";
			return names.some((name) => name === "c:dLbl" || name === "c:dLbls" || name === "c:trendlineLbl") ? "A label is linked to a cell of its workbook. Type the label in Word instead" : `Something in it refers to cells of its workbook (${names.join(" > ")})`;
		})()}: the new data replaces the workbook`;
	};
	//#endregion
	//#region src/charts/chart-data-patch.ts
	var STOCK_OPTIONS = [
		"open",
		"high",
		"low",
		"close",
		"volume"
	];
	var quoted = (value) => typeof value === "string" ? `"${value}"` : String(value);
	var checkSize = ({ x, y, size }, series) => {
		if (size !== void 0 && !(typeof size === "number" && size >= 0 && Number.isFinite(size))) throw new Error(`Invalid size ${quoted(size)} of the point at (${x}, ${y}) in series "${series}". Expected a finite number of 0 or more`);
	};
	var copyValues = (values) => Array.isArray(values) ? [...values] : values;
	/**
	* A copy of the categories, with their dates and groups copied too.
	*/
	var copyCategories = (categories) => categories.map((category) => {
		if (category instanceof Date) return new Date(category.getTime());
		if (typeof category === "object" && category !== null) {
			const { name, categories: inner } = category;
			return {
				name,
				categories: Array.isArray(inner) ? copyCategories(inner) : inner
			};
		}
		return category;
	});
	/**
	* Checks a stock chart's prices, and copies them.
	*
	* @throws If there are no categories, a price is missing or wrong, or a high is below its low, as for `ChartRun`
	*/
	var readStockOptions = (options) => {
		const { categories, names, description } = options;
		if (description !== void 0 && typeof description !== "string") throw new Error(`Invalid description ${quoted(description)}. Expected text`);
		if (!Array.isArray(categories)) throw new Error("Invalid option categories. A stock chart's prices need categories, one for each price");
		const copied = _objectSpread2(_objectSpread2({ categories: copyCategories(categories) }, Object.fromEntries(STOCK_OPTIONS.flatMap((option) => options[option] === void 0 ? [] : [[option, copyValues(options[option])]]))), names === void 0 ? {} : { names: _objectSpread2({}, names) });
		checkChartOptions(_objectSpread2({ type: "stock" }, copied));
		return {
			kind: "stock",
			options: copied,
			description
		};
	};
	/**
	* Checks the options, and copies the data.
	*
	* @throws If there are no series, a series has no name, has neither values nor points, or has one and other series the
	* other, series with values have no categories or series with points have them, or the data is wrong, as for
	* `ChartRun`: see its errors
	*/
	var readOptions = (options) => {
		if (typeof options !== "object" || options === null) throw new Error(`Invalid chart data ${quoted(options)}. Expected { categories, series }, or for a scatter or bubble chart, { series }`);
		const { series, description } = options;
		const prices = STOCK_OPTIONS.find((option) => option in options);
		if (series === void 0 && prices !== void 0) return readStockOptions(options);
		if (prices !== void 0) throw new Error(`Invalid option ${prices}. A stock chart's data is its prices, and another chart's is its series, not both`);
		if (!Array.isArray(series) || series.length === 0) throw new Error("A chart needs at least one series");
		if (description !== void 0 && typeof description !== "string") throw new Error(`Invalid description ${quoted(description)}. Expected text`);
		const shapes = series.map((one, index) => {
			const { name, values, points } = typeof one === "object" && one !== null ? one : {};
			if (typeof name !== "string") throw new Error(`Invalid name ${quoted(name)} of series ${index + 1}. Expected text`);
			if (Array.isArray(values) === Array.isArray(points)) throw new Error(`Series "${name}" needs values, for a chart with categories, or points, for a scatter or bubble chart`);
			return {
				name,
				points: Array.isArray(points)
			};
		});
		const withPoints = shapes.find(({ points }) => points);
		const withValues = shapes.find(({ points }) => !points);
		if (withPoints !== void 0 && withValues !== void 0) throw new Error(`Series "${withValues.name}" has values, and series "${withPoints.name}" has points. A chart's series all have values, or all have points`);
		const { categories } = options;
		if (withPoints !== void 0) {
			if (categories !== void 0) throw new Error("Invalid option categories. The series have points, which have their own x values");
			const pointSeries = series.map(({ name, points }) => ({
				name,
				points: points.map((point) => _objectSpread2({}, point))
			}));
			checkChartOptions({
				type: "scatter",
				series: pointSeries
			});
			pointSeries.forEach(({ name, points }) => points.forEach((point) => checkSize(point, name)));
			return {
				kind: "points",
				series: pointSeries,
				description
			};
		}
		if (!Array.isArray(categories)) throw new Error("Invalid option categories. Series with values need categories, one for each value");
		const copiedCategories = copyCategories(categories);
		const copied = series.map(({ name, values }) => ({
			name,
			values: [...values]
		}));
		checkChartOptions({
			type: "line",
			categories: copiedCategories,
			series: copied
		});
		return {
			kind: "category",
			categories: copiedCategories,
			series: copied,
			description
		};
	};
	var withArticle = (type) => `${type === "area" ? "an" : "a"} ${TYPE_NAMES$1[type]} chart`;
	/**
	* A stock chart's options from the template's chart and the new prices, which have to be the same kind of stock chart
	* as the template's: with opening prices if it has them, and volumes if it has them.
	*
	* @throws If the data isn't for a stock chart, or has opening prices or volumes the template's chart doesn't, or not
	* those it does
	*/
	var stockOptionsFor = (chart, data, title) => {
		if (data.kind !== "stock") throw new Error("It is a stock chart, whose data is each category's prices. Give categories, and high, low and close prices");
		const kinds = [[
			"open",
			"opening prices",
			childrenOf(chart.groups.find(({ type }) => type === "stock").element, "c:ser").length === 4
		], [
			"volume",
			"volumes",
			chart.groups.length > 1
		]];
		for (const [option, name, has] of kinds) {
			const given = data.options[option] !== void 0;
			if (has && !given) throw new Error(`It is a stock chart with ${name}. Give ${option} too`);
			if (!has && given) throw new Error(`It is a stock chart without ${name}, so it can't take ${option}`);
		}
		return _objectSpread2({
			type: "stock",
			title
		}, data.options);
	};
	/**
	* The options `docx/charts` would draw the new data with in the template's chart's type, which check the data and
	* describe it.
	*
	* @throws If the data isn't for the chart's type: values for a scatter or bubble chart, points for another, or points
	* without sizes for a bubble chart
	*/
	var optionsFor = (chart, data) => {
		var _chart$title;
		const title = ((_chart$title = chart.title) === null || _chart$title === void 0 ? void 0 : _chart$title.trim()) ? chart.title : void 0;
		if (chart.type === "stock") return stockOptionsFor(chart, data, title);
		if (chart.kind === "category") {
			if (data.kind !== "category") throw new Error(`It is ${withArticle(chart.type)}, whose series have a value for each category. Give categories, and each series values`);
			return {
				type: chart.type,
				title,
				categories: data.categories,
				series: data.series
			};
		}
		if (data.kind !== "points") throw new Error(`It is ${withArticle(chart.type)}, whose series have points. Give each series points, with an x and y${chart.kind === "bubble" ? " and a size" : ""}`);
		if (chart.kind === "scatter") return {
			type: "scatter",
			title,
			series: data.series.map(({ name, points }) => ({
				name,
				points: points.map(({ x, y }) => ({
					x,
					y
				}))
			}))
		};
		return {
			type: "bubble",
			title,
			series: data.series.map(({ name, points }) => ({
				name,
				points: points.map((point) => {
					if (!("size" in point) || point.size === void 0) throw new Error(`The point at (${point.x}, ${point.y}) in series "${name}" has no size, and a bubble chart's points each need one`);
					return point;
				})
			}))
		};
	};
	var rangeOf = (formula) => {
		const [, column, first, last] = /\$([A-Z]+)\$(\d+)(?::\$[A-Z]+\$(\d+))?$/.exec(formula);
		return {
			column: columnIndexOf(column),
			first: Number(first) - 1,
			last: Number(last !== null && last !== void 0 ? last : first) - 1
		};
	};
	/**
	* The sheet with a number format on the cells a reference refers to.
	*/
	var withCellFormat = (sheet, data) => {
		if ((data === null || data === void 0 ? void 0 : data.type) !== "number" || data.format === void 0) return sheet;
		const { format } = data;
		const { column, first, last } = rangeOf(data.formula);
		return sheet.map((row, index) => index < first || index > last ? row : row.map((cell, at) => at !== column || cell === void 0 || typeof cell === "string" ? cell : {
			value: typeof cell === "number" ? cell : cell.value,
			format
		}));
	};
	/**
	* The data with the template's number formats, such as "0%", in its caches and cells, as Word keeps a chart's number
	* formats when its data is edited. Categories keep the template's format if it and the new categories are both dates,
	* or both other numbers.
	*
	* @param unit - The unit the categories are spaced by, if they are dates
	*/
	var withTemplateFormats = (data, chart, unit) => {
		const withFormat = (own, format) => own.type === "number" && format !== void 0 ? _objectSpread2(_objectSpread2({}, own), {}, { format }) : own;
		const categoryFormat = (own, format) => {
			if (own.type !== "number" || format === void 0 || chart.kind !== "category") return format;
			return own.format !== void 0 === isDateFormat(format) ? format : void 0;
		};
		const series = data.series.map((one, index) => {
			var _ref, _chart$series$index;
			const template = (_ref = (_chart$series$index = chart.series[index]) !== null && _chart$series$index !== void 0 ? _chart$series$index : chart.series[chart.series.length - 1]) === null || _ref === void 0 ? void 0 : _ref.element;
			const categoriesName = chart.kind === "category" ? "c:cat" : "c:xVal";
			const valuesName = chart.kind === "category" ? "c:val" : "c:yVal";
			return _objectSpread2(_objectSpread2({}, one), {}, {
				categories: withFormat(one.categories, categoryFormat(one.categories, formatCodeOf(template, categoriesName))),
				values: withFormat(one.values, formatCodeOf(template, valuesName))
			}, one.sizes === void 0 ? {} : { sizes: withFormat(one.sizes, formatCodeOf(template, "c:bubbleSize")) });
		});
		const shared = chart.kind === "category" ? series.map((one) => _objectSpread2(_objectSpread2({}, one), {}, { categories: series[0].categories })) : series;
		return {
			sheet: shared.reduce((cells, one, index) => [
				one.values,
				one.sizes,
				...chart.kind === "category" && index > 0 ? [] : [one.categories]
			].reduce(withCellFormat, cells), data.sheet),
			series: shared,
			dates: unit
		};
	};
	var chartIdOf = (drawing) => {
		const charts = descendantsOf(drawing, "c:chart");
		if (charts.length > 1) throw new Error(`It is a group of ${charts.length} charts. Put the placeholder in the alt text of one of them`);
		if (charts.length === 0) {
			if (descendantsOf(drawing, "cx:chart").length > 0) throw new Error("It is a chart of a type Office 2016 added, such as a waterfall, histogram or treemap chart, which ChartDataPatch can't patch");
			if (descendantsOf(drawing, "pic:pic").length > 0) throw new Error("It is a picture, not a chart");
			if (descendantsOf(drawing, "wps:wsp").length > 0) throw new Error("It is a shape, not a chart");
			throw new Error("It isn't a chart");
		}
		const name = relationshipIdAttributeOf(charts[0]);
		const id = name === void 0 ? void 0 : attributeOf(charts[0], name);
		if (!id) throw new Error("Its c:chart has no relationship id (r:id)");
		return id;
	};
	/**
	* Sets the chart's alt text: a description of the new data, as a description of the template's data no longer fits it,
	* and its title without the placeholder. A decorative chart isn't described.
	*/
	var setAltText = ({ properties, placeholder }, description, describe) => {
		const title = attributeOf(properties, "title");
		const decorative = descendantsOf(properties, "adec:decorative").some((element) => {
			var _valueOf;
			return !["0", "false"].includes((_valueOf = valueOf(element)) !== null && _valueOf !== void 0 ? _valueOf : "1");
		});
		properties.attributes = withAttributes(properties, {
			descr: (description !== null && description !== void 0 ? description : decorative ? void 0 : describe()) || void 0,
			title: (title === null || title === void 0 ? void 0 : title.split(placeholder).join("").trim()) || void 0
		}).attributes;
	};
	/**
	* Replaces the data of a chart in a template, found by a placeholder in its alt text, such as `{{sales}}`, keeping its
	* look: its type, title, colours, fonts, labels, axes and legend. Give it as a patch to `patchDocument`, with the
	* placeholder's key.
	*
	* - Each series' name and data are replaced, in the order the series are plotted, and its data is written in the
	*   chart's own number formats, such as "0%".
	* - New series copy the look of the template's last series, in their own colour, the next of the theme's accents, as
	*   `ChartRun` colours them. Series the new data doesn't have are removed, with any axes only they used.
	* - Points past the new data lose their own colours and labels. When each slice of a pie has its own colour, new
	*   slices take the next of the theme's accents.
	* - The chart's workbook is replaced with one holding the new data, so Word's "Edit Data" opens it.
	* - The alt text's description is replaced with a description of the new data.
	*
	* The patch checks the data against the chart's type when the document is patched: a pie chart has one series, a
	* scatter or bubble chart's series have points, and a stock chart has prices, with opening prices and volumes if the
	* template's has them. Put the placeholder in the chart's alt text in Word, in "Alt Text" or "Edit Alt Text". A
	* placeholder in the document's text is left as it is.
	*
	* @publicApi
	*
	* @example
	* ```typescript
	* await patchDocument({
	*   outputType: "nodebuffer",
	*   data: template,
	*   patches: {
	*     sales: new ChartDataPatch({
	*       categories: ["Jan", "Feb", "Mar"],
	*       series: [{ name: "2025", values: [10, 20, 30] }],
	*     }),
	*   },
	* });
	* ```
	*/
	var ChartDataPatch = class extends docx.DrawingPatch {
		/**
		* @throws If there are no series, a series has no name, or has neither values nor points, some series have values
		* and others points, series with values have no categories, or a value, category or point is wrong, as for
		* `ChartRun`
		*/
		constructor(options) {
			super();
			_defineProperty(this, "data", void 0);
			_defineProperty(this, "patched", /* @__PURE__ */ new WeakSet());
			this.data = readOptions(options);
		}
		/**
		* Replaces the chart's data, and its workbook, and describes it in its alt text.
		*
		* @throws If the drawing isn't a chart, is a type of chart this can't patch, such as a surface chart, or has something
		* that refers to its workbook's cells other than its data, such as labels from cells, or the data isn't for the
		* chart's type, such as two series for a pie chart
		*/
		patch(drawing, template) {
			try {
				this.patchChart(drawing, template);
			} catch (error) {
				throw new Error(`Can't patch the chart ${drawing.placeholder}. ${error instanceof Error ? error.message : String(error)}`, { cause: error });
			}
		}
		patchChart(drawing, template) {
			const part = template.getRelatedPart(drawing.part, chartIdOf(drawing.element));
			if ((part === null || part === void 0 ? void 0 : part.xml) === void 0) throw new Error("It refers to a chart part the template doesn't have");
			const chartSpace = childOf(part.xml, "c:chartSpace");
			if (chartSpace === void 0) throw new Error(`Its part ${part.path} isn't a chart: it has no c:chartSpace`);
			const chart = readTemplateChart(chartSpace);
			const options = optionsFor(chart, this.data);
			if (!this.patched.has(part.xml)) {
				const dates = ("categories" in options ? leafCategoriesOf(options.categories) : []).filter((category) => category instanceof Date);
				const data = withTemplateFormats(createChartData(options), chart, dates.length > 0 ? timeUnitOf(dates) : void 0);
				const patched = patchChartSpace(chart, data, template.format, () => descendantsOf(template.format(createPlotArea(options, data)), "c:ser"));
				const reference = findWorkbookReference(patched.chartSpace, patched.references);
				if (reference !== void 0) throw new Error(describeWorkbookReference(reference));
				const externalData = childOf(chartSpace, "c:externalData");
				const name = relationshipIdAttributeOf(externalData);
				const id = template.replaceRelatedPart(part, name === void 0 ? void 0 : attributeOf(externalData, name), createWorkbookPart(data.sheet));
				const withNewWorkbook = withWorkbook(patched.chartSpace, id);
				part.xml.elements = part.xml.elements.map((element) => element === chartSpace ? withNewWorkbook : element);
				this.patched.add(part.xml);
			}
			setAltText(drawing, this.data.description, () => describeChart(options));
		}
	};
	//#endregion
	exports.ChartDataPatch = ChartDataPatch;
	exports.ChartRun = ChartRun;
	return exports;
})({}, docx);
