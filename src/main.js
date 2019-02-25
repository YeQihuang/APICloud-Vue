import Vue from 'vue'
import App from './App'
import router from './router'
import VueLazyload from 'vue-lazyload'
import ApiCloud from './common/ApiCloud.js'

Vue.use(ApiCloud)
Vue.use(VueLazyload, {
  loading: 'static/images/loading2.gif',
  error: 'static/images/loading2.gif',
})
Vue.config.productionTip = false

/* eslint-disable no-new */
setTimeout(() => {
  new Vue({
    el: '#app',
    router,
      render: h => h(App),
  })
}, 500)

// window.apiready = function () {
//   new Vue({
//     el: '#app',
//     router,
//     render: h => h(App),
//   })
// }
