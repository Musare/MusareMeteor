var Schemas = {};

Schemas.FullSong = new SimpleSchema({
    "id": {
        type: String,
        label: "Song YouTube id"
    },
    "mid": {
        type: String,
        label: "Song mid"
    },
    "likes": {
        type: Number,
        label: "Song likes",
        defaultValue: 0
    },
    "dislikes": {
        type: Number,
        label: "Song dislikes",
        defaultValue: 0
    },
    "title": {
        type: String,
        label: "Song title"
    },
    "artist": {
        type: String,
        label: "Song artist"
    },
    "img": {
        type: String,
        label: "Song img"
    },
    "duration": {
        type: Number,
        label: "Song duration",
        min: 0,
        decimal: true
    },
    "skipDuration": {
        type: Number,
        label: "Song skipDuration",
        min: 0,
        decimal: true
    },
    "genres": {
        type: Array,
        label: "Array of song genre's"
    },
    "genres.$": {
        type: String,
        label: "Song genre"
    },
    "requestedBy": {
        type: String,
        label: "User ID of the person who requested the song"
    },
    "approvedBy": {
        type: String,
        label: "User ID of the person who approved the song"
    }
});

Schemas.QueueSong = new SimpleSchema({
    "id": {
        type: String,
        label: "Song YouTube id"
    },
    "mid": {
        type: String,
        label: "Song mid"
    },
    "likes": {
        type: Number,
        label: "Song likes",
        defaultValue: 0
    },
    "dislikes": {
        type: Number,
        label: "Song dislikes",
        defaultValue: 0
    },
    "title": {
        type: String,
        label: "Song title"
    },
    "artist": {
        type: String,
        label: "Song artist"
    },
    "img": {
        type: String,
        label: "Song img"
    },
    "duration": {
        type: Number,
        label: "Song duration",
        min: 0,
        decimal: true
    },
    "skipDuration": {
        type: Number,
        label: "Song skipDuration",
        min: 0,
        decimal: true
    },
    "genres": {
        type: Array,
        label: "Array of song genre's"
    },
    "genres.$": {
        type: String,
        label: "Song genre"
    },
    "requestedBy": {
        type: String,
        label: "User ID of the person who requested the song"
    }
});

Schemas.Chat = new SimpleSchema({
    type: {
        type: String,
        label: "Type of the room a message was sent in",
        regEx: /^[a-z0-9_]{1,20}$/
    },
    rawrank: {
        type: String,
        label: "Rank of the user who sent the message"
    },
    rank: {
        type: String,
        label: "Display tag of the rank of the user who sent a message",
        optional: true
    },
    message: {
        type: String,
        label: "The message",
        max: 300
    },
    username: {
        type: String,
        label: "Username of the user who sent the message"
    },
    time: {
        type: Date,
        label: "Date of the time the message was sent"
    }
});

Schemas.Alert = new SimpleSchema({
    description: {
        type: String,
        label: "The Alert's Description"
    },
    active: {
        type: Boolean,
        label: "Whether or not the alert is active or not"
    },
    createdBy: {
        type: String,
        label: "Username of the person who created an alert"
    }
});

Schemas.Feedback = new SimpleSchema({
    username: {
        type: String,
        label: "Username of user who submitted feedback"
    },
    message: {
        type: String,
        label: "Feedback message"
    },
    upvotes: {
        type: Number,
        label: "Number of upvotes for a feedback"
    },
    upvotedBy: {
        type: Array,
        label: "Array of usernames of users who upvoted a feedback"
    },
    "upvotedBy.$": {
        type: String,
        label: "Username of user who upvoted a feedback"
    }
});

