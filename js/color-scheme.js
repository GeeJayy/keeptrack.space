/* global
  $
  gl

  satSet
  lookangles
  timeManager
  settingsManager
  groups
*/
(function () {
  var colorTheme = settingsManager.colors;

  var ColorScheme = function (colorizer) {
    this.colorizer = colorizer;
    this.colorBuf = gl.createBuffer();
    this.pickableBuf = gl.createBuffer();
  };

  ColorScheme.objectTypeFlags = {};
  ColorScheme.objectTypeFlags.green = true;
  ColorScheme.objectTypeFlags.blue = true;
  ColorScheme.objectTypeFlags.gray = true;
  ColorScheme.objectTypeFlags.orange = true;
  ColorScheme.objectTypeFlags.yellow = true;
  ColorScheme.objectTypeFlags.red = true;
  ColorScheme.objectTypeFlags.purple = true;
  ColorScheme.objectTypeFlags.white = true;

  // Removed from function to reduce memory leak
  ColorScheme.prototype.calculateColorBuffers = function (isForceRecolor) {
    var numSats, colorData, pickableData, colors, i;
    var lastCalculation = 0;
    var now = Date.now();
    if (!pickableData || !colorData) {
      this.lastCalculation = now;
      numSats = satSet.numSats;
      colorData = new Float32Array(numSats * 4);
      pickableData = new Float32Array(numSats); // Broke as an Int8
    }

    if (!isForceRecolor && now - lastCalculation < settingsManager.reColorMinimumTime && lastCalculation !== 0) {
      return {
        colorBuf: this.colorBuf,
        pickableBuf: this.pickableBuf
      };
    }
    lastCalculation = now;

    var isFirstMarkerChecked = false;
    var satData = satSet.getSatData();
    var satInView = satSet.getSatInView();
    if (this.isVelocityColorScheme) {
      satVel = satSet.getSatVel();
    }
    for (i = 0; i < numSats; i++) {
      sat = satData[i];
      if (satInView) sat.inView = satInView[i];

      if (this.isVelocityColorScheme) {
        sat.velocity = Math.sqrt(
          satVel[i * 3] * satVel[i * 3] +
          satVel[i * 3 + 1] * satVel[i * 3 + 1] +
          satVel[i * 3 + 2] * satVel[i * 3 + 2]
        );
      }

      // if (!isFirstMarkerChecked) { // Markers Color Can't Change so Don't Keep Checking
        colors = this.colorizer(sat); // Run the colorscheme below
      // }
      isFirstMarkerChecked = colors.marker; // First Marker Checked Returns True
      if (typeof colors == 'undefined') continue;
      colorData[i * 4] = colors.color[0];  // R
      colorData[i * 4 + 1] = colors.color[1]; // G
      colorData[i * 4 + 2] = colors.color[2]; // B
      colorData[i * 4 + 3] = colors.color[3]; // A
      pickableData[i] = colors.pickable ? 1 : 0;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuf);
    gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pickableBuf);
    gl.bufferData(gl.ARRAY_BUFFER, pickableData, gl.STATIC_DRAW);
    return {
      colorBuf: this.colorBuf,
      pickableBuf: this.pickableBuf
    };
  };

  ColorScheme.reloadColors = function () {
    colorTheme = settingsManager.colors;
  };

  var sat, color;
  ColorScheme.init = function () {
    ColorScheme.default = new ColorScheme(function (sat) {
      if (sat.static && sat.type === 'Launch Facility' && ColorScheme.objectTypeFlags.purple === false) {
        return {
          color: colorTheme.deselected,
          pickable: false
        };
      }

      if (sat.static && sat.type === 'Launch Facility') {
        return {
          color: colorTheme.facility,
          pickable: true
        };
      }

      if (sat.marker) {
        return {
          color: colorTheme.marker,
          marker: true,
          pickable: false
        };
      }

      if (sat.static && ColorScheme.objectTypeFlags.red === false) {
        return {
          color: colorTheme.deselected,
          pickable: false
        };
      }
      if (sat.static) {
        return {
          color: colorTheme.sensor,
          pickable: true
        };
      }
      if (sat.missile && !sat.inView) {
        return {
          color: colorTheme.missile,
          pickable: true
        };
      }
      if (sat.missile && sat.inView) {
        return {
          color: colorTheme.missileInview,
          pickable: true
        };
      }

      // NOTE: ColorScheme.objectTypeFlags code

      if (!sat.inView && sat.OT === 1 && ColorScheme.objectTypeFlags.green === false ||
          cameraType.current === cameraType.PLANETARIUM && sat.OT === 1 && ColorScheme.objectTypeFlags.green === false) {
        return {
          color: colorTheme.deselected,
          pickable: false
        };
      }
      if (!sat.inView && sat.OT === 2 && ColorScheme.objectTypeFlags.blue === false ||
          cameraType.current === cameraType.PLANETARIUM && sat.OT === 2 && ColorScheme.objectTypeFlags.blue === false) {
        return {
          color: colorTheme.deselected,
          pickable: false
        };
      }
      if (!sat.inView && sat.OT === 3 && ColorScheme.objectTypeFlags.gray === false ||
          cameraType.current === cameraType.PLANETARIUM && sat.OT === 3 && ColorScheme.objectTypeFlags.gray === false) {
        return {
          color: colorTheme.deselected,
          pickable: false
        };
      }

      if (sat.inView && ColorScheme.objectTypeFlags.orange === false && cameraType.current !== cameraType.PLANETARIUM) {
        return {
          color: colorTheme.deselected,
          pickable: false
        };
      }

      if (sat.inView && cameraType.current !== cameraType.PLANETARIUM) {
        color = colorTheme.inview;
      } else if (sat.OT === 1) { // Payload
        color = colorTheme.payload;
      } else if (sat.OT === 2) { // Rocket Body
        color = colorTheme.rocket;
      } else if (sat.OT === 3) { // Debris
        color = colorTheme.debris;
      } else {
        color = colorTheme.unknown;
      }

      if ((sat.perigee > satellite.obsmaxrange || sat.apogee < satellite.obsminrange)) {
        return {
          color: colorTheme.transparent,
          pickable: false
        };
      }

      return {
        color: color,
        pickable: true
      };
    });
    ColorScheme.onlyFOV = new ColorScheme(function (sat) {
      if (sat.inView) {
        return {
          color: colorTheme.inview,
          pickable: true
        };
      } else {
        return {
          color: colorTheme.transparent,
          pickable: false
        };
      }
    });
    /// //////////////////////////////
    // NOTE: Doesn't appear to be used
    // ///////////////////////////////
    ColorScheme.apogee = new ColorScheme(function (sat) {
      var ap = sat.apogee;
      colorTheme.gradientAmt = Math.min(ap / 45000, 1.0);
      colorTheme.apogeeGradient = [1.0 - colorTheme.gradientAmt, colorTheme.gradientAmt, 0.0, 1.0];
      return {
        color: colorTheme.apogeeGradient,
        pickable: true
      };
    });
    // ///////////////////////////////

    ColorScheme.smallsats = new ColorScheme(function (sat) {
      if (sat.inView && cameraType.current !== cameraType.PLANETARIUM) {
        return {
          color: colorTheme.inviewAlt,
          pickable: true
        };
      }
      if (sat.OT === 1 && ColorScheme.objectTypeFlags.green === false) {
        return {
          color: colorTheme.deselected,
          pickable: false
        };
      }
      if (sat.R < 0.1 && sat.OT === 1) {
        return {
          color: colorTheme.smallSats,
          pickable: true
        };
      } else {
        return {
          color: colorTheme.transparent,
          pickable: false
        };
      }
    });
    ColorScheme.rcs = new ColorScheme(function (sat) {
      var rcs = sat.R;
      if (sat.inView && cameraType.current !== cameraType.PLANETARIUM) {
        return {
          color: colorTheme.inview,
          pickable: true
        };
      }
      if (rcs < 0.1 && ColorScheme.objectTypeFlags.red === false) {
        return {
          color: colorTheme.deselected,
          pickable: false
        };
      }
      if ((rcs >= 0.1 && rcs <= 1) && ColorScheme.objectTypeFlags.blue === false) {
        return {
          color: colorTheme.deselected,
          pickable: false
        };
      }
      if (rcs > 1 && ColorScheme.objectTypeFlags.green === false) {
        return {
          color: colorTheme.deselected,
          pickable: false
        };
      }
      if ((typeof rcs == 'undefined' || typeof rcs == null) && ColorScheme.objectTypeFlags.yellow === false) {
        return {
          color: colorTheme.deselected,
          pickable: false
        };
      }
      if (rcs < 0.1) {
        return {
          color: colorTheme.smallRCS,
          pickable: true
        };
      }
      if (rcs >= 0.1 && rcs <= 1) {
        return {
          color: colorTheme.mediumRCS,
          pickable: true
        };
      }
      if (rcs > 1) {
        return {
          color: colorTheme.largeRCS,
          pickable: true
        };
      }
      // Unknowns
      return {
        color: colorTheme.unknownRCS,
        pickable: true
      };
    });
    ColorScheme.countries = new ColorScheme(function (sat) {
      var country = sat.C;
      if (sat.inView && cameraType.current !== cameraType.PLANETARIUM) {
        return {
          color: colorTheme.inview,
          pickable: true
        };
      }
      if (!sat.inView && country === 'US' && ColorScheme.objectTypeFlags.blue === false ||
          cameraType.current === cameraType.PLANETARIUM && country === 'US' && ColorScheme.objectTypeFlags.blue === false) {
        return {
          color: colorTheme.deselected,
          pickable: false
        };
      }
      if (!sat.inView && country === 'PRC' && ColorScheme.objectTypeFlags.red === false ||
          cameraType.current === cameraType.PLANETARIUM && country === 'PRC' && ColorScheme.objectTypeFlags.red === false) {
        return {
          color: colorTheme.deselected,
          pickable: false
        };
      }
      if (!sat.inView && country === 'CIS' && ColorScheme.objectTypeFlags.white === false ||
          cameraType.current === cameraType.PLANETARIUM && country === 'CIS' && ColorScheme.objectTypeFlags.white === false) {
        return {
          color: colorTheme.deselected,
          pickable: false
        };
      }
      if (country === 'US') {
        return {
          color: colorTheme.usa,
          pickable: true
        };
      }
      if (country === 'PRC') {
        return {
          color: colorTheme.china,
          pickable: true
        };
      }
      if (country === 'CIS') {
        return {
          color: colorTheme.russia,
          pickable: true
        };
      }
      // Other Countries
      if (!sat.inView && ColorScheme.objectTypeFlags.green === false ||
          cameraType.current === cameraType.PLANETARIUM && ColorScheme.objectTypeFlags.green === false) {
        return {
          color: colorTheme.deselected,
          pickable: false
        };
      }
      return {
        color: colorTheme.otherCountries,
        pickable: true
      };
    });
    ColorScheme.lostobjects = new ColorScheme(function (sat) {
      if (sat.inView && cameraType.current !== cameraType.PLANETARIUM) {
        return {
          color: colorTheme.inview,
          pickable: true
        };
      }
      if (sat.static && sat.type === 'Launch Facility') {
        return {
          color: colorTheme.facility,
          pickable: true
        };
      }
      if (sat.static) {
        return {
          color: colorTheme.sensor,
          pickable: true
        };
      }
      if (sat.missile && !sat.inView) {
        return {
          color: colorTheme.missile,
          pickable: true
        };
      }
      if (sat.missile && sat.inView) {
        return {
          color: colorTheme.missileInview,
          pickable: true
        };
      }
      var pe = sat.perigee;
      var now = new Date();
      var jday = timeManager.getDayOfYear(now);
      now = now.getFullYear();
      now = now.toString().substr(2, 2);
      var daysold;
      if (sat.TLE1.substr(18, 2) === now) {
        daysold = jday - sat.TLE1.substr(20, 3);
      } else {
        daysold = jday - sat.TLE1.substr(20, 3) + (sat.TLE1.substr(17, 2) * 365);
      }
      if (pe > satellite.obsmaxrange || daysold < settingsManager.daysUntilObjectLost) {
        return {
          color: colorTheme.transparent,
          pickable: false
        };
      } else {
        if ($('#search').val() === '') {
          $('#search').val($('#search').val() + sat.SCC_NUM);
        } else {
          $('#search').val($('#search').val() + ',' + sat.SCC_NUM);
        }
        return {
          color: colorTheme.lostobjects,
          pickable: true
        };
      }
    });
    ColorScheme.leo = new ColorScheme(function (sat) {
      if (sat.inView && cameraType.current !== cameraType.PLANETARIUM) {
        return {
          color: colorTheme.inview,
          pickable: true
        };
      }
      var ap = sat.apogee;
      if (ap > 2000) {
        return {
          color: colorTheme.transparent,
          pickable: false
        };
      } else {
        return {
          color: colorTheme.leo,
          pickable: true
        };
      }
    });
    ColorScheme.geo = new ColorScheme(function (sat) {
      if (sat.inView && cameraType.current !== cameraType.PLANETARIUM) {
        return {
          color: colorTheme.inview,
          pickable: true
        };
      }
      var pe = sat.perigee;
      if (pe < 35000) {
        return {
          color: colorTheme.transparent,
          pickable: false
        };
      } else {
        return {
          color: colorTheme.geo,
          pickable: true
        };
      }
    });
    ColorScheme.velocity = new ColorScheme(function (sat) {
      if (sat.inView && cameraType.current !== cameraType.PLANETARIUM && ColorScheme.objectTypeFlags.blue !== false) {
        return {
          color: colorTheme.inviewAlt,
          pickable: true
        };
      }
      var vel = sat.velocity;
      if (vel > 5.5 && ColorScheme.objectTypeFlags.yellow === false) {
        return {
          color: colorTheme.deselected,
          pickable: false
        };
      }
      if ((vel >= 2.5 && vel <= 5.5) && ColorScheme.objectTypeFlags.orange === false) {
        return {
          color: colorTheme.deselected,
          pickable: false
        };
      }
      if (vel < 2.5 && ColorScheme.objectTypeFlags.red === false) {
        return {
          color: colorTheme.deselected,
          pickable: false
        };
      }
      colorTheme.gradientAmt = Math.min(vel / 15, 1.0);
      colorTheme.velGradient = [1.0 - colorTheme.gradientAmt, colorTheme.gradientAmt, 0.0, 1.0];

      return {
        color: colorTheme.velGradient,
        pickable: true
      };
    });
    ColorScheme.velocity.isVelocityColorScheme = true;
    ColorScheme.group = new ColorScheme(function (sat) {
      if (groups.selectedGroup === null) return;
      if (sat.isInGroup) {
        return {
          color: colorTheme.inGroup,
          pickable: true
        };
      }

      if (sat.marker) {
        return {
          color: colorTheme.marker,
          marker: true,
          pickable: false
        };
      }

      return {
        color: colorTheme.transparent,
        pickable: false
      };
    });
  };

  window.ColorScheme = ColorScheme;
})();
