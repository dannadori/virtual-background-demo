import * as React from 'react';
import { GlobalState } from '../reducers';
import * as bodyPix from '@tensorflow-models/body-pix';

import { getVideoDevice } from './utils';


interface AppState{
    localVideoWidth   : number
    localVideoHeight  : number
    inputVideoStream  : MediaStream | null
    virtualBackground : string
}

/**
 * Main Component
 */
class App extends React.Component {
    localVideoRef = React.createRef<HTMLVideoElement>()
    localVideoCanvasRef = React.createRef<HTMLCanvasElement>()
    localVideoMaskCanvasRef = React.createRef<HTMLCanvasElement>()
    localVideoMaskCanvasRef2 = React.createRef<HTMLCanvasElement>()
    shareVideoRef = React.createRef<HTMLVideoElement>()
    shareVideoRef2 = React.createRef<HTMLVideoElement>()
    localVideoMaskBackgroundRef = React.createRef<HTMLImageElement>()
    localVideoMaskBGCanvasRef = React.createRef<HTMLCanvasElement>()

    bodyPix: bodyPix.BodyPix|null = null
    state:AppState = {
        localVideoWidth  : 0,
        localVideoHeight : 0,
        inputVideoStream : null,
        virtualBackground: "/resources/vbg/pic1.jpg"
    }

    componentDidMount() {
        const props = this.props as any
        const gs = this.props as GlobalState
    
        const webCamPromise = getVideoDevice().then(stream => {
          if (stream !== null) {
            this.state.localVideoWidth = stream.getVideoTracks()[0].getSettings().width ? stream.getVideoTracks()[0].getSettings().width! : 0
            this.state.localVideoHeight = stream.getVideoTracks()[0].getSettings().height ? stream.getVideoTracks()[0].getSettings().height! : 0
            console.log("getVideoTrack", this.state.localVideoWidth, this.state.localVideoHeight)
            this.localVideoRef.current!.srcObject = stream;
            this.state.inputVideoStream = stream
            return new Promise((resolve, reject) => {
              this.localVideoRef.current!.onloadedmetadata = () => {
                resolve();
              };
            });
          }
        });
        const netPromise = bodyPix.load();
        Promise.all([netPromise, webCamPromise, ])
          .then(([bodyPix, res])  => {
              this.bodyPix = bodyPix as bodyPix.BodyPix
            requestAnimationFrame(() => this.drawVideoCanvas())
          })
          .catch(error => {
            console.error("not find... ", error);
          });
    }


