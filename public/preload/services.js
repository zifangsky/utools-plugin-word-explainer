const fs = require('node:fs')
const path = require('node:path')
const https = require('node:https')
const http = require('node:http')

// 通过 window 对象向渲染进程注入 nodejs 能力
// NOTE: preload 运行于 uTools 主进程 (CommonJS)，使用分号为 CJS 惯例；
// src/ 运行于 webview (ESM)，使用无分号风格。两者不可相互导入，需手动保持语义同步。
window.services = {
  // 读文件
  readFile (file) {
    return fs.readFileSync(file, { encoding: 'utf-8' })
  },
  // 文本写入到下载目录
  writeTextFile (text) {
    const filePath = path.join(window.utools.getPath('downloads'), Date.now().toString() + '.txt')
    fs.writeFileSync(filePath, text, { encoding: 'utf-8' })
    return filePath
  },
  // 图片写入到下载目录
  writeImageFile (base64Url) {
    const matchs = /^data:image\/([a-z]{1,20});base64,/i.exec(base64Url)
    if (!matchs) return
    const filePath = path.join(window.utools.getPath('downloads'), Date.now().toString() + '.' + matchs[1])
    fs.writeFileSync(filePath, base64Url.substring(matchs[0].length), { encoding: 'base64' })
    return filePath
  },
  // 向 flomo API 发送 POST 请求
  sendToFlomo (endpoint, body) {
    return new Promise((resolve, reject) => {
      try {
        const url = new URL(endpoint)
        const data = JSON.stringify(body)
        const transport = url.protocol === 'https:' ? https : http

        const options = {
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: url.pathname + url.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
          },
          timeout: 10000
        }

        const req = transport.request(options, (res) => {
          let responseBody = ''
          res.on('data', (chunk) => { responseBody += chunk })
          res.on('end', () => {
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body: responseBody })
          })
        })

        req.on('timeout', () => {
          req.destroy()
          reject(new Error('Request timeout'))
        })

        req.on('error', (err) => {
          reject(err)
        })

        req.write(data)
        req.end()
      } catch (err) {
        reject(err)
      }
    })
  }
}

require('./tools.js')
