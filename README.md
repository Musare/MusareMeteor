##Visit the official website!

### ** http://musare.com/ **

##Found a bug?

Try these methods frist before reporting a issue:

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

Once that is done, get the repository on your local machine and open your command line.

Navigate to "../app" and run "meteor". Go to localhost:3000 and you're set!

##How to use Git!

(This will only work if you are a contributor)

Run the following commands if you are doing this for the first time.
`git remote add origin https://github.com/AkiraLaine/music-app.git`

After you executing the command above, you will have to do these command each time you start developing.

`git pull origin master` to get the latest code.

`git add FILES` to add all the files you have changed.

`git commit -m "MESSAGE"` to commit the changes you have made.

`git push origin master` to push your updated code to GitHub. Note: it is recommended to first run `git pull origin master` before you do this command to make sure you have the latest co
