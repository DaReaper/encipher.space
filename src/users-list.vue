<template>
  <ul>
    <li v-for="user in users_list">
      <button @click="user.dc.close();">terminate</button>
      <label v-bind:for="user.name">{{ user.name }}</label>
      <div class="recv_chat_box">{{ user.msg }}</div>
    </li>
  </ul>
</template>


<script>
export default {
  name: 'usersList',
  data () {
    return {
      users_list: []
    }
  },
  created: function() {
    this.eventHub.$on("user", this.userUpdate);
    this.eventHub.$on("out_msg", this.broadcastMessage);
  },
  methods: {
    userUpdate: function(user_obj) {
      this.users_list.push(user_obj);
      let element = this.users_list[this.users_list.length - 1];
      element.dc.onmessage = (e) => {
        console.log("Got msg event");
        //Hack to get vue's reactivity working.
        for(var i = 0; i < this.users_list.length; i++) {
          if (this.users_list[i].name == element.name) {
            var copy_entry = this.users_list[i];
            this.users_list.splice(i, 1);
            copy_entry["msg"] = e.data;
            this.users_list.push(copy_entry);
          }
        }
      }
      element.dc.onclose = (e) => {
        console.log("Something closed");
        for(var i = 0; i < this.users_list.length; i++) {
          if (this.users_list[i].name == element.name) {
            this.users_list.splice(i, 1);
            break;
          }
        }
        this.eventHub.$emit("user-removed", element.name); //
      }
    },
    broadcastMessage: function(msg) {
      for (var i = 0; i < this.users_list.length; i++) {
        if (msg == "") {
          this.users_list[i].dc.send(" ");
        } else {
          this.users_list[i].dc.send(msg);
        }
      }
    }
  }
}
</script>