Schemas.Room = new SimpleSchema({
    display: {
        type: String,
        label: "Room Display Name",
        regEx: /^[a-z0-9A-Z_\s]{1,30}$/
    },
    type: {
        type: String,
        label: "Room Type",
        regEx: /^[a-z0-9_]{1,20}$/
    },
    currentSong: {
        type: Object,
        defaultValue: {},
        label: "Current Song"
    },
    "currentSong.song": {
        type: Schemas.FullSong,
        label: "Current Song Object"
    },
    "currentSong.started": {
        type: Number,
        label: "Current Song Start Date"
    },
    timePaused: {
        type: Number,
        defaultValue: 0,
        label: "Amount of time a room has been paused for"
    },
    users: {
        type: Number,
        defaultValue: 0,
        label: "Users Online",
        min: 0
    },
    state: {
        type: String,
        defaultValue: "paused",
        allowedValues: ["paused", "playing"],
        label: "Room State"
    },
    votes: {
        type: Number,
        defaultValue: 0,
        label: "Current votes to skip current song",
        min: 0
    },
    private: {
        type: Boolean,
        defaultValue: false,
        label: "Room private or not"
    },
    roomDesc: {
        type: String,
        label: "Room description"
    },
    userList: {
        type: Array,
        label: "List of currently online people",
        defaultValue: []
    },
    "userList.$": {
        type: String,
        label: "Username of user currently in a room"
    }
});

Schemas.Playlist = new SimpleSchema({
    type: {
        type: String,
        label: "Type of the room the playlist is for",
        regEx: /^[a-z0-9_]{1,20}$/
    },
    songs: {
        type: Array,
        label: "Array of song MID's"
    },
    "songs.$": {
        type: String,
        label: "Song mid"
    },
    lastSong: {
        type: Number,
        label: "Index of the previous song",
        defaultValue: 0
    }
});

