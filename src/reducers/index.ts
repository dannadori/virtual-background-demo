import { NO_DEVICE_SELECTED } from "../const"


interface StoreRoster{
    attendeeId     : string,
    baseAttendeeId : string,
    name           : string
}



export interface GlobalState {
    counter                           : number
    baseURL                           : string
    roomID                            : string
    userName                          : string
    userAttendeeId                    : string
    userBaseAttendeeId                : string
    region                            : string

    joinInfo                          : any

    inputAudioDevices                 : MediaDeviceInfo[]  | null
    inputVideoDevices                 : MediaDeviceInfo[]  | null
    inputVideoResolutions             : string[]
    outputAudioDevices                : MediaDeviceInfo[] | null
    selectedInputAudioDevice          : string
    selectedInputVideoDevice          : string
    selectedInputVideoResolution      : string
    selectedOutputAudioDevice         : string

    storeRoster                       : {[attendeeId:string]:StoreRoster}

}

export const initialState = {
    counter                             : 0,
    baseURL                             : "",
    roomID                              : "",
    userName                            : "",
    userAttendeeId                      : "",
    userBaseAttendeeId                  : "",
    region                              : "",

    joinInfo                            : null,
    meetingSessionConf                  : null,
    meetingSession                      : null,

    inputAudioDevices                   : null,
    inputVideoDevices                   : null,
    inputVideoResolutions               : ["360p", "540p", "720p"],
    outputAudioDevices                  : null,
    selectedInputAudioDevice            : NO_DEVICE_SELECTED,
    selectedInputVideoResolution        : NO_DEVICE_SELECTED,
    selectedInputVideoDevice            : NO_DEVICE_SELECTED,
    selectedOutputAudioDevice           : NO_DEVICE_SELECTED,


    storeRoster                         : {},

}


const reducer = (state: GlobalState = initialState, action: any) => {
    var gs: GlobalState = Object.assign({}, state)
    gs.counter++
    console.log(state, action)
    return gs
}

export default reducer;
