let router = require('express').Router();

const { setup } = require('../utils/setup_db');

router.get('/callback', async function (req, res) {
    const { mysqldb } = await setup();
    const code = req.query.code;
    const state = req.query.state;

    const api_url = 'https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id='
        + client_id + '&client_secret=' + client_secret + '&redirect_uri=' + redirectURI + '&code=' + code + '&state=' + state;

    try {
        const response = await axios.get(api_url);
        const access_token = response.data.access_token;

        const profile_url = 'https://openapi.naver.com/v1/nid/me';
        const profile_response = await axios.get(profile_url, {
        headers: {
            'Authorization': `Bearer ${access_token}`
        }
        });

        const profile = profile_response.data.response;
        const email = profile.email;
        //const name = profile.name;

        // 이메일 등록 여부 확인
        mysqldb.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            // 로그인
            res.send('로그인되었습니다.');
        } else {
            // 회원가입
            mysqldb.query('INSERT INTO users (email) VALUES (?)', [email], (err, results) => {
                if (err) throw err;
                res.send('회원가입이 완료되었습니다.');
            });
        }
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;