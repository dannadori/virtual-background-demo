import * as React from 'react';
import { LocalVideoEffectors, ModelConfigMobileNetV1, ModelConfigResNet } from 'local-video-effector'


/**
 * Main Component
 */
class App extends React.Component {

  localCanvasRef = React.createRef<HTMLCanvasElement>()
  localVideoEffectors : LocalVideoEffectors|null =null
  componentDidMount() {
    const model = new URL(window.location.href).searchParams.get('model');
    const blurString = new URL(window.location.href).searchParams.get('blur')
    let blur = 0
    if(model === 'MobileNetV1'){
      this.localVideoEffectors = new LocalVideoEffectors(ModelConfigMobileNetV1)
    }else if (model === 'ResNet'){
      this.localVideoEffectors = new LocalVideoEffectors(ModelConfigResNet)
    }else{
      this.localVideoEffectors = new LocalVideoEffectors(null)
    }
    if(blurString === null){
      blur = 0
    }else{
      blur = parseInt(blurString)
    }

    this.localVideoEffectors.cameraEnabled              = true
    this.localVideoEffectors.virtualBackgroundEnabled   = true
    this.localVideoEffectors.virtualBackgroundImagePath = "/resources/vbg/pic1.jpg"
    this.localVideoEffectors.maskBlurAmount             = blur
    this.localVideoEffectors.canny                      = false
    this.localVideoEffectors.selectInputVideoDevice("").then(() => {
      //requestAnimationFrame(() => this.drawVideoCanvas())
      setTimeout(this.drawVideoCanvas, 100);
    })
  }

  enter:number=0
  exit:number=0
  // interval is longer when portrait than when landscape. I don't know the reason...
  drawVideoCanvas = () => {
    this.enter  = performance.now();
    const interval = (this.enter - this.exit);
    const intervalStr = interval.toFixed(3);
    //console.log(`call: ${intervalStr} ms`);
    const start = performance.now();


    if (this.localCanvasRef.current !== null) {
      const width  = 480
      const height = (width / this.localCanvasRef.current.width ) * this.localCanvasRef.current.height
      this.localVideoEffectors!.doEffect(width,height)

      if (this.localVideoEffectors!.outputWidth !== 0 && this.localVideoEffectors!.outputHeight !== 0) {
        this.localCanvasRef.current.height = (this.localCanvasRef.current.width / this.localVideoEffectors!.outputWidth) * this.localVideoEffectors!.outputHeight
        const ctx = this.localCanvasRef.current.getContext("2d")!
        ctx.drawImage(this.localVideoEffectors!.outputCanvas, 0, 0, this.localCanvasRef.current.width, this.localCanvasRef.current.height)
      }
    }
    const end = performance.now();
    const elapsed = (end - start);
    const elapsedStr = elapsed.toFixed(3);
    //console.log(`DRAWING: ${elapsedStr} ms`);
    this.exit  = performance.now();
    //requestAnimationFrame(() => this.drawVideoCanvas())
    setTimeout(this.drawVideoCanvas, 100);

  }


  render() {
    return (
      <div style={{ width: "480px", margin: "auto" }}>
        <canvas ref={this.localCanvasRef}  style={{ display: "block", width: "480px", margin: "auto" }} />
      </div>
    )
  }
}

export default App;