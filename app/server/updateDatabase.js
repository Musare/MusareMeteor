Meteor.startup(function() {
    CommunityStations.update({partyModeEnabled: {$exists: false}}, {$set: {partyModeEnabled: false}});
    CommunityStations.update({queue: {$exists: false}}, {$set: {queue: []}});
});