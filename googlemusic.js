// State for event handlers
var state = 'init';

// Used only to remember last song title
var clipTitle = '';

// Timeout to scrobble track ater minimum time passes
var scrobbleTimeout = null;

// Glabal constant for the song container ....
var CONTAINER_SELECTOR = '#playerSongInfo';


$(function(){
    $(CONTAINER_SELECTOR).live('DOMSubtreeModified', function(e) {
        if ($(CONTAINER_SELECTOR).length > 0) {
            updateNowPlaying();
            return;
        }
    });

    console.log("Last.fm Scrobbler: starting Google Music connector")

    // first load
    updateNowPlaying();
});

/**
 * Called every time we load a new song
 */
 function updateNowPlaying(){
    var parsedInfo = parseInfo();
    artist   = parsedInfo['artist']; //global
    track    = parsedInfo['track']; //global
    duration = parsedInfo['duration']; //global
    currentTime = parsedInfo['currentTime']; //global

    if (artist === '' || track === '' || duration === 0) { return; }

    console.log(parsedInfo);

    // check if the same track is being played and we have been called again
    // if the same track is being played we return
    if (clipTitle == track) {
        console.log('same song as previous, skipping...');
        return;
    }
    clipTitle = track;

    chrome.extension.sendRequest({type: 'validate', artist: artist, track: track}, function(response) {
        if (response) {
            console.log("validate success");
            chrome.extension.sendRequest({type: 'nowPlaying', artist: artist, track: track, currentTime: currentTime, duration: duration});
        }
        // on failure send nowPlaying 'unknown song'
        else {
            console.log("on failure send nowPlaying 'unknown song'");
            chrome.extension.sendRequest({type: 'nowPlaying', duration: duration});
        }
    });
}


function parseInfo() {
    var artist   = '';
    var track    = '';
    var duration = 0;
    var currentTime = 0;

    // Get artist and song names
    var artistValue = $("div#player-artist").text();
    var trackValue = $("div#playerSongTitle").text();
    var durationValue = $("div#slider").attr('aria-valuemax');
    var currentTimeValue = $('div#slider').attr('aria-valuenow');

    try {
        if (artistValue) {
            artist = artistValue.replace(/^\s+|\s+$/g,'');
        }
        if (trackValue) {
            track = trackValue.replace(/^\s+|\s+$/g,'');
        }
        if (durationValue) {
            duration = parseInt(durationValue, 10) / 1000; //parseDuration(durationValue);
            duration = Math.round(duration);
        }
        if (currentTimeValue) {
            currentTime = parseInt(currentTimeValue, 10) / 1000;
            currentTime = Math.ceil(currentTime);
        }
    } catch(err) {
        console.log(err);
        return {artist: '', track: '', current: 0, duration: 0};
    }

    return {artist: artist, track: track, currentTime: currentTime, duration: duration};
}

/**
 * Simply request the scrobbler.js to submit song previusly specified by calling updateNowPlaying()
 */
 function scrobbleTrack() {
   // stats
   chrome.extension.sendRequest({type: 'trackStats', text: 'The Google Music song scrobbled'});

   // scrobble
   chrome.extension.sendRequest({type: 'submit'});
}



/**
 * Listen for requests from scrobbler.js
 */
 chrome.extension.onRequest.addListener(
   function(request, sender, sendResponse) {
        console.log(request);
        switch(request.type) {
            // called after track has been successfully marked as 'now playing' at the server
            case 'nowPlayingOK':
                break;

            // not used yet
            case 'submitOK':
            break;

            // not used yet
            case 'submitFAIL':
            break;
        }
    }
);
