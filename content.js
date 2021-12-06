console.log('My extension started');

setTimeout(function () {
	location.reload();
}, 60000);

function wait(ms) {
	var start = new Date().getTime();
	var end = start;
	while (end < start + ms) {
		end = new Date().getTime();
	}
}

function miniGrep(string, patternToSearch) {
	var regexPatternToSearch = new RegExp(
		'^.*(' + patternToSearch + ').*$',
		'mg'
	);
	match = string.match(regexPatternToSearch);
	return match;
}

function loadHTMLSource(
	urlSource = 'https://www.gate.io/myaccount/myfunds/spot'
) {
	xhttp = new XMLHttpRequest();
	xhttp.open('GET', urlSource, false);
	xhttp.send();
	return xhttp.response;
}

function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim(); // Never return a text node of whitespace as the result
	template.innerHTML = html;
	return template;
}

try {
	let spotPage = loadHTMLSource();
	moneyline = miniGrep(spotPage, 'my_funds_sum_fiat');
	money = parseFloat(moneyline[0].split("'")[1]);
} catch (err) {
	console.log('Spot Account error: ', err.message);
	money = 0;
}
try {
	let dolarkuru = loadHTMLSource(
		'https://www.bloomberg.com/quote/USDTRY:CUR'
	);
	var dolarline = dolarkuru.substring(
		dolarkuru.indexOf('<span class="priceText__06f600fa3e">') + 1,
		dolarkuru.lastIndexOf('</span>')
	);
	// console.log("Bug: ", dolarline)
	dolar = parseFloat(dolarline.split('>')[1].split('<')[0]);
} catch (err) {
	console.log('Dolar error: ', err.message);
	dolar = 0;
}

let rows = document.getElementsByClassName('amm-funds-table-row');

let totalFunds = parseFloat(
	document
		.getElementsByClassName('valuation-total funds-account')[4]
		.getElementsByClassName('valuation-detail font-600')[0]
		.getElementsByClassName('hidden-funds-num')[0]
		.textContent.replace(',', '')
);

let income = parseFloat(
	document
		.getElementsByClassName('com-color3 font-dinmd fw500 amm-value')[0]
		.textContent.replace(' USDT', '')
);

let temp_income = parseFloat(
	document.getElementById('my_rewards_total').textContent.replace(' USDT', '')
);

var currentLeftoverMoney = temp_income + money;

var scrap = 0;
var scrapcount = 0;
var pairs_value = new Map();
var pairs_income = new Map();
var underincome = new Map();
var overincome = new Map();
var undervalue = new Map();
var overvalue = new Map();
for (elt of rows) {
	value = parseFloat(
		elt
			.getElementsByClassName('item')[1]
			.getElementsByClassName('my-amm-funds-value com-color3')[0]
			.textContent.replace(' USDT', '')
	);
	pairs_value.set(
		elt.getElementsByClassName(
			'item amm-funds-pairname flex jc-start al-center font-dinmd fw500 coinicon-col'
		)[0].textContent,
		value
	);
	if (value > 105) {
		scrap = scrap + value - 100;
		scrapcount += 1;
	}
	pairs_income.set(
		elt.getElementsByClassName(
			'item amm-funds-pairname flex jc-start al-center font-dinmd fw500 coinicon-col'
		)[0].textContent,
		parseFloat(
			elt
				.getElementsByClassName('item')[3]
				.getElementsByClassName('my-amm-funds-value com-color3')[0]
				.textContent.replace(' USDT', '')
		)
	);
}

sorted_value = new Map([...pairs_value.entries()].sort((a, b) => b[1] - a[1]));

sorted_income = new Map(
	[...pairs_income.entries()].sort((a, b) => b[1] - a[1])
);

let averageincome = temp_income / pairs_income.size;
let averagevalue = totalFunds / pairs_value.size;

for ([key, value] of sorted_income.entries()) {
	if (value > averageincome) {
		overincome.set(key, value);
	} else {
		underincome.set(key, value);
	}
}

let fixable_pairs = new Map();
let closest_fixable_pair = { key: 'No Pair found', value: 'No pair found' };
let closest_value = 100;
for ([key, value] of sorted_value.entries()) {
	if (value > averagevalue) {
		overvalue.set(key, value);
	} else {
		undervalue.set(key, value);
	}
	if (value < 100 && 100 - value < currentLeftoverMoney) {
		fixable_pairs.set(key, value);
		if (Math.abs(100 - value - currentLeftoverMoney) < closest_value) {
			closest_fixable_pair = { key: key, value: value };
			closest_value = Math.abs(100 - value - currentLeftoverMoney);
		}
	}
}

sorted_undervalue = new Map(
	[...undervalue.entries()].sort((a, b) => a[1] - b[1])
);
sorted_underincome = new Map(
	[...underincome.entries()].sort((a, b) => a[1] - b[1])
);

