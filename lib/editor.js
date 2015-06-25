var element = require('base-element')
var inherits = require('inherits')

module.exports = Editor
inherits(Editor, element)

function Editor (appendTo) {
  if (!(this instanceof Editor)) return new Editor(appendTo)
  element.call(this, appendTo)
}

Editor.prototype.render = function (key, property) {
  var self = this
  var editor = this.html('div.editor', [
    this.html('h2', key),
    this.html('textarea', {
      value: property[key],
      oninput: function (e) {
        var value = e.target.value
        self.send('input', e, value)
      }
    })
  ])

  return this.afterRender(editor)
}