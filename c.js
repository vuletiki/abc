const BASE_URL = 'https://tikilighthouse.herokuapp.com'
const puppeteer = require('puppeteer');
var express = require('express')
function getByClass(className) {
	return `document.getElementsByClassName("${className}")[0].innerText`
}
var app = express()
app.get('/res', async function (req, res) {
	console.log(req.query.data)
	res.send('ok')
})


app.get('/cr', async function (req, res) {
	const browser = await puppeteer.launch({
		defaultViewport: {
			width: 1390,
			height: 486
		},
		// args: ['--no-sandbox', '--disable-setuid-sandbox']
	})
	const listLink = req.query.url
	let pageList = await browser.newPage();
	let pageDetail = await browser.newPage();
	await pageList.setCacheEnabled(true)
	await pageDetail.setCacheEnabled(true)
	await pageList.setUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')
	await pageDetail.setUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')
	
	await pageList.goto(listLink);
	const totalPc = await pageList.evaluate(`document.body.querySelectorAll('*[data-tracking="product-card"]').length`);
	for(var i = 0; i < 2; i++) {
		const pLink = await pageList.evaluate(`document.body.querySelectorAll('*[data-tracking="product-card"]')[${i}].getElementsByTagName('a')[0].href`);
		console.log('--')
		console.log('get link:' + pLink)
		await pageDetail.goto(pLink);
	 	await pageDetail.evaluate(`document.createElement('img').src='${BASE_URL}/res?data[url]=' + window.location.href + '&data[price]=' + ${getByClass('pdp-price')} + '&data[title]=' + ${getByClass('pdp-product-title')}`);
		console.log('--')
	}
	// const pcq = `document.body.querySelectorAll('*[data-tracking="product-card"')[0].getElementsByTagName('a')[0].href`
	
	res.send('ok')
})

app.listen(process.env.PORT || 8080);







