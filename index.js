const fetch = require('node-fetch');
const puppeteer = require('puppeteer');
var express = require('express')
var fs = require('fs')
var ReportGenerator = require('./node_modules/lighthouse/lighthouse-core/report/report-generator');
var app = express()
// fetch('https://hooks.slack.com/services/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', {
//     method: 'post',
//     body: JSON.stringify({
//     "attachments": [
//         {
//             "fallback": "Required plain-text summary of the attachment.",
//             "color": "#2eb886",
//             "pretext": "Page content has been change",
//             "title": "tiki.vn",
//             "title_link": "https://tiki.vn"
//         }
//     ]
// }),
//     headers: { 'Content-Type': 'application/json' },
// })

app.use(express.static('public'))
app.get('/sc', (req, res) => {
	screenshoot('https://tikilighthouse.herokuapp.com/1544063777970.572.html', '1544063777970.572')
})
app.get('/take', function (req, res) {
	const lighthouse = require("lighthouse");
	const chromeLauncher = require("chrome-launcher");

	var file = (new Date()).getTime() + Math.random()
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

	const opts = {
		// chromeFlags: ["--show-paint-rects"]
		outputPath: './report.html'
	};
	launchChromeAndRunLighthouse(req.query.url, opts)
	.then(data => {
		var htmlFile = file + ".html";
		var pngFile = file + ".png";
		console.log(htmlFile)
		const html = ReportGenerator.generateReportHtml(data);
		fs.writeFile("public/" + htmlFile, html, async function(err) {
			console.log('save ok')
			const browser = await puppeteer.launch();
			const page = await browser.newPage();
			await page.goto('https://tikilighthouse.herokuapp.com/' + htmlFile);
			await page.screenshot({
				// fullPage: true,
				path:'./public/' + pngFile,
				clip: {x: 228, y: 134, width: 1046 - 228, height: 286 - 134}
			});
			fetch('https://hooks.slack.com/services/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', {
			    method: 'post',
			    body: JSON.stringify({
				    "attachments": [
				        {
				            "fallback": "Network traffic (kb/s): How does this look? @slack-ops - Sent by Julie Dodd - https://datadog.com/path/to/event",
				            "title": "Network traffic (kb/s)",
				            "title_link": "https://datadog.com/path/to/event",
				            "text": "How does this look? @slack-ops - Sent by Julie Dodd",
				            "image_url": "https://tikilighthouse.herokuapp.com/" + pngFile,
				            "color": "#764FA5"
				        }
				    ]
				}),
			    headers: { 'Content-Type': 'application/json' },
			})
			await browser.close();
			// take.fromURL('https://tikilighthouse.herokuapp.com/' + htmlFile, './public/' + pngFile, {clip: {x: 228, y: 134, width: 1046 - 228, height: 286 - 134},waitMilliseconds: 5000}, function(a, b){
			// 	console.log(a, b)
			// 	//an image of google.com has been saved at ./test.png
			// });
		});
	})
	res.send(String(file))
	// .then(renderTable);

})
app.listen(process.env.PORT || 8080); //the server object listens on port 8080