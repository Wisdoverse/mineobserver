<div dir="rtl" align="center">

# ⛏️ MineWorld

**منصة مراقبة وكلاء ماينكرافت في الوقت الفعلي**

راقب وتتبع وتصوّر سلوك وكلاء الذكاء الاصطناعي في ماينكرافت — كل ذلك في مكان واحد.

[![GitHub](https://img.shields.io/badge/GitHub-Wisdoverse%2Fmineworld-181717?logo=github)](https://github.com/Wisdoverse/mineworld)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [Français](README.fr.md) · [Русский](README.ru.md) · [Español](README.es.md) · **العربية** · [Deutsch](README.de.md)

</div>

---

<div dir="rtl">

## 🖼️ لقطات الشاشة

**صفحة الترحيب** — مشهد ماينكرافت بكسلي مع عدد الوكلاء المتصلين ونقطة الاتصال

![صفحة الترحيب](public/mineworld-preview-landing.png)

**لوحة المراقبة** — مصفوفة متعددة الوكلاء · المخزون / الخريطة / السجل · نظرة عامة على الخادم · الترتيب · الدردشة

![لوحة المراقبة](public/mineworld-preview-dashboard.png)

---

## ✨ الميزات

| الفئة | التفاصيل |
|-------|---------|
| **الحالة في الوقت الفعلي** | الموقع، الصحة، الجوع، وضع اللعبة، البُعد — كل ذلك في الوقت الفعلي |
| **تصور المخزون** | المعدات، شريط الوصول السريع، والحقيبة في لمحة واحدة |
| **الخريطة المصغرة** | توزيع الكتل والكيانات حول الوكيل |
| **معرض اللقطات** | لقطات الشاشة المرفوعة من الوكلاء، مخزنة في تخزين الكائنات |
| **تقدم البناء** | تتبع مخططات البناء ونسبة الإنجاز |
| **نافذة الدردشة** | قنوات: عام / فريق / همس / نظام |
| **سجل الأحداث** | كل إجراء للوكيل — حركة، تكسير كتلة، التقاط عنصر، إلخ. |
| **متعدد الوكلاء** | مراقبة عدة وكلاء في وقت واحد |
| **الإحصائيات والترتيب** | إحصائيات مجمعة مع أبعاد ترتيب قابلة للتبديل |

---

## 🛠️ الحزمة التقنية

| الطبقة | التقنية |
|--------|---------|
| إطار العمل | Next.js 16 (App Router) |
| الواجهة | React 19 + shadcn/ui (Radix) + Tailwind CSS 4 |
| اللغة | TypeScript 5 (strict) |
| الوقت الفعلي | WebSocket (مكتبة `ws`) |
| قاعدة البيانات | Supabase (PostgreSQL) |
| تخزين الكائنات | تخزين متوافق مع S3 |
| البناء | tsup · pnpm |

---

## 🚀 البدء السريع

### المتطلبات

- **Node.js** ≥ 20
- **pnpm** ≥ 9

### التثبيت والتشغيل

```bash
# تثبيت التبعيات
pnpm install

# بدء خادم التطوير (http://localhost:5000)
pnpm dev

# بناء الإصدار الإنتاجي
pnpm build

# بدء خادم الإنتاج
pnpm start
```

---

## 📁 هيكل المشروع

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx               # لوحة المراقبة الرئيسية
│   ├── layout.tsx             # التخطيط الجذري
│   └── api/                   # 13 نقطة نهاية REST API
├── components/
│   ├── ui/                    # مكونات shadcn/ui الأساسية
│   └── agent/                 # مكونات الأعمال
│       ├── agent-card.tsx             # بطاقة حالة الوكيل
│       ├── inventory-grid.tsx         # شبكة المخزون
│       ├── mini-map.tsx               # الخريطة المصغرة
│       ├── vision-gallery.tsx         # معرض اللقطات
│       ├── build-progress.tsx         # تقدم البناء
│       ├── chat-window.tsx            # نافذة الدردشة
│       ├── team-panel.tsx             # لوحة الفريق
│       └── stats-leaderboard.tsx      # الإحصائيات والترتيب
├── hooks/
│   ├── use-agent-observer.ts          # خطاف WebSocket للمراقب
│   └── use-demo-agent.tsx             # مولد الوكيل التجريبي
├── lib/
│   ├── types/agent.ts                 # تعريفات أنواع TypeScript
│   ├── ws-client.ts                   # أداة عميل WebSocket
│   └── utils.ts                       # أدوات مشتركة (cn، إلخ.)
├── storage/
│   ├── database/agent-db.ts           # عمليات قاعدة البيانات
│   ├── database/supabase-client.ts    # عميل Supabase
│   └── vision-storage.ts              # رفع وعناوين اللقطات
├── ws-handlers/
│   ├── agent.ts                       # معالج رسائل WebSocket
│   └── agent-state.ts                 # مدير حالة الوكلاء
└── server.ts                          # نقطة دخول خادم HTTP + WS
```

---

## 📡 بروتوكول WebSocket

**نقطة النهاية:** `ws://<host>:5000/ws/agent`

### الوكيل ← الخادم

| نوع الرسالة | الوصف |
|------------|-------|
| `agent:register` | تسجيل أو إعادة اتصال وكيل |
| `agent:status:update` | إرسال تحديث الحالة (جزئي مسموح) |
| `agent:event` | الإبلاغ عن حدث مخصص |
| `agent:world:snapshot` | إرسال لقطة العالم |
| `agent:vision` | رفع لقطة شاشة |
| `agent:build:progress` | تحديث تقدم البناء |
| `agent:chat` | إرسال رسالة دردشة |
| `agent:disconnect` | قطع اتصال سليم |
| `ping` | نبضة القلب |

### الخادم ← العميل

| نوع الرسالة | الوصف |
|------------|-------|
| `agents:list` | قائمة كاملة بالوكلاء (عند تسجيل المراقب) |
| `status:update` | بث تغيير الحالة |
| `event:new` | إشعار بحدث جديد |
| `world:snapshot` | بث لقطة العالم |
| `vision:new` | إشعار بلقطة جديدة |
| `build:progress` | تحديث تقدم البناء |
| `chat:new` | رسالة دردشة جديدة |
| `admin:data-cleared` | إشعار بمسح البيانات |
| `pong` | رد النبضة |

> 📖 المواصفة الكاملة للبروتوكول: [public/api-docs.md](public/api-docs.md)

---

## 🔌 واجهة برمجة التطبيقات REST

| نقطة النهاية | الطريقة | الوصف |
|-------------|--------|-------|
| `/api/agents` | GET | قائمة جميع الوكلاء |
| `/api/agents/[id]` | GET | تفاصيل الوكيل + الأحداث الأخيرة |
| `/api/agents/[id]/events` | GET | أحداث الوكيل (مقسمة لصفحات) |
| `/api/agents/[id]/snapshots` | GET | لقطات العالم |
| `/api/agents/[id]/vision` | GET | قائمة اللقطات |
| `/api/agents/[id]/trajectory` | GET | مسار الحركة |
| `/api/agents/[id]/builds` | GET | سجلات البناء |
| `/api/events` | GET | تدفق الأحداث العام |
| `/api/messages` | GET | رسائل الدردشة |
| `/api/stats` | GET | إحصائيات المنصة |
| `/api/leaderboard` | GET | ترتيب الوكلاء |
| `/api/admin/clear-data` | POST | مسح البيانات (أحداث / الكل) |
| `/api/vision-proxy` | GET | وكيل الصور (يتجاوز انتهاء صلاحية الروابط الموقعة) |

---

## 🤖 دليل دمج الوكيل

وصّل بوت ماينكرافت الخاص بك بـ MineWorld في 4 خطوات:

```
1.  الاتصال       →  ws://<host>:5000/ws/agent
2.  التسجيل       →  { type: "agent:register", payload: { agentId, username, ... } }
3.  الحالة        →  { type: "agent:status:update", payload: { agentId, status: {...} } }
4.  (اختياري)     →  agent:vision · agent:build:progress · agent:chat · agent:world:snapshot
```

**نصائح:**
- استخدم **`agentId` مستقر** للسماح بإعادة الاتصال دون فقدان البيانات
- أرسل تحديثات الحالة كل **2–5 ثوانٍ**
- ارفع اللقطات بتنسيق **PNG مشفّر بـ base64**
- عند قطع الاتصال، أرسل `agent:disconnect` أو أغلق الـ socket فقط — سيتم الحفاظ على الحالة غير المتصلة

> 📖 المرجع الكامل للحقول والأمثلة: [public/api-docs.md](public/api-docs.md)

---

## 🗄️ احتفاظ البيانات

| نوع البيانات | حد الاحتفاظ (لكل وكيل) |
|-------------|----------------------|
| الأحداث | 200 |
| لقطات العالم | 30 |
| لقطات الشاشة | 50 |
| رسائل الدردشة | 100 |
| تحديثات الحالة | 1,000 |
| سجلات البناء | 20 |

يتم حذف السجلات القديمة تلقائيًا عبر استراتيجية النافذة المنزلقة مع تنظيف محدود.

---

## 🏗️ البنية

```
┌──────────────┐      WebSocket       ┌──────────────────┐
│  ماينكرافت   │ ◄──────────────────► │   MineWorld      │
│  الوكيل(اء)  │   ws://host/ws/agent │   الخادم         │
└──────────────┘                      │                  │
                                      │  ┌────────────┐  │
┌──────────────┐      WebSocket       │  │  مدير       │  │
│  المراقب     │ ◄──────────────────► │  │  الحالة     │  │
│  (المتصفح)   │   اتصال تلقائي       │  └────────────┘  │
└──────────────┘                      │                  │
                                      │  ┌────────────┐  │
                                      │  │  Supabase  │  │
                                      │  │  (Postgres)│  │
                                      │  └────────────┘  │
                                      │                  │
                                      │  ┌────────────┐  │
                                      │  │  تخزين     │  │
                                      │  │  الكائنات  │  │
                                      │  │  S3        │  │
                                      │  └────────────┘  │
                                      └──────────────────┘
```

---

## 📜 الترخيص

هذا المشروع مرخص بموجب [MIT](LICENSE).

