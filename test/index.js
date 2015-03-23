'use strict';

var version = require('gm').version;

// load gm and extension itself
// gm now works only with imagemagick
var gm = require('gm').subClass({ imageMagick: true });

var mirrorize = require('..');

// tests dev dependencies
var Q = require('q');
var semver = require('semver');

// core modules
var fs = require('fs');
var path = require('path');
var assert = require('assert');

// -----------------------------------------------------------------------------
// file helpers

// use current directory to create test files
var directory = __dirname;

// use png for test because jpg returns not exact colors of pixels
// + actually it does not matter for mirrorize what type of image it is gonna be
var ext = '.png';

// remove all test files from a test directory (sync)
function clean() {
  var files = fs.readdirSync(directory);
  files.forEach(function (file) {
    if (path.extname(file) === ext) {
      fs.unlinkSync(path.join(directory, file));
    }
  });
}

// create a filename for a test file using set directory and extension
function toFilePath(name) {
  // sanitize filename
  var name = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return path.join(directory, name + ext);
}

// -----------------------------------------------------------------------------
// color helpers

var colors = {
  yellow: 'rgb(255,255,0)',
  red: 'rgb(255,0,0)',
  green: 'rgb(0,255,0)',
  blue: 'rgb(0,0,255)'
};

// gets a name of the color by rgb string like "255,0,0"
function toColorName(rgb) {
  var color = undefined;
  Object.keys(colors).some(function (name) {
    if (colors[name].indexOf(rgb) !== -1) {
      color = name;
      return true;
    }
  });
  return color;
}

// extract rgb value from a string like "(  0,255,  0) #00FF00 lime",
// the result will look like "(0,255,0)"
function extractRGB(str) {
  var pattern = /\(([\s]?[\s]?\d+[,]?)+\)/;
  if (!pattern.test(str)) {
    return str;
  }
  var match = pattern.exec(str)[0];
  // remove whitespaces
  var trim = match.replace(/\s/g, '');
  return trim;
}


// -----------------------------------------------------------------------------
// core functions

// create a test image with four rectangles of different colors
// the result will be like
//  __________________
// |_yellow_|__red___|
// |_green__|__blue__|
//
function initialize(name, width, height) {
  var destPath = toFilePath(name);

  // halves are the centers of an image
  var widthHalf = width / 2, heightHalf = height / 2;

  return Q.promise(function (resolve, reject) {
    // draw 3 rectangles, the 4th will have the color of the background
    gm(width, height, colors.yellow)
    .fill(colors.red).drawRectangle(widthHalf, 0, width, height)
    .fill(colors.green).drawRectangle(0, heightHalf, widthHalf, height)
    .fill(colors.blue).drawRectangle(widthHalf, heightHalf, width, height)
    .write(destPath, function (err) {
      if (err) { return reject(err) }
      // resolve with filename, it will be passed to colorAt
      resolve(destPath);
    });
  });
}

function scenario(name, callback, expectations) {
  // normalize path
  var destPath = toFilePath(name);
  // this function gets a result from previous promise
  return function (origPath) {
    return Q.promise(function (resolve, reject) {
      // create an image based on original image
      var image = gm(origPath);
      // let scenario do something with image
      image = callback(image);
      // and then save it to another file
      image.write(destPath, function (err) {
        if (err) { return reject(err); }
        // resolve it with both original and new one paths
        console.log('Scenario: %s', name);
        resolve([origPath, destPath]);
      });
    })
    // after new image is created with filters applied on it
    // test this image on passed expectations
    // use spread to get both original and new path in the next call
    .spread(meet(expectations))
    // the result of running a scenario is a path to original file
    // so scenarios could be chained one after another
    // when we've checked all the expectations respond with it
    .then(function () {
      return Q.fcall(function () {
        console.log('Done: %s', name);
        console.log('---------------');
        return origPath;
      });
    });
  };
}

