Meteor.startup(function() {
    reCAPTCHA.config({
        privatekey: '6LcVxg0TAAAAAI2fgIEEWHFxwNXeVIs8mzq5cfRM'
    });
    Avatar.setOptions({
        fallbackType: "initials",
        defaultImageUrl: "http://static.boredpanda.com/blog/wp-content/uploads/2014/04/amazing-fox-photos-182.jpg",
        generateCSS: true,
        imageSizes: {
            'header': 40
        }
    });
    var stations = [{tag: "edm", display: "EDM"}, {tag: "pop", display: "Pop"}]; //Rooms to be set on server startup
    for(var i in stations){
        if(Rooms.find({type: stations[i]}).count() === 0){
            createRoom(stations[i].display, stations[i].tag, false);
        }
    }
    emojione.ascii = true;
});

Alerts.update({active: true}, {$set: {active: false}}, { multi: true });

var stations = [];
var voteNum = 0;

var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_";
function createUniqueSongId() {
    var code = "";
    for (var i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }

    if (Playlists.find({"songs.mid": code}).count() > 0) {
        return createUniqueSongId();
    } else {
        return code;
    }
}

function checkUsersPR() {
    var output = {};

    var connections = Meteor.server.stream_server.open_sockets;
    _.each(connections,function(connection){
        // named subscriptions
        if (connection._meteorSession !== undefined && connection._meteorSession !== null) {
            var subs = connection._meteorSession._namedSubs;
            //var ip = connection.remoteAddress;
            var used_subs = [];
            for (var sub in subs) {
                var mySubName = subs[sub]._name;

                if (subs[sub]._params.length > 0) {
                    mySubName += subs[sub]._params[0];  // assume one id parameter for now
                }

                if (used_subs.indexOf(mySubName) === -1) {
                    used_subs.push(mySubName);
                    if (!output[mySubName]) {
                        output[mySubName] = 1;
                    } else {
                        output[mySubName] += 1;
                    }
                }
            }
        }
        // there are also these 'universal subscriptions'
        //not sure what these are, i count none in my tests
        //var usubs = connection._meteorSession._universalSubs;
    });
    var emptyStations = [];
    stations.forEach(function(station) {
        emptyStations.push(station);
    });
    for (var key in output) {
        getStation(key, function(station) {
            emptyStations.splice(emptyStations.indexOf(station), 1);
            Rooms.update({type: key}, {$set: {users: output[key]}});
        });
    }
    emptyStations.forEach(function(emptyStation) {
        Rooms.update({type: emptyStation.type}, {$set: {users: 0}});
    });
    return output;
}

function getStation(type, cb) {
    stations.forEach(function(station) {
        if (station.type === type) {
            cb(station);
            return;
        }
    });
}

function createRoom(display, tag, private) {
    var type = tag;
    if (Rooms.find({type: type}).count() === 0 && private === false) {
        Rooms.insert({display: display, type: type, users: 0}, function(err) {
            if (err) {
                throw err;
            } else {
                if (Playlists.find({type: type}).count() === 1) {
                    stations.push(new Station(type));
                } else {
                    Playlists.insert({type: type, songs: getSongsByType(type)}, function (err2) {
                        if (err2) {
                            throw err2;
                        } else {
                            stations.push(new Station(type));
                        }
                    });
                }
            }
        });
    } else if (Rooms.find({type: type}).count() === 0 && private === true) {
        Rooms.insert({display: display, type: type, users: 0, private: true}, function(err) {
            if (err) {
                throw err;
            } else {
                if (Playlists.find({type: type}).count() === 1) {
                    stations.push(new Station(type));
                } else {
                    Playlists.insert({type: type, songs: getSongsByType(type)}, function (err2) {
                        if (err2) {
                            throw err2;
                        } else {
                            stations.push(new Station(type));
                        }
                    });
                }
            }
        });
    } else {
        return "Room already exists";
    }
}

