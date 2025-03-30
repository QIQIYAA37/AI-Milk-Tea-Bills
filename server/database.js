const mysql = require('mysql2/promise');

// 创建没有指定数据库的连接池（用于创建数据库）
const rootPool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 数据库连接池配置（指定数据库后使用）
let pool;

// 检查数据库版本，决定索引创建方式
async function checkMySQLVersion() {
  try {
    const [rows] = await rootPool.query('SELECT VERSION() as version');
    const version = rows[0].version;
    console.log(`MySQL 数据库版本: ${version}`);
    return version;
  } catch (error) {
    console.error('获取MySQL版本失败:', error);
    return '5.7'; // 默认假设是5.7版本
  }
}

// 添加索引（适用于MySQL 5.7版本，不支持IF NOT EXISTS）
async function createIndexesMySQL57(dbPool) {
  try {
    // 查询已有索引
    const [indexes] = await dbPool.query(
      "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'milk_tea_db' AND TABLE_NAME = 'bills'"
    );
    
    const existingIndexes = indexes.map(idx => idx.INDEX_NAME);
    console.log('现有索引:', existingIndexes);
    
    // 创建日期索引（如果不存在）
    if (!existingIndexes.includes('idx_bills_date')) {
      console.log('正在创建日期索引...');
      await dbPool.query('CREATE INDEX idx_bills_date ON bills(date)');
      console.log('日期索引创建成功');
    } else {
      console.log('日期索引已存在，跳过创建');
    }
    
    // 创建品牌索引（如果不存在）
    if (!existingIndexes.includes('idx_bills_brand')) {
      console.log('正在创建品牌索引...');
      await dbPool.query('CREATE INDEX idx_bills_brand ON bills(brand)');
      console.log('品牌索引创建成功');
    } else {
      console.log('品牌索引已存在，跳过创建');
    }
    
    return true;
  } catch (error) {
    console.error('创建索引失败:', error);
    return false;
  }
}

// 添加索引（适用于MySQL 8.0+版本，支持IF NOT EXISTS）
async function createIndexesMySQL8(dbPool) {
  try {
    console.log('使用MySQL 8.0+语法创建索引...');
    await dbPool.query('CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(date)');
    await dbPool.query('CREATE INDEX IF NOT EXISTS idx_bills_brand ON bills(brand)');
    console.log('索引创建成功');
    return true;
  } catch (error) {
    console.error('创建索引失败 (MySQL 8.0+语法):', error);
    return false;
  }
}

// 初始化数据库
async function initDatabase() {
  try {
    console.log('尝试创建数据库（如果不存在）...');
    
    // 先使用root连接创建数据库（如果不存在）
    await rootPool.query(`CREATE DATABASE IF NOT EXISTS milk_tea_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('milk_tea_db 数据库已确认存在');
    
    // 检查MySQL版本
    const version = await checkMySQLVersion();
    
    // 创建指向特定数据库的连接池
    pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: 'root',
      port: 3306,
      database: 'milk_tea_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    // 测试连接
    const connection = await pool.getConnection();
    console.log('成功连接到 milk_tea_db 数据库');
    connection.release();
    
    // 创建账单表
    console.log('检查bills表是否存在...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        brand VARCHAR(100) NOT NULL,
        name VARCHAR(100) NOT NULL,
        size VARCHAR(50) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        calories INT,
        sugar DECIMAL(10, 2),
        fat DECIMAL(10, 2),
        caffeine INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('bills表结构已确认');
    
    // 添加索引（根据MySQL版本选择不同的方法）
    if (version.startsWith('8.')) {
      await createIndexesMySQL8(pool);
    } else {
      await createIndexesMySQL57(pool);
    }
    
    console.log('数据库初始化成功');
    return true;
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

// 获取所有账单
async function getAllBills() {
  try {
    const [rows] = await pool.query('SELECT * FROM bills ORDER BY date DESC');
    return rows;
  } catch (error) {
    console.error('获取账单失败:', error);
    throw error;
  }
}

// 添加账单
async function addBill(bill) {
  try {
    // 从bill对象中提取需要的字段，忽略不需要的字段（如cupSize）
    const { date, brand, name, size, price, calories, sugar, fat, caffeine } = bill;
    
    // 记录完整的账单数据用于调试
    console.log('接收到的完整账单数据:', JSON.stringify(bill));
    console.log('提取后的账单数据:', { date, brand, name, size, price, calories, sugar, fat, caffeine });
    
    const [result] = await pool.query(
      'INSERT INTO bills (date, brand, name, size, price, calories, sugar, fat, caffeine) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [date, brand, name, size, price, calories || null, sugar || null, fat || null, caffeine || null]
    );
    return result.insertId;
  } catch (error) {
    console.error('添加账单失败:', error);
    throw error;
  }
}

// 更新账单
async function updateBill(id, bill) {
  try {
    const { date, brand, name, size, price, calories, sugar, fat, caffeine } = bill;
    const [result] = await pool.query(
      'UPDATE bills SET date = ?, brand = ?, name = ?, size = ?, price = ?, calories = ?, sugar = ?, fat = ?, caffeine = ? WHERE id = ?',
      [date, brand, name, size, price, calories || null, sugar || null, fat || null, caffeine || null, id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('更新账单失败:', error);
    throw error;
  }
}

// 删除账单
async function deleteBill(id) {
  try {
    const [result] = await pool.query('DELETE FROM bills WHERE id = ?', [id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('删除账单失败:', error);
    throw error;
  }
}

// 根据条件筛选账单
async function filterBills(startDate, endDate, brand) {
  try {
    let query = 'SELECT * FROM bills WHERE 1=1';
    const params = [];
    
    if (startDate && endDate) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    if (brand) {
      query += ' AND brand = ?';
      params.push(brand);
    }
    
    query += ' ORDER BY date DESC';
    
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error) {
    console.error('筛选账单失败:', error);
    throw error;
  }
}

module.exports = {
  initDatabase,
  getAllBills,
  addBill,
  updateBill,
  deleteBill,
  filterBills
};