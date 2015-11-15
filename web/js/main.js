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
