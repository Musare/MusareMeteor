Template.admin.helpers({
    queueCount: function () {
        return Queues.find().count();
    },
    genreQueue: function(type) {
        if (type === "none") {
            return Queues.find({genres: []}).count();
        } else {
            return Queues.find({genres: type}).count();
        }
    },
    alertsList: function() {
        return Alerts.find({});
    },
    queues: function () {
        var queues = Queues.find({}).fetch();
        return queues;
    },
    usersOnline: function () {
        Meteor.call("getUserNum", function (err, num) {
            if (err) {
                console.log(err);
            }
            Session.set("userNum", num);
        });
        return Session.get("userNum");
    },
    roomUserNum: function () {
        var type = this.type;
        var userNum = Rooms.findOne({type: type}).users;
        return userNum;
    },
    allUsers: function () {
        Meteor.call("getTotalUsers", function (err, num) {
            Session.set("allUsers", num);
        })
        return Session.get("allUsers");
    },
    playlists: function () {
        var playlists = Playlists.find({}).fetch();
        playlists.map(function (playlist) {
            if (Rooms.find({type: playlist.type}).count() !== 1) {
                return;
            } else {
                playlist.display = Rooms.findOne({type: playlist.type}).display;
                return playlist;
            }
        });
        return playlists;
    },
    reportsCount: function (room) {
        room = room.toLowerCase();
        var reports = Reports.findOne({room: room});
        return reports && "report" in reports ? reports.report.length : 0;
    }
});

Template.alerts.helpers({
    alerts: function () {
        var alerts = Alerts.find({active: true}).fetch();
        alerts = alerts.map(function(alert) {
            alert.description = replaceURLWithHTMLLinksBlank(alert.description);
            return alert;
        });
        return alerts;
    }
});

Template.banned.helpers({
    bannedAt: function () {
        if (Session.get("ban") !== undefined) {
            return Session.get("ban").bannedAt;
        }
    },
    bannedBy: function () {
        if (Session.get("ban") !== undefined) {
            return Session.get("ban").bannedBy;
        }
    },
    bannedUntil: function () {
        if (Session.get("ban") !== undefined) {
            return Session.get("ban").bannedUntil;
        }
    },
    bannedReason: function () {
        if (Session.get("ban") !== undefined) {
            return Session.get("ban").bannedReason;
        }
    }
});

Template.feedback.helpers({
    feedback: function () {
        return Feedback.find().fetch().reverse();
    }
})

Template.header.helpers({
    userId: function () {
        return Meteor.userId();
    }
});

Template.home.helpers({
    currentSong: function () {
        var type = this.type;
        var room = Rooms.findOne({type: type});
        if (room !== undefined) {
            return room.currentSong;
        } else {
            return false;
        }
    },
    userNum: function () {
        var type = this.type;
        var userNum = Rooms.findOne({type: type}).users;
        return userNum;
    },
    currentPrivateSong: function () {
        var name = this.name;
        var room = CommunityStations.findOne({name: name});
        if (room !== undefined) {
            return room.currentSong;
        } else {
            return false;
        }
    },
    userPrivateNum: function () {
        var name = this.name;
        var userNum = CommunityStations.findOne({name: name}).users;
        return userNum;
    }
});

Template.playlist.helpers({
    playlist_songs: function () {
        var songIDs = Playlists.find({"type": Session.get("type")}).fetch()[0].songs
        var data = [];
        songIDs.forEach(function(id){
            var song = Songs.findOne({"mid": id});
            data.push(song);
        })
        if (data !== undefined) {
            data.map(function (song) {
                if (Session.get("currentSong") !== undefined && song.mid === Session.get("currentSong").mid) {
                    song.current = true;
                } else {
                    song.current = false;
                }
                return song;
            });
            return data;
        } else {
            return [];
        }
    },
    nextSong: function(){
        var song;
        var data = Playlists.find({"type": Session.get("type")}).fetch()[0].songs;
        for(var i = 0; i < data.length; i++){
            if(Session.get("currentSong") !== undefined && data[i] === Session.get("currentSong").mid){
                if(i === data.length - 1){
                    song = Songs.findOne({"mid": data[0]});
                    Session.set("nextSong", [song])
                } else{
                    song = Songs.findOne({"mid": data[i+1]});
                    Session.set("nextSong", [song]);
                }
            }
        }
        return Session.get("nextSong");
    }
});

