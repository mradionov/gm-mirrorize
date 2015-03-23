'use strict';

var gm = require('gm');

// Make sure to separate each command and it's argument with a spaces
// so it would be parsed nicely by gm
//
// Parenthesis also should be followed by a space
//
// '-gravity' - is reset before and after each "mirrorize" to be
//   able to chain them, witout mixing up all previous gravities
//   default gravity is NorthWest

// '+repage ' - added after each "-crop" because of conflicts with "crop", which
//   were called on image before "mirrorize"
//   references to issues:
//    http://www.imagemagick.org/discourse-server/viewtopic.php?t=8227
//    http://www.imagemagick.org/discourse-server/viewtopic.php?t=13759
//
gm.prototype.mirrorize = function(direction) {
  direction = (direction || 'west').toLowerCase();

  // only ImageMagick is supported
  if (!this._options.imageMagick) {
    return this;
  }

  var out = [];

  switch(direction) {

  case 'north':
    out = '-gravity NorthWest ' +
          '-crop 100%x50%+0+0 ' +
          '+repage ' +
          '( +clone -flip ) ' +
          '-append ' +
          '-gravity NorthWest';
    break;

  case 'south':
    out = '-gravity South ' +
          '-crop 100%x50%+0+0 ' +
          '+repage ' +
          '( +clone -flip ) ' +
          '+swap ' +
          '-append ' +
          '-gravity NorthWest';
    break;

  case 'west':
    out = '-gravity NorthWest ' +
          '-crop 50%x100%+0+0 ' +
          '+repage ' +
          '( +clone -flop ) ' +
          '+append ' +
          '-gravity NorthWest';
    break;

  case 'east':
    out = '-gravity East ' +
          '-crop 50%x100%+0+0 ' +
          '+repage ' +
          '( +clone -flop ) ' +
          '+swap ' +
          '+append ' +
          '-gravity NorthWest';
    break;

  case 'northwest':
    out = '-gravity NorthWest ' +
          '-crop 50%x50%+0+0 ' +
          '+repage ' +
          '( -clone 0 -flop ) ' +
          '( -clone 0 -flip ) ' +
          '( -clone 0 -rotate 180 ) ' +
          '( -clone 0 -clone 1 +append ) ' +
          '( -clone 2 -clone 3 +append ) ' +
          '-delete 0-3 -append ' +
          '-gravity NorthWest';
    break;

  case 'northeast':
    out = '-gravity NorthEast ' +
          '-crop 50%x50%+0+0 ' +
          '+repage ' +
          '( -clone 0 -flop ) ' +
          '( -clone 0 -flip ) ' +
          '( -clone 0 -rotate 180 ) ' +
          '( -clone 1 -clone 0 +append ) ' +
          '( -clone 3 -clone 2 +append ) ' +
          '-delete 0-3 -append ' +
          '-gravity NorthWest';
    break;

  case 'southwest':
    out = '-gravity SouthWest ' +
          '-crop 50%x50%+0+0 ' +
          '+repage ' +
          '( -clone 0 -flop ) ' +
          '( -clone 0 -flip ) ' +
          '( -clone 0 -rotate 180 ) ' +
          '( -clone 2 -clone 3 +append ) ' +
          '( -clone 0 -clone 1 +append ) ' +
          '-delete 0-3 -append ' +
          '-gravity NorthWest';
    break;

  case 'southeast':
    out = '-gravity SouthEast ' +
          '-crop 50%x50%+0+0 ' +
          '+repage ' +
          '( -clone 0 -flop ) ' +
          '( -clone 0 -flip ) ' +
          '( -clone 0 -rotate 180 ) ' +
          '( -clone 3 -clone 2 +append ) ' +
          '( -clone 1 -clone 0 +append ) ' +
          '-delete 0-3 -append ' +
          '-gravity NorthWest';
    break;

  }

  this.out.apply(this, out.split(' '));

  return this;
};

module.exports = function () {
  throw new Error('Use "mirrorize" method on "gm" object, ' +
                  'do not call this module explicitly');
};