Schemas.UserProfile = new SimpleSchema({
    username: {
        type: String,
        label: "Username",
        regEx: /^[a-zA-Z0-9_]+$/,
        min: 4,
        max: 26
    },
    usernameL: {
        type: String,
        label: "Username in lowercase",
        regEx: /^[a-z0-9_]+$/
    },
    realname: {
        type: String,
        label: "Real Name",
        regEx: /^[A-Za-z0-9 .'-]+$/,
        optional: true
    },
    rank: {
        type: String,
        label: "Rank",
        allowedValues: ["default", "moderator", "admin"]
    },
    liked: {
        type: Array,
        label: "User's Liked songs"
    },
    "liked.$": {
        type: String,
        label: "A MID of a song a user liked"
    },
    disliked: {
        type: Array,
        label: "User's Disliked songs"
    },
    "disliked.$": {
        type: String,
        label: "A MID of a song a user disliked"
    },
    settings: {
        type: Object,
        label: "The settings of a user"
    },
    "settings.showRating": {
        type: Boolean,
        label: "If a user wants their liked and disliked songs to show up for everyone",
        defaultValue: false
    },
    statistics: {
        type: Object,
        label: "The statistics of a user"
    },
    "statistics.songsRequested": {
        type: Number,
        label: "Amount of songs the user has requested",
        defaultValue: 0
    }
});

Schemas.UserPunishments = new SimpleSchema({
    mute: {
        type: Object,
        label: "User's Current Mute Info",
        optional: true
    },
    "mute.mutedBy": {
        type: String,
        label: "Muted By"
    },
    "mute.mutedAt": {
        type: Date,
        label: "Muted At"
    },
    "mute.mutedUntil": {
        type: Date,
        label: "Muted Until"
    },
    mutes: {
        type: Array,
        label: "All of the mutes of a user",
        optional: true
    },
    "mutes.$": {
        type: Object,
        label: "One of the mutes of a user"
    },
    "mutes.$.mutedBy": {
        type: String,
        label: "Muted By"
    },
    "mutes.$.mutedAt": {
        type: Date,
        label: "Muted At"
    },
    "mutes.$.mutedUntil": {
        type: Date,
        label: "Muted Until"
    },
    ban: {
        type: Object,
        label: "User's Current Ban Info",
        optional: true
    },
    "ban.bannedBy": {
        type: String,
        label: "Banned By"
    },
    "ban.bannedReason": {
        type: String,
        label: "Banned Reason"
    },
    "ban.bannedAt": {
        type: Date,
        label: "Banned At"
    },
    "ban.bannedUntil": {
        type: Date,
        label: "Banned Until"
    },
    bans: {
        type: Array,
        label: "All of the bans of a user",
        optional: true
    },
    "bans.$": {
        type: Object,
        label: "One of the bans of a user"
    },
    "bans.$.bannedBy": {
        type: String,
        label: "Banned By"
    },
    "bans.$.bannedReason": {
        type: String,
        label: "Banned Reason"
    },
    "bans.$.bannedAt": {
        type: Date,
        label: "Banned At"
    },
    "bans.$.bannedUntil": {
        type: Date,
        label: "Banned Until"
    }
});

Schemas.User = new SimpleSchema({
    username: {
        type: String,
        // For accounts-password, either emails or username is required, but not both. It is OK to make this
        // optional here because the accounts-password package does its own validation.
        // Third-party login packages may not require either. Adjust this schema as necessary for your usage.
        optional: true,
        regEx: /^[a-zA-Z0-9_]+$/,
        min: 6,
        max: 26
    },
    emails: {
        type: Array,
        // For accounts-password, either emails or username is required, but not both. It is OK to make this
        // optional here because the accounts-password package does its own validation.
        // Third-party login packages may not require either. Adjust this schema as necessary for your usage.
        optional: true
    },
    "emails.$": {
        type: Object
    },
    "emails.$.address": {
        type: String,
        regEx: SimpleSchema.RegEx.Email
    },
    "emails.$.verified": {
        type: Boolean
    },
    createdAt: {
        type: Date
    },
    profile: {
        type: Schemas.UserProfile
    },
    punishments: {
        type: Schemas.UserPunishments,
        defaultValue: {mutes: [], bans: []}
    },
    // Make sure this services field is in your schema if you're using any of the accounts packages
    services: {
        type: Object,
        optional: true,
        blackbox: true
    },
    // In order to avoid an 'Exception in setInterval callback' from Meteor
    heartbeat: {
        type: Date,
        optional: true
    }
});

Schemas.Report = new SimpleSchema({
    room: {
        type: String,
        label: "Type of the room that the reports are from",
        regEx: /^[a-z0-9_]{1,20}$/
    },
    report: {
        type: Array,
        label: "The reports"
    },
    "report.$": {
        type: Object,
        label: "A report"
    },
    "report.$.song": {
        type: String,
        label: "A report's song MID"
    },
    "report.$.type": {
        type: Array,
        label: "The types of things a song was reported for"
    },
    "report.$.type.$": {
        type: String,
        label: "A type of thing a report was reported for",
        allowedValues: ["report-song", "report-title", "report-author", "report-duration", "report-audio", "report-albumart", "report-other"]
    },
    "report.$.reason": {
        type: Array,
        label: "The reasons a song was reported for"
    },
    "report.$.reason.$": {
        type: String,
        label: "A reason a song was reported for",
        allowedValues: ["report-song-not-playing", "report-song-does-not-exist", "report-song-other", "report-title-incorrect", "report-title-inappropriate", "report-title-other", "report-author-incorrect", "report-author-inappropriate", "report-author-other", "report-duration-long", "report-duration-short", "report-duration-other", "report-audio-inappropriate", "report-audio-not-playing", "report-audio-other", "report-albumart-incorrect", "report-albumart-inappropriate", "report-albumart-not-showing", "report-albumart-other"]
    },
    "report.$.other": {
        type: String,
        label: "Other",
        optional: true
    }
});

Schemas.Article = new SimpleSchema({
    "title": {
        type: String,
        label: "Article Title"
    },
    "content": {
        type: String,
        label: "Article Content"
    },
    "author": {
        type: String,
        label: "Article's Author"
    },
    "time": {
        type: Date,
        label: "Article's Create Date"
    }
});

Rooms.attachSchema(Schemas.Room);
Alerts.attachSchema(Schemas.Alert);
Chat.attachSchema(Schemas.Chat);
Playlists.attachSchema(Schemas.Playlist);
Queues.attachSchema(Schemas.QueueSong);
Meteor.users.attachSchema(Schemas.User);
Reports.attachSchema(Schemas.Report);
Feedback.attachSchema(Schemas.Feedback);
Songs.attachSchema(Schemas.FullSong);
News.attachSchema(Schemas.Article);