Template.profile.helpers({
    "real_name": function () {
        return Session.get("real_name");
    },
    "username": function () {
        return Session.get("username")
    },
    "first_joined": function () {
        return moment(Session.get("first_joined")).format("DD/MM/YYYY");
    },
    "rank": function () {
        return Session.get("rank");
    },
    "songs_requested": function () {
        return Session.get("songs_requested");
    },
    loaded: function () {
        return Session.get("loaded");
    },
    likedSongs: function () {
        var likedArr = [];
        var liked = Session.get("liked");
        if (liked !== undefined) {
            liked.forEach(function (mid) {
                Songs.find().forEach(function (data) {
                    if (data.mid === mid) {
                        likedArr.push({title: data.title, artist: data.artist});
                    }
                });
            });
        }
        return likedArr;
    },
    dislikedSongs: function () {
        var dislikedArr = [];
        var disliked = Session.get("disliked");
        if (disliked !== undefined) {
            disliked.forEach(function (mid) {
                Songs.find().forEach(function (data) {
                    if (data.mid === mid) {
                        dislikedArr.push({title: data.title, artist: data.artist});
                    }
                });
            });
        }
        return dislikedArr;
    },
    isUser: function () {
        var parts = Router.current().url.split('/');
        var username = parts.pop();
        if (username === Meteor.user().profile.username) {
            return true;
        }
    }
});

Template.queues.helpers({
    songs: function () {
        return Queues.find({}).fetch();
    },
    song_image: function() {
        return Session.get("image_url");
    }
});

Template.news.helpers({
    articles: function() {
        var articles =  News.find().fetch().reverse();
        articles = articles.map(function(article) {
            article.content = replaceURLWithHTMLLinksBlank(article.content);
            return article;
        });
        return articles;
    }
});

Template.manageSongs.helpers({
    songs: function () {
        var noGenres = Session.get("showNoGenres");
        var genres = Session.get("showGenres");
        if (noGenres === true && genres === true) {
            return Songs.find();
        } else if (noGenres === true && genres === false) {
            return Songs.find({genres: []});
        } else {
            return Songs.find({$where : "this.genres.length > 0"});
        }
    },
    song_image: function() {
        return Session.get("image_url");
    }
});

Template.manageStation.helpers({
    editingDesc: function() {
        return Session.get("editingDesc");
    },
    description: function() {
        var parts = location.href.split('/');
        parts.pop();
        var id = parts.pop();
        var type = id.toLowerCase();

        return Rooms.findOne({type: type}).roomDesc;
    },
    songs: function () {
        var parts = location.href.split('/');
        parts.pop();
        var id = parts.pop();
        var type = id.toLowerCase();

        var playlist = Playlists.findOne({type: type});
        var songs = [];
        if (playlist !== undefined && playlist.songs !== undefined) {
            playlist.songs.forEach(function(songMid) {
                songs.push(Songs.findOne({mid: songMid}));
            });
        }
        return songs;
    },
    song_image: function() {
        return Session.get("image_url");
    },
    genre: function() {
        var parts = location.href.split('/');
        parts.pop();
        var id = parts.pop();
        var type = id.toLowerCase();
        return type;
    },
    reports: function() {
        var parts = location.href.split('/');
        parts.pop();
        var id = parts.pop();
        var query = {room: id.toLowerCase()};
        var reports = Reports.find(query).fetch();
        return reports;
    }
});

