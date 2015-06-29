// ==UserScript==
// @name			Steam Trading Cards Bulk Buyer
// @namespace		http://www.doctormckay.com/
// @version			3.3.2
// @description		Provides a button to purchase remaining cards needed for a badge in bulk
// @match			*://steamcommunity.com/*/gamecards/*
// @require			https://ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js
// @copyright		2013 - 2015 Dr. McKay
// @grant			none
// ==/UserScript==

$.ajaxSetup({
	xhrFields: {
		withCredentials: true
	}
});

var links = $('.gamecards_inventorylink');

// Current currency (numerical identifier used by Steam)
var g_Currency = 1;
// Detailed information for each currency ID (using information taken from Steam's Javascript source code)
var g_CurrencyInfo =
{
    1: { symbol: "$", separator: "." },
    2: { symbol: "£", separator: "." },
    3: { symbol: "€", separator: "," },
    5: { symbol: "RUB", separator: "," }, // No unicode support for the new symbol yet
    7: { symbol: "R$", separator: "," }
}
// Function to format the string using the currency information
function formatPrice(price, full)
{
    if(full)
	{
		return g_CurrencyInfo[g_Currency].symbol + price.replace(".", g_CurrencyInfo[g_Currency].separator);
	}
	return price.replace(".", g_CurrencyInfo[g_Currency].separator);
}

// Check if we need to craft a badge
$(document).ready(function() {
	if(parseInt(localStorage.autoCraftBadge, 10)) {
		delete localStorage.autoCraftBadge;
		$('.badge_craft_button').click();
	}
});

if(links && $('.badge_card_to_collect').length > 0) {
	links.append('<button type="button" class="btn_grey_grey btn_small_thin" id="buycards"><span>Buy remaining cards from Market</span></button');
	$('#buycards').click(function() {
		$('#buycards').hide();
		$('.gamecards_inventorylink').append('<div id="buycardspanel" style="visibility: hidden; margin-top: 5px"></div>');
		
		updatePrices();
		
		$('#buycardspanel').css('display', 'none').css('visibility', 'visible').show('blind'); // We have to do this visibility/display thing in order for offsetWidth to work
	});
}

var g_SessionID;

