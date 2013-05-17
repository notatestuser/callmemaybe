//     callmemaybe.js
//     Luke Plaster <notatestuser@gmail.com>
//     https://github.com/notatestuser/callmemaybe.js

// TODO: make this work outside of Node
require('./utils/array').extend();

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

  var Maybe = {};

  // --------------------

  function createProxy(proto) {
    var proxy = {
      __proxy__: true,
      __queued_calls__: {}
    };
    proxy.fulfill = function(obj, args, ctx) {
      Object.keys(proxy.__queued_calls__).forEach(function(method) {
        var calls = proxy.__queued_calls__[method] || []
          , callArgs
          , callbackFn;
        while (calls.length) {
          callArgs = calls.shift()
          if (callArgs.__proxy__) {
            console.log('  chained fulfillment');
            // chained fulfillment - assume callArgs is a proxy
            // .. perform the next call
            callArgs.push(function(err, result) {
              // TODO error handling
              callArgs.fulfill(method, result)
            })
            proto[method].apply(obj, callArgs)
          } else {
            console.log('  unchained fulfillment');
            // unchained fulfillment
            if (typeof obj === 'string') {
              console.log('  named fulfillment');
              // named fulfillment: assume a callback was passed as the last param
              callbackFn = callArgs[callArgs.length - 1]
              callbackFn.apply(ctx || this, args || [])
            } else {
              console.log('  instance fulfillment');
              // instance fulfillment: make the call ourselves (callback may be anywhere)
              proto[method].apply(obj, callArgs)
            }
          }
        }
        return this;
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

  function proxyFunctions(proxy, obj, proto, properties) {
    properties.forEach(function(prop) {
      if (typeof(proto[prop]) === 'function') {
        Object.defineProperty(proxy, prop, {
          get: function() {
            return function() {
              if ( ! proxy.__queued_calls__[prop]) {
                proxy.__queued_calls__[prop] = []
              }
              // if the last parameter was a callback, we're not chaining
              if (typeof arguments[arguments.length - 1] === 'function') {
                console.log('action: queue call');
                // just push the array of call arguments into __queued_calls__
                proxy.__queued_calls__[prop].push(arguments);
                return null;
              } else {
                console.log('action: chaining mode');
                // initiate chaining mode
                // at this point, the call on our proxied property is going to have to be queued
                // for fulfillment at a later point in time, so let's do that
                if ( ! proto.describeMethods) {
                  throw Error(prop+"(): We couldn't find a describeMethods() method on the chained prototype to proxy")
                }
                nextProxy = Maybe.wrap((proto.describeMethods.apply(obj))[prop], null, arguments);
                proxy.__queued_calls__[prop].push(nextProxy);
                return nextProxy;
              }
            }
          },
          enumerable: true
        })
      }
    })
  }

  // --------------------

  // Maybe.wrap
  // --------------------
  // Outputs the tree line-by-line, calling the lineCallback when each one is available.

  Maybe.wrap = function(obj, properties, args) {
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
    proxy      = createProxy   (proto, args)

    if (properties.length) {
      // selectively proxy the requested props
      properties = objProps.intersect(properties);
    } else {
      // proxy everything we found
      properties = objProps;
    }

    proxyFunctions(proxy, obj, proto, properties);

    return proxy;
  };

  // --------------------

  return Maybe;

}));