Template.room.helpers({
    currentSongR: function() {
        return Session.get("currentSongR");
    },
    previousSongR: function() {
        return Session.get("previousSongR");
    },
    editingSong: function() {
        return Session.get("editingSong");
    },
    singleVideoResults: function () {
        return Session.get("songResults");
    },
    singleVideoResultsActive: function() {
        var songs = Session.get("songResults");
        if (songs !== undefined && songs.length > 0) {
            return true;
        } else {
            return false;
        }
    },
    importPlaylistVideos: function () {
        return Session.get("songResults");
    },
    playlistImportVideosActive: function() {
        var songs = Session.get("songResults");
        if (songs !== undefined && songs.length > 0) {
            return true;
        } else {
            return false;
        }
    },
    singleVideo: function () {
        return Session.get("si_or_pl") === "singleVideo";
    },
    chat: function () {
        Meteor.setTimeout(function () {
            var elem = document.getElementById('chat');
            if (elem !== undefined && elem !== null) {
                elem.scrollTop = elem.scrollHeight;
            }
        }, 100);
        return Chat.find({type: Session.get("type")}, {sort: {time: -1}, limit: 50}).fetch().reverse();
    },
    globalChat: function () {
        Meteor.setTimeout(function () {
            var elem = document.getElementById('global-chat');
            if (elem !== undefined && elem !== null) {
                elem.scrollTop = elem.scrollHeight;
            }
        }, 100);
        var messages = Chat.find({type: "global"}, {sort: {time: -1}, limit: 50}).fetch().reverse();
        messages = messages.map(function(message) {
            message.message = replaceURLWithHTMLLinks(message.message);
            return message;
        });
        return messages;
    },
    likes: function () {
        var playlist = Songs.find({"genres": Session.get("type")}).fetch();
        var likes = 0;
        playlist.forEach(function (song) {
            if (Session.get("currentSong") && song.mid === Session.get("currentSong").mid) {
                likes = song.likes;
                return;
            }
        });
        return likes;
    },
    dislikes: function () {
        var playlist = Songs.find({"genres": Session.get("type")}).fetch();
        var dislikes = 0;
        playlist.forEach(function (song) {
            if (Session.get("currentSong") && song.mid === Session.get("currentSong").mid) {
                dislikes = song.dislikes;
                return;
            }
        });
        return dislikes;
    },
    liked: function () {
        if (Meteor.userId()) {
            var currentSong = Session.get("currentSong");
            if (currentSong && Meteor.user().profile.liked.indexOf(currentSong.mid) !== -1) {
                return "liked";
            } else {
                return "";
            }
        } else {
            "";
        }
    },
    disliked: function () {
        if (Meteor.userId()) {
            var currentSong = Session.get("currentSong");
            if (currentSong && Meteor.user().profile.disliked.indexOf(currentSong.mid) !== -1) {
                return "disliked";
            } else {
                return "";
            }
        } else {
            "";
        }
    },
    type: function () {
        var parts = location.href.split('/');
        var id = parts.pop().toLowerCase();
        return Rooms.findOne({type: id}).display;
    },
    users: function () {
        var parts = location.href.split('/');
        var id = parts.pop().toLowerCase();
        return Rooms.findOne({type: id}).users;
    },
    title: function () {
        return Session.get("title");
    },
    artist: function () {
        return Session.get("artist");
    },
    loaded: function () {
        return Session.get("loaded");
    },
    paused: function () {
        return Session.get("state") === "paused";
    },
    private: function () {
        return 1;
        //return Rooms.findOne({type: Session.get("type")}).private === true;
    },
    currentSong: function(){
        return Session.get("currentSong");
    },
    reportingSong: function() {
        if (!Session.get("reportPrevious")) {
            return Session.get("currentSongR");
        } else {
            return Session.get("previousSongR");
        }
    },
    reportSong: function(){
        Meteor.setInterval(function(){
            if($("#report-song").is(":checked")){
                Session.set("reportSong", true)
            } else { Session.set("reportSong", false) }
        }, 500);
        return Session.get("reportSong");
    },
    reportSongOther: function(){
        Meteor.setInterval(function(){
            if($("#report-song-other").is(":checked")){
                Session.set("reportSongOther", true)
            } else { Session.set("reportSongOther", false) }
        }, 500);
        return Session.get("reportSongOther");
    },
    reportTitle: function(){
        Meteor.setInterval(function(){
            if($("#report-title").is(":checked")){
                Session.set("reportTitle", true)
            } else { Session.set("reportTitle", false) }
        }, 500);
        return Session.get("reportTitle");
    },
    reportTitleOther: function(){
        Meteor.setInterval(function(){
            if($("#report-title-other").is(":checked")){
                Session.set("reportTitleOther", true)
            } else { Session.set("reportTitleOther", false) }
        }, 500);
        return Session.get("reportTitleOther");
    },
    reportArtist: function(){
        Meteor.setInterval(function(){
            if($("#report-artist").is(":checked")){
                Session.set("reportArtist", true)
            } else { Session.set("reportArtist", false) }
        }, 500);
        return Session.get("reportArtist");
    },
    reportArtistOther: function(){
        Meteor.setInterval(function(){
            if($("#report-artist-other").is(":checked")){
                Session.set("reportArtistOther", true)
            } else { Session.set("reportArtistOther", false) }
        }, 500);
        return Session.get("reportArtistOther");
    },
    reportDuration: function(){
        Meteor.setInterval(function(){
            if($("#report-duration").is(":checked")){
                Session.set("reportDuration", true)
            } else { Session.set("reportDuration", false) }
        }, 500);
        return Session.get("reportDuration");
    },
    reportDurationOther: function(){
        Meteor.setInterval(function(){
            if($("#report-duration-other").is(":checked")){
                Session.set("reportDurationOther", true)
            } else { Session.set("reportDurationOther", false) }
        }, 500);
        return Session.get("reportDurationOther");
    },
    reportAlbumart: function(){
        Meteor.setInterval(function(){
            if($("#report-albumart").is(":checked")){
                Session.set("reportAlbumart", true)
            } else { Session.set("reportAlbumart", false) }
        }, 500);
        return Session.get("reportAlbumart");
    },
    reportAlbumartOther: function(){
        Meteor.setInterval(function(){
            if($("#report-albumart-other").is(":checked")){
                Session.set("reportAlbumartOther", true)
            } else { Session.set("reportAlbumartOther", false) }
        }, 500);
        return Session.get("reportAlbumartOther");
    },
    reportOther: function(){
        Meteor.setInterval(function(){
            if($("#report-other").is(":checked")){
                Session.set("reportOther", true)
            } else { Session.set("reportOther", false) }
        }, 500);
        return Session.get("reportOther");
    },
    votes: function () {
        return Rooms.findOne({type: Session.get("type")}).votes;
    },
    usersInRoom: function(){
        var userList = [];
        var roomUserList = Rooms.findOne({type: Session.get("type")}).userList;
        roomUserList.forEach(function(user){
            if(userList.indexOf(user) === -1){
                userList.push(user);
            }
        })
        return userList;
    }
});