function updatePrices() {
	$('#buycardspanel').html('');
	
	Array.prototype.slice.call($('.badge_card_to_collect')).forEach(function(card) {
		card = $(card);
		var name = card.find('.badge_card_set_text')[0].textContent;
		var row = $('<div class="cardrow"><span class="cardname" style="padding-right: 10px; text-align: right; display: inline-block; font-weight: bold">' + name + '</span><span class="cardprice" data-name="' + name.replace(/"/g, '&quot;') + '">Loading...</span></div>');
		$('#buycardspanel').append(row);
		
		$.get(card.find('.btn_grey_grey.btn_medium[href*=market]')[0].href, function(html) {
			if(html.match(/There are no listings for this item\./)) {
				row.find('.cardprice').text('Error');
				return;
			}
			
			var marketID = html.match(/Market_LoadOrderSpread\(\s*(\d+)\s*\);/);
			var sessionID = html.match(/g_sessionID = "(.+)";/);
			var countryCode = html.match(/g_strCountryCode = "([a-zA-Z0-9]+)";/);
			var currency = html.match(/"wallet_currency":(\d)/);
			var hashName = html.match(/"market_hash_name":"([^"]+)"/);
			
			if(!marketID || !sessionID || !countryCode || !currency || !hashName) {
				row.find('.cardprice').text('Error');
				return;
			}
			
			g_Currency = currency[1];
			g_SessionID = sessionID[1];
			
			$.get('/market/itemordershistogram', {"country": countryCode[1], language: 'english', "currency": g_Currency, "item_nameid": marketID[1]}, function(json) {
				if(!json.success) {
					row.find('.cardprice').text('Error');
					return;
				}
				
				row.data('hashname', hashName[1]);
				row.data('price', json.lowest_sell_order);
				
				row.find('.cardprice').text(formatPrice((parseInt(json.lowest_sell_order, 10) / 100).toFixed(2), true));
				
				row.addClass('ready');
				
				if($('.cardrow:not(.ready)').length === 0) {
					var total = 0;
					var cards = $('.cardrow');
					for(var i = 0; i < cards.length; i++) {
						total += parseInt($(cards[i]).data('price'), 10) / 100;
					}
					
					$('#buycardspanel').append('<br /><span style="font-weight: bold; display: inline-block; width: ' + $('.cardname').css('width') + '; padding-right: 10px; text-align: right">Total</span><b>' + g_CurrencyInfo[g_Currency].symbol + '<span id="totalprice">' + formatPrice(total.toFixed(2)) + '</span></b><br /><br /><button type="button" id="buycardsbutton" class="btn_green_white_innerfade btn_medium_wide" style="padding: 10px 20px; margin-left: ' + ($('.cardname').css('width').replace('px', '') / 2) + 'px">PLACE ORDERS</button>');
					$('#buycardspanel').append('<br /><br /><label><input type="checkbox" id="auto-reload-and-craft" /> Automatically reload page and craft badge</label>');
					$('#buycardsbutton').click(function() {
						$('#buycardsbutton').hide();
						placeBuyOrder();
					});
					
					if(parseInt(localStorage.autoReloadAndCraftBadge, 10)) {
						$('#auto-reload-and-craft').prop('checked', true);
					}
					
					$('#auto-reload-and-craft').change(function() {
						localStorage.autoReloadAndCraftBadge = $('#auto-reload-and-craft').prop('checked') ? 1 : 0;
					});
				}
			});
		}).fail(function() {
			row.find('.cardprice').text('Error');
		});
	});
	
	var elements = $('.cardname');
	var largestWidth = 0;
	for(var i = 1; i < elements.length; i++) {
		if(elements[i].offsetWidth > elements[largestWidth].offsetWidth) {
			largestWidth = i;
		}
	}
	
	$('.cardname').css('width', elements[largestWidth].offsetWidth + 'px');
}

function placeBuyOrder() {
	var card = $('.cardrow:not(.buying)')[0];
	if(!card) {
		return;
	}
	
	card = $(card);
	card.find('.cardprice')[0].innerHTML += ' - Placing buy order...';
	card.addClass('buying');
	
	$.post('https://steamcommunity.com/market/createbuyorder/', {"sessionid": g_SessionID, "currency": g_Currency, "appid": 753, "market_hash_name": card.data('hashname'), "price_total": card.data('price'), "quantity": 1}, function(json) {
		setTimeout(placeBuyOrder, 500);
		
		if(json.success !== 1) {
			card.find('.cardprice').text(json.message);
			decrementTotal(card.data('price') / 100);
			return;
		}
		
		card.data('orderid', json.buy_orderid);
		card.data('checks', 0);
		
		card.find('.cardprice').text(card.find('.cardprice').text().replace('Placing buy order', 'Waiting'));
		checkOrderStatus(card);
	});
}

function checkOrderStatus(card) {
	card.find('.cardprice')[0].innerHTML += '.';
	
	$.get('/market/getbuyorderstatus/', {"sessionid": g_SessionID, "buy_orderid": card.data('orderid')}, function(json) {
		if(json.success !== 1) {
			setTimeout(function() {
				checkOrderStatus(card);
			}, 500);
			return;
		}
		
		if(json.purchases.length) {
			if(json.purchases[0].price_total < card.data('price')) {
				decrementTotal((card.data('price') - json.purchases[0].price_total) / 100);
			}
			
			card.find('.cardprice').text(formatPrice((json.purchases[0].price_total / 100).toFixed(2), true) + ' - Purchased');
			checkAllPurchasesMade();
			return;
		}
		
		if(!json.purchases.length) {
			card.data('checks', card.data('checks') + 1);
			if(card.data('checks') >= 10) {
				cancelBuyOrder(card.data('orderid'));
				card.find('.cardprice').text('Order unfulfilled');
				decrementTotal(card.data('price') / 100);
				return;
			}
		}
		
		setTimeout(function() {
			checkOrderStatus(card);
		}, 500);
	});
}

function cancelBuyOrder(orderid) {
	$.post('/market/cancelbuyorder/', {"sessionid": g_SessionID, "buy_orderid": orderid}, function(json) {
		if(!json.success) {
			setTimeout(function() {
				cancelBuyOrder(orderid);
			}, 500);
		}
	});
}

function decrementTotal(total) {
	// Replace any commas to dots so we get a valid double
	$('#totalprice').text(formatPrice(($('#totalprice').text().replace(",", ".") - total).toFixed(2)));
}

function checkAllPurchasesMade() {
	var elements = $('.cardprice');
	for(var i = 0; i < elements.length; i++) {
		if(elements[i].textContent.indexOf('Purchased') == -1) {
			return;
		}
	}
	
	// All cards bought
	if(parseInt(localStorage.autoReloadAndCraftBadge, 10)) {
		localStorage.autoCraftBadge = 1;
		window.location.reload();
	}
}