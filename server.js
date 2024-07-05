var express = require('express');
var app = express();
var client_id = '7hI4IYFb2ETaTtFDe95B';
var client_secret = '61qNdLSf9f';
var state = "RANDOM_STATE";
var redirectURI = encodeURI("http://127.0.0.1:3000/callback");
var api_url = "";
app.get('/naverlogin', function (req, res) {
  api_url = 'https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=' + client_id + '&redirect_uri=' + redirectURI + '&state=' + state;
   res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
   res.end("<a href='"+ api_url + "'><img height='50' src='http://static.nid.naver.com/oauth/small_g_in.PNG'/></a>");
 });

const { setup } = require('./utils/setup_db');

app.get('/callback', async function (req, res) {
  const { mysqldb } = await setup();
  code = req.query.code;
  state = req.query.state;
  api_url = 'https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=' + client_id + '&client_secret=' + client_secret + '&redirect_uri=' + redirectURI + '&code=' + code + '&state=' + state;
  var request = require('request');
  var api_options = {
      url: api_url,
      headers: {'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret}
  };

  request.get(api_options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      //res.send('성공');
      const access_token = JSON.parse(body).access_token;

      // 네이버 API를 사용하여 사용자 프로필 정보 가져오기 예시
      const profile_url = 'https://openapi.naver.com/v1/nid/me';
      const options = {
        url: profile_url,
        headers: {
            'Authorization': `Bearer ${access_token}`
        }
      };
      request.get(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          const profile = JSON.parse(body).response;

          // 사용자 정보
          const users = {
            userid : profile.id,
            userpw : 'naver',
            salt : 'naver',
            email : profile.email,
            birthday : '00-'+ profile.birthday
          }

          mysqldb.query('SELECT * FROM users WHERE userid = ?', [profile.id], (err, results) => {
            if (err) throw err;
            if (results.length > 0) {
              // 로그인
              res.send('로그인되었습니다.');
            } else {
              // 회원가입
              mysqldb.query('INSERT INTO users SET ?', users, (err, results) => {
                if (err) throw err;
                console.log('Inserted user:', result.insertId);
                res.send('회원가입이 완료되었습니다.');
              });
            }
          });
          
        } else {
          res.status(response.statusCode).send('네이버 API 호출 에러');
        }
      });
    } else {
      res.status(response.statusCode).send('네이버 토큰 요청 에러');
    }
  });
});

 app.listen(3000, function () {
   console.log('http://127.0.0.1:3000/naverlogin app listening on port 3000!');
 });