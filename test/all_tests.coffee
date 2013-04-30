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

class Greeting
  constructor: ->
    @greeting = 'hello'
  shout: ->
    setTimeout ->
      wrapper.fulfill new LoudGreeting(@greeting)
    , 0
    wrapper = maybe.wrap LoudGreeting
  describeMethods: ->
    shout: LoudGreeting

class LoudGreeting
  constructor: (greeting) ->
    @greeting = greeting.toUpperCase()
  exclaim: ->
    setTimeout ->
      wrapper.fulfill new ExclaimedGreeting(@greeting)
    , 0
    wrapper = maybe.wrap ExclaimedGreeting
  describeMethods: ->
    exclaim: ExclaimedGreeting

class ExclaimedGreeting
  constructor: (greeting) ->
    @greeting = "#{greeting}!"
  get: ->
    @greeting

### Helpers ###

testStringJoinWithInstanceFulfillment = (blueprint, props) ->
  topic: ->
    new class
      async: (arg1, arg2) ->
        setTimeout ->
          wrapper.fulfill new StringJoiner(arg1, arg2)
        , 0
        wrapper = maybe.wrap blueprint, props

  "returns a wrapper with a callable 'concat' method":
    topic: (instance) ->
      instance.async('hi', 'there').concat(' ', @callback)
      return

    "and the callback is called with the result we expected": (joined) ->
      assert.equal joined, 'hi there'

testStringJoinWithNamedFulfillment = (blueprint, props) ->
  context = testStringJoinWithInstanceFulfillment(blueprint, props)
  _.extend context,
    topic: ->
      new class
        async: (arg1, arg2) ->
          (new StringJoiner(arg1, arg2)).concat ' ', ->
            wrapper.fulfill 'concat', arguments, @
          wrapper = maybe.wrap blueprint, props
  context

### Tests ###

vows
  .describe('Mediary')
  .addBatch(

    "StringJoiner.prototype (instance)": testStringJoinWithInstanceFulfillment(StringJoiner.prototype, null)
    "StringJoiner.prototype (named)":    testStringJoinWithNamedFulfillment(StringJoiner.prototype, null)
    "StringJoiner (instance)":           testStringJoinWithInstanceFulfillment(StringJoiner, null)
    "StringJoiner (named)":              testStringJoinWithNamedFulfillment(StringJoiner, null)
    "StringJoiner (named), with args":   testStringJoinWithNamedFulfillment(StringJoiner, ['concat'])

    "A chain of callbacks":
      topic: ->
        new class
          greeting: ->
            new Greeting()

      "returns something we expect":
        topic: (instance) ->
          instance.greeting().shout().exclaim().get(@callback)
          return

        "and the callback is called with the result we expected": (joined) ->
          assert.equal joined, 'HELLO!'

  ).export(module)