largest_fixable_pair = sorted_undervalue.entries().next().value;

var a = new Date(2021, 10, 18, 9, 16);
var b = new Date();
var second_diff = (b - a) / 1000;
var income_per_second = income / second_diff;
var timeToGoalsecond =
	(100 - largest_fixable_pair[1] - currentLeftoverMoney) / income_per_second;

console.log('Dolar: ', dolar);
console.log(
	'Total Money: ',
	money + totalFunds + temp_income,
	' (',
	dolar * (money + totalFunds + temp_income),
	' ₺)'
);
console.log('Money in Spot: ', money);
console.log('Total Value of Assets:', totalFunds);
console.log('Total Asset Number:', pairs_value.size);
console.log('Bots running for: ', ConvertSectoDay(second_diff));
console.log('Net Value Gain:', totalFunds - 100 * pairs_value.size);
console.log('Total Income: ', income, ' (', dolar * income, '₺)');
// console.log("Income: ", income, " (", dolar * (income), "₺)");
console.log('Temporary Income: ', temp_income);
console.log('Money To Invest: ', 100 - temp_income - money);
// time to invest notification
let val = 100 - temp_income - money;
if (val < 0) {
	var xhr = new XMLHttpRequest();
	const endpoint = 'https://kahramanlar.herokuapp.com/api/expenses/yosefu';
	xhr.open('POST', endpoint, true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.send(
		JSON.stringify({
			value: 100 - temp_income - money,
		})
	);
}

console.log(
	'Time To Invest: ',
	ConvertSectoDay((100 - temp_income - money) / income_per_second)
);
// console.log("Usable Money: ", scrap + money + temp_income);
// console.log("Scrapable Pairs: ", scrapcount);
// console.log("Scrap Money: ", scrap);
// console.log("$ To New Member: ", currentLeftoverMoney + scrap - 100);
// console.log(
//   "Time To New Member with scrapping: ",
//   ConvertSectoDay((100 - currentLeftoverMoney - scrap) / income_per_second)
// );
// console.log(
//   "Time To New Member without scrapping: ",
//   ConvertSectoDay((100 - currentLeftoverMoney) / income_per_second)
// );
// console.log(
//   "Closest fixable pair: ",
//   closest_fixable_pair,
//   " Leftover: ",
//   closest_fixable_pair.value + currentLeftoverMoney - 100
// );
// console.log(
//   "Largest fixable pair: ",
//   largest_fixable_pair,
//   " Time to goal: ",
//   ConvertSectoDay(timeToGoalsecond)
// );
console.log(
	'Dollaz/s: ',
	income_per_second,
	' (',
	dolar * income_per_second,
	' ₺)'
);
console.log(
	'Dollaz/m: ',
	60 * income_per_second,
	' (',
	dolar * (60 * income_per_second),
	' ₺)'
);
console.log(
	'Dollaz/h: ',
	60 * 60 * income_per_second,
	' (',
	dolar * (60 * 60 * income_per_second),
	' ₺)'
);
console.log(
	'Dollaz/d: ',
	24 * 60 * 60 * income_per_second,
	' (',
	dolar * (24 * 60 * 60 * income_per_second),
	' ₺)'
);
console.log(
	'Dollaz/w: ',
	7 * 24 * 60 * 60 * income_per_second,
	' (',
	dolar * (7 * 24 * 60 * 60 * income_per_second),
	' ₺)'
);
console.log(
	'Dollaz/M: ',
	30 * 24 * 60 * 60 * income_per_second,
	' (',
	dolar * (30 * 24 * 60 * 60 * income_per_second),
	' ₺)'
);
console.log(
	'Dollaz/Y: ',
	365 * 24 * 60 * 60 * income_per_second,
	' (',
	dolar * (365 * 24 * 60 * 60 * income_per_second),
	' ₺)'
);

console.log('Average Value of Assets:', averagevalue);
console.log('TOP Pairs by Share Value:', sorted_value);
console.log('Overvalued Pairs:', overvalue);
console.log('Undervalued Pairs:', sorted_undervalue);
console.log('Average Income of Assets:', averageincome);
console.log('TOP Pairs by Income:', sorted_income);
console.log('Overperforming Pairs:', overincome);
console.log('Underperforming Pairs:', sorted_underincome);

function ConvertSectoDay(n) {
	if (n < 0) return " You're already there!";
	var day = parseInt(n / (24 * 3600));

	n = n % (24 * 3600);
	var hour = parseInt(n / 3600);

	n %= 3600;
	var minutes = n / 60;

	n %= 60;
	var seconds = n;

	return (
		day +
		' ' +
		'days ' +
		hour +
		' ' +
		'hours ' +
		minutes.toFixed() +
		' ' +
		'minutes ' +
		seconds.toFixed() +
		' ' +
		'seconds '
	);
}
