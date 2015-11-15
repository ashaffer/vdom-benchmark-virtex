(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var benchmark = require('vdom-benchmark-base');
var Virtex = require('virtex').default
var element = require('virtex').element
var redux = require('redux')
var dom = require('virtex-dom').default

var store = redux.applyMiddleware(dom(document))(redux.createStore)(() => {}, {})
var virtex = Virtex(store.dispatch)
var create = virtex.create
var update = virtex.update


var NAME = 'virtex';
var VERSION = '0.1.7';

function renderTree(nodes) {
  var children = [];
  var i;
  var n;

  for (i = 0; i < nodes.length; ++i) {
    n = nodes[i];
    if (n.children !== null) {
      children.push(element('div', {key: n.key}, renderTree(n.children)));
    } else {
      children.push(element('span', {key: n.key}, n.key));
    }
  }

  return children;
}

function BenchmarkImpl(container, a, b) {
  this.container = container;
  this.a = a;
  this.b = b;
  this._vRoot = null;
  this._root = null;
}

BenchmarkImpl.prototype.setUp = function() {
};

BenchmarkImpl.prototype.tearDown = function() {
  this.container.removeChild(this._root);
};

BenchmarkImpl.prototype.render = function() {
  this._vRoot = element('div', null, renderTree(this.a))
  this._root = create(this._vRoot);
  this.container.appendChild(this._root);
};

BenchmarkImpl.prototype.update = function() {
  var newVroot = element('div', null, renderTree(this.b))
  update(this._vRoot, newVroot)
};

document.addEventListener('DOMContentLoaded', function(e) {
  benchmark(NAME, VERSION, BenchmarkImpl);
}, false);

},{"redux":4,"vdom-benchmark-base":14,"virtex":41,"virtex-dom":18}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = createStore;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utilsIsPlainObject = require('./utils/isPlainObject');

var _utilsIsPlainObject2 = _interopRequireDefault(_utilsIsPlainObject);

/**
 * These are private action types reserved by Redux.
 * For any unknown actions, you must return the current state.
 * If the current state is undefined, you must return the initial state.
 * Do not reference these action types directly in your code.
 */
var ActionTypes = {
  INIT: '@@redux/INIT'
};

exports.ActionTypes = ActionTypes;
/**
 * Creates a Redux store that holds the state tree.
 * The only way to change the data in the store is to call `dispatch()` on it.
 *
 * There should only be a single store in your app. To specify how different
 * parts of the state tree respond to actions, you may combine several reducers
 * into a single reducer function by using `combineReducers`.
 *
 * @param {Function} reducer A function that returns the next state tree, given
 * the current state tree and the action to handle.
 *
 * @param {any} [initialState] The initial state. You may optionally specify it
 * to hydrate the state from the server in universal apps, or to restore a
 * previously serialized user session.
 * If you use `combineReducers` to produce the root reducer function, this must be
 * an object with the same shape as `combineReducers` keys.
 *
 * @returns {Store} A Redux store that lets you read the state, dispatch actions
 * and subscribe to changes.
 */

function createStore(reducer, initialState) {
  if (typeof reducer !== 'function') {
    throw new Error('Expected the reducer to be a function.');
  }

  var currentReducer = reducer;
  var currentState = initialState;
  var listeners = [];
  var isDispatching = false;

  /**
   * Reads the state tree managed by the store.
   *
   * @returns {any} The current state tree of your application.
   */
  function getState() {
    return currentState;
  }

  /**
   * Adds a change listener. It will be called any time an action is dispatched,
   * and some part of the state tree may potentially have changed. You may then
   * call `getState()` to read the current state tree inside the callback.
   *
   * @param {Function} listener A callback to be invoked on every dispatch.
   * @returns {Function} A function to remove this change listener.
   */
  function subscribe(listener) {
    listeners.push(listener);

    return function unsubscribe() {
      var index = listeners.indexOf(listener);
      listeners.splice(index, 1);
    };
  }

  /**
   * Dispatches an action. It is the only way to trigger a state change.
   *
   * The `reducer` function, used to create the store, will be called with the
   * current state tree and the given `action`. Its return value will
   * be considered the **next** state of the tree, and the change listeners
   * will be notified.
   *
   * The base implementation only supports plain object actions. If you want to
   * dispatch a Promise, an Observable, a thunk, or something else, you need to
   * wrap your store creating function into the corresponding middleware. For
   * example, see the documentation for the `redux-thunk` package. Even the
   * middleware will eventually dispatch plain object actions using this method.
   *
   * @param {Object} action A plain object representing “what changed”. It is
   * a good idea to keep actions serializable so you can record and replay user
   * sessions, or use the time travelling `redux-devtools`. An action must have
   * a `type` property which may not be `undefined`. It is a good idea to use
   * string constants for action types.
   *
   * @returns {Object} For convenience, the same action object you dispatched.
   *
   * Note that, if you use a custom middleware, it may wrap `dispatch()` to
   * return something else (for example, a Promise you can await).
   */
  function dispatch(action) {
    if (!_utilsIsPlainObject2['default'](action)) {
      throw new Error('Actions must be plain objects. ' + 'Use custom middleware for async actions.');
    }

    if (typeof action.type === 'undefined') {
      throw new Error('Actions may not have an undefined "type" property. ' + 'Have you misspelled a constant?');
    }

    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.');
    }

    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    listeners.slice().forEach(function (listener) {
      return listener();
    });
    return action;
  }

  /**
   * Replaces the reducer currently used by the store to calculate the state.
   *
   * You might need this if your app implements code splitting and you want to
   * load some of the reducers dynamically. You might also need this if you
   * implement a hot reloading mechanism for Redux.
   *
   * @param {Function} nextReducer The reducer for the store to use instead.
   * @returns {void}
   */
  function replaceReducer(nextReducer) {
    currentReducer = nextReducer;
    dispatch({ type: ActionTypes.INIT });
  }

  // When a store is created, an "INIT" action is dispatched so that every
  // reducer returns their initial state. This effectively populates
  // the initial state tree.
  dispatch({ type: ActionTypes.INIT });

  return {
    dispatch: dispatch,
    subscribe: subscribe,
    getState: getState,
    replaceReducer: replaceReducer
  };
}
},{"./utils/isPlainObject":9}],4:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _createStore = require('./createStore');

var _createStore2 = _interopRequireDefault(_createStore);

var _utilsCombineReducers = require('./utils/combineReducers');

var _utilsCombineReducers2 = _interopRequireDefault(_utilsCombineReducers);

var _utilsBindActionCreators = require('./utils/bindActionCreators');

var _utilsBindActionCreators2 = _interopRequireDefault(_utilsBindActionCreators);

var _utilsApplyMiddleware = require('./utils/applyMiddleware');

var _utilsApplyMiddleware2 = _interopRequireDefault(_utilsApplyMiddleware);

var _utilsCompose = require('./utils/compose');

var _utilsCompose2 = _interopRequireDefault(_utilsCompose);

