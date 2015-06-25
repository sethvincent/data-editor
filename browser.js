var through = require('through2')
var debounce = require('lodash.debounce')
var on = require('dom-event')
var cuid = require('cuid')
var createElement = require('base-element')
var extend = require('extend')
var popup = require('popupjs')

var client = require('./api-client')()

var gridEl = document.getElementById('grid')
var dataGrid = require('data-grid')({
  appendTo: gridEl,
  height: 600
})
var expandEditor = require('./lib/editor')
var gridHeader = require('./lib/grid-header')(document.getElementById('grid-header'))
var headers = []

dataGrid.on('input', function (e, property, row) {
  client.put(row.key, row, function (err, res) {
    console.log(err, res)
  })
})

dataGrid.on('expand', function (e, el, property, row, key) {
  e.preventDefault()

  var modal = popup({
    id: 'editor',
    content: '',
    buttons: [{
      text: 'done',
      className: 'done',
    }]
  })

  modal.on('show', function () {
    editor = expandEditor(document.querySelector('.popupjs-content'))
    editor.addEventListener('input', function (e, value) {
      row.value[key] = value
      render(all)
      client.put(row.key, row, function (err, res) {
        console.log(err, res)
      })
    })
    editor.render(key, property)
  })

  modal.show()
})

var render = debounce(dataGrid.render.bind(dataGrid), 10)

var all = []
var model = through.obj(function (chunk, enc, cb) {
  this.push(chunk)
  cb()
})

model.on('data', function (data) {
  all.push(data)
  render(all)
})

client.list(function (err, res) {
  headers = Object.keys(res[0].value)
  gridHeader.render(headers)

  res.forEach(function (item) {
    headers.forEach(function (header) {
      if (!item[header]) item[header] = ''
    })
    model.write(item)
  })

  document.querySelector('.loader').style.display = 'none'
})

on(document.getElementById('new-row'), 'click', function (e) {
  var row = {}
  headers.forEach(function (header) {
    row[header] = null
  })
  model.write({ key: cuid(), value: row })
})

on(document.getElementById('new-column'), 'click', function (e) {
  var name = window.prompt('new column')
  headers.push(name)
  gridHeader.render(headers)
  all.forEach(function (item) {
    item.value[name] = null
  })
  render(all)
  client.bulkUpdate(all, function (err, res) {
    console.log(err, res)
  })
})