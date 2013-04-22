{_}     = require 'underscore'
vows    = require 'vows'
assert  = require 'assert'

maybe   = require '../index'

### Mocks ###

class StringJoiner
  constructor: (@str1, @str2) ->
  concat: (delimiter, callback) ->
    setTimeout =>
      callback null, "#{@str1}#{delimiter}#{@str2}"
    , 0
    return

### Helpers ###

testStringJoinWithInstanceFulfillment = (blueprint) ->
  topic: ->
    new class
      async: (arg1, arg2) ->
        setTimeout ->
          wrapper.fulfill new StringJoiner(arg1, arg2)
        , 0
        wrapper = maybe.wrap blueprint

  "returns a wrapper with a callable 'concat' method":
    topic: (instance) ->
      instance.async('hi', 'there').concat(' ', @callback)

    "and the callback is called with the result we expected": (joined) ->
      assert.equal joined, 'hi there'

testStringJoinWithNamedFulfillment = (blueprint) ->
  context = testStringJoinWithInstanceFulfillment(blueprint)
  _.extend context,
    topic: ->
      new class
        async: (arg1, arg2) ->
          (new StringJoiner(arg1, arg2)).concat ' ', ->
            wrapper.fulfill 'concat', arguments, @
          wrapper = maybe.wrap blueprint
  context

### Tests ###

vows
  .describe('Mediary')
  .addBatch(

    "StringJoiner.prototype (instance)": testStringJoinWithInstanceFulfillment (StringJoiner.prototype)
    "StringJoiner.prototype (named)":    testStringJoinWithNamedFulfillment    (StringJoiner.prototype)
    "StringJoiner (instance)":           testStringJoinWithInstanceFulfillment (StringJoiner)
    "StringJoiner (named)":              testStringJoinWithNamedFulfillment    (StringJoiner)


  ).export(module)
