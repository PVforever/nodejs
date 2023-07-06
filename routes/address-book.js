const express = require('express');
const dayjs = require('dayjs');
const db = require(__dirname + "/../modules/connect-db");
const upload = require(__dirname + "/../modules/upload-img");

const router = express.Router();

//每頁呈現的資料數量//
router.get('/', async (req, res)=>{
    let page = req.query.page || 1;
    page = parseInt(page);
    if(page < 1){
        return res.redirect('?page=1');
    }
    let rows = [];

    const perPage = 20; //每頁最多幾筆
    const sql = "SELECT COUNT(1) totalRows FROM `address_book`";
    const [[{totalRows}]] = await db.query(sql);

    const totalPages = Math.ceil(totalRows/perPage);
    if(totalRows) {
        if(page > totalPages) {
            return res.redirect(`page=${totalPages}`);
        }
        const sql2 = `SELECT * FROM address_book ORDER BY sid ASC LIMIT ${(page-1)*perPage}, ${perPage}`;
        [rows] = await db.query(sql2);
        rows.forEach(i=>{
            i.birthday = dayjs(i.birthday).format('YYYY-MM-DD');
        })

    }
    //
    // res.json({page, totalRows, totalPages, perPage, rows});
    res.render('address-book/list', {page, totalRows, totalPages, perPage, rows});
});

//呈現新增資料的表單
router.get('/add', async (req, res)=>{
    res.render('address-book/add');
})

//處理新增資料的表單
//upload.none()解析前台傳過來的資料封裝
// router.post('/add', upload.none(), async (req, res)=>{
router.post('/add', async (req, res)=>{
    let output = {  
        success: false, //有沒有新增成功
        postData: req.body, 
        code: 0,
        errors: {

        }
    };

    let isPass = true; //所有的資料有沒有通過檢查

    //TODO: 各個欄位檢查

    // 方法1.
    // const sql = "INSERT INTO `address_book` SET ?";

    // const data = {...req.body};
    // data.created_at = new Date();

    // const [result] = await db.query(sql, [
    //     data
    // ]);
    const email_re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zAZ]{2,}))$/;

    const mobile_re = /^09\d{8}$/;

    const data = {...req.body};

    //姓名驗證
    if( !data.name || data.name.length < 2 ){
        isPass = false;
        output.errors.name = '請輸入正確姓名';
    }

    //email驗證
    if( !data.email || email_re.test(data.email) ){
        isPass = false;
        output.errors.email = '請輸入正確 E-mail';
    }

    //手機驗證
    if( !data.mobile || mobile_re.test(data.mobile) ){
        isPass = false;
        output.errors.mobile = '請輸入正確 手機號碼';
    }

    //生日填寫驗證
    data.birthday = data.birthday || '';
    data.birthday = dayjs(data.birthday);

    //判斷是不是合法的日期
    if(data.birthday.isValid()){
        data.birthday = data.birthday.format('YYYY-MM-DD');
    }else {
        isPass = false;
        output.errors.birthday = '請輸入正確日期格式';
    }

    // 方法2.
    if(isPass){
        const sql = "INSERT INTO `address_book`(`name`, `email`, `mobile`, `birthday`, `address`, `created_at`) VALUES (?,?,?,?,?, NOW())";

        const [result] = await db.query(sql, [
            data.name,
            data.email,
            data.mobile,
            data.birthday,
            data.address,
        ]);
        output.success = !! result.affectedRows;

    }

    res.json(output);
    //拿到一個物件
    /*
    {
    "fieldCount": 0,
    "affectedRows": 1,  // 影響的列數
    "insertId": 1038,   // 最新一筆的 PK
    "info": "",
    "serverStatus": 2,
    "warningStatus": 0
    }
    */
})

//修改功能
router.get('/edit/:sid', async(req, res)=>{
    let sid = parseInt(req.params.sid);
    let rows;
    if(sid){
        const sql = `SELECT * FROM address_book WHERE sid=`+sid;
        [rows] = await db.query(sql);
        if(rows.length){
            return res.json(rows[0])
        }
    }
    res.json({info: 'no data'})
});

//刪除功能
//方法.1
router.delete('/delete/:sid', async(req, res)=>{
    let output = {
        success: false,
    };

    let sid = parseInt(req.params.sid);
    let result
    if(sid){
        const sql = `DELETE FROM address_book WHERE sid=`+sid;
        [result] = await db.query(sql);
        output.result = result;
        output.success = !! result.affectedRows;
    // const referer = req.get('Referer');
    // if(referer){
    //     res.redirect(referer);
    // }else{
    //     res.redirect('/ab');
    // }
    }
    res.json(output);
});

//方法.2
// router.get('/delete/:sid', async(req, res)=>{
//     let sid = parseInt(req.params.sid);
//     if(sid){
//         const sql = `DELETE FROM address_book WHERE sid=`+sid;

//         await db.query(sql);
//     }
//     const referer = req.get('Referer');
//     if(referer){
//         res.redirect(referer);
//     }else{
//         res.redirect('/ab');
//     }
// });
module.exports = router;