exports.createStore = _createStore2['default'];
exports.combineReducers = _utilsCombineReducers2['default'];
exports.bindActionCreators = _utilsBindActionCreators2['default'];
exports.applyMiddleware = _utilsApplyMiddleware2['default'];
exports.compose = _utilsCompose2['default'];
},{"./createStore":3,"./utils/applyMiddleware":5,"./utils/bindActionCreators":6,"./utils/combineReducers":7,"./utils/compose":8}],5:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports['default'] = applyMiddleware;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _compose = require('./compose');

var _compose2 = _interopRequireDefault(_compose);

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * @returns {Function} A store enhancer applying the middleware.
 */

function applyMiddleware() {
  for (var _len = arguments.length, middlewares = Array(_len), _key = 0; _key < _len; _key++) {
    middlewares[_key] = arguments[_key];
  }

  return function (next) {
    return function (reducer, initialState) {
      var store = next(reducer, initialState);
      var _dispatch = store.dispatch;
      var chain = [];

      var middlewareAPI = {
        getState: store.getState,
        dispatch: function dispatch(action) {
          return _dispatch(action);
        }
      };
      chain = middlewares.map(function (middleware) {
        return middleware(middlewareAPI);
      });
      _dispatch = _compose2['default'].apply(undefined, chain)(store.dispatch);

      return _extends({}, store, {
        dispatch: _dispatch
      });
    };
  };
}

module.exports = exports['default'];
},{"./compose":8}],6:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = bindActionCreators;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utilsMapValues = require('../utils/mapValues');

var _utilsMapValues2 = _interopRequireDefault(_utilsMapValues);

function bindActionCreator(actionCreator, dispatch) {
  return function () {
    return dispatch(actionCreator.apply(undefined, arguments));
  };
}

/**
 * Turns an object whose values are action creators, into an object with the
 * same keys, but with every function wrapped into a `dispatch` call so they
 * may be invoked directly. This is just a convenience method, as you can call
 * `store.dispatch(MyActionCreators.doSomething())` yourself just fine.
 *
 * For convenience, you can also pass a single function as the first argument,
 * and get a function in return.
 *
 * @param {Function|Object} actionCreators An object whose values are action
 * creator functions. One handy way to obtain it is to use ES6 `import * as`
 * syntax. You may also pass a single function.
 *
 * @param {Function} dispatch The `dispatch` function available on your Redux
 * store.
 *
 * @returns {Function|Object} The object mimicking the original object, but with
 * every action creator wrapped into the `dispatch` call. If you passed a
 * function as `actionCreators`, the return value will also be a single
 * function.
 */

function bindActionCreators(actionCreators, dispatch) {
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch);
  }

  if (typeof actionCreators !== 'object' || actionCreators === null || actionCreators === undefined) {
    // eslint-disable-line no-eq-null
    throw new Error('bindActionCreators expected an object or a function, instead received ' + (actionCreators === null ? 'null' : typeof actionCreators) + '. ' + 'Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?');
  }

  return _utilsMapValues2['default'](actionCreators, function (actionCreator) {
    return bindActionCreator(actionCreator, dispatch);
  });
}

module.exports = exports['default'];
},{"../utils/mapValues":10}],7:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;
exports['default'] = combineReducers;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _createStore = require('../createStore');

var _utilsIsPlainObject = require('../utils/isPlainObject');

var _utilsIsPlainObject2 = _interopRequireDefault(_utilsIsPlainObject);

var _utilsMapValues = require('../utils/mapValues');

var _utilsMapValues2 = _interopRequireDefault(_utilsMapValues);

var _utilsPick = require('../utils/pick');

var _utilsPick2 = _interopRequireDefault(_utilsPick);

/* eslint-disable no-console */

function getUndefinedStateErrorMessage(key, action) {
  var actionType = action && action.type;
  var actionName = actionType && '"' + actionType.toString() + '"' || 'an action';

  return 'Reducer "' + key + '" returned undefined handling ' + actionName + '. ' + 'To ignore an action, you must explicitly return the previous state.';
}

function getUnexpectedStateKeyWarningMessage(inputState, outputState, action) {
  var reducerKeys = Object.keys(outputState);
  var argumentName = action && action.type === _createStore.ActionTypes.INIT ? 'initialState argument passed to createStore' : 'previous state received by the reducer';

  if (reducerKeys.length === 0) {
    return 'Store does not have a valid reducer. Make sure the argument passed ' + 'to combineReducers is an object whose values are reducers.';
  }

  if (!_utilsIsPlainObject2['default'](inputState)) {
    return 'The ' + argumentName + ' has unexpected type of "' + ({}).toString.call(inputState).match(/\s([a-z|A-Z]+)/)[1] + '". Expected argument to be an object with the following ' + ('keys: "' + reducerKeys.join('", "') + '"');
  }

  var unexpectedKeys = Object.keys(inputState).filter(function (key) {
    return reducerKeys.indexOf(key) < 0;
  });

  if (unexpectedKeys.length > 0) {
    return 'Unexpected ' + (unexpectedKeys.length > 1 ? 'keys' : 'key') + ' ' + ('"' + unexpectedKeys.join('", "') + '" found in ' + argumentName + '. ') + 'Expected to find one of the known reducer keys instead: ' + ('"' + reducerKeys.join('", "') + '". Unexpected keys will be ignored.');
  }
}

function assertReducerSanity(reducers) {
  Object.keys(reducers).forEach(function (key) {
    var reducer = reducers[key];
    var initialState = reducer(undefined, { type: _createStore.ActionTypes.INIT });

    if (typeof initialState === 'undefined') {
      throw new Error('Reducer "' + key + '" returned undefined during initialization. ' + 'If the state passed to the reducer is undefined, you must ' + 'explicitly return the initial state. The initial state may ' + 'not be undefined.');
    }

    var type = '@@redux/PROBE_UNKNOWN_ACTION_' + Math.random().toString(36).substring(7).split('').join('.');
    if (typeof reducer(undefined, { type: type }) === 'undefined') {
      throw new Error('Reducer "' + key + '" returned undefined when probed with a random type. ' + ('Don\'t try to handle ' + _createStore.ActionTypes.INIT + ' or other actions in "redux/*" ') + 'namespace. They are considered private. Instead, you must return the ' + 'current state for any unknown actions, unless it is undefined, ' + 'in which case you must return the initial state, regardless of the ' + 'action type. The initial state may not be undefined.');
    }
  });
}

/**
 * Turns an object whose values are different reducer functions, into a single
 * reducer function. It will call every child reducer, and gather their results
 * into a single state object, whose keys correspond to the keys of the passed
 * reducer functions.
 *
 * @param {Object} reducers An object whose values correspond to different
 * reducer functions that need to be combined into one. One handy way to obtain
 * it is to use ES6 `import * as reducers` syntax. The reducers may never return
 * undefined for any action. Instead, they should return their initial state
 * if the state passed to them was undefined, and the current state for any
 * unrecognized action.
 *
 * @returns {Function} A reducer function that invokes every reducer inside the
 * passed object, and builds a state object with the same shape.
 */

