<template>
  <div id="pair">
    <button id="init_button" @click="initiate_conn" v-bind:disabled="recv">Initiate connection</button>
    <button id="recv_button" @click="receive_conn" v-bind:disabled="init">Receive connection</button>
    <div v-if="init" id="init_box">
      <h3>Step 1</h3>
      <label for="alias">Friend name: </label><input id="alias" v-model="alias" type="text" />
      <h4>Give the following to {{ alias }}</h4>
      <textarea rows="4" columns="50" >{{ uuid }}</textarea>
      <hr />
      <div>{{ console_msg }}</div>
    </div>
    <div v-if="recv" id="recv_box">
      <h3>Step 1</h3>
      <label for="alias">Friend name: </label><input id="alias" v-model="alias" type="text" />
      <h4>Paste {{ alias }}'s thing </h4>
      <textarea rows="4" columns="50" v-model="pasted_initiator" @keyup="receiving_ta_fn"></textarea>
      <hr />
      <div>{{ console_msg }}</div>
    </div>
  </div>
</template>

<script>
let server_perm_pubkey = "2735ad9b04bb9392c7b752a7f7e68246a7e346f0aaad90cb18c8d678464f9934";
//let server_perm_pubkey = "f77fe623b6977d470ac8c7bf7011c4ad08a1d126896795db9d2b4b7a49ae1045"; // server.saltyrtc.org dev

let HOST = "encipher.space"
let PORT = 9287;

let iceServers = [{ urls: [
  "stun:stun.l.google.com:19302",
  "stun:stun1.l.google.com:19302",
  "stun:stun2.l.google.com:19302",
  "stun:stun3.l.google.com:19302",
  "stun:stun4.l.google.com:19302" ]}];

