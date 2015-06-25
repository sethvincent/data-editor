var element = require('base-element')
var inherits = require('inherits')

module.exports = GridHeader
inherits(GridHeader, element)

function GridHeader (appendTo) {
  if (!(this instanceof GridHeader)) return new GridHeader(appendTo)
  element.call(this, appendTo)
}

GridHeader.prototype.render = function (headers) {
  var self = this
  var items = []
  
  headers.forEach(function (header) {
    items.push(self.html('li.grid-header-item.data-grid-property', [
      self.html('span.spacer', header)
    ]))
  })

  var vtree = this.html('ul.grid-header-list.data-grid-properties', items)
  return this.afterRender(vtree)
}