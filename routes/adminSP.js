var express = require('express');
var db = require('../models/database');
var router = express.Router();

router.get('/', (req, res) => {

    let limit = ``;
    if (req.query._limit != undefined && isNaN(req.query._limit) == false) {
        let sosp = Number(req.query._limit);
        if (sosp <= 0) sosp = 10;
        limit = ` LIMIT 0, ${sosp}`;
    }

    let sort = ``;
    if (req.query._sort != undefined) { //có bien _sort
        let str = req.query._sort; //xem
        sort = `ORDER BY ${str} asc`;
    }
    let sql = `SELECT id, ten, gia, gia_km, hinh, ngay , xem,an_hien,tinh_chat,mau_sac,can_nang
FROM san_pham ${sort}${limit}`;
    db.query(sql, (err, data) => {
        if (err) res.json({ 'thongbao': `Lỗi ${err}` });
        else res.json(data);
    });
})
router.get('/:id', (req, res) => {
    let id = req.params.id;
    if (isNaN(id) == true) {
        res.json({ 'thongbao': `San pham ${id} khong ton tại` })
        return;
    }
    let sql = `SELECT id, ten,date_format(ngay,'%Y-%m-%d') ngay,gia,gia_km,hinh,xem,hot,an_hien,hot,mau_sac,can_nang,tinh_chat
FROM san_pham where id=?`;
    db.query(sql, id, (err, arr) => {
        if (err) res.json({ 'Loi': err });
        else if (arr.length == 0) res.json({ 'thongbao': `San pham ${id} khong ton tai` });
        else res.json(arr[0]);
    });
})
router.get('/sp', function (req, res) {
    const sql = `
    SELECT id, ten, gia, gia_km, hinh, ngay, xem 
    FROM san_pham 
    WHERE an_hien = 1 
    ORDER BY ngay DESC
  `;

    db.query(sql, function (err, data) {
        if (err) {
            res.json({ 'thongbao': `Lỗi: ${err}` });
        } else {
            res.json(data);
        }
    });
});


router.post('/', (req, res) => {
    let data = req.body;
    let sql = 'INSERT INTO san_pham SET ?';
    db.query(sql, data, (err, d) => {
        if (err) res.json({ 'Loi': err });
        else res.json({ "thongbao": "Đã chèn xong sản phẩm" });
    });
});

router.put('/:id', (req, res) => {
    let id = req.params.id;
    if (isNaN(id) == true) { //id là chữ
        res.json({ 'thogbao': `Khong co san pham ${id} đe cap nhật ` });
        return;
    }

    let data = req.body;
    let sql = 'UPDATE san_pham SET ? WHERE id = ?';
    db.query(sql, [data, id], (err, d) => {
        if (err) res.json({ 'Loi': err });
        else res.json({ "thongbao": 'Đã cập nhật san phẩm' });
    });
});
router.delete('/:id', function (req, res) {
    let id = req.params.id;
    let sql = 'DELETE FROM san_pham WHERE id = ?'
    db.query(sql, id, (err, d) => {
        if (err) res.json({ 'Loi': err });
        else res.json({ "thongbao": 'Đã xóa thành công' });
    })
});

module.exports = router;

