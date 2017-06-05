## WebRTCのビデオチャット

## npmの初期化
npm init   

## 証明書の配置
プロジェクトのルートディレクトリに以下のファイル名で証明書、秘密鍵を配置してください。    
localhost.crt    
localhost.key

## turnサーバの情報を設定
このビデオチャットはturnサーバを使っています。
動作確認時は以下のturnサーバを使用しました。    
https://github.com/coturn/rfc5766-turn-server/releases    

turnサーバの情報は以下に記入してください
ファイル名: client/WebRtc.js
var turn_server_url = "turnサーバのurl";
var turn_server_user = "turnサーバのユーザ";
var turn_server_credential = "turnサーバユーザのパスワード";


## 起動
npm start    
それから以下のURLにアクセス    
https://localhost:8888/index.html
