<template>
  <div id="app" v-on:touchstart="bodyTouchStart" v-on:touchmove="bodyTouchMove" v-on:touchend="bodyTouchEnd">
    <transition name="slide-fade">
      <router-view :key="activeDate"/>
    </transition>
    <IndexFooter v-show="$route.meta.showFooter"/>
  </div>
</template>

<script>
  import IndexFooter from '@/components/Index/Footer'

  export default {
    name: 'App',
    data () {
      return {
        activeDate: '1',
        // direction 页面切换的过渡动画，配合transition组件使用
        direction: "slide-left",
        // touchLeft 划动起点界限，起点在靠近屏幕左侧时才有效
        touchLeft: document.documentElement.clientWidth*1/3,
        // touchStartPoint 记录起始点X坐标
        touchStartPoint: 0,
        // distance 记录划动的距离
        distance: 0,
        // 回退按钮的dom，根据页面上是否存在此dom来判断该路由是否可回退
        backBtn: null
      }
    },
    components: {IndexFooter},
    watch: {
      '$route': function () {
        this.activeDate = new Date().toString()
      }
    },
    methods: {
      auth (ret) {
        if (ret.version == null) {
          api.alert({title: '当前版本不可用',}, () => {
            api.closeWidget({silent: true})
          })
          return
        }

        if (ret.version.enable == 0) {
          api.alert({title: '当前版本已关闭',}, () => {
            api.closeWidget({silent: true})
          })
          return
        }
        if (!ret.auth) {
          this.$router.push('/login')
        } else {
          // this.$router.push('/order/list')
          this.$router.push('/index')
        }
      },
      bodyTouchStart: function(event) {
        this.backBtn = document.querySelector(".mui-action-back");
        if (this.backBtn) {
          // 获得起点X坐标，初始化distance为0
          this.touchStartPoint = event.targetTouches[0].pageX;
          this.distance = 0;
        }
      },
      bodyTouchMove: function(event) {
        if (this.backBtn && this.touchStartPoint < this.touchLeft) {
          // 只监听单指划动，多指划动不作响应
          if (event.targetTouches.length > 1) {
            return;
          }
          // 实时计算distance
          this.distance = event.targetTouches[0].pageX - this.touchStartPoint;
          // 根据distance在页面上做出反馈。这里演示通过返回按钮的背景变化作出反馈
          if (this.distance > 0 && this.distance < 100) {
            this.backBtn.style.backgroundPosition = ((this.distance - 100) / 100) * 50 + "px 0";
          } else if (this.distance >= 100) {
            this.backBtn.style.backgroundPosition = "0 0";
          } else {
            this.backBtn.style.backgroundPosition = "-50px 0";
          }
        }
      },
      bodyTouchEnd: function(event) {
        if (this.backBtn && this.touchStartPoint < this.touchLeft) {
          // 划动结束，重置数据
          this.touchStartPoint = 0;
          this.backBtn.style.backgroundPosition = "-50px 0";
          // 当划动距离超过100px时，触发返回事件

          if (this.distance > 100) {
            // 返回前修改样式，让过渡动画看起来更快
            document.getElementById("app").classList.add("quickback");
            this.$router.back();
            setTimeout(function(){
              document.getElementById("app").classList.remove("quickback");
            },250)
          }
        }
      }
    },
    mounted () {

      if (typeof api == 'undefined') {
        this.$router.push('/index')
        return
      }
      api.showProgress({modal: true})

      api.addEventListener({
        name:'smartupdatefinish'
      }, function(ret, err){
        api.alert({title: '更新完成,重启应用',}, () => {
          api.rebootApp();
        })
      });

      if (api.systemType == 'android') {
        var phoneInfoMore = api.require('phoneInfoMore')
        phoneInfoMore.getBaseInfo(function (ret, err) {
          if (ret.ipMac == '02:00:00:00:00:00' || ret.ipMac == '00:90:4c:11:22:33' || ret.ipMac == '00:90:4C:11:22:33') {
            setPrefs('ip_mac', '')
          } else {
            setPrefs('ip_mac', ret.ipMac)
          }
        })
      }

      api.ajax({
        url: this.$host + '/api/open',
        method: 'get',
        dataType: 'json',
        data: {
          values: {
            version: api.appVersion,//'1.0.16',//
            systemType: api.systemType,
            platform: api.systemType == 'ios' ? 1 : 0
          }
        }
      }, (ret, err) => {
        api.hideProgress()
        if (!ret) {
          api.alert({msg: JSON.stringify(err)}, () => api.closeWidget({silent: true}))
          return
        }

        if (ret.code != 0) {
          api.alert({title: ret.msg,}, () => api.closeWidget({silent: true}))
          return
        }

        if (!ret.update) {
          this.auth(ret)
          return
        }

        let str = `新版本型号:${ret.update.version}`
        if (ret.update.tip) {
          str += `\n${ret.update.tip}`
        }
        str += `\n${ret.update.addtime}`

        api.confirm({
          title: '有新的版本,是否下载并安装',
          msg: str,
          buttons: ['确定', '取消']
        }, (ret_confirm, err) => {
          if (ret_confirm.buttonIndex == 1) {
            if (api.systemType == 'android') {
              api.download({
                url: ret.update.url,
                report: true
              }, function (ret_download, err) {
                if (ret_download && 0 == ret_download.state) { /* 下载进度 */
                  api.showProgress({
                    title: '正在下载应用',
                    text: ret_download.percent + '%',
                    modal: true
                  })
                }
                if (ret_download && 1 == ret_download.state) { /* 下载完成 */
                  var savePath = ret_download.savePath
                  api.installApp({
                    appUri: savePath
                  })

                }
              })
            }
            if (api.systemType == 'ios') {
              api.installApp({appUri: ret.update.url})
              api.closeWidget({silent: true})
            }
          } else if (ret_confirm.buttonIndex == 2) {
            this.auth(ret)
          }
        })
      })

    }
  }
</script>

<style scoped>
  .slide-fade-enter-active {
    transition: all .4s ease;
  }

  .slide-fade-leave-active {
    transition: all 0s ease;
  }

  .slide-fade-enter {
    transform: translateX(20px);
    opacity: 0;
  }

  .slide-fade-leave-active {
    opacity: 0;
  }

  #app {
    min-height: 100vh;
  }
</style>
