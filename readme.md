# ⛏️트위치 채널 포인트 채굴기

nodejs에서 트위치 채널 포인트를 채굴할 수 있는 단일 스크립트 어플리케이션 입니다.  
방송이 시작되면 자동으로 포인트 채굴을 시작합니다.
<br>

파이썬으로는 있었는데 nodejs 버전은 없길래 참고해서 만들었습니다.  
Reference: https://github.com/gottagofaster236/Twitch-Channel-Points-Miner<br>
<br>

## 📖사전지식
트위치 채널 포인트 획득방법에는 아래와 같은 방법이 있습니다.
 - **시청 포인트** : 방송 시청시 5분마다 획득하는 포인트 *(기본 10)*
 - **포인트 획득 버튼 클릭** : 채팅창에 표시되는 버튼을 클릭하여 획득하는 포인트 *(기본 50)*
 - **연속 시청 포인트** : 방송이 새로 시작됐을때 이전 방송이후 연속으로 시청시 획득하는 포인트 *(기본 300)*
<br>

## 🔧설정하기
app.js 파일에서 채굴 관련 정보를 설정할 수 있습니다.

### 👤유저 설정
```js
const user = {
    channel: "twichId", //필수 (=트위치 아이디)
    auth: "OAuth xxxxxxx", //필수 (=OAuth 쿠키)
    xDeviceId: "xxxxxxxxx", //선택
    clientIntegrity: "v4.public.xxxxxxx" //선택
}
```
채널 포인트 채굴을 원하는 본인의 트위치 계정 정보를 작성합니다.<br>

**✅필수 입력**  
```channel```은 본인의 트위치 아이디를 입력합니다.  
```auth```는 트위치 토큰을 입력합니다.  
트위치 토큰은 아래 과정을 통해서 획득할 수 있습니다.  
> 트위치 접속 > 개발자도구(F12) > ```응용 프로그램``` 탭 > ```쿠키``` > ```https://www.twitch.tv``` 클릭 > ```auth-token``` 값 복사

해당 값을 복사해서 auth의 xxxxxxx 대신 붙여넣습니다 *(OAuth 키워드 유지)*

**❌주의**  
트위치의 OAuth토큰은 해당 토큰을 가져온 브라우저가 로그아웃되면 무효화됩니다.
<br>

---

**⚡선택 입력**  
```xDeviceId```와 ```clientIntegrity```는 버튼 클릭을 통해서 얻는 포인트을 채굴할때 필요합니다.  
그러나 ```clientIntegrity```는 16시간마다 만료됩니다.  
따라서 버튼 클릭을 통해서 채굴되는 포인트를 채굴하기 위해서 ```clientIntegrity```를 매번 업데이트 해야합니다. *(버튼 채굴을 포기한다면 필요없음)*
 
```xDeviceId```와 ```clientIntegrity```는 아래 과정을 통해서 획득할 수 있습니다.  
> 트위치 접속 > 개발자도구(F12) > ```네트워크``` 탭 > 새로고침 > 필터에 ```gql``` 입력 > 목록에서 ```gql``` 클릭 > ```머리글``` 탭 > ```요청 헤더``` > ```X-Device-Id``` 값 복사, ```Client-Integrity``` 값 복사

두 값을 복사해서 각각의 대응되는 값을 붙여넣습니다.  
*X-Device-Id > xDeviceId*  
*Client-Integrity > clientIntegrity*  
<br>
❌요청 헤더에서 Client-Integrity가 존재하지 않을 수 있습니다. 리스트에서 다른 gql를 클릭하여 찾아주세요.
<br>

### 🔴채굴 스트리머 설정
```js
/* 채굴 대상 스트리머(아이디) */
const streamerList = [
    'streamer1',
    'streamer2',
    'streamer3',
]
```
채널 포인트 채굴을 원하는 스트리머의 아이디를 리스트로 작성합니다.<br>
<br>

### 📝로깅 설정(선택)
```js
/* 로깅 설정 */
const logging = {
    startMine: true, // 채굴 시작
    endMine: true, // 채굴 끝
    earnedPoint: false, // 포인트 획득
    systemMessage: true, // 시스템 메세지
    systemDebug: true // 디버그 메세지(에러 메세지)
}
```
채굴 과정에서 발생하는 각종 로그를 설정할 수 있습니다.<br>
로그는 콘솔에 출력됩니다.<br>
<br>

## ✨설치 및 실행
해당 스크립트는 nodejs를 통해서 실행됩니다.<br>
node를 통해서 app.js를 실행합니다.
```
node app.js
```
<br>

### 백그라운드 실행
pm2를 이용해서 백그라운드에서 스크립트를 실행할 수 있습니다.<br>
방송이 시작되면 자동으로 채굴을 시작합니다.<br>

pm2가 없다면 pm2를 설치합니다
```
npm install pm2
```

이후 해당 폴더에서 pm2 실행합니다
```
pm2 start
```
