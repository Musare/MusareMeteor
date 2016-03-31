/* Yolo Swag 420 */

Meteor.startup(function () {
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
    for (var i in stations) {
        if (Rooms.find({type: stations[i]}).count() === 0) {
            createRoom(stations[i].display, stations[i].tag, false, "Room description goes here.");
        }
    }
    emojione.ascii = true;

    Accounts.config({
        sendVerificationEmail: true
    });

    if (Songs.find().count() === 0 || Songs.find({mid: default_song.mid}).count() === 0) {
        Songs.insert(default_song);
    }

    Rooms.update({}, {$set: {userList: []}});
});

var default_song = {
    id: "xKVcVSYmesU",
    mid: "ABCDEF",
    likes: 0,
    dislikes: 0,
    title: "Immortals",
    artist: "Fall Out Boy",
    img: "http://c.directlyrics.com/img/upload/fall-out-boy-sixth-album-cover.jpg",
    type: "YouTube",
    duration: 181,
    skipDuration: 0,
    requestedBy: "NONE",
    approvedBy: "GOD",
    genres: ["edm", "pop"]
};

Alerts.update({active: true}, {$set: {active: false}}, {multi: true});

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
    _.each(connections, function (connection) {
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
    stations.forEach(function (station) {
        emptyStations.push(station);
    });
    for (var key in output) {
        getStation(key, function (station) {
            emptyStations.splice(emptyStations.indexOf(station), 1);
            Rooms.update({type: key}, {$set: {users: output[key]}});
        });
    }
    emptyStations.forEach(function (emptyStation) {
        Rooms.update({type: emptyStation.type}, {$set: {users: 0}});
    });
    return output;
}

function getStation(type, cb) {
    stations.forEach(function (station) {
        if (station.type === type) {
            cb(station);
            return;
        }
    });
}

function createRoom(display, tag, private, desc) {
    var type = tag;
    if (Rooms.find({type: type}).count() === 0) {
        Rooms.insert({
            display: display,
            type: type,
            users: 0,
            private: private,
            currentSong: {song: default_song, started: 0},
            roomDesc: desc
        }, function (err) {
            if (err) {
                throw err;
            } else {
                stations.push(new Station(type));
            }
        });
    } else {
        return "Room already exists";
    }
}

function Station(type) {
    if (Playlists.find({type: type}).count() === 0) {
        Playlists.insert({type: type, songs: [default_song.mid], lastSong: 0});
    }
    if (Songs.find({genres: type}).count() > 0) {
        var list = Songs.find({genres: type}).fetch();
        list.forEach(function(song){
            if (Playlists.findOne({type: type, songs: song.mid}) === undefined) {
                Playlists.update({type: type}, {$push: {songs: song.mid}});
            }
        });
    }
    if (Playlists.findOne({type: type}).songs.length === 0) {
        Playlists.update({type: type}, {$push: {songs: default_song.mid}});
    }
    Meteor.publish(type, function () {
        var user = Meteor.users.findOne(this.userId);
        if (this.userId !== undefined && user !== undefined && user.profile !== undefined && user.profile.username !== undefined) {
            var username = user.profile.username;
            Rooms.update({type: type}, {$push: {userList: username}});
            this.onStop(function() {
                var list = Rooms.findOne({type: type}).userList;
                var index = list.indexOf(username);
                if (index >= 0) {
                    list.splice( index, 1 );
                }
                Rooms.update({type: type}, {$set: {userList: list}});
            });
        }
        return undefined;
    });
    var self = this;
    var startedAt = Date.now();
    var playlist = Playlists.findOne({type: type});
    var songs = playlist.songs;

    var currentSong = playlist.lastSong;
    if (currentSong < (songs.length - 1)) {
        currentSong++;
    } else currentSong = 0;
    var currentMid = songs[currentSong];

    var song = Songs.findOne({mid: currentMid});
    if (song === undefined) {
        Playlists.remove({}, {$pull: {songs: currentMid}});
        song = default_song;
    }
    var res = Rooms.update({type: type}, {
        $set: {
            currentSong: {song: song, started: startedAt},
            users: 0
        }
    });

    this.skipSong = function () {
        self.voted = [];
        voteNum = 0;
        Rooms.update({type: type}, {$set: {votes: 0}});
        songs = Playlists.findOne({type: type}).songs;
        songs.forEach(function (mid, index) {
            if (mid === currentMid) {
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
            currentMid = songs[currentSong];
            Playlists.update({type: type}, {$set: {lastSong: currentSong}});
            Rooms.update({type: type}, {$set: {timePaused: 0}});
            this.songTimer();
            Rooms.update({type: type}, {$set: {currentSong: {song: Songs.findOne({mid: songs[currentSong]}), started: startedAt}}});
        }
    };

    this.shufflePlaylist = function () {
        voteNum = 0;
        Rooms.update({type: type}, {$set: {votes: 0}});
        self.voted = [];
        songs = Playlists.findOne({type: type}).songs;
        currentSong = 0;
        Playlists.update({type: type}, {$set: {"songs": []}});
        songs = shuffle(songs);
        songs.forEach(function (song) {
            Playlists.update({type: type}, {$push: {"songs": song}});
        });
        currentMid = songs[currentSong];
        Playlists.update({type: type}, {$set: {lastSong: currentSong}});
        Rooms.update({type: type}, {$set: {timePaused: 0}});
        this.songTimer();
        Rooms.update({type: type}, {$set: {currentSong: {song: Songs.findOne({mid: songs[currentSong]}), started: startedAt}}});
    };

    Rooms.update({type: type}, {$set: {timePaused: 0}});

    var timer;
    var timerInitialised = false;

    this.songTimer = function () {
        if (state !== "paused") {
            startedAt = Date.now();

            if (timer !== undefined) {
                timer.pause();
            }
            timerInitialised = true;
            timer = new Timer(function () {
                self.skipSong();
            }, Songs.findOne({mid: songs[currentSong]}).duration * 1000);
        }
    };

    var state = Rooms.findOne({type: type}).state;

    this.pauseRoom = function () {
        if (state !== "paused") {
            timer.pause();
            Rooms.update({type: type}, {$set: {state: "paused"}});
            state = "paused";
        }
    };
    this.resumeRoom = function () {
        if (state !== "playing") {
            if (!timerInitialised) {
                timer = new Timer(function () {
                    self.skipSong();
                }, Songs.findOne({mid: songs[currentSong]}).duration * 1000);
            }
            timer.resume();
            Rooms.update({type: type}, {$set: {state: "playing", timePaused: timer.timeWhenPaused()}});
            state = "playing";
        }
    };
    this.cancelTimer = function () {
        timer.pause();
    };
    this.getState = function () {
        return state;
    };
    this.type = type;

    var private = Rooms.findOne({type: type}).private;

    if (typeof private !== "boolean") {
        Rooms.update({type: type}, {$set: {"private": false}});
        private = false;
    }

    this.private = private;

    this.unlock = function () {
        if (self.private) {
            self.private = false;
            Rooms.update({type: type}, {$set: {"private": false}});
        }
    };

    this.lock = function () {
        if (!self.private) {
            self.private = true;
            Rooms.update({type: type}, {$set: {"private": true}});
        }
    };

    /* This function fetches all songs with the genre of this room that isn't in the playlist yet, and then puts it in the playlist */
    this.fetchSongs = function() {
        var genreSongs = Songs.find({genres: type}).fetch();
        genreSongs.forEach(function(song) {
            if (songs.indexOf(song.mid) === -1) {
                Playlists.update({type: type}, {$push: {songs: song.mid}});
            }
        });
    };

    /* This function removes all songs that are in the playlist but do not have the type of the playlist in their genre */
    this.removeSongs = function() {
        songs.forEach(function(mid) {
            var song = Songs.findOne({mid: mid});
            if (song === undefined || song.genres.indexOf(type) === -1) {
                Playlists.update({type: type}, {$pull: {songs: mid}});
            }
        });
    };

    this.removeSongs();
    this.fetchSongs();
    this.skipSong();
    this.voted = [];
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

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

    this.pause = function () {
        Meteor.clearTimeout(timerId);
        remaining -= new Date() - start;
        timePaused = new Date();
    };

    this.resume = function () {
        start = new Date();
        Meteor.clearTimeout(timerId);
        timerId = Meteor.setTimeout(callback, remaining);
        timeWhenPaused += new Date() - timePaused;
    };

    this.timeWhenPaused = function () {
        return timeWhenPaused;
    };

    this.resume();
}

Meteor.users.deny({
    update: function () {
        return true;
    }
});
Meteor.users.deny({
    insert: function () {
        return true;
    }
});
Meteor.users.deny({
    remove: function () {
        return true;
    }
});

function getSongDuration(query, artistName) {
    var duration;
    var search = query;

    var res = Meteor.http.get('https://api.spotify.com/v1/search?q=' + encodeURIComponent(query) + '&type=track');

    for (var i in res.data) {
        for (var j in res.data[i].items) {
            if (search.indexOf(res.data[i].items[j].name) !== -1 && artistName.indexOf(res.data[i].items[j].artists[0].name) !== -1) {
                duration = res.data[i].items[j].duration_ms / 1000;
                return duration;
            }
        }
    }
    return 0;
}

function getSongAlbumArt(query, artistName) {
    var albumart;
    var search = query;

    var res = Meteor.http.get('https://api.spotify.com/v1/search?q=' + encodeURIComponent(query) + '&type=track');
    for (var i in res.data) {
        for (var j in res.data[i].items) {
            if (search.indexOf(res.data[i].items[j].name) !== -1 && artistName.indexOf(res.data[i].items[j].artists[0].name) !== -1) {
                albumart = res.data[i].items[j].album.images[1].url
                return albumart;
            }
        }
    }
}

//var room_types = ["edm", "nightcore"];
var songsArr = [];

Rooms.find({}).fetch().forEach(function (room) {
    var type = room.type;
    if (Playlists.find({type: type}).count() === 0) {
        Playlists.insert({type: type, songs: []});
    }
    if (Playlists.findOne({type: type}).songs.length === 0) {
        Playlists.update({type: type}, {$push: {songs: default_song.mid}}, function() {
            stations.push(new Station(type));
        });
    } else {
        stations.push(new Station(type));
    }
});

Accounts.validateNewUser(function (user) {
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

Accounts.onCreateUser(function (options, user) {
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
    user.profile = {
        username: username,
        usernameL: username.toLowerCase(),
        rank: "default",
        liked: [],
        disliked: [],
        settings: {showRating: true},
        realname: ""
    };
    return user;
});

Meteor.publish("alerts", function () {
    return Alerts.find({active: true})
});

Meteor.publish("allAlerts", function () {
    return Alerts.find({})
});

Meteor.publish("news", function () {
    return News.find({})
});

Meteor.publish("userData", function (userId) {
    if (userId !== undefined) {
        return Meteor.users.find(userId, {fields: {"services.github.username": 1, "punishments": 1}})
    } else {
        return undefined;
    }
});

Meteor.publish("playlists", function () {
    return Playlists.find({})
});

Meteor.publish("rooms", function () {
    return Rooms.find({});
});

Meteor.publish("songs", function () {
    return Songs.find({});
});

Meteor.publish("queues", function () {
    return Queues.find({});
});

Meteor.publish("reports", function () {
    return Reports.find({});
});

Meteor.publish("chat", function () {
    return Chat.find({});
});

Meteor.publish("userProfiles", function (username) {
    var settings = Meteor.users.findOne({"profile.usernameL": username}, {fields: {"profile.settings": 1}});
    if (settings !== undefined && settings.profile.settings) {
        settings = settings.profile.settings;
        if (settings.showRating === true) {
            return Meteor.users.find({"profile.usernameL": username}, {
                fields: {
                    "profile.username": 1,
                    "profile.usernameL": 1,
                    "profile.rank": 1,
                    createdAt: 1,
                    "profile.liked": 1,
                    "profile.disliked": 1,
                    "profile.settings": 1,
                    "profile.realname": 1
                }
            });
        }
    }
    return Meteor.users.find({"profile.usernameL": username}, {
        fields: {
            "profile.username": 1,
            "profile.usernameL": 1,
            "profile.rank": 1,
            createdAt: 1,
            "profile.settings": 1,
            "profile.realname": 1
        }
    });
});

Meteor.publish("isAdmin", function () {
    return Meteor.users.find({_id: this.userId, "profile.rank": "admin"});
});

Meteor.publish("isModerator", function () {
    return Meteor.users.find({_id: this.userId, "profile.rank": "moderator"});
});

Meteor.publish("feedback", function(){
    return Feedback.find();
})

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
    activateAlert: function(id) {
        if (isAdmin() && !isBanned()) {
            Alerts.update(id, {$set: {active: true}});
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    deactivateAlert: function(id) {
        if (isAdmin() && !isBanned()) {
            Alerts.update(id, {$set: {active: false}});
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    deleteAlert: function(id) {
        if (isAdmin() && !isBanned()) {
            Alerts.remove(id);
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    fetchSong: function(type) {
        if (isAdmin() && !isBanned()) {
            getStation(type, function (station) {
                station.fetchSongs();
            });
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    removeSongs: function(type) {
        if (isAdmin() && !isBanned()) {
            getStation(type, function (station) {
                station.removeSongs();
            });
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    lockRoom: function (type) {
        if (isAdmin() && !isBanned()) {
            getStation(type, function (station) {
                station.lock();
            });
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    unlockRoom: function (type) {
        if (isAdmin() && !isBanned()) {
            getStation(type, function (station) {
                station.unlock();
            });
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    banUser: function (username, period, reason) {
        if (isAdmin() && !isBanned()) {
            var user = Meteor.user();
            var bannedUser = Meteor.users.findOne({"profile.usernameL": username.toLowerCase()});
            var bannedUntil = (new Date).getTime() + (period * 1000);
            if (bannedUntil > 8640000000000000) {
                bannedUntil = 8640000000000000;
            }
            bannedUntil = new Date(bannedUntil);
            var banObject = {
                bannedBy: user.profile.usernameL,
                bannedAt: new Date(Date.now()),
                bannedReason: reason,
                bannedUntil: bannedUntil
            };
            Meteor.users.update({"profile.usernameL": bannedUser.profile.usernameL}, {$set: {"punishments.ban": banObject}});
            Meteor.users.update({"profile.usernameL": bannedUser.profile.usernameL}, {$push: {"punishments.bans": banObject}});
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    muteUser: function (username, period) {
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
    unbanUser: function (username) {
        if (isAdmin() && !isBanned()) {
            Meteor.users.update({"profile.usernameL": username.toLowerCase()}, {$unset: "punishments.ban"});
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    unsilenceUser: function (username) {
        if (isAdmin() && !isBanned()) {
            Meteor.users.update({"profile.usernameL": username.toLowerCase()}, {$unset: "punishments.mute"});
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    isBanned: function () {
        return isBanned();
    },
    isMuted: function () {
        return isMuted();
    },
    updateSettings: function (showRating) {
        if (Meteor.userId() && !isBanned()) {
            var user = Meteor.user();
            if (showRating !== true && showRating !== false) {
                showRating = true;
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
    addAlert: function (description) {
        if (isAdmin()) {
            var username = Meteor.user().profile.username;
            Alerts.insert({description: description, active: true, createdBy: username});
            return true;
        } else {
            throw Meteor.Error(403, "Invalid permissions.");
        }
    },
    sendMessage: function (type, message) {
        if (Meteor.userId() && !isBanned() && !isMuted()) {
            var user = Meteor.user();
            var time = new Date();
            var rawrank = user.profile.rank;
            var username = user.profile.username;
            var profanity = false
            if (!message.replace(/\s/g, "").length > 0) {
                throw new Meteor.Error(406, "Message length cannot be 0.");
            }
            if (message.length > 300) {
                throw new Meteor.Error(406, "Message length cannot be more than 300 characters long..");
            }
            else if (user.profile.rank === "admin") {
                /*HTTP.call("GET", "http://www.wdyl.com/profanity?q=" + encodeURIComponent(message), function (err, res) {
                    if (res.content.indexOf("true") > -1) {
                        return true;
                    } else {*/
                        Chat.insert({
                            type: type,
                            rawrank: rawrank,
                            rank: "[A]",
                            message: message,
                            time: time,
                            username: username
                        });
                    /*}
                });*/
                return true;
            }
            else if (user.profile.rank === "moderator") {
                /*HTTP.call("GET", "http://www.wdyl.com/profanity?q=" + encodeURIComponent(message), function (err, res) {
                    if (res.content.indexOf("true") > -1) {
                        return true;
                    } else {*/
                        Chat.insert({
                            type: type,
                            rawrank: rawrank,
                            rank: "[M]",
                            message: message,
                            time: time,
                            username: username
                        });
                    /*}
                });*/
                return true;
            }
            else {
                /*HTTP.call("GET", "http://www.wdyl.com/profanity?q=" + encodeURIComponent(message), function (err, res) {
                    if (res.content.indexOf("true") > -1) {
                        return true;
                    } else {*/
                        Chat.insert({
                            type: type,
                            rawrank: rawrank,
                            rank: "",
                            message: message,
                            time: time,
                            username: username
                        });
                    /*}
                });*/
                return true;
            }
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    likeSong: function (mid) {
        if (Meteor.userId() && !isBanned()) {
            var user = Meteor.user();
            if (user.profile.liked.indexOf(mid) === -1) {
                Meteor.users.update({"profile.username": user.profile.username}, {$push: {"profile.liked": mid}});
                Songs.update({mid: mid}, {$inc: {"likes": 1}})
            } else {
                Meteor.users.update({"profile.username": user.profile.username}, {$pull: {"profile.liked": mid}});
                Songs.update({mid: mid}, {$inc: {likes: -1}})
            }

            if (user.profile.disliked.indexOf(mid) !== -1) {
                Meteor.users.update({"profile.username": user.profile.username}, {$pull: {"profile.disliked": mid}});
                Songs.update({mid: mid}, {$inc: {dislikes: -1}})
            }
            return true;
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    dislikeSong: function (mid) {
        if (Meteor.userId() && !isBanned()) {
            var user = Meteor.user();
            if (user.profile.disliked.indexOf(mid) === -1) {
                Meteor.users.update({"profile.username": user.profile.username}, {$push: {"profile.disliked": mid}});
                Songs.update({mid: mid}, {$inc: {dislikes: 1}});
            } else {
                Meteor.users.update({"profile.username": user.profile.username}, {$pull: {"profile.disliked": mid}});
                Songs.update({mid: mid}, {$inc: {dislikes: -1}});
            }

            if (user.profile.liked.indexOf(mid) !== -1) {
                Meteor.users.update({"profile.username": user.profile.username}, {$pull: {"profile.liked": mid}});
                Songs.update({mid: mid}, {$inc: {likes: -1}});
            }
            return true;
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    voteSkip: function (type) {
        if (Meteor.userId() && !isBanned()) {
            var user = Meteor.user();
            getStation(type, function (station) {
                if (station.voted.indexOf(user.profile.username) === -1) {
                    station.voted.push(user.profile.username);
                    Rooms.update({type: type}, {$set: {votes: station.voted.length}});
                    if (station.voted.length === 3) {
                        station.skipSong();
                    }
                } else {
                    throw new Meteor.Error(401, "Already voted.");
                }
            })
        }
    },
    submitReport: function (room, reportData) {
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
    shufflePlaylist: function (type) {
        if (isAdmin() && !isBanned()) {
            getStation(type, function (station) {
                if (station === undefined) {
                    throw new Meteor.Error(404, "Station not found.");
                } else {
                    station.cancelTimer();
                    station.shufflePlaylist();
                }
            });
        }
    },
    skipSong: function (type) {
        if (isAdmin() && !isBanned()) {
            getStation(type, function (station) {
                if (station === undefined) {
                    throw new Meteor.Error(404, "Station not found.");
                } else {
                    station.skipSong();
                }
            });
        }
    },
    pauseRoom: function (type) {
        if (isAdmin() && !isBanned()) {
            getStation(type, function (station) {
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
    resumeRoom: function (type) {
        if (isAdmin() && !isBanned()) {
            getStation(type, function (station) {
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
    createUserMethod: function (formData, captchaData) {
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
    createArticle: function(data) {
        if (!isBanned() && isModerator()) {
            var userId = Meteor.userId();
            var requiredProperties = ["title", "content", "anonymous"];
            if (data !== undefined && Object.keys(data).length === requiredProperties.length) {
                for (var property in requiredProperties) {
                    if (data[requiredProperties[property]] === undefined) {
                        throw new Meteor.Error(403, "Invalid data.");
                    }
                }
                if (data.anonymous === false) {
                    data.author = Meteor.user().profile.username
                } else {
                    data.author = "A Musare Admin";
                }
                delete data.anonymous;
                data.time =  new Date();
                News.insert(data, function(err, res) {
                    if (err) {
                        console.log(err);
                        throw err.sanitizedError;
                    } else {
                        return true;
                    }
                });
            } else {
                throw new Meteor.Error(403, "Invalid data.");
            }
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    addSongToQueue: function (songData) {
        if (Meteor.userId() && !isBanned()) {
            var userId = Meteor.userId();
            var requiredProperties = ["title", "artist", "id", "genres"];
            if (songData !== undefined && Object.keys(songData).length === requiredProperties.length) {
                for (var property in requiredProperties) {
                    if (songData[requiredProperties[property]] === undefined) {
                        throw new Meteor.Error(403, "Invalid data.");
                    }
                }
                songData.duration = Number(getSongDuration(songData.title, songData.artist));
                songData.img = getSongAlbumArt(songData.title, songData.artist) | "";
                songData.skipDuration = 0;
                songData.likes = 0;
                songData.dislikes = 0;
                songData.requestedBy = userId;
                var mid = createUniqueSongId();
                if (mid !== undefined) {
                    songData.mid = mid;
                    Queues.insert(songData, function(err, res) {
                        if (err) {
                            console.log(err);
                            throw err.sanitizedError;
                        } else {
                            var songsRequested = (Meteor.user().profile !== undefined && Meteor.user().profile.statistics !== undefined && Meteor.user().profile.statistics.songsRequested !== undefined) ? Meteor.user().profile.statistics.songsRequested : 0;
                            songsRequested++;
                            Meteor.users.update(Meteor.userId(), {$set: {"profile.statistics.songsRequested": songsRequested}}); // TODO Make mongo query use $inc correctly.
                            return true;
                        }
                    });
                } else {
                    throw new Meteor.Error(500, "Am error occured.");
                }
            } else {
                throw new Meteor.Error(403, "Invalid data.");
            }
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    updateQueueSong: function (mid, newSong) {
        if (isModerator() && !isBanned()) {
            Queues.update({mid: mid}, {$set: {
                "title": newSong.title,
                "artist": newSong.artist,
                "id": newSong.id,
                "img": newSong.img,
                "duration" : newSong.duration,
                "skipDuration" : newSong.skipDuration,
                "genres": newSong.genres
            }}, function(err) {
                console.log(err);
                if (err) {
                    throw err.sanitizedError;
                } else {
                    return true;
                }
            });
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    updatePlaylistSong: function (mid, newSong) {
        if (isModerator() && !isBanned()) {
            Songs.update({mid: mid}, {$set: {
                "title": newSong.title,
                "artist": newSong.artist,
                "id": newSong.id,
                "img": newSong.img,
                "duration": newSong.duration,
                "skipDuration": newSong.skipDuration,
                "approvedBy": Meteor.userId(),
                "genres": newSong.genres
            }}, function(err) {
                console.log(err);
                if (err) {
                    throw err.sanitizedError;
                } else {
                    return true;
                }
            });
            return true;
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    removeSongFromQueue: function (mid) {
        if (isModerator() && !isBanned()) {
            Queues.remove({mid: mid});
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    removeSongFromPlaylist: function (type, mid) {
        if (isModerator() && !isBanned()) {
            Playlists.update({type: type}, {$pull: {songs: mid}});
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    deleteSong: function (mid) {
        if (isModerator() && !isBanned()) {
            Songs.remove({mid: mid})
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    deleteSong: function (mid) {
        if (isModerator() && !isBanned()) {
            Songs.remove({mid: mid})
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    addSongToPlaylist: function (songData) {
        if (isModerator() && !isBanned()) {
            var requiredProperties = ["_id", "mid", "id", "title", "artist", "duration", "skipDuration", "img", "likes", "dislikes", "requestedBy", "genres"];
            if (songData !== undefined && Object.keys(songData).length === requiredProperties.length) {
                for (var property in requiredProperties) {
                    if (songData[requiredProperties[property]] === undefined) {
                        throw new Meteor.Error(403, "Invalid data.");
                    }
                }
                delete songData._id;
                songData.approvedBy = Meteor.userId();
                Songs.insert(songData);
                Queues.remove({mid: songData.mid});
                songData.genres.forEach(function(genre) {
                    genre = genre.toLowerCase();
                    if (Playlists.findOne({type: genre}) === undefined) {
                        Playlists.insert({type: genre, songs: [songData.mid]});
                    } else {
                        Playlists.update({type: genre}, {$push: {songs: songData.mid}});
                    }
                });
                return true;
            } else {
                throw new Meteor.Error(403, "Invalid data.");
            }
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    createRoom: function (display, tag, private, desc) {
        if (isAdmin() && !isBanned()) {
            createRoom(display, tag, private, desc);
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    deleteRoom: function (type) {
        if (isAdmin() && !isBanned()) {
            Rooms.remove({type: type});
            return true;
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    getUserNum: function () {
        if (!isBanned()) {
            return Object.keys(Meteor.default_server.sessions).length;
        }
    },
    getTotalUsers: function () {
        return Meteor.users.find().count();
    },
    updateRealName: function (realname) {
        if (Meteor.userId()) {
            var oldName = Meteor.users.findOne(Meteor.userId()).profile.realname;
            Meteor.users.update(Meteor.userId(), {
                $set: {"profile.realname": realname},
                $push: {"profile.realnames": oldName}
            });
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    updateUserName: function (newUserName) {
        if (Meteor.userId()) {
            var oldUsername = Meteor.users.findOne(Meteor.userId()).profile.username;
            Meteor.users.update(Meteor.userId(), {
                $set: {
                    "username": newUserName,
                    "profile.username": newUserName,
                    "profile.usernameL": newUserName.toLowerCase()
                }, $push: {"profile.usernames": oldUsername}
            });
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    /*updateUserRank: function(newRank){
     if (Meteor.userId()) {
     Meteor.users.update(Meteor.userId(), {$set: {"profile.rank": newRank}});
     } else {
     throw new Meteor.Error(403, "Invalid permissions.");
     }
     },*/
    deleteAccount: function () {
        if (Meteor.userId()) {
            var user = Meteor.users.findOne(Meteor.userId());
            Meteor.users.remove({_id: Meteor.userId()});
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    sendFeedback: function(message){
        if(Meteor.userId() && !isBanned()) {
            HTTP.call("GET", "http://www.wdyl.com/profanity?q=" + encodeURIComponent(message), function (err, res) {
                if (res.content.indexOf("true") > -1) {
                    return true;
                } else {
                    Feedback.insert({
                        "username": Meteor.user().profile.username,
                        "message": message,
                        "upvotes": 0,
                        "upvotedBy": []
                    })
                }
            });
        }
    },
    upvoteFeedback: function(message){
        if(Meteor.userId() && !isBanned()){
            console.log(Feedback.findOne({"message": message}));
            if(Feedback.findOne({"message": message}).upvotedBy.indexOf(Meteor.user().profile.username) === -1){
                Feedback.update({"message": message}, {$inc: {"upvotes": 1}});
                Feedback.update({"message": message}, {$push: {"upvotedBy": Meteor.user().profile.username}});
            } else{
                Feedback.update({"message": message}, {$inc: {"upvotes": -1}});
                Feedback.update({"message": message}, {$pull: {"upvotedBy": Meteor.user().profile.username}});
            }
        }
    },
    deleteFeedback: function(message){
        if(isAdmin() && !isBanned()){
            Feedback.remove({"message": message});
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    updateFeedback: function(oldMessage, newMessage){
        if(isAdmin() && !isBanned()){
            Feedback.update({"message": oldMessage}, {$set: {"message": newMessage}});
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    editRoomDesc: function(type, description){
        if(isAdmin() && !isBanned()){
            Rooms.update({type: type}, {$set: {"roomDesc": description}});
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    },
    removeReport: function(query, obj){
        if(isAdmin() && !isBanned()){
            Reports.update(query, {$pull: {"report": obj}});
        } else {
            throw new Meteor.Error(403, "Invalid permissions.");
        }
    }
});

Meteor.setInterval(function () {
    checkUsersPR();
}, 10000);

Meteor.users.after.insert(function (err, user) {
    Accounts.sendVerificationEmail(user._id);
});
