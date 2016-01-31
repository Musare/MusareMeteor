var minterval;
var StationSubscription = undefined;
var resizeSeekerbarInterval;

Template.alertsDashboard.onCreated(function() {
    if (allAlertSub === undefined) {
        allAlertSub = Meteor.subscribe("allAlerts");
    }
});

Template.landing.onCreated(function(){
    $("body").css("overflow", "hidden");
    function pageScroll() {
        window.scrollBy(0,1);
        if($(window).scrollTop() + $(window).height() == $(document).height()) {
            $(window).scrollTop(0);
        }
        scrolldelay = setTimeout(pageScroll,50);
    }
    pageScroll();
})

Template.banned.onCreated(function() {
    if (rTimeInterval !== undefined) {
        Meteor.clearInterval(rTimeInterval)
    }
    rTimeInterval = Meteor.setInterval(function() {
        Session.set("time", new Date().getTime());
    }, 10000);
    Session.set("ban", Meteor.user().punishments.ban);
});

Template.dashboard.onCreated(function() {
    if (minterval !== undefined) {
        Meteor.clearInterval(minterval);
    }
    if (resizeSeekerbarInterval !== undefined) {
        Meteor.clearInterval(resizeSeekerbarInterval);
        resizeSeekerbarInterval = undefined;
    }
    if (StationSubscription !== undefined) {
        StationSubscription.stop();
    }
    Session.set("type", undefined);
});

Template.login.onCreated(function() {
    Session.set("github", true);
    Accounts.onLoginFailure(function() {
        if (Session.get("github") === true) {
            var errAlert = $('<div style="margin-bottom: 0" class="alert alert-danger" role="alert"><strong>Oh Snap!</strong> Something went wrong when trying to log in with GitHub.</div>');
            $(".landing").before(errAlert);
            Meteor.setTimeout(function() {
                errAlert.fadeOut(5000, function() {
                    errAlert.remove();
                });
            }, 10000);
        }
    });
});

Template.feedback.onCreated(function(){
    Meteor.subscribe("feedback");
})

Template.profile.onCreated(function() {
    var parts = Router.current().url.split('/');
    var username = parts.pop();
    Session.set("loaded", false);
    Meteor.subscribe("userProfiles", username.toLowerCase(), function() {
        if (Meteor.users.find({"profile.usernameL": username.toLowerCase()}).count() === 0) {
            window.location = "/";
        } else {
            var data = Meteor.users.findOne({"profile.usernameL": username.toLowerCase()});
            Session.set("real_name", data.profile.realname);
            Session.set("username", data.profile.username);
            Session.set("first_joined", data.createdAt);
            Session.set("rank", data.profile.rank);
            Session.set("liked", data.profile.liked);
            Session.set("disliked", data.profile.disliked);
            Session.set("loaded", true);
        }
    });
});

Template.queues.onCreated(function() {
    var tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    YTPlayer = undefined;
    $(document).keydown(function(evt){
        if (evt.keyCode==83 && (evt.ctrlKey)){
            evt.preventDefault();
            if (Session.get("editing") === true) {
                $("#save-song-button").click();
            }
        }
    });
});

Template.manageStation.onCreated(function() {
    var tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    YTPlayer = undefined;
    $(document).keydown(function(evt){
        if (evt.keyCode==83 && (evt.ctrlKey)){
            evt.preventDefault();
            if (Session.get("editing") === true) {
                $("#save-song-button").click();
            }
        }
    });
});

Template.register.onCreated(function() {
    Accounts.onLoginFailure(function() {
        var errAlert = $('<div style="margin-bottom: 0" class="alert alert-danger" role="alert"><strong>Oh Snap!</strong> Something went wrong when trying to register with GitHub. Maybe an account with that username already exists?</div>');
        $(".landing").before(errAlert);
        Meteor.setTimeout(function() {
            errAlert.fadeOut(5000, function() {
                errAlert.remove();
            });
        }, 10000);
    });
});