function combineReducers(reducers) {
  var finalReducers = _utilsPick2['default'](reducers, function (val) {
    return typeof val === 'function';
  });
  var sanityError;

  try {
    assertReducerSanity(finalReducers);
  } catch (e) {
    sanityError = e;
  }

  var defaultState = _utilsMapValues2['default'](finalReducers, function () {
    return undefined;
  });

  return function combination(state, action) {
    if (state === undefined) state = defaultState;

    if (sanityError) {
      throw sanityError;
    }

    var finalState = _utilsMapValues2['default'](finalReducers, function (reducer, key) {
      var newState = reducer(state[key], action);
      if (typeof newState === 'undefined') {
        var errorMessage = getUndefinedStateErrorMessage(key, action);
        throw new Error(errorMessage);
      }
      return newState;
    });

    if (process.env.NODE_ENV !== 'production') {
      var warningMessage = getUnexpectedStateKeyWarningMessage(state, finalState, action);
      if (warningMessage) {
        console.error(warningMessage);
      }
    }

    return finalState;
  };
}

module.exports = exports['default'];
}).call(this,require('_process'))

},{"../createStore":3,"../utils/isPlainObject":9,"../utils/mapValues":10,"../utils/pick":11,"_process":2}],8:[function(require,module,exports){
/**
 * Composes single-argument functions from right to left.
 *
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing functions from right to
 * left. For example, compose(f, g, h) is identical to arg => f(g(h(arg))).
 */
"use strict";

exports.__esModule = true;
exports["default"] = compose;

function compose() {
  for (var _len = arguments.length, funcs = Array(_len), _key = 0; _key < _len; _key++) {
    funcs[_key] = arguments[_key];
  }

  return function (arg) {
    return funcs.reduceRight(function (composed, f) {
      return f(composed);
    }, arg);
  };
}

module.exports = exports["default"];
},{}],9:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = isPlainObject;
var fnToString = function fnToString(fn) {
  return Function.prototype.toString.call(fn);
};

/**
 * @param {any} obj The object to inspect.
 * @returns {boolean} True if the argument appears to be a plain object.
 */

function isPlainObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  var proto = typeof obj.constructor === 'function' ? Object.getPrototypeOf(obj) : Object.prototype;

  if (proto === null) {
    return true;
  }

  var constructor = proto.constructor;

  return typeof constructor === 'function' && constructor instanceof constructor && fnToString(constructor) === fnToString(Object);
}

module.exports = exports['default'];
},{}],10:[function(require,module,exports){
/**
 * Applies a function to every key-value pair inside an object.
 *
 * @param {Object} obj The source object.
 * @param {Function} fn The mapper function that receives the value and the key.
 * @returns {Object} A new object that contains the mapped values for the keys.
 */
"use strict";

exports.__esModule = true;
exports["default"] = mapValues;

function mapValues(obj, fn) {
  return Object.keys(obj).reduce(function (result, key) {
    result[key] = fn(obj[key], key);
    return result;
  }, {});
}

module.exports = exports["default"];
},{}],11:[function(require,module,exports){
/**
 * Picks key-value pairs from an object where values satisfy a predicate.
 *
 * @param {Object} obj The object to pick from.
 * @param {Function} fn The predicate the values must satisfy to be copied.
 * @returns {Object} The object with the values that satisfied the predicate.
 */
"use strict";

exports.__esModule = true;
exports["default"] = pick;

function pick(obj, fn) {
  return Object.keys(obj).reduce(function (result, key) {
    if (fn(obj[key])) {
      result[key] = obj[key];
    }
    return result;
  }, {});
}

module.exports = exports["default"];
},{}],12:[function(require,module,exports){
'use strict';

var Executor = require('./executor');

function Benchmark() {
  this.running = false;
  this.impl = null;
  this.tests = null;
  this.reportCallback = null;
  this.enableTests = false;

  this.container = document.createElement('div');

  this._runButton = document.getElementById('RunButton');
  this._iterationsElement = document.getElementById('Iterations');
  this._reportElement = document.createElement('pre');

  document.body.appendChild(this.container);
  document.body.appendChild(this._reportElement);

  var self = this;

  this._runButton.addEventListener('click', function(e) {
    e.preventDefault();

    if (!self.running) {
      var iterations = parseInt(self._iterationsElement.value);
      if (iterations <= 0) {
        iterations = 10;
      }

      self.run(iterations);
    }
  }, false);

  this.ready(true);
}

Benchmark.prototype.ready = function(v) {
  if (v) {
    this._runButton.disabled = '';
  } else {
    this._runButton.disabled = 'true';
  }
};

Benchmark.prototype.run = function(iterations) {
  var self = this;
  this.running = true;
  this.ready(false);

  new Executor(self.impl, self.container, self.tests, 1, function() { // warmup
    new Executor(self.impl, self.container, self.tests, iterations, function(samples) {
      self._reportElement.textContent = JSON.stringify(samples, null, ' ');
      self.running = false;
      self.ready(true);
      if (self.reportCallback != null) {
        self.reportCallback(samples);
      }
    }, undefined, false).start();
  }, undefined, this.enableTests).start();
};

module.exports = Benchmark;

},{"./executor":13}],13:[function(require,module,exports){
'use strict';

function render(nodes) {
  var children = [];
  var j;
  var c;
  var i;
  var e;
  var n;

  for (i = 0; i < nodes.length; i++) {
    n = nodes[i];
    if (n.children !== null) {
      e = document.createElement('div');
      c = render(n.children);
      for (j = 0; j < c.length; j++) {
        e.appendChild(c[j]);
      }
      children.push(e);
    } else {
      e = document.createElement('span');
      e.textContent = n.key.toString();
      children.push(e);
    }
  }

  return children;
}

function testInnerHtml(testName, nodes, container) {
  var c = document.createElement('div');
  var e = document.createElement('div');
  var children = render(nodes);
  for (var i = 0; i < children.length; i++) {
    e.appendChild(children[i]);
  }
  c.appendChild(e);
  if (c.innerHTML !== container.innerHTML) {
    console.log('error in test: ' + testName);
    console.log('container.innerHTML:');
    console.log(container.innerHTML);
    console.log('should be:');
    console.log(c.innerHTML);
  }
}


function Executor(impl, container, tests, iterations, cb, iterCb, enableTests) {
  if (iterCb === void 0) iterCb = null;

  this.impl = impl;
  this.container = container;
  this.tests = tests;
  this.iterations = iterations;
  this.cb = cb;
  this.iterCb = iterCb;
  this.enableTests = enableTests;

  this._currentTest = 0;
  this._currentIter = 0;
  this._renderSamples = [];
  this._updateSamples = [];
  this._result = [];

  this._tasksCount = tests.length * iterations;

  this._iter = this.iter.bind(this);
}

Executor.prototype.start = function() {
  this._iter();
};

Executor.prototype.finished = function() {
  this.cb(this._result);
};

Executor.prototype.progress = function() {
  if (this._currentTest === 0 && this._currentIter === 0) {
    return 0;
  }

  var tests = this.tests;
  return (this._currentTest * tests.length + this._currentIter) / (tests.length * this.iterataions);
};

Executor.prototype.iter = function() {
  if (this.iterCb != null) {
    this.iterCb(this);
  }

  var tests = this.tests;

  if (this._currentTest < tests.length) {
    var test = tests[this._currentTest];

    if (this._currentIter < this.iterations) {
      var e, t;
      var renderTime, updateTime;

      e = new this.impl(this.container, test.data.a, test.data.b);
      e.setUp();

      t = window.performance.now();
      e.render();
      renderTime = window.performance.now() - t;

      if (this.enableTests) {
        testInnerHtml(test.name + 'render()', test.data.a, this.container);
      }

      t = window.performance.now();
      e.update();
      updateTime = window.performance.now() - t;

      if (this.enableTests) {
        testInnerHtml(test.name + 'update()', test.data.b, this.container);
      }

      e.tearDown();

      this._renderSamples.push(renderTime);
      this._updateSamples.push(updateTime);

      this._currentIter++;
    } else {
      this._result.push({
        name: test.name + ' ' + 'render()',
        data: this._renderSamples.slice(0)
      });

      this._result.push({
        name: test.name + ' ' + 'update()',
        data: this._updateSamples.slice(0)
      });

      this._currentTest++;

      this._currentIter = 0;
      this._renderSamples = [];
      this._updateSamples = [];
    }

    setTimeout(this._iter, 0);
  } else {
    this.finished();
  }
};

module.exports = Executor;

},{}],14:[function(require,module,exports){
'use strict';

var Benchmark = require('./benchmark');
var benchmark = new Benchmark();

function initFromScript(scriptUrl, impl) {
  var e = document.createElement('script');
  e.src = scriptUrl;

  e.onload = function() {
    benchmark.tests = window.generateBenchmarkData().units;
    benchmark.ready(true);
  };

  document.head.appendChild(e);
}

function initFromParentWindow(parent, name, version, id) {
  window.addEventListener('message', function(e) {
    var data = e.data;
    var type = data.type;

    if (type === 'tests') {
      benchmark.tests = data.data;
      benchmark.reportCallback = function(samples) {
        parent.postMessage({
          type: 'report',
          data: {
            name: name,
            version: version,
            samples: samples
          },
          id: id
        }, '*');
      };
      benchmark.ready(true);

      parent.postMessage({
        type: 'ready',
        data: null,
        id: id
      }, '*');
    } else if (type === 'run') {
      benchmark.run(data.data.iterations);
    }
  }, false);

  parent.postMessage({
    type: 'init',
    data: null,
    id: id
  }, '*');
}

function init(name, version, impl) {
  // Parse Query String.
  var qs = (function(a) {
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i) {
      var p=a[i].split('=', 2);
      if (p.length == 1) {
        b[p[0]] = "";
      } else {
        b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
      }
    }
    return b;
  })(window.location.search.substr(1).split('&'));

  if (qs['name'] !== void 0) {
    name = qs['name'];
  }

  if (qs['version'] !== void 0) {
    version = qs['version'];
  }

  var type = qs['type'];

  if (qs['test'] !== void 0) {
    benchmark.enableTests = true;
    console.log('tests enabled');
  }

  var id;
  if (type === 'iframe') {
    id = qs['id'];
    if (id === void 0) id = null;
    initFromParentWindow(window.parent, name, version, id);
  } else if (type === 'window') {
    if (window.opener != null) {
      id = qs['id'];
      if (id === void 0) id = null;
      initFromParentWindow(window.opener, name, version, id);
    } else {
      console.log('Failed to initialize: opener window is NULL');
    }
  } else {
    var testsUrl = qs['data']; // url to the script generating test data
    if (testsUrl !== void 0) {
      initFromScript(testsUrl);
    } else {
      console.log('Failed to initialize: cannot load tests data');
    }
  }

  benchmark.impl = impl;
}

// performance.now() polyfill
// https://gist.github.com/paulirish/5438650
// prepare base perf object
if (typeof window.performance === 'undefined') {
  window.performance = {};
}
if (!window.performance.now){
  var nowOffset = Date.now();
  if (performance.timing && performance.timing.navigationStart) {
    nowOffset = performance.timing.navigationStart;
  }
  window.performance.now = function now(){
    return Date.now() - nowOffset;
  };
}

module.exports = init;

},{"./benchmark":12}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Check if an element can have selectable text
 */

