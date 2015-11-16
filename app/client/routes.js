Router.onBeforeAction('loading');

Router.configure({
    loadingTemplate: 'loading'
});

Router.route("/", {
    template: "home"
});

Router.route("/login", {
    action: function() {
        var user = Meteor.user();
        if (user === undefined || user === null) {
            this.render("login");
        } else {
            this.redirect("/");
        }
    }
});

Router.route("/signup", {
    action: function() {
        var user = Meteor.user();
        if (user === undefined || user === null) {
            this.render("register");
        } else {
            this.redirect("/");
        }
    }
});

Router.route("/terms", {
    template: "terms"
});

Router.route("/api", {
    template: "api"
});

Router.route("/privacy", {
    template: "privacy"
});

Router.route("/about", {
    template: "about"
});

Router.route("/admin", {
    waitOn: function() {
        return Meteor.subscribe("isAdmin", Meteor.userId());
    },
    action: function() {
        var user = Meteor.users.findOne({});
        if (user !== undefined && user.profile !== undefined && user.profile.rank === "admin") {
            this.render("admin");
        } else {
            this.redirect("/");
        }
    }
});

Router.route("/stations", {
    waitOn: function() {
        return Meteor.subscribe("isAdmin", Meteor.userId());
    },
    action: function() {
      var user = Meteor.users.findOne({});
      if (user !== undefined && user.profile !== undefined && user.profile.rank === "admin") {
          this.render("stations");
      } else {
          this.redirect("/");
      }
    }
});

Router.route("/admin/alerts", {
    waitOn: function() {
        return Meteor.subscribe("isAdmin", Meteor.userId());
    },
    action: function() {
        var user = Meteor.users.findOne({});
        if (user !== undefined && user.profile !== undefined && user.profile.rank === "admin") {
            this.render("alertsDashboard");
        } else {
            this.redirect("/");
        }
    }
});

Router.route("/:type", {
    template: "room"
});

Router.route("/u/:user", {
    template: "profile"
});
