Meteor.startup(function() {
    reCAPTCHA.config({
        publickey: '6LcVxg0TAAAAAE18vBiH00UAyaJggsmLm890SjZl'
    });
});

Meteor.subscribe("queues");
Meteor.subscribe("reports");
Meteor.subscribe("chat");
Meteor.subscribe("playlists");
Meteor.subscribe("alerts");

var minterval;
var hpSound = undefined;
var songsArr = [];
var ytArr = [];
var _sound = undefined;
var parts = location.href.split('/');
var id = parts.pop();
var type = id.toLowerCase();
var resizeSeekerbarInterval;
var station_c = undefined;
var songMID;

UI.registerHelper("formatTime", function(seconds) {
    var d = moment.duration(parseInt(seconds), 'seconds');
    return d.minutes() + ":" + ("0" + d.seconds()).slice(-2);
});

/*UI.registerHelper("formatTimeFromNow", function(time) {
    var d = moment(time);
    return d.fromNow();
});*/

function getSpotifyInfo(title, cb, artist) {
    var q = "";
    q = title;
    if (artist !== undefined) {
        q += " artist:" + artist;
    }
    $.ajax({
        type: "GET",
        url: 'https://api.spotify.com/v1/search?q=' + encodeURIComponent(q) + '&type=track',
        applicationType: "application/json",
        contentType: "json",
        success: function (data) {
            cb(data);
        }
    });
}

Template.settings.events({
    "click #save-settings": function() {
        Meteor.call("updateSettings", $("#showRating").is(":checked"));
    }
});

Template.profile.helpers({
    "username": function() {
        return Session.get("username");
    },
    "first_joined": function() {
        return moment(Session.get("first_joined")).format("DD/MM/YYYY HH:mm:ss");
    },
    "rank": function() {
        return Session.get("rank");
    },
    loaded: function() {
        return Session.get("loaded");
    },
    likedSongs: function(){
        var likedArr = [];
        Session.get("liked").forEach(function(mid){
            Rooms.find().forEach(function(room){
                Playlists.find({type: room.type}).forEach(function(pl){
                    for(var i in pl.songs){
                        if(pl.songs[i].mid === mid){
                            likedArr.push({title: pl.songs[i].title, artist: pl.songs[i].artist, room: room.display});
                        }
                    }
                });
            })
        });
        return likedArr;
    }
});

Template.profile.onCreated(function() {
    var parts = Router.current().url.split('/');
    var username = parts.pop();
    Session.set("loaded", false);
    Meteor.subscribe("userProfiles", username.toLowerCase(), function() {
        if (Meteor.users.find({"profile.usernameL": username.toLowerCase()}).count() === 0) {
            window.location = "/";
        } else {
            var data = Meteor.users.findOne({"profile.usernameL": username.toLowerCase()});
            Session.set("username", data.profile.username);
            Session.set("first_joined", data.createdAt);
            Session.set("rank", data.profile.rank);
            Session.set("liked", data.profile.liked);
            Session.set("loaded", true);
        }
    });
});

Template.settings.helpers({
    username: function() {
        if (Meteor.user() !== undefined) {
            return Meteor.user().profile.username;
        } else {
            return "";
        }
    }
});

Template.settings.onCreated(function() {
    $(document).ready(function() {
        var user = Meteor.user();
        function initSettings() {
            if (user !== undefined) {
                if (user.profile.settings && user.profile.settings.showRating === true) {
                    function setChecked() {
                        $("#showRating").prop("checked", true);
                        if (!$("#showRating").prop("checked")) {
                            Meteor.setTimeout(function() {
                                setChecked();
                            }, 100);
                        }
                    }
                    setChecked();
                }
            } else {
                Meteor.setTimeout(function() {
                    initSettings();
                }, 500);
            }
        }
        initSettings();
    });
});

curPath=function(){var c=window.location.pathname;var b=c.slice(0,-1);var a=c.slice(-1);if(b==""){return"/"}else{if(a=="/"){return b}else{return c}}};

Handlebars.registerHelper('active', function(path) {
    return curPath() == path ? 'active' : '';
});

Template.header.helpers({
    currentUser: function() {
        return Meteor.user();
    },
    isAdmin: function() {
        if (Meteor.user() && Meteor.user().profile) {
            return Meteor.user().profile.rank === "admin";
        } else {
            return false;
        }
    }
});

Template.header.events({
    "click .logout": function(e){
        e.preventDefault();
        Meteor.logout();
        if (hpSound !== undefined) {
            hpSound.stop();
        }
    }
});

Template.register.events({
    "submit form": function(e){
        e.preventDefault();
        var username = e.target.registerUsername.value;
        var email = e.target.registerEmail.value;
        var password = e.target.registerPassword.value;
        var captchaData = grecaptcha.getResponse();
        Meteor.call("createUserMethod", {username: username, email: email, password: password}, captchaData, function(err, res) {
            grecaptcha.reset();

            if (err) {
                console.log(err);
                var errAlert = $('<div class="alert alert-danger" role="alert"><strong>Oh Snap!</strong> ' + err.reason + '</div>');
                $("#login").after(errAlert);
                errAlert.fadeOut(20000, function() {
                    errAlert.remove();
                });
            } else {
                Meteor.loginWithPassword(username, password);
                Accounts.onLogin(function(){
                    window.location.href = "/";
                })
            }
        });
    },

    "click #github-login": function(){
        Meteor.loginWithGithub({loginStyle: "redirect"});
    }
});