Template.communityStation.helpers({
    partyModeChecked: function() {
        var name = Session.get("CommunityStationName");
        var room = CommunityStations.findOne({name: name});
        if (room.partyModeEnabled === true) {
            return "checked";
        } else {
            return "";
        }
    },
    partyMode: function() {
        var name = Session.get("CommunityStationName");
        var room = CommunityStations.findOne({name: name});
        if (room.partyModeEnabled === true) {
            return true;
        } else {
            return false;
        }
    },
    singleVideoResults: function() {
        return Session.get("songResults");
    },
    singleVideoResultsActive: function() {
        var songs = Session.get("songResults");
        if (songs !== undefined && songs.length > 0) {
            return true;
        } else {
            return false;
        }
    },
    hasMoreThanOne: function(array) {
        if (array.length > 1) {
            return true;
        } else {
            return false;
        }
    },
    isFirst: function(object, array) {
        if (_.isEqual(array[0], object) && array.length > 1) {
            return true;
        } else {
            return false;
        }
    },
    isLast: function(object, array) {
        if (_.isEqual(array[array.length - 1], object) && array.length > 1) {
            return true;
        } else {
            return false;
        }
    },
    communityStationOwnerName: function() {
        var room = CommunityStations.findOne({name: Session.get("CommunityStationName")});
        if (room !== undefined) {
            return Meteor.users.findOne(room.owner).profile.username;
        } else {
            return "";
        }
    },
    editingPlaylist: function() {
        return PrivatePlaylists.findOne({owner: Meteor.userId(), name: Session.get("editingPlaylistName")});
    },
    isPlaylistSelected: function(roomName, playlistName) {
        return CommunityStations.findOne({name: roomName}).playlist === playlistName;
    },
    globalChat: function () {
        Meteor.setTimeout(function () {
            var elem = document.getElementById('global-chat');
            if (elem !== undefined && elem !== null) {
                elem.scrollTop = elem.scrollHeight;
            }
        }, 100);
        var messages = Chat.find({type: "global"}, {sort: {time: -1}, limit: 50}).fetch().reverse();
        messages = messages.map(function(message) {
            message.message = replaceURLWithHTMLLinks(message.message);
            return message;
        });
        return messages;
    },
    communityStationDisplayName: function () {
        var parts = location.href.split('/');
        var id = parts.pop().toLowerCase();
        return CommunityStations.findOne({name: id}).displayName;
    },
    name: function () {
        var parts = location.href.split('/');
        var id = parts.pop().toLowerCase();
        return id;
    },
    users: function () {
        var parts = location.href.split('/');
        var id = parts.pop().toLowerCase();
        return CommunityStations.findOne({name: id}).userList.length;
    },
    allowed: function () {
        var parts = location.href.split('/');
        var id = parts.pop().toLowerCase();
        var arr = [];
        CommunityStations.findOne({name: id}).allowed.forEach(function(allowed) {
            arr.push({name: Meteor.users.findOne(allowed).profile.username, id: allowed});
        });
        return arr;
    },
    playlists: function () {
        return PrivatePlaylists.find({owner: Meteor.userId()});
    },
    title: function () {
        return Session.get("title");
    },
    loaded: function () {
        return Session.get("loaded");
    },
    paused: function () {
        return Session.get("state") === "paused";
    },
    private: function () {
        var room = CommunityStations.findOne({name: Session.get("CommunityStationName")});
        if (room !== undefined) {
            return room.private;
        } else {
            return 1;
        }
    },
    playing: function() {
        return Session.get("state") === "playing";
    },
    currentSong: function(){
        return Session.get("currentSong");
    },
    votes: function () {
        var room = CommunityStations.findOne({name: Session.get("CommunityStationName")});
        if (room !== undefined) {
            return room.votes;
        } else {
            return 0;
        }
    },
    usersInRoom: function() {
        var userList = [];
        var room = CommunityStations.findOne({name: Session.get("CommunityStationName")});
        if (room !== undefined) {
            var roomUserList = room.userList;
            roomUserList.forEach(function (user) {
                if (userList.indexOf(user) === -1) {
                    userList.push(user);
                }
            })
        }
        return userList;
    },
    room: function() {
        var parts = location.href.split('/');
        var id = parts.pop().toLowerCase();
        setTimeout(function() {
            Materialize.updateTextFields();
        }, 100);
        return CommunityStations.findOne({name: id});
    }
});

