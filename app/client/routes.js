Router.onBeforeAction('loading');

Router.configure({
    loadingTemplate: 'loading'
});

Router.route("/", {
    template: "home"
});

Router.route("/login", {
    template: "login"
});

Router.route("/signup", {
    template: "register"
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

Router.route("/vis", {
    template: "visualizer"
});

Router.route("/:type", {
    template: "room"
});

Router.route("/u/:user", {
    template: "profile"
});
