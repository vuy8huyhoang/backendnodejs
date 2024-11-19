var express = require('express');
var db = require('../models/database');
var router = express.Router();


router.get('/allsp', function (req, res) {
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

router.get('/spmoi/:sosp', function (req, res) {
  if (isNaN(req.params.sosp) == true) {
    res.json({
      'thongbad': 'Sai tham số '
    });
    return;
  }

  let sosp = req.params.sosp; if (sosp <= 0) sosp = 10;
  let sql = `SELECT id, ten, gia, gia_km, hinh, ngay , xem
FROM san_pham WHERE an_hien = 1 ORDER BY ngay desc LIMIT 0, ${sosp}`;
  db.query(sql, function (err, data) {
    if (err) res.json({ 'thongbao': `Lỗi ${err}` });
    else res.json(data);
  });
})
router.get('/spxemnhieu/:sosp', function (req, res) {
  if (isNaN(req.params.sosp) == true) {
    res.json({
      'thongbad': 'Sai tham số '
    });
    return;
  }

  let sosp = req.params.sosp; if (sosp <= 0) sosp = 10;
  let sql = `SELECT id, ten, gia, gia_km, hinh, ngay , xem
FROM san_pham WHERE an_hien = 1 ORDER BY xem desc LIMIT 0, ${sosp}`;
  db.query(sql, function (err, data) {
    if (err) res.json({ 'thongbao': `Lỗi ${err}` });
    else res.json(data);
  });
})
router.get('/sphot/:sosp', function (req, res) {
  if (isNaN(req.params.sosp) == true) {
    res.json({
      'thongbad': 'Sai tham số '
    });
    return;
  }

  let sosp = req.params.sosp; if (sosp <= 0) sosp = 10;
  let sql = `SELECT id, ten, gia, gia_km, hinh, ngay , xem,hot
FROM san_pham WHERE an_hien = 1 and hot = 1 ORDER BY ngay desc LIMIT 0, ${sosp}`;
  db.query(sql, function (err, data) {
    if (err) res.json({ 'thongbao': `Lỗi ${err}` });
    else res.json(data);
  });
})
router.get('/sp/:id', function (req, res) {
  let id = req.params.id;
  let sql = `SELECT id,id_nhasx, ten, gia,gia_km, hinh, ngay, xem,hot,an_hien,tinh_chat,mau_sac,can_nang
FROM san_pham WHERE id= ${id};
SELECT ram,cpu,dia,man_hinh,thong_tin_pin,cong_nghe_man_hinh,cong_ket_noi
FROM thuoc_tinh WHERE id_sp= ${id};


`;
 db.query(sql, function (err, arr) {
    if (err) {
        res.json({ 'thongbao': `Lỗi: ${err}` });
    } else {
        let sp = arr[0] && arr[0][0] ? arr[0][0] : null;
        let tt = arr[1] && arr[1][0] ? arr[1][0] : null;

        if (!sp) {
            res.json({ thongbao: 'Không tìm thấy thông tin sản phẩm' });
            return;
        }

        if (!tt) {
            res.json({ thongbao: 'Không tìm thấy thông tin thuộc tính' });
            return;
        }

        var obj = Object.assign({}, sp, tt);
        res.json(obj);
    }
});

});
router.get('/splq/:id', function (req, res) {
  const productId = req.params.id;

  const sql = `
    SELECT id, ten, gia, gia_km, hinh, ngay, xem 
    FROM san_pham 
    WHERE an_hien = 1 
      AND id_nhasx = (SELECT id_nhasx FROM san_pham WHERE id = ${productId}) 
    ORDER BY ngay DESC
    LIMIT 4;
  `;

  db.query(sql, function (err, data) {
    if (err) {
      res.json({ 'thongbao': `Lỗi: ${err}` });
    } else {
      res.json(data);
    }
  });
});
router.get('/sp_nhasx/:id', (req, res) => {
  let id = req.params.id;
  let sql = `SELECT *
FROM san_pham WHERE an_hien = 1 and id_nhasx=${id} ORDER BY ngay desc`;
  db.query(sql, function (err, data) {
    if (err) res.json({ 'thongbao': `Lỗi ${err}` });
    else res.json(data);
  });
});
router.get('/list_nhasx/:id', (req, res) => {
  let id = req.params.id;
  let sql = `SELECT *
FROM nha_sx WHERE id=${id} `;
  db.query(sql, function (err, data) {
    if (err) res.json({ 'thongbao': `Lỗi ${err}` });
    else res.json(data);
  });
});
router.get('/list_nhasx', function (req, res) {
  let sql = `SELECT *
FROM nha_sx WHERE an_hien=1 order by thu_tu asc
`;
  db.query(sql, function (err, data) {
    if (err) res.json({ 'thongbao': `Lỗi ${err}` });
    else res.json(data);
  });
});
router.post('/list_nhasx', (req, res) => {
  let data = req.body;
  let sql = 'INSERT INTO nha_sx SET ?';
  db.query(sql, data, (err, d) => {
    if (err) res.json({ 'Loi': err });
    else res.json({ "thongbao": "Đã chèn xong nsx" });
  });
});
router.put('/list_nhasx/:id', (req, res) => {
  let id = req.params.id;
  if (isNaN(id) == true) {
    res.json({ 'thogbao': `Khong co nsx ${id} đe cap nhật ` });
    return;
  }

  let data = req.body;
  let sql = 'UPDATE nha_sx SET ? WHERE id = ?';
  db.query(sql, [data, id], (err, d) => {
    if (err) res.json({ 'Loi': err });
    else res.json({ "thongbao": 'Đã cập nhật nsx' });
  });
});
router.delete('/list_nhasx/:id', (req, res) => {
  let id = req.params.id;
  if (isNaN(id)) { // kiểm tra nếu id không phải là số
    res.json({ 'thongbao': `Không có nsx với id ${id} để xóa` });
    return;
  }

  let sql = 'DELETE FROM nha_sx WHERE id = ?';
  db.query(sql, [id], (err, d) => {
    if (err) {
      res.json({ 'Loi': err });
    } else if (d.affectedRows === 0) {
      res.json({ 'thongbao': `Không tìm thấy nsx với id ${id}` });
    } else {
      res.json({ "thongbao": 'Đã xóa nsx thành công' });
    }
  });
});
router.get('/sp', (req, res) => {
  let { keyword, category } = req.query;
  let sql = '';
  let params = [];

  if (keyword) {
    // Tìm sản phẩm theo keyword và tránh SQL injection
    sql = `SELECT * FROM san_pham WHERE ten LIKE ? `;
    params.push(`%${keyword}%`);
  } else if (category) {
    // Tìm sản phẩm theo category và tránh SQL injection
    sql = `SELECT * FROM san_pham WHERE id_nhasx = ? `;
    params.push(category);
  }

  if (sql) {
    db.query(sql, params, (err, result) => {
      if (err) {
        res.status(500).json({ thongbao: `Lỗi: ${err}` });
      } else {
        res.json(result);
      }
    });
  } else {
    res.status(400).json({ thongbao: 'Vui lòng cung cấp keyword hoặc category trong truy vấn.' });
  }
});


module.exports = router;