Template.settings.helpers({
    username: function () {
        if (Meteor.user() !== undefined) {
            return Meteor.user().profile.username;
        } else {
            return "";
        }
    }
});

function replaceURLWithHTMLLinks(text) {
    var re = /(\(.*?)?\b((?:https?|ftp|file):\/\/[-a-z0-9+&@#\/%?=~_()|!:,.;]*[-a-z0-9+&@#\/%=~_()|])/ig;
    return text.replace(re, function(match, lParens, url) {
        var rParens = '';
        lParens = lParens || '';

        // Try to strip the same number of right parens from url
        // as there are left parens.  Here, lParenCounter must be
        // a RegExp object.  You cannot use a literal
        //     while (/\(/g.exec(lParens)) { ... }
        // because an object is needed to store the lastIndex state.
        var lParenCounter = /\(/g;
        while (lParenCounter.exec(lParens)) {
            var m;
            // We want m[1] to be greedy, unless a period precedes the
            // right parenthesis.  These tests cannot be simplified as
            //     /(.*)(\.?\).*)/.exec(url)
            // because if (.*) is greedy then \.? never gets a chance.
            if (m = /(.*)(\.\).*)/.exec(url) ||
                    /(.*)(\).*)/.exec(url)) {
                url = m[1];
                rParens = m[2] + rParens;
            }
        }
        return lParens + "<a style='font-size: 18px; padding: 0; display: inline;' target='_blank' href='" + url + "'>" + url + "</a>" + rParens;
    });
}

function replaceURLWithHTMLLinksBlank(text) {
    var re = /(\(.*?)?\b((?:https?|ftp|file):\/\/[-a-z0-9+&@#\/%?=~_()|!:,.;]*[-a-z0-9+&@#\/%=~_()|])/ig;
    return text.replace(re, function(match, lParens, url) {
        var rParens = '';
        lParens = lParens || '';

        // Try to strip the same number of right parens from url
        // as there are left parens.  Here, lParenCounter must be
        // a RegExp object.  You cannot use a literal
        //     while (/\(/g.exec(lParens)) { ... }
        // because an object is needed to store the lastIndex state.
        var lParenCounter = /\(/g;
        while (lParenCounter.exec(lParens)) {
            var m;
            // We want m[1] to be greedy, unless a period precedes the
            // right parenthesis.  These tests cannot be simplified as
            //     /(.*)(\.?\).*)/.exec(url)
            // because if (.*) is greedy then \.? never gets a chance.
            if (m = /(.*)(\.\).*)/.exec(url) ||
                    /(.*)(\).*)/.exec(url)) {
                url = m[1];
                rParens = m[2] + rParens;
            }
        }
        return lParens + "<a href='" + url + "'>" + url + "</a>" + rParens;
    });
}
