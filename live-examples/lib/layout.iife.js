var docxLayout = (function(exports) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	//#region src/text-layout/font-widths.ts
	/**
	* The characters the widths are for, in order: printable ASCII, Latin-1, and common punctuation.
	*/
	var FONT_WIDTH_CHARACTERS = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\xA0¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ–—‘’“”•…€™";
	var FONT_WIDTHS = [
		{
			name: "Calibri",
			lineHeight: 1221,
			regular: [
				226,
				326,
				401,
				498,
				507,
				715,
				682,
				221,
				303,
				303,
				498,
				498,
				250,
				306,
				252,
				386,
				507,
				507,
				507,
				507,
				507,
				507,
				507,
				507,
				507,
				507,
				268,
				268,
				498,
				498,
				498,
				463,
				894,
				579,
				544,
				533,
				615,
				488,
				459,
				631,
				623,
				252,
				319,
				520,
				420,
				855,
				646,
				662,
				517,
				673,
				543,
				459,
				487,
				642,
				567,
				890,
				519,
				487,
				468,
				307,
				386,
				307,
				498,
				498,
				291,
				479,
				525,
				423,
				525,
				498,
				305,
				471,
				525,
				229,
				239,
				455,
				229,
				799,
				525,
				527,
				525,
				525,
				349,
				391,
				335,
				525,
				452,
				715,
				433,
				453,
				395,
				314,
				460,
				314,
				498,
				226,
				326,
				498,
				507,
				498,
				507,
				498,
				498,
				393,
				834,
				402,
				512,
				498,
				507,
				507,
				394,
				339,
				498,
				336,
				334,
				292,
				550,
				586,
				252,
				307,
				246,
				422,
				512,
				636,
				671,
				675,
				463,
				579,
				579,
				579,
				579,
				579,
				579,
				763,
				533,
				488,
				488,
				488,
				488,
				252,
				252,
				252,
				252,
				625,
				646,
				662,
				662,
				662,
				662,
				662,
				498,
				664,
				642,
				642,
				642,
				642,
				487,
				517,
				527,
				479,
				479,
				479,
				479,
				479,
				479,
				773,
				423,
				498,
				498,
				498,
				498,
				229,
				229,
				229,
				229,
				525,
				525,
				527,
				527,
				527,
				527,
				527,
				498,
				529,
				525,
				525,
				525,
				525,
				453,
				525,
				453,
				498,
				905,
				250,
				250,
				418,
				418,
				498,
				690,
				507,
				705
			],
			bold: [
				226,
				326,
				438,
				498,
				507,
				729,
				705,
				233,
				312,
				312,
				498,
				498,
				258,
				306,
				267,
				430,
				507,
				507,
				507,
				507,
				507,
				507,
				507,
				507,
				507,
				507,
				276,
				276,
				498,
				498,
				498,
				463,
				898,
				606,
				561,
				529,
				630,
				488,
				459,
				637,
				631,
				267,
				331,
				547,
				423,
				874,
				659,
				676,
				532,
				686,
				563,
				473,
				495,
				653,
				591,
				906,
				551,
				520,
				478,
				325,
				430,
				325,
				498,
				498,
				300,
				494,
				537,
				418,
				537,
				503,
				316,
				474,
				537,
				246,
				255,
				480,
				246,
				813,
				537,
				538,
				537,
				537,
				355,
				399,
				347,
				537,
				473,
				745,
				459,
				474,
				397,
				344,
				475,
				344,
				498,
				226,
				326,
				498,
				507,
				498,
				507,
				498,
				498,
				415,
				834,
				416,
				539,
				498,
				507,
				507,
				390,
				342,
				498,
				338,
				336,
				301,
				563,
				598,
				268,
				303,
				252,
				435,
				539,
				658,
				691,
				702,
				463,
				606,
				606,
				606,
				606,
				606,
				606,
				775,
				529,
				488,
				488,
				488,
				488,
				267,
				267,
				267,
				267,
				639,
				659,
				676,
				676,
				676,
				676,
				676,
				498,
				681,
				653,
				653,
				653,
				653,
				520,
				532,
				555,
				494,
				494,
				494,
				494,
				494,
				494,
				775,
				418,
				503,
				503,
				503,
				503,
				246,
				246,
				246,
				246,
				537,
				537,
				538,
				538,
				538,
				538,
				538,
				498,
				544,
				537,
				537,
				537,
				537,
				474,
				537,
				474,
				498,
				905,
				258,
				258,
				435,
				435,
				498,
				711,
				507,
				720
			]
		},
		{
			name: "Cambria",
			lineHeight: 1172,
			regular: [
				220,
				286,
				393,
				619,
				506,
				890,
				687,
				237,
				382,
				382,
				427,
				554,
				205,
				332,
				205,
				490,
				554,
				554,
				554,
				554,
				554,
				554,
				554,
				554,
				554,
				554,
				264,
				264,
				554,
				554,
				554,
				422,
				885,
				623,
				611,
				562,
				662,
				575,
				537,
				611,
				687,
				324,
				307,
				629,
				537,
				815,
				681,
				653,
				568,
				653,
				621,
				496,
				593,
				648,
				604,
				921,
				571,
				570,
				538,
				350,
				490,
				350,
				554,
				371,
				285,
				488,
				547,
				441,
				555,
				488,
				303,
				494,
				552,
				278,
				266,
				524,
				271,
				832,
				558,
				531,
				556,
				547,
				414,
				430,
				338,
				552,
				504,
				774,
				483,
				504,
				455,
				387,
				316,
				387,
				712,
				220,
				286,
				441,
				528,
				544,
				609,
				316,
				500,
				285,
				851,
				417,
				488,
				554,
				332,
				851,
				285,
				375,
				554,
				407,
				407,
				285,
				544,
				588,
				282,
				285,
				407,
				428,
				488,
				865,
				890,
				865,
				422,
				623,
				623,
				623,
				623,
				623,
				623,
				866,
				562,
				575,
				575,
				575,
				575,
				324,
				324,
				324,
				324,
				665,
				681,
				653,
				653,
				653,
				653,
				653,
				554,
				653,
				648,
				648,
				648,
				648,
				570,
				574,
				605,
				488,
				488,
				488,
				488,
				488,
				488,
				752,
				441,
				488,
				488,
				488,
				488,
				278,
				278,
				278,
				278,
				530,
				558,
				531,
				531,
				531,
				531,
				531,
				554,
				531,
				552,
				552,
				552,
				552,
				504,
				547,
				504,
				500,
				1e3,
				221,
				221,
				375,
				375,
				443,
				752,
				628,
				679
			],
			bold: [
				220,
				335,
				422,
				618,
				543,
				976,
				740,
				251,
				408,
				408,
				453,
				592,
				232,
				337,
				232,
				505,
				592,
				592,
				592,
				592,
				592,
				592,
				592,
				592,
				592,
				592,
				280,
				280,
				592,
				592,
				592,
				452,
				921,
				652,
				651,
				573,
				705,
				578,
				551,
				646,
				722,
				350,
				341,
				682,
				551,
				846,
				679,
				695,
				614,
				695,
				662,
				513,
				639,
				676,
				634,
				961,
				619,
				604,
				566,
				368,
				505,
				368,
				592,
				371,
				285,
				535,
				591,
				469,
				597,
				531,
				326,
				520,
				597,
				314,
				302,
				592,
				308,
				890,
				604,
				569,
				597,
				591,
				461,
				459,
				365,
				597,
				531,
				798,
				525,
				531,
				479,
				393,
				320,
				393,
				592,
				220,
				335,
				469,
				556,
				587,
				641,
				320,
				533,
				285,
				851,
				420,
				522,
				592,
				337,
				851,
				285,
				378,
				592,
				437,
				437,
				285,
				605,
				588,
				276,
				285,
				437,
				436,
				522,
				941,
				976,
				941,
				452,
				652,
				652,
				652,
				652,
				652,
				652,
				880,
				573,
				578,
				578,
				578,
				578,
				350,
				350,
				350,
				350,
				709,
				679,
				695,
				695,
				695,
				695,
				695,
				592,
				695,
				676,
				676,
				676,
				676,
				604,
				617,
				677,
				535,
				535,
				535,
				535,
				535,
				535,
				794,
				469,
				531,
				531,
				531,
				531,
				314,
				314,
				314,
				314,
				572,
				604,
				569,
				569,
				569,
				569,
				569,
				592,
				569,
				597,
				597,
				597,
				597,
				531,
				591,
				531,
				500,
				1e3,
				235,
				235,
				398,
				398,
				443,
				772,
				640,
				684
			]
		},
		{
			name: "Arial",
			lineHeight: 1150,
			regular: [
				278,
				278,
				355,
				556,
				556,
				889,
				667,
				191,
				333,
				333,
				389,
				584,
				278,
				333,
				278,
				278,
				556,
				556,
				556,
				556,
				556,
				556,
				556,
				556,
				556,
				556,
				278,
				278,
				584,
				584,
				584,
				556,
				1015,
				667,
				667,
				722,
				722,
				667,
				611,
				778,
				722,
				278,
				500,
				667,
				556,
				833,
				722,
				778,
				667,
				778,
				722,
				667,
				611,
				722,
				667,
				944,
				667,
				667,
				611,
				278,
				278,
				278,
				469,
				556,
				333,
				556,
				556,
				500,
				556,
				556,
				278,
				556,
				556,
				222,
				222,
				500,
				222,
				833,
				556,
				556,
				556,
				556,
				333,
				500,
				278,
				556,
				500,
				722,
				500,
				500,
				500,
				334,
				260,
				334,
				584,
				278,
				333,
				556,
				556,
				556,
				556,
				260,
				556,
				333,
				737,
				370,
				556,
				584,
				333,
				737,
				552,
				400,
				549,
				333,
				333,
				333,
				576,
				537,
				333,
				333,
				333,
				365,
				556,
				834,
				834,
				834,
				611,
				667,
				667,
				667,
				667,
				667,
				667,
				1e3,
				722,
				667,
				667,
				667,
				667,
				278,
				278,
				278,
				278,
				722,
				722,
				778,
				778,
				778,
				778,
				778,
				584,
				778,
				722,
				722,
				722,
				722,
				667,
				667,
				611,
				556,
				556,
				556,
				556,
				556,
				556,
				889,
				500,
				556,
				556,
				556,
				556,
				278,
				278,
				278,
				278,
				556,
				556,
				556,
				556,
				556,
				556,
				556,
				549,
				611,
				556,
				556,
				556,
				556,
				500,
				556,
				500,
				556,
				1e3,
				222,
				222,
				333,
				333,
				350,
				1e3,
				556,
				1e3
			],
			bold: [
				278,
				333,
				474,
				556,
				556,
				889,
				722,
				238,
				333,
				333,
				389,
				584,
				278,
				333,
				278,
				278,
				556,
				556,
				556,
				556,
				556,
				556,
				556,
				556,
				556,
				556,
				333,
				333,
				584,
				584,
				584,
				611,
				975,
				722,
				722,
				722,
				722,
				667,
				611,
				778,
				722,
				278,
				556,
				722,
				611,
				833,
				722,
				778,
				667,
				778,
				722,
				667,
				611,
				722,
				667,
				944,
				667,
				667,
				611,
				333,
				278,
				333,
				584,
				556,
				333,
				556,
				611,
				556,
				611,
				556,
				333,
				611,
				611,
				278,
				278,
				556,
				278,
				889,
				611,
				611,
				611,
				611,
				389,
				556,
				333,
				611,
				556,
				778,
				556,
				556,
				500,
				389,
				280,
				389,
				584,
				278,
				333,
				556,
				556,
				556,
				556,
				280,
				556,
				333,
				737,
				370,
				556,
				584,
				333,
				737,
				552,
				400,
				549,
				333,
				333,
				333,
				576,
				556,
				333,
				333,
				333,
				365,
				556,
				834,
				834,
				834,
				611,
				722,
				722,
				722,
				722,
				722,
				722,
				1e3,
				722,
				667,
				667,
				667,
				667,
				278,
				278,
				278,
				278,
				722,
				722,
				778,
				778,
				778,
				778,
				778,
				584,
				778,
				722,
				722,
				722,
				722,
				667,
				667,
				611,
				556,
				556,
				556,
				556,
				556,
				556,
				889,
				556,
				556,
				556,
				556,
				556,
				278,
				278,
				278,
				278,
				611,
				611,
				611,
				611,
				611,
				611,
				611,
				549,
				611,
				611,
				611,
				611,
				611,
				556,
				611,
				556,
				556,
				1e3,
				278,
				278,
				500,
				500,
				350,
				1e3,
				556,
				1e3
			]
		},
		{
			name: "Times New Roman",
			lineHeight: 1150,
			regular: [
				250,
				333,
				408,
				500,
				500,
				833,
				778,
				180,
				333,
				333,
				500,
				564,
				250,
				333,
				250,
				278,
				500,
				500,
				500,
				500,
				500,
				500,
				500,
				500,
				500,
				500,
				278,
				278,
				564,
				564,
				564,
				444,
				921,
				722,
				667,
				667,
				722,
				611,
				556,
				722,
				722,
				333,
				389,
				722,
				611,
				889,
				722,
				722,
				556,
				722,
				667,
				556,
				611,
				722,
				722,
				944,
				722,
				722,
				611,
				333,
				278,
				333,
				469,
				500,
				333,
				444,
				500,
				444,
				500,
				444,
				333,
				500,
				500,
				278,
				278,
				500,
				278,
				778,
				500,
				500,
				500,
				500,
				333,
				389,
				278,
				500,
				500,
				722,
				500,
				500,
				444,
				480,
				200,
				480,
				541,
				250,
				333,
				500,
				500,
				500,
				500,
				200,
				500,
				333,
				760,
				276,
				500,
				564,
				333,
				760,
				500,
				400,
				549,
				300,
				300,
				333,
				576,
				453,
				333,
				333,
				300,
				310,
				500,
				750,
				750,
				750,
				444,
				722,
				722,
				722,
				722,
				722,
				722,
				889,
				667,
				611,
				611,
				611,
				611,
				333,
				333,
				333,
				333,
				722,
				722,
				722,
				722,
				722,
				722,
				722,
				564,
				722,
				722,
				722,
				722,
				722,
				722,
				556,
				500,
				444,
				444,
				444,
				444,
				444,
				444,
				667,
				444,
				444,
				444,
				444,
				444,
				278,
				278,
				278,
				278,
				500,
				500,
				500,
				500,
				500,
				500,
				500,
				549,
				500,
				500,
				500,
				500,
				500,
				500,
				500,
				500,
				500,
				1e3,
				333,
				333,
				444,
				444,
				350,
				1e3,
				500,
				980
			],
			bold: [
				250,
				333,
				555,
				500,
				500,
				1e3,
				833,
				278,
				333,
				333,
				500,
				570,
				250,
				333,
				250,
				278,
				500,
				500,
				500,
				500,
				500,
				500,
				500,
				500,
				500,
				500,
				333,
				333,
				570,
				570,
				570,
				500,
				930,
				722,
				667,
				722,
				722,
				667,
				611,
				778,
				778,
				389,
				500,
				778,
				667,
				944,
				722,
				778,
				611,
				778,
				722,
				556,
				667,
				722,
				722,
				1e3,
				722,
				722,
				667,
				333,
				278,
				333,
				581,
				500,
				333,
				500,
				556,
				444,
				556,
				444,
				333,
				500,
				556,
				278,
				333,
				556,
				278,
				833,
				556,
				500,
				556,
				556,
				444,
				389,
				333,
				556,
				500,
				722,
				500,
				500,
				444,
				394,
				220,
				394,
				520,
				250,
				333,
				500,
				500,
				500,
				500,
				220,
				500,
				333,
				747,
				300,
				500,
				570,
				333,
				747,
				500,
				400,
				549,
				300,
				300,
				333,
				576,
				540,
				333,
				333,
				300,
				330,
				500,
				750,
				750,
				750,
				500,
				722,
				722,
				722,
				722,
				722,
				722,
				1e3,
				722,
				667,
				667,
				667,
				667,
				389,
				389,
				389,
				389,
				722,
				722,
				778,
				778,
				778,
				778,
				778,
				570,
				778,
				722,
				722,
				722,
				722,
				722,
				611,
				556,
				500,
				500,
				500,
				500,
				500,
				500,
				722,
				444,
				444,
				444,
				444,
				444,
				278,
				278,
				278,
				278,
				500,
				556,
				500,
				500,
				500,
				500,
				500,
				549,
				500,
				556,
				556,
				556,
				556,
				500,
				556,
				500,
				500,
				1e3,
				333,
				333,
				500,
				500,
				350,
				1e3,
				500,
				1e3
			]
		},
		{
			name: "Courier New",
			lineHeight: 1133,
			regular: [
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600
			],
			bold: [
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600
			]
		}
	];
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
	var CHARACTER_INDEX = new Map([...FONT_WIDTH_CHARACTERS].map((character, index) => [character.codePointAt(0), index]));
	var AVERAGE_LETTER_INDEXES = [..."abcdefghijklmnopqrstuvwxyz"].map((letter) => CHARACTER_INDEX.get(letter.codePointAt(0)));
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
	var isWide = (code) => code >= 4352 && code <= 4447 || code >= 11904 && code <= 42191 || code >= 44032 && code <= 55203 || code >= 63744 && code <= 64255 || code >= 65072 && code <= 65103 || code >= 65280 && code <= 65376 || code >= 65504 && code <= 65510 || code >= 127744;
	/**
	* The width of a character in thousandths of an em. Characters that aren't in the table are as wide as an average
	* lowercase letter, or a whole em for wide characters, and combining accents take no space.
	*/
	var characterWidth = (widths, code) => {
		const index = CHARACTER_INDEX.get(code);
		if (index !== void 0) return widths[index];
		if (isWide(code)) return 1e3;
		return code >= 768 && code <= 879 ? 0 : AVERAGE_LETTER_INDEXES.reduce((total, letter) => total + widths[letter], 0) / AVERAGE_LETTER_INDEXES.length;
	};
	var sizeOf = ({ size = 10 }) => size;
	/**
	* How wide a line of text is, in points. Tabs move to the next half inch, counted from the start of the line.
	*
	* @param start - Where the text starts on its line, in points
	*/
	var measureTextWidth = (text, font = {}, start = 0) => {
		const { regular, bold } = widthsOf(font.font);
		const widths = font.bold ? bold : regular;
		const size = sizeOf(font);
		const { characterSpacing = 0, scale = 100 } = font;
		return [...text].reduce((position, character) => character === "	" ? (Math.floor(position / TAB_STOP) + 1) * TAB_STOP : position + characterWidth(widths, character.codePointAt(0)) * size * scale / 1e5 + characterSpacing, start) - start;
	};
	/**
	* How tall a line of single-spaced text is, in points.
	*/
	var measureLineHeight = (font = {}) => widthsOf(font.font).lineHeight * sizeOf(font) / 1e3;
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
		var _ref, _ref2, _themeFontOf;
		const children = childrenOf(element);
		const fonts = attributesOf(find(children, "w:rFonts"));
		return withoutUndefined({
			font: (_ref = (_ref2 = (_themeFontOf = themeFontOf(fonts["w:asciiTheme"], themeFonts)) !== null && _themeFontOf !== void 0 ? _themeFontOf : stringOf(fonts["w:ascii"])) !== null && _ref2 !== void 0 ? _ref2 : themeFontOf(fonts["w:hAnsiTheme"], themeFonts)) !== null && _ref !== void 0 ? _ref : stringOf(fonts["w:hAnsi"]),
			size: scaled(numberOf(attributesOf(find(children, "w:sz"))["w:val"]), 2),
			bold: onOff(children, "w:b"),
			allCaps: onOff(children, "w:caps"),
			smallCaps: onOff(children, "w:smallCaps"),
			hidden: onOff(children, "w:vanish"),
			characterSpacing: scaled(numberOf(attributesOf(find(children, "w:spacing"))["w:val"]), 20),
			scale: numberOf(attributesOf(find(children, "w:w"))["w:val"])
		});
	};
	var readLineSpacing = (spacing) => {
		const line = numberOf(spacing["w:line"]);
		if (line === void 0) return;
		const rule = spacing["w:lineRule"];
		return rule === "exact" || rule === "atLeast" ? {
			rule,
			height: line / 20
		} : {
			rule: "multiple",
			multiple: line / SINGLE_LINE
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
	/**
	* Reads the tab stops of paragraph properties (`w:tabs`).
	*/
	var readTabs = (element) => {
		const tabs = childrenOf(element).filter((child) => "w:tab" in child);
		return tabs.length === 0 ? void 0 : tabs.map((tab) => {
			var _numberOf, _TAB_ALIGNMENTS$Strin;
			const attributes = attributesOf(tab["w:tab"]);
			return {
				position: ((_numberOf = numberOf(attributes["w:pos"])) !== null && _numberOf !== void 0 ? _numberOf : 0) / 20,
				alignment: (_TAB_ALIGNMENTS$Strin = TAB_ALIGNMENTS[String(attributes["w:val"])]) !== null && _TAB_ALIGNMENTS$Strin !== void 0 ? _TAB_ALIGNMENTS$Strin : "left"
			};
		});
	};
	/**
	* Reads paragraph properties (`w:pPr`).
	*/
	var readParagraphFormat = (element) => {
		const children = childrenOf(element);
		const spacing = attributesOf(find(children, "w:spacing"));
		const indent = attributesOf(find(children, "w:ind"));
		const twips = (...names) => scaled(names.map((name) => numberOf(indent[name])).find((value) => value !== void 0), 20);
		const hanging = twips("w:hanging");
		return withoutUndefined({
			spaceBefore: scaled(numberOf(spacing["w:before"]), 20),
			spaceAfter: scaled(numberOf(spacing["w:after"]), 20),
			lineSpacing: readLineSpacing(spacing),
			indentLeft: twips("w:start", "w:left"),
			indentRight: twips("w:end", "w:right"),
			firstLineIndent: hanging === void 0 ? twips("w:firstLine") : -hanging,
			contextualSpacing: onOff(children, "w:contextualSpacing"),
			keepNext: onOff(children, "w:keepNext"),
			keepLines: onOff(children, "w:keepLines"),
			pageBreakBefore: onOff(children, "w:pageBreakBefore"),
			widowControl: onOff(children, "w:widowControl"),
			tabs: readTabs(find(children, "w:tabs"))
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
			var _stringOf;
			const children = childrenOf(child["w:style"]);
			const attributes = attributesOf(child["w:style"]);
			return {
				id: stringOf(attributes["w:styleId"]),
				isDefault: attributes["w:default"] !== void 0 && !isOff(attributes["w:default"]),
				definition: {
					type: (_stringOf = stringOf(attributes["w:type"])) !== null && _stringOf !== void 0 ? _stringOf : "paragraph",
					basedOn: valueOf(children, "w:basedOn"),
					run: readRunFormat(find(children, "w:rPr"), themeFonts),
					paragraph: readParagraphFormat(find(children, "w:pPr"))
				}
			};
		}).filter((style) => style.id !== void 0);
		const defaultStyle = (type) => {
			var _styles$find;
			return (_styles$find = styles.find((style) => style.isDefault && style.definition.type === type)) === null || _styles$find === void 0 ? void 0 : _styles$find.id;
		};
		const byId = new Map(styles.map((style) => [style.id, style.definition]));
		return {
			run: combine(defaults.map((children) => readRunFormat(find(childrenOf(find(children, "w:rPrDefault")), "w:rPr"), themeFonts))),
			paragraph: combine(defaults.map((children) => readParagraphFormat(find(childrenOf(find(children, "w:pPrDefault")), "w:pPr")))),
			styles: byId,
			defaultParagraphStyle: defaultStyle("paragraph"),
			defaultCharacterStyle: defaultStyle("character"),
			themeFonts
		};
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
	var fontOf = ({ font, size, bold, characterSpacing, scale }) => withoutUndefined({
		font,
		size,
		bold,
		characterSpacing,
		scale
	});
	/**
	* A span of text in its formatting: capitals for all caps, and smaller capitals for the small letters of small caps.
	*/
	var spansOf = (text, format) => {
		var _font$size;
		const { allCaps, smallCaps, hidden } = format;
		const font = fontOf(format);
		if (hidden) return [];
		if (allCaps || !smallCaps) return [_objectSpread2(_objectSpread2({}, font), {}, { text: allCaps ? text.toUpperCase() : text })];
		const small = _objectSpread2(_objectSpread2({}, font), {}, { size: ((_font$size = font.size) !== null && _font$size !== void 0 ? _font$size : 10) * SMALL_CAPS_SCALE });
		return text.split(new RegExp("(\\p{Ll}+)", "u")).filter((part) => part.length > 0).map((part) => new RegExp("^\\p{Ll}", "u").test(part) ? _objectSpread2(_objectSpread2({}, small), {}, { text: part.toUpperCase() }) : _objectSpread2(_objectSpread2({}, font), {}, { text: part }));
	};
	//#endregion
	//#region src/text-layout/line-breaking.ts
	/**
	* Breaks a paragraph into lines as Word breaks it, for laying out pages: where each line wraps, how tall it is, and
	* which bookmarks start on it.
	*
	* Lines break at spaces, after hyphens, and between Chinese, Japanese and Korean characters. Tabs move to the
	* paragraph's tab stops, or to the document's default ones. Each line is as tall as the tallest text or picture on
	* it, with the paragraph's line spacing.
	*
	* @module
	*/
	var DEFAULT_MEASURER = {
		measureWidth: (text, font) => measureTextWidth(text, font),
		measureLineHeight
	};
	var DEFAULT_TAB_STOP = 36;
	var TOLERANCE$1 = .01;
	var CJK_LETTER = new RegExp("[\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}\\p{Script=Hangul}]", "u");
	var NO_LINE_START = /* @__PURE__ */ new Set([..."、。，．：；？！）」』】〕〉》ー々ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ,.:;?!)]}"]);
	var NO_LINE_END = /* @__PURE__ */ new Set([..."（「『【〔〈《([{"]);
	/**
	* Whether a line can break between two characters with no space between them: after a hyphen that isn't before a
	* digit, and before or after a Chinese, Japanese or Korean letter.
	*/
	var canBreakBetween = (before, after) => !NO_LINE_START.has(after) && !NO_LINE_END.has(before) && (before === "-" && !/[\d-]/.test(after) || CJK_LETTER.test(before) || CJK_LETTER.test(after));
	var splitText = (text) => text.split(/( +)/).filter((part) => part.length > 0).flatMap((part) => {
		if (part.startsWith(" ")) return [{
			text: part,
			isSpace: true
		}];
		const characters = [...part];
		return characters.reduce((words, character, index) => {
			var _words;
			return index > 0 && canBreakBetween(characters[index - 1], character) ? [...words, character] : [...words.slice(0, -1), `${(_words = words[words.length - 1]) !== null && _words !== void 0 ? _words : ""}${character}`];
		}, []).map((word) => ({
			text: word,
			isSpace: false
		}));
	});
	var lastCharacter = (text) => [...text].pop();
	/**
	* Turns a part of a paragraph into tokens. Pieces of words next to each other in different fonts are one word, unless
	* the line can break between them.
	*/
	var tokenize = (items) => items.reduce((tokens, item) => {
		if (item.type === "text") return splitText(item.text).reduce((all, { text, isSpace }) => {
			const last = all[all.length - 1];
			const type = isSpace ? "space" : "word";
			return (last === null || last === void 0 ? void 0 : last.type) === type && (isSpace || !canBreakBetween(lastCharacter(last.pieces[last.pieces.length - 1].text), [...text][0])) ? [...all.slice(0, -1), {
				type,
				pieces: [...last.pieces, {
					text,
					font: item.font
				}]
			}] : [...all, {
				type,
				pieces: [{
					text,
					font: item.font
				}]
			}];
		}, tokens);
		return [...tokens, item];
	}, []);
	/**
	* Splits a paragraph's content at its breaks.
	*/
	var segmentsOf = (items) => {
		const breaks = items.flatMap((item, index) => item.type === "break" ? [index] : []);
		return [0, ...breaks.map((index) => index + 1)].map((start, index) => {
			const end = breaks[index];
			return {
				tokens: tokenize(items.slice(start, end)),
				end: end === void 0 ? void 0 : items[end]
			};
		});
	};
	var widthOf = (pieces, measurer) => pieces.reduce((total, { text, font }) => total + measurer.measureWidth(text, font), 0);
	/** The height of single-spaced lines, with this line spacing */
	var spaced = (natural, spacing) => {
		if (!spacing) return natural;
		if (spacing.rule === "multiple") return natural * spacing.multiple;
		return spacing.rule === "exact" ? spacing.height : Math.max(natural, spacing.height);
	};
	/**
	* Where a tab moves to: the next of the paragraph's tab stops, or the next default one past the last of them. On the
	* first line of a paragraph with a hanging indent, the indent is a stop too. Undefined when the next stop is past the
	* end of the line.
	*/
	var nextStop = (position, stops, defaultStop, limit) => {
		var _stops$find;
		const stop = (_stops$find = stops.find((given) => given.position > position + TOLERANCE$1)) !== null && _stops$find !== void 0 ? _stops$find : {
			position: (Math.floor((position + TOLERANCE$1) / defaultStop) + 1) * defaultStop,
			alignment: "left"
		};
		return stop.position > limit + TOLERANCE$1 ? void 0 : stop;
	};
	/**
	* The width of the text after a tab, up to the next tab or the end of the part: what lines up with a right or centered
	* stop. Spaces at its end aren't counted.
	*/
	var widthAfterTab = (tokens, measurer) => {
		const next = tokens.findIndex((token) => token.type === "tab");
		const text = next === -1 ? tokens : tokens.slice(0, next);
		const lastWord = text.findLastIndex((token) => token.type !== "space" && token.type !== "marker");
		return text.slice(0, lastWord + 1).reduce((total, token) => {
			if (token.type === "box") return total + token.width;
			return token.type === "word" || token.type === "space" ? total + widthOf(token.pieces, measurer) : total;
		}, 0);
	};
	/**
	* Breaks a paragraph into lines, as Word breaks it.
	*
	* @param items - The paragraph's content, in order
	*/
	var layoutLines = (items, { width, format = {}, tabStops = [], defaultTabStop = DEFAULT_TAB_STOP, markFont = {}, measurer = DEFAULT_MEASURER }) => {
		const { indentLeft = 0, indentRight = 0, firstLineIndent = 0, lineSpacing } = format;
		const limit = width - indentRight;
		const markHeight = measurer.measureLineHeight(markFont);
		const stops = [...tabStops].sort((a, b) => a.position - b.position);
		const firstLineStops = firstLineIndent < 0 ? [...stops, {
			position: indentLeft,
			alignment: "left"
		}].sort((a, b) => a.position - b.position) : stops;
		const parts = segmentsOf(items);
		const [previous, last] = parts.slice(-2);
		const segments = parts.length > 1 && previous.end.kind !== "line" && last.tokens.every((token) => token.type === "marker") ? [...parts.slice(0, -2), {
			tokens: [...previous.tokens, ...last.tokens],
			end: previous.end
		}] : parts;
		const lines = [];
		let first = true;
		for (const [segmentIndex, { tokens, end }] of segments.entries()) {
			const isLast = segmentIndex === segments.length - 1;
			let line = {
				position: indentLeft + (first ? firstLineIndent : 0),
				natural: 0,
				markers: [],
				pending: [],
				started: false,
				first
			};
			const finish = (state, breakAfter, extra = 0) => {
				const natural = Math.max(state.natural, extra, state.started ? 0 : markHeight);
				lines.push(_objectSpread2({
					height: spaced(natural, lineSpacing),
					markers: [...state.markers, ...state.pending]
				}, breakAfter ? { breakAfter } : {}));
			};
			const wrap = (state) => {
				finish(_objectSpread2(_objectSpread2({}, state), {}, { pending: [] }));
				return {
					position: indentLeft,
					natural: 0,
					markers: [],
					pending: state.pending,
					started: false,
					first: false
				};
			};
			/** Puts the bookmarks waiting for the next word, picture or tab on the line it is on */
			const place = (state) => _objectSpread2(_objectSpread2({}, state), {}, {
				markers: [...state.markers, ...state.pending],
				pending: []
			});
			for (const [index, token] of tokens.entries()) {
				if (token.type === "marker") {
					line = _objectSpread2(_objectSpread2({}, line), {}, { pending: [...line.pending, token.name] });
					continue;
				}
				if (token.type === "space") {
					const height = Math.max(...token.pieces.map(({ font }) => measurer.measureLineHeight(font)));
					line = _objectSpread2(_objectSpread2({}, line), {}, {
						position: line.position + widthOf(token.pieces, measurer),
						natural: Math.max(line.natural, height)
					});
					continue;
				}
				if (token.type === "tab") {
					var _nextStop;
					const height = measurer.measureLineHeight(token.font);
					const stop = (_nextStop = nextStop(line.position, line.first ? firstLineStops : stops, defaultTabStop, limit)) !== null && _nextStop !== void 0 ? _nextStop : line.started ? nextStop(indentLeft, stops, defaultTabStop, limit) : void 0;
					if (stop === void 0) {
						line = _objectSpread2(_objectSpread2({}, line), {}, {
							natural: Math.max(line.natural, height),
							started: true
						});
						continue;
					}
					if (stop.position <= line.position + TOLERANCE$1) line = wrap(line);
					line = place(line);
					const after = widthAfterTab(tokens.slice(index + 1), measurer);
					const shift = stop.alignment === "left" ? 0 : stop.alignment === "center" ? after / 2 : after;
					line = _objectSpread2(_objectSpread2({}, line), {}, {
						position: Math.max(line.position, stop.position - shift),
						natural: Math.max(line.natural, height),
						started: true
					});
					continue;
				}
				const tokenWidth = token.type === "box" ? token.width : widthOf(token.pieces, measurer);
				const tokenHeight = token.type === "box" ? token.height : Math.max(...token.pieces.map(({ font }) => measurer.measureLineHeight(font)));
				if (line.started && line.position + tokenWidth > limit + TOLERANCE$1) line = wrap(line);
				line = place(line);
				if (token.type === "word" && line.position + tokenWidth > limit + TOLERANCE$1 && limit - indentLeft > 0) {
					const room = limit - indentLeft;
					const full = Math.floor((line.position - indentLeft + tokenWidth) / room - TOLERANCE$1);
					for (let count = 0; count < full; count++) line = wrap(_objectSpread2(_objectSpread2({}, line), {}, {
						natural: Math.max(line.natural, tokenHeight),
						started: true
					}));
					line = _objectSpread2(_objectSpread2({}, line), {}, { position: indentLeft + ((line.position - indentLeft + tokenWidth) % room || room) });
				} else line = _objectSpread2(_objectSpread2({}, line), {}, { position: line.position + tokenWidth });
				line = _objectSpread2(_objectSpread2({}, line), {}, {
					natural: Math.max(line.natural, tokenHeight),
					started: true
				});
			}
			if (!end) finish(line, void 0, line.started ? markHeight : 0);
			else {
				const breakHeight = Math.max(measurer.measureLineHeight(end.font), isLast ? markHeight : 0);
				finish(_objectSpread2(_objectSpread2({}, line), {}, {
					natural: Math.max(line.natural, breakHeight),
					started: true
				}), end.kind === "line" ? void 0 : end.kind);
			}
			first = false;
		}
		return lines;
	};
	//#endregion
	//#region src/layout/number-format.ts
	/**
	* Writes numbers as Word writes page and list numbers in each of its formats (`ST_NumberFormat`).
	*
	* @module
	*/
	var ROMAN = [
		[1e3, "m"],
		[900, "cm"],
		[500, "d"],
		[400, "cd"],
		[100, "c"],
		[90, "xc"],
		[50, "l"],
		[40, "xl"],
		[10, "x"],
		[9, "ix"],
		[5, "v"],
		[4, "iv"],
		[1, "i"]
	];
	var roman = (value) => ROMAN.reduce(({ rest, text }, [amount, numeral]) => ({
		rest: rest % amount,
		text: text + numeral.repeat(Math.floor(rest / amount))
	}), {
		rest: value,
		text: ""
	}).text;
	/** Letters as Word writes them: a to z, then aa to zz, then aaa and so on */
	var letters = (value) => String.fromCharCode(97 + (value - 1) % 26).repeat(Math.ceil(value / 26));
	var ordinalSuffix = (value) => {
		var _ref;
		return value % 100 >= 11 && value % 100 <= 13 ? "th" : (_ref = [
			"th",
			"st",
			"nd",
			"rd"
		][value % 10]) !== null && _ref !== void 0 ? _ref : "th";
	};
	/**
	* A number in one of Word's number formats, such as `"iv"` for 4 in `lowerRoman`, or undefined for formats it doesn't
	* write, such as those of other languages' scripts. Word writes numbers that are zero or less in the letter and roman
	* formats as decimal numbers.
	*/
	var formatNumber = (value, format = "decimal") => {
		const positive = value > 0;
		switch (format) {
			case "decimal": return String(value);
			case "decimalZero": return value >= 0 && value < 10 ? `0${value}` : String(value);
			case "numberInDash": return `- ${value} -`;
			case "ordinal": return positive ? `${value}${ordinalSuffix(value)}` : String(value);
			case "lowerRoman": return positive ? roman(value) : String(value);
			case "upperRoman": return positive ? roman(value).toUpperCase() : String(value);
			case "lowerLetter": return positive ? letters(value) : String(value);
			case "upperLetter": return positive ? letters(value).toUpperCase() : String(value);
			case "none": return "";
			default: return;
		}
	};
	//#endregion
	//#region src/layout/paginate.ts
	/**
	* Lays out a document's pages as Word does, to find the page each bookmark starts on.
	*
	* Each page's body is filled from the top, between the page's margins, or its header and footer where they are taller.
	* Paragraphs break into lines, and pages break between lines, as their keep and widow control settings allow. Table
	* rows move to the next page whole, and the table's header rows are repeated there. It stops at the first thing it
	* can't lay out yet, and the bookmarks after it aren't placed.
	*
	* @module
	*/
	var TOLERANCE = .01;
	/**
	* The lines of paragraphs without page references, by the measurer and width they were laid out with. They are the same
	* each time the pages are laid out again with the page numbers worked out before.
	*/
	var laidOutLines = /* @__PURE__ */ new WeakMap();
	/** Thrown to stop laying out at something that can't be laid out yet */
	var Unsupported = class extends Error {};
	var sum = (values) => values.reduce((total, value) => total + value, 0);
	/**
	* Lays out a document's pages, and finds the page each bookmark starts on.
	*/
	var paginate = (content, { pageNumbers = /* @__PURE__ */ new Map(), measurer = DEFAULT_MEASURER } = {}) => {
		var _laidOutLines$get;
		const { blocks, sections, defaultTabStop, evenAndOddHeaders, addsParagraphSpacing } = content;
		/** The space between two paragraphs: the larger of the space after the first and before the second, or both */
		const between = (after, before) => addsParagraphSpacing ? after + before : Math.max(after, before);
		const itemsOf = (items) => items.map((item) => {
			var _pageNumbers$get;
			return item.type === "pageReference" ? {
				type: "text",
				text: (_pageNumbers$get = pageNumbers.get(item.bookmark)) !== null && _pageNumbers$get !== void 0 ? _pageNumbers$get : "",
				font: item.font
			} : item;
		});
		const byParagraph = (_laidOutLines$get = laidOutLines.get(measurer)) !== null && _laidOutLines$get !== void 0 ? _laidOutLines$get : /* @__PURE__ */ new WeakMap();
		laidOutLines.set(measurer, byParagraph);
		const linesOf = (paragraph, width) => {
			var _byParagraph$get, _byWidth$get;
			const layOut = () => layoutLines(itemsOf(paragraph.items), {
				width,
				format: paragraph.format,
				tabStops: paragraph.tabStops,
				defaultTabStop,
				markFont: paragraph.markFont,
				measurer
			});
			if (paragraph.items.some(({ type }) => type === "pageReference")) return layOut();
			const byWidth = (_byParagraph$get = byParagraph.get(paragraph)) !== null && _byParagraph$get !== void 0 ? _byParagraph$get : /* @__PURE__ */ new Map();
			byParagraph.set(paragraph, byWidth);
			const lines = (_byWidth$get = byWidth.get(width)) !== null && _byWidth$get !== void 0 ? _byWidth$get : layOut();
			byWidth.set(width, lines);
			return lines;
		};
		const measureParagraph = (paragraph, width, before, after) => {
			var _format$spaceBefore, _format$spaceAfter;
			const { format } = paragraph;
			const lines = linesOf(paragraph, width);
			const sameStyle = (other) => format.contextualSpacing === true && (other === null || other === void 0 ? void 0 : other.type) === "paragraph" && other.style === paragraph.style;
			return {
				lines,
				spaceBefore: sameStyle(before) ? 0 : (_format$spaceBefore = format.spaceBefore) !== null && _format$spaceBefore !== void 0 ? _format$spaceBefore : 0,
				spaceAfter: sameStyle(after) ? 0 : (_format$spaceAfter = format.spaceAfter) !== null && _format$spaceAfter !== void 0 ? _format$spaceAfter : 0,
				keepNext: format.keepNext === true,
				keepLines: format.keepLines === true,
				widowControl: format.widowControl !== false,
				pageBreakBefore: format.pageBreakBefore === true
			};
		};
		const linesHeight = (lines) => sum(lines.map(({ height }) => height));
		/**
		* The height of blocks stacked in a width, such as those in a table cell or a header, with the space before the
		* first and after the last
		*/
		const stackHeight = (stack, width) => {
			var _parts$after, _parts;
			const parts = stack.map((block, index) => {
				if (block.type === "table") return {
					height: sum(rowHeights(block)),
					before: 0,
					after: 0
				};
				const { lines, spaceBefore: before, spaceAfter: after } = measureParagraph(block, width, stack[index - 1], stack[index + 1]);
				return {
					height: linesHeight(lines),
					before,
					after
				};
			});
			return sum(parts.map(({ height, before }, index) => height + (index === 0 ? before : between(parts[index - 1].after, before)))) + ((_parts$after = (_parts = parts[parts.length - 1]) === null || _parts === void 0 ? void 0 : _parts.after) !== null && _parts$after !== void 0 ? _parts$after : 0);
		};
		/**
		* The height of each row of a table: its tallest cell, with the cell's margins, or the row's own height, and its
		* borders. Cells merged down several rows make the last of them taller when their text needs more room.
		*/
		const rowHeights = ({ rows }) => {
			const cellHeight = (cell) => cell.marginTop + stackHeight(cell.blocks, cell.width) + cell.marginBottom;
			const heights = rows.map(({ cells, height, borderTop, borderBottom }) => {
				const natural = Math.max(0, ...cells.filter(({ verticalMerge }) => verticalMerge === void 0).map(cellHeight));
				return (height === void 0 ? natural : height.rule === "exact" ? height.value : Math.max(height.value, natural)) + borderTop + borderBottom;
			});
			return rows.reduce((all, { cells }, rowIndex) => cells.reduce((current, cell) => {
				var _rows$last$height;
				if (cell.verticalMerge !== "restart") return current;
				const span = rows.slice(rowIndex + 1).findIndex((row) => {
					var _row$cells$find;
					return ((_row$cells$find = row.cells.find(({ column }) => column === cell.column)) === null || _row$cells$find === void 0 ? void 0 : _row$cells$find.verticalMerge) !== "continue";
				});
				const last = span === -1 ? rows.length - 1 : rowIndex + span;
				const missing = cellHeight(cell) - sum(current.slice(rowIndex, last + 1));
				return missing > 0 && ((_rows$last$height = rows[last].height) === null || _rows$last$height === void 0 ? void 0 : _rows$last$height.rule) !== "exact" ? current.map((value, index) => index === last ? value + missing : value) : current;
			}, all), heights);
		};
		const markersOf = (block) => block.type === "paragraph" ? block.items.flatMap((item) => item.type === "marker" ? [item.name] : []) : block.rows.flatMap(({ cells }) => cells.flatMap((cell) => cell.blocks.flatMap(markersOf)));
		const bookmarks = /* @__PURE__ */ new Map();
		const headerHeights = /* @__PURE__ */ new Map();
		let pageCount = 0;
		let pageNumber = 0;
		let sectionIndex = 0;
		let top = 0;
		let bottom = 0;
		let position = 0;
		let placedOnPage = false;
		let spaceAfter = 0;
		const section = () => sections[sectionIndex];
		const textWidth = (current = section()) => current.pageWidth - current.marginLeft - current.marginRight - current.gutter;
		const partHeight = (parts, isFirst) => {
			var _headerHeights$get;
			const part = section().titlePage && isFirst ? parts.first : evenAndOddHeaders && pageNumber % 2 === 0 ? parts.even : parts.default;
			if (!part) return 0;
			if (part.some((block) => block.unsupported !== void 0)) throw new Unsupported(part.find((block) => block.unsupported !== void 0).unsupported);
			const height = (_headerHeights$get = headerHeights.get(part)) !== null && _headerHeights$get !== void 0 ? _headerHeights$get : stackHeight(part, textWidth());
			headerHeights.set(part, height);
			return height;
		};
		const startPage = (isFirstOfSection = false) => {
			const current = section();
			pageNumber = isFirstOfSection && current.firstNumber !== void 0 ? current.firstNumber : pageNumber + 1;
			const headerBottom = current.header + partHeight(current.headers, isFirstOfSection);
			const footerTop = current.footer + partHeight(current.footers, isFirstOfSection);
			pageCount++;
			top = current.marginTop < 0 ? -current.marginTop : Math.max(current.marginTop, headerBottom);
			bottom = current.pageHeight - (current.marginBottom < 0 ? -current.marginBottom : Math.max(current.marginBottom, footerTop));
			position = top;
			placedOnPage = false;
			spaceAfter = 0;
		};
		const startSection = (index) => {
			var _current$firstNumber;
			const previous = section();
			sectionIndex = index;
			const current = section();
			if (current.unsupported) throw new Unsupported(current.unsupported);
			const samePage = previous.pageWidth === current.pageWidth && previous.pageHeight === current.pageHeight;
			if (current.start === "continuous" && samePage) return;
			const nextNumber = (_current$firstNumber = current.firstNumber) !== null && _current$firstNumber !== void 0 ? _current$firstNumber : pageNumber + 1;
			if (current.start === "evenPage" && nextNumber % 2 !== 0 || current.start === "oddPage" && nextNumber % 2 === 0) {
				pageCount++;
				pageNumber++;
			}
			startPage(true);
		};
		const mark = (names) => {
			const text = formatNumber(pageNumber, section().numberFormat);
			for (const name of names) if (!bookmarks.has(name)) bookmarks.set(name, text);
		};
		/**
		* Places lines of a paragraph, breaking pages between them where they don't fit. A paragraph's first or last line
		* isn't left alone on a page with widow control, and its lines stay together with keepLines. The space before a
		* paragraph at the top of a page is left out.
		*/
		const placeLines = (lines, paragraph, isStart) => {
			let index = 0;
			while (index < lines.length) {
				const space = placedOnPage && isStart && index === 0 ? between(spaceAfter, paragraph.spaceBefore) : 0;
				const room = bottom - position - space;
				const remaining = lines.slice(index);
				const fits = remaining.map((_, line) => sum(remaining.slice(0, line + 1).map(({ height }) => height))).filter((end) => end <= room + TOLERANCE).length;
				let count = fits;
				if (fits < remaining.length) {
					const isFirstLine = isStart && index === 0;
					if (paragraph.keepLines && isFirstLine) count = 0;
					else if (paragraph.widowControl && remaining.length >= 2) {
						count = remaining.length - count === 1 ? count - 1 : count;
						count = isFirstLine && count === 1 ? 0 : count;
					}
				}
				if (count === 0 && !placedOnPage) count = Math.max(1, fits);
				if (count > 0) {
					position += space;
					for (const line of remaining.slice(0, count)) {
						mark(line.markers);
						position += line.height;
					}
					placedOnPage = true;
					index += count;
				}
				if (index < lines.length) startPage();
			}
		};
		const placeParagraph = (paragraph) => {
			if (paragraph.pageBreakBefore && placedOnPage) startPage();
			const groups = paragraph.lines.reduce((all, line) => {
				const current = [...all[all.length - 1], line];
				return line.breakAfter ? [
					...all.slice(0, -1),
					current,
					[]
				] : [...all.slice(0, -1), current];
			}, [[]]);
			for (const [index, group] of groups.entries()) {
				if (index > 0) startPage();
				placeLines(group, paragraph, index === 0);
			}
			({spaceAfter} = paragraph);
		};
		const placeTable = (table) => {
			const heights = rowHeights(table);
			const headerRows = table.rows.findIndex(({ header }) => !header);
			const repeated = headerRows > 0 ? sum(heights.slice(0, headerRows)) : 0;
			position += spaceAfter;
			spaceAfter = 0;
			for (const [index, row] of table.rows.entries()) {
				const height = heights[index];
				if (position + height > bottom + TOLERANCE && placedOnPage) {
					startPage();
					if (index >= headerRows && headerRows > 0) position += repeated;
				}
				if (height > bottom - position + TOLERANCE) throw new Unsupported("a table row taller than a page");
				mark(row.cells.flatMap((cell) => cell.blocks.flatMap(markersOf)));
				position += height;
				placedOnPage = true;
			}
		};
		/**
		* The room the paragraphs kept with the next one, from this one, need on the page: all of them, and the start of
		* the block they are kept with, from where the next line would go.
		*/
		const keptHeight = (index, width) => {
			var _kept$spaceAfter, _kept;
			const chain = blocks.slice(index).findIndex(({ block, section: blockSection }, offset) => {
				const following = blocks[index + offset + 1];
				return !(block.type === "paragraph" && block.format.keepNext === true && following && following.section === blockSection);
			});
			const measured = (offset) => {
				var _blocks, _blocks2;
				return measureParagraph(blocks[offset].block, width, (_blocks = blocks[offset - 1]) === null || _blocks === void 0 ? void 0 : _blocks.block, (_blocks2 = blocks[offset + 1]) === null || _blocks2 === void 0 ? void 0 : _blocks2.block);
			};
			const kept = Array.from({ length: chain }, (_, offset) => measured(index + offset));
			const keptLines = sum(kept.map(({ lines, spaceBefore }, offset) => linesHeight(lines) + between(offset === 0 ? spaceAfter : kept[offset - 1].spaceAfter, spaceBefore)));
			const lastAfter = (_kept$spaceAfter = (_kept = kept[kept.length - 1]) === null || _kept === void 0 ? void 0 : _kept.spaceAfter) !== null && _kept$spaceAfter !== void 0 ? _kept$spaceAfter : spaceAfter;
			const anchor = blocks[index + chain].block;
			if (anchor.type === "table") {
				var _rowHeights$;
				return keptLines + lastAfter + (anchor.unsupported ? 0 : (_rowHeights$ = rowHeights(anchor)[0]) !== null && _rowHeights$ !== void 0 ? _rowHeights$ : 0);
			}
			const next = measured(index + chain);
			const firstLines = next.keepLines || next.widowControl && next.lines.length <= 3 ? next.lines.length : next.widowControl ? 2 : 1;
			return keptLines + between(lastAfter, next.spaceBefore) + linesHeight(next.lines.slice(0, firstLines));
		};
		try {
			if (content.unsupported) throw new Unsupported(content.unsupported);
			if (section().unsupported) throw new Unsupported(section().unsupported);
			startPage(true);
			for (const [index, { block, section: blockSection }] of blocks.entries()) {
				var _blocks3, _blocks4;
				if (blockSection !== sectionIndex) startSection(blockSection);
				if (block.unsupported) throw new Unsupported(block.unsupported);
				if (block.type === "table") {
					placeTable(block);
					continue;
				}
				const width = textWidth();
				const paragraph = measureParagraph(block, width, (_blocks3 = blocks[index - 1]) === null || _blocks3 === void 0 ? void 0 : _blocks3.block, (_blocks4 = blocks[index + 1]) === null || _blocks4 === void 0 ? void 0 : _blocks4.block);
				if (paragraph.keepNext && placedOnPage) {
					const needed = keptHeight(index, width);
					if (position + needed > bottom + TOLERANCE && needed <= bottom - top + TOLERANCE) startPage();
				}
				placeParagraph(paragraph);
			}
		} catch (error) {
			if (!(error instanceof Unsupported)) throw error;
			return {
				bookmarks,
				pageCount,
				stoppedAt: error.message
			};
		}
		return {
			bookmarks,
			pageCount
		};
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
	//#region src/layout/read-document.ts
	var _excluded = ["text"];
	var DEFAULT_SECTION = {
		pageWidth: 612,
		pageHeight: 792,
		marginTop: 72,
		marginBottom: 72,
		marginLeft: 72,
		marginRight: 72,
		header: 36,
		footer: 36,
		gutter: 0,
		start: "nextPage",
		titlePage: false,
		numberFormat: "decimal"
	};
	var DEFAULT_CELL_MARGIN = 5.4;
	var EMUS_PER_POINT = 12700;
	var EIGHTHS_PER_POINT = 8;
	var PLAIN_FORMATS = /* @__PURE__ */ new Set([
		"mergeformat",
		"charformat",
		"mergeformatinet"
	]);
	var nameOf = (element) => Object.keys(element)[0];
	/** The content of an element, including its text. An element without content has its attributes, or nothing */
	var contentOf = (element) => {
		const content = element[nameOf(element)];
		return Array.isArray(content) ? content : [content];
	};
	var twips = (value) => {
		const amount = numberOf(value);
		return amount === void 0 ? void 0 : amount / 20;
	};
	/**
	* The bookmark a PAGEREF field refers to, unless it shows something other than the page's number: its position relative
	* to the bookmark (`\p`), or the number in a format of its own. As docx writes the page numbers.
	*/
	var pageReferenceOf = (instruction) => {
		const match = /^\s*PAGEREF\s+("?)([^\s"\\]+)\1(.*)$/i.exec(instruction);
		if (!match) return;
		const [, , bookmark, switches] = match;
		const formats = [...switches.matchAll(/\\\*\s*"?([^\s"\\]+)/g)].map(([, format]) => format.toLowerCase());
		return /\\p\b/i.test(switches) || formats.some((format) => !PLAIN_FORMATS.has(format)) ? void 0 : bookmark;
	};
	/** Whether what is read now is shown: not in a field's instruction, nor in the result of a page reference */
	var isShown = ({ fields }) => fields.every((field) => field.inResult && !field.replaced);
	/** Adds the tab stops of a paragraph, or of its style, to those of the styles before */
	var addTabs = (stops, settings = []) => settings.reduce((all, setting) => [...all.filter((stop) => Math.abs(stop.position - setting.position) > .01), ...setting.alignment === "clear" ? [] : [setting]], stops);
	var tabStopsOf = (formats) => formats.reduce((stops, { tabs }) => addTabs(stops, tabs), []).filter((stop) => stop.alignment !== "bar" && stop.alignment !== "clear");
	/**
	* Reads a drawing in a run (`w:drawing`): a picture in the line is a box, and one that text doesn't flow around, such as
	* one behind the text, takes up no room.
	*/
	var readDrawing = (element, reader) => {
		const [drawing] = childrenOf(element["w:drawing"]);
		const inline = drawing["wp:inline"];
		if (inline !== void 0) {
			const children = childrenOf(inline);
			const extent = attributesOf(find(children, "wp:extent"));
			const effect = attributesOf(find(children, "wp:effectExtent"));
			const around = attributesOf(inline);
			const emus = (...values) => values.reduce((total, value) => {
				var _numberOf;
				return total + ((_numberOf = numberOf(value)) !== null && _numberOf !== void 0 ? _numberOf : 0);
			}, 0);
			return [{
				type: "box",
				width: emus(extent.cx, effect.l, effect.r, around.distL, around.distR) / EMUS_PER_POINT,
				height: emus(extent.cy, effect.t, effect.b, around.distT, around.distB) / EMUS_PER_POINT
			}];
		}
		return !childrenOf(drawing["wp:anchor"]).some((child) => "wp:wrapNone" in child) && !reader.inHeader ? "a drawing that text flows around" : [];
	};
	/**
	* Reads a field character (`w:fldChar`). A page reference's result is replaced with the page it refers to.
	*/
	var readFieldCharacter = (element, font, reader) => {
		const type = attributesOf(element["w:fldChar"])["w:fldCharType"];
		const { fields } = reader;
		const field = fields[fields.length - 1];
		if (type === "begin") fields.push({
			instruction: "",
			inResult: false,
			replaced: false
		});
		else if (type === "end") fields.pop();
		else if (type === "separate" && field) {
			const bookmark = pageReferenceOf(field.instruction);
			field.inResult = true;
			if (bookmark !== void 0 && isShown(reader)) {
				field.replaced = true;
				return [{
					type: "pageReference",
					bookmark,
					font
				}];
			}
		}
		return [];
	};
	/**
	* Reads a run (`w:r`) in the paragraph's formatting, as its character style and its own formatting change it.
	*/
	var readRun = (element, paragraphRun, reader) => {
		var _valueOf;
		const { styles } = reader;
		const children = contentOf(element).filter(isObject);
		const properties = find(children, "w:rPr");
		const format = combine([
			paragraphRun,
			...styleChain(styles, (_valueOf = valueOf(childrenOf(properties), "w:rStyle")) !== null && _valueOf !== void 0 ? _valueOf : styles.defaultCharacterStyle, "character").map(({ run }) => run),
			readRunFormat(properties, styles.themeFonts)
		]);
		const font = fontOf(format);
		const items = children.map((child) => {
			const name = nameOf(child);
			if (name === "w:fldChar") return readFieldCharacter(child, font, reader);
			const field = reader.fields[reader.fields.length - 1];
			if (name === "w:instrText") {
				if (field && !field.inResult) field.instruction += contentOf(child).filter((part) => typeof part === "string").join("");
				return [];
			}
			if (!isShown(reader)) return [];
			switch (name) {
				case "w:t": return spansOf(contentOf(child).filter((part) => typeof part === "string").join(""), format).map((span) => {
					const { text } = span;
					return {
						type: "text",
						text,
						font: _objectWithoutProperties(span, _excluded)
					};
				});
				case "w:tab":
				case "w:ptab": return format.hidden ? [] : [{
					type: "tab",
					font
				}];
				case "w:br": {
					const kind = attributesOf(child["w:br"])["w:type"];
					return format.hidden ? [] : [{
						type: "break",
						kind: kind === "page" || kind === "column" ? kind : "line",
						font
					}];
				}
				case "w:cr": return format.hidden ? [] : [{
					type: "break",
					kind: "line",
					font
				}];
				case "w:noBreakHyphen": return [{
					type: "text",
					text: "‑",
					font
				}];
				case "w:sym": return [{
					type: "text",
					text: "■",
					font
				}];
				case "w:endnoteReference":
					var _font$size;
					return [{
						type: "text",
						text: "1",
						font: _objectSpread2(_objectSpread2({}, font), {}, { size: ((_font$size = font.size) !== null && _font$size !== void 0 ? _font$size : 10) * .65 })
					}];
				case "w:drawing": return readDrawing(child, reader);
				case "mc:AlternateContent": {
					const choice = childrenOf(child["mc:AlternateContent"]).find((option) => "mc:Choice" in option);
					return choice ? readRun({ "w:r": [...childrenOf(choice["mc:Choice"])] }, paragraphRun, reader) : [];
				}
				case "w:pict":
				case "w:object": return reader.inHeader ? [] : "a VML drawing";
				case "w:footnoteReference": return "a footnote";
				default: return [];
			}
		});
		const unsupported = items.find((item) => typeof item === "string");
		return unsupported !== null && unsupported !== void 0 ? unsupported : items.flatMap((item) => item);
	};
	var RUN_CONTAINERS = /* @__PURE__ */ new Set([
		"w:hyperlink",
		"w:ins",
		"w:moveTo",
		"w:smartTag",
		"w:customXml",
		"w:dir",
		"w:bdo",
		"w:sdtContent"
	]);
	/**
	* Reads the content of a paragraph, or of an element in it, such as a hyperlink.
	*/
	var readInline = (elements, paragraphRun, reader) => {
		const parts = elements.filter(isObject).map((element) => {
			const name = nameOf(element);
			if (name === "w:r") return readRun(element, paragraphRun, reader);
			if (RUN_CONTAINERS.has(name)) return readInline(contentOf(element), paragraphRun, reader);
			if (name === "w:sdt") return readInline(childrenOf(find(childrenOf(element[name]), "w:sdtContent")), paragraphRun, reader);
			if (name === "w:fldSimple") {
				const bookmark = pageReferenceOf(String(attributesOf(element[name])["w:instr"]));
				return bookmark !== void 0 && isShown(reader) ? [{
					type: "pageReference",
					bookmark,
					font: fontOf(paragraphRun)
				}] : readInline(contentOf(element), paragraphRun, reader);
			}
			if (name === "w:bookmarkStart") {
				const bookmark = stringOf(attributesOf(element[name])["w:name"]);
				return bookmark === void 0 ? [] : [{
					type: "marker",
					name: bookmark
				}];
			}
			return name === "m:oMath" || name === "m:oMathPara" ? "an equation" : [];
		});
		const unsupported = parts.find((part) => typeof part === "string");
		return unsupported !== null && unsupported !== void 0 ? unsupported : parts.flatMap((part) => part);
	};
	/**
	* The number of a paragraph in a list, and what follows it, as its list's level writes it. The list's numbers move on.
	*/
	var readListNumber = (properties, paragraphRun, reader) => {
		var _valueOf2, _numberOf2, _numberOf3, _reader$counters$get, _counts$index;
		const numbering = childrenOf(find(properties, "w:numPr"));
		const id = (_valueOf2 = valueOf(numbering, "w:numId")) !== null && _valueOf2 !== void 0 ? _valueOf2 : String((_numberOf2 = numberOf(attributesOf(find(numbering, "w:numId"))["w:val"])) !== null && _numberOf2 !== void 0 ? _numberOf2 : "");
		const levels = reader.numbering.get(id);
		const index = (_numberOf3 = numberOf(attributesOf(find(numbering, "w:ilvl"))["w:val"])) !== null && _numberOf3 !== void 0 ? _numberOf3 : 0;
		const level = levels === null || levels === void 0 ? void 0 : levels[index];
		if (!levels || !level) return { items: [] };
		const counts = (_reader$counters$get = reader.counters.get(id)) !== null && _reader$counters$get !== void 0 ? _reader$counters$get : [];
		const current = [...counts.slice(0, index), ((_counts$index = counts[index]) !== null && _counts$index !== void 0 ? _counts$index : level.start - 1) + 1];
		reader.counters.set(id, current);
		const text = level.text.replace(/%([1-9])/g, (_, digit) => {
			var _formatNumber, _ref, _current;
			const other = levels[Number(digit) - 1];
			return (_formatNumber = formatNumber((_ref = (_current = current[Number(digit) - 1]) !== null && _current !== void 0 ? _current : other === null || other === void 0 ? void 0 : other.start) !== null && _ref !== void 0 ? _ref : 1, other === null || other === void 0 ? void 0 : other.format)) !== null && _formatNumber !== void 0 ? _formatNumber : "1";
		});
		const font = fontOf(combine([paragraphRun, level.run]));
		const suffix = level.suffix === "nothing" ? [] : level.suffix === "space" ? [{
			type: "text",
			text: " ",
			font
		}] : [{
			type: "tab",
			font
		}];
		return {
			items: [...text.length > 0 ? [{
				type: "text",
				text,
				font
			}] : [], ...suffix],
			level
		};
	};
	/**
	* Reads a paragraph (`w:p`), in the formatting of its styles, and of its table's style when it is in a table.
	*/
	var readParagraph = (element, reader, tableStyle) => {
		var _valueOf3;
		const { styles } = reader;
		const children = contentOf(element);
		const properties = childrenOf(find(children.filter(isObject), "w:pPr"));
		const style = (_valueOf3 = valueOf(properties, "w:pStyle")) !== null && _valueOf3 !== void 0 ? _valueOf3 : styles.defaultParagraphStyle;
		const paragraphStyles = [...styleChain(styles, tableStyle, "table"), ...styleChain(styles, style, "paragraph")];
		const paragraphRun = combine([styles.run, ...paragraphStyles.map(({ run }) => run)]);
		const list = readListNumber(properties, paragraphRun, reader);
		const formats = [
			styles.paragraph,
			...paragraphStyles.map(({ paragraph }) => paragraph),
			...list.level ? [list.level.paragraph] : [],
			readParagraphFormat(properties)
		];
		const items = readInline(children, paragraphRun, reader);
		const unsupported = find(properties, "w:framePr") === void 0 ? void 0 : "a text frame";
		return _objectSpread2({
			type: "paragraph",
			items: typeof items === "string" ? [] : [...list.items, ...items],
			format: combine(formats),
			tabStops: tabStopsOf(formats),
			markFont: fontOf(combine([paragraphRun, readRunFormat(find(properties, "w:rPr"), styles.themeFonts)])),
			style
		}, typeof items === "string" || unsupported ? { unsupported: typeof items === "string" ? items : unsupported } : {});
	};
	var borderWidth = (borders, name) => {
		var _numberOf4;
		const attributes = attributesOf(find(borders, name));
		const style = attributes["w:val"];
		return style === void 0 || style === "nil" || style === "none" ? 0 : ((_numberOf4 = numberOf(attributes["w:sz"])) !== null && _numberOf4 !== void 0 ? _numberOf4 : 0) / EIGHTHS_PER_POINT;
	};
	/** The margins of the cells of a table (`w:tblCellMar`), or of one cell (`w:tcMar`), in points */
	var readCellMargins = (element) => {
		const children = childrenOf(element);
		const side = (...names) => names.map((name) => twips(attributesOf(find(children, name))["w:w"])).find((value) => value !== void 0);
		return Object.fromEntries(Object.entries({
			top: side("w:top"),
			bottom: side("w:bottom"),
			left: side("w:start", "w:left"),
			right: side("w:end", "w:right")
		}).filter(([, value]) => value !== void 0));
	};
	/** The rows of a table, or of a content control or custom XML in it */
	var rowsOf = (elements) => elements.filter(isObject).flatMap((element) => {
		const name = nameOf(element);
		if (name === "w:tr") return [element];
		if (name === "w:sdt") return rowsOf(childrenOf(find(childrenOf(element[name]), "w:sdtContent")));
		return name === "w:customXml" ? rowsOf(contentOf(element)) : [];
	});
	/** The cells of a row */
	var cellsOf = (elements) => elements.filter(isObject).flatMap((element) => {
		const name = nameOf(element);
		if (name === "w:tc") return [element];
		if (name === "w:sdt") return cellsOf(childrenOf(find(childrenOf(element[name]), "w:sdtContent")));
		return name === "w:customXml" ? cellsOf(contentOf(element)) : [];
	});
	/**
	* Reads a table (`w:tbl`): the width, margins and content of each cell, and the height and borders of each row.
	*/
	var readTable = (element, reader) => {
		var _read$flatMap$flatMap;
		const children = contentOf(element).filter(isObject);
		const properties = childrenOf(find(children, "w:tblPr"));
		const style = valueOf(properties, "w:tblStyle");
		const tableMargins = _objectSpread2({
			top: 0,
			bottom: 0,
			left: DEFAULT_CELL_MARGIN,
			right: DEFAULT_CELL_MARGIN
		}, readCellMargins(find(properties, "w:tblCellMar")));
		const borders = childrenOf(find(properties, "w:tblBorders"));
		const grid = childrenOf(find(children, "w:tblGrid")).filter((child) => "w:gridCol" in child).map((column) => {
			var _twips;
			return (_twips = twips(attributesOf(column["w:gridCol"])["w:w"])) !== null && _twips !== void 0 ? _twips : 0;
		});
		const rows = rowsOf(children);
		const read = rows.map((row, rowIndex) => {
			var _numberOf5;
			const rowChildren = contentOf(row).filter(isObject);
			const rowProperties = childrenOf(find(rowChildren, "w:trPr"));
			const heightAttributes = attributesOf(find(rowProperties, "w:trHeight"));
			const height = twips(heightAttributes["w:val"]);
			const { "w:hRule": rule } = heightAttributes;
			const skipped = (_numberOf5 = numberOf(attributesOf(find(rowProperties, "w:gridBefore"))["w:val"])) !== null && _numberOf5 !== void 0 ? _numberOf5 : 0;
			const { cells } = cellsOf(rowChildren).reduce(({ column, cells: done }, cell) => {
				var _numberOf6, _twips2;
				const cellChildren = contentOf(cell).filter(isObject);
				const cellProperties = childrenOf(find(cellChildren, "w:tcPr"));
				const span = (_numberOf6 = numberOf(attributesOf(find(cellProperties, "w:gridSpan"))["w:val"])) !== null && _numberOf6 !== void 0 ? _numberOf6 : 1;
				const mergeElement = find(cellProperties, "w:vMerge");
				const merge = mergeElement === void 0 ? void 0 : attributesOf(mergeElement)["w:val"] === "restart" ? "restart" : "continue";
				const margins = _objectSpread2(_objectSpread2({}, tableMargins), readCellMargins(find(cellProperties, "w:tcMar")));
				const columns = grid.slice(column, column + span);
				const width = columns.length > 0 ? columns.reduce((total, value) => total + value, 0) : (_twips2 = twips(attributesOf(find(cellProperties, "w:tcW"))["w:w"])) !== null && _twips2 !== void 0 ? _twips2 : 0;
				return {
					column: column + span,
					cells: [...done, _objectSpread2({
						column,
						width: width - margins.left - margins.right,
						blocks: readBlocks(cellChildren, reader, style),
						marginTop: margins.top,
						marginBottom: margins.bottom
					}, merge ? { verticalMerge: merge } : {})]
				};
			}, {
				column: skipped,
				cells: []
			});
			return _objectSpread2(_objectSpread2({ cells }, height !== void 0 && rule !== "auto" ? { height: {
				value: height,
				rule: rule === "exact" ? "exact" : "atLeast"
			} } : {}), {}, {
				header: onOff(rowProperties, "w:tblHeader") === true,
				borderTop: borderWidth(borders, rowIndex === 0 ? "w:top" : "w:insideH"),
				borderBottom: rowIndex === rows.length - 1 ? borderWidth(borders, "w:bottom") : 0
			});
		});
		const unsupported = (_read$flatMap$flatMap = read.flatMap(({ cells }) => cells).flatMap(({ blocks }) => blocks).find((block) => block.unsupported !== void 0)) === null || _read$flatMap$flatMap === void 0 ? void 0 : _read$flatMap$flatMap.unsupported;
		return _objectSpread2({
			type: "table",
			rows: read
		}, unsupported ? { unsupported } : {});
	};
	/**
	* Reads the paragraphs and tables in a part of a document, such as a table cell or a header, and in the content controls
	* and custom XML in it.
	*/
	var readBlocks = (elements, reader, tableStyle) => elements.filter(isObject).flatMap((element) => {
		switch (nameOf(element)) {
			case "w:p": return [readParagraph(element, reader, tableStyle)];
			case "w:tbl": return [readTable(element, reader)];
			case "w:sdt": return readBlocks(childrenOf(find(childrenOf(element["w:sdt"]), "w:sdtContent")), reader, tableStyle);
			case "w:customXml": return readBlocks(contentOf(element), reader, tableStyle);
			case "w:altChunk": return [{
				type: "paragraph",
				items: [],
				format: {},
				tabStops: [],
				markFont: {},
				unsupported: "an imported document"
			}];
			default: return [];
		}
	});
	var START_TYPES = /* @__PURE__ */ new Set([
		"nextPage",
		"continuous",
		"evenPage",
		"oddPage",
		"nextColumn"
	]);
	/** The headers or footers a section refers to, by the pages they are on */
	var readReferences = (properties, name, readPart) => Object.fromEntries(properties.filter((child) => name in child).map((child) => {
		var _attributes$wType;
		const attributes = attributesOf(child[name]);
		return [String((_attributes$wType = attributes["w:type"]) !== null && _attributes$wType !== void 0 ? _attributes$wType : "default"), readPart(String(attributes["r:id"]))];
	}).filter(([type, blocks]) => blocks !== void 0 && [
		"default",
		"first",
		"even"
	].includes(type)));
	/**
	* Reads a section's properties (`w:sectPr`): its pages, how it starts, and its headers and footers. A section that
	* doesn't give a header or footer for a kind of page has the one of the section before.
	*/
	var readSection = (element, readPart, previous) => {
		var _stringOf, _numberOf7, _twips3, _twips4, _twips5, _twips6, _twips7, _margins$wLeft, _twips8, _margins$wRight, _twips9, _twips10, _twips11;
		const properties = childrenOf(element);
		const size = attributesOf(find(properties, "w:pgSz"));
		const margins = attributesOf(find(properties, "w:pgMar"));
		const numbering = attributesOf(find(properties, "w:pgNumType"));
		const columns = find(properties, "w:cols");
		const grid = attributesOf(find(properties, "w:docGrid"))["w:type"];
		const start = valueOf(properties, "w:type");
		const format = (_stringOf = stringOf(numbering["w:fmt"])) !== null && _stringOf !== void 0 ? _stringOf : "decimal";
		const firstNumber = numberOf(numbering["w:start"]);
		const unsupported = Math.max((_numberOf7 = numberOf(attributesOf(columns)["w:num"])) !== null && _numberOf7 !== void 0 ? _numberOf7 : 1, childrenOf(columns).filter((child) => "w:col" in child).length) > 1 ? "columns" : grid === "lines" || grid === "linesAndChars" || grid === "snapToChars" ? "a document grid" : numbering["w:chapStyle"] !== void 0 || formatNumber(1, format) === void 0 ? "page numbers in a format not yet written" : find(properties, "w:textDirection") !== void 0 ? "text that runs down the page" : void 0;
		const headers = readReferences(properties, "w:headerReference", readPart);
		const footers = readReferences(properties, "w:footerReference", readPart);
		return _objectSpread2(_objectSpread2({
			pageWidth: (_twips3 = twips(size["w:w"])) !== null && _twips3 !== void 0 ? _twips3 : DEFAULT_SECTION.pageWidth,
			pageHeight: (_twips4 = twips(size["w:h"])) !== null && _twips4 !== void 0 ? _twips4 : DEFAULT_SECTION.pageHeight,
			marginTop: (_twips5 = twips(margins["w:top"])) !== null && _twips5 !== void 0 ? _twips5 : DEFAULT_SECTION.marginTop,
			marginBottom: (_twips6 = twips(margins["w:bottom"])) !== null && _twips6 !== void 0 ? _twips6 : DEFAULT_SECTION.marginBottom,
			marginLeft: (_twips7 = twips((_margins$wLeft = margins["w:left"]) !== null && _margins$wLeft !== void 0 ? _margins$wLeft : margins["w:start"])) !== null && _twips7 !== void 0 ? _twips7 : DEFAULT_SECTION.marginLeft,
			marginRight: (_twips8 = twips((_margins$wRight = margins["w:right"]) !== null && _margins$wRight !== void 0 ? _margins$wRight : margins["w:end"])) !== null && _twips8 !== void 0 ? _twips8 : DEFAULT_SECTION.marginRight,
			header: (_twips9 = twips(margins["w:header"])) !== null && _twips9 !== void 0 ? _twips9 : DEFAULT_SECTION.header,
			footer: (_twips10 = twips(margins["w:footer"])) !== null && _twips10 !== void 0 ? _twips10 : DEFAULT_SECTION.footer,
			gutter: (_twips11 = twips(margins["w:gutter"])) !== null && _twips11 !== void 0 ? _twips11 : DEFAULT_SECTION.gutter,
			start: start !== void 0 && START_TYPES.has(start) ? start : "nextPage",
			titlePage: onOff(properties, "w:titlePg") === true,
			numberFormat: format
		}, firstNumber === void 0 ? {} : { firstNumber }), {}, {
			headers: _objectSpread2(_objectSpread2({}, previous === null || previous === void 0 ? void 0 : previous.headers), headers),
			footers: _objectSpread2(_objectSpread2({}, previous === null || previous === void 0 ? void 0 : previous.footers), footers)
		}, unsupported ? { unsupported } : {});
	};
	/**
	* Reads the levels of each list in the document's numbering (`w:numbering`), by the ids its paragraphs refer to it by:
	* its number, and the placeholder docx writes before it is given one.
	*/
	var readNumbering = (context, styles) => {
		const numbering = context.file.Numbering;
		const root = childrenOf(numbering.prepForXml(READING_CONTEXT)["w:numbering"]);
		const abstract = new Map(root.filter((child) => "w:abstractNum" in child).map((child) => {
			const byIndex = childrenOf(child["w:abstractNum"]).filter((level) => "w:lvl" in level).map((level) => {
				var _valueOf4, _stringOf2, _valueOf5;
				const levelChildren = childrenOf(level["w:lvl"]);
				return {
					index: numberOf(attributesOf(level["w:lvl"])["w:ilvl"]),
					level: {
						format: (_valueOf4 = valueOf(levelChildren, "w:numFmt")) !== null && _valueOf4 !== void 0 ? _valueOf4 : "decimal",
						text: (_stringOf2 = stringOf(attributesOf(find(levelChildren, "w:lvlText"))["w:val"])) !== null && _stringOf2 !== void 0 ? _stringOf2 : "",
						suffix: (_valueOf5 = valueOf(levelChildren, "w:suff")) !== null && _valueOf5 !== void 0 ? _valueOf5 : "tab",
						start: numberOf(attributesOf(find(levelChildren, "w:start"))["w:val"]),
						paragraph: readParagraphFormat(find(levelChildren, "w:pPr")),
						run: readRunFormat(find(levelChildren, "w:rPr"), styles.themeFonts)
					}
				};
			}).reduce((all, { index, level }) => {
				const copy = [...all];
				copy[index] = level;
				return copy;
			}, []);
			return [String(attributesOf(child["w:abstractNum"])["w:abstractNumId"]), byIndex];
		}));
		const byNumber = root.filter((child) => "w:num" in child).map((child) => {
			const abstractId = String(numberOf(attributesOf(find(childrenOf(child["w:num"]), "w:abstractNumId"))["w:val"]));
			return [String(attributesOf(child["w:num"])["w:numId"]), abstract.get(abstractId)];
		});
		const numbers = new Map(byNumber);
		const placeholders = numbering.ConcreteNumbering.map((concrete) => [`{${concrete.reference}-${concrete.instance}}`, numbers.get(String(concrete.numId))]);
		return new Map([...byNumber, ...placeholders]);
	};
	/**
	* Reads the parts of the document's settings (`w:settings`) that change how it is laid out.
	*/
	var readSettings = (context) => {
		var _twips12;
		const settings = childrenOf(context.file.Settings.prepForXml(READING_CONTEXT)["w:settings"]);
		return _objectSpread2({
			defaultTabStop: (_twips12 = twips(attributesOf(find(settings, "w:defaultTabStop"))["w:val"])) !== null && _twips12 !== void 0 ? _twips12 : 36,
			evenAndOddHeaders: onOff(settings, "w:evenAndOddHeaders") === true,
			addsParagraphSpacing: onOff(childrenOf(find(settings, "w:compat")), "w:doNotUseHTMLParagraphAutoSpacing") === true
		}, onOff(settings, "w:autoHyphenation") === true ? { unsupported: "hyphenation" } : {});
	};
	/**
	* Reads a document's body, as it is written, with its styles, lists, settings, headers and footers.
	*
	* @param body - The formatted body (`w:body`)
	* @param context - The context it was formatted in, with the document it is in
	*/
	var readDocument = (body, context) => {
		const styles = getTextStyles(context);
		const numbering = readNumbering(context, styles);
		const readerOf = (inHeader) => ({
			styles,
			numbering,
			inHeader,
			fields: [],
			counters: /* @__PURE__ */ new Map()
		});
		const parts = /* @__PURE__ */ new Map();
		const readPart = (id) => {
			if (!parts.has(id)) {
				const wrapper = [...context.file.Headers, ...context.file.Footers].find(({ View }) => `rId${View.ReferenceId}` === id);
				const xml = wrapper === null || wrapper === void 0 ? void 0 : wrapper.View.prepForXml(_objectSpread2(_objectSpread2({}, context), {}, {
					viewWrapper: wrapper,
					stack: []
				}));
				parts.set(id, xml && readBlocks(Object.values(xml)[0], readerOf(true)));
			}
			return parts.get(id);
		};
		const reader = readerOf(false);
		const sections = [];
		const blocks = [];
		let bookmarks = [];
		const addSection = (element) => {
			sections.push(readSection(element, readPart, sections[sections.length - 1]));
		};
		const read = (elements) => {
			for (const element of elements.filter(isObject)) {
				const name = nameOf(element);
				if (name === "w:sdt") read(childrenOf(find(childrenOf(element[name]), "w:sdtContent")));
				else if (name === "w:customXml") read(contentOf(element));
				else if (name === "w:sectPr") addSection(element[name]);
				else if (name === "w:bookmarkStart") bookmarks = [...bookmarks, String(attributesOf(element[name])["w:name"])];
				else {
					for (const block of readBlocks([element], reader)) {
						const markers = bookmarks.map((marker) => ({
							type: "marker",
							name: marker
						}));
						const marked = block.type === "paragraph" && markers.length > 0;
						blocks.push({
							block: marked ? _objectSpread2(_objectSpread2({}, block), {}, { items: [...markers, ...block.items] }) : block,
							section: sections.length
						});
						bookmarks = marked ? [] : bookmarks;
					}
					const sectionProperties = name === "w:p" ? find(childrenOf(find(contentOf(element).filter(isObject), "w:pPr")), "w:sectPr") : void 0;
					if (sectionProperties !== void 0) addSection(sectionProperties);
				}
			}
		};
		read(Object.values(body)[0]);
		if (sections.length === 0 || blocks.some(({ section }) => section >= sections.length)) addSection(void 0);
		return _objectSpread2({
			blocks,
			sections
		}, readSettings(context));
	};
	//#endregion
	//#region src/layout/estimate-page-numbers.ts
	var PASSES = 3;
	var sameNumbers = (one, other) => one.size === other.size && [...one].every(([name, page]) => other.get(name) === page);
	/**
	* Works out the page each bookmark of a document starts on, by laying out its pages as Word does, so the page numbers
	* of its tables of contents and page references are written with it. Give it to a document as its `pageNumbers`:
	*
	* ```ts
	* new Document({ pageNumbers: estimatePageNumbers, sections: [...] });
	* ```
	*
	* The pages are laid out with the widths and heights of the fonts Word documents use most, such as Calibri, Cambria,
	* Arial and Times New Roman. It follows paragraphs' spacing, indents, line spacing, tab stops and keep settings, widow
	* and orphan control, lists, pictures in the line, tables, page and section breaks, and each section's page size,
	* margins, headers, footers and page numbering.
	*
	* It stops at the first thing it can't lay out yet: a drawing that text flows around, a text box or frame, an equation,
	* a footnote, columns, or a table row taller than a page. The page references to bookmarks after it are left blank, for
	* Word to fill in when it updates the fields.
	*
	* @publicApi
	*/
	var estimatePageNumbers = (body, context) => {
		if (!context.file) return { bookmarks: /* @__PURE__ */ new Map() };
		const content = readDocument(body, context);
		const layOut = (pages, pass) => {
			const { bookmarks } = paginate(content, { pageNumbers: pages });
			return pass >= PASSES || sameNumbers(bookmarks, pages) ? bookmarks : layOut(bookmarks, pass + 1);
		};
		return { bookmarks: layOut(/* @__PURE__ */ new Map(), 1) };
	};
	//#endregion
	exports.estimatePageNumbers = estimatePageNumbers;
	return exports;
})({});