export default {
  name: 'pairBox',
  data () {
    return {
      sig_ser: 'http://127.0.0.1:5000',
      alias: 'bob',
      init: false,
      recv: false,
      pc: '',
      task: '',
      uuid: '',
      pasted_initiator: '',
      console_msg: '',
      dc: []
    }
  },
  methods: {
    console_log: function(message) {
      this.console_msg = message;
    },
    initiate_conn: function() {
      this.init = this.init?false:true;
      if (this.init) {
        init_button.innerText = "cancel";
        const initiator_perm_key = new saltyrtcClient.KeyStore();
        this.task = new saltyrtcTaskWebrtc.WebRTCTask(true);
        window.client = new saltyrtcClient.SaltyRTCBuilder()
          .connectTo(HOST, PORT)
          .withKeyStore(initiator_perm_key)
          .withServerKey(server_perm_pubkey)
          .withPingInterval(30)
          .usingTasks([this.task])
          .asInitiator();
        client.on('handover', () => {
          let user_obj = {
            dc: this.dc,
            name: this.alias
          };
          this.eventHub.$emit('user', user_obj);
          init_button.innerText = "Initiate connection";
          recv_button.innerText = "Receive connection";
          this.init = this.recv = false;
          this.console_log("Datachannel connection established!");
        });
        client.on('signaling-connection-lost', function(id) {
          this.console_log(id);
        });
        this.task.once('answer', (answer) => {
          this.console_log("Got answer");
          this.pc.setRemoteDescription(answer.data).then(() => {
            this.console_log('Got datachannel.');
          });
        });
        client.on('state-change', (state) => {
          if (state.data == "task") {
            this.pc = new RTCPeerConnection({iceServers: iceServers});
            this.pc.onicecandidate = (e) => {
              if (e.candidate) {
                this.task.sendCandidate({
                  candidate: e.candidate.candidate,
                  sdpMid: e.candidate.sdpMid,
                  sdpMLineIndex: e.candidate.sdpMLineIndex,
                });
              }
            }

            this.pc.ondatachannel = (datachannel) => {
              this.console_log("Got datachannel.");
            }
            this.dc = this.pc.createDataChannel("syncytium"); //push later
            this.dc.onmessage = (msg) => {
              this.console_log(msg.data);
            }
            window.dc = this.dc;
            this.pc.createOffer().then(offer => {
              window.pc = this.pc;
              window.task = this.task;
              window.pc.setLocalDescription(offer).then(() => {
                this.console_log("sending offer");
                this.task.sendOffer(offer);
              }).catch(function(err) {
                this.console_log(err);
              });
            });

            this.pc.onnegotiationneeded = (e) => {
              this.task.handover(this.pc);
            };
          }
          this.console_log(state.data);
        });
        client.on('connection-closed', function(state) {
          this.console_log(state.data);
        });
        client.on('connection-error', function(state) {
          this.console_log(state.data);
        });
        client.connect();
      } else {
        init_button.innerText = "Initiate connection";
      }
      this.pc = this.answer_sdp = this.uuid = '';
      this.uuid = window.client.permanentKey.publicKeyHex + "/";
      this.uuid += window.client.authTokenHex;

      this.task.on('candidates', (e) => {
        for (let candidateInit of e.data) {
          this.pc.addIceCandidate(candidateInit);
        }
      });
      //this.task.handover(this.pc);
    },

    receive_conn: function() {
      this.recv = this.recv?false:true;
      if (this.recv) {
        recv_button.innerText = "cancel";
      } else {
        recv_button.innerText = "Receive connection";
      }
      this.pc = this.answer_sdp = '';
    },

    receiving_ta_fn: function(e) {
      if (e.keyCode == 86) { // this is bad UX. replace
        let arg1 = this.pasted_initiator.split("/")[0];
        let arg2 = this.pasted_initiator.split("/")[1];
        const responder_perm_key = new saltyrtcClient.KeyStore();
        this.task = new saltyrtcTaskWebrtc.WebRTCTask(true);
        this.task.on('candidates', (e) => {
          this.console_log("Got candidates");
          for (let candidateInit of e.data) {
            this.console_log(candidateInit);
            this.pc.addIceCandidate(candidateInit).then(() => {
              this.console_log("Candidate added successfully");
            });
          }
        });
        this.task.on('offer', (e) => {
          this.pc.setRemoteDescription(e.data).then(() => {
            this.pc.createAnswer().then(answer => {
              this.console_log("Sending Answer");
              this.pc.setLocalDescription(answer).then(function() {
              });
              this.task.sendAnswer(answer);
            });
          });
        });
        window.client = new saltyrtcClient.SaltyRTCBuilder()
          .initiatorInfo(arg1, arg2)
          .connectTo(HOST, PORT)
          .withKeyStore(responder_perm_key)
          .withServerKey(server_perm_pubkey)
          .withPingInterval(30)
          .usingTasks([this.task])
          .asResponder();
        client.on('handover', () => {
          let user_obj = {
            dc: this.dc,
            name: this.alias,
            msg: ""
          };
          this.eventHub.$emit('user', user_obj);
          init_button.innerText = "Initiate connection";
          recv_button.innerText = "Receive connection";
          this.init = this.recv = false;
          this.console_log("Datachannel connection established!");
        });
        client.on('state-change', (state) => {
          if (state.data == "task") {
            this.pc = new RTCPeerConnection({iceServers: iceServers});
            this.pc.ondatachannel = (datachannel) => {
              this.console_log("Got datachannel.");
              this.dc = datachannel.channel;
              this.dc.onmessage = (msg) => {
                this.console_log(msg.data);
              }
              window.dc = this.dc;
            };
            this.pc.onicecandidate = (candidates) => {
              this.console_log("Sending candidates");
              this.task.sendCandidate(candidates);
            };
            this.task.handover(this.pc);
            window.pc = this.pc;
          }
        });
        client.on('connection-closed', function(state) {
          this.console_log(state);
        });
        client.on('connection-error', function(state) {
          this.console_log(state);
        });
        client.connect();
      }
    },
  }
}
</script>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
