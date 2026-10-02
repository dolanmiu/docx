var docxShapes = (function(exports, docx) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	//#region src/shapes/drawing/drawing-parts.ts
	/**
	* Small DrawingML elements that shapes and pictures in groups are made of. docx writes the same elements for images and
	* text boxes, but doesn't export them, so shapes write their own.
	*
	* @module
	*/
	/**
	* Creates `a:noFill`, for a shape with no fill or a line that isn't drawn.
	*/
	var createNoFill = () => new docx.BuilderElement({ name: "a:noFill" });
	/**
	* Creates `a:stretch`, which stretches a picture to fill its shape.
	*
	* ```xml
	* <a:stretch><a:fillRect/></a:stretch>
	* ```
	*/
	var createStretch = () => new docx.BuilderElement({
		name: "a:stretch",
		children: [new docx.BuilderElement({ name: "a:fillRect" })]
	});
	/**
	* Creates `a:srcRect`, the part of a picture that is shown. The crop is in percentages of the picture's size, and is
	* written in thousandths of a percent.
	*/
	var createSourceRectangle = (crop) => {
		const thousandths = (percentage) => percentage === void 0 ? void 0 : Math.round(percentage * 1e3);
		return new docx.BuilderElement({
			name: "a:srcRect",
			attributes: crop ? {
				left: {
					key: "l",
					value: thousandths(crop.left)
				},
				top: {
					key: "t",
					value: thousandths(crop.top)
				},
				right: {
					key: "r",
					value: thousandths(crop.right)
				},
				bottom: {
					key: "b",
					value: thousandths(crop.bottom)
				}
			} : void 0
		});
	};
	/**
	* Creates the extension list of an `a:blip` that holds an SVG picture. The blip itself shows the raster fallback, for
	* applications that can't draw SVG.
	*
	* ```xml
	* <a:extLst>
	*   <a:ext uri="{96DAC541-7B7A-43D3-8B79-37D633B846F1}">
	*     <asvg:svgBlip xmlns:asvg="http://schemas.microsoft.com/office/drawing/2016/SVG/main" r:embed="..."/>
	*   </a:ext>
	* </a:extLst>
	* ```
	*/
	var createSvgBlipExtension = (mediaData) => new docx.BuilderElement({
		name: "a:extLst",
		children: [new docx.BuilderElement({
			name: "a:ext",
			attributes: { uri: {
				key: "uri",
				value: "{96DAC541-7B7A-43D3-8B79-37D633B846F1}"
			} },
			children: [new docx.BuilderElement({
				name: "asvg:svgBlip",
				attributes: {
					namespace: {
						key: "xmlns:asvg",
						value: "http://schemas.microsoft.com/office/drawing/2016/SVG/main"
					},
					embed: {
						key: "r:embed",
						value: `rId{${mediaData.fileName}}`
					}
				}
			})]
		})]
	});
	/**
	* Creates `pic:cNvPicPr`, which stops the picture's aspect ratio and arrowheads being changed.
	*
	* ```xml
	* <pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr>
	* ```
	*/
	var createPictureLocks = () => new docx.BuilderElement({
		name: "pic:cNvPicPr",
		children: [new docx.BuilderElement({
			name: "a:picLocks",
			attributes: {
				noChangeAspect: {
					key: "noChangeAspect",
					value: 1
				},
				noChangeArrowheads: {
					key: "noChangeArrowheads",
					value: 1
				}
			}
		})]
	});
	/**
	* Creates `a:xfrm`: the position, size, rotation and flip of a shape or picture.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_Transform2D">
	*   <xsd:sequence>
	*     <xsd:element name="off" type="CT_Point2D" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="ext" type="CT_PositiveSize2D" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	*   <xsd:attribute name="rot" type="ST_Angle" use="optional" default="0"/>
	*   <xsd:attribute name="flipH" type="xsd:boolean" use="optional" default="false"/>
	*   <xsd:attribute name="flipV" type="xsd:boolean" use="optional" default="false"/>
	* </xsd:complexType>
	* ```
	*
	* @param children - Elements after the offset and size, such as a group's `a:chOff` and `a:chExt`
	*/
	var createTransform = (transformation, children = []) => {
		var _transformation$flip, _transformation$flip2, _transformation$offse, _transformation$offse2, _transformation$offse3, _transformation$offse4;
		return new docx.BuilderElement({
			name: "a:xfrm",
			attributes: {
				flipVertical: {
					key: "flipV",
					value: (_transformation$flip = transformation.flip) === null || _transformation$flip === void 0 ? void 0 : _transformation$flip.vertical
				},
				flipHorizontal: {
					key: "flipH",
					value: (_transformation$flip2 = transformation.flip) === null || _transformation$flip2 === void 0 ? void 0 : _transformation$flip2.horizontal
				},
				rotation: {
					key: "rot",
					value: transformation.rotation
				}
			},
			children: [
				new docx.BuilderElement({
					name: "a:off",
					attributes: {
						x: {
							key: "x",
							value: (_transformation$offse = (_transformation$offse2 = transformation.offset) === null || _transformation$offse2 === void 0 || (_transformation$offse2 = _transformation$offse2.emus) === null || _transformation$offse2 === void 0 ? void 0 : _transformation$offse2.x) !== null && _transformation$offse !== void 0 ? _transformation$offse : 0
						},
						y: {
							key: "y",
							value: (_transformation$offse3 = (_transformation$offse4 = transformation.offset) === null || _transformation$offse4 === void 0 || (_transformation$offse4 = _transformation$offse4.emus) === null || _transformation$offse4 === void 0 ? void 0 : _transformation$offse4.y) !== null && _transformation$offse3 !== void 0 ? _transformation$offse3 : 0
						}
					}
				}),
				new docx.BuilderElement({
					name: "a:ext",
					attributes: {
						x: {
							key: "cx",
							value: transformation.emus.x
						},
						y: {
							key: "cy",
							value: transformation.emus.y
						}
					}
				}),
				...children
			]
		});
	};
	/**
	* Creates `a:prstGeom`: one of the preset shapes, with its adjustments written as shape guides.
	*
	* @param type - The preset's OOXML name (`ST_ShapeType`), such as `"roundRect"`
	* @param adjustments - Raw shape guide values, keyed by guide name, such as `{ adj: 25000 }`. They are rounded
	*
	* ```xml
	* <a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 25000"/></a:avLst></a:prstGeom>
	* ```
	*/
	var createPresetGeometry = (type = "rect", adjustments = {}) => new docx.BuilderElement({
		name: "a:prstGeom",
		attributes: { type: {
			key: "prst",
			value: type
		} },
		children: [new docx.BuilderElement({
			name: "a:avLst",
			children: Object.entries(adjustments).map(([name, value]) => new docx.BuilderElement({
				name: "a:gd",
				attributes: {
					name: {
						key: "name",
						value: name
					},
					formula: {
						key: "fmla",
						value: `val ${Math.round(value)}`
					}
				}
			}))
		})]
	});
	/**
	* Creates `wps:txbx`: the text inside a shape, as paragraphs in `w:txbxContent`.
	*/
	var createTextBox = (children) => new docx.BuilderElement({
		name: "wps:txbx",
		children: [new docx.BuilderElement({
			name: "w:txbxContent",
			children: [...children]
		})]
	});
	//#endregion
	//#region src/shapes/preset-shape/preset-shape-type.ts
	/**
	* Preset shape types for DrawingML shapes.
	*
	* Reference: ST_ShapeType in ooxml-schemas/ISO-IEC29500-4_2016/dml-main.xsd
	*
	* @module
	*/
	/**
	* Every preset shape, by the name this library gives it, mapped to its name in OOXML (`a:prstGeom/@prst`).
	* The OOXML names are often abbreviated (`roundRect`) or numbered (`ribbon2`), so the library uses names
	* that say what the shape is.
	*/
	var PRESET_SHAPE_OOXML_NAMES = {
		line: "line",
		inverseLine: "lineInv",
		straightConnector: "straightConnector1",
		elbowConnectorOneBend: "bentConnector2",
		elbowConnector: "bentConnector3",
		elbowConnectorThreeBends: "bentConnector4",
		elbowConnectorFourBends: "bentConnector5",
		curvedConnectorOneBend: "curvedConnector2",
		curvedConnector: "curvedConnector3",
		curvedConnectorThreeBends: "curvedConnector4",
		curvedConnectorFourBends: "curvedConnector5",
		triangle: "triangle",
		rightTriangle: "rtTriangle",
		diamond: "diamond",
		parallelogram: "parallelogram",
		trapezoid: "trapezoid",
		nonIsoscelesTrapezoid: "nonIsoscelesTrapezoid",
		pentagon: "pentagon",
		hexagon: "hexagon",
		heptagon: "heptagon",
		octagon: "octagon",
		decagon: "decagon",
		dodecagon: "dodecagon",
		ellipse: "ellipse",
		teardrop: "teardrop",
		pieWedge: "pieWedge",
		pie: "pie",
		blockArc: "blockArc",
		donut: "donut",
		noSymbol: "noSmoking",
		chord: "chord",
		arc: "arc",
		frame: "frame",
		halfFrame: "halfFrame",
		lShape: "corner",
		diagonalStripe: "diagStripe",
		cross: "plus",
		plaque: "plaque",
		cylinder: "can",
		cube: "cube",
		beveledRectangle: "bevel",
		foldedCorner: "foldedCorner",
		smileyFace: "smileyFace",
		heart: "heart",
		lightningBolt: "lightningBolt",
		sun: "sun",
		moon: "moon",
		cloud: "cloud",
		leftBracket: "leftBracket",
		rightBracket: "rightBracket",
		leftBrace: "leftBrace",
		rightBrace: "rightBrace",
		bracketPair: "bracketPair",
		bracePair: "bracePair",
		rectangle: "rect",
		roundedRectangle: "roundRect",
		roundedCornerRectangle: "round1Rect",
		topRoundedCornersRectangle: "round2SameRect",
		diagonalRoundedCornersRectangle: "round2DiagRect",
		snippedCornerRectangle: "snip1Rect",
		topSnippedCornersRectangle: "snip2SameRect",
		diagonalSnippedCornersRectangle: "snip2DiagRect",
		roundedAndSnippedCornersRectangle: "snipRoundRect",
		rightArrow: "rightArrow",
		leftArrow: "leftArrow",
		upArrow: "upArrow",
		downArrow: "downArrow",
		leftRightArrow: "leftRightArrow",
		upDownArrow: "upDownArrow",
		quadArrow: "quadArrow",
		leftRightUpArrow: "leftRightUpArrow",
		bentArrow: "bentArrow",
		uTurnArrow: "uturnArrow",
		leftUpArrow: "leftUpArrow",
		bentUpArrow: "bentUpArrow",
		curvedRightArrow: "curvedRightArrow",
		curvedLeftArrow: "curvedLeftArrow",
		curvedUpArrow: "curvedUpArrow",
		curvedDownArrow: "curvedDownArrow",
		stripedRightArrow: "stripedRightArrow",
		notchedRightArrow: "notchedRightArrow",
		pentagonArrow: "homePlate",
		chevron: "chevron",
		rightArrowCallout: "rightArrowCallout",
		downArrowCallout: "downArrowCallout",
		leftArrowCallout: "leftArrowCallout",
		upArrowCallout: "upArrowCallout",
		leftRightArrowCallout: "leftRightArrowCallout",
		upDownArrowCallout: "upDownArrowCallout",
		quadArrowCallout: "quadArrowCallout",
		circularArrow: "circularArrow",
		leftCircularArrow: "leftCircularArrow",
		leftRightCircularArrow: "leftRightCircularArrow",
		swooshArrow: "swooshArrow",
		mathPlus: "mathPlus",
		mathMinus: "mathMinus",
		mathMultiply: "mathMultiply",
		mathDivide: "mathDivide",
		mathEqual: "mathEqual",
		mathNotEqual: "mathNotEqual",
		flowChartProcess: "flowChartProcess",
		flowChartAlternateProcess: "flowChartAlternateProcess",
		flowChartDecision: "flowChartDecision",
		flowChartInputOutput: "flowChartInputOutput",
		flowChartPredefinedProcess: "flowChartPredefinedProcess",
		flowChartInternalStorage: "flowChartInternalStorage",
		flowChartDocument: "flowChartDocument",
		flowChartMultidocument: "flowChartMultidocument",
		flowChartTerminator: "flowChartTerminator",
		flowChartPreparation: "flowChartPreparation",
		flowChartManualInput: "flowChartManualInput",
		flowChartManualOperation: "flowChartManualOperation",
		flowChartConnector: "flowChartConnector",
		flowChartOffpageConnector: "flowChartOffpageConnector",
		flowChartPunchedCard: "flowChartPunchedCard",
		flowChartPunchedTape: "flowChartPunchedTape",
		flowChartSummingJunction: "flowChartSummingJunction",
		flowChartOr: "flowChartOr",
		flowChartCollate: "flowChartCollate",
		flowChartSort: "flowChartSort",
		flowChartExtract: "flowChartExtract",
		flowChartMerge: "flowChartMerge",
		flowChartOfflineStorage: "flowChartOfflineStorage",
		flowChartOnlineStorage: "flowChartOnlineStorage",
		flowChartDelay: "flowChartDelay",
		flowChartMagneticTape: "flowChartMagneticTape",
		flowChartMagneticDisk: "flowChartMagneticDisk",
		flowChartMagneticDrum: "flowChartMagneticDrum",
		flowChartDisplay: "flowChartDisplay",
		explosion12: "irregularSeal1",
		explosion14: "irregularSeal2",
		star4: "star4",
		star5: "star5",
		star6: "star6",
		star7: "star7",
		star8: "star8",
		star10: "star10",
		star12: "star12",
		star16: "star16",
		star24: "star24",
		star32: "star32",
		ribbonUp: "ribbon2",
		ribbonDown: "ribbon",
		curvedRibbonUp: "ellipseRibbon2",
		curvedRibbonDown: "ellipseRibbon",
		leftRightRibbon: "leftRightRibbon",
		verticalScroll: "verticalScroll",
		horizontalScroll: "horizontalScroll",
		wave: "wave",
		doubleWave: "doubleWave",
		rectangularCallout: "wedgeRectCallout",
		roundedRectangularCallout: "wedgeRoundRectCallout",
		ellipticalCallout: "wedgeEllipseCallout",
		cloudCallout: "cloudCallout",
		lineCallout: "borderCallout1",
		bentLineCallout: "borderCallout2",
		doubleBentLineCallout: "borderCallout3",
		lineCalloutWithAccentBar: "accentCallout1",
		bentLineCalloutWithAccentBar: "accentCallout2",
		doubleBentLineCalloutWithAccentBar: "accentCallout3",
		lineCalloutWithNoBorder: "callout1",
		bentLineCalloutWithNoBorder: "callout2",
		doubleBentLineCalloutWithNoBorder: "callout3",
		lineCalloutWithBorderAndAccentBar: "accentBorderCallout1",
		bentLineCalloutWithBorderAndAccentBar: "accentBorderCallout2",
		doubleBentLineCalloutWithBorderAndAccentBar: "accentBorderCallout3",
		actionButtonBlank: "actionButtonBlank",
		actionButtonHome: "actionButtonHome",
		actionButtonHelp: "actionButtonHelp",
		actionButtonInformation: "actionButtonInformation",
		actionButtonForwardNext: "actionButtonForwardNext",
		actionButtonBackPrevious: "actionButtonBackPrevious",
		actionButtonEnd: "actionButtonEnd",
		actionButtonBeginning: "actionButtonBeginning",
		actionButtonReturn: "actionButtonReturn",
		actionButtonDocument: "actionButtonDocument",
		actionButtonSound: "actionButtonSound",
		actionButtonMovie: "actionButtonMovie",
		gear6: "gear6",
		gear9: "gear9",
		funnel: "funnel",
		cornerTabs: "cornerTabs",
		squareTabs: "squareTabs",
		plaqueTabs: "plaqueTabs",
		chartX: "chartX",
		chartStar: "chartStar",
		chartPlus: "chartPlus"
	};
	var OOXML_NAMES = new Map(Object.entries(PRESET_SHAPE_OOXML_NAMES));
	var NAMES_BY_OOXML_NAME = new Map(Object.entries(PRESET_SHAPE_OOXML_NAMES).map(([name, ooxml]) => [ooxml, name]));
	/**
	* The OOXML name (`ST_ShapeType`) of a preset shape, such as `"roundRect"` for a `"roundedRectangle"`.
	*
	* @throws If `type` is not a preset shape. The error suggests the right name when `type` is an OOXML name
	*/
	var getOoxmlShapeName = (type) => {
		const ooxmlName = OOXML_NAMES.get(type);
		if (ooxmlName === void 0) {
			const suggestion = NAMES_BY_OOXML_NAME.get(type);
			throw new Error(`Invalid shape type "${type}".${suggestion ? ` Did you mean "${suggestion}"?` : ""}`);
		}
		return ooxmlName;
	};
	var CONNECTOR_SHAPE_TYPES = /* @__PURE__ */ new Set([
		"line",
		"inverseLine",
		"straightConnector",
		"elbowConnectorOneBend",
		"elbowConnector",
		"elbowConnectorThreeBends",
		"elbowConnectorFourBends",
		"curvedConnectorOneBend",
		"curvedConnector",
		"curvedConnectorThreeBends",
		"curvedConnectorFourBends"
	]);
	/**
	* Whether a preset is a line or connector. Word writes these with `wps:cNvCnPr`
	* (connector properties) instead of `wps:cNvSpPr`.
	*/
	var isConnectorShapeType = (type) => CONNECTOR_SHAPE_TYPES.has(type);
	//#endregion
	//#region src/shapes/preset-shape/shape-adjustments.ts
	var percent = (guide, scale = 1) => ({
		guide,
		factor: 1e3 * scale
	});
	var degrees$1 = (guide) => ({
		guide,
		factor: 6e4
	});
	var remainingPercent = (guide) => ({
		guide,
		factor: -1e3,
		offset: 1e5
	});
	var PRESET_SHAPE_ADJUSTMENTS = {
		arc: {
			startAngle: degrees$1("adj1"),
			endAngle: degrees$1("adj2")
		},
		bentArrow: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3"),
			bendRadius: percent("adj4")
		},
		bentLineCallout: {
			lineStartX: percent("adj2"),
			lineStartY: percent("adj1"),
			bendX: percent("adj4"),
			bendY: percent("adj3"),
			lineEndX: percent("adj6"),
			lineEndY: percent("adj5")
		},
		bentLineCalloutWithAccentBar: {
			lineStartX: percent("adj2"),
			lineStartY: percent("adj1"),
			bendX: percent("adj4"),
			bendY: percent("adj3"),
			lineEndX: percent("adj6"),
			lineEndY: percent("adj5")
		},
		bentLineCalloutWithBorderAndAccentBar: {
			lineStartX: percent("adj2"),
			lineStartY: percent("adj1"),
			bendX: percent("adj4"),
			bendY: percent("adj3"),
			lineEndX: percent("adj6"),
			lineEndY: percent("adj5")
		},
		bentLineCalloutWithNoBorder: {
			lineStartX: percent("adj2"),
			lineStartY: percent("adj1"),
			bendX: percent("adj4"),
			bendY: percent("adj3"),
			lineEndX: percent("adj6"),
			lineEndY: percent("adj5")
		},
		bentUpArrow: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3")
		},
		beveledRectangle: { bevelWidth: percent("adj") },
		blockArc: {
			startAngle: degrees$1("adj1"),
			endAngle: degrees$1("adj2"),
			thickness: percent("adj3")
		},
		bracePair: { curveRadius: percent("adj") },
		bracketPair: { cornerRadius: percent("adj") },
		chevron: { pointLength: percent("adj") },
		chord: {
			startAngle: degrees$1("adj1"),
			endAngle: degrees$1("adj2")
		},
		circularArrow: {
			shaftThickness: percent("adj1"),
			headAngle: degrees$1("adj2"),
			endAngle: degrees$1("adj3"),
			startAngle: degrees$1("adj4"),
			headWidth: percent("adj5", .5)
		},
		cloudCallout: {
			pointerX: percent("adj1"),
			pointerY: percent("adj2")
		},
		cross: { cornerSize: percent("adj") },
		cube: { depth: percent("adj") },
		curvedConnector: { bendX: percent("adj1") },
		curvedConnectorFourBends: {
			firstBendX: percent("adj1"),
			secondBendY: percent("adj2"),
			thirdBendX: percent("adj3")
		},
		curvedConnectorThreeBends: {
			firstBendX: percent("adj1"),
			secondBendY: percent("adj2")
		},
		curvedDownArrow: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2"),
			headLength: percent("adj3")
		},
		curvedLeftArrow: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2"),
			headLength: percent("adj3")
		},
		curvedRibbonDown: {
			thickness: percent("adj1"),
			centerWidth: percent("adj2"),
			curveDepth: percent("adj3")
		},
		curvedRibbonUp: {
			thickness: percent("adj1"),
			centerWidth: percent("adj2"),
			curveDepth: percent("adj3")
		},
		curvedRightArrow: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2"),
			headLength: percent("adj3")
		},
		curvedUpArrow: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2"),
			headLength: percent("adj3")
		},
		cylinder: { topHeight: percent("adj") },
		diagonalRoundedCornersRectangle: {
			topLeftBottomRightRadius: percent("adj1"),
			topRightBottomLeftRadius: percent("adj2")
		},
		diagonalSnippedCornersRectangle: {
			topLeftBottomRightSize: percent("adj1"),
			topRightBottomLeftSize: percent("adj2")
		},
		diagonalStripe: { stripeWidth: remainingPercent("adj") },
		donut: { thickness: percent("adj") },
		doubleBentLineCallout: {
			lineStartX: percent("adj2"),
			lineStartY: percent("adj1"),
			firstBendX: percent("adj4"),
			firstBendY: percent("adj3"),
			secondBendX: percent("adj6"),
			secondBendY: percent("adj5"),
			lineEndX: percent("adj8"),
			lineEndY: percent("adj7")
		},
		doubleBentLineCalloutWithAccentBar: {
			lineStartX: percent("adj2"),
			lineStartY: percent("adj1"),
			firstBendX: percent("adj4"),
			firstBendY: percent("adj3"),
			secondBendX: percent("adj6"),
			secondBendY: percent("adj5"),
			lineEndX: percent("adj8"),
			lineEndY: percent("adj7")
		},
		doubleBentLineCalloutWithBorderAndAccentBar: {
			lineStartX: percent("adj2"),
			lineStartY: percent("adj1"),
			firstBendX: percent("adj4"),
			firstBendY: percent("adj3"),
			secondBendX: percent("adj6"),
			secondBendY: percent("adj5"),
			lineEndX: percent("adj8"),
			lineEndY: percent("adj7")
		},
		doubleBentLineCalloutWithNoBorder: {
			lineStartX: percent("adj2"),
			lineStartY: percent("adj1"),
			firstBendX: percent("adj4"),
			firstBendY: percent("adj3"),
			secondBendX: percent("adj6"),
			secondBendY: percent("adj5"),
			lineEndX: percent("adj8"),
			lineEndY: percent("adj7")
		},
		doubleWave: {
			waveHeight: percent("adj1"),
			skew: percent("adj2")
		},
		downArrow: {
			shaftThickness: percent("adj1"),
			headLength: percent("adj2")
		},
		downArrowCallout: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3"),
			boxHeight: percent("adj4")
		},
		elbowConnector: { bendX: percent("adj1") },
		elbowConnectorFourBends: {
			firstBendX: percent("adj1"),
			secondBendY: percent("adj2"),
			thirdBendX: percent("adj3")
		},
		elbowConnectorThreeBends: {
			firstBendX: percent("adj1"),
			secondBendY: percent("adj2")
		},
		ellipticalCallout: {
			pointerX: percent("adj1"),
			pointerY: percent("adj2")
		},
		foldedCorner: { foldSize: percent("adj") },
		frame: { thickness: percent("adj1") },
		gear6: {
			toothHeight: percent("adj1"),
			toothWidth: percent("adj2")
		},
		gear9: {
			toothHeight: percent("adj1"),
			toothWidth: percent("adj2")
		},
		halfFrame: {
			horizontalArmThickness: percent("adj1"),
			verticalArmThickness: percent("adj2")
		},
		hexagon: { pointLength: percent("adj") },
		horizontalScroll: { rollSize: percent("adj") },
		leftArrow: {
			shaftThickness: percent("adj1"),
			headLength: percent("adj2")
		},
		leftArrowCallout: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3"),
			boxWidth: percent("adj4")
		},
		leftBrace: {
			curveHeight: percent("adj1"),
			pointPosition: percent("adj2")
		},
		leftBracket: { cornerHeight: percent("adj") },
		leftCircularArrow: {
			shaftThickness: percent("adj1"),
			headAngle: degrees$1("adj2"),
			endAngle: degrees$1("adj3"),
			startAngle: degrees$1("adj4"),
			headWidth: percent("adj5", .5)
		},
		leftRightArrow: {
			shaftThickness: percent("adj1"),
			headLength: percent("adj2")
		},
		leftRightArrowCallout: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3"),
			boxWidth: percent("adj4")
		},
		leftRightCircularArrow: {
			shaftThickness: percent("adj1"),
			headAngle: degrees$1("adj2"),
			endAngle: degrees$1("adj3"),
			startAngle: degrees$1("adj4"),
			headWidth: percent("adj5", .5)
		},
		leftRightRibbon: {
			thickness: percent("adj1"),
			endLength: percent("adj2"),
			verticalOffset: percent("adj3")
		},
		leftRightUpArrow: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3")
		},
		leftUpArrow: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3")
		},
		lineCallout: {
			lineStartX: percent("adj2"),
			lineStartY: percent("adj1"),
			lineEndX: percent("adj4"),
			lineEndY: percent("adj3")
		},
		lineCalloutWithAccentBar: {
			lineStartX: percent("adj2"),
			lineStartY: percent("adj1"),
			lineEndX: percent("adj4"),
			lineEndY: percent("adj3")
		},
		lineCalloutWithBorderAndAccentBar: {
			lineStartX: percent("adj2"),
			lineStartY: percent("adj1"),
			lineEndX: percent("adj4"),
			lineEndY: percent("adj3")
		},
		lineCalloutWithNoBorder: {
			lineStartX: percent("adj2"),
			lineStartY: percent("adj1"),
			lineEndX: percent("adj4"),
			lineEndY: percent("adj3")
		},
		lShape: {
			horizontalArmThickness: percent("adj1"),
			verticalArmThickness: percent("adj2")
		},
		mathDivide: {
			thickness: percent("adj1"),
			gap: percent("adj2"),
			dotRadius: percent("adj3")
		},
		mathEqual: {
			thickness: percent("adj1"),
			gap: percent("adj2")
		},
		mathMinus: { thickness: percent("adj1") },
		mathMultiply: { thickness: percent("adj1") },
		mathNotEqual: {
			thickness: percent("adj1"),
			slashAngle: degrees$1("adj2"),
			gap: percent("adj3")
		},
		mathPlus: { thickness: percent("adj1") },
		moon: { thickness: percent("adj") },
		nonIsoscelesTrapezoid: {
			leftSlant: percent("adj1"),
			rightSlant: percent("adj2")
		},
		noSymbol: { thickness: percent("adj") },
		notchedRightArrow: {
			shaftThickness: percent("adj1"),
			headLength: percent("adj2")
		},
		octagon: { cornerSize: percent("adj") },
		parallelogram: { slant: percent("adj") },
		pentagonArrow: { pointLength: percent("adj") },
		pie: {
			startAngle: degrees$1("adj1"),
			endAngle: degrees$1("adj2")
		},
		plaque: { cornerRadius: percent("adj") },
		quadArrow: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3")
		},
		quadArrowCallout: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3"),
			boxSize: percent("adj4")
		},
		rectangularCallout: {
			pointerX: percent("adj1"),
			pointerY: percent("adj2")
		},
		ribbonDown: {
			endOffset: percent("adj1"),
			centerWidth: percent("adj2")
		},
		ribbonUp: {
			endOffset: percent("adj1"),
			centerWidth: percent("adj2")
		},
		rightArrow: {
			shaftThickness: percent("adj1"),
			headLength: percent("adj2")
		},
		rightArrowCallout: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3"),
			boxWidth: percent("adj4")
		},
		rightBrace: {
			curveHeight: percent("adj1"),
			pointPosition: percent("adj2")
		},
		rightBracket: { cornerHeight: percent("adj") },
		roundedAndSnippedCornersRectangle: {
			roundedCornerRadius: percent("adj1"),
			snippedCornerSize: percent("adj2")
		},
		roundedCornerRectangle: { cornerRadius: percent("adj") },
		roundedRectangle: { cornerRadius: percent("adj") },
		roundedRectangularCallout: {
			pointerX: percent("adj1"),
			pointerY: percent("adj2"),
			cornerRadius: percent("adj3")
		},
		smileyFace: { smile: percent("adj") },
		snippedCornerRectangle: { cornerSize: percent("adj") },
		star10: { innerRadius: percent("adj", .5) },
		star12: { innerRadius: percent("adj", .5) },
		star16: { innerRadius: percent("adj", .5) },
		star24: { innerRadius: percent("adj", .5) },
		star32: { innerRadius: percent("adj", .5) },
		star4: { innerRadius: percent("adj", .5) },
		star5: { innerRadius: percent("adj", .5) },
		star6: { innerRadius: percent("adj", .5) },
		star7: { innerRadius: percent("adj", .5) },
		star8: { innerRadius: percent("adj", .5) },
		stripedRightArrow: {
			shaftThickness: percent("adj1"),
			headLength: percent("adj2")
		},
		sun: { rayLength: percent("adj") },
		swooshArrow: {
			shaftThickness: percent("adj1"),
			headLength: percent("adj2")
		},
		teardrop: { pointLength: percent("adj") },
		topRoundedCornersRectangle: {
			topCornerRadius: percent("adj1"),
			bottomCornerRadius: percent("adj2")
		},
		topSnippedCornersRectangle: {
			topCornerSize: percent("adj1"),
			bottomCornerSize: percent("adj2")
		},
		trapezoid: { slant: percent("adj") },
		triangle: { apexPosition: percent("adj") },
		upArrow: {
			shaftThickness: percent("adj1"),
			headLength: percent("adj2")
		},
		upArrowCallout: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3"),
			boxHeight: percent("adj4")
		},
		upDownArrow: {
			shaftThickness: percent("adj1"),
			headLength: percent("adj2")
		},
		upDownArrowCallout: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3"),
			boxHeight: percent("adj4")
		},
		uTurnArrow: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3"),
			bendRadius: percent("adj4"),
			tipPosition: percent("adj5")
		},
		verticalScroll: { rollSize: percent("adj") },
		wave: {
			waveHeight: percent("adj1"),
			skew: percent("adj2")
		}
	};
	/**
	* Converts a shape's adjustments to the shape guides written in `a:avLst`, keyed by guide name.
	*
	* @throws If the shape does not have an adjustment with one of the given names
	*
	* @example
	* ```typescript
	* createShapeGuides("roundedRectangle", { cornerRadius: 25 }); // { adj: 25000 }
	* createShapeGuides("pie", { startAngle: 0, endAngle: 270 }); // { adj1: 0, adj2: 16200000 }
	* ```
	*/
	var createShapeGuides = (type, adjustments = {}) => {
		const definitions = type in PRESET_SHAPE_ADJUSTMENTS ? PRESET_SHAPE_ADJUSTMENTS[type] : {};
		const names = Object.keys(definitions);
		return Object.fromEntries(Object.entries(adjustments).flatMap(([name, value]) => {
			if (!names.includes(name)) throw new Error(names.length === 0 ? `Invalid adjustment "${name}". Shape "${type}" has no adjustments` : `Invalid adjustment "${name}" for shape "${type}". Expected one of: ${names.join(", ")}`);
			const { guide, factor, offset = 0 } = definitions[name];
			return value === void 0 ? [] : [[guide, offset + value * factor]];
		}));
	};
	//#endregion
	//#region src/shapes/preset-shape/shape-units.ts
	/**
	* Converts the human units shape options are given in (points, degrees and percentages from 0 to 100)
	* to the units DrawingML stores (EMUs, 60,000ths of a degree and thousandths of a percent).
	*
	* @module
	*/
	var EMUS_PER_POINT = 12700;
	var MAX_POINTS = 1584;
	var ANGLE_UNITS_PER_DEGREE$1 = 6e4;
	/**
	* Checks that a percentage option is between 0 and 100 and returns it.
	*
	* @throws If the value is outside 0 to 100
	*/
	var percentageValue = (value, option) => {
		if (!(value >= 0 && value <= 100)) throw new Error(`Invalid ${option} ${value}. Expected a number from 0 to 100`);
		return value;
	};
	/**
	* Converts a length in points to EMUs.
	*
	* @throws If the length is negative or more than 1584 points (22 inches)
	*/
	var pointsToEmus = (points, option) => {
		if (!(points >= 0 && points <= MAX_POINTS)) throw new Error(`Invalid ${option} ${points}. Expected a number of points from 0 to ${MAX_POINTS}`);
		return Math.round(points * EMUS_PER_POINT);
	};
	/**
	* Converts an angle in degrees to an `ST_PositiveFixedAngle`: 60,000ths of a degree, from 0 up to (not including) 360 degrees.
	* Negative angles and angles of a full turn or more are brought into that range.
	*/
	var positiveFixedAngle = (degrees) => Math.round((degrees % 360 + 360) % 360 * ANGLE_UNITS_PER_DEGREE$1) % (360 * ANGLE_UNITS_PER_DEGREE$1);
	//#endregion
	//#region src/shapes/preset-shape/shape-color.ts
	/**
	* Colours for shape fills and lines.
	*
	* `src/charts/chart-color.ts` is a copy of this file, as `docx/charts` and `docx/shapes` are separate entries that import
	* only `docx`. Make a fix in both.
	*
	* @module
	*/
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
	* createShapeColor("1F4E79", 25); // <a:srgbClr val="1F4E79"><a:alpha val="75000"/></a:srgbClr>
	* createShapeColor({ theme: "accent1", darker: 25 }); // <a:schemeClr val="accent1"><a:lumMod val="75000"/></a:schemeClr>
	* ```
	*/
	var createShapeColor = (color, transparency) => {
		const changes = transparency ? [{
			name: "a:alpha",
			value: Math.round((100 - percentageValue(transparency, "transparency")) * 1e3)
		}] : [];
		if (typeof color !== "string") return createThemeColor(color, changes);
		if (color === "auto") throw new Error(`Invalid shape color 'auto'. Expected 6 digit hex value`);
		return new docx.BuilderElement({
			name: "a:srgbClr",
			attributes: { value: {
				key: "val",
				value: (0, docx.hexColorValue)(color)
			} },
			children: changes.map(createColorChange)
		});
	};
	/**
	* Whether a fill or line given as an object is a colour of the document's theme.
	*/
	var isThemeColor = (value) => "theme" in value;
	//#endregion
	//#region src/shapes/preset-shape/shape-effects.ts
	/**
	* Effects for preset shapes: shadows, glow, soft edges and reflection.
	*
	* Reference: ECMA-376 Part 1, 20.1.8.26 effectLst (Effect Container)
	*
	* @module
	*/
	var resolveShadow = ({ color = "000000", transparency = 60, blur = 4, distance = 3, angle = 45 }) => ({
		color,
		transparency,
		blur: pointsToEmus(blur, "shadow blur"),
		distance: pointsToEmus(distance, "shadow distance"),
		angle
	});
	var resolveReflection = ({ transparency = 50, size = 50, distance = 0, blur = .5 }) => ({
		transparency: percentageValue(transparency, "reflection transparency"),
		size: percentageValue(size, "reflection size"),
		distance: pointsToEmus(distance, "reflection distance"),
		blur: pointsToEmus(blur, "reflection blur")
	});
	var createGlow = ({ color, size = 5, transparency = 60 }) => new docx.BuilderElement({
		name: "a:glow",
		attributes: { radius: {
			key: "rad",
			value: pointsToEmus(size, "glow size")
		} },
		children: [createShapeColor(color, transparency)]
	});
	var createInnerShadow = (shadow) => {
		const { color, transparency, blur, distance, angle } = resolveShadow(shadow);
		return new docx.BuilderElement({
			name: "a:innerShdw",
			attributes: {
				blur: {
					key: "blurRad",
					value: blur
				},
				distance: {
					key: "dist",
					value: distance
				},
				direction: {
					key: "dir",
					value: positiveFixedAngle(angle)
				}
			},
			children: [createShapeColor(color, transparency)]
		});
	};
	var createOuterShadow = (shadow) => {
		const { color, transparency, blur, distance, angle } = resolveShadow(shadow);
		return new docx.BuilderElement({
			name: "a:outerShdw",
			attributes: {
				blur: {
					key: "blurRad",
					value: blur
				},
				distance: {
					key: "dist",
					value: distance
				},
				direction: {
					key: "dir",
					value: positiveFixedAngle(angle)
				},
				rotateWithShape: {
					key: "rotWithShape",
					value: false
				}
			},
			children: [createShapeColor(color, transparency)]
		});
	};
	var createReflection = (reflection) => {
		const { transparency, size, distance, blur } = resolveReflection(reflection);
		return new docx.BuilderElement({
			name: "a:reflection",
			attributes: {
				blur: {
					key: "blurRad",
					value: blur
				},
				startAlpha: {
					key: "stA",
					value: Math.round((100 - transparency) * 1e3)
				},
				endAlpha: {
					key: "endA",
					value: 300
				},
				endPosition: {
					key: "endPos",
					value: Math.round(size * 1e3)
				},
				distance: {
					key: "dist",
					value: distance
				},
				direction: {
					key: "dir",
					value: 54e5
				},
				scaleY: {
					key: "sy",
					value: -1e5
				},
				alignment: {
					key: "algn",
					value: "bl"
				},
				rotateWithShape: {
					key: "rotWithShape",
					value: false
				}
			}
		});
	};
	var createSoftEdges = (radius) => new docx.BuilderElement({
		name: "a:softEdge",
		attributes: { radius: {
			key: "rad",
			value: pointsToEmus(radius, "soft edges radius")
		} }
	});
	/**
	* Creates the `a:effectLst` element for a shape, with its effects in the order the schema requires.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_EffectList">
	*   <xsd:sequence>
	*     <xsd:element name="blur" type="CT_BlurEffect" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="fillOverlay" type="CT_FillOverlayEffect" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="glow" type="CT_GlowEffect" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="innerShdw" type="CT_InnerShadowEffect" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="outerShdw" type="CT_OuterShadowEffect" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="prstShdw" type="CT_PresetShadowEffect" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="reflection" type="CT_ReflectionEffect" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="softEdge" type="CT_SoftEdgesEffect" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*
	* @throws If a colour, transparency, size or distance is invalid
	*/
	var createShapeEffects = ({ shadow, innerShadow, glow, softEdges, reflection }) => new docx.BuilderElement({
		name: "a:effectLst",
		children: [
			...glow ? [createGlow(glow)] : [],
			...innerShadow ? [createInnerShadow(innerShadow)] : [],
			...shadow ? [createOuterShadow(shadow)] : [],
			...reflection ? [createReflection(reflection)] : [],
			...softEdges === void 0 ? [] : [createSoftEdges(softEdges)]
		]
	});
	var getShadowOverhang = (shadow) => {
		const { blur, distance, angle } = resolveShadow(shadow);
		const radians = angle * Math.PI / 180;
		const dx = distance * Math.cos(radians);
		const dy = distance * Math.sin(radians);
		return {
			top: Math.max(0, blur - dy),
			right: Math.max(0, blur + dx),
			bottom: Math.max(0, blur + dy),
			left: Math.max(0, blur - dx)
		};
	};
	var getGlowOverhang = ({ size = 5 }) => {
		const radius = pointsToEmus(size, "glow size");
		return {
			top: radius,
			right: radius,
			bottom: radius,
			left: radius
		};
	};
	var getReflectionOverhang = (reflection, height) => {
		const { size, distance, blur } = resolveReflection(reflection);
		return {
			top: 0,
			right: 0,
			bottom: distance + height * size / 100 + blur,
			left: 0
		};
	};
	/**
	* How far, in EMUs, a shape's effects reach past each side of its box.
	* Used for the drawing's `wp:effectExtent` so shadows, glows and reflections are not clipped.
	*
	* Inner shadows and soft edges stay inside the shape, so they don't reach past it.
	*
	* @param width - The shape's width in EMUs
	* @param height - The shape's height in EMUs
	* @param rotation - The shape's clockwise rotation in degrees. A rotated shape's effects are allowed for on every side
	*/
	var getShapeEffectsOverhang = ({ shadow, glow, reflection } = {}, height, rotation = 0) => {
		const extents = [
			{
				top: 0,
				right: 0,
				bottom: 0,
				left: 0
			},
			...shadow ? [getShadowOverhang(shadow)] : [],
			...glow ? [getGlowOverhang(glow)] : [],
			...reflection ? [getReflectionOverhang(reflection, height)] : []
		];
		const furthest = (side) => Math.ceil(Math.max(...extents.map((extent) => extent[side])));
		const sides = {
			top: furthest("top"),
			right: furthest("right"),
			bottom: furthest("bottom"),
			left: furthest("left")
		};
		if (rotation % 360 === 0) return sides;
		const all = Math.max(sides.top, sides.right, sides.bottom, sides.left);
		return {
			top: all,
			right: all,
			bottom: all,
			left: all
		};
	};
	//#endregion
	//#region src/shapes/picture/image-data.ts
	/**
	* Turns the pictures given to shapes, as picture fills or pictures in groups, into the media data stored in the document.
	*
	* @module
	*/
	/**
	* Creates the media data for a picture. Its file name comes from a hash of its data, so the same picture
	* used twice is stored once.
	*/
	var createImageMediaData = (image, transformation) => {
		const fileName = `${(0, docx.hashedId)(image.data)}.${image.type}`;
		if (image.type === "svg") return {
			type: "svg",
			fileName,
			data: (0, docx.standardizeData)(image.data),
			transformation,
			fallback: {
				type: image.fallback.type,
				fileName: `${(0, docx.hashedId)(image.fallback.data)}.${image.fallback.type}`,
				data: (0, docx.standardizeData)(image.fallback.data),
				transformation
			}
		};
		return {
			type: image.type,
			fileName,
			data: (0, docx.standardizeData)(image.data),
			transformation
		};
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
	//#region src/shapes/preset-shape/shape-fill.ts
	/**
	* Fills for preset shapes: none, solid, gradient, pattern or picture.
	*
	* @module
	*/
	var GRADIENT_PATH_OOXML_NAMES = {
		circle: "circle",
		rectangle: "rect",
		shape: "shape"
	};
	var PATTERN_OOXML_NAMES = {
		percent5: "pct5",
		percent10: "pct10",
		percent20: "pct20",
		percent25: "pct25",
		percent30: "pct30",
		percent40: "pct40",
		percent50: "pct50",
		percent60: "pct60",
		percent70: "pct70",
		percent75: "pct75",
		percent80: "pct80",
		percent90: "pct90",
		horizontal: "horz",
		vertical: "vert",
		lightHorizontal: "ltHorz",
		lightVertical: "ltVert",
		darkHorizontal: "dkHorz",
		darkVertical: "dkVert",
		narrowHorizontal: "narHorz",
		narrowVertical: "narVert",
		dashedHorizontal: "dashHorz",
		dashedVertical: "dashVert",
		cross: "cross",
		downwardDiagonal: "dnDiag",
		upwardDiagonal: "upDiag",
		lightDownwardDiagonal: "ltDnDiag",
		lightUpwardDiagonal: "ltUpDiag",
		darkDownwardDiagonal: "dkDnDiag",
		darkUpwardDiagonal: "dkUpDiag",
		wideDownwardDiagonal: "wdDnDiag",
		wideUpwardDiagonal: "wdUpDiag",
		dashedDownwardDiagonal: "dashDnDiag",
		dashedUpwardDiagonal: "dashUpDiag",
		diagonalCross: "diagCross",
		smallCheckerBoard: "smCheck",
		largeCheckerBoard: "lgCheck",
		smallGrid: "smGrid",
		largeGrid: "lgGrid",
		dottedGrid: "dotGrid",
		smallConfetti: "smConfetti",
		largeConfetti: "lgConfetti",
		horizontalBrick: "horzBrick",
		diagonalBrick: "diagBrick",
		solidDiamond: "solidDmnd",
		openDiamond: "openDmnd",
		dottedDiamond: "dotDmnd",
		plaid: "plaid",
		sphere: "sphere",
		weave: "weave",
		divot: "divot",
		shingle: "shingle",
		wave: "wave",
		trellis: "trellis",
		zigZag: "zigZag"
	};
	var TILE_ALIGNMENT_OOXML_NAMES = {
		topLeft: "tl",
		top: "t",
		topRight: "tr",
		left: "l",
		center: "ctr",
		right: "r",
		bottomLeft: "bl",
		bottom: "b",
		bottomRight: "br"
	};
	var TILE_MIRROR_OOXML_NAMES = {
		none: "none",
		horizontal: "x",
		vertical: "y",
		both: "xy"
	};
	var createGradientStop = ({ position, color, transparency }) => new docx.BuilderElement({
		name: "a:gs",
		attributes: { position: {
			key: "pos",
			value: Math.round(position * 1e3)
		} },
		children: [createShapeColor(color, transparency)]
	});
	var createLinearShade = (angle) => new docx.BuilderElement({
		name: "a:lin",
		attributes: { angle: {
			key: "ang",
			value: positiveFixedAngle(angle)
		} }
	});
	var createPathShade = (path) => new docx.BuilderElement({
		name: "a:path",
		attributes: { path: {
			key: "path",
			value: GRADIENT_PATH_OOXML_NAMES[path]
		} },
		children: [new docx.BuilderElement({
			name: "a:fillToRect",
			attributes: {
				left: {
					key: "l",
					value: 5e4
				},
				top: {
					key: "t",
					value: 5e4
				},
				right: {
					key: "r",
					value: 5e4
				},
				bottom: {
					key: "b",
					value: 5e4
				}
			}
		})]
	});
	/**
	* Creates an `a:gradFill` element.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_GradientFillProperties">
	*   <xsd:sequence>
	*     <xsd:element name="gsLst" type="CT_GradientStopList" minOccurs="0" maxOccurs="1"/>
	*     <xsd:group ref="EG_ShadeProperties" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="tileRect" type="CT_RelativeRect" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	*   <xsd:attribute name="flip" type="ST_TileFlipMode" use="optional" default="none"/>
	*   <xsd:attribute name="rotWithShape" type="xsd:boolean" use="optional"/>
	* </xsd:complexType>
	* ```
	*
	* @throws If there are fewer than two stops or a stop position is outside 0 to 100
	*/
	var createGradientFill = ({ stops, angle = 0, path }) => {
		if (stops.length < 2) throw new Error(`Invalid gradient fill. Expected at least 2 stops, got ${stops.length}`);
		const sortedStops = [...stops].map((stop) => _objectSpread2(_objectSpread2({}, stop), {}, { position: percentageValue(stop.position, "gradient stop position") })).sort((a, b) => a.position - b.position);
		return new docx.BuilderElement({
			name: "a:gradFill",
			attributes: { rotateWithShape: {
				key: "rotWithShape",
				value: true
			} },
			children: [new docx.BuilderElement({
				name: "a:gsLst",
				children: sortedStops.map(createGradientStop)
			}), path ? createPathShade(path) : createLinearShade(angle)]
		});
	};
	/**
	* Creates an `a:pattFill` element.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_PatternFillProperties">
	*   <xsd:sequence>
	*     <xsd:element name="fgClr" type="CT_Color" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="bgClr" type="CT_Color" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	*   <xsd:attribute name="prst" type="ST_PresetPatternVal" use="optional"/>
	* </xsd:complexType>
	* ```
	*/
	var createPatternFill = ({ pattern, color = "000000", backgroundColor = "FFFFFF" }) => new docx.BuilderElement({
		name: "a:pattFill",
		attributes: { pattern: {
			key: "prst",
			value: PATTERN_OOXML_NAMES[pattern]
		} },
		children: [new docx.BuilderElement({
			name: "a:fgClr",
			children: [createShapeColor(color)]
		}), new docx.BuilderElement({
			name: "a:bgClr",
			children: [createShapeColor(backgroundColor)]
		})]
	});
	var createTile = ({ scale = 100, alignment = "topLeft", mirror = "none" }) => {
		if (!(scale > 0)) throw new Error(`Invalid picture tile scale ${scale}. Expected a percentage greater than 0`);
		return new docx.BuilderElement({
			name: "a:tile",
			attributes: {
				offsetX: {
					key: "tx",
					value: 0
				},
				offsetY: {
					key: "ty",
					value: 0
				},
				scaleX: {
					key: "sx",
					value: Math.round(scale * 1e3)
				},
				scaleY: {
					key: "sy",
					value: Math.round(scale * 1e3)
				},
				mirror: {
					key: "flip",
					value: TILE_MIRROR_OOXML_NAMES[mirror]
				},
				alignment: {
					key: "algn",
					value: TILE_ALIGNMENT_OOXML_NAMES[alignment]
				}
			}
		});
	};
	var createPictureBlip = (mediaData, transparency) => new docx.BuilderElement({
		name: "a:blip",
		attributes: { embed: {
			key: "r:embed",
			value: `rId{${mediaData.type === "svg" ? mediaData.fallback.fileName : mediaData.fileName}}`
		} },
		children: [...transparency ? [new docx.BuilderElement({
			name: "a:alphaModFix",
			attributes: { amount: {
				key: "amt",
				value: Math.round((100 - percentageValue(transparency, "transparency")) * 1e3)
			} }
		})] : [], ...mediaData.type === "svg" ? [createSvgBlipExtension(mediaData)] : []]
	});
	/**
	* An `a:blipFill` element: a picture that fills a shape.
	*
	* The picture is added to the document's media when the shape is written, so it is stored in the package
	* and given a relationship from the part (document, header or footer) the shape is in.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_BlipFillProperties">
	*   <xsd:sequence>
	*     <xsd:element name="blip" type="CT_Blip" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="srcRect" type="CT_RelativeRect" minOccurs="0" maxOccurs="1"/>
	*     <xsd:group ref="EG_FillModeProperties" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	*   <xsd:attribute name="dpi" type="xsd:unsignedInt" use="optional"/>
	*   <xsd:attribute name="rotWithShape" type="xsd:boolean" use="optional"/>
	* </xsd:complexType>
	* ```
	*/
	var PictureFill = class extends docx.XmlComponent {
		constructor({ image, tile, crop, transparency }, name) {
			super(name);
			_defineProperty(this, "mediaData", void 0);
			this.mediaData = createImageMediaData(image, {
				pixels: {
					x: 0,
					y: 0
				},
				emus: {
					x: 0,
					y: 0
				}
			});
			this.root.push(new docx.NextAttributeComponent({ rotateWithShape: {
				key: "rotWithShape",
				value: true
			} }));
			this.root.push(createPictureBlip(this.mediaData, transparency));
			this.root.push(createSourceRectangle(tile ? void 0 : crop));
			this.root.push(tile ? createTile(tile) : createStretch());
		}
		prepForXml(context) {
			context.file.Media.addImage(this.mediaData.fileName, this.mediaData);
			if (this.mediaData.type === "svg") context.file.Media.addImage(this.mediaData.fallback.fileName, this.mediaData.fallback);
			return super.prepForXml(context);
		}
	};
	/**
	* Creates a fill of a picture: `a:blipFill` in a shape, or `pic:blipFill` in a picture. The picture is added to the
	* document's media when it is written.
	*/
	var createPictureFill = (fill, name = "a:blipFill") => new PictureFill(fill, name);
	/**
	* Creates the fill element for a preset shape.
	*
	* - `undefined` or `"none"` writes `<a:noFill/>`
	* - A hex colour, a colour of the theme or a solid fill writes `<a:solidFill>`
	* - A gradient fill writes `<a:gradFill>`
	* - A pattern fill writes `<a:pattFill>`
	* - A picture fill writes `<a:blipFill>`, and adds the picture to the document when it is written
	*/
	var createShapeFill = (fill = "none") => {
		if (fill === "none") return createNoFill();
		if (typeof fill === "string" || isThemeColor(fill)) return new docx.BuilderElement({
			name: "a:solidFill",
			children: [createShapeColor(fill)]
		});
		if (fill.type === "gradient") return createGradientFill(fill);
		if (fill.type === "pattern") return createPatternFill(fill);
		return fill.type === "picture" ? createPictureFill(fill) : new docx.BuilderElement({
			name: "a:solidFill",
			children: [createShapeColor(fill.color, fill.transparency)]
		});
	};
	//#endregion
	//#region src/shapes/preset-shape/shape-line.ts
	/**
	* Lines (outlines) for preset shapes, including dashes and arrowheads.
	*
	* @module
	*/
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
	var LINE_CAP_OOXML_NAMES = {
		flat: "flat",
		round: "rnd",
		square: "sq"
	};
	var COMPOUND_LINE_OOXML_NAMES = {
		single: "sng",
		double: "dbl",
		thickThin: "thickThin",
		thinThick: "thinThick",
		triple: "tri"
	};
	var ARROWHEAD_SIZES = {
		small: {
			factor: 2,
			ooxmlName: "sm"
		},
		medium: {
			factor: 3,
			ooxmlName: "med"
		},
		large: {
			factor: 5,
			ooxmlName: "lg"
		}
	};
	var resolveLine = (line) => typeof line === "string" || isThemeColor(line) ? { color: line } : line;
	var lineWidthEmus = ({ width = 1 }) => pointsToEmus(width, "line width");
	var resolveArrowhead = (arrowhead) => typeof arrowhead === "string" ? { type: arrowhead } : arrowhead;
	var arrowheadFactor = (arrowhead) => {
		if (!arrowhead) return 1;
		const { width = "medium", length = "medium" } = resolveArrowhead(arrowhead);
		return Math.max(ARROWHEAD_SIZES[width].factor, ARROWHEAD_SIZES[length].factor);
	};
	var createDash = (dash) => {
		if (typeof dash === "string") return new docx.BuilderElement({
			name: "a:prstDash",
			attributes: { value: {
				key: "val",
				value: LINE_DASH_OOXML_NAMES[dash]
			} }
		});
		if (dash.length === 0) throw new Error("Invalid custom line dash. Expected at least 1 dash");
		return new docx.BuilderElement({
			name: "a:custDash",
			children: dash.map(({ length, gap }) => {
				if (!(length >= 0 && gap >= 0)) throw new Error(`Invalid custom line dash { length: ${length}, gap: ${gap} }. Expected lengths of 0 or more`);
				return new docx.BuilderElement({
					name: "a:ds",
					attributes: {
						length: {
							key: "d",
							value: Math.max(1, Math.round(length * 1e5))
						},
						gap: {
							key: "sp",
							value: Math.max(1, Math.round(gap * 1e5))
						}
					}
				});
			})
		});
	};
	var createJoin = (join) => join === "miter" ? new docx.BuilderElement({
		name: "a:miter",
		attributes: { limit: {
			key: "lim",
			value: 8e5
		} }
	}) : new docx.BuilderElement({ name: `a:${join}` });
	var createLineEnd = (name, arrowhead) => {
		const { type, width, length } = resolveArrowhead(arrowhead);
		return new docx.BuilderElement({
			name,
			attributes: {
				type: {
					key: "type",
					value: type
				},
				width: {
					key: "w",
					value: width && ARROWHEAD_SIZES[width].ooxmlName
				},
				length: {
					key: "len",
					value: length && ARROWHEAD_SIZES[length].ooxmlName
				}
			}
		});
	};
	/**
	* Creates the `a:ln` element for a preset shape.
	*
	* - `undefined` writes a solid black line 1pt wide
	* - `"none"` writes `<a:ln><a:noFill/></a:ln>`
	* - A hex colour writes a solid line 1pt wide in that colour
	* - A `gradient` writes `<a:gradFill>` in place of the line's colour
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_LineProperties">
	*   <xsd:sequence>
	*     <xsd:group ref="EG_LineFillProperties" minOccurs="0" maxOccurs="1"/>
	*     <xsd:group ref="EG_LineDashProperties" minOccurs="0" maxOccurs="1"/>
	*     <xsd:group ref="EG_LineJoinProperties" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="headEnd" type="CT_LineEndProperties" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="tailEnd" type="CT_LineEndProperties" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	*   <xsd:attribute name="w" type="ST_LineWidth" use="optional"/>
	*   <xsd:attribute name="cap" type="ST_LineCap" use="optional"/>
	*   <xsd:attribute name="cmpd" type="ST_CompoundLine" use="optional"/>
	*   <xsd:attribute name="algn" type="ST_PenAlignment" use="optional"/>
	* </xsd:complexType>
	* ```
	*
	* @throws If the colour, width, transparency, gradient or custom dash is invalid
	*/
	var createShapeLine = (line = {}) => {
		var _options$color;
		if (line === "none") return new docx.BuilderElement({
			name: "a:ln",
			children: [createNoFill()]
		});
		const options = resolveLine(line);
		return new docx.BuilderElement({
			name: "a:ln",
			attributes: {
				width: {
					key: "w",
					value: lineWidthEmus(options)
				},
				cap: {
					key: "cap",
					value: options.cap && LINE_CAP_OOXML_NAMES[options.cap]
				},
				compound: {
					key: "cmpd",
					value: options.compound && COMPOUND_LINE_OOXML_NAMES[options.compound]
				}
			},
			children: [
				options.gradient ? createShapeFill(_objectSpread2({ type: "gradient" }, options.gradient)) : new docx.BuilderElement({
					name: "a:solidFill",
					children: [createShapeColor((_options$color = options.color) !== null && _options$color !== void 0 ? _options$color : "000000", options.transparency)]
				}),
				...options.dash ? [createDash(options.dash)] : [],
				...options.join ? [createJoin(options.join)] : [],
				...options.startArrow ? [createLineEnd("a:headEnd", options.startArrow)] : [],
				...options.endArrow ? [createLineEnd("a:tailEnd", options.endArrow)] : []
			]
		});
	};
	/**
	* How far, in EMUs, a shape's line (and its arrowheads) can reach past the shape's box.
	* Used for the drawing's `wp:effectExtent` so thick lines and arrowheads are not clipped.
	*/
	var getShapeLineOverhang = (line = {}) => {
		if (line === "none") return 0;
		const options = resolveLine(line);
		const factor = Math.max(arrowheadFactor(options.startArrow), arrowheadFactor(options.endArrow));
		return Math.ceil(lineWidthEmus(options) * factor / 2);
	};
	//#endregion
	//#region src/shapes/custom-geometry/svg-path.ts
	var ARGUMENT_COUNTS = {
		m: 2,
		l: 2,
		h: 1,
		v: 1,
		c: 6,
		s: 4,
		q: 4,
		t: 2,
		a: 7,
		z: 0
	};
	var NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;
	/**
	* Splits SVG path data into commands and their arguments.
	*
	* @throws If the path doesn't start with a move, has an unknown command, or a command has the wrong number of arguments
	*/
	var tokenize$1 = (path) => {
		const commands = [];
		let index = 0;
		let letter;
		const skipSeparators = () => {
			while (index < path.length && /[\s,]/.test(path[index])) index++;
		};
		const readNumber = () => {
			skipSeparators();
			const match = NUMBER.exec(path.slice(index));
			if (!match) throw new Error(`Invalid path "${path}". Expected a number at position ${index}`);
			index += match[0].length;
			return Number(match[0]);
		};
		const readFlag = () => {
			skipSeparators();
			const flag = path[index];
			if (flag !== "0" && flag !== "1") throw new Error(`Invalid path "${path}". Expected an arc flag of 0 or 1 at position ${index}`);
			index++;
			return Number(flag);
		};
		skipSeparators();
		while (index < path.length) {
			const character = path[index];
			if (/[a-z]/i.test(character)) {
				if (ARGUMENT_COUNTS[character.toLowerCase()] === void 0) throw new Error(`Invalid path "${path}". Unsupported command "${character}"`);
				if (letter === void 0 && character.toLowerCase() !== "m") throw new Error(`Invalid path "${path}". A path must start with a move (M)`);
				letter = character;
				index++;
			} else if (letter === void 0) throw new Error(`Invalid path "${path}". A path must start with a move (M)`);
			else if (letter.toLowerCase() === "z") throw new Error(`Invalid path "${path}". Expected a command at position ${index}`);
			const command = letter.toLowerCase();
			const args = command === "a" ? [
				readNumber(),
				readNumber(),
				readNumber(),
				readFlag(),
				readFlag(),
				readNumber(),
				readNumber()
			] : Array.from({ length: ARGUMENT_COUNTS[command] }, readNumber);
			commands.push({
				letter,
				args
			});
			if (command === "m") letter = letter === "m" ? "l" : "L";
			skipSeparators();
		}
		return commands;
	};
	var angleBetween$1 = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
	/**
	* Converts an SVG arc, given by its end points, to centre form.
	*
	* Reference: https://www.w3.org/TR/SVG11/implnote.html#ArcConversionEndpointToCenter
	*
	* @returns Nothing when the arc is a straight line (a radius is 0) or has no length
	*/
	var toEllipticalArc = (from, to, radiusX, radiusY, rotationDegrees, largeArc, sweep) => {
		if (radiusX === 0 || radiusY === 0 || from.x === to.x && from.y === to.y) return;
		const rotation = rotationDegrees * Math.PI / 180;
		const cos = Math.cos(rotation);
		const sin = Math.sin(rotation);
		const dx = (from.x - to.x) / 2;
		const dy = (from.y - to.y) / 2;
		const x1 = cos * dx + sin * dy;
		const y1 = -sin * dx + cos * dy;
		const lambda = x1 * x1 / (radiusX * radiusX) + y1 * y1 / (radiusY * radiusY);
		const scale = lambda > 1 ? Math.sqrt(lambda) : 1;
		const rx = Math.abs(radiusX) * scale;
		const ry = Math.abs(radiusY) * scale;
		const numerator = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
		const denominator = rx * rx * y1 * y1 + ry * ry * x1 * x1;
		const coefficient = (largeArc === sweep ? -1 : 1) * Math.sqrt(Math.max(0, numerator / denominator));
		const cx1 = coefficient * rx * y1 / ry;
		const cy1 = -coefficient * ry * x1 / rx;
		const startAngle = angleBetween$1(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry);
		const turn = angleBetween$1((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry);
		const sweepAngle = sweep && turn < 0 ? turn + 2 * Math.PI : !sweep && turn > 0 ? turn - 2 * Math.PI : turn;
		return {
			centre: {
				x: cos * cx1 - sin * cy1 + (from.x + to.x) / 2,
				y: sin * cx1 + cos * cy1 + (from.y + to.y) / 2
			},
			radiusX: rx,
			radiusY: ry,
			rotation,
			startAngle,
			sweepAngle
		};
	};
	/**
	* The point on an arc's ellipse at an angle along it, measured as for `startAngle`.
	*/
	var pointOnArc = ({ centre, radiusX, radiusY, rotation }, angle) => ({
		x: centre.x + radiusX * Math.cos(angle) * Math.cos(rotation) - radiusY * Math.sin(angle) * Math.sin(rotation),
		y: centre.y + radiusX * Math.cos(angle) * Math.sin(rotation) + radiusY * Math.sin(angle) * Math.cos(rotation)
	});
	var readCommand = (state, { letter, args }) => {
		const { current } = state;
		const relative = letter === letter.toLowerCase();
		const point = (x, y) => relative ? {
			x: current.x + x,
			y: current.y + y
		} : {
			x,
			y
		};
		const reflect = (control) => control ? {
			x: 2 * current.x - control.x,
			y: 2 * current.y - control.y
		} : current;
		const add = (segment, to, controls = {}) => _objectSpread2({
			segments: [...state.segments, segment],
			current: to,
			subpathStart: state.subpathStart
		}, controls);
		switch (letter.toLowerCase()) {
			case "m": {
				const to = point(args[0], args[1]);
				return _objectSpread2(_objectSpread2({}, add({
					type: "move",
					to
				}, to)), {}, { subpathStart: to });
			}
			case "l": {
				const to = point(args[0], args[1]);
				return add({
					type: "line",
					to
				}, to);
			}
			case "h": {
				const to = {
					x: relative ? current.x + args[0] : args[0],
					y: current.y
				};
				return add({
					type: "line",
					to
				}, to);
			}
			case "v": {
				const to = {
					x: current.x,
					y: relative ? current.y + args[0] : args[0]
				};
				return add({
					type: "line",
					to
				}, to);
			}
			case "c":
			case "s": {
				const smooth = letter.toLowerCase() === "s";
				const control1 = smooth ? reflect(state.lastCubicControl) : point(args[0], args[1]);
				const [x2, y2, x, y] = smooth ? args : args.slice(2);
				const control2 = point(x2, y2);
				const to = point(x, y);
				return add({
					type: "cubic",
					control1,
					control2,
					to
				}, to, { lastCubicControl: control2 });
			}
			case "q":
			case "t": {
				const smooth = letter.toLowerCase() === "t";
				const control = smooth ? reflect(state.lastQuadraticControl) : point(args[0], args[1]);
				const to = smooth ? point(args[0], args[1]) : point(args[2], args[3]);
				return add({
					type: "quadratic",
					control,
					to
				}, to, { lastQuadraticControl: control });
			}
			case "a": {
				const to = point(args[5], args[6]);
				const arc = toEllipticalArc(current, to, args[0], args[1], args[2], args[3] === 1, args[4] === 1);
				return add(arc ? {
					type: "arc",
					from: current,
					to,
					arc
				} : {
					type: "line",
					to
				}, to);
			}
			default: return add({ type: "close" }, state.subpathStart);
		}
	};
	/**
	* Reads SVG path data into segments with absolute coordinates. Horizontal and vertical lines become lines,
	* smooth curves become curves with both control points, and arcs are given in centre form.
	*
	* @throws If the path is empty or not valid path data
	*/
	var parseSvgPath = (path) => {
		const commands = tokenize$1(path);
		if (commands.length === 0) throw new Error("Invalid path. Expected at least a move (M)");
		const origin = {
			x: 0,
			y: 0
		};
		return commands.reduce(readCommand, {
			segments: [],
			current: origin,
			subpathStart: origin
		}).segments;
	};
	var bezierTurningPoints = (coefficients) => {
		const [a, b, c] = coefficients;
		if (Math.abs(a) < 1e-12) return Math.abs(b) < 1e-12 ? [] : [-c / b];
		const discriminant = b * b - 4 * a * c;
		if (discriminant < 0) return [];
		const root = Math.sqrt(discriminant);
		return [(-b + root) / (2 * a), (-b - root) / (2 * a)];
	};
	/**
	* A cubic Bézier curve's position along one axis at `t`, from 0 to 1.
	*/
	var cubicAt = (p0, p1, p2, p3, t) => Math.pow(1 - t, 3) * p0 + 3 * Math.pow(1 - t, 2) * t * p1 + 3 * (1 - t) * t * t * p2 + Math.pow(t, 3) * p3;
	/**
	* A quadratic Bézier curve's position along one axis at `t`, from 0 to 1.
	*/
	var quadraticAt = (p0, p1, p2, t) => Math.pow(1 - t, 2) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
	var isWithin = (t) => t > 0 && t < 1;
	var isOnArc = ({ startAngle, sweepAngle }, angle) => {
		const fullTurn = 2 * Math.PI;
		return ((sweepAngle >= 0 ? angle - startAngle : startAngle - angle) % fullTurn + fullTurn) % fullTurn <= Math.abs(sweepAngle);
	};
	/**
	* The points on a segment furthest left, right, up and down, other than where it starts.
	*/
	var extremePoints = (segment, from) => {
		switch (segment.type) {
			case "cubic": {
				const { control1: c1, control2: c2, to } = segment;
				const turning = (p0, p1, p2, p3) => bezierTurningPoints([
					3 * (-p0 + 3 * p1 - 3 * p2 + p3),
					6 * (p0 - 2 * p1 + p2),
					3 * (p1 - p0)
				]);
				return [...turning(from.x, c1.x, c2.x, to.x), ...turning(from.y, c1.y, c2.y, to.y)].filter(isWithin).map((t) => ({
					x: cubicAt(from.x, c1.x, c2.x, to.x, t),
					y: cubicAt(from.y, c1.y, c2.y, to.y, t)
				})).concat([to]);
			}
			case "quadratic": {
				const { control, to } = segment;
				const turning = (p0, p1, p2) => bezierTurningPoints([
					0,
					2 * (p0 - 2 * p1 + p2),
					2 * (p1 - p0)
				]);
				return [...turning(from.x, control.x, to.x), ...turning(from.y, control.y, to.y)].filter(isWithin).map((t) => ({
					x: quadraticAt(from.x, control.x, to.x, t),
					y: quadraticAt(from.y, control.y, to.y, t)
				})).concat([to]);
			}
			case "arc": {
				const { arc, to } = segment;
				const { radiusX, radiusY, rotation } = arc;
				const xAngle = Math.atan2(-radiusY * Math.sin(rotation), radiusX * Math.cos(rotation));
				const yAngle = Math.atan2(radiusY * Math.cos(rotation), radiusX * Math.sin(rotation));
				return [
					xAngle,
					xAngle + Math.PI,
					yAngle,
					yAngle + Math.PI
				].filter((angle) => isOnArc(arc, angle)).map((angle) => pointOnArc(arc, angle)).concat([to]);
			}
			case "close": return [];
			default: return [segment.to];
		}
	};
	/**
	* The box around a path, reaching the furthest points of its curves rather than their control points.
	*/
	var getPathBounds = (segments) => {
		let current = {
			x: 0,
			y: 0
		};
		let subpathStart = current;
		const points = segments.flatMap((segment) => {
			const extremes = extremePoints(segment, current);
			if (segment.type === "close") current = subpathStart;
			else {
				current = segment.to;
				if (segment.type === "move") subpathStart = current;
			}
			return extremes;
		});
		return {
			left: Math.min(...points.map(({ x }) => x)),
			top: Math.min(...points.map(({ y }) => y)),
			right: Math.max(...points.map(({ x }) => x)),
			bottom: Math.max(...points.map(({ y }) => y))
		};
	};
	//#endregion
	//#region src/shapes/custom-geometry/path-holes.ts
	/**
	* Holes in custom shapes: a closed part of a path inside another part is a hole in it, and a part inside a hole is
	* filled again.
	*
	* Applications fill a path by one of two rules. By the even-odd rule, as LibreOffice fills, a part inside another is
	* always a hole. By the non-zero rule, it is a hole only if it goes round the other way. So each closed part is turned
	* round, where it needs to be, to go the other way to the part it is in, and the rules agree.
	*
	* @module
	*/
	var CURVE_STEPS = 8;
	var steps = (point) => Array.from({ length: CURVE_STEPS }, (_, index) => point((index + 1) / CURVE_STEPS));
	/**
	* The points a segment passes through, after where it starts. A close goes back to the start of the part.
	*/
	var outlineOf = (segment, from, start) => {
		switch (segment.type) {
			case "cubic": {
				const { control1: c1, control2: c2, to } = segment;
				return steps((t) => ({
					x: cubicAt(from.x, c1.x, c2.x, to.x, t),
					y: cubicAt(from.y, c1.y, c2.y, to.y, t)
				}));
			}
			case "quadratic": {
				const { control, to } = segment;
				return steps((t) => ({
					x: quadraticAt(from.x, control.x, to.x, t),
					y: quadraticAt(from.y, control.y, to.y, t)
				}));
			}
			case "arc": {
				const { arc } = segment;
				return steps((t) => pointOnArc(arc, arc.startAngle + arc.sweepAngle * t));
			}
			case "close": return [start];
			default: return [segment.to];
		}
	};
	var signedArea = (outline) => outline.reduce((total, point, index) => {
		const next = outline[(index + 1) % outline.length];
		return total + point.x * next.y - next.x * point.y;
	}, 0);
	var measurePart = (part) => {
		const { start, segments } = part;
		const outline = segments.reduce((points, segment) => [...points, ...outlineOf(segment, points[points.length - 1], start)], [start]);
		const area = signedArea(outline);
		return _objectSpread2(_objectSpread2({}, part), {}, {
			outline,
			turn: Math.abs(area) < 1e-9 ? 0 : Math.sign(area),
			closed: segments.filter(({ type }) => type === "close").length === 1 && segments[segments.length - 1].type === "close"
		});
	};
	/**
	* Splits a path into its parts. A path starts with a move, and each move starts a part.
	*/
	var splitParts = (segments) => segments.reduce((parts, segment) => {
		if (segment.type === "move") return [...parts, {
			start: segment.to,
			segments: []
		}];
		const last = parts[parts.length - 1];
		return [...parts.slice(0, -1), _objectSpread2(_objectSpread2({}, last), {}, { segments: [...last.segments, segment] })];
	}, []);
	var isPointInside = ({ x, y }, outline) => outline.reduce((inside, point, index) => {
		const previous = outline[(index + outline.length - 1) % outline.length];
		return point.y > y !== previous.y > y && x < (previous.x - point.x) * (y - point.y) / (previous.y - point.y) + point.x ? !inside : inside;
	}, false);
	var isInside$1 = (part, other) => part.outline.filter((point) => isPointInside(point, other.outline)).length > part.outline.length / 2;
	var hasEnd = (segment) => segment.type !== "close";
	var reverseSegment = (segment, from) => {
		switch (segment.type) {
			case "cubic": return {
				type: "cubic",
				control1: segment.control2,
				control2: segment.control1,
				to: from
			};
			case "quadratic": return {
				type: "quadratic",
				control: segment.control,
				to: from
			};
			case "arc": {
				const { arc } = segment;
				return {
					type: "arc",
					from: segment.to,
					to: from,
					arc: _objectSpread2(_objectSpread2({}, arc), {}, {
						startAngle: arc.startAngle + arc.sweepAngle,
						sweepAngle: -arc.sweepAngle
					})
				};
			}
			default: return {
				type: "line",
				to: from
			};
		}
	};
	/**
	* A closed part drawn the other way round. It starts where it did, and each segment is drawn backwards.
	*/
	var reversePart = ({ start, segments }) => {
		const drawn = segments.filter(hasEnd);
		const starts = [start, ...drawn.map(({ to }) => to)];
		const end = starts[starts.length - 1];
		const closing = end.x === start.x && end.y === start.y ? [] : [{
			type: "line",
			to: end
		}];
		const backwards = drawn.reduceRight((result, segment, index) => [...result, reverseSegment(segment, starts[index])], []);
		const ending = drawn[0].type === "line" ? backwards.slice(0, -1) : backwards;
		return [
			{
				type: "move",
				to: start
			},
			...closing,
			...ending,
			{ type: "close" }
		];
	};
	/**
	* Turns round the closed parts of a path that go the same way as the part they are directly inside, so that a part
	* inside another is a hole in it whichever rule an application fills paths by. Parts that aren't inside another, and
	* parts that aren't closed, are left as they are.
	*
	* @param segments - A path, starting with a move
	*/
	var orientParts = (segments) => {
		const parts = splitParts(segments).map(measurePart);
		const containers = parts.map((part, index) => parts.flatMap((other, otherIndex) => otherIndex !== index && other.turn !== 0 && isInside$1(part, other) ? [otherIndex] : []));
		const depths = containers.map(({ length }) => length);
		const turnOf = (index) => {
			const parent = containers[index].filter((container) => depths[container] < depths[index]).reduce((deepest, container) => deepest === void 0 || depths[container] > depths[deepest] ? container : deepest, void 0);
			return parent === void 0 || !parts[index].closed ? parts[index].turn : -turnOf(parent);
		};
		return parts.flatMap((part, index) => part.turn !== 0 && turnOf(index) !== part.turn ? reversePart(part) : [{
			type: "move",
			to: part.start
		}, ...part.segments]);
	};
	//#endregion
	//#region src/shapes/custom-geometry/custom-geometry.ts
	/**
	* Custom shapes (`a:custGeom`): polygons and freeform paths drawn from SVG path data.
	*
	* A shape has one path or several, each filled and outlined on its own. The box around all the paths is scaled to fill
	* the shape, and they are written as DrawingML path commands. Every corner and end of the paths is a connection site,
	* unless the shape gives its own connection points, so connectors can attach to custom shapes.
	*
	* Reference: ECMA-376 Part 1, 20.1.9.8 custGeom (Custom Geometry)
	*
	* @module
	*/
	var ANGLE_UNITS_PER_DEGREE = 6e4;
	var QUARTER_TURN = Math.PI / 2;
	var toShape = ({ left, top, x, y }, point) => ({
		x: (point.x - left) * x,
		y: (point.y - top) * y
	});
	var round = ({ x, y }) => ({
		x: Math.round(x),
		y: Math.round(y)
	});
	var degrees = (radians) => radians * 180 / Math.PI;
	var isMultipleOf = (value, step) => {
		const remainder = Math.abs(value % step);
		return remainder < 1e-9 || step - remainder < 1e-9;
	};
	/**
	* Splits an arc into cubic Bézier curves of at most a quarter turn each, for arcs DrawingML can't draw directly.
	*/
	var arcToCubics = (arc, scale) => {
		const { radiusX, radiusY, rotation, startAngle, sweepAngle } = arc;
		const count = Math.ceil(Math.abs(sweepAngle) / QUARTER_TURN - 1e-9);
		const step = sweepAngle / count;
		const handle = 4 / 3 * Math.tan(step / 4);
		const tangent = (angle) => ({
			x: -radiusX * Math.sin(angle) * Math.cos(rotation) - radiusY * Math.cos(angle) * Math.sin(rotation),
			y: -radiusX * Math.sin(angle) * Math.sin(rotation) + radiusY * Math.cos(angle) * Math.cos(rotation)
		});
		return Array.from({ length: count }, (_, index) => {
			const from = startAngle + step * index;
			const to = from + step;
			const start = pointOnArc(arc, from);
			const end = pointOnArc(arc, to);
			const startTangent = tangent(from);
			const endTangent = tangent(to);
			return {
				type: "cubic",
				points: [
					round(toShape(scale, {
						x: start.x + handle * startTangent.x,
						y: start.y + handle * startTangent.y
					})),
					round(toShape(scale, {
						x: end.x - handle * endTangent.x,
						y: end.y - handle * endTangent.y
					})),
					round(toShape(scale, end))
				]
			};
		});
	};
	/**
	* Converts an arc to DrawingML. An arc of an ellipse that is upright once scaled to the shape is written as an `arcTo`,
	* whose angles are the directions of its ends from the ellipse's centre. Other arcs are drawn with Bézier curves.
	*/
	var convertArc = (to, arc, scale) => {
		if (scale.x === 0 || scale.y === 0) return [{
			type: "line",
			to: round(toShape(scale, to))
		}];
		const isCircle = Math.abs(arc.radiusX - arc.radiusY) < 1e-9 && Math.abs(scale.x - scale.y) < 1e-9;
		if (!isCircle && !isMultipleOf(arc.rotation, QUARTER_TURN)) return arcToCubics(arc, scale);
		const turned = !isCircle && !isMultipleOf(arc.rotation, Math.PI);
		const widthRadius = (turned ? arc.radiusY : arc.radiusX) * scale.x;
		const heightRadius = (turned ? arc.radiusX : arc.radiusY) * scale.y;
		const direction = (angle) => {
			const difference = Math.atan2(heightRadius * Math.sin(angle), widthRadius * Math.cos(angle)) - angle;
			return angle + difference - 2 * Math.PI * Math.round(difference / (2 * Math.PI));
		};
		const start = direction(arc.startAngle + arc.rotation);
		const end = direction(arc.startAngle + arc.rotation + arc.sweepAngle);
		return [{
			type: "arc",
			widthRadius: Math.round(widthRadius),
			heightRadius: Math.round(heightRadius),
			startAngle: Math.round((degrees(start) % 360 + 360) % 360 * ANGLE_UNITS_PER_DEGREE),
			swingAngle: Math.round(degrees(end - start) * ANGLE_UNITS_PER_DEGREE)
		}];
	};
	var convertSegment = (segment, scale) => {
		switch (segment.type) {
			case "move":
			case "line": return [{
				type: segment.type,
				to: round(toShape(scale, segment.to))
			}];
			case "cubic": return [{
				type: "cubic",
				points: [
					round(toShape(scale, segment.control1)),
					round(toShape(scale, segment.control2)),
					round(toShape(scale, segment.to))
				]
			}];
			case "quadratic": return [{
				type: "quadratic",
				points: [round(toShape(scale, segment.control)), round(toShape(scale, segment.to))]
			}];
			case "arc": return convertArc(segment.to, segment.arc, scale);
			default: return [segment];
		}
	};
	/**
	* The direction, right (0), down (90), left (180) or up (270), a point is furthest from the middle of a box in,
	* measured as a share of the box's width and height. A point as far across as up or down is taken to be up or down.
	*/
	var outwardAngle = (x, y, width, height) => {
		const across = width === 0 ? 0 : (x - width / 2) / width;
		const down = height === 0 ? 0 : (y - height / 2) / height;
		if (Math.abs(across) > Math.abs(down)) return across > 0 ? 0 : 180;
		return down < 0 ? 270 : across === 0 && down === 0 ? 0 : 90;
	};
	/**
	* The corners and ends of the paths: where each of their segments ends. A connector leaves each one in the direction,
	* right, down, left or up, that it is furthest from the middle of the shape in.
	*/
	var findSites = (segments, scale, width, height) => {
		const ends = segments.flatMap((segment) => segment.type === "close" ? [] : [round(toShape(scale, segment.to))]);
		return ends.filter((point, index) => ends.findIndex(({ x, y }) => x === point.x && y === point.y) === index).map(({ x, y }) => ({
			x,
			y,
			angle: outwardAngle(x, y, width, height)
		}));
	};
	var SIDE_ANGLES$1 = {
		right: 0,
		bottom: 90,
		left: 180,
		top: 270
	};
	/**
	* The shape's own connection points, scaled to the shape.
	*
	* @throws If a point isn't a pair of numbers, or its side isn't one of the four
	*/
	var connectionSites = (points, scale, width, height) => points.map((point) => {
		const { x, y, side } = point;
		if (!Number.isFinite(x) || !Number.isFinite(y) || side !== void 0 && SIDE_ANGLES$1[side] === void 0) throw new Error(`Invalid connection point ${JSON.stringify(point)}. Expected numbers x and y, and a side of top, right, bottom or left`);
		const site = round(toShape(scale, {
			x,
			y
		}));
		return _objectSpread2(_objectSpread2({}, site), {}, { angle: side === void 0 ? outwardAngle(site.x, site.y, width, height) : SIDE_ANGLES$1[side] });
	});
	var PATH_FILLS = /* @__PURE__ */ new Map([
		[true, "norm"],
		[false, "none"],
		["lighter", "lighten"],
		["slightlyLighter", "lightenLess"],
		["darker", "darken"],
		["slightlyDarker", "darkenLess"]
	]);
	/**
	* Reads a custom shape's paths. Parts of a path inside other parts are turned round to go the other way, so they are
	* holes whichever way applications fill paths.
	*
	* @throws If there is no path, both `path` and `paths`, a path isn't valid SVG path data, or a fill isn't one of the choices
	*/
	var readPaths = ({ path, paths }) => {
		if (path !== void 0 && paths !== void 0) throw new Error("Invalid custom shape. Expected path or paths, not both");
		const options = paths !== null && paths !== void 0 ? paths : path === void 0 ? [] : [{ path }];
		if (options.length === 0) throw new Error("Invalid custom shape. Expected a path, or at least one of paths");
		return options.map(({ path: data, fill = true, line }) => {
			const mode = PATH_FILLS.get(fill);
			if (mode === void 0) throw new Error(`Invalid custom shape path fill "${fill}". Expected true, false, "lighter", "slightlyLighter", "darker" or "slightlyDarker"`);
			return {
				segments: orientParts(parseSvgPath(data)),
				fill: mode,
				stroke: line !== false
			};
		});
	};
	var unionOf = (bounds) => ({
		left: Math.min(...bounds.map(({ left }) => left)),
		top: Math.min(...bounds.map(({ top }) => top)),
		right: Math.max(...bounds.map(({ right }) => right)),
		bottom: Math.max(...bounds.map(({ bottom }) => bottom))
	});
	/**
	* Where the text goes, scaled to the shape.
	*
	* @throws If the box's sides aren't numbers, or it is turned inside out
	*/
	var scaleTextArea = (textArea, scale) => {
		const { left, top, right, bottom } = textArea;
		if (![
			left,
			top,
			right,
			bottom
		].every(Number.isFinite) || right < left || bottom < top) throw new Error(`Invalid text area ${JSON.stringify(textArea)}. Expected numbers left, top, right and bottom, with right at least left and bottom at least top`);
		const topLeft = round(toShape(scale, {
			x: left,
			y: top
		}));
		const bottomRight = round(toShape(scale, {
			x: right,
			y: bottom
		}));
		return {
			left: topLeft.x,
			top: topLeft.y,
			right: bottomRight.x,
			bottom: bottomRight.y
		};
	};
	/**
	* Reads a custom shape's paths and scales them to the shape: the box around them is stretched to fill the shape's box.
	* The text area and connection points are scaled with them.
	*
	* @param width - The shape's width in EMUs
	* @param height - The shape's height in EMUs
	* @throws If the paths, text area or connection points aren't valid
	*/
	var createCustomGeometryData = (options, width, height) => {
		const paths = readPaths(options);
		const bounds = unionOf(paths.map(({ segments }) => getPathBounds(segments)));
		const pathWidth = bounds.right - bounds.left;
		const pathHeight = bounds.bottom - bounds.top;
		const x = pathWidth > 0 ? width / pathWidth : 0;
		const y = pathHeight > 0 ? height / pathHeight : 0;
		const scale = {
			left: bounds.left,
			top: bounds.top,
			x,
			y
		};
		return {
			width,
			height,
			paths: paths.map(({ segments, fill, stroke }) => ({
				segments: segments.flatMap((segment) => convertSegment(segment, scale)),
				fill,
				stroke
			})),
			sites: options.connectionPoints === void 0 ? findSites(paths.flatMap(({ segments }) => segments), scale, width, height) : connectionSites(options.connectionPoints, scale, width, height),
			textArea: options.textArea && scaleTextArea(options.textArea, scale)
		};
	};
	/**
	* The box a custom shape of the given size writes its text in: its text area, or the whole shape.
	*
	* @param width - The shape's width in EMUs
	* @param height - The shape's height in EMUs
	*/
	var getCustomTextRectangle = (options, width, height) => {
		var _ref;
		return (_ref = options.textArea && createCustomGeometryData(options, width, height).textArea) !== null && _ref !== void 0 ? _ref : {
			left: 0,
			top: 0,
			right: width,
			bottom: height
		};
	};
	var createPoint = ({ x, y }) => new docx.BuilderElement({
		name: "a:pt",
		attributes: {
			x: {
				key: "x",
				value: x
			},
			y: {
				key: "y",
				value: y
			}
		}
	});
	var createPathSegment = (segment) => {
		switch (segment.type) {
			case "move": return new docx.BuilderElement({
				name: "a:moveTo",
				children: [createPoint(segment.to)]
			});
			case "line": return new docx.BuilderElement({
				name: "a:lnTo",
				children: [createPoint(segment.to)]
			});
			case "cubic": return new docx.BuilderElement({
				name: "a:cubicBezTo",
				children: segment.points.map(createPoint)
			});
			case "quadratic": return new docx.BuilderElement({
				name: "a:quadBezTo",
				children: segment.points.map(createPoint)
			});
			case "arc": return new docx.BuilderElement({
				name: "a:arcTo",
				attributes: {
					widthRadius: {
						key: "wR",
						value: segment.widthRadius
					},
					heightRadius: {
						key: "hR",
						value: segment.heightRadius
					},
					startAngle: {
						key: "stAng",
						value: segment.startAngle
					},
					swingAngle: {
						key: "swAng",
						value: segment.swingAngle
					}
				}
			});
			default: return new docx.BuilderElement({ name: "a:close" });
		}
	};
	/**
	* A guide for a length across or down the shape that keeps its share of the shape's width or height when the shape is
	* resized, as PowerPoint writes the points of freeforms: the length times `w` (or `h`), divided by the width (or height)
	* it was worked out for.
	*/
	var shareGuide = (name, value, size, length) => ({
		name,
		formula: length === 0 ? `val ${value}` : `*/ ${value} ${size} ${length}`
	});
	var createGuide = ({ name, formula }) => new docx.BuilderElement({
		name: "a:gd",
		attributes: {
			name: {
				key: "name",
				value: name
			},
			formula: {
				key: "fmla",
				value: formula
			}
		}
	});
	var siteGuides = (sites, width, height) => sites.flatMap(({ x, y }, index) => [shareGuide(`connsiteX${index}`, x, "w", width), shareGuide(`connsiteY${index}`, y, "h", height)]);
	var createConnectionSite = ({ angle }, index) => new docx.BuilderElement({
		name: "a:cxn",
		attributes: { angle: {
			key: "ang",
			value: Math.round(angle * ANGLE_UNITS_PER_DEGREE)
		} },
		children: [new docx.BuilderElement({
			name: "a:pos",
			attributes: {
				x: {
					key: "x",
					value: `connsiteX${index}`
				},
				y: {
					key: "y",
					value: `connsiteY${index}`
				}
			}
		})]
	});
	var textAreaGuides = (textArea, width, height) => textArea === void 0 ? [] : [
		shareGuide("textAreaLeft", textArea.left, "w", width),
		shareGuide("textAreaTop", textArea.top, "h", height),
		shareGuide("textAreaRight", textArea.right, "w", width),
		shareGuide("textAreaBottom", textArea.bottom, "h", height)
	];
	var createPath = (path, width, height) => new docx.BuilderElement({
		name: "a:path",
		attributes: {
			width: {
				key: "w",
				value: width
			},
			height: {
				key: "h",
				value: height
			},
			fill: {
				key: "fill",
				value: path.fill === "norm" ? void 0 : path.fill
			},
			stroke: {
				key: "stroke",
				value: path.stroke ? void 0 : false
			}
		},
		children: path.segments.map(createPathSegment)
	});
	/**
	* Creates an `a:custGeom` element for a custom shape.
	*
	* The connection sites and text area are guides that keep their share of the shape's width and height, so they stay
	* in place when the shape is resized. Without a text area, the text uses the whole of the shape's box.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_CustomGeometry2D">
	*   <xsd:sequence>
	*     <xsd:element name="avLst" type="CT_GeomGuideList" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="gdLst" type="CT_GeomGuideList" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="ahLst" type="CT_AdjustHandleList" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="cxnLst" type="CT_ConnectionSiteList" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="rect" type="CT_GeomRect" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="pathLst" type="CT_Path2DList" minOccurs="1" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createCustomGeometry = ({ width, height, paths, sites, textArea }) => new docx.BuilderElement({
		name: "a:custGeom",
		children: [
			new docx.BuilderElement({ name: "a:avLst" }),
			new docx.BuilderElement({
				name: "a:gdLst",
				children: [...siteGuides(sites, width, height), ...textAreaGuides(textArea, width, height)].map(createGuide)
			}),
			new docx.BuilderElement({ name: "a:ahLst" }),
			new docx.BuilderElement({
				name: "a:cxnLst",
				children: sites.map(createConnectionSite)
			}),
			new docx.BuilderElement({
				name: "a:rect",
				attributes: textArea ? {
					left: {
						key: "l",
						value: "textAreaLeft"
					},
					top: {
						key: "t",
						value: "textAreaTop"
					},
					right: {
						key: "r",
						value: "textAreaRight"
					},
					bottom: {
						key: "b",
						value: "textAreaBottom"
					}
				} : {
					left: {
						key: "l",
						value: "l"
					},
					top: {
						key: "t",
						value: "t"
					},
					right: {
						key: "r",
						value: "r"
					},
					bottom: {
						key: "b",
						value: "b"
					}
				}
			}),
			new docx.BuilderElement({
				name: "a:pathLst",
				children: paths.map((path) => createPath(path, width, height))
			})
		]
	});
	//#endregion
	//#region src/shapes/preset-shape/preset-shape-properties.ts
	/**
	* Shape properties (`wps:spPr`) for preset shapes.
	*
	* @module
	*/
	/**
	* Creates the `wps:spPr` element for a preset shape: transform, geometry, fill, line and effects, in schema order.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_ShapeProperties">
	*   <xsd:sequence>
	*     <xsd:element name="xfrm" type="CT_Transform2D" minOccurs="0"/>
	*     <xsd:group ref="EG_Geometry" minOccurs="0"/>
	*     <xsd:group ref="EG_FillProperties" minOccurs="0"/>
	*     <xsd:element name="ln" type="CT_LineProperties" minOccurs="0"/>
	*     <xsd:group ref="EG_EffectProperties" minOccurs="0"/>
	*     ...
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createPresetShapeProperties = ({ transformation, geometry, fill, line, effects }) => new docx.BuilderElement({
		name: "wps:spPr",
		children: [
			createTransform(transformation),
			geometry.type === "custom" ? createCustomGeometry(createCustomGeometryData(geometry, transformation.emus.x, transformation.emus.y)) : createPresetGeometry(getOoxmlShapeName(geometry.type), createShapeGuides(geometry.type, geometry.adjustments)),
			createShapeFill(fill),
			createShapeLine(line),
			...effects ? [createShapeEffects(effects)] : []
		]
	});
	//#endregion
	//#region src/shapes/preset-shape/shape-text.ts
	/**
	* Text layout inside preset shapes (`wps:bodyPr`): alignment, margins, wrapping, autofit, direction, columns and warps.
	*
	* Reference: ECMA-376 Part 1, 21.1.2.1.1 bodyPr (Body Properties)
	*
	* @module
	*/
	var VERTICAL_ALIGNMENT_OOXML_NAMES = {
		top: "t",
		center: "ctr",
		bottom: "b"
	};
	var TEXT_DIRECTION_OOXML_NAMES = {
		horizontal: "horz",
		topToBottom: "vert",
		bottomToTop: "vert270",
		stacked: "wordArtVert",
		stackedRightToLeft: "wordArtVertRtl",
		eastAsianVertical: "eaVert",
		mongolianVertical: "mongolianVert"
	};
	var TEXT_WARP_OOXML_NAMES = {
		square: "textPlain",
		stop: "textStop",
		triangleUp: "textTriangle",
		triangleDown: "textTriangleInverted",
		chevronUp: "textChevron",
		chevronDown: "textChevronInverted",
		ringInside: "textRingInside",
		ringOutside: "textRingOutside",
		archUp: "textArchUp",
		archDown: "textArchDown",
		circle: "textCircle",
		button: "textButton",
		archUpFilled: "textArchUpPour",
		archDownFilled: "textArchDownPour",
		circleFilled: "textCirclePour",
		buttonFilled: "textButtonPour",
		curveUp: "textCurveUp",
		curveDown: "textCurveDown",
		canUp: "textCanUp",
		canDown: "textCanDown",
		wave: "textWave1",
		waveInverted: "textWave2",
		doubleWave: "textDoubleWave1",
		doubleWaveInverted: "textWave4",
		inflate: "textInflate",
		deflate: "textDeflate",
		inflateBottom: "textInflateBottom",
		deflateBottom: "textDeflateBottom",
		inflateTop: "textInflateTop",
		deflateTop: "textDeflateTop",
		deflateInflate: "textDeflateInflate",
		deflateInflateDeflate: "textDeflateInflateDeflate",
		fadeRight: "textFadeRight",
		fadeLeft: "textFadeLeft",
		fadeUp: "textFadeUp",
		fadeDown: "textFadeDown",
		slantUp: "textSlantUp",
		slantDown: "textSlantDown",
		cascadeUp: "textCascadeUp",
		cascadeDown: "textCascadeDown"
	};
	var MAX_TEXT_COLUMNS = 16;
	var createAutofit = ({ resizeShapeToFitText, shrinkTextOnOverflow }) => {
		if (resizeShapeToFitText && shrinkTextOnOverflow) throw new Error("Invalid text options. A shape can't both resize to fit its text and shrink its text");
		if (resizeShapeToFitText) return [new docx.BuilderElement({ name: "a:spAutoFit" })];
		return shrinkTextOnOverflow ? [new docx.BuilderElement({ name: "a:normAutofit" })] : [];
	};
	var createWarp = (warp) => new docx.BuilderElement({
		name: "a:prstTxWarp",
		attributes: { preset: {
			key: "prst",
			value: TEXT_WARP_OOXML_NAMES[warp]
		} },
		children: [new docx.BuilderElement({ name: "a:avLst" })]
	});
	var columnCount = (count) => {
		if (!(Number.isInteger(count) && count >= 1 && count <= MAX_TEXT_COLUMNS)) throw new Error(`Invalid text column count ${count}. Expected a whole number from 1 to ${MAX_TEXT_COLUMNS}`);
		return count;
	};
	var marginEmus = (margin, side) => margin === void 0 ? void 0 : pointsToEmus(margin, `${side} text margin`);
	/**
	* Creates the `wps:bodyPr` element for the text in a preset shape.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_TextBodyProperties">
	*   <xsd:sequence>
	*     <xsd:element name="prstTxWarp" type="CT_PresetTextShape" minOccurs="0" maxOccurs="1"/>
	*     <xsd:group ref="EG_TextAutofit" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="scene3d" type="CT_Scene3D" minOccurs="0" maxOccurs="1"/>
	*     <xsd:group ref="EG_Text3D" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	*   <xsd:attribute name="vert" type="ST_TextVerticalType" use="optional"/>
	*   <xsd:attribute name="wrap" type="ST_TextWrappingType" use="optional"/>
	*   <xsd:attribute name="lIns" type="ST_Coordinate32" use="optional"/>
	*   <xsd:attribute name="tIns" type="ST_Coordinate32" use="optional"/>
	*   <xsd:attribute name="rIns" type="ST_Coordinate32" use="optional"/>
	*   <xsd:attribute name="bIns" type="ST_Coordinate32" use="optional"/>
	*   <xsd:attribute name="numCol" type="ST_TextColumnCount" use="optional"/>
	*   <xsd:attribute name="spcCol" type="ST_PositiveCoordinate32" use="optional"/>
	*   <xsd:attribute name="fromWordArt" type="xsd:boolean" use="optional"/>
	*   <xsd:attribute name="anchor" type="ST_TextAnchoringType" use="optional"/>
	*   ...
	* </xsd:complexType>
	* ```
	*
	* @throws If a margin or the column spacing is out of range, the column count isn't 1 to 16, or both autofit options are set
	*/
	var createShapeTextProperties = (options = {}) => {
		var _options$margins, _options$margins2, _options$margins3, _options$margins4, _options$columns;
		return new docx.BuilderElement({
			name: "wps:bodyPr",
			attributes: {
				direction: {
					key: "vert",
					value: options.direction && TEXT_DIRECTION_OOXML_NAMES[options.direction]
				},
				wrap: {
					key: "wrap",
					value: options.wrap === void 0 ? void 0 : options.wrap ? "square" : "none"
				},
				left: {
					key: "lIns",
					value: marginEmus((_options$margins = options.margins) === null || _options$margins === void 0 ? void 0 : _options$margins.left, "left")
				},
				top: {
					key: "tIns",
					value: marginEmus((_options$margins2 = options.margins) === null || _options$margins2 === void 0 ? void 0 : _options$margins2.top, "top")
				},
				right: {
					key: "rIns",
					value: marginEmus((_options$margins3 = options.margins) === null || _options$margins3 === void 0 ? void 0 : _options$margins3.right, "right")
				},
				bottom: {
					key: "bIns",
					value: marginEmus((_options$margins4 = options.margins) === null || _options$margins4 === void 0 ? void 0 : _options$margins4.bottom, "bottom")
				},
				columns: {
					key: "numCol",
					value: options.columns && columnCount(options.columns.count)
				},
				columnSpacing: {
					key: "spcCol",
					value: ((_options$columns = options.columns) === null || _options$columns === void 0 ? void 0 : _options$columns.spacing) === void 0 ? void 0 : pointsToEmus(options.columns.spacing, "text column spacing")
				},
				fromWordArt: {
					key: "fromWordArt",
					value: options.warp ? true : void 0
				},
				anchor: {
					key: "anchor",
					value: options.verticalAlignment && VERTICAL_ALIGNMENT_OOXML_NAMES[options.verticalAlignment]
				}
			},
			children: [...options.warp ? [createWarp(options.warp)] : [], ...createAutofit(options)]
		});
	};
	//#endregion
	//#region src/shapes/drawing/text-flow.ts
	/**
	* Text that flows from one shape to the next (`wps:txbx` with an `id`, and `wps:linkedTxbx`), as in a newsletter whose
	* article continues in another text box.
	*
	* Reference: ECMA-376 Part 1, 20.4.2.37 txbx (Textual Contents of Shape) and 20.4.2.18 linkedTxbx (Linked Textbox)
	*
	* @module
	*/
	var NO_DOCUMENT = {};
	var flows = /* @__PURE__ */ new WeakMap();
	/**
	* The text box of a shape in a text flow. The first shape of the flow written in a document has the text, and the
	* shapes after it continue it, in the order they are written. A document numbers its flows from 1, in the order they
	* are first written, so writing a document twice writes the same flows.
	*/
	var TextFlowBox = class extends docx.XmlComponent {
		constructor(flow, children) {
			super("wps:txbx");
			_defineProperty(this, "flow", void 0);
			_defineProperty(this, "children", void 0);
			this.flow = flow;
			this.children = children;
		}
		prepForXml(context) {
			var _context$file, _flows$get, _byName$get;
			const document = (_context$file = context.file) !== null && _context$file !== void 0 ? _context$file : NO_DOCUMENT;
			const byName = (_flows$get = flows.get(document)) !== null && _flows$get !== void 0 ? _flows$get : /* @__PURE__ */ new Map();
			const shapes = (_byName$get = byName.get(this.flow)) !== null && _byName$get !== void 0 ? _byName$get : [];
			const written = shapes.includes(this) ? byName : new Map([...byName, [this.flow, [...shapes, this]]]);
			flows.set(document, written);
			const id = [...written.keys()].indexOf(this.flow) + 1;
			const sequence = written.get(this.flow).indexOf(this);
			return (sequence === 0 ? new docx.BuilderElement({
				name: "wps:txbx",
				attributes: { id: {
					key: "id",
					value: id
				} },
				children: [new docx.BuilderElement({
					name: "w:txbxContent",
					children: this.children.length > 0 ? [...this.children] : [new docx.Paragraph({})]
				})]
			}) : new docx.BuilderElement({
				name: "wps:linkedTxbx",
				attributes: {
					id: {
						key: "id",
						value: id
					},
					sequence: {
						key: "seq",
						value: sequence
					}
				}
			})).prepForXml(context);
		}
	};
	/**
	* Creates the text box of a shape in a text flow: the flow's text in the first shape of the flow in the document, and
	* a link to it in the shapes after it.
	*
	* @param flow - The flow's name
	* @param children - The flow's paragraphs, which the first shape of the flow writes, or an empty paragraph if there are none
	*/
	var createTextFlowBox = (flow, children) => new TextFlowBox(flow, children);
	//#endregion
	//#region src/shapes/preset-shape/preset-shape.ts
	/**
	* Preset shapes (`wps:wsp`): rectangles, ellipses, lines, arrows and the other DrawingML presets.
	*
	* @module
	*/
	/**
	* Creates the non-visual drawing properties of a shape, picture or group inside a drawing, such as `wps:cNvPr`.
	*/
	var createNonVisualDrawingProperties$1 = (properties, name = "wps:cNvPr") => new docx.NonVisualDrawingProperties(name, properties);
	var createConnection = (name, { id, index }) => new docx.BuilderElement({
		name,
		attributes: {
			id: {
				key: "id",
				value: id
			},
			index: {
				key: "idx",
				value: index
			}
		}
	});
	var createNonVisualConnectorProperties = (connections = {}) => new docx.BuilderElement({
		name: "wps:cNvCnPr",
		children: [...connections.start ? [createConnection("a:stCxn", connections.start)] : [], ...connections.end ? [createConnection("a:endCxn", connections.end)] : []]
	});
	/**
	* Creates a `wps:wsp` element for a preset shape.
	*
	* Lines and connectors are written with `wps:cNvCnPr`, which says which shapes they are attached to,
	* and other shapes with `wps:cNvSpPr`.
	* A shape without a `textFlow` has a text box (`wps:txbx`) only when it has at least one paragraph, since
	* `w:txbxContent` can't be empty, and its text is centred vertically unless `textOptions` says otherwise. A shape in a
	* text flow always has one: the first shape of the flow writes the text, or an empty paragraph if there is none, and
	* the shapes after it link to it with `wps:linkedTxbx`. Its text starts at the top, so it can flow on from the bottom.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_WordprocessingShape">
	*   <xsd:sequence minOccurs="1" maxOccurs="1">
	*     <xsd:element name="cNvPr" type="a:CT_NonVisualDrawingProps" minOccurs="0" maxOccurs="1"/>
	*     <xsd:choice minOccurs="1" maxOccurs="1">
	*       <xsd:element name="cNvSpPr" type="a:CT_NonVisualDrawingShapeProps" minOccurs="1" maxOccurs="1"/>
	*       <xsd:element name="cNvCnPr" type="a:CT_NonVisualConnectorProperties" minOccurs="1" maxOccurs="1"/>
	*     </xsd:choice>
	*     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="style" type="a:CT_ShapeStyle" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
	*     <xsd:choice minOccurs="0" maxOccurs="1">
	*       <xsd:element name="txbx" type="CT_TextboxInfo" minOccurs="1" maxOccurs="1"/>
	*       <xsd:element name="linkedTxbx" type="CT_LinkedTextboxInformation" minOccurs="1" maxOccurs="1"/>
	*     </xsd:choice>
	*     <xsd:element name="bodyPr" type="a:CT_TextBodyProperties" minOccurs="1" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createPresetShape = ({ geometry, connections, fill, line, effects, children, textOptions, nonVisualDrawingProperties, transformation, textFlow }) => new docx.BuilderElement({
		name: "wps:wsp",
		children: [
			...nonVisualDrawingProperties ? [createNonVisualDrawingProperties$1(nonVisualDrawingProperties)] : [],
			geometry.type !== "custom" && isConnectorShapeType(geometry.type) ? createNonVisualConnectorProperties(connections) : new docx.BuilderElement({ name: "wps:cNvSpPr" }),
			createPresetShapeProperties({
				transformation,
				geometry,
				fill,
				line,
				effects
			}),
			...textFlow === void 0 ? (children === null || children === void 0 ? void 0 : children.length) ? [createTextBox(children)] : [] : [createTextFlowBox(textFlow, children !== null && children !== void 0 ? children : [])],
			createShapeTextProperties(textFlow === void 0 && (children === null || children === void 0 ? void 0 : children.length) ? _objectSpread2({ verticalAlignment: "center" }, textOptions) : textOptions)
		]
	});
	//#endregion
	//#region src/shapes/drawing/shape-group.ts
	/**
	* Groups of shapes (`wpg:wgp` and `wpg:grpSp`): shapes, pictures and groups that are moved and resized together.
	*
	* @module
	*/
	var createGroupTransform = ({ transformation, childOffset = {
		x: 0,
		y: 0
	}, childExtent = transformation.emus }) => createTransform(transformation, [new docx.BuilderElement({
		name: "a:chOff",
		attributes: {
			x: {
				key: "x",
				value: childOffset.x
			},
			y: {
				key: "y",
				value: childOffset.y
			}
		}
	}), new docx.BuilderElement({
		name: "a:chExt",
		attributes: {
			x: {
				key: "cx",
				value: childExtent.x
			},
			y: {
				key: "cy",
				value: childExtent.y
			}
		}
	})]);
	/**
	* Creates a group of shapes: `wpg:wgp` for a group drawing or a group on a canvas, and `wpg:grpSp` for a group inside
	* another group.
	*/
	var createShapeGroup = (options) => {
		var _options$name;
		return new docx.BuilderElement({
			name: (_options$name = options.name) !== null && _options$name !== void 0 ? _options$name : "wpg:wgp",
			children: [
				...options.nonVisualDrawingProperties ? [createNonVisualDrawingProperties$1(options.nonVisualDrawingProperties, "wpg:cNvPr")] : [],
				new docx.BuilderElement({ name: "wpg:cNvGrpSpPr" }),
				new docx.BuilderElement({
					name: "wpg:grpSpPr",
					children: [createGroupTransform(options)]
				}),
				...options.children
			]
		});
	};
	//#endregion
	//#region src/shapes/picture/shape-picture.ts
	/**
	* Pictures in groups and on drawing canvases (`pic:pic`).
	*
	* Reference: ECMA-376 Part 1, 20.2.2.5 pic (Picture)
	*
	* @module
	*/
	/**
	* Creates a `pic:pic` element for a picture in a group or on a canvas. On a canvas, the schema calls it `dpct:pic`,
	* which is the same element in the same namespace.
	*
	* The picture is added to the document's media when it is written.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_Picture">
	*   <xsd:sequence minOccurs="1" maxOccurs="1">
	*     <xsd:element name="nvPicPr" type="CT_PictureNonVisual" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="blipFill" type="a:CT_BlipFillProperties" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="1" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createShapePicture = ({ image, crop, line, effects, nonVisualDrawingProperties, transformation }) => new docx.BuilderElement({
		name: "pic:pic",
		attributes: { namespace: {
			key: "xmlns:pic",
			value: "http://schemas.openxmlformats.org/drawingml/2006/picture"
		} },
		children: [
			new docx.BuilderElement({
				name: "pic:nvPicPr",
				children: [createNonVisualDrawingProperties$1(nonVisualDrawingProperties, "pic:cNvPr"), createPictureLocks()]
			}),
			createPictureFill({
				image,
				crop
			}, "pic:blipFill"),
			new docx.BuilderElement({
				name: "pic:spPr",
				children: [
					createTransform(transformation),
					createPresetGeometry(),
					...line ? [createShapeLine(line)] : [],
					...effects ? [createShapeEffects(effects)] : []
				]
			})
		]
	});
	//#endregion
	//#region src/shapes/drawing/shape-drawing-child.ts
	/** The `a:graphicData` URI of a shape (`wps:wsp`) */
	var SHAPE_URI = "http://schemas.microsoft.com/office/word/2010/wordprocessingShape";
	/** The `a:graphicData` URI of a group (`wpg:wgp`) */
	var GROUP_URI = "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup";
	/** The `a:graphicData` URI of a drawing canvas (`wpc:wpc`) */
	var CANVAS_URI = "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas";
	/**
	* Creates the element for a shape (`wps:wsp`), picture (`pic:pic`) or group in a drawing.
	*
	* @param groupName - The element for a group: `wpg:wgp` on a canvas, and `wpg:grpSp` inside another group
	*/
	var createShapeDrawingChild = (child, groupName) => {
		switch (child.type) {
			case "wps": return createPresetShape(_objectSpread2(_objectSpread2({}, child.data), {}, { transformation: child.transformation }));
			case "picture": return createShapePicture(_objectSpread2(_objectSpread2({}, child.data), {}, { transformation: child.transformation }));
			default: return createShapeGroup({
				name: groupName,
				nonVisualDrawingProperties: child.nonVisualDrawingProperties,
				transformation: child.transformation,
				childOffset: child.childOffset,
				childExtent: child.childExtent,
				children: child.children.map((grandchild) => createShapeDrawingChild(grandchild, "wpg:grpSp"))
			});
		}
	};
	//#endregion
	//#region src/text-layout/font-widths.ts
	/**
	* The characters the widths are for, as ranges of code points: printable ASCII; Latin-1, Latin Extended-A and B, IPA and
	* the spacing modifier letters; Greek and Cyrillic; Latin Extended Additional, for Vietnamese; and general punctuation,
	* superscripts and subscripts, currency symbols, letterlike symbols, number forms, arrows and mathematical operators.
	*/
	var FONT_WIDTH_RANGES = [
		[32, 126],
		[160, 767],
		[880, 1279],
		[7680, 7935],
		[8192, 8959]
	];
	var FONT_WIDTHS = [
		{
			name: "Calibri",
			lineHeight: 1220.703125,
			regular: "3y566h7O7XbbaG3t4L4L7O7O3W4O3Y627X*094c4c7O*027fd+938w8l9D7E7b9T9L3Y4/886Adna6am85ax8v7b7Da28TdW877D7k4P624P7O7O4z7v8d6D8d7O4N7n8d3B3L773Bcv8d8f8d8d5t675f8d74bb6N756b4W7c4W7O3y567O7X7O7X7O7O69d26i807O4O7X6a5j7O5g5e4A8C9a3Y4P3S6C809Yavaz7f=93*04bX==7E*02=3Y*029N==am*037Oao=a2*02=858f=7v*04c5==7O*02=3B*028d8d=8f*037O8h=8d*02=8d=*0f8U9N8E=*0jag8l=*083B8X7l=*0377=*036D488y5S6K3U=*05939Q8d=*05dzdi=*0g5q7D5m=*0m3P8E9D8q8d8j8d8A917e9NaL8q8d8b7Ea37q7b4N9U8Tcf4x4d88774q7fdLa68pamaV92c5af9z8d8v7b677a6L5D8j5f7Dbi9raoa28k7O7k6b7q*026F7X7X6G678d3Q6b8+56gXfOeobLak7lf4dRbZ=*0f7O=*059T8p=*087q=gNfOeo==d/9s=*0z7q7q==a39o7X7X7I6s=*0d4Z9D5f3LcScR938l6D6A7D676b6/6/8Eaj8Z7E7O594p9S8d8D5T927B7v8d*026D738d8d7O7O9+6D6D8e8h4q8d8d8s747t8d*024q4i4I5H5Q3B8Rcucucv8d8d8t8fb8aUab5t*044/4/7171673L4q3L4Z5f5f948K8u74bb756v6b7u7j7i6/*026D9Q7v8h8E8n4Z77638d6/6/cAdmdT9H7naJbQ998D7I7I8d8q5I5I2O3R3R3X4+7I4X3t6g3W*023y3y55557O7O8p8p6b6b4y6a4A4z4y6a4z4A4m4m3y3y5d*035Z3y514U727l5d5d4F2H4h4U555/*045d5d6b8/6y5d*03514z7l7l724c5d*038j8j5U7U6I7D633W3Wa28s!!4i6D*02=4/!*034Z7K93=7E9L3Y!am!7Dao4i938w6w8Q7E7k9Lam3Y888Zdna67Iam9L85!7a7D7DbT87bKao==8T788p4i8u8T8j6+8b785s8p8k4i777f8C715U8f8F7Z6r8k638uab6Gb4aU=*04878c8L7D8u=aecK9tam8f8l6r7b6O8x729393dLcv8x8b8I808l6z9q7Vax8k7p6a9t7Z6D3Lam6M6M858K8laX9k7Z8l*027E7E9N6K8z7b3Y3Y4/dEdI9G8va28f9I938q8w6Ka47Ecx7qa2a28v9zdn9Lam9K858l7D8faV879/8IdAdW9DbW8j8AdL8H7v8l7v5q8K7OaN6D8t8t7g7+aA8n8f898d6D63759M6N8u7lbpbJ8oaq7m6Xbi7q=7O8t=6Y673B3B3LbLc28l=*028dewaB9P87ceaa9S8dd0b6bj8PeabP7q6tbKb4am8c9e7u==gledam90ewceewaB8l6D9x00*06an8y8j7A858d6N5y6F5Q8k75d5bf7q6D957K8v7g8E7G9T8na38Hb79te6bDa68G8l6D7D637D747D748K7ebo9k8/7F8I7l8I7lbF9mbF9m3Y==8y7s9U849L8n9L8t8I7ldKba3Y=*03bXc5==a37O=*057q7j=*05am8c=*0b6w5q==6F5Q8R7d876N=*2p7v=4N4N8N8b=*0VaV92aV92aV92aV92aV92=*03bi9rbi9rbi9rbi9rbi9r=*079z6F8K7q8f747QfE7Oe94J3y2n8r3p381Z00*044O4O7X7Oe9e96b7O3W*036y*037O*02!*02aO!*0200*043yge!3s6g94!*02665j5j!8K7z7O!*045g!*0o4c3u00*04!00*09672J!!5B5b5D515E5D5I5D5w3p3p5G673S5g5e5B5b5D515E5D5I5D5w3p3p!5e5k5G4U5k!*0a9E8l8l7b7Xcva6eqchdWbF8E7X887DgW8g8P9b8Z7b8l!!7X*02a3ar7Xaf9a!*0f00*0w!*0jb+!*0c7S!!g1d2!*07b5!b1!*02=!*06bz!*027b!*0pb+5K!*03aAbjaAbjbabla7aKaqb0b0a660!*0y8l6D!*0ae9*03k8c9dO*03!*0d7o!*1o8l!*028Q!*07cv!8t7O!!5g!*023Y7O!*02dlaI!*08a+!5K!*0r7O!*0m=7O!!7O7O!*2p",
			bold: "3y566S7O7Xbpb13F4U4U7O7O424O4b6K7X*094k4k7O*027fe29u8N8h9S7E7b9Z9T4b5b8z6DdGajaA8kaK8P7p7Lad9fea8D887u556K557O7O4I7K8p6y8p7T4Y7q8p3S3/7w3ScJ8p8q8p8p5z6f5r8p7pbF7b7q6d5o7r5o7O3y567O7X7O7X7O7O6vd26w8r7O4O7X665m7O5i5g4J8P9m4c4L3Y6P8raiaPa+7f=9u*04c7==7E*02=4b*029/==aA*037OaF=ad*02=8k8H=7K*04c7==7T*02=3S*028p8p=8q*037O8w=8p*02=8p=*0f9l9/8V=*0jai8z=*083S9m7R=*037w=*036K4O8O6C6N48=*059Ka18p=*05dGdb=*0g5H7L5y=*0m428Xas8I8p8Y8y8d9v7g9/by8I8p8l7Eai7J7b4YaF9fcA4I4J8B7w4V7CdVaj8paAbZ9VcyaPa08p8P7s6j7m6+5K8x5r7LbVa7aFad8B827u6d7G7J7v6M7X7X6D698p487x9b56hkg4eCc2aC7Rfueico=*0f7T=*04c7a58J=*087a=h8g4eC==dR9A=*04c7=*0t7G7a==a29v8g837G6j=*0d5a9L5v3/cXcY9u8m6D6U7V6f6d6S6P8Zav9i7E7O5p4F9U8p915X9c7J7K8p*026D6V8p8z7T7Ta36H6H8r8f4A8y8o8o7v7A8p*024K4u576a6i3Y97cJ*028p8p8D8obfb3aX5z5z5A5z5z58587F7F6f3N4s3N585r5r9a988k7pbF7q7f6i7v7a7c6S*026ya77L8f8t8x5a7w6k8z6S6Sd6dGena27Ta/cu9H9h8d7I8x8y5R5R2Z3W3R405i815b3m6o42*023y3y55557O7O8p8p6h6h4y664J4I4y6a4I4J4m4m3y3y5d*03613H584X6Y7C5d*022T4m5d555/*045d5d6h8/6P5d*03584I7l7C6Y4k5d*038j8j5U8a757L7i4242ac8J!!4i6D6y6D=5b!*034Z7K9u=7E9T4b!aA!88aF4u9u8N6q927E7u9TaA4b8z9idGaj7IaA9T8k!7m7L88cx8DcEaF==9f7a8w4u8A9f8x7j8l7a5I8w8x4u7w7C8P7n618q938i6n8w698AaX73bybe=*048z8o9e8b*02b0de9zaA8q8d6q7b6+8E7o9o9qdPcJ8x8g8N897X6A957sas8s7T6j9t8g6y3/aA6/6/8k8y8hbe9E8i8u8h8u7E7E9Y6M8r7p4b4b5be0e09U8Pac8z9Q9u8I8N6Max7Ed17yacac8P9RdG9TaA9S8k8h7L8zbk8Dai8Ve1ev9/cu8F8rei8+7K8k7L5y967Tbx6H8J8J7L8eb98x8q8m8p6y667qaz7b8O7EbXcl8Kb87L6RbN7O=7T8F=6S6f3S3S3/c8cq8z=*028peObf9+8kcdadab8Zd/clbo9OeZd97J6FcEbyaA8o9A7N==hbeZbb9aeOcreObf866n9x00*06aP9d8U7T8k8p6O5L6V5W8G79dUcc7y6H9H8p9b8h907/a68Vax8Ybo9IembEak8Q8h6y7L65887s887s9t7RbM9A9n8i8V7T8V7Tcc9Pcc9P4b==987Yas8K9T8xau918V7Teibv4b=*03c7c7==ai7T=*057G7a=*05aA8q=*0b6H5y==6V5W9l7P8D7b=*2p7K=4Y4Y8Z8l=*0VaV9VaV9VaV9VaV9VaV9V=*03bVa7bVa7bVa7bVa7bVa7=*07a36+9n7S8z7q7QfE7Oe94J3y2n7X3p381Z00*044O4O7X7Oe9e97x7P42*036P*037O*02!*02b7!*0200*043ygC!3m6o9k!*02665o5o!9b7V7O!*045z!*0o4B3u00*04!00*096e2V!!5K5h5F575K5F5z5w5r3u3u5Q6e3Y5i5g5K5h5F575K5F5z5w5r3u3u!5n5k5O5d5r!*0aa68w8h7g7XcJaNeobXeSbY8V7X8N7Lhs8N9f9y9K878h!!7X*02b4bu8kaU9a!*0f00*0w!*0jc8!*0c8g!!gmd2!*07br!bg!*02=!*06bz!*027b!*0pb+5K!*03aVbHaVbHbAbNatb7aUbybyaE6c!*0y8h6D!*0ae9*03kuc1d7*03!*0d7o!*1o8p!*0292!*07ce!8C7O!!5Z!*024b7O!*02d6aI!*08a+!5T!*0r7O!*0m=7O!!7O7O!*2p",
			italic: "3y566h7O7XbbaG3t4L4L7O7O3W4O3Y647X*094c4c7O*027fd+938w8a9D7E7b9T9L3Y4/886Adna5ae85ao8v747Da28TdW877D7k4P604P7O7O4z82826w827u4N82823B3L773Bcn828182825n655f826+bb6N6/6b4W7c4W7O3y567O7X7O7X7O7O69d26L807O4O7X6a5j7O5g5e4A8q9a3Y4P3S6C809Yavaz7f=93*04bX==7E*02=3Y*029N==ae*037Oai=a2*02=858f=82*04bO==7u*02=3B*028d==81*037O8h=82*02=82=*0f8H9N8D=*0jag89=*083B8X7l=*0377=*036D488y5S6K3U=*058V9P82=*05dzcK=*0g5q7D5m=*0m3P829l8q828j8d8a8a6w9Nas85828b7E9o7q7b4N9T8Tb/4x4r88774q7fd1a58daeaN8Qc59E8V828v74657a6L5f7S5f7Dbi9faoa27D7d7k6b7q7q796C7G7w6G5T8b3Q6b8+56h1fResbYak7lf3dQbN=*0f7u=*059T82=*087j=h1fRes==d/9s=*0z7q7j==9W957X7X7k6b=*0d4E974Z3Lcwcv938a6w6A7D656b6/6/8wa28Z7E7u4/3L9T828v5n7D7g7v82*026w73828d7d7u9L786D8j873L82828v747t82*023B4i4U5H5H3B8Rcn*0282828p83auaoab5n*044/4/6+7b653L*024Z5f5f828K8o6+bb6/6v6b7Q7j7j6/*026Dae7C818v8f4Z7763826/6/codje19E7saJbE998D7I7I82825A5A2O3O3O3X4+7I4X3t6g3W*023y3y55557O7O8p8p6b6b4y6a4A4z4y6a4z4A4m4m3y3y5d*035Z3v514U727l5d5d4F2H4h4T555/*045d5d6b8/6y5d*03514z7l7l724c5d*038j8j5U7U6I7D633W3Wa28s!!4U6w*02=4/!*034Z7K93=7E9L3Y!ae!7Dao4i938w6w8Q7E7k9Lag3Y888Zdna57Iae9L85!7a7D7DbU87bKao==8R788d4i8u8R8g6+8b785s8d8L4i777f8q715U818F7Z6r8k638uae6Gb4aU=*04878g8k7D8u=abcK9tae818a6r7b6O8x729393dLcn8x8b8I808f6u9q7Vax8k7p6a9t7Z6w3Lae6M6M85828aaV9g7Z8a*027E7E9N6K8z743Y3Y4/dEdI9G8va28f9I938q8w6Ka47Ecx7qa2a28v9zdn9Lae9K858a7D8faV879/8IdAdW9DbW8j8AdL8H828l7v6r8e7uci6D82827g7+aA8f8189826wcn6/b16N8n7lc8ct8oaq7i6Xbh7q=7u8p=6Y653B3B3LbKc289=*0282ewaz9P87ca9N9S8dd0b6bj8PeabP7q6DbKb4ae839d7u==g2edae81ewceewaz8a6w9x00*06a2828j7x85826N5y6K5y8k75c+ci7q6D8Y7K8v7g8v7g9L8l9X8yb79te5bD9Z8n8a6w7DcE7D747D748H7eb98n8T7D8I7l8I7lb896b8963Y==8v7s9U849L8f9L8i8I7ldKaA3Y=*03bXbO==9o7u=*057q7j=*05ae83=*0b6K6r==6K5y8H7e876N=*2p82=4N4N8N8b=*0VaN8QaN8QaN8QaN8QaN8Q=*03bi9fbi9fbi9fbi9fbi9f=*079z6F8n7q8f6/7QfE7Oe94J3y2n8r3p381Z00*044O4O7X7Oe9e97X7O3W*036y*037O*02!*02aO!*0200*043yge!3s6g94!*02665j5j!8K7z7O!*045g!*0o4c3u00*04!00*09672J!!5B5b5D515E5D5I5D5w3p3p5B673S5g5e5B5b5D515E5D5I5D5w3p3p!5z595y4T59!*0a9E8a8a7b7Xcna5ehc8dWbF8C7X887DgW8g8P9b8Z7b8a!!7X*02a6ar7Xaf9a!*0f00*0w!*0jbQ!*0c7S!!f+d2!*07b5!b1!*02=!*06bz!*027b!*0pb+5K!*03aAbjaAbjbabla7aKaqb0b0a660!*0y8K6w!*0ae9*03k8c9dO*03!*0d7o!*1o8l!*028Q!*07cv!8t7O!!5g!*023Y7O!*02dlaI!*08a+!5K!*0r7O!*0m=7O!!7O7O!*2p",
			boldItalic: "3y566S7O7Xbpb13F4U4U7O7O424O4b6O7X*094k4k7O*027fe29u8N879S7E7b9Z9T4b5b8z6DdGagas8kaB8P7h7Lad9feb8D887u556F557O7O4I8g8g6s8g7H4Y8g8f3S3/7w3ScA8f8f8g8g5w6a5r8f7lbF7b7m6d5o7r5o7O3y567O7X7O7X7O7O6vd26V8r7O4O7X665m7O5i5g4J8G9m4c4L3Y6P8raiaPa+7f=9u*04c7==7E*02=4b*029/==as*037OaB=ad*02=8k8H=8g*04bY==7H*02=3S*028p=8f*047O8w=8f*02=8g=*0f9c9/8S=*0jai8o=*083S9m7R=*037w=*036K4O8O6C6N48=*059E9Z8f=*05dGcN=*0g5H7L5y=*0m428Oas8F8g8V8r8d9k799/by8N8g8f7Cac7C7b4YaF9fco4x4J8B7w4V7BdPag8fasbR9LcyaYa08g8L7R6h7m6+5K8x5r7LbV9LaFab8w7+7w6d7q7B7H6M7X7X6D698n487x9b56hkg3etc5aA7Ifoeacd=*0f7O=*05a58g=*087a=hkg3et==dW9A=*0z7q7a==a29m8g837u6d=*0d569x5w3/cHcH9u8m6F6S7V6a6d6S6P8Uav9i7F7H5b4F9U8g915R9c7P7K8g*026s6R8g8q7x7H9R6C6H8u8e4x8q8g8q7v7v8g8f8f4H4u5a6a6i3Y97cA*028f8f8D8ibfb3aX5w*0453527F7F6a3N4s3N585r5m92988k7lbF7m7f6i7v7a7c6S*026ya77L8f8t8x5a7u6k8r6S6Sc/dyej9W7TaUck9A9i8d7I8f8f5M5L2Z3U3R405i815b3m6b42*023y3y55557O7O8p8p6h6h4y664J4I4y664I4J4m4m3y3y5d*03613F584X6Y7C5d*022T4m5a555/*045d5d6h8/6P5d*03514I7l7C6Y4k5d*038j8j5U8a757L7i4242ac8J!!4i6D6s6D=5b!*034Z7K9u=7E9T4b!as!88aF4u9u8N6q927E7u9Taw4b8z9idGag7Ias9T8k!7m7L88cx8DcEaF==987a8n4u8A988u7j8l7a5I8n8W4u7w7C8G7n618f938i6n8w698AaX73bybe=*048z8u8W8b9H=aXde9zaA8q8d6q7b6V8E7o9o9qdPcJ8x8g8N897X6A957sai8s7T6j9t8g6s3/as6/6/8k8r87be9E8i8u878u7E7E9Y6M8r7h4b4b5be0e09U8Pac8z9Q9u8I8N6Max7Ed17yacac8P9RdG9Tas9S8k877L8zbk8Dai8Ve1ev9/cu8F8rei8+8g8k7L6B8n7HcY6H8f8f7L8eb98t8f8m8g6scA7mbu7b8H7EcrcS8Kb87J6RbM7O=7H8D=6S6a3S3S3/c8cq8o=*028feObf9+8kbX9Oab8Ze2clbo9OeZd97J6FcEbyas8i9A7N==h7eWbb9aeOcreObf7Y6h9x00*06aP8M8U7P8k8g6O5L6/5W8G73dUd27y6H9H8p9b8h947/a68Vax8Vbo9DembEal8Q876s7LcA887s887s9t7RbM8H9n848V7H8V7Tc29zc29z4b==987Yas8K9T8tau8Z8V7EeibB4b=*03c7bY==ac7H=*057q7a=*05as8i=*0b6H6B==6J5W9l7P8D7b=*2p8g=4Y4Y8Z8l=*0VbR9LbR9LbR9LbR9LbR9L=*03bV9LbV9LbV9LbV9LbV9L=*07a36+9n7S8z7m7QfE7Oe94J3y2n8r3p381Z00*044O4O7X7Oe9e97x7P42*023W6P*026y7O*02!*02b7!*0200*043ygC!3m6b9a!*02665o5o!9b7V7O!*045z!*0o4B3u00*04!00*096e2V!!5K5h5F575K5F5z5w5r3u3u5M6e3Y5i5g5K5h5F575K5F5z5w5r3u3u!5J5m5J5a5m!*0aa18w877g7XcAaNeobXeSbY8S7X8N7Lhs8N9f9y9K878h!!7X*02b4bu8kaU9a!*0f00*0w!*0jc2!*0c8g!!gid2!*07br!bg!*02=!*06bz!*027b!*0pb+5K!*03aVbHaVbHbAbNatb7aUbybyaE6c!*0y8d6s!*0ae9*03kuc1d7*03!*0d7o!*1o8p!*0292!*07ce!8C7O!!5Z!*024b7O!*02d6aI!*08a+!5T!*0r7O!*0m=7O!!7O7O!*2p"
		},
		{
			name: "Cambria",
			lineHeight: 1172.36328125,
			regular: "3s4u699H7WdWaL3J5+5+6H8G3d5c3d7G8G*0948488G*026CdR9L9z8Oam8/8p9zaL544P9R8pcLaFad8Uad9J7M9ha89sep8X8W8q5u7G5u8G5P4t7E8z6V8H7E4L7K8E4m4a8c4fd08K8j8I8z6u6K5i8E7Uc67z7U77634Y63b83s4u6V8g8w9x4Y7Q4tdj6x7E8G5cdj4t5T8G6n6n4t8w9c4q4t6n6I7EdxdWdx6C=9L*04dy==8/*02=54*02ap==ad*038Gad=a8*02=8+9t=7E*04bM==7E*02=4m*028i==8j*038G8j=8E*02=8z=*0faCap8H=*0jaP8E=*084m9T8w=*038j=*04619K5U8s4R=*05aOaF8D=*05excO=*0g739h5x=*0m4n8za+9n8z9l8H8O8O8hapbM9n8H8d94ad8v8p4K9z9GcF4X549R8c4Q7EemaF8Aadbm9ncOaHai8w977M6K8A4Z5n9h5i9hbO9La7a79J9Z8q768l8n786S7G8M7a6A8u3Z6o4A4diMhtfOdccz8qfsePcU=*0f7H=*059E7K=*0878=iMhtfO==eq9O=*0o6t=6t=*078v7u==aqaS97838q76=*0d6maZ6o4acOcO9L8O778p9h6K767N5/9za89t8/7E4O4Kaj8z9J6B8W7U7L8G8I8x7d7c8H8L7E7Max7h7aa2894U8w8w877U8I8x8E8w4U4m4s4+4G458WcWcOcV8K8I8X8gbZbBbi6n6n6g6p6t6e6i898c6K4c4A6d4n5i5i9a8c877Uc67U77767F78785H5B5V79ce8b878J9d4c85748z5H5BdhdldPaj8ebfd09m8/9881aBaB6q6q3l4W4S5n5X8+603I693t*023I3I41418G*034t4t2Y4t4e4e2Y4v4e4e4i3+49494f*034t*052N5x5X3n555H456g*045I5I5h6n5T5h4L3N3N4s4e6+6+562W4K*036S*02!*033333!*034s6R*0247!*044s4s9H3Qb2cJ72!bw!cabQ4s9L9z8o9k8/8qaLad549R9tcMaF8Yaday8U!8A9h9vch8XcfaD==8+6Y8v4s8t8+8H7X8d6Y6g8v8z4s8f7E8y7y6l8j9q8k6L8Y7u8tb87CbfbL=*04!8r8K9vca=b3cs8vad8j8i6J8p6M7o6M8I8zexbO9v8C9r897T6x8G729m7U8U7A8W8i6R4aad7979978C8Ocl8F8k8O*028/8/bz8m8W7M54544OeDeAbNaaaQ9oar9L9n9z8maf8/er8vaQaQaaaCcMaLaday8U8O9h9ocb8Xaw9Oevevbsdi9l8Zep9T7E8t8b6/8K7Eba7a9e9e8s8Lax9d8j8T8I6V7/7UaJ7z8W8jcxcx9FbI827mb/8j=7E8q=7m6K4m4m4abXcu8E=*028TdSaZbi9Kd3b59y8eencndna1hFea8o6Wcfbfad8gal8H==hrfFaM8Th6bHdSaZ8o6M6e00*06aQ9e9l878U8I7S6x8m769r85eNbo8v7aax8xaD8Uaa8fcfa7aM9gdKbpeScpaX8u8O6V9h7/8W7U8W7U9y7MdkbB9O8l9O8m9N8Ebh95bh9554==ar8KaE8LaC98aM9d9O8jcNax4f=*03dybM==ad7M=7H=*038l78=*05ad8g=*0b8m6/==8m768Q7s8X7z=*0u4K=*0tcM=cM=cM=*0l6t=6t=6t=6t=*0r9r=9r=*06eq=eq=*0776=76=76=*037E=!!ar!=*0Vbm9nbm9nbm9nbm9nbm9n=*03bO9LbO9LbO9LbO9LbO9L=*07!*057QfE7QfE5e3W2C8F3d2C0T00*045c5c8w7QfEbK8h5P3t3t3d3t5T5T5E5T85856X!*02bM!*0200*0439jL!426K9v!*034L4L!836H5G!*048G!*0o473u00*04!00*096n3r!!6n*084A4A6v6n*0c4A4A!5K5K6c5H5K!*0aal8G*03d08GjCfXdL8G8G9Q8G8Gie8G*029A8G8G!*02858Z!!8S!*0h00*0w!*0jfM!*0c86!!gfdjcaaPbY!*06aD!*02=!*06dn!*028p!*056d!*0if776!*03ew*0b!*0z8O7d!*0ad67kd67kep7kac*03=d6dRdReE7DeE7DdxdxdE7kdE7k7EcTcTdXdXiDeS938S*039X8RcFcFape8ceced6d66N6Md6d66N6Nd6cgd6d6cud6cud6d6dIgTdIdy9ady9agb9abr*03dVdVfkfk7D7DdO7kdO7kdududs9hds9h9h9x*039IdSc4c49xeNcgdtd6d6eSdTdTfDdXdXgM9Q8a8x9b9s9Q9k!9La08G9L9L8GcdcIcIb48GbHbH1O8G7z6X3Tah9Y9Ya/djaPaiaiaB4B5S7g8w9e9eaFaF6FerjJ9peSk69V9Uaa8Z8Z4M9hbjeDc8bvb8bwcDaL5J=bH*058GbwbHbwbH*07eDeDbH*06d7bHbH=bH*028G8GbH*03dXdX7v=bH*0bbt*03bwbw=btbH*099v*02bH*03bbbbfz*08fh*03ayam!!8787bgbNdWe9bgbgcK=8G8Gbj*03g2g2e9bj6k9e*02aPaYapapc3c3724q878Zc+bObObbbbbj9e9ebcbcbUbUaKa8bJbJjojobLbLbJbJbt*03=bH*04bwbwbzbzbIbP4Sdp9G9Gbt9M8H9M9M8H9M9Mbt9M8H9V8Hbq",
			bold: "3s5f6C9G8vfgbA3X6o6o759g3E5h3E7V9g*094o4o9g*0274epacab8Zb1928Da6bi5u5laG8DdeaDaT9CaTam819/aA9Wf19H9s8S5M7V5M9g5P4t8n9f7l9l8j56889l4W4K9g4QdW9s8V9l9f7d7b5J9l8jcu8d8j7v6950699g3s5f7l8I9ba1508l4tdj6A8a9g5hdj4t5W9g6R6R4t9t9c4k4t6R6Q8aeJfgeJ74=ac*04dM==92*02=5u*02b5==aT*039gaT=aA*02=9FaB=8n*04cq==8j*02=4W*028Y==8V*039g8V=9l*02=9f=*0fblb59l=*0jbn9l=*084WaO9F=*039m=*046Qav6X8I5m=*05bDaD9n=*05eUdp=*0g7O9/5U=*0m519fbOa49fa99n8+8Z99b5cDa49l8S97aT8r8D56a69+dF5D5taG9g5n8gfPaD9oaTcnaCeJd3bc9e9W8g7k9f5P5O9/5Q9/cKa/a/aVaGar8S7v8F8F7J7D8j8N876+9e4g7j5j4GjCiwgQdJdl9yfYfmea==5t=*0c8q=*03dN=aj88=*087y=jCiwgQ==ftaI=9r=*0d5t=5t=*0g8r7P==aRb+9L8O8S7v=*0d7tc87p4Kdwdwac8Z7u8I9/7b7u816MagaAac928i5l5ba+9faq7s9s8j8o9l9l9e7p7C9l9r8l8qc57C7vbn8O5b9d9f8w8j9b9f9j9f5n574Z6u5V4Ia4dQdKdS9r9q8Z8Vcicwb+777774777d6u6w8/8/7b4T5b6s545J5J9O8+918jcu8j857v8E7y7y6v6n6H7xc18J8V9o9H4U9a7i9k6v6neqeFfybn9zbQeiaA9U9e8Eb3b36W6W3I5s5p5X6z9e6j3X6C3H*023W3W4A4z9g9g9b9b4t4t3a4s4k4k3a4D4k4k4E4k4o4o4E*034t*053I9g6j3M5q684E6v*046c6c5w6R6e5w4+4v4v4s4f797b5o394Z*036S6J7f!*036g6g!*034s7g7f7g=!*044u4uac3Ebbds7G!c6!d8cC58acab8Da2928Sbib15taGacdeaD9faTaZ9C!9f9/akcy9Hd6bE==9H7J9n58949H9p8R8X7J789n94589s8g9w8H6Z8V9Q997u9A8J94bO8pcycv=*04!949sakd8=b+dy9saT8V8K7c8D7M877n8W8Dg3ct9X9map908O7f9F7Ma08ra08w9r8Z7f4KaT7w7w9u998ZcN9W998+8Z8+9292cF8y8T815t5t5lfjfyd0aybr9Gbiaca4ab8yaE92eJ8rbrbrayb8debiaTb39C8Z9/9Gco9HbgaGfUg5cjeNa28Xfeay8n8T8J7o9m8jch7v9S9S9f9xa/9H8V9p9l7l898jbJ8d9C9ldIdUa1cA8s7Jcn8Z=8j8X=7J7b4W4W4Kc+d89l=*029pfgcDcfa2dsbxam8WfodwdObIj1gf8h7hd6cyaT8Vb39d==iDgObl9dgHcvfgcD8A7d6y00*06bu9Sa28w9H9p8h778y7tae8KfpcJ8r7vbb9Eb99UaC9bcPaRbv9Oe7c0fQdabZ9y8Z7l9/899s8j9s8jas8ueycGaN9qaL9rax9lcN9VcN9V5t==b39tbb9xbd9xbk9HaG9ldha/4N=*03dNcq==aT8q=*058F7y=*05aT8V=*0b8y7o==8y7t9w8i9H8d=*0H5t=5t=*0l9r=9r=9r=9r=*0Vf2=f2=*0g8n=!!bb!=*0D5t=5t=*0ecnaCcnaCcnaCcnaCcnaC=*03cKa/cKa/cKa/cKa/cKa/=*07!*057QfE7QfE5e3W2C8F3e2C0T00*045h5h9g7QfEbK8l5P3H3H3E3H6e6e6b6e85856X!*02c4!*0200*0439lA!4h7iai!*035151!5f7d5V!*041V!*0o4w3u00*04!00*096R3R!!6R*084Q4Q6/6R*0c4Q4Q!6f6c6D686g!*0aaz9g*03dW9glrh9el9g9la0a29gkd9g*05!*028E9/!!a3!*0h00*0w!*0jfQ!*0c8R!!godj!*09aI!*02bh!*06dg!*028N!*0pfh7+!*03fz*0b!*0z8+7p!*0ad67Hd67Hep7I!*0h7I!*1o9f!*02a2!*07d4!br9g!!9g!*024Cb+!*02dBaP!*08aJ!6F!*0r9g!*0m=bH!!9g9g!*2p",
			italic: "3s4o659H7Edqaj3G5Q5Q6v8g374/377i8g*0943438g*026ndR9c9k8sa68U8f99at504H9r8bcoav9K8H9K9e7x8+9U8/e08x8A805j7i5j8g5P4f8e896N8c794A8a8i4f4a7N4bcv8n7X8f896n5+5p8n7cbo717c725T4X5T8g3s4o6R7Q8G9n4X7r4fdj6c7l8g5cdj4f5T8g6b6b4f8D8V3N4f6b6m7ldqdOdq6n=9c*04d2==8U*02=50*02a9==9K*038g9K=9U*02=8M8S=8e*04b5==79*02=4f*027Z==7X*038g7X=8n*02=89=*0f9Za98c=*0jax8i=*084f9I8p=*037S=*045V9u5G8e4D=*05apav8k=*05e0c4=*0g6L8+5D=*0m4i89aG9f899c8g8u8s82a9bs9f8c7Q8Z9G818f4A999jc14Q509r7N4k7le0av8i9Kb295csara18f8R7A5+8e4/5p8+5p8+bI9E9Ha39i8U80727T7W786V7g8y705Q853Z6o4A49i0h9fecScl8lfaeFcx=*0f79=*03d3=9e8a=*0876=i0h9fe==dX9G=*0z817n==acap977T8072=*0d6iaC6t4ac3c99c8s6N8e8+5+727p5Q9k9U9c8U7i4H4I9X899e6u8A7m7R8e8e896Z6N8c8c79799W6O6C9f7S4k8a8a7P778D8f8i8f4F4q4t4N4B458RbUbLcr8n8p8v7Xblbqao6n6n6f6n6n625X7O7S5+4e4e5X4q5p5p8x7T7N7cbf7370727v76765J5B637ocd7N7Y828J4e7J6P895J5BcHcUd99I89aJcy8A8F8v81araz6c6c3j4S4N595D8m5q3G653l*023I3I4a458g8g8G8G4f4f2Y4e*022Y4v4e4e4d3V3I3Ianan4f*064e2N5x5w3k4K5j416g*045I5I5h6a5B5h4L3N3N4j4b6X7d4T2W4K*036S6J6S!*033333!*034s6w*0242!*044u4u9c37aPck6X!b8!blbn4v9c9k8c8Y8U80at9K509r9ccoav8v9Kaj8H!8e8+8Lbj8xbxa7==8K6N8m4v8c8K8f7u7Q6N6x8m8v4v7J7l8u7t6I7X978e6A8G7u8caC7kaBbn=*04!7/8E8Lbl=aocg7J9K7X886s8f6J7j6R8j8aesbq9b8x9b7C7L6h956Q937l8R7A8M8a6w4a9K6N6N8I8q8sc68w8e8u8s8u8U8Ub78b8B7x50504Hejedba9YaB8Ka99c9f9k8i9/8Ue681aBaB9Yaxcoat9Kak8H8s8+8Kbx8xah9befefb9de9c8Be09x8e7L7L6H8779dI6C8n8n7M8AaY8t7X8n8f6Ncv7cbo718x7SbUc28Abe7L6Vbo86=797Y=6N5+4f4f4abZbZ8i=*028ndlaKaPbRd9ac9m7Te2bHd29xhjd57R60bxaB9K7Xag8H==gCeDag8ofdbpdlaK846D6e00*06aB8x9c7P8H8f7y6p8i6N9j7CeldI816C9Z7Maz8A9Y7MbU9eat8tdsaLeBbRaG8u8s6N8+cv8A7c8A7c8x71d48x9b7S9t7X9h8ib68rb68r50==af80ax8Aaj8kat8t9b7LcoaY4a=*03d3b5==9G79=*057T76=*059K7X=*0b8i6H==8f6N8q6T8x71=*0S4a=4a=4a=4a=*17e1=e1=*0g8e=!!ad!=*0E4m=*0fb295b295b295b295b295=*03bI9EbI9EbI9EbI9EbI9E=*07!*057QfD7QfE5d3W2D8G3d2D0U00*044/4/8w7QfEbK8g5O3l3l373l5L5L5v5S7K7K6X!*02bf!*0200*0438j6!3P6A9l!*034y4y!826t5G!*041I!*0o473u00*04!00*096a3m!!6a*084t4t6f6a*0c4t4t!695p5Y5j5p!*0aaa8g*03cv8gj5ePdw8g8c9s8g8gie8g*029l8g8g!*027W8P!!8x!*0h00*0w!*0jfz!*0c7B!!fGdj!*09a6!*02=!*06dg!*028f!*0peK6T!*03djdhedebeleldWe2egejeoee!*0z8u6Z!*0ad67kd67kep7k!*0h7E!*1o8x!*028Y!*07eE!cT8g!!8g!*024qb+!*02djaP!*08aF!6F!*0r8g!*0m=bH!!8g8g!*2p",
			boldItalic: "3s586g9q86fcb83Q6c6c6T8Z3x553x7w8Z*094f4f8Z*026Sep9C9N8EaD8O8o9HaP5l5daf8jcOamaz9kaz9U7R9rae9key9a918w5z7w5z8Z5w4e8W8T748W7P508R944K4F8q4Fdy998s8X8Q786W5I987Qc57z7Q7o5P4R5P8Z3s587e8m9b9z4R7W4edj6v808Z5hdj4e5W8Z6G6G4e9i8V4d4e6G6E80eGfceG6S=9C*04dc==8O*02=5l*02aH==az*038Zaz=ae*02=9pa6=8W*04bL==7P*02=4K*028x==8s*038Z8s=98*02=8T=*0fa+aH8W=*0jaU94=*084Kay9n=*038w=*046Ja66B8m5d=*05bsam93=*05elcD=*0g7t9r5V=*0m4Q8Tbj9E8T9F8/8z8E8LaHc89C8W8k8Sas8a8o509H9ddb5k5laf8q5c8gfdam93aBc3ageycyaS8Q9H8b79935S5M9r5P9rcob5aVaEax9C8w7o8I8B7V7m7/8T866E8L477d5v4uiXh/gidwcY9ifze/dO9c=*0e7O=*059T8R=*087m=iXh/gi==eDau=*079c=*037O=7O=*0j8g7i==arbI9z8E8w7o=*027O=*097mbW7m4Fc/c/9C8E748o9r6W7o7S6Q9Sae9C8O7T5d56aJ8Q9Y7n917Q8e8W8Y8Q7k7o8W8W7O7Obv7x7Wbb8/568R8R867I9592928X5b554S6k5Y4B9Vded8dr9a9a8E8sbVb+bp74757078786o6o8V8E6W4I4R6o4W5I5J9C8i8H7Qc17M7M7o8j7m7m6j6o6I7Fc48P8K969q4L8q6V8Q6j6odUeaePb99rbGdOa79D8R8uaRa+6K6K3F5o4N5u6h8R5T3Q6g3A*023E3E4I4x8Z8Z8N8L4e4e324e4j45304t49444r4745454s*034e*053I5W5V3F5e5H4I6v*045I5I5h6m6f5h4L3N3N464b6X7d59344Z*036S6J7a!*036g6g!*034s71*02=!*044u4u9C3xbidm7T!ce!dhdf589C9N8D9N8O8waPaJ5laf9CcOam94azaG9k!939rakcP9acxbJ==9/7y94588W9/908G8G7y6Q949h589n8g9k8p6l8sag8/7t9A8J8Wbr8kbBb+=*04!8X99akdh=bndE9naz8s8I7d8o7B857V908HeLb/9s999V8s8H7J9y7K9L889X7Z9N8L714FaB7f7f9w948EcA9w8/8z8E8z8O8ObX8h8T7R5l5l5deZf7ckalb19baT9C9E9N8hac8Oem8gb1b1alaPcOaPazaH9k8E9r9bcL9aaPabfifqbzdY9F8Oey9/8W8D8D7o8H7OgT7/9898919kcH9b8s998X74dy7QcE7z988Wdede9fco877lbZ91=7O8X=746W4K4K4FcBcx94=*0298eqckbEcsd4aK9J8+eDcLdtaYife/827McxbBaB8sb38N==i9fPa+8Lg5b/eqck8g706y00*06b1989F8c9p8X87778h7v9Z8seZgT8g7/aN91b19Cas8TcfaPb39bdEbFflcQbf8/8E749rdy917Q917Q9Y7ze798am8Wag90ac94cI9BcI9B5l==aM95aP9kaN95aP9bab8QcOcH4F=*03dcbL==as7O=*058I7m=*05aB8s=*0b8h7o==8i7v907p9a7H=*0k7O=7O=7O=7O=7O=*1X8W=!!b7!=*0o7O=7O=*027O=7O=7O=7O=7O=*0hc3agc3agc3agc3agc3ag=*03cob5cob5cob5cob5cob5=*07!*057QfE7QfE5d3W2D8G3d2D0U00*0455558Z7QfEbK895w3A3A3x3A6f6f6e6f7O7O6X!*02bC!*0200*0438lt!4h7iam!*034R4R!9z6+5X!*041V!*0o4w3u00*04!00*096G3I!!6G*084M4M6O6G*0c4M4M!6E5S6j5H5S!*0aai8Z*03dy8Zlbgkd/8Z8W9z8Z8Zkd8Z*05!*028u9U!!9M!*0h00*0w!*0jfQ!*0c7Y!!gedj!*09ar!*02aZ!*06dg!*028C!*0pfh7B!*03fd*07fc*03!*0z8z7k!*0ad67kd67kep7k!!fn!*0e7E!*1o8Q!*029R!*07dA!c98Z!!8Z!*024Cbd!*02dBaP!*08aJ!6F!*0r8Z!*0m=bH!!8Z8Z!*2p"
		},
		{
			name: "Arial",
			lineHeight: 1149.90234375,
			regular: "4m4m5z8I8IdVar2/5d5d65984m5d4m4m8I*094m4m98*028IfTararbibiar9zcabi4m7Qar8Id1bicaarcabiar9zbiareMarar9z4m*027l8I5d8I8I7Q8I8I4m8I8I3u3u7Q3ud18I*035d7Q4m8I7Qbi7Q*025e445e984m5d8I*03448I5dbx5O8I985dbx8E6g8B5d*02908p5d*025J8Id2*029z=ar*04fE==ar*02=4m*02bibi=ca*0398ca=bi*02=ar9z=8I*04dV==8I*024m*038I*068B9z=8I*02=8I=*0f9Dbi8I=*0jbi8I=4m*05==4mbv6Y=*037Q=*044A8I5e8I3u=*059sbj8I=*05fEeM=*0g5T9z4m=*0m3u8IbSag8Iag8Ibibi7QbicGag8I8JarbM9s9z8Ica9MdN3u4mar7Q3u7QdXbi8IcadpagdAarbO8Iarar7Q9G5Y4m9z4m9zdmatbIbic47Q9z7Q9z9z8x8x8I8I7a7D8I446t984mkRj6gpgCd173j6eMc3=*0f8I=*05ca8I=*088x=kRj6gp==ga9G=*0g4m*02=*0f8x6R==b2aG9s8R9z7Q=*0d5taJ5L3udTdTarbi7Q8I9z7Q7Q9575arbiasar8I7Q3ubx8Ibi5dar7Q8I*037Q7Q8I*03bz7a7a9T7X4m8I8I8L7R9F8I*023u3u5A574M3u8Yd1*028I8I8F8Icncd8C5d*068u8u7Q3u443u5t4m4m8I8U8z7Qbi7Q887Q8t8x8x7Q*03ca8j7X8L8E6d7Q6k8I7Q7Qf4eafJb86JbfbYal9U7B8faLaL5/5/2v3M*025I7x512/5z3u*025d5d5t5t98*035d*094m4m5d*0d522t5k585t5/*045d*0d4m5d*036d6d5d917r9z7a5d5dbf98!!5d7Q*02=!*045d5dar4mcgd660!c6!dnbM3uarar8Dasar9zbica4marasd1biaacabiar!9G9zarcuard3bI==926+8I3u8z928/7Q8J6+6V8I8I3u7Q7Q907Q708IaO8V7y9F6b8za88db9cd=*04ar8/8zc4e+=8Mcd9pca8Ibi7Q9z6k9N8hbQ91dXd1ay8Iay7Qarar9x9kbx8G7g6q9p8Z7Q3uca6W6War8Ibid1aM8Vbi*02arardx8ubfar4m4m7QgxfOdm97bf9Xbfaragar8uaBarer9sbfbf97agd1bicabfarbi9z9XbUarbAareleGcodRagbffObi8I8Z8j5J978Iat7a8L8L6S97aM8E8I8u8I7Q7a7QcT7Q8Z89cycT9Nbf897+bK8u=8I8I=7+7Q3u4m3ueacJ8I=*028EkW9Mca9BeSb9as7Qe1aTcZaJgtdz9s7acsaMca8Icz9T==gOe0d19AiDdkkW9Mbi7Q7T00*06bf8Lag89ar8I7F6r8u5Jau8Berat9s7a976S976S976SbC8obi8EdLa8hNdCbN89bi7Q9z7a8I7Q8I7Qar7QetaPar89ar89ar8Idtaqdtaq4m==ar8Dag97bi8Ebi8Ear89d1aM3u=*03fEdV==bM8I=*059s8x=*05ca8I=*0b8u5J==8u5Jar7Qar7Q=*0K4m=*0ed1*04=*1l8I=4m4ma/8J=*0Vdpagdpagdpagdpagdpag=*03dmatdmatdmatdmatdmat=*07b/6e9f8Jas907QfE8IfE5d3W2D8I4m381j00*04!5d8I8IfEfE6t8E3u*035d*038I8I5u!*02fE!*0200*0438fE!2Y5y5y!*035d5d!7Q8I5d!*042D!*0o4m3u00*04!00*095d!*025d*05!*045J!*0f5Q5Q5V585Q!*0a8Ibibi8I8Id1bih6iceMcM818Iar9zfE89arcaar8Ibi8Iar9z8I8I!*0k00*0w!*0jdR!*0c53!!gNbx!*09fE!*02c0!*069o!*0teL7G!*03d2d2!*05d2*03!*0A7Q!*0afE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b998!!2D!*024m8B!*02b9fj!*08bf!4i!*0r8B!*0m8B97!!8B8B!*2p",
			bold: "4m5d7q8I8IdVbi3K5d5d65984m5d4m4m8I*095d5d98*029zffbi*03ar9zcabi4m8Ibi9zd1bicaarcabiar9zbiareMarar9z5d4m5d988I5d8I9z8I9z8I5d9z9z4m4m8I4mdV9z*03658I5d9z8Ica8I8I7Q654o65984m5d8I*034o8I5dbx5O8I985dbx8E6g8B5d*02908I5d*025J8Id2*029z=bi*04fE==ar*02=4m*02bibi=ca*0398ca=bi*02=ar9z=8I*04dV=8I*03=4m*029z*068B9z*04=9z=*0fbfbi9z=*0jbi9z=4m*08ch8I8I=*028I=*04619z7v9z4m=*05b4bj9z=*05fEeM=*0g7v9z5d=*0m4m9zd4bf9zbf9zbibi8Ibid5bf9z9uarbm9O9z8Ica9Zez4m4mbi8I4m8Ifwbi9zcadlb7dTbEce9zarar8I9o5E5d9z5d9zc+bkcybic28I9z7Q9z9z8e8e8I8I7N939z4o7O985dkRj6hnifdV8Ij+fEdV=*024m=*0b8I=*05ca9z=*079z8e=kRj6hn==g9ap=*0g4m*02=*0f9188==a/d59T9T9z7Q=*0d7Pd17W4meWeWbibi8I9z9z8I7Qa57Abibiarar8I8I4mc79zbi65ar8I8I9z*028I8I9z9z8I8Ice7N7NaP8T5d9z9z9a8I9p9z*024m4m6l5c5A4m9sdV*029z9z9D9zd1ddbK65*0697978I5d*028s5d5d9z9J968Ica8I8X7QaE8e8e8I*03ca9D8T9a9s7a8I749z8I8Ig7eKiWcJ8mcUdBc8aQ8m8Pbpbp5M5M323Y*025T8b5E3K7q4m*025d5d5T5T98*035d*0p5K2d5U5K5T5/*045d*037Q5d*0d6d6d5d8t7e9z995d5dbf9W!!5d8I*02=!*045d7hbi=dlea7q!cV!evd64mbibi9pbfar9zbica4mbiard1bia4cabiar!9o9zarcRarcFcy==9D7q9z4m969D9y8I9u7r7c9z8t4m8K8I9A8I6Z9zb+9H88aI6+96bb90bNdd=*04bi9y96c2fF=bKddaAca9zbi8I9z74bL8hcA9yfwdVa/9za/9tarara39sbv927X6TaA9G8I4mca7v7var9zbid1bA9Hbi*02arardR9pb7ar4m4m8Ih6gDdH9ybf9Kbfbibfbi8Tb8are89Obfbf9ya+d1bicabfarbi9z9Kdmarbqa/fJfXdCfjbfb7g7bf8I9G9D6x9X8Ib57N9D9D7Q9XbA9s9z9s9z8I7G8IdH8I9D95d1dcbpdm9D8Edm97=8I9z=8E8I4m*02f9ea9z=*029sk0cadBa/fgcsar8IeucwcFbNgRfk9O7NcFbNca9zcLa6==hwfecK9+k0e5k0cabi8I9800*06bf9Dbf9Dar9z7D6/8T6xa/9me8b59O7N9y7Q9y7Q9y7QbV9Lbi9sdLbahCepbi92bi8I9z7G8I*03ar8IdlaNa/95a/95a/9zdoaCdoaC4m==a+9ma+9Xbi9sbi9sa/95d1bA4m=*03fEdV==bm8I=*059O8e=*05ca9z=*0b8T6x==8T6xar8Iar8I=*0I4m*02=*1F8I=5d5dbb9u=*0E4m*02=*0ddlb7dlb7dlb7dlb7dlb7=*03c+bkc+bkc+bkc+bkc+bk=*07d8819X9ub1ac7QfE8IfE5d3W2D8I4m381j00*04!5d8I8IfEfE7O8E4m*037Q*038I8I5u!*02fE!*0200*0438fE!3M7v7v!*035d5d!9s9z5d!*042D!*0o5d3u00*04!00*095d!*025d*05!*046c!*0f5V5U6q5K5U!*0a8Ibibi8I8IdVbih6j9eMcO818Ibi9zg+8Iarcabiarbi8Kar9z8I9j!*0k00*0w!*0jdR!*0c7F!!hrbx!*09fE!*02c0!*069o!*0tfE7Q!*03d2d2!*05d2*03!*0A8I!*0afE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b998!!2D!*024m8B!*02b9fj!*08bi!4i!*0r8B!*0m8B97!!8B8B!*2p",
			italic: "4m4m5z8I8IdVar2/5d5d65984m5d4m4m8I*094m4m98*028IfTararbibiar9zcabi4m7Qar8Id1bicaarcabiar9zbiareMarar9z4m*027l8I5d8I8I7Q8I8I4m8I8I3u3u7Q3ud18I*035d7Q4m8I7Qbi7Q*025e445e984m5d8I*03448I5dbx5O8I985dbx8E6g8B5d*02908p5d*025J8Id2*029z=ar*04fE==ar*02=4m*02bibi=ca*0398ca=bi*02=ar9z=8I*04dV==8I*024m*038I*068B9z=8I*02=8I=*0f9Nbi8I=*0jbi8I=*084mbt6Y=*037Q=*044p8I6g8I3u=*059Dbj8I=*05fEeM=*0g5y9z4m=*0m3u8Ibqab8Iab8Ibibi7Qbicgab8I8Iarca9C9z8Ica7NdL3u4mar7Q3u7Idebi8IcacI9sdAarbq8Iarar7Q9o5d4m9z4m9zcp9WbVbibd7Q9z7Q9z9z7Q7Q8I7+6S7Q8I446t984mkRj6gwgwca6Yj6eMca=*0f8I=*05ca8I=*087Q=kRj6gw==ga9G=*0g4m*02=*0f8x6R==at9Q9s9s9z7Q=*0d4C9R5s3udPdNarbi7Q8I9z7Q7Q9575arbiarar8I7Q3ubP8Ibi5dar7Q8I*037Q7Q8I*03b06T7h9E7Z4m8I8I8C7R9F8I*023u3u5A3u*028Pd1*028I8I978Ib+cb8I5d*068m8m7Q4z4N4y5s4m4m8I8P8C7Qbi7Q837Q8z7Q*05ca807Z8C8C4B7Q708I7Q7Qeve9fcav7db4bLa29h7B8farar4Q4Q1W3r*02577+5s2/5z3u*025d5d5A5A98*035d*094m4m5d*0d5J1j555g5A5/*045d*0d4m5d*036d6d5d9q7k9z7a5d5dbb9q!!5d7Q*02=!*045d5dar4mclde65!cq!dxc73uarar8Wavar9zbica4marard1bia8cablar!9o9zard5arc/bV==8W6T8H3u8C8W8X7Q8I6T7f8H8u3u7Q7I8A7Q6/8Iau8Z7C9r5S8Cac8ybocb=*04ar7V8CbcdO=8Icb8Pca8Ibi7Q9z5W9N8hbQ91ded1ax8Iax80arar9x9kbG8G6v5C8P937Q3uca6V6Var8Ibid1aK8Zbi*02arardb8wb4ar4m4m7QgGfmdc9dbb9/bkarabar8wb0arel9Cbbbb9daKd1bicablarbi9z9/crarbnaxeoercBdSabaSf+aG8I8P8a7J8F8IaM7h8I8I7o8QaK8C8I8C8I7Qd17Qd37Q8Y86c+dj9Jbw8e7IbM8m=8I8I5W7M7Q3u*02eecY8I=*028Ikm9jbUcbe7aSas7QdKaFcZaJg0do9C7hc/boca8IbU9e==hkemcY9ok2dIkm9jbi7Q8I00*06bb8Iab8ear8I7I5j8w5Wa58delaM9C7h9d7o9d7o9d7obD8Tbi8CdXaZg/d7bi7Qbi7Q9zd18I7Q8I7Qar7Qe18Yax86ax86ax8Idi9Xdi9X4m==9P88aK8Qbi8Cbi8Cax86d1aK3u=*03fEdV==ca8I=*059C7Q=*05ca8I=*0b8w7Q==8w5War7Qar7Q=*0K4m=*0ed1*04=*1l8I=4m4max8J=*0VcI9scI9scI9scI9scI9s=*03cp9Wcp9Wcp9Wcp9Wcp9W=*07b+6e9A8OaU8N7QfE8IfE5d3W2D8I4m381j00*04!5d8I8IfEfE6t8E3u*035d*038I8I5u!*02fE!*0200*0438fE!2Y5y5y!*035d5d!7Q8I5d!*042D!*0o4m3u00*04!00*095d!*025d*05!*045J!*0f5C636b5Z63!*0a8Ibibi8I8Id1bih6hGeMcM818Iar9zfE89arcaararbi8Iar9z8I8I!*0k00*0w!*0jdR!*0c53!!gXbx!*09fE!*02c0!*069o!*0teL7G!*03d2d2!*05d2*03!*0A7Q!*0afE7QfE7QfE7Q!!eV!*0e7Q!*1o7K!*029A!*07cT!b998!!2D!*024m8B!*02b9fj!*08bf!4i!*0r8B!*0m8B98!!8B8B!*2p",
			boldItalic: "4m5d7q8I8IdVbi3K5d5d65984m5d4m4m8I*095d5d98*029zffbi*03ar9zcabi4m8Ibi9zd1bicaarcabiar9zbiareMarar9z5d4m5d988I5d8I9z8I9z8I5d9z9z4m4m8I4mdV9z*03658I5d9z8Ica8I8I7Q654o65984m5d8I*034o8I5dbx5O8I985dbx8E6g8B5d*02908I5d*025J8Id2*029z=bi*04fE==ar*02=4m*02bibi=ca*0398ca=bi*02=ar9z=8I*04dV=8I*03=4m*029z*068B9z*04=9z=*0fbAbi9z=*0jbi9z=4m*08ce8I8I=*028I=*046c9z7v9z4m=*05b4bj9z=*05fEeM=*0g7v9z5d=*0m4m9zcsb49zb49zbibi8Ibicoar9z9yarbIa39z8Ica9JeC4m4mbi8I4m8Iefbi9zcad5ave8btbA9zarar8I9e5E5d9z5d9zcFbacdbibc8I9z7Q9z9z8e8e8I8I7N8I9F4o7O985dkRj6hnifdV8Ij+fEdV=*024m=*0b8I=*05ca9z=*079z8e=kRj6hn==gbaM=*0g4m*02=*0f9188==b4cn9T9T9z7Q=*0d74ch7Z4meWeUbibi8I9z9z8I7Qa57Abibiarar8I8I4mcd9zbi65ar8I8I9z*028I8I9z9z8I8IbA7v7+au8Y5d9z9z9k8I9p9z*024m4m6l4m4W4m9jdV*029z9za89zdkd2bR65*069d9d8I4/4/5d8m5d5d9z9J9f8Ica8I8G7QaU8e8e7R*028Ica9I8Y9k9s6n8I729z7R7RfEeFiJcL8+d7dtc8al8m8Pb2b26i6i314n*026g8H6l3K7q4m*025d5d5W5W98*035d*0k5a*046i2M5N6b5W5/*045d*037Q5d*0d6d6d5d8F7M9z9u5d5dbf9z!!5d8I*02=!*045d5dbi=dmea7p!dc!eydf4mbibi9yavar9zbica4mbiard1biahcabear!9e9zarcSarcZcd==9I7v9z4m9f9I9J8I9y7v7I9z8K4m8S8I9r8I729zb89t8kao6p9fb092c5d2=*04bi8Q9fbJfx=bRd2aAca9zbi8I9z7lbL8hcA9yefdVau9zb49tarara39sbv927X6TaA9G8I4mca7v7var9zbid1bA9tbi*02arardS9Cbfar4m4m8Ih6gidm9DbfaBbfbib4bi9Cbiareva3bfbf9DaLd1bicabfarbi9zaBcdarbpb4fjftdmfEb4bfgibp8I9H9s8m9G8Ibw7+9z9z7X9KbA9s9z*028IdV8IdR8Ia697dVeDb3dm9i8Edx9d=8I9z7l8P8I4m*02f9ea9z=*029zkfcacSdffacvar8IeucwcFbNgXfia37+cZc5ca9zcg9C==hMflcZa8kfebkfcabi7R9800*06bf9zb49iar9z8/7j9C7lar92evbwa37+9D7X9D7X9D7XbZ9Abi9sdFaThtegbl8Rbi8I9zdV8I*03ar8IdEa6b497b497b49zdra8dra84m==aj97aL9Kbi9sbi9sb497d1bA4m=*03fEdV==bI8I=*059z8e=*05ca9z=*0b9C8I==9C7lar8Iar8I=*0I4m*02=*1F8I=5d4Nbb9N=*0E4m*02=*0dd5avd5avd5avd5avd5av=*03cFbacFbacFbacFbacFba=*07d8859X9zbSaj7QfE8IfE5d3W2D8I4m381j00*04!5d8I8IfEfE7O8E4m*037Q*038I8I5u!*02fE!*0200*0438fE!3M7v7v!*035d5d!9s9z5d!*042D!*0o5d3u00*04!00*095d!*025d*05!*046c!*0f606e6H6b6e!*0a8Ibibi8I8IdVbihgi/eMcO818Ibi9zg+8Iarcabiarbi8Iar9z8I9j!*0k00*0w!*0jdR!*0c84!!hWbx!*09fE!*02c0!*069o!*0tfE7Q!*03d2d2!*05d2*03!*0A8I!*0afE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b998!!2D!*024m8B!*02b9fj!*08bi!4i!*0r8B!*0m8B97!!8B8B!*2p"
		},
		{
			name: "Times New Roman",
			lineHeight: 1149.90234375,
			regular: "3W5d6o7Q7Qd1ca2Q5d5d7Q8Q3W5d3W4m7Q*094m4m8Q*026Yepbiararbi9z8Ibibi5d65bi9zdVbibi8Ibiar8I9zbibieMbibi9z5d4m5d7l7Q5d6Y7Q6Y7Q6Y5d7Q7Q4m4m7Q4mca7Q*035d654m7Q7Qbi7Q7Q6Y7w387w8t3W5d7Q*03387Q5dbU4k7Q8Q5dbU7Q6g8B4I4I5d90755d5d4I4S7QbK*026Y=bi*04dV==9z*02=5d*02bi*068Qbi*058I7Q=6Y*04ar=6Y*03=4m*027Q*068B7Q*07=*0ea6bi7Q=*0jbi7Q=*084mb48E=*037Q=*046m9z5o9z4m=*059sa+7L=*05dVbi=*0g6H9z4m=*0dbi=*074m7QbU8+7Q8+7Qarar6YbicL8+7Q7n9zbi7R8I7Qbibic23Z5dbi7Q4m7BcMbi7Qbibi8hetaPaa7Q8I8I65965o4m9z4m9zc88ubDbicd7Q9z6Y8r8r6Y6Y7Q7Q6X6C7Q384p3V5dkRieeMfEdV8IhnfEca=*0f6Y=*05bi7Q=*086Y=kRieeM==eS8M=*0z8P6b==aa7Q9s7Q9z6Y=*0d4m7Q4Z4mc6c4biar7Q9z9z656Y8m6darbibl9z6Y654ma+7Qar5dbi7Q6Y8b8b7Q6Y6Y7Q7Q6Y6Y9P6A6A9c6X5d7Q7Q757Q6Y7Q*024m4d4m*0392ca*027Q7Q7N7Q9Sai8F5d*067E7E655d5d6Q5d4m4m7Q8B7m7Qbi7Q7J6Y7M6Y*05bi7o6X758n4m7Q6K7Q6Y6Ycydddl8R7ca9ck8S8M827x9N9E51512r3p*024B6I4F3r5J5d*043U3U8Q*035d*094m4m5d*0c5+4B2C3k4x3U5/*045d*036Y5d*084m5d*036d6d5d8E6t9z6R5d5dbi8u!!5d6Y*02=65!*035d5dbi4maScE6r!bi!cMbD4dbiar92a39z9zbibi5dbibldVbia3bibi8I!969zbibrbibybD==8c6A8b4d7L8c7Z6W7n6A6u8b7v4d7U7B8o746+7Q7V7P6c8r6i7L916Y9Oai=*04ak7Z7LbidW=8eai8Mbi7Qar6A8I6/9073br8GcYca9E89al6Y8u8uag95aX7Z7r628M7Z6Y4mbi6l6l8I7QardV9V7Par*029z9zbM92ak8I5d5d65dEdEbBarbib4bibi8+ar92aG9ze07RbibiaraCdVbi*028Iar9zb4cmbibiaafNfNb2dE8+akg4ar6Y7Z7o6q7Z6YaP6b8n8n7C7P9V8n7Q8n7Q6Y6R7Qa87Q8n7Tc2c285aw786JbH7c=6Y7z=6J654m*02bnbj7Q=*028nik9Vav8vf8aBbi9eg9d2e0aPiUeD7R6bby9Obi7QcJ9d==h7dMbX8SiZcoik9Var6Y5e00*06bi8n8+7m8I7Q725v926q9T83e0aP7R6bar7Car7Car7Cci8Zbi8ndj9Lg8clar6Yar6Y9z6Rbi7Qbi7Qbi7Qct9raa7Taa7Taa7QdK8ydK8y5d==ar83aC7Pbi8nbi8naa7TdV9V4m=*03dVar==bi6Y=*057R6Y=*05bi7Q=*0b926q==926qbi7Qbi7Q=*29bi=*0e6Y=5d5db97n=*0W8h=8h=8h=8h=8h=*03c88uc88uc88uc88uc88u=*07dn8f8t7Mab8B7QfE7QfE5d3W2D7Q3W381j00*045d5d7Q7QfEfE4p7Q5d*036Y*037Q7Q5u5u5daqfE3W!!00*0438fEkJ3r6x6x3q6w6w4U5d5dfE8Z6Y5deZeZ56eH5d2D5d5ddkayat7E75*027Q4meZ7Q7Q8teZ7Q7P8I9D9/4hdP9/4h4m3u00*04!00*094I2C!!4I*055i*0237374X4I*095i*023737!4h404w4y404I4I2C7j4I4I3F2C!*029Farar7Q7Qcabif9heeMc8817Qbi9zfE7Q8Ibibi8Iar7Q7Q9z7Q7QaHbc7QbTar!*0f00*0w!*0ed2cHarg09zd1dK7Rareh7+eafsbi7Q7QaM8Fb47vcabieWbxbA8Ibievcrar*02ebiKfkbi9z6Yc0bDaW4d=bieva69o619DaM8Ihs6m9g8L6s8356ekiq8B6W92bib9ca8I8Iarbi7Q6Y4m4m9Xcac9dO6xgsbKbKfSbK*0b7g5da6f0gsbigolhqagtbigolh9zarbidV4m8cc3bz7QbVfMjDb+7QbTfK4m6Y7QcahBbihBar6YbsaMbihBbK7Q7Q!*03fE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b98Q!!2D!*023W8B!*02b9fj!*08bi!4i!*0r8B!*0m8B8Q!!8B8B!*2p",
			bold: "3W5d8H7Q7QfEd14m5d5d7Q8W3W5d3W4m7Q*095d5d8W*027Qeybiarbibiar9zcaca657QcaareMbica9zcabi8IarbibifEbibiar5d4m5d957Q5d7Q8I6Y8I6Y5d7Q8I4m5d8I4md18I7Q8I8I6Y655d8I7Qbi7Q7Q6Y6a3s6a883W5d7Q*033s7Q5dbH4I7Q8W5dbH7Q6g8B4I4I5d908s5d5d4I5a7QbK*027Q=bi*04fE==ar*02=65*02bibi=ca*038Wca=bi*039z8I=7Q*04bi=6Y*03=4m*027Q==7Q*038B7Q=8I*02=8I=*0fbtbi8I=*0jca8I=*084mcT8E=*038I=*047lar6car4m=*05bpc18I=*05fEbibi=*0f89ar5d=*0dbi=*074m8IbPal8Ial8Ibibi6YbicMal8I87arbz8g9z7Qcabice4P65ca8I4m7HeIbi8Icaca8Ggwc3aS8I9z8I65ae815dar5darcs9ocxaccn7Qar6Y96967a757Q7U615d9k3s544n5dlJiefEiffE9zj6gvdV=*0f6Y=*05ca7Q=*087a=lJiefE==faa6=*0v8I=*028G5S==bu8IaA7Rar6Y=*0d4m8I5F5dcTcTbibi7Qarar656Y8k7iarbibdar6Y7Q5dcV8Ibi6Ybi7Q7Q8/8/8I6Y6Y8I8I6Y6Y9P6H6H9h795d8D8D9f7Q868I*024m4S4w4m*029vd1*028I8I8b7QbTbrbi6Y*046h6h8/8/654K5d5v4/5d5d8I9F8b7Qbi7Q8l6Y817a7a6Y*027Oca8s799f905d8I7X8I6Y6YdtdEeya88pb4dh9K9k807xarar55552R3+3+4a5s6M4H4p7M5d*043X3X8W*035d*094m4m5d*0c5+4H2N3p4u3X5/*045d*037Q5d*0d6d6d5d9w7vaU8a5d5dca94!!5d6Y*02=7Q!*035d5dbi=cved8a!ca!dxcx4Sbiar9Y9Pararcaca65cabdeMbiaBcaca9z!aearbicZbicccx==8K6H8U4S878K8f7k876H6t8U8a4S8H7H8T6/6+7Q8A8n6C8w7d879M7eaMbr=*04ca8f9nbier=9Mbr94ca7Qbi6C9z8y9j7dbL8GdCd1bl9abA6Y9N9aaG9tbl848s72947Q6Y5dca6B6B9z8IbieMaF8nbi*02ararcw9YaC8I65657QfHfGcwblcabucabialar9YaMarft8gcacablbFeMca*029zbiarbudrbicabuhahabZfmalaChCbi7Q7Q8s767W6Ybl6i90*028NaF907Q908I6Y7H7QaQ7Q908Qdcdc97cd8h6MbY8t=6Y8p=6M654m4m5dccct8I=90=90jy9HbY9ofLaobi7Qhac5ftbllgfD8g6iccaMca7QcL9t==hQeocU99jkcEjy9Hbi6Y5i00*06ca90al8h9z8I88659Y76bi91ftbl8g6ibl90bl90bl90cZ9Sca90eparhrdcbp8mbi6Yar7Hbi7Qbi7Qbi7Qdz9xbu8Qbu8Qbu8IdM8QdM8Q65==bx9hbF8Nca90ca90bu8QeMaF4m=*03fEbi==bz6Y=*058g7a=*05ca7Q=*0b9Y76==9Y76bi7Qbi7Q=*29bi=*0e7Q=5d5dbS87=*0W8G=8G=8G=8G=8G=*03cs9ocs9ocs9ocs9ocs9o=*07fk8D8L7Mab8r7QfE7QfE5d3W2D7Q3W381j00*045d5d7Q7QfEfE547Q5d*037Q*055u5u5darfE3W!!00*0438fEkQ4p8E8E4p7M8E4U5d5dfE9s7Q5deZeZ5ueH5d2D5d5deAbPbL7E8s7K7K7Q5deZ7Q8W8veZ7Q8+bxadad5dgkad5d5d3u00*04!00*094I2C!!4I*0837375s4I*0c3737!4A434v4u43555g2N7I5d553p3k!*029Zbibi7Q7Qd1bif9iZfEbS817Qcaarht7Q9zcabi8Ibi8H8Iar7Q7Qa+cm7QbEar!*0f00*0w!*0ed1d1bigWbad1dT8CaCfi7+eafsca8I8IaM8Fb45TdtbifJbHbA9zcaevcrbi*02eSiPfEbiar7ac0cxb94S==eva69o619DaM9zhs6ma88Q738X56e6jn8A7k9Ycabpca9z9zarbi7Q6Y4m4ma+d1dQem7vlrbKbKfSbK*0b7b65bZhRhobihlndt5hpbihpngarbibieM4m8Gc+bT7QcagukOc57Qc3gn4m6Y8Id1gNbigNbi6YbKaMbigNbK7Q7Q!*03fE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b98W!!2D!*023W8B!*02b9fj!*08bf!4i!*0r8B!*0m8B8W!!8B8B!*2p",
			italic: "3W5d6A7Q7Qd1ca3m5d5d7Qaz3W5d3W4m7Q*095d5daz*027Qeo9z9zarbi9z9zbibi5d6Yar8Id1arbi9zbi9z7Q8Ibi9zd19z8I8I654m656C7Q5d7Q7Q6Y7Q6Y4m7Q7Q4m4m6Y4mbi7Q*0365654m7Q6Yar6Y6Y656g4j6g8t3W657Q*034j7Q5dbU4k7Qaz5dbU7Q6g8B4I4I5d908b3W5d4I4S7QbK*027Q=9z*04dV==9z*02=5d*02bi==bi*03azbi*04=9z7Q*06ar=6Y*03=4m*027Q*068B7Q*04=7Q=*0f9wbi7Q=*0jbi7Q=*084mbK7Q=*036Y=*045I8I538I4m=*0591aU7y=*05eMar=*0g5I8I4m=*0g8I=*044m7Qam9e7Q9e7Qarar6Ybicc9e7Q7h9zaT7L9z7Qbib1bR4m5dar6Y4m6Ncgar7Mbibi8metaAan7Q9z7Q659i4b4m8I4m8IbO8xbjaD917/8I658t8t6Y6Y7Q7e5/538a384p3V5dj+hndVfEd28IhoeNca=*0f6Y=*05bi7Q=*086Y=j+hndV==eP9l=*0v7Q=*029G67==aj7Q9A8s8I65=*0d4m7Q4m4mbMbO9zar7Q8I8I65657D6Q9zbi9s9z6Y6Y4mb47Q9z658I6Y6W7Q*026Y6Y7Q7Q6Y6Y9g6a668C7k4m7Q7Q7L7s797Q*024m4m4d4m*028Ebi*027Q7Q7X7Qaxb28u65*045D5D6Y7v654v4v3Y4v4m4m7Q887G6Yar6Y5V65656Y6Y6r*026Wbi6K7k7L804m6Y667Q6r6rbQcrbP8M709/bm8x81827x8o8o4s4s2B3u*024t653/3m6A5d*044g4gaz*035d*094m4m5d*0c5+4A283j4q4g5/*045d*038I5d*0d6d6d5d87648I855d5dbi8j!!5d6+*02=6Y!*035d5d9z5daDco6i!bi!akbm4m9z9z8V9b9z8Ibibi5dar9sd1ar9/bibi9z!9i8I8IbV9za/bj==8d6a7M4m7b8d7O6a7h6a6l7M7H4m7w6N7S6Y6I7Q7R7w6m7J5C7b8F6U9Jb2=*03aWa77O7H9YbT=86b28Obi7Qar6Y9z7f8573a+8acgbi9587c56R8u8u9I8caZ7L685j8O7X6+4mbi6j6j9z7Qard19o7war*029z9zct8Vat7Q5d5d6Yevepcvaobiaxbi9z9e9z8V9Y9zek7LbibiaoaBd1bi*029zar8IaxcA9zbiaNgjgjaAdE9eafg8ah7Q7T6O667W6Yey667Q7Q7k6Q9+7M7Q*026Ybi6Yb66Y7Q7tbPbP87aB776Vb17h=6Y7v5V6Q654m*02aDb87Q=*027QhM9Yazarf2ayaV8ufXcddo9YiAdR7L66a/9Jbi7Qau8H==hkdUce90hMcEhM9Yar6Y4n00*06bi7Q9e779z7Q6U4X8V669Y6Yekey7L66ao7kao7kao7kbK8fbi7MdA9KfVaPar6Yar6Y8Ibi8I7Q8I7Q9z6Ybi7QaN7taN7taN7QcK8ycK8y5d==ao7kaB6Qbi7Mbi7MaN7td19+4m=*03dVar==aT6Y=*057L6Y=*05bi7Q=*0b8V66==8V669z6Y9z6Y=*2p7Q=4m4maI7h=*0W8m=8m=8m=8m=8m=*03bO8xbO8xbO8xbO8xbO8x=*07cM8f8E7c9M7i7QfE7QdV4F3u2l7Q3W381j00*045d5d7Q7QdVfE4p7Q5d*038I*037Q7Q5u5u5Q9TdV3W!!00*0438fEkZ3r6x6A3q6w6A4U5d5dfE8Z7Q5deZeZ4UeH5d2D6565dkazbY7Q8b75757Q4GeZ7Q7Q8teZ7Q7Q8R9D9/5ddP9/5d5d3u00*04!00*094I2D!!4I*0837374X4I*0c3737!4A464u4s464r4p286x4r4q3j2E!*029Farar7Q7Qbiarfugvd1cj817Qar8IfE7Q9zbi9z7Qar7Q7Q8I7Q7Qabah7QbT9z!*0f00*0w!*0edYdlarfl9zd1dU7Rafe47+eafsbi7Q7QaM8Fb46xbHbieLbUbA8Ibievcrarar9zebgAfk9z9z6Yc0bDaW4d==eva69o619DaM8Ihs6m9g8L6s8356fehg8B6W92bib9ca8I8Iarbi7Q6Y4m4m9Xcac9dO66gsbKbKfabK*0b7a5d9XeFep9zeAjik5eQ9zeVjD8Iarbid14m8cc3bg6Yblfbj2bl6Ybkfb4m6Y7Qbihobihoar6+bs9XbihobK7Q7Q!*03fE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b9az!!2D!*023W8B!*02b9fj!*08bi!4i!*0r8B!*0m8Baz!!8B8B!*2p",
			boldItalic: "3W658H7Q7Qd1ca4m5d5d7Q8W3W5d3W4m7Q*095d5d8W*027Qd0ar*02biararbica657Qar9zdVbibi9zbiar8I9zbiardVar9z9z5d4m5d8W7Q5d7Q7Q6Y7Q6Y5d7Q8I4m4m7Q4mca8I7Q*0265654m8I6Yar7Q6Y655s3s5s8W3W657Q*033s7Q5dbH4a7Q9u5dbH7Q6g8B4I4I5d907Q3W5d4I4I7QbK*027Q=ar*04eM=ar*03=65*02bi*068Wbi*04=9z7Q*06bi=6Y*03=4m*027Q==7Q*038B7Q=8I*02=7Q=*0fbJbi7Q=*0jca8I=*084mcT8E=*037Q=*04899z5T9z4m=*05bfcg8t=*05eMbi=*0g8j9z4m=*0g9z=*045d7Qbb9X7Q9W7Qarar6Ybicd9W7Q80arbi7Zar7Qbib1cm4m65ar7Q4m6Yddbi8Bbibi8pfVblan7Q9z8I659H5I4m9z4m9zc79nbGb8ad7j9z658t8t7n7n7Q7D605M7V3s5q3U65kRhndVhndV8Ij6fEd2=*0f6Y=*05bi7Q=*087n=kRhndV==fnaO=*05bi=*0o8I=*029e6/==bD7Qaf8s9z65=*0d4m8I4m4mbsbvarar7Q9z9z65657Z7iarbiarar6Y7Q4mch7Qar659z6Y7i7Q*026Y6Y7Q7Q6Y6Y966q6q8z7a4m7Q*027B798I*024m4m4F4m*029mca*028I8I887Qatb3az65*046E677E7J655c5c4A5c4m4m8I8z7G6Yar6Y5Y65657n7n6s*027gbi7E7a7Q934m7Q6C7Q6s6sbHcYbI9s8aaecv9l84847x8I8I4w4w2X3i*024P634f4m8H5d*044i4i8W*035d*0o5+4Y2F3I5k4i5/*045d*037Q5d*0d6d6d5d916M9E8a5d5dcaa7!!5d6Y*02=7Q!*035d5dar5dc9d/7W!br!bKch4marar9s9Par9zcabX65arardVbiajbica9z!9H9z9zclarcwbG==8F6q8B4m7G8F806w806q6V8B874m8i6Y8I6Y717Q8y836+8r6Y7G997hasbj=*04b2808fbld9=93bQ8Sbi7Qar73ar7f8573b98addcab58IbI7f9e9eaV8Sc28j77618S8y6Y4mbi6K6K9z7QardVal83ar*04cO9sah8I65657QecfgcHaCcaaUcaar9Xar9saHarem7ZcacaaCaKdVcabica9zar9zaUdiarcabIhChCbUf99WabgwaN7Q7P6/5N7M6YeU668I8I7X81aJ8H7Q8I7Q6Yca6Ybc7Q8I8dd1d18faS796vbq83=6Y8b696v654m*02ajb98I=*028IhR8W9WarfGayas8QgkduemaFkCfn7Z66cwasbi7Qc88n==hndRd09gitcDhR8War6Y6R00*06ca8I9W799z7Q7m5N9s5NbD7WemeU7Z66aC7XaC7XaC7XcR8/ca8Hfz9RhFbYbj7Oar6Y9zca9z7Q9z7Qar7Qca8IbI8dbI8dbI8IdF8IdF8I65==aC7XaK81ca8Hca8HbI8ddVaJ4m=*03eMbi==bi6Y=*058t7n=*05bi7Q=*0b9s5N==9s5Nar7Qar7Q=*29ar=*0e7Q=5d5dbC80=*0W8p=8p=8p=8p=8p=*03c79nc79nc79nc79nc79n=*07er8k8S7vab797QfE7QfE5d3W2D7Q3W381j00*045d5d7Q7QfEfE5q7Q5d*037Q*055u5u5darfE3W!!00*0438fEkY4p8E8H4p8E8H4U5d5dfEaj7Q5deZeZ4UeH5d2D5d5de7bDca767Q*034IeZ7Q7Q8WeZ7Q7QbW7Q8Y58dk9/585d3u00*04!00*094I2G!!4I*0837375s4I*0c3737!4H4k4B5k4k5d4I2C7j5d4I3F2C!*029yarar7Q7Qcabif9hwdVbT817Qar9zih7Q9zbiar8Iar7Q8I9z7Q7Qa6bu7Qblar!*0f00*0w!*0edpdcbigjbad1et8Cabfs7+eafsca8I8IaM8Fb46HczbiejbHbA9zcaevcrbibiareSiJfEarar7nc0cxb94S=areva69o619DaMavhs6ma88Q738X56fnj08A7k9Ycabpca9z9zarbi7Q6Y4m4ma+d1dQdM7wkZbKbKf5bK*0b7b65bHhhgfargxkbl4gDargTj/9zarbidV4m8mcnbg6Ybifjjjcb7Qcbgb4m6Y7Qcagjbigjae6YaUaPbQhHbK7Q7Q!*03fE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b99u!!2D!*023W8B!*02b9fj!*08bf!4i!*0r8B!*0m8B8W!!8B8B!*2p"
		},
		{
			name: "Courier New",
			lineHeight: 1132.8125,
			regular: "9o*4X!*0e9o*2G!9o*09!*0d9o*27!*059o*06!*069o*0j!*03=9o!*039o!*02=!*049o*06!9o!9o*0j!9o*0H!9o*0I!*049o*2000*069o*14!=9o*0E!*05=9o*2k!=9o*03!*03=9o*1o!*057QfE7QfE5d3W2D8G3d2D0U00*04!9o*04!9o*0b!*029o!*0200*04389o!9o*02!*039o9o!9o!9o!*049o!*0o9o3u00*04!00*09!*0e9o!*0f9o*04!*0a9o*0l!*0p00*0w!*0j9o!*0c9o!!9o!*0a9o!*02=!*069o!*0z9o9o!*059o*03!*0M9o*05!*0h9o!*1o9o!*029o!*079o!9o9o!!9o!*029o9o!*029o9o!*089o!9o!*0r9o!*0m=9o!!9o9o!*2p",
			bold: "9o*4X!*0e9o*2G!9o*09!*0d9o*27!*059o*06!*069o*0j!*03=9o!*039o!*02=!*049o*06!9o!9o*0j!9o*0H!9o*0I!*049o*2000*069o*14!=9o*0E!*05=9o*2k!=9o*03!*03=9o*1o!*057QfE88fY5k3/2G8G3d2D0U00*04!9o*04!9o*0b!*029o!*0200*04389o!9o*02!*039o9o!9o!9o!*049o!*0o9o3u00*04!00*09!*0e9o!*0f9o*04!*0a9o*0l!*0p00*0w!*0j9o!*0c9o!!9o!*0a9o!*02=!*069o!*0z9o9o!*059o*03!*0M9o*05!*0h9o!*1o9o!*029o!*079o!9o9o!!9o!*029o9o!*029o9o!*089o!9o!*0r9o!*0m=9o!!9o9o!*2p",
			italic: "9o*7R!9o*09!*0d9o*27!*059o*06!*069o*0j!*03=9o!*039o!*02=!*049o*06!9o!9o*0j!9o*0H!9o*2O00*069o*14!=9o*0E!*05=9o*2q!*03=9o*1o!*057QfE7QfE5d3W2D8G3d2D0U00*04!9o*04!9o*0b!*029o!*0200*04389o!9o*02!*039o9o!9o!9o!*049o!*0o9o3u00*04!00*09!*0e9o!*0f9o*04!*0a9o*0l!*0p00*0w!*0j9o!*0c9o!!9o!*0a9o!*02=!*069o!*0z9o9o!*059o*03!*0M9o*05!!eV!*0e9o!*1o9o!*029o!*079o!9o9o!!9o!*029o9o!*029o9o!*089o!9o!*0r9o!*0m=9o!!9o9o!*2p",
			boldItalic: "9o*7R!9o*09!*0d9o*2k!*069o*0j!*03=9o!*039o!*02=!*049o*06!9o!9o*0j!9o*0H!9o*2O00*069o*14!=9o*0E!*05=9o*2q!*03=9o*1o!*057QfE88fY5k3/2G8G3d2D0U00*04!9o*04!9o*0b!*029o!*0200*04389o!9o*02!*039o9o!9o!9o!*049o!*0o9o3u00*04!00*09!*0e9o!*0f9o*04!*0a9o*0l!*0p00*0w!*0j9o!*0c9o!!9o!*0a9o!*02=!*069o!*0z9o9o!*059o*03!*0M9o*05!*0h9o!*1o9o!*029o!*079o!9o9o!!9o!*029o9o!*029o9o!*089o!9o!*0r9o!*0m=9o!!9o9o!*2p"
		}
	];
	//#endregion
	//#region src/text-layout/text-width.ts
	/**
	* Estimates how much space text takes up, from the widths of the characters in common fonts.
	*
	* The estimate is close for the fonts in {@link FONT_WIDTHS}. Other fonts are measured with the one most like them,
	* so their estimates are rougher. Kerning and ligatures are left out, which makes text a little wider than Word draws it.
	*
	* @module
	*/
	var DEFAULT_FONT = "Times New Roman";
	var TAB_STOP = 36;
	var SIMILAR_FONTS = [
		[/^(carlito|calibri light|segoe ui|candara|corbel)$/i, "Calibri"],
		[/^caladea$/i, "Cambria"],
		[/mono|courier|consolas|code|typewriter/i, "Courier New"],
		[new RegExp("times|tinos|liberation serif|georgia|garamond|palatino|book antiqua|(?<!sans[ -]?)serif|roman", "i"), "Times New Roman"]
	];
	var CHARACTERS = FONT_WIDTH_RANGES.flatMap(([first, last]) => Array.from({ length: last - first + 1 }, (_, offset) => first + offset));
	var CHARACTER_INDEX = new Map(CHARACTERS.map((code, index) => [code, index]));
	var AVERAGE_LETTERS = [..."abcdefghijklmnopqrstuvwxyz"].map((letter) => CHARACTER_INDEX.get(letter.codePointAt(0)));
	var DIGITS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/";
	var decoded = /* @__PURE__ */ new Map();
	/**
	* Reads the widths of a font's face, as {@link FontWidths} writes them: the width of each character of the tables, in
	* thousandths of an em, or undefined where its width in Word isn't known.
	*/
	var decodeWidths = (encoded) => {
		const known = decoded.get(encoded);
		if (known) return known;
		const twoDigitsAt = (at) => DIGITS.indexOf(encoded[at]) * 64 + DIGITS.indexOf(encoded[at + 1]);
		const widths = [];
		let token = 0;
		for (let at = 0; at < encoded.length;) {
			let count = 1;
			if (encoded[at] === "*") {
				count = twoDigitsAt(at + 1);
				at += 3;
			} else {
				token = at;
				at += encoded[at] === "=" || encoded[at] === "!" ? 1 : 2;
			}
			for (let repeat = 0; repeat < count; repeat++) {
				const code = CHARACTERS[widths.length];
				const width = encoded[token] === "!" ? void 0 : encoded[token] === "=" ? widths[CHARACTER_INDEX.get(String.fromCodePoint(code).normalize("NFD").codePointAt(0))] : twoDigitsAt(token);
				widths.push(width);
			}
		}
		decoded.set(encoded, widths);
		return widths;
	};
	var EAST_ASIAN_FONTS = [
		{
			name: "MS Mincho",
			aliases: ["ＭＳ 明朝", "MS 明朝"],
			lineHeight: 1297,
			monospaced: true,
			latin: "Times New Roman"
		},
		{
			name: "MS Gothic",
			aliases: ["ＭＳ ゴシック", "MS ゴシック"],
			lineHeight: 1297,
			monospaced: true,
			latin: "Arial"
		},
		{
			name: "MS PMincho",
			aliases: ["ＭＳ Ｐ明朝", "MS P明朝"],
			lineHeight: 1297,
			latin: "Times New Roman"
		},
		{
			name: "MS PGothic",
			aliases: ["ＭＳ Ｐゴシック", "MS Pゴシック"],
			lineHeight: 1297,
			latin: "Arial"
		},
		{
			name: "Yu Mincho",
			aliases: ["游明朝"],
			lineHeight: 1433,
			latin: "Times New Roman"
		},
		{
			name: "Yu Gothic",
			aliases: [
				"游ゴシック",
				"游ゴシック Light",
				"Yu Gothic Light"
			],
			lineHeight: 1434,
			latin: "Arial"
		},
		{
			name: "Meiryo",
			aliases: ["メイリオ"],
			lineHeight: 1950,
			latin: "Arial"
		},
		{
			name: "SimSun",
			aliases: ["宋体"],
			lineHeight: 1297,
			monospaced: true,
			latin: "Times New Roman"
		},
		{
			name: "NSimSun",
			aliases: ["新宋体"],
			lineHeight: 1296,
			monospaced: true,
			latin: "Times New Roman"
		},
		{
			name: "SimHei",
			aliases: ["黑体"],
			lineHeight: 1297,
			monospaced: true,
			latin: "Arial"
		},
		{
			name: "KaiTi",
			aliases: ["楷体"],
			lineHeight: 1297,
			monospaced: true,
			latin: "Times New Roman"
		},
		{
			name: "FangSong",
			aliases: ["仿宋"],
			lineHeight: 1297,
			monospaced: true,
			latin: "Times New Roman"
		},
		{
			name: "Microsoft YaHei",
			aliases: ["微软雅黑"],
			lineHeight: 1714,
			latin: "Arial"
		},
		{
			name: "DengXian",
			aliases: [
				"等线",
				"等线 Light",
				"DengXian Light"
			],
			lineHeight: 1354,
			latin: "Arial"
		},
		{
			name: "PMingLiU",
			aliases: ["新細明體"],
			lineHeight: 1300,
			latin: "Times New Roman"
		},
		{
			name: "MingLiU",
			aliases: ["細明體"],
			lineHeight: 1301,
			monospaced: true,
			latin: "Times New Roman"
		},
		{
			name: "Microsoft JhengHei",
			aliases: ["微軟正黑體"],
			lineHeight: 1730,
			latin: "Arial"
		},
		{
			name: "Malgun Gothic",
			aliases: ["맑은 고딕"],
			lineHeight: 1730,
			latin: "Arial"
		},
		{
			name: "Batang",
			aliases: ["바탕"],
			lineHeight: 1300,
			latin: "Times New Roman"
		},
		{
			name: "Gulim",
			aliases: ["굴림"],
			lineHeight: 1301,
			latin: "Arial"
		},
		{
			name: "Dotum",
			aliases: ["돋움"],
			lineHeight: 1301,
			latin: "Arial"
		}
	];
	var EAST_ASIAN_NAME = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]|hiragino|cjk|source han|pingfang|songti|heiti|kaiti|fangsong|mincho|mingliu|simhei|gungsuh|nanum/i;
	var EAST_ASIAN_SANS = /gothic|ゴシック|hei|黑|黒|sans|고딕|pingfang/i;
	/**
	* The East Asian font a font is, or is measured as, by its name. Undefined for other fonts.
	*/
	var eastAsianFontOf = (font) => {
		const name = font.toLowerCase();
		const known = EAST_ASIAN_FONTS.find((candidate) => [candidate.name, ...candidate.aliases].some((alias) => alias.toLowerCase() === name));
		const similar = EAST_ASIAN_SANS.test(font) ? "MS Gothic" : "MS Mincho";
		return known !== null && known !== void 0 ? known : EAST_ASIAN_NAME.test(font) ? EAST_ASIAN_FONTS.find((candidate) => candidate.name === similar) : void 0;
	};
	/** Whether a font is one for Chinese, Japanese or Korean text */
	var isEastAsianFont = (font) => font !== void 0 && eastAsianFontOf(font) !== void 0;
	/**
	* The widths to measure a font with: its own, or those of the most similar font in the table.
	* Sans-serif fonts that aren't in the table, such as Aptos and Helvetica, are measured as Arial.
	*/
	var widthsOf = (font = DEFAULT_FONT) => {
		var _named;
		const named = (name) => FONT_WIDTHS.find((known) => known.name.toLowerCase() === name.toLowerCase());
		const similar = SIMILAR_FONTS.find(([pattern]) => pattern.test(font));
		return (_named = named(font)) !== null && _named !== void 0 ? _named : named(similar ? similar[1] : "Arial");
	};
	/** The widths of the face text is in: its font's, bold, italic, both or neither */
	var faceOf = ({ font, bold, italic }) => {
		const widths = widthsOf(font);
		return decodeWidths(italic ? bold ? widths.boldItalic : widths.italic : bold ? widths.bold : widths.regular);
	};
	var isWide = (code) => code >= 4352 && code <= 4447 || code >= 11904 && code <= 42191 || code >= 44032 && code <= 55203 || code >= 63744 && code <= 64255 || code >= 65072 && code <= 65103 || code >= 65280 && code <= 65376 || code >= 65504 && code <= 65510 || code >= 127744;
	var isHalfWidth = (code) => code >= 65377 && code <= 65500;
	var takesNoRoom = (character) => new RegExp("[\\p{Mn}\\p{Me}\\p{Cf}]", "u").test(character);
	/**
	* The width of a character in thousandths of an em. Characters that aren't in the table are as wide as an average
	* lowercase letter, a whole em for wide characters and half an em for half-width ones, and marks take no space. So are
	* those the table has, but whose width in the font isn't known.
	*/
	var characterWidth = (widths, character) => {
		const code = character.codePointAt(0);
		const index = CHARACTER_INDEX.get(code);
		const width = index === void 0 ? void 0 : widths[index];
		if (width !== void 0) return width;
		if (isWide(code)) return 1e3;
		if (isHalfWidth(code)) return 500;
		return takesNoRoom(character) ? 0 : AVERAGE_LETTERS.reduce((total, letter) => total + widths[letter], 0) / AVERAGE_LETTERS.length;
	};
	var FULL_WIDTH_SYMBOLS = /* @__PURE__ */ new Set([..."§¨°±´¶×÷‐―‖‘’“”†‡‥…‰′″※℃Å"]);
	/**
	* The width of a character of a monospaced East Asian font, in thousandths of an em: an em for ideographs and the symbols
	* of Japanese and Chinese, and half an em for the rest.
	*/
	var monospacedWidth = (character) => {
		const code = character.codePointAt(0);
		if (takesNoRoom(character)) return 0;
		return isWide(code) || FULL_WIDTH_SYMBOLS.has(character) || code >= 8592 && code <= 9983 ? 1e3 : 500;
	};
	var sizeOf$1 = ({ size = 10 }) => size;
	/**
	* How a font's characters are measured: an East Asian font's Latin letters with the widths of the font in the table they
	* are measured as, or all of a monospaced one's as half an em or an em, and other fonts with their own widths, or those of
	* the most similar font in the table
	*/
	var measuresOf = (font) => {
		var _font$font, _eastAsian$latin;
		const eastAsian = eastAsianFontOf((_font$font = font.font) !== null && _font$font !== void 0 ? _font$font : DEFAULT_FONT);
		return {
			widths: faceOf(_objectSpread2(_objectSpread2({}, font), {}, { font: (_eastAsian$latin = eastAsian === null || eastAsian === void 0 ? void 0 : eastAsian.latin) !== null && _eastAsian$latin !== void 0 ? _eastAsian$latin : font.font })),
			monospaced: (eastAsian === null || eastAsian === void 0 ? void 0 : eastAsian.monospaced) === true
		};
	};
	/**
	* How wide a line of text is, in points. Tabs move to the next half inch, counted from the start of the line.
	*
	* @param start - Where the text starts on its line, in points
	*/
	var measureTextWidth = (text, font = {}, start = 0) => {
		const { widths, monospaced } = measuresOf(font);
		const widthOf = monospaced ? monospacedWidth : (character) => characterWidth(widths, character);
		const size = sizeOf$1(font);
		const { characterSpacing = 0, scale = 100 } = font;
		return [...text].reduce((position, character) => character === "	" ? (Math.floor(position / TAB_STOP) + 1) * TAB_STOP : position + widthOf(character) * size * scale / 1e5 + characterSpacing, start) - start;
	};
	/**
	* How tall a line of single-spaced text is, in points.
	*/
	var measureLineHeight = (font = {}) => {
		var _eastAsianFontOf, _font$font2;
		return ((_eastAsianFontOf = eastAsianFontOf((_font$font2 = font.font) !== null && _font$font2 !== void 0 ? _font$font2 : "Times New Roman")) !== null && _eastAsianFontOf !== void 0 ? _eastAsianFontOf : widthsOf(font.font)).lineHeight * sizeOf$1(font) / 1e3;
	};
	/**
	* Splits spans into words and the spaces between them. A word can be made of pieces of several spans, such as a bold
	* letter in a plain word, so each token is a list of pieces.
	*/
	var tokenize = (spans) => spans.flatMap((span) => span.text.split(/([ \t]+)/).filter((text) => text.length > 0).map((text) => _objectSpread2(_objectSpread2({}, span), {}, { text }))).reduce((tokens, piece) => {
		const last = tokens[tokens.length - 1];
		const isSpace = (text) => /^[ \t]/.test(text);
		return last && !isSpace(piece.text) && !isSpace(last[0].text) ? [...tokens.slice(0, -1), [...last, piece]] : [...tokens, [piece]];
	}, []);
	var measurePieces = (pieces, start) => pieces.reduce((position, piece) => position + measureTextWidth(piece.text, piece, position), start) - start;
	/**
	* Lays out one line of a paragraph, up to a line break, wrapping it at `limit`. Positions are measured from the left
	* edge of the text, so tabs line up across lines.
	*
	* @param start - Where the line starts: the paragraph's left indent, and its first line indent on its first line
	* @param restart - Where the lines it wraps onto start
	* @param limit - Where lines wrap: the width of the text less the paragraph's right indent
	*/
	var wrapLine = (spans, height, start, restart, limit) => {
		const wraps = (position, width) => limit !== void 0 && position + width > limit;
		const room = limit === void 0 ? 0 : limit - restart;
		const { lines, end } = tokenize(spans).reduce((state, token) => {
			if (/^[ \t]/.test(token[0].text)) return _objectSpread2(_objectSpread2({}, state), {}, { position: state.position + measurePieces(token, state.position) });
			const wrapped = state.started && wraps(state.position, measurePieces(token, state.position));
			const done = wrapped ? [...state.lines, {
				width: state.end,
				height
			}] : state.lines;
			const position = wrapped ? restart : state.position;
			const width = measurePieces(token, position);
			if (room <= 0 || !wraps(position, width)) return {
				lines: done,
				position: position + width,
				end: position + width,
				started: true
			};
			const full = Math.ceil((position - restart + width) / room) - 1;
			const last = position + width - full * room;
			return {
				lines: [...done, ...Array.from({ length: full }, () => ({
					width: limit,
					height
				}))],
				position: last,
				end: last,
				started: true
			};
		}, {
			lines: [],
			position: start,
			end: start,
			started: false
		});
		return [...lines, {
			width: end,
			height
		}];
	};
	/**
	* How tall a paragraph's lines are: as tall as its tallest font, with its line spacing.
	*/
	var lineHeightOf = ({ spans, font = {}, format = {} }) => {
		const single = Math.max(...(spans.length > 0 ? spans : [font]).map(measureLineHeight));
		const { lineSpacing } = format;
		if (!lineSpacing) return single;
		if (lineSpacing.rule === "multiple") return single * lineSpacing.multiple;
		return lineSpacing.rule === "exact" ? lineSpacing.height : Math.max(single, lineSpacing.height);
	};
	/**
	* Splits a paragraph's spans at line breaks.
	*/
	var splitLines = (spans) => spans.reduce((parts, span) => span.text.split("\n").reduce((spanParts, text, index) => index === 0 ? [...spanParts.slice(0, -1), [...spanParts[spanParts.length - 1], _objectSpread2(_objectSpread2({}, span), {}, { text })]] : [...spanParts, [_objectSpread2(_objectSpread2({}, span), {}, { text })]], parts), [[]]);
	/**
	* The space above and below a paragraph. With contextual spacing, there is none next to a paragraph of the same style.
	*/
	var spacingOf = (paragraph, before, after) => {
		var _paragraph$format;
		const { spaceBefore = 0, spaceAfter = 0, contextualSpacing } = (_paragraph$format = paragraph.format) !== null && _paragraph$format !== void 0 ? _paragraph$format : {};
		const sameStyle = (other) => contextualSpacing === true && other !== void 0 && other.style === paragraph.style;
		return {
			above: sameStyle(before) ? 0 : spaceBefore,
			below: sameStyle(after) ? 0 : spaceAfter
		};
	};
	/**
	* Measures text that wraps at `maxWidth`, or only at line breaks when `maxWidth` isn't given. Words wider than a
	* line are broken across lines, as Word breaks them. Spaces at the ends of lines take no space. Paragraphs take their
	* space before and after, line spacing and indents from their `format`.
	*
	* @param paragraphs - Each paragraph, or just its spans. A paragraph without spans is one empty line
	* @param maxWidth - The width lines wrap at, in points
	*/
	var measureText = (paragraphs, maxWidth) => {
		const all = paragraphs.map((paragraph) => "spans" in paragraph ? paragraph : { spans: paragraph });
		const measured = all.map((paragraph, index) => {
			var _paragraph$format2;
			const { indentLeft = 0, indentRight = 0, firstLineIndent = 0 } = (_paragraph$format2 = paragraph.format) !== null && _paragraph$format2 !== void 0 ? _paragraph$format2 : {};
			const height = lineHeightOf(paragraph);
			const limit = maxWidth === void 0 ? void 0 : maxWidth - indentRight;
			const lines = splitLines(paragraph.spans).flatMap((line, lineIndex) => wrapLine(line, height, indentLeft + (lineIndex === 0 ? firstLineIndent : 0), indentLeft, limit));
			const { above, below } = spacingOf(paragraph, all[index - 1], all[index + 1]);
			return {
				width: Math.max(0, ...lines.map(({ width }) => width + indentRight)),
				height: above + lines.reduce((total, line) => total + line.height, 0) + below
			};
		});
		return {
			width: Math.max(0, ...measured.map(({ width }) => width)),
			height: measured.reduce((total, { height }) => total + height, 0)
		};
	};
	//#endregion
	//#region src/text-layout/line-break-rules.ts
	var EAST_ASIAN = new RegExp("[\\u1100-\\u11ff\\u2e80-\\u2fff\\u3000-\\u30ff\\u3130-\\u318f\\u31c0-\\u33ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\ua960-\\ua97f\\uac00-\\ud7ff\\uf900-\\ufaff\\ufe30-\\ufe4f\\uff00-\\uffef\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}\\p{Script=Hangul}]", "u");
	new RegExp("\\p{Script=Hangul}", "u");
	/** Whether a character is Chinese, Japanese or Korean, or East Asian punctuation, which Word draws in a run's East Asian font */
	var isEastAsian = (character) => EAST_ASIAN.test(character);
	//#endregion
	//#region src/text-layout/text-styles.ts
	var OFFICE_THEME_FONTS = {
		headings: "Calibri Light",
		body: "Calibri"
	};
	/**
	* Word's own defaults: 10pt Times New Roman with single spacing, Office's theme, and a Normal paragraph style with no
	* formatting as the default, as `docx` writes it.
	*/
	var WORD_DEFAULT_STYLES = {
		run: {},
		paragraph: {},
		styles: /* @__PURE__ */ new Map([["Normal", {
			type: "paragraph",
			run: {},
			paragraph: {}
		}]]),
		defaultParagraphStyle: "Normal",
		themeFonts: OFFICE_THEME_FONTS
	};
	var SMALL_CAPS_SCALE = .8;
	var SINGLE_LINE = 240;
	/**
	* A context for formatting parts of the document to read them. Formatting paragraph properties that refer to a
	* numbering adds the numbering to the document, so this context's document leaves it out.
	*/
	var READING_CONTEXT = {
		stack: [],
		file: { Numbering: { createConcreteNumberingInstance: () => void 0 } }
	};
	var isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
	/**
	* The children of an element in a formatted tree. An element with children is an array, and one without is an object.
	*/
	var childrenOf = (element) => Array.isArray(element) ? element.filter(isObject) : [];
	var attributesOf = (element) => {
		const holder = Array.isArray(element) ? element.find((child) => isObject(child) && "_attr" in child) : element;
		return isObject(holder) && isObject(holder._attr) ? holder._attr : {};
	};
	var find = (children, name) => {
		var _children$find;
		return (_children$find = children.find((child) => name in child)) === null || _children$find === void 0 ? void 0 : _children$find[name];
	};
	var numberOf = (value) => {
		const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
		return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : void 0;
	};
	var stringOf = (value) => typeof value === "string" && value.length > 0 ? value : void 0;
	var scaled = (value, divisor) => value === void 0 ? void 0 : value / divisor;
	var POINTS_PER_UNIT = {
		mm: 72 / 25.4,
		cm: 72 / 2.54,
		in: 72,
		pt: 1,
		pc: 12,
		pi: 12
	};
	var METRIC = /* @__PURE__ */ new Set(["mm", "cm"]);
	var MEASURE = /^\s*(-?)(\d+)(\.\d+)?(mm|cm|in|pt|pc|pi)\s*$/;
	var ROUNDING = 1e-9;
	/**
	* A length in points, from an attribute in its own unit, `perPoint` of which make a point (20 for twips, 2 for
	* half-points), or in a unit of OOXML's universal measure, such as "1in", "2.5cm" or "12pt", as the schema allows for
	* every length docx writes from a string.
	*
	* Word reads a universal measure as a whole number of the attribute's unit (word-units and word-units2): rounded down
	* from inches, points and picas, so "240.7pt" is 4814 twips, and to the nearest from centimeters and millimeters, so
	* "84.67724mm" (4800.6 twips) is 4801. Its minus sign is the whole number's only, and the fraction is added to it:
	* "-10.7pt" is -10 points and 0.7 more, -186 twips, and "-0.16708in" is 240 twips.
	*/
	var pointsOf = (value, perPoint) => {
		const measure = typeof value === "string" ? MEASURE.exec(value) : null;
		if (!measure) return scaled(numberOf(value), perPoint);
		const [, minus, whole, fraction = "", unit] = measure;
		const inUnits = ((minus ? -Number(whole) : Number(whole)) + Number(`0${fraction}`)) * POINTS_PER_UNIT[unit] * perPoint;
		return (METRIC.has(unit) ? Math.round(inUnits) : Math.floor(inUnits + ROUNDING)) / perPoint;
	};
	/**
	* A run's size (`w:sz`, or `w:szCs` for complex scripts) in points, from half-points, or from points, which Word rounds down to a half-point:
	* "11.75pt" is 11.5. Word ignores a size in inches, centimeters or millimeters, as if it had none (word-units2).
	*/
	var sizeOf = (value) => {
		var _MEASURE$exec;
		const unit = typeof value === "string" ? (_MEASURE$exec = MEASURE.exec(value)) === null || _MEASURE$exec === void 0 ? void 0 : _MEASURE$exec[4] : void 0;
		return unit === void 0 || unit === "pt" ? pointsOf(value, 2) : void 0;
	};
	/**
	* Why how Word reads a length in formatted XML isn't known, when it isn't: a size in picas, which Word's PDFs didn't
	* tell from one it ignores, or in another unit but points, which they showed it ignores only with no style giving a
	* size, and a negative length of a fraction of a centimeter or millimeter, whose minus sign and rounding together they
	* didn't show. Undefined when every length's reading is known.
	*/
	var unknownLengthIn = (element, name = "") => {
		if (Array.isArray(element)) return element.reduce((found, child) => found !== null && found !== void 0 ? found : unknownLengthIn(child, name), void 0);
		if (!isObject(element)) return;
		return Object.entries(element).reduce((found, [key, child]) => {
			if (found !== void 0 || key !== "_attr") return found !== null && found !== void 0 ? found : unknownLengthIn(child, key);
			return Object.values(child).reduce((reason, value) => {
				const measure = typeof value === "string" ? MEASURE.exec(value) : null;
				if (reason !== void 0 || !measure) return reason;
				const [, minus, , fraction, unit] = measure;
				return (name === "w:sz" || name === "w:szCs") && unit !== "pt" ? "a size given in a unit other than points" : minus && fraction && METRIC.has(unit) ? "a negative length of a fraction of a centimeter or millimeter" : void 0;
			}, void 0);
		}, void 0);
	};
	var isOff = (value) => value === false || value === 0 || value === "false" || value === "0" || value === "off";
	/**
	* An on/off property, such as `w:b`: on when present, unless its value says otherwise.
	*/
	var onOff = (children, name) => {
		const element = children.find((child) => name in child);
		return element ? !isOff(attributesOf(element[name])["w:val"]) : void 0;
	};
	var withoutUndefined = (object) => Object.fromEntries(Object.entries(object).filter(([, value]) => value !== void 0));
	/**
	* Combines formatting, with later formatting overriding earlier formatting.
	*/
	var combine = (formats) => formats.reduce((all, format) => _objectSpread2(_objectSpread2({}, all), withoutUndefined(format)), {});
	var valueOf = (children, name) => stringOf(attributesOf(find(children, name))["w:val"]);
	/**
	* The font a theme font refers to: `majorHAnsi` and the other major fonts are the theme's font for headings, and the
	* minor fonts its font for body text.
	*/
	var themeFontOf = (theme, themeFonts) => {
		if (typeof theme !== "string") return;
		if (theme.startsWith("major")) return themeFonts.headings;
		return theme.startsWith("minor") ? themeFonts.body : void 0;
	};
	/**
	* Reads run properties (`w:rPr`). A font of the theme (`w:asciiTheme`) takes the place of the font named beside it.
	*/
	var readRunFormat = (element, themeFonts) => {
		var _ref, _ref2, _themeFontOf, _themeFontOf2, _themeFontOf3;
		const children = childrenOf(element);
		const fonts = attributesOf(find(children, "w:rFonts"));
		return withoutUndefined({
			font: (_ref = (_ref2 = (_themeFontOf = themeFontOf(fonts["w:asciiTheme"], themeFonts)) !== null && _themeFontOf !== void 0 ? _themeFontOf : stringOf(fonts["w:ascii"])) !== null && _ref2 !== void 0 ? _ref2 : themeFontOf(fonts["w:hAnsiTheme"], themeFonts)) !== null && _ref !== void 0 ? _ref : stringOf(fonts["w:hAnsi"]),
			size: sizeOf(attributesOf(find(children, "w:sz"))["w:val"]),
			bold: onOff(children, "w:b"),
			italic: onOff(children, "w:i"),
			allCaps: onOff(children, "w:caps"),
			smallCaps: onOff(children, "w:smallCaps"),
			hidden: onOff(children, "w:vanish"),
			characterSpacing: pointsOf(attributesOf(find(children, "w:spacing"))["w:val"], 20),
			scale: numberOf(attributesOf(find(children, "w:w"))["w:val"]),
			eastAsiaFont: (_themeFontOf2 = themeFontOf(fonts["w:eastAsiaTheme"], themeFonts)) !== null && _themeFontOf2 !== void 0 ? _themeFontOf2 : stringOf(fonts["w:eastAsia"]),
			complexScriptFont: (_themeFontOf3 = themeFontOf(fonts["w:cstheme"], themeFonts)) !== null && _themeFontOf3 !== void 0 ? _themeFontOf3 : stringOf(fonts["w:cs"]),
			complexScriptSize: sizeOf(attributesOf(find(children, "w:szCs"))["w:val"]),
			complexScriptBold: onOff(children, "w:bCs"),
			complexScriptItalic: onOff(children, "w:iCs"),
			rightToLeft: onOff(children, "w:rtl"),
			complexScript: onOff(children, "w:cs"),
			eastAsianLanguage: stringOf(attributesOf(find(children, "w:lang"))["w:eastAsia"])
		});
	};
	var readLineSpacing = (spacing) => {
		const line = pointsOf(spacing["w:line"], 20);
		if (line === void 0) return;
		const rule = spacing["w:lineRule"];
		return rule === "exact" || rule === "atLeast" ? {
			rule,
			height: line
		} : {
			rule: "multiple",
			multiple: line * 20 / SINGLE_LINE
		};
	};
	var TAB_ALIGNMENTS = {
		left: "left",
		start: "left",
		right: "right",
		end: "right",
		center: "center",
		decimal: "decimal",
		bar: "bar",
		clear: "clear",
		num: "left"
	};
	var ALIGNMENTS = {
		start: "left",
		left: "left",
		numTab: "left",
		center: "center",
		end: "right",
		right: "right",
		both: "justified",
		distribute: "distributed",
		lowKashida: "lowKashida",
		mediumKashida: "mediumKashida",
		highKashida: "highKashida",
		thaiDistribute: "thaiDistributed"
	};
	/**
	* Reads the tab stops of paragraph properties (`w:tabs`).
	*/
	var readTabs = (element) => {
		const tabs = childrenOf(element).filter((child) => "w:tab" in child);
		return tabs.length === 0 ? void 0 : tabs.map((tab) => {
			var _pointsOf, _TAB_ALIGNMENTS$Strin;
			const attributes = attributesOf(tab["w:tab"]);
			return {
				position: (_pointsOf = pointsOf(attributes["w:pos"], 20)) !== null && _pointsOf !== void 0 ? _pointsOf : 0,
				alignment: (_TAB_ALIGNMENTS$Strin = TAB_ALIGNMENTS[String(attributes["w:val"])]) !== null && _TAB_ALIGNMENTS$Strin !== void 0 ? _TAB_ALIGNMENTS$Strin : "left"
			};
		});
	};
	/**
	* Reads a border of a paragraph (`w:pBdr`), on one side.
	*/
	var readParagraphBorder = (element) => {
		var _stringOf, _numberOf;
		if (element === void 0) return;
		const attributes = attributesOf(element);
		const on = (name) => attributes[name] !== void 0 && !isOff(attributes[name]);
		return withoutUndefined({
			style: (_stringOf = stringOf(attributes["w:val"])) !== null && _stringOf !== void 0 ? _stringOf : "none",
			size: numberOf(attributes["w:sz"]),
			space: (_numberOf = numberOf(attributes["w:space"])) !== null && _numberOf !== void 0 ? _numberOf : 0,
			shadow: on("w:shadow"),
			frame: on("w:frame"),
			key: JSON.stringify(Object.entries(attributes).map(([name, value]) => [name, String(value)]).sort(([a], [b]) => a < b ? -1 : 1))
		});
	};
	/**
	* Reads paragraph properties (`w:pPr`).
	*/
	var readParagraphFormat = (element) => {
		var _valueOf;
		const children = childrenOf(element);
		const spacing = attributesOf(find(children, "w:spacing"));
		const indent = attributesOf(find(children, "w:ind"));
		const borders = childrenOf(find(children, "w:pBdr"));
		const twips = (...names) => names.map((name) => pointsOf(indent[name], 20)).find((value) => value !== void 0);
		const chars = (...names) => names.map((name) => numberOf(indent[name])).find((value) => value !== void 0);
		const automatic = (name) => spacing[name] === void 0 ? void 0 : !isOff(spacing[name]);
		const border = (...names) => names.map((name) => readParagraphBorder(find(borders, name))).find((value) => value !== void 0);
		const hanging = twips("w:hanging");
		const hangingChars = chars("w:hangingChars");
		return withoutUndefined({
			spaceBefore: pointsOf(spacing["w:before"], 20),
			spaceAfter: pointsOf(spacing["w:after"], 20),
			spaceBeforeLines: numberOf(spacing["w:beforeLines"]),
			spaceAfterLines: numberOf(spacing["w:afterLines"]),
			autoSpaceBefore: automatic("w:beforeAutospacing"),
			autoSpaceAfter: automatic("w:afterAutospacing"),
			lineSpacing: readLineSpacing(spacing),
			indentLeft: twips("w:start", "w:left"),
			indentRight: twips("w:end", "w:right"),
			firstLineIndent: hanging === void 0 ? twips("w:firstLine") : -hanging,
			indentLeftChars: chars("w:startChars", "w:leftChars"),
			indentRightChars: chars("w:endChars", "w:rightChars"),
			firstLineChars: hangingChars === void 0 ? chars("w:firstLineChars") : -hangingChars,
			borderTop: border("w:top"),
			borderBottom: border("w:bottom"),
			borderLeft: border("w:start", "w:left"),
			borderRight: border("w:end", "w:right"),
			borderBetween: border("w:between"),
			borderBar: border("w:bar"),
			contextualSpacing: onOff(children, "w:contextualSpacing"),
			keepNext: onOff(children, "w:keepNext"),
			keepLines: onOff(children, "w:keepLines"),
			pageBreakBefore: onOff(children, "w:pageBreakBefore"),
			widowControl: onOff(children, "w:widowControl"),
			tabs: readTabs(find(children, "w:tabs")),
			kinsoku: onOff(children, "w:kinsoku"),
			wordWrap: onOff(children, "w:wordWrap"),
			alignment: ALIGNMENTS[(_valueOf = valueOf(children, "w:jc")) !== null && _valueOf !== void 0 ? _valueOf : ""]
		});
	};
	/**
	* Reads the fonts of a document's theme (`a:theme`), once it is formatted.
	*/
	var readThemeFonts = (xml) => {
		const scheme = childrenOf(find(childrenOf(find(childrenOf(xml["a:theme"]), "a:themeElements")), "a:fontScheme"));
		const latin = (name) => attributesOf(find(childrenOf(find(scheme, name)), "a:latin")).typeface;
		return {
			headings: latin("a:majorFont"),
			body: latin("a:minorFont")
		};
	};
	/**
	* Reads the document's defaults and styles from its styles part (`w:styles`), once it is formatted, with the fonts of
	* its theme.
	*/
	var readTextStyles = (xml, themeFonts = OFFICE_THEME_FONTS) => {
		const root = childrenOf(xml["w:styles"]);
		const defaults = root.filter((child) => "w:docDefaults" in child).map((child) => childrenOf(child["w:docDefaults"]));
		const styles = root.filter((child) => "w:style" in child).map((child) => {
			var _stringOf2;
			const children = childrenOf(child["w:style"]);
			const attributes = attributesOf(child["w:style"]);
			const numbering = childrenOf(find(childrenOf(find(children, "w:pPr")), "w:numPr"));
			const list = attributesOf(find(numbering, "w:numId"))["w:val"];
			const level = numberOf(attributesOf(find(numbering, "w:ilvl"))["w:val"]);
			const name = valueOf(children, "w:name");
			return {
				id: stringOf(attributes["w:styleId"]),
				isDefault: attributes["w:default"] !== void 0 && !isOff(attributes["w:default"]),
				definition: _objectSpread2(_objectSpread2(_objectSpread2({ type: (_stringOf2 = stringOf(attributes["w:type"])) !== null && _stringOf2 !== void 0 ? _stringOf2 : "paragraph" }, name === void 0 ? {} : { name }), {}, { basedOn: valueOf(children, "w:basedOn") }, list === void 0 && level === void 0 ? {} : { numbering: withoutUndefined({
					id: list === void 0 ? void 0 : String(list),
					level
				}) }), {}, {
					run: readRunFormat(find(children, "w:rPr"), themeFonts),
					paragraph: readParagraphFormat(find(children, "w:pPr"))
				}, attributes["w:type"] === "table" ? { cellMargins: readCellMargins(find(childrenOf(find(children, "w:tblPr")), "w:tblCellMar")) } : {})
			};
		}).filter((style) => style.id !== void 0);
		const defaultStyle = (type) => {
			var _styles$find;
			return (_styles$find = styles.find((style) => style.isDefault && style.definition.type === type)) === null || _styles$find === void 0 ? void 0 : _styles$find.id;
		};
		const byId = new Map(styles.map((style) => [style.id, style.definition]));
		return _objectSpread2({
			run: combine(defaults.map((children) => readRunFormat(find(childrenOf(find(children, "w:rPrDefault")), "w:rPr"), themeFonts))),
			paragraph: combine(defaults.map((children) => readParagraphFormat(find(childrenOf(find(children, "w:pPrDefault")), "w:pPr")))),
			styles: byId,
			defaultParagraphStyle: defaultStyle("paragraph"),
			defaultCharacterStyle: defaultStyle("character"),
			defaultTableStyle: defaultStyle("table"),
			themeFonts
		}, withoutUndefined({ unsupported: unknownLengthIn(xml) }));
	};
	/**
	* Reads the margins of a table's cells (`w:tblCellMar`), or of one cell (`w:tcMar`), in points.
	*/
	var readCellMargins = (element) => {
		const children = childrenOf(element);
		const side = (...names) => names.map((name) => pointsOf(attributesOf(find(children, name))["w:w"], 20)).find((value) => value !== void 0);
		return Object.fromEntries(Object.entries({
			top: side("w:top"),
			bottom: side("w:bottom"),
			left: side("w:start", "w:left"),
			right: side("w:end", "w:right")
		}).filter(([, value]) => value !== void 0));
	};
	var stylesRead = /* @__PURE__ */ new WeakMap();
	/**
	* The styles of the document being written, with the fonts of its theme, or Word's defaults when the context has no
	* document.
	*/
	var getTextStyles = (context) => {
		var _stylesRead$get;
		const { file } = context;
		const styles = file === null || file === void 0 ? void 0 : file.Styles;
		if (!styles) return WORD_DEFAULT_STYLES;
		const read = (_stylesRead$get = stylesRead.get(styles)) !== null && _stylesRead$get !== void 0 ? _stylesRead$get : readTextStyles(styles.prepForXml(READING_CONTEXT), readThemeFonts(file.Theme.prepForXml(READING_CONTEXT)));
		stylesRead.set(styles, read);
		return read;
	};
	/**
	* A style and the styles it is based on, from the one at the bottom to the style itself. A style that isn't of the
	* given type, or that is based on itself, ends the chain.
	*/
	var styleChain = ({ styles }, id, type) => {
		const walk = (current, seen) => {
			const style = current === void 0 || seen.has(current) ? void 0 : styles.get(current);
			return (style === null || style === void 0 ? void 0 : style.type) === type ? [...walk(style.basedOn, /* @__PURE__ */ new Set([...seen, current])), style] : [];
		};
		return walk(id, /* @__PURE__ */ new Set());
	};
	/**
	* The parts of run formatting that change the font text is measured in.
	*/
	var fontOf = ({ font, size, bold, italic, characterSpacing, scale }) => withoutUndefined({
		font,
		size,
		bold,
		italic,
		characterSpacing,
		scale
	});
	/**
	* Which of a run's fonts Word draws a character in: the font for complex scripts, in their size, boldness and italics, for
	* all of a run that is right to left or of a complex script; the East Asian font for Chinese, Japanese and Korean; the
	* run's font for the rest. Hebrew in a run that isn't right to left is in the run's size, as Word lays it out. A mark is
	* drawn in the font of the character it is on.
	*/
	var slotOf = (character, previous, complexRun) => {
		if (complexRun) return "complex";
		if (isEastAsian(character)) return "eastAsian";
		return new RegExp("\\p{M}", "u").test(character) ? previous : "latin";
	};
	var FALLBACK_EAST_ASIAN_FONT = "MS Mincho";
	/**
	* The font of a character of a run, by the run's font Word draws it in. Complex scripts have their own size, boldness and
	* italics, and Word's defaults where the run doesn't give them.
	*/
	var fontOfSlot = (format, slot) => {
		const font = fontOf(format);
		if (slot === "latin") return font;
		const { eastAsiaFont, complexScriptFont, complexScriptSize, complexScriptBold, complexScriptItalic } = format;
		return slot === "eastAsian" ? _objectSpread2(_objectSpread2({}, font), {}, { font: isEastAsianFont(eastAsiaFont) ? eastAsiaFont : FALLBACK_EAST_ASIAN_FONT }) : withoutUndefined(_objectSpread2(_objectSpread2({}, font), {}, {
			font: complexScriptFont,
			size: complexScriptSize,
			bold: complexScriptBold,
			italic: complexScriptItalic
		}));
	};
	/**
	* A span of text in its formatting: in the run's font for its script, capitals for all caps, and smaller capitals for the
	* small letters of small caps.
	*/
	var spansOf = (text, format) => {
		const { allCaps, smallCaps, hidden, rightToLeft, complexScript } = format;
		if (hidden) return [];
		const complexRun = rightToLeft === true || complexScript === true;
		return [...text].reduce((all, character) => {
			var _last$slot;
			const last = all[all.length - 1];
			const slot = slotOf(character, (_last$slot = last === null || last === void 0 ? void 0 : last.slot) !== null && _last$slot !== void 0 ? _last$slot : "latin", complexRun);
			return (last === null || last === void 0 ? void 0 : last.slot) === slot ? [...all.slice(0, -1), {
				slot,
				text: last.text + character
			}] : [...all, {
				slot,
				text: character
			}];
		}, []).flatMap(({ slot, text: part }) => {
			var _font$size;
			const font = fontOfSlot(format, slot);
			if (allCaps || !smallCaps) return [_objectSpread2(_objectSpread2({}, font), {}, { text: allCaps ? part.toUpperCase() : part })];
			const small = _objectSpread2(_objectSpread2({}, font), {}, { size: ((_font$size = font.size) !== null && _font$size !== void 0 ? _font$size : 10) * SMALL_CAPS_SCALE });
			return part.split(new RegExp("(\\p{Ll}+)", "u")).filter((piece) => piece.length > 0).map((piece) => new RegExp("^\\p{Ll}", "u").test(piece) ? _objectSpread2(_objectSpread2({}, small), {}, { text: piece.toUpperCase() }) : _objectSpread2(_objectSpread2({}, font), {}, { text: piece }));
		});
	};
	/**
	* Whether a paragraph in the default style, without formatting of its own, has space before or after it.
	*/
	var hasDefaultParagraphSpacing = (styles) => {
		const { spaceBefore = 0, spaceAfter = 0 } = combine([styles.paragraph, ...styleChain(styles, styles.defaultParagraphStyle, "paragraph").map(({ paragraph }) => paragraph)]);
		return spaceBefore !== 0 || spaceAfter !== 0;
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
	//#region src/shapes/shape-floating.ts
	/**
	* Floating shapes whose size or position is a percentage of the page, its margins or the space between them
	* (`wp14:sizeRelH`, `wp14:sizeRelV`, `wp14:pctPosHOffset` and `wp14:pctPosVOffset`), which Word keeps as percentages
	* when the page changes.
	*
	* Reference: [MS-ODRAWXML] 2.3.2, the wordprocessingDrawing 2010 schema
	*
	* @module
	*/
	var _excluded = [
		"horizontalPosition",
		"verticalPosition",
		"sizeRelativeTo"
	];
	/**
	* The sizes, in pixels, of the areas of the library's default page, A4 with 1-inch margins, which a percentage size or
	* offset is written with for applications that don't read percentages.
	*/
	var PAGE = {
		width: 11906 / 15,
		height: 16838 / 15,
		margin: 96
	};
	var BETWEEN_MARGINS = {
		width: PAGE.width - 2 * PAGE.margin,
		height: PAGE.height - 2 * PAGE.margin
	};
	var WIDTH_BASES = {
		betweenMargins: ["margin", BETWEEN_MARGINS.width],
		page: ["page", PAGE.width],
		leftMargin: ["leftMargin", PAGE.margin],
		rightMargin: ["rightMargin", PAGE.margin],
		insideMargin: ["insideMargin", PAGE.margin],
		outsideMargin: ["outsideMargin", PAGE.margin]
	};
	var HEIGHT_BASES = {
		betweenMargins: ["margin", BETWEEN_MARGINS.height],
		page: ["page", PAGE.height],
		topMargin: ["topMargin", PAGE.margin],
		bottomMargin: ["bottomMargin", PAGE.margin],
		insideMargin: ["insideMargin", PAGE.margin],
		outsideMargin: ["outsideMargin", PAGE.margin]
	};
	var POSITION_BASES = {
		[docx.HorizontalPositionRelativeFrom.MARGIN]: BETWEEN_MARGINS.width,
		[docx.HorizontalPositionRelativeFrom.PAGE]: PAGE.width,
		[docx.HorizontalPositionRelativeFrom.LEFT_MARGIN]: PAGE.margin,
		[docx.HorizontalPositionRelativeFrom.RIGHT_MARGIN]: PAGE.margin,
		[docx.HorizontalPositionRelativeFrom.INSIDE_MARGIN]: PAGE.margin,
		[docx.HorizontalPositionRelativeFrom.OUTSIDE_MARGIN]: PAGE.margin
	};
	var VERTICAL_POSITION_BASES = {
		[docx.VerticalPositionRelativeFrom.MARGIN]: BETWEEN_MARGINS.height,
		[docx.VerticalPositionRelativeFrom.PAGE]: PAGE.height,
		[docx.VerticalPositionRelativeFrom.TOP_MARGIN]: PAGE.margin,
		[docx.VerticalPositionRelativeFrom.BOTTOM_MARGIN]: PAGE.margin,
		[docx.VerticalPositionRelativeFrom.INSIDE_MARGIN]: PAGE.margin,
		[docx.VerticalPositionRelativeFrom.OUTSIDE_MARGIN]: PAGE.margin
	};
	var EMUS_PER_PIXEL$6 = 9525;
	/**
	* Reads a percentage, such as `"50%"`, as a number, such as 50.
	*
	* @returns The number, or nothing if the value is a number of pixels or EMUs
	* @throws If the value is a percentage that isn't a number of 0 or more
	*/
	var percentageOf = (value, option) => {
		if (typeof value === "number" || !value.endsWith("%")) return;
		const percentage = Number(value.slice(0, -1));
		if (!(value.length > 1 && percentage >= 0)) throw new Error(`Invalid ${option} "${value}". Expected a percentage of 0 or more, such as "50%"`);
		return percentage;
	};
	/**
	* The size, in pixels, of what a floating shape's percentage width and height are percentages of, on the library's
	* default page.
	*/
	var relativeSizeBase = (floating) => {
		var _floating$sizeRelativ, _floating$sizeRelativ2, _floating$sizeRelativ3, _floating$sizeRelativ4;
		return {
			width: WIDTH_BASES[(_floating$sizeRelativ = (_floating$sizeRelativ2 = floating.sizeRelativeTo) === null || _floating$sizeRelativ2 === void 0 ? void 0 : _floating$sizeRelativ2.width) !== null && _floating$sizeRelativ !== void 0 ? _floating$sizeRelativ : "betweenMargins"][1],
			height: HEIGHT_BASES[(_floating$sizeRelativ3 = (_floating$sizeRelativ4 = floating.sizeRelativeTo) === null || _floating$sizeRelativ4 === void 0 ? void 0 : _floating$sizeRelativ4.height) !== null && _floating$sizeRelativ3 !== void 0 ? _floating$sizeRelativ3 : "betweenMargins"][1]
		};
	};
	/**
	* An offset in EMUs, for a position given as a percentage: the percentage of the base on the library's default page.
	*
	* @throws If the percentage is of a base it can't be of, such as a column
	*/
	var offsetOf$1 = (offset, relative, bases) => {
		const percentage = offset === void 0 ? void 0 : percentageOf(offset, "offset");
		if (percentage === void 0) return offset;
		if (!(relative in bases)) throw new Error(`Invalid offset "${offset}". A percentage offset needs a position relative to the page, the space between its margins, or one of its margins`);
		return Math.round(bases[relative] * percentage / 100 * EMUS_PER_PIXEL$6);
	};
	/**
	* The floating options for a drawing, with percentage offsets turned into EMUs, as they are on the library's default page.
	*
	* @throws If a percentage offset is of a base it can't be of, such as a column
	*/
	var toImageFloating = (_ref) => {
		var _horizontalPosition$r, _verticalPosition$rel;
		let { horizontalPosition, verticalPosition, sizeRelativeTo: _ } = _ref;
		return _objectSpread2(_objectSpread2({}, _objectWithoutProperties(_ref, _excluded)), {}, {
			horizontalPosition: _objectSpread2(_objectSpread2({}, horizontalPosition), {}, { offset: offsetOf$1(horizontalPosition.offset, (_horizontalPosition$r = horizontalPosition.relative) !== null && _horizontalPosition$r !== void 0 ? _horizontalPosition$r : docx.HorizontalPositionRelativeFrom.PAGE, POSITION_BASES) }),
			verticalPosition: _objectSpread2(_objectSpread2({}, verticalPosition), {}, { offset: offsetOf$1(verticalPosition.offset, (_verticalPosition$rel = verticalPosition.relative) !== null && _verticalPosition$rel !== void 0 ? _verticalPosition$rel : docx.VerticalPositionRelativeFrom.PAGE, VERTICAL_POSITION_BASES) })
		});
	};
	var thousandths = (percentage) => percentage === void 0 ? void 0 : Math.round(percentage * 1e3);
	/**
	* A position with a percentage offset, for applications that read the Word 2010 drawing extensions, and its offset in
	* EMUs for those that don't, as Word writes a position that older versions can't read.
	*/
	var withPercentage = ([attributes, offset], name, percentage) => [attributes, { "mc:AlternateContent": [{ "mc:Choice": [{ _attr: { Requires: "wp14" } }, { [name]: [`${percentage}`] }] }, { "mc:Fallback": [offset] }] }];
	/**
	* Adds the percentages to a formatted drawing: offsets in place of the positions' offsets, and sizes after the graphic,
	* where Word writes them.
	*/
	var addPercentages = (xml, { width, height, horizontal, vertical }) => {
		const anchor = (children) => [
			...children.map((child) => {
				if ("wp:positionH" in child && horizontal !== void 0) return { "wp:positionH": withPercentage(child["wp:positionH"], "wp14:pctPosHOffset", horizontal) };
				return "wp:positionV" in child && vertical !== void 0 ? { "wp:positionV": withPercentage(child["wp:positionV"], "wp14:pctPosVOffset", vertical) } : child;
			}),
			...width ? [{ "wp14:sizeRelH": [{ _attr: { relativeFrom: width.relativeFrom } }, { "wp14:pctWidth": [`${width.percentage}`] }] }] : [],
			...height ? [{ "wp14:sizeRelV": [{ _attr: { relativeFrom: height.relativeFrom } }, { "wp14:pctHeight": [`${height.percentage}`] }] }] : []
		];
		const [floating] = xml["w:drawing"];
		return { "w:drawing": [{ "wp:anchor": anchor(floating["wp:anchor"]) }] };
	};
	/**
	* A floating drawing with a percentage size or position.
	*/
	var RelativeDrawing = class extends docx.XmlComponent {
		constructor(drawing, placement) {
			super("w:drawing");
			_defineProperty(this, "drawing", void 0);
			_defineProperty(this, "placement", void 0);
			this.drawing = drawing;
			this.placement = placement;
		}
		prepForXml(context) {
			return addPercentages(this.drawing.prepForXml(context), this.placement);
		}
	};
	/**
	* Writes a floating drawing's percentage size and position, if it has any, so Word keeps them as percentages.
	*
	* @param drawing - The drawing, with its size and position in pixels and EMUs on the library's default page
	* @param size - The width and height the shape was given
	*/
	var withRelativePlacement = (drawing, floating, size) => {
		var _floating$sizeRelativ5, _floating$sizeRelativ6, _floating$sizeRelativ7, _floating$sizeRelativ8;
		if (!floating) return drawing;
		const widthPercentage = percentageOf(size.width, "width");
		const heightPercentage = percentageOf(size.height, "height");
		const placement = {
			width: widthPercentage === void 0 ? void 0 : {
				relativeFrom: WIDTH_BASES[(_floating$sizeRelativ5 = (_floating$sizeRelativ6 = floating.sizeRelativeTo) === null || _floating$sizeRelativ6 === void 0 ? void 0 : _floating$sizeRelativ6.width) !== null && _floating$sizeRelativ5 !== void 0 ? _floating$sizeRelativ5 : "betweenMargins"][0],
				percentage: thousandths(widthPercentage)
			},
			height: heightPercentage === void 0 ? void 0 : {
				relativeFrom: HEIGHT_BASES[(_floating$sizeRelativ7 = (_floating$sizeRelativ8 = floating.sizeRelativeTo) === null || _floating$sizeRelativ8 === void 0 ? void 0 : _floating$sizeRelativ8.height) !== null && _floating$sizeRelativ7 !== void 0 ? _floating$sizeRelativ7 : "betweenMargins"][0],
				percentage: thousandths(heightPercentage)
			},
			horizontal: thousandths(floating.horizontalPosition.offset === void 0 ? void 0 : percentageOf(floating.horizontalPosition.offset, "offset")),
			vertical: thousandths(floating.verticalPosition.offset === void 0 ? void 0 : percentageOf(floating.verticalPosition.offset, "offset"))
		};
		return Object.values(placement).every((value) => value === void 0) ? drawing : new RelativeDrawing(drawing, placement);
	};
	//#endregion
	//#region src/shapes/shape-text-styles.ts
	/**
	* Reads the text and formatting of a shape's paragraphs, as the document's styles format them. Not part of the public
	* API.
	*
	* The formatting is read as it is written, with the readers docx/shapes shares with docx/layout.
	*
	* @module
	*/
	var componentChildren = (component) => component.root;
	/**
	* The text of a run, with tabs as `"\t"` and line breaks as `"\n"`, and its own formatting and character style.
	*/
	var readRun = (run, themeFonts) => {
		const children = run.prepForXml(READING_CONTEXT)["w:r"];
		const properties = find(children, "w:rPr");
		return {
			text: children.map((child) => {
				if ("w:t" in child) return child["w:t"].filter((part) => typeof part === "string").join("");
				if ("w:tab" in child) return "	";
				return "w:br" in child || "w:cr" in child ? "\n" : "";
			}).join(""),
			format: readRunFormat(properties, themeFonts),
			style: valueOf(childrenOf(properties), "w:rStyle")
		};
	};
	/**
	* The text runs in a paragraph, including those in hyperlinks. Pictures, shapes and other runs without text are left out.
	*/
	var runsIn = (children) => children.flatMap((child) => {
		if (child instanceof docx.TextRun) {
			var _child$writtenAs;
			return ((_child$writtenAs = child.writtenAs) !== null && _child$writtenAs !== void 0 ? _child$writtenAs : [child]).filter((part) => part instanceof docx.TextRun || part.constructor === docx.Run);
		}
		if (child instanceof docx.ExternalHyperlink) return runsIn(child.options.children);
		return child instanceof docx.XmlComponent && !(child instanceof docx.Run) ? runsIn(componentChildren(child)) : [];
	});
	/**
	* Reads a paragraph's text and formatting, as the document's styles format it.
	*/
	var readParagraph = (paragraph, styles) => {
		var _properties$prepForXm, _valueOf;
		const [properties, ...children] = componentChildren(paragraph);
		const propertyChildren = childrenOf((_properties$prepForXm = properties.prepForXml(READING_CONTEXT)) === null || _properties$prepForXm === void 0 ? void 0 : _properties$prepForXm["w:pPr"]);
		const style = (_valueOf = valueOf(propertyChildren, "w:pStyle")) !== null && _valueOf !== void 0 ? _valueOf : styles.defaultParagraphStyle;
		const paragraphStyles = styleChain(styles, style, "paragraph");
		const paragraphRun = combine([styles.run, ...paragraphStyles.map(({ run }) => run)]);
		return {
			spans: runsIn(children).flatMap((run) => {
				const { text, format, style: runStyle } = readRun(run, styles.themeFonts);
				const characterStyles = styleChain(styles, runStyle !== null && runStyle !== void 0 ? runStyle : styles.defaultCharacterStyle, "character");
				return spansOf(text, combine([
					paragraphRun,
					...characterStyles.map(({ run: styleRun }) => styleRun),
					format
				]));
			}),
			font: fontOf(combine([paragraphRun, readRunFormat(find(propertyChildren, "w:rPr"), styles.themeFonts)])),
			format: combine([
				styles.paragraph,
				...paragraphStyles.map(({ paragraph: format }) => format),
				readParagraphFormat(propertyChildren)
			]),
			style
		};
	};
	/**
	* Reads the text and formatting of a shape's paragraphs, as the document's styles format them.
	*/
	var readTextParagraphs = (paragraphs, styles) => paragraphs.map((paragraph) => readParagraph(paragraph, styles));
	//#endregion
	//#region src/shapes/connector/shape-guides.ts
	var ANGLE_UNITS_PER_RADIAN = 108e5 / Math.PI;
	var FULL_CIRCLE = 216e5;
	var OPERATORS = new Map(Object.entries({
		"*/": (x, y, z) => x * y / z,
		"+-": (x, y, z) => x + y - z,
		"+/": (x, y, z) => (x + y) / z,
		"?:": (x, y, z) => x > 0 ? y : z,
		abs: (x) => Math.abs(x),
		at2: (x, y) => Math.atan2(y, x) * ANGLE_UNITS_PER_RADIAN,
		cat2: (x, y, z) => x * Math.cos(Math.atan2(z, y)),
		cos: (x, y) => x * Math.cos(y / ANGLE_UNITS_PER_RADIAN),
		max: (x, y) => Math.max(x, y),
		min: (x, y) => Math.min(x, y),
		mod: (x, y, z) => Math.sqrt(x * x + y * y + z * z),
		pin: (x, y, z) => {
			if (y < x) return x;
			return y > z ? z : y;
		},
		sat2: (x, y, z) => x * Math.sin(Math.atan2(z, y)),
		sin: (x, y) => x * Math.sin(y / ANGLE_UNITS_PER_RADIAN),
		sqrt: (x) => Math.sqrt(x),
		tan: (x, y) => x * Math.tan(y / ANGLE_UNITS_PER_RADIAN),
		val: (x) => x
	}));
	/**
	* The value of a built-in guide, such as `w` (the width), `hc` (the horizontal centre),
	* `wd4` (a quarter of the width) or `3cd4` (three quarters of a circle).
	*/
	var builtInGuide = (name, width, height) => {
		const fixed = /* @__PURE__ */ new Map([
			["w", width],
			["h", height],
			["l", 0],
			["t", 0],
			["r", width],
			["b", height],
			["hc", width / 2],
			["vc", height / 2],
			["ss", Math.min(width, height)],
			["ls", Math.max(width, height)]
		]);
		if (fixed.has(name)) return fixed.get(name);
		const fraction = /^(wd|hd|ssd)(\d+)$/.exec(name);
		if (fraction) return {
			wd: width,
			hd: height,
			ssd: Math.min(width, height)
		}[fraction[1]] / Number(fraction[2]);
		const circle = /^(\d*)cd(\d+)$/.exec(name);
		return circle ? Number(circle[1] || 1) * FULL_CIRCLE / Number(circle[2]) : void 0;
	};
	/**
	* Evaluates a shape definition's guides for a shape of the given size, in EMUs.
	*
	* @param adjustments - Adjustment guide values (such as `{ adj: 25000 }`) that replace the defaults
	* @returns A function that gives the value of a guide name, built-in guide or number
	* @throws If a formula uses an unknown operator or guide
	*/
	var evaluateShapeGuides = ({ defaults = {}, guides }, width, height, adjustments = {}) => {
		const values = new Map(Object.entries(_objectSpread2(_objectSpread2({}, defaults), adjustments)));
		const value = (token) => {
			var _values$get;
			if (/^-?\d+$/.test(token)) return Number(token);
			const result = (_values$get = values.get(token)) !== null && _values$get !== void 0 ? _values$get : builtInGuide(token, width, height);
			if (result === void 0) throw new Error(`Unknown shape guide "${token}"`);
			return result;
		};
		for (const guide of guides ? guides.split("; ") : []) {
			const [name, operatorName, ...args] = guide.split(" ");
			const operator = OPERATORS.get(operatorName);
			if (!operator) throw new Error(`Unknown shape guide operator "${operatorName}"`);
			const [x = 0, y = 0, z = 0] = args.map(value);
			values.set(name, operator(x, y, z));
		}
		return value;
	};
	//#endregion
	//#region src/shapes/preset-shape/preset-shape-geometry.ts
	var PRESET_SHAPE_GEOMETRY = {
		line: { sites: "cd4 l t; 3cd4 r b" },
		inverseLine: { sites: "cd4 l b; 3cd4 r t" },
		elbowConnector: { defaults: { adj1: 5e4 } },
		elbowConnectorThreeBends: { defaults: {
			adj1: 5e4,
			adj2: 5e4
		} },
		elbowConnectorFourBends: { defaults: {
			adj1: 5e4,
			adj2: 5e4,
			adj3: 5e4
		} },
		curvedConnector: { defaults: { adj1: 5e4 } },
		curvedConnectorThreeBends: { defaults: {
			adj1: 5e4,
			adj2: 5e4
		} },
		curvedConnectorFourBends: { defaults: {
			adj1: 5e4,
			adj2: 5e4,
			adj3: 5e4
		} },
		triangle: {
			defaults: { adj: 5e4 },
			guides: "a pin 0 adj 100000; x1 */ w a 200000; x2 */ w a 100000; x3 +- x1 wd2 0",
			sites: "3cd4 x2 t; cd2 x1 vc; cd4 l b; cd4 x2 b; cd4 r b; 0 x3 vc",
			text: "x1 vc x3 b"
		},
		rightTriangle: {
			guides: "it */ h 7 12; ir */ w 7 12; ib */ h 11 12",
			sites: "3cd4 l t; cd2 l vc; cd4 l b; cd4 hc b; cd4 r b; 0 hc vc",
			text: "wd12 it ir ib"
		},
		diamond: {
			guides: "ir */ w 3 4; ib */ h 3 4",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "wd4 hd4 ir ib"
		},
		parallelogram: {
			defaults: { adj: 25e3 },
			guides: "maxAdj */ 100000 w ss; a pin 0 adj maxAdj; x1 */ ss a 200000; x2 */ ss a 100000; x6 +- r 0 x1; x5 +- r 0 x2; x3 */ x5 1 2; x4 +- r 0 x3; il */ wd2 a maxAdj; q1 */ 5 a maxAdj; q2 +/ 1 q1 12; il */ q2 w 1; it */ q2 h 1; ir +- r 0 il; ib +- b 0 it; q3 */ h hc x2; y1 pin 0 q3 h; y2 +- b 0 y1",
			sites: "3cd4 hc y2; 3cd4 x4 t; 0 x6 vc; cd4 x3 b; cd4 hc y1; cd2 x1 vc",
			text: "il it ir ib"
		},
		trapezoid: {
			defaults: { adj: 25e3 },
			guides: "maxAdj */ 50000 w ss; a pin 0 adj maxAdj; x1 */ ss a 200000; x4 +- r 0 x1; il */ wd3 a maxAdj; it */ hd3 a maxAdj; ir +- r 0 il",
			sites: "3cd4 hc t; cd2 x1 vc; cd4 hc b; 0 x4 vc",
			text: "il it ir b"
		},
		nonIsoscelesTrapezoid: {
			defaults: {
				adj1: 25e3,
				adj2: 25e3
			},
			guides: "maxAdj */ 50000 w ss; a1 pin 0 adj1 maxAdj; a2 pin 0 adj2 maxAdj; x1 */ ss a1 200000; dx3 */ ss a2 100000; x3 +- r 0 dx3; x4 +/ r x3 2; il */ wd3 a1 maxAdj; adjm max a1 a2; it */ hd3 adjm maxAdj; irt */ wd3 a2 maxAdj; ir +- r 0 irt",
			sites: "0 x4 vc; cd4 hc b; cd2 x1 vc; 3cd4 hc t",
			text: "il it ir b"
		},
		pentagon: {
			defaults: {
				hf: 105146,
				vf: 110557
			},
			guides: "swd2 */ wd2 hf 100000; shd2 */ hd2 vf 100000; svc */ vc vf 100000; dx1 cos swd2 1080000; dx2 cos swd2 18360000; dy1 sin shd2 1080000; dy2 sin shd2 18360000; x1 +- hc 0 dx1; x2 +- hc 0 dx2; x3 +- hc dx2 0; x4 +- hc dx1 0; y1 +- svc 0 dy1; y2 +- svc 0 dy2; it */ y1 dx2 dx1",
			sites: "3cd4 hc t; cd2 x1 y1; cd4 x2 y2; cd4 hc b; cd4 x3 y2; 0 x4 y1",
			text: "x2 it x3 y2"
		},
		hexagon: {
			defaults: {
				adj: 25e3,
				vf: 115470
			},
			guides: "maxAdj */ 50000 w ss; a pin 0 adj maxAdj; shd2 */ hd2 vf 100000; x1 */ ss a 100000; x2 +- r 0 x1; dy1 sin shd2 3600000; y1 +- vc 0 dy1; y2 +- vc dy1 0; q1 */ maxAdj -1 2; q2 +- a q1 0; q3 ?: q2 4 2; q4 ?: q2 3 2; q5 ?: q2 q1 0; q6 +/ a q5 q1; q7 */ q6 q4 -1; q8 +- q3 q7 0; il */ w q8 24; it */ h q8 24; ir +- r 0 il; ib +- b 0 it",
			sites: "0 r vc; cd4 x2 y2; cd4 x1 y2; cd2 l vc; 3cd4 x1 y1; 3cd4 x2 y1",
			text: "il it ir ib"
		},
		heptagon: {
			defaults: {
				hf: 102572,
				vf: 105210
			},
			guides: "swd2 */ wd2 hf 100000; shd2 */ hd2 vf 100000; svc */ vc vf 100000; dx1 */ swd2 97493 100000; dx2 */ swd2 78183 100000; dx3 */ swd2 43388 100000; dy1 */ shd2 62349 100000; dy2 */ shd2 22252 100000; dy3 */ shd2 90097 100000; x1 +- hc 0 dx1; x2 +- hc 0 dx2; x3 +- hc 0 dx3; x4 +- hc dx3 0; x5 +- hc dx2 0; x6 +- hc dx1 0; y1 +- svc 0 dy1; y2 +- svc dy2 0; y3 +- svc dy3 0; ib +- b 0 y1",
			sites: "0 x5 y1; 0 x6 y2; cd4 x4 y3; cd4 x3 y3; cd2 x1 y2; cd2 x2 y1; 3cd4 hc t",
			text: "x2 y1 x5 ib"
		},
		octagon: {
			defaults: { adj: 29289 },
			guides: "a pin 0 adj 50000; x1 */ ss a 100000; x2 +- r 0 x1; y2 +- b 0 x1; il */ x1 1 2; ir +- r 0 il; ib +- b 0 il",
			sites: "0 r x1; 0 r y2; cd4 x2 b; cd4 x1 b; cd2 l y2; cd2 l x1; 3cd4 x1 t; 3cd4 x2 t",
			text: "il il ir ib"
		},
		decagon: {
			defaults: { vf: 105146 },
			guides: "shd2 */ hd2 vf 100000; dx1 cos wd2 2160000; dx2 cos wd2 4320000; x1 +- hc 0 dx1; x2 +- hc 0 dx2; x3 +- hc dx2 0; x4 +- hc dx1 0; dy1 sin shd2 4320000; dy2 sin shd2 2160000; y1 +- vc 0 dy1; y2 +- vc 0 dy2; y3 +- vc dy2 0; y4 +- vc dy1 0",
			sites: "0 x4 y2; 0 r vc; 0 x4 y3; cd4 x3 y4; cd4 x2 y4; cd2 x1 y3; cd2 l vc; cd2 x1 y2; 3cd4 x2 y1; 3cd4 x3 y1",
			text: "x1 y2 x4 y3"
		},
		dodecagon: {
			guides: "x1 */ w 2894 21600; x2 */ w 7906 21600; x3 */ w 13694 21600; x4 */ w 18706 21600; y1 */ h 2894 21600; y2 */ h 7906 21600; y3 */ h 13694 21600; y4 */ h 18706 21600",
			sites: "0 x4 y1; 0 r y2; 0 r y3; 0 x4 y4; cd4 x3 b; cd4 x2 b; cd2 x1 y4; cd2 l y3; cd2 l y2; cd2 x1 y1; 3cd4 x2 t; 3cd4 x3 t",
			text: "x1 y1 x4 y4"
		},
		ellipse: {
			guides: "idx cos wd2 2700000; idy sin hd2 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "3cd4 hc t; 3cd4 il it; cd2 l vc; cd4 il ib; cd4 hc b; cd4 ir ib; 0 r vc; 3cd4 ir it",
			text: "il it ir ib"
		},
		teardrop: {
			defaults: { adj: 1e5 },
			guides: "a pin 0 adj 200000; r2 sqrt 2; tw */ wd2 r2 1; th */ hd2 r2 1; sw */ tw a 100000; sh */ th a 100000; dx1 cos sw 2700000; dy1 sin sh 2700000; x1 +- hc dx1 0; y1 +- vc 0 dy1; idx cos wd2 2700000; idy sin hd2 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "0 r vc; cd4 ir ib; cd4 hc b; cd4 il ib; cd2 l vc; 3cd4 il it; 3cd4 hc t; 3cd4 x1 y1",
			text: "il it ir ib"
		},
		pieWedge: {
			guides: "g1 cos w 13500000; g2 sin h 13500000; x1 +- r g1 0; y1 +- b g2 0",
			sites: "0 r vc; cd4 hc b",
			text: "x1 y1 r b"
		},
		pie: {
			defaults: {
				adj1: 0,
				adj2: 162e5
			},
			guides: "idx cos wd2 2700000; idy sin hd2 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t",
			text: "il ir it ib"
		},
		blockArc: {
			defaults: {
				adj1: 108e5,
				adj2: 0,
				adj3: 25e3
			},
			guides: "stAng pin 0 adj1 21599999; istAng pin 0 adj2 21599999; a3 pin 0 adj3 50000; sw11 +- istAng 0 stAng; sw12 +- sw11 21600000 0; swAng ?: sw11 sw11 sw12; wt1 sin wd2 stAng; ht1 cos hd2 stAng; wt3 sin wd2 istAng; ht3 cos hd2 istAng; dx1 cat2 wd2 ht1 wt1; dy1 sat2 hd2 ht1 wt1; dx3 cat2 wd2 ht3 wt3; dy3 sat2 hd2 ht3 wt3; x1 +- hc dx1 0; y1 +- vc dy1 0; x3 +- hc dx3 0; y3 +- vc dy3 0; dr */ ss a3 100000; iwd2 +- wd2 0 dr; ihd2 +- hd2 0 dr; wt2 sin iwd2 istAng; ht2 cos ihd2 istAng; wt4 sin iwd2 stAng; ht4 cos ihd2 stAng; dx2 cat2 iwd2 ht2 wt2; dy2 sat2 ihd2 ht2 wt2; dx4 cat2 iwd2 ht4 wt4; dy4 sat2 ihd2 ht4 wt4; x2 +- hc dx2 0; y2 +- vc dy2 0; x4 +- hc dx4 0; y4 +- vc dy4 0; sw0 +- 21600000 0 stAng; da1 +- swAng 0 sw0; g1 max x1 x2; g2 max x3 x4; g3 max g1 g2; ir ?: da1 r g3; sw1 +- cd4 0 stAng; sw2 +- 27000000 0 stAng; sw3 ?: sw1 sw1 sw2; da2 +- swAng 0 sw3; g5 max y1 y2; g6 max y3 y4; g7 max g5 g6; ib ?: da2 b g7; sw4 +- cd2 0 stAng; sw5 +- 32400000 0 stAng; sw6 ?: sw4 sw4 sw5; da3 +- swAng 0 sw6; g9 min x1 x2; g10 min x3 x4; g11 min g9 g10; il ?: da3 l g11; sw7 +- 3cd4 0 stAng; sw8 +- 37800000 0 stAng; sw9 ?: sw7 sw7 sw8; da4 +- swAng 0 sw9; g13 min y1 y2; g14 min y3 y4; g15 min g13 g14; it ?: da4 t g15; x5 +/ x1 x4 2; y5 +/ y1 y4 2; x6 +/ x3 x2 2; y6 +/ y3 y2 2; cang1 +- stAng 0 cd4; cang2 +- istAng cd4 0; cang3 +/ cang1 cang2 2",
			sites: "cang1 x5 y5; cang2 x6 y6; cang3 hc vc",
			text: "il it ir ib"
		},
		donut: {
			defaults: { adj: 25e3 },
			guides: "idx cos wd2 2700000; idy sin hd2 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "3cd4 hc t; 3cd4 il it; cd2 l vc; cd4 il ib; cd4 hc b; cd4 ir ib; 0 r vc; 3cd4 ir it",
			text: "il it ir ib"
		},
		noSymbol: {
			defaults: { adj: 18750 },
			guides: "idx cos wd2 2700000; idy sin hd2 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "3cd4 hc t; 3cd4 il it; cd2 l vc; cd4 il ib; cd4 hc b; cd4 ir ib; 0 r vc; 3cd4 ir it",
			text: "il it ir ib"
		},
		chord: {
			defaults: {
				adj1: 27e5,
				adj2: 162e5
			},
			guides: "stAng pin 0 adj1 21599999; enAng pin 0 adj2 21599999; sw1 +- enAng 0 stAng; sw2 +- sw1 21600000 0; swAng ?: sw1 sw1 sw2; wt1 sin wd2 stAng; ht1 cos hd2 stAng; dx1 cat2 wd2 ht1 wt1; dy1 sat2 hd2 ht1 wt1; wt2 sin wd2 enAng; ht2 cos hd2 enAng; dx2 cat2 wd2 ht2 wt2; dy2 sat2 hd2 ht2 wt2; x1 +- hc dx1 0; y1 +- vc dy1 0; x2 +- hc dx2 0; y2 +- vc dy2 0; x3 +/ x1 x2 2; y3 +/ y1 y2 2; midAng0 */ swAng 1 2; midAng +- stAng midAng0 cd2; idx cos wd2 2700000; idy sin hd2 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "stAng x1 y1; enAng x2 y2; midAng x3 y3",
			text: "il it ir ib"
		},
		arc: {
			defaults: {
				adj1: 162e5,
				adj2: 0
			},
			guides: "stAng pin 0 adj1 21599999; enAng pin 0 adj2 21599999; sw11 +- enAng 0 stAng; sw12 +- sw11 21600000 0; swAng ?: sw11 sw11 sw12; wt1 sin wd2 stAng; ht1 cos hd2 stAng; dx1 cat2 wd2 ht1 wt1; dy1 sat2 hd2 ht1 wt1; wt2 sin wd2 enAng; ht2 cos hd2 enAng; dx2 cat2 wd2 ht2 wt2; dy2 sat2 hd2 ht2 wt2; x1 +- hc dx1 0; y1 +- vc dy1 0; x2 +- hc dx2 0; y2 +- vc dy2 0; sw0 +- 21600000 0 stAng; da1 +- swAng 0 sw0; g1 max x1 x2; ir ?: da1 r g1; sw1 +- cd4 0 stAng; sw2 +- 27000000 0 stAng; sw3 ?: sw1 sw1 sw2; da2 +- swAng 0 sw3; g5 max y1 y2; ib ?: da2 b g5; sw4 +- cd2 0 stAng; sw5 +- 32400000 0 stAng; sw6 ?: sw4 sw4 sw5; da3 +- swAng 0 sw6; g9 min x1 x2; il ?: da3 l g9; sw7 +- 3cd4 0 stAng; sw8 +- 37800000 0 stAng; sw9 ?: sw7 sw7 sw8; da4 +- swAng 0 sw9; g13 min y1 y2; it ?: da4 t g13; cang1 +- stAng 0 cd4; cang2 +- enAng cd4 0; cang3 +/ cang1 cang2 2",
			sites: "cang1 x1 y1; cang3 hc vc; cang2 x2 y2",
			text: "il it ir ib"
		},
		frame: {
			defaults: { adj1: 12500 },
			guides: "a1 pin 0 adj1 50000; x1 */ ss a1 100000; x4 +- r 0 x1; y4 +- b 0 x1",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "x1 x1 x4 y4"
		},
		halfFrame: {
			defaults: {
				adj1: 33333,
				adj2: 33333
			},
			guides: "maxAdj2 */ 100000 w ss; a2 pin 0 adj2 maxAdj2; x1 */ ss a2 100000; g1 */ h x1 w; g2 +- h 0 g1; maxAdj1 */ 100000 g2 ss; a1 pin 0 adj1 maxAdj1; y1 */ ss a1 100000; dx2 */ y1 w h; x2 +- r 0 dx2; dy2 */ x1 h w; y2 +- b 0 dy2; cx1 */ x1 1 2; cy1 +/ y2 b 2; cx2 +/ x2 r 2; cy2 */ y1 1 2",
			sites: "0 cx2 cy2; cd4 cx1 cy1; cd2 l vc; 3cd4 hc t"
		},
		lShape: {
			defaults: {
				adj1: 5e4,
				adj2: 5e4
			},
			guides: "maxAdj1 */ 100000 h ss; maxAdj2 */ 100000 w ss; a1 pin 0 adj1 maxAdj1; a2 pin 0 adj2 maxAdj2; x1 */ ss a2 100000; dy1 */ ss a1 100000; y1 +- b 0 dy1; cx1 */ x1 1 2; cy1 +/ y1 b 2; d +- w 0 h; it ?: d y1 t; ir ?: d r x1",
			sites: "0 r cy1; cd4 hc b; cd2 l vc; 3cd4 cx1 t",
			text: "l it ir b"
		},
		diagonalStripe: {
			defaults: { adj: 5e4 },
			guides: "a pin 0 adj 100000; x2 */ w a 100000; x1 */ x2 1 2; x3 +/ x2 r 2; y2 */ h a 100000; y1 */ y2 1 2; y3 +/ y2 b 2",
			sites: "0 hc vc; cd2 l y3; cd2 x1 y1; 3cd4 x3 t",
			text: "l t x3 y3"
		},
		cross: {
			defaults: { adj: 25e3 },
			guides: "a pin 0 adj 50000; x1 */ ss a 100000; x2 +- r 0 x1; y2 +- b 0 x1; d +- w 0 h; il ?: d l x1; ir ?: d r x2; it ?: d x1 t; ib ?: d y2 b",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "il it ir ib"
		},
		plaque: {
			defaults: { adj: 16667 },
			guides: "a pin 0 adj 50000; x1 */ ss a 100000; il */ x1 70711 100000; ir +- r 0 il; ib +- b 0 il",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "il il ir ib"
		},
		cylinder: {
			defaults: { adj: 25e3 },
			guides: "maxAdj */ 50000 h ss; a pin 0 adj maxAdj; y1 */ ss a 200000; y2 +- y1 y1 0; y3 +- b 0 y1",
			sites: "3cd4 hc y2; 3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "l y2 r y3"
		},
		cube: {
			defaults: { adj: 25e3 },
			guides: "a pin 0 adj 100000; y1 */ ss a 100000; y4 +- b 0 y1; y2 */ y4 1 2; y3 +/ y1 b 2; x4 +- r 0 y1; x2 */ x4 1 2; x3 +/ y1 r 2",
			sites: "3cd4 x3 t; 3cd4 x2 y1; cd2 l y3; cd4 x2 b; 0 x4 y3; 0 r y2",
			text: "l y1 x4 b"
		},
		beveledRectangle: {
			defaults: { adj: 12500 },
			guides: "a pin 0 adj 50000; x1 */ ss a 100000; x2 +- r 0 x1; y2 +- b 0 x1",
			sites: "0 r vc; 0 x2 vc; cd4 hc b; cd4 hc y2; cd2 l vc; cd2 x1 vc; 3cd4 hc t; 3cd4 hc x1",
			text: "x1 x1 x2 y2"
		},
		foldedCorner: {
			defaults: { adj: 16667 },
			guides: "a pin 0 adj 50000; dy2 */ ss a 100000; y2 +- b 0 dy2",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "l t r y2"
		},
		smileyFace: {
			defaults: { adj: 4653 },
			guides: "idx cos wd2 2700000; idy sin hd2 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "3cd4 hc t; 3cd4 il it; cd2 l vc; cd4 il ib; cd4 hc b; cd4 ir ib; 0 r vc; 3cd4 ir it",
			text: "il it ir ib"
		},
		heart: {
			guides: "il */ w 1 6; ir */ w 5 6; ib */ h 2 3",
			sites: "3cd4 hc hd4; cd4 hc b",
			text: "il hd4 ir ib"
		},
		lightningBolt: {
			guides: "x1 */ w 5022 21600; x3 */ w 8472 21600; x4 */ w 8757 21600; x5 */ w 10012 21600; x8 */ w 12860 21600; x9 */ w 13917 21600; x11 */ w 16577 21600; y1 */ h 3890 21600; y2 */ h 6080 21600; y4 */ h 7437 21600; y6 */ h 9705 21600; y7 */ h 12007 21600; y10 */ h 14277 21600; y11 */ h 14915 21600",
			sites: "3cd4 x3 t; 3cd4 l y1; cd2 x1 y6; cd2 x5 y11; cd4 r b; 0 x11 y7; 0 x8 y2",
			text: "x4 y4 x9 y10"
		},
		sun: {
			defaults: { adj: 25e3 },
			guides: "a pin 12500 adj 46875; g0 +- 50000 0 a; g7 */ g0 23170 32768; g8 +- 50000 g7 0; g9 +- 50000 0 g7; x8 */ w g8 100000; x9 */ w g9 100000; y8 */ h g8 100000; y9 */ h g9 100000",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "x9 y9 x8 y8"
		},
		moon: {
			defaults: { adj: 5e4 },
			guides: "a pin 0 adj 87500; g0 */ ss a 100000; g0w */ g0 w ss; g12 */ g0 9598 32768; g12w */ g12 w ss; g13 +- ss 0 g12; q1 */ ss ss 1; q2 */ g13 g13 1; q3 +- q1 0 q2; q4 sqrt q3; dy4 */ q4 hd2 ss; g15h +- vc 0 dy4; g16h +- vc dy4 0",
			sites: "3cd4 r t; cd2 l vc; cd4 r b; 0 g0w vc",
			text: "g12w g15h g0w g16h"
		},
		cloud: {
			guides: "il */ w 2977 21600; it */ h 3262 21600; ir */ w 17087 21600; ib */ h 17337 21600; g27 */ w 67 21600; g28 */ h 21577 21600; g29 */ w 21582 21600; g30 */ h 1235 21600",
			sites: "0 g29 vc; cd4 hc g28; cd2 g27 vc; 3cd4 hc g30",
			text: "il it ir ib"
		},
		leftBracket: {
			defaults: { adj: 8333 },
			guides: "maxAdj */ 50000 h ss; a pin 0 adj maxAdj; y1 */ ss a 100000; dx1 cos w 2700000; dy1 sin y1 2700000; il +- r 0 dx1; it +- y1 0 dy1; ib +- b dy1 y1",
			sites: "cd4 r t; cd2 l vc; 3cd4 r b",
			text: "il it r ib"
		},
		rightBracket: {
			defaults: { adj: 8333 },
			guides: "maxAdj */ 50000 h ss; a pin 0 adj maxAdj; y1 */ ss a 100000; dx1 cos w 2700000; dy1 sin y1 2700000; ir +- l dx1 0; it +- y1 0 dy1; ib +- b dy1 y1",
			sites: "cd4 l t; 3cd4 l b; cd2 r vc",
			text: "l it ir ib"
		},
		leftBrace: {
			defaults: {
				adj1: 8333,
				adj2: 5e4
			},
			guides: "a2 pin 0 adj2 100000; q1 +- 100000 0 a2; q2 min q1 a2; q3 */ q2 1 2; maxAdj1 */ q3 h ss; a1 pin 0 adj1 maxAdj1; y1 */ ss a1 100000; y3 */ h a2 100000; dx1 cos wd2 2700000; dy1 sin y1 2700000; il +- r 0 dx1; it +- y1 0 dy1; ib +- b dy1 y1",
			sites: "cd4 r t; cd2 l y3; 3cd4 r b",
			text: "il it r ib"
		},
		rightBrace: {
			defaults: {
				adj1: 8333,
				adj2: 5e4
			},
			guides: "a2 pin 0 adj2 100000; q1 +- 100000 0 a2; q2 min q1 a2; q3 */ q2 1 2; maxAdj1 */ q3 h ss; a1 pin 0 adj1 maxAdj1; y1 */ ss a1 100000; y3 */ h a2 100000; dx1 cos wd2 2700000; dy1 sin y1 2700000; ir +- l dx1 0; it +- y1 0 dy1; ib +- b dy1 y1",
			sites: "cd4 l t; cd2 r y3; 3cd4 l b",
			text: "l it ir ib"
		},
		bracketPair: {
			defaults: { adj: 16667 },
			guides: "a pin 0 adj 50000; x1 */ ss a 100000; il */ x1 29289 100000; ir +- r 0 il; ib +- b 0 il",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "il il ir ib"
		},
		bracePair: {
			defaults: { adj: 8333 },
			guides: "a pin 0 adj 25000; x1 */ ss a 100000; it */ x1 29289 100000; il +- x1 it 0; ir +- r 0 il; ib +- b 0 it",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "il il ir ib"
		},
		rectangle: { sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc" },
		roundedRectangle: {
			defaults: { adj: 16667 },
			guides: "a pin 0 adj 50000; x1 */ ss a 100000; il */ x1 29289 100000; ir +- r 0 il; ib +- b 0 il",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "il il ir ib"
		},
		roundedCornerRectangle: {
			defaults: { adj: 16667 },
			guides: "a pin 0 adj 50000; dx1 */ ss a 100000; idx */ dx1 29289 100000; ir +- r 0 idx",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "l t ir b"
		},
		topRoundedCornersRectangle: {
			defaults: {
				adj1: 16667,
				adj2: 0
			},
			guides: "a1 pin 0 adj1 50000; a2 pin 0 adj2 50000; tx1 */ ss a1 100000; bx1 */ ss a2 100000; d +- tx1 0 bx1; tdx */ tx1 29289 100000; bdx */ bx1 29289 100000; il ?: d tdx bdx; ir +- r 0 il; ib +- b 0 bdx",
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t",
			text: "il tdx ir ib"
		},
		diagonalRoundedCornersRectangle: {
			defaults: {
				adj1: 16667,
				adj2: 0
			},
			guides: "a1 pin 0 adj1 50000; a2 pin 0 adj2 50000; x1 */ ss a1 100000; a */ ss a2 100000; dx1 */ x1 29289 100000; dx2 */ a 29289 100000; d +- dx1 0 dx2; dx ?: d dx1 dx2; ir +- r 0 dx; ib +- b 0 dx",
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t",
			text: "dx dx ir ib"
		},
		snippedCornerRectangle: {
			defaults: { adj: 16667 },
			guides: "a pin 0 adj 50000; dx1 */ ss a 100000; x1 +- r 0 dx1; it */ dx1 1 2; ir +/ x1 r 2",
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t",
			text: "l it ir b"
		},
		topSnippedCornersRectangle: {
			defaults: {
				adj1: 16667,
				adj2: 0
			},
			guides: "a1 pin 0 adj1 50000; a2 pin 0 adj2 50000; tx1 */ ss a1 100000; bx1 */ ss a2 100000; by1 +- b 0 bx1; d +- tx1 0 bx1; dx ?: d tx1 bx1; il */ dx 1 2; ir +- r 0 il; it */ tx1 1 2; ib +/ by1 b 2",
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t",
			text: "il it ir ib"
		},
		diagonalSnippedCornersRectangle: {
			defaults: {
				adj1: 0,
				adj2: 16667
			},
			guides: "a1 pin 0 adj1 50000; a2 pin 0 adj2 50000; lx1 */ ss a1 100000; rx1 */ ss a2 100000; d +- lx1 0 rx1; dx ?: d lx1 rx1; il */ dx 1 2; ir +- r 0 il; ib +- b 0 il",
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t",
			text: "il il ir ib"
		},
		roundedAndSnippedCornersRectangle: {
			defaults: {
				adj1: 16667,
				adj2: 16667
			},
			guides: "a1 pin 0 adj1 50000; a2 pin 0 adj2 50000; x1 */ ss a1 100000; dx2 */ ss a2 100000; x2 +- r 0 dx2; il */ x1 29289 100000; ir +/ x2 r 2",
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t",
			text: "il il ir b"
		},
		rightArrow: {
			defaults: {
				adj1: 5e4,
				adj2: 5e4
			},
			guides: "maxAdj2 */ 100000 w ss; a1 pin 0 adj1 100000; a2 pin 0 adj2 maxAdj2; dx1 */ ss a2 100000; x1 +- r 0 dx1; dy1 */ h a1 200000; y1 +- vc 0 dy1; y2 +- vc dy1 0; dx2 */ y1 dx1 hd2; x2 +- x1 dx2 0",
			sites: "3cd4 x1 t; cd2 l vc; cd4 x1 b; 0 r vc",
			text: "l y1 x2 y2"
		},
		leftArrow: {
			defaults: {
				adj1: 5e4,
				adj2: 5e4
			},
			guides: "maxAdj2 */ 100000 w ss; a1 pin 0 adj1 100000; a2 pin 0 adj2 maxAdj2; dx2 */ ss a2 100000; x2 +- l dx2 0; dy1 */ h a1 200000; y1 +- vc 0 dy1; y2 +- vc dy1 0; dx1 */ y1 dx2 hd2; x1 +- x2 0 dx1",
			sites: "3cd4 x2 t; cd2 l vc; cd4 x2 b; 0 r vc",
			text: "x1 y1 r y2"
		},
		upArrow: {
			defaults: {
				adj1: 5e4,
				adj2: 5e4
			},
			guides: "maxAdj2 */ 100000 h ss; a1 pin 0 adj1 100000; a2 pin 0 adj2 maxAdj2; dy2 */ ss a2 100000; y2 +- t dy2 0; dx1 */ w a1 200000; x1 +- hc 0 dx1; x2 +- hc dx1 0; dy1 */ x1 dy2 wd2; y1 +- y2 0 dy1",
			sites: "3cd4 hc t; cd2 l y2; cd4 hc b; 0 r y2",
			text: "x1 y1 x2 b"
		},
		downArrow: {
			defaults: {
				adj1: 5e4,
				adj2: 5e4
			},
			guides: "maxAdj2 */ 100000 h ss; a1 pin 0 adj1 100000; a2 pin 0 adj2 maxAdj2; dy1 */ ss a2 100000; y1 +- b 0 dy1; dx1 */ w a1 200000; x1 +- hc 0 dx1; x2 +- hc dx1 0; dy2 */ x1 dy1 wd2; y2 +- y1 dy2 0",
			sites: "3cd4 hc t; cd2 l y1; cd4 hc b; 0 r y1",
			text: "x1 t x2 y2"
		},
		leftRightArrow: {
			defaults: {
				adj1: 5e4,
				adj2: 5e4
			},
			guides: "maxAdj2 */ 50000 w ss; a1 pin 0 adj1 100000; a2 pin 0 adj2 maxAdj2; x2 */ ss a2 100000; x3 +- r 0 x2; dy */ h a1 200000; y1 +- vc 0 dy; y2 +- vc dy 0; dx1 */ y1 x2 hd2; x1 +- x2 0 dx1; x4 +- x3 dx1 0",
			sites: "0 r vc; cd4 x3 b; cd4 x2 b; cd2 l vc; 3cd4 x2 t; 3cd4 x3 t",
			text: "x1 y1 x4 y2"
		},
		upDownArrow: {
			defaults: {
				adj1: 5e4,
				adj2: 5e4
			},
			guides: "maxAdj2 */ 50000 h ss; a1 pin 0 adj1 100000; a2 pin 0 adj2 maxAdj2; y2 */ ss a2 100000; y3 +- b 0 y2; dx1 */ w a1 200000; x1 +- hc 0 dx1; x2 +- hc dx1 0; dy1 */ x1 y2 wd2; y1 +- y2 0 dy1; y4 +- y3 dy1 0",
			sites: "3cd4 hc t; cd2 l y2; cd2 x1 vc; cd2 l y3; cd4 hc b; 0 r y3; 0 x2 vc; 0 r y2",
			text: "x1 y1 x2 y4"
		},
		quadArrow: {
			defaults: {
				adj1: 22500,
				adj2: 22500,
				adj3: 22500
			},
			guides: "a2 pin 0 adj2 50000; maxAdj1 */ a2 2 1; a1 pin 0 adj1 maxAdj1; q1 +- 100000 0 maxAdj1; maxAdj3 */ q1 1 2; a3 pin 0 adj3 maxAdj3; x1 */ ss a3 100000; dx2 */ ss a2 100000; dx3 */ ss a1 200000; y3 +- vc 0 dx3; y4 +- vc dx3 0; il */ dx3 x1 dx2; ir +- r 0 il",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "il y3 ir y4"
		},
		leftRightUpArrow: {
			defaults: {
				adj1: 25e3,
				adj2: 25e3,
				adj3: 25e3
			},
			guides: "a2 pin 0 adj2 50000; maxAdj1 */ a2 2 1; a1 pin 0 adj1 maxAdj1; q1 +- 100000 0 maxAdj1; maxAdj3 */ q1 1 2; a3 pin 0 adj3 maxAdj3; x1 */ ss a3 100000; dx2 */ ss a2 100000; dx3 */ ss a1 200000; y4 +- b 0 dx2; y3 +- y4 0 dx3; y5 +- y4 dx3 0; il */ dx3 x1 dx2; ir +- r 0 il",
			sites: "3cd4 hc t; cd2 l y4; cd4 hc y5; 0 r y4",
			text: "il y3 ir y5"
		},
		bentArrow: {
			defaults: {
				adj1: 25e3,
				adj2: 25e3,
				adj3: 25e3,
				adj4: 43750
			},
			guides: "a2 pin 0 adj2 50000; maxAdj1 */ a2 2 1; a1 pin 0 adj1 maxAdj1; a3 pin 0 adj3 50000; th */ ss a1 100000; aw2 */ ss a2 100000; th2 */ th 1 2; dh2 +- aw2 0 th2; ah */ ss a3 100000; x4 +- r 0 ah; y3 +- dh2 th 0; y4 +- y3 dh2 0",
			sites: "3cd4 x4 t; cd4 x4 y4; cd4 th2 b; 0 r aw2"
		},
		uTurnArrow: {
			defaults: {
				adj1: 25e3,
				adj2: 25e3,
				adj3: 25e3,
				adj4: 43750,
				adj5: 75e3
			},
			guides: "a2 pin 0 adj2 25000; maxAdj1 */ a2 2 1; a1 pin 0 adj1 maxAdj1; q2 */ a1 ss h; q3 +- 100000 0 q2; maxAdj3 */ q3 h ss; a3 pin 0 adj3 maxAdj3; q1 +- a3 a1 0; minAdj5 */ q1 ss h; a5 pin minAdj5 adj5 100000; th */ ss a1 100000; aw2 */ ss a2 100000; th2 */ th 1 2; dh2 +- aw2 0 th2; y5 */ h a5 100000; ah */ ss a3 100000; y4 +- y5 0 ah; x8 +- r 0 aw2; x6 +- x8 0 aw2; x7 +- x6 dh2 0; cx +/ th x7 2",
			sites: "cd4 x6 y4; cd4 x8 y5; 0 r y4; 3cd4 cx t; cd4 th2 b"
		},
		leftUpArrow: {
			defaults: {
				adj1: 25e3,
				adj2: 25e3,
				adj3: 25e3
			},
			guides: "a2 pin 0 adj2 50000; maxAdj1 */ a2 2 1; a1 pin 0 adj1 maxAdj1; maxAdj3 +- 100000 0 maxAdj1; a3 pin 0 adj3 maxAdj3; x1 */ ss a3 100000; dx2 */ ss a2 50000; x2 +- r 0 dx2; y2 +- b 0 dx2; dx4 */ ss a2 100000; x4 +- r 0 dx4; y4 +- b 0 dx4; dx3 */ ss a1 200000; x5 +- x4 dx3 0; y3 +- y4 0 dx3; y5 +- y4 dx3 0; il */ dx3 x1 dx4; cx1 +/ x1 x5 2; cy1 +/ x1 y5 2",
			sites: "3cd4 x4 t; cd2 x2 x1; 3cd4 x1 y2; cd2 l y4; cd4 x1 b; cd4 cx1 y5; 0 x5 cy1; 0 r x1",
			text: "il y3 x4 y5"
		},
		bentUpArrow: {
			defaults: {
				adj1: 25e3,
				adj2: 25e3,
				adj3: 25e3
			},
			guides: "a1 pin 0 adj1 50000; a2 pin 0 adj2 50000; a3 pin 0 adj3 50000; y1 */ ss a3 100000; dx1 */ ss a2 50000; x1 +- r 0 dx1; dx3 */ ss a2 100000; x3 +- r 0 dx3; dx2 */ ss a1 200000; x4 +- x3 dx2 0; dy2 */ ss a1 100000; y2 +- b 0 dy2; x0 */ x4 1 2; y3 +/ y2 b 2; y15 +/ y1 b 2",
			sites: "3cd4 x3 t; cd2 x1 y1; cd2 l y3; cd4 x0 b; 0 x4 y15; 0 r y1",
			text: "l y2 x4 b"
		},
		curvedRightArrow: {
			defaults: {
				adj1: 25e3,
				adj2: 5e4,
				adj3: 25e3
			},
			guides: "maxAdj2 */ 50000 h ss; a2 pin 0 adj2 maxAdj2; a1 pin 0 adj1 a2; th */ ss a1 100000; aw */ ss a2 100000; q1 +/ th aw 4; hR +- hd2 0 q1; q7 */ hR 2 1; q8 */ q7 q7 1; q9 */ th th 1; q10 +- q8 0 q9; q11 sqrt q10; idx */ q11 w q7; maxAdj3 */ 100000 idx ss; a3 pin 0 adj3 maxAdj3; ah */ ss a3 100000; y3 +- hR th 0; q2 */ w w 1; q3 */ ah ah 1; q4 +- q2 0 q3; q5 sqrt q4; dy */ q5 hR w; y5 +- hR dy 0; y7 +- y3 dy 0; q6 +- aw 0 th; dh */ q6 1 2; y4 +- y5 0 dh; y8 +- y7 dh 0; aw2 */ aw 1 2; y6 +- b 0 aw2; x1 +- r 0 ah; iy +/ hR y3 2; q12 */ th 1 2",
			sites: "cd2 l iy; cd4 x1 y8; 0 r y6; 0 x1 y4; 0 r q12"
		},
		curvedLeftArrow: {
			defaults: {
				adj1: 25e3,
				adj2: 5e4,
				adj3: 25e3
			},
			guides: "maxAdj2 */ 50000 h ss; a2 pin 0 adj2 maxAdj2; a1 pin 0 adj1 a2; th */ ss a1 100000; aw */ ss a2 100000; q1 +/ th aw 4; hR +- hd2 0 q1; q7 */ hR 2 1; q8 */ q7 q7 1; q9 */ th th 1; q10 +- q8 0 q9; q11 sqrt q10; idx */ q11 w q7; maxAdj3 */ 100000 idx ss; a3 pin 0 adj3 maxAdj3; ah */ ss a3 100000; y3 +- hR th 0; q2 */ w w 1; q3 */ ah ah 1; q4 +- q2 0 q3; q5 sqrt q4; dy */ q5 hR w; y5 +- hR dy 0; y7 +- y3 dy 0; q6 +- aw 0 th; dh */ q6 1 2; y4 +- y5 0 dh; y8 +- y7 dh 0; aw2 */ aw 1 2; y6 +- b 0 aw2; x1 +- l ah 0; iy +/ hR y3 2; q12 */ th 1 2",
			sites: "cd2 l q12; cd2 x1 y4; cd3 l y6; cd4 x1 y8; 0 r iy"
		},
		curvedUpArrow: {
			defaults: {
				adj1: 25e3,
				adj2: 5e4,
				adj3: 25e3
			},
			guides: "maxAdj2 */ 50000 w ss; a2 pin 0 adj2 maxAdj2; a1 pin 0 adj1 100000; th */ ss a1 100000; aw */ ss a2 100000; q1 +/ th aw 4; wR +- wd2 0 q1; ah */ ss adj3 100000; x3 +- wR th 0; q2 */ h h 1; q3 */ ah ah 1; q4 +- q2 0 q3; q5 sqrt q4; dx */ q5 wR h; x5 +- wR dx 0; x7 +- x3 dx 0; q6 +- aw 0 th; dh */ q6 1 2; x4 +- x5 0 dh; x8 +- x7 dh 0; aw2 */ aw 1 2; x6 +- r 0 aw2; y1 +- t ah 0; ix +/ wR x3 2; q12 */ th 1 2",
			sites: "3cd4 x6 t; 3cd4 x4 y1; 3cd4 q12 t; cd4 ix b; 0 x8 y1"
		},
		curvedDownArrow: {
			defaults: {
				adj1: 25e3,
				adj2: 5e4,
				adj3: 25e3
			},
			guides: "maxAdj2 */ 50000 w ss; a2 pin 0 adj2 maxAdj2; a1 pin 0 adj1 100000; th */ ss a1 100000; aw */ ss a2 100000; q1 +/ th aw 4; wR +- wd2 0 q1; ah */ ss adj3 100000; x3 +- wR th 0; q2 */ h h 1; q3 */ ah ah 1; q4 +- q2 0 q3; q5 sqrt q4; dx */ q5 wR h; x5 +- wR dx 0; x7 +- x3 dx 0; q6 +- aw 0 th; dh */ q6 1 2; x4 +- x5 0 dh; x8 +- x7 dh 0; aw2 */ aw 1 2; x6 +- r 0 aw2; y1 +- b 0 ah; ix +/ wR x3 2; q12 */ th 1 2",
			sites: "3cd4 ix t; cd4 q12 b; cd4 x4 y1; cd4 x6 b; 0 x8 y1"
		},
		stripedRightArrow: {
			defaults: {
				adj1: 5e4,
				adj2: 5e4
			},
			guides: "maxAdj2 */ 84375 w ss; a1 pin 0 adj1 100000; a2 pin 0 adj2 maxAdj2; x4 */ ss 5 32; dx5 */ ss a2 100000; x5 +- r 0 dx5; dy1 */ h a1 200000; y1 +- vc 0 dy1; y2 +- vc dy1 0; dx6 */ dy1 dx5 hd2; x6 +- r 0 dx6",
			sites: "3cd4 x5 t; cd2 l vc; cd4 x5 b; 0 r vc",
			text: "x4 y1 x6 y2"
		},
		notchedRightArrow: {
			defaults: {
				adj1: 5e4,
				adj2: 5e4
			},
			guides: "maxAdj2 */ 100000 w ss; a1 pin 0 adj1 100000; a2 pin 0 adj2 maxAdj2; dx2 */ ss a2 100000; x2 +- r 0 dx2; dy1 */ h a1 200000; y1 +- vc 0 dy1; y2 +- vc dy1 0; x1 */ dy1 dx2 hd2; x3 +- r 0 x1",
			sites: "3cd4 x2 t; cd2 x1 vc; cd4 x2 b; 0 r vc",
			text: "x1 y1 x3 y2"
		},
		pentagonArrow: {
			defaults: { adj: 5e4 },
			guides: "maxAdj */ 100000 w ss; a pin 0 adj maxAdj; dx1 */ ss a 100000; x1 +- r 0 dx1; ir +/ x1 r 2; x2 */ x1 1 2",
			sites: "3cd4 x2 t; cd2 l vc; cd4 x1 b; 0 r vc",
			text: "l t ir b"
		},
		chevron: {
			defaults: { adj: 5e4 },
			guides: "maxAdj */ 100000 w ss; a pin 0 adj maxAdj; x1 */ ss a 100000; x2 +- r 0 x1; x3 */ x2 1 2; dx +- x2 0 x1; il ?: dx x1 l; ir ?: dx x2 r",
			sites: "3cd4 x3 t; cd2 x1 vc; cd4 x3 b; 0 r vc",
			text: "il t ir b"
		},
		rightArrowCallout: {
			defaults: {
				adj1: 25e3,
				adj2: 25e3,
				adj3: 25e3,
				adj4: 64977
			},
			guides: "maxAdj3 */ 100000 w ss; a3 pin 0 adj3 maxAdj3; q2 */ a3 ss w; maxAdj4 +- 100000 0 q2; a4 pin 0 adj4 maxAdj4; x2 */ w a4 100000; x1 */ x2 1 2",
			sites: "3cd4 x1 t; cd2 l vc; cd4 x1 b; 0 r vc",
			text: "l t x2 b"
		},
		downArrowCallout: {
			defaults: {
				adj1: 25e3,
				adj2: 25e3,
				adj3: 25e3,
				adj4: 64977
			},
			guides: "maxAdj3 */ 100000 h ss; a3 pin 0 adj3 maxAdj3; q2 */ a3 ss h; maxAdj4 +- 100000 0 q2; a4 pin 0 adj4 maxAdj4; y2 */ h a4 100000; y1 */ y2 1 2",
			sites: "3cd4 hc t; cd2 l y1; cd4 hc b; 0 r y1",
			text: "l t r y2"
		},
		leftArrowCallout: {
			defaults: {
				adj1: 25e3,
				adj2: 25e3,
				adj3: 25e3,
				adj4: 64977
			},
			guides: "maxAdj3 */ 100000 w ss; a3 pin 0 adj3 maxAdj3; q2 */ a3 ss w; maxAdj4 +- 100000 0 q2; a4 pin 0 adj4 maxAdj4; dx2 */ w a4 100000; x2 +- r 0 dx2; x3 +/ x2 r 2",
			sites: "3cd4 x3 t; cd2 l vc; cd4 x3 b; 0 r vc",
			text: "x2 t r b"
		},
		upArrowCallout: {
			defaults: {
				adj1: 25e3,
				adj2: 25e3,
				adj3: 25e3,
				adj4: 64977
			},
			guides: "maxAdj3 */ 100000 h ss; a3 pin 0 adj3 maxAdj3; q2 */ a3 ss h; maxAdj4 +- 100000 0 q2; a4 pin 0 adj4 maxAdj4; dy2 */ h a4 100000; y2 +- b 0 dy2",
			sites: "3cd4 hc t; cd2 l y2; cd4 hc b; 0 r y2",
			text: "l y2 r b"
		},
		leftRightArrowCallout: {
			defaults: {
				adj1: 25e3,
				adj2: 25e3,
				adj3: 25e3,
				adj4: 48123
			},
			guides: "maxAdj3 */ 50000 w ss; a3 pin 0 adj3 maxAdj3; q2 */ a3 ss wd2; maxAdj4 +- 100000 0 q2; a4 pin 0 adj4 maxAdj4; dx2 */ w a4 200000; x2 +- hc 0 dx2; x3 +- hc dx2 0",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "x2 t x3 b"
		},
		upDownArrowCallout: {
			defaults: {
				adj1: 25e3,
				adj2: 25e3,
				adj3: 25e3,
				adj4: 48123
			},
			guides: "maxAdj3 */ 50000 h ss; a3 pin 0 adj3 maxAdj3; q2 */ a3 ss hd2; maxAdj4 +- 100000 0 q2; a4 pin 0 adj4 maxAdj4; dy2 */ h a4 200000; y2 +- vc 0 dy2; y3 +- vc dy2 0",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "l y2 r y3"
		},
		quadArrowCallout: {
			defaults: {
				adj1: 18515,
				adj2: 18515,
				adj3: 18515,
				adj4: 48123
			},
			guides: "a2 pin 0 adj2 50000; maxAdj1 */ a2 2 1; a1 pin 0 adj1 maxAdj1; maxAdj3 +- 50000 0 a2; a3 pin 0 adj3 maxAdj3; q2 */ a3 2 1; maxAdj4 +- 100000 0 q2; a4 pin a1 adj4 maxAdj4; dx1 */ w a4 200000; dy1 */ h a4 200000; x2 +- hc 0 dx1; x7 +- hc dx1 0; y2 +- vc 0 dy1; y7 +- vc dy1 0",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "x2 y2 x7 y7"
		},
		circularArrow: {
			defaults: {
				adj1: 12500,
				adj2: 1142319,
				adj3: 20457681,
				adj4: 108e5,
				adj5: 12500
			},
			guides: "a5 pin 0 adj5 25000; maxAdj1 */ a5 2 1; a1 pin 0 adj1 maxAdj1; enAng pin 1 adj3 21599999; stAng pin 0 adj4 21599999; th */ ss a1 100000; thh */ ss a5 100000; th2 */ th 1 2; rw1 +- wd2 th2 thh; rh1 +- hd2 th2 thh; rw2 +- rw1 0 th; rh2 +- rh1 0 th; rw3 +- rw2 th2 0; rh3 +- rh2 th2 0; wtH sin rw3 enAng; htH cos rh3 enAng; dxH cat2 rw3 htH wtH; dyH sat2 rh3 htH wtH; xH +- hc dxH 0; yH +- vc dyH 0; rI min rw2 rh2; u1 */ dxH dxH 1; u2 */ dyH dyH 1; u3 */ rI rI 1; u4 +- u1 0 u3; u5 +- u2 0 u3; u6 */ u4 u5 u1; u7 */ u6 1 u2; u8 +- 1 0 u7; u9 sqrt u8; u10 */ u4 1 dxH; u11 */ u10 1 dyH; u12 +/ 1 u9 u11; u13 at2 1 u12; u14 +- u13 21600000 0; u15 ?: u13 u13 u14; u16 +- u15 0 enAng; u17 +- u16 21600000 0; u18 ?: u16 u16 u17; u19 +- u18 0 cd2; u20 +- u18 0 21600000; u21 ?: u19 u20 u18; maxAng abs u21; aAng pin 0 adj2 maxAng; ptAng +- enAng aAng 0; wtA sin rw3 ptAng; htA cos rh3 ptAng; dxA cat2 rw3 htA wtA; dyA sat2 rh3 htA wtA; xA +- hc dxA 0; yA +- vc dyA 0; dxG cos thh ptAng; dyG sin thh ptAng; xG +- xH dxG 0; yG +- yH dyG 0; dxB cos thh ptAng; dyB sin thh ptAng; xB +- xH 0 dxB 0; yB +- yH 0 dyB 0; sx1 +- xB 0 hc; sy1 +- yB 0 vc; sx2 +- xG 0 hc; sy2 +- yG 0 vc; rO min rw1 rh1; x1O */ sx1 rO rw1; y1O */ sy1 rO rh1; x2O */ sx2 rO rw1; y2O */ sy2 rO rh1; dxO +- x2O 0 x1O; dyO +- y2O 0 y1O; dO mod dxO dyO 0; q1 */ x1O y2O 1; q2 */ x2O y1O 1; DO +- q1 0 q2; q3 */ rO rO 1; q4 */ dO dO 1; q5 */ q3 q4 1; q6 */ DO DO 1; q7 +- q5 0 q6; q8 max q7 0; sdelO sqrt q8; ndyO */ dyO -1 1; sdyO ?: ndyO -1 1; q9 */ sdyO dxO 1; q10 */ q9 sdelO 1; q11 */ DO dyO 1; dxF1 +/ q11 q10 q4; q12 +- q11 0 q10; dxF2 */ q12 1 q4; adyO abs dyO; q13 */ adyO sdelO 1; q14 */ DO dxO -1; dyF1 +/ q14 q13 q4; q15 +- q14 0 q13; dyF2 */ q15 1 q4; q16 +- x2O 0 dxF1; q17 +- x2O 0 dxF2; q18 +- y2O 0 dyF1; q19 +- y2O 0 dyF2; q20 mod q16 q18 0; q21 mod q17 q19 0; q22 +- q21 0 q20; dxF ?: q22 dxF1 dxF2; dyF ?: q22 dyF1 dyF2; sdxF */ dxF rw1 rO; sdyF */ dyF rh1 rO; xF +- hc sdxF 0; yF +- vc sdyF 0; x1I */ sx1 rI rw2; y1I */ sy1 rI rh2; x2I */ sx2 rI rw2; y2I */ sy2 rI rh2; dxI +- x2I 0 x1I; dyI +- y2I 0 y1I; dI mod dxI dyI 0; v1 */ x1I y2I 1; v2 */ x2I y1I 1; DI +- v1 0 v2; v3 */ rI rI 1; v4 */ dI dI 1; v5 */ v3 v4 1; v6 */ DI DI 1; v7 +- v5 0 v6; v8 max v7 0; sdelI sqrt v8; v9 */ sdyO dxI 1; v10 */ v9 sdelI 1; v11 */ DI dyI 1; dxC1 +/ v11 v10 v4; v12 +- v11 0 v10; dxC2 */ v12 1 v4; adyI abs dyI; v13 */ adyI sdelI 1; v14 */ DI dxI -1; dyC1 +/ v14 v13 v4; v15 +- v14 0 v13; dyC2 */ v15 1 v4; v16 +- x1I 0 dxC1; v17 +- x1I 0 dxC2; v18 +- y1I 0 dyC1; v19 +- y1I 0 dyC2; v20 mod v16 v18 0; v21 mod v17 v19 0; v22 +- v21 0 v20; dxC ?: v22 dxC1 dxC2; dyC ?: v22 dyC1 dyC2; sdxC */ dxC rw2 rI; sdyC */ dyC rh2 rI; xC +- hc sdxC 0; yC +- vc sdyC 0; p1 +- xF 0 xC; p2 +- yF 0 yC; p3 mod p1 p2 0; p4 */ p3 1 2; p5 +- p4 0 thh; xGp ?: p5 xF xG; yGp ?: p5 yF yG; xBp ?: p5 xC xB; yBp ?: p5 yC yB; wtI sin rw3 stAng; htI cos rh3 stAng; dxI cat2 rw3 htI wtI; dyI sat2 rh3 htI wtI; xI +- hc dxI 0; yI +- vc dyI 0; aI +- stAng 0 cd4; aA +- ptAng cd4 0; aB +- ptAng cd2 0; idx cos rw1 2700000; idy sin rh1 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "aI xI yI; ptAng xGp yGp; aA xA yA; aB xBp yBp",
			text: "il it ir ib"
		},
		leftCircularArrow: {
			defaults: {
				adj1: 12500,
				adj2: -1142319,
				adj3: 1142319,
				adj4: 108e5,
				adj5: 12500
			},
			guides: "a5 pin 0 adj5 25000; maxAdj1 */ a5 2 1; a1 pin 0 adj1 maxAdj1; enAng pin 1 adj3 21599999; stAng pin 0 adj4 21599999; th */ ss a1 100000; thh */ ss a5 100000; th2 */ th 1 2; rw1 +- wd2 th2 thh; rh1 +- hd2 th2 thh; rw2 +- rw1 0 th; rh2 +- rh1 0 th; rw3 +- rw2 th2 0; rh3 +- rh2 th2 0; wtH sin rw3 enAng; htH cos rh3 enAng; dxH cat2 rw3 htH wtH; dyH sat2 rh3 htH wtH; xH +- hc dxH 0; yH +- vc dyH 0; rI min rw2 rh2; u1 */ dxH dxH 1; u2 */ dyH dyH 1; u3 */ rI rI 1; u4 +- u1 0 u3; u5 +- u2 0 u3; u6 */ u4 u5 u1; u7 */ u6 1 u2; u8 +- 1 0 u7; u9 sqrt u8; u10 */ u4 1 dxH; u11 */ u10 1 dyH; u12 +/ 1 u9 u11; u13 at2 1 u12; u14 +- u13 21600000 0; u15 ?: u13 u13 u14; u16 +- u15 0 enAng; u17 +- u16 21600000 0; u18 ?: u16 u16 u17; u19 +- u18 0 cd2; u20 +- u18 0 21600000; u21 ?: u19 u20 u18; u22 abs u21; minAng */ u22 -1 1; u23 abs adj2; a2 */ u23 -1 1; aAng pin minAng a2 0; ptAng +- enAng aAng 0; wtA sin rw3 ptAng; htA cos rh3 ptAng; dxA cat2 rw3 htA wtA; dyA sat2 rh3 htA wtA; xA +- hc dxA 0; yA +- vc dyA 0; dxG cos thh ptAng; dyG sin thh ptAng; xG +- xH dxG 0; yG +- yH dyG 0; dxB cos thh ptAng; dyB sin thh ptAng; xB +- xH 0 dxB 0; yB +- yH 0 dyB 0; sx1 +- xB 0 hc; sy1 +- yB 0 vc; sx2 +- xG 0 hc; sy2 +- yG 0 vc; rO min rw1 rh1; x1O */ sx1 rO rw1; y1O */ sy1 rO rh1; x2O */ sx2 rO rw1; y2O */ sy2 rO rh1; dxO +- x2O 0 x1O; dyO +- y2O 0 y1O; dO mod dxO dyO 0; q1 */ x1O y2O 1; q2 */ x2O y1O 1; DO +- q1 0 q2; q3 */ rO rO 1; q4 */ dO dO 1; q5 */ q3 q4 1; q6 */ DO DO 1; q7 +- q5 0 q6; q8 max q7 0; sdelO sqrt q8; ndyO */ dyO -1 1; sdyO ?: ndyO -1 1; q9 */ sdyO dxO 1; q10 */ q9 sdelO 1; q11 */ DO dyO 1; dxF1 +/ q11 q10 q4; q12 +- q11 0 q10; dxF2 */ q12 1 q4; adyO abs dyO; q13 */ adyO sdelO 1; q14 */ DO dxO -1; dyF1 +/ q14 q13 q4; q15 +- q14 0 q13; dyF2 */ q15 1 q4; q16 +- x2O 0 dxF1; q17 +- x2O 0 dxF2; q18 +- y2O 0 dyF1; q19 +- y2O 0 dyF2; q20 mod q16 q18 0; q21 mod q17 q19 0; q22 +- q21 0 q20; dxF ?: q22 dxF1 dxF2; dyF ?: q22 dyF1 dyF2; sdxF */ dxF rw1 rO; sdyF */ dyF rh1 rO; xF +- hc sdxF 0; yF +- vc sdyF 0; x1I */ sx1 rI rw2; y1I */ sy1 rI rh2; x2I */ sx2 rI rw2; y2I */ sy2 rI rh2; dxI +- x2I 0 x1I; dyI +- y2I 0 y1I; dI mod dxI dyI 0; v1 */ x1I y2I 1; v2 */ x2I y1I 1; DI +- v1 0 v2; v3 */ rI rI 1; v4 */ dI dI 1; v5 */ v3 v4 1; v6 */ DI DI 1; v7 +- v5 0 v6; v8 max v7 0; sdelI sqrt v8; v9 */ sdyO dxI 1; v10 */ v9 sdelI 1; v11 */ DI dyI 1; dxC1 +/ v11 v10 v4; v12 +- v11 0 v10; dxC2 */ v12 1 v4; adyI abs dyI; v13 */ adyI sdelI 1; v14 */ DI dxI -1; dyC1 +/ v14 v13 v4; v15 +- v14 0 v13; dyC2 */ v15 1 v4; v16 +- x1I 0 dxC1; v17 +- x1I 0 dxC2; v18 +- y1I 0 dyC1; v19 +- y1I 0 dyC2; v20 mod v16 v18 0; v21 mod v17 v19 0; v22 +- v21 0 v20; dxC ?: v22 dxC1 dxC2; dyC ?: v22 dyC1 dyC2; sdxC */ dxC rw2 rI; sdyC */ dyC rh2 rI; xC +- hc sdxC 0; yC +- vc sdyC 0; p1 +- xF 0 xC; p2 +- yF 0 yC; p3 mod p1 p2 0; p4 */ p3 1 2; p5 +- p4 0 thh; xGp ?: p5 xF xG; yGp ?: p5 yF yG; xBp ?: p5 xC xB; yBp ?: p5 yC yB; wtI sin rw3 stAng; htI cos rh3 stAng; dxI cat2 rw3 htI wtI; dyI sat2 rh3 htI wtI; xI +- hc dxI 0; yI +- vc dyI 0; aI +- stAng cd4 0; aA +- ptAng 0 cd4; aB +- ptAng cd2 0; idx cos rw1 2700000; idy sin rh1 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "aI xI yI; ptAng xGp yGp; aA xA yA; aB xBp yBp",
			text: "il it ir ib"
		},
		leftRightCircularArrow: {
			defaults: {
				adj1: 12500,
				adj2: 1142319,
				adj3: 20457681,
				adj4: 11942319,
				adj5: 12500
			},
			guides: "a5 pin 0 adj5 25000; maxAdj1 */ a5 2 1; a1 pin 0 adj1 maxAdj1; enAng pin 1 adj3 21599999; stAng pin 0 adj4 21599999; th */ ss a1 100000; thh */ ss a5 100000; th2 */ th 1 2; rw1 +- wd2 th2 thh; rh1 +- hd2 th2 thh; rw2 +- rw1 0 th; rh2 +- rh1 0 th; rw3 +- rw2 th2 0; rh3 +- rh2 th2 0; wtH sin rw3 enAng; htH cos rh3 enAng; dxH cat2 rw3 htH wtH; dyH sat2 rh3 htH wtH; xH +- hc dxH 0; yH +- vc dyH 0; rI min rw2 rh2; u1 */ dxH dxH 1; u2 */ dyH dyH 1; u3 */ rI rI 1; u4 +- u1 0 u3; u5 +- u2 0 u3; u6 */ u4 u5 u1; u7 */ u6 1 u2; u8 +- 1 0 u7; u9 sqrt u8; u10 */ u4 1 dxH; u11 */ u10 1 dyH; u12 +/ 1 u9 u11; u13 at2 1 u12; u14 +- u13 21600000 0; u15 ?: u13 u13 u14; u16 +- u15 0 enAng; u17 +- u16 21600000 0; u18 ?: u16 u16 u17; u19 +- u18 0 cd2; u20 +- u18 0 21600000; u21 ?: u19 u20 u18; maxAng abs u21; aAng pin 0 adj2 maxAng; ptAng +- enAng aAng 0; wtA sin rw3 ptAng; htA cos rh3 ptAng; dxA cat2 rw3 htA wtA; dyA sat2 rh3 htA wtA; xA +- hc dxA 0; yA +- vc dyA 0; dxG cos thh ptAng; dyG sin thh ptAng; xG +- xH dxG 0; yG +- yH dyG 0; dxB cos thh ptAng; dyB sin thh ptAng; xB +- xH 0 dxB 0; yB +- yH 0 dyB 0; sx1 +- xB 0 hc; sy1 +- yB 0 vc; sx2 +- xG 0 hc; sy2 +- yG 0 vc; rO min rw1 rh1; x1O */ sx1 rO rw1; y1O */ sy1 rO rh1; x2O */ sx2 rO rw1; y2O */ sy2 rO rh1; dxO +- x2O 0 x1O; dyO +- y2O 0 y1O; dO mod dxO dyO 0; q1 */ x1O y2O 1; q2 */ x2O y1O 1; DO +- q1 0 q2; q3 */ rO rO 1; q4 */ dO dO 1; q5 */ q3 q4 1; q6 */ DO DO 1; q7 +- q5 0 q6; q8 max q7 0; sdelO sqrt q8; ndyO */ dyO -1 1; sdyO ?: ndyO -1 1; q9 */ sdyO dxO 1; q10 */ q9 sdelO 1; q11 */ DO dyO 1; dxF1 +/ q11 q10 q4; q12 +- q11 0 q10; dxF2 */ q12 1 q4; adyO abs dyO; q13 */ adyO sdelO 1; q14 */ DO dxO -1; dyF1 +/ q14 q13 q4; q15 +- q14 0 q13; dyF2 */ q15 1 q4; q16 +- x2O 0 dxF1; q17 +- x2O 0 dxF2; q18 +- y2O 0 dyF1; q19 +- y2O 0 dyF2; q20 mod q16 q18 0; q21 mod q17 q19 0; q22 +- q21 0 q20; dxF ?: q22 dxF1 dxF2; dyF ?: q22 dyF1 dyF2; sdxF */ dxF rw1 rO; sdyF */ dyF rh1 rO; xF +- hc sdxF 0; yF +- vc sdyF 0; x1I */ sx1 rI rw2; y1I */ sy1 rI rh2; x2I */ sx2 rI rw2; y2I */ sy2 rI rh2; dxI +- x2I 0 x1I; dyI +- y2I 0 y1I; dI mod dxI dyI 0; v1 */ x1I y2I 1; v2 */ x2I y1I 1; DI +- v1 0 v2; v3 */ rI rI 1; v4 */ dI dI 1; v5 */ v3 v4 1; v6 */ DI DI 1; v7 +- v5 0 v6; v8 max v7 0; sdelI sqrt v8; v9 */ sdyO dxI 1; v10 */ v9 sdelI 1; v11 */ DI dyI 1; dxC1 +/ v11 v10 v4; v12 +- v11 0 v10; dxC2 */ v12 1 v4; adyI abs dyI; v13 */ adyI sdelI 1; v14 */ DI dxI -1; dyC1 +/ v14 v13 v4; v15 +- v14 0 v13; dyC2 */ v15 1 v4; v16 +- x1I 0 dxC1; v17 +- x1I 0 dxC2; v18 +- y1I 0 dyC1; v19 +- y1I 0 dyC2; v20 mod v16 v18 0; v21 mod v17 v19 0; v22 +- v21 0 v20; dxC ?: v22 dxC1 dxC2; dyC ?: v22 dyC1 dyC2; sdxC */ dxC rw2 rI; sdyC */ dyC rh2 rI; xC +- hc sdxC 0; yC +- vc sdyC 0; wtI sin rw3 stAng; htI cos rh3 stAng; dxI cat2 rw3 htI wtI; dyI sat2 rh3 htI wtI; xI +- hc dxI 0; yI +- vc dyI 0; lptAng +- stAng 0 aAng; wtL sin rw3 lptAng; htL cos rh3 lptAng; dxL cat2 rw3 htL wtL; dyL sat2 rh3 htL wtL; xL +- hc dxL 0; yL +- vc dyL 0; dxK cos thh lptAng; dyK sin thh lptAng; xK +- xI dxK 0; yK +- yI dyK 0; dxJ cos thh lptAng; dyJ sin thh lptAng; xJ +- xI 0 dxJ 0; yJ +- yI 0 dyJ 0; p1 +- xF 0 xC; p2 +- yF 0 yC; p3 mod p1 p2 0; p4 */ p3 1 2; p5 +- p4 0 thh; xGp ?: p5 xF xG; yGp ?: p5 yF yG; xBp ?: p5 xC xB; yBp ?: p5 yC yB; en0 at2 sdxF sdyF; en1 +- en0 21600000 0; en2 ?: en0 en0 en1; od0 +- en2 0 enAng; od1 +- od0 21600000 0; od2 ?: od0 od0 od1; st0 +- stAng 0 od2; st1 +- st0 21600000 0; st2 ?: st0 st0 st1; ist0 at2 sdxC sdyC; ist1 +- ist0 21600000 0; istAng ?: ist0 ist0 ist1; id0 +- istAng 0 enAng; id1 +- id0 0 21600000; id2 ?: id0 id1 id0; ien0 +- stAng 0 id2; ien1 +- ien0 0 21600000; ien2 ?: ien1 ien1 ien0; wtE sin rw1 st2; htE cos rh1 st2; dxE cat2 rw1 htE wtE; dyE sat2 rh1 htE wtE; xE +- hc dxE 0; yE +- vc dyE 0; wtD sin rw2 ien2; htD cos rh2 ien2; dxD cat2 rw2 htD wtD; dyD sat2 rh2 htD wtD; xD +- hc dxD 0; yD +- vc dyD 0; xKp ?: p5 xE xK; yKp ?: p5 yE yK; xJp ?: p5 xD xJ; yJp ?: p5 yD yJ; aL +- lptAng 0 cd4; aA +- ptAng cd4 0; aB +- ptAng cd2 0; aJ +- lptAng cd2 0; idx cos rw1 2700000; idy sin rh1 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "aL xL yL; lptAng xKp yKp; ptAng xGp yGp; aA xA yA; aB xBp yBp; aJ xJp yJp",
			text: "il it ir ib"
		},
		swooshArrow: {
			defaults: {
				adj1: 25e3,
				adj2: 16667
			},
			guides: "a1 pin 1 adj1 75000; maxAdj2 */ 70000 w ss; a2 pin 0 adj2 maxAdj2; ad1 */ h a1 100000; ad2 */ ss a2 100000; xB +- r 0 ad2; yB +- t ssd8 0; alfa */ cd4 1 14; dx0 tan ssd8 alfa; xC +- xB 0 dx0; dx1 tan ad1 alfa; yF +- yB ad1 0; xF +- xB dx1 0; xE +- xF dx0 0; yE +- yF ssd8 0; dy2 +- yE 0 t; dy22 */ dy2 1 2; dy3 */ h 1 20; yD +- t dy22 dy3",
			sites: "cd4 l b; 3cd4 xC t; 0 r yD; cd4 xE yE"
		},
		mathPlus: {
			defaults: { adj1: 23520 },
			guides: "a1 pin 0 adj1 73490; dx1 */ w 73490 200000; dy1 */ h 73490 200000; dx2 */ ss a1 200000; x1 +- hc 0 dx1; x4 +- hc dx1 0; y1 +- vc 0 dy1; y2 +- vc 0 dx2; y3 +- vc dx2 0; y4 +- vc dy1 0",
			sites: "0 x4 vc; cd4 hc y4; cd2 x1 vc; 3cd4 hc y1",
			text: "x1 y2 x4 y3"
		},
		mathMinus: {
			defaults: { adj1: 23520 },
			guides: "a1 pin 0 adj1 100000; dy1 */ h a1 200000; dx1 */ w 73490 200000; y1 +- vc 0 dy1; y2 +- vc dy1 0; x1 +- hc 0 dx1; x2 +- hc dx1 0",
			sites: "0 x2 vc; cd4 hc y2; cd2 x1 vc; 3cd4 hc y1",
			text: "x1 y1 x2 y2"
		},
		mathMultiply: {
			defaults: { adj1: 23520 },
			guides: "a1 pin 0 adj1 51965; th */ ss a1 100000; a at2 w h; sa sin 1 a; ca cos 1 a; dl mod w h 0; rw */ dl 51965 100000; lM +- dl 0 rw; xM */ ca lM 2; yM */ sa lM 2; dxAM */ sa th 2; dyAM */ ca th 2; xA +- xM 0 dxAM; yB +- yM 0 dyAM; xE +- r 0 xA; yH +- b 0 yB; xC2 +- r 0 xM; yC3 +- b 0 yM",
			sites: "cd2 xM yM; 3cd4 xC2 yM; 0 xC2 yC3; cd4 xM yC3",
			text: "xA yB xE yH"
		},
		mathDivide: {
			defaults: {
				adj1: 23520,
				adj2: 5880,
				adj3: 11760
			},
			guides: "a1 pin 1000 adj1 36745; ma1 +- 0 0 a1; ma3h +/ 73490 ma1 4; ma3w */ 36745 w h; maxAdj3 min ma3h ma3w; a3 pin 1000 adj3 maxAdj3; m4a3 */ -4 a3 1; maxAdj2 +- 73490 m4a3 a1; a2 pin 0 adj2 maxAdj2; dy1 */ h a1 200000; yg */ h a2 100000; rad */ h a3 100000; dx1 */ w 73490 200000; y3 +- vc 0 dy1; y4 +- vc dy1 0; a +- yg rad 0; y2 +- y3 0 a; y1 +- y2 0 rad; y5 +- b 0 y1; x1 +- hc 0 dx1; x3 +- hc dx1 0",
			sites: "0 x3 vc; cd4 hc y5; cd2 x1 vc; 3cd4 hc y1",
			text: "x1 y3 x3 y4"
		},
		mathEqual: {
			defaults: {
				adj1: 23520,
				adj2: 11760
			},
			guides: "a1 pin 0 adj1 36745; 2a1 */ a1 2 1; mAdj2 +- 100000 0 2a1; a2 pin 0 adj2 mAdj2; dy1 */ h a1 100000; dy2 */ h a2 200000; dx1 */ w 73490 200000; y2 +- vc 0 dy2; y3 +- vc dy2 0; y1 +- y2 0 dy1; y4 +- y3 dy1 0; x1 +- hc 0 dx1; x2 +- hc dx1 0; yC1 +/ y1 y2 2; yC2 +/ y3 y4 2",
			sites: "0 x2 yC1; 0 x2 yC2; cd4 hc y4; cd2 x1 yC1; cd2 x1 yC2; 3cd4 hc y1",
			text: "x1 y1 x2 y4"
		},
		mathNotEqual: {
			defaults: {
				adj1: 23520,
				adj2: 66e5,
				adj3: 11760
			},
			guides: "a1 pin 0 adj1 50000; crAng pin 4200000 adj2 6600000; 2a1 */ a1 2 1; maxAdj3 +- 100000 0 2a1; a3 pin 0 adj3 maxAdj3; dy1 */ h a1 100000; dy2 */ h a3 200000; dx1 */ w 73490 200000; x1 +- hc 0 dx1; x8 +- hc dx1 0; y2 +- vc 0 dy2; y3 +- vc dy2 0; y1 +- y2 0 dy1; y4 +- y3 dy1 0; cadj2 +- crAng 0 cd4; xadj2 tan hd2 cadj2; len mod xadj2 hd2 0; bhw */ len dy1 hd2; bhw2 */ bhw 1 2; x7 +- hc xadj2 bhw2; rx7 +- x7 bhw 0; dx7 */ dy1 hd2 len; rxt +- x7 dx7 0; lxt +- rx7 0 dx7; rx ?: cadj2 rxt rx7; lx ?: cadj2 x7 lxt; dy3 */ dy1 xadj2 len; dy4 +- 0 0 dy3; ry ?: cadj2 dy3 t; ly ?: cadj2 t dy4; dlx +- w 0 rx; drx +- w 0 lx; dly +- h 0 ry; dry +- h 0 ly; xC1 +/ rx lx 2; xC2 +/ drx dlx 2; yC1 +/ ry ly 2; yC2 +/ y1 y2 2; yC3 +/ y3 y4 2; yC4 +/ dry dly 2",
			sites: "0 x8 yC2; 0 x8 yC3; cd4 xC2 yC4; cd2 x1 yC2; cd2 x1 yC3; 3cd4 xC1 yC1",
			text: "x1 y1 x8 y4"
		},
		flowChartProcess: { sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc" },
		flowChartAlternateProcess: {
			guides: "il */ ssd6 29289 100000; ir +- r 0 il; ib +- b 0 il",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "il il ir ib"
		},
		flowChartDecision: {
			guides: "ir */ w 3 4; ib */ h 3 4",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "wd4 hd4 ir ib"
		},
		flowChartInputOutput: {
			guides: "x3 */ w 2 5; x4 */ w 3 5; x5 */ w 4 5; x6 */ w 9 10",
			sites: "3cd4 x4 t; 3cd4 hc t; cd2 wd10 vc; cd4 x3 b; cd4 hc b; 0 x6 vc",
			text: "wd5 t x5 b"
		},
		flowChartPredefinedProcess: {
			guides: "x2 */ w 7 8",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "wd8 t x2 b"
		},
		flowChartInternalStorage: {
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "wd8 hd8 r b"
		},
		flowChartDocument: {
			guides: "y1 */ h 17322 21600; y2 */ h 20172 21600",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc y2; 0 r vc",
			text: "l t r y1"
		},
		flowChartMultidocument: {
			guides: "y2 */ h 3675 21600; y8 */ h 20782 21600; x3 */ w 9298 21600; x4 */ w 12286 21600; x5 */ w 18595 21600",
			sites: "3cd4 x4 t; cd2 l vc; cd4 x3 y8; 0 r vc",
			text: "l y2 x5 y8"
		},
		flowChartTerminator: {
			guides: "il */ w 1018 21600; ir */ w 20582 21600; it */ h 3163 21600; ib */ h 18437 21600",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "il it ir ib"
		},
		flowChartPreparation: {
			guides: "x2 */ w 4 5",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "wd5 t x2 b"
		},
		flowChartManualInput: {
			sites: "3cd4 hc hd10; cd2 l vc; cd4 hc b; 0 r vc",
			text: "l hd5 r b"
		},
		flowChartManualOperation: {
			guides: "x3 */ w 4 5; x4 */ w 9 10",
			sites: "3cd4 hc t; cd2 wd10 vc; cd4 hc b; 0 x4 vc",
			text: "wd5 t x3 b"
		},
		flowChartConnector: {
			guides: "idx cos wd2 2700000; idy sin hd2 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "3cd4 hc t; 3cd4 il it; cd2 l vc; cd4 il ib; cd4 hc b; cd4 ir ib; 0 r vc; 3cd4 ir it",
			text: "il it ir ib"
		},
		flowChartOffpageConnector: {
			guides: "y1 */ h 4 5",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "l t r y1"
		},
		flowChartPunchedCard: {
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "l hd5 r b"
		},
		flowChartPunchedTape: {
			guides: "y2 */ h 9 10; ib */ h 4 5",
			sites: "3cd4 hc hd10; cd2 l vc; cd4 hc y2; 0 r vc",
			text: "l hd5 r ib"
		},
		flowChartSummingJunction: {
			guides: "idx cos wd2 2700000; idy sin hd2 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "3cd4 hc t; 3cd4 il it; cd2 l vc; cd4 il ib; cd4 hc b; cd4 ir ib; 0 r vc; 3cd4 ir it",
			text: "il it ir ib"
		},
		flowChartOr: {
			guides: "idx cos wd2 2700000; idy sin hd2 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "3cd4 hc t; 3cd4 il it; cd2 l vc; cd4 il ib; cd4 hc b; cd4 ir ib; 0 r vc; 3cd4 ir it",
			text: "il it ir ib"
		},
		flowChartCollate: {
			guides: "ir */ w 3 4; ib */ h 3 4",
			sites: "3cd4 hc t; 3cd4 hc vc; cd4 hc b",
			text: "wd4 hd4 ir ib"
		},
		flowChartSort: {
			guides: "ir */ w 3 4; ib */ h 3 4",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "wd4 hd4 ir ib"
		},
		flowChartExtract: {
			guides: "x2 */ w 3 4",
			sites: "3cd4 hc t; cd2 wd4 vc; cd4 hc b; 0 x2 vc",
			text: "wd4 vc x2 b"
		},
		flowChartMerge: {
			guides: "x2 */ w 3 4",
			sites: "3cd4 hc t; cd2 wd4 vc; cd4 hc b; 0 x2 vc",
			text: "wd4 t x2 vc"
		},
		flowChartOfflineStorage: {
			guides: "x4 */ w 3 4",
			sites: "0 x4 vc; cd4 hc b; cd2 wd4 vc; 3cd4 hc t",
			text: "wd4 t x4 vc"
		},
		flowChartOnlineStorage: {
			guides: "x2 */ w 5 6",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 x2 vc",
			text: "wd6 t x2 b"
		},
		flowChartDelay: {
			guides: "idx cos wd2 2700000; idy sin hd2 2700000; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "l it ir ib"
		},
		flowChartMagneticTape: {
			guides: "idx cos wd2 2700000; idy sin hd2 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "il it ir ib"
		},
		flowChartMagneticDisk: {
			guides: "y3 */ h 5 6",
			sites: "3cd4 hc hd3; 3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "l hd3 r y3"
		},
		flowChartMagneticDrum: {
			guides: "x2 */ w 2 3",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 x2 vc; 0 r vc",
			text: "wd6 t x2 b"
		},
		flowChartDisplay: {
			guides: "x2 */ w 5 6",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "wd6 t x2 b"
		},
		explosion12: {
			guides: "x5 */ w 4627 21600; x12 */ w 8485 21600; x21 */ w 16702 21600; x24 */ w 14522 21600; y3 */ h 6320 21600; y6 */ h 8615 21600; y9 */ h 13937 21600; y18 */ h 13290 21600",
			sites: "3cd4 x24 t; cd2 l y6; cd4 x12 b; 0 r y18",
			text: "x5 y3 x21 y9"
		},
		explosion14: {
			guides: "x2 */ w 9722 21600; x5 */ w 5372 21600; x16 */ w 11612 21600; x19 */ w 14640 21600; y2 */ h 1887 21600; y3 */ h 6382 21600; y8 */ h 12877 21600; y16 */ h 18842 21600; y17 */ h 15935 21600; y24 */ h 6645 21600",
			sites: "3cd4 x2 y2; cd2 l y8; cd4 x16 y16; 0 r y24",
			text: "x5 y3 x19 y17"
		},
		star4: {
			defaults: { adj: 12500 },
			guides: "a pin 0 adj 50000; iwd2 */ wd2 a 50000; ihd2 */ hd2 a 50000; sdx cos iwd2 2700000; sdy sin ihd2 2700000; sx1 +- hc 0 sdx; sx2 +- hc sdx 0; sy1 +- vc 0 sdy; sy2 +- vc sdy 0",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "sx1 sy1 sx2 sy2"
		},
		star5: {
			defaults: {
				adj: 19098,
				hf: 105146,
				vf: 110557
			},
			guides: "a pin 0 adj 50000; swd2 */ wd2 hf 100000; shd2 */ hd2 vf 100000; svc */ vc vf 100000; dx1 cos swd2 1080000; dx2 cos swd2 18360000; dy1 sin shd2 1080000; dy2 sin shd2 18360000; x1 +- hc 0 dx1; x2 +- hc 0 dx2; x3 +- hc dx2 0; x4 +- hc dx1 0; y1 +- svc 0 dy1; y2 +- svc 0 dy2; iwd2 */ swd2 a 50000; ihd2 */ shd2 a 50000; sdx1 cos iwd2 20520000; sdy1 sin ihd2 3240000; sx1 +- hc 0 sdx1; sx4 +- hc sdx1 0; sy1 +- svc 0 sdy1; sy3 +- svc ihd2 0",
			sites: "3cd4 hc t; cd2 x1 y1; cd4 x2 y2; cd4 x3 y2; 0 x4 y1",
			text: "sx1 sy1 sx4 sy3"
		},
		star6: {
			defaults: {
				adj: 28868,
				hf: 115470
			},
			guides: "a pin 0 adj 50000; swd2 */ wd2 hf 100000; dx1 cos swd2 1800000; x1 +- hc 0 dx1; x2 +- hc dx1 0; y2 +- vc hd4 0; iwd2 */ swd2 a 50000; ihd2 */ hd2 a 50000; sx1 +- hc 0 iwd2; sx4 +- hc iwd2 0; sdy1 sin ihd2 3600000; sy1 +- vc 0 sdy1; sy2 +- vc sdy1 0",
			sites: "0 x2 hd4; 0 x2 y2; cd4 hc b; cd2 x1 y2; cd2 x1 hd4; 3cd4 hc t",
			text: "sx1 sy1 sx4 sy2"
		},
		star7: {
			defaults: {
				adj: 34601,
				hf: 102572,
				vf: 105210
			},
			guides: "a pin 0 adj 50000; swd2 */ wd2 hf 100000; shd2 */ hd2 vf 100000; svc */ vc vf 100000; dx1 */ swd2 97493 100000; dx2 */ swd2 78183 100000; dx3 */ swd2 43388 100000; dy1 */ shd2 62349 100000; dy2 */ shd2 22252 100000; dy3 */ shd2 90097 100000; x1 +- hc 0 dx1; x2 +- hc 0 dx2; x3 +- hc 0 dx3; x4 +- hc dx3 0; x5 +- hc dx2 0; x6 +- hc dx1 0; y1 +- svc 0 dy1; y2 +- svc dy2 0; y3 +- svc dy3 0; iwd2 */ swd2 a 50000; ihd2 */ shd2 a 50000; sdx2 */ iwd2 78183 100000; sx2 +- hc 0 sdx2; sx5 +- hc sdx2 0; sdy1 */ ihd2 90097 100000; sdy3 */ ihd2 62349 100000; sy1 +- svc 0 sdy1; sy3 +- svc sdy3 0",
			sites: "0 x5 y1; 0 x6 y2; cd4 x4 y3; cd4 x3 y3; cd2 x1 y2; cd2 x2 y1; 3cd4 hc t",
			text: "sx2 sy1 sx5 sy3"
		},
		star8: {
			defaults: { adj: 37500 },
			guides: "a pin 0 adj 50000; dx1 cos wd2 2700000; x1 +- hc 0 dx1; x2 +- hc dx1 0; dy1 sin hd2 2700000; y1 +- vc 0 dy1; y2 +- vc dy1 0; iwd2 */ wd2 a 50000; ihd2 */ hd2 a 50000; sdx1 */ iwd2 92388 100000; sdy1 */ ihd2 92388 100000; sx1 +- hc 0 sdx1; sx4 +- hc sdx1 0; sy1 +- vc 0 sdy1; sy4 +- vc sdy1 0",
			sites: "0 r vc; cd4 x2 y2; cd4 hc b; cd4 x1 y2; cd2 l vc; 3cd4 x1 y1; 3cd4 hc t; 3cd4 x2 y1",
			text: "sx1 sy1 sx4 sy4"
		},
		star10: {
			defaults: {
				adj: 42533,
				hf: 105146
			},
			guides: "a pin 0 adj 50000; swd2 */ wd2 hf 100000; dx1 */ swd2 95106 100000; dx2 */ swd2 58779 100000; x1 +- hc 0 dx1; x2 +- hc 0 dx2; x3 +- hc dx2 0; x4 +- hc dx1 0; dy1 */ hd2 80902 100000; dy2 */ hd2 30902 100000; y1 +- vc 0 dy1; y2 +- vc 0 dy2; y3 +- vc dy2 0; y4 +- vc dy1 0; iwd2 */ swd2 a 50000; ihd2 */ hd2 a 50000; sdx1 */ iwd2 80902 100000; sdy2 */ ihd2 58779 100000; sx2 +- hc 0 sdx1; sx5 +- hc sdx1 0; sy2 +- vc 0 sdy2; sy3 +- vc sdy2 0",
			sites: "0 x4 y2; 0 x4 y3; cd4 x3 y4; cd4 hc b; cd4 x2 y4; cd2 x1 y3; cd2 x1 y2; 3cd4 x2 y1; 3cd4 hc t; 3cd4 x3 y1",
			text: "sx2 sy2 sx5 sy3"
		},
		star12: {
			defaults: { adj: 37500 },
			guides: "a pin 0 adj 50000; dx1 cos wd2 1800000; dy1 sin hd2 3600000; x1 +- hc 0 dx1; x3 */ w 3 4; x4 +- hc dx1 0; y1 +- vc 0 dy1; y3 */ h 3 4; y4 +- vc dy1 0; iwd2 */ wd2 a 50000; ihd2 */ hd2 a 50000; sdx2 cos iwd2 2700000; sdy2 sin ihd2 2700000; sx2 +- hc 0 sdx2; sx5 +- hc sdx2 0; sy2 +- vc 0 sdy2; sy5 +- vc sdy2 0",
			sites: "0 x4 hd4; 0 r vc; 0 x4 y3; cd4 x3 y4; cd4 hc b; cd4 wd4 y4; cd2 x1 y3; cd2 l vc; cd2 x1 hd4; 3cd4 wd4 y1; 3cd4 hc t; 3cd4 x3 y1",
			text: "sx2 sy2 sx5 sy5"
		},
		star16: {
			defaults: { adj: 37500 },
			guides: "a pin 0 adj 50000; dx1 */ wd2 92388 100000; dx2 */ wd2 70711 100000; dx3 */ wd2 38268 100000; dy1 */ hd2 92388 100000; dy2 */ hd2 70711 100000; dy3 */ hd2 38268 100000; x1 +- hc 0 dx1; x2 +- hc 0 dx2; x3 +- hc 0 dx3; x4 +- hc dx3 0; x5 +- hc dx2 0; x6 +- hc dx1 0; y1 +- vc 0 dy1; y2 +- vc 0 dy2; y3 +- vc 0 dy3; y4 +- vc dy3 0; y5 +- vc dy2 0; y6 +- vc dy1 0; iwd2 */ wd2 a 50000; ihd2 */ hd2 a 50000; idx cos iwd2 2700000; idy sin ihd2 2700000; il +- hc 0 idx; it +- vc 0 idy; ir +- hc idx 0; ib +- vc idy 0",
			sites: "0 x5 y2; 0 x6 y3; 0 r vc; 0 x6 y4; 0 x5 y5; cd4 x4 y6; cd4 hc b; cd4 x3 y6; cd2 x2 y5; cd2 x1 y4; cd2 l vc; cd2 x1 y3; cd2 x2 y2; 3cd4 x3 y1; 3cd4 hc t; 3cd4 x4 y1",
			text: "il it ir ib"
		},
		star24: {
			defaults: { adj: 37500 },
			guides: "a pin 0 adj 50000; iwd2 */ wd2 a 50000; ihd2 */ hd2 a 50000; idx cos iwd2 2700000; idy sin ihd2 2700000; il +- hc 0 idx; it +- vc 0 idy; ir +- hc idx 0; ib +- vc idy 0",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "il it ir ib"
		},
		star32: {
			defaults: { adj: 37500 },
			guides: "a pin 0 adj 50000; iwd2 */ wd2 a 50000; ihd2 */ hd2 a 50000; idx cos iwd2 2700000; idy sin ihd2 2700000; il +- hc 0 idx; it +- vc 0 idy; ir +- hc idx 0; ib +- vc idy 0",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "il it ir ib"
		},
		ribbonUp: {
			defaults: {
				adj1: 16667,
				adj2: 5e4
			},
			guides: "a1 pin 0 adj1 33333; a2 pin 25000 adj2 75000; x10 +- r 0 wd8; dx2 */ w a2 200000; x2 +- hc 0 dx2; x9 +- hc dx2 0; dy2 */ h a1 100000; y2 +- b 0 dy2; y4 +- t dy2 0; y3 +/ y4 b 2",
			sites: "3cd4 hc t; cd2 wd8 y3; cd4 hc y2; 0 x10 y3",
			text: "x2 t x9 y2"
		},
		ribbonDown: {
			defaults: {
				adj1: 16667,
				adj2: 5e4
			},
			guides: "a1 pin 0 adj1 33333; a2 pin 25000 adj2 75000; x10 +- r 0 wd8; dx2 */ w a2 200000; x2 +- hc 0 dx2; x9 +- hc dx2 0; y2 */ h a1 100000; y4 +- b 0 y2; y3 */ y4 1 2",
			sites: "3cd4 hc y2; cd2 wd8 y3; cd4 hc b; 0 x10 y3",
			text: "x2 y2 x9 b"
		},
		curvedRibbonUp: {
			defaults: {
				adj1: 25e3,
				adj2: 5e4,
				adj3: 12500
			},
			guides: "a1 pin 0 adj1 100000; a2 pin 25000 adj2 75000; q10 +- 100000 0 a1; q11 */ q10 1 2; q12 +- a1 0 q11; minAdj3 max 0 q12; a3 pin minAdj3 adj3 a1; dx2 */ w a2 200000; x2 +- hc 0 dx2; x3 +- x2 wd8 0; x5 +- r 0 x2; x6 +- r 0 wd8; dy1 */ h a3 100000; f1 */ 4 dy1 w; q1 */ x3 x3 w; q1 */ h a1 100000; dy3 +- q1 0 dy1; q3 */ x2 x2 w; q4 +- x2 0 q3; q5 */ f1 q4 1; u3 +- q5 dy3 0; rh +- b 0 q1; q8 */ dy1 14 16; u2 +/ q8 rh 2; y2 +- b 0 u2; u6 +- u3 rh 0; y6 +- b 0 u6",
			sites: "3cd4 hc t; cd2 wd8 y2; cd4 hc rh; 0 x6 y2",
			text: "x2 y6 x5 rh"
		},
		curvedRibbonDown: {
			defaults: {
				adj1: 25e3,
				adj2: 5e4,
				adj3: 12500
			},
			guides: "a1 pin 0 adj1 100000; a2 pin 25000 adj2 75000; q10 +- 100000 0 a1; q11 */ q10 1 2; q12 +- a1 0 q11; minAdj3 max 0 q12; a3 pin minAdj3 adj3 a1; dx2 */ w a2 200000; x2 +- hc 0 dx2; x3 +- x2 wd8 0; x5 +- r 0 x2; x6 +- r 0 wd8; dy1 */ h a3 100000; f1 */ 4 dy1 w; q1 */ x3 x3 w; q1 */ h a1 100000; dy3 +- q1 0 dy1; q3 */ x2 x2 w; q4 +- x2 0 q3; q5 */ f1 q4 1; y3 +- q5 dy3 0; rh +- b 0 q1; q8 */ dy1 14 16; y2 +/ q8 rh 2; y6 +- y3 rh 0",
			sites: "3cd4 hc q1; cd2 wd8 y2; cd4 hc b; 0 x6 y2",
			text: "x2 q1 x5 y6"
		},
		leftRightRibbon: {
			defaults: {
				adj1: 5e4,
				adj2: 5e4,
				adj3: 16667
			},
			guides: "a3 pin 0 adj3 33333; maxAdj1 +- 100000 0 a3; a1 pin 0 adj1 maxAdj1; w1 +- wd2 0 wd32; maxAdj2 */ 100000 w1 ss; a2 pin 0 adj2 maxAdj2; x1 */ ss a2 100000; x4 +- r 0 x1; dy1 */ h a1 200000; dy2 */ h a3 -200000; ly1 +- vc dy2 dy1; ry4 +- vc dy1 dy2; ly2 +- ly1 dy1 0; ry3 +- b 0 ly2; ly4 */ ly2 2 1; ry1 +- b 0 ly4",
			sites: "0 r ry3; cd4 x4 b; cd4 x1 ly4; cd2 l ly2; 3cd4 x1 t; 3cd4 x4 ry1",
			text: "x1 ly1 x4 ry4"
		},
		verticalScroll: {
			defaults: { adj: 12500 },
			guides: "a pin 0 adj 25000; ch */ ss a 100000; ch2 */ ch 1 2; x6 +- r 0 ch; y4 +- b 0 ch2",
			sites: "3cd4 hc t; 0 ch vc; cd4 hc b; cd2 x6 vc",
			text: "ch ch x6 y4"
		},
		horizontalScroll: {
			defaults: { adj: 12500 },
			guides: "a pin 0 adj 25000; ch */ ss a 100000; ch2 */ ch 1 2; y6 +- b 0 ch; x4 +- r 0 ch2",
			sites: "cd4 hc ch; cd2 l vc; 3cd4 hc y6; 0 r vc",
			text: "ch ch x4 y6"
		},
		wave: {
			defaults: {
				adj1: 12500,
				adj2: 0
			},
			guides: "a1 pin 0 adj1 20000; a2 pin -10000 adj2 10000; y1 */ h a1 100000; y4 +- b 0 y1; dx1 */ w a2 100000; of2 */ w a2 50000; x1 abs dx1; dx2 ?: of2 0 of2; x2 +- l 0 dx2; dx5 ?: of2 of2 0; x5 +- r 0 dx5; x6 +- l dx5 0; x10 +- r dx2 0; x9 +- r 0 x1; xAdj +- hc dx1 0; xAdj2 +- hc 0 dx1; il max x2 x6; ir min x5 x10; it */ h a1 50000; ib +- b 0 it",
			sites: "cd4 xAdj2 y1; cd2 x1 vc; 3cd4 xAdj y4; 0 x9 vc",
			text: "il it ir ib"
		},
		doubleWave: {
			defaults: {
				adj1: 6250,
				adj2: 0
			},
			guides: "a1 pin 0 adj1 12500; a2 pin -10000 adj2 10000; y1 */ h a1 100000; y4 +- b 0 y1; dx1 */ w a2 100000; of2 */ w a2 50000; x1 abs dx1; dx2 ?: of2 0 of2; x2 +- l 0 dx2; dx8 ?: of2 of2 0; x8 +- r 0 dx8; x5 +/ x2 x8 2; x9 +- l dx8 0; x15 +- r dx2 0; x12 +/ x9 x15 2; x16 +- r 0 x1; il max x2 x9; ir min x8 x15; it */ h a1 50000; ib +- b 0 it",
			sites: "cd4 x12 y1; cd2 x1 vc; 3cd4 x5 y4; 0 x16 vc",
			text: "il it ir ib"
		},
		rectangularCallout: {
			defaults: {
				adj1: -20833,
				adj2: 62500
			},
			guides: "dxPos */ w adj1 100000; dyPos */ h adj2 100000; xPos +- hc dxPos 0; yPos +- vc dyPos 0",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc; cd4 xPos yPos"
		},
		roundedRectangularCallout: {
			defaults: {
				adj1: -20833,
				adj2: 62500,
				adj3: 16667
			},
			guides: "dxPos */ w adj1 100000; dyPos */ h adj2 100000; xPos +- hc dxPos 0; yPos +- vc dyPos 0; u1 */ ss adj3 100000; il */ u1 29289 100000; ir +- r 0 il; ib +- b 0 il",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc; cd4 xPos yPos",
			text: "il il ir ib"
		},
		ellipticalCallout: {
			defaults: {
				adj1: -20833,
				adj2: 62500
			},
			guides: "dxPos */ w adj1 100000; dyPos */ h adj2 100000; xPos +- hc dxPos 0; yPos +- vc dyPos 0; sdx */ dxPos h 1; sdy */ dyPos w 1; pang at2 sdx sdy; idx cos wd2 2700000; idy sin hd2 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "3cd4 hc t; 3cd4 il it; cd4 il ib; cd4 hc b; cd4 ir ib; 0 r vc; 3cd4 ir it; pang xPos yPos",
			text: "il it ir ib"
		},
		cloudCallout: {
			defaults: {
				adj1: -20833,
				adj2: 62500
			},
			guides: "dxPos */ w adj1 100000; dyPos */ h adj2 100000; xPos +- hc dxPos 0; yPos +- vc dyPos 0; il */ w 2977 21600; it */ h 3262 21600; ir */ w 17087 21600; ib */ h 17337 21600; g27 */ w 67 21600; g28 */ h 21577 21600; g29 */ w 21582 21600; g30 */ h 1235 21600; pang at2 dxPos dyPos",
			sites: "cd2 g27 vc; cd4 hc g28; 0 g29 vc; 3cd4 hc g30; pang xPos yPos",
			text: "il it ir ib"
		},
		lineCallout: {
			defaults: {
				adj1: 18750,
				adj2: -8333,
				adj3: 112500,
				adj4: -38333
			},
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t"
		},
		bentLineCallout: {
			defaults: {
				adj1: 18750,
				adj2: -8333,
				adj3: 18750,
				adj4: -16667,
				adj5: 112500,
				adj6: -46667
			},
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t"
		},
		doubleBentLineCallout: {
			defaults: {
				adj1: 18750,
				adj2: -8333,
				adj3: 18750,
				adj4: -16667,
				adj5: 1e5,
				adj6: -16667,
				adj7: 112963,
				adj8: -8333
			},
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t"
		},
		lineCalloutWithAccentBar: {
			defaults: {
				adj1: 18750,
				adj2: -8333,
				adj3: 112500,
				adj4: -38333
			},
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t"
		},
		bentLineCalloutWithAccentBar: {
			defaults: {
				adj1: 18750,
				adj2: -8333,
				adj3: 18750,
				adj4: -16667,
				adj5: 112500,
				adj6: -46667
			},
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t"
		},
		doubleBentLineCalloutWithAccentBar: {
			defaults: {
				adj1: 18750,
				adj2: -8333,
				adj3: 18750,
				adj4: -16667,
				adj5: 1e5,
				adj6: -16667,
				adj7: 112963,
				adj8: -8333
			},
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t"
		},
		lineCalloutWithNoBorder: {
			defaults: {
				adj1: 18750,
				adj2: -8333,
				adj3: 112500,
				adj4: -38333
			},
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t"
		},
		bentLineCalloutWithNoBorder: {
			defaults: {
				adj1: 18750,
				adj2: -8333,
				adj3: 18750,
				adj4: -16667,
				adj5: 112500,
				adj6: -46667
			},
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t"
		},
		doubleBentLineCalloutWithNoBorder: {
			defaults: {
				adj1: 18750,
				adj2: -8333,
				adj3: 18750,
				adj4: -16667,
				adj5: 1e5,
				adj6: -16667,
				adj7: 112963,
				adj8: -8333
			},
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t"
		},
		lineCalloutWithBorderAndAccentBar: {
			defaults: {
				adj1: 18750,
				adj2: -8333,
				adj3: 112500,
				adj4: -38333
			},
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t"
		},
		bentLineCalloutWithBorderAndAccentBar: {
			defaults: {
				adj1: 18750,
				adj2: -8333,
				adj3: 18750,
				adj4: -16667,
				adj5: 112500,
				adj6: -46667
			},
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t"
		},
		doubleBentLineCalloutWithBorderAndAccentBar: {
			defaults: {
				adj1: 18750,
				adj2: -8333,
				adj3: 18750,
				adj4: -16667,
				adj5: 1e5,
				adj6: -16667,
				adj7: 112963,
				adj8: -8333
			},
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t"
		},
		actionButtonBlank: { sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t" },
		actionButtonHome: { sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t" },
		actionButtonHelp: { sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t" },
		actionButtonInformation: { sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t" },
		actionButtonForwardNext: { sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t" },
		actionButtonBackPrevious: { sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t" },
		actionButtonEnd: { sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t" },
		actionButtonBeginning: { sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t" },
		actionButtonReturn: { sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t" },
		actionButtonDocument: { sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t" },
		actionButtonSound: { sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t" },
		actionButtonMovie: { sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t" },
		gear6: {
			defaults: {
				adj1: 15e3,
				adj2: 3526
			},
			guides: "a1 pin 0 adj1 20000; a2 pin 0 adj2 5358; th */ ss a1 100000; lFD */ ss a2 100000; th2 */ th 1 2; l2 */ lFD 1 2; l3 +- th2 l2 0; rh +- hd2 0 th; rw +- wd2 0 th; dr +- rw 0 rh; maxr ?: dr rh rw; ha at2 maxr l3; aA1 +- 19800000 0 ha; aD1 +- 19800000 ha 0; ta11 cos rw aA1; ta12 sin rh aA1; bA1 at2 ta11 ta12; cta1 cos rh bA1; sta1 sin rw bA1; ma1 mod cta1 sta1 0; na1 */ rw rh ma1; dxa1 cos na1 bA1; dya1 sin na1 bA1; xA1 +- hc dxa1 0; yA1 +- vc dya1 0; td11 cos rw aD1; td12 sin rh aD1; bD1 at2 td11 td12; ctd1 cos rh bD1; std1 sin rw bD1; md1 mod ctd1 std1 0; nd1 */ rw rh md1; dxd1 cos nd1 bD1; dyd1 sin nd1 bD1; xD1 +- hc dxd1 0; yD1 +- vc dyd1 0; xAD1 +- xA1 0 xD1; yAD1 +- yA1 0 yD1; a1 at2 yAD1 xAD1; dxF1 sin lFD a1; dyF1 cos lFD a1; xF1 +- xD1 dxF1 0; yF1 +- yD1 dyF1 0; xE1 +- xA1 0 dxF1; yE1 +- yA1 0 dyF1; yC1t sin th a1; xC1t cos th a1; yC1 +- yF1 yC1t 0; xC1 +- xF1 0 xC1t; yB1 +- yE1 yC1t 0; xB1 +- xE1 0 xC1t; aD6 +- 3cd4 ha 0; td61 cos rw aD6; td62 sin rh aD6; bD6 at2 td61 td62; ctd6 cos rh bD6; std6 sin rw bD6; md6 mod ctd6 std6 0; nd6 */ rw rh md6; dyd6 sin nd6 bD6; yD6 +- vc dyd6 0; yC6 +- yD6 0 th; yD2 +- h 0 yA1; yB3 +- h 0 yC6; xD5 +- w 0 xA1; xCxn1 +/ xB1 xC1 2; yCxn1 +/ yB1 yC1 2; yCxn2 +- b 0 yCxn1; xCxn4 +/ r 0 xCxn1",
			sites: "19800000 xCxn1 yCxn1; 1800000 xCxn1 yCxn2; cd4 hc yB3; 9000000 xCxn4 yCxn2; 12600000 xCxn4 yCxn1; 3cd4 hc yC6",
			text: "xD5 yA1 xA1 yD2"
		},
		gear9: {
			defaults: {
				adj1: 1e4,
				adj2: 1763
			},
			guides: "a1 pin 0 adj1 20000; a2 pin 0 adj2 2679; th */ ss a1 100000; lFD */ ss a2 100000; th2 */ th 1 2; l2 */ lFD 1 2; l3 +- th2 l2 0; rh +- hd2 0 th; rw +- wd2 0 th; dr +- rw 0 rh; maxr ?: dr rh rw; ha at2 maxr l3; aA1 +- 18600000 0 ha; aD1 +- 18600000 ha 0; ta11 cos rw aA1; ta12 sin rh aA1; bA1 at2 ta11 ta12; cta1 cos rh bA1; sta1 sin rw bA1; ma1 mod cta1 sta1 0; na1 */ rw rh ma1; dxa1 cos na1 bA1; dya1 sin na1 bA1; xA1 +- hc dxa1 0; yA1 +- vc dya1 0; td11 cos rw aD1; td12 sin rh aD1; bD1 at2 td11 td12; ctd1 cos rh bD1; std1 sin rw bD1; md1 mod ctd1 std1 0; nd1 */ rw rh md1; dxd1 cos nd1 bD1; dyd1 sin nd1 bD1; xD1 +- hc dxd1 0; yD1 +- vc dyd1 0; xAD1 +- xA1 0 xD1; yAD1 +- yA1 0 yD1; a1 at2 yAD1 xAD1; dxF1 sin lFD a1; dyF1 cos lFD a1; xF1 +- xD1 dxF1 0; yF1 +- yD1 dyF1 0; xE1 +- xA1 0 dxF1; yE1 +- yA1 0 dyF1; yC1t sin th a1; xC1t cos th a1; yC1 +- yF1 yC1t 0; xC1 +- xF1 0 xC1t; yB1 +- yE1 yC1t 0; xB1 +- xE1 0 xC1t; aA2 +- 21000000 0 ha; aD2 +- 21000000 ha 0; ta21 cos rw aA2; ta22 sin rh aA2; bA2 at2 ta21 ta22; cta2 cos rh bA2; sta2 sin rw bA2; ma2 mod cta2 sta2 0; na2 */ rw rh ma2; dxa2 cos na2 bA2; dya2 sin na2 bA2; xA2 +- hc dxa2 0; yA2 +- vc dya2 0; td21 cos rw aD2; td22 sin rh aD2; bD2 at2 td21 td22; ctd2 cos rh bD2; std2 sin rw bD2; md2 mod ctd2 std2 0; nd2 */ rw rh md2; dxd2 cos nd2 bD2; dyd2 sin nd2 bD2; xD2 +- hc dxd2 0; yD2 +- vc dyd2 0; xAD2 +- xA2 0 xD2; yAD2 +- yA2 0 yD2; a2 at2 yAD2 xAD2; dxF2 sin lFD a2; dyF2 cos lFD a2; xF2 +- xD2 dxF2 0; yF2 +- yD2 dyF2 0; xE2 +- xA2 0 dxF2; yE2 +- yA2 0 dyF2; yC2t sin th a2; xC2t cos th a2; yC2 +- yF2 yC2t 0; xC2 +- xF2 0 xC2t; yB2 +- yE2 yC2t 0; xB2 +- xE2 0 xC2t; aA3 +- 1800000 0 ha; aD3 +- 1800000 ha 0; ta31 cos rw aA3; ta32 sin rh aA3; bA3 at2 ta31 ta32; cta3 cos rh bA3; sta3 sin rw bA3; ma3 mod cta3 sta3 0; na3 */ rw rh ma3; dxa3 cos na3 bA3; dya3 sin na3 bA3; xA3 +- hc dxa3 0; yA3 +- vc dya3 0; td31 cos rw aD3; td32 sin rh aD3; bD3 at2 td31 td32; ctd3 cos rh bD3; std3 sin rw bD3; md3 mod ctd3 std3 0; nd3 */ rw rh md3; dxd3 cos nd3 bD3; dyd3 sin nd3 bD3; xD3 +- hc dxd3 0; yD3 +- vc dyd3 0; xAD3 +- xA3 0 xD3; yAD3 +- yA3 0 yD3; a3 at2 yAD3 xAD3; dxF3 sin lFD a3; dyF3 cos lFD a3; xF3 +- xD3 dxF3 0; yF3 +- yD3 dyF3 0; xE3 +- xA3 0 dxF3; yE3 +- yA3 0 dyF3; yC3t sin th a3; xC3t cos th a3; yC3 +- yF3 yC3t 0; xC3 +- xF3 0 xC3t; yB3 +- yE3 yC3t 0; xB3 +- xE3 0 xC3t; aA4 +- 4200000 0 ha; aD4 +- 4200000 ha 0; ta41 cos rw aA4; ta42 sin rh aA4; bA4 at2 ta41 ta42; cta4 cos rh bA4; sta4 sin rw bA4; ma4 mod cta4 sta4 0; na4 */ rw rh ma4; dxa4 cos na4 bA4; dya4 sin na4 bA4; xA4 +- hc dxa4 0; yA4 +- vc dya4 0; td41 cos rw aD4; td42 sin rh aD4; bD4 at2 td41 td42; ctd4 cos rh bD4; std4 sin rw bD4; md4 mod ctd4 std4 0; nd4 */ rw rh md4; dxd4 cos nd4 bD4; dyd4 sin nd4 bD4; xD4 +- hc dxd4 0; yD4 +- vc dyd4 0; xAD4 +- xA4 0 xD4; yAD4 +- yA4 0 yD4; a4 at2 yAD4 xAD4; dxF4 sin lFD a4; dyF4 cos lFD a4; xF4 +- xD4 dxF4 0; yF4 +- yD4 dyF4 0; xE4 +- xA4 0 dxF4; yE4 +- yA4 0 dyF4; yC4t sin th a4; xC4t cos th a4; yC4 +- yF4 yC4t 0; xC4 +- xF4 0 xC4t; yB4 +- yE4 yC4t 0; xB4 +- xE4 0 xC4t; xA8 +- w 0 xD1; aD9 +- 3cd4 ha 0; td91 cos rw aD9; td92 sin rh aD9; bD9 at2 td91 td92; ctd9 cos rh bD9; std9 sin rw bD9; md9 mod ctd9 std9 0; nd9 */ rw rh md9; dyd9 sin nd9 bD9; yD9 +- vc dyd9 0; yC9 +- yD9 0 th; xCxn1 +/ xB1 xC1 2; yCxn1 +/ yB1 yC1 2; xCxn2 +/ xB2 xC2 2; yCxn2 +/ yB2 yC2 2; xCxn3 +/ xB3 xC3 2; yCxn3 +/ yB3 yC3 2; xCxn4 +/ xB4 xC4 2; yCxn4 +/ yB4 yC4 2; xCxn5 +/ r 0 xCxn4; xCxn6 +/ r 0 xCxn3; xCxn7 +/ r 0 xCxn2; xCxn8 +/ r 0 xCxn1",
			sites: "18600000 xCxn1 yCxn1; 21000000 xCxn2 yCxn2; 1800000 xCxn3 yCxn3; 4200000 xCxn4 yCxn4; 6600000 xCxn5 yCxn4; 9000000 xCxn6 yCxn3; 11400000 xCxn7 yCxn2; 13800000 xCxn8 yCxn1; 3cd4 hc yC9",
			text: "xA8 yD1 xD1 yD3"
		},
		cornerTabs: {
			guides: "md mod w h 0; dx */ 1 md 20; y1 +- 0 b dx; x1 +- 0 r dx",
			sites: "cd2 l t; cd2 l dx; cd2 l y1; cd2 l b; 3cd4 dx t; 3cd4 x1 t; cd4 dx b; cd4 x1 b; 0 r t; 0 r dx; 0 r y1; 0 r b",
			text: "dx dx x1 y1"
		},
		squareTabs: {
			guides: "md mod w h 0; dx */ 1 md 20; y1 +- 0 b dx; x1 +- 0 r dx",
			sites: "cd2 l t; cd2 l dx; cd2 l y1; cd2 l b; cd2 dx dx; cd2 dx x1; 3cd4 dx t; 3cd4 x1 t; cd4 dx b; cd4 x1 b; 0 r t; 0 r dx; 0 r y1; 0 r b; 0 x1 dx; 0 x1 y1",
			text: "dx dx x1 y1"
		},
		plaqueTabs: {
			guides: "md mod w h 0; dx */ 1 md 20; y1 +- 0 b dx; x1 +- 0 r dx",
			sites: "cd2 l t; cd2 l dx; cd2 l y1; cd2 l b; 3cd4 dx t; 3cd4 x1 t; cd4 dx b; cd4 x1 b; 0 r t; 0 r dx; 0 r y1; 0 r b",
			text: "dx dx x1 y1"
		}
	};
	//#endregion
	//#region src/shapes/text-metrics/text-rectangle.ts
	/**
	* The box a preset shape's text is written in, such as the middle of an ellipse or a diamond.
	*
	* Reference: ECMA-376 Part 1, 20.1.9.22 rect (Shape Text Rectangle)
	*
	* @module
	*/
	/**
	* The box a preset shape of the given size writes its text in, before the text's margins. Shapes without
	* a text box of their own, and custom shapes, write their text across the whole shape.
	*
	* @param adjustments - The shape's adjustment guide values, such as `{ adj: 25000 }`. Missing values take their defaults
	*/
	var getTextRectangle = (type, width, height, adjustments) => {
		const definition = type === "custom" ? void 0 : PRESET_SHAPE_GEOMETRY[type];
		if (!(definition === null || definition === void 0 ? void 0 : definition.text)) return {
			left: 0,
			top: 0,
			right: width,
			bottom: height
		};
		const value = evaluateShapeGuides(definition, width, height, adjustments);
		const [left, top, right, bottom] = definition.text.split(" ").map(value);
		return {
			left,
			top,
			right,
			bottom
		};
	};
	//#endregion
	//#region src/shapes/shape-text-size.ts
	/**
	* Sizes shapes to fit their text: reads the text and fonts of a shape's paragraphs, and finds the width or height
	* at which the text fits inside the shape's text box. Not part of the public API.
	*
	* @module
	*/
	var EMUS_PER_PIXEL$5 = 9525;
	var POINTS_PER_PIXEL = .75;
	var DEFAULT_MARGINS = {
		top: 3.6,
		right: 7.2,
		bottom: 3.6,
		left: 7.2
	};
	var FIT_ALLOWANCE = 2;
	/**
	* Creates the paragraphs for a shape's `text`: one centred paragraph for each line. When the document's paragraphs
	* have space before or after them, these don't, so the text stays in the middle of the shape.
	*/
	var createTextParagraphs = (text, styles = WORD_DEFAULT_STYLES) => {
		const spacing = hasDefaultParagraphSpacing(styles) ? {
			before: 0,
			after: 0
		} : void 0;
		return text.split("\n").map((line) => new docx.Paragraph({
			alignment: docx.AlignmentType.CENTER,
			spacing,
			children: [new docx.TextRun(line)]
		}));
	};
	/**
	* Finds the length of a shape's side at which its text box is `needed` long. Most text boxes are a fixed part of the
	* shape, or the shape less a fixed length, so this settles in a few steps.
	*/
	var solveLength = (needed, textLength) => {
		let length = Math.max(needed, 1);
		for (let step = 0; step < 10; step++) {
			const current = textLength(length);
			if (Math.abs(current - needed) < .01) break;
			length = current > 0 ? length * (needed / current) : length + needed;
		}
		return length;
	};
	/**
	* A size in pixels, or `"fitText"`: a percentage becomes the pixels it is of `base`.
	*
	* @throws If the size is a percentage and there is nothing it can be a percentage of
	*/
	var resolvePercentage = (size, option, base) => {
		const percentage = size === "fitText" ? void 0 : percentageOf(size, option);
		if (percentage === void 0) return size;
		if (base === void 0) throw new Error(`Invalid ${option} "${size}". Only a floating shape can be a percentage of the page`);
		return base * percentage / 100;
	};
	/**
	* Works out a shape's width or height when it is `"fitText"`, from its text, the document's styles, and the shape's
	* margins and text box. The size is an estimate: text is measured with the widths of common fonts.
	*
	* @param styles - The document's styles. Default is Word's own defaults
	* @param percentageBase - What a percentage width and height are percentages of, in pixels. Without it, a size can't be a percentage
	* @returns The transformation with both sizes in pixels
	* @throws If a size is a percentage without a `percentageBase`
	*/
	var resolveShapeSize = (options, styles = WORD_DEFAULT_STYLES, percentageBase) => {
		var _options$children;
		const transformation = _objectSpread2(_objectSpread2({}, options.transformation), {}, {
			width: resolvePercentage(options.transformation.width, "width", percentageBase === null || percentageBase === void 0 ? void 0 : percentageBase.width),
			height: resolvePercentage(options.transformation.height, "height", percentageBase === null || percentageBase === void 0 ? void 0 : percentageBase.height)
		});
		if (transformation.width !== "fitText" && transformation.height !== "fitText") return _objectSpread2(_objectSpread2({}, transformation), {}, {
			width: transformation.width,
			height: transformation.height
		});
		const written = [...options.text === void 0 ? [] : createTextParagraphs(options.text, styles), ...(_options$children = options.children) !== null && _options$children !== void 0 ? _options$children : []];
		const paragraphs = readTextParagraphs(written.length > 0 ? written : [new docx.Paragraph({})], styles);
		const { textOptions = {} } = options;
		const guides = options.type === "custom" ? void 0 : createShapeGuides(options.type, options.adjustments);
		const margins = _objectSpread2(_objectSpread2({}, DEFAULT_MARGINS), textOptions.margins);
		const turned = textOptions.direction !== void 0 && textOptions.direction !== "horizontal";
		const across = turned ? transformation.height : transformation.width;
		const along = turned ? transformation.width : transformation.height;
		const textBox = (acrossSize, alongSize) => {
			const [width, height] = turned ? [alongSize, acrossSize] : [acrossSize, alongSize];
			const box = options.type === "custom" ? getCustomTextRectangle(options, width * EMUS_PER_PIXEL$5, height * EMUS_PER_PIXEL$5) : getTextRectangle(options.type, width * EMUS_PER_PIXEL$5, height * EMUS_PER_PIXEL$5, guides);
			const size = {
				width: (box.right - box.left) / EMUS_PER_PIXEL$5,
				height: (box.bottom - box.top) / EMUS_PER_PIXEL$5
			};
			return turned ? {
				across: size.height,
				along: size.width
			} : {
				across: size.width,
				along: size.height
			};
		};
		const acrossMargins = (turned ? margins.top + margins.bottom : margins.left + margins.right) / POINTS_PER_PIXEL;
		const alongMargins = (turned ? margins.left + margins.right : margins.top + margins.bottom) / POINTS_PER_PIXEL;
		const natural = measureText(paragraphs);
		const guessAlong = typeof along === "number" ? along : natural.height / POINTS_PER_PIXEL + alongMargins;
		const fitAcross = (alongSize) => across === "fitText" ? Math.ceil(solveLength(natural.width / POINTS_PER_PIXEL + acrossMargins + FIT_ALLOWANCE, (length) => textBox(length, alongSize).across)) : across;
		const fitAlong = (acrossSize, alongSize) => {
			if (along !== "fitText") return along;
			const wrapWidth = textOptions.wrap === false ? void 0 : Math.max(0, textBox(acrossSize, alongSize).across - acrossMargins);
			const textHeight = measureText(paragraphs, wrapWidth === void 0 ? void 0 : wrapWidth * POINTS_PER_PIXEL).height;
			return Math.ceil(solveLength(textHeight / POINTS_PER_PIXEL + alongMargins, (length) => textBox(acrossSize, length).along));
		};
		let acrossLength = fitAcross(guessAlong);
		let alongLength = fitAlong(acrossLength, guessAlong);
		for (let step = 0; step < 5; step++) {
			const nextAcross = fitAcross(alongLength);
			const nextAlong = fitAlong(nextAcross, alongLength);
			if (nextAcross === acrossLength && nextAlong === alongLength) break;
			acrossLength = nextAcross;
			alongLength = nextAlong;
		}
		return _objectSpread2(_objectSpread2({}, transformation), {}, {
			width: turned ? alongLength : acrossLength,
			height: turned ? acrossLength : alongLength
		});
	};
	//#endregion
	//#region src/shapes/drawing/styled-drawing.ts
	/**
	* Drawings whose layout depends on the document's styles, such as a shape sized to fit its text.
	*
	* @module
	*/
	/**
	* Everything about a drawing's text that the document's styles can change: how its paragraphs, and those written for
	* `text`, are formatted, and whether `text` is written without paragraph spacing. Two styles with the same key lay
	* the drawing out the same way.
	*/
	var stylesKey = (paragraphs, styles) => JSON.stringify([hasDefaultParagraphSpacing(styles), readTextParagraphs([...createTextParagraphs("", styles), ...paragraphs], styles)]);
	/**
	* A drawing that is laid out again, in the document's styles, when it is written. A shape doesn't know which document
	* it is in until then.
	*
	* It is also laid out in Word's default styles when it is created, so mistakes in its options throw straight away,
	* and that layout is written when the document's styles format its text the same way. The drawing ids are given
	* before either layout, so both have the same ids.
	*/
	var StyledDrawing = class extends docx.XmlComponent {
		constructor(create, paragraphs) {
			super("w:drawing");
			_defineProperty(this, "create", void 0);
			_defineProperty(this, "paragraphs", void 0);
			_defineProperty(this, "drawings", /* @__PURE__ */ new WeakMap());
			_defineProperty(this, "defaultKey", void 0);
			this.create = create;
			this.paragraphs = paragraphs;
			this.drawings.set(WORD_DEFAULT_STYLES, create(WORD_DEFAULT_STYLES));
			this.defaultKey = stylesKey(paragraphs, WORD_DEFAULT_STYLES);
		}
		prepForXml(context) {
			var _this$drawings$get;
			const styles = getTextStyles(context);
			const drawing = (_this$drawings$get = this.drawings.get(styles)) !== null && _this$drawings$get !== void 0 ? _this$drawings$get : stylesKey(this.paragraphs, styles) === this.defaultKey ? this.drawings.get(WORD_DEFAULT_STYLES) : this.create(styles);
			this.drawings.set(styles, drawing);
			return drawing.prepForXml(context);
		}
	};
	/**
	* Creates a drawing, or a drawing that is laid out again in the document's styles when it is written if its layout
	* depends on them.
	*
	* @param create - Lays out and creates the drawing in the given styles
	* @param paragraphs - The paragraphs of text in the drawing, other than those written for `text`, or nothing if the
	* drawing's layout doesn't depend on the document's styles
	*/
	var createStyledDrawing = (create, paragraphs) => paragraphs ? new StyledDrawing(create, paragraphs) : create(WORD_DEFAULT_STYLES);
	//#endregion
	//#region src/shapes/connector/connection-sites.ts
	/**
	* Connection sites: the points on a preset shape where connectors attach.
	*
	* Reference: ECMA-376 Part 1, 20.1.9.9 cxn (Shape Connection Site)
	*
	* @module
	*/
	/**
	* The connection sites of a preset shape of the given size, in the order OOXML numbers them (`a:stCxn/@idx`).
	*
	* @param adjustments - The shape's adjustment guide values, such as `{ adj: 25000 }`. Missing values take their defaults
	* @returns No sites for shapes without any, such as lines and connectors
	*/
	var getConnectionSites = (type, width, height, adjustments) => {
		const definition = PRESET_SHAPE_GEOMETRY[type];
		if (!(definition === null || definition === void 0 ? void 0 : definition.sites)) return [];
		const value = evaluateShapeGuides(definition, width, height, adjustments);
		return definition.sites.split("; ").map((site) => {
			const [angle, x, y] = site.split(" ");
			return {
				x: value(x),
				y: value(y),
				angle: value(angle) / 6e4
			};
		});
	};
	//#endregion
	//#region src/shapes/connector/orthogonal-route.ts
	var unitOf = (angle) => {
		return [
			{
				x: 1,
				y: 0
			},
			{
				x: 0,
				y: 1
			},
			{
				x: -1,
				y: 0
			},
			{
				x: 0,
				y: -1
			}
		][(Math.round(angle / 90) % 4 + 4) % 4];
	};
	var sortedUnique = (values) => [...new Set(values.map(Math.round))].sort((a, b) => a - b);
	var passesThrough = (from, to, low, high) => Math.max(Math.min(from, to), low + 1) < Math.min(Math.max(from, to), high - 1);
	var isInside = (value, low, high) => value > low + 1 && value < high - 1;
	/**
	* The obstacles a route between two points might have to go around: those near the points, and those near them, and so on.
	*/
	var nearbyObstacles = (points, obstacles, margin) => {
		const grow = (region, found) => {
			const touching = obstacles.filter((obstacle) => !found.includes(obstacle) && obstacle.left <= region.right && region.left <= obstacle.right && obstacle.top <= region.bottom && region.top <= obstacle.bottom);
			if (touching.length === 0) return found;
			const all = [...found, ...touching];
			return grow({
				left: Math.min(region.left, ...touching.map(({ left }) => left - 2 * margin)),
				top: Math.min(region.top, ...touching.map(({ top }) => top - 2 * margin)),
				right: Math.max(region.right, ...touching.map(({ right }) => right + 2 * margin)),
				bottom: Math.max(region.bottom, ...touching.map(({ bottom }) => bottom + 2 * margin))
			}, all);
		};
		return grow({
			left: Math.min(...points.map(({ x }) => x)) - 2 * margin,
			top: Math.min(...points.map(({ y }) => y)) - 2 * margin,
			right: Math.max(...points.map(({ x }) => x)) + 2 * margin,
			bottom: Math.max(...points.map(({ y }) => y)) + 2 * margin
		}, []);
	};
	/**
	* The lines of the grid along one axis: through the ends, a margin outside each obstacle, and halfway between the
	* edges of obstacles, so routes can pass between shapes that are close together. A line a margin outside one obstacle
	* that is nearer than that to another is left out, and routes between them go halfway between.
	*/
	var gridLines = (ends, edges, margin) => {
		const sides = sortedUnique(edges.flat());
		const isClear = (line) => sides.every((side) => Math.abs(side - line) >= margin - 1);
		return sortedUnique([
			...ends,
			...edges.flatMap(([low, high]) => [low - margin, high + margin]).filter(isClear),
			...sides.slice(1).map((side, index) => (sides[index] + side) / 2)
		]);
	};
	/**
	* Finds a route with right-angled bends from one end to the other that goes through none of the obstacles. It leaves
	* each end at right angles to its shape and goes at least `margin` before turning.
	*
	* @returns The ends and corners of the route, or nothing if there is no such route
	*/
	var findOrthogonalRoute = (start, end, margin, allObstacles) => {
		const leaving = unitOf(start.angle);
		const arriving = unitOf(end.angle);
		const first = {
			x: start.point.x + leaving.x * margin,
			y: start.point.y + leaving.y * margin
		};
		const last = {
			x: end.point.x + arriving.x * margin,
			y: end.point.y + arriving.y * margin
		};
		const obstacles = nearbyObstacles([start.point, end.point], allObstacles, margin);
		const xs = gridLines([first.x, last.x], obstacles.map(({ left, right }) => [left, right]), margin);
		const ys = gridLines([first.y, last.y], obstacles.map(({ top, bottom }) => [top, bottom]), margin);
		const pointAt = (column, row) => ({
			x: xs[column],
			y: ys[row]
		});
		const blocked = (from, to) => obstacles.some((obstacle) => from.y === to.y ? isInside(from.y, obstacle.top, obstacle.bottom) && passesThrough(from.x, to.x, obstacle.left, obstacle.right) : isInside(from.x, obstacle.left, obstacle.right) && passesThrough(from.y, to.y, obstacle.top, obstacle.bottom));
		const ray = (from, axis, step) => {
			const reach = (current) => {
				const column = axis === "x" ? current.column + step : current.column;
				const row = axis === "y" ? current.row + step : current.row;
				if (column < 0 || row < 0 || column >= xs.length || row >= ys.length) return [];
				const here = pointAt(current.column, current.row);
				const there = pointAt(column, row);
				if (blocked(here, there)) return [];
				const next = {
					column,
					row,
					axis,
					step,
					length: current.length + Math.abs(there.x - here.x) + Math.abs(there.y - here.y),
					previous: from
				};
				return [next, ...reach(next)];
			};
			return reach(from);
		};
		const keyOf = ({ column, row, axis, step }) => `${column},${row},${axis},${step}`;
		const shortest = (reached) => [...new Map([...reached].sort((a, b) => b.length - a.length).map((point) => [keyOf(point), point])).values()];
		const leavingAxis = leaving.x === 0 ? "y" : "x";
		const leavingStep = leavingAxis === "x" ? leaving.x : leaving.y;
		const arrivingAxis = arriving.x === 0 ? "y" : "x";
		const arrivingStep = -(arrivingAxis === "x" ? arriving.x : arriving.y);
		const origin = {
			column: xs.indexOf(Math.round(first.x)),
			row: ys.indexOf(Math.round(first.y)),
			axis: leavingAxis,
			step: leavingStep,
			length: margin
		};
		const goal = {
			column: xs.indexOf(Math.round(last.x)),
			row: ys.indexOf(Math.round(last.y))
		};
		const search = (frontier, seen) => {
			if (frontier.length === 0) return;
			const arrived = frontier.filter(({ column, row, axis, step }) => column === goal.column && row === goal.row && (axis !== arrivingAxis || step === arrivingStep)).map((point) => ({
				point,
				bends: point.axis === arrivingAxis ? 0 : 1
			})).sort((a, b) => a.bends - b.bends || a.point.length - b.point.length);
			if (arrived.length > 0) return arrived[0].point;
			const next = shortest(frontier.flatMap((point) => {
				const across = point.axis === "x" ? "y" : "x";
				return [...ray(point, across, 1), ...ray(point, across, -1)];
			})).filter((point) => !seen.has(keyOf(point)));
			return search(next, /* @__PURE__ */ new Set([...seen, ...next.map(keyOf)]));
		};
		const leaves = shortest([origin, ...ray(origin, leavingAxis, leavingStep)]);
		const found = search(leaves, new Set(leaves.map(keyOf)));
		if (!found) return;
		const turns = (point) => point ? [...turns(point.previous), pointAt(point.column, point.row)] : [];
		const corners = [
			start.point,
			...turns(found),
			end.point
		];
		return corners.filter((point, index) => {
			const before = corners[index - 1];
			const after = corners[index + 1];
			return !before || !after || !(before.x === point.x && point.x === after.x || before.y === point.y && point.y === after.y);
		});
	};
	//#endregion
	//#region src/shapes/connector/connector-route.ts
	/**
	* Routes a connector between two points on two shapes, as Word does: it picks the connector preset,
	* the box the connector is drawn in, the rotation and flips that point it the right way, and where it bends.
	*
	* Every connector preset runs from the top-left corner of its box to the bottom-right corner, so the box is
	* spanned by the two ends. An elbow connector's bends are adjustments, measured along the box. A bend can be
	* outside the box, which is how a connector loops around a shape.
	*
	* When an elbow or curved connector's usual route would cross other shapes, the router looks for a route
	* with up to four bends that goes around them. An elbow connector that needs more bends is drawn as a freeform line.
	*
	* @module
	*/
	var DIRECTIONS = [
		{
			x: 1,
			y: 0
		},
		{
			x: 0,
			y: 1
		},
		{
			x: -1,
			y: 0
		},
		{
			x: 0,
			y: -1
		}
	];
	var DEFAULT_MARGIN = 228600;
	var MIN_BEND_LENGTH = 9525;
	var PRESETS = {
		elbow: [
			"elbowConnectorOneBend",
			"elbowConnector",
			"elbowConnectorThreeBends",
			"elbowConnectorFourBends"
		],
		curved: [
			"curvedConnectorOneBend",
			"curvedConnector",
			"curvedConnectorThreeBends",
			"curvedConnectorFourBends"
		]
	};
	var dot = (a, b) => a.x * b.x + a.y * b.y;
	var negate = (a) => ({
		x: -a.x,
		y: -a.y
	});
	var directionOf = (angle) => DIRECTIONS[(Math.round(angle / 90) % 4 + 4) % 4];
	var percentOf = (value, length) => length === 0 ? 50 : value / length * 100;
	var findDoubleBackPath = ({ ex, ey, width, height, leavingSign, arrivingSign, margin }) => {
		const w = Math.max(width, MIN_BEND_LENGTH);
		const x1 = leavingSign * margin;
		const x3 = w - arrivingSign * margin;
		const y2 = height / 2;
		return {
			ex,
			ey,
			width: w,
			height,
			points: [
				{
					x: 0,
					y: 0
				},
				{
					x: x1,
					y: 0
				},
				{
					x: x1,
					y: y2
				},
				{
					x: x3,
					y: y2
				},
				{
					x: x3,
					y: height
				},
				{
					x: w,
					y: height
				}
			],
			adjustments: {
				firstBendX: percentOf(x1, w),
				secondBendY: percentOf(y2, height),
				thirdBendX: percentOf(x3, w)
			}
		};
	};
	var findParallelPath = (frame) => {
		const { ex, ey, width, height, leavingSign, arrivingSign, margin } = frame;
		const facing = leavingSign === arrivingSign;
		if (facing && (leavingSign < 0 || width === 0)) return findDoubleBackPath(frame);
		const w = facing ? width : Math.max(width, MIN_BEND_LENGTH);
		const loop = leavingSign > 0 ? w + margin : -margin;
		const x1 = facing ? w / 2 : loop;
		return {
			ex,
			ey,
			width: w,
			height,
			points: [
				{
					x: 0,
					y: 0
				},
				{
					x: x1,
					y: 0
				},
				{
					x: x1,
					y: height
				},
				{
					x: w,
					y: height
				}
			],
			adjustments: { bendX: percentOf(x1, w) }
		};
	};
	var findRightAnglePath = ({ ex, ey, width, height, leavingSign, arrivingSign, margin }) => {
		if (leavingSign > 0 && arrivingSign > 0) return {
			ex,
			ey,
			width,
			height,
			points: [
				{
					x: 0,
					y: 0
				},
				{
					x: width,
					y: 0
				},
				{
					x: width,
					y: height
				}
			],
			adjustments: {}
		};
		const w = leavingSign > 0 ? width : Math.max(width, MIN_BEND_LENGTH);
		const h = arrivingSign > 0 ? height : Math.max(height, MIN_BEND_LENGTH);
		const x1 = leavingSign > 0 ? w / 2 : -margin;
		const y2 = arrivingSign > 0 ? h / 2 : h + margin;
		return {
			ex,
			ey,
			width: w,
			height: h,
			points: [
				{
					x: 0,
					y: 0
				},
				{
					x: x1,
					y: 0
				},
				{
					x: x1,
					y: y2
				},
				{
					x: w,
					y: y2
				},
				{
					x: w,
					y: h
				}
			],
			adjustments: {
				firstBendX: percentOf(x1, w),
				secondBendY: percentOf(y2, h)
			}
		};
	};
	/**
	* Finds the path of an elbow connector in box coordinates. Its first segment always runs along the box's x axis.
	*
	* - When the ends leave and arrive in parallel directions, the path has 3 segments (1 bend position),
	*   or 5 (3 bend positions) when it has to double back to arrive from behind.
	* - When the directions are at right angles, it has 2 segments (no adjustments), or 4 (2 bend positions).
	*/
	var findElbowFrame = (start, end, margin) => {
		const offset = {
			x: end.point.x - start.point.x,
			y: end.point.y - start.point.y
		};
		const leaving = directionOf(start.angle);
		const arriving = negate(directionOf(end.angle));
		const ex = dot(offset, leaving) >= 0 ? leaving : negate(leaving);
		const across = {
			x: -ex.y,
			y: ex.x
		};
		const ey = dot(offset, across) >= 0 ? across : negate(across);
		const parallel = dot(arriving, ex) !== 0;
		return {
			ex,
			ey,
			width: dot(offset, ex),
			height: dot(offset, ey),
			leavingSign: dot(leaving, ex),
			arrivingSign: parallel ? dot(arriving, ex) : dot(arriving, ey),
			parallel,
			margin
		};
	};
	var findElbowPath = (frame) => frame.parallel ? findParallelPath(frame) : findRightAnglePath(frame);
	/**
	* The obstacles a path goes through, or goes nearer to than `clearance`. A path that only touches an obstacle's edge,
	* as a connector does where it meets a shape, doesn't go through it.
	*/
	var countRouteCrossings = (points, obstacles, clearance = 0) => obstacles.filter((obstacle) => points.slice(1).some((to, index) => {
		const from = points[index];
		const overlaps = (a, b, low, high) => Math.max(Math.min(a, b), low + 1) < Math.min(Math.max(a, b), high - 1) || a === b && a > low + 1 && a < high - 1;
		return overlaps(from.x, to.x, obstacle.left - clearance, obstacle.right + clearance) && overlaps(from.y, to.y, obstacle.top - clearance, obstacle.bottom + clearance);
	})).length;
	var pathLength$1 = (points) => points.slice(1).reduce((length, to, index) => length + Math.abs(to.x - points[index].x) + Math.abs(to.y - points[index].y), 0);
	var unique = (values) => [...new Set(values.map((value) => Math.round(value)))];
	var MAX_OBSTACLES_TRIED = 12;
	/**
	* Finds an elbow path in the frame's box that goes through as few obstacles as it can, then is as short as it can be,
	* then bends as few times as it can.
	*
	* The path leaves along the box's x axis and arrives along the axis the frame gives. Its bends are tried on lines
	* a margin away from the ends and from each obstacle, and halfway between the ends.
	*/
	var findAvoidingPath = (frame, obstacles, toPage) => {
		var _best$;
		const { ex, ey, width, height, leavingSign, arrivingSign, parallel, margin } = frame;
		const origin = toPage({
			x: 0,
			y: 0
		});
		const inBox = obstacles.map((obstacle) => {
			const corners = [{
				x: obstacle.left,
				y: obstacle.top
			}, {
				x: obstacle.right,
				y: obstacle.bottom
			}].map((corner) => ({
				x: dot({
					x: corner.x - origin.x,
					y: corner.y - origin.y
				}, ex),
				y: dot({
					x: corner.x - origin.x,
					y: corner.y - origin.y
				}, ey)
			}));
			return {
				left: Math.min(corners[0].x, corners[1].x),
				right: Math.max(corners[0].x, corners[1].x),
				top: Math.min(corners[0].y, corners[1].y),
				bottom: Math.max(corners[0].y, corners[1].y)
			};
		});
		const distance = ({ left, right, top, bottom }) => Math.abs(left + right - width) + Math.abs(top + bottom - height);
		const nearest = [...inBox].sort((a, b) => distance(a) - distance(b)).slice(0, MAX_OBSTACLES_TRIED);
		const xs = unique([
			width / 2,
			-margin,
			margin,
			width - margin,
			width + margin,
			...nearest.flatMap(({ left, right }) => [left - margin, right + margin])
		]);
		const ys = unique([
			height / 2,
			-margin,
			margin,
			height - margin,
			height + margin,
			...nearest.flatMap(({ top, bottom }) => [top - margin, bottom + margin])
		]);
		const w = Math.max(width, MIN_BEND_LENGTH);
		const h = Math.max(height, MIN_BEND_LENGTH);
		const leaves = (x1) => x1 * leavingSign > 0;
		const onPage = (parallel ? [...xs.filter((x1) => leaves(x1) && (w - x1) * arrivingSign > 0).map((x1) => ({
			ex,
			ey,
			width: w,
			height,
			points: [
				{
					x: 0,
					y: 0
				},
				{
					x: x1,
					y: 0
				},
				{
					x: x1,
					y: height
				},
				{
					x: w,
					y: height
				}
			],
			adjustments: { bendX: percentOf(x1, w) }
		})), ...xs.filter(leaves).flatMap((x1) => ys.flatMap((y2) => xs.filter((x3) => (w - x3) * arrivingSign > 0).map((x3) => ({
			ex,
			ey,
			width: w,
			height: h,
			points: [
				{
					x: 0,
					y: 0
				},
				{
					x: x1,
					y: 0
				},
				{
					x: x1,
					y: y2
				},
				{
					x: x3,
					y: y2
				},
				{
					x: x3,
					y: h
				},
				{
					x: w,
					y: h
				}
			],
			adjustments: {
				firstBendX: percentOf(x1, w),
				secondBendY: percentOf(y2, h),
				thirdBendX: percentOf(x3, w)
			}
		}))))] : [...width * leavingSign > 0 && height * arrivingSign > 0 ? [{
			ex,
			ey,
			width,
			height,
			points: [
				{
					x: 0,
					y: 0
				},
				{
					x: width,
					y: 0
				},
				{
					x: width,
					y: height
				}
			],
			adjustments: {}
		}] : [], ...xs.filter(leaves).flatMap((x1) => ys.filter((y2) => (h - y2) * arrivingSign > 0).map((y2) => ({
			ex,
			ey,
			width: w,
			height: h,
			points: [
				{
					x: 0,
					y: 0
				},
				{
					x: x1,
					y: 0
				},
				{
					x: x1,
					y: y2
				},
				{
					x: w,
					y: y2
				},
				{
					x: w,
					y: h
				}
			],
			adjustments: {
				firstBendX: percentOf(x1, w),
				secondBendY: percentOf(y2, h)
			}
		})))]).map((path) => ({
			path,
			points: path.points.map(toPage)
		}));
		const reach = expandBounds(boundsOfPoints(onPage.flatMap(({ points }) => points)), margin);
		const near = obstacles.filter((obstacle) => boundsOverlap(obstacle, reach));
		return (_best$ = [
			({ points }) => countRouteCrossings(points, near),
			({ points }) => countRouteCrossings(points, near, margin),
			({ path }) => pathLength$1(path.points) + (path.points.length - 2) * margin
		].reduce((remaining, measure) => {
			const measured = remaining.map((candidate) => ({
				candidate,
				value: measure(candidate)
			}));
			const least = Math.min(...measured.map(({ value }) => value));
			return measured.filter(({ value }) => value === least).map(({ candidate }) => candidate);
		}, onPage)[0]) === null || _best$ === void 0 ? void 0 : _best$.path;
	};
	var boundsOfPoints = (points) => ({
		left: Math.min(...points.map(({ x }) => x)),
		top: Math.min(...points.map(({ y }) => y)),
		right: Math.max(...points.map(({ x }) => x)),
		bottom: Math.max(...points.map(({ y }) => y))
	});
	var expandBounds = ({ left, top, right, bottom }, by) => ({
		left: left - by,
		top: top - by,
		right: right + by,
		bottom: bottom + by
	});
	var boundsOverlap = (a, b) => a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom;
	var pageMapping = (start, ex, ey) => ({ x, y }) => ({
		x: start.point.x + ex.x * x + ey.x * y,
		y: start.point.y + ex.y * x + ey.y * y
	});
	/**
	* The usual elbow path between two ends, or one that goes around the obstacles the usual path goes through. An elbow
	* connector that can't get around them with four bends takes a route with more, if there is one.
	*
	* @returns The path in its box, or the corners of a route with more bends, on the page
	*/
	var findRoutedPath = (route, start, end, margin, obstacles) => {
		var _toBoxPath;
		const frame = findElbowFrame(start, end, margin);
		const path = findElbowPath(frame);
		const toPage = pageMapping(start, frame.ex, frame.ey);
		const crossings = countRouteCrossings(path.points.map(toPage), obstacles);
		if (crossings === 0) return path;
		const avoiding = findAvoidingPath(frame, obstacles, toPage);
		const best = avoiding && countRouteCrossings(avoiding.points.map(toPage), obstacles) < crossings ? avoiding : path;
		if (route === "curved" || countRouteCrossings(best.points.map(toPage), obstacles) === 0) return best;
		const detour = findOrthogonalRoute(start, end, margin, obstacles);
		return !detour || countRouteCrossings(detour, obstacles) > 0 ? best : (_toBoxPath = toBoxPath(frame, detour.map(toBox(start, frame)))) !== null && _toBoxPath !== void 0 ? _toBoxPath : detour;
	};
	var toBox = (start, { ex, ey }) => (point) => {
		const offset = {
			x: point.x - start.point.x,
			y: point.y - start.point.y
		};
		return {
			x: dot(offset, ex),
			y: dot(offset, ey)
		};
	};
	var BEND_ADJUSTMENTS = {
		2: ["bendX"],
		3: ["firstBendX", "secondBendY"],
		4: [
			"firstBendX",
			"secondBendY",
			"thirdBendX"
		]
	};
	/**
	* The elbow connector preset that draws a route with two to four bends. A route that leaves along the box's x axis and
	* arrives along the axis the frame gives bends as one of the presets does, with its bends where the preset's adjustments
	* put them. A route with one bend has its bend where the usual route does, so it is never a detour.
	*
	* @param points - The route's ends and corners, in box coordinates
	*/
	var toBoxPath = ({ ex, ey, width, height }, points) => {
		const corners = points.slice(1, -1);
		const names = BEND_ADJUSTMENTS[corners.length];
		if (!names) return;
		const w = Math.max(width, MIN_BEND_LENGTH);
		const h = Math.max(height, MIN_BEND_LENGTH);
		const last = corners[corners.length - 1];
		return {
			ex,
			ey,
			width: w,
			height: h,
			points: [
				...points.slice(0, -2),
				corners.length % 2 === 0 ? {
					x: last.x,
					y: h
				} : {
					x: w,
					y: last.y
				},
				{
					x: w,
					y: h
				}
			],
			adjustments: Object.fromEntries(names.map((name, index) => [name, index % 2 === 0 ? percentOf(corners[index].x, w) : percentOf(corners[index].y, h)]))
		};
	};
	var findStraightPath = (start, end) => {
		const offset = {
			x: end.point.x - start.point.x,
			y: end.point.y - start.point.y
		};
		const width = Math.abs(offset.x);
		const height = Math.abs(offset.y);
		return {
			ex: {
				x: offset.x < 0 ? -1 : 1,
				y: 0
			},
			ey: {
				x: 0,
				y: offset.y < 0 ? -1 : 1
			},
			width,
			height,
			points: [{
				x: 0,
				y: 0
			}, {
				x: width,
				y: height
			}],
			adjustments: {}
		};
	};
	/**
	* Finds the preset, box, rotation, flips and adjustments of a connector between two shapes.
	*
	* A straight connector joins the two points directly. Elbow and curved connectors leave and arrive
	* at right angles to the shapes, in the direction of each end's `angle`, and go around `obstacles` when they can.
	*
	* @throws If the margin is negative
	*/
	var routeConnector = (route, start, end, { margin = DEFAULT_MARGIN, obstacles = [] } = {}) => {
		if (!(margin >= 0)) throw new Error(`Invalid connector margin ${margin}. Expected a distance of 0 or more`);
		return toGeometry(route, start, route === "straight" ? findStraightPath(start, end) : findRoutedPath(route, start, end, margin, obstacles));
	};
	/**
	* The connector for a path in its box, or a freeform line through the corners of a route on the page.
	*/
	var toGeometry = (route, start, routed) => {
		if (!("ex" in routed)) {
			const box = boundsOfPoints(routed);
			return {
				type: "freeform",
				adjustments: {},
				offset: {
					x: box.left,
					y: box.top
				},
				width: box.right - box.left,
				height: box.bottom - box.top,
				rotation: 0,
				flip: {
					horizontal: false,
					vertical: false
				},
				points: routed
			};
		}
		const path = routed;
		const { ex, ey, width, height } = path;
		const toPage = pageMapping(start, ex, ey);
		const centre = toPage({
			x: width / 2,
			y: height / 2
		});
		const vertical = ex.x === 0;
		return {
			type: route === "straight" ? "straightConnector" : PRESETS[route][path.points.length - 3],
			adjustments: path.adjustments,
			offset: {
				x: centre.x - width / 2,
				y: centre.y - height / 2
			},
			width,
			height,
			rotation: vertical ? 90 : 0,
			flip: vertical ? {
				horizontal: ex.y < 0,
				vertical: ey.x > 0
			} : {
				horizontal: ex.x < 0,
				vertical: ey.y < 0
			},
			points: path.points.map(toPage)
		};
	};
	/**
	* The elbow connector that follows a route through the given corners, such as a route whose bends have been moved:
	* the preset whose bends are at those corners, or a freeform line if it has more than four bends.
	*
	* @param points - The ends and corners of the route, on the page, leaving and arriving as `start` and `end` do
	*/
	var fitElbowConnector = (start, end, points, margin) => {
		var _toBoxPath2;
		const frame = findElbowFrame(start, end, margin);
		return toGeometry("elbow", start, (_toBoxPath2 = toBoxPath(frame, points.map(toBox(start, frame)))) !== null && _toBoxPath2 !== void 0 ? _toBoxPath2 : points);
	};
	//#endregion
	//#region src/shapes/connector/connector-channels.ts
	var SAME_LINE = 9525;
	var segmentsOf = (route, routeIndex) => route.movable ? route.points.slice(1, -2).map((from, offset) => {
		const index = offset + 1;
		const to = route.points[index + 1];
		const axis = Math.abs(from.y - to.y) < 1 ? "x" : "y";
		const across = axis === "x" ? "y" : "x";
		const before = route.points[index - 1];
		const after = route.points[index + 2];
		return {
			route: routeIndex,
			index,
			axis,
			at: from[across],
			low: Math.min(from[axis], to[axis]),
			high: Math.max(from[axis], to[axis]),
			leaning: before[across] - from[across] + (after[across] - to[across])
		};
	}) : [];
	/**
	* Splits segments into groups that lie on top of each other: on the same line, and overlapping along it.
	*/
	var findChannels = (segments) => {
		return [...segments].sort((a, b) => a.axis === b.axis ? a.at - b.at : a.axis < b.axis ? -1 : 1).reduce((all, segment) => {
			const last = all[all.length - 1];
			return (last === null || last === void 0 ? void 0 : last[0].axis) === segment.axis && Math.abs(last[last.length - 1].at - segment.at) < SAME_LINE ? [...all.slice(0, -1), [...last, segment]] : [...all, [segment]];
		}, []).flatMap((line) => [...line].sort((a, b) => a.low - b.low).reduce((channels, segment) => {
			const last = channels[channels.length - 1];
			return last !== void 0 && segment.low < Math.max(...last.map(({ high }) => high)) - SAME_LINE ? [...channels.slice(0, -1), [...last, segment]] : [...channels, [segment]];
		}, [])).filter((channel) => new Set(channel.map(({ route }) => route)).size > 1);
	};
	var sameEnd = (a, b) => {
		const ends = (route) => [route.points[0], route.points[route.points.length - 1]];
		return ends(a).some((end) => ends(b).some((other) => Math.abs(end.x - other.x) < SAME_LINE && Math.abs(end.y - other.y) < SAME_LINE));
	};
	/**
	* Moves apart the lines of elbow connectors that lie on top of each other between their bends, `spacing` apart and
	* centred on where they were. Connectors that meet at one end, such as those fanning out from a box in an org chart,
	* stay together. The lines are ordered by where the lines before and after them go, so they cross as little as they can.
	*
	* @returns The routes, with the lines that were moved
	*/
	var separateChannels = (routes, spacing) => {
		const shifts = findChannels(routes.flatMap(segmentsOf)).flatMap((channel) => {
			const lanes = channel.reduce((all, segment) => {
				const lane = all.findIndex((members) => members.some((member) => sameEnd(routes[member.route], routes[segment.route])));
				return lane === -1 ? [...all, [segment]] : all.map((members, index) => index === lane ? [...members, segment] : members);
			}, []);
			const leaning = (lane) => lane.reduce((total, { leaning: value }) => total + value, 0);
			const ordered = [...lanes].sort((a, b) => leaning(a) - leaning(b) || a[0].route - b[0].route);
			return ordered.flatMap((lane, position) => lane.map((segment) => ({
				segment,
				by: (position - (ordered.length - 1) / 2) * spacing
			})));
		});
		return routes.map((route, routeIndex) => shifts.filter(({ segment }) => segment.route === routeIndex).reduce((points, { segment, by }) => points.map((point, index) => index === segment.index || index === segment.index + 1 ? segment.axis === "x" ? _objectSpread2(_objectSpread2({}, point), {}, { y: point.y + by }) : _objectSpread2(_objectSpread2({}, point), {}, { x: point.x + by }) : point), route.points));
	};
	//#endregion
	//#region src/shapes/shape-layout-coordinates.ts
	var pairKey = (a, b) => a < b ? `${a},${b}` : `${b},${a}`;
	var positionsOf = (levels) => new Map(levels.flatMap((level) => level.map((node, index) => [node, index])));
	/**
	* Finds the links that would cross the link between two points of a long connector. Lining shapes up along them
	* would bend the long connector, so they are left out.
	*/
	var findConflicts = ({ order, links, points }) => {
		const position = positionsOf(order);
		const isPoint = (node) => points.has(node);
		const predecessors = (node) => links.filter(({ to }) => to === node).map(({ from }) => from);
		return new Set(order.slice(1).flatMap((level, index) => {
			const boundaries = level.map((node, at) => ({
				at,
				upper: isPoint(node) ? predecessors(node).find(isPoint) : void 0
			})).filter(({ at, upper }) => upper !== void 0 || at === level.length - 1);
			const upperEnd = ({ upper }) => upper === void 0 ? order[index].length : position.get(upper);
			return boundaries.flatMap((boundary, which) => {
				const low = which === 0 ? 0 : upperEnd(boundaries[which - 1]);
				const high = upperEnd(boundary);
				return level.slice(which === 0 ? 0 : boundaries[which - 1].at + 1, boundary.at + 1).flatMap((node) => predecessors(node).filter((upper) => {
					const at = position.get(upper);
					return (at < low || high < at) && !(isPoint(upper) && isPoint(node));
				}).map((upper) => pairKey(upper, node)));
			});
		}));
	};
	/**
	* Joins nodes into blocks that are lined up: each node joins the block of the middle one of its neighbors on the level
	* before, unless an earlier node on its level has joined a block further along.
	*
	* @param levels - The levels in the order they are gone through, each in the order nodes are packed
	* @param neighbors - A node's neighbors on the level before
	* @returns The first node of the block each node is in
	*/
	var alignVertically = (levels, neighbors, conflicts) => {
		const position = positionsOf(levels);
		return levels.reduce((root, level) => {
			const { joined } = level.reduce(({ furthest, joined: done }, node) => {
				const sorted = [...neighbors(node)].sort((a, b) => position.get(a) - position.get(b));
				const middle = (sorted.length - 1) / 2;
				const neighbor = [sorted[Math.floor(middle)], sorted[Math.ceil(middle)]].find((candidate) => candidate !== void 0 && furthest < position.get(candidate) && !conflicts.has(pairKey(node, candidate)));
				return neighbor === void 0 ? {
					furthest,
					joined: done
				} : {
					furthest: position.get(neighbor),
					joined: new Map([...done, [node, neighbor]])
				};
			}, {
				furthest: -1,
				joined: /* @__PURE__ */ new Map()
			});
			return new Map([...root, ...level.map((node) => [node, joined.has(node) ? root.get(joined.get(node)) : node])]);
		}, /* @__PURE__ */ new Map());
	};
	/**
	* Places blocks as near the start of each level as the gaps allow, then moves each one as far along as it can go
	* without moving the blocks after it, so blocks that aren't pushed along stay next to the ones they are beside.
	*
	* @returns Each node's centre
	*/
	var compact = (levels, root, gap) => {
		const blockOf = (node) => root.get(node);
		const separations = [...new Map([...levels.flatMap((level) => level.slice(1).map((node, index) => ({
			before: blockOf(level[index]),
			after: blockOf(node),
			distance: gap(level[index], node)
		})))].sort((a, b) => a.distance - b.distance).map((separation) => [`${separation.before},${separation.after}`, separation])).values()];
		const blocks = [...new Set(levels.flat().map(blockOf))];
		const beforeOf = new Map(blocks.map((block) => [block, separations.filter(({ after }) => after === block)]));
		const afterOf = new Map(blocks.map((block) => [block, separations.filter(({ before }) => before === block)]));
		const visit = (state, block) => {
			if (state.seen.has(block)) return state;
			const visited = beforeOf.get(block).map(({ before }) => before).reduce(visit, {
				order: state.order,
				seen: /* @__PURE__ */ new Set([...state.seen, block])
			});
			return {
				order: [...visited.order, block],
				seen: visited.seen
			};
		};
		const sorted = blocks.reduce(visit, {
			order: [],
			seen: /* @__PURE__ */ new Set()
		}).order;
		const packed = sorted.reduce((positions, block) => new Map([...positions, [block, Math.max(0, ...beforeOf.get(block).map(({ before, distance }) => positions.get(before) + distance))]]), /* @__PURE__ */ new Map());
		const moved = [...sorted].reverse().reduce((positions, block) => {
			const furthest = Math.min(...afterOf.get(block).map(({ after, distance }) => positions.get(after) - distance));
			return Number.isFinite(furthest) ? new Map([...positions, [block, Math.max(positions.get(block), furthest)]]) : positions;
		}, packed);
		return new Map([...root].map(([node, block]) => [node, moved.get(block)]));
	};
	/**
	* Places the nodes on each level across the level.
	*
	* @returns Each node's centre, by node
	*/
	var assignLevelCoordinates = (graph) => {
		const { order, links, sizes, points, spacing } = graph;
		const size = (node) => sizes.get(node);
		const gap = (a, b) => (size(a) + size(b)) / 2 + (points.has(a) || points.has(b) ? spacing / 2 : spacing);
		const conflicts = findConflicts(graph);
		const aligning = links.filter(({ skipAlignment }) => !skipAlignment);
		const above = (node) => aligning.filter(({ to }) => to === node).map(({ from }) => from);
		const below = (node) => aligning.filter(({ from }) => from === node).map(({ to }) => to);
		const layouts = ["before", "after"].flatMap((vertical) => ["start", "end"].map((horizontal) => {
			const levels = (vertical === "before" ? order : [...order].reverse()).map((level) => horizontal === "start" ? level : [...level].reverse());
			const centres = compact(levels, alignVertically(levels, vertical === "before" ? above : below, conflicts), horizontal === "start" ? gap : (a, b) => gap(b, a));
			return {
				horizontal,
				centres: horizontal === "start" ? centres : new Map([...centres].map(([node, x]) => [node, -x]))
			};
		}));
		const nodes = order.flat();
		const extent = (centres) => ({
			start: Math.min(...nodes.map((node) => centres.get(node) - size(node) / 2)),
			end: Math.max(...nodes.map((node) => centres.get(node) + size(node) / 2))
		});
		const narrowest = extent(layouts.reduce((best, layout) => {
			const width = (centres) => extent(centres).end - extent(centres).start;
			return width(layout.centres) < width(best.centres) ? layout : best;
		}).centres);
		const aligned = layouts.map(({ horizontal, centres }) => {
			const shift = horizontal === "start" ? narrowest.start - extent(centres).start : narrowest.end - extent(centres).end;
			return new Map([...centres].map(([node, x]) => [node, x + shift]));
		});
		return new Map(nodes.map((node) => {
			const values = aligned.map((centres) => centres.get(node)).sort((a, b) => a - b);
			return [node, (values[1] + values[2]) / 2];
		}));
	};
	//#endregion
	//#region src/shapes/shape-layout.ts
	var EMUS_PER_PIXEL$4 = 9525;
	var LABEL_CLEARANCE = 8 * EMUS_PER_PIXEL$4;
	var ORDERING_PASSES = 24;
	var SIDE_WEIGHT = .5;
	var checkSpacing = (value, option) => {
		if (!(value >= 0)) throw new Error(`Invalid layout ${option} ${value}. Expected a number of pixels, 0 or more`);
		return value * EMUS_PER_PIXEL$4;
	};
	var normalize = (positions) => {
		const left = Math.min(...positions.map(({ x }) => x));
		const top = Math.min(...positions.map(({ y }) => y));
		return positions.map(({ x, y }) => ({
			x: x - left,
			y: y - top
		}));
	};
	var turn = (direction = "down") => {
		const vertical = direction === "down" || direction === "up";
		const mirror = direction === "up" || direction === "left" ? -1 : 1;
		return {
			across: (item) => vertical ? item.width : item.height,
			along: (item) => vertical ? item.height : item.width,
			item: (acrossLength, alongLength) => vertical ? {
				width: acrossLength,
				height: alongLength
			} : {
				width: alongLength,
				height: acrossLength
			},
			place: (positions, items) => normalize(positions.map(({ across, along }, index) => {
				const length = vertical ? items[index].height : items[index].width;
				const main = mirror > 0 ? along : -along - length;
				return vertical ? {
					x: across,
					y: main
				} : {
					x: main,
					y: across
				};
			}))
		};
	};
	/**
	* The start of each level along the direction the levels run in, from the length of the longest item on each level.
	*
	* @param spacing - The space after each level, or the same space after every level
	*/
	var levelStarts = (thickness, spacing) => thickness.reduce((starts, _, index) => index === 0 ? [0] : [...starts, starts[index - 1] + thickness[index - 1] + (typeof spacing === "number" ? spacing : spacing[index - 1])], []);
	/**
	* The space after each level: the level spacing, or more where a connector to the next level has a label that needs it.
	*/
	var spacingAfterLevels = (levelCount, levelSpacing, levelOf, edges) => range(levelCount).map((level) => Math.max(levelSpacing, ...edges.filter(({ from, to, labelLength }) => labelLength !== void 0 && levelOf(from) === level && levelOf(to) === level + 1).map(({ labelLength }) => labelLength + 2 * LABEL_CLEARANCE)));
	var range = (length, from = 0) => Array.from({ length: Math.max(0, length) }, (_, index) => from + index);
	var mean$1 = (values) => values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : void 0;
	/**
	* Finds the connectors that lead back to a shape the flow has already passed, by a depth-first search from the shapes
	* in the order they are given. Leaving them out leaves no cycles.
	*
	* @returns The indexes of the connectors that lead back
	*/
	var findBackEdges = (count, edges) => {
		const visit = (node, open, search) => {
			const visited = edges.reduce((current, edge, index) => {
				if (edge.from !== node) return current;
				if (open.has(edge.to)) return _objectSpread2(_objectSpread2({}, current), {}, { back: /* @__PURE__ */ new Set([...current.back, index]) });
				return current.done.has(edge.to) ? current : visit(edge.to, /* @__PURE__ */ new Set([...open, edge.to]), current);
			}, search);
			return _objectSpread2(_objectSpread2({}, visited), {}, { done: /* @__PURE__ */ new Set([...visited.done, node]) });
		};
		return range(count).reduce((search, node) => search.done.has(node) ? search : visit(node, /* @__PURE__ */ new Set([node]), search), {
			done: /* @__PURE__ */ new Set(),
			back: /* @__PURE__ */ new Set()
		}).back;
	};
	/**
	* Puts each shape on the level after the furthest shape that connects to it. A shape that only connects onwards
	* is moved down to the level just before the nearest shape it connects to.
	*
	* @param edges - Connectors without cycles
	*/
	var assignLevels = (count, edges) => {
		const before = range(count).map((node) => edges.filter(({ to }) => to === node).map(({ from }) => from));
		const after = range(count).map((node) => edges.filter(({ from }) => from === node).map(({ to }) => to));
		const settle = (current, rounds) => {
			const next = current.map((_, node) => Math.max(0, ...before[node].map((previous) => current[previous] + 1)));
			return rounds === 0 || next.every((level, node) => level === current[node]) ? next : settle(next, rounds - 1);
		};
		const levels = settle(new Array(count).fill(0), count);
		return levels.map((level, node) => before[node].length === 0 && after[node].length > 0 ? Math.min(...after[node].map((next) => levels[next])) - 1 : level);
	};
	var countCrossings = (upper, lower, edges) => {
		const upperIndex = new Map(upper.map((node, index) => [node, index]));
		const lowerIndex = new Map(lower.map((node, index) => [node, index]));
		const between = edges.filter(({ from, to }) => upperIndex.has(from) && lowerIndex.has(to)).map(({ from, to }) => [upperIndex.get(from), lowerIndex.get(to)]);
		return between.reduce((total, [a, b], index) => total + between.slice(index + 1).filter(([c, d]) => (a - c) * (b - d) < 0).length, 0);
	};
	/**
	* How many shapes are on the wrong side of their siblings: a shape that a connector leaves the side of its parent
	* for, placed on the other side of a shape the parent leads to without one.
	*/
	var countMisplaced = (upper, lower, edges) => {
		const lowerIndex = new Map(lower.map((node, index) => [node, index]));
		return upper.reduce((total, parent) => {
			const children = edges.filter(({ from, to }) => from === parent && lowerIndex.has(to));
			return total + children.reduce((count, child) => count + children.filter((other) => {
				var _child$across, _other$across;
				return ((_child$across = child.across) !== null && _child$across !== void 0 ? _child$across : 0) > ((_other$across = other.across) !== null && _other$across !== void 0 ? _other$across : 0) && lowerIndex.get(child.to) < lowerIndex.get(other.to);
			}).length, 0);
		}, 0);
	};
	/**
	* Orders the shapes on each level to reduce crossings: passes go down and up in turn, sorting each level by the
	* average position of the shapes it connects to on the level just done (the barycenter method). A connector that
	* leaves the side of a shape moves the shape it leads to that way. The order with the fewest crossings, then the
	* fewest shapes on the wrong side of their siblings, is kept. The shapes in each lane stay together.
	*/
	var orderLevels = (start, links, laneOf) => {
		const levelCount = start.length;
		const score = (order) => order.slice(1).reduce((total, lower, index) => ({
			crossings: total.crossings + countCrossings(order[index], lower, links),
			misplaced: total.misplaced + countMisplaced(order[index], lower, links)
		}), {
			crossings: 0,
			misplaced: 0
		});
		const sortLevel = (order, level, down) => {
			const fixed = new Map(order[down ? level - 1 : level + 1].map((node, index) => [node, index]));
			const sorted = [...order[level].map((node, index) => {
				var _mean;
				return {
					node,
					weight: (_mean = mean$1(links.filter((link) => down ? link.to === node && fixed.has(link.from) : link.from === node && fixed.has(link.to)).map((link) => {
						var _link$across;
						return fixed.get(down ? link.from : link.to) + (down ? 1 : -1) * ((_link$across = link.across) !== null && _link$across !== void 0 ? _link$across : 0) * SIDE_WEIGHT;
					}))) !== null && _mean !== void 0 ? _mean : index
				};
			})].sort((a, b) => laneOf(a.node) - laneOf(b.node) || a.weight - b.weight).map(({ node }) => node);
			return order.map((nodes, index) => index === level ? sorted : nodes);
		};
		return range(ORDERING_PASSES).reduce((ordering, pass) => {
			if (ordering.crossings === 0 && ordering.misplaced === 0) return ordering;
			const down = pass % 2 === 0;
			const order = (down ? range(levelCount - 1, 1) : range(levelCount - 1).map((index) => levelCount - 2 - index)).reduce((current, level) => sortLevel(current, level, down), ordering.order);
			const { crossings, misplaced } = score(order);
			return crossings < ordering.crossings || crossings === ordering.crossings && misplaced < ordering.misplaced ? {
				order,
				best: order,
				crossings,
				misplaced
			} : _objectSpread2(_objectSpread2({}, ordering), {}, { order });
		}, _objectSpread2({
			order: start,
			best: start
		}, score(start))).best;
	};
	/**
	* Lays out a flow in levels (the Sugiyama method): leaves out connectors that lead back, puts the shapes on levels,
	* adds points for connectors that skip levels, orders each level to reduce crossings, then lines each shape up with
	* the shapes it connects to (the Brandes–Köpf method). Connectors that lead back are routed around the shapes
	* afterwards, so they don't take up room in the layout.
	*/
	/**
	* Places the shapes on each level across it: lined up with the shapes they connect to, and in lanes when the flow
	* has them. Each lane is as wide as its shapes, or its header, need, and the lanes are side by side.
	*
	* @returns Each node's centre across its level, and where each lane starts and how wide it is
	*/
	var placeAcross = (order, nodes, links, spacing, lanes) => {
		const place = (lane) => {
			const inLane = (node) => lane === void 0 || nodes[node].lane === lane;
			return assignLevelCoordinates({
				order: order.map((level) => level.filter(inLane)),
				links: links.filter(({ from, to }) => inLane(from) && inLane(to)).map(({ from, to, across: side }) => ({
					from,
					to,
					skipAlignment: side !== void 0
				})),
				sizes: new Map(nodes.map(({ size }, node) => [node, size])),
				points: new Set(range(nodes.length).filter((node) => nodes[node].isPoint)),
				spacing
			});
		};
		if (!lanes) return {
			centres: place(),
			lanes: []
		};
		const placed = range(lanes.count).map((lane) => {
			var _lanes$widths$lane;
			const centres = place(lane);
			const edges = [...centres].flatMap(([node, centre]) => [centre - nodes[node].size / 2, centre + nodes[node].size / 2]);
			const low = edges.length > 0 ? Math.min(...edges) : 0;
			const high = edges.length > 0 ? Math.max(...edges) : 0;
			return {
				centres,
				low,
				high,
				width: Math.max(high - low + spacing, (_lanes$widths$lane = lanes.widths[lane]) !== null && _lanes$widths$lane !== void 0 ? _lanes$widths$lane : 0)
			};
		});
		const starts = levelStarts(placed.map(({ width }) => width), 0);
		return {
			centres: new Map(placed.flatMap(({ centres, low, high, width }, lane) => [...centres].map(([node, centre]) => [node, starts[lane] + (width - (high - low)) / 2 + centre - low]))),
			lanes: placed.map(({ width }, lane) => ({
				start: starts[lane],
				width
			}))
		};
	};
	/**
	* Lays out a flow in levels (the Sugiyama method): leaves out connectors that lead back, puts the shapes on levels,
	* adds points for connectors that skip levels, orders each level to reduce crossings, then lines each shape up with
	* the shapes it connects to (the Brandes–Köpf method). Connectors that lead back are routed around the shapes
	* afterwards, so they don't take up room in the layout.
	*
	* With lanes, the shapes in each lane stay together on each level, and the lanes' headers come before the first level.
	*/
	var layoutFlow = (layout, items, allEdges, headers) => {
		var _layout$spacing, _layout$levelSpacing, _layout$lanes$length, _layout$lanes;
		const spacing = checkSpacing((_layout$spacing = layout.spacing) !== null && _layout$spacing !== void 0 ? _layout$spacing : 40, "spacing");
		const levelSpacing = checkSpacing((_layout$levelSpacing = layout.levelSpacing) !== null && _layout$levelSpacing !== void 0 ? _layout$levelSpacing : 50, "levelSpacing");
		const { across, along, place, item: turnedItem } = turn(layout.direction);
		const backEdges = findBackEdges(items.length, allEdges);
		const edges = allEdges.filter((_, index) => !backEdges.has(index));
		const levels = assignLevels(items.length, edges);
		const lowest = Math.min(...levels);
		const laneCount = (_layout$lanes$length = (_layout$lanes = layout.lanes) === null || _layout$lanes === void 0 ? void 0 : _layout$lanes.length) !== null && _layout$lanes$length !== void 0 ? _layout$lanes$length : 0;
		const { nodes, links } = edges.reduce((graph, { from, to, across: side }) => {
			const skipped = range(graph.nodes[to].level - graph.nodes[from].level - 1, graph.nodes[from].level + 1).map((level) => ({
				level,
				size: 0,
				isPoint: true,
				lane: graph.nodes[from].lane
			}));
			const path = [
				from,
				...skipped.map((_, index) => graph.nodes.length + index),
				to
			];
			return {
				nodes: [...graph.nodes, ...skipped],
				links: [...graph.links, ...path.slice(1).map((node, index) => ({
					from: path[index],
					to: node,
					across: index === 0 ? side : void 0
				}))]
			};
		}, {
			nodes: items.map((item, index) => {
				var _item$lane;
				return {
					level: levels[index] - lowest,
					size: across(item),
					isPoint: false,
					lane: (_item$lane = item.lane) !== null && _item$lane !== void 0 ? _item$lane : 0
				};
			}),
			links: []
		});
		const levelCount = Math.max(...nodes.map(({ level }) => level)) + 1;
		const { centres, lanes } = placeAcross(orderLevels(range(levelCount).map((level) => range(nodes.length).filter((node) => nodes[node].level === level).sort((a, b) => nodes[a].lane - nodes[b].lane)), links, (node) => nodes[node].lane), nodes, links, spacing, laneCount > 0 ? {
			count: laneCount,
			widths: headers.widths
		} : void 0);
		const thickness = range(levelCount).map((level) => Math.max(0, ...items.map((item, index) => nodes[index].level === level ? along(item) : 0)));
		const before = laneCount > 0 ? headers.length + levelSpacing / 2 : 0;
		const starts = levelStarts(thickness, spacingAfterLevels(levelCount, levelSpacing, (item) => nodes[item].level, edges)).map((start) => start + before);
		const total = starts[levelCount - 1] + thickness[levelCount - 1] + levelSpacing / 2;
		const bands = lanes.flatMap(({ start, width }) => [{
			across: start,
			along: 0,
			item: turnedItem(width, total)
		}, {
			across: start,
			along: 0,
			item: turnedItem(width, headers.length)
		}]);
		const placed = place([...items.map((item, index) => ({
			across: centres.get(index) - across(item) / 2,
			along: starts[nodes[index].level] + (thickness[nodes[index].level] - along(item)) / 2
		})), ...bands.map(({ across: bandAcross, along: bandAlong }) => ({
			across: bandAcross,
			along: bandAlong
		}))], [...items, ...bands.map(({ item }) => item)]);
		const boxes = bands.map(({ item }, index) => _objectSpread2(_objectSpread2({}, placed[items.length + index]), {}, {
			width: item.width,
			height: item.height
		}));
		return {
			positions: placed.slice(0, items.length),
			levels: items.map((_, index) => nodes[index].level),
			lanes: laneCount > 0 ? lanes.map((_, lane) => ({
				band: boxes[2 * lane],
				header: boxes[2 * lane + 1]
			})) : void 0
		};
	};
	var shiftContour = (contour, by) => contour.map(({ left, right }) => ({
		left: left + by,
		right: right + by
	}));
	var mergeContours = (a, b) => range(Math.max(a.length, b.length)).map((level) => {
		var _a$level$left, _a$level, _b$level$left, _b$level, _a$level$right, _a$level2, _b$level$right, _b$level2;
		return {
			left: Math.min((_a$level$left = (_a$level = a[level]) === null || _a$level === void 0 ? void 0 : _a$level.left) !== null && _a$level$left !== void 0 ? _a$level$left : Infinity, (_b$level$left = (_b$level = b[level]) === null || _b$level === void 0 ? void 0 : _b$level.left) !== null && _b$level$left !== void 0 ? _b$level$left : Infinity),
			right: Math.max((_a$level$right = (_a$level2 = a[level]) === null || _a$level2 === void 0 ? void 0 : _a$level2.right) !== null && _a$level$right !== void 0 ? _a$level$right : -Infinity, (_b$level$right = (_b$level2 = b[level]) === null || _b$level2 === void 0 ? void 0 : _b$level2.right) !== null && _b$level$right !== void 0 ? _b$level$right : -Infinity)
		};
	});
	/**
	* Places subtrees side by side, each as near the one before it as their contours allow.
	*
	* @returns Each subtree's centre, from the first one's, and the contour of them all
	*/
	var packSubtrees = (subtrees, spacing) => subtrees.reduce((packed, subtree, index) => {
		if (index === 0) return {
			positions: [0],
			contour: subtree.contour
		};
		const shift = Math.max(...subtree.contour.slice(0, packed.contour.length).map(({ left }, level) => packed.contour[level].right - left + spacing));
		return {
			positions: [...packed.positions, shift],
			contour: mergeContours(packed.contour, shiftContour(subtree.contour, shift))
		};
	}, {
		positions: [],
		contour: []
	});
	/**
	* Lays out a tree (the Reingold–Tilford method, with shapes of different sizes): each subtree is laid out on its own,
	* then the subtrees are packed as close as their outlines allow, and their parent is centred over them.
	*/
	var layoutTree = (layout, items, edges) => {
		var _layout$spacing2, _layout$levelSpacing2;
		const spacing = checkSpacing((_layout$spacing2 = layout.spacing) !== null && _layout$spacing2 !== void 0 ? _layout$spacing2 : 20, "spacing");
		const levelSpacing = checkSpacing((_layout$levelSpacing2 = layout.levelSpacing) !== null && _layout$levelSpacing2 !== void 0 ? _layout$levelSpacing2 : 40, "levelSpacing");
		const { across, along, place } = turn(layout.direction);
		const isAncestor = (links, node, of) => of !== void 0 && (of === node || isAncestor(links, node, links[of]));
		const parents = edges.reduce((current, { from, to }) => current[to] === void 0 && !isAncestor(current, to, from) ? current.map((parent, node) => node === to ? from : parent) : current, new Array(items.length).fill(void 0));
		const childrenOf = (node) => edges.map(({ to }) => to).filter((to, index, all) => parents[to] === node && all.indexOf(to) === index);
		const layoutSubtree = (node, depth) => {
			const size = across(items[node]);
			const own = [{
				left: -size / 2,
				right: size / 2
			}];
			const children = childrenOf(node).map((child) => layoutSubtree(child, depth + 1));
			const { positions: childCentres, contour } = packSubtrees(children, spacing);
			const middle = children.length === 0 ? 0 : (childCentres[0] + childCentres[childCentres.length - 1]) / 2;
			return {
				centres: new Map([[node, 0], ...children.flatMap((subtree, index) => [...subtree.centres].map(([descendant, centre]) => [descendant, centre + childCentres[index] - middle]))]),
				depths: new Map([[node, depth], ...children.flatMap((subtree) => [...subtree.depths])]),
				contour: [...own, ...shiftContour(contour, -middle)]
			};
		};
		const trees = range(items.length).filter((node) => parents[node] === void 0).map((root) => layoutSubtree(root, 0));
		const { positions } = packSubtrees(trees, spacing);
		const centres = new Map(trees.flatMap((tree, index) => [...tree.centres].map(([node, centre]) => [node, centre + positions[index]])));
		const depths = range(items.length).map((node) => trees.map((tree) => tree.depths.get(node)).find((depth) => depth !== void 0));
		const thickness = range(Math.max(...depths) + 1).map((level) => Math.max(0, ...items.map((item, index) => depths[index] === level ? along(item) : 0)));
		const starts = levelStarts(thickness, spacingAfterLevels(thickness.length, levelSpacing, (item) => depths[item], edges));
		return {
			positions: place(items.map((item, index) => ({
				across: centres.get(index) - across(item) / 2,
				along: starts[depths[index]]
			})), items),
			levels: depths
		};
	};
	/**
	* Lays out a grid: each column is as wide as its widest shape and each row as tall as its tallest, and each shape
	* is centred in its cell.
	*/
	var layoutGrid = (layout, items) => {
		var _layout$spacing3, _layout$columns;
		const spacing = checkSpacing((_layout$spacing3 = layout.spacing) !== null && _layout$spacing3 !== void 0 ? _layout$spacing3 : 40, "spacing");
		const columns = (_layout$columns = layout.columns) !== null && _layout$columns !== void 0 ? _layout$columns : Math.ceil(Math.sqrt(items.length));
		if (!(Number.isInteger(columns) && columns >= 1)) throw new Error(`Invalid layout columns ${columns}. Expected a whole number, 1 or more`);
		const rows = Math.ceil(items.length / columns);
		const widths = range(columns).map((column) => Math.max(0, ...items.filter((_, index) => index % columns === column).map(({ width }) => width)));
		const heights = range(rows).map((row) => Math.max(0, ...items.slice(row * columns, (row + 1) * columns).map(({ height }) => height)));
		const lefts = levelStarts(widths, spacing);
		const tops = levelStarts(heights, spacing);
		return { positions: items.map(({ width, height }, index) => {
			const column = index % columns;
			const row = Math.floor(index / columns);
			return {
				x: lefts[column] + (widths[column] - width) / 2,
				y: tops[row] + (heights[row] - height) / 2
			};
		}) };
	};
	/**
	* Places items with a layout, starting at (0, 0).
	*
	* @param items - The boxes to place, in EMUs
	* @param edges - The connectors between them, which flow and tree layouts follow
	* @param headers - How big the headers of a flow's lanes are
	* @returns The top-left corner of each item's box, in EMUs, the level each is on in a flow or tree, and the boxes of a
	* flow's lanes
	* @throws If a spacing is negative, or a grid's number of columns isn't a whole number of 1 or more
	*/
	var layoutItems = (layout, items, edges, headers = {
		length: 0,
		widths: []
	}) => {
		if (items.length === 0) return { positions: [] };
		const links = edges.filter(({ from, to }, index) => from !== to && edges.findIndex((edge) => edge.from === from && edge.to === to) === index);
		switch (layout.type) {
			case "flow": return layoutFlow(layout, items, links, headers);
			case "tree": return layoutTree(layout, items, links);
			default: return layoutGrid(layout, items);
		}
	};
	//#endregion
	//#region src/shapes/shape-run-data.ts
	/**
	* Helpers shared by ShapeRun and ShapeGroupRun. Not part of the public API.
	*
	* @module
	*/
	/**
	* Maps shape options to the data used to write a `wps:wsp` element.
	*
	* @param styles - The document's styles, which `text` is written to suit
	*/
	var createPresetShapeData = (options, styles) => {
		var _options$children;
		return {
			geometry: options.type === "custom" ? {
				type: "custom",
				path: options.path,
				paths: options.paths,
				textArea: options.textArea,
				connectionPoints: options.connectionPoints
			} : {
				type: options.type,
				adjustments: options.adjustments
			},
			fill: options.fill,
			line: options.line,
			effects: options.effects,
			children: options.text === void 0 ? options.children : [...createTextParagraphs(options.text, styles), ...(_options$children = options.children) !== null && _options$children !== void 0 ? _options$children : []],
			textOptions: options.textOptions
		};
	};
	/**
	* The options of a drawing that don't depend on its layout, with the drawing's id. The id is given now, so a drawing
	* that is laid out again when it is written keeps it.
	*/
	var createDrawingProperties = ({ floating, altText, link, decorative }) => {
		var _altText$id;
		return {
			floating,
			docProperties: _objectSpread2(_objectSpread2({}, altText !== null && altText !== void 0 ? altText : {
				name: "",
				description: "",
				title: ""
			}), {}, { id: (_altText$id = altText === null || altText === void 0 ? void 0 : altText.id) !== null && _altText$id !== void 0 ? _altText$id : `${(0, docx.docPropertiesUniqueNumericId)()}` }),
			link,
			decorative
		};
	};
	/**
	* An effect extent reaching the same distance past every side of a drawing.
	*/
	var createUniformEffectExtent = (overhang) => ({
		top: overhang,
		right: overhang,
		bottom: overhang,
		left: overhang
	});
	var EMUS_PER_PIXEL$3 = 9525;
	/**
	* How far, in EMUs, a shape's line, arrowheads and effects reach past each side of its box, before it is rotated.
	*/
	var getShapeOverhang = ({ line, effects, transformation }) => {
		const lineOverhang = getShapeLineOverhang(line);
		const effectsOverhang = getShapeEffectsOverhang(effects, transformation.height * EMUS_PER_PIXEL$3, transformation.rotation);
		return {
			top: lineOverhang + effectsOverhang.top,
			right: lineOverhang + effectsOverhang.right,
			bottom: lineOverhang + effectsOverhang.bottom,
			left: lineOverhang + effectsOverhang.left
		};
	};
	/**
	* How far, in EMUs, a shape reaches past each side of its box: the corners of a rotated shape,
	* and its line, arrowheads and effects. As in Word, this is the drawing's `wp:effectExtent`.
	*/
	var getShapeEffectExtent = (options) => {
		const overhang = getShapeOverhang(options);
		const { width, height, rotation = 0 } = options.transformation;
		const radians = rotation * Math.PI / 180;
		const cos = Math.abs(Math.cos(radians));
		const sin = Math.abs(Math.sin(radians));
		const growX = Math.max(0, Math.ceil((width * cos + height * sin - width) * EMUS_PER_PIXEL$3 / 2));
		const growY = Math.max(0, Math.ceil((width * sin + height * cos - height) * EMUS_PER_PIXEL$3 / 2));
		return {
			top: overhang.top + growY,
			right: overhang.right + growX,
			bottom: overhang.bottom + growY,
			left: overhang.left + growX
		};
	};
	//#endregion
	//#region src/shapes/shape-drawing.ts
	/**
	* Lays out the children of a ShapeGroupRun or ShapeCanvasRun: positions the shapes, pictures and groups inside it,
	* gives each one a drawing id and a name, and routes the connectors between them. Not part of the public API.
	*
	* @module
	*/
	var EMUS_PER_PIXEL$2 = 9525;
	var PIXELS_PER_POINT = 4 / 3;
	var DEFAULT_CONNECTOR_MARGIN = 24;
	var LABEL_PADDING = {
		width: 8,
		height: 4
	};
	var LABEL_GAP = 4;
	var LABEL_STEP = 4;
	var CHANNEL_SPACING = 6;
	var LANE_LINE = {
		color: "A5A5A5",
		width: .75
	};
	var LANE_HEADER_FILL = "F2F2F2";
	var SIDE_ANGLES = {
		right: 0,
		bottom: 90,
		left: 180,
		top: 270
	};
	var IDENTITY = {
		a: 1,
		b: 0,
		c: 0,
		d: 1,
		e: 0,
		f: 0
	};
	var compose = (second, first) => ({
		a: second.a * first.a + second.c * first.b,
		b: second.b * first.a + second.d * first.b,
		c: second.a * first.c + second.c * first.d,
		d: second.b * first.c + second.d * first.d,
		e: second.a * first.e + second.c * first.f + second.e,
		f: second.b * first.e + second.d * first.f + second.f
	});
	var translation = (x, y) => _objectSpread2(_objectSpread2({}, IDENTITY), {}, {
		e: x,
		f: y
	});
	var scaling = (x, y) => _objectSpread2(_objectSpread2({}, IDENTITY), {}, {
		a: x,
		d: y
	});
	var rotation = (degrees) => {
		const radians = degrees * Math.PI / 180;
		return {
			a: Math.cos(radians),
			b: Math.sin(radians),
			c: -Math.sin(radians),
			d: Math.cos(radians),
			e: 0,
			f: 0
		};
	};
	var transformPoint = ({ a, b, c, d, e, f }, { x, y }) => ({
		x: a * x + c * y + e,
		y: b * x + d * y + f
	});
	var transformAngle = ({ a, b, c, d }, angle) => {
		const radians = angle * Math.PI / 180;
		return Math.atan2(b * Math.cos(radians) + d * Math.sin(radians), a * Math.cos(radians) + c * Math.sin(radians)) * 180 / Math.PI;
	};
	/**
	* Places something of the box's size: flips it about its centre, rotates it about its centre, then moves it into the box.
	*/
	var placement = (box, degrees = 0, flip) => [
		translation(-box.width / 2, -box.height / 2),
		scaling((flip === null || flip === void 0 ? void 0 : flip.horizontal) ? -1 : 1, (flip === null || flip === void 0 ? void 0 : flip.vertical) ? -1 : 1),
		rotation(degrees),
		translation(box.x + box.width / 2, box.y + box.height / 2)
	].reduce((matrix, step) => compose(step, matrix), IDENTITY);
	var boundsOf = (points) => ({
		left: Math.min(...points.map(({ x }) => x)),
		top: Math.min(...points.map(({ y }) => y)),
		right: Math.max(...points.map(({ x }) => x)),
		bottom: Math.max(...points.map(({ y }) => y))
	});
	var union = (all) => ({
		left: Math.min(...all.map(({ left }) => left)),
		top: Math.min(...all.map(({ top }) => top)),
		right: Math.max(...all.map(({ right }) => right)),
		bottom: Math.max(...all.map(({ bottom }) => bottom))
	});
	var cornersOf = ({ left, top, right, bottom }) => [
		{
			x: left,
			y: top
		},
		{
			x: right,
			y: top
		},
		{
			x: right,
			y: bottom
		},
		{
			x: left,
			y: bottom
		}
	];
	var transformBounds = (matrix, bounds) => boundsOf(cornersOf(bounds).map((corner) => transformPoint(matrix, corner)));
	var expand = (bounds, extent) => ({
		left: bounds.left - extent.left,
		top: bounds.top - extent.top,
		right: bounds.right + extent.right,
		bottom: bounds.bottom + extent.bottom
	});
	var uniformExtent = (overhang) => ({
		top: overhang,
		right: overhang,
		bottom: overhang,
		left: overhang
	});
	var boundsOfBox = ({ x, y, width, height }) => ({
		left: x,
		top: y,
		right: x + width,
		bottom: y + height
	});
	var offsetOf = (offset) => {
		var _offset$left, _offset$top;
		return offset && {
			x: Math.round(((_offset$left = offset.left) !== null && _offset$left !== void 0 ? _offset$left : 0) * EMUS_PER_PIXEL$2),
			y: Math.round(((_offset$top = offset.top) !== null && _offset$top !== void 0 ? _offset$top : 0) * EMUS_PER_PIXEL$2)
		};
	};
	var boxAt = (position, { width, height }) => _objectSpread2(_objectSpread2({}, position), {}, {
		width: Math.round(width * EMUS_PER_PIXEL$2),
		height: Math.round(height * EMUS_PER_PIXEL$2)
	});
	var leafBounds = ({ matrix, width, height }) => transformBounds(matrix, {
		left: 0,
		top: 0,
		right: width,
		bottom: height
	});
	var centreOf = ({ left, top, right, bottom }) => ({
		x: (left + right) / 2,
		y: (top + bottom) / 2
	});
	var overlaps = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
	var overlapArea = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
	var shrink = ({ left, top, right, bottom }, by) => ({
		left: left + by,
		top: top + by,
		right: right - by,
		bottom: bottom - by
	});
	var transformDirection = ({ a, b, c, d }, { x, y }) => ({
		x: a * x + c * y,
		y: b * x + d * y
	});
	/**
	* A name for a shape, as Word gives them: what it is, then its drawing id, such as "Rounded Rectangle 4".
	*/
	var defaultName = (kind, drawingId) => `${kind.replace(/([a-z\d])([A-Z])/g, "$1 $2").replace(/^./, (first) => first.toUpperCase())} ${drawingId}`;
	var createNonVisualDrawingProperties = (drawingId, kind, { altText, link, decorative }) => {
		var _altText$name;
		return {
			id: drawingId,
			name: (_altText$name = altText === null || altText === void 0 ? void 0 : altText.name) !== null && _altText$name !== void 0 ? _altText$name : defaultName(kind, drawingId),
			description: altText === null || altText === void 0 ? void 0 : altText.description,
			title: altText === null || altText === void 0 ? void 0 : altText.title,
			link,
			decorative
		};
	};
	var sideMiddles = (width, height) => [
		{
			x: width / 2,
			y: 0,
			angle: 270
		},
		{
			x: 0,
			y: height / 2,
			angle: 180
		},
		{
			x: width / 2,
			y: height,
			angle: 90
		},
		{
			x: width,
			y: height / 2,
			angle: 0
		}
	];
	var allSides = (width, height) => ({
		top: [0, width],
		right: [0, height],
		bottom: [0, width],
		left: [0, height]
	});
	var roundedSides = (width, height, radius) => ({
		top: [radius, width - radius],
		right: [radius, height - radius],
		bottom: [radius, width - radius],
		left: [radius, height - radius]
	});
	/**
	* The straight parts of the sides of shapes whose sides are mostly straight, from their preset definitions. Other
	* shapes have none, and connectors that meet them at the same connection site stay together.
	*/
	var straightSidesOf = (options, width, height) => {
		switch (options.type) {
			case "rectangle":
			case "flowChartProcess":
			case "flowChartPredefinedProcess":
			case "flowChartInternalStorage": return allSides(width, height);
			case "roundedRectangle":
				var _createShapeGuides$ad;
				return roundedSides(width, height, Math.min(width, height) * ((_createShapeGuides$ad = createShapeGuides(options.type, options.adjustments).adj) !== null && _createShapeGuides$ad !== void 0 ? _createShapeGuides$ad : 16667) / 1e5);
			case "flowChartAlternateProcess": return roundedSides(width, height, Math.min(width, height) / 6);
			case "flowChartTerminator": {
				const end = width * 3475 / 21600;
				return {
					top: [end, width - end],
					bottom: [end, width - end]
				};
			}
			case "flowChartDocument": return {
				top: [0, width],
				right: [0, height * 17322 / 21600],
				left: [0, height * 20172 / 21600]
			};
			default: return {};
		}
	};
	/**
	* A shape's connection sites, numbered as OOXML numbers them (`a:stCxn/@idx`).
	*/
	var shapeSites = (options, width, height) => {
		return (options.type === "custom" ? createCustomGeometryData(options, width, height).sites : getConnectionSites(options.type, width, height, createShapeGuides(options.type, options.adjustments))).map((site, index) => _objectSpread2(_objectSpread2({}, site), {}, { index }));
	};
	/**
	* Gives the band and header of each lane of a layout drawing ids.
	*/
	var assignLaneIds = (layout) => {
		var _layout$lanes;
		return (layout === null || layout === void 0 ? void 0 : layout.type) === "flow" ? ((_layout$lanes = layout.lanes) !== null && _layout$lanes !== void 0 ? _layout$lanes : []).map(() => [(0, docx.docPropertiesUniqueNumericId)(), (0, docx.docPropertiesUniqueNumericId)()]) : [];
	};
	/**
	* Gives every shape, picture, group, connector and label a drawing id, in the order they are written.
	*/
	var assignIds = (children) => children.map((options) => {
		switch (options.type) {
			case "connector": return {
				kind: "connector",
				options,
				drawingId: (0, docx.docPropertiesUniqueNumericId)(),
				labelId: options.label ? (0, docx.docPropertiesUniqueNumericId)() : void 0
			};
			case "picture": return {
				kind: "picture",
				options,
				drawingId: (0, docx.docPropertiesUniqueNumericId)()
			};
			case "group": return {
				kind: "group",
				options,
				drawingId: (0, docx.docPropertiesUniqueNumericId)(),
				laneIds: assignLaneIds(options.layout),
				children: assignIds(options.children)
			};
			default: return {
				kind: "shape",
				options,
				drawingId: (0, docx.docPropertiesUniqueNumericId)()
			};
		}
	});
	/**
	* The `id` of every shape and picture in the drawing.
	*
	* @throws If two shapes or pictures have the same `id`
	*/
	var idsOf = (node) => {
		if (node.kind === "group") return node.children.flatMap(idsOf);
		return node.kind !== "connector" && node.options.id !== void 0 ? [node.options.id] : [];
	};
	var collectIds = (nodes) => {
		const ids = nodes.flatMap(idsOf);
		const repeated = ids.find((id, index) => ids.indexOf(id) !== index);
		if (repeated !== void 0) throw new Error(`Invalid shape id "${repeated}". Each shape in a group or canvas needs a different id`);
		return new Set(ids);
	};
	/**
	* Places a shape with its box's top-left corner at `position`.
	*
	* @param transformation - The shape's transformation, with its size worked out if it fits its text
	*/
	var layoutShape = (options, transformation, drawingId, position, styles) => {
		const { rotation: degrees, flip } = transformation;
		const box = boxAt(position, transformation);
		const matrix = placement(box, degrees, flip);
		const sites = shapeSites(options, box.width, box.height);
		const leaf = {
			id: options.id,
			drawingId,
			width: box.width,
			height: box.height,
			sites: sites.length > 0 ? sites : sideMiddles(box.width, box.height),
			matrix,
			straightSides: straightSidesOf(options, box.width, box.height)
		};
		const kind = options.type === "custom" ? "freeform" : options.type;
		return {
			placed: {
				child: {
					type: "wps",
					box,
					rotation: degrees,
					flip,
					data: _objectSpread2(_objectSpread2({}, createPresetShapeData(options, styles)), {}, { nonVisualDrawingProperties: createNonVisualDrawingProperties(drawingId, kind, options) })
				},
				box: boundsOfBox(box),
				reach: expand(leafBounds(leaf), getShapeOverhang(_objectSpread2(_objectSpread2({}, options), {}, { transformation })))
			},
			leaves: [leaf]
		};
	};
	var layoutPicture = (options, drawingId, position) => {
		const { rotation: degrees, flip } = options.transformation;
		const box = boxAt(position, options.transformation);
		const leaf = {
			id: options.id,
			drawingId,
			width: box.width,
			height: box.height,
			sites: getConnectionSites("rectangle", box.width, box.height).map((site, index) => _objectSpread2(_objectSpread2({}, site), {}, { index })),
			matrix: placement(box, degrees, flip),
			straightSides: allSides(box.width, box.height)
		};
		const lineOverhang = options.line ? getShapeLineOverhang(options.line) : 0;
		const effectsOverhang = getShapeEffectsOverhang(options.effects, box.height, degrees);
		return {
			placed: {
				child: {
					type: "picture",
					box,
					rotation: degrees,
					flip,
					data: {
						image: options.image,
						crop: options.crop,
						line: options.line,
						effects: options.effects,
						nonVisualDrawingProperties: createNonVisualDrawingProperties(drawingId, "picture", options)
					}
				},
				box: boundsOfBox(box),
				reach: expand(leafBounds(leaf), {
					top: lineOverhang + effectsOverhang.top,
					right: lineOverhang + effectsOverhang.right,
					bottom: lineOverhang + effectsOverhang.bottom,
					left: lineOverhang + effectsOverhang.left
				})
			},
			leaves: [leaf]
		};
	};
	/**
	* The side of `from` that faces `to`.
	*/
	var facingSide = (from, to) => {
		const a = centreOf(from);
		const b = centreOf(to);
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "right" : "left";
		return dy >= 0 ? "bottom" : "top";
	};
	var angleBetween = (a, b) => {
		const difference = ((a - b) % 360 + 360) % 360;
		return Math.min(difference, 360 - difference);
	};
	var toPageSite = (leaf, { x, y, angle, index }) => ({
		point: transformPoint(leaf.matrix, {
			x,
			y
		}),
		angle: transformAngle(leaf.matrix, angle),
		index
	});
	/**
	* The connection site on a side of a shape: the one facing most nearly that way, then the one
	* furthest out on that side, then the one nearest the middle of the side.
	*/
	var pickSite = (leaf, side) => {
		const sites = leaf.sites.map((site) => toPageSite(leaf, site));
		const angle = SIDE_ANGLES[side];
		const direction = {
			x: Math.round(Math.cos(angle * Math.PI / 180)),
			y: Math.round(Math.sin(angle * Math.PI / 180))
		};
		const centre = centreOf(leafBounds(leaf));
		const along = ({ point }) => (point.x - centre.x) * direction.x + (point.y - centre.y) * direction.y;
		const across = ({ point }) => Math.abs((point.x - centre.x) * direction.y - (point.y - centre.y) * direction.x);
		const isBetter = (site, best) => {
			const angleDifference = angleBetween(site.angle, angle) - angleBetween(best.angle, angle);
			if (Math.abs(angleDifference) > .01) return angleDifference < 0;
			const alongDifference = along(site) - along(best);
			return Math.abs(alongDifference) > 1 ? alongDifference > 0 : across(site) < across(best);
		};
		return sites.reduce((best, site) => isBetter(site, best) ? site : best);
	};
	/**
	* The connection site nearest a point given as percentages of the shape's width and height. A shape without
	* connection sites is connected at the point itself, leaving in the direction, right, down, left or up, that the
	* point is furthest from the shape's middle in.
	*/
	var pickNearestSite = (leaf, point) => {
		if (!(point.x >= 0 && point.x <= 100 && point.y >= 0 && point.y <= 100)) throw new Error(`Invalid connector point { x: ${point.x}, y: ${point.y} }. Expected percentages from 0 to 100`);
		const target = {
			x: point.x / 100 * leaf.width,
			y: point.y / 100 * leaf.height
		};
		const sites = leaf.sites.filter((site) => site.index !== void 0);
		if (sites.length === 0) return toPageSite(leaf, _objectSpread2(_objectSpread2({}, target), {}, { angle: outwardAngle(target.x, target.y, leaf.width, leaf.height) }));
		const distance = (site) => Math.hypot(site.x - target.x, site.y - target.y);
		return toPageSite(leaf, sites.reduce((nearest, site) => distance(site) < distance(nearest) ? site : nearest));
	};
	var pathLength = (points) => points.slice(1).reduce((total, point, index) => total + Math.hypot(point.x - points[index].x, point.y - points[index].y), 0);
	/**
	* The point a distance along a path, and the direction of the path there as a unit vector.
	*/
	var pointAlong = (points, distance) => {
		const segments = points.slice(1).map((end, index) => ({
			start: points[index],
			end,
			size: Math.hypot(end.x - points[index].x, end.y - points[index].y)
		})).filter(({ size }) => size > 0);
		if (segments.length === 0) return {
			point: points[0],
			direction: {
				x: 1,
				y: 0
			}
		};
		const directionOf = ({ start, end, size }) => ({
			x: (end.x - start.x) / size,
			y: (end.y - start.y) / size
		});
		const ends = segments.map((_, index) => segments.slice(0, index + 1).reduce((total, { size }) => total + size, 0));
		const within = Math.min(distance, ends[ends.length - 1]);
		const found = ends.findIndex((end) => within <= end);
		const segment = segments[found];
		const along = within - (ends[found] - segment.size);
		const direction = directionOf(segment);
		return {
			point: {
				x: segment.start.x + direction.x * along,
				y: segment.start.y + direction.y * along
			},
			direction
		};
	};
	/**
	* The paragraphs a label is written with: centred lines of text given as a string, or the paragraphs it is given.
	*/
	var labelParagraphs = (label, styles) => {
		const text = typeof label === "string" ? label : label.text;
		return typeof text === "string" ? createTextParagraphs(text, styles) : text;
	};
	/**
	* The size of a connector's label in pixels: as big as its text, unless it is given a size.
	*
	* @param paragraphs - The label's paragraphs, as they are written
	*/
	var labelSize = (label, paragraphs, styles) => {
		const { width, height } = typeof label === "string" ? {
			width: void 0,
			height: void 0
		} : label;
		const measured = width === void 0 || height === void 0 ? measureText(readTextParagraphs(paragraphs, styles)) : {
			width: 0,
			height: 0
		};
		return {
			width: width !== null && width !== void 0 ? width : Math.ceil(measured.width * PIXELS_PER_POINT) + LABEL_PADDING.width,
			height: height !== null && height !== void 0 ? height : Math.ceil(measured.height * PIXELS_PER_POINT) + LABEL_PADDING.height
		};
	};
	/**
	* A connector's label: a text box without a line, centred on the connector's route. At the start or end of the
	* route it is just clear of the shape, and it moves along the route until it is off every shape and label, if it can,
	* or else beside the route.
	*/
	var layoutLabel = (label, points, drawingId, avoid, styles) => {
		var _places$find;
		const { fill = "none", line = "none", position = "middle" } = typeof label === "string" ? {} : label;
		const paragraphs = labelParagraphs(label, styles);
		const size = labelSize(label, paragraphs, styles);
		const half = {
			x: size.width * EMUS_PER_PIXEL$2 / 2,
			y: size.height * EMUS_PER_PIXEL$2 / 2
		};
		const reach = ({ x, y }) => Math.abs(x) * half.x + Math.abs(y) * half.y + LABEL_GAP * EMUS_PER_PIXEL$2;
		const total = pathLength(points);
		const wanted = {
			start: Math.min(total / 2, reach(pointAlong(points, 0).direction)),
			middle: total / 2,
			end: Math.max(total / 2, total - reach(pointAlong(points, total).direction))
		}[position];
		const labelBox = (distance, side) => {
			const { point, direction } = pointAlong(points, distance);
			const across = {
				x: -direction.y,
				y: direction.x
			};
			const offset = side * reach(across);
			return {
				x: Math.round(point.x + across.x * offset - half.x),
				y: Math.round(point.y + across.y * offset - half.y),
				width: Math.round(half.x * 2),
				height: Math.round(half.y * 2)
			};
		};
		const step = LABEL_STEP * EMUS_PER_PIXEL$2;
		const distances = [wanted, ...Array.from({ length: Math.ceil(total / step) }, (_, index) => [wanted + (index + 1) * step, wanted - (index + 1) * step]).flat()].filter((distance) => distance >= 0 && distance <= total);
		const crowding = (side) => {
			const { x, y, width, height } = labelBox(wanted, side);
			const around = {
				left: x - width,
				top: y - height,
				right: x + 2 * width,
				bottom: y + 2 * height
			};
			return avoid.boxes.reduce((taken, other) => taken + overlapArea(around, other), 0);
		};
		const places = [0, ...crowding(-1) < crowding(1) ? [-1, 1] : [1, -1]].flatMap((side) => distances.map((distance) => labelBox(distance, side)));
		const isClear = (place) => !avoid.boxes.some((other) => overlaps(shrink(boundsOfBox(place), 1), other)) && !avoid.lines.some((route) => route.slice(1).some((to, index) => crossesBox(route[index], to, boundsOfBox(place))));
		const box = (_places$find = places.find(isClear)) !== null && _places$find !== void 0 ? _places$find : places[0];
		return {
			child: {
				type: "wps",
				box,
				data: _objectSpread2(_objectSpread2({}, createPresetShapeData({
					type: "rectangle",
					transformation: size,
					fill,
					line,
					children: paragraphs,
					textOptions: {
						margins: {
							top: 0,
							right: 0,
							bottom: 0,
							left: 0
						},
						wrap: false,
						verticalAlignment: "center"
					}
				})), {}, { nonVisualDrawingProperties: createNonVisualDrawingProperties(drawingId, "textBox", {}) })
			},
			box: boundsOfBox(box),
			reach: expand(boundsOfBox(box), uniformExtent(line === "none" ? 0 : getShapeLineOverhang(line)))
		};
	};
	var ROUTE_NAMES = {
		straight: "straightConnector",
		elbow: "elbowConnector",
		curved: "curvedConnector"
	};
	var hasArrow = (line, end) => typeof line === "object" && !isThemeColor(line) && line[end] !== void 0;
	/**
	* Finds the shapes and connection sites a connector attaches to.
	*
	* @throws If an end names a shape that doesn't exist or isn't in the connector's group, or gives both a side and a point
	*/
	var resolveConnector = (node, leaves, allIds, sides = {}) => {
		const { options: connector } = node;
		const resolve = (connectorEnd) => {
			const { id, side, point } = typeof connectorEnd === "string" ? {
				id: connectorEnd,
				side: void 0,
				point: void 0
			} : connectorEnd;
			const leaf = leaves.find((candidate) => candidate.id === id);
			if (!leaf) throw new Error(allIds.has(id) ? `Invalid connector. The shape "${id}" is not in the connector's group. A connector in a group can only join shapes in that group` : `Invalid connector. No shape has the id "${id}"`);
			if (side && point) throw new Error(`Invalid connector end for "${id}". Give a side or a point, not both`);
			return {
				leaf,
				side,
				point
			};
		};
		const from = resolve(connector.from);
		const to = resolve(connector.to);
		const endOf = (end, other, arrow, side) => {
			var _ref, _end$side;
			return {
				leaf: end.leaf,
				site: end.point ? pickNearestSite(end.leaf, end.point) : pickSite(end.leaf, (_ref = (_end$side = end.side) !== null && _end$side !== void 0 ? _end$side : side) !== null && _ref !== void 0 ? _ref : facingSide(leafBounds(end.leaf), leafBounds(other.leaf))),
				byPoint: end.point !== void 0,
				arrow
			};
		};
		return {
			node,
			ends: [endOf(from, to, hasArrow(connector.line, "startArrow"), sides.from), endOf(to, from, hasArrow(connector.line, "endArrow"), sides.to)]
		};
	};
	var localSideOf = ({ x, y }, { width, height }) => {
		if (Math.abs(y) < 1) return "top";
		if (Math.abs(y - height) < 1) return "bottom";
		if (Math.abs(x) < 1) return "left";
		return Math.abs(x - width) < 1 ? "right" : void 0;
	};
	/**
	* Spreads out the ends of connectors that meet at the same connection site along the straight part of its side, so
	* arrowheads don't sit on top of each other, and connectors that join the same two shapes don't overlap. The ends are
	* ordered by where the connectors go, so they don't cross. Ends without arrowheads that fan out to different shapes
	* stay together, as the lines from a box in an org chart do.
	*
	* The ends keep their connection sites, so Word joins them at the site again if a shape is moved.
	*/
	var spreadEnds = (connectors) => {
		const groups = connectors.flatMap((connector, index) => connector.ends.map((end, which) => ({
			key: `${index}:${which}`,
			index,
			end,
			other: connector.ends[1 - which]
		}))).filter(({ end }) => !end.byPoint && end.site.index !== void 0).reduce((all, end) => {
			var _all$get;
			const key = `${end.end.leaf.drawingId}:${end.end.site.index}`;
			return new Map([...all, [key, [...(_all$get = all.get(key)) !== null && _all$get !== void 0 ? _all$get : [], end]]]);
		}, /* @__PURE__ */ new Map());
		const moved = new Map([...groups.values()].flatMap((members) => {
			const { leaf, site } = members[0].end;
			const local = leaf.sites.find(({ index }) => index === site.index);
			const side = localSideOf(local, leaf);
			const straight = side && leaf.straightSides[side];
			const needed = members.some(({ end }) => end.arrow) || members.some((member, index) => members.some((other, otherIndex) => otherIndex !== index && other.other.leaf === member.other.leaf));
			if (members.length < 2 || !straight || !needed) return [];
			const alongSide = side === "top" || side === "bottom" ? {
				x: 1,
				y: 0
			} : {
				x: 0,
				y: 1
			};
			const direction = transformDirection(leaf.matrix, alongSide);
			const towards = ({ end, other }) => (other.site.point.x - end.site.point.x) * direction.x + (other.site.point.y - end.site.point.y) * direction.y;
			const ordered = [...members].sort((a, b) => Math.abs(towards(a) - towards(b)) >= 1 ? towards(a) - towards(b) : a.index - b.index);
			return ordered.map(({ key, end }, index) => {
				const at = straight[0] + (straight[1] - straight[0]) * (index + 1) / (ordered.length + 1);
				const point = side === "top" || side === "bottom" ? {
					x: at,
					y: local.y
				} : {
					x: local.x,
					y: at
				};
				return [key, _objectSpread2(_objectSpread2({}, end.site), {}, { point: transformPoint(leaf.matrix, point) })];
			});
		}));
		return connectors.map((connector, index) => {
			var _moved$get, _moved$get2;
			return _objectSpread2(_objectSpread2({}, connector), {}, { ends: [_objectSpread2(_objectSpread2({}, connector.ends[0]), {}, { site: (_moved$get = moved.get(`${index}:0`)) !== null && _moved$get !== void 0 ? _moved$get : connector.ends[0].site }), _objectSpread2(_objectSpread2({}, connector.ends[1]), {}, { site: (_moved$get2 = moved.get(`${index}:1`)) !== null && _moved$get2 !== void 0 ? _moved$get2 : connector.ends[1].site })] });
		});
	};
	/**
	* Whether a straight line passes through a box. A line that only touches its edge, as a connector does where it
	* meets a shape, doesn't.
	*/
	var crossesBox = (from, to, bounds) => {
		const { left, top, right, bottom } = shrink(bounds, EMUS_PER_PIXEL$2);
		const dx = to.x - from.x;
		const dy = to.y - from.y;
		let low = 0;
		let high = 1;
		for (const [step, room] of [
			[-dx, from.x - left],
			[dx, right - from.x],
			[-dy, from.y - top],
			[dy, bottom - from.y]
		]) {
			if (step === 0) {
				if (room < 0) return false;
				continue;
			}
			const ratio = room / step;
			if (step < 0) low = Math.max(low, ratio);
			else high = Math.min(high, ratio);
		}
		return left < right && top < bottom && low < high;
	};
	/**
	* Routes a connector between the shapes it joins. A connector without a `route` is straight, unless a straight line
	* would go through another shape, when it bends around it.
	*/
	var routeResolved = (connector, leaves) => {
		var _options$route;
		const { node: { options }, ends: [start, finish] } = connector;
		const others = leaves.filter((leaf) => leaf !== start.leaf && leaf !== finish.leaf).map(leafBounds);
		const route = (_options$route = options.route) !== null && _options$route !== void 0 ? _options$route : others.some((shape) => crossesBox(start.site.point, finish.site.point, shape)) ? "elbow" : "straight";
		return _objectSpread2(_objectSpread2({}, connector), {}, {
			route,
			geometry: routeConnector(route, start.site, finish.site, {
				margin: marginOf(options),
				obstacles: leaves.map(leafBounds)
			})
		});
	};
	var marginOf = ({ margin }) => (margin !== null && margin !== void 0 ? margin : DEFAULT_CONNECTOR_MARGIN) * EMUS_PER_PIXEL$2;
	/**
	* Moves apart the lines of elbow connectors that would lie on top of each other, unless moving one would take it
	* through more shapes.
	*/
	var separateRoutes = (routed, leaves) => {
		const obstacles = leaves.map(leafBounds);
		const separated = separateChannels(routed.map(({ route, geometry }) => ({
			points: geometry.points,
			movable: route === "elbow"
		})), CHANNEL_SPACING * EMUS_PER_PIXEL$2);
		return routed.map((connector, index) => {
			const points = separated[index];
			if (points === connector.geometry.points) return connector;
			const [start, finish] = connector.ends;
			const geometry = fitElbowConnector(start.site, finish.site, points, marginOf(connector.node.options));
			return countRouteCrossings(geometry.points, obstacles) > countRouteCrossings(connector.geometry.points, obstacles) ? connector : _objectSpread2(_objectSpread2({}, connector), {}, { geometry });
		});
	};
	/**
	* Writes a routed connector, and places its label clear of the shapes, of `labels` and of the other connectors' `lines`.
	* A connector without a `route` is straight, unless a straight line would go through another shape, when it bends
	* around it.
	*/
	var layoutConnector = ({ node, ends: [start, finish], route, geometry }, leaves, avoid, styles) => {
		const { options: connector, drawingId, labelId } = node;
		const obstacles = leaves.map(leafBounds);
		const path = boundsOf(geometry.points);
		const data = geometry.type === "freeform" ? {
			geometry: {
				type: "custom",
				path: geometry.points.map(({ x, y }, index) => `${index === 0 ? "M" : "L"} ${x - path.left} ${y - path.top}`).join(" ")
			},
			line: connector.line,
			nonVisualDrawingProperties: createNonVisualDrawingProperties(drawingId, "freeform", connector)
		} : {
			geometry: {
				type: geometry.type,
				adjustments: geometry.adjustments
			},
			line: connector.line,
			connections: {
				start: start.site.index === void 0 ? void 0 : {
					id: start.leaf.drawingId,
					index: start.site.index
				},
				end: finish.site.index === void 0 ? void 0 : {
					id: finish.leaf.drawingId,
					index: finish.site.index
				}
			},
			nonVisualDrawingProperties: createNonVisualDrawingProperties(drawingId, ROUTE_NAMES[route], connector)
		};
		const placed = {
			child: {
				type: "wps",
				box: _objectSpread2(_objectSpread2({}, geometry.offset), {}, {
					width: geometry.width,
					height: geometry.height
				}),
				rotation: geometry.rotation,
				flip: {
					horizontal: geometry.flip.horizontal || void 0,
					vertical: geometry.flip.vertical || void 0
				},
				data
			},
			box: path,
			reach: expand(path, uniformExtent(getShapeLineOverhang(connector.line)))
		};
		return connector.label && labelId !== void 0 ? [placed, layoutLabel(connector.label, geometry.points, labelId, {
			boxes: [...obstacles, ...avoid.labels],
			lines: avoid.lines
		}, styles)] : [placed];
	};
	var layoutInnerGroup = (node, allIds, styles) => {
		var _node$options$transfo;
		const inner = layoutGroup(node.children, allIds, styles, node.options.layout, node.laneIds);
		const childOffset = {
			x: Math.round(inner.box.left),
			y: Math.round(inner.box.top)
		};
		const childExtent = {
			x: Math.round(inner.box.right) - childOffset.x,
			y: Math.round(inner.box.bottom) - childOffset.y
		};
		const { width, height } = (_node$options$transfo = node.options.transformation) !== null && _node$options$transfo !== void 0 ? _node$options$transfo : {};
		return {
			layout: inner,
			childOffset,
			childExtent,
			width: width === void 0 ? childExtent.x : Math.round(width * EMUS_PER_PIXEL$2),
			height: height === void 0 ? childExtent.y : Math.round(height * EMUS_PER_PIXEL$2)
		};
	};
	/**
	* Places a group inside the drawing, in the coordinates of the group it is in.
	*/
	var layoutNestedGroup = (node, inner, position) => {
		var _options$transformati;
		const { options, drawingId } = node;
		const { layout, childOffset, childExtent } = inner;
		const { rotation: degrees, flip } = (_options$transformati = options.transformation) !== null && _options$transformati !== void 0 ? _options$transformati : {};
		const box = _objectSpread2(_objectSpread2({}, position), {}, {
			width: inner.width,
			height: inner.height
		});
		const matrix = compose(placement(box, degrees, flip), compose(scaling(childExtent.x === 0 ? 1 : box.width / childExtent.x, childExtent.y === 0 ? 1 : box.height / childExtent.y), translation(-childOffset.x, -childOffset.y)));
		return {
			placed: {
				child: {
					type: "group",
					box,
					rotation: degrees,
					flip,
					childOffset,
					childExtent,
					children: layout.children,
					nonVisualDrawingProperties: createNonVisualDrawingProperties(drawingId, "group", options)
				},
				box: boundsOfBox(box),
				reach: transformBounds(matrix, layout.reach)
			},
			leaves: layout.leaves.map((leaf) => _objectSpread2(_objectSpread2({}, leaf), {}, { matrix: compose(matrix, leaf.matrix) }))
		};
	};
	/**
	* Places a shape, picture or group with the top-left corner of its box, before rotation, at a point.
	*/
	var placeSized = ({ node, transformation, inner }, position, styles) => {
		switch (node.kind) {
			case "shape": return layoutShape(node.options, transformation, node.drawingId, position, styles);
			case "picture": return layoutPicture(node.options, node.drawingId, position);
			default: return layoutNestedGroup(node, inner, position);
		}
	};
	var sizeNode = (node, allIds, styles) => {
		switch (node.kind) {
			case "shape": {
				const transformation = resolveShapeSize(node.options, styles);
				const { width, height } = boxAt({
					x: 0,
					y: 0
				}, transformation);
				return {
					node,
					offset: offsetOf(transformation.offset),
					width,
					height,
					rotation: transformation.rotation,
					transformation
				};
			}
			case "picture": {
				const { width, height } = boxAt({
					x: 0,
					y: 0
				}, node.options.transformation);
				return {
					node,
					offset: offsetOf(node.options.transformation.offset),
					width,
					height,
					rotation: node.options.transformation.rotation
				};
			}
			default: {
				var _node$options$transfo2, _node$options$transfo3;
				const inner = layoutInnerGroup(node, allIds, styles);
				return {
					node,
					offset: offsetOf((_node$options$transfo2 = node.options.transformation) === null || _node$options$transfo2 === void 0 ? void 0 : _node$options$transfo2.offset),
					width: inner.width,
					height: inner.height,
					rotation: (_node$options$transfo3 = node.options.transformation) === null || _node$options$transfo3 === void 0 ? void 0 : _node$options$transfo3.rotation,
					inner
				};
			}
		}
	};
	/**
	* Where to place each shape, picture and group: at its `offset`, or where the layout puts it. The layout places the
	* box around each rotated child, and follows the connectors between the children it places.
	*/
	var arrange = (sized, connectors, styles, layout) => {
		const origin = {
			x: 0,
			y: 0
		};
		const lanes = lanesOf(layout);
		const laneIndex = ({ node }) => {
			const { lane } = node.options;
			const index = lane === void 0 ? 0 : lanes.findIndex(({ name }) => name === lane);
			if (index === -1) throw new Error(`Invalid lane "${lane}". The layout has no lane with that name`);
			return index;
		};
		sized.forEach(laneIndex);
		if (!layout) return {
			positions: sized.map(({ offset }) => offset !== null && offset !== void 0 ? offset : origin),
			levels: /* @__PURE__ */ new Map(),
			lanes: []
		};
		const has = (item, connectorEnd) => idsOf(item.node).includes(endId$1(connectorEnd));
		const free = sized.filter((item) => item.offset === void 0);
		const anchors = sized.filter((item) => item.offset !== void 0 && connectors.some(({ options: { from, to } }) => has(item, from) && free.some((other) => has(other, to)) || has(item, to) && free.some((other) => has(other, from))));
		const placed = sized.filter((item) => item.offset === void 0 || anchors.includes(item));
		const turned = placed.map((item) => {
			var _item$rotation;
			const radians = ((_item$rotation = item.rotation) !== null && _item$rotation !== void 0 ? _item$rotation : 0) * Math.PI / 180;
			const cos = Math.abs(Math.cos(radians));
			const sin = Math.abs(Math.sin(radians));
			return {
				width: item.width * cos + item.height * sin,
				height: item.width * sin + item.height * cos,
				lane: laneIndex(item)
			};
		});
		const itemWith = (connectorEnd) => placed.findIndex((item) => has(item, connectorEnd));
		const vertical = layout.type === "grid" || layout.direction === void 0 || layout.direction === "down" || layout.direction === "up";
		const labelLength = ({ label }) => {
			if (label === void 0) return;
			const size = labelSize(label, labelParagraphs(label, styles), styles);
			return (vertical ? size.height : size.width) * EMUS_PER_PIXEL$2;
		};
		const edges = connectors.map(({ options }) => ({
			from: itemWith(options.from),
			to: itemWith(options.to),
			across: layout.type === "grid" ? void 0 : sideAcross(options, layout.direction),
			labelLength: layout.type === "grid" ? void 0 : labelLength(options)
		})).filter(({ from, to }) => from !== -1 && to !== -1);
		const headerParagraphs = lanes.map(({ name }) => createTextParagraphs(name, styles));
		const headerSizes = headerParagraphs.map((paragraphs) => {
			const { width, height } = measureText(readTextParagraphs(paragraphs, styles));
			const [along, across] = vertical ? [height, width] : [width, height];
			return {
				along: (Math.ceil(along * PIXELS_PER_POINT) + 12) * EMUS_PER_PIXEL$2,
				across: (Math.ceil(across * PIXELS_PER_POINT) + 12) * EMUS_PER_PIXEL$2
			};
		});
		const { positions, levels, lanes: laneBoxes = [] } = layoutItems(layout, turned, edges, {
			length: Math.max(0, ...headerSizes.map(({ along }) => along)),
			widths: headerSizes.map(({ across }) => across)
		});
		const snap = (centre, length) => Math.round(Math.round(centre / EMUS_PER_PIXEL$2) * EMUS_PER_PIXEL$2 - length / 2);
		const laidOut = new Map(placed.map((item, index) => [item, {
			x: snap(positions[index].x + turned[index].width / 2, item.width),
			y: snap(positions[index].y + turned[index].height / 2, item.height)
		}]));
		const shiftBy = (axis) => {
			var _mean;
			return Math.round(((_mean = mean(anchors.map((item) => item.offset[axis] - laidOut.get(item)[axis]))) !== null && _mean !== void 0 ? _mean : 0) / EMUS_PER_PIXEL$2) * EMUS_PER_PIXEL$2;
		};
		const shift = {
			x: shiftBy("x"),
			y: shiftBy("y")
		};
		const shifted = ({ x, y, width, height }) => ({
			x: Math.round(x + shift.x),
			y: Math.round(y + shift.y),
			width,
			height
		});
		return {
			positions: sized.map((item) => {
				var _item$offset;
				const position = laidOut.get(item);
				return (_item$offset = item.offset) !== null && _item$offset !== void 0 ? _item$offset : {
					x: position.x + shift.x,
					y: position.y + shift.y
				};
			}),
			levels: new Map(levels ? placed.map((item, index) => [item.node, levels[index]]) : []),
			lanes: laneBoxes.map(({ band, header }, index) => ({
				lane: lanes[index],
				band: shifted(band),
				header: shifted(header),
				paragraphs: headerParagraphs[index]
			}))
		};
	};
	var mean = (values) => values.length > 0 ? values.reduce((total, value) => total + value, 0) / values.length : void 0;
	/**
	* The lanes of a flow, with a name for each.
	*
	* @throws If two lanes have the same name
	*/
	var lanesOf = (layout) => {
		var _layout$lanes2;
		const lanes = (layout === null || layout === void 0 ? void 0 : layout.type) === "flow" ? ((_layout$lanes2 = layout.lanes) !== null && _layout$lanes2 !== void 0 ? _layout$lanes2 : []).map((lane) => typeof lane === "string" ? { name: lane } : lane) : [];
		const repeated = lanes.find(({ name }, index) => lanes.findIndex((other) => other.name === name) !== index);
		if (repeated) throw new Error(`Invalid lane "${repeated.name}". Each lane in a layout needs a different name`);
		return lanes;
	};
	/**
	* A lane's band, drawn behind the shapes in it, and its header, with its name in it.
	*/
	var layoutLane = ({ lane, band, header, paragraphs }, [bandId, headerId], styles) => {
		var _lane$line, _lane$headerFill;
		const line = (_lane$line = lane.line) !== null && _lane$line !== void 0 ? _lane$line : LANE_LINE;
		const overhang = uniformExtent(getShapeLineOverhang(line));
		const pixels = ({ width, height }) => ({
			width: width / EMUS_PER_PIXEL$2,
			height: height / EMUS_PER_PIXEL$2
		});
		return [{
			child: {
				type: "wps",
				box: band,
				data: _objectSpread2(_objectSpread2({}, createPresetShapeData({
					type: "rectangle",
					transformation: pixels(band),
					fill: lane.fill,
					line
				}, styles)), {}, { nonVisualDrawingProperties: createNonVisualDrawingProperties(bandId, "rectangle", {
					altText: { name: lane.name },
					decorative: true
				}) })
			},
			box: boundsOfBox(band),
			reach: expand(boundsOfBox(band), overhang)
		}, {
			child: {
				type: "wps",
				box: header,
				data: _objectSpread2(_objectSpread2({}, createPresetShapeData({
					type: "rectangle",
					transformation: pixels(header),
					fill: (_lane$headerFill = lane.headerFill) !== null && _lane$headerFill !== void 0 ? _lane$headerFill : LANE_HEADER_FILL,
					line,
					children: paragraphs,
					textOptions: {
						margins: {
							top: 0,
							right: 0,
							bottom: 0,
							left: 0
						},
						wrap: false,
						verticalAlignment: "center"
					}
				}, styles)), {}, { nonVisualDrawingProperties: createNonVisualDrawingProperties(headerId, "textBox", {}) })
			},
			box: boundsOfBox(header),
			reach: expand(boundsOfBox(header), overhang)
		}];
	};
	/**
	* Which way across the levels a connector with a side goes: leaving the right of a shape in a flow that runs down puts
	* the shape it leads to on the right, and so does arriving at the left of it.
	*/
	var sideAcross = (connector, direction = "down") => {
		const [before, after] = direction === "down" || direction === "up" ? ["left", "right"] : ["top", "bottom"];
		const sideOf = (connectorEnd) => typeof connectorEnd === "string" ? void 0 : connectorEnd.side;
		const from = sideOf(connector.from);
		if (from === before || from === after) return from === after ? 1 : -1;
		const to = sideOf(connector.to);
		if (to === before || to === after) return to === before ? 1 : -1;
	};
	var LEVEL_SIDES = {
		down: {
			leave: "bottom",
			arrive: "top",
			back: "right"
		},
		up: {
			leave: "top",
			arrive: "bottom",
			back: "right"
		},
		right: {
			leave: "right",
			arrive: "left",
			back: "bottom"
		},
		left: {
			leave: "left",
			arrive: "right",
			back: "bottom"
		}
	};
	var endId$1 = (connectorEnd) => typeof connectorEnd === "string" ? connectorEnd : connectorEnd.id;
	/**
	* The sides a connector between levels of a flow or tree attaches to, unless it gives its own: it leaves one level
	* towards the next and arrives from the one before. A connector back to the level before goes the other way between
	* the same sides, and one that leads further back goes out of the side of both shapes and loops round.
	*/
	var levelSides = (connector, levelOf, direction = "down") => {
		const from = levelOf(endId$1(connector.from));
		const to = levelOf(endId$1(connector.to));
		if (from === void 0 || to === void 0 || from === to) return {};
		const sides = LEVEL_SIDES[direction];
		if (to > from) return {
			from: sides.leave,
			to: sides.arrive
		};
		return to === from - 1 ? {
			from: sides.arrive,
			to: sides.leave
		} : {
			from: sides.back,
			to: sides.back
		};
	};
	/**
	* Lays out the children of a group: first the shapes, pictures and groups, then the connectors between them.
	*/
	var layoutGroup = (nodes, allIds, styles, layout, laneIds = []) => {
		if (nodes.length === 0) throw new Error("Invalid shape group. Expected at least 1 child shape");
		const connectors = nodes.filter((node) => node.kind === "connector");
		const sized = nodes.filter((node) => node.kind !== "connector").map((node) => sizeNode(node, allIds, styles));
		const { positions, levels, lanes } = arrange(sized, connectors, styles, layout);
		const shapes = new Map(sized.map((item, index) => [item.node, placeSized(item, positions[index], styles)]));
		const leaves = [...shapes.values()].flatMap(({ leaves: shapeLeaves }) => shapeLeaves);
		const levelOf = (id) => {
			const item = sized.find(({ node }) => idsOf(node).includes(id));
			return item && levels.get(item.node);
		};
		const separated = separateRoutes(spreadEnds(connectors.map((connector) => resolveConnector(connector, leaves, allIds, layout && layout.type !== "grid" ? levelSides(connector.options, levelOf, layout.direction) : {}))).map((connector) => routeResolved(connector, leaves)), leaves);
		const routed = separated.reduce(({ connectors: done, labels }, connector) => {
			const lines = separated.filter((other) => other !== connector).map(({ geometry }) => geometry.points);
			const pieces = layoutConnector(connector, leaves, {
				labels,
				lines
			}, styles);
			return {
				connectors: new Map([...done, [connector.node, pieces]]),
				labels: [...labels, ...pieces.slice(1).map(({ box }) => box)]
			};
		}, {
			connectors: /* @__PURE__ */ new Map(),
			labels: []
		}).connectors;
		const placed = [...lanes.flatMap((lane, index) => layoutLane(lane, laneIds[index], styles)), ...nodes.flatMap((node) => node.kind === "connector" ? routed.get(node) : [shapes.get(node).placed])];
		return {
			children: placed.map(({ child }) => child),
			box: union(placed.map(({ box }) => box)),
			reach: union(placed.map(({ reach }) => reach)),
			leaves
		};
	};
	var toMediaData = (child, shift) => {
		const x = Math.round(child.box.x + shift.x);
		const y = Math.round(child.box.y + shift.y);
		const width = Math.round(child.box.width);
		const height = Math.round(child.box.height);
		const transformation = {
			offset: {
				pixels: {
					x: Math.round(x / EMUS_PER_PIXEL$2),
					y: Math.round(y / EMUS_PER_PIXEL$2)
				},
				emus: {
					x,
					y
				}
			},
			pixels: {
				x: Math.round(width / EMUS_PER_PIXEL$2),
				y: Math.round(height / EMUS_PER_PIXEL$2)
			},
			emus: {
				x: width,
				y: height
			},
			flip: child.flip,
			rotation: child.rotation ? child.rotation * 6e4 : void 0
		};
		switch (child.type) {
			case "wps": return {
				type: "wps",
				transformation,
				data: child.data
			};
			case "picture": return {
				type: "picture",
				transformation,
				data: child.data
			};
			default: return {
				type: "group",
				transformation,
				childOffset: child.childOffset,
				childExtent: child.childExtent,
				children: child.children.map((grandchild) => toMediaData(grandchild, {
					x: 0,
					y: 0
				})),
				nonVisualDrawingProperties: child.nonVisualDrawingProperties
			};
		}
	};
	/**
	* Gives the children of a group or canvas their drawing ids. Every shape, picture, group and connector identifies
	* itself with a cNvPr, which needs an id that is unique in the document.
	*
	* @throws If two shapes or pictures have the same `id`
	*/
	var createShapeDrawingNodes = (children, layout) => {
		const laneIds = assignLaneIds(layout);
		const nodes = assignIds(children);
		return {
			nodes,
			ids: collectIds(nodes),
			laneIds
		};
	};
	/**
	* Lays out the shapes, pictures, groups and connectors of a group or canvas. They are drawn in the order given,
	* and connectors can attach to shapes that come after them.
	*
	* @param children - The children, or the children with their drawing ids
	* @param options.keepPositive - Moves everything right and down, if needed, so nothing that is drawn is above or to the left of (0, 0)
	* @param options.layout - Places the children that have no `offset`
	* @param options.styles - The document's styles, which text is measured in. Default is Word's own defaults
	* @throws If a group has no children, two shapes have the same `id`, a connector refers to an `id` no shape in its group has, or a shape to a lane the layout doesn't have
	*/
	var layoutShapeDrawing = (children, { keepPositive = false, layout: shapeLayout, styles = WORD_DEFAULT_STYLES } = {}) => {
		const { nodes, ids, laneIds } = "nodes" in children ? children : createShapeDrawingNodes(children, shapeLayout);
		const layout = layoutGroup(nodes, ids, styles, shapeLayout, laneIds);
		const shift = keepPositive ? {
			x: Math.max(0, -layout.reach.left),
			y: Math.max(0, -layout.reach.top)
		} : {
			x: 0,
			y: 0
		};
		const move = ({ left, top, right, bottom }) => ({
			left: left + shift.x,
			top: top + shift.y,
			right: right + shift.x,
			bottom: bottom + shift.y
		});
		return {
			children: layout.children.map((child) => toMediaData(child, shift)),
			bounds: move(layout.box),
			reach: move(layout.reach)
		};
	};
	/**
	* The paragraphs of text in a shape whose size or text depends on the document's styles, or nothing if they don't:
	* its size fits its text, or its `text` is written to suit them.
	*/
	var shapeStyledParagraphs = ({ transformation, text, children = [] }) => transformation.width === "fitText" || transformation.height === "fitText" || text !== void 0 ? children : void 0;
	/**
	* The paragraphs of text in a group or canvas whose layout depends on the document's styles, or nothing if it doesn't:
	* a shape in it fits its text or has `text`, a label is sized to its text or has text given as a string, or its layout
	* has lanes, whose headers fit their names.
	*/
	var drawingStyledParagraphs = (children, layout) => {
		const found = children.map((child) => {
			switch (child.type) {
				case "connector": {
					const label = typeof child.label === "string" ? { text: child.label } : child.label;
					if (label === void 0 || typeof label.text !== "string" && label.width !== void 0 && label.height !== void 0) return;
					return typeof label.text === "string" ? [] : label.text;
				}
				case "picture": return;
				case "group": return drawingStyledParagraphs(child.children, child.layout);
				default: return shapeStyledParagraphs(child);
			}
		});
		return (layout === null || layout === void 0 ? void 0 : layout.type) === "flow" && layout.lanes !== void 0 && layout.lanes.length > 0 || found.some((paragraphs) => paragraphs !== void 0) ? found.flatMap((paragraphs) => paragraphs !== null && paragraphs !== void 0 ? paragraphs : []) : void 0;
	};
	/**
	* How far, in EMUs, what a group draws reaches past each side of the group, once its children are scaled to the
	* group's size and the group is flipped and rotated.
	*
	* @param layout - The group's layout
	* @param childOffset - The top-left corner of the box its children are positioned in
	* @param childExtent - The size of the box its children are positioned in
	* @param transformation - The group's size in EMUs, rotation in degrees and flip
	*/
	var getGroupEffectExtent = ({ reach }, childOffset, childExtent, { width, height, rotation: degrees, flip }) => {
		const drawn = transformBounds(compose(placement({
			x: 0,
			y: 0,
			width,
			height
		}, degrees, flip), compose(scaling(childExtent.x === 0 ? 1 : width / childExtent.x, childExtent.y === 0 ? 1 : height / childExtent.y), translation(-childOffset.x, -childOffset.y))), reach);
		return {
			top: Math.max(0, Math.ceil(-drawn.top)),
			right: Math.max(0, Math.ceil(drawn.right - width)),
			bottom: Math.max(0, Math.ceil(drawn.bottom - height)),
			left: Math.max(0, Math.ceil(-drawn.left))
		};
	};
	//#endregion
	//#region src/shapes/shape-run.ts
	/**
	* Shape run module for WordprocessingML documents.
	*
	* This module provides support for preset DrawingML shapes, such as rectangles,
	* ellipses, lines and arrows, drawn inline with text or floating on the page.
	*
	* Reference: http://officeopenxml.com/drwSp.php
	*
	* @module
	*/
	/**
	* Represents a shape in a WordprocessingML document.
	*
	* A shape is one of the 187 DrawingML presets, such as a rectangle, ellipse, line,
	* arrow, star, callout or flowchart symbol. It can have a fill, a line with dashes
	* and arrowheads, and text inside it. It sits inline with text unless `floating` is set.
	*
	* Reference: http://officeopenxml.com/drwSp.php
	*
	* @publicApi
	*
	* @example
	* ```typescript
	* // A black bar inline with text
	* new Paragraph({
	*   children: [
	*     new TextRun("Name: "),
	*     new ShapeRun({ type: "rectangle", transformation: { width: 200, height: 4 }, fill: "000000", line: "none" }),
	*   ],
	* });
	*
	* // An arrow
	* new ShapeRun({
	*   type: "line",
	*   transformation: { width: 300, height: 0 },
	*   line: { color: "C00000", width: 2, endArrow: "triangle" },
	* });
	* ```
	*/
	var ShapeRun = class extends docx.Run {
		constructor(options) {
			super(_objectSpread2(_objectSpread2({}, options.run), {}, {
				break: void 0,
				text: void 0,
				children: void 0
			}));
			const floating = options.floating && toImageFloating(options.floating);
			const drawingOptions = createDrawingProperties(_objectSpread2(_objectSpread2({}, options), {}, { floating }));
			this.root.push(createStyledDrawing((styles) => {
				const transformation = resolveShapeSize(options, styles, options.floating && relativeSizeBase(options.floating));
				const drawingTransformation = (0, docx.createTransformation)(_objectSpread2(_objectSpread2({}, transformation), {}, { offset: void 0 }));
				return withRelativePlacement(new docx.Drawing({
					type: "graphic",
					uri: SHAPE_URI,
					transformation: drawingTransformation,
					content: createPresetShape(_objectSpread2(_objectSpread2({}, createPresetShapeData(options, styles)), {}, {
						textFlow: options.textFlow,
						transformation: drawingTransformation
					}))
				}, _objectSpread2(_objectSpread2({}, drawingOptions), {}, { effectExtent: getShapeEffectExtent(_objectSpread2(_objectSpread2({}, options), {}, { transformation })) })), options.floating, options.transformation);
			}, shapeStyledParagraphs(options)));
		}
	};
	//#endregion
	//#region src/shapes/shape-description.ts
	var textOf = (paragraphs) => readTextParagraphs(paragraphs, WORD_DEFAULT_STYLES).map(({ spans }) => spans.map(({ text }) => text).join("")).join(" ").replace(/\s+/g, " ").trim();
	var endId = (end) => typeof end === "string" ? end : end.id;
	/**
	* The shapes and pictures in a diagram that say something, and those in the groups inside it, in the order they are given.
	*/
	var stepsOf = (children) => children.flatMap((child) => {
		switch (child.type) {
			case "connector": return [];
			case "group": return stepsOf(child.children);
			case "picture":
				var _child$altText$name, _child$altText;
				return [{
					id: child.id,
					name: (_child$altText$name = (_child$altText = child.altText) === null || _child$altText === void 0 ? void 0 : _child$altText.name) !== null && _child$altText$name !== void 0 ? _child$altText$name : ""
				}];
			default: {
				var _child$text, _child$children, _child$altText$name2, _child$altText2;
				const text = [(_child$text = child.text) !== null && _child$text !== void 0 ? _child$text : "", textOf((_child$children = child.children) !== null && _child$children !== void 0 ? _child$children : [])].join(" ").replace(/\s+/g, " ").trim();
				return [{
					id: child.id,
					name: (_child$altText$name2 = (_child$altText2 = child.altText) === null || _child$altText2 === void 0 ? void 0 : _child$altText2.name) !== null && _child$altText$name2 !== void 0 ? _child$altText$name2 : text
				}];
			}
		}
	});
	var linksOf = (children) => children.flatMap((child) => {
		var _child$label, _child$label$text, _child$label2;
		if (child.type === "group") return linksOf(child.children);
		if (child.type !== "connector") return [];
		const label = typeof child.label === "string" ? child.label : typeof ((_child$label = child.label) === null || _child$label === void 0 ? void 0 : _child$label.text) === "string" ? child.label.text : textOf((_child$label$text = (_child$label2 = child.label) === null || _child$label2 === void 0 ? void 0 : _child$label2.text) !== null && _child$label$text !== void 0 ? _child$label$text : []);
		return [{
			from: endId(child.from),
			to: endId(child.to),
			label: label.trim() || void 0
		}];
	});
	var endsSentence = (text) => /[.?!]$/.test(text);
	/**
	* Describes a diagram: each flow of connected shapes from its start, such as "Start, then Write the draft, then
	* Approved? Yes: Publish. No: Fix it, then back to Write the draft.", then the shapes that aren't connected.
	* Shapes and pictures without text or alternative text are left out.
	*
	* @returns The description, or an empty string if nothing in the diagram says anything
	*/
	var describeDiagram = (children) => {
		const steps = stepsOf(children);
		const named = steps.filter(({ name }) => name.length > 0);
		const links = linksOf(children).filter(({ from, to }) => from !== to);
		const stepWith = (id) => steps.find((step) => step.id === id);
		const nameOf = (id) => {
			var _stepWith$name, _stepWith;
			return (_stepWith$name = (_stepWith = stepWith(id)) === null || _stepWith === void 0 ? void 0 : _stepWith.name) !== null && _stepWith$name !== void 0 ? _stepWith$name : "";
		};
		const sentence = (text) => endsSentence(text) ? text : `${text}.`;
		const tell = (id, path, seen) => {
			const name = nameOf(id);
			if (seen.has(id)) return {
				text: path.includes(id) ? `back to ${name}` : name,
				seen,
				after: []
			};
			const told = /* @__PURE__ */ new Set([...seen, id]);
			const next = links.filter(({ from, to }) => from === id && nameOf(to).length > 0);
			if (next.length === 0) return {
				text: name,
				seen: told,
				after: []
			};
			if (next.length === 1) {
				const rest = tell(next[0].to, [...path, id], told);
				return _objectSpread2(_objectSpread2({}, rest), {}, { text: `${name}, then ${rest.text}` });
			}
			if (next.every(({ label }) => label === void 0)) {
				const names = next.map(({ to }) => nameOf(to));
				const list = names.length === 2 ? names.join(" and ") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
				return next.reduce((done, { to }) => {
					const branch = tell(to, [...path, id], done.seen);
					const onward = branch.text === nameOf(to) ? [] : [sentence(branch.text)];
					return _objectSpread2(_objectSpread2({}, done), {}, {
						seen: branch.seen,
						after: [
							...done.after,
							...onward,
							...branch.after
						]
					});
				}, {
					text: `${name} leads to ${list}`,
					seen: told,
					after: []
				});
			}
			return next.reduce((done, { to, label }) => {
				const branch = tell(to, [...path, id], done.seen);
				return {
					text: `${done.text} ${sentence(`${label ? `${label}: ` : "Then "}${branch.text}`)}`,
					seen: branch.seen,
					after: [...done.after, ...branch.after]
				};
			}, {
				text: sentence(name),
				seen: told,
				after: []
			});
		};
		return [...named.filter(({ id }) => id === void 0 || !links.some(({ to }) => to === id)), ...named.filter(({ id }) => id !== void 0 && links.some(({ to }) => to === id))].reduce((done, step) => {
			if (step.id !== void 0 && done.seen.has(step.id)) return done;
			const told = step.id === void 0 ? {
				text: step.name,
				seen: done.seen,
				after: []
			} : tell(step.id, [], done.seen);
			return {
				seen: told.seen,
				sentences: [
					...done.sentences,
					sentence(told.text),
					...told.after
				]
			};
		}, {
			seen: /* @__PURE__ */ new Set(),
			sentences: []
		}).sentences.join(" ");
	};
	/**
	* The alternative text of a group or canvas: its own, with a description of the diagram when it has none and isn't
	* decorative.
	*/
	var describeDrawing = ({ altText, decorative, children }) => {
		if (decorative || (altText === null || altText === void 0 ? void 0 : altText.description)) return altText;
		const description = describeDiagram(children);
		if (description.length === 0) return altText;
		return altText ? _objectSpread2(_objectSpread2({}, altText), {}, { description }) : {
			name: "",
			description,
			title: ""
		};
	};
	//#endregion
	//#region src/shapes/shape-group-run.ts
	/**
	* Shape group run module for WordprocessingML documents.
	*
	* This module provides support for groups of preset shapes that are laid out,
	* moved and resized together as one drawing.
	*
	* Reference: http://officeopenxml.com/drwSp-group.php
	*
	* @module
	*/
	var EMUS_PER_PIXEL$1 = 9525;
	/**
	* Represents a group of shapes in a WordprocessingML document.
	*
	* The shapes are positioned with `transformation.offset`, in pixels, and the group is
	* as big as the box around them. Give the group its own `transformation` to scale,
	* rotate or flip all of them together.
	*
	* Connectors are drawn between the shapes they name. Word only keeps connectors attached
	* when shapes are moved on a {@link ShapeCanvasRun}; in a group they stay where they are drawn.
	*
	* Reference: http://officeopenxml.com/drwSp-group.php
	*
	* @publicApi
	*
	* @example
	* ```typescript
	* new ShapeGroupRun({
	*   children: [
	*     { id: "start", type: "rectangle", transformation: { width: 120, height: 48 }, fill: "4472C4" },
	*     { id: "end", type: "ellipse", transformation: { offset: { left: 160 }, width: 120, height: 48 }, fill: "ED7D31" },
	*     { type: "connector", from: "start", to: "end", line: { endArrow: "triangle" } },
	*   ],
	* });
	* ```
	*/
	var ShapeGroupRun = class extends docx.Run {
		constructor(options) {
			super(_objectSpread2(_objectSpread2({}, options.run), {}, {
				break: void 0,
				text: void 0,
				children: void 0
			}));
			const nodes = createShapeDrawingNodes(options.children, options.layout);
			const drawingOptions = createDrawingProperties(_objectSpread2(_objectSpread2({}, options), {}, { altText: describeDrawing(options) }));
			const create = (styles) => {
				var _options$transformati, _options$transformati2;
				const layout = layoutShapeDrawing(nodes, {
					layout: options.layout,
					styles
				});
				const { children, bounds } = layout;
				const childOffset = {
					x: Math.round(bounds.left),
					y: Math.round(bounds.top)
				};
				const childExtent = {
					x: Math.round(bounds.right) - childOffset.x,
					y: Math.round(bounds.bottom) - childOffset.y
				};
				const groupTransformation = options.transformation ? (0, docx.createTransformation)(_objectSpread2(_objectSpread2({}, options.transformation), {}, { offset: void 0 })) : {
					pixels: {
						x: Math.round(childExtent.x / EMUS_PER_PIXEL$1),
						y: Math.round(childExtent.y / EMUS_PER_PIXEL$1)
					},
					emus: childExtent
				};
				return new docx.Drawing({
					type: "graphic",
					uri: GROUP_URI,
					transformation: groupTransformation,
					content: createShapeGroup({
						transformation: groupTransformation,
						childOffset,
						childExtent,
						children: children.map((child) => createShapeDrawingChild(child, "wpg:grpSp"))
					})
				}, _objectSpread2(_objectSpread2({}, drawingOptions), {}, { effectExtent: getGroupEffectExtent(layout, childOffset, childExtent, {
					width: groupTransformation.emus.x,
					height: groupTransformation.emus.y,
					rotation: (_options$transformati = options.transformation) === null || _options$transformati === void 0 ? void 0 : _options$transformati.rotation,
					flip: (_options$transformati2 = options.transformation) === null || _options$transformati2 === void 0 ? void 0 : _options$transformati2.flip
				}) }));
			};
			this.root.push(createStyledDrawing(create, drawingStyledParagraphs(options.children, options.layout)));
		}
	};
	//#endregion
	//#region src/shapes/drawing/alternate-content.ts
	/**
	* Markup compatibility: content for applications that understand a namespace, with a fallback for those that don't.
	*
	* Reference: ECMA-376 Part 3, 10.2 (AlternateContent, Choice and Fallback)
	*
	* @module
	*/
	/**
	* Creates an `mc:AlternateContent` element. An application uses the choice if it understands the namespace
	* that `requires` names, and the fallback otherwise.
	*
	* ## XML
	* ```xml
	* <mc:AlternateContent>
	*   <mc:Choice Requires="wpc">…</mc:Choice>
	*   <mc:Fallback>…</mc:Fallback>
	* </mc:AlternateContent>
	* ```
	*/
	var createAlternateContent = ({ requires, choice, fallback }) => new docx.BuilderElement({
		name: "mc:AlternateContent",
		children: [new docx.BuilderElement({
			name: "mc:Choice",
			attributes: { requires: {
				key: "Requires",
				value: requires
			} },
			children: [choice]
		}), new docx.BuilderElement({
			name: "mc:Fallback",
			children: [fallback]
		})]
	});
	//#endregion
	//#region src/shapes/drawing/wpc-canvas.ts
	/**
	* Drawing canvases (`wpc:wpc`): an area of a document that holds shapes and pictures,
	* where connectors stay attached to the shapes they join.
	*
	* Reference: ECMA-376 Part 1, 20.4.2.19 wpc (WordprocessingML Drawing Canvas)
	*
	* @module
	*/
	/**
	* Creates a `wpc:wpc` element.
	*
	* The background (`wpc:bg`) and outline (`wpc:whole`) are always written, as Word does, and are empty
	* unless a fill or line is given.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_WordprocessingCanvas">
	*   <xsd:sequence minOccurs="1" maxOccurs="1">
	*     <xsd:element name="bg" type="a:CT_BackgroundFormatting" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="whole" type="a:CT_WholeE2oFormatting" minOccurs="0" maxOccurs="1"/>
	*     <xsd:choice minOccurs="0" maxOccurs="unbounded">
	*       <xsd:element ref="wps:wsp"/>
	*       <xsd:element ref="dpct:pic"/>
	*       <xsd:element name="contentPart" type="wp14:CT_WordContentPart"/>
	*       <xsd:element ref="wpg:wgp"/>
	*       <xsd:element name="graphicFrame" type="CT_GraphicFrame"/>
	*     </xsd:choice>
	*     <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createWpcCanvas = ({ children, fill, line }) => new docx.BuilderElement({
		name: "wpc:wpc",
		children: [
			new docx.BuilderElement({
				name: "wpc:bg",
				children: fill ? [createShapeFill(fill)] : []
			}),
			new docx.BuilderElement({
				name: "wpc:whole",
				children: line ? [createShapeLine(line)] : []
			}),
			...children
		]
	});
	//#endregion
	//#region src/shapes/shape-canvas-run.ts
	/**
	* Shape canvas run module for WordprocessingML documents.
	*
	* This module provides support for drawing canvases: areas of a document that hold shapes,
	* where connectors stay attached to the shapes they join when the shapes are moved.
	*
	* @module
	*/
	var EMUS_PER_PIXEL = 9525;
	/**
	* Represents a drawing canvas in a WordprocessingML document.
	*
	* A canvas holds shapes like a {@link ShapeGroupRun}, but its shapes keep their own size, and Word
	* keeps connectors attached to their shapes when the shapes are moved. Use it for flowcharts and
	* diagrams that people will edit.
	*
	* The shapes are positioned with `transformation.offset`, in pixels from the canvas's top-left corner, or by a `layout`.
	*
	* Applications that can't draw canvases, such as Apple Pages, draw the same shapes as a group instead: the canvas is
	* written in `mc:AlternateContent`, with the group as its fallback, unless `fallback` is `false`.
	*
	* @publicApi
	*
	* @example
	* ```typescript
	* new ShapeCanvasRun({
	*   children: [
	*     { id: "start", type: "flowChartTerminator", transformation: { width: 120, height: 48 } },
	*     { id: "step", type: "flowChartProcess", transformation: { offset: { top: 100 }, width: 120, height: 48 } },
	*     { type: "connector", from: "start", to: "step", route: "elbow", line: { endArrow: "triangle" } },
	*   ],
	* });
	* ```
	*/
	var ShapeCanvasRun = class extends docx.Run {
		constructor(options) {
			super(_objectSpread2(_objectSpread2({}, options.run), {}, {
				break: void 0,
				text: void 0,
				children: void 0
			}));
			const altText = describeDrawing(options);
			const canvasNodes = createShapeDrawingNodes(options.children, options.layout);
			const canvasOptions = createDrawingProperties(_objectSpread2(_objectSpread2({}, options), {}, { altText }));
			const fallback = options.fallback === false ? void 0 : {
				nodes: createShapeDrawingNodes(options.children, options.layout),
				backgroundId: (0, docx.docPropertiesUniqueNumericId)(),
				options: createDrawingProperties(_objectSpread2(_objectSpread2({}, options), {}, { altText }))
			};
			const create = (styles) => {
				var _options$line;
				const { children, reach } = layoutShapeDrawing(canvasNodes, {
					keepPositive: true,
					layout: options.layout,
					styles
				});
				const emus = options.transformation ? {
					x: Math.round(options.transformation.width * EMUS_PER_PIXEL),
					y: Math.round(options.transformation.height * EMUS_PER_PIXEL)
				} : {
					x: Math.ceil(reach.right),
					y: Math.ceil(reach.bottom)
				};
				const transformation = {
					pixels: {
						x: Math.round(emus.x / EMUS_PER_PIXEL),
						y: Math.round(emus.y / EMUS_PER_PIXEL)
					},
					emus
				};
				const lineOverhang = options.line ? getShapeLineOverhang(options.line) : 0;
				const canvas = new docx.Drawing({
					type: "graphic",
					uri: CANVAS_URI,
					transformation,
					content: createWpcCanvas({
						children: children.map((child) => createShapeDrawingChild(child, "wpg:wgp")),
						fill: options.fill,
						line: options.line
					})
				}, _objectSpread2(_objectSpread2({}, canvasOptions), {}, { effectExtent: createUniformEffectExtent(lineOverhang) }));
				if (!fallback) return canvas;
				const { backgroundId } = fallback;
				const group = layoutShapeDrawing(fallback.nodes, {
					keepPositive: true,
					layout: options.layout,
					styles
				});
				const background = {
					type: "wps",
					transformation: _objectSpread2({ offset: {
						pixels: {
							x: 0,
							y: 0
						},
						emus: {
							x: 0,
							y: 0
						}
					} }, transformation),
					data: {
						geometry: { type: "rectangle" },
						fill: options.fill,
						line: (_options$line = options.line) !== null && _options$line !== void 0 ? _options$line : "none",
						nonVisualDrawingProperties: {
							id: backgroundId,
							name: `Canvas ${backgroundId}`,
							decorative: true
						}
					}
				};
				const groupReach = {
					left: Math.min(-lineOverhang, group.reach.left),
					top: Math.min(-lineOverhang, group.reach.top),
					right: Math.max(emus.x + lineOverhang, group.reach.right),
					bottom: Math.max(emus.y + lineOverhang, group.reach.bottom)
				};
				return createAlternateContent({
					requires: "wpc",
					choice: canvas,
					fallback: new docx.Drawing({
						type: "graphic",
						uri: GROUP_URI,
						transformation,
						content: createShapeGroup({
							transformation,
							childOffset: {
								x: 0,
								y: 0
							},
							childExtent: emus,
							children: [background, ...group.children].map((child) => createShapeDrawingChild(child, "wpg:grpSp"))
						})
					}, _objectSpread2(_objectSpread2({}, fallback.options), {}, { effectExtent: getGroupEffectExtent({ reach: groupReach }, {
						x: 0,
						y: 0
					}, emus, {
						width: emus.x,
						height: emus.y
					}) }))
				});
			};
			this.root.push(createStyledDrawing(create, drawingStyledParagraphs(options.children, options.layout)));
		}
	};
	//#endregion
	exports.ShapeCanvasRun = ShapeCanvasRun;
	exports.ShapeGroupRun = ShapeGroupRun;
	exports.ShapeRun = ShapeRun;
	return exports;
})({}, docx);
