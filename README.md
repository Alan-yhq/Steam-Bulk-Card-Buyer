# Steam Bulk Card Buyer

This user script adds a button to your Steam badge pages allowing you to buy all the cards you need to finish a badge from the Steam Market at once.

If you are running Firefox, you will need to install [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/). If you're using Chrome, you will need to install [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en). **This will not work as a Chrome extension (including dragging the .user.js file into the Extensions page).**

Licensed under GPLv3.

### NOTE: This Fork serves as a temporary download for the updated version of the script
[Click to install script](https://bitbucket.org/VenatusSimpleX/steam-trading-card-bulk-buyer/raw/367c3ebce4d1e9a58bf29255016a6b847760b065/badgebuy.user.js)

[Click here for the ORIGINAL version of this script (Not yet updated)](https://bitbucket.org/Doctor_McKay/steam-trading-card-bulk-buyer)

## FAQ

- **Q: Why does a purchase show "Failure"?**
- **A:** If a purchase fails, someone else probably bought the card before you were able to, or you don't have enough funds in your Steam Wallet.

## Major Changes in 3.0.0

- Now a platform-independent user script instead of a Chrome extension
- More verbose failure messages

## Major Changes in 2.0.0

- Now out of beta!
- Added support for foils
- Now won't show only some cards if you click the button while Enhanced Steam is loading links
- Doesn't choke on special characters in card names anymore
- Doesn't give up after a single failure anymore
- Better, less confusing layout
- Total decreases for each failed purchase, showing the amount you actually paid
- Added reload failures button to retry when a purchase fails
- Added reload page button when all purchases are complete