function meet(expectations) {
  expectations = expectations || {};
  // this function gets a result from previous promise
  return function (origPath, sourcePath) {
    var outcomes = [];
    if (expectations.colors) {
      outcomes.push(expectColors(sourcePath, expectations.colors));
    }
    if (expectations.size) {
      outcomes.push(expectSize(sourcePath, expectations.size));
    }
    return Q.all(outcomes);
  };
}

function expectColors(sourcePath, colors) {
  colors = colors || [];
  // will store all promises for executed checks
  var outcomes = [];
  // iterate over each color with each size for a color
  Object.keys(colors).forEach(function (colorName) {

    var points = colors[colorName];
    points.forEach(function (point) {

      var xy = point.split('x');
      var x = xy[0], y = xy[1];

      var outcome = colorAt(sourcePath, x, y).then(function (pointColorRgb) {

        var pointColorName = toColorName(pointColorRgb);

        assert.equal(colorName, pointColorName,
          'Color mismatch in the point (' + x + 'x' + y + '):\n' +
          '      expected: ' + colorName + '\n' +
          '      got:      ' + pointColorName);

        return Q.fcall(function () { return true; });
      });

      outcomes.push(outcome);
    });
  });

  return Q.all(outcomes);
}

// return rgb-like string in format like "(255,0,255)"
// for a given image point
function colorAt(sourcePath, x, y) {
  return Q.promise(function (resolve, reject) {
    // get rgb for a position
    // http://www.imagemagick.org/discourse-server/viewtopic.php?t=19297
    var format = '%[fx:floor(255*u.r)],%[fx:floor(255*u.g)],%[fx:floor(255*u.b)]';
    // '[..] with filename was not supported below 1.12.0
    if (semver.gt(version, '1.11.0')) {
      // crop image to one pixel at position 'x y'
      // value will be a string like "0,0,255"
      gm(sourcePath + '[1x1+' + x + '+' + y + ']')
      .identify(format, function (err, value) {
        if (err) { return reject(err); }
        resolve(value);
      });
    } else {
      // because inline crop is not supported
      // we should save crop result to a file
      var pointSourcePath = sourcePath.replace(ext, '_' + x + '_' + y + ext);
      // crop test image to a size of one point
      gm(sourcePath)
      .crop(1, 1, x, y)
      .write(pointSourcePath, function (err) {
        // then read properties for the point file
        gm(pointSourcePath)
        .identify(format, function (err, value) {
          if (err) { return reject(err); }
          // custom format is not supported for "identify" below 1.11.0
          if (semver.gt(version, '1.10.0')) {
            resolve(value);
          } else {
            // extract actual color
            var rgb = extractRGB(value.Histogram['1']);
            resolve(rgb);
          }
        });
      });
    }
  });
}

function expectSize(sourcePath, size) {
  return Q.promise(function (resolve, reject) {
    gm(sourcePath).size(function (err, sourceSize) {
      if(err) { return reject(err); }

      var sourceSizeCombined = [sourceSize.width, sourceSize.height].join('x');

      assert.equal(size, sourceSizeCombined,
          'Size mismatch:\n' +
          '      expected: ' + size + '\n' +
          '      got:      ' + sourceSizeCombined);

      resolve();
    });
  });
}

// -----------------------------------------------------------------------------
// test flow

clean();

// Rectangle example
//  __________________
// |_yellow_|__red___|
// |_green__|__blue__|
//

initialize('original', 200, 200)

// test if original image was created right
.then(scenario('test original', function(image) {
  return image;
}, {
  colors: {
    'yellow': ['50x50'],
    'red': ['150x50'],
    'green': ['50x150'],
    'blue': ['150x150']
  },
  size: '200x200'
}))

// call without parameters, it should have the same result as 'west'
.then(scenario('default', function (image) {
  return image.mirrorize();
}, {
  colors: {
    'yellow': ['50x50', '150x50'],
    'green': ['50x150', '150x150']
  },
  size: '200x200'
}))

