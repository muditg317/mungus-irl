import React, { useEffect } from 'react';

import QrScanner from './qr-scanner';
// console.log(QrScanner);

export default function About() {
  // const [dummy, setDummy] = useState(0);
  useEffect(() => {
    // if (dummy < 5) {
    //   console.log("waiting",dummy);
    //   setDummy(dummy + 1);
    //   return;
    // }
    const log = document.getElementById('log');
    log.log = (...args) => {
      args.forEach(arg => {
        let p = document.createElement('p');
        p.innerText = arg.toString();
        log.appendChild(p);
        console.log(arg);
        console.log(JSON.stringify(arg));
      });
    };
    const video = document.getElementById('qr-video');

    const canvasElement = document.getElementById("qr-canvas");
    const canvas = canvasElement.getContext("2d");

    const qrResult = document.getElementById("qr-result");
    const outputData = document.getElementById("outputData");
    const btnScanQR = document.getElementById("btn-scan-qr");

    let scanning = false;

    QrScanner.callback = (res) => {
      if (res) {
        outputData.innerText = res;
        scanning = false;

        video.srcObject.getTracks().forEach(track => {
          track.stop();
        });

        qrResult.hidden = false;
        btnScanQR.hidden = false;
        canvasElement.hidden = true;
      }
    };

    function tick() {
      canvasElement.height = video.videoHeight;
      canvasElement.width = video.videoWidth;
      canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

      scanning && requestAnimationFrame(tick);
    }

    function scan() {
      try {
        QrScanner.decode();
      } catch (e) {
        setTimeout(scan, 300);
      }
    }

    btnScanQR.onclick = () => {
      // video.setAttribute('autoplay', '');
      // video.setAttribute('muted', '');
      // video.setAttribute('playsinline', true);
      log.log(navigator);
      log.log(navigator.mediaDevices);
      log.log(navigator.mediaDevices.getUserMedia);
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "user" } })
        .then(function(stream) {
          scanning = true;
          qrResult.hidden = true;
          btnScanQR.hidden = true;
          canvasElement.hidden = false;
          video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
          video.srcObject = stream;
          video.play();
          tick();
          scan();
        });
    };

    return () => {
      //delete video requirement
    };
  }, []);

  return (
    <>
      <div id="log"></div>
      <div id="container">
        <h1>QR Code Scanner</h1>
        <video id="qr-video"></video>

        <button id="btn-scan-qr" className="cursor-pointer">
          Begin Scanning!
        </button>

        <canvas className="m-auto w-75" hidden="" id="qr-canvas"></canvas>

        <div className="text-xl my-4 mx-auto p-4 bg-white" id="qr-result" hidden="">
          <b>Data:</b> <span id="outputData"></span>
        </div>
      </div>
    </>
    );
}
