Template.admin.helpers({
    queueCount: function (display) {
        var d = display.toLowerCase();
        return queues && "songs" in queues ? queues.songs.length : 0;
        var queues = Queues.findOne({type: d});
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

Template.alertsDashboard.helpers({
    "activeAlerts": function () {
        return Alerts.find({active: true});
    },
    "inactiveAlerts": function () {
        return Alerts.find({active: false});
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
        parts = location.href.split('/');
        id = parts.pop();
        type = id.toLowerCase();
        var data = Playlists.findOne({type: type});
        if (data !== undefined) {
            data.songs.map(function (song) {
                if (Session.get("currentSong") !== undefined && song.mid === Session.get("currentSong").mid) {
                    song.current = true;
                } else {
                    song.current = false;
                }
                return song;
            });
            return data.songs;
        } else {
            return [];
        }
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
            Rooms.find().forEach(function (room) {
                Playlists.find({type: room.type}).forEach(function (pl) {
                    for (var i in pl.songs) {
                        if (pl.songs[i].mid === mid) {
                            likedArr.push({title: pl.songs[i].title, artist: pl.songs[i].artist, room: room.display});
                        }
                    }
                });
            })
        });
        return likedArr;
    },
    dislikedSongs: function () {
        var dislikedArr = [];
        Session.get("disliked").forEach(function (mid) {
            Rooms.find().forEach(function (room) {
                Playlists.find({type: room.type}).forEach(function (pl) {
                    for (var i in pl.songs) {
                        if (pl.songs[i].mid === mid) {
                            dislikedArr.push({
                                title: pl.songs[i].title,
                                artist: pl.songs[i].artist,
                                room: room.display
                            });
                        }
                    }
                });
            })
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
    queues: function () {
        var queues = Queues.find({}).fetch();
        queues.map(function (queue) {
            if (Rooms.find({type: queue.type}).count() !== 1) {
                return;
            } else {
                queue.display = Rooms.findOne({type: queue.type}).display;
                return queue;
            }
        });
        return queues;
    }
});

Template.room.helpers({
    singleVideo: function () {
        return true;
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
                return "active";
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
                return "active";
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
    report: function () {
        return Session.get("reportObj");
    },
    reportSong: function () {
        return Session.get("reportSong");
    },
    reportTitle: function () {
        return Session.get("reportTitle");
    },
    reportAuthor: function () {
        return Session.get("reportAuthor");
    },
    reportDuration: function () {
        return Session.get("reportDuration");
    },
    reportAudio: function () {
        return Session.get("reportAudio");
    },
    reportAlbumart: function () {
        return Session.get("reportAlbumart");
    },
    reportOther: function () {
        return Session.get("reportOther");
    },
    currentSong: function () {
        return Session.get("currentSong");
    },
    previousSong: function () {
        return Session.get("previousSong");
    },
    currentSongR: function () {
        return Session.get("currentSongR");
    },
    previousSongR: function () {
        return Session.get("previousSongR");
    },
    reportingSong: function () {
        if (Session.get("reportPrevious")) {
            return Session.get("previousSongR");
        } else {
            return Session.get("currentSongR");
        }
    },
    votes: function () {
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

Template.stations.helpers({
    playlist: function () {
        var query = {type: Session.get("playlistToEdit").toLowerCase()};
        var playlists = Playlists.find(query).fetch();
        return playlists;
    },
    whichStation: function () {
        return Session.get("playlistToEdit");
    },
    reports: function () {
        var query = {room: Session.get("playlistToEdit").toLowerCase()};
        var reports = Reports.find(query).fetch();
        console.log(reports);
        return reports;
    }
});
