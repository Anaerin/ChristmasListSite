# List Site? What the heck's that?
## Overview
Ever had friends/family/loved ones pester you over what to get you for your birthday? Love sending gifts, but don't want to spoil the surprise? Isn't it hard to co-ordinate your gift giving among your friend/family group? Is it hard co-ordinating without involving the person you're buying for?

Boy, do I have a solution for you!

This node.js app lets you create a wishlist and send it to friends and family when they ask. They can then see what you'd like, and claim something to get for you, also noting when it's been purchased and shipped out so other people know not to get that one.

And you can't see any of that.

The items on your list are editable for a week (by default, customizable), after which point they're locked. They're also immediately locked if someone claims them, though you can't see that.

By default, registration is open (though that is also customizable), and individual lists can also be optionally password protected. Individual items have a name and description, and can optionally have a URL and price attached.

## Requirements
* A webserver or docker container running node.js
* A domain or subdomain (with wildcard), probably behind a reverse proxy like nginx or haproxy

And that's it.

## Setup
* Check out the repo
* Start the app once (will automatically install requirements if you use `npm start`)
* Close the app with CTRL-C and edit the newly created `config.json` to your liking. It will have generated keys for the password salt and session key automatically.
* Point your wildcard subdomain at the site

And you're done.

## Usage as a wishlister
* Visit the site (or any subdomain of that site). 
* It'll prompt you to login or register. NOTE: There is no password recovery, so make sure you remember it!
* Once registered, you'll be logged in and see your account. To set up your own list, click the "claim" link at the bottom.
* You can then set up your list, giving it a name and a subdomain and setting an optional view password.
* Add items as you go.

## Usage as a gifter
* Visit the site (or any subdomain of that site).
* It'll prompt you to login or register if you haven't already.
* If you didn't visit through a subdomain, it'll show you a list of wishlists on the site.
* When you pick one, it'll take you to it (prompting you for the password, if necessary), and you can see what's been wished for.
  (If you pick your own list, you're taken to the administration page for that list.)
* If any items are open to be claimed, you can click the "claim" link to claim it.

