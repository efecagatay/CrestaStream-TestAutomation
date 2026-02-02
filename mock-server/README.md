# 🚀 CrestaStream Mock Server

Test otomasyonu için hazır sahte API ve Frontend.

## Hızlı Başlangıç

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Server'ı başlat
npm start
```

## 🌐 Adresler

| Sayfa | URL |
|-------|-----|
| **Login** | http://localhost:3000 |
| **Dashboard** | http://localhost:3000/dashboard |
| **API** | http://localhost:3000/api |

## 👤 Test Kullanıcıları

| Email | Şifre | Rol |
|-------|-------|-----|
| `admin@crestastream.com` | `admin123` | Admin |
| `agent@crestastream.com` | `agent123` | Agent |
| `manager@crestastream.com` | `manager123` | Manager |

## 🔌 API Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/login` | Giriş yap |
| POST | `/api/auth/logout` | Çıkış yap |
| GET | `/api/conversations` | Konuşmaları listele |
| POST | `/api/conversations` | Yeni konuşma oluştur |
| GET | `/api/conversations/:id` | Tek konuşma getir |
| PUT | `/api/conversations/:id` | Konuşma güncelle |
| DELETE | `/api/conversations/:id` | Konuşma sil |
| GET | `/api/metrics` | Dashboard metrikleri |
| GET | `/api/agents` | Agent listesi |
| GET | `/health` | Health check |

## 🧪 Playwright ile Test Et

Mock server çalışırken, test projesinde:

```bash
cd CrestaStream-Automation
npm test
```

## 📸 Ekran Görüntüleri

### Login Sayfası
- Modern tasarım
- Form validation
- Social login butonları
- Test edilebilir `data-testid` attribute'ları

### Dashboard
- Metrik kartları
- Sentiment grafiği
- Filtrelenebilir tablo
- Pagination
- Export butonları
