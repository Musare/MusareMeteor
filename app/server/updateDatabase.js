Meteor.startup(function() {
    CommunityStations.update({partyModeEnabled: {$exists: false}}, {$set: {partyModeEnabled: false}});
});