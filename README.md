gm-mirrorize
===
Extension for [Node.js][ref_nodejs] image manipulation library [gm][ref_gm] which allows to mirror images (create reflections of the images).

Based on original script for [ImageMagick][ref_ImageMagick] by Fred Weinhaus:
http://www.fmwconcepts.com/imagemagick/mirrorize/index.php

Extension was implemented accroding to the [guide][ref_gm_ext], method called `mirrorize` will be embedded into `gm` prototype.

### Support

Extension works only with [ImageMagick][ref_ImageMagick], it **will not work** with [GraphicsMagick][ref_GraphicsMagick], which is default for [gm][ref_gm].
If [ImageMagick][ref_ImageMagick] was not enabled, the method `mirrorize` will do nothing to the image.

Supported version of [gm][ref_gm] is **>=1.3.2**.

### Description

```js
  .mirrorize(direction)
```

- **direction** (*optional*, defaults to `West`) - describes which part of the image will be reflected. For example `North` will result into the north half of the image to be reflected, reflection will be placed over the south part of the image (see [examples](#examples) below)

Available directions:

* `North`
* `South`
* `West` (_default_)
* `East`
* `NorthWest`
* `NorthEast`
* `SouthWest`
* `SouthEast`

### Usage

```js
// use ImageMagick
var gm = require('gm').subClass({ imageMagick: true });

// extend "gm" with "mirrorize" method
require('gm-mirrorize');


// basic

gm('/path/to/my/img.jpg')
  .mirrorize('NorthWest')
  .write('/path/to/mirrorize.jpg', function (err) {
    // ...
  });


// multiple

gm('/path/to/my/img.jpg')
  .mirrorize('North')
  .mirrorize('West')
  .write('/path/to/mirrorize.jpg', function (err) {
    // ...
  });


// chain

gm('/path/to/my/img.jpg')
  .rezise(800, 600)
  .crop(400, 200, 10, 30)
  .mirrorize('South')
  .flop()
  .rezise(200, 200)
  .write('/path/to/mirrorize.jpg', function (err) {
    // ...
  });


```

### Examples

##### Original
![Original](http://i.imgur.com/MOaNo4i.png "Original")

##### Mirrorized
![North and South](http://i.imgur.com/Qd1jBXJ.png "North and South")
![West and East](http://i.imgur.com/d5sTm19.png "West and East")
![NorthWest and NorthEast](http://i.imgur.com/1aIRGwW.png "NorthWest and NorthEast")
![SouthWest and SouthEast](http://i.imgur.com/CMexgRE.png "SouthWest and SouthEast")

### Test

Run from the extension directory:

``` bash
npm test
```

[ref_nodejs]: https://nodejs.org/
[ref_gm]: https://github.com/aheckmann/gm
[ref_gm_ext]: https://github.com/aheckmann/gm/wiki/Extending-gm
[ref_ImageMagick]: http://www.imagemagick.org/
[ref_GraphicsMagick]: http://www.graphicsmagick.org/

### License

Copyright © Michael Radionov
Copyright © Fred Weinhaus

License terms are based on the original script license terms provided by Fred Weinhaus and can be found at http://www.fmwconcepts.com/imagemagick/mirrorize/index.php.

This software and associated documentation files (the "Software") is available free of charge ONLY for non-commercial use.
To use the Software in commercial (for-profit) environments or non-free applications, and also to modify, publish, distribute, sublicinse, incorporate into other software or reprogramming into another scripting languages, you must contact Fred Weinhaus for licensing arrangements ( contact information - http://www.fmwconcepts.com/imagemagick/index.php ).

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
