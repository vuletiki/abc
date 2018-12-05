var colors = require("colors");

colors.setTheme({
	hight: "cyan",
	low: "yellow"
});
console.log("tiki vô địch...🚀🚀🚀".hight);

const lighthouse = require("lighthouse");
const chromeLauncher = require("chrome-launcher");
var Table = require("cli-table");

function launchChromeAndRunLighthouse(url, opts, config = null) {
	return chromeLauncher
		.launch({ chromeFlags: opts.chromeFlags })
		.then(chrome => {
			opts.port = chrome.port;
			return lighthouse(url, opts, config).then(results => {
				return chrome.kill().then(() => results.lhr);
			});
		});
}

const opts = {
	// chromeFlags: ["--show-paint-rects"]
	outputPath: './report.html',
};
var datasMap = {};
function renderTable(datas) {
	const setupHead = result => {
		// Use result!
		// console.log(Object.keys(result.categories));
		let head = ["Site"];
		let colWidths = [30];
		Object.keys(result.categories).map(key => {
			head.push(result.categories[key].title);
			colWidths.push(result.categories[key].title.length * 1);
		});
		head.push("Summary");
		colWidths.push(15);
		// instantiate
		return new Table({
			head,
			colWidths
		});
	};
	const addRecord = (result, site) => {
		let rec = [site];
		let total = 0;
		Object.keys(result.categories).map(key => {
			let value = String(result.categories[key].score);
			total += result.categories[key].score;
			rec.push(value);
		});
		rec.push(
			Math.round((total / Object.keys(result.categories).length) * 100)
		);
		return rec;
	};

	let table = setupHead(datas[0]);
	tempTable = [];
	datas.map((rec, index) => {
		tempTable.push(addRecord(rec, sites[index]));
	});
	var maxVals = {};
	var minVals = {};
	for (var i = 0; i < tempTable.length; i++) {
		for (var j = 1; j < tempTable[i].length; j++) {
			if (typeof maxVals[String(j)] === "undefined") {
				maxVals[String(j)] = tempTable[i][j];
			} else {
				if (tempTable[i][j] >= maxVals[String(j)]) {
					maxVals[String(j)] = tempTable[i][j];
				}
			}
			if (typeof minVals[String(j)] === "undefined") {
				minVals[String(j)] = tempTable[i][j];
			} else {
				if (tempTable[i][j] <= minVals[String(j)]) {
					minVals[String(j)] = tempTable[i][j];
				}
			}
		}
	}
	tempTable.map(rec => {
		for (var i = 1; i < rec.length; i++) {
			if (rec[i] == maxVals[i]) {
				rec[i] = String(rec[i]).hight;
			}
			if (rec[i] == minVals[i]) {
				rec[i] = String(rec[i]).low;
			}
		}
		table.push(rec);
	});
	console.log(table.toString());
}

const sites = [
	"https://tiki.vn/mua-sale-huyen-thoai",
	// "https://www.thegioididong.com/",
	// "https://www.lazada.com/",
	// "https://shopee.vn/"
];
let prs = sites.map(site => {
	return launchChromeAndRunLighthouse(site, opts);
});
Promise.all(prs).then(renderTable);