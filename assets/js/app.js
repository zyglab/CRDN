'use stric';

var player = new Audio(),
    playStopBtn = $('#play-stop'),
    stationsList = $('#station-switcher ul a'),
    qualityList = $('#quality-switcher ul a'),
    openBtns = $('a[data-open-modal]'),
    closeBtns = $('.close'),
    radioPlaying = false,
    screenLock,
    infoTimeout;

var stations = {
    'crdn:high' : 'http://listen.christianrock.net/stream/1/stream.mp3',
    'crdn:low'  : 'http://listen.christianrock.net/stream/2/stream.mp3',
    'chrdn:high': 'http://listen.christianhardrock.net/stream/3/stream.mp3',
    'chrdn:low' : 'http://listen.christianhardrock.net/stream/4/stream.mp3',
    'cppdn:high': 'http://listen.christianpowerpraise.net/stream/7/stream.mp3',
    'cppdn:low' : 'http://listen.christianpowerpraise.net/stream/8/stream.mp3',
    'ccrdn:high': 'http://listen.christianhardrock.net/stream/9/stream.mp3',
    'ccrdn:low' : 'http://listen.christianhardrock.net/stream/10/stream.mp3'
};

var stationsLabels = {
    'crdn' : 'Rock',
    'chrdn': 'Hard Rock',
    'cppdn': 'Power Praise',
    'ccrdn': 'Classic Rock'
};

var qualityLabels = {
    'high': 'High',
    'low' : 'Low'
};

var statusesUrls = {
    'crdn' : 'http://cors-anywhere.herokuapp.com/https://www.christianrock.net/iphoneCRDN.asp',
    'chrdn': 'http://cors-anywhere.herokuapp.com/https://www.christianrock.net/iphoneCHRDN.asp',
    'ccrdn': 'http://cors-anywhere.herokuapp.com/https://www.christianrock.net/iphoneCCRDN.asp',
    'cppdn': 'http://cors-anywhere.herokuapp.com/https://www.christianrock.net/iphoneCPPDN.asp'
};

var defaultOptions = {
    station: 'crdn',
    quality: 'high'
};

var currentOptions = {};

var changeQuality = function (quality) {
    currentOptions.quality = quality;

    asyncStorage.setItem('options', currentOptions, function () {
        console.log('[OPTIONS] Stored!');
    });

    play();
};

var changeStation = function (station) {
    currentOptions.station = station;

    asyncStorage.setItem('options', currentOptions, function () {
        console.log('[OPTIONS] Stored!');
    });

    resetSongInfo();
    play();
};

var closeModal = function (id) {
    var modal = $('#' + id);

    modal.hide();
};

var openModal = function (id) {
    var modal = $('#' + id);

    modal.show();
};

var setupEvents = function () {
    $('.fake-modal').on('click', function (e) {
        var elm = $(this),
            modalId = elm.attr('id'),
            target = e.target;

        if (target.tagName !== 'A') {
            closeModal(modalId);
        }
    });

    closeBtns.on('click', function (e) {
        var elm = $(this),
            modalId = elm.data('modal');

        closeModal(modalId);

        e.preventDefault();

        return false;
    });

    openBtns.on('click', function (e) {
        var elm = $(this),
            modalId = elm.data('open-modal');

        openModal(modalId);

        e.preventDefault();

        return false;
    });

    playStopBtn.on('click', function (e) {
        if (radioPlaying === true) {
            pause();
        } else {
            play();
        }

        e.preventDefault();

        return false;
    });

    stationsList.on('click', function (e) {
        var elm = $(this),
            station = elm.data('station');

        if (elm.hasClass('selected') === false) {
            console.log('[STATION] Changing...');
            changeStation(station);
            updateCurrentSettingsDisplay();
        }

        closeModal('station-switcher');

        e.preventDefault();

        return false;
    });


    qualityList.on('click', function (e) {
        var elm = $(this),
            quality = elm.data('quality');

        if (elm.hasClass('selected') === false) {
            console.log('[QUALITY] Changing...');
            changeQuality(quality);
            updateCurrentSettingsDisplay();
        }

        closeModal('quality-switcher');

        e.preventDefault();

        return false;
    });
};

var updateCurrentSettingsDisplay = function () {
    var station = currentOptions.station || defaultOptions.station,
        quality = currentOptions.quality || defaultOptions.quality;

    $('#curr-station').text(stationsLabels[station]);
    $('#curr-quality').text(qualityLabels[quality]);

    qualityList.each(function () {
        var elm = $(this);

        if (elm.data('quality') === quality) {
            elm.addClass('selected');
        } else {
            elm.removeClass('selected');
        }
    });

    stationsList.each(function () {
        var elm = $(this);

        if (elm.data('station') === station) {
            elm.addClass('selected');
        } else {
            elm.removeClass('selected');
        }
    });
};

var play = function () {
    var station = currentOptions.station || defaultOptions.station,
        quality = currentOptions.quality || defaultOptions.quality,
        stream = stations[station + ':' + quality];

    player.src = stream;
    radioPlaying = true;

    player.play();
    updateSongInfo();

    playStopBtn.text('').removeClass('play').addClass('stop');
};

var pause = function () {
    radioPlaying = false;

    window.clearTimeout(infoTimeout);
    player.pause();

    player.src = '';

    playStopBtn.text('').removeClass('stop').addClass('play');
};

var updateSongInfo = function () {
    var updateUrl = statusesUrls[currentOptions.station];

    window.clearTimeout(infoTimeout);

    console.log('[SONGINFO] Getting...');

    $.ajax({
        type: 'GET',
        url: updateUrl,
        cache: false,
        dataType: 'json',
        success: function (data) {
            var coverImage = 'http://christianrock.net' + data.CDCover,
                originalNextUpdate = +data.SecondsToEnd - 10,
                nextUpdate;

            if (originalNextUpdate < 10) {
                originalNextUpdate = 10;
            }

            nextUpdate = originalNextUpdate * 1000;

            $('#background').attr('style', "background-image: url(\"" + coverImage + "\"); filter: url(#blur);");
            $('#album-cover').attr('style', "background-image: url(\"" + coverImage + "\");");

            $('#song-title').text(data.Title);
            $('#song-artist').text(data.Artist);
            $('#song-cd').text(data.CD);

            // some promo audios doesn't have a year defined...
            if (data.Year) {
                $('#song-year').text('(' + data.Year + ')');
            }

            infoTimeout = window.setTimeout(updateSongInfo, nextUpdate);

            console.log('[SONGINFO] Success!');
        },
        error: function () {
            console.log('[SONGINFO] Error!');
        }
    });
};

var resetSongInfo = function () {
    $('#background').attr('style', '');
    $('#album-cover').attr('style', '');
    $('#song-title').text('Loading...');
    $('#song-artist').text('');
    $('#song-cd').text('');
    $('#song-year').text('');
};

var setupPlayer = function () {
    player.preload = 'auto';
    player.mozAudioChannelType = 'content';
};

var startup = function () {
    asyncStorage.getItem('options', function (options) {
        currentOptions = options || defaultOptions;

        asyncStorage.setItem('options', currentOptions);

        setupPlayer();
        play();
        setupEvents();
        updateCurrentSettingsDisplay();
    });
};

startup();