Template.room.onCreated(function () {
    Chat.after.find(function(userId, selector) {
        if (selector.type === "global") {
            if (!$("#global-chat-tab").hasClass("active")) {
                $("#global-chat-tab").addClass("unread-messages");
            }
        } else if(selector.type === Session.get("type")) {
            if (!$("#chat-tab").hasClass("active")) {
                $("#chat-tab").addClass("unread-messages");
            }
        }
    });

    Session.set("reportSong", false);
    Session.set("reportTitle", false);
    Session.set("reportAuthor", false);
    Session.set("reportDuration", false);
    Session.set("reportAudio", false);
    Session.set("reportAlbumart", false);
    Session.set("reportOther", false);
    Session.set("si_or_pl", "singleVideo");
    Session.set("editingSong", false);
    var parts = location.href.split('/');
    var id = parts.pop();
    var type = id.toLowerCase();
    if (resizeSeekerbarInterval !== undefined) {
        Meteor.clearInterval(resizeSeekerbarInterval);
        resizeSeekerbarInterval = undefined;
    }
    YTPlayer = undefined;
    Session.set("videoHidden", false);
    var tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    Session.set("singleVideo", true);

    var currentSong = undefined;
    var currentSongR = undefined;
    var type = Session.get("type");

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
            if (YTPlayer !== undefined && YTPlayer.stopVideo !== undefined) YTPlayer.stopVideo();

            var volume = localStorage.getItem("volume") || 20;

            $("#player").show();
            function loadVideo() {
                if (!Session.get("YTLoaded")) {
                    Session.set("loadVideoTimeout", Meteor.setTimeout(function () {
                        loadVideo();
                    }, 500));
                } else {
                    if (YTPlayer === undefined) {
                        YTPlayer = new YT.Player("player", {
                            height: 270,
                            width: 480,
                            videoId: currentSong.id,
                            playerVars: {controls: 0, iv_load_policy: 3, rel: 0, showinfo: 0},
                            events: {
                                'onReady': function (event) {
                                    if (currentSong.skipDuration === undefined) {
                                        currentSong.skipDuration = 0;
                                    }
                                    event.target.seekTo(Number(currentSong.skipDuration) + getTimeElapsed() / 1000);
                                    event.target.playVideo();
                                    event.target.setVolume(volume);
                                    resizeSeekerbar();
                                },
                                'onStateChange': function (event) {
                                    if (Session.get("YTLoaded")) {
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
                            }
                        });
                    } else {
                        YTPlayer.loadVideoById(currentSong.id);
                        if (currentSong.skipDuration === undefined) {
                            currentSong.skipDuration = 0;
                        }
                        YTPlayer.seekTo(Number(currentSong.skipDuration) + getTimeElapsed() / 1000);
                    }
                    Session.set("pauseVideo", false);
                    getSongInfo(currentSong);
                }
            }
            loadVideo();
        }
    }

    function getSongAudio() {
      var ytURL = "www.youtube.com/watch?v=" + currentSong.id;
      Meteor.call('getSongAudio', ytURL);

      startSong();
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
            StationSubscription = Meteor.subscribe(type);
            Session.set("loaded", true);
            minterval = Meteor.setInterval(function () {
                var room = Rooms.findOne({type: type});
                if (room !== undefined) {
                    if (room.state === "paused" || Session.get("pauseVideo")) {
                        Session.set("state", "paused");
                        // TODO Fix issue where sometimes nothing loads with the YT is not defined error. The error points to around this.
                        if (YTPlayer !== undefined && YTPlayer.getPlayerState !== undefined && YTPlayer.getPlayerState() === 1) {
                            YTPlayer.pauseVideo();
                        }
                    } else {
                        Session.set("state", "playing");
                        if (YTPlayer !== undefined && YTPlayer.getPlayerState !== undefined && YTPlayer.getPlayerState() !== 1) {
                            YTPlayer.playVideo();
                        }
                    }
                }

                if (currentSongR === undefined || room.currentSong.started !== currentSongR.started) {
                    Session.set("previousSong", currentSong);
                    currentSongR = room.currentSong;

                    currentSong = room.currentSong.song;
                    currentSong.started = room.currentSong.started;
                    Session.set("currentSong", currentSong);
                    Meteor.clearTimeout(Session.get("loadVideoTimeout"));
                    getSongAudio();
                }

                if (currentSong !== undefined) {
                    if (room !== undefined) {
                        var duration = (Date.now() - currentSong.started - room.timePaused) / 1000;
                        var song_duration = currentSong.duration;
                        if (song_duration <= duration) {
                            Session.set("pauseVideo", true);
                        }
                        var d = moment.duration(duration, 'seconds');
                        if (Session.get("state") === "playing") {
                            $("#time-elapsed").text(d.minutes() + ":" + ("0" + d.seconds()).slice(-2));
                        }
                    }
                }
            }, 100);
            resizeSeekerbarInterval = Meteor.setInterval(function () {
                resizeSeekerbar();
            }, 500);
        }
    });
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