Template.login.events({
    "submit form": function(e){
        e.preventDefault();
        var username = e.target.loginUsername.value;
        var password = e.target.loginPassword.value;
        Meteor.loginWithPassword(username, password);
        Accounts.onLogin(function(){
            window.location.href = "/";
        })
        Accounts.onLoginFailure(function(){
            $("#login-form input").css("background-color","indianred");
            $("#login-form input").on("click",function(){
                $("#login-form input").css({
                    "-webkit-appearance": "none",
                    "   -moz-appearance": "none",
                    "        appearance": "none",
                    "outline": "0",
                    "border": "1px solid rgba(255, 255, 255, 0.4)",
                    "background-color": "rgba(255, 255, 255, 0.2)",
                    "width": "304px",
                    "border-radius": "3px",
                    "padding": "10px 15px",
                    "margin": "0 auto 10px auto",
                    "display": "block",
                    "text-align": "center",
                    "font-size": "18px",
                    "color": "white",
                    "-webkit-transition-duration": "0.25s",
                    "        transition-duration": "0.25s",
                    "font-weight": "300"
                });
                $("#login-form input:focus").css({
                    "width": "354px",
                    "color": "white"
                })
                $("#login-form input").on("blur", function(){
                    $(this).css("width", "304px");
                })
            })
        });
    },

    "click #github-login": function(){
        Meteor.loginWithGithub({loginStyle: "redirect"});
    }
});


Template.dashboard.helpers({
    rooms: function() {
        return Rooms.find({});
    },
    currentSong: function() {
        var type = this.type;
        var room = Rooms.findOne({type: type});
        if (room !== undefined) {
            return room.currentSong;
        } else {
            return {};
        }
    }
});

Template.dashboard.onCreated(function() {
    if (_sound !== undefined) _sound.stop();
    if (minterval !== undefined) {
        Meteor.clearInterval(minterval);
    }
    if (resizeSeekerbarInterval !== undefined) {
        Meteor.clearInterval(resizeSeekerbarInterval);
        resizeSeekerbarInterval = undefined;
    }
    if (station_c !== undefined) {
        station_c.stop();
    }
    Session.set("type", undefined);
});

function executeCommand(command, params){
    if (command === "help" || command === "commands") {
        $('#helpModal').modal('show');
        return true;
    } else if (command === "volume") {
        if (params.length === 1) {
            var volume = Number(params[0]);
            if (volume >= 0 || volume <= 100) {
                if (volume === 0) {
                    $("#volume-icon").removeClass("fa-volume-down").addClass("fa-volume-off")
                } else {
                    $("#volume-icon").removeClass("fa-volume-off").addClass("fa-volume-down")
                }

                $("#volume-slider").slider("setValue", volume);

                if (yt_player !== undefined) {
                    yt_player.setVolume(volume);
                    localStorage.setItem("volume", volume);
                } else if (_sound !== undefined) {
                    //_sound
                    var volume = volume / 100;
                    _sound.setVolume(volume);
                    localStorage.setItem("volume", volume * 100);
                }
                return true;
            }
        }
    }
}

function sendMessage() {
    var message = $("#chat-input").val();
    if (message.length > 0 && message[0] !== " ") {
        if (message[0] === "/") {
            message = message.split("");
            message.shift();
            message = message.join("");
            var params = message.split(" ");
            var command = params.shift();
            if (executeCommand(command, params)) {
                $("#chat-input").val("");
            } else {
                $("#chat-input").val("");
            }
        } else {
            Meteor.call("sendMessage", Session.get("type"), message, function (err, res) {
                console.log(err, res);
                if (res) {
                    $("#chat-input").val("");
                }
            });
        }
    }
}

