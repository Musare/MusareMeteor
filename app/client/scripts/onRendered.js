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

Template.room.onRendered(function() {
    if (rTimeInterval !== undefined) {
        Meteor.clearInterval(rTimeInterval)
    }
    rTimeInterval = Meteor.setInterval(function() {
        Session.set("time", new Date().getTime());
    }, 10000);
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

                    if (YTPlayer !== undefined) {
                        YTPlayer.setVolume(val.value);
                        localStorage.setItem("volume", val.value);
                    }
                });
            }
        }
        makeSlider();
    });
});

Template.stations.onRendered(function() {
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
                    if (YTPlayer !== undefined) {
                        YTPlayer.setVolume(val.value);
                    }
                });
            }
        }
        makeSlider();
    });
});