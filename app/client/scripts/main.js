Meteor.startup(function() {
    reCAPTCHA.config({
        publickey: '6LcVxg0TAAAAAE18vBiH00UAyaJggsmLm890SjZl'
    });

    Avatar.setOptions({
        fallbackType: "initials",
        defaultImageUrl: "http://static.boredpanda.com/blog/wp-content/uploads/2014/04/amazing-fox-photos-182.jpg",
        generateCSS: true,
        imageSizes: {
            'header': 40
        }
    });
});

Deps.autorun(function() {
    Meteor.subscribe("queues");
    Meteor.subscribe("reports");
    Meteor.subscribe("chat");
    Meteor.subscribe("playlists");
    Meteor.subscribe("songs");
    Meteor.subscribe("alerts");
    Meteor.subscribe("rooms");
    Meteor.subscribe("private_rooms");
    Meteor.subscribe("private_playlists");
    Meteor.subscribe("news");
    Meteor.subscribe("userData", Meteor.userId());
    Meteor.subscribe("usernames");
});

Handlebars.registerHelper("isAdmin", function(argument){
    if (Meteor.user() && Meteor.user().profile) {
        return Meteor.user().profile.rank === "admin";
    } else {
        return false;
    }
});

Handlebars.registerHelper("isModerator", function(argument){
    if (Meteor.user() && Meteor.user().profile && (Meteor.user().profile.rank === "admin" || Meteor.user().profile.rank === "moderator")) {
        return true;
    } else {
        return false;
    }
});

Handlebars.registerHelper("isAllowedInPrivateRoom", function(name){
    var room = PrivateRooms.findOne({name: name});
    if (Meteor.user() &&
        Meteor.user().profile &&
        room &&
        ((Meteor.user().profile.rank === "admin" || Meteor.user().profile.rank === "moderator") || (room.allowed.indexOf(Meteor.userId()) !== -1 || room.owner === Meteor.userId()))) {
        return true;
    } else {
        return false;
    }
});

Handlebars.registerHelper("isPrivateRoomOwner", function(name){
    var room = PrivateRooms.findOne({name: name});
    if (Meteor.user() &&
        Meteor.user().profile &&
        room &&
        ((Meteor.user().profile.rank === "admin" || Meteor.user().profile.rank === "moderator") || room.owner === Meteor.userId())) {
        return true;
    } else {
        return false;
    }
});

Handlebars.registerHelper("initials", function(argument){
    var user = Meteor.user();
    if (user !== undefined) {
        return user.profile.username[0].toUpperCase();
    } else {
        return "";
    }
});

/* Global collection helpers */
Handlebars.registerHelper("rooms", function(){
    return Rooms.find({});
});

Handlebars.registerHelper("privateRooms", function(){
    return PrivateRooms.find({});
});


Handlebars.registerHelper("songs", function(){
    return Songs.find({});
});

Handlebars.registerHelper('active', function(path) {
    return curPath() == path ? 'active' : '';
});

Handlebars.registerHelper('isLoggedIn', function(path) {
    return Meteor.userId();
});

Handlebars.registerHelper('getUsernameFromId', function(id) {
    return Meteor.users.findOne(id).profile.username;
});

UI.registerHelper("formatTime", function(seconds) {
    var d = moment.duration(parseInt(seconds), 'seconds');
    return d.minutes() + ":" + ("0" + d.seconds()).slice(-2);
});

Template.registerHelper("rtime", function(date) {
    Session.get("time");
    if (date) {
        return moment(date).fromNow();
    }
});

var allAlertSub = undefined;
var YTPlayer = undefined;
var previewEndSongTimeout = undefined;
var hpSound = undefined;
var songsArr = [];
var parts = location.href.split('/');
var id = parts.pop();
var type = id.toLowerCase();

curPath=function(){var c=window.location.pathname;var b=c.slice(0,-1);var a=c.slice(-1);if(b==""){return"/"}else{if(a=="/"){return b}else{return c}}};

function gup( name, url ) {
    if (!url) url = location.href;
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]"+name+"=([^&#]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( url );
    return results == null ? null : results[1];
}

var ban_interval = Meteor.setInterval(function() {
    var userId = Meteor.userId();
    if (userId !== undefined) {
        var userData = Meteor.user();
        if (localStorage.getItem("banned") === "true") {
            if (userData !== undefined && userData !== null && userData.punishments !== undefined && userData.punishments.ban !== undefined) {
                var ban = userData.punishments.ban;
                if (new Date(ban.bannedUntil).getTime() <= new Date().getTime()) {
                    Meteor.call("isBanned", function(err, res) {
                        if (res === false) {
                            localStorage.setItem("banned", false);
                            Meteor._reload.reload();
                        }
                    });
                }
            } else {
                localStorage.setItem("banned", false);
                Meteor._reload.reload();
            }
        } else {
            if (userData !== undefined && userData !== null && userData.punishments !== undefined && userData.punishments.ban !== undefined) {
                localStorage.setItem("banned", true);
                Meteor._reload.reload();
            }
        }
    }
}, 1000);
