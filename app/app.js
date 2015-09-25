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
      }
  });
}

if (Meteor.isServer) {
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
}

Router.route("/", {
    template: "Home"
});

Router.route("/:type", {
    template: "Room"
});
