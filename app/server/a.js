Meteor.isBanned = function() {
    var userData = Meteor.users.findOne(Meteor.userId());
    if (Meteor.userId() && userData !== undefined && userData.punishments !== undefined && userData.punishments.ban !== undefined) {
        var ban = userData.punishments.ban;
        if (new Date(ban.bannedUntil).getTime() <= new Date().getTime()) {
            Meteor.users.update(Meteor.userId(), {$unset: {"punishments.ban": ""}});
            return false;
        } else {
            return true;
        }
    } else {
        return false;
    }
};

Meteor.isMuted = function() {
    var userData = Meteor.users.findOne(Meteor.userId());
    if (Meteor.userId() && userData !== undefined && userData.punishments !== undefined && userData.punishments.mute !== undefined) {
        var mute = userData.punishments.mute;
        if (new Date(mute.bannedUntil).getTime() <= new Date().getTime()) {
            Meteor.users.update(Meteor.userId(), {$unset: {"punishments.mute": ""}});
            return false;
        } else {
            return true;
        }
    } else {
        return false;
    }
};

Meteor.updatedMethods = function(methods) {
    var methodsNames = _.keys(methods);
    _.each(methodsNames, function(methodName) {
        var method = {};
        method[methodName] = function() {
            if (typeof methods[methodName] === "function") {
                return methods[methodName].apply(this, arguments);
            } else {
                if (Meteor.isBanned()) {
                    throw new Meteor.Error(401, "Invalid permissions.");
                }
                _.each(methods[methodName].requirements, function(requirement) {
                    if (requirement === "moderator") {
                        if (!Meteor.userId() || !Meteor.user() || !(Meteor.user().profile.rank === "admin" || Meteor.user().profile.type === "moderator")) {
                            throw new Meteor.Error(401, "Invalid permissions.");
                        }
                    } else if (requirement === "admin") {
                        if (!Meteor.userId() || !Meteor.user() || Meteor.user().profile.rank !== "admin") {
                            throw new Meteor.Error(401, "Invalid permissions.");
                        }
                    } else if (requirement === "login") {
                        if (!Meteor.userId() || !Meteor.user()) {
                            throw new Meteor.Error(401, "Invalid permissions.");
                        }
                    } else if (requirement === "noLogin") {
                        if (Meteor.userId() || Meteor.user()) {
                            throw new Meteor.Error(401, "Invalid permissions.");
                        }
                    } else if (requirement === "noMute") {
                        if (Meteor.isMuted()) {
                            throw new Meteor.Error(401, "Invalid permissions.");
                        }
                    }
                });
                return methods[methodName].code.apply(this, arguments);
            }
        };
        Meteor.methods(method);
    });
};
