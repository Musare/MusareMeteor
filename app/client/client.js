Meteor.startup(function() {
    reCAPTCHA.config({
        publickey: '6LcVxg0TAAAAAE18vBiH00UAyaJggsmLm890SjZl'
    });
});

Meteor.subscribe("queues");
Meteor.subscribe("chat");
Meteor.subscribe("playlists");

var minterval;
var hpSound = undefined;
var songsArr = [];
var ytArr = [];
var _sound = undefined;
var parts = location.href.split('/');
var id = parts.pop();
var type = id.toLowerCase();
var resizeSeekerbarInterval;

UI.registerHelper("formatTime", function(seconds) {
    var d = moment.duration(parseInt(seconds), 'seconds');
    return d.minutes() + ":" + ("0" + d.seconds()).slice(-2);
});

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
    }
});

Template.profile.onCreated(function() {
    var parts = Router.current().url.split('/');
    var username = parts.pop();
    Session.set("loaded", false);
    Meteor.subscribe("userProfiles", function() {
        if (Meteor.users.find({"profile.usernameL": username.toLowerCase()}).count() === 0) {
            window.location = "/";
        } else {
            var data = Meteor.users.findOne({"profile.usernameL": username.toLowerCase()});
            Session.set("username", data.profile.username);
            Session.set("first_joined", data.createdAt);
            Session.set("rank", data.profile.rank);
            Session.set("loaded", true);
        }
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
        Meteor.loginWithGithub()
        Accounts.onLogin(function(){
            window.location.href = "/"
        });
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
        Meteor.loginWithGithub()
        Accounts.onLogin(function(){
            window.location.href = "/"
        });
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
    Session.set("type", undefined);
});

Template.room.events({
    "click #submit": function() {
        Meteor.call("sendMessage", Session.get("type"), $("#chat-input").val(), function(err, res) {
            console.log(err, res);
            if (res) {
                $("#chat-input").val("");
            }
        });
    },
    "keyup #chat-input": function(e) {
        if (e.type == "keyup" && e.which == 13) {
            e.preventDefault();
            Meteor.call("sendMessage", Session.get("type"), $("#chat-input").val(), function(err, res) {
                console.log(err, res);
                if (res) {
                    $("#chat-input").val("");
                }
            });
        }
    },
    "click #like": function(e) {
        Meteor.call("likeSong", Session.get("currentSong").mid);
    },
    "click #dislike": function(e) {
        Meteor.call("dislikeSong", Session.get("currentSong").mid);
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
        var genre = id.toLowerCase();
        var type = $("#type").val();
        id = $("#id").val();
        var title = $("#title").val();
        var artist = $("#artist").val();
        var img = $("#img").val();
        var songData = {type: type, id: id, title: title, artist: artist, img: img};
        if(Playlists.find({type: roomType, "songs.title": songData.title}, {songs: {$elemMatch: {title: songData.title}}}).count() !== 0) {
            $(".landing").prepend("<div class='alert alert-danger alert-dismissible' role='alert' style='margin-bottom: 0'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'><i class='fa fa-times'></i></span></button><strong>Song not added.</strong> This song is already is in the playlist.</div>");
        } else{
            Meteor.call("addSongToQueue", genre, songData, function(err, res) {
                console.log(err, res);
                $("#close-modal-a").click();
            });
        }
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
            var volume = localStorage.getItem("volume") || 20;
            $("#volume-slider").slider("setValue", volume);
            if (slider.length === 0) {
                Meteor.setTimeout(function() {
                    makeSlider();
                }, 500);
            } else {
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
    }
});

Template.admin.helpers({
  queueCount: function(i) {
      var queues = Queues.find({}).fetch();
      
      if (!queues[i]) {
        return 0;
      }
      else {
        return queues[i].songs.length;
      }
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
  }
});

Template.stations.helpers({
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

Template.stations.events({
    "click .preview-button": function(e){
        Session.set("song", this);
    },
    "click .edit-queue-button": function(e){
        Session.set("song", this);
        Session.set("genre", $(e.toElement).data("genre"));
        Session.set("type", "queue");
        $("#type").val(this.type);
        $("#artist").val(this.artist);
        $("#title").val(this.title);
        $("#img").val(this.img);
        $("#id").val(this.id);
        $("#duration").val(this.duration);
    },
    "click .edit-playlist-button": function(e){
        Session.set("song", this);
        Session.set("genre", $(e.toElement).data("genre"));
        Session.set("type", "playlist");
        $("#type").val(this.type);
        $("#artist").val(this.artist);
        $("#title").val(this.title);
        $("#img").val(this.img);
        $("#id").val(this.id);
        $("#duration").val(this.duration);
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
            }
            $("#previewPlayer").show();
        } else if (type === "SoundCloud") {
            SC.stream("/tracks/" + song.id, function(sound) {
                _sound = sound;
                sound.setVolume(volume / 100);
                sound.play();
            });
        }
    },
    "click #stop": function() {
        $("#play").attr("disabled", false);
        $("#stop").attr("disabled", true);
        if (yt_player !== undefined) {
            yt_player.stopVideo();
        }
        if (_sound !== undefined) {
            _sound.stop();
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
        newSong.title = $("#title").val();
        newSong.artist = $("#artist").val();
        newSong.img = $("#img").val();
        newSong.type = $("#type").val();
        newSong.duration = $("#duration").val();
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
        if (yt_player !== undefined) {
            $("#play").attr("disabled", false);
            $("#stop").attr("disabled", true);
            $("#previewPlayer").hide();
            yt_player.loadVideoById("", 0);
            yt_player.seekTo(0);
            yt_player.stopVideo();
        }
        if (_sound !== undefined) {
            _sound.stop();
            $("#play").attr("disabled", false);
            $("#stop").attr("disabled", true);
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
        if (currentSong !== undefined) {
            if (_sound !== undefined) _sound.stop();
            if (yt_player !== undefined && yt_player.stopVideo !== undefined) yt_player.stopVideo();

            var volume = localStorage.getItem("volume") || 20;

            $("#media-container").empty();
            yt_player = undefined;
            if (currentSong.type === "SoundCloud") {
                $("#media-container").append('<img src="/soundcloud-image.png" class="embed-responsive-item" />');
                getSongInfo(currentSong);
                SC.stream("/tracks/" + currentSong.id, function(sound){
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
                });
            } else {
                $("#media-container").append('<div id="player" class="embed-responsive-item"></div>');
                if (yt_player === undefined) {
                    yt_player = new YT.Player("player", {
                        height: 540,
                        width: 960,
                        videoId: currentSong.id,
                        playerVars: {controls: 0, iv_load_policy: 3, rel: 0, showinfo: 0},
                        events: {
                            'onReady': function(event) {
                                event.target.seekTo(getTimeElapsed() / 1000);
                                event.target.playVideo();
                                event.target.setVolume(volume);
                                resizeSeekerbar();
                            },
                            'onStateChange': function(event){
                                if (event.data == YT.PlayerState.PAUSED && Session.get("state") === "playing") {
                                    event.target.seekTo(getTimeElapsed() / 1000);
                                    event.target.playVideo();
                                }
                                if (event.data == YT.PlayerState.PLAYING && Session.get("state") === "paused") {
                                    event.target.seekTo(getTimeElapsed() / 1000);
                                    event.target.pauseVideo();
                                }
                            }
                        }
                    });
                } else {
                    yt_player.loadVideoById(currentSong.id);
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
