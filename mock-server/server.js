const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;"
  );
  next();
});

// ============================================
// IN-MEMORY DATABASE
// ============================================
let conversations = [
  {
    id: 'conv-001',
    title: 'Müşteri Şikayeti - Kargo Gecikmesi',
    customerName: 'Ahmet Yılmaz',
    agentName: 'Ayşe Demir',
    agentId: 'agent-001',
    sentiment: 'negative',
    status: 'resolved',
    aiScore: 42,
    duration: 325,
    createdAt: '2024-01-15T09:30:00Z',
    messages: [
      { role: 'customer', text: 'Siparişim 5 gündür gelmedi!' },
      { role: 'agent', text: 'Özür dilerim, hemen kontrol ediyorum.' }
    ]
  },
  {
    id: 'conv-002',
    title: 'Ürün Bilgisi Talebi',
    customerName: 'Fatma Kaya',
    agentName: 'Mehmet Öz',
    agentId: 'agent-002',
    sentiment: 'positive',
    status: 'completed',
    aiScore: 89,
    duration: 180,
    createdAt: '2024-01-15T10:15:00Z',
    messages: [
      { role: 'customer', text: 'Bu ürünün garantisi var mı?' },
      { role: 'agent', text: '2 yıl garantisi bulunmaktadır.' }
    ]
  },
  {
    id: 'conv-003',
    title: 'İade Talebi',
    customerName: 'Ali Veli',
    agentName: 'Ayşe Demir',
    agentId: 'agent-001',
    sentiment: 'neutral',
    status: 'pending',
    aiScore: 65,
    duration: 420,
    createdAt: '2024-01-15T11:00:00Z',
    messages: [
      { role: 'customer', text: 'Ürünü iade etmek istiyorum.' },
      { role: 'agent', text: 'İade talebinizi oluşturuyorum.' }
    ]
  },
  {
    id: 'conv-004',
    title: 'Teknik Destek',
    customerName: 'Zeynep Aksoy',
    agentName: 'Can Yıldız',
    agentId: 'agent-003',
    sentiment: 'positive',
    status: 'completed',
    aiScore: 95,
    duration: 240,
    createdAt: '2024-01-15T14:30:00Z',
    messages: [
      { role: 'customer', text: 'Cihazım açılmıyor.' },
      { role: 'agent', text: 'Reset tuşuna 10 saniye basılı tutun.' }
    ]
  },
  {
    id: 'conv-005',
    title: 'Fatura Sorunu',
    customerName: 'Murat Çelik',
    agentName: 'Mehmet Öz',
    agentId: 'agent-002',
    sentiment: 'negative',
    status: 'escalated',
    aiScore: 28,
    duration: 600,
    createdAt: '2024-01-15T16:00:00Z',
    messages: [
      { role: 'customer', text: 'Faturamda yanlış tutar var!' },
      { role: 'agent', text: 'Durumu üst birime aktarıyorum.' }
    ]
  }
];

const agents = [
  { id: 'agent-001', name: 'Ayşe Demir', team: 'Müşteri Hizmetleri', status: 'online' },
  { id: 'agent-002', name: 'Mehmet Öz', team: 'Satış', status: 'online' },
  { id: 'agent-003', name: 'Can Yıldız', team: 'Teknik Destek', status: 'offline' }
];

const users = [
  { email: 'admin@crestastream.com', password: 'admin123', role: 'admin', name: 'Admin User' },
  { email: 'agent@crestastream.com', password: 'agent123', role: 'agent', name: 'Test Agent' },
  { email: 'manager@crestastream.com', password: 'manager123', role: 'manager', name: 'Manager User' }
];

let tokenStore = {};

// ============================================
// HELPER FUNCTIONS
// ============================================
function generateToken() {
  return 'token-' + Math.random().toString(36).substring(2, 15);
}

function generateId() {
  return 'conv-' + Math.random().toString(36).substring(2, 9);
}