var selectable = /^text|search|password|tel|url$/;

function canSelectText(node) {
  return node.tagName === 'INPUT' && selectable.test(node.type);
}

/**
 * Exports
 */

exports.default = canSelectText;
},{}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _virtex = require('virtex');

var _forEach = require('./forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _svg = require('./svg');

var _svg2 = _interopRequireDefault(_svg);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Constants
 */

var setAttribute = _virtex.actions.setAttribute; /**
                                                  * Imports
                                                  */

var cache = {};

/**
 * Create a DOM element
 */

function createElement(doc, dispatch, _ref) {
  var tag = _ref.tag;
  var attrs = _ref.attrs;
  var children = _ref.children;

  if (typeof cache[tag] === 'undefined') {
    cache[tag] = _svg2.default.isElement(tag) ? doc.createElementNS(_svg2.default.namespace, tag) : doc.createElement(tag);
  }

  var node = cache[tag].cloneNode(false);

  if (attrs !== null) {
    for (var key in attrs) {
      var val = attrs[key];
      if (val !== null && val !== undefined) {
        dispatch(setAttribute(node, key, val));
      }
    }
  }

  for (var i = 0, len = children.length; i < len; ++i) {
    node.appendChild(children[i].el);
  }

  return node;
}

/**
 * Exports
 */

exports.default = createElement;
},{"./forEach":17,"./svg":22,"virtex":28}],17:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Fast forEach
 */

function forEach(obj, fn) {
  var keys = Object.keys(obj);

  for (var i = 0, len = keys.length; i < len; i++) {
    var key = keys[i];
    fn(obj[key], key);
  }
}

/**
 * Exports
 */

exports.default = forEach;
},{}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _virtex = require('virtex');

var _setAttribute = require('./setAttribute');

var _setAttribute2 = _interopRequireDefault(_setAttribute);

var _removeAttribute = require('./removeAttribute');

var _removeAttribute2 = _interopRequireDefault(_removeAttribute);

var _createElement = require('./createElement');

var _createElement2 = _interopRequireDefault(_createElement);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Vars
 */

/**
 * Imports
 */

var _actions$types = _virtex.actions.types;
var CREATE_TEXT_NODE = _actions$types.CREATE_TEXT_NODE;
var CREATE_ELEMENT = _actions$types.CREATE_ELEMENT;
var SET_ATTRIBUTE = _actions$types.SET_ATTRIBUTE;
var REMOVE_ATTRIBUTE = _actions$types.REMOVE_ATTRIBUTE;
var APPEND_CHILD = _actions$types.APPEND_CHILD;
var REPLACE_CHILD = _actions$types.REPLACE_CHILD;
var INSERT_BEFORE = _actions$types.INSERT_BEFORE;
var REMOVE_CHILD = _actions$types.REMOVE_CHILD;

