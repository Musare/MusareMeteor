var feedbackData;
function gup( name, url ) {
    if (!url) url = location.href;
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]"+name+"=([^&#]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( url );
    return results == null ? null : results[1];
}

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
    var message = $("#chat-message").val();
    if (!$("#chat-message").hasClass("disabled")) {
        if (message.length > 0 && message[0] !== " ") {
            if (message[0] === "/") {
                message = message.split("");
                message.shift();
                message = message.join("");
                var params = message.split(" ");
                var command = params.shift();
                command = command.replace(/\r?\n|\r/g, "");
                if (executeCommand(command, params)) {
                    $("#chat-message").val("");
                } else {
                    $("#chat-message").val("");
                }
            } else {
                Meteor.call("sendMessage", "global", message, function (err, res) {
                    if (res) {
                        $("#chat-message").val("");
                    }
                });
            }
        }
    }
}

Template.admin.events({
    "click a": function(e) {
        var target = $(e.target);
        if (target.hasClass("activate-alert-button") || target.parent().hasClass("activate-alert-button")) {
            var id = target.data("id") || target.parent().data("id");
            Meteor.call("activateAlert", id);
        } else if (target.hasClass("deactivate-alert-button") || target.parent().hasClass("deactivate-alert-button")) {
            var id = target.data("id") || target.parent().data("id");
            Meteor.call("deactivateAlert", id);
        }
    },
    "click #croom_create": function() {
        Meteor.call("createRoom", $("#croom_display").val(), $("#croom_tag").val(), $("#croom_private").prop("checked"), $("#croom_desc").val(), function (err, res) {
            if (err) {
                var $toastContent = $('<span><strong>Room not added.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 8000);
            } else {
                window.location = "/" + $("#croom_tag").val();
            }
        });
    },
    "click #submit-alert": function(){
        var alertDesc = $("#alert-desc").val()
        if(alertDesc !== ""){
            Meteor.call("addAlert", alertDesc);
        }
    },
    "click .delete-alert-button": function(e) {
        var target = $(e.target);
        var id = $(e.target).data("id") || target.parent().data("id");
        Meteor.call("deleteAlert", id);
    }
});

Template.feedback.events({
    "click #feedback_submit": function(){
        if(Meteor.userId()){
            if($("#feedback_message").val().length !== 0 && $("#feedback_message").hasClass("invalid") === false){
                Meteor.call("sendFeedback", $("#feedback_message").val());
                $("#feedback_message").val("");
                $("#createFeedback").closeModal()
            } else{
                var $toastContent = $('<span><strong>Feedback not sent.</strong> Possible reasons include:<ul><li>- Empty Feedback Message</li><li>- Feedback is more than 500 words</li></ul></span>');
                Materialize.toast($toastContent, 8000);
            }
        } else {
            var $toastContent = $('<span><strong>Feedback not sent.</strong> You must be logged in.</span>');
            Materialize.toast($toastContent, 4000);
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
    },
    "click #profile": function(){
        window.location = "/u/" + Meteor.user().profile.username;
    }
});

Template.playlist.events({
    "keyup #search-playlist": function(){
        if($("#search-playlist").val().length === 0){
            $(".pl-item").show();
            $("#up-next").show();
        } else {
            $("#up-next").hide();
            $(".pl-item").hide();
            var input = $("#search-playlist").val().toLowerCase();
            $(".pl-item .pl-title").each(function(i, el){
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
    "click #promote-rank": function() {
        var username = Session.get("username");
        Meteor.call("promoteUserRank", username);
    },
    "click #demote-rank": function() {
        var username = Session.get("username");
        Meteor.call("demoteUserRank", username);
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
        $("#genres").val(this.genres).change();
        $("#genres").material_select();
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
                            // if (event.data == YT.PlayerState.UNSTARTED) {
                            //     if (seekerBarInterval !== undefined) {
                            //         Meteor.clearInterval(seekerBarInterval);
                            //         seekerBarInterval = undefined;
                            //     }
                            //     $(".seeker-bar").css({width: "0"});
                            //     $("#time-elapsed").text("0:00");
                            //     $("#previewPlayerContainer").addClass("hide-preview");
                            //     console.log("HIDE MEY STACY!!!!")
                            // }
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
                        $("#img").val(data[i].items[j].album.images[0].url).change();
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
        newSong.genres = $("#genres").val() || [];
        if(newSong.skipDuration === undefined){
            newSong.skipDuration = 0;
        }
        Meteor.call("updateQueueSong", newSong.mid, newSong, function(err, res) {
            if (err) {
                var $toastContent = $('<span><strong>Song not saved.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 8000);
            } else {
                $("#editModal").closeModal();
                var $toastContent = $('<span><strong>Song saved!</strong> No errors were found.</span>');
                Materialize.toast($toastContent, 4000);
                Session.set("song", newSong);
            }
        });
    }
});

Template.manageStation.events({
    /* TODO Add undo delete button */
    "click #editDescButton": function() {
        var parts = location.href.split('/');
        parts.pop();
        var id = parts.pop();
        var type = id.toLowerCase();
        var editingDesc = Session.get("editingDesc");
        if (!editingDesc) {
            Session.set("editingDesc", !editingDesc);
        } else {
            var newDesc = $("#editDesc").val();
            Meteor.call("editRoomDesc", type, newDesc);
            Session.set("editingDesc", !editingDesc);
        }
    },
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
                            // if (event.data == YT.PlayerState.UNSTARTED) {
                            //     if (seekerBarInterval !== undefined) {
                            //         Meteor.clearInterval(seekerBarInterval);
                            //         seekerBarInterval = undefined;
                            //     }
                            //     $(".seeker-bar").css({width: "0"});
                            //     $("#time-elapsed").text("0:00");
                            //     $("#previewPlayerContainer").addClass("hide-preview");
                            // }
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
                        $("#img").val(data[i].items[j].album.images[0].url).change();
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
        newSong.genres = $("#genres").val();
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
    },
    "click .remove-report-button": function(){
        var parts = location.href.split('/');
        parts.pop();
        var id = parts.pop();
        var query = {room: id.toLowerCase()};
        var obj = $(this)[0];
        Meteor.call("removeReport", query, obj);
    },
    "click #deleteRoom": function(){
        var type = location.href.split("/")[3];
        Meteor.call("deleteRoom", type, function(err,res){
            window.location.href = "/";
        })
    }
});

Template.manageSongs.events({
    /* TODO Add undo delete button */
    "change #show_genres_cb": function() {
        var selected = $("#show_genres_cb").is(":checked");
        Session.set("showGenres", selected);
    },
    "change #show_no_genres_cb": function() {
        var selected = $("#show_no_genres_cb").is(":checked");
        Session.set("showNoGenres", selected);
    },
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
        $("#genres").val(this.genres).change();
        $("#genres").material_select();
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
    "click .remove-song-button": function(){
        Meteor.call("deleteSong", this.mid);
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
                            // if (event.data == YT.PlayerState.UNSTARTED) {
                            //     if (seekerBarInterval !== undefined) {
                            //         Meteor.clearInterval(seekerBarInterval);
                            //         seekerBarInterval = undefined;
                            //     }
                            //     $(".seeker-bar").css({width: "0"});
                            //     $("#time-elapsed").text("0:00");
                            //     $("#previewPlayerContainer").addClass("hide-preview");
                            // }
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
                        $("#img").val(data[i].items[j].album.images[0].url).change();
                        $("#duration").val(data[i].items[j].duration_ms / 1000).change();
                        return;
                    }
                }
            }
        }, artistName);
    },
    "click #save-song-button": function() {_
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
        newSong.genres = $("#genres").val() || [];
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

Template.loginRegister.events({
    "submit #register_form": function(e){
        e.preventDefault();
        var username = $("#register_username").val();
        var email = $("#register_email").val();
        var password = $("#register_password").val();
        var acceptedTermsAndPrivacy = $("#termsPrivacyBTN").is(":checked");
        var captchaData = grecaptcha.getResponse();
        if (acceptedTermsAndPrivacy) {
            Meteor.call("createUserMethod", {username: username, email: email, password: password}, captchaData, function(err, res) {
                grecaptcha.reset();

                if (err) {
                    console.log(err);
                    var $toastContent = $('<span><strong>Oh snap!</strong> ' + err.reason + '</span>');
                    Materialize.toast($toastContent, 8000);
                } else {
                    Meteor.loginWithPassword(username, password);
                    Accounts.onLogin(function(){
                        window.location.href = "/";
                    })
                }
            });
        } else {
            var $toastContent = $('<span><strong>Oh snap!</strong> Please read and accept the Terms and Conditions and the Privacy Policy.</span>');
            Materialize.toast($toastContent, 8000);
        }
    },
    "submit #login_form": function(e){
        e.preventDefault();
        Session.set("github", false);
        var username = $("#login_username").val()
        var password = $("#login_password").val();
        Meteor.loginWithPassword(username, password, function(err) {
            if (err) {
                var $toastContent = $('<span><strong>Oh snap!</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 8000);
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

Template.news.events({
    "click #createArticleButton": function() {
        var title = $("#title").val();
        var content = $("#content").val();
        var content = content.replace(/(?:\r\n|\r|\n)/g, '</p><p>');
        var anonymous = $("#anonymous").is(":checked");
        Meteor.call("createArticle", {title: title, content: content, anonymous: anonymous}, function(err, res) {
            if (err) {
                var $toastContent = $('<span><strong>Article not created.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 8000);
            } else {
                $('#createArticle').closeModal()
                $("#title").val("").change();
                $("#content").val("").change();
                $("#anonymous").prop("checked", false).change();
            }
        });
    }
});

Template.room.events({
    "click #logout": function() {
        Meteor.logout();
    },
    "input #volume_slider": function() {
        var volume = Number($("#volume_slider").val());
        localStorage.setItem("volume", volume);
        if (YTPlayer !== undefined) {
            YTPlayer.setVolume(volume);
        }
    },
    "click #add-song-modal-button": function() {
        Session.set("songResults", []);
    },
    "click #return-button": function() {
        Session.set("editingSong", false);
    },
    "click #removeSong": function(e) {
        var id = $(e.target).data("result");
        var songs = Session.get("songResults");
        var currentSong;
        songs = songs.filter(function(song) {
            return id !== song.id;
        });
        Session.set("songResults", []);
        Session.set("songResults", songs);
    },
    "click #addSong": function(e) {
        var id = $(e.target).data("result");
        var songs = Session.get("songResults");
        var currentSong;
        songs.forEach(function(song) {
            if (song.id === id) {
                currentSong = song;
            }
        });
        Session.set("editingSong", true);
        var title = currentSong.title;
        var artist = currentSong.artist;
        var img = currentSong.img;
        getSpotifyInfo(title.replace(/\[.*\]/g, ""), function (data) {
            if (data.tracks.items.length > 0) {
                title = data.tracks.items[0].name;
                var artists = [];
                img = data.tracks.items[0].album.images[0].url;
                data.tracks.items[0].artists.forEach(function (artist) {
                    artists.push(artist.name);
                });
                artist = artists.join(", ");
                $("#title").val(title).change();
                $("#artist").val(artist).change();
                $("#img").val(img).change();
                $("#id").val(id).change();
                $("#genres").val(null).change();
            } else {
                $("#title").val(title).change();
                $("#artist").val(artist).change();
                $("#img").val(img).change();
                $("#id").val(id).change();
                $("#genres").val(null).change();
                // I give up for now... Will fix this later. -Kris
            }
        });
    },
    "click #import-playlist-button": function () {
        if (!Session.get("importingPlaylist")) {
            Session.set("songResults", []);
            var playlist_link = $("#playlist-url").val();
            var playlist_id = gup("list", playlist_link);
            var ytImportQueue = [];
            var totalVideos = 0;
            var videosInvalid = 0;
            var videosInQueue = 0;
            var videosInPlaylist = 0;
            var ranOnce = false;

            Session.set("importingPlaylist", true);
            $("#import-playlist-button").attr("disabled", "");
            $("#import-playlist-button").addClass("disabled");
            $("#playlist-url").attr("disabled", "");
            $("#playlist-url").addClass("disabled");

            $("#import-progress").css({width: "0%"});

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
                                    var percentage = ytImportQueue.length / (totalVideos - videosInvalid) * 100;
                                    $("#import-progress").css({width: percentage + "%"});
                                    ytImportQueue.push({title: item.snippet.title, artist: item.snippet.channelTitle, id: item.snippet.resourceId.videoId, image: item.snippet.thumbnails.medium.url});
                                }
                            } else {
                                videosInvalid++;
                            }
                        }
                        if (nextToken !== undefined) {
                            makeAPICall(playlist_id, nextToken);
                        } else {
                            /*$("#playlist-import-queue > div > i").click(function () {
                                var title = $(this).parent().find("div > .song-result-title").text();
                                for (var i in ytImportQueue) {
                                    if (ytImportQueue[i].title === title) {
                                        ytImportQueue.splice(i, 1);
                                    }
                                }
                                $(this).parent().remove();
                                Session.set("YTImportQueue", ytImportQueue);
                            });*/
                            Session.set("importingPlaylist", false);
                            $("#import-progress").css({width: "100%"});
                            $("#import-playlist-button").removeAttr("disabled");
                            $("#import-playlist-button").removeClass("disabled");
                            $("#playlist-url").removeAttr("disabled");
                            $("#playlist-url").removeClass("disabled");
                            Session.set("YTImportQueue", ytImportQueue);
                            Session.set("songResults", ytImportQueue);
                        }
                    },
                    error: function() {
                        Session.set("importingPlaylist", false);
                        $("#import-progress").css({width: "0%"});
                        $("#import-playlist-button").removeAttr("disabled");
                        $("#import-playlist-button").removeClass("disabled");
                        $("#playlist-url").removeAttr("disabled");
                        $("#playlist-url").removeClass("disabled");
                    }
                })
            }

            makeAPICall(playlist_id);
        }
    },
    "click #confirm-import": function () {
        var YTImportQueue = Session.get("YTImportQueue");
        $("#import-playlist-button").attr("disabled", "");
        $("#import-playlist-button").addClass("disabled");
        $("#playlist-url").attr("disabled", "");
        $("#playlist-url").addClass("disabled");
        $("#import-progress").css({width: "0%"});
        var failed = 0;
        var success = 0;
        var processed = 0;
        var total = YTImportQueue.length;
        YTImportQueue.forEach(function (song) {
            var songData = {id: song.id, title: song.title, artist: "NONE", genres: [Session.get("type")]};
            Meteor.call("addSongToQueue", songData, function (err, res) {
                if (err) {
                    console.log(err);
                    failed++;
                } else {
                    success++;
                }
                processed++;
                var percentage = processed / total * 100;
                $("#import-progress").css({width: percentage + "%"});
                if (processed === total) {
                    $("#import-progress").css({width: "0%"});
                    var $toastContent = $('<span>' + failed + ' songs failed to import. ' + success + ' songs successfully imported.</span>');
                    Materialize.toast($toastContent, 4000);
                }
            });
        });
        $("#import-playlist-button").removeAttr("disabled");
        $("#import-playlist-button").removeClass("disabled");
        $("#playlist-url").removeAttr("disabled", "");
        $("#playlist-url").removeClass("disabled");
        Session.set("songResults", []);
        Session.set("YTImportQueue", [])
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
        Meteor.call("lockRoom", Session.get("type"), function(err) {
            if(err){
                var $toastContent = $('<span><strong>Room not locked.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 4000);
            } else {
                var $toastContent = $('<span><strong>Room locked.</strong></span>');
                Materialize.toast($toastContent, 4000);
            }
        });
    },
    "click #unlock": function () {
        Meteor.call("unlockRoom", Session.get("type"), function(err) {
            if(err){
                var $toastContent = $('<span><strong>Room not unlocked.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 4000);
            } else {
                var $toastContent = $('<span><strong>Room unlocked.</strong></span>');
                Materialize.toast($toastContent, 4000);
            }
        });
    },
    "click #submit": function () {
        if(Meteor.userId()){
            sendMessageGlobal();
            Meteor.setTimeout(function () {
                $(".chat-ul").scrollTop(100000);
            }, 1000)
        } else {
            var $toastContent = $('<span>Message not sent. You must log in</span>');
            Materialize.toast($toastContent, 2000);
        }
    },
    "keyup #chat-message": function (e) {
        if (e.type === "keyup" && e.which === 13) {
            if(Meteor.userId()){
                e.preventDefault();
                if (!$('#chat-message').data('dropdownshown')) {
                    sendMessageGlobal();
                    Meteor.setTimeout(function () {
                        $(".chat-ul").scrollTop(100000);
                    }, 1000)
                }
            } else {
                var $toastContent = $('<span>Message not sent. You must log in</span>');
                Materialize.toast($toastContent, 2000);
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
        Meteor.call("voteSkip", Session.get("type"), function (err, res) {
            $("#vote-skip").addClass("disabled");
            if(err){
                var $toastContent = $('<span><strong>Vote not submitted</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 4000);
            }
        });
    },
    "click #report-prev": function (e) {
        if (Session.get("previousSong") !== undefined) {
            Session.set("reportPrevious", true);
            $("#report-prev").addClass("disabled");
            $("#report-curr").removeClass("disabled");
        }
    },
    "click #report-curr": function (e) {
        Session.set("reportPrevious", false);
        $("#report-prev").removeClass("disabled");
        $("#report-curr").addClass("disabled");
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
        var genres = $("#genres").val() || [];
        var songData = {type: type, id: id, title: title, artist: artist, genres: genres};
        if (Songs.find({"id": songData.id}).count() > 0) {
            var $toastContent = $('<span><strong>Song not added.</strong> This song has already been added.</span>');
            Materialize.toast($toastContent, 8000);
        } else if (Queues.find({"id": songData.id}).count() > 0) {
            var $toastContent = $('<span><strong>Song not added.</strong> This song has already been requested.</span>');
            Materialize.toast($toastContent, 3000);
        } else {
            Meteor.call("addSongToQueue", songData, function (err, res) {
                console.log(err, res);
                if (err) {
                    var $toastContent = $('<span><strong>Song not added.</strong> ' + err.reason + '</span>');
                    Materialize.toast($toastContent, 3000);
                } else {
                    var $toastContent = $('<span><strong>Song added.</strong> Your song has succesfully been added to the queue.</span>');
                    Materialize.toast($toastContent, 3000);
                    $('#add_song_modal').closeModal();
                    Session.set("editingSong", false);
                }
            });
        }
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
        Session.set("songResults", songs);
        $.ajax({
            type: "GET",
            url: "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + $("#song-input").val() + "&key=AIzaSyAgBdacEWrHCHVPPM4k-AFM7uXg-Q__YXY&type=video&maxResults=25",
            applicationType: "application/json",
            contentType: "json",
            success: function (data) {
                for (var i in data.items) {
                    var item = data.items[i];
                    songs.push({title: item.snippet.title, artist: item.snippet.channelTitle, id: item.id.videoId, image: item.snippet.thumbnails.medium.url});
                }
                Session.set("songResults", songs);
                /*$("#song-results > div").click(function () {
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
                })*/
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
        Meteor.call("resumeRoom", Session.get("type"), function (err, res) {
            if (err) {
                var $toastContent = $('<span><strong>Room not resumed.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 4000);
            } else {
                var $toastContent = $('<span><strong>Room resumed.</strong></span>');
                Materialize.toast($toastContent, 4000);
            }
        });
    },
    "click #pause": function () {
        Meteor.call("pauseRoom", Session.get("type"), function (err, res) {
            if (err) {
                var $toastContent = $('<span><strong>Room not paused.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 4000);
            } else {
                var $toastContent = $('<span><strong>Room paused.</strong></span>');
                Materialize.toast($toastContent, 4000);
            }
        });
    },
    "click #skip": function () {
        Meteor.call("skipSong", Session.get("type"));
    },
    "click #shuffle": function () {
        Meteor.call("shufflePlaylist", Session.get("type"));
    },
    "change input": function (e) {
        /*if (e.target && e.target.id) {
            var partsOfId = e.target.id.split("-");
            partsOfId[1] = partsOfId[1].charAt(0).toUpperCase() + partsOfId[1].slice(1);
            var camelCase = partsOfId.join("");
            Session.set(camelCase, e.target.checked);
        }*/
    },
    "click #report-song-button": function () {
        var room = Session.get("type");
        var reportData = {};
        if (Session.get("reportPrevious") === false) {
            reportData.song = Session.get("previousSongR").mid;
        } else {
            reportData.song = Session.get("currentSongR").mid;
        }
        reportData.type = [];
        reportData.reason = [];

        $(".report-layer-1 > div > input:checked").each(function (){
            reportData.type.push(this.id);
        });

        $(".report-layer-2 input:checked").each(function () {
            reportData.reason.push(this.id);
        });

        Meteor.call("submitReport", room, reportData, function () {
            $("report_modal").closeModal();
        });
    },
    "change #si_or_pl": function () {
        Session.set("songResults", []);
        Session.set("si_or_pl", $("#si_or_pl").val());
    },
    "click #close-modal-a": function () {
        $("#select_single").attr("selected", true);
        $("#search-info").show();
        $("#playlist-import").hide();
    },
    "click #admin-dropdown a": function(){
        Meteor.setTimeout(function(){
            $(".dropdown-button").click();
        }, 10);
    }
});

Template.communityStation.events({
    "click #search-song": function () {
        var songs = [];
        Session.set("songResults", songs);
        $.ajax({
            type: "GET",
            url: "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + $("#song-input").val() + "&key=AIzaSyAgBdacEWrHCHVPPM4k-AFM7uXg-Q__YXY&type=video&maxResults=15",
            applicationType: "application/json",
            contentType: "json",
            success: function (data) {
                for (var i in data.items) {
                    var item = data.items[i];
                    songs.push({title: item.snippet.title, artist: item.snippet.channelTitle, id: item.id.videoId, image: item.snippet.thumbnails.medium.url});
                }
                Session.set("songResults", songs);
            }
        })
    },
    "click #add-song-to-queue-search-button": function () {
        var songs = [];
        Session.set("songResultsQueue", songs);
        $.ajax({
            type: "GET",
            url: "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + $("#add-song-to-queue-search").val() + "&key=AIzaSyAgBdacEWrHCHVPPM4k-AFM7uXg-Q__YXY&type=video&maxResults=15",
            applicationType: "application/json",
            contentType: "json",
            success: function (data) {
                for (var i in data.items) {
                    var item = data.items[i];
                    songs.push({title: item.snippet.title, artist: item.snippet.channelTitle, id: item.id.videoId, image: item.snippet.thumbnails.medium.url});
                }
                Session.set("songResultsQueue", songs);
            }
        })
    },
    "click #logout": function() {
        Meteor.logout();
    },
    "click #delete_room": function() {
        var name = Session.get("CommunityStationName");
        Meteor.call("deleteCommunityStation", name, function(err) {
            if (err) {
                console.log(err);
                var $toastContent = $('<span><strong>Room not deleted.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 2000);
            } else {
                var $toastContent = $('<span><strong>Room deleted.</strong></span>');
                Materialize.toast($toastContent, 2000);
            }
        });
        $("#edit_room_modal").closeModal();
    },
    "click #save_edit_room_changes": function() {
        var name = Session.get("CommunityStationName");
        var display = $("#edit_room_display").val();
        var desc = $("#edit_room_description").val();
        var privacy = $("#edit_room_privacy").val();
        var room = CommunityStations.findOne({name: name});
        var partyMode = $("#partyModeEnabled").is(":checked");
        if (desc !== room.roomDesc) {
            Meteor.call("changeCommunityStationDescription", name, desc, function (err) {
                if (err) {
                    var $toastContent = $('<span><strong>Description not changed.</strong> ' + err.reason + '</span>');
                    Materialize.toast($toastContent, 2000);
                } else {
                    var $toastContent = $('<span><strong>Description changed.</strong></span>');
                    Materialize.toast($toastContent, 2000);
                }
            });
        }
        if (display !== room.displayName) {
            Meteor.call("changeCommunityStationDisplayName", name, display, function (err) {
                if (err) {
                    var $toastContent = $('<span><strong>Display Name not changed.</strong> ' + err.reason + '</span>');
                    Materialize.toast($toastContent, 2000);
                } else {
                    var $toastContent = $('<span><strong>Display Name changed.</strong></span>');
                    Materialize.toast($toastContent, 2000);
                }
            });
        }
        if (privacy !== room.privacy) {
            Meteor.call("changeCommunityStationPrivacy", name, privacy, function (err) {
                if (err) {
                    var $toastContent = $('<span><strong>Privacy not changed.</strong> ' + err.reason + '</span>');
                    Materialize.toast($toastContent, 2000);
                } else {
                    var $toastContent = $('<span><strong>Privacy changed.</strong></span>');
                    Materialize.toast($toastContent, 2000);
                }
            });
        }
        if (partyMode !== room.partyModeEnabled) {
            Meteor.call("setCommunityStationPartyMode", name, partyMode, function (err) {
                if (err) {
                    var $toastContent = $('<span><strong>Party mode not changed.</strong> ' + err.reason + '</span>');
                    Materialize.toast($toastContent, 2000);
                } else {
                    var $toastContent = $('<span><strong>Party mode changed.</strong></span>');
                    Materialize.toast($toastContent, 2000);
                }
            });
        }
        if (partyMode) {
            var queueLocked = $("#queueLocked").is(":checked");
            if (queueLocked !== room.queueLocked) {
                Meteor.call("setCommunityStationQueueLocked", name, queueLocked, function (err, res) {
                    if (err) {
                        if (queueLocked) {
                            var $toastContent = $('<span><strong>Queue not locked.</strong> ' + err.reason + '</span>');
                            Materialize.toast($toastContent, 2000);
                        } else {
                            var $toastContent = $('<span><strong>Queue not unlocked.</strong> ' + err.reason + '</span>');
                            Materialize.toast($toastContent, 2000);
                        }
                    } else {
                        if (queueLocked) {
                            var $toastContent = $('<span><strong>Queue locked.</strong></span>');
                            Materialize.toast($toastContent, 2000);
                        } else {
                            var $toastContent = $('<span><strong>Queue unlocked.</strong></span>');
                            Materialize.toast($toastContent, 2000);
                        }
                    }
                });
            }
        }
        $("#edit_room_modal").closeModal();
    },
    "input #volume_slider": function() {
        var volume = Number($("#volume_slider").val());
        localStorage.setItem("volume", volume);
        if (YTPlayer !== undefined) {
            YTPlayer.setVolume(volume);
        }
    },
    "click #global-chat-tab": function () {
        $("#global-chat-tab").removeClass("unread-messages");
    },
    "click #sync": function () {
        if (Session.get("currentSong") !== undefined) {
            var room = CommunityStations.findOne({name: Session.get("CommunityStationName")});
            if (room !== undefined) {
                var timeIn = Date.now() - Session.get("currentSong").started - room.timePaused;
                if (YTPlayer !== undefined) {
                    YTPlayer.seekTo(timeIn / 1000);
                }
            }
        }
    },
    "click #submit": function () {
        if(Meteor.userId()){
            sendMessageGlobal();
            Meteor.setTimeout(function () {
                $("#chat-ul").scrollTop(100000);
            }, 1000)
        } else {
            var $toastContent = $('<span>Message not sent. You must log in</span>');
            Materialize.toast($toastContent, 2000);
        }
    },
    "keyup #chat-message": function (e) {
        if (e.type === "keyup" && e.which === 13) {
            if(Meteor.userId()){
                e.preventDefault();
                if (!$('#chat-message').data('dropdownshown')) {
                    sendMessageGlobal();
                    Meteor.setTimeout(function () {
                        $("#chat-ul").scrollTop(100000);
                    }, 1000)
                }
            } else {
                var $toastContent = $('<span>Message not sent. You must log in</span>');
                Materialize.toast($toastContent, 2000);
            }
        }
    },
    "click #add-allowed-submit": function (e) {
        if(Meteor.userId()){
            e.preventDefault();
            Meteor.call("addAllowedToCommunityStation", Session.get("CommunityStationName"), $("#add-allowed").val(), function(err) {
                if (err) {
                    console.log(err);
                    var $toastContent = $('<span><strong>User not added.</strong> ' + err.reason + '</span>');
                    Materialize.toast($toastContent, 2000);
                } else {
                    var $toastContent = $('<span><strong>User added.</strong></span>');
                    Materialize.toast($toastContent, 2000);
                }
            });
            $("#add-allowed").val("");
        } else {
            var $toastContent = $('<span>User not added. You must log in</span>');
            Materialize.toast($toastContent, 2000);
        }
    },
    "keyup #add-allowed": function (e) {
        if (e.type === "keyup" && e.which === 13) {
            $("#add-allowed-submit").click();
        }
    },
    "click #vote-skip": function () {
        Meteor.call("votePrivateSkip", Session.get("CommunityStationName"), function (err, res) {
            $("#vote-skip").addClass("disabled");
            if(err){
                var $toastContent = $('<span><strong>Vote not submitted.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 4000);
            }
        });
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
        Meteor.call("resumeCommunityStation", Session.get("CommunityStationName"), function(err) {
            if (err) {
                console.log(err);
                var $toastContent = $('<span><strong>Room not played.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 2000);
            } else {
                var $toastContent = $('<span><strong>Room played.</strong></span>');
                Materialize.toast($toastContent, 2000);
            }
        });
    },
    "click #pause": function () {
        Meteor.call("pauseCommunityStation", Session.get("CommunityStationName"), function(err) {
            if (err) {
                console.log(err);
                var $toastContent = $('<span><strong>Room not paused.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 2000);
            } else {
                var $toastContent = $('<span><strong>Room paused.</strong></span>');
                Materialize.toast($toastContent, 2000);
            }
        });
    },
    "click #skip": function () {
        Meteor.call("skipPrivateSong", Session.get("CommunityStationName"), function(err) {
            if (err) {
                console.log(err);
                var $toastContent = $('<span><strong>Room not skipped.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 2000);
            } else {
                var $toastContent = $('<span><strong>Room skipped.</strong></span>');
                Materialize.toast($toastContent, 2000);
            }
        });
    },
    "click #admin-dropdown a": function(){
        Meteor.setTimeout(function(){
            $(".dropdown-button").click();
        }, 10);
    },
    "click .remove-allowed": function(e) {
        var user = $(e.target).data("user");
        if (user === undefined) {
            user = $(e.target).parent().data("user");
        }
        Meteor.call("removeAllowedFromCommunityStation", Session.get("CommunityStationName"), user, function(err) {
            if (err) {
                console.log(err);
                var $toastContent = $('<span><strong>User not removed.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 2000);
            } else {
                var $toastContent = $('<span><strong>User removed.</strong></span>');
                Materialize.toast($toastContent, 2000);
            }
        });
    },
    "click #clear-queue-search": function() {
        Session.set("songResultsQueue", []);
    },
    "click .queue-item-remove": function(e) {
        var id = $(e.target).attr("data-id");
        if (id === undefined) {
            id = $(e.target).parent().attr("data-id");
        }
        Meteor.call("removeIdFromCommunityStationQueue", Session.get("CommunityStationName"), id, function(err, res) {
            console.log(111, err, res);
            if (err) {
                var $toastContent = $('<span><strong>Song not removed.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 2000);
            } else {
                var $toastContent = $('<span><strong>Song removed.</strong></span>');
                Materialize.toast($toastContent, 2000);
            }
        });
    },
    "click .edit-playlist-button": function(e) {
        if ($(e.target).hasClass("edit-playlist-button")) {
            Session.set("editingPlaylistName", $(e.target).data("playlist"));
        }
    },
    "click #rename-playlist-button": function(e) {
        var newName = $("#rename-playlist-name").val();
        var newDisplayName = $("#rename-playlist-display-name").val();

        var playlist = PrivatePlaylists.findOne({owner: Meteor.userId(), name: Session.get("editingPlaylistName")});
        var currentName = playlist.name;
        var currentDisplayName = playlist.displayName;
        if (newName !== currentName) {
            Meteor.call("renamePrivatePlaylistName", Session.get("editingPlaylistName"), newName, function (err) {
                if (err) {
                    var $toastContent = $('<span><strong>Playlist name not changed.</strong> ' + err.reason + '</span>');
                    Materialize.toast($toastContent, 2000);
                } else {
                    var $toastContent = $('<span><strong>Playlist name changed.</strong></span>');
                    Materialize.toast($toastContent, 2000);
                    Session.set("editingPlaylistName", newName)
                }
            });
        }
        if (newDisplayName !== currentDisplayName) {
            Meteor.call("renamePrivatePlaylistDisplayName", Session.get("editingPlaylistName"), newDisplayName, function (err) {
                if (err) {
                    var $toastContent = $('<span><strong>Playlist display name not changed.</strong> ' + err.reason + '</span>');
                    Materialize.toast($toastContent, 2000);
                } else {
                    var $toastContent = $('<span><strong>Playlist display name changed.</strong></span>');
                    Materialize.toast($toastContent, 2000);
                }
            });
        }
    },
    "click .addSong": function(e) {
        var id = $(e.target).attr("data-result");
        var pp = Session.get("editingPlaylistName");
        Meteor.call("addVideoToPrivatePlaylist", pp, id, function(err) {
            if (err) {
                console.log(err);
                var $toastContent = $('<span><strong>Video not added.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 2000);
            } else {
                var $toastContent = $('<span><strong>Video added.</strong></span>');
                Materialize.toast($toastContent, 2000);
            }
        });
        $("#add_playlist_video").val("");
    },
    "click .addSongQueue": function(e) {
        var id = $(e.target).attr("data-result");
        Meteor.call("addSongToCommunityStationQueue", Session.get("CommunityStationName"), id, function(err) {
            if (err) {
                console.log(err);
                var $toastContent = $('<span><strong>Video not added to queue.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 2000);
            } else {
                var $toastContent = $('<span><strong>Video added to queue.</strong></span>');
                Materialize.toast($toastContent, 2000);
                $("#add-song-to-queue-search").val("");
                $("#add-song-to-queue").closeModal();
            }
        });
    },
    "click .playlistSongRemove": function(e) {
        var id = $(e.target).attr("data-id");
        if (id === undefined) {
            id = $(e.target).parent().attr("data-id");
        }
        Meteor.call("removeVideoFromPrivatePlaylist", Session.get("editingPlaylistName"), id, function(err) {
            if (err) {
                console.log(err);
                var $toastContent = $('<span><strong>Video not deleted.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 2000);
            } else {
                var $toastContent = $('<span><strong>Video deleted.</strong></span>');
                Materialize.toast($toastContent, 2000);
            }
        });
    },"click .playlistQueueSelect": function(e) {
        var name = $(e.target).attr("data-name");
        if (name === undefined) {
            name = $(e.target).parent().attr("data-name");
        }
        console.log(name);
        Session.set("playlistQueueName", name);
        var currentSong = Session.get("playlistQueueCurrentSong");
        if (currentSong === undefined) {
            var playlist = PrivatePlaylists.findOne({owner: Meteor.userId(), name: name});
            var songs = playlist.songs;
            var song = songs[0];
            // Add song to queue
            Meteor.call("addSongToCommunityStationQueue", Session.get("CommunityStationName"), song.id, function(err) {
                if (!err) {
                    Session.set("playlistQueueCurrentSong", song);
                }
            });
        }
    },"click .playlistQueueDeselect": function(e) {
        var name = $(e.target).attr("data-name");
        if (name === undefined) {
            name = $(e.target).parent().attr("data-name");
        }
        console.log(name);
        Session.set("playlistQueueName", undefined);
    },
    "click .playlistSongDown": function(e) {
        var id = $(e.target).attr("data-id");
        if (id === undefined) {
            id = $(e.target).parent().attr("data-id");
        }
        Meteor.call("moveVideoToBottomOfPrivatePlaylist", Session.get("editingPlaylistName"), id, function(err, res) {
            if (err) {
                console.log(err);
                var $toastContent = $('<span><strong>Video not moved.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 2000);
            } else if (res) {
                var $toastContent = $('<span><strong>Video moved.</strong></span>');
                Materialize.toast($toastContent, 2000);
            }
        });
    },
    "click .playlistSongUp": function(e) {
        var id = $(e.target).attr("data-id");
        if (id === undefined) {
            id = $(e.target).parent().attr("data-id");
        }
        Meteor.call("moveVideoToTopOfPrivatePlaylist", Session.get("editingPlaylistName"), id, function(err, res) {
            if (err) {
                console.log(err);
                var $toastContent = $('<span><strong>Video not moved.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 2000);
            } else if (res) {
                var $toastContent = $('<span><strong>Video moved.</strong></span>');
                Materialize.toast($toastContent, 2000);
            }
        });
    },
    "click #delete_playlist": function() {
        Meteor.call("deletePrivatePlaylist", Session.get("editingPlaylistName"), function(err) {
            if (err) {
                console.log(err);
                var $toastContent = $('<span><strong>Playlist not deleted.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 2000);
            } else {
                var $toastContent = $('<span><strong>Playlist deleted.</strong></span>');
                Materialize.toast($toastContent, 2000);
            }
        });
        $("#edit_playlist_modal").closeModal();
    },
    "click #import-youtube-playlist": function() {
        if (!Session.get("importingPlaylist")) {
            Session.set("songResults", []);
            var playlist_link = $("#import_youtube_playlist_input").val();
            var playlist_id = gup("list", playlist_link);
            var ytImportQueue = [];
            var totalVideos = 0;
            var videosInPlaylist = 0;
            var videosInvalid = 0;
            var ranOnce = false;

            Session.set("importingPlaylist", true);

            $("#import-progress").css({width: "0%"});

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
                                var name = Session.get("editingPlaylistName");
                                if (PrivatePlaylists.find({
                                        type: name,
                                        "songs.id": item.snippet.resourceId.videoId
                                    }, {songs: {$elemMatch: {id: item.snippet.resourceId.videoId}}}).count() !== 0) {
                                    videosInPlaylist++;
                                } else {
                                    var percentage = ytImportQueue.length / (totalVideos - videosInvalid) * 100;
                                    $("#import-progress").css({width: percentage + "%"});
                                    ytImportQueue.push({id: item.snippet.resourceId.videoId});
                                }
                            } else {
                                videosInvalid++;
                            }
                        }
                        if (nextToken !== undefined) {
                            makeAPICall(playlist_id, nextToken);
                        } else {
                            Session.set("importingPlaylist", false);
                            $("#import-progress").css({width: "100%"});
                            var failed = 0;
                            var successful = 0;
                            ytImportQueue.forEach(function(item) {
                                Meteor.call("addVideoToPrivatePlaylist", Session.get("editingPlaylistName"), item.id, function(err, res) {
                                    if (err) {
                                        console.log(err);
                                        failed++;
                                    } else if (res) {
                                        successful++;
                                    }
                                    checkDone();
                                });
                            });
                            function checkDone() {
                                if (failed + successful === ytImportQueue.length) {
                                    var $toastContent = $('<span><strong>Imported songs. Success: ' + successful + '. Failed: ' + failed + '.</strong></span>');
                                    Materialize.toast($toastContent, 2000);
                                }
                            }
                        }
                    },
                    error: function() {
                        Session.set("importingPlaylist", false);
                        $("#import-progress").css({width: "0%"});
                        $("#import-playlist-button").removeAttr("disabled");
                        $("#import-playlist-button").removeClass("disabled");
                        $("#playlist-url").removeAttr("disabled");
                        $("#playlist-url").removeClass("disabled");
                    }
                })
            }

            makeAPICall(playlist_id);
        }
    },
    "click #create_playlist_submit": function() {
        var name = $("#create_playlist_name").val();
        var displayName = $("#create_playlist_display_name").val();
        Meteor.call("createPrivatePlaylist", name, displayName, function(err) {
            if (err) {
                console.log(err);
                var $toastContent = $('<span><strong>Playlist not created.</strong> ' + err.reason + '</span>');
                Materialize.toast($toastContent, 2000);
            } else {
                var $toastContent = $('<span><strong>Playlist created.</strong></span>');
                Materialize.toast($toastContent, 2000);
            }
        });
        $("#create_playlist_modal").closeModal();
        $("#create_playlist_name").val("");
        $("#create_playlist_display_name").val("");
        setTimeout(function() {
            $(".edit-playlist-button").leanModal({
                dismissible: true,
                opacity: .5,
                in_duration: 500,
                out_duration: 200
            });
        }, 500);
    },
    "click .select-playlist": function(e) {
        e.preventDefault();
        $("#edit_playlist_modal").closeModal();
        var name = $(e.target).data("playlist");
        Meteor.call("setPlaylistForCommunityStation", Session.get("CommunityStationName"), name);
    }
});

Template.home.events({
    "click #create_community_station_submit": function () {
         var name = $("#create_community_station_name").val();
         var displayName = $("#create_community_station_display_name").val();
         var description = $("#create_community_station_description").val();
         Meteor.call("createCommunityStation", name, displayName, true, description, function(err) {
             if (err) {
                 console.log(err);
                 var $toastContent = $('<span><strong>Community room not created.</strong> ' + err.reason + '</span>');
                 Materialize.toast($toastContent, 2000);
             } else {
                 var $toastContent = $('<span><strong>Community room created.</strong></span>');
                 Materialize.toast($toastContent, 2000);
             }
         });
         $("#create_community_station_name").val("");
         $("#create_community_station_display_name").val("");
         $("#create_community_station_description").val("");
        $("#create_community_station").closeModal();
    }
});
// Settings Template
Template.settings.events({
    "change #showRating": function() {
        Meteor.call("updateSettings", $("#showRating").is(":checked"), function(){});
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
