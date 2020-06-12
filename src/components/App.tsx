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
    this.localVideoEffectors.selectInputVideoDevice("").then(() => {
      requestAnimationFrame(() => this.drawVideoCanvas())
    })
  }

  drawVideoCanvas = () => {
    this.localVideoEffectors!.doEffect(480,320)
    if (this.localCanvasRef.current !== null) {
      if (this.localVideoEffectors!.outputWidth !== 0 && this.localVideoEffectors!.outputHeight !== 0) {
        this.localCanvasRef.current.height = (this.localCanvasRef.current.width / this.localVideoEffectors!.outputWidth) * this.localVideoEffectors!.outputHeight
        const ctx = this.localCanvasRef.current.getContext("2d")!
        ctx.drawImage(this.localVideoEffectors!.outputCanvas, 0, 0, this.localCanvasRef.current.width, this.localCanvasRef.current.height)
      }
    }
    requestAnimationFrame(() => this.drawVideoCanvas())
  }


  render() {
    return (
      <div style={{ width: "100%", margin: "auto" }}>
        <canvas ref={this.localCanvasRef}  style={{ display: "block", width: "100%", margin: "auto" }} />
      </div>
    )
  }
}

export default App;