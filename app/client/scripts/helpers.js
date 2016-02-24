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
        return Alerts.find({active: true});
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
        console.log(data);
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
        var data = Playlists.find({"type": Session.get("type")}).fetch()[0].songs
        for(var i = 0; i < data.length; i++){
            if(data[i] === Session.get("currentSong").mid){
                if(i === data.length - 1){
                    song = Songs.findOne({"mid": data[0]});
                    Session.set("nextSong", [song])
                } else{
                    song = Songs.findOne({"mid": data[i+1]});
                    Session.set("nextSong", [song]);
                }
            }
        };
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
        return moment(Session.get("first_joined")).format("DD/MM/YYYY HH:mm:ss");
    },
    "rank": function () {
        return Session.get("rank");
    },
    loaded: function () {
        return Session.get("loaded");
    },
    likedSongs: function () {
        var likedArr = [];
        Session.get("liked").forEach(function (mid) {
            Songs.find().forEach(function (data) {
                if (data.mid === mid) {
                    likedArr.push({title: data.title, artist: data.artist});
                }
            });
        });
        return likedArr;
    },
    dislikedSongs: function () {
        var dislikedArr = [];
        Session.get("disliked").forEach(function (mid) {
            Songs.find().forEach(function (data) {
                if (data.mid === mid) {
                    dislikedArr.push({title: data.title, artist: data.artist});
                }
            });
        });
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
        return News.find().fetch().reverse();
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
    }
});

Template.room.helpers({
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
        return Chat.find({type: "global"}, {sort: {time: -1}, limit: 50}).fetch().reverse();
    },
    likes: function () {
        var playlist = Playlists.findOne({type: Session.get("type")});
        var likes = 0;
        playlist.songs.forEach(function (song) {
            if (Session.get("currentSong") && song.mid === Session.get("currentSong").mid) {
                likes = song.likes;
                return;
            }
        });
        return likes;
    },
    dislikes: function () {
        var playlist = Playlists.findOne({type: Session.get("type")});
        var dislikes = 0;
        playlist.songs.forEach(function (song) {
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
        return Rooms.findOne({type: Session.get("type")}).private === true;
    },
    currentSong: function(){
        return Session.get("currentSong");
    },
    reportSong: function(){
        Meteor.setInterval(function(){
            if($("#report-song").is(":checked")){
                Session.set("reportSong", true)
            } else { Session.set("reportSong", false) }
        }, 500);
        return Session.get("reportSong");
    },
    votes: function () {
        console.log(Rooms.findOne({type: Session.get("type")}).votes);
        return Rooms.findOne({type: Session.get("type")}).votes;
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
