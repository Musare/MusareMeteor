var rTimeInterval = undefined;

Template.queues.onRendered(function() {
    $("#previewModal").on("hidden.bs.modal", function() {
        if (previewEndSongTimeout !== undefined) {
            Meteor.clearTimeout(previewEndSongTimeout);
        }
        $("#play").attr("disabled", false);
        $("#stop").attr("disabled", true);
        if (YTPlayer !== undefined) {
            $("#previewPlayer").hide();
            YTPlayer.seekTo(0);
            YTPlayer.stopVideo();
        }
    });
    $(document).ready(function() {
        var volume = localStorage.getItem("volume") || 20;
        $("#volume_slider").val(volume).on("input", function() {
            volume = Number($("#volume_slider").val());
            localStorage.setItem("volume", volume);
            if (YTPlayer !== undefined) {
                YTPlayer.setVolume(volume);
            }
        });
    });
});

Template.manageStation.onRendered(function() {
    $("#previewModal").on("hidden.bs.modal", function() {
        if (previewEndSongTimeout !== undefined) {
            Meteor.clearTimeout(previewEndSongTimeout);
        }
        $("#play").attr("disabled", false);
        $("#stop").attr("disabled", true);
        if (YTPlayer !== undefined) {
            $("#previewPlayer").hide();
            YTPlayer.seekTo(0);
            YTPlayer.stopVideo();
        }
    });
    $(document).ready(function() {
        var volume = localStorage.getItem("volume") || 20;
        $("#volume_slider").val(volume).on("input", function() {
            volume = Number($("#volume_slider").val());
            localStorage.setItem("volume", volume);
            if (YTPlayer !== undefined) {
                YTPlayer.setVolume(volume);
            }
        });
    });
});

Template.manageSongs.onRendered(function() {
    $("#previewModal").on("hidden.bs.modal", function() {
        if (previewEndSongTimeout !== undefined) {
            Meteor.clearTimeout(previewEndSongTimeout);
        }
        $("#play").attr("disabled", false);
        $("#stop").attr("disabled", true);
        if (YTPlayer !== undefined) {
            $("#previewPlayer").hide();
            YTPlayer.seekTo(0);
            YTPlayer.stopVideo();
        }
    });
    $(document).ready(function() {
        var volume = localStorage.getItem("volume") || 20;
        $("#volume_slider").val(volume).on("input", function() {
            volume = Number($("#volume_slider").val());
            localStorage.setItem("volume", volume);
            if (YTPlayer !== undefined) {
                YTPlayer.setVolume(volume);
            }
        });
    });
});

Template.news.onRendered(function() {
    if (rTimeInterval !== undefined) {
        Meteor.clearInterval(rTimeInterval)
    }
    rTimeInterval = Meteor.setInterval(function() {
        Session.set("time", new Date().getTime());
    }, 10000);
});

Template.room.onRendered(function() {
    if (rTimeInterval !== undefined) {
        Meteor.clearInterval(rTimeInterval)
    }
    rTimeInterval = Meteor.setInterval(function() {
        Session.set("time", new Date().getTime());
    }, 10000);
    window.setTimeout(function(){
        console.log("THIS IS ME!")
        var volume = Number(localStorage.getItem("volume")) || 20;
        $("#volume_slider").val(volume);
        console.log($("#volume_slider").val());
    }, 1000)
});