function Station(type) {
    Meteor.publish(type, function() {
        return undefined;
    });
    var self = this;
    var startedAt = Date.now();
    var playlist = Playlists.findOne({type: type});
    var songs = playlist.songs;

    if (playlist.lastSong === undefined) {
        Playlists.update({type: type}, {$set: {lastSong: 0}});
        playlist = Playlists.findOne({type: type});
        songs = playlist.songs;
    }
    var currentSong = playlist.lastSong;
    if (currentSong < (songs.length - 1)) {
        currentSong++;
    } else currentSong = 0;
    var currentTitle = songs[currentSong].title;

    Rooms.update({type: type}, {$set: {currentSong: {song: songs[currentSong], started: startedAt}, users: 0}});

    this.skipSong = function() {
        self.voted = [];
        voteNum = 0;
        Rooms.update({type: type}, {$set: {votes: 0}});
        songs = Playlists.findOne({type: type}).songs;
        songs.forEach(function(song, index) {
            if (song.title === currentTitle) {
                currentSong = index;
            }
        });
        if (currentSong < (songs.length - 1)) {
            currentSong++;
        } else currentSong = 0;
        if (songs);
        if (currentSong === 0) {
            this.shufflePlaylist();
        } else {
            if (songs[currentSong].mid === undefined) {
                var newSong = songs[currentSong];
                newSong.mid = createUniqueSongId();
                songs[currentSong].mid = newSong.mid;
                Playlists.update({type: type, "songs": songs[currentSong]}, {$set: {"songs.$": newSong}});
            }
            currentTitle = songs[currentSong].title;
            Playlists.update({type: type}, {$set: {lastSong: currentSong}});
            Rooms.update({type: type}, {$set: {timePaused: 0}});
            this.songTimer();
            Rooms.update({type: type}, {$set: {currentSong: {song: songs[currentSong], started: startedAt}}});
        }
    };

    this.shufflePlaylist = function() {
        voteNum = 0;
        Rooms.update({type: type}, {$set: {votes: 0}});
        self.voted = [];
        songs = Playlists.findOne({type: type}).songs;
        currentSong = 0;
        Playlists.update({type: type}, {$set: {"songs": []}});
        songs = shuffle(songs);
        songs.forEach(function(song) {
            if (song.mid === undefined) {
                song.mid = createUniqueSongId();
            }
            Playlists.update({type: type}, {$push: {"songs": song}});
        });
        currentTitle = songs[currentSong].title;
        Playlists.update({type: type}, {$set: {lastSong: currentSong}});
        Rooms.update({type: type}, {$set: {timePaused: 0}});
        this.songTimer();
        Rooms.update({type: type}, {$set: {currentSong: {song: songs[currentSong], started: startedAt}}});
    };

    Rooms.update({type: type}, {$set: {timePaused: 0}});

    var timer;

    this.songTimer = function() {
        startedAt = Date.now();

        if (timer !== undefined) {
            timer.pause();
        }
        timer = new Timer(function() {
            self.skipSong();
        }, songs[currentSong].duration * 1000);
    };

    var state = Rooms.findOne({type: type}).state;

    this.pauseRoom = function() {
        if (state !== "paused") {
            timer.pause();
            Rooms.update({type: type}, {$set: {state: "paused"}});
            state = "paused";
        }
    };
    this.resumeRoom = function() {
        if (state !== "playing") {
            timer.resume();
            Rooms.update({type: type}, {$set: {state: "playing", timePaused: timer.timeWhenPaused()}});
            state = "playing";
        }
    };
    this.cancelTimer = function() {
        timer.pause();
    };
    this.getState = function() {
        return state;
    };
    this.type = type;

    var private = Rooms.findOne({type: type}).private;

    if (typeof private !== "boolean") {
        Rooms.update({type: type}, {$set: {"private": false}});
        private = false;
    }

    this.private = private;

    this.unlock = function() {
        if (self.private) {
            self.private = false;
            Rooms.update({type: type}, {$set: {"private": false}});
        }
    };

    this.lock = function() {
        if (!self.private) {
            self.private = true;
            Rooms.update({type: type}, {$set: {"private": true}});
        }
    };

    this.songTimer();
    this.voted = [];
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function Timer(callback, delay) {
    var timerId, start, remaining = delay;
    var timeWhenPaused = 0;
    var timePaused = new Date();

    this.pause = function() {
        Meteor.clearTimeout(timerId);
        remaining -= new Date() - start;
        timePaused = new Date();
    };

    this.resume = function() {
        start = new Date();
        Meteor.clearTimeout(timerId);
        timerId = Meteor.setTimeout(callback, remaining);
        timeWhenPaused += new Date() - timePaused;
    };

    this.timeWhenPaused = function() {
        return timeWhenPaused;
    };

    this.resume();
}

Meteor.users.deny({update: function () { return true; }});
Meteor.users.deny({insert: function () { return true; }});
Meteor.users.deny({remove: function () { return true; }});

function getSongDuration(query, artistName){
    var duration;
    var search = query;

    var res = Meteor.http.get('https://api.spotify.com/v1/search?q=' + encodeURIComponent(query) + '&type=track');

    for(var i in res.data){
        for(var j in res.data[i].items){
            if(search.indexOf(res.data[i].items[j].name) !== -1 && artistName.indexOf(res.data[i].items[j].artists[0].name) !== -1){
                duration = res.data[i].items[j].duration_ms / 1000;
                return duration;
            }
        }
    }
}

function getSongAlbumArt(query, artistName){
    var albumart;
    var search = query;

    var res = Meteor.http.get('https://api.spotify.com/v1/search?q=' + encodeURIComponent(query) + '&type=track');
    for(var i in res.data){
        for(var j in res.data[i].items){
            if(search.indexOf(res.data[i].items[j].name) !== -1 && artistName.indexOf(res.data[i].items[j].artists[0].name) !== -1){
                albumart = res.data[i].items[j].album.images[1].url
                return albumart;
            }
        }
    }
}

//var room_types = ["edm", "nightcore"];
var songsArr = [];

function getSongsByType(type) {
    if (type === "edm") {
        return [
            {id: "aE2GCa-_nyU", mid: "fh6_Gf", title: "Radioactive", duration: getSongDuration("Radioactive - Lindsey Stirling and Pentatonix", "Lindsey Stirling, Pentatonix"), artist: "Lindsey Stirling, Pentatonix", type: "YouTube", img: "https://i.scdn.co/image/62167a9007cef2e8ef13ab1d93019312b9b03655"},
            {id: "aHjpOzsQ9YI", mid: "goG88g", title: "Crystallize", artist: "Lindsey Stirling", duration: getSongDuration("Crystallize", "Lindsey Stirling"), type: "YouTube", img: "https://i.scdn.co/image/b0c1ccdd0cd7bcda741ccc1c3e036f4ed2e52312"}
        ];
    } else if (type === "nightcore") {
        return [{id: "f7RKOP87tt4", mid: "5pGGog", title: "Monster (DotEXE Remix)", duration: getSongDuration("Monster (DotEXE Remix)", "Meg & Dia"), artist: "Meg & Dia", type: "YouTube", img: "https://i.scdn.co/image/35ecdfba9c31a6c54ee4c73dcf1ad474c560cd00"}];
    } else {
        return [{id: "dQw4w9WgXcQ", mid: "6_fdr4", title: "Never Gonna Give You Up", duration: getSongDuration("Never Gonna Give You Up", "Rick Astley"), artist: "Rick Astley", type: "YouTube", img: "https://i.scdn.co/image/5246898e19195715e65e261899baba890a2c1ded"}];
    }
}

Rooms.find({}).fetch().forEach(function(room) {
    var type = room.type;
    if (Playlists.find({type: type}).count() === 0) {
        if (type === "edm") {
            Playlists.insert({type: type, songs: getSongsByType(type)});
        } else if (type === "nightcore") {
            Playlists.insert({type: type, songs: getSongsByType(type)});
        } else {
            Playlists.insert({type: type, songs: getSongsByType(type)});
        }
    }
    if (Playlists.findOne({type: type}).songs.length === 0) {
        // Add a global video to Playlist so it can proceed
    } else {
        stations.push(new Station(type));
    }
});

Accounts.validateNewUser(function(user) {
    var username;
    if (user.services) {
        if (user.services.github) {
            username = user.services.github.username;
        } else if (user.services.facebook) {
            username = user.services.facebook.first_name;
        } else if (user.services.password) {
            username = user.username;
        }
    }
    if (Meteor.users.find({"profile.usernameL": username.toLowerCase()}).count() !== 0) {
        throw new Meteor.Error(403, "An account with that username already exists.");
    } else {
        return true;
    }
});

Accounts.onCreateUser(function(options, user) {
    var username;
    if (user.services) {
        if (user.services.github) {
            username = user.services.github.username;
        } else if (user.services.facebook) {
            username = user.services.facebook.first_name;
        } else if (user.services.password) {
            username = user.username;
        }
    }
    user.profile = {username: username, usernameL: username.toLowerCase(), rank: "default", liked: [], disliked: [], settings: {showRating: false}, realname: ""};
    return user;
});

Meteor.publish("alerts", function() {
    return Alerts.find({active: true})
});

Meteor.publish("userData", function(userId) {
    if (userId !== undefined) {
        return Meteor.users.find(userId, {fields: {"services.github.username": 1, "punishments": 1}})
    } else {
        return undefined;
    }
});

Meteor.publish("allAlerts", function() {
    return Alerts.find({active: false})
});

Meteor.publish("playlists", function() {
    return Playlists.find({})
});

Meteor.publish("rooms", function() {
    return Rooms.find({});
});

Meteor.publish("queues", function() {
    return Queues.find({});
});

Meteor.publish("reports", function() {
    return Reports.find({});
});

Meteor.publish("chat", function() {
    return Chat.find({});
});

Meteor.publish("userProfiles", function(username) {
    var settings = Meteor.users.findOne({"profile.usernameL": username}, {fields: {"profile.settings": 1}});
    if (settings !== undefined && settings.profile.settings) {
        settings = settings.profile.settings;
        if (settings.showRating === true) {
            return Meteor.users.find({"profile.usernameL": username}, {fields: {"profile.username": 1, "profile.usernameL": 1, "profile.rank": 1, createdAt: 1, "profile.liked": 1, "profile.disliked": 1, "profile.settings": 1, "profile.realname": 1}});
        }
    }
    return Meteor.users.find({"profile.usernameL": username}, {fields: {"profile.username": 1, "profile.usernameL": 1, "profile.rank": 1, createdAt: 1, "profile.settings": 1, "profile.realname": 1}});
});

Meteor.publish("isAdmin", function() {
    return Meteor.users.find({_id: this.userId, "profile.rank": "admin"});
});

Meteor.publish("isModerator", function() {
    return Meteor.users.find({_id: this.userId, "profile.rank": "moderator"});
});

function isAdmin() {
    var userData = Meteor.users.find(Meteor.userId());
    if (Meteor.userId() && userData.count !== 0 && userData.fetch()[0].profile.rank === "admin") {
        return true;
    } else {
        return false;
    }
}

function isModerator() {
    var userData = Meteor.users.find(Meteor.userId());
    if (Meteor.userId() && userData.count !== 0 && userData.fetch()[0].profile.rank === "moderator") {
        return true;
    } else {
        return isAdmin();
    }
}

function isBanned() {
    var userData = Meteor.users.findOne(Meteor.userId());
    if (Meteor.userId() && userData !== undefined && userData.punishments !== undefined && userData.punishments.ban !== undefined) {
        var ban = userData.punishments.ban;
        if (new Date(ban.bannedUntil).getTime() <= new Date().getTime()) {
            Meteor.users.update(Meteor.userId(), {$unset: {"punishments.ban": ""}});
            return false;
        } else {
            return true;
        }
    } else {
        return false;
    }
}

function isMuted() {
    var userData = Meteor.users.findOne(Meteor.userId());
    if (Meteor.userId() && userData !== undefined && userData.punishments !== undefined && userData.punishments.mute !== undefined) {
        var mute = userData.punishments.mute;
        if (new Date(mute.bannedUntil).getTime() <= new Date().getTime()) {
            Meteor.users.update(Meteor.userId(), {$unset: {"punishments.mute": ""}});
            return false;
        } else {
            return true;
        }
    } else {
        return false;
    }
}

Meteor.methods({
    lockRoom: function(type) {
        if (isAdmin() && !isBanned()) {
            getStation(type, function(station){
                station.lock();
            });
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    unlockRoom: function(type) {
        if (isAdmin() && !isBanned()) {
            getStation(type, function(station){
                station.unlock();
            });
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    banUser: function(username, period, reason) {
        if (isAdmin() && !isBanned()) {
            var user = Meteor.user();
            var bannedUser = Meteor.users.findOne({"profile.usernameL": username.toLowerCase()});
            var bannedUntil = (new Date).getTime() + (period * 1000);
            if (bannedUntil > 8640000000000000) {
                bannedUntil = 8640000000000000;
            }
            bannedUntil = new Date(bannedUntil);
            var banObject = {bannedBy: user.profile.usernameL, bannedAt: new Date(Date.now()), bannedReason: reason, bannedUntil: bannedUntil};
            Meteor.users.update({"profile.usernameL": bannedUser.profile.usernameL}, {$set: {"punishments.ban": banObject}});
            Meteor.users.update({"profile.usernameL": bannedUser.profile.usernameL}, {$push: {"punishments.bans": banObject}});
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    muteUser: function(username, period) {
        if (isAdmin() && !isBanned()) {
            var user = Meteor.user();
            var mutedUser = Meteor.users.findOne({"profile.usernameL": username.toLowerCase()});
            if (period === undefined || Number(period) === 0) {
                mutedUntil = 8640000000000000;
            } else {
                var mutedUntil = (new Date).getTime() + (period * 1000);
                if (mutedUntil > 8640000000000000) {
                    mutedUntil = 8640000000000000;
                }
            }
            mutedUntil = new Date(mutedUntil);
            var muteObject = {mutedBy: user.profile.usernameL, mutedAt: new Date(Date.now()), mutedUntil: mutedUntil};
            Meteor.users.update({"profile.usernameL": mutedUser.profile.usernameL}, {$set: {"punishments.mute": muteObject}});
            Meteor.users.update({"profile.usernameL": mutedUser.profile.usernameL}, {$push: {"punishments.mutes": muteObject}});
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    unbanUser: function(username) {
        if (isAdmin() && !isBanned()) {
            Meteor.users.update({"profile.usernameL": username.toLowerCase()}, {$unset: "punishments.ban"});
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    unsilenceUser: function(username) {
        if (isAdmin() && !isBanned()) {
            Meteor.users.update({"profile.usernameL": username.toLowerCase()}, {$unset: "punishments.mute"});
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    isBanned: function() {
        return isBanned();
    },
    isMuted: function() {
        return isMuted();
    },
    updateSettings: function(showRating) {
        if (Meteor.userId() && !isBanned()) {
            var user = Meteor.user();
            if (showRating !== true && showRating !== false) {
                showRating = false;
            }
            if (user.profile.settings) {
                Meteor.users.update({"profile.username": user.profile.username}, {$set: {"profile.settings.showRating": showRating}});
            } else {
                Meteor.users.update({"profile.username": user.profile.username}, {$set: {"profile.settings": {showRating: showRating}}});
            }
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    resetRating: function() {
        if (isAdmin() && !isBanned()) {
            stations.forEach(function (station) {
                var type = station.type;
                var temp_songs = Playlists.findOne({type: type}).songs;
                Playlists.update({type: type}, {$set: {"songs": []}});
                temp_songs.forEach(function (song) {
                    song.likes = 0;
                    song.dislikes = 0;
                    Playlists.update({type: type}, {$push: {"songs": song}});
                });
            });
            Meteor.users.update({}, {$set: {"profile.liked": [], "profile.disliked": []}}, {multi: true});
        } else {
            throw Meteor.Error(403, "Invalid permissions.");
        }
    },
    removeAlerts: function() {
        if (isAdmin() && !isBanned()) {
            Alerts.update({active: true}, {$set: {active: false}}, { multi: true });
        } else {
            throw Meteor.Error(403, "Invalid permissions.");
        }
    },
    addAlert: function(description, priority) {
        if (isAdmin()) {
            if (description.length > 0 && description.length < 400) {
                var username = Meteor.user().profile.username;
                if (["danger", "warning", "success", "primary"].indexOf(priority) === -1) {
                    priority = "warning";
                }
                Alerts.insert({description: description, priority: priority, active: true, createdBy: username});
                return true;
            } else {
                throw Meteor.Error(403, "Invalid description length.");
            }
        } else {
            throw Meteor.Error(403, "Invalid permissions.");
        }
    },
    sendMessage: function(type, message) {
        if (Meteor.userId() && !isBanned() && !isMuted()) {
            var user = Meteor.user();
            var time = new Date();
            var rawrank = user.profile.rank;
            var username = user.profile.username;
            var profanity = false;
            var mentionUsername;
            if(message.indexOf("@") !== -1) {
                var messageArr = message.split(" ");
                for (var i in messageArr) {
                    if (messageArr[i].indexOf("@") !== -1) {
                        var mention = messageArr[i];
                    }
                }
                Meteor.users.find().forEach(function(user){
                    if(mention.indexOf(user.profile.username) !== -1){
                       mentionUsername = true;
                    };
                })
            }
            if (!message.replace(/\s/g, "").length > 0) {
                throw new Meteor.Error(406, "Message length cannot be 0.");
            }
            if (message.length > 300) {
                throw new Meteor.Error(406, "Message length cannot be more than 300 characters long..");
            }
            else if (user.profile.rank === "admin") {
                HTTP.call("GET", "http://www.wdyl.com/profanity?q=" + encodeURIComponent(message), function(err,res){
                    if(res.content.indexOf("true") > -1){
                        return true;
                    } else{
                        console.log("djkfs " + mentionUsername);
                        Chat.insert({type: type, rawrank: rawrank, rank: "[A]", message: message, mention: mention, isMentioned: mentionUsername, time: time, username: username});
                    }
                });
                return true;
            }
            else if (user.profile.rank === "moderator") {
                HTTP.call("GET", "http://www.wdyl.com/profanity?q=" + encodeURIComponent(message), function(err,res){
                    if(res.content.indexOf("true") > -1){
                        return true;
                    } else{
                        Chat.insert({type: type, rawrank: rawrank, rank: "[M]", message: message, time: time, username: username});
                    }
                });
                return true;
            }
            else {
                HTTP.call("GET", "http://www.wdyl.com/profanity?q=" + encodeURIComponent(message), function(err,res){
                    if(res.content.indexOf("true") > -1){
                        return true;
                    } else{
                        Chat.insert({type: type, rawrank: rawrank, rank: "", message: message, time: time, username: username});
                    }
                });
                return true;
            }
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    likeSong: function(mid) {
        if (Meteor.userId() && !isBanned()) {
            var user = Meteor.user();
            if (user.profile.liked.indexOf(mid) === -1) {
                Meteor.users.update({"profile.username": user.profile.username}, {$push: {"profile.liked": mid}});
                Playlists.update({"songs.mid": mid}, {$inc: {"songs.$.likes": 1}})
            } else {
                Meteor.users.update({"profile.username": user.profile.username}, {$pull: {"profile.liked": mid}});
                Playlists.update({"songs.mid": mid}, {$inc: {"songs.$.likes": -1}})
            }

            if (user.profile.disliked.indexOf(mid) !== -1) {
                Meteor.users.update({"profile.username": user.profile.username}, {$pull: {"profile.disliked": mid}});
                Playlists.update({"songs.mid": mid}, {$inc: {"songs.$.dislikes": -1}})
            }
            return true;
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    dislikeSong: function(mid) {
        if (Meteor.userId() && !isBanned()) {
            var user = Meteor.user();
            if (user.profile.disliked.indexOf(mid) === -1) {
                Meteor.users.update({"profile.username": user.profile.username}, {$push: {"profile.disliked": mid}});
                Playlists.update({"songs.mid": mid}, {$inc: {"songs.$.dislikes": 1}});
            } else {
                Meteor.users.update({"profile.username": user.profile.username}, {$pull: {"profile.disliked": mid}});
                Playlists.update({"songs.mid": mid}, {$inc: {"songs.$.dislikes": -1}});
            }

            if (user.profile.liked.indexOf(mid) !== -1) {
                Meteor.users.update({"profile.username": user.profile.username}, {$pull: {"profile.liked": mid}});
                Playlists.update({"songs.mid": mid}, {$inc: {"songs.$.likes": -1}});
            }
            return true;
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    voteSkip: function(type){
        if(Meteor.userId() && !isBanned()){
            var user = Meteor.user();
            getStation(type, function(station){
                if(station.voted.indexOf(user.profile.username) === -1){
                    station.voted.push(user.profile.username);
                    Rooms.update({type: type}, {$set: {votes: station.voted.length}});
                    if(station.voted.length === 3){
                        station.skipSong();
                    }
                } else{
                    throw new Meteor.Error(401, "Already voted.");
                }
            })
        }
    },
    submitReport: function(room, reportData) {
      if (Meteor.userId() && !isBanned()) {
          room = room.toLowerCase();
          if (Rooms.find({type: room}).count() === 1) {
              if (Reports.find({room: room}).count() === 0) {
                  Reports.insert({room: room, report: []});
              }
              if (reportData !== undefined) {
                      Reports.update({room: room}, {
                          $push: {
                              report: {
                                  song: reportData.song,
                                  type: reportData.type,
                                  reason: reportData.reason,
                                  other: reportData.other
                              }
                          }
                      });
                      return true;
              } else {
                  throw new Meteor.Error(403, "Invalid data.");
              }
          } else {
              throw new Meteor.Error(403, "Invalid genre.");
          }
      } else {
          throw new Meteor.Error(403, "Invalid permissions.");
      }
    },
    shufflePlaylist: function(type) {
        if (isAdmin() && !isBanned()) {
            getStation(type, function(station) {
                if (station === undefined) {
                    throw new Meteor.Error(404, "Station not found.");
                } else {
                    station.cancelTimer();
                    station.shufflePlaylist();
                }
            });
        }
    },
    skipSong: function(type) {
        if (isAdmin() && !isBanned()) {
            getStation(type, function(station) {
                if (station === undefined) {
                    throw new Meteor.Error(404, "Station not found.");
                } else {
                    station.skipSong();
                }
            });
        }
    },
    pauseRoom: function(type) {
        if (isAdmin() && !isBanned()) {
            getStation(type, function(station) {
                if (station === undefined) {
                    throw new Meteor.Error(403, "Room doesn't exist.");
                } else {
                    station.pauseRoom();
                }
            });
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    resumeRoom: function(type) {
        if (isAdmin() && !isBanned()) {
            getStation(type, function(station) {
                if (station === undefined) {
                    throw new Meteor.Error(403, "Room doesn't exist.");
                } else {
                    station.resumeRoom();
                }
            });
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    createUserMethod: function(formData, captchaData) {
        if (!isBanned()) {
            var verifyCaptchaResponse = reCAPTCHA.verifyCaptcha(this.connection.clientAddress, captchaData);
            if (!verifyCaptchaResponse.success) {
                throw new Meteor.Error(422, 'reCAPTCHA Failed: ' + verifyCaptchaResponse.error);
            } else {
                Accounts.createUser({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                });
            }
            return true;
        }
    },
    addSongToQueue: function(type, songData) {
        if (Meteor.userId() && !isBanned()) {
            type = type.toLowerCase();
            var userId = Meteor.userId();
            if (Rooms.find({type: type}).count() === 1) {
                if (Queues.find({type: type}).count() === 0) {
                    Queues.insert({type: type, songs: []});
                }
                if (songData !== undefined && Object.keys(songData).length === 5 && songData.type !== undefined && songData.title !== undefined && songData.artist !== undefined && songData.img !== undefined) {
                    songData.duration = getSongDuration(songData.title, songData.artist) || 0;
                    songData.img = getSongAlbumArt(songData.title, songData.artist) || "";
                    songData.skipDuration = 0;
                    songData.likes = 0;
                    songData.dislikes = 0;
                    var mid = createUniqueSongId();
                    if (mid !== undefined) {
                        songData.mid = mid;
                        Queues.update({type: type}, {
                            $push: {
                                songs: {
                                    id: songData.id,
                                    mid: songData.mid,
                                    title: songData.title,
                                    artist: songData.artist,
                                    duration: songData.duration,
                                    skipDuration: songData.skipDuration,
                                    likes: songData.likes,
                                    dislikes: songData.dislikes,
                                    img: songData.img,
                                    type: songData.type,
                                    requestedBy: userId
                                }
                            }
                        });
                        var songsRequested = (Meteor.user().profile !== undefined && Meteor.user().profile.statistics !== undefined && Meteor.user().profile.statistics.songsRequested !== undefined) ? Meteor.user().profile.statistics.songsRequested : 0;
                        songsRequested++;
                        Meteor.users.update(Meteor.userId(), {$set: {"profile.statistics.songsRequested": songsRequested}}); // TODO Make mongo query use $inc correctly.
                        return true;
                    } else {
                        throw new Meteor.Error(500, "Am error occured.");
                    }
                } else {
                    throw new Meteor.Error(403, "Invalid data.");
                }
            } else {
                throw new Meteor.Error(403, "Invalid genre.");
            }
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    updateQueueSong: function(genre, oldSong, newSong) {
        if (isModerator() && !isBanned()) {
            newSong.mid = oldSong.mid;
            Queues.update({type: genre, "songs": oldSong}, {$set: {"songs.$": newSong}});
            return true;
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    updatePlaylistSong: function(genre, oldSong, newSong) {
        if (isModerator() && !isBanned()) {
            newSong.mid = oldSong.mid;
            Playlists.update({type: genre, "songs": oldSong}, {$set: {"songs.$": newSong}});
            return true;
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    removeSongFromQueue: function(type, mid) {
        if (isModerator() && !isBanned()) {
            type = type.toLowerCase();
            Queues.update({type: type}, {$pull: {songs: {mid: mid}}});
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    removeSongFromPlaylist: function(type, mid) {
        if (isModerator() && !isBanned()) {
            type = type.toLowerCase();
            var songs = Playlists.findOne({type: type}).songs;
            var song = undefined;
            songs.forEach(function(curr_song) {
                if (mid === curr_song.mid) {
                    song = curr_song;
                    return;
                }
            });
            Playlists.update({type: type}, {$pull: {songs: {mid: mid}}});
            if (song !== undefined) {
                song.deletedBy = Meteor.userId();
                song.deletedAt = new Date(Date.now());
                if (Deleted.find({type: type}).count() === 0) {
                    Deleted.insert({type: type, songs: [song]});
                } else {
                    Deleted.update({type: type}, {$push: {songs: song}});
                }
            }
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    addSongToPlaylist: function(type, songData) {
        if (isModerator() && !isBanned()) {
            type = type.toLowerCase();
            if (Rooms.find({type: type}).count() === 1) {
                if (Playlists.find({type: type}).count() === 0) {
                    Playlists.insert({type: type, songs: []});
                }
                var requiredProperties = ["type", "mid", "id", "title", "artist", "duration", "skipDuration", "img", "likes", "dislikes", "requestedBy"];
                if (songData !== undefined && Object.keys(songData).length === requiredProperties.length) {
                    for (var property in requiredProperties) {
                        if (songData[requiredProperties[property]] === undefined) {
                            throw new Meteor.Error(403, "Invalid data.");
                        }
                    }
                    Playlists.update({type: type}, {
                        $push: {
                            songs: {
                                id: songData.id,
                                mid: songData.mid,
                                title: songData.title,
                                artist: songData.artist,
                                duration: songData.duration,
                                skipDuration: Number(songData.skipDuration),
                                img: songData.img,
                                type: songData.type,
                                likes: Number(songData.likes),
                                dislikes: Number(songData.dislikes),
                                requesedBy: songData.requestedBy,
                                approvedBy: Meteor.userId()
                            }
                        }
                    });
                    Queues.update({type: type}, {$pull: {songs: {mid: songData.mid}}});
                    return true;
                } else {
                    throw new Meteor.Error(403, "Invalid data.");
                }
            } else {
                throw new Meteor.Error(403, "Invalid genre.");
            }
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    createRoom: function(display, tag, private) {
        if (isAdmin() && !isBanned()) {
            createRoom(display, tag, private);
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    deleteRoom: function(type){
        if (isAdmin() && !isBanned()) {
            Rooms.remove({type: type});
            Playlists.remove({type: type});
            Queues.remove({type: type});
            return true;
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    getUserNum: function(){
        if (!isBanned()) {
            return Object.keys(Meteor.default_server.sessions).length;
        }
    },
    getTotalUsers: function(){
        return Meteor.users.find().count();
    },
    updateRealName: function(username, realname){
        Meteor.users.update({"profile.username": username}, {$set: {"profile.realname": realname}});
    },
    updateUserName: function(username, newUserName){
        Meteor.users.update({"username": username}, {$set: {"username": newUserName, "profile.username": newUserName, "profile.usernameL": newUserName.toLowerCase()}});
    },
    updateUserRank: function(username, newRank){
      Meteor.users.update({"username" : username}, {$set: {"profile.rank": newRank}});
    },
    deleteAccount: function(userID) {
        Meteor.users.remove({_id: userID});
    }
});

Meteor.setInterval(function() {
    checkUsersPR();
}, 10000);
