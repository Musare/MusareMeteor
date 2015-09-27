History = new Mongo.Collection("history");

if (Meteor.isClient) {
    var hpSound = undefined;
    Template.register.events({
        "submit form": function(e){
            e.preventDefault();
            var username = e.target.registerUsername.value;
            var email = e.target.registerEmail.value;
            var password = e.target.registerPassword.value;
            Accounts.createUser({
                username: username,
                email: email,
                password: password
            });
        },

        "click #facebook-login": function(){
            Meteor.loginWithFacebook()
        },

        "click #github-login": function(){
            Meteor.loginWithGithub()
        },

        "click #login": function(){
            $("#register-view").hide();
            $("#login-view").show();
        }
    });

    Template.login.events({
        "submit form": function(e){
            e.preventDefault();
            var username = e.target.loginUsername.value;
            var password = e.target.loginPassword.value;
            Meteor.loginWithPassword(username, password);
            Accounts.onLoginFailure(function(){
                $("input").css("background-color","indianred").addClass("animated shake");
                    $("input").on("click",function(){
                        $("input").css({
                            "background-color": "transparent",
                            "width": "250px"
                     });
                })
            });
        },

        "click #facebook-login": function(){
            Meteor.loginWithFacebook()
        },

        "click #github-login": function(){
            Meteor.loginWithGithub()
        },

        "click #register": function(){
            $("#login-view").hide();
            $("#register-view").show();
        }
    });

    Template.dashboard.events({
        "click .logout": function(e){
            e.preventDefault();
            Meteor.logout();
            if (hpSound !== undefined) {
                hpSound.stop();
            }
        },

        "click .button-tunein": function(){
            SC.stream("/tracks/172055891/", function(sound){
                sound._player._volume = 0.3;
                sound.play();
            });
        },

        "click #play": function(){
            $("#play").hide();
            SC.stream("/tracks/172055891/", function(sound){
                hpSound = sound;
                sound._player._volume = 0.3;
                sound.play();
                $("#stop").on("click", function(){
                    $("#stop").hide();
                    $("#play").show();
                    sound._player.pause();
                })
            });
            $("#stop").show();
        }
    });

    Template.room.helpers({
        type: function() {
          var parts = location.href.split('/');
          var id = parts.pop();
          return id.toUpperCase();
        },
        title: function(){
          return Session.get("title");
        },
        artist: function(){
          return Session.get("artist");
        }
    });

    Template.room.onCreated(function () {
        var currentSong = undefined;
        var _sound = undefined;
        var size = 0;

        function getTimeElapsed() {
            if (currentSong !== undefined) {
                return Date.now() - currentSong.started;
            }
            return 0;
        }

        function startSong() {
            if (currentSong !== undefined) {
                if (_sound !== undefined)_sound.stop();
                SC.stream("/tracks/" + currentSong.song.id + "/", function(sound){
                    _sound = sound;
                    sound._player._volume = 0.3;
                    //sound.play();
                    console.log(currentSong);
                    Session.set("title", currentSong.song.title || "Title");
                    Session.set("artist", currentSong.song.artist || "Artist");
                    Session.set("albumArt", currentSong.song.albumArt);
                    Session.set("duration", currentSong.song.duration);
                    setTimeout(function() { // HACK, otherwise seek doesn't work.
                        sound._player.seek(getTimeElapsed());
                        console.log(sound._player.seek(getTimeElapsed()));
                    }, 500);
                });
            }
        }

        Meteor.subscribe("history");
        Meteor.setInterval(function() {
            var data = undefined;
            var dataCursor = History.find({type: "edm"});
            dataCursor.map(function(doc) {
                if (data === undefined) {
                    data = doc;
                }
            });
            if (data.history.length > size) {
                currentSong = data.history[data.history.length-1];
                size = data.history.length;
                startSong();
            }
        }, 1000);
    });
}

if (Meteor.isServer) {
    var startedAt = Date.now();
    var songs = [{id: 172055891, title: "Immortals", artist: "Fall Out Boy", duration: 90}];
    var currentSong = 0;
    addToHistory(songs[currentSong], startedAt);

    function addToHistory(song, startedAt) {
        History.update({type: "edm"}, {$push: {history: {song: song, started: startedAt}}});
    }

    function skipSong() {
        if (currentSong < (songs.length - 1)) {
            currentSong++;
        } else currentSong = 0;
        songTimer();
        addToHistory(songs[currentSong], startedAt);
    }

    function songTimer() {
        startedAt = Date.now();
        Meteor.setTimeout(function() {
            skipSong();
        }, songs[currentSong].duration * 1000);
    }

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

    songTimer();

    Meteor.publish("history", function() {
        return History.find({type: "edm"})
    });
}

Router.route("/", {
    template: "home"
});

Router.route("/:type", {
    template: "room"
});
