History = new Mongo.Collection("history");

if (Meteor.isClient) {  
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
        },

        "click .button-tunein": function(){
            SC.stream("/tracks/172055891/", function(sound){
                console.log(sound);
                sound._player._volume = 0.3;
                sound.play();
            });
        },

        "click #play": function(){
            $("#play").hide();
            SC.stream("/tracks/172055891/", function(sound){
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
  
    Template.Room.helpers({
        type: function() {
            var parts = location.href.split('/');
            var id = parts.pop();
            return id;
        },
        duration: function() {
            return Session.get("duration");
        }
    });
  
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
                sound.play();
                setTimeout(function() { // HACK, otherwise seek doesn't work.
                    sound._player.seek(getTimeElapsed());
                }, 500);
            });
        }
    }
  
    Template.Room.onCreated(function () {
        /*var instance = this;
        HTTP.get('/api/room/edm', function (err, data) {
          instance.data = data;
          console.log(data);
          // PLAY SONG AND SUCH
        });*/
        
        
        /*console.log("Created!");
        Meteor.call("getDuration", function(err, res) {
            Session.set("duration", res);
            console.log(res);
        });
        Meteor.call("getStart", function(err, res) {
            Session.set("start", res);
            console.log(res);
        });
        Meteor.call("getSong", function(err, res) {
            Session.set("song", res);
            console.log(res);
            SC.stream("/tracks/" + res + "/", function(sound){
              console.log(sound);
              sound._player._volume = 0.3;
              sound.play();
              setTimeout(function() { // HACK, otherwise seek doesn't work.
                  sound._player.seek(Date.now() - Session.get("start"));
                  console.log((Date.now() - Session.get("start")) + "--");
              }, 500);
            });
        });*/
    });
  
    Meteor.subscribe("history");
  
  
    Meteor.setInterval(function() {
        var data = History.findOne();
        if (data.history.length > size) {
            currentSong = data.history[data.history.length-1];
            size = data.history.length;
            startSong();
        }
    }, 1000);
    //console.log(History, "History");
}

if (Meteor.isServer) { 
    var startedAt = Date.now();
    var songs = [{id: 172055891, duration: 20}, {id: 101244339, duration: 60}];
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
  
    /*Meteor.methods({ 
      getDuration: function() {
          return "100 minutes";
      },
      getStart: function() {
          return startedAt;
      },
      getSong: function() {
          return songs[currentSong];
      }
    });*/

    Meteor.publish("history", function() {
        return History.find({type: "edm"})
    });
}

Router.route("/", {
    template: "Home"
});

Router.route("/:type", {
    template: "Room"
});