Template.room.events({
    "click #sync": function() {
        if (Session.get("currentSong") !== undefined) {
            var room = Rooms.findOne({type: Session.get("type")});
            if (room !== undefined) {
                var timeIn = Date.now() - Session.get("currentSong").started - room.timePaused;
                console.log(timeIn);
                var skipDuration = Number(Session.get("currentSong").skipDuration) | 0;
                if (yt_player !== undefined) {
                    yt_player.seekTo(skipDuration + timeIn / 1000);
                }
                else if (_sound !== undefined) {
                    _sound.seekTo(skipDuration * 1000 + timeIn);
                }
            }
        }
    },
    "click #side-panel": function(e) {
        Meteor.setTimeout(function() {
        var elem = document.getElementById('chat');
        elem.scrollTop = elem.scrollHeight;;
        }, 1);
    },
    "click #submit": function() {
        sendMessage();
    },
    "keyup #chat-input": function(e) {
        if (e.type == "keyup" && e.which == 13) {
            e.preventDefault();
            sendMessage()
        }
    },
    "click #like": function(e) {
        $("#like").blur();
        Meteor.call("likeSong", Session.get("currentSong").mid);
    },
    "click #dislike": function(e) {
        $("#dislike").blur();
        Meteor.call("dislikeSong", Session.get("currentSong").mid);
    },
    "click #vote-skip": function(){
        Meteor.call("voteSkip", type, function(err, res) {
            $("#vote-skip").attr("disabled", true);
        });
        songMID = Session.get("currentSong").mid;
    },
    "click #report-prev": function(e) {
        if (Session.get("previousSong") !== undefined) {
            Session.set("reportPrevious", true);
            $("#report-prev").prop("disabled", true);
            $("#report-curr").prop("disabled", false);
        }
    },
    "click #report-curr": function(e) {
        Session.set("reportPrevious", false);
        $("#report-prev").prop("disabled", false);
        $("#report-curr").prop("disabled", true);
    },
    "click #report-modal": function() {
        Session.set("currentSongR", Session.get("currentSong"));
        Session.set("previousSongR", Session.get("previousSong"));
    },
    "click #add-song-button": function(e){
        e.preventDefault();
        parts = location.href.split('/');
        var roomType = parts.pop();
        var genre = roomType.toLowerCase();
        var type = $("#type").val();
        id = $("#id").val();
        var title = $("#title").val();
        var artist = $("#artist").val();
        var img = $("#img").val();
        var songData = {type: type, id: id, title: title, artist: artist, img: img};
        if(Playlists.find({type: genre, "songs.id": songData.id}, {songs: {$elemMatch: {id: songData.id}}}).count() !== 0) {
            $("<div class='alert alert-danger alert-dismissible' role='alert' style='margin-bottom: 0'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'><i class='fa fa-times'></i></span></button><strong>Song not added.</strong> This song is already in the playlist.</div>").prependTo($(".landing")).delay(7000).fadeOut(1000, function() { $(this).remove(); });
        } else if(Queues.find({type: genre, "songs.id": songData.id}, {songs: {$elemMatch: {id: songData.id}}}).count() !== 0) {
           $("<div class='alert alert-danger alert-dismissible' role='alert' style='margin-bottom: 0'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'><i class='fa fa-times'></i></span></button><strong>Song not added.</strong> This song has already been requested.</div>").prependTo($(".landing")).delay(7000).fadeOut(1000, function() { $(this).remove(); });
        } else{
            Meteor.call("addSongToQueue", genre, songData, function(err, res) {
                console.log(err, res);
                if (err) {
                    $("<div class='alert alert-danger alert-dismissible' role='alert' style='margin-bottom: 0'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'><i class='fa fa-times'></i></span></button><strong>Song not added.</strong> Something went wrong.</div>").prependTo($(".landing")).delay(7000).fadeOut(1000, function() { $(this).remove(); });
                } else {
                    $("<div class='alert alert-success alert-dismissible' role='alert' style='margin-bottom: 0'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'><i class='fa fa-times'></i></span></button><strong>Song added.</strong> Your song has been added to the queue.</div>").prependTo($(".landing")).delay(7000).fadeOut(1000, function() { $(this).remove(); });
                }
            });
        }
        $("#close-modal-a").click();
    },
    "click #toggle-video": function(e){
        e.preventDefault();
        if (Session.get("mediaHidden")) {
            $("#media-container").removeClass("hidden");
            $("#toggle-video").text("Hide video");
            Session.set("mediaHidden", false);
        } else {
            $("#media-container").addClass("hidden");
            $("#toggle-video").text("Show video");
            Session.set("mediaHidden", true);
        }
    },
    "click #return": function(e){
        $("#add-info").hide();
        $("#search-info").show();
    },
    "click #search-song": function(){
        $("#song-results").empty();
        var search_type = $("#search_type").val();
        if (search_type === "YouTube") {
            $.ajax({
                type: "GET",
                url: "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" +  $("#song-input").val() + "&key=AIzaSyAgBdacEWrHCHVPPM4k-AFM7uXg-Q__YXY",
                applicationType: "application/json",
                contentType: "json",
                success: function(data){
                    for(var i in data.items){
                        $("#song-results").append("<p>" + data.items[i].snippet.title + "</p>");
                        ytArr.push({title: data.items[i].snippet.title, id: data.items[i].id.videoId});
                    }
                    $("#song-results p").click(function(){
                        $("#search-info").hide();
                        $("#add-info").show();
                        var title = $(this).text();
                        for(var i in ytArr){
                            if(ytArr[i].title === title){
                                var songObj = {
                                    id: ytArr[i].id,
                                    title: ytArr[i].title,
                                    type: "youtube"
                                };
                                $("#title").val(songObj.title);
                                $("#artist").val("");
                                $("#id").val(songObj.id);
                                $("#type").val("YouTube");
                                getSpotifyInfo(songObj.title.replace(/\[.*\]/g, ""), function(data) {
                                    if (data.tracks.items.length > 0) {
                                        $("#title").val(data.tracks.items[0].name);
                                        var artists = [];
                                        $("#img").val(data.tracks.items[0].album.images[1].url);
                                        data.tracks.items[0].artists.forEach(function(artist) {
                                            artists.push(artist.name);
                                        });
                                        $("#artist").val(artists.join(", "));
                                    }
                                });
                            }
                        }
                    })
                }
            })
        } else if (search_type === "SoundCloud") {
            SC.get('/tracks', { q: $("#song-input").val()}, function(tracks) {
                for(var i in tracks){
                    $("#song-results").append("<p>" + tracks[i].title + "</p>")
                    songsArr.push({title: tracks[i].title, id: tracks[i].id, duration: tracks[i].duration / 1000});
                }
                $("#song-results p").click(function(){
                    $("#search-info").hide();
                    $("#add-info").show();
                    var title = $(this).text();
                    for(var i in songsArr){
                        if(songsArr[i].title === title){
                            var id = songsArr[i].id;
                            var duration = songsArr[i].duration;
                            var songObj = {
                                title: songsArr[i].title,
                                id: id,
                                duration: duration,
                                type: "soundcloud"
                            }
                            $("#title").val(songObj.title);
                            // Set ID field
                            $("#id").val(songObj.id);
                            $("#type").val("SoundCloud");
                            getSpotifyInfo(songObj.title.replace(/\[.*\]/g, ""), function(data) {
                                if (data.tracks.items.length > 0) {
                                    $("#title").val(data.tracks.items[0].name);
                                    var artists = [];
                                    data.tracks.items[0].artists.forEach(function(artist) {
                                        artists.push(artist.name);
                                    });
                                    $("#artist").val(artists.join(", "));
                                }
                                // Set title field again if possible
                                // Set artist if possible
                            });
                        }
                    }
                })
            });
        }
    },
    "click #close-modal-a": function(){
        $("#search-info").show();
        $("#add-info").hide();
    },
    "click #volume-icon": function(){
        var volume = 0;
        var slider = $("#volume-slider").slider();
        $("#volume-icon").removeClass("fa-volume-down").addClass("fa-volume-off")
        if (yt_player !== undefined) {
            yt_player.setVolume(volume);
            localStorage.setItem("volume", volume);
            $("#volume-slider").slider("setValue", volume);
        } else if (_sound !== undefined) {
            _sound.setVolume(volume);
            localStorage.setItem("volume", volume);
            $("#volume-slider").slider("setValue", volume);
        }
    },
    "click #play": function() {
        Meteor.call("resumeRoom", type);
    },
    "click #pause": function() {
        Meteor.call("pauseRoom", type);
    },
    "click #skip": function() {
        Meteor.call("skipSong", type);
    },
    "click #shuffle": function() {
        Meteor.call("shufflePlaylist", type);
    },
    "change input": function(e) {
        if (e.target && e.target.id) {
            var partsOfId = e.target.id.split("-");
            partsOfId[1] = partsOfId[1].charAt(0).toUpperCase() + partsOfId[1].slice(1);
            var camelCase = partsOfId.join("");
            Session.set(camelCase, e.target.checked);
        }
    },
    "click #report-song-button": function() {
        var report = {};
        report.reportSongB = $("#report-song").is(":checked");
        report.reportTitleB = $("#report-title").is(":checked");
        report.reportAuthorB = $("#report-author").is(":checked");
        report.reportDurationB = $("#report-duration").is(":checked");
        report.reportAudioB = $("#report-audio").is(":checked");
        report.reportAlbumartB = $("#report-albumart").is(":checked");
        report.reportOtherB = $("#report-other").is(":checked");

        if (report.reportSongB) {
            report.reportSong = {};
            report.reportSong.notPlayingB = $("#report-song-not-playing").is(":checked");
            report.reportSong.doesNotExistB = $("#report-song-does-not-exist").is(":checked");
            report.reportSong.otherB = $("#report-song-other").is(":checked");
            if (report.reportSong.otherB) {
                report.reportSong.other = $("#report-song-other-ta").val();
            }
        }
        if (report.reportTitleB) {
            report.reportTitle = {};
            report.reportTitle.incorrectB = $("#report-title-incorrect").is(":checked");
            report.reportTitle.inappropriateB = $("#report-title-inappropriate").is(":checked");
            report.reportTitle.otherB = $("#report-title-other").is(":checked");
            if (report.reportTitle.otherB) {
                report.reportTitle.other = $("#report-title-other-ta").val();
            }
        }
        if (report.reportAuthorB) {
            report.reportAuthor = {};
            report.reportAuthor.incorrectB = $("#report-author-incorrect").is(":checked");
            report.reportAuthor.inappropriateB = $("#report-author-inappropriate").is(":checked");
            report.reportAuthor.otherB = $("#report-author-other").is(":checked");
            if (report.reportAuthor.otherB) {
                report.reportAuthor.other = $("#report-author-other-ta").val();
            }
        }
        if (report.reportDurationB) {
            report.reportDuration = {};
            report.reportDuration.longB = $("#report-duration-incorrect").is(":checked");
            report.reportDuration.shortB = $("#report-duration-inappropriate").is(":checked");
            report.reportDuration.otherB = $("#report-duration-other").is(":checked");
            if (report.reportDuration.otherB) {
                report.reportDuration.other = $("#report-duration-other-ta").val();
            }
        }
        if (report.reportAudioB) {
            report.reportAudio = {};
            report.reportAudio.inappropriate = $("#report-audio-inappropriate").is(":checked");
            report.reportAudio.notPlayingB = $("#report-audio-incorrect").is(":checked");
            report.reportAudio.otherB = $("#report-audio-other").is(":checked");
            if (report.reportAudio.otherB) {
                report.reportAudio.other = $("#report-audio-other-ta").val();
            }
        }
        if (report.reportAlbumartB) {
            report.reportAlbumart = {};
            report.reportAlbumart.incorrectB = $("#report-albumart-incorrect").is(":checked");
            report.reportAlbumart.inappropriateB = $("#report-albumart-inappropriate").is(":checked");
            report.reportAlbumart.notShowingB = $("#report-albumart-inappropriate").is(":checked");
            report.reportAlbumart.otherB = $("#report-albumart-other").is(":checked");
            if (report.reportAlbumart.otherB) {
                report.reportAlbumart.other = $("#report-albumart-other-ta").val();
            }
        }
        if (report.reportOtherB) {
            report.other = $("#report-other-ta").val();
        }
        Meteor.call("submitReport", report, Session.get("id"), function() {
            $("#close-modal-r").click();
        });
    }
});