/**
 * Virtex DOM effects driver
 */

function dom(doc) {
  return function (_ref) {
    var dispatch = _ref.dispatch;
    return function (next) {
      return function (action) {
        switch (action.type) {
          case CREATE_TEXT_NODE:
            return doc.createTextNode(action.text);
          case CREATE_ELEMENT:
            return (0, _createElement2.default)(doc, dispatch, action.vnode);
          case SET_ATTRIBUTE:
            return (0, _setAttribute2.default)(dispatch, action.node, action.name, action.value);
          case REMOVE_ATTRIBUTE:
            return (0, _removeAttribute2.default)(action.node, action.name);
          case APPEND_CHILD:
            return action.node.appendChild(action.oldChild);
          case REMOVE_CHILD:
            return action.node.removeChild(action.oldChild);
          case REPLACE_CHILD:
            return action.node.replaceChild(action.newChild, action.oldChild);
          case INSERT_BEFORE:
            return action.node.insertBefore(action.newChild, action.oldChild);
        }

        return next(action);
      };
    };
  };
}

/**
 * Exports
 */

exports.default = dom;
},{"./createElement":16,"./removeAttribute":19,"./setAttribute":20,"virtex":28}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _setValue = require('./setValue');

var _setValue2 = _interopRequireDefault(_setValue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Remove an attribute from an element
 */

function removeAttribute(node, name) {
  switch (name) {
    case 'checked':
    case 'disabled':
    case 'selected':
      node[name] = false;
      break;
    case 'innerHTML':
      node.innerHTML = '';
      break;
    case 'value':
      (0, _setValue2.default)(node, null);
      break;
    default:
      node.removeAttribute(name);
      break;
  }
}

/**
 * Exports
 */

/**
 * Imports
 */

exports.default = removeAttribute;
},{"./setValue":21}],20:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _virtex = require('virtex');

var _setValue = require('./setValue');

var _setValue2 = _interopRequireDefault(_setValue);

var _svg = require('./svg');

var _svg2 = _interopRequireDefault(_svg);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; } /**
                                                                                                                              * Imports
                                                                                                                              */

/**
 * Constants
 */

var removeAttribute = _virtex.actions.removeAttribute;

/**
 * Set an attribute on an element
 */

function setAttribute(dispatch, node, name, value) {
  if (typeof value === 'function') {
    value = value(node, name);
  }

  if (isValidAttr(value)) {
    switch (name) {
      case 'nodeValue':
      case 'checked':
      case 'disabled':
      case 'selected':
      case 'innerHTML':
        node[name] = value;
        break;
      case 'value':
        (0, _setValue2.default)(node, value);
        break;
      case _svg2.default.isAttribute(name):
        node.setAttributeNS(_svg2.default.namespace, name, value);
        break;
      default:
        node.setAttribute(name, value);
        break;
    }
  } else {
    dispatch(removeAttribute(node, name));
  }
}

function isValidAttr(val) {
  switch (typeof val === 'undefined' ? 'undefined' : _typeof(val)) {
    case 'string':
    case 'number':
      return true;
    case 'boolean':
      return val;
    default:
      return false;
  }
}

/**
 * Exports
 */

exports.default = setAttribute;
},{"./setValue":21,"./svg":22,"virtex":28}],21:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _canSelectText = require('./canSelectText');

var _canSelectText2 = _interopRequireDefault(_canSelectText);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Set an element's value
 */

function setValue(node, value) {
  if (node.ownerDocument.activeElement === node && (0, _canSelectText2.default)(node)) {
    var start = node.selectionStart;
    var end = node.selectionEnd;
    node.value = value;
    node.setSelectionRange(start, end);
  } else {
    node.value = value;
  }
}

/**
 * Exports
 */

/**
 * Imports
 */

exports.default = setValue;
},{"./canSelectText":15}],22:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _isSvgElement = require('is-svg-element');

var _isSvgAttribute = require('is-svg-attribute');

var _isSvgAttribute2 = _interopRequireDefault(_isSvgAttribute);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Constants
 */

/**
 * Imports
 */

var namespace = 'http://www.w3.org/2000/svg';

/**
 * Svg stuff
 */

exports.default = {
  isElement: _isSvgElement.isElement,
  isAttribute: _isSvgAttribute2.default,
  namespace: namespace
};
},{"is-svg-attribute":23,"is-svg-element":24}],23:[function(require,module,exports){
/**
 * Supported SVG attributes
 */

exports.attributes = {
  'cx': true,
  'cy': true,
  'd': true,
  'dx': true,
  'dy': true,
  'fill': true,
  'fillOpacity': true,
  'fontFamily': true,
  'fontSize': true,
  'fx': true,
  'fy': true,
  'gradientTransform': true,
  'gradientUnits': true,
  'markerEnd': true,
  'markerMid': true,
  'markerStart': true,
  'offset': true,
  'opacity': true,
  'patternContentUnits': true,
  'patternUnits': true,
  'points': true,
  'preserveAspectRatio': true,
  'r': true,
  'rx': true,
  'ry': true,
  'spreadMethod': true,
  'stopColor': true,
  'stopOpacity': true,
  'stroke': true,
  'strokeDasharray': true,
  'strokeLinecap': true,
  'strokeOpacity': true,
  'strokeWidth': true,
  'textAnchor': true,
  'transform': true,
  'version': true,
  'viewBox': true,
  'x1': true,
  'x2': true,
  'x': true,
  'y1': true,
  'y2': true,
  'y': true
}

/**
 * Are element's attributes SVG?
 *
 * @param {String} attr
 */

module.exports = function (attr) {
  return attr in exports.attributes
}

},{}],24:[function(require,module,exports){
/**
 * Supported SVG elements
 *
 * @type {Array}
 */

exports.elements = {
  'animate': true,
  'circle': true,
  'defs': true,
  'ellipse': true,
  'g': true,
  'line': true,
  'linearGradient': true,
  'mask': true,
  'path': true,
  'pattern': true,
  'polygon': true,
  'polyline': true,
  'radialGradient': true,
  'rect': true,
  'stop': true,
  'svg': true,
  'text': true,
  'tspan': true
}

/**
 * Is element's namespace SVG?
 *
 * @param {String} name
 */

exports.isElement = function (name) {
  return name in exports.elements
}

},{}],25:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Action types
 */

var CREATE_TEXT_NODE = 'CREATE_TEXT_NODE';
var CREATE_ELEMENT = 'CREATE_ELEMENT';
var SET_ATTRIBUTE = 'SET_ATTRIBUTE';
var REMOVE_ATTRIBUTE = 'REMOVE_ATTRIBUTE';
var APPEND_CHILD = 'APPEND_CHILD';
var REMOVE_CHILD = 'REMOVE_CHILD';
var REPLACE_CHILD = 'REPLACE_CHILD';
var INSERT_BEFORE = 'INSERT_BEFORE';
var CREATE_THUNK = 'CREATE_THUNK';
var UPDATE_THUNK = 'UPDATE_THUNK';
var DESTROY_THUNK = 'DESTROY_THUNK';

