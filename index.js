//     callmemaybe.js
//     Luke Plaster <notatestuser@gmail.com>
//     https://github.com/notatestuser/callmemaybe.js

// TODO: make this work outside of Node
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

  function createProxy(proto) {
    var proxy = {
      __queued_calls__: {}
    };
    proxy.fulfill = function(obj) {
      Object.keys(proxy.__queued_calls__).forEach(function(method) {
        var calls = proxy.__queued_calls__[method]
        while (calls.length) {
          proto[method].apply(obj, calls.shift())
        }
      })
    }
    return proxy
  }

  function findProperties(proto) {
    var props = [];
    for (var key in proto) {
      // only look back as far as the object's immediate prototype
      if (proto.hasOwnProperty(key) || Object.getPrototypeOf(proto).hasOwnProperty(key)) {
        props.push(key);
      }
    }
    return props;
  }

  function proxyFunctions(proxy, proto, properties) {
    properties.forEach(function(prop) {
      if (typeof(proto[prop]) === 'function') {
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
    var proto = obj,
        proxy;

    if (typeof obj === 'function') {
      proto = obj.prototype || Object.getPrototypeOf(obj);
      if ( ! proto) {
        throw 'Passed object is a function with no prototype; I need something wrappable!'
      }
    }

    properties = properties || []
    objProps   = findProperties(proto)
    proxy      = createProxy(proto)

    if (properties.length) {
      // selectively proxy the requested props
      properties = _.intersection(objProps, properties);
    } else {
      // proxy everything we found
      properties = objProps;
    }

    proxyFunctions(proxy, proto, properties);

    return proxy;
  };

  // --------------------

  return Maybe;

}));