    drawVideoCanvas = () => {
        const props = this.props as any
        const bodyPixNet: bodyPix.BodyPix = this.bodyPix!
        const gs = this.props as GlobalState
    
        const localVideo = this.localVideoRef.current!               // video
        const localVideoCanvas = this.localVideoCanvasRef.current!         // original image canvas from video
        const localVideoMaskCanvas = this.localVideoMaskCanvasRef.current!     // temporary canvas for segmentation
        const localVideoMaskCanvas2 = this.localVideoMaskCanvasRef2.current!    // to be displayed
        const localVideoMaskBackgroundRef = this.localVideoMaskBackgroundRef.current! // background for virtual background (image)
        const localVideoMaskBGCanvasRef = this.localVideoMaskBGCanvasRef.current!   // background for virtual background (canvas)
    
        const updateInterval = 100

        //// (1) Generate input image for segmentation.
        // To avoid to be slow performace, resolution is limited when using virtual background
        localVideoCanvas.width = 640
        localVideoCanvas.height = (this.localVideoCanvasRef.current!.width / 16) * 9
        // localVideoCanvas.width  = this.state.localVideoWidth
        // localVideoCanvas.height = this.state.localVideoHeight

        const ctx = localVideoCanvas.getContext("2d")!
        ctx.drawImage(localVideo, 0, 0, localVideoCanvas.width, localVideoCanvas.height)


        //// (2) Segmentation & Mask
        //// (2-1) Segmentation.
        bodyPixNet.segmentPerson(localVideoCanvas).then((segmentation) => {
        //// (2-2) Generate mask
        const foregroundColor = { r: 0, g: 0, b: 0, a: 0 };
        const backgroundColor = { r: 255, g: 255, b: 255, a: 255 };
        const backgroundMask = bodyPix.toMask(segmentation, foregroundColor, backgroundColor);
        const opacity = 1.0;
        const maskBlurAmount = 2;
        const flipHorizontal = false;
        bodyPix.drawMask(localVideoMaskCanvas, localVideoCanvas, backgroundMask, opacity, maskBlurAmount, flipHorizontal);

        const maskedImage = localVideoMaskCanvas.getContext("2d")!.getImageData(0, 0, localVideoMaskCanvas.width, localVideoMaskCanvas.height)

        //// (2-3) Generate background
        localVideoMaskBackgroundRef.src = this.state.virtualBackground
        localVideoMaskBGCanvasRef.width = maskedImage.width
        localVideoMaskBGCanvasRef.height = maskedImage.height
        const ctx = localVideoMaskBGCanvasRef.getContext("2d")!
        ctx.drawImage(localVideoMaskBackgroundRef, 0, 0, localVideoMaskBGCanvasRef.width, localVideoMaskBGCanvasRef.height)
        const bgImageData = ctx.getImageData(0, 0, localVideoMaskBGCanvasRef.width, localVideoMaskBGCanvasRef.height)

        //// (2-4) merge background and mask
        const pixelData = new Uint8ClampedArray(maskedImage.width * maskedImage.height * 4)
        for (let rowIndex = 0; rowIndex < maskedImage.height; rowIndex++) {
            for (let colIndex = 0; colIndex < maskedImage.width; colIndex++) {
            const pix_offset = ((rowIndex * maskedImage.width) + colIndex) * 4
            if (maskedImage.data[pix_offset] === 255 &&
                maskedImage.data[pix_offset + 1] === 255 &&
                maskedImage.data[pix_offset + 2] === 255 &&
                maskedImage.data[pix_offset + 3] === 255
            ) {
                pixelData[pix_offset] = bgImageData.data[pix_offset]
                pixelData[pix_offset + 1] = bgImageData.data[pix_offset + 1]
                pixelData[pix_offset + 2] = bgImageData.data[pix_offset + 2]
                pixelData[pix_offset + 3] = bgImageData.data[pix_offset + 3]
            } else {
                pixelData[pix_offset]     = maskedImage.data[pix_offset]
                pixelData[pix_offset + 1] = maskedImage.data[pix_offset + 1]
                pixelData[pix_offset + 2] = maskedImage.data[pix_offset + 2]
                pixelData[pix_offset + 3] = maskedImage.data[pix_offset + 3]
            }
            }
        }
        const imageData = new ImageData(pixelData, maskedImage.width, maskedImage.height);

        //// (2-5) output
        localVideoMaskCanvas2.width = imageData.width
        localVideoMaskCanvas2.height = imageData.height
        localVideoMaskCanvas2.getContext("2d")!.putImageData(imageData, 0, 0)
        })
        // setTimeout(this.drawVideoCanvas, updateInterval);
        requestAnimationFrame(() => this.drawVideoCanvas())

    }
    
    
    render() {

    return (
        <div style={{ width: "100%", margin: "auto" }}>
        {/* for local video (and virtual background) */}
        <video ref={this.localVideoRef} style={{ display: "None" }} autoPlay />
        <canvas ref={this.localVideoCanvasRef} style={{ display: "None" }} width="100%" height="100%" />
        <canvas ref={this.localVideoMaskCanvasRef} width="100%" height="100%" style={{ display: "None" }} />
        <canvas ref={this.localVideoMaskCanvasRef2} width="100%" height="100%" style={{ display: "block" }} />
        <img ref={this.localVideoMaskBackgroundRef} src={this.state.virtualBackground} style={{ display: "None" }} />
        <canvas ref={this.localVideoMaskBGCanvasRef} style={{ display: "None" }} />

        </div>
    )
    }    
}


export default App;