/**
 * Action creators for effectful things
 */

function createTextNode(text) {
  return {
    type: CREATE_TEXT_NODE,
    text: text
  };
}

function createElement(vnode) {
  return {
    type: CREATE_ELEMENT,
    vnode: vnode
  };
}

function setAttribute(node, name, value) {
  return {
    type: SET_ATTRIBUTE,
    node: node,
    name: name,
    value: value
  };
}

function removeAttribute(node, name) {
  return {
    type: REMOVE_ATTRIBUTE,
    node: node,
    name: name,
    value: null
  };
}

function appendChild(node, newChild) {
  return {
    type: APPEND_CHILD,
    node: node,
    oldChild: null,
    newChild: newChild
  };
}

function replaceChild(node, newChild, oldChild) {
  return {
    type: REPLACE_CHILD,
    node: node,
    oldChild: oldChild,
    newChild: newChild
  };
}

function removeChild(node, oldChild) {
  return {
    type: REMOVE_CHILD,
    node: node,
    oldChild: oldChild,
    // Set newChild to null to try to ensure that as many of these actions
    // have the same object shape as possible, which should allow v8
    // to optimize them a bit better
    newChild: null
  };
}

function insertBefore(node, newChild, oldChild) {
  return {
    type: INSERT_BEFORE,
    node: node,
    oldChild: oldChild,
    newChild: newChild
  };
}

function createThunk(thunk) {
  return {
    type: CREATE_THUNK,
    thunk: thunk
  };
}

function updateThunk(thunk, prev) {
  return {
    type: UPDATE_THUNK,
    thunk: thunk,
    prev: prev
  };
}

function destroyThunk(thunk) {
  return {
    type: DESTROY_THUNK,
    thunk: thunk
  };
}

/**
 * Exports
 */

var types = {
  CREATE_TEXT_NODE: CREATE_TEXT_NODE,
  CREATE_ELEMENT: CREATE_ELEMENT,
  SET_ATTRIBUTE: SET_ATTRIBUTE,
  REMOVE_ATTRIBUTE: REMOVE_ATTRIBUTE,
  APPEND_CHILD: APPEND_CHILD,
  REPLACE_CHILD: REPLACE_CHILD,
  REMOVE_CHILD: REMOVE_CHILD,
  INSERT_BEFORE: INSERT_BEFORE,
  CREATE_THUNK: CREATE_THUNK,
  UPDATE_THUNK: UPDATE_THUNK,
  DESTROY_THUNK: DESTROY_THUNK
};

exports.createTextNode = createTextNode;
exports.createElement = createElement;
exports.setAttribute = setAttribute;
exports.removeAttribute = removeAttribute;
exports.appendChild = appendChild;
exports.replaceChild = replaceChild;
exports.removeChild = removeChild;
exports.insertBefore = insertBefore;
exports.createThunk = createThunk;
exports.updateThunk = updateThunk;
exports.destroyThunk = destroyThunk;
exports.types = types;
},{}],26:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _isThunk = require('./util/isThunk');

var _isThunk2 = _interopRequireDefault(_isThunk);

var _isText = require('./util/isText');

var _isText2 = _interopRequireDefault(_isText);

var _actions = require('./actions');

var actions = _interopRequireWildcard(_actions);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Create the initial document fragment
 */

function create(effect) {
  // Destructure here so that babel doesn't keep referencing these functions on 'actions'
  // which is slightly slower
  var createElement = actions.createElement;
  var createTextNode = actions.createTextNode;
  var createThunk = actions.createThunk;

  return function (vnode) {
    var path = arguments.length <= 1 || arguments[1] === undefined ? '0' : arguments[1];
    var idx = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];
    return createRecursive(vnode, path, idx);
  };

  function createRecursive(vnode, path, idx) {
    while ((0, _isThunk2.default)(vnode)) {
      vnode.model.path = path = path + '.' + idx;
      vnode = effect(createThunk(vnode));
    }

    if ((0, _isText2.default)(vnode)) {
      return vnode.el = effect(createTextNode(vnode.text));
    } else {
      var vchildren = vnode.children;

      for (var i = 0, len = vchildren.length; i < len; ++i) {
        var child = vchildren[i];
        child.el = createRecursive(child, path, i);
      }

      return vnode.el = effect(createElement(vnode));
    }
  }
}

/**
 * Exports
 */

/**
 * Imports
 */

exports.default = create;
},{"./actions":25,"./util/isText":31,"./util/isThunk":32}],27:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _thunkify = require('./util/thunkify');

var _thunkify2 = _interopRequireDefault(_thunkify);

var _textify = require('./util/textify');

var _textify2 = _interopRequireDefault(_textify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; } /**
                                                                                                                              * Imports
                                                                                                                              */

/**
 * Vnode creator
 */

function element(tag, attrs) {
  var len = arguments.length;
  var children = [];

  for (var i = 2, j = 0; i < len; ++i) {
    j += filterFlatten(arguments[i], children, j);
  }

  var key = undefined;
  if (attrs !== null && typeof attrs.key !== 'undefined') {
    key = attrs.key;
    if (Object.keys(attrs).length === 1) {
      attrs = null;
    } else {
      attrs.key = null;
    }
  }

  if (typeof tag !== 'string') {
    return (0, _thunkify2.default)(tag, attrs, children, key);
  }

  return {
    key: key,
    tag: tag,
    attrs: attrs,
    children: children,
    el: null
  };
}

/**
 * Very fast in-place, single-pass filter/flatten
 * algorithm
 */

function filterFlatten(item, arr, arrStart) {
  var added = 0;

  switch (type(item)) {
    case 'array':
      var len = item.length;
      for (var i = 0; i < len; ++i) {
        added += filterFlatten(item[i], arr, arrStart + added);
      }
      return added;
    case 'null':
    case 'undefined':
      return 0;
    case 'string':
    case 'number':
      arr[arrStart] = (0, _textify2.default)(item);
      break;
    default:
      arr[arrStart] = item;
      break;
  }

  return 1;
}

function type(val) {
  if (Array.isArray(val)) return 'array';
  if (val === null) return 'null';
  return typeof val === 'undefined' ? 'undefined' : _typeof(val);
}

/**
 * Exports
 */

exports.default = element;
},{"./util/textify":33,"./util/thunkify":34}],28:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.actions = exports.element = undefined;

var _actions = require('./actions');

var actions = _interopRequireWildcard(_actions);

var _update = require('./update');

var _update2 = _interopRequireDefault(_update);

var _create = require('./create');

var _create2 = _interopRequireDefault(_create);

var _element = require('./element');

var _element2 = _interopRequireDefault(_element);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * Virtex
 */

/**
 * Imports
 */

function virtex(effect) {
  return {
    create: (0, _create2.default)(effect),
    update: (0, _update2.default)(effect)
  };
}

/**
 * Exports
 */

exports.default = virtex;
exports.element = _element2.default;
exports.actions = actions;
},{"./actions":25,"./create":26,"./element":27,"./update":29}],29:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _isThunk = require('./util/isThunk');

