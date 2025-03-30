<template>
  <div class="bill-table-container">
    <div class="bill-actions">
      <button class="add-bill-btn" @click="showAddBillForm">添加账单</button>
    </div>
    
    <table class="bill-table">
      <thead>
        <tr>
          <th>日期</th>
          <th>品牌</th>
          <th>商品名</th>
          <th>规格</th>
          <th>价格</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(bill, index) in bills" :key="getRowKey(bill, index)">
          <td>{{ bill.date }}</td>
          <td>{{ bill.brand }}</td>
          <td>{{ bill.name }}</td>
          <td>{{ bill.size }}</td>
          <td>¥{{ typeof bill.price === 'number' ? bill.price.toFixed(2) : Number(bill.price).toFixed(2) }}</td>
          <td class="actions">
            <button class="edit-btn" @click="editBill(bill, index)">编辑</button>
            <button class="delete-btn" @click="confirmDeleteBill(bill, index)">删除</button>
          </td>
        </tr>
        <tr v-if="bills.length === 0">
          <td colspan="6" class="empty-message">暂无账单数据，点击"添加账单"开始记录 (数组长度: {{ bills.length }})</td>
        </tr>
      </tbody>
    </table>

    <!-- 添加/编辑账单表单 -->
    <div class="bill-form-overlay" v-if="showForm">
      <div class="bill-form">
        <h3>{{ isEditing ? '编辑账单' : '添加账单' }}</h3>
        <form @submit.prevent="saveBill">
          <div class="form-group">
            <label for="date">日期</label>
            <input type="date" id="date" v-model="currentBill.date" required>
          </div>
          
          <div class="form-group">
            <label for="brand">品牌</label>
            <input type="text" id="brand" v-model="currentBill.brand" required placeholder="例如：星巴克、奈雪的茶">
          </div>
          
          <div class="form-group">
            <label for="name">商品名</label>
            <input type="text" id="name" v-model="currentBill.name" required placeholder="例如：拿铁咖啡、满杯红柚">
          </div>
          
          <div class="form-group">
            <label for="size">规格</label>
            <input type="text" id="size" v-model="currentBill.size" required placeholder="例如：中杯、大杯、超大杯">
          </div>
          
          <div class="form-group">
            <label for="price">价格</label>
            <input type="number" id="price" v-model.number="currentBill.price" step="0.01" min="0" required placeholder="例如：28.5">
          </div>
          
          <div class="form-group">
            <label for="calories">热量(可选，单位kcal)</label>
            <input type="number" id="calories" v-model.number="currentBill.calories" step="1" min="0" placeholder="例如：320">
          </div>
          
          <div class="form-group">
            <label for="sugar">糖分(可选，单位g)</label>
            <input type="number" id="sugar" v-model.number="currentBill.sugar" step="0.1" min="0" placeholder="例如：25.5">
          </div>
          
          <div class="form-group">
            <label for="fat">脂肪(可选，单位g)</label>
            <input type="number" id="fat" v-model.number="currentBill.fat" step="0.1" min="0" placeholder="例如：12.3">
          </div>
          
          <div class="form-group">
            <label for="caffeine">咖啡因(可选，单位mg)</label>
            <input type="number" id="caffeine" v-model.number="currentBill.caffeine" step="1" min="0" placeholder="例如：150">
          </div>
          
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="cancelForm">取消</button>
            <button type="submit" class="save-btn">保存</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- 删除确认对话框 -->
    <div class="confirm-dialog-overlay" v-if="showDeleteConfirm">
      <div class="confirm-dialog">
        <h3>确认删除</h3>
        <p>确定要删除此账单记录吗？此操作不可撤销。</p>
        <div class="dialog-actions">
          <button class="cancel-btn" @click="showDeleteConfirm = false">取消</button>
          <button class="delete-btn" @click="deleteBill">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive } from 'vue';

interface Bill {
  date: string;
  brand: string;
  name: string;
  size: string;
  price: number;
  calories?: number;
  sugar?: number;
  fat?: number;
  caffeine?: number;
}

const props = defineProps<{
  bills: Bill[];
}>();

const emit = defineEmits<{
  (e: 'add', bill: Bill): void;
  (e: 'update', bill: Bill, index: number): void;
  (e: 'delete', index: number): void;
}>();

