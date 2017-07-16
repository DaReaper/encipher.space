<template>
  <input type="text" v-if="usersNotEmpty" v-model="my_message" @keyup="send"/>
</template>

<script>
export default {
  name: 'myInput',
  data () {
    return {
      my_message: "",
      users_list_1: []
    }
  },
  created: function() {
    this.eventHub.$on("user", this.countUsers);
    this.eventHub.$on("user-removed", this.decrementUsers);
  },
  methods: {
    send: function() {
      this.eventHub.$emit("out_msg", this.my_message);
    },
    countUsers: function(users) {
      this.users_list_1.push(users);
    },
    decrementUsers: function(users) {
      this.users_list_1.pop();
    }
  },
  computed: {
    usersNotEmpty() {
      return this.users_list_1.length > 0
    }
  }
}
</script>
