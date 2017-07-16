<template>
<div>
  <pair-box></pair-box>
  <users-list></users-list>
  <my-input></my-input>
</div>
</template>

<script>
import usersList from './users-list.vue'
import myInput from './my-input.vue'
import pairBox from './pair-box.vue'

export default {
  name: 'Start',
  components: {
    'my-input': myInput,
    'users-list': usersList,
    'pair-box': pairBox
  }
}
</script>
