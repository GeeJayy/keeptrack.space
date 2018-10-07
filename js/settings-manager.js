/* globals
  $
*/

var MAX_MISSILES = 500;
var MAX_ANALSATS = 30;
var MAX_FIELD_OF_VIEW_MARKERS = 200000;

(function () {
  var settingsManager = {};

  //  Version Control
  settingsManager.versionNumber = 'v0.42.1';
  settingsManager.versionDate = 'October 6, 2018';

  // Offline management
  settingsManager.offlineLocation = '';

  settingsManager.themes = {};
  settingsManager.isThemesNeeded = false;
  settingsManager.themes.currentTheme = 'Blue';
  settingsManager.themes.retheme = function () {
    if (!settingsManager.isThemesNeeded) return;
    if (settingsManager.themes.currentTheme === 'Blue') settingsManager.themes.blueTheme(true);
    if (settingsManager.themes.currentTheme === 'Red') settingsManager.themes.redTheme(true);
  };
  settingsManager.themes.redTheme = function (isForce) {
    if (settingsManager.retro) return;
    if (settingsManager.themes.currentTheme === 'Red' && !isForce) return;
      document.getElementById('nav-wrapper').classList.remove('light-blue');
      document.getElementById('nav-wrapper').classList.add('red');
      document.getElementById('nav-footer').classList.add('red');
      document.getElementById('nav-footer').classList.add('darken-3');
      $('#bottom-menu').css('background', 'rgb(165, 0, 0)');
      $('.bmenu-item').css('border-right-color', 'orangered');
      $('#menu-info-overlay ').css('border-left-color', 'orangered');
      $('.side-menu').css('background', 'LightCoral');
      $('#sat-infobox').css('background', 'LightCoral');
      $('#sat-infobox').css('border-top-color', 'DarkRed');
      $('#search-results').css('background', 'LightCoral');
      $('#search-result:hover').css('background', 'DarkRed');
      $('.search-hilight').css('color', 'DarkRed');
      $('.btn').css('background-color', 'red');
      settingsManager.themes.currentTheme = 'Red';
    };
  settingsManager.themes.redThemeSearch = function (isForce) {
    if (settingsManager.retro) return;
    if (settingsManager.themes.currentTheme !== 'Red' && !isForce) return;
    $('#search-results').css('background', 'LightCoral');
    $('#search-result:hover').css('background', 'DarkRed');
    $('.search-hilight').css('color', 'DarkRed');
  };
  settingsManager.themes.blueTheme = function (isForce) {
    if (settingsManager.retro) return;
    if (settingsManager.themes.currentTheme === 'Blue' && !isForce) return;
    document.getElementById('nav-wrapper').classList.remove('red');
    document.getElementById('nav-footer').classList.remove('red');
    document.getElementById('nav-footer').classList.remove('darken-3');
    document.getElementById('nav-wrapper').classList.add('light-blue');
    $('#nav-footer').css('background-color', '#0277bd');
    $('#bottom-menu').css('background', 'rgb(0,105,165)');
    $('.bmenu-item').css('border-right-color', 'steelblue');
    $('#menu-info-overlay ').css('border-left-color', 'steelblue');
    $('.side-menu').css('background', '#0a97d6');
    $('#sat-infobox').css('background', '#0a97d6');
    $('#sat-infobox').css('border-top-color', '#0277bd');
    $('#search-results').css('background', '#0a97d6');
    $('#search-results:hover').css('background', '#0277bd');
    $('.search-hilight').css('color', '#01579b');
    $('.btn').css('background-color', '#0091ea');
    settingsManager.themes.currentTheme = 'Blue';
  };

  settingsManager.hiresImages = false; // USE OFFLINE ONLY

  settingsManager.shadersReady = false;
  settingsManager.cruncherReady = false;

  settingsManager.lkVerify = Date.now();

  settingsManager.redTheme = false;

  settingsManager.limitSats = '';
  settingsManager.searchLimit = 400;

  settingsManager.fieldOfView = 0.6;
  settingsManager.fieldOfViewMin = 0.5;
  settingsManager.fieldOfViewMax = 1.0; // 2.12 shows GEO

  settingsManager.geolocation = {};
  settingsManager.geolocationUsed = false;

  settingsManager.mapWidth = 800;
  settingsManager.mapHeight = 600;

  settingsManager.hoverColor = [0.1, 1.0, 0.0, 1.0]; // Green
  settingsManager.selectedColor = [1.0, 0.0, 0.0, 1.0]; // Red

  settingsManager.minimumSearchCharacters = 2; // Searches after 3 characters typed

  settingsManager.currentLegend = 'default';

  settingsManager.socratesOnSatCruncher = null;

  settingsManager.vertShadersSize = 12;
  settingsManager.isEditTime = false;
  settingsManager.isPropRateChange = false;
  settingsManager.isOnlyFOVChecked = false;
  settingsManager.isBottomIconsEnabled = false;
  settingsManager.isBottomMenuOpen = false;
  settingsManager.isMapMenuOpen = false;
  settingsManager.isForceColorScheme = false;

  settingsManager.isDemoModeOn = false;
  settingsManager.demoModeInterval = 3000; // in ms (3 second default)
  settingsManager.isSatLabelModeOn = true;
  settingsManager.satLabelInterval = 250; //  in ms (0.5 second default)

  settingsManager.isSatOverflyModeOn = false;
  settingsManager.isFOVBubbleModeOn = false;

  settingsManager.maxOrbits = 20000; // TODO: BROKEN
  settingsManager.maxLabels = 20000;  // TODO: BROKEN

  settingsManager.isAlwaysHidePropRate = false;

  settingsManager.isMapUpdateOverride = false;
  settingsManager.lastMapUpdateTime = 0;

  settingsManager.cameraMovementSpeed = 0.003;
  settingsManager.cameraMovementSpeedMin = 0.005;

  settingsManager.daysUntilObjectLost = 60;

  settingsManager.camDistBuffer = 2000;

  // /////////////////
  // Mobile Settings
  // /////////////////
  settingsManager.desktopMinimumWidth = 1000;
  settingsManager.isMobileModeEnabled = false;
  if ($(document).width() <= settingsManager.desktopMinimumWidth) {
    settingsManager.isMobileModeEnabled = true;
    settingsManager.camDistBuffer = 3500;
    // settingsManager.cameraMovementSpeed = 0.0001;
    // settingsManager.cameraMovementSpeedMin = 0.0001;
  }
  settingsManager.isDisableSatHoverBox = false;

  // /////////////////
  // Color Settings
  // /////////////////
  settingsManager.currentColorScheme = null;
  settingsManager.colors = {};

  settingsManager.reColorMinimumTime = 1000;

  settingsManager.colors.facility = [0.64, 0.0, 0.64, 1.0];
  settingsManager.colors.sensor = [1.0, 0.0, 0.0, 1.0];
  settingsManager.colors.marker = [0.2, 1.0, 1.0, 1.0];
  settingsManager.colors.deselected = [1.0, 1.0, 1.0, 0];
  settingsManager.colors.inview = [0.85, 0.5, 0.0, 1.0];
  settingsManager.colors.inviewAlt = [0.2, 0.5, 1.0, 0.85];
  settingsManager.colors.payload = [0.2, 1.0, 0.0, 0.5];
  settingsManager.colors.rocket = [0.2, 0.5, 1.0, 0.85];
  settingsManager.colors.debris = [0.5, 0.5, 0.5, 0.85];
  settingsManager.colors.unknown = [0.5, 0.5, 0.5, 0.85];
  settingsManager.colors.missile = [1.0, 1.0, 0.0, 1.0];
  settingsManager.colors.missileInview = [1.0, 0.0, 0.0, 1.0];
  settingsManager.colors.transparent = [1.0, 1.0, 1.0, 0.1];
  settingsManager.colors.gradientAmt = 0;
  // TODO: Gradients Must be Edited in color-scheme.js
  // settingsManager.colors.apogeeGradient = [1.0 - settingsManager.colors.gradientAmt, settingsManager.colors.gradientAmt, 0.0, 1.0];
  // settingsManager.colors.velGradient = [1.0 - settingsManager.colors.gradientAmt, settingsManager.colors.gradientAmt, 0.0, 1.0];
  settingsManager.colors.smallSats = [0.2, 1.0, 0.0, 0.65];
  settingsManager.colors.smallRCS = [1.0, 0, 0, 0.6];
  settingsManager.colors.mediumRCS = [0.2, 0.5, 1.0, 0.85];
  settingsManager.colors.largeRCS = [0, 1.0, 0, 0.6];
  settingsManager.colors.unknownRCS = [1.0, 1.0, 0, 0.6];
  settingsManager.colors.lostobjects = [0.2, 1.0, 0.0, 0.65];
  settingsManager.colors.leo = [0.2, 1.0, 0.0, 0.65];
  settingsManager.colors.geo = [0.2, 1.0, 0.0, 0.65];
  settingsManager.colors.inGroup = [0.2, 1.0, 0.0, 0.5];
  settingsManager.colors.china = [1.0, 0, 0, 0.6];
  settingsManager.colors.usa = [0.2, 0.5, 1.0, 0.85];
  settingsManager.colors.russia = [1.0, 1.0, 1.0, 1.0];
  settingsManager.colors.otherCountries = [0, 1.0, 0, 0.6];

  // /////////////////
  // Orbit Color Settings
  // /////////////////
  settingsManager.orbitSelectColor = [1.0, 0.0, 0.0, 1.0];
  settingsManager.orbitHoverColor = [0.5, 0.5, 1.0, 1.0];
  settingsManager.orbitInViewColor = [1.0, 1.0, 1.0, 0.6]; // WHITE
  // settingsManager.orbitInViewColor = [1.0, 1.0, 0.0, 1.0]; // Applies to Planetarium View
  settingsManager.orbitGroupColor = [0.3, 0.5, 1.0, 0.4];


  window.settingsManager = settingsManager;
})();
