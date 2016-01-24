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
        $("#desc_text").val(Rooms.findOne({type: Session.get("roomDesc")}).roomDesc);
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
        Meteor.call("addSongToPlaylist", this, function(err) {
            console.log(err);
            if (err) {
                var $toastContent = $('<span><strong>Song not added.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 8000);
            }
        });
    },
    "click .deny-song-button": function(e){
        var genre = $(e.target).data("genre") || $(e.target).parent().data("genre");
        Meteor.call("removeSongFromQueue", this.mid);
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
        newSong.genres = Session.get("song").genres;
        if(newSong.skipDuration === undefined){
            newSong.skipDuration = 0;
        }
        Meteor.call("updateQueueSong", newSong.mid, newSong, function(err, res) {
            if (err) {
                var $toastContent = $('<span><strong>Song not saved.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 8000);
            } else {
                var $toastContent = $('<span><strong>Song saved!</strong> No errors were found.</span>');
                Materialize.toast($toastContent, 4000);
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
        Meteor.call("removeSongFromPlaylist", this.mid);
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
        newSong.genres = Session.get("song").genres;
        Meteor.call("updatePlaylistSong", newSong.mid, newSong, function(err, res) {
            console.log(err, res);
            if (err) {
                var $toastContent = $('<span><strong>Song not saved.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 8000);
            } else {
                var $toastContent = $('<span><strong>Song saved!</strong> No errors were found.</span>');
                Materialize.toast($toastContent, 4000);
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

/*Template.room.events({

});*/

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
