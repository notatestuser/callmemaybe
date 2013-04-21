//     callmemaybe.js
//     Luke Plaster <notatestuser@gmail.com>
//     https://github.com/notatestuser/callmemaybe.js

var _ = require('underscore')

// do the universal module definition dance
(function (root, factory) {

  if (typeof exports === 'object') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    root.callmemaybe = factory();
  }

}(this, function() {

  function createProxy() {
    var proxy = {
      __queued_calls__: {}
    };
    proxy.fulfill = function(obj) {
      Object.keys(proxy.__queued_calls__).forEach(function(method) {
        var calls = proxy.__queued_calls__[method]
        while (calls.length) {
          obj[method].apply(obj, calls.shift())
        }
      })
    }
    return proxy
  }

  function findProperties(obj) {
    var props = [];
    for (var key in obj) {
      // only look back as far as the object's immediate prototype
      if (obj.hasOwnProperty(key) || Object.getPrototypeOf(obj).hasOwnProperty(key)) {
        props.push(key);
      }
    }
    return props;
  }

  function proxyFunctions(proxy, obj, properties) {
    properties.forEach(function(prop) {
      if (typeof(obj[prop]) === 'function') {
        console.log('adding property ' + prop);
        Object.defineProperty(proxy, prop, {
          get: function() {
            return function() {
              if ( ! proxy.__queued_calls__[prop]) {
                proxy.__queued_calls__[prop] = []
              }
              proxy.__queued_calls__[prop].push(arguments)
            }
          },
          enumerable: true
        })
      }
    })
  }

  // --------------------

  var Maybe = {};

  // Maybe.wrap
  // --------------------
  // Outputs the tree line-by-line, calling the lineCallback when each one is available.

  Maybe.wrap = function(obj, properties) {
    var objProps = findProperties(obj),
        proxy    = createProxy();

    properties   = properties || [];

    if (properties.length) {
      // selectively proxy the requested props
      properties = _.intersection(objProps, properties); // TODO
    } else {
      // proxy everything we found
      properties = objProps;
    }

    proxyFunctions(proxy, obj, properties);

    return proxy;
  };

  // --------------------

  return Maybe;

}));
