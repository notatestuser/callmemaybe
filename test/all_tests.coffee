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

testStringJoin = (blueprint) ->
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

### Tests ###

vows
  .describe('Mediary')
  .addBatch(

    "StringJoiner.prototype": testStringJoin(StringJoiner.prototype)
    "StringJoiner":           testStringJoin(StringJoiner)

  ).export(module)
