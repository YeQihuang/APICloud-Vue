// var host = 'http://192.168.0.146:8081'
var host = 'http://134.175.115.253:17008'
// var host = 'http://134.175.134.224:17008'
// var host = 'http://5bcee015-0.gz.1257619488.clb.myqcloud.com:17008'

var upload_host = 'http://134.175.115.253:17008'
// var upload_host = 'http://111.230.223.187:17008'

function openWin(url, pageParam) {
  api.openWin({
    name: url,
    url: 'widget://html/' + url + '.html',
    pageParam: pageParam
  })
}

function AJ(data) {
  alert(JSON.stringify(data, null, 2))
}

function httpError(err) {
  // AJ(err.msg);
  AJ(err)
}

function httpErrorCode(ret) {
  // AJ(ret)
  if (parseInt(ret.code) == 1008) {
    api.alert({ msg: ret.msg }, function(ret, err) {
      api.closeWidget({
        silent: true
      })
    })
    return
  }
  if (ret.msg) {
    alert(ret.msg)
  } else {
    if (ret.status) {
      location.reload()
    } else {
      AJ(ret)
    }
  }
  switch (parseInt(ret.code)) {
    case 4000:
      api.openWin({
        name: 'login',
        url: 'login.html'
      })
      break
    case 4030:
      api.openWin({
        name: 'Bind_ID',
        url: 'Bind_ID.html'
      })
      break
    case 4031:
      api.openWin({
        name: 'bindtb',
        url: 'bind_taobao.html'
      })
      break
    case 1008:
      break
    default:
  }
}

function ajax(data, backcall) {
  api.showProgress({
    title: '',
    modal: true
  })
  api.ajax(data, function(ret, err) {
    api.hideProgress()
    if (!ret) {
      httpError(err)
      return
    }
    if (ret.code != 0) {
      httpErrorCode(ret)
      return
    }
    backcall(ret)
  })
}

function httpPost(url, data, backcall) {
  ajax(
    {
      url: host + url,
      method: 'post',
      dataType: 'json',
      data: {
        values: data
      }
    },
    backcall
  )
}

function httpPost_upload(url, data, backcall) {
  ajax(
    {
      url: upload_host + url,
      method: 'post',
      dataType: 'json',
      data: {
        values: data
      }
    },
    backcall
  )
}

function httpGet(url, data, backcall) {
  ajax(
    {
      url: host + url,
      method: 'get',
      dataType: 'json',
      data: {
        values: data
      }
    },
    backcall
  )
}

function httpGet_upload(url, data, backcall) {
  ajax(
    {
      url: upload_host + url,
      method: 'get',
      dataType: 'json',
      data: {
        values: data
      }
    },
    backcall
  )
}

function httpFile(url, data, files, backcall) {
  ajax(
    {
      url: upload_host + url,
      method: 'post',
      dataType: 'json',
      data: {
        values: data,
        files: files
      }
    },
    backcall
  )
}

function upload(files, data, backcall) {
  api.showProgress({
    title: '上传中',
    modal: true
  })
  httpFile('/api/upload', data, files, backcall)
}

function download(url, backcall) {
  api.download(
    {
      url: host + '/api/member/qrCode'
    },
    function(ret, err) {
      backcall(ret, err)
    }
  )
}

function decodeImgToBase64(src, fun) {
  var trans = api.require('trans')
  trans.decodeImgToBase64(
    {
      imgPath: src
    },
    function(ret, err) {
      if (ret.status) {
        fun(ret)
      } else {
        api.hideProgress()
        alert(JSON.stringify(err))
        alert(src)
        return
      }
    }
  )
}

function converted_base64_img_upload(src, suffix, size, backcall) {
  api.showProgress({
    title: '',
    modal: true
  })
  if (1) {
    //size > 1024 * 100 *
    decodeImgToBase64(src, function(ret) {
      var base64Str = 'data:image/' + suffix + ';base64,' + ret.base64Str
      compressPhoto(base64Str, function(base) {
        httpPost_upload(
          '/api/base64_upload',
          {
            base64_file: base,
            base64_file_name: src.substring(src.lastIndexOf('/') + 1)
          },
          function(res) {
            backcall(res)
          }
        )
      })
    })
  } else {
    upload({ file: src }, {}, function(ret) {
      backcall(ret)
    })
  }
}

function compressPhoto(imgBase64Data, fun) {
  var img = new Image()

  // 缩放图片需要的canvas
  var canvas = document.createElement('canvas')
  var context = canvas.getContext('2d')

  // base64地址图片加载完毕后
  img.onload = function() {
    // 图片原始尺寸
    var originWidth = this.width
    var originHeight = this.height
    // 目标尺寸
    var targetWidth = originWidth,
      targetHeight = originHeight
    // var targetWidth = originWidth*3/4, targetHeight = originHeight*3/4;
    var maxWidth = 1280,
      maxHeight = 1280
    if (originWidth > maxWidth || originHeight > maxHeight) {
      if (originWidth / originHeight > maxWidth / maxHeight) {
        // 更宽，按照宽度限定尺寸
        targetWidth = maxWidth
        targetHeight = Math.round(maxWidth * (originHeight / originWidth))
      } else {
        targetHeight = maxHeight
        targetWidth = Math.round(maxHeight * (originWidth / originHeight))
      }
    }
    // canvas对图片进行缩放
    canvas.width = targetWidth
    canvas.height = targetHeight
    // 清除画布
    context.clearRect(0, 0, targetWidth, targetHeight)
    // 图片压缩
    context.drawImage(img, 0, 0, targetWidth, targetHeight)

    var base = canvas.toDataURL('image/jpeg', 0.7) //canvas转码为base64
    fun(base) //返回处理
  }

  img.src = imgBase64Data
}

function setPrefs(key, value) {
  api.setPrefs({
    key: key,
    value: JSON.stringify(value)
  })
}

function getPrefs(key) {
  key = api.getPrefs({
    sync: true,
    key: key
  })
  return JSON.parse(key)
}
