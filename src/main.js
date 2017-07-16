import Vue from 'vue'
import Start from './Start.vue'
import usersList from './users-list.vue'
import myInput from './my-input.vue'
import pairBox from './pair-box.vue'

const eventHub = new Vue()
Vue.mixin({
    data: function () {
        return {
            eventHub: eventHub
        }
    }
})

new Vue({
  el: '#app',
  render: h => h(Start),
  components: {
    'my-input': myInput,
    'users-list': usersList,
    'pair-box': pairBox
  }
})





