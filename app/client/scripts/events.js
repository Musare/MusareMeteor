var feedbackData;

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

                if (YTPlayer !== undefined) {
                    YTPlayer.setVolume(volume);
                    localStorage.setItem("volume", volume);
                }
                return true;
            }
        }
    } else if(command === "mute"){
        $("#volume-slider").slider("setValue", 0);
        $("#volume-icon").removeClass("fa-volume-down").addClass("fa-volume-off");
        if (YTPlayer !== undefined) {
            YTPlayer.setVolume(0);
            localStorage.setItem("volume", 0);
        }
    } else if(command === "ban"){
        var user = params[0];
        var time = params[1];
        var reason = params[2];
        Meteor.call("banUser", user, time, reason, function(err, res){
            if(err){
                console.log(err);
            }
        });
    } else if(command === "silence"){
        var user = params[0];
        var time = params[1];
        Meteor.call("muteUser", user, time, function(err, res){
            if(err){
                console.log(err);
            }
        });
    } else if(command === "unban"){
        var user = params[0];
        Meteor.call("unbanUser", user, function(err, res){
            if(err){
                console.log(err);
            }
        });
    } else if(command === "unsilence"){
        var user = params[0];
        Meteor.call("unsilenceUser", user, function(err, res){
            if(err){
                console.log(err);
            }
        });
    } else if(command === "pause"){
        Meteor.call("pauseRoom", Session.get("type"), function(err, res){
            if(err){
                console.log(err);
            }
        });
    } else if(command === "resume"){
        Meteor.call("resumeRoom", Session.get("type"), function(err, res){
            if(err){
                console.log(err);
            }
        });
    } else if(command === "shuffle"){
        Meteor.call("shufflePlaylist", Session.get("type"), function(err, res){
            if(err){
                console.log(err);
            }
        });
    } else if(command === "skip"){
        Meteor.call("skipSong", Session.get("type"), function(err, res){
            if(err){
                console.log(err);
            }
        });
    }
}

function sendMessage() {
    var message = $("#chat-input").val();
    if (!$("#chat-input").hasClass("disabled")) {
        if (message.length > 0 && message[0] !== " ") {
            if (message[0] === "/") {
                message = message.split("");
                message.shift();
                message = message.join("");
                var params = message.split(" ");
                params = params.map(function(param) {
                    return param.replace(/\r?\n|\r/g, "");
                });
                var command = params.shift();
                command = command.replace(/\r?\n|\r/g, "");
                if (executeCommand(command, params)) {
                    $("#chat-input").val("");
                } else {
                    $("#chat-input").val("");
                }
            } else {
                $("#chat-input").addClass("disabled");
                $("#chat-input").attr("disabled", "");
                Meteor.call("sendMessage", Session.get("type"), message, function (err, res) {
                    if(err){
                        $("#chat-input").val("");
                        $("#chat-input").removeAttr("disabled");
                        $("#chat-input").removeClass("disabled");
                    }
                    if (res) {
                        $("#chat-input").val("");
                        $("#chat-input").removeAttr("disabled");
                        $("#chat-input").removeClass("disabled");
                    }
                });
            }
        }
    }
}

function sendMessageGlobal() {
    var message = $("#global-chat-input").val();
    if (!$("#global-chat-input").hasClass("disabled")) {
        if (message.length > 0 && message[0] !== " ") {
            if (message[0] === "/") {
                message = message.split("");
                message.shift();
                message = message.join("");
                var params = message.split(" ");
                var command = params.shift();
                command = command.replace(/\r?\n|\r/g, "");
                if (executeCommand(command, params)) {
                    $("#global-chat-input").val("");
                } else {
                    $("#global-chat-input").val("");
                }
            } else {
                $("#global-chat-input").addClass("disabled");
                $("#global-chat-input").attr("disabled", "");
                Meteor.call("sendMessage", "global", message, function (err, res) {
                    if (res) {
                        $("#global-chat-input").val("");
                    }
                    $("#global-chat-input").removeClass("disabled");
                    $("#global-chat-input").removeAttr("disabled");
                });
            }
        }
    }
}

