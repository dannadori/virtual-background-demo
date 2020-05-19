/**
 * Not used.
 * @param kind 
 */
export const getDeviceList = async (kind:string) =>{
    const list = await navigator.mediaDevices.enumerateDevices()
    const res = list.filter((x:InputDeviceInfo | MediaDeviceInfo)=>{
        if(x.kind === kind){
            return true
        }else{
            return false
        }
    })
    console.log(kind, res)
}

export const getVideoDevice = async (): Promise<MediaStream|null>=>{

    const webCamPromise = navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            // video: { deviceId: target?.deviceId,
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    })
    return webCamPromise
}

