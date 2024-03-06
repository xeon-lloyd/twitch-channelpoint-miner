const twitch = {
    clientId: "kimne78kx3ncx6brgo4mv6wki5h1ko" //트위치 웹 클라이언트 id (수정 안해도 됨)
}

/* 유저 설정 */
const user = {
    channel: "twichId", //필수 (=트위치 아이디)
    auth: "OAuth xxxxxxx", //필수 (=OAuth 쿠키)
    xDeviceId: "xxxxxxxxx", //선택
    clientIntegrity: "v4.public.xxxxxxx" //선택
}

/* 채굴 대상 스트리머(아이디) */
const streamerList = [
    'streamer1',
    'streamer2',
    'streamer3',
]

/* 로깅 설정 */
const logging = {
    startMine: true, // 채굴 시작
    endMine: true, // 채굴 끝
    earnedPoint: false, // 포인트 획득
    systemMessage: true, // 시스템 메세지
    systemDebug: true // 디버그 메세지(에러 메세지)
}





/* // system functions // */
const request = require('request-promise');
const cron = require('node-cron');

/* 해당 스트리머의 방송이 온라인인지 */
async function isOnline(streamer){
    return await getStreamId(streamer)!=undefined;
}

/* 아이디로 고유번호 가져오기 */
async function getChannelId(channel){
    try{
        let res = await request.post({
            uri: 'https://gql.twitch.tv/gql',
            method: 'POST',
            headers: {
                'Client-Id': twitch.clientId,
                'Authorization': user.auth
            },
            body: {
                "operationName": "ReportMenuItem",
                "extensions": {
                    "persistedQuery": {
                        "version": 1,
                        "sha256Hash": "8f3628981255345ca5e5453dfd844efffb01d6413a9931498836e6268692a30c",
                    }
                },
                "variables": {"channelLogin": channel}
            },
            json: true
        });
    
        return res?.data?.user?.id;
    }catch(e){
        if(logging.systemDebug) console.log(e.statusCode)
        if(logging.systemDebug) console.log(e.error)

        return false;
    }    
}


/* 스트림 ID 가져오기 (오프라인이면 undefined 리턴) */
async function getStreamId(streamer){
    try{
        let res = await request.post({
            uri: 'https://gql.twitch.tv/gql',
            method: 'POST',
            headers: {
                'Client-Id': twitch.clientId,
                'Authorization': user.auth
            },
            body: {
                "operationName": "WithIsStreamLiveQuery",
                "variables": {
                    "id": streamer.id
                },
                "extensions": {
                    "persistedQuery": {
                        "version": 1,
                        "sha256Hash": "04e46329a6786ff3a81c01c50bfa5d725902507a0deb83b0edbf7abe7a3716ea"
                    }
                }
            },
            json: true
        });
        
        return res?.data?.user?.stream?.id;
    }catch(e){
        if(logging.systemDebug) console.log(e.statusCode)
        if(logging.systemDebug) console.log(e.error)

        return false;
    }
}



/* 트위치에 현재 시청중이라고 요청 보내기 */
async function sendMinuteWatchedEvents(streamer){
    try{
        await request.post(streamer.minuteWatchedRequests.url, {
            form: streamer.minuteWatchedRequests.payload
        })
    }catch(e){
        if(logging.systemDebug) console.log(e.statusCode)
        if(logging.systemDebug) console.log(e.error)

        return false;
    }
    
    claimSpecialPoint(streamer);
}

/* 현재 시청중이라는것을 request하는 form data 작성하기 */
async function updateMinuteWatchedEventRequest(streamer){
    let eventProperties = {
        "channel_id": streamer.id,
        "broadcast_id": await getStreamId(streamer),
        "player": "site",
        "user_id": await getChannelId(user.channel)
    }
    let minuteWatched = [{"event": "minute-watched", "properties": eventProperties}]
    let jsonEvent = JSON.stringify(minuteWatched)
    let afterBase64 = btoa(jsonEvent);
    let payload = {"data": afterBase64}
    let url = await getMinuteWatchedRequestUrl(streamer)

    streamer.minuteWatchedRequests = {
        url,
        payload
    }
}

/* 현재 시청중이라는것을 request하는 url 알아오기 */
async function getMinuteWatchedRequestUrl(streamer){
    try{
        let mainPage = await request.get(`https://twitch.tv/${streamer.channel}`);
        let settingUrl = mainPage.match(/(https\:\/\/static\.twitchcdn\.net\/config\/settings.*?js)/)[1];
    
        let settingRequest = await request.get(settingUrl);
        let minuteWatchedRequestUrl = settingRequest.match(/"spade_url":"(.*?)"/);

        return minuteWatchedRequestUrl[1]
    }catch(e){
        if(logging.systemDebug) console.log(e.statusCode)
        if(logging.systemDebug) console.log(e.error)

        return false;
    }
}


