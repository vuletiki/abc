const fetch = require('node-fetch');
var express = require('express')
var fs = require('fs')
var ReportGenerator = require('./node_modules/lighthouse/lighthouse-core/report/report-generator');
var app = express()
var take = require("node-server-screenshot");
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

app.get('/take', function (req, res) {
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
			});
	}

	const opts = {
		// chromeFlags: ["--show-paint-rects"]
		outputPath: './report.html'
	};
	launchChromeAndRunLighthouse(req.query.url, opts)
	.then(data => {
		var file = (new Date()).getTime() + Math.random()
		var htmlFile = file + ".html";
		var pngFile = file + ".png";
		const html = ReportGenerator.generateReportHtml(data);
		fs.writeFile("public/" + htmlFile, html, function(err) {
			take.fromURL('https://tikilighthouse.herokuapp.com/' + htmlFile, './public/' + pngFile, {clip: {x: 228, y: 134, width: 1046 - 228, height: 286 - 134},waitMilliseconds: 5000}, function(){
				//an image of google.com has been saved at ./test.png
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
			});
		});
	})
	res.send('ok')
	// .then(renderTable);

})
app.listen(process.env.PORT || 8080); //the server object listens on port 8080