// 表单状态
const showForm = ref(false);
const isEditing = ref(false);
const editingIndex = ref(-1);
const currentBill = reactive<Bill>({
  date: new Date().toISOString().split('T')[0],
  brand: '',
  name: '',
  size: '',
  price: 0
});

// 删除确认
const showDeleteConfirm = ref(false);
const billToDelete = ref<{bill: Bill, index: number} | null>(null);

// 用于生成行的唯一键
function getRowKey(bill: Bill, index: number): string {
  return `${bill.date}-${bill.brand}-${bill.name}-${bill.price}-${index}`;
}

// 显示添加账单表单
function showAddBillForm(): void {
  // 重置表单
  Object.assign(currentBill, {
    date: new Date().toISOString().split('T')[0],
    brand: '',
    name: '',
    size: '',
    price: 0,
    calories: undefined,
    sugar: undefined,
    fat: undefined,
    caffeine: undefined
  });
  
  isEditing.value = false;
  editingIndex.value = -1;
  showForm.value = true;
}

// 编辑账单
function editBill(bill: Bill, index: number): void {
  // 复制账单数据到表单
  Object.assign(currentBill, JSON.parse(JSON.stringify(bill)));
  
  isEditing.value = true;
  editingIndex.value = index;
  showForm.value = true;
}

// 保存账单
function saveBill(): void {
  // 创建新的账单对象
  const billToSave: Bill = {
    date: currentBill.date,
    brand: currentBill.brand,
    name: currentBill.name,
    size: currentBill.size,
    price: Number(currentBill.price), // 确保价格是数字
  };
  
  // 添加可选字段（如果有值）
  if (currentBill.calories) billToSave.calories = Number(currentBill.calories);
  if (currentBill.sugar) billToSave.sugar = Number(currentBill.sugar);
  if (currentBill.fat) billToSave.fat = Number(currentBill.fat);
  if (currentBill.caffeine) billToSave.caffeine = Number(currentBill.caffeine);
  
  if (isEditing.value && editingIndex.value !== -1) {
    // 更新现有账单
    emit('update', billToSave, editingIndex.value);
  } else {
    // 添加新账单
    emit('add', billToSave);
  }
  
  // 关闭表单
  showForm.value = false;
}

// 取消表单
function cancelForm(): void {
  showForm.value = false;
}

// 确认删除账单
function confirmDeleteBill(bill: Bill, index: number): void {
  billToDelete.value = { bill, index };
  showDeleteConfirm.value = true;
}

// 删除账单
function deleteBill(): void {
  if (billToDelete.value) {
    emit('delete', billToDelete.value.index);
    showDeleteConfirm.value = false;
    billToDelete.value = null;
  }
}
</script>

<style scoped>
.bill-table-container {
  margin: 20px 0;
}

.bill-actions {
  margin-bottom: 15px;
  text-align: right;
}

.add-bill-btn {
  background-color: #a67c52;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s;
}

.add-bill-btn:hover {
  background-color: #8c6744;
}

.bill-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
}

.bill-table th,
.bill-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.bill-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #555;
}

.bill-table tr:last-child td {
  border-bottom: none;
}

.bill-table tr:hover {
  background-color: #f5f5f5;
}

.actions {
  display: flex;
  gap: 10px;
}

.edit-btn, .delete-btn {
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.3s;
}

.edit-btn {
  background-color: #3498db;
  color: white;
}

.edit-btn:hover {
  background-color: #2980b9;
}

.delete-btn {
  background-color: #e74c3c;
  color: white;
}

.delete-btn:hover {
  background-color: #c0392b;
}

.empty-message {
  text-align: center;
  color: #888;
  padding: 30px 0;
}

/* 表单样式 */
.bill-form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.bill-form {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.bill-form h3 {
  margin-top: 0;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn, .save-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.cancel-btn {
  background-color: #e0e0e0;
  color: #333;
}

.cancel-btn:hover {
  background-color: #d0d0d0;
}

.save-btn {
  background-color: #a67c52;
  color: white;
}

.save-btn:hover {
  background-color: #8c6744;
}

/* 确认删除对话框 */
.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.confirm-dialog {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.confirm-dialog h3 {
  margin-top: 0;
  color: #333;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>