var _isThunk2 = _interopRequireDefault(_isThunk);

var _isSameThunk = require('./util/isSameThunk');

var _isSameThunk2 = _interopRequireDefault(_isSameThunk);

var _isText = require('./util/isText');

var _isText2 = _interopRequireDefault(_isText);

var _foreach = require('foreach');

var _foreach2 = _interopRequireDefault(_foreach);

var _actions = require('./actions');

var actions = _interopRequireWildcard(_actions);

var _create2 = require('./create');

var _create3 = _interopRequireDefault(_create2);

var _dift = require('dift');

var ops = _interopRequireWildcard(_dift);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Diff and render two vnode trees
 */

function update(effect) {
  var create = (0, _create3.default)(effect);
  // It'd be cleaner to compose these guys with effect, but that seems to waste precious milliseconds in our
  // vdom-benchmark (inside the composed function) - so we call effect(action()) each time.
  var setAttribute = actions.setAttribute;
  var removeAttribute = actions.removeAttribute;
  var replaceChild = actions.replaceChild;
  var removeChild = actions.removeChild;
  var insertBefore = actions.insertBefore;
  var createThunk = actions.createThunk;
  var updateThunk = actions.updateThunk;
  var destroyThunk = actions.destroyThunk;
  var CREATE = ops.CREATE;
  var MOVE = ops.MOVE;
  var REMOVE = ops.REMOVE;
  var UPDATE = ops.UPDATE;

  return function (prev, next) {
    return updateRecursive(prev, next, '0', 0);
  };

  function updateRecursive(prev, next, path, idx) {

    /**
     * Render thunks if necessary
     */

    if ((0, _isThunk2.default)(prev)) {
      if ((0, _isThunk2.default)(next)) {
        next.model.path = path = path + '.' + idx;

        if (!(0, _isSameThunk2.default)(prev, next)) {
          // Both thunks, but not of the same variety
          effect(destroyThunk(prev));
          return updateRecursive(prev, effect(createThunk(next)), path, 0);
        } else {
          // Both thunks, same variety
          next = effect(updateThunk(next, prev));
          prev = prev.vnode;

          if (next === prev) {
            return next.el = prev.el;
          } else {
            return updateRecursive(prev, next, path, 0);
          }
        }
      } else {
        // Was a thunk, but is now not
        effect(destroyThunk(prev));
        return updateRecursive(prev.vnode, next, path, 0);
      }
    } else if ((0, _isThunk2.default)(next)) {
      // Wasn't a thunk, but now is
      next.model.path = path + '.' + idx;
      return updateRecursive(prev, effect(createThunk(next)), next.model.path, 0);
    }

    /**
     * Diff the element type
     */

    var node = next.el = prev.el;

    if ((0, _isText2.default)(prev)) {
      if ((0, _isText2.default)(next)) {
        if (prev.text !== next.text) {
          effect(setAttribute(node, 'nodeValue', next.text));
        }

        return node;
      } else {
        var newNode = next.el = create(next);
        effect(replaceChild(node.parentNode, newNode, node));
        return newNode;
      }
    } else if ((0, _isText2.default)(next) || prev.tag !== next.tag) {
      var newNode = next.el = create(next);
      unrenderChildren(prev);
      effect(replaceChild(node.parentNode, newNode, node));
      return newNode;
    }

    /**
     * Diff attributes
     */

    var pattrs = prev.attrs;
    var nattrs = next.attrs;

    if (pattrs !== null) {
      (0, _foreach2.default)(pattrs, function (val, key) {
        if (!nattrs || !(key in nattrs)) {
          effect(removeAttribute(node, key));
        }
      });
    }

    if (nattrs !== null) {
      (0, _foreach2.default)(nattrs, function (val, key) {
        if (!pattrs || !(key in pattrs) || val !== pattrs[key]) {
          effect(setAttribute(node, key, val));
        }
      });
    }

    /**
     * Diff children
     */

    (0, ops.default)(prev.children, next.children, diffChild(node, path), key);

    return node;
  }

  function diffChild(node, path) {
    return function (type, pItem, nItem, pos) {
      switch (type) {
        case UPDATE:
          return updateRecursive(pItem, nItem, path, pos);
        case CREATE:
          return effect(insertBefore(node, create(nItem, path, pos), node.childNodes[pos] || null));
        case MOVE:
          return effect(insertBefore(node, updateRecursive(pItem, nItem, path, pos), node.childNodes[pos] || null));
        case REMOVE:
          unrenderThunks(pItem);
          return effect(removeChild(node, nativeElement(pItem)));
      }
    };
  }

  function key(vnode) {
    return vnode.key;
  }

  function nativeElement(vnode) {
    while (vnode.vnode) vnode = vnode.vnode;
    return vnode.el;
  }

  function unrenderThunks(vnode) {
    if ((0, _isThunk2.default)(vnode)) {
      effect(destroyThunk(vnode));
      vnode = vnode.vnode;
    }

    unrenderChildren(vnode);
  }

  function unrenderChildren(vnode) {
    var children = vnode.children;

    if (children) {
      for (var i = 0, len = children.length; i < len; ++i) {
        unrenderThunks(children[i]);
      }
    }
  }
}

/**
 * Exports
 */

/**
 * Imports
 */

exports.default = update;
},{"./actions":25,"./create":26,"./util/isSameThunk":30,"./util/isText":31,"./util/isThunk":32,"dift":35,"foreach":37}],30:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Check if two thunks are of the same type
 */

function isSameThunk(prev, next) {
  return prev.component === next.component;
}

/**
 * Exports
 */

exports.default = isSameThunk;
},{}],31:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Check if a node is a text node
 */

function isText(vnode) {
  return vnode.type === 'text';
}

/**
 * Exports
 */

exports.default = isText;
},{}],32:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Check if something is a thunk
 */

function isThunk(vnode) {
  return vnode.type === 'thunk';
}

/**
 * Exports
 */

exports.default = isThunk;
},{}],33:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Turn a string into a text vnode
 */

function textify(text) {
  return {
    type: 'text',
    text: text
  };
}

/**
 * Exports
 */

exports.default = textify;
},{}],34:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Thunkify
 */

function thunkify(component, props, children, key) {
  props = props || {};

  return {
    type: 'thunk',
    children: children,
    component: component,
    key: key,
    model: {
      props: props,
      children: children,
      key: key
    }
  };
}

/**
 * Exports
 */

exports.default = thunkify;
},{}],35:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.REMOVE = exports.MOVE = exports.UPDATE = exports.CREATE = undefined;

var _bitVector = require('bit-vector');

/**
 * Actions
 */

var CREATE = 0; /**
                 * Imports
                 */

var UPDATE = 1;
var MOVE = 2;
var REMOVE = 3;

/**
 * dift
 */

