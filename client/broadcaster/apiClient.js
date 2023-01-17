'use strict';

const fetch = require('node-fetch');
const DefaultRTCPeerConnection = require('wrtc').RTCPeerConnection;
const { RTCSessionDescription } = require('wrtc');

const TIME_TO_HOST_CANDIDATES = 3000;  // NOTE(mroberts): Too long.

class ApiClient {
  constructor(options = {}) {
    options = {
      RTCPeerConnection: DefaultRTCPeerConnection,
      clearTimeout,
      host: '',
      prefix: '.',
      setTimeout,
      timeToHostCandidates: TIME_TO_HOST_CANDIDATES,
      ...options
    };

    const {
      RTCPeerConnection,
      prefix,
      host
    } = options;

    this.createConnection = async (options = {}) => {
      console.log(28, options);
      options = {
        beforeAnswer() { },
        stereo: false,
        ...options
      };

      const {
        beforeAnswer,
        stereo
      } = options;
      console.log(38, host, prefix);
      const response1 = await fetch('http://localhost:3001/broadcaster/connections', {
        method: 'POST'
      });

      const remotePeerConnection = await response1.json();
      const { id } = remotePeerConnection;

      const localPeerConnection = new RTCPeerConnection({
        sdpSemantics: 'unified-plan'
      });

      // NOTE(mroberts): This is a hack so that we can get a callback when the
      // RTCPeerConnection is closed. In the future, we can subscribe to
      // "connectionstatechange" events.
      // eslint-disable-next-line space-before-function-paren
      localPeerConnection.close = function () {
        fetch('http://localhost:3001/broadcaster/connections/${id}', { method: 'delete' }).catch(() => { });
        return RTCPeerConnection.prototype.close.apply(this, arguments);
      };

      try {
        await localPeerConnection.setRemoteDescription(remotePeerConnection.localDescription);

        await beforeAnswer(localPeerConnection);

        const originalAnswer = await localPeerConnection.createAnswer();
        const updatedAnswer = new RTCSessionDescription({
          type: 'answer',
          sdp: stereo ? enableStereoOpus(originalAnswer.sdp) : originalAnswer.sdp
        });
        await localPeerConnection.setLocalDescription(updatedAnswer);

        await fetch(`http://localhost:3001/broadcaster/connections/${id}/remote-description`, {
          method: 'POST',
          body: JSON.stringify(localPeerConnection.localDescription),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        return localPeerConnection;
      } catch (error) {
        localPeerConnection.close();
        throw error;
      }
    };
  }
}

function enableStereoOpus(sdp) {
  return sdp.replace(/a=fmtp:111/, 'a=fmtp:111 stereo=1\r\na=fmtp:111');
}

module.exports = ApiClient;