Template.room.onRendered(function() {
    $(document).ready(function() {
        function makeSlider(){
            var slider = $("#volume-slider").slider();
            var volume = Number(localStorage.getItem("volume"));
            $("#volume-slider").slider("setValue", volume);
            if (slider.length === 0) {
                Meteor.setTimeout(function() {
                    makeSlider();
                }, 500);
            } else {
                if (volume === 0) {
                    $("#volume-icon").removeClass("fa-volume-down").addClass("fa-volume-off")
                } else {
                    $("#volume-icon").removeClass("fa-volume-off").addClass("fa-volume-down")
                }
                slider.on("slide", function(val) {
                    if (val.value === 0) {
                        $("#volume-icon").removeClass("fa-volume-down").addClass("fa-volume-off")
                    } else {
                        $("#volume-icon").removeClass("fa-volume-off").addClass("fa-volume-down")
                    }

                    if (yt_player !== undefined) {
                        yt_player.setVolume(val.value);
                        localStorage.setItem("volume", val.value);
                    } else if (_sound !== undefined) {
                        //_sound
                        var volume = val.value / 100;
                        _sound.setVolume(volume);
                        localStorage.setItem("volume", val.value);
                    }
                });
            }
        }
        makeSlider();
    });
});

Template.alerts.helpers({
    alerts: function() {
        return Alerts.find({active: true});
    }
});

