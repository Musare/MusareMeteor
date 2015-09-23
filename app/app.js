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

    }
  });

  Template.login.events({
    "submit form": function(e){
        e.preventDefault();
        var username = e.target.loginUsername.value;
        var password = e.target.loginPassword.value;
        Meteor.loginWithPassword(username, password);
    },

    "click #facebook-login": function(){
        Meteor.loginWithFacebook()
    },

    "click #github-login": function(){
        Meteor.loginWithGithub()
    },

    "click #register": function(){

    }
  });

  Template.dashboard.events({
    "click .logout": function(e){
        e.preventDefault();
        Meteor.logout();
    }
  })
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
