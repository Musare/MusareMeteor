#Musare is now being developed by [CosmsosNode](https://cosmosnode.com)

##Visit the official website!

### https://musare.com/

You can also find us on:
* Twitter: https://twitter.com/musareapp
* Facebook: https://www.facebook.com/MusareMusic

##Get started with development!

First download Meteor: https://www.meteor.com/
Then download Git (CLI): https://git-scm.com/

Get your favourite code-editor out and follow the following steps to start contributing:
1. Star the repository!
2. Fork the repository to your account
3. Clone your forked repo to your local machine using ```git clone https://github.com/[YourUserName]/Musare.git```

Navigate to "../app" and run ```meteor```. This will run a local instance of Musare on ```localhost:3000```.

There you go, you're set to start coding!

##Does the site not load?

Try these methods first before reporting an issue:

1. Refresh page or restart browser
2. Turn off all extensions
3. Clear cookies and cache
4. Update browser or try another (Chrome, Firefox)
5. Flush browser DNS/Sockets and IP DNS
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

This did not fix your issue? or you're still not satisfied? Just create a issue ticket at:
https://github.com/AkiraLaine/musare/issues
Be sure to be as detailed as possible!
