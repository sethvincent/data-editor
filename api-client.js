var request = require('request')
var qs = require('querystring')

module.exports = APIClient

function APIClient (opts) {
  if (!(this instanceof APIClient)) return new APIClient(opts)
  opts = opts || {}
  this.host = opts.host || window.location.href
}

APIClient.prototype.put = function (key, row, cb) {
  if (typeof key === 'object') {
    cb = row
    row = key
    key = row.key
  }
  return this.request('put', 'rows/' + key, row, cb)
}

APIClient.prototype.get = function (key, cb) {
  return this.request('get', 'rows/' + key, null, cb)
}

APIClient.prototype.list = function (opts, cb) {
  return this.request('get', 'rows', opts, cb)
}

APIClient.prototype.create = function (row, cb) {
  return this.request('post', 'rows', row, cb)
}

APIClient.prototype.update = function (row, cb) {
  return this.request('put', 'rows/' + row.key, row, cb)
}

APIClient.prototype.delete = function (key, cb) {
  return this.request('delete', 'rows/' + key, null, cb)
}

APIClient.prototype.bulkUpdate = function (opts, cb) {
  return this.request('put', 'rows', opts, cb)
}

APIClient.prototype.request = function (method, path, params, cb) {
  if (typeof params === 'function') {
    cb = params
    params = {}
  }

  var opts = {}

  if (method === 'get') {
    params = qs.stringify(params)
    opts.uri = this.fullUrl(path, params)
  }

  else {
    opts.uri = this.fullUrl(path)
    opts.body = params
  }

  opts.json = true
  opts.method = method
  
  if (typeof cb === 'undefined') return request(opts)
  else request(opts, getResponse)

  function getResponse (error, response, body) {
    console.log('got response', error, body)
    if (cb) {
      if (error) return cb(error)
      if (response.statusCode >= 400) return cb({ error: response.statusCode })
      return cb(null, body)
    }
  }  
}

APIClient.prototype.fullUrl = function fullUrl (path, params) {
  var url = this.host + path
  if (params) url += '?' + params
  return url
}