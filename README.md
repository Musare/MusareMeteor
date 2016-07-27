# [Musare](http://musare.com)
> A modern, open-source, collaborative music app

You can also find us on:
* Twitter: https://twitter.com/musareapp

## Contributing

#### Prerequisites

- [Meteor](https://www.meteor.com/)
- [Git (CLI)](https://git-scm.com/)

#### Getting Started

1. Fork the repository to your account.
2. Clone your forked repo to your local machine using
```git clone https://github.com/<username>/Musare.git```.
3. Navigate to the `app` directory using `cd app`.
4. Run `meteor` which will start a local instance of Musare on ```localhost:3000```.

## Does the site not load?

#### Try these methods first before reporting an issue:

1. Refresh page or restart browser.
2. Turn off all extensions.
3. Clear cookies and cache.
4. Update browser or try another (Chrome, Firefox).
5. Flush browser DNS/Sockets and IP DNS.

<hr>
**Chrome**
```chrome://net-internals/#dns``` and ```chrome://net-internals/#sockets```
<hr>
**Firefox**
```about:config``` then change ```network.dnsCacheExpiration``` to ```0``` and back to ```60```
<hr>
**Windows 7, 8, 10**
```ipconfig /flushdns```
<hr>
**Linux (latest versions)**
```sudo /etc/init.d/nscd restart```
<hr>
**Mac OS X Yosemite**
```sudo discoveryutil mdnsflushcache```
<hr>

#### Still having issues?

Just create an issue ticket at:
https://github.com/musare/musare/issues and be sure to be as detailed as possible!

We are protected by [![CLA assistant](https://cla-assistant.io/readme/badge/Musare/Musare)](https://cla-assistant.io/Musare/Musare) so if you want to contribute, please accept these terms. If you do not, your pull request will be denied.
