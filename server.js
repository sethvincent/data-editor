#! /usr/bin/env node

var fs = require('fs')
var path = require('path')
var http = require('http')
var cuid = require('cuid')
var parseBody = require('body/json')
var JSONStream = require('JSONStream')
var response = require('response')
var cors = require('corsify')
var extend = require('extend')
var router = require('match-routes')()
var from = require('from2-array')
var through = require('through2')
var csvParser = require('csv-parser')
var formatData = require('format-data')
var st = require('st')

var csvName = process.argv[2]
var csvDir = path.join(__dirname, csvName)

var tmpDir = require('osenv').tmpdir()
var rootDir = path.join(tmpDir, '.data-editor')
var dbDir = path.join(rootDir, csvName)
require('mkdirp').sync(dbDir)

var db = require('level')(dbDir)
var dat = require('dat-core')(db, { valueEncoding: 'json' })

router.on('/rows', function (req, res, opts) {
  if (req.method === 'GET') {
    dat.createReadStream()
      .pipe(JSONStream.stringify())
      .pipe(res)
  }

  if (req.method === 'POST') {
    parseBody(req, function (err, body) {
      var key = cuid()
      dat.put(key, body, function (err) {
        dat.get(key, function (err, row) {
          response().json(row).pipe(res)
        })
      })
    })
  }

  if (req.method === 'PUT') {
    parseBody(req, function (err, body) {
      from.obj(body)
        .pipe(through.obj(function (data, enc, next) {
          dat.get(data.key, function (err, row) {
            if (row) body = extend(row, data)
            dat.put(body.key, body.value, function (err) {
              next()
            })
          })
        }, function () {
          response().json({message:'did it!'}).status(200).pipe(res)
        }))
    })
  }
})

router.on('/rows/:key', function (req, res, opts) {
  if (req.method === 'GET') {
    dat.get(opts.params.key, function (err, row) {
      response().json(row).pipe(res)
    })
  }

  if (req.method === 'PUT') {
    parseBody(req, function (err, body) {
      dat.get(opts.params.key, function (err, row) {
        if (row) body = extend(row, body)
        dat.put(body.key, body.value, function (err) {
          response().json(row).pipe(res)
        })
      })
    })
  }

  if (req.method === 'DELETE') {
    dat.del(opts.params.key, function () {
      response().status(204).pipe(res)
    })
  }
})

router.on('/csv', function (req, res, opts) {
  res.setHeader('Content-disposition', 'attachment; filename=edited-' + csvName);
  dat.createReadStream()
    .pipe(through.obj(function (data, enc, next) {
      if (data.content === 'row') {
        var row = data.value
        row.key = data.key
        this.push(row)
      }
      next()
    }))
    .pipe(formatData('csv'))
    .pipe(res)
})

var mount = st({ path: __dirname + '/assets', url: '/assets' })

var server = http.createServer(cors(function (req, res) {
  if (mount(req, res)) return
  if (router.match(req, res)) return
  fs.createReadStream(path.join(__dirname, 'index.html')).pipe(res)
}))

fs.createReadStream(csvDir)
  .pipe(csvParser())
  .pipe(through.obj(function (data, enc, next) {
    var key = data.key || cuid()
    dat.put(key, data, function () {
      next()
    })
  }, function () {
    server.listen(4455, function () {
      console.log('data-editor server listening on http://localhost:4455')
    })
  }))
