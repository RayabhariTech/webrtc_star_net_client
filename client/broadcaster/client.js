'use strict';

const createStartStopButton = require('./startstopbutton');
const ApiClient = require('./apiClient');
// eslint-disable-next-line no-process-env
const API_URL = 'http://localhost:3001';
function createBroadcaster(name, description, options) {
  const nameTag = document.createElement('h2');
  nameTag.innerText = name;
  document.body.appendChild(nameTag);

  const descriptionTag = document.createElement('p');
  descriptionTag.innerHTML = description;
  document.body.appendChild(descriptionTag);

  const clickStartTag = document.createElement('p');
  clickStartTag.innerHTML = 'Click &ldquo;Start&rdquo; to begin.';
  document.body.appendChild(clickStartTag);

  const apiClient = new ApiClient();

  let peerConnection = null;

  createStartStopButton(async () => {
    console.log(25, options);
    peerConnection = await apiClient.createConnection(options);
    window.peerConnection = peerConnection;
  }, () => {
    peerConnection.close();
  });
}

const description = 'Start a broadcast. Your stream will be forwarded to \
multiple viewers. Although you can prototype such a system with node-webrtc, \
you should consider using an \
<a href="https://webrtcglossary.com/sfu/" target="_blank">SFU</a>.';

const localVideo = document.createElement('video');
localVideo.autoplay = true;
localVideo.muted = true;

async function beforeAnswer(peerConnection) {
  const localStream = await window.navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  });

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  localVideo.srcObject = localStream;

  // NOTE(mroberts): This is a hack so that we can get a callback when the
  // RTCPeerConnection is closed. In the future, we can subscribe to
  // "connectionstatechange" events.
  const { close } = peerConnection;
  // eslint-disable-next-line space-before-function-paren
  peerConnection.close = function () {
    localVideo.srcObject = null;

    localStream.getTracks().forEach(track => track.stop());

    return close.apply(this, arguments);
  };
}

createBroadcaster('broadcaster', description, { beforeAnswer, host: API_URL, prefix: '/broadcaster' });

const videos = document.createElement('div');
videos.className = 'grid';
videos.appendChild(localVideo);
document.body.appendChild(videos);
