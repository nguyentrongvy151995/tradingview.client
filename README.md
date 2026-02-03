# 📊 TradingView Dashboard với Webhook Alert System

Full-stack application để xem TradingView charts và nhận alerts từ TradingView qua webhooks.

![TradingView Dashboard](https://img.shields.io/badge/TradingView-Integration-blue)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-3178C6?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)

## ✨ Features

### Frontend
- 📈 **TradingView Widget** - Embed advanced charts với full customization
- 🔔 **Alerts Dashboard** - Xem và quản lý alerts từ TradingView
- 🎨 **Customizable** - Thay đổi symbol, interval, theme
- 📊 **Statistics** - Xem thống kê alerts theo symbol, signal
- 🔄 **Auto Refresh** - Tự động cập nhật alerts mỗi 5 giây
- 📱 **Responsive** - Mobile-friendly design

### Backend
- 🎣 **Webhook Endpoint** - Nhận alerts từ TradingView
- 💾 **SQLite Database** - Lưu trữ alerts lâu dài
- 📡 **RESTful API** - CRUD operations cho alerts
- 📊 **Analytics** - API thống kê và filter
- 🔒 **CORS Enabled** - Hỗ trợ cross-origin requests

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
cd server && npm install && cd ..
```

### 2. Start Backend Server

```bash
npm run server
```

Server: `http://localhost:3001`

### 3. Start Frontend

```bash
npm start
```

Frontend: `http://localhost:3000`

### 4. (Optional) Chạy cả 2 cùng lúc

```bash
npm run dev
```

## 📖 Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Hướng dẫn setup chi tiết, ngrok, TradingView alerts
- **[TRADINGVIEW_WEBHOOK_GUIDE.md](TRADINGVIEW_WEBHOOK_GUIDE.md)** - Chi tiết về webhook system
- **[TRADINGVIEW_EXAMPLES.md](TRADINGVIEW_EXAMPLES.md)** - Pine Script examples (RSI, MACD, MA Cross, etc.)

## 🎯 Usage

### Xem Charts

1. Mở frontend: `http://localhost:3000`
2. Click tab **"📈 Chart"**
3. Nhập symbol (VD: `BINANCE:BTCUSDT`, `NASDAQ:AAPL`)
4. Chọn interval và theme

### Nhận Alerts từ TradingView

1. **Expose server với ngrok:**
   ```bash
   ngrok http 3001
   ```
   
2. **Tạo alert trên TradingView:**
   - Vào https://www.tradingview.com
   - Tạo alert với webhook URL: `https://your-ngrok-url.ngrok.io/webhook/tradingview`
   - Message format:
     ```json
     {
       "symbol": "{{ticker}}",
       "price": {{close}},
       "indicator": "RSI",
       "signal": "BUY",
       "message": "{{ticker}} at {{close}}"
     }
     ```

3. **Xem alerts:**
   - Click tab **"🔔 Alerts"** trong frontend
   - Alerts sẽ hiển thị realtime

### Test Webhook (không cần TradingView)

```bash
curl -X POST http://localhost:3001/webhook/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "price": 45000,
    "indicator": "RSI",
    "signal": "BUY",
    "message": "Test alert"
  }'
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      TradingView.com                        │
│              (Pine Script + Alert Webhooks)                 │
└────────────────────────┬────────────────────────────────────┘
                         │ POST /webhook/tradingview
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend Server                           │
│              (Node.js + Express + SQLite)                   │
│  • Webhook endpoint                                         │
│  • RESTful API                                              │
│  • Database storage                                         │
└────────────────────────┬────────────────────────────────────┘
                         │ GET /api/alerts
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                  Frontend Dashboard                         │
│              (React + TypeScript)                           │
│  • TradingView Widget                                       │
│  • Alerts Panel                                             │
│  • Statistics                                               │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
binance-client/
├── src/
│   ├── App.tsx                      # Main app với tabs
│   ├── TradingViewWidget.tsx        # TradingView chart component
│   ├── components/
│   │   ├── AlertsPanel.tsx          # Alerts dashboard
│   │   └── AlertsPanel.css
│   └── ...
├── server/
│   ├── index.js                     # Backend server
│   ├── package.json
│   └── tradingview_alerts.db        # SQLite database (auto-created)
├── SETUP_GUIDE.md                   # Setup instructions
├── TRADINGVIEW_WEBHOOK_GUIDE.md     # Webhook details
├── TRADINGVIEW_EXAMPLES.md          # Pine Script examples
└── README.md                        # This file
```

## 🎨 Screenshots

### Chart View
- Customizable TradingView chart
- Symbol, interval, theme controls

### Alerts View
- Real-time alerts display
- Filter by symbol
- Statistics cards
- Auto refresh

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhook/tradingview` | Nhận webhook từ TradingView |
| GET | `/api/alerts` | Lấy danh sách alerts |
| GET | `/api/alerts?symbol=BTCUSDT` | Filter theo symbol |
| GET | `/api/alerts/:id` | Lấy alert cụ thể |
| DELETE | `/api/alerts/:id` | Xóa alert |
| GET | `/api/alerts/stats/summary` | Thống kê alerts |
| GET | `/health` | Health check |

## 🔐 Security

Để production, nên thêm authentication:

```javascript
// server/index.js
const SECRET = process.env.WEBHOOK_SECRET || 'your-secret';

app.post('/webhook/tradingview', (req, res) => {
  if (req.query.token !== SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // ... process webhook
});
```

TradingView URL: `https://your-server.com/webhook/tradingview?token=your-secret`

## 🚀 Deployment

### Backend
- **Heroku** - Free tier available
- **Railway** - Easy deploy
- **DigitalOcean** - VPS option
- **AWS Lambda** - Serverless

### Frontend
- **Vercel** - Recommended (best for React)
- **Netlify** - Easy deploy
- **GitHub Pages** - Static hosting

## 💡 Use Cases

- 📊 **Alert Dashboard** - Centralize all trading signals
- 🤖 **Trading Bot** - Auto-execute trades based on signals
- 📈 **Backtesting** - Analyze strategy performance
- 📧 **Notifications** - Forward to Telegram, Discord, Email
- 📱 **Mobile App** - Build mobile version with React Native

## 🎓 Learning Resources

- [TradingView Webhooks](https://www.tradingview.com/support/solutions/43000529348-i-want-to-know-more-about-webhooks/)
- [Pine Script Docs](https://www.tradingview.com/pine-script-docs/)
- [React Documentation](https://reactjs.org/)
- [Express.js Guide](https://expressjs.com/)

## ⚠️ TradingView Limits

| Plan | Active Alerts |
|------|---------------|
| FREE | 1 alert |
| PRO | 20 alerts |
| PRO+ | 100 alerts |
| PREMIUM | 400 alerts |

## 🤝 Contributing

Contributions welcome! Feel free to:
- Add new features
- Improve documentation
- Report bugs
- Submit PRs

## 📝 License

MIT License

## 🆘 Support

Có vấn đề? Check documentation:
1. [SETUP_GUIDE.md](SETUP_GUIDE.md) - Setup issues
2. [TRADINGVIEW_WEBHOOK_GUIDE.md](TRADINGVIEW_WEBHOOK_GUIDE.md) - Webhook problems
3. [TRADINGVIEW_EXAMPLES.md](TRADINGVIEW_EXAMPLES.md) - Pine Script help

---

**Built with ❤️ for traders**

🚀 Happy Trading! 📈