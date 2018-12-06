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
			
		});
}

var app = express()

app.use(express.static('public'))
// const BASE_URL = 'https://tikilighthouse.herokuapp.com/'
const BASE_URL = 'http://localhost:8080/'
app.get('/', async function (req, res) {
	res.send(`
		<h2>Lighthouse report tool</h2>
		<hr/>
		<code>/lookup?url={link}</code>: Generate report to url
		<hr/>
		<em>Thankyou</em>
		`)
	}
)

app.get('/lookup', async function (req, res) {
	const target = req.query.url
	if(!target) {
		return res.send('Url not found')
	}
	const opts = {
		outputPath: './report.html'
	};
	var file = (new Date()).getTime() + Math.random()
	var htmlFile = file + ".html";
	var pngFile = file + ".png";
	launchChromeAndRunLighthouse(target, opts)
	.then(data => {
		
		const html = ReportGenerator.generateReportHtml(data);
		fs.writeFile("public/" + htmlFile, html, async function(err) {
			
			const browser = await puppeteer.launch({
				defaultViewport: {
					width: 1390,
					height: 486
				},
				args: ['--no-sandbox', '--disable-setuid-sandbox']
			});
			const page = await browser.newPage();
			await page.goto(BASE_URL + htmlFile);
			await page.screenshot({
				path:'./public/' + pngFile,
				clip: {x: 270, y: 126, width: 840, height: 175}
			});

			fetch('https://hooks.slack.com/services/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', {
			    method: 'post',
			    body: JSON.stringify({
				    "attachments": [
				        {
				            "title": "lighthouse Report - Click to view detail",
				            "title_link": 'https://tikilighthouse.herokuapp.com/' + htmlFile,
				            "text": `Page: ${target}`,
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
		htmlFile: BASE_URL + htmlFile,
		pngFile: BASE_URL + pngFile
	})
	// .then(renderTable);

})
app.listen(process.env.PORT || 8080);