/* 버튼 눌러서 포인트 얻는거 */
async function claimSpecialPoint(streamer){
    let res;
    try{
        res = await request.post({
            uri: 'https://gql.twitch.tv/gql',
            method: 'POST',
            headers: {
                'Client-Id': twitch.clientId,
                'Authorization': user.auth
            },
            body: {
                "operationName": "ChannelPointsContext",
                "variables": {
                    "channelLogin": streamer.channel
                },
                "extensions": {
                    "persistedQuery": {
                        "version": 1,
                        "sha256Hash": "9988086babc615a918a1e9a722ff41d98847acac822645209ac7379eecb27152"
                    }
                }
            },
            json: true
        });
    }catch(e){
        if(logging.systemDebug) console.log(e.statusCode)
        if(logging.systemDebug) console.log(e.error)

        return false;
    }

    let pointBalance = res?.data?.community?.channel?.self?.communityPoints?.balance;
    if(streamer.pointBalance==null){
        streamer.pointBalance = pointBalance;
        streamer.startPointBalance = pointBalance;
    }
    
    if(streamer.pointBalance != pointBalance){
        if(logging.earnedPoint) console.log(`${streamer.channel}에서 ${pointBalance-streamer.pointBalance}포인트 채굴됨 (전체 ${pointBalance.format()})`)
        streamer.pointBalance = pointBalance;
    }

    let pointClaim = res?.data?.community?.channel?.self?.communityPoints?.availableClaim
    if(pointClaim==null){
        return;
    }

    //요청 가능한 claim이 있으면 처리
    try{
        res = await request.post({
            uri: 'https://gql.twitch.tv/gql',
            method: 'POST',
            headers: {
                'Client-Id': twitch.clientId,
                'Authorization': user.auth,
                'Client-Integrity': user.clientIntegrity,
                'X-Device-Id': user.xDeviceId
            },
            body: {
                "operationName": "ClaimCommunityPoints",
                "variables": {
                    "input": {
                        "channelID": streamer.id,
                        "claimID": pointClaim.id
                    }
                },
                "extensions": {
                    "persistedQuery": {
                        "version": 1,
                        "sha256Hash": "46aaeebe02c99afdf4fc97c7c0cba964124bf6b0af229395f1f6d1feed05b3d0"
                    }
                }
            },
            json: true
        });
    }catch(e){
        if(logging.systemDebug) console.log(e.statusCode)
        if(logging.systemDebug) console.log(e.error)

        return false;
    }
}


/* 스트리머 아이디를 스트리머 고유번호로 */
async function streamerListConverter(){
    for(let i=0;i<streamerList.length;i++){
        let channel = streamerList[i];
        streamerList[i] = {
            channel: channel,
            id: await getChannelId(channel),
            minuteWatchedRequests: null,
            isOnline: false,
            startAt: null,
            startPointBalance: null,
            pointBalance: null
        }
    }
}


/* 방송이 온라인인지 감시하는 매서드 */
async function observeStreamOnline(){
    for(let i=0;i<streamerList.length;i++){
        let streamer = streamerList[i];
        let isStreamOnline = await isOnline(streamer)
        
        if(isStreamOnline && !streamer.isOnline){ //온라인인데 isOnline이 false이면 시작
            streamer.isOnline = true;
            streamer.startAt = new Date();
            await updateMinuteWatchedEventRequest(streamer);
            await sendMinuteWatchedEvents(streamer)
            if(logging.startMine) console.log(`=== ${streamer.channel}님이 온라인으로 감지되어 채굴을 시작합니다 ===`)

        }else if(!isStreamOnline && streamer.isOnline){ //오프라인인데 isOnline이 true이면 종료
            if(logging.endMine){
                console.log(`=== ${streamer.channel}님이 오프라인으로 감지되어 채굴을 종료합니다 ===`)

                let startAt = streamer.startAt.stringFormat('m-d h:i');
                let endAt = new Date().stringFormat('m-d h:i');
                let duration = ((new Date() - new Date(streamer.startAt))/1000).secToTime();
                let minedPoint = streamer.pointBalance - streamer.startPointBalance;

                console.log(`${startAt}부터 ${endAt}까지 ${duration}동안 채굴된 포인트는 ${minedPoint.format()}입니다`)
                console.log("=======       =======")
            }

            streamer.isOnline = false;
            streamer.pointBalance = null;
            streamer.startPointBalance = null;
            streamer.startAt = null;
            streamer.minuteWatchedRequests = null;
        }
    }
}

/* 채굴 로직 실행 매서드(주기적 실행) */
async function executeMine(){
    for(let i=0;i<streamerList.length;i++){
        if(!streamerList[i].isOnline) continue;

        await sendMinuteWatchedEvents(streamerList[i]);
    }
}

async function init(){
    if(logging.systemMessage) console.log("채굴기가 실행 되었습니다.");

    /* 5분마다 방송이 온라인인지 모니터링 */
    cron.schedule('0 */5 * * * * *', observeStreamOnline)

    /* 1분마다 포인트 채굴 로직 실행 */
    cron.schedule('0 * * * * * *', executeMine);

    await streamerListConverter();
    await observeStreamOnline();
    await executeMine();

    process.stdin.resume();
}
init();