# 🚀 Setup Guide - TradingView Alert System

## 📦 Hệ thống bao gồm:

1. **Frontend** (React + TypeScript) - Hiển thị charts và alerts
2. **Backend** (Node.js + Express) - Nhận webhooks từ TradingView
3. **Database** (SQLite) - Lưu trữ alerts

---

## 🏃 Quick Start

### 1. Install Dependencies

```bash
npm install
cd server && npm install && cd ..
```

### 2. Start Backend Server

```bash
npm run server
```

Server chạy trên: `http://localhost:3001`

### 3. Start Frontend (Terminal mới)

```bash
npm start
```

Frontend chạy trên: `http://localhost:3000`

### 4. (Optional) Chạy cả 2 cùng lúc

```bash
npm run dev
```

---

## 🌐 Expose Server với Ngrok (để TradingView gọi được)

TradingView cần một public URL để gửi webhooks.

### Install ngrok

```bash
# macOS
brew install ngrok

# hoặc download từ: https://ngrok.com/download
```

### Chạy ngrok

```bash
ngrok http 3001
```

Bạn sẽ nhận được URL kiểu: `https://abc123.ngrok.io`

---

## 📊 Tạo Alert trên TradingView

### Bước 1: Đăng nhập TradingView.com

Vào https://www.tradingview.com và đăng nhập (free account OK)

### Bước 2: Mở Chart

- Chọn symbol bất kỳ (VD: BTCUSDT)
- Thêm indicators nếu muốn (RSI, MACD, etc.)

### Bước 3: Tạo Alert

1. Click icon Alert (⏰) hoặc nhấn `Alt + A`
2. Setup điều kiện alert:
   - **Condition**: Chọn điều kiện (VD: Price crosses above, RSI > 70, etc.)
   - **Alert name**: Đặt tên

### Bước 4: Configure Webhook

**Message** - Nhập JSON payload:

```json
{
  "symbol": "{{ticker}}",
  "price": {{close}},
  "indicator": "RSI Alert",
  "signal": "OVERBOUGHT",
  "message": "{{ticker}} RSI above 70 at {{close}}",
  "exchange": "{{exchange}}",
  "interval": "{{interval}}",
  "time": "{{time}}"
}
```

**Notifications** - Check "Webhook URL":
```
https://your-ngrok-url.ngrok.io/webhook/tradingview
```

**Alert actions** - Chọn "Once Per Bar Close" hoặc "Only Once"

### Bước 5: Create Alert

Click "Create" và chờ điều kiện trigger!

---

## 🧪 Test Webhook (không cần TradingView)

```bash
curl -X POST http://localhost:3001/webhook/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "price": 45000,
    "indicator": "RSI",
    "signal": "BUY",
    "message": "Test alert from curl"
  }'
```

---

## 📱 Sử dụng Frontend

### Tab "Chart"
- Xem TradingView chart
- Customize symbol, interval, theme

### Tab "Alerts"
- Xem tất cả alerts đã nhận
- Filter theo symbol
- Xem stats
- Auto refresh 5 giây
- Delete alerts

---

## 🎨 Custom Pine Script Indicator

Nếu bạn muốn tạo custom indicator với alerts:

### Ví dụ: RSI Alert Bot

```pinescript
//@version=5
indicator("RSI Alert Bot", overlay=false)

// Parameters
rsiLength = input.int(14, "RSI Length")
overboughtLevel = input.int(70, "Overbought")
oversoldLevel = input.int(30, "Oversold")

// Calculate RSI
rsiValue = ta.rsi(close, rsiLength)

// Plot
plot(rsiValue, "RSI", color=color.blue, linewidth=2)
hline(overboughtLevel, "Overbought", color=color.red)
hline(oversoldLevel, "Oversold", color=color.green)
hline(50, "Middle", color=color.gray)

// Alerts
if ta.crossover(rsiValue, overboughtLevel)
    alert('{"symbol": "' + syminfo.ticker + '", "price": ' + str.tostring(close) + ', "indicator": "RSI", "signal": "SELL", "message": "RSI Overbought at ' + str.tostring(rsiValue, '#.##') + '"}', alert.freq_once_per_bar)

if ta.crossunder(rsiValue, oversoldLevel)
    alert('{"symbol": "' + syminfo.ticker + '", "price": ' + str.tostring(close) + ', "indicator": "RSI", "signal": "BUY", "message": "RSI Oversold at ' + str.tostring(rsiValue, '#.##') + '"}', alert.freq_once_per_bar)
```

