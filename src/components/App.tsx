import * as React from 'react';
import { LocalVideoEffectors, ModelConfigMobileNetV1, ModelConfigResNet, ModelConfigMobileNetV1_05, ForegroundType,
  getDeviceLists } from 'local-video-effector'
import { Icon, Label, Dropdown } from 'semantic-ui-react';

/**
 * Main Component
 */


export enum ForegroundSize{
  Full,
  Large,
  Small,
}
export enum ForegroundPosition{
  BottomLeft,
  BottomRight,
}


export interface AppState {
  foregroundSizeChange : boolean,
  foregroundSize       : ForegroundSize,
  foregroundPosition   : ForegroundPosition,
  selectedDeviceID     : string,
  selectedResolution   : number,
}


class App extends React.Component {
  state: AppState = {
    foregroundSizeChange : false,
    foregroundSize       : ForegroundSize.Full,
    foregroundPosition   : ForegroundPosition.BottomRight,
    selectedDeviceID     : "",
    selectedResolution   : 720
  }


  localCanvasRef = React.createRef<HTMLCanvasElement>()
  localVideoRef  = React.createRef<HTMLVideoElement>()
  localVideoEffectors : LocalVideoEffectors|null = null
  fileInputRef      = React.createRef<HTMLInputElement>()
  shareVideoElementRef =  React.createRef<HTMLVideoElement>()

  monitorCanvasRef = React.createRef<HTMLCanvasElement>()

  isIPhone = false
  imageCapture:any

  private virtualBGImage        = document.createElement("img")

  private dropdownVideoInput:any = null
  private dropdownVideoResolution:any = null

