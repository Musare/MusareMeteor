##Visit the official website!

[![Join the chat at https://gitter.im/AkiraLaine/musare](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/AkiraLaine/musare?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

### http://musare.com/

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

##Get started with development!

First download Meteor: https://www.meteor.com/

Then download Git (CLI): https://git-scm.com/

Once that is done:
 1. Star the repository!
 2. Fork the repository
 3. Clone your forked repo to your local machine

Navigate to "../app" and run "meteor". Go to localhost:3000 and you're set!