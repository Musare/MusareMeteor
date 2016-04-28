Router.configure({
    loadingTemplate: 'loading',
    notFoundTemplate: '404'
});

Router.onBeforeAction(function() {
    var self = this;
    var next = self.next;
    var isMaintanance = Meteor.settings.public.maintenance;
    if(isMaintanance === true){
        var user = Meteor.user();
        if(user !== null && user.profile !== undefined && (user.profile.rank === "admin" || user.profile.rank === "moderator")){
            next();
        } else {
            this.render("maintenance");
        }
    } else {
        if (Meteor.userId()) {
            Meteor.call("isBanned", function(err, res) {
                if (res) {
                    self.render('banned');
                } else {
                    document.title = 'Musare';
                    next();
                }
            });
        } else {
            next();
        }
    }
});

Router.route("/", {
    template: "home",
    name: "home"
});

Router.route("/login", {
    action: function() {
        var user = Meteor.user();
        if (user === undefined || user === null) {
            this.render("login");
        } else {
            this.redirect("/");
        }
    },
    name: "login"
});

Router.route("/register", {
    action: function() {
        var user = Meteor.user();
        if (user === undefined || user === null) {
            this.render("register");
        } else {
            this.redirect("/");
        }
    },
    name: "register"
});

Router.route("/settings", {
    action: function() {
        if (!Meteor.userId()) {
            this.redirect("/");
        } else {
            this.render("settings");
        }
    },
    name: "settings"
});

Router.route("/add", {
    template: "addSong",
    name: "addSong"
});

Router.route("/terms", {
    template: "terms",
    name: "terms"
});

Router.route("/contact", {
    template: "contact",
    name: "contact"
});

Router.route("/faq", {
    template: "faq",
    name: "faq"
});

Router.route("/privacy", {
    template: "privacy",
    name: "privacy"
});

Router.route("/feedback", {
    template: "feedback",
    name: "feedback"
})

Router.route("/team", {
    template: "team",
    name: "team"
})

Router.route("/news", {
    template: "news",
    name: "news"
})

Router.route("/project", {
    template: "project",
    name: "project"
})

/*Router.route("/donate", {
    template: "donate",
 name: "donate"
})*/

Router.route("/admin", {
    waitOn: function() {
        return [Meteor.subscribe("isModerator", Meteor.userId()), Meteor.subscribe("isAdmin", Meteor.userId())];
    },
    action: function() {
        var user = Meteor.users.findOne({});
        if (user !== undefined && user.profile !== undefined && (user.profile.rank === "admin" || user.profile.rank === "moderator")) {
            this.render("admin");
        } else {
            this.redirect("/");
        }
    },
    name: "admin"
});

Router.route("/admin/songs", {
    waitOn: function() {
        return [Meteor.subscribe("isModerator", Meteor.userId()), Meteor.subscribe("isAdmin", Meteor.userId())];
    },
    action: function() {
        var user = Meteor.users.findOne({});
        if (user !== undefined && user.profile !== undefined && (user.profile.rank === "admin" || user.profile.rank === "moderator")) {
            this.render("manageSongs");
        } else {
            this.redirect("/");
        }
    },
    name: "manageSongs"
});

Router.route("/admin/queues", {
    waitOn: function() {
        return [Meteor.subscribe("isModerator", Meteor.userId()), Meteor.subscribe("isAdmin", Meteor.userId())];
    },
    action: function() {
        var user = Meteor.users.findOne({});
        if (user !== undefined && user.profile !== undefined && (user.profile.rank === "admin" || user.profile.rank === "moderator")) {
            this.render("queues");
        } else {
            this.redirect("/");
        }
    },
    name: "queues"
});

Router.route("/admin/alerts", {
    waitOn: function() {
        return [Meteor.subscribe("isModerator", Meteor.userId()), Meteor.subscribe("isAdmin", Meteor.userId())];
    },
    action: function() {
        var user = Meteor.users.findOne({});
        if (user !== undefined && user.profile !== undefined && (user.profile.rank === "admin" || user.profile.rank === "moderator")) {
            this.render("alertsDashboard");
        } else {
            this.redirect("/");
        }
    },
    name: "alertsDashboard"
});

Router.route("/u/:user", {
    template: "profile",
    name: "profile"
});

Router.route("/private/:name", {
    waitOn: function() {
        return [Meteor.subscribe("isModerator", Meteor.userId()), Meteor.subscribe("isAdmin", Meteor.userId()), Meteor.subscribe("private_rooms")];
    },
    action: function() {
        var user = Meteor.users.findOne({});
        var room = PrivateRooms.findOne({name: this.params.name});
        if (room !== undefined) {
            if ((room.private === true && user !== undefined && user.profile !== undefined && (user.profile.rank === "admin" ||
                user.profile.rank === "moderator")) || room.private === false || (user !== undefined && user.profile !== undefined && room.allowed.includes(user.profile))) {
                Session.set("type", this.params.type);
                this.render("privateRoom");
            } else {
                this.redirect("/");
            }
        } else {
            this.render("404");
        }
    },
    name: "privateStation"
});

Router.route("/:type", {
    waitOn: function() {
        return [Meteor.subscribe("isModerator", Meteor.userId()), Meteor.subscribe("isAdmin", Meteor.userId()), Meteor.subscribe("rooms")];
    },
    action: function() {
        var user = Meteor.users.findOne({});
        var room = Rooms.findOne({type: this.params.type});
        if (room !== undefined) {
            if ((room.private === true && user !== undefined && user.profile !== undefined && (user.profile.rank === "admin" || user.profile.rank === "moderator")) || room.private === false) {
                Session.set("type", this.params.type);
                this.render("room");
            } else {
                this.redirect("/");
            }
        } else {
            this.render("404");
        }
    },
    name: "station"
});

Router.route("/:type/manage", {
    waitOn: function() {
        return [Meteor.subscribe("isModerator", Meteor.userId()), Meteor.subscribe("isAdmin", Meteor.userId())];
    },
    action: function() {
        var user = Meteor.users.findOne({});
        var room = Rooms.findOne({type: this.params.type});
        if (room !== undefined && user !== undefined && user.profile !== undefined && (user.profile.rank === "admin" || user.profile.rank === "moderator")) {
            this.render("manageStation");
        } else {
            this.redirect("/");
        }
    },
    name: "manageStation"
});
