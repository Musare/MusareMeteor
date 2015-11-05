Playlists = new Mongo.Collection("playlists");
Rooms = new Mongo.Collection("rooms");
Queues = new Mongo.Collection("queues");
Reports = new Mongo.Collection("reports");

if (Meteor.isClient) {
    Meteor.startup(function() {
        reCAPTCHA.config({
            publickey: '6LcVxg0TAAAAAE18vBiH00UAyaJggsmLm890SjZl'
        });
    });

    Meteor.subscribe("queues");
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
        var parts = location.href.split('/');
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
                $("input").css("background-color","indianred");
                $("input").on("click",function(){
                    $("input").css({
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
                    $("input:focus").css({
                      "width": "354px",
                      "color": "white"
                    })
                    $("input").on("blur", function(){
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
            id = parts.pop();
            var genre = id.toLowerCase();
            var type = $("#type").val();
            id = $("#id").val();
            var title = $("#title").val();
            var artist = $("#artist").val();
            var img = $("#img").val();
            var songData = {type: type, id: id, title: title, artist: artist, img: img};
            Meteor.call("addSongToQueue", genre, songData, function(err, res) {
                console.log(err, res);
            });
            $("#close-modal-a").click();
        },
        "click #smile-modal": function(e){
            e.preventDefault();
            if (Session.get("smileClicked")) {
                $("#smile-modal").removeClass("active");
                Session.set("smileClicked", false);
            } else {
				$("#meh-modal").removeClass("active");
				Session.set("mehClicked", false);
                $("#smile-modal").addClass("active");
                Session.set("smileClicked", true);
            }
        },
        "click #meh-modal": function(e){
            e.preventDefault();
            if (Session.get("mehClicked")) {
                $("#meh-modal").removeClass("active");
                Session.set("mehClicked", false);
            } else {
				$("#smile-modal").removeClass("active");
				Session.set("smileClicked", false);
                $("#meh-modal").addClass("active");
                Session.set("mehClicked", true);
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
        "click #add-songs": function(){
          $("#add-songs-modal").show();
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
        songDuration: function() {
            var duration = Session.get("duration");
            var d = moment.duration(duration, 'seconds');
            return d.minutes() + ":" + ("0" + d.seconds()).slice(-2);
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

    Template.admin.events({
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

    Template.admin.onCreated(function() {
        var tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    });

    Template.admin.onRendered(function() {
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
            Session.set("duration", songData.duration);
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
                        Session.set("duration", currentSong.duration);
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
}

if (Meteor.isServer) {
    Meteor.startup(function() {
        reCAPTCHA.config({
            privatekey: '6LcVxg0TAAAAAI2fgIEEWHFxwNXeVIs8mzq5cfRM'
        });
        var stations = [{tag: "edm", display: "EDM"}, {tag: "pop", display: "Pop"}]; //Rooms to be set on server startup
        for(var i in stations){
            if(Rooms.find({type: stations[i]}).count() === 0){
                createRoom(stations[i].display, stations[i].tag);
            }
        }
    });

    var stations = [];

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

    function getStation(type, cb) {
        stations.forEach(function(station) {
            if (station.type === type) {
                cb(station);
                return;
            }
        });
    }

    function createRoom(display, tag) {
        var type = tag;
        if (Rooms.find({type: type}).count() === 0) {
            Rooms.insert({display: display, type: type}, function(err) {
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
        var _this = this;
        var startedAt = Date.now();
        var playlist = Playlists.findOne({type: type});
        var songs = playlist.songs;

        if (playlist.lastSong === undefined) {
            Playlists.update({type: type}, {$set: {lastSong: 0}});
            playlist = Playlists.findOne({type: type});
            songs = playlist.songs;
        }
        var currentSong = playlist.lastSong;
        var currentTitle = songs[currentSong].title;

        Rooms.update({type: type}, {$set: {currentSong: {song: songs[currentSong], started: startedAt}}});

        this.skipSong = function() {
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
                _this.skipSong();
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

        this.songTimer();
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
        query = query.toLowerCase().split(" ").join("%20");

        var res = Meteor.http.get('https://api.spotify.com/v1/search?q=' + query + '&type=track');

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
        query = query.toLowerCase().split(" ").join("%20");

        var res = Meteor.http.get('https://api.spotify.com/v1/search?q=' + query + '&type=track');
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
        user.profile = {username: username, usernameL: username.toLowerCase(), rank: "default"};
        return user;
    });

    ServiceConfiguration.configurations.remove({
        service: "facebook"
    });

    ServiceConfiguration.configurations.insert({
        service: "facebook",
        appId: "1496014310695890",
        secret: "9a039f254a08a1488c08bb0737dbd2a6"
    });

    ServiceConfiguration.configurations.remove({
        service: "github"
    });

    ServiceConfiguration.configurations.insert({
        service: "github",
        clientId: "dcecd720f47c0e4001f7",
        secret: "375939d001ef1a0ca67c11dbf8fb9aeaa551e01b"
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

    Meteor.publish("chat", function() {
        return Chat.find({});
    });

    Meteor.publish("userProfiles", function() {
        return Meteor.users.find({}, {fields: {profile: 1, createdAt: 1}});
    });

    Meteor.publish("isAdmin", function() {
        return Meteor.users.find({_id: this.userId, "profile.rank": "admin"});
    });

    function isAdmin() {
        var userData = Meteor.users.find(Meteor.userId());
        if (Meteor.userId() && userData.count !== 0 && userData.fetch()[0].profile.rank === "admin") {
            return true;
        } else {
            return false;
        }
    }

    Meteor.methods({
        submitReport: function(report, id) {
            var obj = report;
            obj.id = id;
            Reports.insert(obj);
        },
        shufflePlaylist: function(type) {
            if (isAdmin()) {
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
            if (isAdmin()) {
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
            if (isAdmin()) {
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
            if (isAdmin()) {
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
            var verifyCaptchaResponse = reCAPTCHA.verifyCaptcha(this.connection.clientAddress, captchaData);
            if (!verifyCaptchaResponse.success) {
                console.log('reCAPTCHA check failed!', verifyCaptchaResponse);
                throw new Meteor.Error(422, 'reCAPTCHA Failed: ' + verifyCaptchaResponse.error);
            } else {
                console.log('reCAPTCHA verification passed!');
                Accounts.createUser({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                });
            }
            return true;
        },
        addSongToQueue: function(type, songData) {
            if (Meteor.userId()) {
                type = type.toLowerCase();
                if (Rooms.find({type: type}).count() === 1) {
                    if (Queues.find({type: type}).count() === 0) {
                        Queues.insert({type: type, songs: []});
                    }
                    if (songData !== undefined && Object.keys(songData).length === 5 && songData.type !== undefined && songData.title !== undefined && songData.title !== undefined && songData.artist !== undefined && songData.img !== undefined) {
                        songData.duration = getSongDuration(songData.title, songData.artist);
                        songData.img = getSongAlbumArt(songData.title, songData.artist);
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
                                        img: songData.img,
                                        type: songData.type
                                    }
                                }
                            });
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
            if (isAdmin()) {
                newSong.mid = oldSong.mid;
                Queues.update({type: genre, "songs": oldSong}, {$set: {"songs.$": newSong}});
                return true;
            } else {
                throw new Meteor.Error(403, "Invalid permissions.");
            }
        },
        updatePlaylistSong: function(genre, oldSong, newSong) {
            if (isAdmin()) {
                newSong.mid = oldSong.mid;
                Playlists.update({type: genre, "songs": oldSong}, {$set: {"songs.$": newSong}});
                return true;
            } else {
                throw new Meteor.Error(403, "Invalid permissions.");
            }
        },
        removeSongFromQueue: function(type, mid) {
            if (isAdmin()) {
                type = type.toLowerCase();
                Queues.update({type: type}, {$pull: {songs: {mid: mid}}});
            } else {
                throw new Meteor.Error(403, "Invalid permissions.");
            }
        },
        removeSongFromPlaylist: function(type, mid) {
            if (isAdmin()) {
                type = type.toLowerCase();
                Playlists.update({type: type}, {$pull: {songs: {mid: mid}}});
            } else {
                throw new Meteor.Error(403, "Invalid permissions.");
            }
        },
        addSongToPlaylist: function(type, songData) {
            if (isAdmin()) {
                type = type.toLowerCase();
                if (Rooms.find({type: type}).count() === 1) {
                    if (Playlists.find({type: type}).count() === 0) {
                        Playlists.insert({type: type, songs: []});
                    }
                    if (songData !== undefined && Object.keys(songData).length === 7 && songData.type !== undefined && songData.mid !== undefined && songData.title !== undefined && songData.title !== undefined && songData.artist !== undefined && songData.duration !== undefined && songData.img !== undefined) {
                        Playlists.update({type: type}, {
                            $push: {
                                songs: {
                                    id: songData.id,
                                    mid: songData.mid,
                                    title: songData.title,
                                    artist: songData.artist,
                                    duration: songData.duration,
                                    img: songData.img,
                                    type: songData.type
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
        createRoom: function(display, tag) {
            if (isAdmin()) {
                createRoom(display, tag);
            } else {
                throw new Meteor.Error(403, "Invalid permissions.");
            }
        },
        deleteRoom: function(type){
            if (isAdmin()) {
                Rooms.remove({type: type});
                Playlists.remove({type: type});
                Queues.remove({type: type});
                return true;
            } else {
                throw new Meteor.Error(403, "Invalid permissions.");
            }
        }
    });
}

/*Router.waitOn(function() {
    Meteor.subscribe("isAdmin", Meteor.userId());
});*/

/*Router.onBeforeAction(function() {
    /*Meteor.autorun(function () {
        if (admin.ready()) {
            this.next();
        }
    });*/
    /*this.next();
});*/

Router.onBeforeAction('loading');

Router.configure({
    loadingTemplate: 'loading'
});

Router.route("/", {
    template: "home"
});

Router.route("/login", {
  template: "login"
});

Router.route("/signup", {
  template: "register"
});

Router.route("/terms", {
    template: "terms"
});

Router.route("/privacy", {
    template: "privacy"
});

Router.route("/about", {
    template: "about"
});

Router.route("/admin", {
    waitOn: function() {
        return Meteor.subscribe("isAdmin", Meteor.userId());
    },
    action: function() {
        var user = Meteor.users.findOne({});
        if (user !== undefined && user.profile !== undefined && user.profile.rank === "admin") {
            this.render("admin");
        } else {
            this.redirect("/");
        }
    }
});

Router.route("/vis", {
    template: "visualizer"
});

Router.route("/:type", {
    template: "room"
});

Router.route("/u/:user", {
    template: "profile"
});