// call with disabled imagemagick, there should be no changes to the image
.then(scenario('default without imagemagick', function (image) {
  return image.options({ imageMagick: false }).mirrorize();
}, {
  colors: {
    'yellow': ['50x50'],
    'red': ['150x50'],
    'green': ['50x150'],
    'blue': ['150x150']
  },
  size: '200x200'
}))

.then(scenario('north', function (image) {
  return image.mirrorize('north');
}, {
  colors: {
    'yellow': ['50x50', '50x150'],
    'red': ['150x50', '150x150']
  },
  size: '200x200'
}))

.then(scenario('south', function (image) {
  return image.mirrorize('south');
}, {
  colors: {
    'green': ['50x50', '50x150'],
    'blue': ['150x50', '150x150']
  },
  size: '200x200'
}))

.then(scenario('west', function (image) {
  return image.mirrorize('west');
}, {
  colors: {
    'yellow': ['50x50', '150x50'],
    'green': ['50x150', '150x150']
  },
  size: '200x200'
}))

.then(scenario('east', function (image) {
  return image.mirrorize('east');
}, {
  colors: {
    'red': ['50x50', '150x50'],
    'blue': ['50x150', '150x150']
  },
  size: '200x200'
}))

.then(scenario('northwest', function (image) {
  return image.mirrorize('northwest');
}, {
  colors: {
    'yellow': ['50x50', '50x150', '150x50', '150x150']
  },
  size: '200x200'
}))

.then(scenario('northeast', function (image) {
  return image.mirrorize('northeast');
}, {
  colors: {
    'red': ['50x50', '50x150', '150x50', '150x150']
  },
  size: '200x200'
}))

.then(scenario('southwest', function (image) {
  return image.mirrorize('southwest');
}, {
  colors: {
    'green': ['50x50', '50x150', '150x50', '150x150']
  },
  size: '200x200'
}))

.then(scenario('southeast', function (image) {
  return image.mirrorize('southeast');
}, {
  colors: {
    'blue': ['50x50', '50x150', '150x50', '150x150']
  },
  size: '200x200'
}))

.then(scenario('north then west', function (image) {
  return image.mirrorize('north').mirrorize('west');
}, {
  colors: {
    'yellow': ['50x50', '50x150', '150x50', '150x150']
  },
  size: '200x200'
}))

.then(scenario('resize then crop then east', function (image) {
  return image
    .resize(200, 150, '!')
    .crop(150, 100)
    .mirrorize('east');
}, {
  colors: {
    'red': ['30x10', '30x60', '130x10', '130x60'],
    'yellow': ['75x10', '75x60'],
    'green': ['75x90'],
    'blue': ['30x90', '130x90']
  },
  size: '150x100'
}))

.then(scenario('resize then crop then east then west', function (image) {
  return image
    .resize(200, 150, '!')
    .crop(150, 100)
    .mirrorize('east')
    .mirrorize('south');
}, {
  colors: {
    'red': ['10x50', '140x50'],
    'yellow': ['75x50'],
    'green': ['75x10', '75x90'],
    'blue': ['10x10', '140x10', '10x90', '140x90']
  },
  size: '150x100'
}))

.then(scenario('resize then crop then east then west then crop', function (image) {
  return image
    .resize(200, 150, '!')
    .crop(150, 100)
    .mirrorize('east')
    .mirrorize('south')
    .crop(70, 70, 0, 0);
}, {
  colors: {
    'red': ['30x30', '40x30', '30x65', '40x65'],
    'yellow': ['65x30', '65x65'],
    'green': ['65x5'],
    'blue': ['5x5', '35x5']
  },
  size: '70x70'
}))

.then(function () {
  console.log('All tests passed!');
})

.fail(function (err) {
  console.log(err.stack);
})

.fin(function () {
  // comment it out if you want to see test images under "test/" directory
  // don't forget to remove them then
  clean();
});