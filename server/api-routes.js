const express = require('express');
const router = express.Router();
const db = require('./database');

// 打印请求信息的中间件
router.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// 获取所有账单
router.get('/bills', async (req, res) => {
  try {
    console.log('正在获取所有账单...');
    const bills = await db.getAllBills();
    console.log(`成功获取 ${bills.length} 条账单记录`);
    res.json(bills);
  } catch (error) {
    console.error('获取账单失败', error);
    res.status(500).json({ error: '服务器错误', message: error.message });
  }
});

// 根据条件筛选账单
router.get('/bills/filter', async (req, res) => {
  try {
    const { startDate, endDate, brand } = req.query;
    console.log(`筛选账单: startDate=${startDate}, endDate=${endDate}, brand=${brand}`);
    const bills = await db.filterBills(startDate, endDate, brand);
    console.log(`筛选结果: ${bills.length} 条账单记录`);
    res.json(bills);
  } catch (error) {
    console.error('筛选账单失败', error);
    res.status(500).json({ error: '服务器错误', message: error.message });
  }
});

// 添加账单
router.post('/bills', async (req, res) => {
  try {
    const bill = req.body;
    console.log('添加账单:', bill);
    const id = await db.addBill(bill);
    console.log(`账单添加成功, ID: ${id}`);
    res.status(201).json({ id, ...bill });
  } catch (error) {
    console.error('添加账单失败', error);
    res.status(500).json({ error: '服务器错误', message: error.message });
  }
});

// 更新账单
router.put('/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bill = req.body;
    console.log(`更新账单 ID: ${id}`, bill);
    const success = await db.updateBill(id, bill);
    
    if (success) {
      console.log(`账单 ID: ${id} 更新成功`);
      res.json({ id, ...bill });
    } else {
      console.log(`账单 ID: ${id} 未找到`);
      res.status(404).json({ error: '账单未找到' });
    }
  } catch (error) {
    console.error('更新账单失败', error);
    res.status(500).json({ error: '服务器错误', message: error.message });
  }
});

// 删除账单
router.delete('/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`删除账单 ID: ${id}`);
    const success = await db.deleteBill(id);
    
    if (success) {
      console.log(`账单 ID: ${id} 删除成功`);
      res.json({ message: '账单已删除' });
    } else {
      console.log(`账单 ID: ${id} 未找到`);
      res.status(404).json({ error: '账单未找到' });
    }
  } catch (error) {
    console.error('删除账单失败', error);
    res.status(500).json({ error: '服务器错误', message: error.message });
  }
});

// 批量导入账单（测试数据）
router.post('/bills/batch', async (req, res) => {
  try {
    const bills = req.body;
    console.log(`批量导入 ${bills.length} 条账单`);
    const results = [];
    
    for (const bill of bills) {
      const id = await db.addBill(bill);
      results.push({ id, ...bill });
    }
    
    console.log(`批量导入完成，成功导入 ${results.length} 条账单`);
    res.status(201).json(results);
  } catch (error) {
    console.error('批量导入账单失败', error);
    res.status(500).json({ error: '服务器错误', message: error.message });
  }
});

// 健康检查端点
router.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 获取健康数据
router.get('/health-data', async (req, res) => {
  try {
    console.log('正在获取健康数据...');
    // 获取最近一周的账单数据
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const startDate = oneWeekAgo.toISOString().split('T')[0]; // 格式化为YYYY-MM-DD
    const endDate = new Date().toISOString().split('T')[0];
    
    // 添加更详细的日志
    console.log(`查询时间范围: ${startDate} 至 ${endDate}`);
    
    const bills = await db.filterBills(startDate, endDate);
    console.log(`成功获取 ${bills.length} 条最近一周的账单记录`);
    
    // 计算健康数据
    const healthData = {
      calories: 0,
      sugar: 0,
      caffeine: 0,
      cost: 0
    };
    
    if (bills && bills.length > 0) {
      bills.forEach(bill => {
        healthData.calories += Number(bill.calories || 0);
        healthData.sugar += Number(bill.sugar || 0);
        healthData.caffeine += Number(bill.caffeine || 0);
        healthData.cost += Number(bill.price || 0);
      });
    }
    
    // 四舍五入处理数值
    healthData.calories = Math.round(healthData.calories);
    healthData.sugar = Math.round(healthData.sugar * 10) / 10;
    healthData.caffeine = Math.round(healthData.caffeine);
    healthData.cost = Math.round(healthData.cost * 100) / 100;
    
    console.log('健康数据计算完成:', healthData);
    res.json(healthData);
  } catch (error) {
    console.error('获取健康数据失败', error);
    res.status(500).json({ error: '服务器错误', message: error.message });
  }
});

// 获取健康目标
router.get('/health-goals', async (req, res) => {
  try {
    // 这里可以从数据库获取用户设置的健康目标
    // 目前使用默认值
    const goals = {
      budget: 200,  // 每周预算（元）
      sugar: 175,   // 每周糖分摄入（克）
      caffeine: 300 // 每周咖啡因摄入（毫克）
    };
    
    res.json(goals);
  } catch (error) {
    console.error('获取健康目标失败', error);
    res.status(500).json({ error: '服务器错误', message: error.message });
  }
});

// 更新健康目标
router.put('/health-goals', async (req, res) => {
  try {
    const goals = req.body;
    console.log('更新健康目标:', goals);
    
    // 这里可以将健康目标保存到数据库
    // 目前仅返回成功响应
    
    res.json({ success: true, goals });
  } catch (error) {
    console.error('更新健康目标失败', error);
    res.status(500).json({ error: '服务器错误', message: error.message });
  }
});

module.exports = router;