Template.room.helpers({
    chat: function() {
        Meteor.setTimeout(function() {
            var elem = document.getElementById('chat');
            if (elem !== undefined && elem !== null) {
                elem.scrollTop = elem.scrollHeight;
            }
        }, 100);
        return Chat.find({type: Session.get("type")}, {sort: {time: -1}, limit: 50 }).fetch().reverse();
    },
    likes: function() {
        var playlist = Playlists.findOne({type: Session.get("type")});
        var likes = 0;
        playlist.songs.forEach(function(song) {
            if (Session.get("currentSong") && song.mid === Session.get("currentSong").mid) {
                likes = song.likes;
                return;
            }
        });
        return likes;
    },
    dislikes: function() {
        var playlist = Playlists.findOne({type: Session.get("type")});
        var dislikes = 0;
        playlist.songs.forEach(function(song) {
            if (Session.get("currentSong") && song.mid === Session.get("currentSong").mid) {
                dislikes = song.dislikes;
                return;
            }
        });
        return dislikes;
    },
    liked: function() {
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
    disliked: function() {
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
    type: function() {
        var parts = location.href.split('/');
        var id = parts.pop().toLowerCase();
        return Rooms.findOne({type: id}).display;
    },
    users: function() {
        var parts = location.href.split('/');
        var id = parts.pop().toLowerCase();
        return Rooms.findOne({type: id}).users;
    },
    title: function(){
        return Session.get("title");
    },
    artist: function(){
        return Session.get("artist");
    },
    loaded: function() {
        return Session.get("loaded");
    },
    isAdmin: function() {
        if (Meteor.user() && Meteor.user().profile) {
            return Meteor.user().profile.rank === "admin";
        } else {
            return false;
        }
    },
    paused: function() {
        return Session.get("state") === "paused";
    },
    report: function() {
        return Session.get("reportObj");
    },
    reportSong: function() {
        return Session.get("reportSong");
    },
    reportTitle: function() {
        return Session.get("reportTitle");
    },
    reportAuthor: function() {
        return Session.get("reportAuthor");
    },
    reportDuration: function() {
        return Session.get("reportDuration");
    },
    reportAudio: function() {
        return Session.get("reportAudio");
    },
    reportAlbumart: function() {
        return Session.get("reportAlbumart");
    },
    reportOther: function() {
        return Session.get("reportOther");
    },
    currentSong: function() {
        return Session.get("currentSong");
    },
    previousSong: function() {
        return Session.get("previousSong");
    },
    currentSongR: function() {
        return Session.get("currentSongR");
    },
    previousSongR: function() {
        return Session.get("previousSongR");
    },
    reportingSong: function() {
        if (Session.get("reportPrevious")) {
            return Session.get("previousSongR");
        } else {
            return Session.get("currentSongR");
        }
    },
    votes: function(){
        return Rooms.findOne({type: Session.get("type")}).votes;
    }
});

var allAlertSub = undefined;

Template.alertsDashboard.onCreated(function() {
    if (allAlertSub === undefined) {
        allAlertSub = Meteor.subscribe("allAlerts");
    }
});

Template.alertsDashboard.helpers({
    "activeAlerts": function() {
        return Alerts.find({active: true});
    },
    "inactiveAlerts": function() {
        return Alerts.find({active: false});
    }
});

Template.alertsDashboard.events({
    "click #calart-create": function() {
        Meteor.call("addAlert", $("#calert-description").val(), $("#calert-priority").val().toLowerCase(), function (err, res) {
            if (err) {
                alert("Error " + err.error + ": " + err.reason);
            } else {
                $("#calert-description").val("");
            }
        });
    },
    "click #ralert-button": function() {
        Meteor.call("removeAlerts");
    }
});

Template.admin.helpers({
  queueCount: function(display) {
    display = display.toLowerCase();
    var queues = Queues.findOne({type:display});
    return queues && "songs" in queues ? queues.songs.length : 0;
  },
  queues: function() {
    var queues = Queues.find({}).fetch();
    queues.map(function(queue) {
      return queue;
    });
    return queues;
  },
  users: function(){
      Meteor.call("getUserNum", function(err, num){
          if(err){
              console.log(err);
          }
          Session.set("userNum", num);
      });
      return Session.get("userNum");
  },
  playlists: function() {
      var playlists = Playlists.find({}).fetch();
      playlists.map(function(playlist) {
          if (Rooms.find({type: playlist.type}).count() !== 1) {
              return;
          } else {
              playlist.display = Rooms.findOne({type: playlist.type}).display;
              return playlist;
          }
      });
      return playlists;
  }/*,
  reports: function() {
      var reports = Reports.find({}).fetch();
      reports.findOne(
        {
          $eq: [

          ]
        }
      )
  }*/
});

Template.stations.helpers({
    queues: function() {
        var queues = Queues.find({}).fetch();
        queues.map(function(queue) {
            if (Rooms.find({type: queue.type}).count() !== 1) {
                return;
            } else {
                queue.display = Rooms.findOne({type: queue.type}).display;
                return queue;
            }
        });
        return queues;
    },
    playlists: function() {
        var playlists = Playlists.find({}).fetch();
        playlists.map(function(playlist) {
            if (Rooms.find({type: playlist.type}).count() !== 1) {
                return;
            } else {
                playlist.display = Rooms.findOne({type: playlist.type}).display;
                return playlist;
            }
        });
        return playlists;
    }
});

var yt_player = undefined;
var _sound = undefined;
var previewEndSongTimeout = undefined;

Template.stations.events({
    "click .preview-button": function(e){
        Session.set("song", this);
    },
    "click #previewImageButton": function() {
        $("#preview-image").attr("src", Session.get("song").img);
    },
    "click .edit-queue-button": function(e){
        Session.set("song", this);
        Session.set("genre", $(e.toElement).data("genre"));
        Session.set("type", "queue");
        $("#type").val(this.type);
        $("#mid").val(this.mid);
        $("#artist").val(this.artist);
        $("#title").val(this.title);
        $("#img").val(this.img);
        $("#id").val(this.id);
        $("#likes").val(this.likes);
        $("#dislikes").val(this.dislikes);
        $("#duration").val(this.duration);
        $("#skip-duration").val(this.skipDuration);
    },
    "click .edit-playlist-button": function(e){
        Session.set("song", this);
        Session.set("genre", $(e.toElement).data("genre"));
        Session.set("type", "playlist");
        $("#type").val(this.type);
        $("#mid").val(this.mid);
        $("#artist").val(this.artist);
        $("#title").val(this.title);
        $("#img").val(this.img);
        $("#id").val(this.id);
        $("#likes").val(this.likes);
        $("#dislikes").val(this.dislikes);
        $("#duration").val(this.duration);
        $("#skip-duration").val(this.skipDuration);
    },
    "click #rreset_confirm": function(e){
        Meteor.call("resetRating");
    },
    "click .add-song-button": function(e){
        var genre = $(e.toElement).data("genre") || $(e.toElement).parent().data("genre");
        Meteor.call("addSongToPlaylist", genre, this);
    },
    "click .deny-song-button": function(e){
        var genre = $(e.toElement).data("genre") || $(e.toElement).parent().data("genre");
        Meteor.call("removeSongFromQueue", genre, this.mid);
    },
    "click .remove-song-button": function(e){
        var genre = $(e.toElement).data("genre") || $(e.toElement).parent().data("genre");
        Meteor.call("removeSongFromPlaylist", genre, this.mid);
    },
    "click #play": function() {
        $("#play").attr("disabled", true);
        $("#stop").attr("disabled", false);
        var song = Session.get("song");
        var id = song.id;
        var type = song.type;
        var volume = localStorage.getItem("volume") || 20;

        if (type === "YouTube") {
            if (yt_player === undefined) {
                yt_player = new YT.Player("previewPlayer", {
                    height: 540,
                    width: 568,
                    videoId: id,
                    playerVars: {autoplay: 1, controls: 0, iv_load_policy: 3, showinfo: 0},
                    events: {
                        'onReady': function(event) {
                            event.target.seekTo(Number(song.skipDuration));
                            event.target.playVideo();
                            event.target.setVolume(volume);
                        },
                        'onStateChange': function(event){
                            if (event.data == YT.PlayerState.PAUSED) {
                                event.target.playVideo();
                            }
                            if (event.data == YT.PlayerState.PLAYING) {
                                $("#play").attr("disabled", true);
                                $("#stop").attr("disabled", false);
                            } else {
                                $("#play").attr("disabled", false);
                                $("#stop").attr("disabled", true);
                            }
                        }
                    }
                });
            } else {
                yt_player.loadVideoById(id);
                yt_player.seekTo(Number(song.skipDuration));
            }
            $("#previewPlayer").show();
        } else if (type === "SoundCloud") {
            SC.stream("/tracks/" + song.id, function(sound) {
                _sound = sound;
                sound.setVolume(volume / 100);
                sound.play();
            });
        }

        if (previewEndSongTimeout !== undefined) {
            Meteor.clearTimeout(previewEndSongTimeout);
        }
        Meteor.setTimeout(function() {
            if (yt_player !== undefined) {
                yt_player.stopVideo();
            }
            if (_sound !== undefined) {
                _sound.stop();
            }
            $("#play").attr("disabled", false);
            $("#stop").attr("disabled", true);
            $("#previewPlayer").hide();
        }, song.duration * 1000);
    },
    "click #stop": function() {
        $("#play").attr("disabled", false);
        $("#stop").attr("disabled", true);
        if (previewEndSongTimeout !== undefined) {
            Meteor.clearTimeout(previewEndSongTimeout);
        }
        if (yt_player !== undefined) {
            yt_player.stopVideo();
        }
        if (_sound !== undefined) {
            _sound.stop();
        }
    },
    "click #forward": function() {
        console.log(yt_player);
        console.log(Session.get("song"));
        var error = false;
        if (yt_player !== undefined) {
            if (yt_player.getDuration() < Session.get("song").duration) {
                alert("The duration of the YouTube video is smaller than the duration.");
                error = true;
            } else {
                yt_player.seekTo(Session.get("song").duration - 10);
            }
        }
        if (_sound !== undefined) {
            _sound.seekTo((Session.get("song").duration - 10) * 1000);
        }
        if (!error) {
            if (previewEndSongTimeout !== undefined) {
                Meteor.clearTimeout(previewEndSongTimeout);
            }
            Meteor.setTimeout(function() {
                if (yt_player !== undefined) {
                    yt_player.stopVideo();
                }
                if (_sound !== undefined) {
                    _sound.stop();
                }
                $("#play").attr("disabled", false);
                $("#stop").attr("disabled", true);
                $("#previewPlayer").hide();
            }, 10000);
        }
    },
    "click #croom_create": function() {
        Meteor.call("createRoom", $("#croom_display").val(), $("#croom_tag").val(), function (err, res) {
            if (err) {
                alert("Error " + err.error + ": " + err.reason);
            } else {
                window.location = "/" + $("#croom_tag").val();
            }
        });
    },
    "click #get-spotify-info": function() {
        var search = $("#title").val();
        var artistName = $("#artist").val();
        getSpotifyInfo(search, function(data) {
            for(var i in data){
                for(var j in data[i].items){
                    if(search.indexOf(data[i].items[j].name) !== -1 && artistName.indexOf(data[i].items[j].artists[0].name) !== -1){
                        $("#img").val(data[i].items[j].album.images[1].url);
                        $("#duration").val(data[i].items[j].duration_ms / 1000);
                        return;
                    }
                }
            }
        }, artistName);
    },
    "click #save-song-button": function() {
        var newSong = {};
        newSong.id = $("#id").val();
        newSong.likes = Number($("#likes").val());
        newSong.dislikes = Number($("#dislikes").val());
        newSong.title = $("#title").val();
        newSong.artist = $("#artist").val();
        newSong.img = $("#img").val();
        newSong.type = $("#type").val();
        newSong.duration = Number($("#duration").val());
        newSong.skipDuration = $("#skip-duration").val();
        if(newSong.skipDuration === undefined){
            newSong.skipDuration = 0;
        };
        if (Session.get("type") === "playlist") {
            Meteor.call("updatePlaylistSong", Session.get("genre"), Session.get("song"), newSong, function() {
                $('#editModal').modal('hide');
            });
        } else {
            Meteor.call("updateQueueSong", Session.get("genre"), Session.get("song"), newSong, function() {
                $('#editModal').modal('hide');
            });
        }
    },
    "click .delete-room": function(){
        var typeDel = $(this)[0].type;
        Meteor.call("deleteRoom", typeDel);
    }
});

Template.stations.onCreated(function() {
    var tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
});

Template.stations.onRendered(function() {
    $("#previewModal").on("hidden.bs.modal", function() {
        if (previewEndSongTimeout !== undefined) {
            Meteor.clearTimeout(previewEndSongTimeout);
        }
        $("#play").attr("disabled", false);
        $("#stop").attr("disabled", true);
        if (yt_player !== undefined) {
            $("#previewPlayer").hide();
            yt_player.seekTo(0);
            yt_player.stopVideo();
        }
        if (_sound !== undefined) {
            _sound.stop();
        }
    });
    $(document).ready(function() {
        function makeSlider(){
            var slider = $("#volume-slider").slider();
            var volume = localStorage.getItem("volume") || 20;
            $("#volume-slider").slider("setValue", volume);
            if (slider.length === 0) {
                Meteor.setTimeout(function() {
                    makeSlider();
                }, 500);
            } else {
                slider.on("slide", function(val) {
                    localStorage.setItem("volume", val.value);
                    if (yt_player !== undefined) {
                        yt_player.setVolume(val.value);
                    } else if (_sound !== undefined) {
                        var volume = val.value / 100;
                        _sound.setVolume(volume);
                    }
                });
            }
        }
        makeSlider();
    });
});

Template.playlist.helpers({
    playlist_songs: function() {
        parts = location.href.split('/');
        id = parts.pop();
        type = id.toLowerCase();
        var data = Playlists.findOne({type: type});
        if (data !== undefined) {
            data.songs.map(function(song) {
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

Template.playlist.events({
    "keyup #search-playlist": function(){
        console.log($("#search-playlist").val());
        if($("#search-playlist").val().length === 0){
            $(".pl-item").show();
        } else {
            $(".pl-item").hide();
            var input = $("#search-playlist").val().toLowerCase();
            $(".pl-item strong").each(function(i, el){
                if($(el).text().toLowerCase().indexOf(input) !== -1){
                    $(el).parent(".pl-item").show();
                }
            })
            $(".pl-item #pl-artist").each(function(i, el){
                if($(el).text().toLowerCase().indexOf(input) !== -1){
                    $(el).parent(".pl-item").show();
                }
            })
        }
    }
})

Meteor.subscribe("rooms");

Template.room.onCreated(function () {
    Session.set("reportSong", false);
    Session.set("reportTitle", false);
    Session.set("reportAuthor", false);
    Session.set("reportDuration", false);
    Session.set("reportAudio", false);
    Session.set("reportAlbumart", false);
    Session.set("reportOther", false);
    if (resizeSeekerbarInterval !== undefined) {
        Meteor.clearInterval(resizeSeekerbarInterval);
        resizeSeekerbarInterval = undefined;
    }
    yt_player = undefined;
    _sound = undefined;
    Session.set("videoHidden", false);
    var tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    var currentSong = undefined;
    var currentSongR = undefined;

    function getTimeElapsed() {
        if (currentSong !== undefined) {
            var room = Rooms.findOne({type: type});
            if (room !== undefined) {
                return Date.now() - currentSong.started - room.timePaused;
            }
        }
        return 0;
    }

    function getSongInfo(songData){
        Session.set("title", songData.title);
        Session.set("artist", songData.artist);
        Session.set("id", songData.id);
        $("#song-img").attr("src", songData.img);
        Session.set("duration", parseInt(songData.duration));
        var d = moment.duration(parseInt(songData.duration), 'seconds');
        $("#time-total").text(d.minutes() + ":" + ("0" + d.seconds()).slice(-2));
        Session.set("timeFormat", d.minutes() + ":" + ("0" + d.seconds()).slice(-2));
    }

    function resizeSeekerbar() {
        if (Session.get("state") === "playing") {
            $("#seeker-bar").width(((getTimeElapsed() / 1000) / Session.get("duration") * 100) + "%");
        }
    }

    function startSong() {
        $("#time-elapsed").text("0:00");
        $("#vote-skip").attr("disabled", false);
        if (currentSong !== undefined) {
            if (_sound !== undefined) _sound.stop();
            if (yt_player !== undefined && yt_player.stopVideo !== undefined) yt_player.stopVideo();

            var volume = localStorage.getItem("volume") || 20;

            if (currentSong.type === "SoundCloud") {
                if ($("#soundcloud-image").length !== 1) {
                    //$("#media-container").append('<img alt="Not loading" src="/soundcloud-image.png" class="embed-responsive-item" id="soundcloud-image" />');
                    $("#media-container").append('<h1 id="soundcloud-image">We have temporarily disabled the playing of SoundCloud songs. We are sorry for this inconvenience.</h1>');
                }
                if ($("#player").length === 1) {
                    $("#player").hide();
                }
                $("#soundcloud-image").show();
                //getSongInfo(currentSong);
                /*SC.stream("/tracks/" + currentSong.id, function(sound){
                    _sound = sound;
                    sound.setVolume(volume / 100);
                    sound.play();
                    var interval = setInterval(function() {
                        if (sound.getState() === "playing") {
                            sound.seek(getTimeElapsed());
                            window.clearInterval(interval);
                        }
                    }, 200);
                    Session.set("duration", parseInt(currentSong.duration));
                    var d = moment.duration(parseInt(currentSong.duration), 'seconds');
                    $("#time-total").text(d.minutes() + ":" + ("0" + d.seconds()).slice(-2));
                    resizeSeekerbar();
                });*/
            } else {
                if ($("#player").length !== 1) {
                    $("#media-container").append('<div id="player" class="embed-responsive-item"></div>');
                }
                if ($("#soundcloud-image").length === 1) {
                    $("#soundcloud-image").hide();
                }
                $("#player").show();
                if (yt_player === undefined) {
                    yt_player = new YT.Player("player", {
                        height: 540,
                        width: 960,
                        videoId: currentSong.id,
                        playerVars: {controls: 0, iv_load_policy: 3, rel: 0, showinfo: 0},
                        events: {
                            'onReady': function(event) {
                                if(currentSong.skipDuration === undefined){
                                    currentSong.skipDuration = 0;
                                }
                                event.target.seekTo(Number(currentSong.skipDuration) + getTimeElapsed() / 1000);
                                event.target.playVideo();
                                event.target.setVolume(volume);
                                resizeSeekerbar();
                            },
                            'onStateChange': function(event){
                                if (event.data == YT.PlayerState.PAUSED && Session.get("state") === "playing") {
                                    event.target.seekTo(Number(currentSong.skipDuration) + getTimeElapsed() / 1000);
                                    event.target.playVideo();
                                }
                                if (event.data == YT.PlayerState.PLAYING && Session.get("state") === "paused") {
                                    event.target.seekTo(Number(currentSong.skipDuration) + getTimeElapsed() / 1000);
                                    event.target.pauseVideo();
                                }
                            }
                        }
                    });
                } else {
                    yt_player.loadVideoById(currentSong.id);
                    if(currentSong.skipDuration === undefined){
                        currentSong.skipDuration = 0;
                    }
                    yt_player.seekTo(Number(currentSong.skipDuration) + getTimeElapsed() / 1000);
                }

                getSongInfo(currentSong);
            }
        }
    }

    Session.set("loaded", false);
    Meteor.subscribe("rooms", function() {
        var parts = location.href.split('/');
        var id = parts.pop();
        var type = id.toLowerCase();
        Session.set("type", type);
        if (Rooms.find({type: type}).count() !== 1) {
            window.location = "/";
        } else {
            station_c = Meteor.subscribe(type);
            Session.set("loaded", true);
            minterval = Meteor.setInterval(function () {
                var room = Rooms.findOne({type: type});
                if (room !== undefined) {
                    if (room.state === "paused") {
                        Session.set("state", "paused");
                        if (yt_player !== undefined && yt_player.getPlayerState !== undefined && yt_player.getPlayerState() === 1) {
                            yt_player.pauseVideo();
                        } else if (_sound !== undefined && _sound.getState().indexOf("playing") !== -1) {
                            _sound.pause();
                        }
                    } else {
                        Session.set("state", "playing");
                        if (yt_player !== undefined && yt_player.getPlayerState !== undefined && yt_player.getPlayerState() !== 1) {
                            yt_player.playVideo();
                        } else if (_sound !== undefined && _sound.getState().indexOf("paused") !== -1) {
                            _sound.play();
                        }
                    }
                }

                if (currentSongR === undefined || room.currentSong.started !== currentSongR.started) {
                    Session.set("previousSong", currentSong);
                    currentSongR = room.currentSong;

                    currentSong = room.currentSong.song;
                    currentSong.started = room.currentSong.started;
                    Session.set("currentSong", currentSong);
                    startSong();
                }

                if (currentSong !== undefined) {
                    if (room !== undefined) {
                        var duration = (Date.now() - currentSong.started - room.timePaused) / 1000;
                        var d = moment.duration(duration, 'seconds');
                        if (Session.get("state") === "playing") {
                            $("#time-elapsed").text(d.minutes() + ":" + ("0" + d.seconds()).slice(-2));
                        }
                    }
                }
            }, 1000);
            resizeSeekerbarInterval = Meteor.setInterval(function () {
                resizeSeekerbar();
            }, 500);
        }
    });
});
