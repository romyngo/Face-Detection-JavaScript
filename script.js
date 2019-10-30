const container = document.getElementById("container");
const video = document.getElementById("video");
const loader = document.getElementById("loading");

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("models"),
  // faceapi.nets.faceRecognitionNet.loadFromUri("models"),
  faceapi.nets.faceExpressionNet.loadFromUri("models")
]).then(startVideo);

function startVideo() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then(function(stream) {
        loading.style.display = "none";
        video.style.display = "block";
        video.srcObject = stream;
      })
      .catch(function(e) {
        loading.innerHTML = e;
      });
  }
}

video.addEventListener("play", () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  container.appendChild(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);
  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    for (const detection of detections) {
      postMessage(JSON.stringify(detection.expressions));
    }
  }, 100);
});

document.addEventListener(
  "DOMContentLoaded",
  function() {
    window.addEventListener("message", function(event) {
      if (window.WebAppInterface) {
        window.WebAppInterface.getPostMessage(event.data);
      } else {
        console.log(event.data);
      }
    });
  },
  false
);
