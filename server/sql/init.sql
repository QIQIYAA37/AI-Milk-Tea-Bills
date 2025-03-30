-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS milk_tea_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE milk_tea_db;

-- 创建账单表
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 添加索引
CREATE INDEX idx_bills_date ON bills(date);
CREATE INDEX idx_bills_brand ON bills(brand);

-- 导入一些示例数据
INSERT INTO bills (date, brand, name, size, price, calories, sugar, fat, caffeine)
VALUES
  ('2023-12-01', '星巴克', '拿铁咖啡', '大杯', 32.00, 240, 22.00, 10.00, 150),
  ('2023-12-03', '奈雪的茶', '满杯红柚', '中杯', 26.00, 180, 30.00, 3.00, 0),
  ('2023-12-05', '茶百道', '珍珠奶茶', '小杯', 12.00, 220, 33.00, 9.00, 15),
  ('2023-12-07', '喜茶', '多肉葡萄', '中杯', 29.00, 210, 32.00, 2.00, 15),
  ('2023-12-10', '星巴克', '美式咖啡', '小杯', 22.00, 10, 0.00, 0.00, 150),
  ('2024-01-05', '星巴克', '美式咖啡', '大杯', 28.00, 20, 0.00, 0.00, 225),
  ('2024-01-07', '喜茶', '满杯红柚', '小杯', 22.00, 150, 25.00, 1.00, 0),
  ('2024-01-12', '茶百道', '幽兰拿铁', '小杯', 16.00, 180, 20.00, 6.00, 50),
  ('2024-01-14', '喜茶', '多肉葡萄', '中杯', 29.00, 210, 32.00, 2.00, 15),
  ('2024-02-01', '蜜雪冰城', '椰椰奶冻', '小杯', 9.00, 180, 22.00, 8.00, 10),
  ('2024-02-08', '奈雪的茶', '金凤茶王', '大杯', 32.00, 190, 25.00, 3.00, 85),
  ('2024-02-15', 'COCO', '红豆奶茶', '中杯', 17.00, 280, 36.00, 12.00, 18),
  ('2024-02-22', '一点点', '乌龙奶茶', '大杯', 19.00, 310, 39.00, 13.00, 25),
  ('2024-03-01', '喜茶', '芝芝莓莓', '小杯', 26.00, 160, 23.00, 5.00, 0),
  ('2024-03-10', '星巴克', '摩卡咖啡', '中杯', 33.00, 250, 26.00, 11.00, 145);

-- 使用说明
-- 可以通过以下命令运行此脚本：
-- mysql -u root -p < server/sql/init.sql 