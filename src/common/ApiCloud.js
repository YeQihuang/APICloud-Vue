const MyPlugin = {}

MyPlugin.install = function (Vue, options) {
  Vue.prototype.$host = ''
  Vue.prototype.$upload_host = ''

  Vue.prototype.$setPrefs = function (key, value) {
    api.setPrefs({
      key: key,
      value: JSON.stringify(value)
    })
  }

  Vue.prototype.$getPrefs = function (key) {
    key = api.getPrefs({
      sync: true,
      key: key
    })

    return key ? JSON.parse(key) : key
  }

  Vue.prototype.$httpError = function (err) {
    // AJ(err.msg);
    AJ(err)
  }

  Vue.prototype.$httpErrorCode = function (ret) {
    if (parseInt(ret.code) == 1008) {
      api.alert({msg: ret.msg}, () => {
        api.closeWidget({
          silent: true
        })
      })
      return
    }
    if (ret.msg) {
      alert(ret.msg)
    } else {
      AJ(ret)
    }
    switch (parseInt(ret.code)) {
      case 4000:
        this.$router.push('/login')
        break
      case 1008:
        break
      default:
    }
  }

  Vue.prototype.$ajax = function (data, backcall, msg = '') {
    api.showProgress({
      title: msg,
      modal: true
    })
    api.ajax(data, (ret, err) => {
      api.hideProgress()
      if (!ret) {
        this.$httpError(err)
        return
      }

      if (ret.code != 0) {
        this.$httpErrorCode(ret)
        return
      }
      backcall(ret)
    })
  }

  Vue.prototype.$httpGet = function (url, data, backcall, msg = '') {
    this.$ajax({
      url: Vue.prototype.$host + url,
      method: 'get',
      dataType: 'json',
      data: {
        values: data
      }
    }, backcall, msg)
  }

  Vue.prototype.$httpPost = function (url, data, backcall, msg = '') {
    if (this.$discoverEmoji(data)) {
      alert('请不要输入表情符号')
      return
    }

    this.$ajax({
      url: Vue.prototype.$host + url,
      method: 'post',
      dataType: 'json',
      data: {
        values: data
      }
    }, backcall, msg)
  }

  Vue.prototype.$httpPost_upload = function (url, data, backcall) {
    this.$ajax({
      url: this.$upload_host + url,
      method: 'post',
      dataType: 'json',
      data: {
        values: data
      }
    }, backcall)
  }

  Vue.prototype.$httpGet_upload = function (url, data, backcall) {
    this.$ajax({
      url: this.$upload_host + url,
      method: 'get',
      dataType: 'json',
      data: {
        values: data
      }
    }, backcall)
  }

  Vue.prototype.$httpFile = function (url, data, files, backcall) {
    this.$ajax({
      url: this.$upload_host + url,
      method: 'post',
      dataType: 'json',
      data: {
        values: data,
        files: files
      }
    }, backcall)
  }

  Vue.prototype.$upload = function (files, data, backcall) {
    api.showProgress({
      title: '上传中',
      modal: true
    })
    this.$httpFile('/api/upload', data, files, backcall)
  }

  Vue.prototype.$download = function (url, backcall) {
    api.download({url: Vue.prototype.$host + '/api/member/qrCode'}, (ret, err) => {
        backcall(ret, err)
      }
    )
  }

  Vue.prototype.$decodeImgToBase64 = function (src, fun) {
    api.showProgress({
      title: '图像处理中',
      modal: true
    })
    let trans = api.require('trans')
    trans.decodeImgToBase64(
      {
        imgPath: src
      }, (ret, err) => {
        if (ret.status) {
          fun(ret)
        } else {
          api.hideProgress()
          AJ(err)
          AJ(src)
          return
        }
      }
    )
  }

  Vue.prototype.$compressPhoto = function (imgBase64Data, fun) {
    api.showProgress({
      title: '图像处理中',
      modal: true
    })

    let img = new Image()

    // 缩放图片需要的canvas
    let canvas = document.createElement('canvas')
    let context = canvas.getContext('2d')

    // base64地址图片加载完毕后
    img.onload = function () {
      // 图片原始尺寸
      let originWidth = this.width
      let originHeight = this.height
      // 目标尺寸
      let targetWidth = originWidth,
        targetHeight = originHeight
      // let targetWidth = originWidth*3/4, targetHeight = originHeight*3/4;
      let maxWidth = 1280,
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

      let base = canvas.toDataURL('image/jpeg', 0.7) //canvas转码为base64
      fun(base) //返回处理
    }

    img.src = imgBase64Data
  }

  Vue.prototype.$UIAlbumBrowser = function (callback) {
    let UIAlbumBrowser = api.require('UIAlbumBrowser')
    UIAlbumBrowser.open({
      max: 1,
      styles: {
        bg: '#fff',
        mark: {
          icon: '',
          position: 'bottom_left',
          size: 20
        },
        nav: {
          bg: 'rgba(0,0,0,0.6)',
          titleColor: '#fff',
          titleSize: 18,
          cancelColor: '#fff',
          cancelSize: 16,
          finishColor: '#fff',
          finishSize: 16
        }
      },
      rotation: true
    }, function (ret) {
      if (ret.eventType == 'confirm' && ret.list.length > 0) {
        callback(ret.list[0])
      }
    })
  }

  Vue.prototype.$copy = function (str, callback = () => {
  }) {
    let clipBoard = api.require('clipBoard')
    clipBoard.set({
      value: str
    }, (ret, err) => {
      if (ret) {
        api.toast({
          msg: '复制成功',
          duration: 2000,
          location: 'middle'
        })
        callback()
      } else {
        AJ(err)
      }
    })
  }

  Vue.prototype.$uploadImage = function (callback) {

    if (api.systemType == 'ios') {
      if (document.getElementById('imgFile') != null) {
        document.body.removeChild(document.getElementById('imgFile'))
      }

      let inputEle = document.createElement('input')
      inputEle.id = 'imgFile'
      inputEle.type = 'file'
      inputEle.accept = 'image/png,image/jpeg,image/jpeg,DCIM/*;capture=camera'
      inputEle.style.display = 'none'
      inputEle.onchange = () => {
        let file = document.getElementById('imgFile').files[0]
        let reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (e) => {
          let imgBase64Data = e.target.result
          this.$compressPhoto(imgBase64Data, (base) => {
            this.$httpPost_upload('/api/base64_upload', {
              base64_file: base,
              base64_file_name: file.name
            }, callback)
          })
        }

      }
      inputEle.multiple = false
      document.body.appendChild(inputEle)
      document.getElementById('imgFile').click()

    }

    if (api.systemType == 'android') {
      this.$UIAlbumBrowser((res) => {

        this.$decodeImgToBase64(res.path, (base64Res) => {
          let base64Str = 'data:image/' + res.suffix + ';base64,' + base64Res.base64Str
          this.$compressPhoto(base64Str, (base) => {
            this.$httpPost_upload('/api/base64_upload', {
                base64_file: base,
                base64_file_name: res.path.substring(res.path.lastIndexOf('/') + 1)
              }, callback
            )
          })
        })
      })
    }

  }

  Vue.prototype.$imageBrowser = function ($event) {
    let images = [$event.target.src]
    let imageBrowser = api.require('imageBrowser')
    imageBrowser.openImages({
      showList: false,
      imageUrls: images,
    })
  }

  Vue.prototype.$getPicture = function (callback) {
    api.getPicture({
        sourceType: 'camera',
        encodingType: 'png',
        mediaValue: 'pic',
        allowEdit: false,
        quality: 90,
        saveToPhotoAlbum: true
      },
      function (ret, err) {
        // 获取拍照数据并处理
        if (ret && ret.data) callback(ret.data)
      }
    )
  }

  Vue.prototype.$discoverEmoji = function isEmojiCharacter (substring) {

    if (typeof substring === 'object' || typeof substring === 'array') {
      for (let i in substring) {
        if (this.$discoverEmoji(substring[i])) {
          return true
        }
      }
    }

    if (typeof substring !== 'string') {
      return false
    }

    for (var i = 0; i < substring.length; i++) {
      var hs = substring.charCodeAt(i)
      if (0xd800 <= hs && hs <= 0xdbff) {
        if (substring.length > 1) {
          var ls = substring.charCodeAt(i + 1)
          var uc = ((hs - 0xd800) * 0x400) + (ls - 0xdc00) + 0x10000
          if (0x1d000 <= uc && uc <= 0x1f77f) {
            return true
          }
        }
      } else if (substring.length > 1) {
        var ls = substring.charCodeAt(i + 1)
        if (ls == 0x20e3) {
          return true
        }
      } else {
        if (0x2100 <= hs && hs <= 0x27ff) {
          return true
        } else if (0x2B05 <= hs && hs <= 0x2b07) {
          return true
        } else if (0x2934 <= hs && hs <= 0x2935) {
          return true
        } else if (0x3297 <= hs && hs <= 0x3299) {
          return true
        } else if (hs == 0xa9 || hs == 0xae || hs == 0x303d || hs == 0x3030
          || hs == 0x2b55 || hs == 0x2b1c || hs == 0x2b1b
          || hs == 0x2b50) {
          return true
        }
      }
    }
  }

}

export default MyPlugin