  componentDidMount() {


    const model = new URL(window.location.href).searchParams.get('model');
    const blurString = new URL(window.location.href).searchParams.get('blur')
    let blur = 0
    if(model === 'MobileNetV1'){
      this.localVideoEffectors = new LocalVideoEffectors(ModelConfigMobileNetV1)
    }else if (model === 'MobileNetV1_05'){
      this.localVideoEffectors = new LocalVideoEffectors(ModelConfigMobileNetV1_05)
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
    this.localVideoEffectors.virtualBackgroundEnabled   = false
//    this.localVideoEffectors.virtualBackgroundImagePath = "./resources/vbg/pic1.jpg"
    this.virtualBGImage.src = "./resources/vbg/pic1.jpg"
    this.localVideoEffectors.virtualBackgroundImageElement = this.virtualBGImage
    this.localVideoEffectors.maskBlurAmount             = blur
    this.localVideoEffectors.monitorCanvas              = this.monitorCanvasRef.current!
    this.localVideoEffectors.selectInputVideoDevice("").then(() => {
      // this.media = this.localVideoEffectors!.getMediaStream()
      requestAnimationFrame(() => this.drawVideoCanvas())
      //setTimeout(this.drawVideoCanvas, 100);
    })

    getDeviceLists().then((deviceLists)=>{
      console.log("----------------",deviceLists)

      // Video Input Selection
      const videoInputList:any = []
      deviceLists["videoinput"].map((videoInput)=>{
        console.log("----------------", videoInput)
        videoInputList.push({
            key: videoInput.label,
            text: videoInput.label,
            value: videoInput.deviceId,
        })
      })
      this.dropdownVideoInput = <Dropdown placeholder='State' search selection options={videoInputList} onChange={(e,v)=>{
        this.setState({selectedDeviceID:v.value})
        this.localVideoEffectors?.selectInputVideoDevice(v.value as string).then(() => {
          // this.media = this.localVideoEffectors!.getMediaStream()
        })        
      }} />

      // Video Resolution
      const videoResolutionList:any = []
      const reslist = [360, 540, 720, 1280]
      reslist.map((videoResolution)=>{
        videoResolutionList.push({
            key: videoResolution+"p",
            text: videoResolution+"p",
            value: videoResolution,
        })
      })
      this.dropdownVideoResolution = <Dropdown placeholder='State' search selection options={videoResolutionList} onChange={(e,v)=>{
        this.setState({selectedResolution:v.value})
      }} />
      
      this.setState({})
      
    })
  }

  enter:number=0
  exit:number=0
  // interval is longer when portrait than when landscape. I don't know the reason...
  drawVideoCanvas = async () => {
    this.enter  = performance.now();
    const interval = (this.enter - this.exit);
    const intervalStr = interval.toFixed(3);
    //console.log(`call: ${intervalStr} ms`);
    const start = performance.now();

    if (this.localCanvasRef.current !== null) {
      const width  = this.state.selectedResolution
//      const width  = 480
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

    requestAnimationFrame(() => this.drawVideoCanvas())
    //setTimeout(this.drawVideoCanvas, 100);

  }

  unsetBGImage = () =>{
    this.localVideoEffectors!.virtualBackgroundEnabled   = false
  }
  setBGImage = () => {
    this.localVideoEffectors!.virtualBackgroundEnabled   = true
    this.localVideoEffectors!.virtualBackgroundImageElement = this.virtualBGImage
    this.setState({foregroundSizeChange: true})
    // this.setState({foregroundSizeChange: false})
    this.shareVideoElementRef.current!.pause()
  }

  // For SharedDisplay
  sharedDisplaySelected = async() => {
    this.localVideoEffectors!.virtualBackgroundEnabled   = true
    const streamConstraints = {
        // frameRate: {
        //     max: 15,
        // },
    }
    // // @ts-ignore https://github.com/microsoft/TypeScript/issues/31821
    // navigator.mediaDevices.getDisplayMedia().then(media => {
    //   this.localVideoEffectors!.virtualBackgroundStream = media
    //   this.setState({foregroundSizeChange: true})
    //   this.shareVideoElementRef.current!.pause()
    // })



    // @ts-ignore https://github.com/microsoft/TypeScript/issues/31821
    const media = await navigator.mediaDevices.getDisplayMedia(
      {video:true}
    );
    this.localVideoEffectors!.virtualBackgroundStream = media
    this.setState({foregroundSizeChange: true})
    this.shareVideoElementRef.current!.pause()

  }

  // For SharedVideo
  sharedVideoSelected = (e: any) => {
    this.localVideoEffectors!.virtualBackgroundEnabled   = true
    const path = URL.createObjectURL(e.target.files[0]);
    console.log(path)
    this.shareVideoElementRef.current!.src = path
    this.shareVideoElementRef.current!.play()

    setTimeout(
      async () => {
          // @ts-ignore
          const mediaStream: MediaStream = await this.shareVideoElementRef.current!.captureStream()
          this.localVideoEffectors!.virtualBackgroundStream = mediaStream
          this.setState({foregroundSizeChange: true})
        }
      , 3000); // I don't know but we need some seconds to restart video share....
  }

  


//  media:MediaStream|null = null
  render() {
    if(navigator.userAgent.indexOf("iPhone") >= 0){
      this.isIPhone = true
    }

    if(this.isIPhone===false || true){

      if(this.state.foregroundSize === ForegroundSize.Full){
        this.localVideoEffectors?.setForegroundPosition(0.0, 0.0, 1, 1)
      }else if(this.state.foregroundSize === ForegroundSize.Large){
        if(this.state.foregroundPosition === ForegroundPosition.BottomLeft){
          this.localVideoEffectors?.setForegroundPosition(0.0, 0.4, 0.6, 0.6)
        }else{
          this.localVideoEffectors?.setForegroundPosition(0.4, 0.4, 0.6, 0.6)
        }
      }else if (this.state.foregroundSize === ForegroundSize.Small){
        if(this.state.foregroundPosition === ForegroundPosition.BottomLeft){
          this.localVideoEffectors?.setForegroundPosition(0.0, 0.7, 0.3, 0.3)
        }else{
          this.localVideoEffectors?.setForegroundPosition(0.7, 0.7, 0.3, 0.3)
        }
      }



      return (
        <div style={{ width: "1280px", margin: "auto" }}>
          {
            this.isIPhone? 
            <video ref={this.localVideoRef} style={{ display: "block", width: "160px", margin: "auto" }} playsInline />
            :
            <video ref={this.shareVideoElementRef} width="1280px" style={{ display: "none", width: "1280px", margin: "auto" }} playsInline />
          }
          <canvas ref={this.localCanvasRef}  width="1280px"  style={{ display: "block", width: "1280px", margin: "auto" }} />

          <div style={{paddingLeft:"10px"}}>
            <Label as="a" onClick={() => { this.unsetBGImage() }}>
              <Icon name="share square outline" size="large"/>
              NoVBG
            </Label>

            <Label as="a" onClick={() => { this.setBGImage() }}>
              <Icon name="image outline" size="large"/>
              Image
            </Label>

            {this.isIPhone?
              <Label/>
              :
              <Label as="a" onClick={() => { this.sharedDisplaySelected()}}>
                <Icon name="share square outline" size="large"/>
                screen
              </Label>
            }
            <Label as="a" onClick={() => this.fileInputRef.current!.click()} >
              <Icon name="play" size="large"/>
              movie
            </Label>

            <input
                ref={this.fileInputRef}
                type="file"
                hidden
                onChange={(e) => this.sharedVideoSelected(e)}
            />            

            <Label as="a" onClick={() => { 
              this.localVideoEffectors!.foregroundType = ForegroundType.NONE
              }} >
              <Icon name="chess board" size="large"/>
              none
            </Label> 
            <Label as="a" onClick={() => { 
              this.localVideoEffectors!.foregroundType = ForegroundType.Canny
              }} >
              <Icon name="chess board" size="large"/>
              canny
            </Label> 
            <Label as="a" onClick={() => { 
              this.localVideoEffectors!.foregroundType = ForegroundType.Ascii
              }} >
              <Icon name="chess board" size="large"/>
              ascii
            </Label> 

          </div>          

          <div style={{paddingLeft:"10px"}}>
            <Icon basic link name="long arrow alternate left"  size="large"
                onClick={() => { 
                  this.setState({foregroundPosition: ForegroundPosition.BottomLeft})}
                }
            />
            <Icon basic link name="long arrow alternate right"  size="large"
                onClick={() => {
                  this.setState({foregroundPosition: ForegroundPosition.BottomRight})}
                }
            />
            <Icon basic link name="square outline"  size="large"
                onClick={() => {
                  this.setState({foregroundSize: ForegroundSize.Full})}
                }
            />
            <Icon basic link name="expand"  size="large"
                onClick={() => {
                  this.setState({foregroundSize: ForegroundSize.Large})}
                }
            />
            <Icon basic link name="compress"  size="large"
                onClick={() => {
                  this.setState({foregroundSize: ForegroundSize.Small})}
                }
            />
          </div>

          {
            this.isIPhone?
            <input type="button" value="start" onClick={(e)=>{
              navigator.mediaDevices.getUserMedia({              
                audio: false,
                video: { 
                  // deviceId: deviceId,
                  width: { ideal: 1280 },
                  height: { ideal: 720 }
                }
              }).then(stream => {
                if (stream !== null) {
                  this.localVideoRef.current!.srcObject = stream
                  this.localVideoRef.current!.play()
                  return new Promise((resolve, reject) => {
                    this.localVideoRef.current!.onloadedmetadata = () => {
                      resolve();
                    };
                  });
                }
              })
              this.localVideoEffectors!.setVideoElement(this.localVideoRef.current!)
            }}
            />
            :
            <div/>

          }



          {/* <canvas ref={this.monitorCanvasRef}  width="720px" height="540px" style={{ display: "block", width: "1280px", margin: "auto" }} /> */}
          <div>
            <span style={{marginLeft:"10px"}}>
            VideoSource{this.dropdownVideoInput} 
            </span>
            <span style={{marginLeft:"30px"}}>
            VideoResolution{this.dropdownVideoResolution}
            </span>
          </div>
          <div>
            <span style={{marginLeft:"10px"}}>
              <a href="https://www.flect.co.jp/">powered by FLECT, CO., LTD.</a>
            </span>
            <span style={{marginLeft:"30px"}}>
              <a href="https://github.com/FLECT-DEV-TEAM/LocalVideoEffector#readme">github</a>, 
            </span>
            <span style={{marginLeft:"30px"}}>
              <a href="https://www.npmjs.com/package/local-video-effector">npm</a>,
            </span>
          </div>
        </div>
      )
    }else{
      return (
        <div style={{ width: "720px", margin: "auto" }}>
          {/* <video ref={this.localVideoRef} style={{ display: "block", width: "720px", margin: "auto" }} playsInline /> */}
          <video ref={this.localVideoRef} style={{ display: "block", width: "160px", margin: "auto" }} playsInline />
          <canvas ref={this.localCanvasRef}  style={{ display: "block", width: "720px", margin: "auto" }} />
          <input type="button" value="start" onClick={(e)=>{
            navigator.mediaDevices.getUserMedia({              
              audio: false,
              video: { 
                // deviceId: deviceId,
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }
            }).then(stream => {
              if (stream !== null) {
                this.localVideoRef.current!.srcObject = stream
                this.localVideoRef.current!.play()
                return new Promise((resolve, reject) => {
                  this.localVideoRef.current!.onloadedmetadata = () => {
                    resolve();
                  };
                });
              }
            })
            this.localVideoEffectors!.setVideoElement(this.localVideoRef.current!)
          }}
          />




          <div style={{paddingLeft:"10px"}}>
            <Label as="a" onClick={() => { this.unsetBGImage() }}>
              <Icon name="share square outline" size="large"/>
              NoVBG
            </Label>

            <Label as="a" onClick={() => { this.setBGImage() }}>
              <Icon name="image outline" size="large"/>
              Image
            </Label>

            <Label as="a" onClick={() => { this.sharedDisplaySelected()}}>
              <Icon name="share square outline" size="large"/>
              screen
            </Label>

            <Label as="a" onClick={() => this.fileInputRef.current!.click()} >
              <Icon name="play" size="large"/>
              movie
            </Label>

            <input
                ref={this.fileInputRef}
                type="file"
                hidden
                onChange={(e) => this.sharedVideoSelected(e)}
            />            

            <Label as="a" onClick={() => { 
              this.localVideoEffectors!.foregroundType = ForegroundType.NONE
              }} >
              <Icon name="chess board" size="large"/>
              none
            </Label> 
            <Label as="a" onClick={() => { 
              this.localVideoEffectors!.foregroundType = ForegroundType.Canny
              }} >
              <Icon name="chess board" size="large"/>
              canny
            </Label> 
            <Label as="a" onClick={() => { 
              this.localVideoEffectors!.foregroundType = ForegroundType.Ascii
              }} >
              <Icon name="chess board" size="large"/>
              ascii
            </Label> 

          </div>          

          <div style={{paddingLeft:"10px"}}>
            <Icon basic link name="long arrow alternate left"  size="large"
                onClick={() => { 
                  this.setState({foregroundPosition: ForegroundPosition.BottomLeft})}
                }
            />
            <Icon basic link name="long arrow alternate right"  size="large"
                onClick={() => {
                  this.setState({foregroundPosition: ForegroundPosition.BottomRight})}
                }
            />
            <Icon basic link name="square outline"  size="large"
                onClick={() => {
                  this.setState({foregroundSize: ForegroundSize.Full})}
                }
            />
            <Icon basic link name="expand"  size="large"
                onClick={() => {
                  this.setState({foregroundSize: ForegroundSize.Large})}
                }
            />
            <Icon basic link name="compress"  size="large"
                onClick={() => {
                  this.setState({foregroundSize: ForegroundSize.Small})}
                }
            />
          </div>

          <div>
            <a href="https://github.com/FLECT-DEV-TEAM/LocalVideoEffector#readme">github</a>
            <br/>
            <a href="https://www.npmjs.com/package/local-video-effector">npm</a>
            <br/>
            <a href="https://www.flect.co.jp/">powered by FLECT, CO., LTD.</a>
          </div>
        </div>


      )

    }
  }
}

export default App;