function calculateMetrics() {
  const total = conversations.length;
  const positive = conversations.filter(c => c.sentiment === 'positive').length;
  const negative = conversations.filter(c => c.sentiment === 'negative').length;
  const neutral = conversations.filter(c => c.sentiment === 'neutral').length;
  const avgScore = Math.round(conversations.reduce((sum, c) => sum + c.aiScore, 0) / total);
  const resolved = conversations.filter(c => c.status === 'resolved' || c.status === 'completed').length;
  
  return {
    totalConversations: total,
    positiveCount: positive,
    negativeCount: negative,
    neutralCount: neutral,
    averageAiScore: avgScore,
    resolutionRate: Math.round((resolved / total) * 100),
    averageHandleTime: Math.round(conversations.reduce((sum, c) => sum + c.duration, 0) / total)
  };
}

// ============================================
// AUTH ENDPOINTS
// ============================================
// login endpoint güncellemesi
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    const token = generateToken();
    const refreshToken = `ref-${generateToken()}`; // Testin beklediği refresh token'ı oluşturduk
    
    // Her iki token'ı da store'a kaydediyoruz ki daha sonra doğrulayabilelim
    tokenStore[token] = user;
    tokenStore[refreshToken] = user;
    
    console.log(`✅ Login successful: ${email}`);
    
    // TESTİN BEKLEDİĞİ YAPI: success, token, refreshToken ve user objesi
    res.json({
      success: true,
      token,
      refreshToken, 
      user: { 
        email: user.email, 
        name: user.name, 
        role: user.role 
      }
    });
  } else {
    console.log(`❌ Login failed: ${email}`);
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

// refresh endpoint güncellemesi
app.post('/api/auth/refresh', (req, res) => {
  // Test genellikle refreshToken'ı body üzerinden gönderir
  const { refreshToken: incomingRefreshToken } = req.body;
  
  // Eğer body'de yoksa header'dan fallback yapalım (senin eski kodun için)
  const tokenToVerify = incomingRefreshToken || req.headers.authorization?.replace('Bearer ', '');
  
  const user = tokenStore[tokenToVerify];
  
  if (user) {
    const newToken = generateToken();
    const newRefreshToken = `ref-${generateToken()}`;
    
    // Eski token'ı temizleyip yenilerini kaydediyoruz
    delete tokenStore[tokenToVerify];
    tokenStore[newToken] = user;
    tokenStore[newRefreshToken] = user;

    res.json({ 
      success: true, 
      token: newToken,
      refreshToken: newRefreshToken, // Yeni refresh token dönüyoruz
      user: { 
        email: user.email, 
        name: user.name, 
        role: user.role 
      }
    });
  } else {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

// logout endpoint güncellemesi
app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    // Hem access token'ı hem de kullanıcıya bağlı diğer verileri temizlemiş olursun
    delete tokenStore[token];
  }
  res.json({ success: true });
});

// ============================================
// CONVERSATIONS ENDPOINTS
// ============================================
app.get('/api/conversations', (req, res) => {
  let result = [...conversations];
  
  // Filtering
  if (req.query.sentiment) {
    result = result.filter(c => c.sentiment === req.query.sentiment);
  }
  if (req.query.status) {
    result = result.filter(c => c.status === req.query.status);
  }
  if (req.query.agentId) {
    result = result.filter(c => c.agentId === req.query.agentId);
  }
  if (req.query.search) {
    const search = req.query.search.toLowerCase();
    result = result.filter(c => 
      c.title.toLowerCase().includes(search) ||
      c.customerName.toLowerCase().includes(search)
    );
  }
  if (req.query.minScore) {
    result = result.filter(c => c.aiScore >= parseInt(req.query.minScore));
  }
  if (req.query.maxScore) {
    result = result.filter(c => c.aiScore <= parseInt(req.query.maxScore));
  }
  
  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const paginatedResult = result.slice(startIndex, endIndex);
  
  console.log(`📋 GET /api/conversations - Found ${result.length} items`);
  
  res.json({
    data: paginatedResult,
    pagination: {
      total: result.length,
      page,
      limit,
      totalPages: Math.ceil(result.length / limit)
    }
  });
});

app.get('/api/conversations/:id', (req, res) => {
  const conversation = conversations.find(c => c.id === req.params.id);
  
  if (conversation) {
    console.log(`📋 GET /api/conversations/${req.params.id}`);
    res.json(conversation);
  } else {
    res.status(404).json({ error: 'Conversation not found' });
  }
});

app.post('/api/conversations', (req, res) => {
  const newConversation = {
    id: generateId(),
    title: req.body.title || 'New Conversation',
    customerName: req.body.customerName || 'Unknown Customer',
    agentName: req.body.agentName || 'Unassigned',
    agentId: req.body.agentId || null,
    sentiment: req.body.sentiment || 'neutral',
    status: req.body.status || 'pending',
    aiScore: req.body.aiScore || 50,
    duration: req.body.duration || 0,
    createdAt: new Date().toISOString(),
    messages: req.body.messages || []
  };
  
  conversations.unshift(newConversation);
  console.log(`✅ POST /api/conversations - Created ${newConversation.id}`);
  
  res.status(201).json(newConversation);
});

app.put('/api/conversations/:id', (req, res) => {
  const index = conversations.findIndex(c => c.id === req.params.id);
  
  if (index !== -1) {
    conversations[index] = { ...conversations[index], ...req.body };
    console.log(`✅ PUT /api/conversations/${req.params.id}`);
    res.json(conversations[index]);
  } else {
    res.status(404).json({ error: 'Conversation not found' });
  }
});

app.delete('/api/conversations/:id', (req, res) => {
  const index = conversations.findIndex(c => c.id === req.params.id);
  
  if (index !== -1) {
    conversations.splice(index, 1);
    console.log(`🗑️ DELETE /api/conversations/${req.params.id}`);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Conversation not found' });
  }
});

app.post('/api/conversations/:id/messages', (req, res) => {
  const conversation = conversations.find(c => c.id === req.params.id);
  
  if (conversation) {
    const newMessage = {
      role: req.body.role || 'customer',
      text: req.body.text,
      timestamp: new Date().toISOString()
    };
    conversation.messages.push(newMessage);
    console.log(`💬 Added message to ${req.params.id}`);
    res.json(conversation);
  } else {
    res.status(404).json({ error: 'Conversation not found' });
  }
});

// ============================================
// METRICS ENDPOINT
// ============================================
app.get('/api/metrics', (req, res) => {
  const metrics = calculateMetrics();
  console.log(`📊 GET /api/metrics`);
  
  res.json({
    ...metrics,
    trends: {
      conversationsChange: 12,
      scoreChange: 5,
      resolutionChange: -3
    },
    lastUpdated: new Date().toISOString()
  });
});

// ============================================
// AGENTS ENDPOINT
// ============================================
app.get('/api/agents', (req, res) => {
  console.log(`👥 GET /api/agents`);
  res.json(agents);
});

// ============================================
// AI INSIGHTS ENDPOINT
// ============================================
app.get('/api/ai/suggestions', (req, res) => {
  console.log(`🤖 GET /api/ai/suggestions`);
  res.json({
    suggestions: [
      { type: 'improvement', text: 'Negatif görüşmelerde empati cümleleri kullanın', priority: 'high' },
      { type: 'training', text: 'İade prosedürleri eğitimi önerilir', priority: 'medium' },
      { type: 'alert', text: '3 görüşme yükseltme bekliyor', priority: 'high' }
    ]
  });
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      ai: 'operational',
      cache: 'connected'
    }
  });
});

// ============================================
// STATIC PAGES
// ============================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║   🚀 CrestaStream Mock Server Started!                     ║');
  console.log('║                                                            ║');
  console.log(`║   🌐 Frontend: http://localhost:${PORT}                       ║`);
  console.log(`║   🔌 API:      http://localhost:${PORT}/api                   ║`);
  console.log('║                                                            ║');
  console.log('║   📧 Test Users:                                           ║');
  console.log('║      admin@crestastream.com / admin123                     ║');
  console.log('║      agent@crestastream.com / agent123                     ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
});