**Cách dùng:**
1. Mở TradingView Pine Editor (dưới chart)
2. Copy code trên vào
3. Click "Add to Chart"
4. Tạo alert từ indicator này với webhook URL

---

## 🔐 Bảo mật (Recommended)

### Option 1: Secret Token trong URL

```javascript
// server/index.js - Thêm authentication
const SECRET_TOKEN = 'your-secret-key-here';

app.post('/webhook/tradingview', (req, res) => {
  const token = req.query.token;
  if (token !== SECRET_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // ... rest of code
});
```

TradingView webhook URL:
```
https://your-server.com/webhook/tradingview?token=your-secret-key-here
```

### Option 2: Environment Variables

```bash
# Tạo file server/.env
WEBHOOK_SECRET=your-secret-key
PORT=3001
```

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhook/tradingview` | Nhận webhook từ TradingView |
| GET | `/api/alerts` | Lấy danh sách alerts |
| GET | `/api/alerts?symbol=BTCUSDT` | Filter alerts theo symbol |
| GET | `/api/alerts/:id` | Lấy alert cụ thể |
| DELETE | `/api/alerts/:id` | Xóa alert |
| GET | `/api/alerts/stats/summary` | Thống kê |
| GET | `/health` | Health check |

---

## 🐛 Troubleshooting

### Backend không chạy?

```bash
# Check port có bị chiếm không
lsof -i :3001

# Kill process nếu cần
kill -9 <PID>
```

### Frontend không kết nối được backend?

- Check backend đang chạy: `curl http://localhost:3001/health`
- Check CORS đã enable
- Xem browser console có lỗi gì

### Webhook không nhận được?

1. Check ngrok đang chạy
2. Check TradingView webhook URL đúng
3. Check logs của backend server
4. Test bằng curl trước

### Database lỗi?

```bash
# Reset database
rm server/tradingview_alerts.db
# Restart server
```

---

## 🚀 Deploy to Production

### Backend Options:

1. **Heroku** (Free tier)
2. **Railway** (Easy deploy)
3. **DigitalOcean** (VPS)
4. **AWS Lambda** (Serverless)

### Frontend Options:

1. **Vercel** (Recommended for React)
2. **Netlify**
3. **GitHub Pages**

---

## 💡 Use Cases

- 📊 **Alert Dashboard** - Tập trung tất cả signals
- 🤖 **Trading Bot** - Auto trade dựa trên alerts
- 📈 **Backtesting** - Phân tích hiệu quả strategies
- 📧 **Notifications** - Forward tới Telegram, Discord, Email
- 📱 **Mobile App** - Push notifications

---

## ⚠️ Giới hạn TradingView

| Plan | Active Alerts |
|------|---------------|
| FREE | 1 alert |
| PRO | 20 alerts |
| PRO+ | 100 alerts |
| PREMIUM | 400 alerts |

---

## 📚 Tài liệu tham khảo

- [TradingView Webhooks](https://www.tradingview.com/support/solutions/43000529348-i-want-to-know-more-about-webhooks/)
- [Pine Script Docs](https://www.tradingview.com/pine-script-docs/)
- [Alert Function](https://www.tradingview.com/pine-script-reference/v5/#fun_alert)
- [Webhook Placeholders](https://www.tradingview.com/support/solutions/43000531021-how-to-use-webhooks/)

---

## 🎉 Xong rồi!

Bây giờ bạn có thể:
✅ Xem TradingView charts
✅ Tạo custom indicators với Pine Script
✅ Nhận alerts qua webhooks
✅ Lưu alerts vào database
✅ Xem và quản lý alerts trong dashboard

**Happy Trading! 🚀📈**
