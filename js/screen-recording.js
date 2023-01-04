'use strict'

const btnStart = document.querySelector('button#startRec');
const btnStop = document.querySelector('button#stopRec');
const btnDownload = document.querySelector('button#download');
const videoElement = document.querySelector('video#display');
const btnTest = document.querySelector('button#test');


let buffer;
let mediaRecorder;
let mimeType = "";
let mimeVideoType = "";
let mimeVideoCodec = "";

async function gotStream(stream) {
	videoElement.srcObject = stream;
	window.stream = stream;
}

async function handleDataAvailable(e) {
	if (e && e.data && e.data.size > 0) {
		buffer.push(e.data);
	}
}

async function init() {
	buffer = [];
	getMimeType();
	let options = {};
	if (mimeType.length == 0) {
		console.log('Codec is not found.');
		return;
	} else {
		options['mimeType'] = `${mimeType}`;
		options['videoBitsPerSecond'] = 2048000;
	}

	if (!MediaRecorder.isTypeSupported(options.mimeType)) {
		console.error(options.mimeType, 'is not supported');
		return false;
	}

	if (window.stream) {
		window.stream.getTracks().forEach((track) => {track.stop()});
	}
	const constraints = {
		frameRate: 30,
		width: 1280,
		height: 720,
	};

	try {
		await navigator.mediaDevices.getDisplayMedia(constraints).then(gotStream);

		mediaRecorder = new MediaRecorder(window.stream, options);
		mediaRecorder.ondataavailable = (e) => {
			if (e && e.data && e.data.size > 0) {
				buffer.push(e.data)
			}
		}
		mediaRecorder.start();
	} catch (e) {
		console.error(e);
		return false;
	}

	return true;
}

function startRecording() {
	var ret = init();
	if (ret) {		
		btnStart.disabled = true;
		btnStop.disabled = false;
		btnDownload.disabled = true;	
	}
}

function stopRecording() {
	mediaRecorder.stop();
	videoElement.srcObject = null;
	if (window.stream) {
		window.stream.getTracks().forEach((track) => {track.stop()});
		window.stream = null;
	}	
	btnStart.disabled = false;
	btnStop.disabled = true;
	btnDownload.disabled = false;
}

function download() {
	var blob = new Blob(buffer, {type: `video/${mimeVideoType}`});
	var url = window.URL.createObjectURL(blob)
	var a = document.createElement('a')

	a.href = url
	a.style.display = 'none'
	switch(mimeVideoType) {
	case 'mp4':
		a.download = 'screen-recording.mp4';
		break;
	case 'webm':
		a.download = 'screen-recording.webm';
		break;
	case 'ogg':
		a.download = 'screen-recording.ogg';
		break;
	case 'x-matroska':
		a.download = 'screen-recording.mkv';
		break;
	}
	a.click()

}

function getMimeType() {
	const VIDEO_TYPES = ['webm', 'mp4', 'ogg', 'x-matroska'];
	const VIDEO_CODECS = [
        'vp9', 'vp9.0', 'vp8', 'vp8.0', 'avc1', 'av1',
        'h265', 'h.265', 'h264', 'h.264', 'opus'
    ];
	
	for (let i = 0; i < VIDEO_TYPES.length; i++) {
		const videoType = VIDEO_TYPES[i];
		for (let j = 0; j < VIDEO_CODECS.length; j++) {
			const type = `video/${videoType}`;
			const codec = VIDEO_CODECS[j];
			const variations = [
	            `${type};codecs=${codec}`,
	            `${type};codecs:${codec}`,
	            `${type};codecs=${codec.toUpperCase()}`,
	            `${type};codecs:${codec.toUpperCase()}`
	        ];
	        for (let z = 0; z < variations.length; z++) {
	        	if (MediaRecorder.isTypeSupported(variations[z])) {
	        		mimeType = variations[z];
	        		mimeVideoType = videoType;
	        		mimeVideoCodec = codec;
	        		return;
	        	}
	        }
		}
	}
}

btnStart.onclick = startRecording;
btnStop.onclick = stopRecording;
btnDownload.onclick = download;

