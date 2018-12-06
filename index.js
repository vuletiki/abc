const fetch = require('node-fetch');
const puppeteer = require('puppeteer');
var express = require('express')
var fs = require('fs')
var ReportGenerator = require('./node_modules/lighthouse/lighthouse-core/report/report-generator');
const lighthouse = require("lighthouse");
const chromeLauncher = require("chrome-launcher");

function launchChromeAndRunLighthouse(url, opts, config = null) {
	return chromeLauncher
		.launch({ chromeFlags: opts.chromeFlags })
		.then(chrome => {
			opts.port = chrome.port;
			return lighthouse(url, opts, config).then(results => {
				return chrome.kill().then(() => results.lhr);
			});
		})
		.catch(err => {
			console.log(err)
		});
}

var app = express()

app.use(express.static('public'))

app.get('/lookup', async function (req, res) {
	const opts = {
		outputPath: './report.html'
	};
	var file = (new Date()).getTime() + Math.random()
	var htmlFile = file + ".html";
	var pngFile = file + ".png";
	launchChromeAndRunLighthouse(req.query.url, opts)
	.then(data => {
		console.log(htmlFile)
		const html = ReportGenerator.generateReportHtml(data);
		fs.writeFile("public/" + htmlFile, html, async function(err) {
			console.log('save ok')
			const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
			const page = await browser.newPage();
			await page.goto('https://tikilighthouse.herokuapp.com/' + htmlFile);
			await page.screenshot({
				path:'./public/' + pngFile,
				clip: {x: 0, y: 134, width: 800, height: 160}
			});
			fetch('https://hooks.slack.com/services/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', {
			    method: 'post',
			    body: JSON.stringify({
				    "attachments": [
				        {
				            "title": "lighthouse Report",
				            "title_link": 'https://tikilighthouse.herokuapp.com/' + htmlFile,
				            "text": `Page: ${req.query.url}`,
				            "image_url": "https://tikilighthouse.herokuapp.com/" + pngFile,
				            "color": "#764FA5"
				        }
				    ]
				}),
			    headers: { 'Content-Type': 'application/json' },
			})
			await browser.close();
		});
	})
	res.json({
		htmlFile,
		pngFile
	})
	// .then(renderTable);

})
app.listen(process.env.PORT || 8080);