Template.admin.events({
    "click #croom_create": function() {
        Meteor.call("createRoom", $("#croom_display").val(), $("#croom_tag").val(), function (err, res) {
            if (err) {
                alert("Error " + err.error + ": " + err.reason);
            } else {
                window.location = "/" + $("#croom_tag").val();
            }
        });
    },
    "click a": function(e){
        var id = e.currentTarget.id;
        console.log(id.toLowerCase());
        Session.set("playlistToEdit", id);
    },
    "click #croom_create": function() {
        Meteor.call("createRoom", $("#croom_display").val(), $("#croom_tag").val(), $("#two").prop("checked"), function (err, res) {
            if (err) {
                alert("Error " + err.error + ": " + err.reason);
            } else {
                window.location = "/" + $("#croom_tag").val();
            }
        });
    },
    "click #rreset_confirm": function(){
        $('#confirmModal').modal('hide');
        Meteor.call("resetRating");
    },
    "click #edit_desc": function(){
        console.log($(this));
        console.log($(this)[0].type);
        Session.set("roomDesc", $(this)[0].type);
    },
    "click #submit_desc": function(){
        var description = $("#desc_text").val();
        Meteor.call("editRoomDesc", Session.get("roomDesc"), description);
        $("#desc-modal").closeModal();
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

Template.feedback.events({
    "click #feedback_submit": function(){
        if($("#feedback_message").val().length !== 0){
            Meteor.call("sendFeedback", $("#feedback_message").val());
            $("#feedback_message").val("");
            $("#modal1").closeModal()
        }
    },
    "click .upvote": function(){
        var message = $(this).parent("card").prevObject[0].message;
        Meteor.call("upvoteFeedback", message);
    },
    "click #delete": function(){
        var message = $(this).parent("card").prevObject[0].message;
        Meteor.call("deleteFeedback", message);
    },
    "click #edit": function(){
        $("#editModal").click()
        var data = Feedback.findOne({"message": $(this).parent("card").prevObject[0].message});
        feedbackData = data.message;
        $("#edit_feedback_message").val(data.message);
    },
    "click #edit_feedback_submit": function(){
        var oldMessage = feedbackData;
        var newMessage = $("#edit_feedback_message").val()
        $("#edit_feedback_message").val("")
        Meteor.call("updateFeedback", oldMessage, newMessage);
        $("#editFeedback").closeModal();
    }
});

Template.header.events({
    "click .logout": function(e){
        e.preventDefault();
        Meteor.logout();
        if (hpSound !== undefined) {
            hpSound.stop();
        }
    },
    "click #profile": function(){
        window.location = "/u/" + Meteor.user().profile.username;
    }
});

Template.login.events({
    "submit form": function(e){
        e.preventDefault();
        Session.set("github", false);
        var username = $("#username").val()
        var password = $("#password").val();
        Meteor.loginWithPassword(username, password, function(err) {
            if (err) {
                var errAlert = $('<div style="margin-bottom: 0" class="alert alert-danger" role="alert"><strong>Oh Snap!</strong> ' + err.reason + '</div>');
                $(".landing").before(errAlert);
                Meteor.setTimeout(function() {
                    errAlert.fadeOut(5000, function() {
                        errAlert.remove();
                    });
                }, 5000);
            } else {
                window.location.href = "/";
            }
        });
    },

    "click #github-login": function(){
        Meteor.loginWithGithub({loginStyle: "redirect"}, function(err, res) {
            console.log(err, res);
        });
    }
});

Template.playlist.events({
    "keyup #search-playlist": function(){
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
    },
    "click #pl-item": function(){
        console.log($(this).text());
    }
});

Template.profile.events({
    //Edit real name
    "click #edit-name": function(){
        $("#name").hide();
        $("#name-div").show();
        $("#edit-name").hide();
        $("#cancel-edit").show();
    },
    "click #submit-name": function(){
        var user = Meteor.user();
        $("#name").show();
        $("#name-div").hide();
        $("#edit-name").show();
        $("#cancel-edit").hide();
        var realname = $("#input-name").val();
        var username = user.profile.username;
        $("#name").text("Name: " + realname);
        $("#input-name").val("")
        Meteor.call("updateRealName", realname);
    },
    "click #cancel-edit": function(){
        $("#name").show();
        $("#name-div").hide();
        $("#edit-name").show();
        $("#cancel-edit").hide();
        $("#input-name").val("");
    },
    //Edit username
    "click #edit-username": function(){
        $("#username").hide();
        $("#username-div").show();
        $("#edit-username").hide();
        $("#cancel-username").show();
    },
    "click #submit-username": function(){
        var user = Meteor.user()
        $("#username").show();
        $("#username-div").hide();
        $("#edit-username").show();
        $("#cancel-username").hide();
        var username = user.username;
        var newUserName = $("#input-username").val();
        $("#profile-name").text(newUserName)
        $("#username").text("Username: " + newUserName);
        $("#input-username").val("")
        Meteor.call("updateUserName", newUserName);
        window.location = "/u/" + newUserName;
    },
    "click #cancel-username": function(){
        $("#username").show();
        $("#username-div").hide();
        $("#edit-username").show();
        $("#cancel-username").hide();
        $("#input-username").val("");
    },
    // Admins only Edit Rank
    "click #edit-rank": function() {
        $("#rank").hide();
        $("#rank-div").show();
        $("#edit-rank").hide();
        $("#cancel-rank").show();
    },
    "click #submit-rank": function() {
        $("#rank").show();
        $("#rank-div").hide();
        $("#edit-rank").show();
        $("#cancel-rank").hide();
        var newRank = $("#select-rank option:selected").val();
        var username = Session.get("username");
        console.log(username, newRank);
    },
    "click #cancel-rank": function() {
        $("#rank").show();
        $("#rank-div").hide();
        $("#edit-rank").show();
        $("#cancel-rank").hide();
    }
});

var seekerBarInterval = undefined;

Template.queues.events({
    /* TODO Add undo delete button */
    "input #id": function() {
        console.log("Change!");
        $("#previewPlayerContainer").addClass("hide-preview");
    },
    "input #img": function() {
        var url = $("#img").val();
        console.log(url);
        Session.set("image_url", url);
    },
    "click .preview-button": function(e){
        Session.set("song", this);
        $("#previewModal").openModal();
    },
    "click #previewImageButton": function() {
        $("#preview-image").attr("src", Session.get("song").img);
    },
    "click .edit-queue-button": function(e){
        Session.set("song", this);
        Session.set("genre", $(e.target).data("genre"));
        Session.set("type", "queue");
        $("#mid").val(this.mid).change();
        $("#artist").val(this.artist).change();
        $("#title").val(this.title).change();
        $("#img").val(this.img).change();
        $("#id").val(this.id).change();
        $("#likes").val(this.likes).change();
        $("#dislikes").val(this.dislikes).change();
        $("#duration").val(this.duration).change();
        $("#skip-duration").val(this.skipDuration).change();
        $("#previewPlayerContainer").addClass("hide-preview");
        Session.set("image_url", this.img);
        Session.set("editing", true);
        $("#editModal").openModal({
            complete : function() {
                Session.set("editing", false);
                if (YTPlayer !== undefined && YTPlayer.stopVideo !== undefined) {
                    YTPlayer.stopVideo();
                }
            }
        });
    },
    "click .add-song-button": function(e){
        var genre = $(e.target).data("genre") || $(e.target).parent().data("genre");
        Meteor.call("addSongToPlaylist", genre, this, function(err) {
            console.log(err);
            if (err) {
                var $toastContent = $('<span><strong>Song not added.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 8000);
            }
        });
    },
    "click .deny-song-button": function(e){
        var genre = $(e.target).data("genre") || $(e.target).parent().data("genre");
        Meteor.call("removeSongFromQueue", genre, this.mid);
    },
    "click #play": function() {
        var duration = Session.get("song").duration;
        var d = moment.duration(parseInt(duration), 'seconds');
        $("#time-total").text(d.minutes() + ":" + ("0" + d.seconds()).slice(-2));
        $("#previewPlayerContainer").removeClass("hide-preview");
        var song = Session.get("song");
        var id = song.id;
        var volume = localStorage.getItem("volume") || 20;
        if (song.duration !== 0) {
            $("#play").attr("disabled", true);
            $("#stop").attr("disabled", false);
            $("#pause").attr("disabled", false);
            $("#forward").attr("disabled", false);
            if (YTPlayer === undefined) {
                YTPlayer = new YT.Player("previewPlayer", {
                    height: 540,
                    width: 568,
                    videoId: id,
                    playerVars: {autoplay: 1, controls: 0, iv_load_policy: 3, showinfo: 0, fs: 0},
                    events: {
                        'onReady': function(event) {
                            event.target.seekTo(Number(song.skipDuration));
                            event.target.playVideo();
                            event.target.setVolume(volume);
                        },
                        'onStateChange': function(event){
                            if (event.data == YT.PlayerState.PAUSED) {
                                if (seekerBarInterval !== undefined) {
                                    Meteor.clearInterval(seekerBarInterval);
                                    seekerBarInterval = undefined;
                                }
                            }
                            if (event.data == YT.PlayerState.UNSTARTED) {
                                if (seekerBarInterval !== undefined) {
                                    Meteor.clearInterval(seekerBarInterval);
                                    seekerBarInterval = undefined;
                                }
                                $(".seeker-bar").css({width: "0"});
                                $("#time-elapsed").text("0:00");
                                $("#previewPlayerContainer").addClass("hide-preview");
                            }
                            if (event.data == YT.PlayerState.PLAYING) {
                                seekerBarInterval = Meteor.setInterval(function() {
                                    var duration = Session.get("song").duration;
                                    var timeElapsed = YTPlayer.getCurrentTime();
                                    var skipDuration = Session.get("song").skipDuration;

                                    if (duration <= (timeElapsed - skipDuration)) {
                                        YTPlayer.stopVideo();
                                        $("#play").attr("disabled", false);
                                        $("#stop").attr("disabled", true);
                                        $("#pause").attr("disabled", true);
                                        $("#forward").attr("disabled", true);
                                        $("#previewPlayerContainer").addClass("hide-preview");
                                        $(".seeker-bar").css({width: "0"});
                                        $("#time-elapsed").text("0:00");
                                        Meteor.clearInterval(seekerBarInterval);
                                    } else {
                                        var percentComplete = (timeElapsed - skipDuration) / duration * 100;
                                        $(".seeker-bar").css({width: percentComplete + "%"});
                                        var d = moment.duration(timeElapsed - skipDuration, 'seconds');
                                        $("#time-elapsed").text(d.minutes() + ":" + ("0" + d.seconds()).slice(-2));
                                    }
                                }, 100);
                                $("#play").attr("disabled", true);
                                $("#stop").attr("disabled", false);
                                $("#pause").attr("disabled", false);
                                $("#forward").attr("disabled", false);
                            } else {
                                $("#play").attr("disabled", false);
                                $("#stop").attr("disabled", true);
                                $("#pause").attr("disabled", true);
                                $("#forward").attr("disabled", true);
                            }
                        }
                    }
                });
            } else {
                if (YTPlayer.getPlayerState() === 2) {
                    YTPlayer.playVideo();
                } else {
                    console.log(id, song.skipDuration, song.duration);
                    YTPlayer.loadVideoById(id);
                    YTPlayer.seekTo(Number(song.skipDuration));
                }
            }
            $("#previewPlayerContainer").removeClass("hide-preview");
        }
    },
    "click #stop": function() {
        $("#play").attr("disabled", false);
        $("#stop").attr("disabled", true);
        $("#pause").attr("disabled", true);
        $("#forward").attr("disabled", true);
        if (previewEndSongTimeout !== undefined) {
            Meteor.clearTimeout(previewEndSongTimeout);
        }
        if (YTPlayer !== undefined && YTPlayer.stopVideo !== undefined) {
            YTPlayer.stopVideo();
        }
    },
    "click #pause": function() {
        $("#play").attr("disabled", false);
        $("#stop").attr("disabled", false);
        $("#pause").attr("disabled", true);
        $("#forward").attr("disabled", true);
        if (previewEndSongTimeout !== undefined) {
            Meteor.clearTimeout(previewEndSongTimeout);
        }
        if (YTPlayer !== undefined && YTPlayer.pauseVideo !== undefined) {
            YTPlayer.pauseVideo();
        }
    },
    "click #forward": function() {
        var error = false;
        if (YTPlayer !== undefined) {
            var duration = Number(Session.get("song").duration) | 0;
            var skipDuration = Number(Session.get("song").skipDuration) | 0;
            if (YTPlayer.getDuration() < duration + skipDuration) {
                var $toastContent = $('<span><strong>Error.</strong> The song duration is longer than the length of the video.</span>');
                Materialize.toast($toastContent, 8000);
                error = true;
            } else {
                YTPlayer.seekTo(skipDuration + duration - 10);
            }
        }
        if (!error) {
            if (previewEndSongTimeout !== undefined) {
                Meteor.clearTimeout(previewEndSongTimeout);
            }
            previewEndSongTimeout = Meteor.setTimeout(function() {
                if (YTPlayer !== undefined) {
                    YTPlayer.stopVideo();
                }
                $("#play").attr("disabled", false);
                $("#stop").attr("disabled", true);
                $("#pause").attr("disabled", true);
                $("#forward").attr("disabled", true);
                $("#previewPlayerContainer").addClass("hide-preview");
            }, 10000);
        }
    },
    "click #get-spotify-info": function() {
        var search = $("#title").val();
        var artistName = $("#artist").val();
        getSpotifyInfo(search, function(data) {
            for(var i in data){
                for(var j in data[i].items){
                    if(search.indexOf(data[i].items[j].name) !== -1 && artistName.indexOf(data[i].items[j].artists[0].name) !== -1){
                        $("#img").val(data[i].items[j].album.images[2].url).change();
                        $("#duration").val(data[i].items[j].duration_ms / 1000).change();
                        return;
                    }
                }
            }
        }, artistName);
    },
    "click #save-song-button": function() {
        var newSong = {};
        newSong.mid = $("#mid").val();
        newSong.id = $("#id").val();
        newSong.likes = Number($("#likes").val());
        newSong.dislikes = Number($("#dislikes").val());
        newSong.title = $("#title").val();
        newSong.artist = $("#artist").val();
        newSong.img = $("#img").val();
        newSong.duration = Number($("#duration").val());
        newSong.skipDuration = $("#skip-duration").val();
        newSong.requestedBy = Session.get("song").requestedBy;
        if(newSong.skipDuration === undefined){
            newSong.skipDuration = 0;
        }
        Meteor.call("updateQueueSong", Session.get("genre"), Session.get("song"), newSong, function(err, res) {
            console.log(err, res);
            if (err) {
                var $toastContent = $('<span><strong>Song not saved.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 8000);
            } else {
                Session.set("song", newSong);
            }
        });
    }
});

Template.manageStation.events({
    /* TODO Add undo delete button */
    "input #id": function() {
        $("#previewPlayerContainer").addClass("hide-preview");
    },
    "input #img": function() {
        var url = $("#img").val();
        Session.set("image_url", url);
    },
    "click .preview-button": function(e){
        Session.set("song", this);
        $("#previewModal").openModal();
    },
    "click #previewImageButton": function() {
        $("#preview-image").attr("src", Session.get("song").img);
    },
    "click .edit-song-button": function(e){
        Session.set("song", this);
        Session.set("genre", $(e.target).data("genre"));
        $("#mid").val(this.mid).change();
        $("#artist").val(this.artist).change();
        $("#title").val(this.title).change();
        $("#img").val(this.img).change();
        $("#id").val(this.id).change();
        $("#likes").val(this.likes).change();
        $("#dislikes").val(this.dislikes).change();
        $("#duration").val(this.duration).change();
        $("#skip-duration").val(this.skipDuration).change();
        $("#previewPlayerContainer").addClass("hide-preview");
        Session.set("image_url", this.img);
        Session.set("editing", true);
        $("#editModal").openModal({
            complete : function() {
                Session.set("editing", false);
                if (YTPlayer !== undefined && YTPlayer.stopVideo !== undefined) {
                    YTPlayer.stopVideo();
                }
            }
        });
    },
    "click .remove-song-button": function(e){
        var genre = $(e.target).data("genre") || $(e.target).parent().data("genre");
        Meteor.call("removeSongFromPlaylist", genre, this.mid);
    },
    "click #play": function() {
        var duration = Session.get("song").duration;
        var d = moment.duration(parseInt(duration), 'seconds');
        $("#time-total").text(d.minutes() + ":" + ("0" + d.seconds()).slice(-2));
        $("#previewPlayerContainer").removeClass("hide-preview");
        var song = Session.get("song");
        var id = song.id;
        var volume = localStorage.getItem("volume") || 20;
        if (song.duration !== 0) {
            $("#play").attr("disabled", true);
            $("#stop").attr("disabled", false);
            $("#pause").attr("disabled", false);
            $("#forward").attr("disabled", false);
            if (YTPlayer === undefined) {
                YTPlayer = new YT.Player("previewPlayer", {
                    height: 540,
                    width: 568,
                    videoId: id,
                    playerVars: {autoplay: 1, controls: 0, iv_load_policy: 3, showinfo: 0, fs: 0},
                    events: {
                        'onReady': function(event) {
                            event.target.seekTo(Number(song.skipDuration));
                            event.target.playVideo();
                            event.target.setVolume(volume);
                        },
                        'onStateChange': function(event){
                            if (event.data == YT.PlayerState.PAUSED) {
                                if (seekerBarInterval !== undefined) {
                                    Meteor.clearInterval(seekerBarInterval);
                                    seekerBarInterval = undefined;
                                }
                            }
                            if (event.data == YT.PlayerState.UNSTARTED) {
                                if (seekerBarInterval !== undefined) {
                                    Meteor.clearInterval(seekerBarInterval);
                                    seekerBarInterval = undefined;
                                }
                                $(".seeker-bar").css({width: "0"});
                                $("#time-elapsed").text("0:00");
                                $("#previewPlayerContainer").addClass("hide-preview");
                            }
                            if (event.data == YT.PlayerState.PLAYING) {
                                seekerBarInterval = Meteor.setInterval(function() {
                                    var duration = Session.get("song").duration;
                                    var timeElapsed = YTPlayer.getCurrentTime();
                                    var skipDuration = Session.get("song").skipDuration;

                                    if (duration <= (timeElapsed - skipDuration)) {
                                        YTPlayer.stopVideo();
                                        $("#play").attr("disabled", false);
                                        $("#stop").attr("disabled", true);
                                        $("#pause").attr("disabled", true);
                                        $("#forward").attr("disabled", true);
                                        $("#previewPlayerContainer").addClass("hide-preview");
                                        $(".seeker-bar").css({width: "0"});
                                        $("#time-elapsed").text("0:00");
                                        Meteor.clearInterval(seekerBarInterval);
                                    } else {
                                        var percentComplete = (timeElapsed - skipDuration) / duration * 100;
                                        $(".seeker-bar").css({width: percentComplete + "%"});
                                        var d = moment.duration(timeElapsed - skipDuration, 'seconds');
                                        $("#time-elapsed").text(d.minutes() + ":" + ("0" + d.seconds()).slice(-2));
                                    }
                                }, 100);
                                $("#play").attr("disabled", true);
                                $("#stop").attr("disabled", false);
                                $("#pause").attr("disabled", false);
                                $("#forward").attr("disabled", false);
                            } else {
                                $("#play").attr("disabled", false);
                                $("#stop").attr("disabled", true);
                                $("#pause").attr("disabled", true);
                                $("#forward").attr("disabled", true);
                            }
                        }
                    }
                });
            } else {
                if (YTPlayer.getPlayerState() === 2) {
                    YTPlayer.playVideo();
                } else {
                    console.log(id, song.skipDuration, song.duration);
                    YTPlayer.loadVideoById(id);
                    YTPlayer.seekTo(Number(song.skipDuration));
                }
            }
            $("#previewPlayerContainer").removeClass("hide-preview");
        }
    },
    "click #stop": function() {
        $("#play").attr("disabled", false);
        $("#stop").attr("disabled", true);
        $("#pause").attr("disabled", true);
        $("#forward").attr("disabled", true);
        if (previewEndSongTimeout !== undefined) {
            Meteor.clearTimeout(previewEndSongTimeout);
        }
        if (YTPlayer !== undefined && YTPlayer.stopVideo !== undefined) {
            YTPlayer.stopVideo();
        }
    },
    "click #pause": function() {
        $("#play").attr("disabled", false);
        $("#stop").attr("disabled", false);
        $("#pause").attr("disabled", true);
        $("#forward").attr("disabled", true);
        if (previewEndSongTimeout !== undefined) {
            Meteor.clearTimeout(previewEndSongTimeout);
        }
        if (YTPlayer !== undefined && YTPlayer.pauseVideo !== undefined) {
            YTPlayer.pauseVideo();
        }
    },
    "click #forward": function() {
        var error = false;
        if (YTPlayer !== undefined) {
            var duration = Number(Session.get("song").duration) | 0;
            var skipDuration = Number(Session.get("song").skipDuration) | 0;
            if (YTPlayer.getDuration() < duration + skipDuration) {
                var $toastContent = $('<span><strong>Error.</strong> The song duration is longer than the length of the video.</span>');
                Materialize.toast($toastContent, 8000);
                error = true;
            } else {
                YTPlayer.seekTo(skipDuration + duration - 10);
            }
        }
        if (!error) {
            if (previewEndSongTimeout !== undefined) {
                Meteor.clearTimeout(previewEndSongTimeout);
            }
            previewEndSongTimeout = Meteor.setTimeout(function() {
                if (YTPlayer !== undefined) {
                    YTPlayer.stopVideo();
                }
                $("#play").attr("disabled", false);
                $("#stop").attr("disabled", true);
                $("#pause").attr("disabled", true);
                $("#forward").attr("disabled", true);
                $("#previewPlayerContainer").addClass("hide-preview");
            }, 10000);
        }
    },
    "click #get-spotify-info": function() {
        var search = $("#title").val();
        var artistName = $("#artist").val();
        getSpotifyInfo(search, function(data) {
            for(var i in data){
                for(var j in data[i].items){
                    if(search.indexOf(data[i].items[j].name) !== -1 && artistName.indexOf(data[i].items[j].artists[0].name) !== -1){
                        $("#img").val(data[i].items[j].album.images[2].url).change();
                        $("#duration").val(data[i].items[j].duration_ms / 1000).change();
                        return;
                    }
                }
            }
        }, artistName);
    },
    "click #save-song-button": function() {
        var newSong = {};
        newSong.mid = $("#mid").val();
        newSong.id = $("#id").val();
        newSong.likes = Number($("#likes").val());
        newSong.dislikes = Number($("#dislikes").val());
        newSong.title = $("#title").val();
        newSong.artist = $("#artist").val();
        newSong.img = $("#img").val();
        newSong.duration = Number($("#duration").val());
        newSong.skipDuration = $("#skip-duration").val();
        newSong.requestedBy = Session.get("song").requestedBy;
        Meteor.call("updatePlaylistSong", Session.get("genre"), Session.get("song"), newSong, function(err, res) {
            console.log(err, res);
            if (err) {
                var $toastContent = $('<span><strong>Song not saved.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 8000);
            } else {
                Session.set("song", newSong);
            }
        });
    }
});

Template.register.events({
    "submit form": function(e){
        e.preventDefault();
        var username = $("#username").val()
        var email = $("#email").val()
        var password = $("#password").val();
        var captchaData = grecaptcha.getResponse();
        console.log(captchaData)
        Meteor.call("createUserMethod", {username: username, email: email, password: password}, captchaData, function(err, res) {
            grecaptcha.reset();

            if (err) {
                console.log(err);
                var errAlert = $('<div style="margin-bottom: 0" class="alert alert-danger" role="alert"><strong>Oh Snap!</strong> ' + err.reason + '</div>');
                $(".landing").before(errAlert);
                Meteor.setTimeout(function() {
                    errAlert.fadeOut(5000, function() {
                        errAlert.remove();
                    });
                }, 5000);
            } else {
                Meteor.loginWithPassword(username, password);
                Accounts.onLogin(function(){
                    window.location.href = "/";
                })
            }
        });
    },

    "click #github-login": function(){
        Meteor.loginWithGithub({loginStyle: "redirect"}, function(err, res) {
            console.log(err, res);
        });
    }
});

Template.room.events({
    "click #youtube-playlist-button": function () {
        if (!Session.get("importingPlaylist")) {
            var playlist_link = $("#youtube-playlist-input").val();
            var playlist_id = gup("list", playlist_link);
            var ytImportQueue = [];
            var totalVideos = 0;
            var videosInvalid = 0;
            var videosInQueue = 0;
            var videosInPlaylist = 0;
            var ranOnce = false;

            Session.set("importingPlaylist", true);
            $("#youtube-playlist-button").attr("disabled", "");
            $("#youtube-playlist-button").addClass("disabled");
            $("#youtube-playlist-input").attr("disabled", "");
            $("#youtube-playlist-input").addClass("disabled");
            $("#playlist-import-queue").empty();
            $("#playlist-import-queue").hide();
            $("#add-youtube-playlist").addClass("hidden-2");
            $("#import-progress").attr("aria-valuenow", 0);
            $("#import-progress").css({width: "0%"});
            $("#import-progress").text("0%");

            function makeAPICall(playlist_id, nextPageToken) {
                if (nextPageToken !== undefined) {
                    nextPageToken = "&pageToken=" + nextPageToken;
                } else {
                    nextPageToken = "";
                }
                $.ajax({
                    type: "GET",
                    url: "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=" + playlist_id + nextPageToken + "&key=AIzaSyAgBdacEWrHCHVPPM4k-AFM7uXg-Q__YXY",
                    applicationType: "application/json",
                    contentType: "json",
                    success: function (data) {
                        if (!ranOnce) {
                            ranOnce = true;
                            totalVideos = data.pageInfo.totalResults;
                        }
                        var nextToken = data.nextPageToken;
                        for (var i in data.items) {
                            var item = data.items[i];
                            if (item.snippet.thumbnails !== undefined) {
                                var genre = Session.get("type");
                                if (Playlists.find({
                                        type: genre,
                                        "songs.id": item.snippet.resourceId.videoId
                                    }, {songs: {$elemMatch: {id: item.snippet.resourceId.videoId}}}).count() !== 0) {
                                    videosInPlaylist++;
                                } else if (Queues.find({
                                        type: genre,
                                        "songs.id": item.snippet.resourceId.videoId
                                    }, {songs: {$elemMatch: {id: item.snippet.resourceId.videoId}}}).count() !== 0) {
                                    videosInQueue++;
                                } else {
                                    $("#playlist-import-queue").append(
                                        "<div class='youtube-import-queue-item'>" +
                                        "<img src='" + item.snippet.thumbnails.medium.url + "' class='song-result-thumbnail'/>" +
                                        "<div>" +
                                        "<span class='song-result-title'>" + item.snippet.title + "</span>" +
                                        "<span class='song-result-channel'>" + item.snippet.channelTitle + "</span>" +
                                        "</div>" +
                                        "<i class='fa fa-times remove-import-song'></i>" +
                                        "</div>"
                                    );
                                    var percentage = ytImportQueue.length / (totalVideos - videosInvalid) * 100;
                                    $("#import-progress").attr("aria-valuenow", percentage.toFixed(2));
                                    $("#import-progress").css({width: percentage + "%"});
                                    $("#import-progress").text(percentage.toFixed(1) + "%");
                                    ytImportQueue.push({
                                        title: item.snippet.title,
                                        id: item.snippet.resourceId.videoId
                                    });
                                }
                            } else {
                                videosInvalid++;
                            }
                        }
                        if (nextToken !== undefined) {
                            makeAPICall(playlist_id, nextToken);
                        } else {
                            $("#playlist-import-queue > div > i").click(function () {
                                var title = $(this).parent().find("div > .song-result-title").text();
                                for (var i in ytImportQueue) {
                                    if (ytImportQueue[i].title === title) {
                                        ytImportQueue.splice(i, 1);
                                    }
                                }
                                $(this).parent().remove();
                                Session.set("YTImportQueue", ytImportQueue);
                            });
                            Session.set("importingPlaylist", false);
                            $("#import-progress").attr("aria-valuenow", 100);
                            $("#import-progress").css({width: "100%"});
                            $("#import-progress").text("100%");
                            $("#youtube-playlist-button").removeAttr("disabled");
                            $("#youtube-playlist-button").removeClass("disabled");
                            $("#youtube-playlist-input").removeAttr("disabled");
                            $("#youtube-playlist-input").removeClass("disabled");
                            $("#playlist-import-queue").show();
                            $("#add-youtube-playlist").removeClass("hidden-2");
                            Session.set("YTImportQueue", ytImportQueue);
                        }
                    }
                })
            }

            makeAPICall(playlist_id);
        }
    },
    "click #add-youtube-playlist": function () {
        var YTImportQueue = Session.get("YTImportQueue");
        $("#youtube-playlist-button").attr("disabled", "");
        $("#youtube-playlist-button").addClass("disabled");
        $("#youtube-playlist-input").attr("disabled", "");
        $("#youtube-playlist-input").addClass("disabled");
        $("#import-progress").attr("aria-valuenow", 0);
        $("#import-progress").css({width: "0%"});
        $("#import-progress").text("0%");
        var failed = 0;
        var success = 0;
        var processed = 0;
        var total = YTImportQueue.length;
        YTImportQueue.forEach(function (song) {
            var songData = {type: "YouTube", id: song.id, title: song.title, artist: "", img: ""};
            Meteor.call("addSongToQueue", Session.get("type"), songData, function (err, res) {
                if (err) {
                    console.log(err);
                    failed++;
                } else {
                    success++;
                }
                processed++;
                var percentage = processed / total * 100;
                $("#import-progress").attr("aria-valuenow", percentage.toFixed(2));
                $("#import-progress").css({width: percentage + "%"});
                $("#import-progress").text(percentage.toFixed(1) + "%");
            });
        });
    },
    "click #chat-tab": function () {
        $("#chat-tab").removeClass("unread-messages");
    },
    "click #global-chat-tab": function () {
        $("#global-chat-tab").removeClass("unread-messages");
    },
    "click #sync": function () {
        if (Session.get("currentSong") !== undefined) {
            var room = Rooms.findOne({type: Session.get("type")});
            if (room !== undefined) {
                var timeIn = Date.now() - Session.get("currentSong").started - room.timePaused;
                var skipDuration = Number(Session.get("currentSong").skipDuration) | 0;
                if (YTPlayer !== undefined) {
                    YTPlayer.seekTo(skipDuration + timeIn / 1000);
                }
            }
        }
    },
    "click #lock": function () {
        Meteor.call("lockRoom", Session.get("type"));
    },
    "click #unlock": function () {
        Meteor.call("unlockRoom", Session.get("type"));
    },
    "click #chat-tab": function (e) {
        Meteor.setTimeout(function () {
            $("#chat-ul").scrollTop(100000);
        }, 1);
    },
    "click #global-chat-tab": function (e) {
        Meteor.setTimeout(function () {
            $("#global-chat-ul").scrollTop(100000);
        }, 1);
    },
    "click #submit": function () {
        sendMessage();
        Meteor.setTimeout(function () {
            $("#chat-ul").scrollTop(100000);
        }, 1000)
    },
    "click #global-submit": function () {
        sendMessageGlobal();
        Meteor.setTimeout(function () {
            $("#global-chat-ul").scrollTop(100000);
        }, 1000)
    },
    "keyup #chat-input": function (e) {
        if (e.type === "keyup" && e.which === 13) {
            e.preventDefault();
            if (!$('#chat-input').data('dropdownshown')) {
                sendMessage();
                Meteor.setTimeout(function () {
                    $("#chat-ul").scrollTop(100000);
                }, 1000)
            }
        }
    },
    "keyup #global-chat-input": function (e) {
        if (e.type === "keyup" && e.which === 13) {
            e.preventDefault();
            if (!$('#global-chat-input').data('dropdownshown')) {
                sendMessageGlobal();
                Meteor.setTimeout(function () {
                    $("#global-chat-ul").scrollTop(100000);
                }, 1000)
            }
        }
    },
    "click #like": function (e) {
        $("#like").blur();
        Meteor.call("likeSong", Session.get("currentSong").mid);
    },
    "click #dislike": function (e) {
        $("#dislike").blur();
        Meteor.call("dislikeSong", Session.get("currentSong").mid);
    },
    "click #vote-skip": function () {
        Meteor.call("voteSkip", type, function (err, res) {
            $("#vote-skip").attr("disabled", true);
        });
    },
    "click #report-prev": function (e) {
        if (Session.get("previousSong") !== undefined) {
            Session.set("reportPrevious", true);
            $("#report-prev").prop("disabled", true);
            $("#report-curr").prop("disabled", false);
        }
    },
    "click #report-curr": function (e) {
        Session.set("reportPrevious", false);
        $("#report-prev").prop("disabled", false);
        $("#report-curr").prop("disabled", true);
    },
    "click #report-modal": function () {
        Session.set("currentSongR", Session.get("currentSong"));
        Session.set("previousSongR", Session.get("previousSong"));
    },
    "click #add-song-button": function (e) {
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
        if (Playlists.find({
                type: genre,
                "songs.id": songData.id
            }, {songs: {$elemMatch: {id: songData.id}}}).count() !== 0) {
            $("<div class='alert alert-danger alert-dismissible' role='alert' style='margin-bottom: 0'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'><i class='fa fa-times'></i></span></button><strong>Song not added.</strong> This song is already in the playlist.</div>").prependTo($(".landing")).delay(7000).fadeOut(1000, function () {
                $(this).remove();
            });
        } else if (Queues.find({
                type: genre,
                "songs.id": songData.id
            }, {songs: {$elemMatch: {id: songData.id}}}).count() !== 0) {
            $("<div class='alert alert-danger alert-dismissible' role='alert' style='margin-bottom: 0'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'><i class='fa fa-times'></i></span></button><strong>Song not added.</strong> This song has already been requested.</div>").prependTo($(".landing")).delay(7000).fadeOut(1000, function () {
                $(this).remove();
            });
        } else {
            Meteor.call("addSongToQueue", genre, songData, function (err, res) {
                console.log(err, res);
                if (err) {
                    $("<div class='alert alert-danger alert-dismissible' role='alert' style='margin-bottom: 0'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'><i class='fa fa-times'></i></span></button><strong>Song not added.</strong> Something went wrong.</div>").prependTo($(".landing")).delay(7000).fadeOut(1000, function () {
                        $(this).remove();
                    });
                } else {
                    $("<div class='alert alert-success alert-dismissible' role='alert' style='margin-bottom: 0'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'><i class='fa fa-times'></i></span></button><strong>Song added.</strong> Your song has been added to the queue.</div>").prependTo($(".landing")).delay(7000).fadeOut(1000, function () {
                        $(this).remove();
                    });
                }
            });
        }
        $("#close-modal-a").click();
    },
    "click #toggle-video": function (e) {
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
    "click #return": function (e) {
        $("#add-info").hide();
        $("#search-info").show();
    },
    "click #search-song": function () {
        var songs = [];
        $("#song-results").empty();
        $.ajax({
            type: "GET",
            url: "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + $("#song-input").val() + "&key=AIzaSyAgBdacEWrHCHVPPM4k-AFM7uXg-Q__YXY",
            applicationType: "application/json",
            contentType: "json",
            success: function (data) {
                for (var i in data.items) {
                    var item = data.items[i];
                    $("#song-results").append(
                        "<div>" +
                        "<img src='" + item.snippet.thumbnails.medium.url + "' class='song-result-thumbnail'/>" +
                        "<div>" +
                        "<span class='song-result-title'>" + item.snippet.title + "</span>" +
                        "<span class='song-result-channel'>" + item.snippet.channelTitle + "</span>" +
                        "</div>" +
                        "</div>"
                    );
                    songs.push({title: item.snippet.title, id: item.id.videoId});
                }
                $("#song-results > div").click(function () {
                    $("#search-info").hide();
                    $("#add-info").show();
                    var title = $(this).find("div > .song-result-title").text();
                    for (var i in songs) {
                        if (songs[i].title === title) {
                            var songObj = {
                                id: songs[i].id,
                                title: songs[i].title,
                                type: "youtube"
                            };
                            $("#title").val(songObj.title);
                            $("#artist").val("");
                            $("#id").val(songObj.id);
                            getSpotifyInfo(songObj.title.replace(/\[.*\]/g, ""), function (data) {
                                if (data.tracks.items.length > 0) {
                                    $("#title").val(data.tracks.items[0].name);
                                    var artists = [];
                                    $("#img").val(data.tracks.items[0].album.images[2].url);
                                    data.tracks.items[0].artists.forEach(function (artist) {
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
    },
    "click #volume-icon": function () {
        var volume = 0;
        var slider = $("#volume-slider").slider();
        $("#volume-icon").removeClass("fa-volume-down").addClass("fa-volume-off")
        if (YTPlayer !== undefined) {
            YTPlayer.setVolume(volume);
            localStorage.setItem("volume", volume);
            $("#volume-slider").slider("setValue", volume);
        }
    },
    "click #play": function () {
        Meteor.call("resumeRoom", type);
    },
    "click #pause": function () {
        Meteor.call("pauseRoom", type);
    },
    "click #skip": function () {
        Meteor.call("skipSong", type);
    },
    "click #shuffle": function () {
        Meteor.call("shufflePlaylist", type);
    },
    "change input": function (e) {
        if (e.target && e.target.id) {
            var partsOfId = e.target.id.split("-");
            partsOfId[1] = partsOfId[1].charAt(0).toUpperCase() + partsOfId[1].slice(1);
            var camelCase = partsOfId.join("");
            Session.set(camelCase, e.target.checked);
        }
    },
    "click #report-song-button": function () {
        var room = Session.get("type");
        var reportData = {};
        reportData.song = Session.get("currentSong").mid;
        reportData.type = [];
        reportData.reason = [];

        $(".report-layer-1 > .checkbox input:checked").each(function () {
            reportData.type.push(this.id);
            if (this.id == "report-other") {
                var otherText = $(".other-textarea").val();
            }
        });

        $(".report-layer-2 input:checked").each(function () {
            reportData.reason.push(this.id);
        });

        console.log(reportData);
        Meteor.call("submitReport", room, reportData, Session.get("id"), function () {
            $("#close-modal-r").click();
        });
    },
    "change #si_or_pl": function () {
        if ($("#select_playlist").is(':selected')) {
            $("#search-info").hide();
            $("#playlist-import").show();
        }
        if ($("#select_single").is(':selected')) {
            $("#search-info").show();
            $("#playlist-import").hide();
        }
    },
    "click #close-modal-a": function () {
        $("#select_single").attr("selected", true);
        $("#search-info").show();
        $("#playlist-import").hide();
    }
});

Template.room.helpers({
    singleVideo: function() {
        return true;
    },
    chat: function() {
        Meteor.setTimeout(function() {
            var elem = document.getElementById('chat');
            if (elem !== undefined && elem !== null) {
                elem.scrollTop = elem.scrollHeight;
            }
        }, 100);
        return Chat.find({type: Session.get("type")}, {sort: {time: -1}, limit: 50 }).fetch().reverse();
    },
    globalChat: function() {
        Meteor.setTimeout(function() {
            var elem = document.getElementById('global-chat');
            if (elem !== undefined && elem !== null) {
                elem.scrollTop = elem.scrollHeight;
            }
        }, 100);
        return Chat.find({type: "global"}, {sort: {time: -1}, limit: 50 }).fetch().reverse();
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
    paused: function() {
        return Session.get("state") === "paused";
    },
    private: function() {
        return Rooms.findOne({type: Session.get("type")}).private === true;
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

            if ($("#player").length !== 1) {
                $("#media-container").append('<div id="player" class="embed-responsive-item"></div>');
            }
            $("#player").show();
            function loadVideo() {
                if (!Session.get("YTLoaded")) {
                    Session.set("loadVideoTimeout", Meteor.setTimeout(function () {
                        loadVideo();
                    }, 500));
                } else {
                    if (YTPlayer === undefined) {
                        YTPlayer = new YT.Player("player", {
                            height: 540,
                            width: 960,
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

                if (room.currentSong.song !== undefined && (currentSongR === undefined || room.currentSong.started !== currentSongR.started)) {
                    Session.set("previousSong", currentSong);
                    currentSongR = room.currentSong;

                    currentSong = room.currentSong.song;
                    currentSong.started = room.currentSong.started;
                    Session.set("currentSong", currentSong);
                    Meteor.clearTimeout(Session.get("loadVideoTimeout"));
                    startSong();
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
// Settings Template
Template.settings.events({
    "click #save-settings": function() {
        Meteor.call("updateSettings", $("#showRating").is(":checked"));
    },
    "click #delete-account": function(){
        $("#delete-account").text("Click to confirm");
        $("#delete-account").click(function(){
            var bool = confirm("Are you sure you want to delete your account?");
            if(bool) {
                Meteor.call("deleteAccount");
            } else{
                $("#delete-account").text("Delete");
            }
        })
    },
    "click #change-password": function(){
        var oldPassword = $("#old-password").val();
        var newPassword= $("#new-password").val();
        var confirmPassword = $("#confirm-password").val();
        if(newPassword === confirmPassword){
            Accounts.changePassword(oldPassword, newPassword, function(err){
                if(err){
                    $("#old-password").val("");
                    $("#new-password").val("");
                    $("#confirm-password").val("");
                    $("<div class='alert alert-danger alert-dismissible' role='alert' style='margin-bottom: 0'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'><i class='fa fa-times'></i></span></button><strong>Oh Snap! </strong>" + err.reason + "</div>").prependTo($("#head")).delay(7000).fadeOut(1000, function() { $(this).remove(); });
                } else {
                    $("#old-password").val("");
                    $("#new-password").val("");
                    $("#confirm-password").val("");
                    $("<div class='alert alert-success alert-dismissible' role='alert' style='margin-bottom: 0'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'><i class='fa fa-times'></i></span></button><strong>Hooray!</strong> You changed your password successfully.</div>").prependTo($("#head")).delay(7000).fadeOut(1000, function() { $(this).remove(); });
                }
            });
        }
    }
});

var previewEndSongTimeout = undefined;