function dift(prev, next, effect, key) {
  var pStartIdx = 0;
  var nStartIdx = 0;
  var pEndIdx = prev.length - 1;
  var nEndIdx = next.length - 1;
  var pStartItem = prev[pStartIdx];
  var nStartItem = next[nStartIdx];

  // List head is the same
  while (pStartIdx <= pEndIdx && nStartIdx <= nEndIdx && equal(pStartItem, nStartItem)) {
    effect(UPDATE, pStartItem, nStartItem, nStartIdx);
    pStartItem = prev[++pStartIdx];
    nStartItem = next[++nStartIdx];
  }

  // The above case is orders of magnitude more common than the others, so fast-path it
  if (nStartIdx > nEndIdx && pStartIdx > pEndIdx) {
    return;
  }

  var pEndItem = prev[pEndIdx];
  var nEndItem = next[nEndIdx];
  var movedFromFront = 0;

  // Reversed
  while (pStartIdx <= pEndIdx && nStartIdx <= nEndIdx && equal(pStartItem, nEndItem)) {
    effect(MOVE, pStartItem, nEndItem, pEndIdx - movedFromFront + 1);
    pStartItem = prev[++pStartIdx];
    nEndItem = next[--nEndIdx];
    ++movedFromFront;
  }

  // Reversed the other way (in case of e.g. reverse and append)
  while (pEndIdx >= pStartIdx && nStartIdx <= nEndIdx && equal(nStartItem, pEndItem)) {
    effect(MOVE, pEndItem, nStartItem, nStartIdx);
    pEndItem = prev[--pEndIdx];
    nStartItem = next[++nStartIdx];
    --movedFromFront;
  }

  // List tail is the same
  while (pEndIdx >= pStartIdx && nEndIdx >= nStartIdx && equal(pEndItem, nEndItem)) {
    effect(UPDATE, pEndItem, nEndItem, nEndIdx);
    pEndItem = prev[--pEndIdx];
    nEndItem = next[--nEndIdx];
  }

  if (pStartIdx > pEndIdx) {
    while (nStartIdx <= nEndIdx) {
      effect(CREATE, null, nStartItem, nStartIdx);
      nStartItem = next[++nStartIdx];
    }

    return;
  }

  if (nStartIdx > nEndIdx) {
    while (pStartIdx <= pEndIdx) {
      effect(REMOVE, pStartItem);
      pStartItem = prev[++pStartIdx];
    }

    return;
  }

  var created = 0;
  var pivotDest = null;
  var pivotIdx = pStartIdx - movedFromFront;
  var keepBase = pStartIdx;
  var keep = (0, _bitVector.createBv)(pEndIdx - pStartIdx);

  var prevMap = keyMap(prev, pStartIdx, pEndIdx + 1, key);

  for (; nStartIdx <= nEndIdx; nStartItem = next[++nStartIdx]) {
    var oldIdx = prevMap[key(nStartItem)];

    if (isUndefined(oldIdx)) {
      effect(CREATE, null, nStartItem, pivotIdx++);
      ++created;
    } else if (pStartIdx !== oldIdx) {
      (0, _bitVector.setBit)(keep, oldIdx - keepBase);
      effect(MOVE, prev[oldIdx], nStartItem, pivotIdx++);
    } else {
      pivotDest = nStartIdx;
    }
  }

  if (pivotDest !== null) {
    (0, _bitVector.setBit)(keep, 0);
    effect(MOVE, prev[pStartIdx], next[pivotDest], pivotDest);
  }

  // If there are no creations, then you have to
  // remove exactly max(prevLen - nextLen, 0) elements in this
  // diff. You have to remove one more for each element
  // that was created. This means once we have
  // removed that many, we can stop.
  var necessaryRemovals = prev.length - next.length + created;
  for (var removals = 0; removals < necessaryRemovals; pStartItem = prev[++pStartIdx]) {
    if (!(0, _bitVector.getBit)(keep, pStartIdx - keepBase)) {
      effect(REMOVE, pStartItem);
      ++removals;
    }
  }

  function equal(a, b) {
    return key(a) === key(b);
  }
}

function isUndefined(val) {
  return typeof val === 'undefined';
}

function keyMap(items, start, end, key) {
  var map = {};

  for (var i = start; i < end; ++i) {
    map[key(items[i])] = i;
  }

  return map;
}

/**
 * Exports
 */

exports.default = dift;
exports.CREATE = CREATE;
exports.UPDATE = UPDATE;
exports.MOVE = MOVE;
exports.REMOVE = REMOVE;
},{"bit-vector":36}],36:[function(require,module,exports){
/**
 * Use typed arrays if we can
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var FastArray = typeof Uint32Array === 'undefined' ? Array : Uint32Array;

/**
 * Bit vector
 */

function createBv(sizeInBits) {
  return new FastArray(Math.ceil(sizeInBits / 32));
}

function setBit(v, idx) {
  var r = idx % 32;
  var pos = (idx - r) / 32;

  v[pos] |= 1 << r;
}

function getBit(v, idx) {
  var r = idx % 32;
  var pos = (idx - r) / 32;

  return !!(v[pos] & 1 << r);
}

function bitRank(v, idx) {
  var r = idx % 32;
  var pos = (idx - r) / 32;

  for (var i = 0; i < pos; ++i) {
    numBitsSet(v[i]);
  }
}

function numBitsSet(n) {
  n = n - (n >> 1 & 0x55555555);
  n = (n & 0x33333333) + (n >> 2 & 0x33333333);
  return (n + (n >> 4) & 0xF0F0F0F) * 0x1010101 >> 24;
}

/**
 * Exports
 */

exports['default'] = {
  bitRank: bitRank,
  createBv: createBv,
  setBit: setBit,
  getBit: getBit
};
module.exports = exports['default'];
},{}],37:[function(require,module,exports){
/**
 * forEach
 */

function forEach (obj, fn, ctx) {
  if (!obj) return

  var keys = Object.keys(obj)

  for (var i = 0, len = keys.length; i < len; ++i) {
    var key = keys[i]
    fn.call(ctx, obj[key], key)
  }
}

/**
 * Exports
 */

module.exports = forEach

},{}],38:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"dup":25}],39:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"./actions":38,"./util/isText":44,"./util/isThunk":45,"dup":26}],40:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"./util/textify":46,"./util/thunkify":47,"dup":27}],41:[function(require,module,exports){
arguments[4][28][0].apply(exports,arguments)
},{"./actions":38,"./create":39,"./element":40,"./update":42,"dup":28}],42:[function(require,module,exports){
arguments[4][29][0].apply(exports,arguments)
},{"./actions":38,"./create":39,"./util/isSameThunk":43,"./util/isText":44,"./util/isThunk":45,"dift":48,"dup":29,"foreach":50}],43:[function(require,module,exports){
arguments[4][30][0].apply(exports,arguments)
},{"dup":30}],44:[function(require,module,exports){
arguments[4][31][0].apply(exports,arguments)
},{"dup":31}],45:[function(require,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"dup":32}],46:[function(require,module,exports){
arguments[4][33][0].apply(exports,arguments)
},{"dup":33}],47:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],48:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"bit-vector":49,"dup":35}],49:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"dup":36}],50:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"dup":37}]},{},[1])


//# sourceMappingURL=main.js.map
